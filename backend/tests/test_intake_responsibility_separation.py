import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import (
    STUDENT_LEDGER,
    INSTITUTIONS_DB,
    PROGRAMMES_DB,
    INTEGRITY_FINDINGS_DB,
    USER_ACCOUNTS,
    hash_password,
)
from app.models import (
    RoleEnum,
    IntegrityStatusEnum,
    FindingTypeEnum,
)

client = TestClient(app)

REGULATOR_TOKEN = "token_test_regulator_intake_sep"
NODE_TOKEN_A = "token_test_node_a_intake_sep"
NODE_TOKEN_B = "token_test_node_b_intake_sep"
STUDENT_TOKEN = "token_test_student_intake_sep"

REGULATOR_HEADERS = {"Authorization": f"Bearer {REGULATOR_TOKEN}"}
NODE_A_HEADERS = {"Authorization": f"Bearer {NODE_TOKEN_A}"}
NODE_B_HEADERS = {"Authorization": f"Bearer {NODE_TOKEN_B}"}
STUDENT_HEADERS = {"Authorization": f"Bearer {STUDENT_TOKEN}"}


@pytest.fixture(autouse=True)
def setup_test_users_and_institutions():
    """Seeds test authentication accounts and institutions with scoped programmes."""
    USER_ACCOUNTS["regulator.sep@aicte.gov.in"] = {
        "id": "usr_regulator_sep",
        "email": "regulator.sep@aicte.gov.in",
        "password_hash": hash_password("RegPass123!"),
        "full_name": "Central AICTE Auditor",
        "role": RoleEnum.AUDITOR,
        "institute_id": None,
        "institute_name": "AICTE Headquarters",
        "token": REGULATOR_TOKEN,
    }

    USER_ACCOUNTS["nodal.a.sep@dit.ac.in"] = {
        "id": "usr_node_a_sep",
        "email": "nodal.a.sep@dit.ac.in",
        "password_hash": hash_password("NodePass123!"),
        "full_name": "Delhi Nodal Officer",
        "role": RoleEnum.NODE,
        "institute_id": "IND-AICTE-1042",
        "institute_name": "Delhi Institute of Technology",
        "token": NODE_TOKEN_A,
    }

    USER_ACCOUNTS["nodal.b.sep@mtu.edu.in"] = {
        "id": "usr_node_b_sep",
        "email": "nodal.b.sep@mtu.edu.in",
        "password_hash": hash_password("NodePass123!"),
        "full_name": "Mumbai Nodal Officer",
        "role": RoleEnum.NODE,
        "institute_id": "IND-AICTE-3391",
        "institute_name": "Mumbai Technical University",
        "token": NODE_TOKEN_B,
    }

    USER_ACCOUNTS["student.sep@test.local"] = {
        "id": "usr_student_sep",
        "email": "student.sep@test.local",
        "password_hash": hash_password("StudPass123!"),
        "full_name": "Candidate Student",
        "role": RoleEnum.STUDENT,
        "institute_id": None,
        "institute_name": None,
        "token": STUDENT_TOKEN,
    }


def test_student_cannot_manipulate_sanctioned_intake_cap_or_count():
    """Verifies that client-supplied intake_cap and intake_current in registration request are disregarded."""
    unique_apaar = f"9999-1111-{uuid.uuid4().hex[:4].upper()}-IN"
    crafted_payload = {
        "apaar_id": unique_apaar,
        "student_name": "Security Test Candidate",
        "institute_code": "IND-AICTE-1042",
        "programme": "B.Tech Computer Science & AI",
        "admission_year": "2024-2028",
        # Malicious client attempts to inflate cap and reset current count
        "intake_cap": 99999,
        "intake_current": 0,
        "notes": "Testing backend authority enforcement",
    }

    res = client.post("/api/students", json=crafted_payload, headers=NODE_A_HEADERS)
    assert res.status_code == 201
    data = res.json()

    # The persisted intake_cap must be derived authoritatively from Programme records, NOT 99999
    assert data["intake_cap"] != 99999
    # IND-AICTE-1042 CSE has a sanctioned cap of 120
    assert data["intake_cap"] == 120
    # The intake_current must be calculated from persisted records, NOT 0
    assert data["intake_current"] >= 1


def test_student_role_cannot_register_records_or_edit_programmes():
    """Verifies student/public roles cannot register students or modify programme settings."""
    student_payload = {
        "apaar_id": f"8888-2222-{uuid.uuid4().hex[:4].upper()}-IN",
        "student_name": "Unauthorized Attempt",
        "institute_code": "IND-AICTE-1042",
        "programme": "B.Tech Computer Science & AI",
    }

    # Student cannot add record
    res_add = client.post("/api/students", json=student_payload, headers=STUDENT_HEADERS)
    assert res_add.status_code == 403
    assert "Forbidden" in res_add.json()["detail"]

    # Student cannot modify programme
    res_mod = client.put(
        "/api/institutions/IND-AICTE-1042/programmes/prog_1042_cse",
        json={"intake_cap": 500},
        headers=STUDENT_HEADERS,
    )
    assert res_mod.status_code == 403


def test_institution_and_programme_scoping_enforcement():
    """Verifies node officers cannot register students or alter programmes outside their assigned campus."""
    cross_campus_student = {
        "apaar_id": f"7777-3333-{uuid.uuid4().hex[:4].upper()}-IN",
        "student_name": "Cross Campus Test",
        "institute_code": "IND-AICTE-3391",  # Campus B
        "programme": "M.Tech Data Science",
    }

    # Node A attempting to add to Campus B must be rejected
    res_scoped_add = client.post("/api/students", json=cross_campus_student, headers=NODE_A_HEADERS)
    assert res_scoped_add.status_code == 403
    assert "Forbidden" in res_scoped_add.json()["detail"]

    # Node A attempting to edit Campus B's programme must be rejected
    res_scoped_edit = client.put(
        "/api/institutions/IND-AICTE-3391/programmes/prog_3391_ds",
        json={"intake_cap": 200},
        headers=NODE_A_HEADERS,
    )
    assert res_scoped_edit.status_code == 403


def test_authorized_programme_management_and_intake_updates():
    """Verifies authorized users can update programme name, session, and sanctioned cap."""
    # Regulator updates programme cap
    res_update = client.put(
        "/api/institutions/IND-AICTE-1042/programmes/prog_1042_cse",
        json={
            "name": "B.Tech Computer Science & AI",
            "admission_year": "2024-2028",
            "intake_cap": 150,
        },
        headers=REGULATOR_HEADERS,
    )
    assert res_update.status_code == 200
    updated_prog = res_update.json()
    assert updated_prog["intake_cap"] == 150

    # Reset back to 120
    client.put(
        "/api/institutions/IND-AICTE-1042/programmes/prog_1042_cse",
        json={"intake_cap": 120},
        headers=REGULATOR_HEADERS,
    )


def test_dynamic_intake_count_and_reimport_preservation():
    """Verifies that intake counts are computed dynamically and re-importing does not double-count."""
    unique_apaar = f"6666-4444-{uuid.uuid4().hex[:4].upper()}-IN"
    record = {
        "apaar_id": unique_apaar,
        "student_name": "Reimport Integrity Candidate",
        "institute_code": "IND-AICTE-1042",
        "programme": "B.Tech Mechanical Engineering",
        "admission_year": "2024-2028",
    }

    # First import
    res1 = client.post("/api/imports/batch", json=[record], headers=NODE_A_HEADERS)
    assert res1.status_code == 200
    summary1 = res1.json()
    assert summary1["created"] == 1

    # Check count for Mechanical
    progs_res1 = client.get("/api/institutions/IND-AICTE-1042/programmes", headers=NODE_A_HEADERS)
    assert progs_res1.status_code == 200
    mech_prog1 = next((p for p in progs_res1.json() if "Mechanical" in p["name"]), None)
    assert mech_prog1 is not None
    count_after_first = mech_prog1["intake_current"]

    # Re-import same student with updated student_name
    record_update = dict(record)
    record_update["student_name"] = "Reimport Integrity Candidate (Updated)"
    res2 = client.post("/api/imports/batch", json=[record_update], headers=NODE_A_HEADERS)
    assert res2.status_code == 200
    summary2 = res2.json()
    assert summary2["updated"] == 1
    assert summary2["created"] == 0

    # Verify count did NOT increase
    progs_res2 = client.get("/api/institutions/IND-AICTE-1042/programmes", headers=NODE_A_HEADERS)
    mech_prog2 = next((p for p in progs_res2.json() if "Mechanical" in p["name"]), None)
    assert mech_prog2 is not None
    assert mech_prog2["intake_current"] == count_after_first


def test_intake_capacity_warning_finding_generation():
    """Verifies that admitting beyond the sanctioned cap generates an INTAKE_CAPACITY_EXCEEDED finding."""
    # Create or configure a programme with a strict cap of 1
    test_prog_name = f"M.Tech Quantum Robotics {uuid.uuid4().hex[:4]}"
    create_prog_res = client.post(
        "/api/institutions/IND-AICTE-1042/programmes",
        json={
            "name": test_prog_name,
            "intake_cap": 1,
            "admission_year": "2024-2028",
        },
        headers=REGULATOR_HEADERS,
    )
    assert create_prog_res.status_code == 201

    # Add 1st student -> Within cap (status verified)
    apaar1 = f"5555-1111-{uuid.uuid4().hex[:4].upper()}-IN"
    s1_res = client.post(
        "/api/students",
        json={
            "apaar_id": apaar1,
            "student_name": "First Admitted Student",
            "institute_code": "IND-AICTE-1042",
            "programme": test_prog_name,
            "admission_year": "2024-2028",
        },
        headers=NODE_A_HEADERS,
    )
    assert s1_res.status_code == 201
    assert s1_res.json()["integrity_status"] == IntegrityStatusEnum.VERIFIED.value

    # Add 2nd student -> Exceeds cap of 1 -> status warning
    apaar2 = f"5555-2222-{uuid.uuid4().hex[:4].upper()}-IN"
    s2_res = client.post(
        "/api/students",
        json={
            "apaar_id": apaar2,
            "student_name": "Second Exceeded Student",
            "institute_code": "IND-AICTE-1042",
            "programme": test_prog_name,
            "admission_year": "2024-2028",
        },
        headers=NODE_A_HEADERS,
    )
    assert s2_res.status_code == 201
    assert s2_res.json()["integrity_status"] == IntegrityStatusEnum.WARNING.value

    # Verify intake capacity finding is registered in the findings store
    findings = [
        f for f in INTEGRITY_FINDINGS_DB.values()
        if f.finding_type == FindingTypeEnum.INTAKE_CAPACITY_EXCEEDED
        and f.programme == test_prog_name
    ]
    assert len(findings) >= 1
    intake_finding = findings[0]
    assert intake_finding.severity.value.upper() == "WARNING"
    assert "INTAKE CAP EXCEEDED" in intake_finding.reason.upper()
