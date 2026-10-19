from typing import Dict, Any, Optional
from fastapi import APIRouter, Header, Query
from app.models import IntegrityStatusEnum, RoleEnum
from app.db import STUDENT_LEDGER, get_current_user_from_token

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/metrics")
def get_metrics(
    scope: Optional[str] = Query("all", description="Scope metrics: 'all' or 'my_institution'"),
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Calculates live metrics from the active student ledger."""
    records = list(STUDENT_LEDGER)
    clean_scope = scope if isinstance(scope, str) else "all"

    # Filter by user role if institutional verifier and scope is explicitly my_institution
    if authorization and isinstance(authorization, str) and clean_scope == "my_institution":
        user = get_current_user_from_token(authorization)
        if user and user.get("role") == RoleEnum.NODE and user.get("institute_id"):
            inst_code = user["institute_id"]
            records = [
                r for r in records
                if inst_code in r.institute_code or inst_code in (r.notes or "") or "COLLISION" in r.institute_code
            ]

    total = len(records)
    verified = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.VERIFIED)
    pending = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.PENDING)
    duplicate = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.DUPLICATE)
    warning = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.WARNING)
    attention = duplicate + warning

    # Distinct institutions represented
    unique_institutes = {r.institute_code for r in records if r.institute_code}

    return {
        "total_students": total,
        "verified_count": verified,
        "pending_count": pending,
        "attention_count": attention,
        "duplicate_count": duplicate,
        "warning_count": warning,
        "institutes_count": len(unique_institutes),
        "is_empty": total == 0,
        "has_critical_conflicts": duplicate > 0,
    }
