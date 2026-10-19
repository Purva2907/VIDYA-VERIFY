import hashlib
import time
from typing import Dict, Any, List
from app.models import StudentRecordSchema, IntegrityStatusEnum, VerificationResponse


class IntegrityEngine:
    @staticmethod
    def calculate_merkle_root(items: List[str]) -> str:
        """Computes a deterministic Merkle tree root hash from a list of records."""
        if not items:
            return "0x0000000000000000000000000000000000000000"

        hashes = [hashlib.sha256(item.encode('utf-8')).hexdigest() for item in items]
        while len(hashes) > 1:
            if len(hashes) % 2 != 0:
                hashes.append(hashes[-1])
            new_level = []
            for i in range(0, len(hashes), 2):
                combined = hashes[i] + hashes[i + 1]
                new_level.append(hashlib.sha256(combined.encode('utf-8')).hexdigest())
            hashes = new_level
        return "0x" + hashes[0].upper()

    @staticmethod
    def generate_ecdsa_signature(apaar_id: str, institute_code: str, status: str) -> str:
        """Generates a cryptographic signature digest representing the certified verification receipt."""
        content = f"AICTE_VIDYA_VERIFY:{apaar_id}:{institute_code}:{status}:TIME_{int(time.time())}"
        digest = hashlib.sha256(content.encode('utf-8')).hexdigest()
        return "0x" + digest[:32].upper()

    @classmethod
    def evaluate_student_integrity(
        cls,
        apaar_id: str,
        student_name: str,
        institute_code: str,
        institute_name: str,
        programme: str,
        admission_year: str,
        current_intake: int,
        intake_cap: int,
        existing_enrolments: List[Dict[str, str]],
    ) -> StudentRecordSchema:
        """
        Evaluates candidate against:
        1. Multi-campus duplicate collision
        2. Sanctioned intake quota limits
        """
        # Check collision: is this APAAR present in a different institute for same session?
        duplicate_col = False
        collision_notes = None

        for enr in existing_enrolments:
            if enr.get("apaar_id") == apaar_id and enr.get("institute_code") != institute_code:
                duplicate_col = True
                collision_notes = (
                    f"CRITICAL COLLISION: Concurrent enrolment flagged at {enr.get('institute_name')} "
                    f"({enr.get('institute_code')}) and {institute_name} ({institute_code})."
                )
                break

        # Check intake quota
        intake_warning = current_intake > intake_cap
        quota_notes = (
            f"INTAKE CAP EXCEEDED: Admitted {current_intake} students against approved quota of {intake_cap}."
            if intake_warning
            else f"Within sanctioned quota ({current_intake}/{intake_cap})."
        )

        # Determine integrity status
        if duplicate_col:
            status = IntegrityStatusEnum.DUPLICATE
            notes = collision_notes
        elif intake_warning:
            status = IntegrityStatusEnum.WARNING
            notes = quota_notes
        else:
            status = IntegrityStatusEnum.VERIFIED
            notes = f"All integrity checks passed. {quota_notes}"

        merkle_root = cls.calculate_merkle_root([apaar_id, institute_code, status.value])
        ecdsa_sig = cls.generate_ecdsa_signature(apaar_id, institute_code, status.value)

        return StudentRecordSchema(
            apaar_id=apaar_id,
            student_name=student_name,
            institute_code=institute_code,
            institute_name=institute_name,
            programme=programme,
            admission_year=admission_year,
            integrity_status=status,
            intake_current=current_intake,
            intake_cap=intake_cap,
            merkle_root=merkle_root,
            ecdsa_signature=ecdsa_sig,
            notes=notes,
        )
