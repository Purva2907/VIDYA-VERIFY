import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Header, status

from app.models import (
    InstitutionSchema,
    InstitutionCreateRequest,
    InstitutionUpdateRequest,
    InstitutionStatusEnum,
    InstitutionProgramme,
    InstitutionIntakeConfigureRequest,
    ProgrammeCreateRequest,
    ProgrammeUpdateRequest,
    StudentRecordSchema,
    RoleEnum,
)
from app.db import (
    INSTITUTIONS_DB,
    PROGRAMMES_DB,
    STUDENT_LEDGER,
    get_institution_with_stats,
    list_all_institutions_with_stats,
    get_current_user_from_token,
    log_audit_event,
)

router = APIRouter(prefix="/api/institutions", tags=["Institutions"])


def _check_auth_and_scope(
    authorization: Optional[str],
    target_inst_code: Optional[str] = None,
    require_admin: bool = False,
) -> dict:
    """Enforces authentication and institution scoping."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
        )
    user = get_current_user_from_token(authorization)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalid or expired.",
        )

    # Platform administrator has global access
    if user.get("role") == RoleEnum.AUDITOR:
        return user

    if require_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action restricted to Platform Administrators.",
        )

    # Only AUDITOR and NODE roles can perform institution operations
    if user.get("role") != RoleEnum.NODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action restricted to Nodal Officers and Platform Administrators.",
        )

    # Institution user access check
    if target_inst_code and user.get("role") == RoleEnum.NODE:
        user_inst = user.get("institute_id")
        if user_inst and user_inst.upper() != target_inst_code.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You do not have permission to view or modify records for institution {target_inst_code}.",
            )

    return user


@router.get("", response_model=List[InstitutionSchema])
def list_institutions(
    search: Optional[str] = Query(None, description="Search by institution name or code"),
    status: Optional[InstitutionStatusEnum] = Query(None, description="Filter by approval status"),
    authorization: Optional[str] = Header(None),
):
    """Lists all registered institutions with live capacity and student statistics."""
    # Optional auth: if node user, they can see the directory but will see their scope highlighted
    user = get_current_user_from_token(authorization) if authorization else None

    institutions = list_all_institutions_with_stats()

    if search and isinstance(search, str):
        q = search.lower().strip()
        institutions = [
            inst for inst in institutions
            if q in inst.name.lower() or q in inst.code.lower() or q in inst.city.lower() or q in inst.state.lower()
        ]

    if status and isinstance(status, InstitutionStatusEnum):
        institutions = [inst for inst in institutions if inst.status == status]

    return institutions


@router.get("/{code}", response_model=InstitutionSchema)
def get_institution(
    code: str,
    session: Optional[str] = Query(None, description="Academic session for intake stats"),
    authorization: Optional[str] = Header(None),
):
    """Returns detailed institution record with live capacity calculations for requested session."""
    clean_code = code.strip().upper()
    inst = get_institution_with_stats(clean_code, session=session)
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution with code '{clean_code}' not found.",
        )
    return inst


@router.post("", response_model=InstitutionSchema, status_code=status.HTTP_201_CREATED)
def create_institution(
    payload: InstitutionCreateRequest,
    authorization: Optional[str] = Header(None),
):
    """Creates a new institution with institution-level intake configuration."""
    user = _check_auth_and_scope(authorization, require_admin=False)

    if user.get("role") != RoleEnum.AUDITOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creating new institutions is restricted to Central Regulatory Administrators.",
        )

    clean_code = payload.code.strip().upper()
    clean_name = payload.name.strip()
    session = (payload.academic_session or "2024-2028").strip()
    intake_cap = payload.sanctioned_intake

    if not clean_code or not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Institution code and institution name are mandatory.",
        )

    if clean_code in INSTITUTIONS_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Institution code '{clean_code}' is already registered.",
        )

    new_inst = InstitutionSchema(
        id=f"inst_{uuid.uuid4().hex[:8]}",
        code=clean_code,
        name=clean_name,
        type=payload.type or "AICTE Approved Technical Institution",
        state=payload.state.strip(),
        city=payload.city.strip(),
        address=payload.address.strip() if payload.address else None,
        contact_email=payload.contact_email.strip() if payload.contact_email else None,
        contact_phone=payload.contact_phone.strip() if payload.contact_phone else None,
        status=payload.status or InstitutionStatusEnum.APPROVED,
        total_approved_intake=intake_cap,
        academic_session=session,
        created_at=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )

    INSTITUTIONS_DB[clean_code] = new_inst
    PROGRAMMES_DB[clean_code] = []

    # Log audit event
    actor_email = user.get("email") if user else "system@aicte.gov.in"
    actor_role = str(user.get("role")) if user else "auditor"
    log_audit_event(
        actor_email=actor_email,
        actor_role=actor_role,
        actor_institution=user.get("institute_id") or clean_code,
        action="INSTITUTION_CREATED",
        target_type="INSTITUTION",
        target_id=clean_code,
        details=(
            f"Created institution '{clean_name}' ({clean_code}) with session {session} "
            f"sanctioned intake of {intake_cap} seats. Note: Institutional configuration recorded."
        ),
        outcome="SUCCESS",
    )

    return get_institution_with_stats(clean_code, session=session)


@router.put("/{code}", response_model=InstitutionSchema)
def update_institution(
    code: str,
    payload: InstitutionUpdateRequest,
    authorization: Optional[str] = Header(None),
):
    """Updates institution attributes with authorization checks."""
    clean_code = code.strip().upper()
    _check_auth_and_scope(authorization, target_inst_code=clean_code)

    inst = INSTITUTIONS_DB.get(clean_code)
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution with code '{clean_code}' not found.",
        )

    if payload.name is not None and payload.name.strip():
        inst.name = payload.name.strip()
    if payload.type is not None and payload.type.strip():
        inst.type = payload.type.strip()
    if payload.state is not None and payload.state.strip():
        inst.state = payload.state.strip()
    if payload.city is not None and payload.city.strip():
        inst.city = payload.city.strip()
    if payload.address is not None:
        inst.address = payload.address.strip()
    if payload.contact_email is not None:
        inst.contact_email = payload.contact_email.strip()
    if payload.contact_phone is not None:
        inst.contact_phone = payload.contact_phone.strip()
    if payload.status is not None:
        inst.status = payload.status

    session = payload.academic_session or "2024-2028"
    if payload.sanctioned_intake is not None and payload.sanctioned_intake > 0:
        from app.database import get_db_context
        from app.orm_models import InstitutionIntakeORM
        with get_db_context() as db:
            rec = db.query(InstitutionIntakeORM).filter(
                InstitutionIntakeORM.institution_code.ilike(clean_code),
                InstitutionIntakeORM.academic_session == session,
            ).first()
            if rec:
                rec.sanctioned_intake = payload.sanctioned_intake
                rec.updated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
            else:
                db.add(InstitutionIntakeORM(
                    id=f"intake_{clean_code.lower().replace('-', '_')}_{uuid.uuid4().hex[:4]}",
                    institution_code=clean_code,
                    academic_session=session,
                    sanctioned_intake=payload.sanctioned_intake,
                    created_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
                ))
            db.commit()

    return get_institution_with_stats(clean_code, session=session)


@router.post("/{code}/intakes", response_model=InstitutionSchema)
def configure_institution_intake(
    code: str,
    payload: InstitutionIntakeConfigureRequest,
    authorization: Optional[str] = Header(None),
):
    """Configures or updates institution-level sanctioned intake for a specific academic session."""
    clean_code = code.strip().upper()
    user = _check_auth_and_scope(authorization, target_inst_code=clean_code)

    if clean_code not in INSTITUTIONS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution '{clean_code}' not found.",
        )

    session = payload.academic_session.strip()
    new_intake = payload.sanctioned_intake

    from app.database import get_db_context
    from app.orm_models import InstitutionIntakeORM
    prev_val = None
    with get_db_context() as db:
        rec = db.query(InstitutionIntakeORM).filter(
            InstitutionIntakeORM.institution_code.ilike(clean_code),
            InstitutionIntakeORM.academic_session == session,
        ).first()
        if rec:
            prev_val = rec.sanctioned_intake
            rec.sanctioned_intake = new_intake
            rec.updated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        else:
            db.add(InstitutionIntakeORM(
                id=f"intake_{clean_code.lower().replace('-', '_')}_{uuid.uuid4().hex[:4]}",
                institution_code=clean_code,
                academic_session=session,
                sanctioned_intake=new_intake,
                created_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
            ))
        db.commit()

    actor_email = user.get("email") if user else "system@aicte.gov.in"
    actor_role = str(user.get("role")) if user else "auditor"
    log_audit_event(
        actor_email=actor_email,
        actor_role=actor_role,
        actor_institution=user.get("institute_id") or clean_code,
        action="INSTITUTION_INTAKE_CONFIGURED",
        target_type="INSTITUTION",
        target_id=clean_code,
        details=(
            f"Configured sanctioned intake for institution {clean_code} in session {session}: "
            f"{new_intake} seats (Previous: {prev_val if prev_val is not None else 'None'})."
        ),
        outcome="SUCCESS",
    )

    return get_institution_with_stats(clean_code, session=session)


# --- Programme Management ---

@router.get("/{code}/programmes", response_model=List[InstitutionProgramme])
def list_programmes(code: str, authorization: Optional[str] = Header(None)):
    """Lists programmes for the specified institution, with live enrolled count."""
    clean_code = code.strip().upper()
    if clean_code not in INSTITUTIONS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution '{clean_code}' not found.",
        )

    programmes = PROGRAMMES_DB.get(clean_code, [])

    # Update intake_current dynamically from STUDENT_LEDGER
    result = []
    for prog in programmes:
        enrolled_count = sum(
            1 for s in STUDENT_LEDGER
            if s.institute_code.upper() == clean_code
            and (s.programme.strip().lower() == prog.name.strip().lower() or (prog.code and prog.code.lower() in s.programme.lower()))
        )
        p_copy = prog.model_copy()
        p_copy.intake_current = enrolled_count
        result.append(p_copy)

    return result


@router.post("/{code}/programmes", response_model=InstitutionProgramme, status_code=status.HTTP_201_CREATED)
def create_programme(
    code: str,
    payload: ProgrammeCreateRequest,
    authorization: Optional[str] = Header(None),
):
    """Creates a new programme under an institution."""
    clean_code = code.strip().upper()
    _check_auth_and_scope(authorization, target_inst_code=clean_code)

    if clean_code not in INSTITUTIONS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution '{clean_code}' not found.",
        )

    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Programme name cannot be empty.",
        )

    existing_progs = PROGRAMMES_DB.setdefault(clean_code, [])
    for p in existing_progs:
        if p.name.strip().lower() == clean_name.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Programme '{clean_name}' already exists for institution {clean_code}.",
            )

    new_prog = InstitutionProgramme(
        id=f"prog_{uuid.uuid4().hex[:8]}",
        institution_code=clean_code,
        name=clean_name,
        code=payload.code.strip() if payload.code else None,
        admission_year=payload.admission_year or "2024-2028",
        intake_cap=payload.intake_cap or 60,
        intake_current=0,
        status=payload.status or "active",
        created_at=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )

    existing_progs.append(new_prog)
    return new_prog


@router.put("/{code}/programmes/{prog_id}", response_model=InstitutionProgramme)
def update_programme(
    code: str,
    prog_id: str,
    payload: ProgrammeUpdateRequest,
    authorization: Optional[str] = Header(None),
):
    """Updates a programme under an institution."""
    clean_code = code.strip().upper()
    _check_auth_and_scope(authorization, target_inst_code=clean_code)

    programmes = PROGRAMMES_DB.get(clean_code, [])
    target = None
    for p in programmes:
        if p.id == prog_id or p.code == prog_id:
            target = p
            break

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Programme '{prog_id}' not found under institution {clean_code}.",
        )

    from app.database import get_db_context
    from app.orm_models import ProgrammeORM

    with get_db_context() as db:
        orm_prog = db.query(ProgrammeORM).filter(
            ProgrammeORM.institution_code.ilike(clean_code),
            (ProgrammeORM.id == prog_id) | (ProgrammeORM.code == prog_id),
        ).first()
        if orm_prog:
            if payload.name is not None and payload.name.strip():
                orm_prog.name = payload.name.strip()
                target.name = payload.name.strip()
            if payload.code is not None:
                orm_prog.code = payload.code.strip()
                target.code = payload.code.strip()
            if payload.admission_year is not None:
                orm_prog.admission_year = payload.admission_year.strip()
                target.admission_year = payload.admission_year.strip()
            if payload.intake_cap is not None:
                orm_prog.intake_cap = max(1, payload.intake_cap)
                target.intake_cap = max(1, payload.intake_cap)
            if payload.status is not None:
                orm_prog.status = payload.status
                target.status = payload.status
            db.commit()

    # Re-calculate dynamic enrolled count
    enrolled_count = sum(
        1 for s in STUDENT_LEDGER
        if s.institute_code.upper() == clean_code
        and (s.programme.strip().lower() == target.name.strip().lower() or (target.code and target.code.lower() in s.programme.lower()))
    )
    target.intake_current = enrolled_count
    return target


# --- Institution-Scoped Student Records ---

@router.get("/{code}/students", response_model=List[StudentRecordSchema])
def list_institution_students(
    code: str,
    search: Optional[str] = Query(None),
    programme: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
):
    """Returns student records enrolled in this specific institution, enforcing access control."""
    clean_code = code.strip().upper()
    _check_auth_and_scope(authorization, target_inst_code=clean_code)

    students = [s for s in STUDENT_LEDGER if s.institute_code.upper() == clean_code]

    if search:
        s_term = search.lower().strip()
        students = [
            s for s in students
            if s_term in s.student_name.lower()
            or s_term in s.apaar_id.lower()
            or (s.email and s_term in s.email.lower())
            or (s.enrollment_number and s_term in s.enrollment_number.lower())
        ]

    if programme:
        p_term = programme.lower().strip()
        students = [s for s in students if p_term in s.programme.lower()]

    return students


# --- Intake & Capacity Analytics for Institution ---

@router.get("/{code}/capacity")
def get_institution_capacity(code: str, authorization: Optional[str] = Header(None)):
    """Returns programme-level capacity utilization and warning status."""
    clean_code = code.strip().upper()
    _check_auth_and_scope(authorization, target_inst_code=clean_code)

    inst = get_institution_with_stats(clean_code)
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    progs = PROGRAMMES_DB.get(clean_code, [])
    program_breakdown = []

    for p in progs:
        enrolled = sum(
            1 for s in STUDENT_LEDGER
            if s.institute_code.upper() == clean_code
            and (s.programme.strip().lower() == p.name.strip().lower() or (p.code and p.code.lower() in s.programme.lower()))
        )
        util_pct = (enrolled / p.intake_cap * 100.0) if p.intake_cap > 0 else 0.0
        cap_status = "NORMAL"
        if enrolled > p.intake_cap:
            cap_status = "EXCEEDED"
        elif enrolled >= p.intake_cap * 0.9:
            cap_status = "NEAR_CAPACITY"

        program_breakdown.append({
            "programme_id": p.id,
            "programme_name": p.name,
            "programme_code": p.code,
            "admission_year": p.admission_year,
            "intake_cap": p.intake_cap,
            "intake_current": enrolled,
            "utilization_pct": round(util_pct, 1),
            "status": cap_status,
        })

    return {
        "institution_code": clean_code,
        "institution_name": inst.name,
        "total_approved_intake": inst.total_approved_intake,
        "total_enrolled": inst.current_enrolment,
        "overall_utilization_pct": inst.capacity_utilization_pct,
        "remaining_capacity": inst.remaining_capacity,
        "programme_allocations_total": inst.programme_allocations_total,
        "has_allocation_warning": inst.has_allocation_warning,
        "allocation_warning_message": inst.allocation_warning_message,
        "programmes": program_breakdown,
        "has_capacity_warnings": any(p["status"] == "EXCEEDED" for p in program_breakdown) or inst.has_allocation_warning,
    }


# --- Verification History Audit Trail ---

@router.get("/{code}/history")
def get_institution_history(code: str, authorization: Optional[str] = Header(None)):
    """Returns verification and audit trail for this institution."""
    clean_code = code.strip().upper()
    _check_auth_and_scope(authorization, target_inst_code=clean_code)

    students = [s for s in STUDENT_LEDGER if s.institute_code.upper() == clean_code]

    events = []
    for s in students:
        events.append({
            "id": f"evt_{s.id[:8]}",
            "apaar_id": s.apaar_id,
            "student_name": s.student_name,
            "programme": s.programme,
            "timestamp": s.created_at,
            "status": s.integrity_status.value,
            "merkle_root": s.merkle_root,
            "notes": s.notes,
        })

    return {
        "institution_code": clean_code,
        "total_records": len(events),
        "events": events,
    }
