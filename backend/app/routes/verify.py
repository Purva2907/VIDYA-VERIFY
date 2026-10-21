from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Header
from app.models import (
    VerificationRequest,
    VerificationResponse,
    IntegrityStatusEnum,
    VerificationHistoryResponse,
)
from app.services.apaar_adapter import SandboxAPAARAdapter
from app.services.integrity_engine import IntegrityEngine
from app.db import (
    STUDENT_LEDGER,
    log_audit_event,
    get_current_user_from_token,
    record_verification_attempt,
    get_verification_history,
)

router = APIRouter(prefix="/api/verify", tags=["Verification"])
adapter = SandboxAPAARAdapter()


@router.get("/apaar", response_model=VerificationResponse)
def verify_apaar(
    apaar_id: str = Query(..., description="12-digit APAAR identifier or record ID"),
    session_id: Optional[str] = Query(None, description="Optional client session identifier for tracking anonymous history"),
    authorization: Optional[str] = Header(None),
):
    # Handle direct function call where default FastAPI Query/Header parameter objects may be passed
    clean_session = str(session_id) if (session_id is not None and not hasattr(session_id, "default")) else None
    clean_auth = str(authorization) if (authorization is not None and not hasattr(authorization, "default")) else None

    user = get_current_user_from_token(clean_auth) if clean_auth else None
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

        history_status = (
            "COLLISION" if has_collision
            else ("QUOTA ALERT" if has_warning
                  else ("CLEAN" if is_clean else "PENDING"))
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

        # Record in persistent verification history
        record_verification_attempt(
            apaar_id=persisted_student.apaar_id,
            status=history_status,
            source_type="DATABASE_PERSISTED_LEDGER",
            is_sandbox=False,
            institution_code=persisted_student.institute_code,
            institution_name=persisted_student.institute_name,
            programme=persisted_student.programme,
            actor_email=user.get("email") if user else None,
            actor_role=str(user.get("role")) if user else "public",
            actor_institution=user.get("institute_id") if user else None,
            session_id=clean_session,
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
        record_verification_attempt(
            apaar_id=clean_id,
            status="NOT FOUND",
            source_type="INVALID_FORMAT",
            is_sandbox=True,
            actor_email=user.get("email") if user else None,
            actor_role=str(user.get("role")) if user else "public",
            actor_institution=user.get("institute_id") if user else None,
            session_id=clean_session,
        )
        raise HTTPException(
            status_code=400,
            detail="Invalid APAAR ID format. Must contain at least 12 alphanumeric characters (e.g. '9024-8172-5501-IN').",
        )

    record = result.get("record", {})
    is_not_found = record.get("status") == "not_found"
    has_collision = record.get("has_collision", False)
    intake_curr = record.get("intake_current", 120)
    intake_cap = record.get("intake_cap", 120)
    has_warning = intake_curr > intake_cap

    if is_not_found:
        status_str = "NOT_FOUND"
        history_status = "NOT FOUND"
    elif has_collision:
        status_str = "DUPLICATE_COLLISION"
        history_status = "COLLISION"
    elif has_warning:
        status_str = "INTAKE_EXCEEDED"
        history_status = "QUOTA ALERT"
    else:
        status_str = "VALID"
        history_status = "CLEAN"

    merkle_root = IntegrityEngine.calculate_merkle_root([clean_id, record.get("institute_code", ""), status_str])
    ecdsa_sig = IntegrityEngine.generate_ecdsa_signature(clean_id, record.get("institute_code", ""), status_str)

    if is_not_found:
        details = "No authoritative or synthetic registry record found matching this APAAR identifier."
    elif has_collision:
        details = "SANDBOX SIMULATION: Concurrent dual-enrolment collision identified across multiple universities."
    elif has_warning:
        details = f"SANDBOX SIMULATION: Admitted {intake_curr} against sanctioned {intake_cap} seats."
    else:
        details = "SANDBOX SIMULATION: Synthetic test candidate verified. Zero collision flags found."

    log_audit_event(
        actor_email=user.get("email") if user else "public_verifier",
        actor_role=str(user.get("role")) if user else "public",
        action="VERIFICATION_SANDBOX_SIMULATION",
        target_type="APAAR_QUERY",
        target_id=clean_id,
        details=f"Queried sandbox simulator for APAAR {IntegrityEngine.mask_apaar(clean_id)}. Status: {status_str}.",
        outcome="FLAGGED" if (has_collision or has_warning or is_not_found) else "SUCCESS",
    )

    # Record in persistent verification history
    record_verification_attempt(
        apaar_id=clean_id,
        status=history_status,
        source_type="NOT_FOUND" if is_not_found else "SANDBOX_SYNTHETIC",
        is_sandbox=True,
        institution_code=record.get("institute_code"),
        institution_name=record.get("institute_name"),
        programme=record.get("programme"),
        actor_email=user.get("email") if user else None,
        actor_role=str(user.get("role")) if user else "public",
        actor_institution=user.get("institute_id") if user else None,
        session_id=clean_session,
    )

    return VerificationResponse(
        apaar_id=clean_id,
        student_name=record.get("name", "Synthetic Student Candidate"),
        institute=record.get("institute_name", "AICTE Accredited Campus"),
        institute_code=record.get("institute_code", "IND-AICTE-1042"),
        programme=record.get("programme", "B.Tech Standard Programme"),
        admission_year=record.get("admission_year", "2024-2028"),
        status=status_str,
        is_valid=not is_not_found and not has_collision and not has_warning,
        has_duplicate_collision=has_collision,
        has_intake_warning=has_warning,
        merkle_root=merkle_root,
        ecdsa_signature=ecdsa_sig,
        timestamp=datetime.now(timezone.utc).isoformat(),
        adapter_mode="SANDBOX_SYNTHETIC",
        source_type="NOT_FOUND" if is_not_found else "SANDBOX_SYNTHETIC",
        is_sandbox=True,
        is_external_official=False,
        details=details,
    )


@router.get("/history", response_model=VerificationHistoryResponse)
def get_recent_verifications(
    limit: int = Query(10, ge=1, le=100, description="Maximum entries to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    session_id: Optional[str] = Query(None, description="Optional public session ID"),
    authorization: Optional[str] = Header(None),
):
    """
    Returns persistent verification history ordered newest first.
    Applies strict institution/role privacy scoping and masks identifiers.
    """
    clean_session = str(session_id) if (session_id is not None and not hasattr(session_id, "default")) else None
    clean_auth = str(authorization) if (authorization is not None and not hasattr(authorization, "default")) else None
    clean_limit = int(limit) if (limit is not None and not hasattr(limit, "default")) else 10
    clean_offset = int(offset) if (offset is not None and not hasattr(offset, "default")) else 0

    user = get_current_user_from_token(clean_auth) if clean_auth else None
    return get_verification_history(
        actor_user=user,
        session_id=clean_session,
        limit=clean_limit,
        offset=clean_offset,
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
