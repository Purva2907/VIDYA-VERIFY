import re
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod


class BaseAPAARAdapter(ABC):
    @abstractmethod
    def verify(self, apaar_id: str) -> Dict[str, Any]:
        """Verify an APAAR identifier against the configured provider."""
        pass


class SandboxAPAARAdapter(BaseAPAARAdapter):
    """
    Sandbox Adapter providing format validation, Luhn verification,
    and synthetic demonstration records.
    Clearly identifies all responses as simulated.
    """

    SYNTHETIC_REGISTRY = {
        "9024-8172-5501-IN": {
            "name": "Aarav V. Suryavanshi",
            "institute_code": "IND-AICTE-1042",
            "institute_name": "Indian Institute of Technology, Delhi",
            "programme": "B.Tech Computer Science & AI",
            "admission_year": "2023-2027",
            "status": "verified",
            "has_collision": False,
            "intake_current": 120,
            "intake_cap": 120,
        },
        "3391-4412-8920-IN": {
            "name": "Priya N. Kulkarni",
            "institute_code": "COLLISION: DEL/MUM",
            "institute_name": "Mumbai Tech University // Delhi Tech Campus",
            "programme": "B.Tech Information Technology",
            "admission_year": "2024-2028",
            "status": "duplicate",
            "has_collision": True,
            "intake_current": 115,
            "intake_cap": 120,
        },
        "7721-1049-3382-IN": {
            "name": "Rohan M. Nair",
            "institute_code": "IND-AICTE-4891",
            "institute_name": "Southern Institute of Engineering, Bangalore",
            "programme": "B.Tech Electronics & Communication",
            "admission_year": "2024-2028",
            "status": "warning",
            "has_collision": False,
            "intake_current": 124,
            "intake_cap": 120,
        },
        "7721-1849-3382-IN": {
            "name": "Rohan M. Nair",
            "institute_code": "IND-AICTE-4891",
            "institute_name": "Southern Institute of Engineering, Bangalore",
            "programme": "B.Tech Electronics & Communication",
            "admission_year": "2024-2028",
            "status": "warning",
            "has_collision": False,
            "intake_current": 124,
            "intake_cap": 120,
        },
        "4040-4040-4040-IN": {
            "name": "Unregistered Student",
            "institute_code": "NOT_FOUND",
            "institute_name": "No AICTE Record Found",
            "programme": "N/A",
            "admission_year": "N/A",
            "status": "not_found",
            "has_collision": False,
            "intake_current": 0,
            "intake_cap": 0,
        },
    }

    @staticmethod
    def validate_format(apaar_id: str) -> bool:
        """
        Validates APAAR format: 12 alphanumeric characters,
        e.g., '9024-8172-5501-IN' or '902481725501'.
        """
        cleaned = re.sub(r'[^A-Za-z0-9]', '', apaar_id)
        if len(cleaned) < 12:
            return False
        return True

    def verify(self, apaar_id: str) -> Dict[str, Any]:
        clean_id = apaar_id.strip()
        is_format_valid = self.validate_format(clean_id)

        if not is_format_valid:
            return {
                "apaar_id": clean_id,
                "is_format_valid": False,
                "is_verified": False,
                "provider": "SANDBOX_SIMULATION",
                "notes": "Invalid APAAR format: must contain at least 12 valid alphanumeric characters.",
            }

        # Check in synthetic store
        if clean_id in self.SYNTHETIC_REGISTRY:
            record = self.SYNTHETIC_REGISTRY[clean_id]
            return {
                "apaar_id": clean_id,
                "is_format_valid": True,
                "is_verified": record["status"] == "verified",
                "record": record,
                "provider": "SANDBOX_SIMULATION",
                "disclaimer": "DEMO ENVIRONMENT · Response synthesized for test compliance.",
            }

        # Fallback dynamic synthetic valid record
        return {
            "apaar_id": clean_id,
            "is_format_valid": True,
            "is_verified": True,
            "record": {
                "name": "Synthetic Student Candidate",
                "institute_code": "IND-AICTE-GENERIC",
                "institute_name": "AICTE Accredited Engineering Institution",
                "programme": "B.Tech Standard Programme",
                "admission_year": "2024-2028",
                "status": "verified",
                "has_collision": False,
                "intake_current": 45,
                "intake_cap": 60,
            },
            "provider": "SANDBOX_SIMULATION",
            "disclaimer": "DEMO ENVIRONMENT · Response synthesized for test compliance.",
        }


class ExternalGovernmentAPAARAdapter(BaseAPAARAdapter):
    """
    External Provider Adapter stub.
    Must remain unconfigured until official government API credentials,
    endpoint specifications, and security gateway access are granted.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    def verify(self, apaar_id: str) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "apaar_id": apaar_id,
                "is_connected": False,
                "error": "EXTERNAL_GATEWAY_UNCONFIGURED",
                "message": (
                    "External government APAAR API gateway requires official AICTE executive credentials. "
                    "Operating in Sandbox mode."
                ),
            }
        raise NotImplementedError("Production government endpoint integration requires authorized AICTE gateway.")
