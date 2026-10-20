import io
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db import (
    STUDENT_LEDGER,
    INSTITUTIONS_DB,
    PROGRAMMES_DB,
    USER_ACCOUNTS,
    hash_password,
)
from app.models import RoleEnum
from app.database import get_db_context
from app.orm_models import InstitutionIntakeORM, StudentRecordORM, InstitutionORM

client = TestClient(app)

REGULATOR_TOKEN = "token_regulator_intake_test"
NODE_A_TOKEN = "token_node_a_intake_test"
NODE_B_TOKEN = "token_node_b_intake_test"
STUDENT_TOKEN = "token_student_intake_test"

REGULATOR_HEADERS = {"Authorization": f"Bearer {REGULATOR_TOKEN}"}
NODE_A_HEADERS = {"Authorization": f"Bearer {NODE_A_TOKEN}"}
NODE_B_HEADERS = {"Authorization": f"Bearer {NODE_B_TOKEN}"}
STUDENT_HEADERS = {"Authorization": f"Bearer {STUDENT_TOKEN}"}


@pytest.fixture(autouse=True)
def setup_test_users():
    """Sets up test authentication accounts."""
    USER_ACCOUNTS["regulator.intake@aicte.gov.in"] = {
        "id": "usr_reg_intake",
        "email": "regulator.intake@aicte.gov.in",
        "password_hash": hash_password("RegPass123!"),
        "full_name": "AICTE Central Auditor",
        "role": RoleEnum.AUDITOR,
        "institute_id": None,
        "institute_name": "AICTE Headquarters",
        "token": REGULATOR_TOKEN,
    }

    USER_ACCOUNTS["nodal.a.intake@campus-a.ac.in"] = {
        "id": "usr_node_a_intake",
        "email": "nodal.a.intake@campus-a.ac.in",
        "password_hash": hash_password("NodePass123!"),
        "full_name": "Campus A Nodal Officer",
        "role": RoleEnum.NODE,
        "institute_id": "IND-INTAKE-TEST-A",
        "institute_name": "Campus A Technical Institute",
        "token": NODE_A_TOKEN,
    }

    USER_ACCOUNTS["nodal.b.intake@campus-b.ac.in"] = {
        "id": "usr_node_b_intake",
        "email": "nodal.b.intake@campus-b.ac.in",
        "password_hash": hash_password("NodePass123!"),
        "full_name": "Campus B Nodal Officer",
        "role": RoleEnum.NODE,
        "institute_id": "IND-INTAKE-TEST-B",
        "institute_name": "Campus B Technical Institute",
        "token": NODE_B_TOKEN,
    }

    USER_ACCOUNTS["student.intake@test.local"] = {
        "id": "usr_student_intake",
        "email": "student.intake@test.local",
        "password_hash": hash_password("StudPass123!"),
        "full_name": "Applicant Student",
        "role": RoleEnum.STUDENT,
        "institute_id": None,
        "institute_name": None,
        "token": STUDENT_TOKEN,
    }


def test_create_institution_with_valid_sanctioned_intake():
    """1. Test institution creation with a valid sanctioned intake and academic session."""
    code = f"IND-INTAKE-{uuid.uuid4().hex[:4].upper()}"
    payload = {
        "code": code,
        "name": "Aryabhatta Institute of Advanced Computing",
        "type": "Autonomous Technical University",
        "state": "Karnataka",
        "city": "Bengaluru",
        "address": "Electronic City Phase 1",
        "contact_email": "registrar@aryabhatta.edu.in",
        "contact_phone": "+91 80 2345 6789",
        "status": "approved",
        "sanctioned_intake": 420,
        "academic_session": "2024-2028",
    }

    res = client.post("/api/institutions", json=payload, headers=REGULATOR_HEADERS)
    assert res.status_code in (200, 201), res.text
    data = res.json()
    assert data["code"] == code
    assert data["total_approved_intake"] == 420
    assert data["academic_session"] == "2024-2028"
    assert data["remaining_capacity"] == 420
    assert data["current_enrolment"] == 0
    assert data["has_allocation_warning"] is False


def test_reject_missing_or_invalid_intake_values():
    """2. Test rejection of missing, negative, zero, decimal, and invalid string intake values."""
    base_code = f"IND-ERR-{uuid.uuid4().hex[:4].upper()}"

    # A. Missing sanctioned_intake
    p_missing = {
        "code": f"{base_code}-1",
        "name": "Error College",
        "state": "Delhi",
        "city": "Delhi",
        "academic_session": "2024-2028",
    }
    res = client.post("/api/institutions", json=p_missing, headers=REGULATOR_HEADERS)
    assert res.status_code == 422

    # B. Zero sanctioned_intake
    p_zero = dict(p_missing, code=f"{base_code}-2", sanctioned_intake=0)
    res = client.post("/api/institutions", json=p_zero, headers=REGULATOR_HEADERS)
    assert res.status_code == 422

    # C. Negative sanctioned_intake
    p_neg = dict(p_missing, code=f"{base_code}-3", sanctioned_intake=-150)
    res = client.post("/api/institutions", json=p_neg, headers=REGULATOR_HEADERS)
    assert res.status_code == 422

    # D. Decimal / Float sanctioned_intake
    p_decimal = dict(p_missing, code=f"{base_code}-4", sanctioned_intake=120.5)
    res = client.post("/api/institutions", json=p_decimal, headers=REGULATOR_HEADERS)
    assert res.status_code == 422

    # E. Invalid string intake
    p_string = dict(p_missing, code=f"{base_code}-5", sanctioned_intake="five-hundred")
    res = client.post("/api/institutions", json=p_string, headers=REGULATOR_HEADERS)
    assert res.status_code == 422

    # F. Missing academic session
    p_no_session = dict(p_missing, code=f"{base_code}-6", sanctioned_intake=300, academic_session="")
    res = client.post("/api/institutions", json=p_no_session, headers=REGULATOR_HEADERS)
    assert res.status_code == 422


def test_persistence_after_new_database_session():
    """3. Test persistence of intake records directly in SQLite ORM table."""
    code = f"IND-PERSIST-{uuid.uuid4().hex[:4].upper()}"
    payload = {
        "code": code,
        "name": "National Persistence Engineering Campus",
        "state": "Maharashtra",
        "city": "Pune",
        "sanctioned_intake": 280,
        "academic_session": "2024-2028",
    }

    res = client.post("/api/institutions", json=payload, headers=REGULATOR_HEADERS)
    assert res.status_code in (200, 201)

    # Query with a brand new, isolated DB session to verify disk persistence
    with get_db_context() as session:
        rec = session.query(InstitutionIntakeORM).filter(
            InstitutionIntakeORM.institution_code == code,
            InstitutionIntakeORM.academic_session == "2024-2028",
        ).first()
        assert rec is not None
        assert rec.sanctioned_intake == 280
        assert rec.institution_code == code


def test_session_specific_institution_intake_values():
    """4. Test that different academic sessions maintain distinct sanctioned intakes without overwriting."""
    code = f"IND-MULTI-{uuid.uuid4().hex[:4].upper()}"
    # Create institution with 2024-2028 intake = 200
    create_payload = {
        "code": code,
        "name": "Dynamic Session University",
        "state": "Telangana",
        "city": "Hyderabad",
        "sanctioned_intake": 200,
        "academic_session": "2024-2028",
    }
    res = client.post("/api/institutions", json=create_payload, headers=REGULATOR_HEADERS)
    assert res.status_code in (200, 201)

    # Configure session 2025-2029 intake = 350
    update_payload = {
        "academic_session": "2025-2029",
        "sanctioned_intake": 350,
    }
    res2 = client.post(f"/api/institutions/{code}/intakes", json=update_payload, headers=REGULATOR_HEADERS)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["total_approved_intake"] == 350
    assert data2["academic_session"] == "2025-2029"

    # Query session 2024-2028 again and verify it still has 200
    res_2024 = client.get(f"/api/institutions/{code}?session=2024-2028", headers=REGULATOR_HEADERS)
    assert res_2024.status_code == 200
    assert res_2024.json()["total_approved_intake"] == 200

    # Query session 2025-2029 again and verify it has 350
    res_2025 = client.get(f"/api/institutions/{code}?session=2025-2029", headers=REGULATOR_HEADERS)
    assert res_2025.status_code == 200
    assert res_2025.json()["total_approved_intake"] == 350


def test_programme_allocations_exceeding_institution_capacity():
    """5. Test warning when programme allocations exceed institution capacity without silently altering limits."""
    code = f"IND-ALLOC-{uuid.uuid4().hex[:4].upper()}"
    # Institution sanctioned intake = 100
    client.post("/api/institutions", json={
        "code": code,
        "name": "Overallocated Technical College",
        "state": "Gujarat",
        "city": "Ahmedabad",
        "sanctioned_intake": 100,
        "academic_session": "2024-2028",
    }, headers=REGULATOR_HEADERS)

    # Add Programme 1 with cap = 60
    p1_res = client.post(f"/api/institutions/{code}/programmes", json={
        "name": "Computer Science and Engineering",
        "admission_year": "2024-2028",
        "intake_cap": 60,
    }, headers=REGULATOR_HEADERS)
    assert p1_res.status_code in (200, 201)

    # Allocation is 60 / 100 -> no warning
    inst_res1 = client.get(f"/api/institutions/{code}", headers=REGULATOR_HEADERS)
    assert inst_res1.json()["has_allocation_warning"] is False
    assert inst_res1.json()["programme_allocations_total"] == 60

    # Add Programme 2 with cap = 55 -> Total is 115 > 100
    p2_res = client.post(f"/api/institutions/{code}/programmes", json={
        "name": "Mechanical Engineering",
        "admission_year": "2024-2028",
        "intake_cap": 55,
    }, headers=REGULATOR_HEADERS)
    assert p2_res.status_code in (200, 201)

    # Verify allocation warning is triggered
    inst_res2 = client.get(f"/api/institutions/{code}", headers=REGULATOR_HEADERS)
    inst_data2 = inst_res2.json()
    assert inst_data2["total_approved_intake"] == 100  # Not altered
    assert inst_data2["programme_allocations_total"] == 115  # Sum of 60 + 55
    assert inst_data2["has_allocation_warning"] is True
    assert "exceed" in inst_data2["allocation_warning_message"].lower()

    # Capacity endpoint also reports warning
    cap_res = client.get(f"/api/institutions/{code}/capacity", headers=REGULATOR_HEADERS)
    assert cap_res.status_code == 200
    cap_data = cap_res.json()
    assert cap_data["has_allocation_warning"] is True
    assert cap_data["has_capacity_warnings"] is True


def test_automatically_calculated_enrolled_counts():
    """6. Test enrolled count is derived automatically from persisted records without client tampering."""
    code = f"IND-CALC-{uuid.uuid4().hex[:4].upper()}"
    client.post("/api/institutions", json={
        "code": code,
        "name": "Enrolment Calculation Campus",
        "state": "Tamil Nadu",
        "city": "Chennai",
        "sanctioned_intake": 150,
        "academic_session": "2024-2028",
    }, headers=REGULATOR_HEADERS)

    # Add programme
    client.post(f"/api/institutions/{code}/programmes", json={
        "name": "Information Technology",
        "admission_year": "2024-2028",
        "intake_cap": 60,
    }, headers=REGULATOR_HEADERS)

    # Register 2 students
    client.post("/api/students", json={
        "apaar_id": f"9000{uuid.uuid4().int % 100000000:08d}",
        "student_name": "Student Alpha",
        "institute_code": code,
        "institute_name": "Enrolment Calculation Campus",
        "programme": "Information Technology",
        "admission_year": "2024-2028",
        "enrollment_number": f"ENR-{uuid.uuid4().hex[:6]}",
    }, headers=REGULATOR_HEADERS)

    client.post("/api/students", json={
        "apaar_id": f"9000{uuid.uuid4().int % 100000000:08d}",
        "student_name": "Student Beta",
        "institute_code": code,
        "institute_name": "Enrolment Calculation Campus",
        "programme": "Information Technology",
        "admission_year": "2024-2028",
        "enrollment_number": f"ENR-{uuid.uuid4().hex[:6]}",
    }, headers=REGULATOR_HEADERS)

    inst_data = client.get(f"/api/institutions/{code}", headers=REGULATOR_HEADERS).json()
    assert inst_data["current_enrolment"] == 2
    assert inst_data["remaining_capacity"] == 148  # 150 - 2
    assert inst_data["capacity_utilization_pct"] == round(2 / 150 * 100, 1)


def test_role_based_authorization_and_scoping():
    """7. Test role-based authorization: auditors manage all, node officers scoped, students/public rejected."""
    code_a = "IND-INTAKE-TEST-A"
    code_b = "IND-INTAKE-TEST-B"

    # Setup institution records
    for c, n in [(code_a, "Campus A"), (code_b, "Campus B")]:
        client.post("/api/institutions", json={
            "code": c,
            "name": n,
            "state": "Punjab",
            "city": "Chandigarh",
            "sanctioned_intake": 100,
            "academic_session": "2024-2028",
        }, headers=REGULATOR_HEADERS)

    # A. Student cannot create institution
    res_stud_create = client.post("/api/institutions", json={
        "code": "IND-STUD-FORBIDDEN",
        "name": "Forbidden Campus",
        "state": "Goa",
        "city": "Panaji",
        "sanctioned_intake": 100,
        "academic_session": "2024-2028",
    }, headers=STUDENT_HEADERS)
    assert res_stud_create.status_code == 403

    # B. Student cannot configure intake
    res_stud_intake = client.post(f"/api/institutions/{code_a}/intakes", json={
        "academic_session": "2024-2028",
        "sanctioned_intake": 500,
    }, headers=STUDENT_HEADERS)
    assert res_stud_intake.status_code == 403

    # C. Unauthenticated user rejected
    res_unauth = client.post(f"/api/institutions/{code_a}/intakes", json={
        "academic_session": "2024-2028",
        "sanctioned_intake": 500,
    })
    assert res_unauth.status_code in (401, 403)

    # D. Node Officer A cannot configure intake for Campus B (scoping)
    res_node_cross = client.post(f"/api/institutions/{code_b}/intakes", json={
        "academic_session": "2024-2028",
        "sanctioned_intake": 500,
    }, headers=NODE_A_HEADERS)
    assert res_node_cross.status_code == 403

    # E. Node Officer A CAN configure intake for Campus A (scoped)
    res_node_own = client.post(f"/api/institutions/{code_a}/intakes", json={
        "academic_session": "2024-2028",
        "sanctioned_intake": 180,
    }, headers=NODE_A_HEADERS)
    assert res_node_own.status_code == 200
    assert res_node_own.json()["total_approved_intake"] == 180

    # F. Auditor CAN configure intake for any campus
    res_audit = client.post(f"/api/institutions/{code_b}/intakes", json={
        "academic_session": "2024-2028",
        "sanctioned_intake": 220,
    }, headers=REGULATOR_HEADERS)
    assert res_audit.status_code == 200
    assert res_audit.json()["total_approved_intake"] == 220


def test_csv_reimport_does_not_inflate_enrolment():
    """8. Test CSV re-import is idempotent and does not artificially inflate enrolled counts."""
    code = f"IND-CSV-{uuid.uuid4().hex[:4].upper()}"
    client.post("/api/institutions", json={
        "code": code,
        "name": "CSV Verification Campus",
        "state": "Kerala",
        "city": "Kochi",
        "sanctioned_intake": 100,
        "academic_session": "2024-2028",
    }, headers=REGULATOR_HEADERS)

    client.post(f"/api/institutions/{code}/programmes", json={
        "name": "Electronics and Communication Engineering",
        "admission_year": "2024-2028",
        "intake_cap": 60,
    }, headers=REGULATOR_HEADERS)

    apaar_1 = f"9100{uuid.uuid4().int % 100000000:08d}"
    apaar_2 = f"9200{uuid.uuid4().int % 100000000:08d}"

    batch_payload = [
        {
            "apaar_id": apaar_1,
            "student_name": "Aarav Sharma",
            "institute_code": code,
            "institute_name": "CSV Verification Campus",
            "programme": "Electronics and Communication Engineering",
            "academic_year": "2024-2028",
            "enrollment_number": "ENR-01",
        },
        {
            "apaar_id": apaar_2,
            "student_name": "Diya Patel",
            "institute_code": code,
            "institute_name": "CSV Verification Campus",
            "programme": "Electronics and Communication Engineering",
            "academic_year": "2024-2028",
            "enrollment_number": "ENR-02",
        },
    ]

    # First import
    res1 = client.post(
        "/api/imports/batch",
        json=batch_payload,
        headers=REGULATOR_HEADERS,
    )
    assert res1.status_code == 200
    assert res1.json()["created"] == 2

    # Check count
    inst1 = client.get(f"/api/institutions/{code}", headers=REGULATOR_HEADERS).json()
    assert inst1["current_enrolment"] == 2

    # Re-import the exact same records
    res2 = client.post(
        "/api/imports/batch",
        json=batch_payload,
        headers=REGULATOR_HEADERS,
    )
    assert res2.status_code == 200

    # Verify enrolled count is still 2 and NOT inflated to 4
    inst2 = client.get(f"/api/institutions/{code}", headers=REGULATOR_HEADERS).json()
    assert inst2["current_enrolment"] == 2
    assert inst2["remaining_capacity"] == 98


def test_existing_institution_and_programme_workflows_functional():
    """9. Test that existing institution queries, programme listings, capacity endpoints remain fully functional."""
    # List institutions
    list_res = client.get("/api/institutions", headers=REGULATOR_HEADERS)
    assert list_res.status_code == 200
    institutions = list_res.json()
    assert isinstance(institutions, list)
    assert len(institutions) > 0

    target = institutions[0]
    code = target["code"]

    # Get single institution
    detail_res = client.get(f"/api/institutions/{code}", headers=REGULATOR_HEADERS)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "total_approved_intake" in detail
    assert "remaining_capacity" in detail
    assert "programme_allocations_total" in detail

    # Get programmes
    progs_res = client.get(f"/api/institutions/{code}/programmes", headers=REGULATOR_HEADERS)
    assert progs_res.status_code == 200
    assert isinstance(progs_res.json(), list)

    # Get capacity analytics
    cap_res = client.get(f"/api/institutions/{code}/capacity", headers=REGULATOR_HEADERS)
    assert cap_res.status_code == 200
    cap = cap_res.json()
    assert "overall_utilization_pct" in cap
    assert "programmes" in cap

