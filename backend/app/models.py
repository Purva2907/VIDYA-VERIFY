import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, model_validator


class RoleEnum(str, Enum):
    AUDITOR = "auditor"      # AICTE Central Administrator
    NODE = "node"            # Institution Verifier
    STUDENT = "student"      # Student candidate
    PUBLIC = "public"


class IntegrityStatusEnum(str, Enum):
    VERIFIED = "verified"
    PENDING = "pending"
    WARNING = "warning"       # Needs Review / Intake Alert
    DUPLICATE = "duplicate"   # Duplicate Collision


# --- Authentication & Profile Schemas ---

class UserLoginRequest(BaseModel):
    email: str
    password: str


class UserRegisterRequest(BaseModel):
    aicte_id: str
    institute_name: str
    nodal_officer: str
    email: str
    password: str
    region: str
    requested_role: RoleEnum = RoleEnum.NODE


class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: RoleEnum
    institute_id: Optional[str] = None
    institute_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    created_at: str
    token: str


# --- Student Records Schemas ---

class StudentRecordSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    apaar_id: str
    student_name: str
    email: Optional[str] = None
    enrollment_number: Optional[str] = None
    dob: Optional[str] = None
    institute_code: str
    institute_name: str
    programme: str
    admission_year: str
    # Dual-naming compatibility aliases for standard CSV headers
    institution_code: Optional[str] = None
    institution_name: Optional[str] = None
    course: Optional[str] = None
    academic_year: Optional[str] = None
    verification_status: Optional[str] = None
    integrity_status: IntegrityStatusEnum = IntegrityStatusEnum.PENDING
    intake_current: int = 1
    intake_cap: int = 60
    merkle_root: Optional[str] = None
    ecdsa_signature: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"))
    updated_at: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_aliases_before(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Map alternative naming conventions into canonical fields
            if "institution_code" in data and not data.get("institute_code"):
                data["institute_code"] = data["institution_code"]
            if "institution_name" in data and not data.get("institute_name"):
                data["institute_name"] = data["institution_name"]
            if "course" in data and not data.get("programme"):
                data["programme"] = data["course"]
            if "academic_year" in data and not data.get("admission_year"):
                data["admission_year"] = data["academic_year"]
            if "verification_status" in data and not data.get("integrity_status"):
                status_str = str(data["verification_status"]).strip().lower()
                for e in IntegrityStatusEnum:
                    if e.value == status_str:
                        data["integrity_status"] = e
                        break
        return data

    @model_validator(mode="after")
    def sync_aliases_after(self) -> "StudentRecordSchema":
        self.institution_code = self.institute_code
        self.institution_name = self.institute_name
        self.course = self.programme
        self.academic_year = self.admission_year
        self.verification_status = self.integrity_status.value
        return self


class StudentCreateRequest(BaseModel):
    apaar_id: str
    student_name: str
    email: Optional[str] = None
    enrollment_number: Optional[str] = None
    institute_code: Optional[str] = None
    institution_code: Optional[str] = None
    institute_name: Optional[str] = None
    institution_name: Optional[str] = None
    programme: Optional[str] = None
    course: Optional[str] = None
    admission_year: Optional[str] = None
    academic_year: Optional[str] = None
    intake_current: Optional[int] = 60
    intake_cap: Optional[int] = 60
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "institution_code" in data and not data.get("institute_code"):
                data["institute_code"] = data["institution_code"]
            if "institution_name" in data and not data.get("institute_name"):
                data["institute_name"] = data["institution_name"]
            if "course" in data and not data.get("programme"):
                data["programme"] = data["course"]
            if "academic_year" in data and not data.get("admission_year"):
                data["admission_year"] = data["academic_year"]
        return data


# --- Verification & Analytics Schemas ---

class VerificationRequest(BaseModel):
    apaar_id: str


class VerificationResponse(BaseModel):
    apaar_id: str
    student_name: str
    institute: str
    institute_code: str
    programme: str
    admission_year: str
    status: str
    is_valid: bool
    has_duplicate_collision: bool
    has_intake_warning: bool
    merkle_root: str
    ecdsa_signature: str
    timestamp: str
    adapter_mode: str = "SANDBOX_SYNTHETIC"
    details: str


class BatchImportSummary(BaseModel):
    batch_id: str
    total_records: int
    created: int = 0
    updated: int = 0
    skipped: int = 0
    clean_approved: int
    duplicate_collisions: int
    intake_warnings: int
    merkle_batch_hash: str
    errors: List[str] = []
    records: List[StudentRecordSchema]

