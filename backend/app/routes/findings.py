from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Header, status
from app.models import (
    IntegrityFindingSchema,
    FindingReviewRequest,
    ReviewStatusEnum,
    FindingTypeEnum,
    FindingSeverityEnum,
    RoleEnum,
    StudentRecordSchema,
)
from app.db import (
    INTEGRITY_FINDINGS_DB,
    STUDENT_LEDGER,
    log_audit_event,
    get_current_user_from_token,
)
from app.services.integrity_engine import IntegrityEngine

router = APIRouter(prefix="/api/findings", tags=["Integrity Findings & Review"])


@router.get("", response_model=List[IntegrityFindingSchema])
def list_findings(
    review_status: Optional[ReviewStatusEnum] = Query(None, description="Filter by review status"),
    finding_type: Optional[FindingTypeEnum] = Query(None, description="Filter by finding type"),
    severity: Optional[FindingSeverityEnum] = Query(None, description="Filter by severity"),
    institute_code: Optional[str] = Query(None, description="Filter by institution code"),
    search: Optional[str] = Query(None, description="Search by APAAR, candidate name, or reason"),
    authorization: Optional[str] = Header(None),
):
    """
    Lists data-integrity and collision findings with role-based scoping and filtering.
    """
    user = get_current_user_from_token(authorization) if authorization else None
    results = list(INTEGRITY_FINDINGS_DB.values())

    # Role-based scoping: NODE users can only view findings where their institution is involved
    if user and user.get("role") == RoleEnum.NODE:
        user_inst = (user.get("institute_id") or "").strip().upper()
        results = [
            f for f in results
            if f.primary_institute_code.upper() == user_inst
            or (f.secondary_institute_code and f.secondary_institute_code.upper() == user_inst)
            or user_inst in f.reason.upper()
        ]
    elif isinstance(institute_code, str) and institute_code.strip():
        inst = institute_code.strip().upper()
        results = [
            f for f in results
            if f.primary_institute_code.upper() == inst
            or (f.secondary_institute_code and f.secondary_institute_code.upper() == inst)
        ]

    if isinstance(review_status, ReviewStatusEnum):
        results = [f for f in results if f.review_status == review_status]

    if isinstance(finding_type, FindingTypeEnum):
        results = [f for f in results if f.finding_type == finding_type]

    if isinstance(severity, FindingSeverityEnum):
        results = [f for f in results if f.severity == severity]

    if isinstance(search, str) and search.strip():
        q = search.strip().lower()
        results = [
            f for f in results
            if q in f.student_name.lower()
            or q in f.apaar_id.lower()
            or q in f.apaar_id_masked.lower()
            or q in f.reason.lower()
            or q in f.primary_institute_name.lower()
        ]

    # Sort newest first
    results.sort(key=lambda x: x.detection_timestamp, reverse=True)
    return results


@router.get("/{finding_id}")
def get_finding_detail(finding_id: str, authorization: Optional[str] = Header(None)):
    """
    Returns full finding details along with associated candidate student records.
    """
    user = get_current_user_from_token(authorization) if authorization else None
    clean_id = finding_id.strip()

    finding = INTEGRITY_FINDINGS_DB.get(clean_id)
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integrity finding '{clean_id}' not found.",
        )

    # Scoping check
    if user and user.get("role") == RoleEnum.NODE:
        user_inst = (user.get("institute_id") or "").strip().upper()
        is_involved = (
            finding.primary_institute_code.upper() == user_inst
            or (finding.secondary_institute_code and finding.secondary_institute_code.upper() == user_inst)
            or user_inst in finding.reason.upper()
        )
        if not is_involved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This finding does not pertain to your institution.",
            )

    # Load affected records from ledger
    norm_apaar = IntegrityEngine.normalize_apaar(finding.apaar_id)
    affected_records = [
        s for s in STUDENT_LEDGER
        if (
            s.id in finding.affected_record_ids
            or s.apaar_id.strip() == finding.apaar_id.strip()
            or IntegrityEngine.normalize_apaar(s.apaar_id) == norm_apaar
        )
    ]

    return {
        "finding": finding,
        "affected_records": affected_records,
    }


@router.post("/{finding_id}/review", response_model=IntegrityFindingSchema)
def review_finding(
    finding_id: str,
    payload: FindingReviewRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Records an authorized human reviewer decision and notes on an integrity finding.
    Does not automatically delete records, but updates review status and audit log.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to record review decision.",
        )

    user = get_current_user_from_token(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalid or expired.",
        )

    # Role check: only AUDITOR or NODE can review findings
    if user.get("role") not in [RoleEnum.AUDITOR, RoleEnum.NODE]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Nodal Officers and Central Regulators are authorized to review findings.",
        )

    clean_id = finding_id.strip()
    finding = INTEGRITY_FINDINGS_DB.get(clean_id)
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integrity finding '{clean_id}' not found.",
        )

    # Institution scoping check
    if user.get("role") == RoleEnum.NODE:
        user_inst = (user.get("institute_id") or "").strip().upper()
        is_involved = (
            finding.primary_institute_code.upper() == user_inst
            or (finding.secondary_institute_code and finding.secondary_institute_code.upper() == user_inst)
        )
        if not is_involved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You cannot review findings for other institutions.",
            )

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    finding.review_status = payload.new_status
    finding.review_decision = payload.decision.strip()
    finding.review_notes = payload.notes.strip() if payload.notes else None
    finding.reviewed_by = f"{user.get('full_name')} ({user.get('email')})"
    finding.reviewed_at = now_str

    # Update in persistent database proxy
    INTEGRITY_FINDINGS_DB[finding.id] = finding

    # Log audit event
    log_audit_event(
        actor_email=user.get("email"),
        actor_role=str(user.get("role")),
        action="INTEGRITY_FINDING_REVIEWED",
        target_type="FINDING",
        target_id=finding.id,
        details=(
            f"Review recorded for finding {finding.id} ({finding.finding_type.value}): "
            f"Decision: '{finding.review_decision}', New Status: {finding.review_status.value}."
        ),
        actor_institution=user.get("institute_id"),
        outcome="SUCCESS",
    )

    return finding
