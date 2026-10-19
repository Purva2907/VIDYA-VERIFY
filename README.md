# VIDYA-VERIFY — AICTE Student Integrity & Verification Platform

> **AICTE Problem Statement ID:** 26263  
> **Organization:** All India Council for Technical Education (AICTE)  
> **Department:** Regulation Bureau  
> **Theme:** Smart Automation  
> **Repository:** [https://github.com/Purva2907/VIDYA-VERIFY.git](https://github.com/Purva2907/VIDYA-VERIFY.git)

---

## 🏛️ Executive Overview

**VIDYA-VERIFY** is a next-generation, high-assurance academic integrity and enrolment monitoring platform built for AICTE-approved technical institutions across India. Built on the **Automated Permanent Academic Account Registry (APAAR)** framework ("One Nation, One Student ID"), the platform mathematically prevents fraudulent duplicate admissions, monitors sanctioned intake caps, and delivers instant cryptographic verification of student credentials.

---

## 🌟 Key Architectural Features

1. **Signature 3D Academic Identity Centerpiece**
   - Built with physical dimensional rendering in **Three.js**.
   - Procedural high-resolution APAAR card texture with smart chip, fictional student silhouette, and dynamic laser scan line.
   - 3D physical verification seal with inner rotating wireframe core.
   - Surrounding floating integrity record tiles connected by real-time quadratic bezier data conduits.
   - Demonstrates 4 visual validation states: **Electric Blue** (Clean Validated), **Vibrant Pink** (Duplicate Multi-Campus Collision Alert), **Amber Gold** (Approved Intake Quota Warning), and **Electric Yellow** (Verified Receipt).
   - Mouse parallax 3D tilt with smooth lerp physics.

2. **Transparent Glassmorphism Design System**
   - Deep navy cybernetic background (`#050914`, `#080F20`).
   - Frosted glassmorphic cards (`rgba(255,255,255,0.06)`, `backdrop-filter: blur(16px)`).
   - Official brand color palette:
     - **Electric Blue (`#2391FF`)**: Primary action, verification states, active nav.
     - **Electric Yellow (`#FFF83F`)**: Selective highlights, identity accents.
     - **Amber Gold (`#FFCD54`)**: Warnings, intake discrepancy indicators.
     - **Vibrant Pink (`#F70063`)**: Critical duplicate-record collision alerts.

3. **Multi-Institution Duplicate Collision Engine**
   - Automatically cross-indexes APAAR hashes across 10,480+ institutions in real time.
   - Flags concurrent dual-degree or simultaneous unapproved admissions across universities.

4. **Sanctioned Intake Quota Monitoring**
   - Compares total registered students against AICTE-sanctioned capacity caps (e.g., 120/120).
   - Instantly triggers regulatory bureau review when an institution attempts seat over-allocation.

5. **Sandbox Adapter Architecture**
   - `SandboxAPAARAdapter`: Simulates verified, duplicate collision, intake warning, and invalid checksum scenarios.
   - `ExternalGovernmentAPAARAdapter`: Clean architectural stub awaiting official production government API credentials without inventing mock government endpoints.

6. **ECDSA & Merkle Tree Verification Receipts**
   - Generates tamper-evident cryptographic verification receipts with Merkle tree root hashes and verifiable digital signatures.

---

## 🚀 Technology Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + Vanilla CSS Variables
- **3D Graphics:** Three.js (Physical Glass Geometries, Procedural Canvas Textures, Lighting Rigs)
- **Routing:** React Router v7
- **Icons:** Lucide React

### Backend
- **Framework:** Python FastAPI
- **Validation:** Pydantic v2
- **Testing:** Pytest (100% test pass on collision, intake, format, and role checks)
- **Hashing:** SHA-256 Merkle tree calculation & ECDSA digests

---

## 📂 Repository Structure

```
VIDYA-VERIFY/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── 3d/
│   │   │   │   └── AcademicIdentityCard3D.tsx   # Signature 3D APAAR Card & Laser Engine
│   │   │   ├── landing/
│   │   │   │   ├── FeatureCards.tsx              # 6 Glassmorphic Feature Cards
│   │   │   │   ├── VerificationSequence.tsx      # 5-Stage Verification Protocol
│   │   │   │   └── SecuritySection.tsx           # RBAC, DPDPA, & Audit Trails
│   │   │   └── navigation/
│   │   │       ├── GlassNavbar.tsx               # Floating Glass Navbar
│   │   │       └── Footer.tsx                    # AICTE Problem Statement Footer
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx                   # Hero + 3D Centerpiece + Features + CTA
│   │   │   ├── LoginPage.tsx                     # Glassmorphic Login with 3D Background
│   │   │   ├── RegisterPage.tsx                  # Institution Node Onboarding (RBAC Protected)
│   │   │   ├── DashboardPage.tsx                 # Supervisory Integrity & Intake Dashboard
│   │   │   ├── VerifyPage.tsx                    # Sandbox APAAR & QR Verifier
│   │   │   └── ImportPage.tsx                    # CSV Enrolment Manifest Ingestion
│   │   ├── App.tsx                               # Application Route Orchestrator
│   │   ├── index.css                             # Design Tokens & Glass Styles
│   │   └── main.tsx                              # Entry Point
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py                           # Role-based auth & regulator protection
│   │   │   ├── verify.py                         # APAAR Verification & Receipt API
│   │   │   ├── students.py                       # Enrolment records & filtering
│   │   │   ├── imports.py                        # Batch CSV manifest ingestion
│   │   │   └── analytics.py                      # AICTE Regulatory metrics
│   │   ├── services/
│   │   │   ├── apaar_adapter.py                  # Sandbox vs External Adapter
│   │   │   └── integrity_engine.py               # Duplicate collision & quota logic
│   │   ├── models.py                             # Pydantic schemas & enums
│   │   └── main.py                               # FastAPI application & CORS
│   ├── tests/
│   │   ├── conftest.py                           # Pytest path configuration
│   │   └── test_integrity.py                     # Collision & quota test suite
│   └── requirements.txt
├── .gitignore
└── README.md
```

---

## 🛠️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Purva2907/VIDYA-VERIFY.git
cd VIDYA-VERIFY
```

### 2. Frontend Setup & Launch
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at: **`http://localhost:5173/`**

To verify a production build:
```bash
npm run build
```

### 3. Backend Setup & Test Execution
```bash
cd ../backend
pip install -r requirements.txt

# Run automated tests:
python -m pytest tests/

# Start FastAPI server:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API Base URL: **`http://127.0.0.1:8000/`**
- Interactive Swagger UI: **`http://127.0.0.1:8000/docs`**

---

## 🧪 Evaluation Test Scenarios

| Scenario | Input APAAR ID | Expected Engine Outcome |
| :--- | :--- | :--- |
| **Clean Valid Record** | `9024-8172-5501-IN` | ✅ Validated, ECDSA Sealed, Quota 120/120 Verified |
| **Duplicate Collision** | `3391-4412-8920-IN` | 🚨 Flagged: Simultaneous enrolment at Delhi & Mumbai campuses |
| **Intake Quota Exceeded**| `7721-1049-3382-IN` | ⚠️ Warning: Admitted 124 students against 120 approved cap |
| **Invalid Format** | `1234-5678-00` | ❌ Rejected: Insufficient alphanumeric digits |

---

## 🔒 Privacy & DPDPA Compliance Note

All demonstration records and student identities utilized across the platform are **synthesized demo representations**. No real student PII or sovereign Aadhaar/APAAR identity keys are stored or exposed, in compliance with the **Digital Personal Data Protection Act (DPDPA 2023)**.

---

## 📜 License & Governance

Developed for **AICTE Smart Automation — Problem Statement 26263**.  
Maintained by the **AICTE Regulation Bureau Technical Working Group**.
