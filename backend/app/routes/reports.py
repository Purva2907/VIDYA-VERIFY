from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Header, status
from app.models import RoleEnum, IntegrityStatusEnum
from app.db import (
    STUDENT_LEDGER,
    INSTITUTIONS_DB,
    PROGRAMMES_DB,
    INTEGRITY_FINDINGS_DB,
    AUDIT_LOG_DB,
    get_institution_with_stats,
    get_current_user_from_token,
    log_audit_event,
)
from app.database import get_db_context
from app.orm_models import VerificationHistoryORM
from app.services.integrity_engine import IntegrityEngine

router = APIRouter(prefix="/api/reports", tags=["Reports & Verifiable Records"])


def sanitize_csv_cell(val: Any) -> str:
    """Mitigates spreadsheet formula injection by prepending dangerous characters with a single quote."""
    if val is None:
        return ""
    val_str = str(val).strip()
    if val_str and val_str[0] in ("=", "+", "-", "@", "\t", "\r"):
        val_str = f"'{val_str}"
    return val_str.replace('"', '""')


@router.get("/enrolment-summary")
def get_enrolment_summary(
    scope: Optional[str] = Query("all", description="Scope: 'all' or 'my_institution'"),
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """
    Produces aggregate enrolment report across institutions, programmes, categories, and genders.
    """
    user = get_current_user_from_token(authorization) if authorization else None
    records = list(STUDENT_LEDGER)

    # Scoping
    if (user and user.get("role") == RoleEnum.NODE) or scope == "my_institution":
        user_inst = (user.get("institute_id") or "IND-AICTE-1042").strip().upper() if user else "IND-AICTE-1042"
        records = [r for r in records if r.institute_code.upper() == user_inst]

    total = len(records)
    verified = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.VERIFIED)
    pending = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.PENDING)
    duplicate = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.DUPLICATE)
    warning = sum(1 for r in records if r.integrity_status == IntegrityStatusEnum.WARNING)

    # Group by category
    categories: Dict[str, int] = {}
    for r in records:
        cat = r.category or "Unspecified"
        categories[cat] = categories.get(cat, 0) + 1

    # Group by gender
    genders: Dict[str, int] = {}
    for r in records:
        gen = r.gender or "Unspecified"
        genders[gen] = genders.get(gen, 0) + 1

    # Group by programme
    by_programme: Dict[str, Dict[str, Any]] = {}
    for r in records:
        prog_name = r.programme
        if prog_name not in by_programme:
            by_programme[prog_name] = {
                "programme": prog_name,
                "institute_code": r.institute_code,
                "institute_name": r.institute_name,
                "total": 0,
                "verified": 0,
                "duplicate": 0,
                "warning": 0,
            }
        by_programme[prog_name]["total"] += 1
        if r.integrity_status == IntegrityStatusEnum.VERIFIED:
            by_programme[prog_name]["verified"] += 1
        elif r.integrity_status == IntegrityStatusEnum.DUPLICATE:
            by_programme[prog_name]["duplicate"] += 1
        elif r.integrity_status == IntegrityStatusEnum.WARNING:
            by_programme[prog_name]["warning"] += 1

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "total_enrolments": total,
        "verified_count": verified,
        "pending_count": pending,
        "duplicate_count": duplicate,
        "warning_count": warning,
        "categories_breakdown": categories,
        "genders_breakdown": genders,
        "programmes": list(by_programme.values()),
    }


@router.get("/intake-capacity")
def get_intake_capacity_report(
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """
    Produces sanctioned intake capacity utilization report.
    Flags institutions and programmes exceeding approved caps.
    """
    user = get_current_user_from_token(authorization) if authorization else None
    is_node = user and user.get("role") == RoleEnum.NODE
    user_inst = (user.get("institute_id") or "").strip().upper() if is_node else None

    report_items = []
    total_approved = 0
    total_admitted = 0
    over_capacity_count = 0

    institutions_to_check = [user_inst] if user_inst else list(INSTITUTIONS_DB.keys())

    for code in institutions_to_check:
        inst = INSTITUTIONS_DB.get(code)
        if not inst:
            continue
        progs = PROGRAMMES_DB.get(code, [])
        for p in progs:
            enrolled = sum(
                1 for s in STUDENT_LEDGER
                if s.institute_code.upper() == code.upper() and s.programme.strip().lower() == p.name.strip().lower()
            )
            total_approved += p.intake_cap
            total_admitted += enrolled
            util_pct = round((enrolled / p.intake_cap * 100.0) if p.intake_cap > 0 else 0.0, 1)
            is_exceeded = enrolled > p.intake_cap
            if is_exceeded:
                over_capacity_count += 1

            report_items.append({
                "institute_code": code,
                "institute_name": inst.name,
                "programme_name": p.name,
                "admission_year": p.admission_year,
                "approved_cap": p.intake_cap,
                "current_admitted": enrolled,
                "remaining_seats": max(0, p.intake_cap - enrolled),
                "utilization_pct": util_pct,
                "is_exceeded": is_exceeded,
                "excess_seats": max(0, enrolled - p.intake_cap),
            })

    overall_util = round((total_admitted / total_approved * 100.0) if total_approved > 0 else 0.0, 1)

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "total_approved_intake": total_approved,
        "total_current_admitted": total_admitted,
        "overall_utilization_pct": overall_util,
        "programmes_exceeded_count": over_capacity_count,
        "details": report_items,
    }


@router.get("/duplicate-findings")
def get_duplicate_findings_report(
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """
    Returns summary report of duplicate collisions and review outcomes.
    """
    user = get_current_user_from_token(authorization) if authorization else None
    findings = list(INTEGRITY_FINDINGS_DB.values())

    if user and user.get("role") == RoleEnum.NODE:
        user_inst = (user.get("institute_id") or "").strip().upper()
        findings = [
            f for f in findings
            if f.primary_institute_code.upper() == user_inst
            or (f.secondary_institute_code and f.secondary_institute_code.upper() == user_inst)
            or user_inst in f.reason.upper()
        ]

    pending = sum(1 for f in findings if f.review_status == "PENDING_REVIEW")
    in_review = sum(1 for f in findings if f.review_status == "IN_REVIEW")
    resolved = sum(1 for f in findings if "RESOLVED" in str(f.review_status))

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "total_findings": len(findings),
        "pending_review_count": pending,
        "in_review_count": in_review,
        "resolved_count": resolved,
        "findings": findings,
    }


@router.get("/printable-summary")
def get_printable_summary(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Generates an executive regulatory summary ready for printable / PDF inspection.
    Derives all numbers directly from the authoritative database ledger.
    """
    user = get_current_user_from_token(authorization) if authorization else None
    actor_email = user.get("email") if user else "auditor@aicte.gov.in"
    actor_role = str(user.get("role")) if user else "auditor"

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    students = list(STUDENT_LEDGER)
    findings = list(INTEGRITY_FINDINGS_DB.values())
    institutions = list(INSTITUTIONS_DB.values())

    total_intake = sum(inst.total_approved_intake for inst in institutions)
    total_enrolled = len(students)
    clean_count = sum(1 for s in students if s.integrity_status == IntegrityStatusEnum.VERIFIED)
    dup_count = sum(1 for s in students if s.integrity_status == IntegrityStatusEnum.DUPLICATE)
    warning_count = sum(1 for s in students if s.integrity_status == IntegrityStatusEnum.WARNING)

    institution_summaries = []
    for inst in institutions:
        st = get_institution_with_stats(inst.code)
        if st:
            institution_summaries.append({
                "code": st.code,
                "name": st.name,
                "type": st.type,
                "state": st.state,
                "city": st.city,
                "sanctioned_intake": st.total_approved_intake,
                "enrolled_students": st.current_enrolment,
                "utilization_pct": st.capacity_utilization_pct,
                "programmes_count": st.programmes_count,
                "has_warning": st.has_allocation_warning,
            })

    # Log report generation audit event
    log_audit_event(
        actor_email=actor_email,
        actor_role=actor_role,
        action="REPORT_GENERATED",
        target_type="EXECUTIVE_SUMMARY",
        target_id="PRINTABLE_AUDIT_REPORT",
        details="Generated printable regulatory compliance executive summary report.",
        outcome="SUCCESS",
    )

    return {
        "title": "VIDYA-VERIFY — AICTE Student Data Integrity & Enrolment Compliance Report",
        "problem_statement": "AICTE 26263",
        "generated_at": now_str,
        "generated_by": f"{actor_role.upper()} ({actor_email})",
        "metrics": {
            "total_institutions": len(institutions),
            "total_programmes": sum(len(PROGRAMMES_DB.get(k, [])) for k in INSTITUTIONS_DB.keys()),
            "total_enrolled_students": total_enrolled,
            "total_sanctioned_capacity": total_intake,
            "overall_capacity_utilization": round((total_enrolled / total_intake * 100.0) if total_intake > 0 else 0.0, 1),
            "cryptographically_verified_records": clean_count,
            "duplicate_concurrent_collisions": dup_count,
            "sanctioned_quota_alerts": warning_count,
            "open_integrity_findings": sum(1 for f in findings if f.review_status == "PENDING_REVIEW"),
        },
        "institutions": institution_summaries,
        "findings": [
            {
                "id": f.id,
                "type": f.finding_type.value,
                "severity": f.severity.value,
                "apaar_masked": f.apaar_id_masked,
                "student_name": f.student_name,
                "primary_institution": f.primary_institute_name,
                "reason": f.reason,
                "review_status": f.review_status.value,
            }
            for f in findings[:15]
        ],
        "disclaimer": (
            "VIDYA-VERIFY DEMO ENVIRONMENT · Operating in sovereign sandbox mode. "
            "Data integrity hashes derived via SHA-256 Merkle root & ECDSA secp256r1. "
            "Official government APAAR identity verification requires connection to National Registry."
        ),
    }


@router.get("/export/{report_type}")
def export_report_csv(
    report_type: str,
    authorization: Optional[str] = Header(None),
):
    """
    Exports requested report in RFC-4180 CSV format with formula injection protection.
    Supported types: 'enrolment', 'capacity', 'findings', 'audit', 'verification-history'.
    """
    clean_type = report_type.lower().strip()
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    user = get_current_user_from_token(authorization) if authorization else None
    actor_email = user.get("email") if user else "public_verifier"
    actor_role = str(user.get("role")) if user else "public"

    if clean_type == "enrolment":
        lines = ["RECORD_ID,APAAR_ID_MASKED,STUDENT_NAME,INSTITUTE_CODE,INSTITUTE_NAME,PROGRAMME,ADMISSION_YEAR,CATEGORY,GENDER,STATUS"]
        for s in STUDENT_LEDGER:
            rec_id = sanitize_csv_cell(s.id)
            masked = sanitize_csv_cell(IntegrityEngine.mask_apaar(s.apaar_id))
            name = sanitize_csv_cell(s.student_name)
            icode = sanitize_csv_cell(s.institute_code)
            iname = sanitize_csv_cell(s.institute_name)
            prog = sanitize_csv_cell(s.programme)
            year = sanitize_csv_cell(s.admission_year)
            cat_val = sanitize_csv_cell(s.category or "General")
            gen_val = sanitize_csv_cell(s.gender or "—")
            stat = sanitize_csv_cell(s.integrity_status.value)
            lines.append(
                f'"{rec_id}","{masked}","{name}","{icode}","{iname}","{prog}","{year}","{cat_val}","{gen_val}","{stat}"'
            )
        filename = f"AICTE_Enrolment_Report_{timestamp_str}.csv"

    elif clean_type == "capacity":
        lines = ["INSTITUTE_CODE,INSTITUTE_NAME,PROGRAMME,ADMISSION_YEAR,APPROVED_CAP,ADMITTED,UTILIZATION_PCT,EXCEEDED"]
        for code, inst in INSTITUTIONS_DB.items():
            progs = PROGRAMMES_DB.get(code, [])
            for p in progs:
                enrolled = sum(
                    1 for s in STUDENT_LEDGER
                    if s.institute_code.upper() == code.upper() and s.programme.strip().lower() == p.name.strip().lower()
                )
                util = round((enrolled / p.intake_cap * 100.0) if p.intake_cap > 0 else 0.0, 1)
                icode = sanitize_csv_cell(code)
                iname = sanitize_csv_cell(inst.name)
                pname = sanitize_csv_cell(p.name)
                pyear = sanitize_csv_cell(p.admission_year)
                lines.append(
                    f'"{icode}","{iname}","{pname}","{pyear}",{p.intake_cap},{enrolled},{util},{"YES" if enrolled > p.intake_cap else "NO"}'
                )
        filename = f"AICTE_Capacity_Report_{timestamp_str}.csv"

    elif clean_type == "findings":
        lines = ["FINDING_ID,TYPE,SEVERITY,APAAR_MASKED,STUDENT_NAME,PRIMARY_INST,PROGRAMME,REASON,REVIEW_STATUS,REVIEWED_BY"]
        for f in INTEGRITY_FINDINGS_DB.values():
            fid = sanitize_csv_cell(f.id)
            ftype = sanitize_csv_cell(f.finding_type.value)
            fsev = sanitize_csv_cell(f.severity.value)
            fmask = sanitize_csv_cell(f.apaar_id_masked)
            fname = sanitize_csv_cell(f.student_name)
            finst = sanitize_csv_cell(f.primary_institute_code)
            fprog = sanitize_csv_cell(f.programme)
            freason = sanitize_csv_cell(f.reason)
            fstat = sanitize_csv_cell(f.review_status.value)
            frev = sanitize_csv_cell(f.reviewed_by or "Unassigned")
            lines.append(
                f'"{fid}","{ftype}","{fsev}","{fmask}","{fname}","{finst}","{fprog}","{freason}","{fstat}","{frev}"'
            )
        filename = f"AICTE_Integrity_Findings_Report_{timestamp_str}.csv"

    elif clean_type == "audit":
        lines = ["EVENT_ID,TIMESTAMP,ACTOR_EMAIL,ACTOR_ROLE,ACTOR_INSTITUTION,ACTION,TARGET_TYPE,TARGET_ID,OUTCOME,DETAILS"]
        for a in AUDIT_LOG_DB:
            aid = sanitize_csv_cell(a.id)
            ts = sanitize_csv_cell(a.timestamp)
            aemail = sanitize_csv_cell(a.actor_email)
            arole = sanitize_csv_cell(a.actor_role)
            ainst = sanitize_csv_cell(a.actor_institution or "—")
            aact = sanitize_csv_cell(a.action)
            ttype = sanitize_csv_cell(a.target_type)
            tid = sanitize_csv_cell(a.target_id or "—")
            out = sanitize_csv_cell(a.outcome)
            det = sanitize_csv_cell(a.details)
            lines.append(
                f'"{aid}","{ts}","{aemail}","{arole}","{ainst}","{aact}","{ttype}","{tid}","{out}","{det}"'
            )
        filename = f"AICTE_Audit_Trail_{timestamp_str}.csv"

    elif clean_type in ["verification-history", "verification_history", "history"]:
        lines = ["QUERY_ID,TIMESTAMP,APAAR_MASKED,STATUS,SOURCE_TYPE,INSTITUTION_CODE,PROGRAMME,IS_SANDBOX"]
        with get_db_context() as db:
            rows = db.query(VerificationHistoryORM).order_by(VerificationHistoryORM.timestamp.desc()).limit(1000).all()
            for r in rows:
                qid = sanitize_csv_cell(r.id)
                qts = sanitize_csv_cell(r.timestamp)
                qmask = sanitize_csv_cell(r.apaar_id_masked)
                qstat = sanitize_csv_cell(r.status)
                qsrc = sanitize_csv_cell(r.source_type)
                qinst = sanitize_csv_cell(r.institution_code or "—")
                qprog = sanitize_csv_cell(r.programme or "—")
                qsand = "YES" if r.is_sandbox else "NO"
                lines.append(f'"{qid}","{qts}","{qmask}","{qstat}","{qsrc}","{qinst}","{qprog}","{qsand}"')
        filename = f"AICTE_Verification_History_{timestamp_str}.csv"

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown report export type '{report_type}'. Options are: 'enrolment', 'capacity', 'findings', 'audit', 'verification-history'.",
        )

    # Record audit event for export
    log_audit_event(
        actor_email=actor_email,
        actor_role=actor_role,
        action="REPORT_EXPORTED_CSV",
        target_type="REPORT",
        target_id=clean_type.upper(),
        details=f"Exported {clean_type} report to CSV file '{filename}'.",
        outcome="SUCCESS",
    )

    return {
        "report_type": clean_type,
        "filename": filename,
        "csv": "\n".join(lines),
    }
