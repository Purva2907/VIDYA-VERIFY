from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from app.models import VerificationRequest, VerificationResponse
from app.services.apaar_adapter import SandboxAPAARAdapter
from app.services.integrity_engine import IntegrityEngine

router = APIRouter(prefix="/api/verify", tags=["Verification"])
adapter = SandboxAPAARAdapter()


@router.get("/apaar", response_model=VerificationResponse)
def verify_apaar(apaar_id: str = Query(..., description="12-digit APAAR identifier")):
    result = adapter.verify(apaar_id)

    if not result.get("is_format_valid"):
        raise HTTPException(status_code=400, detail="Invalid APAAR ID structure or Luhn checksum failure.")

    record = result.get("record", {})
    has_collision = record.get("has_collision", False)
    intake_curr = record.get("intake_current", 120)
    intake_cap = record.get("intake_cap", 120)
    has_warning = intake_curr > intake_cap

    status_str = "DUPLICATE_COLLISION" if has_collision else ("INTAKE_EXCEEDED" if has_warning else "VALID")

    merkle_root = IntegrityEngine.calculate_merkle_root([apaar_id, record.get("institute_code", ""), status_str])
    ecdsa_sig = IntegrityEngine.generate_ecdsa_signature(apaar_id, record.get("institute_code", ""), status_str)

    details = (
        "CRITICAL DUPLICATE DETECTED: Simultaneous full-time enrolment identified across 2 technical institutions."
        if has_collision
        else (
            f"INTAKE QUOTA EXCEEDED: Admitted {intake_curr} against sanctioned {intake_cap} seats."
            if has_warning
            else "All cryptographic integrity checks verified. Zero duplicate records found."
        )
    )

    return VerificationResponse(
        apaar_id=apaar_id,
        student_name=record.get("name", "Demo Student"),
        institute=record.get("institute_name", "AICTE Accredited Campus"),
        institute_code=record.get("institute_code", "IND-AICTE-1042"),
        programme=record.get("programme", "B.Tech Computer Science"),
        admission_year=record.get("admission_year", "2024-2028"),
        status=status_str,
        is_valid=not has_collision and not has_warning,
        has_duplicate_collision=has_collision,
        has_intake_warning=has_warning,
        merkle_root=merkle_root,
        ecdsa_signature=ecdsa_sig,
        timestamp=datetime.now(timezone.utc).isoformat(),
        adapter_mode="SANDBOX_SYNTHETIC",
        details=details,
    )
