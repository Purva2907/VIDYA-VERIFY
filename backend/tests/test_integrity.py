import pytest
from app.services.apaar_adapter import SandboxAPAARAdapter
from app.services.integrity_engine import IntegrityEngine
from app.models import IntegrityStatusEnum, UserRegisterRequest, RoleEnum
from app.routes.auth import register
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
        email="test@test.edu",
        password="password123",
        region="Northern",
        requested_role=RoleEnum.AUDITOR,  # Prohibited self-assignment
    )

    with pytest.raises(HTTPException) as exc_info:
        register(req)

    assert exc_info.value.status_code == 403
    assert "AICTE Central Regulator accounts cannot be self-provisioned" in exc_info.value.detail
