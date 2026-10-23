import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Header, HTTPException, Query, status
from pydantic import BaseModel

from app.models import (
    BatchImportSummary,
    StudentRecordSchema,
    IntegrityStatusEnum,
    RoleEnum,
    InstitutionSchema,
    InstitutionProgramme,
    InstitutionStatusEnum,
    IntegrityFindingSchema,
    FindingSeverityEnum,
    FindingTypeEnum,
    ReviewStatusEnum,
    RejectedRowError,
)
from app.services.integrity_engine import IntegrityEngine
from app.services.apaar_adapter import SandboxAPAARAdapter
from app.db import (
    STUDENT_LEDGER,
    INSTITUTIONS_DB,
    PROGRAMMES_DB,
    INTEGRITY_FINDINGS_DB,
    log_audit_event,
    get_current_user_from_token,
)

router = APIRouter(prefix="/api/imports", tags=["Imports"])


class ImportPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    detected_columns: List[str]
    matched_institutions: List[Dict[str, Any]]
    unmatched_institutions: List[str]
    programme_mapping_issues: List[str]
    intake_capacity_warnings: List[str]
    sample_preview: List[Dict[str, Any]]
    invalid_records: List[Dict[str, Any]] = []


def _extract_str(row: Dict[str, Any], *keys: str) -> Optional[str]:
    """Helper to extract and trim string values from row using multiple key aliases."""
    for key in keys:
        for r_key, r_val in row.items():
            if str(r_key).strip().lower() == key.lower() and r_val is not None:
                val_str = str(r_val).strip()
                if val_str:
                    return val_str
    return None


def sanitize_csv_cell(val: Any) -> str:
    """Mitigates spreadsheet formula injection by prepending dangerous leading characters with a single quote."""
    if val is None:
        return ""
    val_str = str(val).strip()
    if val_str and val_str[0] in ("=", "+", "-", "@", "\t", "\r"):
        val_str = f"'{val_str}"
    return val_str.replace('"', '""')


@router.get("/template")
def download_import_template():
    """Returns downloadable CSV template with standard AICTE enrolment headers."""
    header = "APAAR_ID,STUDENT_NAME,INSTITUTE_CODE,INSTITUTE_NAME,PROGRAMME,ADMISSION_YEAR,INTAKE_CURRENT,INTAKE_CAP,CATEGORY,GENDER,DOB,EMAIL,ENROLLMENT_NUMBER"
    sample_row = "9024-8172-5501-IN,Aarav V. Suryavanshi,IND-AICTE-1042,Delhi Institute of Technology,B.Tech Computer Science & AI,2024-2028,120,120,General,Male,2005-04-12,aarav.surya@dit.ac.in,ENR-2024-001"
    content = f"{header}\n{sample_row}\n"
    return {
        "filename": "AICTE_Enrolment_Manifest_Template.csv",
        "csv": content,
    }


@router.post("/preview", response_model=ImportPreviewResponse)
def preview_batch_manifest(records: List[Dict[str, Any]], authorization: Optional[str] = Header(None)):
    """
    Validates CSV records against registered institutions and approved intake caps before committing.
    """
    user = get_current_user_from_token(authorization) if authorization else None
    user_inst = (user.get("institute_id") or "").strip().upper() if (user and user.get("role") == RoleEnum.NODE) else None

    detected_cols_set = set()
    for r in records[:5]:
        if isinstance(r, dict):
            for k in r.keys():
                detected_cols_set.add(str(k))

    total = len(records)
    valid_count = 0
    invalid_count = 0

    matched_institutions_map: Dict[str, int] = {}
    unmatched_institutions_set = set()
    programme_mapping_issues = []
    intake_warnings = []
    sample_preview = []
    seen_in_preview: Dict[str, int] = {}

    # Count prospective enrolments per (institute_code, programme)
    prospective_programme_counts: Dict[str, int] = {}

    for idx, item in enumerate(records, start=1):
        if not isinstance(item, dict):
            invalid_count += 1
            continue

        apaar = _extract_str(item, "apaar_id", "apaar", "apaarid")
        student_name = _extract_str(item, "student_name", "name", "candidate_name")
        inst_code = (_extract_str(item, "institution_code", "institute_code", "college_code") or "IND-AICTE-1042").strip().upper()
        inst_name = _extract_str(item, "institution_name", "institute_name", "college_name")
        course = _extract_str(item, "course", "programme", "program", "branch") or "B.Tech General"
        email = _extract_str(item, "email", "student_email")
        enrollment_num = _extract_str(item, "enrollment_number", "enrollment_no", "roll_no")
        dob = _extract_str(item, "dob", "date_of_birth", "birth_date")
        category = _extract_str(item, "category", "caste_category", "social_category", "reservation_category")
        gender = _extract_str(item, "gender", "sex")

        issues = []
        if not apaar:
            issues.append("Missing mandatory APAAR identifier")
        elif not SandboxAPAARAdapter.validate_format(apaar):
            issues.append("Invalid APAAR ID format (must be 12 digits or 'XXXX-XXXX-XXXX-IN')")
        else:
            norm = IntegrityEngine.normalize_apaar(apaar)
            if norm in seen_in_preview:
                issues.append(f"In-manifest duplicate: Identifier appears multiple times (previously in row {seen_in_preview[norm]})")
            else:
                seen_in_preview[norm] = idx

        if not student_name:
            issues.append("Missing student name")

        # Security check for institution-scoped users
        if user_inst and inst_code != user_inst:
            issues.append(f"Permission denied: Record belongs to {inst_code}, but your account is scoped to {user_inst}")

        # Check institution matching
        if inst_code in INSTITUTIONS_DB:
            matched_institutions_map[inst_code] = matched_institutions_map.get(inst_code, 0) + 1
            canonical_inst = INSTITUTIONS_DB[inst_code]

            # Check programme matching
            inst_progs = PROGRAMMES_DB.get(inst_code, [])
            prog_match = any(p.name.strip().lower() == course.strip().lower() for p in inst_progs)
            if not prog_match:
                issue_msg = f"'{course}' is not yet in approved programmes for {inst_code} ({canonical_inst.name})"
                if issue_msg not in programme_mapping_issues:
                    programme_mapping_issues.append(issue_msg)
        else:
            unmatched_institutions_set.add(inst_code)
            issues.append(f"Unmatched institution code: '{inst_code}' is not registered in AICTE database")

        prog_key = f"{inst_code}::{course}"
        prospective_programme_counts[prog_key] = prospective_programme_counts.get(prog_key, 0) + 1

        is_row_valid = len(issues) == 0
        if is_row_valid:
            valid_count += 1
        else:
            invalid_count += 1

        if len(sample_preview) < 10:
            sample_preview.append({
                "row_index": idx,
                "apaar_id": apaar or "—",
                "student_name": student_name or "—",
                "institute_code": inst_code,
                "institute_name": inst_name or (INSTITUTIONS_DB[inst_code].name if inst_code in INSTITUTIONS_DB else "Unregistered"),
                "programme": course,
                "dob": dob or "—",
                "category": category or "General",
                "gender": gender or "—",
                "is_valid": is_row_valid,
                "issues": issues,
            })

    # Capacity warning analysis
    for prog_key, incoming_count in prospective_programme_counts.items():
        i_code, p_name = prog_key.split("::")
        progs = PROGRAMMES_DB.get(i_code, [])
        for p in progs:
            if p.name.strip().lower() == p_name.strip().lower():
                current_enrolled = sum(
                    1 for s in STUDENT_LEDGER
                    if s.institute_code.upper() == i_code and s.programme.strip().lower() == p.name.strip().lower()
                )
                if current_enrolled + incoming_count > p.intake_cap:
                    intake_warnings.append(
                        f"{i_code} - {p.name}: Admitting {incoming_count} will exceed sanctioned cap ({current_enrolled + incoming_count}/{p.intake_cap})"
                    )

    matched_list = [
        {
            "code": code,
            "name": INSTITUTIONS_DB[code].name,
            "records_count": count,
            "status": INSTITUTIONS_DB[code].status.value,
        }
        for code, count in matched_institutions_map.items()
    ]

    return ImportPreviewResponse(
        total_rows=total,
        valid_rows=valid_count,
        invalid_rows=invalid_count,
        detected_columns=sorted(list(detected_cols_set)),
        matched_institutions=matched_list,
        unmatched_institutions=sorted(list(unmatched_institutions_set)),
        programme_mapping_issues=programme_mapping_issues,
        intake_capacity_warnings=intake_warnings,
        sample_preview=sample_preview,
    )


@router.post("/batch", response_model=BatchImportSummary)
def process_batch_manifest(
    records: List[Dict[str, Any]],
    auto_create_institutions: bool = Query(False, description="Automatically register new institution codes as provisional"),
    authorization: Optional[str] = Header(None),
):
    """
    Processes batch student enrolment manifests with strict institution mapping,
    field preservation (including dob, category, gender), and automated integrity findings.
    """
    user = get_current_user_from_token(authorization) if authorization else None
    if user and user.get("role") not in [RoleEnum.AUDITOR, RoleEnum.NODE]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Nodal Officers and Central Regulators are authorized to import batch manifests.",
        )
    user_inst = (user.get("institute_id") or "").strip().upper() if (user and user.get("role") == RoleEnum.NODE) else None

    parsed_students: List[StudentRecordSchema] = []
    created_count = 0
    updated_count = 0
    skipped_count = 0
    clean_count = 0
    duplicate_count = 0
    warning_count = 0
    errors_list: List[str] = []
    rejected_details: List[RejectedRowError] = []

    # Map of current records for fast lookup
    existing_by_apaar: Dict[str, StudentRecordSchema] = {
        s.apaar_id.strip(): s for s in STUDENT_LEDGER
    }
    batch_programme_counts: Dict[str, int] = {}
    seen_in_batch: Dict[str, int] = {}

    for idx, item in enumerate(records, start=1):
        if not isinstance(item, dict):
            skipped_count += 1
            msg = f"Row {idx}: Invalid row format (expected key-value object)."
            errors_list.append(msg)
            rejected_details.append(RejectedRowError(row_index=idx, error_reason=msg))
            continue

        # Extract supported fields including official AICTE fields
        apaar = _extract_str(item, "apaar_id", "apaar", "apaarid")
        student_name = _extract_str(item, "student_name", "name", "candidate_name")
        email = _extract_str(item, "email", "student_email", "mail")
        inst_name = _extract_str(item, "institution_name", "institute_name", "college_name", "university")
        inst_code = (_extract_str(item, "institution_code", "institute_code", "college_code", "campus_code") or "IND-AICTE-1042").strip().upper()
        course = _extract_str(item, "course", "programme", "program", "branch", "degree") or "B.Tech General"
        academic_year = _extract_str(item, "academic_year", "admission_year", "session", "batch_year") or "2024-2028"
        enrollment_num = _extract_str(item, "enrollment_number", "enrollment_no", "roll_no", "reg_no")
        dob = _extract_str(item, "dob", "date_of_birth", "birth_date")
        category = _extract_str(item, "category", "caste_category", "social_category", "reservation_category") or "General"
        gender = _extract_str(item, "gender", "sex")

        # Validation
        if not apaar:
            skipped_count += 1
            msg = f"Row {idx}: Missing mandatory APAAR identifier (apaar_id)."
            errors_list.append(msg)
            rejected_details.append(RejectedRowError(row_index=idx, student_name=student_name, institute_code=inst_code, error_reason=msg))
            continue

        if not student_name:
            skipped_count += 1
            msg = f"Row {idx} ({apaar}): Missing student name."
            errors_list.append(msg)
            rejected_details.append(RejectedRowError(row_index=idx, apaar_id=apaar, institute_code=inst_code, error_reason=msg))
            continue

        if not SandboxAPAARAdapter.validate_format(apaar):
            skipped_count += 1
            msg = f"Row {idx} ({apaar}): Invalid APAAR identifier format."
            errors_list.append(msg)
            rejected_details.append(RejectedRowError(row_index=idx, apaar_id=apaar, student_name=student_name, institute_code=inst_code, error_reason=msg))
            continue

        # In-manifest repeated duplicate check
        norm_apaar_key = IntegrityEngine.normalize_apaar(apaar)
        if norm_apaar_key in seen_in_batch:
            skipped_count += 1
            duplicate_count += 1
            prev_row = seen_in_batch[norm_apaar_key]
            msg = f"Row {idx} ({apaar}): Duplicate record in manifest — identifier previously appeared on Row {prev_row}."
            errors_list.append(msg)
            rejected_details.append(RejectedRowError(row_index=idx, apaar_id=apaar, student_name=student_name, institute_code=inst_code, error_reason=msg))
            continue
        seen_in_batch[norm_apaar_key] = idx

        # Node security check
        if user_inst and inst_code != user_inst:
            skipped_count += 1
            msg = f"Row {idx} ({apaar}): Access denied. Scoped to {user_inst}, cannot import record for {inst_code}."
            errors_list.append(msg)
            rejected_details.append(RejectedRowError(row_index=idx, apaar_id=apaar, student_name=student_name, institute_code=inst_code, error_reason=msg))
            continue

        # Check institution matching
        if inst_code not in INSTITUTIONS_DB:
            if auto_create_institutions:
                # Auto-create provisional institution
                created_inst = InstitutionSchema(
                    id=f"inst_{uuid.uuid4().hex[:8]}",
                    code=inst_code,
                    name=inst_name or f"Institution {inst_code}",
                    status=InstitutionStatusEnum.PROVISIONAL,
                    created_at=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                )
                INSTITUTIONS_DB[inst_code] = created_inst
                PROGRAMMES_DB[inst_code] = []
            else:
                skipped_count += 1
                msg = f"Row {idx} ({apaar}): Unmatched institution code '{inst_code}'. Create the institution in Vidya-Verify or enable auto-provisioning."
                errors_list.append(msg)
                rejected_details.append(RejectedRowError(row_index=idx, apaar_id=apaar, student_name=student_name, institute_code=inst_code, error_reason=msg))
                continue

        canonical_inst = INSTITUTIONS_DB[inst_code]
        final_inst_name = canonical_inst.name
        final_inst_code = inst_code
        final_course = course.strip()
        final_academic_year = academic_year.strip()

        # Ensure programme exists under institution
        inst_progs = PROGRAMMES_DB.setdefault(final_inst_code, [])
        prog_obj = None
        for p in inst_progs:
            if p.name.strip().lower() == final_course.lower():
                prog_obj = p
                break

        if not prog_obj:
            # Register new programme under institution
            prog_obj = InstitutionProgramme(
                id=f"prog_{uuid.uuid4().hex[:8]}",
                institution_code=final_inst_code,
                name=final_course,
                admission_year=final_academic_year,
                intake_cap=int(item.get("intake_cap") or 60),
                intake_current=0,
                status="active",
            )
            inst_progs.append(prog_obj)

        prog_key = f"{final_inst_code}::{final_course.lower()}::{final_academic_year}"
        if prog_key not in batch_programme_counts:
            base_count = sum(
                1 for s in STUDENT_LEDGER
                if s.institute_code.upper() == final_inst_code and s.programme.strip().lower() == final_course.lower()
            )
            batch_programme_counts[prog_key] = base_count

        # Check if student with apaar_id already exists in ledger
        existing_record = existing_by_apaar.get(apaar)
        is_reimport = (existing_record is not None and existing_record.institute_code.upper() == final_inst_code)

        if not is_reimport:
            batch_programme_counts[prog_key] += 1
        curr = batch_programme_counts[prog_key]
        cap = prog_obj.intake_cap

        # Existing enrolments list for collision detection
        existing_enrolments = [
            {"apaar_id": s.apaar_id, "institute_code": s.institute_code, "institute_name": s.institute_name}
            for s in STUDENT_LEDGER
        ]

        if existing_record and existing_record.institute_code.upper() == final_inst_code:
            # SAME CAMPUS UPDATE: Update fields and re-evaluate
            existing_record.student_name = student_name
            if email:
                existing_record.email = email
            if enrollment_num:
                existing_record.enrollment_number = enrollment_num
            if dob:
                existing_record.dob = dob
            if category:
                existing_record.category = category
            if gender:
                existing_record.gender = gender

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
                dob=existing_record.dob,
                category=existing_record.category,
                gender=existing_record.gender,
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
                fnd_id = f"FND-COLLISION-{uuid.uuid4().hex[:6].upper()}"
                INTEGRITY_FINDINGS_DB[fnd_id] = IntegrityFindingSchema(
                    id=fnd_id,
                    finding_type=FindingTypeEnum.DUPLICATE_CONCURRENT_ENROLMENT,
                    severity=FindingSeverityEnum.CRITICAL,
                    apaar_id_masked=IntegrityEngine.mask_apaar(apaar),
                    apaar_id=apaar,
                    student_name=student_name,
                    primary_institute_code=final_inst_code,
                    primary_institute_name=final_inst_name,
                    programme=final_course,
                    admission_year=final_academic_year,
                    affected_record_ids=[existing_record.id],
                    reason=existing_record.notes or "Concurrent enrolment collision detected.",
                    review_status=ReviewStatusEnum.PENDING_REVIEW,
                    detection_timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                )
            elif existing_record.integrity_status == IntegrityStatusEnum.WARNING:
                warning_count += 1
                fnd_id = f"FND-INTAKE-{uuid.uuid4().hex[:6].upper()}"
                INTEGRITY_FINDINGS_DB[fnd_id] = IntegrityFindingSchema(
                    id=fnd_id,
                    finding_type=FindingTypeEnum.INTAKE_CAPACITY_EXCEEDED,
                    severity=FindingSeverityEnum.WARNING,
                    apaar_id_masked=IntegrityEngine.mask_apaar(apaar),
                    apaar_id=apaar,
                    student_name=student_name,
                    primary_institute_code=final_inst_code,
                    primary_institute_name=final_inst_name,
                    programme=final_course,
                    admission_year=final_academic_year,
                    affected_record_ids=[existing_record.id],
                    reason=existing_record.notes or "Sanctioned intake capacity exceeded.",
                    review_status=ReviewStatusEnum.PENDING_REVIEW,
                    detection_timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                )

            STUDENT_LEDGER.append(existing_record)
            parsed_students.append(existing_record)

        else:
            # NEW RECORD (or cross-campus concurrent duplicate collision)
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
                dob=dob,
                category=category,
                gender=gender,
            )

            STUDENT_LEDGER.insert(0, evaluated)
            existing_by_apaar[apaar] = evaluated
            created_count += 1
            prog_obj.intake_current = curr

            if evaluated.integrity_status == IntegrityStatusEnum.VERIFIED:
                clean_count += 1
            elif evaluated.integrity_status == IntegrityStatusEnum.DUPLICATE:
                duplicate_count += 1
                fnd_id = f"FND-COLLISION-{uuid.uuid4().hex[:6].upper()}"
                INTEGRITY_FINDINGS_DB[fnd_id] = IntegrityFindingSchema(
                    id=fnd_id,
                    finding_type=FindingTypeEnum.DUPLICATE_CONCURRENT_ENROLMENT,
                    severity=FindingSeverityEnum.CRITICAL,
                    apaar_id_masked=IntegrityEngine.mask_apaar(apaar),
                    apaar_id=apaar,
                    student_name=student_name,
                    primary_institute_code=final_inst_code,
                    primary_institute_name=final_inst_name,
                    programme=final_course,
                    admission_year=final_academic_year,
                    affected_record_ids=[evaluated.id],
                    reason=evaluated.notes or "Concurrent enrolment collision detected.",
                    review_status=ReviewStatusEnum.PENDING_REVIEW,
                    detection_timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                )
            elif evaluated.integrity_status == IntegrityStatusEnum.WARNING:
                warning_count += 1
                fnd_id = f"FND-INTAKE-{uuid.uuid4().hex[:6].upper()}"
                INTEGRITY_FINDINGS_DB[fnd_id] = IntegrityFindingSchema(
                    id=fnd_id,
                    finding_type=FindingTypeEnum.INTAKE_CAPACITY_EXCEEDED,
                    severity=FindingSeverityEnum.WARNING,
                    apaar_id_masked=IntegrityEngine.mask_apaar(apaar),
                    apaar_id=apaar,
                    student_name=student_name,
                    primary_institute_code=final_inst_code,
                    primary_institute_name=final_inst_name,
                    programme=final_course,
                    admission_year=final_academic_year,
                    affected_record_ids=[evaluated.id],
                    reason=evaluated.notes or "Sanctioned intake capacity exceeded.",
                    review_status=ReviewStatusEnum.PENDING_REVIEW,
                    detection_timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                )

            parsed_students.append(evaluated)

    merkle_batch = IntegrityEngine.calculate_merkle_root(
        [s.apaar_id for s in parsed_students] if parsed_students else ["EMPTY_BATCH"]
    )
    batch_id = f"BATCH-{str(uuid.uuid4())[:8].upper()}"

    # Sync dynamically enrolled counts back to programmes in DB
    from app.database import get_db_context
    from app.orm_models import ProgrammeORM
    with get_db_context() as db:
        for prog_key in batch_programme_counts.keys():
            try:
                i_code, c_name, _ = prog_key.split("::")
                true_count = sum(
                    1 for s in STUDENT_LEDGER
                    if s.institute_code.upper() == i_code and s.programme.strip().lower() == c_name.lower()
                )
                db_progs = db.query(ProgrammeORM).filter(
                    ProgrammeORM.institution_code.ilike(i_code),
                    ProgrammeORM.name.ilike(c_name)
                ).all()
                for dp in db_progs:
                    dp.intake_current = true_count
                for p in PROGRAMMES_DB.get(i_code, []):
                    if p.name.strip().lower() == c_name.lower():
                        p.intake_current = true_count
            except Exception:
                pass
        db.commit()

    # Record security audit event
    actor_email = user.get("email") if user else "system@aicte.gov.in"
    actor_role = str(user.get("role")) if user else "auditor"
    actor_inst = user.get("institute_id") if user else "IND-AICTE-HQ"
    log_audit_event(
        actor_email=actor_email,
        actor_role=actor_role,
        action="BATCH_IMPORT_EXECUTED",
        target_type="BATCH_IMPORT",
        target_id=batch_id,
        details=(
            f"Processed batch manifest: {len(records)} records ({created_count} created, "
            f"{updated_count} updated, {clean_count} clean, {duplicate_count} collisions, "
            f"{warning_count} intake warnings, {skipped_count} skipped)."
        ),
        actor_institution=actor_inst,
        outcome="PARTIAL_ERRORS" if skipped_count > 0 else "SUCCESS",
    )

    return BatchImportSummary(
        batch_id=batch_id,
        total_records=len(records),
        created=created_count,
        updated=updated_count,
        skipped=skipped_count,
        clean_approved=clean_count,
        duplicate_collisions=duplicate_count,
        intake_warnings=warning_count,
        merkle_batch_hash=merkle_batch,
        errors=errors_list,
        rejected_details=rejected_details,
        records=parsed_students,
    )


@router.post("/export-errors-csv")
def export_errors_csv(errors: List[RejectedRowError]):
    """Exports list of validation errors as downloadable CSV content with formula injection mitigation."""
    lines = ["ROW_INDEX,APAAR_ID,STUDENT_NAME,INSTITUTE_CODE,ERROR_REASON"]
    for e in errors:
        apaar = sanitize_csv_cell(e.apaar_id or "")
        name = sanitize_csv_cell(e.student_name or "")
        code = sanitize_csv_cell(e.institute_code or "")
        reason = sanitize_csv_cell(e.error_reason or "")
        lines.append(f'{e.row_index},"{apaar}","{name}","{code}","{reason}"')
    csv_text = "\n".join(lines)
    return {
        "csv": csv_text,
        "filename": f"AICTE_Import_Errors_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv",
    }
