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
    FindingReviewRequest,
    ReviewStatusEnum,
    FindingTypeEnum,
    RejectedRowError,
)
from app.routes.auth import register, login, get_current_user, update_profile
from app.routes.students import add_student, list_students, clear_all_data, seed_demo_data, get_student_by_identifier
from app.routes.analytics import get_metrics
from app.routes.findings import list_findings, get_finding_detail, review_finding
from app.routes.audit import list_audit_logs
from app.routes.reports import get_enrolment_summary, get_intake_capacity_report, get_duplicate_findings_report, export_report_csv
from app.routes.verify import verify_apaar
from app.routes.imports import export_errors_csv, process_batch_manifest, preview_batch_manifest
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


from app.models import InstitutionCreateRequest, ProgrammeCreateRequest
from app.routes.institutions import (
    create_institution,
    list_institutions,
    get_institution,
    create_programme,
    list_programmes,
    get_institution_capacity,
)
from app.routes.imports import preview_batch_manifest


def test_institution_management_lifecycle():
    from app.db import INSTITUTIONS_DB
    if "IND-AICTE-9999" in INSTITUTIONS_DB:
        del INSTITUTIONS_DB["IND-AICTE-9999"]

    # Login as Platform Admin
    admin_login = login(UserLoginRequest(email="admin@demo.vidyaverify.local", password="AdminPass@2026"))
    admin_auth = f"Bearer {admin_login.token}"

    # Create new institution
    new_inst = create_institution(
        InstitutionCreateRequest(
            code="IND-AICTE-9999",
            name="Pune Institute of Advanced Technology",
            state="Maharashtra",
            city="Pune",
            contact_email="director@piat.ac.in",
            sanctioned_intake=300,
            academic_session="2024-2028",
        ),
        authorization=admin_auth,
    )
    assert new_inst.code == "IND-AICTE-9999"
    assert new_inst.name == "Pune Institute of Advanced Technology"

    # Verify duplicate code is rejected
    with pytest.raises(HTTPException) as exc_info:
        create_institution(
            InstitutionCreateRequest(
                code="IND-AICTE-9999",
                name="Duplicate Code College",
                state="Maharashtra",
                city="Pune",
                sanctioned_intake=300,
                academic_session="2024-2028",
            ),
            authorization=admin_auth,
        )
    assert exc_info.value.status_code == 400

    # Search institutions
    search_res = list_institutions(search="Pune")
    assert any(i.code == "IND-AICTE-9999" for i in search_res)

    # Add programme to the institution
    new_prog = create_programme(
        code="IND-AICTE-9999",
        payload=ProgrammeCreateRequest(
            name="B.Tech Cyber Security",
            code="CS-CYBER",
            admission_year="2024-2028",
            intake_cap=60,
        ),
        authorization=admin_auth,
    )
    assert new_prog.name == "B.Tech Cyber Security"
    assert new_prog.intake_cap == 60

    # Capacity check
    cap_data = get_institution_capacity("IND-AICTE-9999", authorization=admin_auth)
    assert cap_data["institution_code"] == "IND-AICTE-9999"
    assert len(cap_data["programmes"]) >= 1


def test_institution_scoped_authorization_and_cross_campus_isolation():
    # Login as Delhi Tech verifier (node user scoped to IND-AICTE-1042)
    node_login = login(UserLoginRequest(email="verifier@institute.edu", password="VerifyPass@2026"))
    node_auth = f"Bearer {node_login.token}"

    # Attempting to fetch students of another campus (IND-AICTE-3391) must be forbidden (403)
    with pytest.raises(HTTPException) as exc_info:
        list_students(institute_code="IND-AICTE-3391", authorization=node_auth)
    assert exc_info.value.status_code == 403

    # But fetching own campus (IND-AICTE-1042) succeeds
    own_students = list_students(institute_code="IND-AICTE-1042", authorization=node_auth)
    assert isinstance(own_students, list)
    for s in own_students:
        assert s.institute_code == "IND-AICTE-1042" or "1042" in (s.notes or "")


def test_csv_import_preview_with_unmatched_institutions_and_warnings():
    preview_rows = [
        {
            "student_name": "Siddharth Rao",
            "apaar_id": "9024-8172-5501-IN",
            "institution_code": "IND-AICTE-1042",
            "course": "B.Tech Computer Science & Engineering",
        },
        {
            "student_name": "Unknown Campus Student",
            "apaar_id": "8834-1120-7463-IN",
            "institution_code": "IND-UNKNOWN-9999",  # Unmatched
            "course": "B.Tech General",
        },
    ]

    preview = preview_batch_manifest(preview_rows)
    assert preview.total_rows == 2
    assert "IND-UNKNOWN-9999" in preview.unmatched_institutions
    assert any(m["code"] == "IND-AICTE-1042" for m in preview.matched_institutions)


def test_csv_field_preservation_and_error_export():
    # Test batch import with category, gender, dob
    records = [
        {
            "apaar_id": "9911-2233-4455-IN",
            "student_name": "Divya K. Raman",
            "institution_code": "IND-AICTE-1042",
            "institution_name": "Delhi Institute of Technology",
            "course": "B.Tech Artificial Intelligence",
            "admission_year": "2024-2028",
            "dob": "2005-04-12",
            "category": "OBC",
            "gender": "Female",
            "enrollment_number": "ENR-2024-999",
            "intake_cap": 60,
        },
        {
            "apaar_id": "SHORT-123",  # Will fail format validation (< 12 chars)
            "student_name": "Broken Format Record",
            "institution_code": "IND-AICTE-1042",
            "course": "B.Tech General",
        },
    ]

    summary = process_batch_manifest(records)
    assert summary.total_records == 2
    assert summary.skipped == 1
    assert len(summary.rejected_details) == 1
    assert summary.rejected_details[0].row_index == 2

    # Verify student details preserved dob, category, gender
    student = get_student_by_identifier("9911-2233-4455-IN")
    assert student.dob == "2005-04-12"
    assert student.category == "OBC"
    assert student.gender == "Female"

    # Verify downloadable errors CSV export
    csv_export = export_errors_csv(summary.rejected_details)
    assert "ROW_INDEX,APAAR_ID" in csv_export["csv"]
    assert "SHORT-123" in csv_export["csv"]
    assert csv_export["filename"].endswith(".csv")


def test_integrity_findings_and_review_workflow():
    # Login as Platform Administrator
    admin_login = login(UserLoginRequest(email="admin@aicte.gov.in", password="AdminPass@2026"))
    admin_auth = f"Bearer {admin_login.token}"

    # List findings
    findings = list_findings(authorization=admin_auth)
    assert len(findings) >= 1

    # Find the critical collision finding
    collision_fnd = next((f for f in findings if f.finding_type == FindingTypeEnum.DUPLICATE_CONCURRENT_ENROLMENT), None)
    assert collision_fnd is not None
    assert collision_fnd.severity.value == "CRITICAL"
    assert collision_fnd.review_status == ReviewStatusEnum.PENDING_REVIEW

    # Inspect finding detail with affected records
    detail = get_finding_detail(collision_fnd.id, authorization=admin_auth)
    assert detail["finding"].id == collision_fnd.id
    assert isinstance(detail["affected_records"], list)

    # Perform review: record decision and notes
    reviewed = review_finding(
        finding_id=collision_fnd.id,
        payload=FindingReviewRequest(
            decision="Simultaneous dual-enrolment verified via college registrar inquiry.",
            notes="Student submitted withdrawal letter from Mumbai Tech. Retained in Delhi Tech.",
            new_status=ReviewStatusEnum.RESOLVED_CONFIRMED_VIOLATION,
        ),
        authorization=admin_auth,
    )
    assert reviewed.review_status == ReviewStatusEnum.RESOLVED_CONFIRMED_VIOLATION
    assert "Simultaneous dual-enrolment" in reviewed.review_decision
    assert reviewed.reviewed_by is not None
    assert reviewed.reviewed_at is not None

    # Institution user scoped review permission check
    node_login = login(UserLoginRequest(email="verifier@institute.edu", password="VerifyPass@2026"))
    node_auth = f"Bearer {node_login.token}"

    # Node user can view findings pertaining to IND-AICTE-1042
    node_findings = list_findings(authorization=node_auth)
    for f in node_findings:
        assert (
            f.primary_institute_code == "IND-AICTE-1042"
            or f.secondary_institute_code == "IND-AICTE-1042"
            or "1042" in f.reason
        )


def test_audit_trail_logging_and_scoping():
    admin_login = login(UserLoginRequest(email="admin@aicte.gov.in", password="AdminPass@2026"))
    admin_auth = f"Bearer {admin_login.token}"

    # Platform admin can view audit logs
    audit_logs = list_audit_logs(authorization=admin_auth)
    assert len(audit_logs) >= 1
    assert any(log.action == "INTEGRITY_FINDING_REVIEWED" or log.action == "BATCH_IMPORT_EXECUTED" for log in audit_logs)

    # Node user scoped audit log view
    node_login = login(UserLoginRequest(email="verifier@institute.edu", password="VerifyPass@2026"))
    node_auth = f"Bearer {node_login.token}"

    node_logs = list_audit_logs(authorization=node_auth)
    for log in node_logs:
        assert (
            (log.actor_institution and "1042" in log.actor_institution)
            or (log.actor_email and "verifier@institute.edu" in log.actor_email)
            or "1042" in log.details
        )


def test_authoritative_database_verification_vs_sandbox():
    # 1. Verification of a real persisted student record in database
    res_persisted = verify_apaar("5512-9014-2281-IN")
    assert res_persisted.apaar_id == "5512-9014-2281-IN"
    assert res_persisted.source_type == "DATABASE_PERSISTED_LEDGER"
    assert res_persisted.is_sandbox is False
    assert res_persisted.is_valid is True
    assert res_persisted.institute == "National Institute of Technology, Trichy"

    # 2. Verification of a synthetic record not present in database
    res_sandbox = verify_apaar("9999-8888-7777-IN")
    assert res_sandbox.source_type == "SANDBOX_SYNTHETIC"
    assert res_sandbox.is_sandbox is True
    assert "SANDBOX SIMULATION" in res_sandbox.details


def test_reports_enrolment_capacity_and_findings():
    # Enrolment summary
    enr_summary = get_enrolment_summary()
    assert enr_summary["total_enrolments"] >= 1
    assert "categories_breakdown" in enr_summary
    assert "genders_breakdown" in enr_summary

    # Intake capacity report
    cap_rep = get_intake_capacity_report()
    assert cap_rep["total_approved_intake"] > 0
    assert "details" in cap_rep

    # Duplicate findings report
    dup_rep = get_duplicate_findings_report()
    assert dup_rep["total_findings"] >= 1

    # CSV exports
    csv_enr = export_report_csv("enrolment")
    assert "RECORD_ID,APAAR_ID_MASKED" in csv_enr["csv"]
    assert csv_enr["filename"].startswith("AICTE_Enrolment_Report")

    csv_cap = export_report_csv("capacity")
    assert "INSTITUTE_CODE,INSTITUTE_NAME" in csv_cap["csv"]

    csv_fnd = export_report_csv("findings")
    assert "FINDING_ID,TYPE,SEVERITY" in csv_fnd["csv"]


def test_empty_database_onboarding_and_clearing():
    admin_login = login(UserLoginRequest(email="admin@aicte.gov.in", password="AdminPass@2026"))
    admin_auth = f"Bearer {admin_login.token}"

    # 1. Clear all students
    clear_res = clear_all_data(authorization=admin_auth)
    assert clear_res["status"] == "success"
    assert clear_res["count"] == 0

    # 2. Metrics indicate empty state with 0 records
    met = get_metrics(authorization=admin_auth)
    assert met["total_students"] == 0
    assert met["is_empty"] is True

    # 3. Listing students returns empty array
    students = list_students(authorization=admin_auth)
    assert len(students) == 0

    # 4. Re-seed demo students
    seed_res = seed_demo_data(authorization=admin_auth)
    assert seed_res["status"] == "success"
    assert seed_res["count"] >= 3

    # 5. Verified non-empty
    met_after = get_metrics(authorization=admin_auth)
    assert met_after["total_students"] >= 3
    assert met_after["is_empty"] is False


def test_verification_demographics_and_category_preservation():
    # Persisted record for Aarav V. Suryavanshi ("9024-8172-5501-IN")
    res = verify_apaar("9024-8172-5501-IN")
    assert res.student_name == "Aarav V. Suryavanshi"
    assert res.source_type == "DATABASE_PERSISTED_LEDGER"
    assert res.is_sandbox is False
    assert res.category == "General"
    assert res.gender == "Male"
    assert res.enrollment_number is not None


def test_finding_review_invalid_finding_id():
    admin_login = login(UserLoginRequest(email="admin@aicte.gov.in", password="AdminPass@2026"))
    admin_auth = f"Bearer {admin_login.token}"

    with pytest.raises(HTTPException) as excinfo:
        review_finding(
            finding_id="NON_EXISTENT_FINDING_9999",
            payload=FindingReviewRequest(
                status=ReviewStatusEnum.RESOLVED_CONFIRMED_VIOLATION,
                decision="CONFIRMED_VIOLATION",
                notes="Reviewing non-existent finding"
            ),
            authorization=admin_auth
        )
    assert excinfo.value.status_code == 404




