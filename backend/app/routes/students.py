from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.models import StudentRecordSchema, IntegrityStatusEnum
from app.services.integrity_engine import IntegrityEngine

router = APIRouter(prefix="/api/students", tags=["Students"])

# In-memory demo ledger dataset
DEMO_STUDENTS: List[StudentRecordSchema] = [
    StudentRecordSchema(
        apaar_id="9024-8172-5501-IN",
        student_name="Aarav V. Suryavanshi",
        institute_code="IND-AICTE-1042",
        institute_name="Indian Institute of Technology, Delhi",
        programme="B.Tech Computer Science & AI",
        admission_year="2023-2027",
        integrity_status=IntegrityStatusEnum.VERIFIED,
        intake_current=120,
        intake_cap=120,
        merkle_root="0x99238E10BC4489DF11234858900ACDB30",
        ecdsa_signature="0x8F72B4DE99A1C09A11FE848911C49A098E",
        notes="Verified non-exceeding. Zero collisions.",
    ),
    StudentRecordSchema(
        apaar_id="3391-4412-8920-IN",
        student_name="Priya N. Kulkarni",
        institute_code="COLLISION: DEL/MUM",
        institute_name="Mumbai Tech University // Delhi Tech Campus",
        programme="B.Tech Information Technology",
        admission_year="2024-2028",
        integrity_status=IntegrityStatusEnum.DUPLICATE,
        intake_current=115,
        intake_cap=120,
        merkle_root="0x4488A019DF77C3908811AA223399BCDE",
        ecdsa_signature="0xCOLLISION_ALERT_HASH_00994411",
        notes="CRITICAL COLLISION: Concurrent dual enrolment in 2 institutions.",
    ),
    StudentRecordSchema(
        apaar_id="7721-1049-3382-IN",
        student_name="Rohan M. Nair",
        institute_code="IND-AICTE-4891",
        institute_name="Southern Institute of Engineering, Bangalore",
        programme="B.Tech Electronics & Comm.",
        admission_year="2024-2028",
        integrity_status=IntegrityStatusEnum.WARNING,
        intake_current=124,
        intake_cap=120,
        merkle_root="0x8899FFAA112233445566778899AABBCC",
        ecdsa_signature="0xINTAKE_CAP_EXCEEDED_124_OF_120",
        notes="SANCTIONED INTAKE EXCEEDED: 124 admitted against 120 quota cap.",
    ),
    StudentRecordSchema(
        apaar_id="5512-9014-2281-IN",
        student_name="Ananya S. Iyer",
        institute_code="IND-AICTE-2204",
        institute_name="National Institute of Technology, Trichy",
        programme="B.Tech Mechanical Engineering",
        admission_year="2024-2028",
        integrity_status=IntegrityStatusEnum.VERIFIED,
        intake_current=90,
        intake_cap=90,
        merkle_root="0x11223344556677889900AABBCCDDEEFF",
        ecdsa_signature="0xFE849011C09A118F72B4DE99A1C09A11",
        notes="Verified clean record.",
    ),
]


@router.get("", response_model=List[StudentRecordSchema])
def list_students(
    search: Optional[str] = Query(None, description="Search by name, APAAR ID, or campus"),
    status: Optional[IntegrityStatusEnum] = Query(None, description="Filter by status"),
):
    results = DEMO_STUDENTS
    if search:
        s = search.lower()
        results = [
            r for r in results
            if s in r.student_name.lower() or s in r.apaar_id.lower() or s in r.institute_name.lower()
        ]
    if status:
        results = [r for r in results if r.integrity_status == status]
    return results


@router.get("/{apaar_id}", response_model=StudentRecordSchema)
def get_student_by_apaar(apaar_id: str):
    for r in DEMO_STUDENTS:
        if r.apaar_id == apaar_id:
            return r
    raise HTTPException(status_code=404, detail="Student APAAR record not found in ledger.")
