import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, get_db_context
from app.orm_models import VerificationHistoryORM
from app.models import RoleEnum
from app.db import USER_ACCOUNTS, hash_password

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_users():
    """Ensure test users for different roles and institutions exist."""
    auditor_email = "auditor.history.test@aicte.gov.in"
    node_a_email = "node.a.history.test@inst-a.edu"
    node_b_email = "node.b.history.test@inst-b.edu"

    USER_ACCOUNTS[auditor_email] = {
        "id": "usr_hist_auditor",
        "email": auditor_email,
        "password_hash": hash_password("TestPass@123"),
        "full_name": "Auditor Test",
        "role": RoleEnum.AUDITOR,
        "institute_id": "IND-AICTE-HQ",
        "institute_name": "Central AICTE Regulatory Headquarters",
        "created_at": "2026-01-01",
        "token": "token_hist_auditor",
    }
    USER_ACCOUNTS[node_a_email] = {
        "id": "usr_hist_node_a",
        "email": node_a_email,
        "password_hash": hash_password("TestPass@123"),
        "full_name": "Nodal Officer Inst A",
        "role": RoleEnum.NODE,
        "institute_id": "IND-AICTE-1042",
        "institute_name": "Delhi Institute of Technology",
        "created_at": "2026-01-01",
        "token": "token_hist_node_a",
    }
    USER_ACCOUNTS[node_b_email] = {
        "id": "usr_hist_node_b",
        "email": node_b_email,
        "password_hash": hash_password("TestPass@123"),
        "full_name": "Nodal Officer Inst B",
        "role": RoleEnum.NODE,
        "institute_id": "IND-AICTE-3391",
        "institute_name": "Mumbai Tech University",
        "created_at": "2026-01-01",
        "token": "token_hist_node_b",
    }


def test_real_verification_request_creates_persistent_history():
    """1. A real verification request creates a persistent history entry."""
    session_id = f"test_sess_{uuid.uuid4().hex[:8]}"
    apaar_id = "9024-8172-5501-IN"

    res = client.get(f"/api/verify/apaar?apaar_id={apaar_id}&session_id={session_id}")
    assert res.status_code == 200

    # Query history endpoint
    hist_res = client.get(f"/api/verify/history?session_id={session_id}")
    assert hist_res.status_code == 200
    data = hist_res.json()
    assert data["total"] >= 1
    items = [it for it in data["items"] if it["apaar_raw"] == apaar_id]
    assert len(items) >= 1
    item = items[0]
    assert "\u2022" in item["apaar_masked"]
    assert item["apaar_masked"] != apaar_id
    assert item["timestamp"] is not None


def test_status_mapping_clean_collision_quota_not_found():
    """2. CLEAN, COLLISION, QUOTA ALERT, and NOT_FOUND statuses are mapped correctly."""
    session_id = f"test_sess_{uuid.uuid4().hex[:8]}"

    # CLEAN record
    clean_res = client.get(f"/api/verify/apaar?apaar_id=9024-8172-5501-IN&session_id={session_id}")
    assert clean_res.status_code == 200
    assert clean_res.json()["is_valid"] is True

    # COLLISION record
    coll_res = client.get(f"/api/verify/apaar?apaar_id=3391-4412-8920-IN&session_id={session_id}")
    assert coll_res.status_code == 200
    assert coll_res.json()["has_duplicate_collision"] is True

    # QUOTA ALERT record
    quota_res = client.get(f"/api/verify/apaar?apaar_id=7721-1849-3382-IN&session_id={session_id}")
    assert quota_res.status_code == 200
    assert quota_res.json()["has_intake_warning"] is True

    # NOT FOUND record
    nf_res = client.get(f"/api/verify/apaar?apaar_id=4040-4040-4040-IN&session_id={session_id}")
    assert nf_res.status_code == 200
    assert nf_res.json()["status"] == "NOT_FOUND"

    # Query history
    hist_res = client.get(f"/api/verify/history?session_id={session_id}&limit=10")
    assert hist_res.status_code == 200
    history_map = {item["apaar_raw"]: item["status"] for item in hist_res.json()["items"]}

    assert history_map.get("9024-8172-5501-IN") == "CLEAN"
    assert history_map.get("3391-4412-8920-IN") == "COLLISION"
    assert history_map.get("7721-1849-3382-IN") == "QUOTA ALERT"
    assert history_map.get("4040-4040-4040-IN") == "NOT FOUND"


def test_failed_request_outcome_recording():
    """3. Failed requests are recorded with safe error outcome, not falsely marked as CLEAN."""
    session_id = f"test_sess_{uuid.uuid4().hex[:8]}"
    invalid_apaar = "INVALID-123"

    # Fails format validation with 400
    res = client.get(f"/api/verify/apaar?apaar_id={invalid_apaar}&session_id={session_id}")
    assert res.status_code == 400

    # Verification history records the attempt with NOT FOUND / safe failure category
    hist_res = client.get(f"/api/verify/history?session_id={session_id}")
    assert hist_res.status_code == 200
    items = [it for it in hist_res.json()["items"] if it["apaar_raw"] == invalid_apaar]
    assert len(items) >= 1
    assert items[0]["status"] == "NOT FOUND"
    assert items[0]["status"] != "CLEAN"


def test_entries_ordered_newest_first():
    """4. Entries are ordered newest first."""
    session_id = f"test_sess_order_{uuid.uuid4().hex[:8]}"
    client.get(f"/api/verify/apaar?apaar_id=9024-8172-5501-IN&session_id={session_id}")
    client.get(f"/api/verify/apaar?apaar_id=3391-4412-8920-IN&session_id={session_id}")

    hist_res = client.get(f"/api/verify/history?session_id={session_id}")
    assert hist_res.status_code == 200
    items = hist_res.json()["items"]
    assert len(items) >= 2
    # Newest item should be the second query
    assert items[0]["apaar_raw"] == "3391-4412-8920-IN"
    assert items[1]["apaar_raw"] == "9024-8172-5501-IN"


def test_history_persists_across_fresh_database_session():
    """5. History persists directly in the database table and survives across sessions."""
    session_id = f"test_sess_{uuid.uuid4().hex[:8]}"
    apaar_id = "9024-8172-5501-IN"

    client.get(f"/api/verify/apaar?apaar_id={apaar_id}&session_id={session_id}")

    # Inspect with fresh independent SQLAlchemy session directly from engine
    with SessionLocal() as db:
        record = (
            db.query(VerificationHistoryORM)
            .filter(VerificationHistoryORM.session_id == session_id)
            .first()
        )
        assert record is not None
        assert record.apaar_id == apaar_id
        assert record.status == "CLEAN"
        assert record.apaar_id_masked is not None
        assert "\u2022" in record.apaar_id_masked


def test_identifiers_are_masked_in_history():
    """6. Identifiers are masked in history responses."""
    session_id = f"test_sess_{uuid.uuid4().hex[:8]}"
    client.get(f"/api/verify/apaar?apaar_id=9024-8172-5501-IN&session_id={session_id}")

    hist_res = client.get(f"/api/verify/history?session_id={session_id}")
    assert hist_res.status_code == 200
    item = hist_res.json()["items"][0]
    assert "••••" in item["apaar_masked"]
    assert item["apaar_masked"] != "9024-8172-5501-IN"
    assert item["apaar_masked"].startswith("9024")


def test_institution_role_scoping_security():
    """7. Unauthorized users cannot access restricted history from other institutions."""
    inst_a_token = "Bearer token_hist_node_a"
    inst_b_token = "Bearer token_hist_node_b"
    auditor_token = "Bearer token_hist_auditor"

    # Institute A performs a verification
    client.get(
        "/api/verify/apaar?apaar_id=9024-8172-5501-IN",
        headers={"Authorization": inst_a_token},
    )

    # Institute B queries history with their token
    inst_b_hist = client.get(
        "/api/verify/history",
        headers={"Authorization": inst_b_token},
    )
    assert inst_b_hist.status_code == 200
    # Institute B should not see Institute A's institutional attempt
    for it in inst_b_hist.json()["items"]:
        if it["institution_code"] == "IND-AICTE-1042":
            pytest.fail("Institute B was able to see Institute A's institutional verification history!")

    # Central regulator (Auditor) can see all history
    auditor_hist = client.get(
        "/api/verify/history",
        headers={"Authorization": auditor_token},
    )
    assert auditor_hist.status_code == 200
    assert auditor_hist.json()["total"] >= 1


def test_empty_state_returns_empty_list():
    """8. Empty state returns empty items array and zero total."""
    unused_session = f"sess_empty_{uuid.uuid4().hex}"
    res = client.get(f"/api/verify/history?session_id={unused_session}")
    assert res.status_code == 200
    data = res.json()
    assert data["items"] == []
    assert data["total"] == 0
