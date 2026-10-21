from sqlalchemy import Column, String, Integer, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class UserORM(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False, default="node")
    institute_id = Column(String(64), nullable=True, index=True)
    institute_name = Column(String(255), nullable=True)
    phone = Column(String(32), nullable=True)
    designation = Column(String(128), nullable=True)
    department = Column(String(128), nullable=True)
    created_at = Column(String(32), nullable=False)
    token = Column(String(255), nullable=True, index=True)


class InstitutionORM(Base):
    __tablename__ = "institutions"

    id = Column(String(64), primary_key=True)
    code = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(128), nullable=False)
    state = Column(String(128), nullable=False)
    city = Column(String(128), nullable=False)
    address = Column(String(512), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(32), nullable=True)
    status = Column(String(32), nullable=False, default="APPROVED")
    created_at = Column(String(32), nullable=False)

    programmes = relationship("ProgrammeORM", back_populates="institution", cascade="all, delete-orphan")
    students = relationship("StudentRecordORM", back_populates="institution")
    intake_allocations = relationship("InstitutionIntakeORM", back_populates="institution", cascade="all, delete-orphan")


class InstitutionIntakeORM(Base):
    __tablename__ = "institution_intakes"

    id = Column(String(64), primary_key=True)
    institution_code = Column(String(64), ForeignKey("institutions.code", ondelete="CASCADE"), nullable=False, index=True)
    academic_session = Column(String(32), nullable=False)
    sanctioned_intake = Column(Integer, nullable=False)
    created_at = Column(String(32), nullable=False)
    updated_at = Column(String(32), nullable=True)

    institution = relationship("InstitutionORM", back_populates="intake_allocations")

    __table_args__ = (
        UniqueConstraint("institution_code", "academic_session", name="uq_institution_intake_session"),
    )


class ProgrammeORM(Base):
    __tablename__ = "programmes"

    id = Column(String(64), primary_key=True)
    institution_code = Column(String(64), ForeignKey("institutions.code", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(64), nullable=True)
    admission_year = Column(String(32), nullable=False)
    intake_cap = Column(Integer, nullable=False, default=60)
    intake_current = Column(Integer, nullable=False, default=0)
    status = Column(String(32), nullable=False, default="active")
    created_at = Column(String(32), nullable=False)

    institution = relationship("InstitutionORM", back_populates="programmes")

    __table_args__ = (
        UniqueConstraint("institution_code", "name", "admission_year", name="uq_programme_institution_session"),
    )


class StudentRecordORM(Base):
    __tablename__ = "student_records"

    id = Column(String(64), primary_key=True)
    apaar_id = Column(String(64), index=True, nullable=False)
    apaar_id_norm = Column(String(64), index=True, nullable=False)
    student_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    enrollment_number = Column(String(64), nullable=True)
    dob = Column(String(32), nullable=True)
    category = Column(String(32), nullable=True, default="General")
    gender = Column(String(32), nullable=True)
    institute_code = Column(String(64), ForeignKey("institutions.code"), nullable=False, index=True)
    institute_name = Column(String(255), nullable=False)
    programme = Column(String(255), nullable=False)
    admission_year = Column(String(32), nullable=False)
    integrity_status = Column(String(32), nullable=False, default="pending")
    verification_status = Column(String(32), nullable=False, default="pending")
    intake_current = Column(Integer, nullable=False, default=0)
    intake_cap = Column(Integer, nullable=False, default=60)
    merkle_root = Column(String(128), nullable=True)
    ecdsa_signature = Column(String(256), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(String(32), nullable=False)
    updated_at = Column(String(32), nullable=True)

    institution = relationship("InstitutionORM", back_populates="students")


class IntegrityFindingORM(Base):
    __tablename__ = "integrity_findings"

    id = Column(String(64), primary_key=True)
    finding_type = Column(String(64), index=True, nullable=False)
    severity = Column(String(32), index=True, nullable=False)
    apaar_id_masked = Column(String(64), nullable=False)
    apaar_id = Column(String(64), nullable=False)
    student_name = Column(String(255), nullable=False)
    primary_institute_code = Column(String(64), index=True, nullable=False)
    primary_institute_name = Column(String(255), nullable=False)
    secondary_institute_code = Column(String(64), nullable=True)
    secondary_institute_name = Column(String(255), nullable=True)
    programme = Column(String(255), nullable=False)
    admission_year = Column(String(32), nullable=False)
    affected_record_ids = Column(Text, nullable=False, default="[]")  # JSON string
    reason = Column(Text, nullable=False)
    review_status = Column(String(32), index=True, nullable=False, default="PENDING_REVIEW")
    review_decision = Column(String(64), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(String(32), nullable=True)
    detection_timestamp = Column(String(32), nullable=False)


class AuditEventORM(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True)
    actor_email = Column(String(255), nullable=False)
    actor_role = Column(String(64), nullable=False)
    actor_institution = Column(String(64), nullable=True, index=True)
    action = Column(String(64), index=True, nullable=False)
    target_type = Column(String(64), nullable=False)
    target_id = Column(String(64), nullable=True)
    details = Column(Text, nullable=False)
    outcome = Column(String(32), nullable=False, default="SUCCESS")
    timestamp = Column(String(32), nullable=False)


class BatchImportLogORM(Base):
    __tablename__ = "batch_import_logs"

    id = Column(String(64), primary_key=True)
    filename = Column(String(255), nullable=True)
    total_rows = Column(Integer, nullable=False, default=0)
    created_rows = Column(Integer, nullable=False, default=0)
    updated_rows = Column(Integer, nullable=False, default=0)
    skipped_rows = Column(Integer, nullable=False, default=0)
    duplicate_collisions = Column(Integer, nullable=False, default=0)
    intake_warnings = Column(Integer, nullable=False, default=0)
    merkle_batch_hash = Column(String(128), nullable=True)
    rejected_details = Column(Text, nullable=True, default="[]")  # JSON string
    created_at = Column(String(32), nullable=False)


class VerificationHistoryORM(Base):
    __tablename__ = "verification_history"

    id = Column(String(64), primary_key=True)
    apaar_id = Column(String(64), nullable=False)
    apaar_id_masked = Column(String(64), nullable=False)
    status = Column(String(32), index=True, nullable=False)  # CLEAN, COLLISION, QUOTA ALERT, NOT FOUND, ERROR
    source_type = Column(String(64), nullable=False)  # DATABASE_PERSISTED_LEDGER, SANDBOX_SYNTHETIC, NOT_FOUND
    is_sandbox = Column(Integer, nullable=False, default=0)  # 0=false, 1=true (boolean compat for SQLite)
    institution_code = Column(String(64), nullable=True, index=True)
    institution_name = Column(String(255), nullable=True)
    programme = Column(String(255), nullable=True)
    actor_email = Column(String(255), nullable=True)
    actor_role = Column(String(64), nullable=True)
    actor_institution = Column(String(64), nullable=True, index=True)
    session_id = Column(String(64), nullable=True, index=True)
    timestamp = Column(String(32), index=True, nullable=False)

