from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Header, status
from app.models import RoleEnum, IntegrityStatusEnum
from app.db import (
    STUDENT_LEDGER,
    INSTITUTIONS_DB,
    PROGRAMMES_DB,
    INTEGRITY_FINDINGS_DB,
    get_institution_with_stats,
    get_current_user_from_token,
)
from app.services.integrity_engine import IntegrityEngine

router = APIRouter(prefix="/api/reports", tags=["Reports & Verifiable Records"])


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


@router.get("/export/{report_type}")
def export_report_csv(
    report_type: str,
    authorization: Optional[str] = Header(None),
):
    """
    Exports requested report (enrolment, capacity, findings) in RFC-4180 CSV format.
    """
    clean_type = report_type.lower().strip()
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    if clean_type == "enrolment":
        lines = ["RECORD_ID,APAAR_ID_MASKED,STUDENT_NAME,INSTITUTE_CODE,INSTITUTE_NAME,PROGRAMME,ADMISSION_YEAR,CATEGORY,GENDER,STATUS"]
        for s in STUDENT_LEDGER:
            masked = IntegrityEngine.mask_apaar(s.apaar_id)
            cat_val = s.category or "General"
            gen_val = s.gender or "—"
            lines.append(
                f'"{s.id}","{masked}","{s.student_name}","{s.institute_code}","{s.institute_name}",'
                f'"{s.programme}","{s.admission_year}","{cat_val}","{gen_val}","{s.integrity_status.value}"'
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
                lines.append(
                    f'"{code}","{inst.name}","{p.name}","{p.admission_year}",{p.intake_cap},{enrolled},{util},{"YES" if enrolled > p.intake_cap else "NO"}'
                )
        filename = f"AICTE_Capacity_Report_{timestamp_str}.csv"

    elif clean_type == "findings":
        lines = ["FINDING_ID,TYPE,SEVERITY,APAAR_MASKED,STUDENT_NAME,PRIMARY_INST,PROGRAMME,REASON,REVIEW_STATUS,REVIEWED_BY"]
        for f in INTEGRITY_FINDINGS_DB.values():
            rev_by = f.reviewed_by or "Unassigned"
            reason_clean = f.reason.replace('"', "'")
            lines.append(
                f'"{f.id}","{f.finding_type.value}","{f.severity.value}","{f.apaar_id_masked}","{f.student_name}",'
                f'"{f.primary_institute_code}","{f.programme}","{reason_clean}","{f.review_status.value}","{rev_by}"'
            )
        filename = f"AICTE_Integrity_Findings_Report_{timestamp_str}.csv"

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown report export type '{report_type}'. Options are: 'enrolment', 'capacity', 'findings'.",
        )

    return {
        "report_type": clean_type,
        "filename": filename,
        "csv": "\n".join(lines),
    }
