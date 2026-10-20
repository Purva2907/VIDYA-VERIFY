from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, verify, students, imports, analytics, institutions, findings, audit, reports

app = FastAPI(
    title="VIDYA-VERIFY — AICTE Student Integrity & Verification Platform API",
    description="Sovereign APAAR data integrity, duplicate collision detection, and approved intake monitoring.",
    version="1.0.0",
)

import os

# CORS Middleware with environment override
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] if allowed_origins_env else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
app.include_router(institutions.router)
app.include_router(findings.router)
app.include_router(audit.router)
app.include_router(reports.router)


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
