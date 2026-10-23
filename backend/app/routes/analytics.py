from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Header, Query
from app.models import IntegrityStatusEnum, RoleEnum, ReviewStatusEnum
from app.db import (
    STUDENT_LEDGER,
    INSTITUTIONS_DB,
    PROGRAMMES_DB,
    INTEGRITY_FINDINGS_DB,
    get_institution_with_stats,
    get_current_user_from_token,
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/metrics")
def get_metrics(
    scope: Optional[str] = Query("all", description="Scope metrics: 'all' or 'my_institution'"),
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Calculates live institutional and platform metrics directly from active database state."""
    records = list(STUDENT_LEDGER)
    clean_scope = scope if isinstance(scope, str) else "all"

    user = get_current_user_from_token(authorization) if authorization else None
    is_node_user = user and user.get("role") == RoleEnum.NODE
    user_inst_code = (user.get("institute_id") or "").strip().upper() if is_node_user else None

    # If scoped to institutional node
    if is_node_user or clean_scope == "my_institution":
        target_code = user_inst_code or "IND-AICTE-1042"
        inst_records = [r for r in records if r.institute_code.upper() == target_code]
        inst_stats = get_institution_with_stats(target_code)

        total = len(inst_records)
        verified = sum(1 for r in inst_records if r.integrity_status == IntegrityStatusEnum.VERIFIED)
        pending = sum(1 for r in inst_records if r.integrity_status == IntegrityStatusEnum.PENDING)
        duplicate = sum(1 for r in inst_records if r.integrity_status == IntegrityStatusEnum.DUPLICATE)
        warning = sum(1 for r in inst_records if r.integrity_status == IntegrityStatusEnum.WARNING)

        # Capacity for this institution
        total_cap = inst_stats.total_approved_intake if inst_stats else 120
        enrolled = len(inst_records)
        util_pct = round((enrolled / total_cap * 100.0) if total_cap > 0 else 0.0, 1)

        # Programmes nearing capacity for this institution
        progs = PROGRAMMES_DB.get(target_code, [])
        nearing_cap_progs = []
        for p in progs:
            p_enrolled = sum(1 for s in inst_records if s.programme.strip().lower() == p.name.strip().lower())
            p_util = round((p_enrolled / p.intake_cap * 100.0) if p.intake_cap > 0 else 0.0, 1)
            if p_util >= 85.0:
                nearing_cap_progs.append({
                    "name": p.name,
                    "code": p.code,
                    "intake_cap": p.intake_cap,
                    "intake_current": p_enrolled,
                    "utilization_pct": p_util,
                })

        # Duplicates involving this institution
        duplicate_cases = [
            {
                "id": s.id,
                "apaar_id": s.apaar_id,
                "student_name": s.student_name,
                "institute_code": s.institute_code,
                "institute_name": s.institute_name,
                "notes": s.notes,
            }
            for s in records
            if s.integrity_status == IntegrityStatusEnum.DUPLICATE
            and (s.institute_code.upper() == target_code or target_code in (s.notes or "").upper())
        ]

    # Findings scoped to this node
        node_findings = [
            f for f in INTEGRITY_FINDINGS_DB.values()
            if f.primary_institute_code.upper() == target_code
            or (f.secondary_institute_code and f.secondary_institute_code.upper() == target_code)
            or target_code in f.reason.upper()
        ]
        pending_reviews = sum(1 for f in node_findings if f.review_status == ReviewStatusEnum.PENDING_REVIEW)
        resolved_reviews = sum(1 for f in node_findings if "RESOLVED" in str(f.review_status))

        from app.services.apaar_adapter import SandboxAPAARAdapter
        from app.db import AUDIT_LOG_DB
        from app.database import get_db_context
        from app.orm_models import VerificationHistoryORM

        valid_format_cnt = sum(1 for s in inst_records if SandboxAPAARAdapter.validate_format(s.apaar_id))
        invalid_format_cnt = total - valid_format_cnt

        with get_db_context() as db:
            clean_hist = db.query(VerificationHistoryORM).filter(
                VerificationHistoryORM.institution_code == target_code,
                VerificationHistoryORM.status == "CLEAN"
            ).count()
            coll_hist = db.query(VerificationHistoryORM).filter(
                VerificationHistoryORM.institution_code == target_code,
                VerificationHistoryORM.status == "COLLISION"
            ).count()
            quota_hist = db.query(VerificationHistoryORM).filter(
                VerificationHistoryORM.institution_code == target_code,
                VerificationHistoryORM.status == "QUOTA ALERT"
            ).count()
            nf_hist = db.query(VerificationHistoryORM).filter(
                VerificationHistoryORM.institution_code == target_code,
                VerificationHistoryORM.status == "NOT FOUND"
            ).count()

        recent_activity = [
            {
                "id": a.id,
                "action": a.action,
                "actor": a.actor_email,
                "institution": a.actor_institution,
                "outcome": a.outcome,
                "timestamp": a.timestamp,
                "details": a.details,
            }
            for a in list(AUDIT_LOG_DB)
            if a.actor_institution == target_code or target_code in a.details.upper()
        ][:6]

        return {
            "is_node_view": True,
            "institution_code": target_code,
            "institution_name": inst_stats.name if inst_stats else (user.get("institute_name") if user else "Institution Node"),
            "total_students": total,
            "records_processed": total,
            "verified_count": verified,
            "pending_count": pending,
            "attention_count": duplicate + warning,
            "duplicate_count": duplicate,
            "potential_duplicate_records": duplicate,
            "warning_count": warning,
            "intake_compliance_alerts": warning,
            "valid_format_records": valid_format_cnt,
            "invalid_format_records": invalid_format_cnt,
            "current_enrolment": enrolled,
            "approved_intake_capacity": total_cap,
            "capacity_utilization_pct": util_pct,
            "programmes_count": len(progs),
            "total_programmes": len(progs),
            "institutes_count": 1,
            "total_institutions": 1,
            "is_empty": total == 0,
            "has_critical_conflicts": len(duplicate_cases) > 0,
            "duplicate_cases": duplicate_cases,
            "programmes_nearing_capacity": nearing_cap_progs,
            "institutions_needing_attention": [],
            "pending_reviews_count": pending_reviews,
            "resolved_reviews_count": resolved_reviews,
            "total_findings_count": len(node_findings),
            "verification_outcomes": {
                "clean": clean_hist,
                "collision": coll_hist,
                "quota_alert": quota_hist,
                "not_found": nf_hist,
            },
            "recent_activity": recent_activity,
        }

    # Platform Administrator View (Global)
    total_students = len(records)
    verified = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.VERIFIED)
    pending = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.PENDING)
    duplicate = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.DUPLICATE)
    warning = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.WARNING)
    attention = duplicate + warning

    total_institutions = len(INSTITUTIONS_DB)
    total_progs = sum(len(PROGRAMMES_DB.get(k, [])) for k in INSTITUTIONS_DB.keys())

    from app.services.apaar_adapter import SandboxAPAARAdapter
    from app.db import AUDIT_LOG_DB
    from app.database import get_db_context
    from app.orm_models import VerificationHistoryORM

    valid_format_cnt = sum(1 for s in records if SandboxAPAARAdapter.validate_format(s.apaar_id))
    invalid_format_cnt = total_students - valid_format_cnt

    with get_db_context() as db:
        clean_hist = db.query(VerificationHistoryORM).filter(VerificationHistoryORM.status == "CLEAN").count()
        coll_hist = db.query(VerificationHistoryORM).filter(VerificationHistoryORM.status == "COLLISION").count()
        quota_hist = db.query(VerificationHistoryORM).filter(VerificationHistoryORM.status == "QUOTA ALERT").count()
        nf_hist = db.query(VerificationHistoryORM).filter(VerificationHistoryORM.status == "NOT FOUND").count()

    recent_activity = [
        {
            "id": a.id,
            "action": a.action,
            "actor": a.actor_email,
            "institution": a.actor_institution,
            "outcome": a.outcome,
            "timestamp": a.timestamp,
            "details": a.details,
        }
        for a in list(AUDIT_LOG_DB)
    ][:8]

    # Institutions needing attention (have duplicates or intake warnings)
    institutions_needing_attention = []
    for code, inst in INSTITUTIONS_DB.items():
        inst_students = [s for s in records if s.institute_code.upper() == code.upper()]
        dups = sum(1 for s in inst_students if s.integrity_status == IntegrityStatusEnum.DUPLICATE)
        warns = sum(1 for s in inst_students if s.integrity_status == IntegrityStatusEnum.WARNING)
        if dups > 0 or warns > 0:
            institutions_needing_attention.append({
                "code": code,
                "name": inst.name,
                "duplicates": dups,
                "warnings": warns,
                "status": inst.status.value,
            })

    # Programmes nearing or exceeding capacity across all institutions
    nearing_cap_progs = []
    for code, progs in PROGRAMMES_DB.items():
        inst_obj = INSTITUTIONS_DB.get(code)
        inst_name = inst_obj.name if inst_obj else code
        for p in progs:
            p_enrolled = sum(
                1 for s in records
                if s.institute_code.upper() == code.upper() and s.programme.strip().lower() == p.name.strip().lower()
            )
            p_util = round((p_enrolled / p.intake_cap * 100.0) if p.intake_cap > 0 else 0.0, 1)
            if p_util >= 85.0:
                nearing_cap_progs.append({
                    "institution_code": code,
                    "institution_name": inst_name,
                    "name": p.name,
                    "code": p.code,
                    "intake_cap": p.intake_cap,
                    "intake_current": p_enrolled,
                    "utilization_pct": p_util,
                    "is_exceeded": p_enrolled > p.intake_cap,
                })

    # Duplicate enrolment cases (only genuine collisions)
    duplicate_cases = [
        {
            "id": s.id,
            "apaar_id": s.apaar_id,
            "student_name": s.student_name,
            "institute_code": s.institute_code,
            "institute_name": s.institute_name,
            "notes": s.notes,
        }
        for s in records
        if s.integrity_status == IntegrityStatusEnum.DUPLICATE
    ]

    all_findings = list(INTEGRITY_FINDINGS_DB.values())
    pending_reviews = sum(1 for f in all_findings if f.review_status == ReviewStatusEnum.PENDING_REVIEW)
    resolved_reviews = sum(1 for f in all_findings if "RESOLVED" in str(f.review_status))

    return {
        "is_node_view": False,
        "total_institutions": total_institutions,
        "total_programmes": total_progs,
        "total_students": total_students,
        "records_processed": total_students,
        "verified_count": verified,
        "pending_count": pending,
        "attention_count": attention,
        "duplicate_count": duplicate,
        "potential_duplicate_records": duplicate,
        "warning_count": warning,
        "intake_compliance_alerts": warning,
        "valid_format_records": valid_format_cnt,
        "invalid_format_records": invalid_format_cnt,
        "institutes_count": total_institutions,
        "is_empty": total_students == 0,
        "has_critical_conflicts": duplicate > 0,
        "duplicate_cases": duplicate_cases,
        "institutions_needing_attention": institutions_needing_attention,
        "programmes_nearing_capacity": nearing_cap_progs,
        "pending_reviews_count": pending_reviews,
        "resolved_reviews_count": resolved_reviews,
        "total_findings_count": len(all_findings),
        "verification_outcomes": {
            "clean": clean_hist,
            "collision": coll_hist,
            "quota_alert": quota_hist,
            "not_found": nf_hist,
        },
        "recent_activity": recent_activity,
    }
