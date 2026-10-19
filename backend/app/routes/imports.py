import uuid
from typing import List, Dict, Any
from fastapi import APIRouter
from app.models import BatchImportSummary, StudentRecordSchema, IntegrityStatusEnum
from app.services.integrity_engine import IntegrityEngine

router = APIRouter(prefix="/api/imports", tags=["Imports"])


@router.post("/batch", response_model=BatchImportSummary)
def process_batch_manifest(records: List[Dict[str, Any]]):
    """Processes batch student enrolment manifests and applies integrity rules."""
    parsed_students: List[StudentRecordSchema] = []
    clean_count = 0
    duplicate_count = 0
    warning_count = 0

    existing_enrolments = [
        {"apaar_id": "3391-4412-8920-IN", "institute_code": "IND-AICTE-DELHI", "institute_name": "Delhi Tech Campus"}
    ]

    for item in records:
        apaar = item.get("apaar_id", "UNKNOWN-APAAR")
        name = item.get("student_name", "Candidate")
        inst_code = item.get("institute_code", "IND-AICTE-1042")
        inst_name = item.get("institute_name", "Enrolling Campus")
        prog = item.get("programme", "B.Tech General")
        year = item.get("admission_year", "2024-2028")
        curr = int(item.get("intake_current", 50))
        cap = int(item.get("intake_cap", 60))

        evaluated = IntegrityEngine.evaluate_student_integrity(
            apaar_id=apaar,
            student_name=name,
            institute_code=inst_code,
            institute_name=inst_name,
            programme=prog,
            admission_year=year,
            current_intake=curr,
            intake_cap=cap,
            existing_enrolments=existing_enrolments,
        )

        if evaluated.integrity_status == IntegrityStatusEnum.VERIFIED:
            clean_count += 1
        elif evaluated.integrity_status == IntegrityStatusEnum.DUPLICATE:
            duplicate_count += 1
        elif evaluated.integrity_status == IntegrityStatusEnum.WARNING:
            warning_count += 1

        parsed_students.append(evaluated)

    merkle_batch = IntegrityEngine.calculate_merkle_root([s.apaar_id for s in parsed_students])

    return BatchImportSummary(
        batch_id=str(uuid.uuid4()),
        total_records=len(parsed_students),
        clean_approved=clean_count,
        duplicate_collisions=duplicate_count,
        intake_warnings=warning_count,
        merkle_batch_hash=merkle_batch,
        records=parsed_students,
    )
