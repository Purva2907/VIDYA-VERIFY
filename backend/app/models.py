import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class RoleEnum(str, Enum):
    NODE = "node"
    AUDITOR = "auditor"
    PUBLIC = "public"


class IntegrityStatusEnum(str, Enum):
    VERIFIED = "verified"
    DUPLICATE = "duplicate"
    WARNING = "warning"
    PENDING = "pending"


# --- Pydantic Schemas ---

class UserLoginRequest(BaseModel):
    email: str
    password: str
    role: RoleEnum = RoleEnum.NODE


class UserRegisterRequest(BaseModel):
    aicte_id: str
    institute_name: str
    nodal_officer: str
    email: str
    password: str
    region: str
    requested_role: RoleEnum = RoleEnum.NODE


class UserResponse(BaseModel):
    id: str
    email: str
    role: RoleEnum
    institute_id: Optional[str] = None
    institute_name: Optional[str] = None
    token: str


class StudentRecordSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    apaar_id: str
    student_name: str
    dob: Optional[str] = None
    institute_code: str
    institute_name: str
    programme: str
    admission_year: str
    integrity_status: IntegrityStatusEnum
    intake_current: int
    intake_cap: int
    merkle_root: Optional[str] = None
    ecdsa_signature: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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


class IntakeQuotaSummary(BaseModel):
    institute_code: str
    institute_name: str
    programme: str
    sanctioned_cap: int
    enrolled_count: int
    is_exceeded: bool
    utilization_pct: float


class BatchImportSummary(BaseModel):
    batch_id: str
    total_records: int
    clean_approved: int
    duplicate_collisions: int
    intake_warnings: int
    merkle_batch_hash: str
    records: List[StudentRecordSchema]
