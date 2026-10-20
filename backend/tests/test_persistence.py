import os
import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, SessionLocal, get_db_context, DATABASE_URL
from app.orm_models import (
    UserORM,
    InstitutionORM,
    ProgrammeORM,
    StudentRecordORM,
    IntegrityFindingORM,
    AuditEventORM,
)
from app.models import (
    UserLoginRequest,
    InstitutionCreateRequest,
    ProgrammeCreateRequest,
    FindingReviewRequest,
    ReviewStatusEnum,
    RoleEnum,
)
from app.routes.auth import login
from app.routes.institutions import create_institution, create_programme, get_institution_capacity
from app.routes.imports import process_batch_manifest
from app.routes.findings import review_finding
from app.db import (
    log_audit_event,
    get_institution_with_stats,
    hash_password,
    INSTITUTIONS_DB,
    STUDENT_LEDGER,
    INTEGRITY_FINDINGS_DB,
)


def test_institution_persistence_across_new_sessions():
    """1. Create an institution & programme, close session, open new session to confirm persistence."""
    admin_login = login(UserLoginRequest(email="admin@demo.vidyaverify.local", password="AdminPass@2026"))
    admin_auth = f"Bearer {admin_login.token}"

    test_code = f"IND-AICTE-PERSIST-{uuid.uuid4().hex[:4].upper()}"

    # Create via API route
    new_inst = create_institution(
        InstitutionCreateRequest(
            code=test_code,
            name="Hyderabad Institute of Research & Technology",
            type="Deemed Technical University",
            state="Telangana",
            city="Hyderabad",
            contact_email="registrar@hirt.ac.in",
            contact_phone="+91 40 2345 6789",
            sanctioned_intake=240,
            academic_session="2024-2028",
        ),
        authorization=admin_auth,
    )
    assert new_inst.code == test_code

    new_prog = create_programme(
        code=test_code,
        payload=ProgrammeCreateRequest(
            name="M.Tech Data Engineering",
            code="MTECH-DATA",
            admission_year="2024-2026",
            intake_cap=45,
        ),
        authorization=admin_auth,
    )
    assert new_prog.name == "M.Tech Data Engineering"

    # Completely fresh, isolated session directly from SessionLocal
    session2 = SessionLocal()
    try:
        inst_db = session2.query(InstitutionORM).filter(InstitutionORM.code == test_code).first()
        assert inst_db is not None
        assert inst_db.name == "Hyderabad Institute of Research & Technology"
        assert inst_db.city == "Hyderabad"
        assert inst_db.state == "Telangana"

        # Verify relational programme
        progs_db = session2.query(ProgrammeORM).filter(ProgrammeORM.institution_code == test_code).all()
        assert len(progs_db) == 1
        assert progs_db[0].name == "M.Tech Data Engineering"
        assert progs_db[0].intake_cap == 45
    finally:
        session2.close()

    # Clean up test institution
    if test_code in INSTITUTIONS_DB:
        del INSTITUTIONS_DB[test_code]


def test_import_all_supported_fields_persist_in_db():
    """2. Import sample AICTE CSV records and confirm every supported field persists in database."""
    sample_apaar = f"9988-7766-{uuid.uuid4().hex[:4].upper()}-IN"
    sample_records = [
        {
            "apaar_id": sample_apaar,
            "student_name": "Divya R. Chandran",
            "email": "divya.chandran@dit.ac.in",
            "enrollment_number": "ENR-HYD-8821",
            "dob": "2005-07-19",
            "category": "OBC",
            "gender": "Female",
            "institution_code": "IND-AICTE-1042",
            "institution_name": "Delhi Institute of Technology",
            "course": "B.Tech Computer Science & AI",
            "academic_year": "2024-2028",
            "verification_status": "verified",
            "intake_current": 120,
            "intake_cap": 120,
            "notes": "Verified candidate with validated demographic credentials.",
        }
    ]

    summary = process_batch_manifest(sample_records)
    assert summary.created >= 1 or summary.updated >= 1

    # Verify physical persistence in database table
    session = SessionLocal()
    try:
        student = session.query(StudentRecordORM).filter(StudentRecordORM.apaar_id == sample_apaar).first()
        assert student is not None
        assert student.student_name == "Divya R. Chandran"
        assert student.email == "divya.chandran@dit.ac.in"
        assert student.enrollment_number == "ENR-HYD-8821"
        assert student.dob == "2005-07-19"
        assert student.category == "OBC"
        assert student.gender == "Female"
        assert student.institute_code == "IND-AICTE-1042"
        assert student.programme == "B.Tech Computer Science & AI"
        assert student.admission_year == "2024-2028"
        assert student.intake_cap == 120
    finally:
        session.close()


def test_persistence_across_app_engine_recreation():
    """3. Simulate restart by disposing engine and recreating a fresh sessionmaker on the same DB."""
    test_apaar = f"1122-3344-{uuid.uuid4().hex[:4].upper()}-IN"
    test_records = [
        {
            "apaar_id": test_apaar,
            "student_name": "Kavita S. Joshi",
            "email": "kavita.joshi@mtu.edu.in",
            "enrollment_number": "ENR-MUM-4402",
            "institution_code": "IND-AICTE-3391",
            "institution_name": "Mumbai Technical University",
            "course": "B.Tech Information Technology",
            "academic_year": "2024-2028",
            "category": "General",
            "gender": "Female",
            "dob": "2005-09-12",
        }
    ]
    process_batch_manifest(test_records)

    # Recreate engine & sessionmaker pointing to the exact same persistent database
    fresh_engine = create_engine(DATABASE_URL)
    FreshSession = sessionmaker(autocommit=False, autoflush=False, bind=fresh_engine)

    db = FreshSession()
    try:
        reloaded_student = db.query(StudentRecordORM).filter(StudentRecordORM.apaar_id == test_apaar).first()
        assert reloaded_student is not None
        assert reloaded_student.student_name == "Kavita S. Joshi"
        assert reloaded_student.email == "kavita.joshi@mtu.edu.in"
        assert reloaded_student.category == "General"
    finally:
        db.close()
        fresh_engine.dispose()


def test_findings_and_review_decisions_persist_in_db():
    """4. Confirm findings and review decisions persist across sessions."""
    admin_login = login(UserLoginRequest(email="admin@demo.vidyaverify.local", password="AdminPass@2026"))
    admin_auth = f"Bearer {admin_login.token}"

    finding_id = f"FND-TEST-{uuid.uuid4().hex[:6].upper()}"
    finding_obj = {
        "id": finding_id,
        "finding_type": "DUPLICATE_CONCURRENT_ENROLMENT",
        "severity": "CRITICAL",
        "apaar_id_masked": "5500-••••-••••-9900-IN",
        "apaar_id": "5500-1100-2200-9900-IN",
        "student_name": "Siddharth Verma",
        "primary_institute_code": "IND-AICTE-1042",
        "primary_institute_name": "Delhi Institute of Technology",
        "programme": "B.Tech Computer Science & AI",
        "admission_year": "2024-2028",
        "affected_record_ids": ["REC-TEST-01"],
        "reason": "Test duplicate collision finding.",
        "review_status": "PENDING_REVIEW",
        "detection_timestamp": "2026-10-20 12:00:00",
    }

    # Insert into database proxy
    from app.models import IntegrityFindingSchema
    INTEGRITY_FINDINGS_DB[finding_id] = IntegrityFindingSchema(**finding_obj)

    # Submit official review
    review_res = review_finding(
        finding_id=finding_id,
        payload=FindingReviewRequest(
            status=ReviewStatusEnum.RESOLVED_CONFIRMED_VIOLATION,
            decision="CONFIRMED_CONCURRENT_ENROLMENT",
            notes="Institutional review confirmed active dual enrolment violation.",
        ),
        authorization=admin_auth,
    )
    assert review_res.review_status == ReviewStatusEnum.RESOLVED_CONFIRMED_VIOLATION

    # Open completely separate session to verify DB persistence
    session = SessionLocal()
    try:
        f_db = session.query(IntegrityFindingORM).filter(IntegrityFindingORM.id == finding_id).first()
        assert f_db is not None
        assert f_db.review_status == "RESOLVED_CONFIRMED_VIOLATION"
        assert f_db.review_decision == "CONFIRMED_CONCURRENT_ENROLMENT"
        assert "Institutional review confirmed" in f_db.review_notes
        assert f_db.reviewed_by is not None
        assert f_db.reviewed_at is not None
    finally:
        session.close()


def test_audit_events_persist_in_db():
    """5. Confirm audit events persist in database."""
    unique_action = f"CUSTOM_AUDIT_ACTION_{uuid.uuid4().hex[:6].upper()}"
    event = log_audit_event(
        actor_email="auditor.specialist@aicte.gov.in",
        actor_role="auditor",
        actor_institution="IND-AICTE-HQ",
        action=unique_action,
        target_type="COMPLIANCE_INSPECTION",
        target_id="INSPECT-2026-99",
        details="Autonomous data integrity validation run.",
        outcome="SUCCESS",
    )
    assert event.action == unique_action

    session = SessionLocal()
    try:
        db_event = session.query(AuditEventORM).filter(AuditEventORM.action == unique_action).first()
        assert db_event is not None
        assert db_event.actor_email == "auditor.specialist@aicte.gov.in"
        assert db_event.target_type == "COMPLIANCE_INSPECTION"
        assert db_event.outcome == "SUCCESS"
    finally:
        session.close()


def test_auth_and_institution_scoping_persist_in_db():
    """6. Confirm authentication and institution scoping persist in database."""
    test_email = f"officer_{uuid.uuid4().hex[:6]}@campus.ac.in"
    password = "CampusSecurePass@2026"

    # Create user in database
    session = SessionLocal()
    try:
        user = UserORM(
            id=f"usr_{uuid.uuid4().hex[:8]}",
            email=test_email,
            password_hash=hash_password(password),
            full_name="Dr. Rajeshwari Sharma",
            role=RoleEnum.NODE.value,
            institute_id="IND-AICTE-3391",
            institute_name="Mumbai Technical University",
            created_at="2026-10-20",
            token=f"token_test_{uuid.uuid4().hex[:8]}",
        )
        session.add(user)
        session.commit()
    finally:
        session.close()

    # Authenticate through API route
    login_res = login(UserLoginRequest(email=test_email, password=password))
    assert login_res.email == test_email
    assert login_res.role == RoleEnum.NODE
    assert login_res.institute_id == "IND-AICTE-3391"
    assert login_res.token is not None


def test_failed_import_transactional_rollback():
    """7. Confirm failed imports roll back cleanly without leaving partial state."""
    pre_count = len(STUDENT_LEDGER)

    # Execute a transaction that encounters a failure midway
    with pytest.raises(Exception):
        with get_db_context() as db:
            # Add valid student 1
            db.add(StudentRecordORM(
                id=f"REC-ROLLBACK-01-{uuid.uuid4().hex[:4]}",
                apaar_id=f"9000-0000-{uuid.uuid4().hex[:4]}-IN",
                apaar_id_norm="90000000IN",
                student_name="Rollback Candidate 1",
                institute_code="IND-AICTE-1042",
                institute_name="Delhi Institute of Technology",
                programme="B.Tech Computer Science",
                admission_year="2024-2028",
                integrity_status="pending",
                verification_status="pending",
                intake_current=1,
                intake_cap=60,
                created_at="2026-10-20",
            ))
            db.flush()

            # Trigger deliberate database integrity failure (missing mandatory not-null field)
            db.add(StudentRecordORM(
                id=f"REC-ROLLBACK-02-{uuid.uuid4().hex[:4]}",
                apaar_id=None,  # NOT NULL constraint violation!
                apaar_id_norm=None,
                student_name="Invalid Candidate",
                institute_code="IND-AICTE-1042",
                institute_name="Delhi Institute of Technology",
                programme="B.Tech",
                admission_year="2024",
                created_at="2026-10-20",
            ))
            db.commit()

    # Verify that Rollback Candidate 1 was NOT persisted
    post_count = len(STUDENT_LEDGER)
    assert post_count == pre_count

    session = SessionLocal()
    try:
        orphaned = session.query(StudentRecordORM).filter(StudentRecordORM.student_name == "Rollback Candidate 1").first()
        assert orphaned is None
    finally:
        session.close()
