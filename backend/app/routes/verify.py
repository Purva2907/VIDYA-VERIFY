from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Header
from app.models import VerificationRequest, VerificationResponse, IntegrityStatusEnum
from app.services.apaar_adapter import SandboxAPAARAdapter
from app.services.integrity_engine import IntegrityEngine
from app.db import STUDENT_LEDGER, log_audit_event, get_current_user_from_token

router = APIRouter(prefix="/api/verify", tags=["Verification"])
adapter = SandboxAPAARAdapter()


@router.get("/apaar", response_model=VerificationResponse)
def verify_apaar(
    apaar_id: str = Query(..., description="12-digit APAAR identifier or record ID"),
    authorization: Optional[str] = Header(None),
):
    user = get_current_user_from_token(authorization) if authorization else None
    clean_id = apaar_id.strip()
    norm_id = IntegrityEngine.normalize_apaar(clean_id)

    # 1. First, check if the record exists in the authoritative persistent database ledger
    persisted_student = None
    for s in STUDENT_LEDGER:
        if (
            s.apaar_id.strip() == clean_id
            or IntegrityEngine.normalize_apaar(s.apaar_id) == norm_id
            or s.id.strip().lower() == clean_id.lower()
        ):
            persisted_student = s
            break

    if persisted_student:
        has_collision = persisted_student.integrity_status == IntegrityStatusEnum.DUPLICATE
        has_warning = persisted_student.integrity_status == IntegrityStatusEnum.WARNING
        is_clean = persisted_student.integrity_status == IntegrityStatusEnum.VERIFIED

        status_str = (
            "DUPLICATE_COLLISION" if has_collision
            else ("INTAKE_EXCEEDED" if has_warning
                  else ("VALID" if is_clean else "PENDING_VERIFICATION"))
        )

        merkle_root = (
            persisted_student.merkle_root
            or IntegrityEngine.calculate_merkle_root([persisted_student.apaar_id, persisted_student.institute_code, status_str])
        )
        ecdsa_sig = (
            persisted_student.ecdsa_signature
            or IntegrityEngine.generate_ecdsa_signature(persisted_student.apaar_id, persisted_student.institute_code, status_str)
        )

        log_audit_event(
            actor_email=user.get("email") if user else "public_verifier",
            actor_role=str(user.get("role")) if user else "public",
            action="VERIFICATION_LEDGER_QUERY",
            target_type="STUDENT",
            target_id=persisted_student.id,
            details=f"Verified persisted student {persisted_student.student_name} (APAAR: {IntegrityEngine.mask_apaar(persisted_student.apaar_id)}) at {persisted_student.institute_name}. Outcome: {status_str}.",
            actor_institution=user.get("institute_id") if user else None,
            outcome="FLAGGED" if (has_collision or has_warning) else "SUCCESS",
        )

        return VerificationResponse(
            apaar_id=persisted_student.apaar_id,
            student_name=persisted_student.student_name,
            institute=persisted_student.institute_name,
            institute_code=persisted_student.institute_code,
            programme=persisted_student.programme,
            admission_year=persisted_student.admission_year,
            status=status_str,
            is_valid=is_clean,
            has_duplicate_collision=has_collision,
            has_intake_warning=has_warning,
            merkle_root=merkle_root,
            ecdsa_signature=ecdsa_sig,
            timestamp=datetime.now(timezone.utc).isoformat(),
            adapter_mode="INSTITUTIONAL_DATABASE",
            source_type="DATABASE_PERSISTED_LEDGER",
            is_sandbox=False,
            is_external_official=False,
            details=persisted_student.notes or f"Authoritative record loaded from {persisted_student.institute_name} ledger.",
            dob=persisted_student.dob,
            category=persisted_student.category,
            gender=persisted_student.gender,
            enrollment_number=persisted_student.enrollment_number,
        )

    # 2. If not found in active database, run format validation and sandbox synthetic adapter
    result = adapter.verify(clean_id)

    if not result.get("is_format_valid"):
        raise HTTPException(
            status_code=400,
            detail="Invalid APAAR ID format. Must contain at least 12 alphanumeric characters (e.g. '9024-8172-5501-IN').",
        )

    record = result.get("record", {})
    has_collision = record.get("has_collision", False)
    intake_curr = record.get("intake_current", 120)
    intake_cap = record.get("intake_cap", 120)
    has_warning = intake_curr > intake_cap

    status_str = "DUPLICATE_COLLISION" if has_collision else ("INTAKE_EXCEEDED" if has_warning else "VALID")

    merkle_root = IntegrityEngine.calculate_merkle_root([clean_id, record.get("institute_code", ""), status_str])
    ecdsa_sig = IntegrityEngine.generate_ecdsa_signature(clean_id, record.get("institute_code", ""), status_str)

    details = (
        "SANDBOX SIMULATION: Concurrent dual-enrolment collision identified across multiple universities."
        if has_collision
        else (
            f"SANDBOX SIMULATION: Admitted {intake_curr} against sanctioned {intake_cap} seats."
            if has_warning
            else "SANDBOX SIMULATION: Synthetic test candidate verified. Zero collision flags found."
        )
    )

    log_audit_event(
        actor_email=user.get("email") if user else "public_verifier",
        actor_role=str(user.get("role")) if user else "public",
        action="VERIFICATION_SANDBOX_SIMULATION",
        target_type="APAAR_QUERY",
        target_id=clean_id,
        details=f"Queried sandbox simulator for APAAR {IntegrityEngine.mask_apaar(clean_id)}. Status: {status_str}.",
        outcome="FLAGGED" if (has_collision or has_warning) else "SUCCESS",
    )

    return VerificationResponse(
        apaar_id=clean_id,
        student_name=record.get("name", "Synthetic Student Candidate"),
        institute=record.get("institute_name", "AICTE Accredited Campus"),
        institute_code=record.get("institute_code", "IND-AICTE-1042"),
        programme=record.get("programme", "B.Tech Standard Programme"),
        admission_year=record.get("admission_year", "2024-2028"),
        status=status_str,
        is_valid=not has_collision and not has_warning,
        has_duplicate_collision=has_collision,
        has_intake_warning=has_warning,
        merkle_root=merkle_root,
        ecdsa_signature=ecdsa_sig,
        timestamp=datetime.now(timezone.utc).isoformat(),
        adapter_mode="SANDBOX_SYNTHETIC",
        source_type="SANDBOX_SYNTHETIC",
        is_sandbox=True,
        is_external_official=False,
        details=details,
    )


@router.get("/authority-key")
def get_authority_public_key():
    """Returns the ECDSA public key in standard PEM format for external independent verification."""
    return {
        "algorithm": "ECDSA_SECP256R1_SHA256",
        "format": "X.509 SubjectPublicKeyInfo PEM",
        "public_key_pem": IntegrityEngine.get_public_key_pem(),
        "curve": "secp256r1 (NIST P-256)",
    }


@router.post("/tamper-check")
def check_record_tamper_evidence(
    payload: VerificationRequest,
    authorization: Optional[str] = Header(None),
):
    """Verifies that a student record's Merkle root and ECDSA signature are mathematically authentic."""
    clean_id = payload.apaar_id.strip()
    norm_id = IntegrityEngine.normalize_apaar(clean_id)

    persisted_student = None
    for s in STUDENT_LEDGER:
        if (
            s.apaar_id.strip() == clean_id
            or IntegrityEngine.normalize_apaar(s.apaar_id) == norm_id
            or s.id.strip().lower() == clean_id.lower()
        ):
            persisted_student = s
            break

    if not persisted_student:
        raise HTTPException(
            status_code=404,
            detail=f"Student record with APAAR/ID '{clean_id}' not found in active database.",
        )

    return IntegrityEngine.verify_record_tamper_evidence(persisted_student)
