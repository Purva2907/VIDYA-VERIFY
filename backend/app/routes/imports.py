import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter
from app.models import BatchImportSummary, StudentRecordSchema, IntegrityStatusEnum
from app.services.integrity_engine import IntegrityEngine
from app.services.apaar_adapter import SandboxAPAARAdapter
from app.db import STUDENT_LEDGER

router = APIRouter(prefix="/api/imports", tags=["Imports"])


def _extract_str(row: Dict[str, Any], *keys: str) -> Optional[str]:
    """Helper to extract and trim string values from row using multiple key aliases."""
    for key in keys:
        for r_key, r_val in row.items():
            if str(r_key).strip().lower() == key.lower() and r_val is not None:
                val_str = str(r_val).strip()
                if val_str:
                    return val_str
    return None


@router.post("/batch", response_model=BatchImportSummary)
def process_batch_manifest(records: List[Dict[str, Any]]):
    """
    Processes batch student enrolment manifests.
    - Accurately maps 9 standard headers (student_name, email, institution_name,
      institution_code, course, academic_year, apaar_id, enrollment_number, verification_status).
    - Uses apaar_id as documented unique student matching key.
    - Updates existing records for matching campus, or flags cross-campus collisions.
    - Returns summary with created, updated, skipped, errors, and integrity counts.
    """
    parsed_students: List[StudentRecordSchema] = []
    created_count = 0
    updated_count = 0
    skipped_count = 0
    clean_count = 0
    duplicate_count = 0
    warning_count = 0
    errors_list: List[str] = []

    # Map of current records for fast lookup
    # apaar_id -> existing StudentRecordSchema
    existing_by_apaar: Dict[str, StudentRecordSchema] = {
        s.apaar_id.strip(): s for s in STUDENT_LEDGER
    }

    for idx, item in enumerate(records, start=1):
        if not isinstance(item, dict):
            skipped_count += 1
            errors_list.append(f"Row {idx}: Invalid row format (expected key-value object).")
            continue

        # 1. Extract and trim all 9 supported fields
        apaar = _extract_str(item, "apaar_id", "apaar", "apaarid")
        student_name = _extract_str(item, "student_name", "name", "candidate_name")
        email = _extract_str(item, "email", "student_email", "mail")
        inst_name = _extract_str(item, "institution_name", "institute_name", "college_name", "university")
        inst_code = _extract_str(item, "institution_code", "institute_code", "college_code", "campus_code")
        course = _extract_str(item, "course", "programme", "program", "branch", "degree")
        academic_year = _extract_str(item, "academic_year", "admission_year", "session", "batch_year")
        enrollment_num = _extract_str(item, "enrollment_number", "enrollment_no", "roll_no", "reg_no")
        # Note: verification_status from CSV is captured but not trusted blindly
        csv_status = _extract_str(item, "verification_status", "integrity_status", "status")

        # 2. Validation
        if not apaar:
            skipped_count += 1
            errors_list.append(f"Row {idx}: Missing mandatory APAAR identifier (apaar_id).")
            continue

        if not student_name:
            skipped_count += 1
            errors_list.append(f"Row {idx} ({apaar}): Missing student name.")
            continue

        if not SandboxAPAARAdapter.validate_format(apaar):
            skipped_count += 1
            errors_list.append(
                f"Row {idx} ({apaar}): Invalid APAAR identifier format. Must be 12 digits or 'XXXX-XXXX-XXXX-IN'."
            )
            continue

        # 3. Defaults for non-mandatory metadata
        final_inst_code = inst_code or "IND-AICTE-1042"
        final_inst_name = inst_name or "Delhi Institute of Technology"
        final_course = course or "B.Tech General"
        final_academic_year = academic_year or "2024-2028"

        # Current & cap intake values
        try:
            curr = int(item.get("intake_current") or 50)
        except (ValueError, TypeError):
            curr = 50
        try:
            cap = int(item.get("intake_cap") or 60)
        except (ValueError, TypeError):
            cap = 60

        # Existing enrolments list for collision detection
        existing_enrolments = [
            {"apaar_id": s.apaar_id, "institute_code": s.institute_code, "institute_name": s.institute_name}
            for s in STUDENT_LEDGER
        ]

        # 4. Persistence & Matching Key Logic
        # Check if student with apaar_id already exists in ledger
        existing_record = existing_by_apaar.get(apaar)

        if existing_record and existing_record.institute_code == final_inst_code:
            # SAME CAMPUS UPDATE: Update fields and re-evaluate
            existing_record.student_name = student_name
            if email:
                existing_record.email = email
            if enrollment_num:
                existing_record.enrollment_number = enrollment_num
            existing_record.institute_name = final_inst_name
            existing_record.institution_name = final_inst_name
            existing_record.institute_code = final_inst_code
            existing_record.institution_code = final_inst_code
            existing_record.programme = final_course
            existing_record.course = final_course
            existing_record.admission_year = final_academic_year
            existing_record.academic_year = final_academic_year
            existing_record.updated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

            # Exclude self from collision checking
            other_enrolments = [
                e for e in existing_enrolments
                if not (e.get("apaar_id") == apaar and e.get("institute_code") == final_inst_code)
            ]

            re_evaluated = IntegrityEngine.evaluate_student_integrity(
                apaar_id=apaar,
                student_name=student_name,
                institute_code=final_inst_code,
                institute_name=final_inst_name,
                programme=final_course,
                admission_year=final_academic_year,
                current_intake=curr,
                intake_cap=cap,
                existing_enrolments=other_enrolments,
                email=existing_record.email,
                enrollment_number=existing_record.enrollment_number,
                record_id=existing_record.id,
            )

            existing_record.integrity_status = re_evaluated.integrity_status
            existing_record.verification_status = re_evaluated.integrity_status.value
            existing_record.notes = re_evaluated.notes
            existing_record.merkle_root = re_evaluated.merkle_root
            existing_record.ecdsa_signature = re_evaluated.ecdsa_signature

            updated_count += 1
            if existing_record.integrity_status == IntegrityStatusEnum.VERIFIED:
                clean_count += 1
            elif existing_record.integrity_status == IntegrityStatusEnum.DUPLICATE:
                duplicate_count += 1
            elif existing_record.integrity_status == IntegrityStatusEnum.WARNING:
                warning_count += 1

            parsed_students.append(existing_record)

        else:
            # NEW RECORD (or cross-campus concurrent duplicate)
            evaluated = IntegrityEngine.evaluate_student_integrity(
                apaar_id=apaar,
                student_name=student_name,
                institute_code=final_inst_code,
                institute_name=final_inst_name,
                programme=final_course,
                admission_year=final_academic_year,
                current_intake=curr,
                intake_cap=cap,
                existing_enrolments=existing_enrolments,
                email=email,
                enrollment_number=enrollment_num,
            )

            # Prepend into active ledger so newest appears at top
            STUDENT_LEDGER.insert(0, evaluated)
            existing_by_apaar[apaar] = evaluated
            created_count += 1

            if evaluated.integrity_status == IntegrityStatusEnum.VERIFIED:
                clean_count += 1
            elif evaluated.integrity_status == IntegrityStatusEnum.DUPLICATE:
                duplicate_count += 1
            elif evaluated.integrity_status == IntegrityStatusEnum.WARNING:
                warning_count += 1

            parsed_students.append(evaluated)

    # Deterministic batch merkle root
    merkle_batch = IntegrityEngine.calculate_merkle_root(
        [s.apaar_id for s in parsed_students] if parsed_students else ["EMPTY_BATCH"]
    )

    return BatchImportSummary(
        batch_id=f"BATCH-{str(uuid.uuid4())[:8].upper()}",
        total_records=len(records),
        created=created_count,
        updated=updated_count,
        skipped=skipped_count,
        clean_approved=clean_count,
        duplicate_collisions=duplicate_count,
        intake_warnings=warning_count,
        merkle_batch_hash=merkle_batch,
        errors=errors_list,
        records=parsed_students,
    )
