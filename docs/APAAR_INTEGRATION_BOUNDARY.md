# VIDYA-VERIFY — APAAR Verification Integration Boundary & Technical Specification

## 1. Architectural Boundary Overview

**VIDYA-VERIFY** is designed for the Smart India Hackathon 2026 (Problem Statement 26263, Team Quantum Coderz, AICTE). The platform enforces institutional enrolment integrity, detects multi-campus duplicate collision attacks, and audits sanctioned intake quotas.

### Honest Demonstration Notice
> [!IMPORTANT]
> **Current Prototype Status:** VIDYA-VERIFY currently operates in **Sovereign Sandbox Mode** using the pluggable `SandboxAPAARAdapter`. The application is **not** connected to the official live National APAAR Registry (Ministry of Education / DigiLocker / Academic Bank of Credits).
>
> In accordance with ethical hackathon guidelines:
> 1. No fake student names are generated for unregistered validly formatted APAAR IDs.
> 2. The prototype never claims official registry confirmation without an accredited national gateway connection.
> 3. Syntactically valid APAAR IDs not enrolled in an institutional ledger are classified as `NOT_FOUND` / `VALID_FORMAT_UNREGISTERED`.

---

## 2. Pluggable Provider Interface (`BaseAPAARAdapter`)

To prevent tight coupling between core platform logic and external registry protocols, the backend encapsulates all identifier lookup logic behind a clean abstract base class in `backend/app/services/apaar_adapter.py`:

```python
class BaseAPAARAdapter(ABC):
    @abstractmethod
    def verify(self, apaar_id: str) -> Dict[str, Any]:
        """Verify an APAAR identifier against the configured provider."""
        pass
```

### Factory & Adapter Instantiation

The active adapter is selected at startup via the `APAAR_GATEWAY_PROVIDER` environment variable:

```python
def get_apaar_adapter() -> BaseAPAARAdapter:
    provider = os.getenv("APAAR_GATEWAY_PROVIDER", "sandbox").lower()
    if provider in ("live", "external", "government"):
        return ExternalGovernmentAPAARAdapter()
    return SandboxAPAARAdapter()
```

---

## 3. Provider Comparison & Behavior Contract

| Feature | Sandbox Adapter (`SandboxAPAARAdapter`) | Official Gateway (`ExternalGovernmentAPAARAdapter`) |
| :--- | :--- | :--- |
| **Connection** | Local In-Memory & Persisted Database Ledger | National Informatics Centre (NIC) Gateway API |
| **Endpoint** | Local FastAPI Engine (`/api/verify/apaar`) | `https://api.apaar.gov.in/v1/verify` (Restricted) |
| **Authentication** | Local JWT Bearer Token | OAuth 2.0 PKCE + Mutual TLS (mTLS) Client Certificate |
| **Registered Record** | Returns authoritative database student record | Returns live Ministry of Education student profile |
| **Valid Format (Unregistered)** | Returns `VALID_FORMAT_UNREGISTERED` / `NOT_FOUND` | Queries National Central Directory |
| **Malformed Format** | Rejects with `INVALID_FORMAT` status code | Rejects with HTTP 400 Bad Request |
| **Audit Log Tag** | `VERIFICATION_SANDBOX_SIMULATION` | `VERIFICATION_EXTERNAL_OFFICIAL_GATEWAY` |

---

## 4. Production Prerequisites for Live Government Integration

Connecting VIDYA-VERIFY to the production live National APAAR Registry requires the following administrative, security, and infrastructure certifications:

### 4.1. Credentials & Authorization
- **Agency Authorization:** Formal onboarding as an accredited AICTE Institutional Consumer Node.
- **Client Credentials:** Production `CLIENT_ID` and `CLIENT_SECRET` issued by the Department of Higher Education (DoHE).
- **Scope Authorization:** `read:student_academic_record`, `verify:apaar_identity`.

### 4.2. Network Security & Cryptographic Standards
- **Mutual TLS (mTLS):** X.509 client certificate issued by an approved National Informatics Centre (NIC) or CCA-licensed Certifying Authority.
- **Hardware Security Module (HSM):** PKCS#11 key management for sovereign ECDSA/RSA digital signing of payload requests.
- **End-to-End Encryption:** TLS 1.3 with AES-256-GCM cipher suites.

### 4.3. Statutory & Privacy Compliance
- **Digital Personal Data Protection (DPDP) Act 2023:** Verified explicit candidate consent token (`consent_artifact_id`) required before resolving identity queries.
- **MeitY Data Localization:** Data in transit and at rest must reside within Indian sovereign territory.
- **Data Minimization:** No Aadhaar numbers, biometric payloads, or unmasked identifiers may be stored in server logs or export dumps.

---

## 5. Live Gateway Adapter Implementation (`ExternalGovernmentAPAARAdapter`)

The skeleton for the live gateway is pre-implemented in `backend/app/services/apaar_adapter.py`. Once production credentials and mTLS certificates are provisioned:

```python
class ExternalGovernmentAPAARAdapter(BaseAPAARAdapter):
    def __init__(self):
        self.endpoint = os.getenv("APAAR_LIVE_ENDPOINT", "https://api.apaar.gov.in/v1/verify")
        self.client_id = os.getenv("APAAR_CLIENT_ID")
        self.client_secret = os.getenv("APAAR_CLIENT_SECRET")
        self.cert_path = os.getenv("APAAR_MTLS_CERT_PATH")
        self.key_path = os.getenv("APAAR_MTLS_KEY_PATH")

    def verify(self, apaar_id: str) -> Dict[str, Any]:
        # Formatted live request with consent token and mTLS client certificates
        # ...
```

---

## 6. How to Switch to Live Provider in Production

1. Update `.env`:
   ```bash
   APAAR_GATEWAY_PROVIDER=live
   APAAR_LIVE_ENDPOINT=https://api.apaar.gov.in/v1/verify
   APAAR_CLIENT_ID=aicte_vidya_verify_prod_node
   APAAR_CLIENT_SECRET=your_production_secret
   APAAR_MTLS_CERT_PATH=/etc/ssl/certs/nic_client.crt
   APAAR_MTLS_KEY_PATH=/etc/ssl/private/nic_client.key
   ```
2. Restart backend:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
3. The platform seamlessly begins routing verification calls through the production National APAAR Gateway with zero frontend changes required.
