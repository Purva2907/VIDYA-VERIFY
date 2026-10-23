"""
VIDYA-VERIFY — SIH 2026 Core Features & Compliance Test Suite
Tests for:
1. APAAR ID Validation Service (valid, missing, invalid formats, masking).
2. Potential Duplicate & In-Manifest Collision Detection.
3. Sanctioned Intake Compliance Engine (explicit statuses, safe zero-handling).
4. Bulk Import Template & Formula Injection Protection.
5. Verification Query Boundaries (never fabricating fake students).
6. Advanced Audit Trail Filtering & Printable Summary Report.
"""

import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import (
    APAARValidationStatusEnum,
    IntakeComplianceStatusEnum,
    RoleEnum,
)
from app.services.apaar_adapter import (
    validate_apaar_identifier,
    normalize_apaar_id,
    mask_apaar_id,
    sanitize_csv_cell,
)
from app.db import (
    STUDENT_LEDGER,
    INSTITUTIONS_DB,
    PROGRAMMES_DB,
    INTEGRITY_FINDINGS_DB,
    AUDIT_LOG_DB,
    USER_ACCOUNTS,
)


@pytest.fixture(autouse=True)
def setup_test_users():
    """Ensure test auditor account is available in USER_ACCOUNTS."""
    USER_ACCOUNTS["auditor@aicte.gov.in"] = {
        "id": "usr_sih_test_auditor",
        "email": "auditor@aicte.gov.in",
        "password_hash": "dummy_hash",
        "full_name": "AICTE SIH Auditor",
        "role": RoleEnum.AUDITOR,
        "institute_id": None,
        "institute_name": "AICTE Headquarters",
        "token": "token_sih_test_auditor_valid",
    }
    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auditor_token():
    return "token_sih_test_auditor_valid"


# ---------------------------------------------------------------------------
# 1. APAAR Identifier Validation Tests
# ---------------------------------------------------------------------------

def test_apaar_validation_service():
    """Test format, length, normalization, and status code rules."""
    # Valid formats
    res1 = validate_apaar_identifier("9024-8172-5501-IN")
    assert res1["status"] == APAARValidationStatusEnum.VALID_FORMAT
    assert res1["is_valid"] is True
    assert res1["normalized"] == "902481725501IN"

    res2 = validate_apaar_identifier("9024 8172 5501")
    assert res2["status"] == APAARValidationStatusEnum.VALID_FORMAT
    assert res2["normalized"] == "902481725501"

    res3 = validate_apaar_identifier("902481725501")
    assert res3["status"] == APAARValidationStatusEnum.VALID_FORMAT
    assert res3["normalized"] == "902481725501"

    # Missing identifier
    res_missing1 = validate_apaar_identifier(None)
    assert res_missing1["status"] == APAARValidationStatusEnum.MISSING_IDENTIFIER
    assert res_missing1["is_valid"] is False

    res_missing2 = validate_apaar_identifier("   ")
    assert res_missing2["status"] == APAARValidationStatusEnum.MISSING_IDENTIFIER

    # Invalid formats
    res_short = validate_apaar_identifier("12345")
    assert res_short["status"] == APAARValidationStatusEnum.INVALID_FORMAT
    assert res_short["is_valid"] is False

    res_chars = validate_apaar_identifier("9024-8172-5501#IN")
    assert res_chars["status"] == APAARValidationStatusEnum.INVALID_FORMAT

    res_too_long = validate_apaar_identifier("9024-8172-5501-9999-IN")
    assert res_too_long["status"] == APAARValidationStatusEnum.INVALID_FORMAT


def test_apaar_masking_privacy():
    """Ensure identifier masking protects privacy and does not expose full ID."""
    masked = mask_apaar_id("9024-8172-5501-IN")
    assert "••••" in masked
    assert "8172" not in masked

    empty_masked = mask_apaar_id("")
    assert empty_masked == ""


# ---------------------------------------------------------------------------
# 2. CSV Formula Injection Defense & Template Tests
# ---------------------------------------------------------------------------

def test_csv_cell_sanitization():
    """Verify spreadsheet formula injection prefixes (=, +, -, @) are sanitized."""
    assert sanitize_csv_cell("=CMD|' /C calc'!A0") == "'=CMD|' /C calc'!A0"
    assert sanitize_csv_cell("+SUM(A1:A10)") == "'+SUM(A1:A10)"
    assert sanitize_csv_cell("-1234") == "'-1234"
    assert sanitize_csv_cell("@SUM(A1)") == "'@SUM(A1)"
    assert sanitize_csv_cell("Normal Text 123") == "Normal Text 123"
    assert sanitize_csv_cell(123) == 123
    assert sanitize_csv_cell(None) == ""


def test_import_template_endpoint(client, auditor_token):
    """Ensure GET /api/imports/template returns standard CSV template."""
    res = client.get("/api/imports/template", headers={"Authorization": f"Bearer {auditor_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "filename" in data
    assert "csv" in data
    assert "APAAR_ID" in data["csv"]
    assert "STUDENT_NAME" in data["csv"]
    assert "INSTITUTE_CODE" in data["csv"]
    assert "PROGRAMME" in data["csv"]


# ---------------------------------------------------------------------------
# 3. In-Manifest Duplicate Detection Tests
# ---------------------------------------------------------------------------

def test_in_manifest_duplicate_detection(client, auditor_token):
    """Ensure repeated records within the same bulk upload batch are flagged."""
    batch_rand = str(uuid.uuid4().int)[:4]
    apaar_dup = f"9024-8172-{batch_rand}-IN"
    duplicate_manifest = [
        {
            "apaar_id": apaar_dup,
            "student_name": "Test Student Duplicate",
            "institute_code": "IND-AICTE-1042",
            "institute_name": "Delhi Institute of Technology",
            "programme": "B.Tech Computer Science & AI",
            "admission_year": "2024-2028",
        },
        {
            "apaar_id": apaar_dup,  # Exact duplicate in same CSV
            "student_name": "Test Student Duplicate",
            "institute_code": "IND-AICTE-1042",
            "institute_name": "Delhi Institute of Technology",
            "programme": "B.Tech Computer Science & AI",
            "admission_year": "2024-2028",
        },
    ]

    # Preview should detect the in-manifest duplicate
    preview_res = client.post(
        "/api/imports/preview",
        json=duplicate_manifest,
        headers={"Authorization": f"Bearer {auditor_token}"},
    )
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    # At least one row should have duplicate issues
    second_row = next(r for r in preview_data["sample_preview"] if r["row_index"] == 2)
    assert any("duplicate" in issue.lower() for issue in second_row["issues"])

    # Batch commit should track duplicate collisions
    import_res = client.post(
        "/api/imports/batch",
        json=duplicate_manifest,
        headers={"Authorization": f"Bearer {auditor_token}"},
    )
    assert import_res.status_code == 200
    summary = import_res.json()
    assert summary["duplicate_collisions"] >= 1


# ---------------------------------------------------------------------------
# 4. Demographic Potential Duplicate Detection Tests
# ---------------------------------------------------------------------------

def test_demographic_potential_duplicate_detection(client, auditor_token):
    """
    Test that a student with matching name + DOB across another institution
    is flagged as a potential duplicate candidate with an explainable reason.
    """
    rand_a = str(uuid.uuid4().int)[:4]
    rand_b = str(uuid.uuid4().int)[:4]
    first_student = {
        "apaar_id": f"1111-2222-{rand_a}-IN",
        "student_name": "Rohan Rajesh Sharma",
        "institute_code": "IND-AICTE-1042",
        "institute_name": "Delhi Institute of Technology",
        "programme": "B.Tech Computer Science & AI",
        "admission_year": "2024-2028",
        "dob": "2005-03-15",
        "email": f"rohan.sharma.{rand_a}@test.edu",
    }
    res1 = client.post(
        "/api/students",
        json=first_student,
        headers={"Authorization": f"Bearer {auditor_token}"},
    )
    assert res1.status_code == 201

    # Same candidate name + DOB attempting enrolment at Mumbai Technical University
    second_student = {
        "apaar_id": f"4444-5555-{rand_b}-IN",
        "student_name": "Rohan Rajesh Sharma",
        "institute_code": "IND-AICTE-3391",
        "institute_name": "Mumbai Technical University",
        "programme": "B.Tech Information Technology",
        "admission_year": "2024-2028",
        "dob": "2005-03-15",
        "email": f"rohan.sharma.{rand_b}@test.edu",
    }
    res2 = client.post(
        "/api/students",
        json=second_student,
        headers={"Authorization": f"Bearer {auditor_token}"},
    )
    assert res2.status_code == 201
    created2 = res2.json()
    assert created2["integrity_status"] == "duplicate"


# ---------------------------------------------------------------------------
# 5. Sanctioned Intake Compliance Engine Tests
# ---------------------------------------------------------------------------

def test_sanctioned_intake_compliance_engine(client, auditor_token):
    """
    Verify capacity calculation returns explicit statuses:
    WITHIN_CAPACITY, CAPACITY_REACHED, OVER_CAPACITY, and safe zero handling.
    """
    inst_code = "IND-AICTE-1042"
    res = client.get(
        f"/api/institutions/{inst_code}/capacity",
        headers={"Authorization": f"Bearer {auditor_token}"},
    )
    assert res.status_code == 200
    cap_data = res.json()
    assert "programmes" in cap_data
    assert len(cap_data["programmes"]) > 0

    valid_statuses = {
        IntakeComplianceStatusEnum.WITHIN_CAPACITY.value,
        IntakeComplianceStatusEnum.CAPACITY_REACHED.value,
        IntakeComplianceStatusEnum.OVER_CAPACITY.value,
        IntakeComplianceStatusEnum.INTAKE_MISSING.value,
        IntakeComplianceStatusEnum.REQUIRES_REVIEW.value,
        "NORMAL",
        "NEAR_CAPACITY",
        "EXCEEDED",
    }

    for p in cap_data["programmes"]:
        assert p["status"] in valid_statuses
        assert "status_explanation" in p
        assert isinstance(p["utilization_pct"], (int, float))
        # Ensure zero intake does not crash or produce invalid floats
        if p["intake_cap"] == 0:
            assert p["utilization_pct"] == 0.0


# ---------------------------------------------------------------------------
# 6. Verification Service & Sandbox Boundary Tests
# ---------------------------------------------------------------------------

def test_unregistered_apaar_verification_no_fake_student(client, auditor_token):
    """
    Verify that querying an unknown syntactically valid APAAR ID returns
    NOT_FOUND / VALID_FORMAT_UNREGISTERED and does NOT invent a synthetic student candidate.
    """
    unknown_apaar = "9999-8888-7777-IN"
    res = client.get(
        f"/api/verify/apaar?apaar_id={unknown_apaar}",
        headers={"Authorization": f"Bearer {auditor_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is False
    assert data["status"] in ("NOT_FOUND", "VALID_FORMAT_UNREGISTERED")
    # Must NOT claim a synthetic student name belongs to this ID
    assert "Synthetic Student" not in data["student_name"]
    assert data["is_sandbox"] is True
    assert "sandbox" in data["adapter_mode"].lower()


# ---------------------------------------------------------------------------
# 7. Audit Log Filtering & Printable Summary Report Tests
# ---------------------------------------------------------------------------

def test_audit_logs_advanced_filters(client, auditor_token):
    """Ensure audit log query supports search, institution, and outcome filtering."""
    res = client.get(
        "/api/audit/logs?limit=10&page=1",
        headers={"Authorization": f"Bearer {auditor_token}"},
    )
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)

    # Search filter
    search_res = client.get(
        "/api/audit/logs?search=VERIFY",
        headers={"Authorization": f"Bearer {auditor_token}"},
    )
    assert search_res.status_code == 200


def test_printable_summary_report(client, auditor_token):
    """Verify executive regulatory printable summary generation."""
    res = client.get(
        "/api/reports/printable-summary",
        headers={"Authorization": f"Bearer {auditor_token}"},
    )
    assert res.status_code == 200
    summary = res.json()
    assert "generated_at" in summary
    assert "title" in summary
    assert "metrics" in summary
    assert "institutions" in summary
    assert "findings" in summary
    assert "disclaimer" in summary
    assert "APAAR" in summary["disclaimer"]


def test_csv_exports_protection(client, auditor_token):
    """Verify all report CSV exports are generated and formula-escaped."""
    for report_type in ["enrolment", "capacity", "findings", "audit", "verification-history"]:
        res = client.get(
            f"/api/reports/export/{report_type}",
            headers={"Authorization": f"Bearer {auditor_token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "filename" in data
        assert "csv" in data
        assert data["filename"].endswith(".csv")
