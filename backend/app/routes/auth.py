from fastapi import APIRouter, HTTPException, status
from app.models import UserLoginRequest, UserRegisterRequest, UserResponse, RoleEnum

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=UserResponse)
def login(payload: UserLoginRequest):
    # Simulated role-based authentication check
    if not payload.email or "@" not in payload.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or institutional identifier format.",
        )

    # Determine role profile
    role = payload.role
    if "aicte.gov.in" in payload.email:
        role = RoleEnum.AUDITOR

    institute_name = "AICTE Central Regulation Bureau" if role == RoleEnum.AUDITOR else "Delhi Institute of Technology"
    institute_id = "IND-AICTE-HQ" if role == RoleEnum.AUDITOR else "IND-AICTE-1042"

    return UserResponse(
        id="usr_09214_demo",
        email=payload.email,
        role=role,
        institute_id=institute_id,
        institute_name=institute_name,
        token="eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.demo_token_valid",
    )


@router.post("/register", response_model=UserResponse)
def register(payload: UserRegisterRequest):
    # Enforce strict policy: Regulator roles cannot be self-provisioned!
    if payload.requested_role == RoleEnum.AUDITOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: AICTE Central Regulator accounts cannot be self-provisioned. Contact AICTE Bureau.",
        )

    return UserResponse(
        id="usr_registered_node",
        email=payload.email,
        role=RoleEnum.NODE,
        institute_id=payload.aicte_id,
        institute_name=payload.institute_name,
        token="eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.registered_node_token",
    )
