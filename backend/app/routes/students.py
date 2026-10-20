import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException, Header, status
from app.models import (
    StudentRecordSchema,
    StudentCreateRequest,
    IntegrityStatusEnum,
    RoleEnum,
    IntegrityFindingSchema,
    FindingSeverityEnum,
    FindingTypeEnum,
    ReviewStatusEnum,
)
from app.db import (
    STUDENT_LEDGER,
    SAMPLE_DEMO_STUDENTS,
    INSTITUTIONS_DB,
    PROGRAMMES_DB,
    INTEGRITY_FINDINGS_DB,
    log_audit_event,
    reset_findings_and_audit,
    get_current_user_from_token,
)
from app.services.integrity_engine import IntegrityEngine

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("", response_model=List[StudentRecordSchema])
def list_students(
    search: Optional[str] = Query(None, description="Search by name, APAAR ID, email, enrollment no, or institute"),
    integrity_status: Optional[IntegrityStatusEnum] = Query(None, alias="status", description="Filter by integrity status"),
    institute_code: Optional[str] = Query(None, description="Filter by institution code"),
    category: Optional[str] = Query(None, description="Filter by student category (General, OBC, SC, ST, EWS)"),
    gender: Optional[str] = Query(None, description="Filter by student gender"),
    scope: Optional[str] = Query("all", description="Record visibility: 'all' or 'my_institution'"),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    page_size: int = Query(50, ge=1, le=500, description="Items per page"),
    authorization: Optional[str] = Header(None),
):
    results = list(STUDENT_LEDGER)
    clean_scope = scope if isinstance(scope, str) else "all"

    user = get_current_user_from_token(authorization) if (authorization and isinstance(authorization, str)) else None

    # Strict role-based scoping: Institution node users CANNOT browse another institution's restricted student data
    if user and user.get("role") == RoleEnum.NODE:
        user_inst = (user.get("institute_id") or "").strip().upper()
        if isinstance(institute_code, str) and institute_code.strip().upper() != user_inst:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: You do not have permission to view records of another institution ({institute_code}).",
            )
        # Node user sees their institution records and any records where their institution is part of a collision note
        results = [
            r for r in results
            if r.institute_code.upper() == user_inst or user_inst in (r.notes or "").upper()
        ]
    elif isinstance(institute_code, str) and institute_code.strip():
        req_inst = institute_code.strip().upper()
        results = [r for r in results if r.institute_code.upper() == req_inst]
    elif clean_scope == "my_institution" and user and user.get("institute_id"):
        user_inst = (user.get("institute_id") or "").strip().upper()
        results = [r for r in results if r.institute_code.upper() == user_inst]

    if isinstance(search, str) and search.strip():
        s = search.lower().strip()
        results = [
            r for r in results
            if s in r.student_name.lower()
            or s in r.apaar_id.lower()
            or s in r.institute_name.lower()
            or s in r.programme.lower()
            or (r.email and s in r.email.lower())
            or (r.enrollment_number and s in r.enrollment_number.lower())
        ]

    if isinstance(integrity_status, IntegrityStatusEnum):
        results = [r for r in results if r.integrity_status == integrity_status]

    if isinstance(category, str) and category.strip():
        cat_lower = category.strip().lower()
        results = [r for r in results if r.category and r.category.strip().lower() == cat_lower]

    if isinstance(gender, str) and gender.strip():
        gen_lower = gender.strip().lower()
        results = [r for r in results if r.gender and r.gender.strip().lower() == gen_lower]

    # Pagination slice (safely convert if called directly as a function without FastAPI DI)
    p = page if isinstance(page, int) else 1
    ps = page_size if isinstance(page_size, int) else 50
    start_idx = max(0, (p - 1) * ps)
    end_idx = start_idx + ps
    return results[start_idx:end_idx]


@router.get("/{identifier}", response_model=StudentRecordSchema)
def get_student_by_identifier(identifier: str, authorization: Optional[str] = Header(None)):
    """Fetches full student record by database record ID or APAAR ID with institution isolation."""
    user = get_current_user_from_token(authorization) if (authorization and isinstance(authorization, str)) else None
    clean_id = identifier.strip().lower()
    norm_id = IntegrityEngine.normalize_apaar(identifier)
    for r in STUDENT_LEDGER:
        if (
            r.apaar_id.strip().lower() == clean_id
            or r.id.strip().lower() == clean_id
            or IntegrityEngine.normalize_apaar(r.apaar_id) == norm_id
        ):
            if user and user.get("role") == RoleEnum.NODE:
                user_inst = (user.get("institute_id") or "").strip().upper()
                if r.institute_code.upper() != user_inst and user_inst not in (r.notes or "").upper():
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Forbidden: You do not have permission to view records belonging to another institution.",
                    )
            return r
    raise HTTPException(status_code=404, detail=f"Student record '{identifier}' not found in ledger.")


@router.post("", response_model=StudentRecordSchema, status_code=status.HTTP_201_CREATED)
def add_student(payload: StudentCreateRequest, authorization: Optional[str] = Header(None)):
    user = get_current_user_from_token(authorization) if authorization else None

    # Role enforcement: only AUDITOR or NODE can add student records
    if user and user.get("role") not in [RoleEnum.AUDITOR, RoleEnum.NODE]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Nodal Officers and Central Regulators are authorized to register student records.",
        )

    # Institution scoping
    inst_code = (payload.institute_code or payload.institution_code or "IND-AICTE-1042").strip().upper()

    if user and user.get("role") == RoleEnum.NODE:
        user_inst = (user.get("institute_id") or "").strip().upper()
        if inst_code != user_inst:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: You cannot add records to another institution ({inst_code}).",
            )

    # Derive institution authoritatively from persisted database records
    registered_inst = INSTITUTIONS_DB.get(inst_code)
    if registered_inst:
        inst_name = registered_inst.name
        inst_code = registered_inst.code
    else:
        inst_name = payload.institute_name or payload.institution_name or "AICTE Accredited Campus"

    # Derive programme metadata and sanctioned intake cap from persisted database records
    course = (payload.programme or payload.course or "B.Tech General").strip()
    inst_progs = PROGRAMMES_DB.get(inst_code, [])
    prog_obj = None
    for p in inst_progs:
        if p.name.strip().lower() == course.lower() or (p.code and p.code.lower() == course.lower()):
            prog_obj = p
            break

    if prog_obj:
        course = prog_obj.name
        cap = prog_obj.intake_cap
        year = prog_obj.admission_year or payload.admission_year or payload.academic_year or "2024-2028"
    else:
        # Fallback to default cap if programme record not explicitly registered
        cap = 60
        year = payload.admission_year or payload.academic_year or "2024-2028"

    norm_apaar = IntegrityEngine.normalize_apaar(payload.apaar_id)
    for existing in STUDENT_LEDGER:
        if IntegrityEngine.normalize_apaar(existing.apaar_id) == norm_apaar and existing.institute_code == inst_code:
            raise HTTPException(
                status_code=400,
                detail=f"Candidate with APAAR ID {payload.apaar_id} is already enrolled in {inst_name}.",
            )

    # Calculate current enrolled count dynamically from persisted student records
    current_enrolled = sum(
        1 for s in STUDENT_LEDGER
        if s.institute_code.upper() == inst_code
        and s.programme.strip().lower() == course.lower()
        and (not s.admission_year or not year or s.admission_year == year)
        and IntegrityEngine.normalize_apaar(s.apaar_id) != norm_apaar
    )
    curr_intake = current_enrolled + 1

    # Existing enrolments list for multi-campus collision detection
    existing_enrolments = [
        {"apaar_id": s.apaar_id, "institute_code": s.institute_code, "institute_name": s.institute_name}
        for s in STUDENT_LEDGER
    ]

    evaluated = IntegrityEngine.evaluate_student_integrity(
        apaar_id=payload.apaar_id.strip(),
        student_name=payload.student_name.strip(),
        institute_code=inst_code,
        institute_name=inst_name,
        programme=course,
        admission_year=year,
        current_intake=curr_intake,
        intake_cap=cap,
        existing_enrolments=existing_enrolments,
        email=payload.email,
        enrollment_number=payload.enrollment_number,
        dob=payload.dob,
        category=payload.category,
        gender=payload.gender,
    )

    if payload.notes:
        evaluated.notes = f"{evaluated.notes} | {payload.notes}"

    STUDENT_LEDGER.insert(0, evaluated)

    # Update programme current intake count in database
    if prog_obj:
        prog_obj.intake_current = curr_intake
        from app.database import get_db_context
        from app.orm_models import ProgrammeORM
        with get_db_context() as db:
            db_p = db.query(ProgrammeORM).filter(
                ProgrammeORM.institution_code.ilike(inst_code),
                (ProgrammeORM.id == prog_obj.id) | (ProgrammeORM.name.ilike(prog_obj.name))
            ).first()
            if db_p:
                db_p.intake_current = curr_intake
                db.commit()

    # Register finding if collision or warning detected
    if evaluated.integrity_status == IntegrityStatusEnum.DUPLICATE:
        fnd_id = f"FND-COLLISION-{uuid.uuid4().hex[:6].upper()}"
        INTEGRITY_FINDINGS_DB[fnd_id] = IntegrityFindingSchema(
            id=fnd_id,
            finding_type=FindingTypeEnum.DUPLICATE_CONCURRENT_ENROLMENT,
            severity=FindingSeverityEnum.CRITICAL,
            apaar_id_masked=IntegrityEngine.mask_apaar(evaluated.apaar_id),
            apaar_id=evaluated.apaar_id,
            student_name=evaluated.student_name,
            primary_institute_code=inst_code,
            primary_institute_name=inst_name,
            programme=course,
            admission_year=year,
            affected_record_ids=[evaluated.id],
            reason=evaluated.notes or "Concurrent enrolment collision detected.",
            review_status=ReviewStatusEnum.PENDING_REVIEW,
            detection_timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        )
    elif evaluated.integrity_status == IntegrityStatusEnum.WARNING:
        fnd_id = f"FND-INTAKE-{uuid.uuid4().hex[:6].upper()}"
        INTEGRITY_FINDINGS_DB[fnd_id] = IntegrityFindingSchema(
            id=fnd_id,
            finding_type=FindingTypeEnum.INTAKE_CAPACITY_EXCEEDED,
            severity=FindingSeverityEnum.WARNING,
            apaar_id_masked=IntegrityEngine.mask_apaar(evaluated.apaar_id),
            apaar_id=evaluated.apaar_id,
            student_name=evaluated.student_name,
            primary_institute_code=inst_code,
            primary_institute_name=inst_name,
            programme=course,
            admission_year=year,
            affected_record_ids=[evaluated.id],
            reason=evaluated.notes or "Sanctioned intake capacity exceeded.",
            review_status=ReviewStatusEnum.PENDING_REVIEW,
            detection_timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        )

    # Record audit log
    actor_email = user.get("email") if user else "system@aicte.gov.in"
    actor_role = str(user.get("role")) if user else "auditor"
    actor_inst = user.get("institute_id") if user else inst_code
    log_audit_event(
        actor_email=actor_email,
        actor_role=actor_role,
        action="STUDENT_ENROLMENT_CREATED",
        target_type="STUDENT",
        target_id=evaluated.id,
        details=f"Created student record for {evaluated.student_name} (APAAR: {IntegrityEngine.mask_apaar(evaluated.apaar_id)}) at {inst_name}. Status: {evaluated.integrity_status.value}.",
        actor_institution=actor_inst,
        outcome="FLAGGED" if evaluated.integrity_status != IntegrityStatusEnum.VERIFIED else "SUCCESS",
    )

    return evaluated


@router.delete("/{apaar_id}")
def delete_student(apaar_id: str, authorization: Optional[str] = Header(None)):
    global STUDENT_LEDGER
    user = get_current_user_from_token(authorization) if authorization else None
    initial_len = len(STUDENT_LEDGER)
    clean_id = apaar_id.strip()
    norm_id = IntegrityEngine.normalize_apaar(clean_id)

    target_student = next(
        (s for s in STUDENT_LEDGER if s.apaar_id.strip() == clean_id or IntegrityEngine.normalize_apaar(s.apaar_id) == norm_id or s.id == clean_id),
        None,
    )

    if not target_student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    if user and user.get("role") == RoleEnum.NODE:
        user_inst = (user.get("institute_id") or "").strip().upper()
        if target_student.institute_code.upper() != user_inst:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You cannot delete records belonging to another institution.",
            )

    STUDENT_LEDGER[:] = [
        s for s in STUDENT_LEDGER
        if s.apaar_id.strip() != clean_id and IntegrityEngine.normalize_apaar(s.apaar_id) != norm_id and s.id != clean_id
    ]

    actor_email = user.get("email") if user else "system@aicte.gov.in"
    actor_role = str(user.get("role")) if user else "auditor"
    actor_inst = user.get("institute_id") if user else target_student.institute_code
    log_audit_event(
        actor_email=actor_email,
        actor_role=actor_role,
        action="STUDENT_RECORD_DELETED",
        target_type="STUDENT",
        target_id=target_student.id,
        details=f"Deleted student record for {target_student.student_name} (APAAR: {IntegrityEngine.mask_apaar(target_student.apaar_id)}) from {target_student.institute_name}.",
        actor_institution=actor_inst,
        outcome="SUCCESS",
    )

    return {"status": "success", "message": f"Student record {apaar_id} removed from ledger."}


@router.post("/seed-demo")
def seed_demo_data(authorization: Optional[str] = Header(None)):
    """Populates small, explicitly marked sample demonstration records."""
    user = get_current_user_from_token(authorization) if authorization else None
    STUDENT_LEDGER.clear()
    STUDENT_LEDGER.extend(SAMPLE_DEMO_STUDENTS)
    reset_findings_and_audit()

    actor_email = user.get("email") if user else "admin@demo.vidyaverify.local"
    actor_role = str(user.get("role")) if user else "auditor"
    log_audit_event(
        actor_email=actor_email,
        actor_role=actor_role,
        action="DEMO_DATA_SEEDED",
        target_type="LEDGER",
        target_id="STUDENT_LEDGER",
        details=f"Reset ledger to {len(SAMPLE_DEMO_STUDENTS)} verified sample demonstration records.",
        outcome="SUCCESS",
    )

    return {
        "status": "success",
        "message": f"Loaded {len(SAMPLE_DEMO_STUDENTS)} sample demonstration records.",
        "count": len(STUDENT_LEDGER),
    }


@router.post("/clear-all")
def clear_all_data(authorization: Optional[str] = Header(None)):
    """Clears ledger to test zero-data / empty state behavior."""
    user = get_current_user_from_token(authorization) if authorization else None
    STUDENT_LEDGER.clear()
    INTEGRITY_FINDINGS_DB.clear()

    actor_email = user.get("email") if user else "admin@demo.vidyaverify.local"
    actor_role = str(user.get("role")) if user else "auditor"
    log_audit_event(
        actor_email=actor_email,
        actor_role=actor_role,
        action="LEDGER_CLEARED_EMPTY_STATE",
        target_type="LEDGER",
        target_id="STUDENT_LEDGER",
        details="Cleared student ledger and findings to verify empty onboarding state.",
        outcome="SUCCESS",
    )

    return {
        "status": "success",
        "message": "Student ledger cleared. Empty state active.",
        "count": 0,
    }
