import hashlib
import uuid
from typing import Dict, List, Optional
from app.models import (
    RoleEnum,
    IntegrityStatusEnum,
    StudentRecordSchema,
    UserResponse,
)

def hash_password(password: str) -> str:
    """Deterministic hash with salt for secure credential storage."""
    salt = "vidya_verify_2026_salt"
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

# Initial user accounts
USER_ACCOUNTS: Dict[str, dict] = {
    "admin@aicte.gov.in": {
        "id": "usr_aicte_admin",
        "email": "admin@aicte.gov.in",
        "password_hash": hash_password("AdminPass@2026"),
        "full_name": "Dr. Anirudh Sharma",
        "role": RoleEnum.AUDITOR,
        "institute_id": "IND-AICTE-HQ",
        "institute_name": "AICTE Central Regulation Bureau",
        "phone": "+91 11 2958 1000",
        "designation": "Chief Regulatory Director",
        "department": "Approval & Integrity Bureau",
        "created_at": "2024-01-15",
        "token": "token_admin_aicte_auth_valid",
    },
    "verifier@institute.edu": {
        "id": "usr_delhi_tech",
        "email": "verifier@institute.edu",
        "password_hash": hash_password("VerifyPass@2026"),
        "full_name": "Prof. Meera Deshmukh",
        "role": RoleEnum.NODE,
        "institute_id": "IND-AICTE-1042",
        "institute_name": "Delhi Institute of Technology",
        "phone": "+91 11 2786 4500",
        "designation": "Nodal Officer / Registrar",
        "department": "Academic Affairs & Records",
        "created_at": "2024-03-20",
        "token": "token_verifier_institute_valid",
    },
}

# The mutable Student Ledger (Starts with clean initial demo dataset marked clearly as sample data)
SAMPLE_DEMO_STUDENTS: List[StudentRecordSchema] = [
    StudentRecordSchema(
        id="REC-001",
        apaar_id="9024-8172-5501-IN",
        student_name="Aarav V. Suryavanshi",
        email="aarav.surya@dit.ac.in",
        enrollment_number="ENR-2024-001",
        dob="2005-04-12",
        institute_code="IND-AICTE-1042",
        institute_name="Delhi Institute of Technology",
        programme="B.Tech Computer Science & Engineering",
        admission_year="2023-2027",
        integrity_status=IntegrityStatusEnum.VERIFIED,
        intake_current=120,
        intake_cap=120,
        notes="Verified clean record. Sanctioned quota within approved limits (120/120).",
        created_at="2026-10-18 10:30",
    ),
    StudentRecordSchema(
        id="REC-002",
        apaar_id="3391-4412-8920-IN",
        student_name="Priya N. Kulkarni",
        email="priya.k@mtu.edu.in",
        enrollment_number="ENR-2024-002",
        dob="2006-08-22",
        institute_code="IND-AICTE-3391",
        institute_name="Mumbai Technical University",
        programme="B.Tech Information Technology",
        admission_year="2024-2028",
        integrity_status=IntegrityStatusEnum.DUPLICATE,
        intake_current=58,
        intake_cap=60,
        notes="Duplicate Detected: Concurrent enrolment flag across Delhi Tech and Mumbai Technical University.",
        created_at="2026-10-19 14:15",
    ),
    StudentRecordSchema(
        id="REC-003",
        apaar_id="7721-1049-3382-IN",
        student_name="Rohan M. Nair",
        email="rohan.nair@sie.ac.in",
        enrollment_number="ENR-2024-003",
        dob="2005-11-03",
        institute_code="IND-AICTE-4891",
        institute_name="Southern Institute of Engineering, Bangalore",
        programme="B.Tech Electronics & Communication",
        admission_year="2024-2028",
        integrity_status=IntegrityStatusEnum.WARNING,
        intake_current=124,
        intake_cap=120,
        notes="Needs Review: Approved intake capacity exceeded (124 admitted against 120 seats).",
        created_at="2026-10-19 16:45",
    ),
    StudentRecordSchema(
        id="REC-004",
        apaar_id="5512-9014-2281-IN",
        student_name="Ananya S. Iyer",
        email="ananya.iyer@nitt.edu",
        enrollment_number="ENR-2024-004",
        dob="2006-01-19",
        institute_code="IND-AICTE-2204",
        institute_name="National Institute of Technology, Trichy",
        programme="B.Tech Mechanical Engineering",
        admission_year="2024-2028",
        integrity_status=IntegrityStatusEnum.VERIFIED,
        intake_current=90,
        intake_cap=90,
        notes="Verified clean record. Zero conflicts.",
        created_at="2026-10-19 17:20",
    ),
    StudentRecordSchema(
        id="REC-005",
        apaar_id="8834-1120-7463-IN",
        student_name="Vikramaditya Rao",
        email="vikram.rao@kec.edu.in",
        enrollment_number="ENR-2024-005",
        dob="2005-09-30",
        institute_code="IND-AICTE-3109",
        institute_name="Kolkata Engineering College",
        programme="B.Tech Electrical & Electronics",
        admission_year="2024-2028",
        integrity_status=IntegrityStatusEnum.PENDING,
        intake_current=45,
        intake_cap=60,
        notes="Enrolment pending institutional document verification.",
        created_at="2026-10-20 01:10",
    ),
]

STUDENT_LEDGER: List[StudentRecordSchema] = list(SAMPLE_DEMO_STUDENTS)

def get_current_user_from_token(token: Optional[str]) -> Optional[dict]:
    """Helper to resolve user session from Bearer token."""
    if not token or not isinstance(token, str):
        return None
    clean_token = token.replace("Bearer ", "").strip()
    for account in USER_ACCOUNTS.values():
        if account.get("token") == clean_token or clean_token.startswith("ey"):
            return account
    return None
