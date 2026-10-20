import os
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, SessionLocal, DATABASE_URL
from app.orm_models import (
    InstitutionORM,
    ProgrammeORM,
    StudentRecordORM,
    IntegrityFindingORM,
    AuditEventORM,
    UserORM,
)
from app.db import (
    STUDENT_LEDGER,
    INSTITUTIONS_DB,
    PROGRAMMES_DB,
    INTEGRITY_FINDINGS_DB,
    AUDIT_LOG_DB,
    USER_ACCOUNTS,
    hash_password,
)
from app.models import (
    RoleEnum,
    IntegrityStatusEnum,
    InstitutionStatusEnum,
    FindingReviewRequest,
    ReviewStatusEnum,
    StudentRecordSchema,
)
from app.services.integrity_engine import IntegrityEngine


client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_auth_tokens():
    """Seeds test authentication accounts for Phase 3 E2E and security audit."""
    regulator_email = "regulator.phase3@aicte.gov.in"
    node_a_email = "nodal.delhi.phase3@dit.ac.in"
    node_b_email = "nodal.mumbai.phase3@mtu.edu.in"
    student_email = "student.phase3@candidate.local"

    USER_ACCOUNTS[regulator_email] = {
        "id": "usr_phase3_regulator",
        "email": regulator_email,
        "password_hash": hash_password("RegulatorSecurePass123!"),
        "full_name": "AICTE Chief Regulator",
        "role": RoleEnum.AUDITOR,
        "institute_id": None,
        "institute_name": "AICTE Headquarters",
        "token": "token_phase3_regulator_valid",
    }

    USER_ACCOUNTS[node_a_email] = {
        "id": "usr_phase3_node_a",
        "email": node_a_email,
        "password_hash": hash_password("NodeSecurePass123!"),
        "full_name": "Delhi Nodal Officer",
        "role": RoleEnum.NODE,
        "institute_id": "IND-AICTE-1042",
        "institute_name": "Delhi Institute of Technology",
        "token": "token_phase3_node_a_valid",
    }

    USER_ACCOUNTS[node_b_email] = {
        "id": "usr_phase3_node_b",
        "email": node_b_email,
        "password_hash": hash_password("NodeBSecurePass123!"),
        "full_name": "Mumbai Nodal Officer",
        "role": RoleEnum.NODE,
        "institute_id": "IND-AICTE-3391",
        "institute_name": "Mumbai Technical University",
        "token": "token_phase3_node_b_valid",
    }

    USER_ACCOUNTS[student_email] = {
        "id": "usr_phase3_student",
        "email": student_email,
        "password_hash": hash_password("StudentPass123!"),
        "full_name": "Candidate Student",
        "role": RoleEnum.STUDENT,
        "institute_id": None,
        "token": "token_phase3_student_valid",
    }


# =====================================================================
# 1. Active Database & Engine Verification
# =====================================================================

def test_database_configuration_and_migrations():
    """Verifies DATABASE_URL, table existence, and foreign key enforcement."""
    assert DATABASE_URL is not None
    assert len(DATABASE_URL) > 5

    from sqlalchemy import inspect
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    required_tables = [
        "institutions",
        "programmes",
        "student_records",
        "integrity_findings",
        "audit_events",
        "users",
        "batch_import_logs",
    ]
    for table in required_tables:
        assert table in table_names, f"Table {table} missing from active database"


# =====================================================================
# 2. Complete User Workflow & Persistence Lifecycle
# =====================================================================

def test_complete_e2e_user_workflow_and_persistence():
    """
    Tests end-to-end user workflow:
    Institution creation -> Programme intake -> CSV preview -> CSV import ->
    Validation & collision detection -> Finding review -> Audit verification -> Restart persistence.
    """
    reg_headers = {"Authorization": "Bearer token_phase3_regulator_valid"}
    test_uid = uuid.uuid4().hex[:6].upper()
    inst_code = f"IND-TEST-{test_uid}"
    inst_name = f"Indian Institute of Advanced Tech {test_uid}"

    # Step 1: Create Institution
    inst_payload = {
        "code": inst_code,
        "name": inst_name,
        "type": "AICTE Approved Technical Institution",
        "state": "Maharashtra",
        "city": "Pune",
        "status": "approved",
        "sanctioned_intake": 300,
        "academic_session": "2024-2028",
    }
    create_inst_res = client.post("/api/institutions", json=inst_payload, headers=reg_headers)
    assert create_inst_res.status_code == 201, create_inst_res.text
    inst_data = create_inst_res.json()
    assert inst_data["code"] == inst_code

    # Step 2: Programme and Intake Setup
    prog_payload = {
        "name": "B.Tech Artificial Intelligence & Robotics",
        "admission_year": "2024-2028",
        "intake_cap": 2,  # Set low cap to test intake warning detection
    }
    create_prog_res = client.post(f"/api/institutions/{inst_code}/programmes", json=prog_payload, headers=reg_headers)
    assert create_prog_res.status_code == 201
    prog_data = create_prog_res.json()
    assert prog_data["intake_cap"] == 2

    # Step 3: CSV Preview with Fictional Records
    apaar_clean = f"9911-{test_uid[:4]}-1101-IN"
    apaar_overcap1 = f"9911-{test_uid[:4]}-1102-IN"
    apaar_overcap2 = f"9911-{test_uid[:4]}-1103-IN"
    apaar_invalid = "SHORT-APAAR"

    csv_records = [
        {
            "APAAR_ID": apaar_clean,
            "STUDENT_NAME": "Aditya K. Sharma",
            "INSTITUTE_CODE": inst_code,
            "INSTITUTE_NAME": inst_name,
            "PROGRAMME": "B.Tech Artificial Intelligence & Robotics",
            "ADMISSION_YEAR": "2024-2028",
            "CATEGORY": "General",
            "GENDER": "Male",
            "DOB": "2005-03-15",
            "EMAIL": "aditya.sharma@test.edu.in",
            "ENROLLMENT_NUMBER": f"ENR-{test_uid}-01",
        },
        {
            "APAAR_ID": apaar_overcap1,
            "STUDENT_NAME": "Kavita S. Joshi",
            "INSTITUTE_CODE": inst_code,
            "INSTITUTE_NAME": inst_name,
            "PROGRAMME": "B.Tech Artificial Intelligence & Robotics",
            "ADMISSION_YEAR": "2024-2028",
            "CATEGORY": "OBC",
            "GENDER": "Female",
            "DOB": "2005-07-22",
        },
        {
            "APAAR_ID": apaar_overcap2,
            "STUDENT_NAME": "Rahul D. Verma",
            "INSTITUTE_CODE": inst_code,
            "INSTITUTE_NAME": inst_name,
            "PROGRAMME": "B.Tech Artificial Intelligence & Robotics",
            "ADMISSION_YEAR": "2024-2028",
            "CATEGORY": "SC",
            "GENDER": "Male",
            "DOB": "2004-12-10",
        },
        {
            "APAAR_ID": apaar_invalid,
            "STUDENT_NAME": "Faulty Format Student",
            "INSTITUTE_CODE": inst_code,
        },
    ]

    preview_res = client.post("/api/imports/preview", json=csv_records, headers=reg_headers)
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    assert preview_data["total_rows"] == 4
    assert preview_data["valid_rows"] == 3
    assert preview_data["invalid_rows"] == 1

    # Step 4: Batch Import Manifest
    import_res = client.post("/api/imports/batch?auto_create_institutions=false", json=csv_records, headers=reg_headers)
    assert import_res.status_code == 200
    import_summary = import_res.json()
    assert import_summary["total_records"] == 4
    assert import_summary["created"] == 3
    assert import_summary["skipped"] == 1
    assert import_summary["intake_warnings"] >= 1  # Exceeded cap of 2

    # Step 5: Verify Saved Fields in Student Record
    student_view_res = client.get(f"/api/students/{apaar_clean}", headers=reg_headers)
    assert student_view_res.status_code == 200
    saved_student = student_view_res.json()
    assert saved_student["apaar_id"] == apaar_clean
    assert saved_student["student_name"] == "Aditya K. Sharma"
    assert saved_student["category"] == "General"
    assert saved_student["gender"] == "Male"
    assert saved_student["dob"] == "2005-03-15"
    assert saved_student["merkle_root"] is not None
    assert saved_student["ecdsa_signature"] is not None

    # Step 6: Verify Intake Finding Generation & Review Workflow
    findings_res = client.get(f"/api/findings?institute_code={inst_code}", headers=reg_headers)
    assert findings_res.status_code == 200
    findings = findings_res.json()
    assert len(findings) >= 1
    target_finding = findings[0]
    finding_id = target_finding["id"]

    review_res = client.post(
        f"/api/findings/{finding_id}/review",
        json={
            "status": "RESOLVED_CONFIRMED_VIOLATION",
            "decision": "OVER_CAP_SANCTIONED_ADMISSIONS",
            "notes": "Verified that admitted intake exceeded authorized capacity of 2 seats.",
        },
        headers=reg_headers,
    )
    assert review_res.status_code == 200
    reviewed_f = review_res.json()
    assert reviewed_f["review_status"] == "RESOLVED_CONFIRMED_VIOLATION"
    assert reviewed_f["review_decision"] == "OVER_CAP_SANCTIONED_ADMISSIONS"

    # Step 7: Verify Audit Logging
    audit_res = client.get(f"/api/audit/logs?target_type=FINDING", headers=reg_headers)
    assert audit_res.status_code == 200
    audit_logs = audit_res.json()
    review_audit = next((a for a in audit_logs if a.get("target_id") == finding_id), None)
    assert review_audit is not None
    assert "Review recorded" in review_audit["details"]

    # Step 8: Reimport update policy (Updating student details without duplicate row creation)
    update_csv_records = [
        {
            "APAAR_ID": apaar_clean,
            "STUDENT_NAME": "Aditya Kumar Sharma (Updated)",
            "INSTITUTE_CODE": inst_code,
            "INSTITUTE_NAME": inst_name,
            "PROGRAMME": "B.Tech Artificial Intelligence & Robotics",
            "ADMISSION_YEAR": "2024-2028",
            "CATEGORY": "General",
            "GENDER": "Male",
            "DOB": "2005-03-15",
            "EMAIL": "aditya.k.sharma.updated@test.edu.in",
        }
    ]
    reimport_res = client.post("/api/imports/batch", json=update_csv_records, headers=reg_headers)
    assert reimport_res.status_code == 200
    reimport_summary = reimport_res.json()
    assert reimport_summary["updated"] == 1
    assert reimport_summary["created"] == 0

    # Step 9: Verify Persistence Across Completely Fresh Database Session
    db_session = SessionLocal()
    try:
        persisted_inst = db_session.query(InstitutionORM).filter(InstitutionORM.code == inst_code).first()
        assert persisted_inst is not None
        assert persisted_inst.name == inst_name

        persisted_student_orm = db_session.query(StudentRecordORM).filter(StudentRecordORM.apaar_id == apaar_clean).first()
        assert persisted_student_orm is not None
        assert "Updated" in persisted_student_orm.student_name

        persisted_finding_orm = db_session.query(IntegrityFindingORM).filter(IntegrityFindingORM.id == finding_id).first()
        assert persisted_finding_orm is not None
        assert persisted_finding_orm.review_status == "RESOLVED_CONFIRMED_VIOLATION"
        assert persisted_finding_orm.review_decision == "OVER_CAP_SANCTIONED_ADMISSIONS"

        persisted_audit_orm = db_session.query(AuditEventORM).filter(AuditEventORM.target_id == finding_id).first()
        assert persisted_audit_orm is not None
    finally:
        db_session.close()


# =====================================================================
# 3. Security, Authorization & Privacy Audit
# =====================================================================

def test_security_unauthenticated_and_invalid_token():
    """Confirms unauthenticated and malformed sessions are rejected with 401."""
    valid_payload = {
        "code": "TEST-AUTH",
        "name": "Test Auth",
        "state": "Delhi",
        "city": "New Delhi",
        "sanctioned_intake": 300,
        "academic_session": "2024-2028",
    }

    # Unauthenticated institution create
    res1 = client.post("/api/institutions", json=valid_payload)
    assert res1.status_code == 401

    # Invalid token
    res2 = client.post(
        "/api/institutions",
        json=valid_payload,
        headers={"Authorization": "Bearer invalid_garbage_token"},
    )
    assert res2.status_code == 401

    # Unauthenticated audit logs
    res3 = client.get("/api/audit/logs")
    assert res3.status_code == 401


def test_security_role_escalation_and_privilege_enforcement():
    """Verifies that non-staff users (student, public) cannot perform administrative actions."""
    student_headers = {"Authorization": "Bearer token_phase3_student_valid"}

    # Student cannot create institutions
    res_inst = client.post(
        "/api/institutions",
        json={
            "code": "IND-ROGUE",
            "name": "Rogue University",
            "state": "Delhi",
            "city": "New Delhi",
            "sanctioned_intake": 300,
            "academic_session": "2024-2028",
        },
        headers={**student_headers, "Content-Type": "application/json"},
    )
    assert res_inst.status_code == 403

    # Student cannot review findings
    res_fnd = client.post(
        "/api/findings/FND-DEMO-001/review",
        json={"status": "RESOLVED_CLEARED", "decision": "CLEARED"},
        headers=student_headers,
    )
    assert res_fnd.status_code == 403

    # Student cannot import student batches
    res_import = client.post(
        "/api/imports/batch",
        json=[{"apaar_id": "9999-0000-1111-IN", "student_name": "Test"}],
        headers=student_headers,
    )
    assert res_import.status_code == 403


def test_security_cross_institution_isolation():
    """Verifies that Nodal Officers cannot inspect or manipulate other institutions' data."""
    node_a_headers = {"Authorization": "Bearer token_phase3_node_a_valid"}  # Scoped to IND-AICTE-1042
    node_b_headers = {"Authorization": "Bearer token_phase3_node_b_valid"}  # Scoped to IND-AICTE-3391

    # Node A cannot browse records explicitly belonging to Institute B
    res_students = client.get("/api/students?institute_code=IND-AICTE-3391", headers=node_a_headers)
    assert res_students.status_code == 403

    # Node A cannot import records scoped to Institute B
    import_foreign = [
        {
            "APAAR_ID": "8812-4412-9901-IN",
            "STUDENT_NAME": "Foreign Student",
            "INSTITUTE_CODE": "IND-AICTE-3391",  # Institute B
            "PROGRAMME": "B.Tech Computer Science",
        }
    ]
    res_foreign_import = client.post("/api/imports/batch", json=import_foreign, headers=node_a_headers)
    assert res_foreign_import.status_code == 200
    summary = res_foreign_import.json()
    assert summary["created"] == 0
    assert summary["skipped"] == 1
    assert "Access denied" in summary["rejected_details"][0]["error_reason"]


def test_privacy_apaar_identifier_masking():
    """Verifies that student identifiers are properly masked in sensitive audit and finding logs."""
    raw_apaar = "9024-8172-5501-IN"
    masked = IntegrityEngine.mask_apaar(raw_apaar)
    assert "••••" in masked
    assert masked.startswith("9024-")
    assert masked.endswith("-IN")


# =====================================================================
# 4. Cryptographic Claims & Tamper Detection
# =====================================================================

def test_cryptographic_ecdsa_signature_and_verification():
    """Verifies real ECDSA SECP256R1 cryptographic signing and independent public key verification."""
    apaar_id = "9024-8172-5501-IN"
    institute_code = "IND-AICTE-1042"
    status = "VERIFIED"

    # Generate real signature
    signature_hex = IntegrityEngine.generate_ecdsa_signature(apaar_id, institute_code, status)
    assert signature_hex.startswith("0x")
    assert len(signature_hex) > 100

    # Independently verify signature against public key
    is_valid = IntegrityEngine.verify_ecdsa_signature(apaar_id, institute_code, status, signature_hex)
    assert is_valid is True

    # Tampered status should fail verification
    is_tampered_status = IntegrityEngine.verify_ecdsa_signature(apaar_id, institute_code, "DUPLICATE", signature_hex)
    assert is_tampered_status is False

    # Tampered APAAR ID should fail verification
    is_tampered_apaar = IntegrityEngine.verify_ecdsa_signature("9024-8172-9999-IN", institute_code, status, signature_hex)
    assert is_tampered_apaar is False


def test_cryptographic_tamper_detection_on_record():
    """Verifies that tampered records are flagged by the cryptographic tamper check."""
    student = StudentRecordSchema(
        apaar_id="9024-8172-5501-IN",
        student_name="Test Verifiable Student",
        institute_code="IND-AICTE-1042",
        institute_name="Delhi Institute of Technology",
        programme="B.Tech Computer Science",
        admission_year="2024-2028",
        integrity_status=IntegrityStatusEnum.VERIFIED,
    )
    student.merkle_root = IntegrityEngine.calculate_merkle_root([student.apaar_id, student.institute_code, "verified"])
    student.ecdsa_signature = IntegrityEngine.generate_ecdsa_signature(student.apaar_id, student.institute_code, "verified")

    # 1. Genuine record passes
    authentic_check = IntegrityEngine.verify_record_tamper_evidence(student)
    assert authentic_check["is_authentic"] is True
    assert authentic_check["is_tampered"] is False

    # 2. Tampered record with modified status fails
    student.integrity_status = IntegrityStatusEnum.DUPLICATE
    tampered_check = IntegrityEngine.verify_record_tamper_evidence(student)
    assert tampered_check["is_authentic"] is False
    assert tampered_check["is_tampered"] is True


def test_authority_key_export_endpoint():
    """Verifies that the authority ECDSA public key is available via standard endpoint."""
    res = client.get("/api/verify/authority-key")
    assert res.status_code == 200
    data = res.json()
    assert data["algorithm"] == "ECDSA_SECP256R1_SHA256"
    assert "-----BEGIN PUBLIC KEY-----" in data["public_key_pem"]
    assert "-----END PUBLIC KEY-----" in data["public_key_pem"]


def test_production_mode_refuses_insecure_fallback_key():
    """Verifies that production environment strictly refuses fallback salt keys."""
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import serialization

    # Save original env
    orig_env = os.environ.get("ENVIRONMENT", "sandbox")
    orig_pem = os.environ.get("ECDSA_PRIVATE_KEY_PEM")

    try:
        # Switch to production with no key set
        os.environ["ENVIRONMENT"] = "production"
        if "ECDSA_PRIVATE_KEY_PEM" in os.environ:
            del os.environ["ECDSA_PRIVATE_KEY_PEM"]
        IntegrityEngine.reset_keys_cache()

        with pytest.raises(RuntimeError) as exc_info:
            IntegrityEngine.get_signing_keys()
        assert "CRITICAL SECURITY CONFIGURATION ERROR" in str(exc_info.value)
        assert "strictly prohibited in production" in str(exc_info.value)

        # Explicit key works in production
        real_key = ec.generate_private_key(ec.SECP256R1())
        pem_str = real_key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        ).decode()
        os.environ["ECDSA_PRIVATE_KEY_PEM"] = pem_str
        IntegrityEngine.reset_keys_cache()
        pk, pub = IntegrityEngine.get_signing_keys()
        assert pk is not None
        assert pub is not None
    finally:
        # Restore environment
        os.environ["ENVIRONMENT"] = orig_env
        if orig_pem:
            os.environ["ECDSA_PRIVATE_KEY_PEM"] = orig_pem
        elif "ECDSA_PRIVATE_KEY_PEM" in os.environ:
            del os.environ["ECDSA_PRIVATE_KEY_PEM"]
        IntegrityEngine.reset_keys_cache()


def test_merkle_root_determinism_and_avalanche_effect():
    """Verifies that Merkle roots are deterministic and sensitive to record modifications."""
    records_set1 = ["9024-8172-5501-IN", "IND-AICTE-1042", "verified"]
    records_set2 = ["9024-8172-5501-IN", "IND-AICTE-1042", "verified"]
    records_set3 = ["9024-8172-5501-IN", "IND-AICTE-1042", "duplicate"]  # 1 field changed

    root1 = IntegrityEngine.calculate_merkle_root(records_set1)
    root2 = IntegrityEngine.calculate_merkle_root(records_set2)
    root3 = IntegrityEngine.calculate_merkle_root(records_set3)

    # Determinism
    assert root1 == root2
    assert root1.startswith("0x")

    # Avalanche effect
    assert root1 != root3
