from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, verify, students, imports, analytics

app = FastAPI(
    title="VIDYA-VERIFY — AICTE Student Integrity & Verification Platform API",
    description="Sovereign APAAR data integrity, duplicate collision detection, and approved intake monitoring.",
    version="1.0.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router)
app.include_router(verify.router)
app.include_router(students.router)
app.include_router(imports.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {
        "platform": "VIDYA-VERIFY",
        "name": "AICTE Student Integrity & Verification Platform",
        "problem_statement_id": "26263",
        "organization": "AICTE",
        "department": "Regulation Bureau",
        "status": "OPERATIONAL",
        "mode": "DEMO_ENVIRONMENT_SANDBOX",
        "docs_url": "/docs",
    }


@app.get("/health")
def healthcheck():
    return {"status": "healthy", "service": "vidya-verify-api"}
