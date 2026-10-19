import pytest
from app.services.apaar_adapter import SandboxAPAARAdapter
from app.services.integrity_engine import IntegrityEngine
from app.models import (
    IntegrityStatusEnum,
    UserRegisterRequest,
    UserLoginRequest,
    UserProfileUpdateRequest,
    StudentCreateRequest,
    RoleEnum,
)
from app.routes.auth import register, login, get_current_user, update_profile
from app.routes.students import add_student, list_students, clear_all_data, seed_demo_data
from app.routes.analytics import get_metrics
from fastapi import HTTPException


def test_apaar_format_validation():
    # Valid 12-char formatted APAAR
    assert SandboxAPAARAdapter.validate_format("9024-8172-5501-IN") is True
    assert SandboxAPAARAdapter.validate_format("902481725501") is True

    # Invalid too short ID
    assert SandboxAPAARAdapter.validate_format("12345") is False


def test_duplicate_collision_detection():
    existing_enrolments = [
        {
            "apaar_id": "3391-4412-8920-IN",
            "institute_code": "IND-MUMBAI-01",
            "institute_name": "Mumbai Tech University",
        }
    ]

    # Attempting to enrol the same student in Delhi Tech Campus
    result = IntegrityEngine.evaluate_student_integrity(
        apaar_id="3391-4412-8920-IN",
        student_name="Priya N. Kulkarni",
        institute_code="IND-DELHI-02",
        institute_name="Delhi Tech Campus",
        programme="B.Tech IT",
        admission_year="2024-2028",
        current_intake=50,
        intake_cap=60,
        existing_enrolments=existing_enrolments,
    )

    assert result.integrity_status == IntegrityStatusEnum.DUPLICATE
    assert "CRITICAL COLLISION" in result.notes


def test_intake_quota_exceeded_warning():
    result = IntegrityEngine.evaluate_student_integrity(
        apaar_id="7721-1049-3382-IN",
        student_name="Rohan M. Nair",
        institute_code="IND-BLR-01",
        institute_name="Southern Institute of Engineering",
        programme="B.Tech ECE",
        admission_year="2024-2028",
        current_intake=125,  # Exceeded cap
        intake_cap=120,
        existing_enrolments=[],
    )

    assert result.integrity_status == IntegrityStatusEnum.WARNING
    assert "INTAKE CAP EXCEEDED" in result.notes


def test_clean_student_verification():
    result = IntegrityEngine.evaluate_student_integrity(
        apaar_id="9024-8172-5501-IN",
        student_name="Aarav V. Suryavanshi",
        institute_code="IND-AICTE-1042",
        institute_name="IIT Delhi",
        programme="B.Tech CSE",
        admission_year="2023-2027",
        current_intake=120,
        intake_cap=120,
        existing_enrolments=[],
    )

    assert result.integrity_status == IntegrityStatusEnum.VERIFIED
    assert result.merkle_root is not None
    assert result.ecdsa_signature is not None


def test_auditor_self_assignment_prevention():
    req = UserRegisterRequest(
        aicte_id="1-9482103",
        institute_name="Test College",
        nodal_officer="Dr. Test",
        email="test_reg@test.edu",
        password="password123",
        region="Northern",
        requested_role=RoleEnum.AUDITOR,  # Prohibited self-assignment
    )

    with pytest.raises(HTTPException) as exc_info:
        register(req)

    assert exc_info.value.status_code == 403
    assert "AICTE Central Regulator accounts cannot be self-provisioned" in exc_info.value.detail


def test_auth_login_valid_and_invalid():
    # Valid login
    res = login(UserLoginRequest(email="admin@aicte.gov.in", password="AdminPass@2026"))
    assert res.email == "admin@aicte.gov.in"
    assert res.role == RoleEnum.AUDITOR
    assert res.token is not None

    # Invalid password
    with pytest.raises(HTTPException) as exc_info:
        login(UserLoginRequest(email="admin@aicte.gov.in", password="WrongPassword!"))
    assert exc_info.value.status_code == 401

    # Unregistered account
    with pytest.raises(HTTPException) as exc_info2:
        login(UserLoginRequest(email="unknown_person@random.com", password="Pass"))
    assert exc_info2.value.status_code == 401


def test_profile_update_and_me():
    login_res = login(UserLoginRequest(email="verifier@institute.edu", password="VerifyPass@2026"))
    auth_header = f"Bearer {login_res.token}"

    # Get profile
    me = get_current_user(authorization=auth_header)
    assert me.email == "verifier@institute.edu"

    # Update profile
    updated = update_profile(
        payload=UserProfileUpdateRequest(full_name="Prof. Meera D.", phone="+91 9999999999"),
        authorization=auth_header,
    )
    assert updated.full_name == "Prof. Meera D."
    assert updated.phone == "+91 9999999999"


def test_student_ledger_operations_and_metrics():
    # Reset to demo
    seed_demo_data()
    metrics = get_metrics()
    assert metrics["total_students"] == 5
    assert metrics["is_empty"] is False

    # Clear ledger
    clear_all_data()
    empty_metrics = get_metrics()
    assert empty_metrics["total_students"] == 0
    assert empty_metrics["is_empty"] is True

    # Add single student
    add_student(
        StudentCreateRequest(
            apaar_id="1111-2222-3333-IN",
            student_name="Test Student",
            institute_code="IND-AICTE-1042",
            institute_name="Delhi Institute of Technology",
            programme="B.Tech Data Science",
            admission_year="2024-2028",
            intake_current=30,
            intake_cap=60,
        )
    )
    new_metrics = get_metrics()
    assert new_metrics["total_students"] == 1
    assert new_metrics["verified_count"] == 1
    assert new_metrics["is_empty"] is False

from app.routes.imports import process_batch_manifest
from app.routes.students import get_student_by_identifier

def test_csv_manifest_import_six_fictional_records():
    # Clear ledger first
    clear_all_data()

    # The 6 fictional students matching user's exact specification
    records = [
        {
            "student_name": "Aarav V. Suryavanshi",
            "email": "aarav.surya@dit.ac.in",
            "institution_name": "Delhi Institute of Technology",
            "institution_code": "IND-AICTE-1042",
            "course": "B.Tech Computer Science",
            "academic_year": "2024-2028",
            "apaar_id": "9024-8172-5501-IN",
            "enrollment_number": "ENR-2024-001",
            "verification_status": "pending",
        },
        {
            "student_name": "Priya N. Kulkarni",
            "email": "priya.k@mtu.edu.in",
            "institution_name": "Mumbai Technical University",
            "institution_code": "IND-AICTE-3391",
            "course": "B.Tech Information Technology",
            "academic_year": "2024-2028",
            "apaar_id": "3391-4412-8920-IN",
            "enrollment_number": "ENR-2024-002",
            "verification_status": "pending",
        },
        {
            "student_name": "Rohan M. Nair",
            "email": "rohan.nair@sie.ac.in",
            "institution_name": "Southern Institute of Engineering",
            "institution_code": "IND-AICTE-4891",
            "course": "B.Tech Electronics & Communication",
            "academic_year": "2024-2028",
            "apaar_id": "7721-1049-3382-IN",
            "enrollment_number": "ENR-2024-003",
            "verification_status": "pending",
        },
        {
            "student_name": "Ananya S. Iyer",
            "email": "ananya.iyer@nitt.edu",
            "institution_name": "National Institute of Technology Trichy",
            "institution_code": "IND-AICTE-2204",
            "course": "B.Tech Mechanical Engineering",
            "academic_year": "2024-2028",
            "apaar_id": "5512-9014-2281-IN",
            "enrollment_number": "ENR-2024-004",
            "verification_status": "pending",
        },
        {
            "student_name": "Vikramaditya Rao",
            "email": "vikram.rao@kec.edu.in",
            "institution_name": "Kolkata Engineering College",
            "institution_code": "IND-AICTE-3109",
            "course": "B.Tech Electrical & Electronics",
            "academic_year": "2024-2028",
            "apaar_id": "8834-1120-7463-IN",
            "enrollment_number": "ENR-2024-005",
            "verification_status": "pending",
        },
        {
            "student_name": "Meera Sundaram",
            "email": "meera.s@dit.ac.in",
            "institution_name": "Delhi Institute of Technology",
            "institution_code": "IND-AICTE-1042",
            "course": "B.Tech Artificial Intelligence",
            "academic_year": "2024-2028",
            "apaar_id": "1102-4490-7812-IN",
            "enrollment_number": "ENR-2024-006",
            "verification_status": "pending",
        },
    ]

    summary = process_batch_manifest(records)

    # 1. Verify summary counts
    assert summary.total_records == 6
    assert summary.created == 6
    assert summary.updated == 0
    assert summary.skipped == 0
    assert len(summary.errors) == 0

    # 2. Verify ledger persistence
    ledger_students = list_students()
    assert len(ledger_students) == 6

    # 3. Verify get_student_by_identifier with record ID and APAAR ID
    first_student = ledger_students[0]
    by_apaar = get_student_by_identifier(first_student.apaar_id)
    assert by_apaar.apaar_id == first_student.apaar_id
    assert by_apaar.student_name == first_student.student_name

    by_id = get_student_by_identifier(first_student.id)
    assert by_id.id == first_student.id

    # 4. Verify all 9 fields exist and are populated
    for rec in ledger_students:
        assert rec.student_name
        assert rec.email
        assert "@" in rec.email
        assert rec.institution_name
        assert rec.institution_code
        assert rec.course
        assert rec.academic_year
        assert rec.apaar_id
        assert rec.enrollment_number
        assert rec.enrollment_number.startswith("ENR-")
        assert rec.verification_status is not None


def test_csv_reimport_update_policy():
    # Re-importing with updated email and course for Aarav
    update_records = [
        {
            "student_name": "Aarav V. Suryavanshi",
            "email": "aarav.updated@dit.ac.in",
            "institution_name": "Delhi Institute of Technology",
            "institution_code": "IND-AICTE-1042",
            "course": "B.Tech CS (AI & ML)",
            "academic_year": "2024-2028",
            "apaar_id": "9024-8172-5501-IN",
            "enrollment_number": "ENR-2024-001-REV",
            "verification_status": "pending",
        }
    ]

    summary = process_batch_manifest(update_records)
    assert summary.total_records == 1
    assert summary.updated == 1
    assert summary.created == 0

    # Verify updated fields on the student in ledger
    updated = get_student_by_identifier("9024-8172-5501-IN")
    assert updated.email == "aarav.updated@dit.ac.in"
    assert updated.course == "B.Tech CS (AI & ML)"
    assert updated.programme == "B.Tech CS (AI & ML)"
    assert updated.enrollment_number == "ENR-2024-001-REV"
    assert updated.updated_at is not None


def test_csv_invalid_records_handling():
    invalid_batch = [
        {
            "student_name": "",  # Missing name
            "email": "test@test.edu",
            "institution_name": "College",
            "institution_code": "IND-AICTE-1042",
            "course": "B.Tech",
            "academic_year": "2024",
            "apaar_id": "9999-0000-1111-IN",
            "enrollment_number": "ENR-1",
        },
        {
            "student_name": "Invalid APAAR Candidate",
            "email": "test2@test.edu",
            "institution_name": "College",
            "institution_code": "IND-AICTE-1042",
            "course": "B.Tech",
            "academic_year": "2024",
            "apaar_id": "BAD-ID-123",  # Invalid format
            "enrollment_number": "ENR-2",
        },
        {
            "student_name": "Valid Candidate",
            "email": "valid@dit.ac.in",
            "institution_name": "Delhi Institute of Technology",
            "institution_code": "IND-AICTE-1042",
            "course": "B.Tech IT",
            "academic_year": "2024-2028",
            "apaar_id": "2233-4455-6677-IN",
            "enrollment_number": "ENR-VALID",
        },
    ]

    summary = process_batch_manifest(invalid_batch)
    assert summary.total_records == 3
    assert summary.skipped == 2
    assert summary.created == 1
    assert len(summary.errors) == 2
    assert "Missing student name" in summary.errors[0]
    assert "Invalid APAAR identifier format" in summary.errors[1]

    # Reset to demo data for subsequent tests
    seed_demo_data()

