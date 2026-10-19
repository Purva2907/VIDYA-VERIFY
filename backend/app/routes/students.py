from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, Header, status
from app.models import (
    StudentRecordSchema,
    StudentCreateRequest,
    IntegrityStatusEnum,
    RoleEnum,
)
from app.db import (
    STUDENT_LEDGER,
    SAMPLE_DEMO_STUDENTS,
    get_current_user_from_token,
)
from app.services.integrity_engine import IntegrityEngine

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("", response_model=List[StudentRecordSchema])
def list_students(
    search: Optional[str] = Query(None, description="Search by name, APAAR ID, email, enrollment no, or institute"),
    status: Optional[IntegrityStatusEnum] = Query(None, description="Filter by integrity status"),
    scope: Optional[str] = Query("all", description="Record visibility: 'all' or 'my_institution'"),
    authorization: Optional[str] = Header(None),
):
    results = list(STUDENT_LEDGER)
    clean_scope = scope if isinstance(scope, str) else "all"

    # If scoped specifically to institutional node records
    if authorization and isinstance(authorization, str) and clean_scope == "my_institution":
        user = get_current_user_from_token(authorization)
        if user and user.get("role") == RoleEnum.NODE and user.get("institute_id"):
            inst_code = user["institute_id"]
            results = [
                r for r in results
                if inst_code in r.institute_code or inst_code in (r.notes or "") or "COLLISION" in r.institute_code
            ]

    if search and isinstance(search, str):
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

    if status and isinstance(status, IntegrityStatusEnum):
        results = [r for r in results if r.integrity_status == status]

    return results


@router.get("/{identifier}", response_model=StudentRecordSchema)
def get_student_by_identifier(identifier: str):
    """Fetches full student record by database record ID or APAAR ID."""
    clean_id = identifier.strip().lower()
    for r in STUDENT_LEDGER:
        if r.apaar_id.strip().lower() == clean_id or r.id.strip().lower() == clean_id:
            return r
    raise HTTPException(status_code=404, detail=f"Student record '{identifier}' not found in ledger.")


@router.post("", response_model=StudentRecordSchema, status_code=status.HTTP_201_CREATED)
def add_student(payload: StudentCreateRequest):
    # Check if student with same APAAR ID already exists in this institution
    inst_code = payload.institute_code or payload.institution_code or "IND-AICTE-1042"
    inst_name = payload.institute_name or payload.institution_name or "Delhi Institute of Technology"
    course = payload.programme or payload.course or "B.Tech General"
    year = payload.admission_year or payload.academic_year or "2024-2028"

    for existing in STUDENT_LEDGER:
        if existing.apaar_id.strip() == payload.apaar_id.strip() and existing.institute_code == inst_code:
            raise HTTPException(
                status_code=400,
                detail=f"Candidate with APAAR ID {payload.apaar_id} is already enrolled in {inst_name}.",
            )

    # Evaluate integrity using the engine
    existing_enrolments = [
        {"apaar_id": s.apaar_id, "institute_code": s.institute_code, "institute_name": s.institute_name}
        for s in STUDENT_LEDGER
    ]

    curr_intake = payload.intake_current or 60
    cap = payload.intake_cap or 60

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
    )

    if payload.notes:
        evaluated.notes = f"{evaluated.notes} | {payload.notes}"

    STUDENT_LEDGER.insert(0, evaluated)
    return evaluated



@router.delete("/{apaar_id}")
def delete_student(apaar_id: str):
    global STUDENT_LEDGER
    initial_len = len(STUDENT_LEDGER)
    STUDENT_LEDGER[:] = [s for s in STUDENT_LEDGER if s.apaar_id != apaar_id]
    if len(STUDENT_LEDGER) == initial_len:
        raise HTTPException(status_code=404, detail="Student record not found.")
    return {"status": "success", "message": f"Student record {apaar_id} removed from ledger."}


@router.post("/seed-demo")
def seed_demo_data():
    """Populates small, explicitly marked sample demonstration records."""
    STUDENT_LEDGER.clear()
    STUDENT_LEDGER.extend(SAMPLE_DEMO_STUDENTS)
    return {
        "status": "success",
        "message": f"Loaded {len(SAMPLE_DEMO_STUDENTS)} sample demonstration records.",
        "count": len(STUDENT_LEDGER),
    }


@router.post("/clear-all")
def clear_all_data():
    """Clears ledger to test zero-data / empty state behavior."""
    STUDENT_LEDGER.clear()
    return {
        "status": "success",
        "message": "Student ledger cleared. Empty state active.",
        "count": 0,
    }
