import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, model_validator, field_validator


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


class InstitutionStatusEnum(str, Enum):
    APPROVED = "approved"
    PENDING_REVIEW = "pending_review"
    PROVISIONAL = "provisional"


class FindingSeverityEnum(str, Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"


class ReviewStatusEnum(str, Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED_CLEARED = "RESOLVED_CLEARED"
    RESOLVED_CONFIRMED_VIOLATION = "RESOLVED_CONFIRMED_VIOLATION"
    DISMISSED = "DISMISSED"


class FindingTypeEnum(str, Enum):
    DUPLICATE_CONCURRENT_ENROLMENT = "DUPLICATE_CONCURRENT_ENROLMENT"
    INTAKE_CAPACITY_EXCEEDED = "INTAKE_CAPACITY_EXCEEDED"
    FORMAT_MISMATCH = "FORMAT_MISMATCH"
    INSTITUTION_PROGRAMME_MISMATCH = "INSTITUTION_PROGRAMME_MISMATCH"
    DATA_INTEGRITY_INCONSISTENCY = "DATA_INTEGRITY_INCONSISTENCY"


# --- Institution & Programme Schemas ---

class InstitutionIntakeSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    institution_code: str
    academic_session: str = "2024-2028"
    sanctioned_intake: int
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"))
    updated_at: Optional[str] = None


class InstitutionProgramme(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    institution_code: str
    name: str
    code: Optional[str] = None
    admission_year: str = "2024-2028"
    intake_cap: int = 60
    intake_current: int = 0
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))


class InstitutionSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    type: str = "AICTE Approved Technical Institution"
    state: str = "Delhi"
    city: str = "New Delhi"
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: InstitutionStatusEnum = InstitutionStatusEnum.APPROVED
    programmes_count: int = 0
    students_count: int = 0
    total_approved_intake: int = 0
    current_enrolment: int = 0
    capacity_utilization_pct: float = 0.0
    academic_session: Optional[str] = "2024-2028"
    remaining_capacity: int = 0
    programme_allocations_total: int = 0
    has_allocation_warning: bool = False
    allocation_warning_message: Optional[str] = None
    intake_allocations: List[InstitutionIntakeSchema] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))


class InstitutionCreateRequest(BaseModel):
    name: str
    code: str
    type: Optional[str] = "AICTE Approved Technical Institution"
    state: str
    city: str
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: Optional[InstitutionStatusEnum] = InstitutionStatusEnum.APPROVED
    sanctioned_intake: int = Field(..., description="Total Sanctioned Intake (positive integer)")
    academic_session: str = Field("2024-2028", description="Academic Session (e.g. 2024-2028)")

    @field_validator("sanctioned_intake", mode="before")
    @classmethod
    def validate_sanctioned_intake(cls, v: Any) -> int:
        if v is None:
            raise ValueError("Total sanctioned intake is required.")
        if isinstance(v, bool):
            raise ValueError("Total sanctioned intake must be an integer, not boolean.")
        if isinstance(v, float) and not v.is_integer():
            raise ValueError("Total sanctioned intake must be a whole positive integer.")
        if isinstance(v, str):
            clean_str = v.strip()
            if not clean_str:
                raise ValueError("Total sanctioned intake is required.")
            if "." in clean_str:
                raise ValueError("Total sanctioned intake cannot be a decimal.")
            try:
                v = int(clean_str)
            except ValueError:
                raise ValueError("Total sanctioned intake must be a valid integer.")
        try:
            int_val = int(v)
        except (TypeError, ValueError):
            raise ValueError("Total sanctioned intake must be a valid integer.")
        if int_val <= 0:
            raise ValueError("Total sanctioned intake must be a strictly positive integer (> 0).")
        return int_val

    @field_validator("academic_session", mode="before")
    @classmethod
    def validate_academic_session(cls, v: Any) -> str:
        clean = str(v).strip() if v is not None else ""
        if not clean:
            raise ValueError("Academic session is required.")
        return clean


class InstitutionUpdateRequest(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: Optional[InstitutionStatusEnum] = None
    sanctioned_intake: Optional[int] = None
    academic_session: Optional[str] = None


class InstitutionIntakeConfigureRequest(BaseModel):
    academic_session: str = "2024-2028"
    sanctioned_intake: int

    @field_validator("sanctioned_intake", mode="before")
    @classmethod
    def validate_intake(cls, v: Any) -> int:
        if v is None or isinstance(v, bool):
            raise ValueError("Sanctioned intake is required.")
        if isinstance(v, float) and not v.is_integer():
            raise ValueError("Sanctioned intake must be a whole positive integer.")
        if isinstance(v, str):
            clean_str = v.strip()
            if not clean_str:
                raise ValueError("Sanctioned intake is required.")
            if "." in clean_str:
                raise ValueError("Sanctioned intake cannot be a decimal.")
            try:
                v = int(clean_str)
            except ValueError:
                raise ValueError("Sanctioned intake must be a valid integer.")
        int_val = int(v)
        if int_val <= 0:
            raise ValueError("Sanctioned intake must be a strictly positive integer (> 0).")
        return int_val

    @field_validator("academic_session", mode="before")
    @classmethod
    def validate_session(cls, v: Any) -> str:
        clean = str(v).strip() if v is not None else ""
        if not clean:
            raise ValueError("Academic session is required.")
        return clean


class ProgrammeCreateRequest(BaseModel):
    name: str
    code: Optional[str] = None
    admission_year: Optional[str] = "2024-2028"
    intake_cap: Optional[int] = 60
    status: Optional[str] = "active"


class ProgrammeUpdateRequest(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    admission_year: Optional[str] = None
    intake_cap: Optional[int] = None
    status: Optional[str] = None



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
    category: Optional[str] = None
    gender: Optional[str] = None
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
    dob: Optional[str] = None
    category: Optional[str] = None
    gender: Optional[str] = None
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
    source_type: str = "DATABASE_PERSISTED_LEDGER"
    is_sandbox: bool = True
    is_external_official: bool = False
    details: str
    dob: Optional[str] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    enrollment_number: Optional[str] = None


class RejectedRowError(BaseModel):
    row_index: int
    apaar_id: Optional[str] = None
    student_name: Optional[str] = None
    institute_code: Optional[str] = None
    error_reason: str


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
    rejected_details: List[RejectedRowError] = []
    records: List[StudentRecordSchema]


# --- Findings, Audit & Reports Schemas ---

class IntegrityFindingSchema(BaseModel):
    id: str = Field(default_factory=lambda: f"FND-{uuid.uuid4().hex[:8].upper()}")
    finding_type: FindingTypeEnum
    severity: FindingSeverityEnum
    apaar_id_masked: str
    apaar_id: str
    student_name: str
    primary_institute_code: str
    primary_institute_name: str
    secondary_institute_code: Optional[str] = None
    secondary_institute_name: Optional[str] = None
    programme: str
    admission_year: str
    affected_record_ids: List[str] = Field(default_factory=list)
    reason: str
    review_status: ReviewStatusEnum = ReviewStatusEnum.PENDING_REVIEW
    review_decision: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    detection_timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))


class FindingReviewRequest(BaseModel):
    decision: str
    notes: Optional[str] = None
    new_status: Optional[ReviewStatusEnum] = None
    status: Optional[ReviewStatusEnum] = None

    @model_validator(mode="after")
    def resolve_status(self) -> "FindingReviewRequest":
        if self.status and not self.new_status:
            self.new_status = self.status
        elif not self.new_status:
            self.new_status = ReviewStatusEnum.RESOLVED_CLEARED
        return self


class AuditEventSchema(BaseModel):
    id: str = Field(default_factory=lambda: f"AUD-{uuid.uuid4().hex[:8].upper()}")
    actor_email: str
    actor_role: str
    actor_institution: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: str
    outcome: str = "SUCCESS"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))


class VerificationHistoryItem(BaseModel):
    id: str
    apaar_masked: str
    apaar_raw: str
    status: str  # "CLEAN", "COLLISION", "QUOTA ALERT", "NOT FOUND"
    timestamp: str
    institution_code: Optional[str] = None
    institution_name: Optional[str] = None
    programme: Optional[str] = None
    source_type: str
    is_sandbox: bool


class VerificationHistoryResponse(BaseModel):
    items: List[VerificationHistoryItem]
    total: int
    limit: int
    offset: int



