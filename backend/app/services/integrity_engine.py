import os
import re
import hashlib
import time
from typing import Dict, Any, List, Optional
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from app.models import StudentRecordSchema, IntegrityStatusEnum, VerificationResponse


class IntegrityEngine:
    _private_key = None
    _public_key = None

    @classmethod
    def reset_keys_cache(cls):
        """Resets cached key objects for testing environment transitions."""
        cls._private_key = None
        cls._public_key = None

    @classmethod
    def get_signing_keys(cls):
        """Loads or deterministically derives authority ECDSA keys."""
        if cls._private_key is None:
            pem_env = os.getenv("ECDSA_PRIVATE_KEY_PEM")
            pem_path = os.getenv("ECDSA_PRIVATE_KEY_PATH")

            if pem_path and os.path.exists(pem_path):
                with open(pem_path, "rb") as f:
                    cls._private_key = serialization.load_pem_private_key(f.read(), password=None)
            elif pem_env:
                cls._private_key = serialization.load_pem_private_key(pem_env.encode(), password=None)
            else:
                env_mode = os.getenv("ENVIRONMENT", "sandbox").strip().lower()
                if env_mode in ["production", "prod"]:
                    raise RuntimeError(
                        "CRITICAL SECURITY CONFIGURATION ERROR: Running in production mode without explicit "
                        "authoritative ECDSA_PRIVATE_KEY_PEM or ECDSA_PRIVATE_KEY_PATH. Deterministic fallback keys derived from salt "
                        "are strictly prohibited in production environments. Configure an authoritative private key via environment vault."
                    )
                salt = os.getenv("SECRET_SALT", "vidya_verify_2026_salt").encode('utf-8')
                seed_int = int.from_bytes(hashlib.sha256(salt + b":VIDYA_ECDSA_ROOT").digest(), "big")
                # Secp256r1 curve order
                curve_order = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
                scalar = (seed_int % (curve_order - 1)) + 1
                cls._private_key = ec.derive_private_key(scalar, ec.SECP256R1())
            cls._public_key = cls._private_key.public_key()
        return cls._private_key, cls._public_key

    @classmethod
    def get_public_key_pem(cls) -> str:
        """Returns the public key in PEM format for external verification."""
        _, public_key = cls.get_signing_keys()
        return public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")

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

    @classmethod
    def generate_ecdsa_signature(cls, apaar_id: str, institute_code: str, status: str) -> str:
        """Generates real DER-encoded ECDSA signature over the canonical record payload."""
        priv_key, _ = cls.get_signing_keys()
        clean_apaar = cls.normalize_apaar(apaar_id)
        clean_inst = institute_code.strip().upper()
        clean_status = status.strip().upper()
        payload = f"AICTE_VIDYA_VERIFY:{clean_apaar}:{clean_inst}:{clean_status}".encode("utf-8")
        signature = priv_key.sign(payload, ec.ECDSA(hashes.SHA256()))
        return "0x" + signature.hex().upper()

    @classmethod
    def verify_ecdsa_signature(cls, apaar_id: str, institute_code: str, status: str, signature_hex: str) -> bool:
        """Independently verifies an ECDSA signature against the public key."""
        if not signature_hex:
            return False
        try:
            _, pub_key = cls.get_signing_keys()
            clean_sig = signature_hex.strip()
            if clean_sig.startswith("0x") or clean_sig.startswith("0X"):
                clean_sig = clean_sig[2:]
            sig_bytes = bytes.fromhex(clean_sig)
            clean_apaar = cls.normalize_apaar(apaar_id)
            clean_inst = institute_code.strip().upper()
            clean_status = status.strip().upper()
            payload = f"AICTE_VIDYA_VERIFY:{clean_apaar}:{clean_inst}:{clean_status}".encode("utf-8")
            pub_key.verify(sig_bytes, payload, ec.ECDSA(hashes.SHA256()))
            return True
        except Exception:
            return False

    @classmethod
    def verify_record_tamper_evidence(cls, student: StudentRecordSchema) -> Dict[str, Any]:
        """Cryptographically verifies tamper-evidence of a persisted student record."""
        status_val = student.integrity_status.value if hasattr(student.integrity_status, 'value') else str(student.integrity_status)
        expected_merkle = cls.calculate_merkle_root([student.apaar_id, student.institute_code, status_val])
        merkle_valid = (student.merkle_root == expected_merkle)
        ecdsa_valid = cls.verify_ecdsa_signature(student.apaar_id, student.institute_code, status_val, student.ecdsa_signature or "")

        return {
            "apaar_id": student.apaar_id,
            "merkle_root_valid": merkle_valid,
            "ecdsa_signature_valid": ecdsa_valid,
            "is_authentic": merkle_valid and ecdsa_valid,
            "is_tampered": not (merkle_valid and ecdsa_valid),
            "expected_merkle_root": expected_merkle,
            "stored_merkle_root": student.merkle_root,
        }

    @staticmethod
    def normalize_apaar(apaar_id: str) -> str:
        """Normalizes APAAR identifier by stripping hyphens, spaces, and converting to uppercase."""
        if not apaar_id:
            return ""
        return apaar_id.replace("-", "").replace(" ", "").strip().upper()

    @staticmethod
    def mask_apaar(apaar_id: str) -> str:
        """Masks middle characters of APAAR ID for privacy protection."""
        clean = apaar_id.strip()
        parts = clean.split("-")
        if len(parts) >= 3:
            return f"{parts[0]}-••••-••••-{parts[-1]}"
        if len(clean) >= 8:
            return f"{clean[:4]}••••{clean[-4:]}"
        return clean

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
        email: Optional[str] = None,
        enrollment_number: Optional[str] = None,
        dob: Optional[str] = None,
        category: Optional[str] = None,
        gender: Optional[str] = None,
        record_id: Optional[str] = None,
    ) -> StudentRecordSchema:
        """
        Evaluates candidate against:
        1. Multi-campus duplicate concurrent collision (normalized APAAR check)
        2. Sanctioned intake quota limits
        """
        norm_apaar = cls.normalize_apaar(apaar_id)
        norm_name = re.sub(r'[\s\.\-]+', '', student_name).lower() if student_name else ""
        norm_dob = dob.strip() if dob else ""
        norm_email = email.strip().lower() if email else ""
        norm_enroll = enrollment_number.strip().upper() if enrollment_number else ""

        duplicate_col = False
        collision_notes = None

        for enr in existing_enrolments:
            enr_norm = cls.normalize_apaar(enr.get("apaar_id", ""))
            enr_inst = (enr.get("institute_code") or "").strip().upper()

            # 1. Exact identifier collision across institutions
            if enr_norm and enr_norm == norm_apaar and enr_inst != institute_code.strip().upper():
                duplicate_col = True
                collision_notes = (
                    f"CRITICAL COLLISION: Concurrent enrolment flagged at {enr.get('institute_name')} "
                    f"({enr.get('institute_code')}) and {institute_name} ({institute_code})."
                )
                break

            # 2. Potential duplicate candidate (matching name + DOB/email/enrollment across campuses)
            enr_name = re.sub(r'[\s\.\-]+', '', enr.get("student_name", "")).lower()
            enr_dob = (enr.get("dob") or "").strip()
            enr_email = (enr.get("email") or "").strip().lower()
            enr_enroll = (enr.get("enrollment_number") or "").strip().upper()

            if norm_name and enr_name == norm_name and enr_inst != institute_code.strip().upper():
                matched_attr = None
                if norm_dob and enr_dob and norm_dob == enr_dob:
                    matched_attr = f"matching date of birth ({norm_dob})"
                elif norm_email and enr_email and norm_email == enr_email:
                    matched_attr = f"matching email address ({norm_email})"
                elif norm_enroll and enr_enroll and norm_enroll == enr_enroll:
                    matched_attr = f"matching enrollment number ({norm_enroll})"

                if matched_attr:
                    duplicate_col = True
                    collision_notes = (
                        f"POTENTIAL DUPLICATE CANDIDATE: Possible cross-institution duplicate with "
                        f"{enr.get('institute_name')} ({enr.get('institute_code')}) based on {matched_attr}. "
                        f"Requires administrative verification."
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

        schema_kwargs = {
            "apaar_id": apaar_id,
            "student_name": student_name,
            "institute_code": institute_code,
            "institute_name": institute_name,
            "programme": programme,
            "admission_year": admission_year,
            "integrity_status": status,
            "intake_current": current_intake,
            "intake_cap": intake_cap,
            "merkle_root": merkle_root,
            "ecdsa_signature": ecdsa_sig,
            "notes": notes,
            "email": email,
            "enrollment_number": enrollment_number,
            "dob": dob,
            "category": category,
            "gender": gender,
        }
        if record_id:
            schema_kwargs["id"] = record_id

        return StudentRecordSchema(**schema_kwargs)

