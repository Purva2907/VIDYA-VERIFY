from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Header, status
from app.models import AuditEventSchema, RoleEnum
from app.db import AUDIT_LOG_DB, get_current_user_from_token

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])


@router.get("/logs", response_model=List[AuditEventSchema])
def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action name"),
    actor_email: Optional[str] = Query(None, description="Filter by actor email"),
    target_type: Optional[str] = Query(None, description="Filter by target type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Page size"),
    authorization: Optional[str] = Header(None),
):
    """
    Returns security and data-integrity audit logs with role-based scoping.
    Platform Administrators see all audit events; Institution users see only events for their institution.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view audit trail.",
        )

    user = get_current_user_from_token(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalid or expired.",
        )

    results = list(AUDIT_LOG_DB)

    # Scoping: NODE users only see audit events for their institution or where they were the actor
    if user.get("role") == RoleEnum.NODE:
        user_inst = (user.get("institute_id") or "").strip().upper()
        user_email = user.get("email").strip().lower()
        results = [
            e for e in results
            if (e.actor_institution and e.actor_institution.upper() == user_inst)
            or (e.actor_email and e.actor_email.lower() == user_email)
            or user_inst in e.details.upper()
        ]

    if isinstance(action, str) and action.strip():
        act_lower = action.strip().lower()
        results = [e for e in results if act_lower in e.action.lower()]

    if isinstance(actor_email, str) and actor_email.strip():
        email_lower = actor_email.strip().lower()
        results = [e for e in results if email_lower in e.actor_email.lower()]

    if isinstance(target_type, str) and target_type.strip():
        t_lower = target_type.strip().lower()
        results = [e for e in results if t_lower in e.target_type.lower()]

    p = page if isinstance(page, int) else 1
    ps = page_size if isinstance(page_size, int) else 50
    start = max(0, (p - 1) * ps)
    end = start + ps
    return results[start:end]
