const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'auditor' | 'node' | 'student' | 'public';
  institute_id?: string;
  institute_name?: string;
  phone?: string;
  designation?: string;
  department?: string;
  created_at: string;
  token: string;
}

export interface StudentRecord {
  id: string;
  apaar_id: string;
  student_name: string;
  email?: string;
  enrollment_number?: string;
  dob?: string;
  category?: string;
  gender?: string;
  institute_code: string;
  institute_name: string;
  institution_code?: string;
  institution_name?: string;
  programme: string;
  course?: string;
  admission_year: string;
  academic_year?: string;
  integrity_status: 'verified' | 'pending' | 'warning' | 'duplicate';
  verification_status?: 'verified' | 'pending' | 'warning' | 'duplicate';
  intake_current: number;
  intake_cap: number;
  merkle_root?: string;
  ecdsa_signature?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface InstitutionIntake {
  academic_session: string;
  sanctioned_intake: number;
  created_at?: string;
  updated_at?: string;
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  type: string;
  state: string;
  city: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  status: 'approved' | 'pending_review' | 'provisional';
  programmes_count: number;
  students_count: number;
  academic_session?: string;
  total_approved_intake: number;
  current_enrolment: number;
  remaining_capacity?: number;
  capacity_utilization_pct: number;
  programme_allocations_total?: number;
  has_allocation_warning?: boolean;
  allocation_warning_message?: string;
  intake_allocations?: InstitutionIntake[];
  created_at: string;
}

export interface InstitutionProgramme {
  id: string;
  institution_code: string;
  name: string;
  code?: string;
  admission_year: string;
  intake_cap: number;
  intake_current: number;
  status: string;
  created_at: string;
}

export interface ProgrammeCapacityItem {
  programme_id: string;
  programme_name: string;
  programme_code?: string;
  admission_year: string;
  intake_cap: number;
  intake_current: number;
  utilization_pct: number;
  status: 'NORMAL' | 'NEAR_CAPACITY' | 'EXCEEDED' | 'WITHIN_CAPACITY' | 'CAPACITY_REACHED' | 'OVER_CAPACITY' | 'INTAKE_MISSING' | 'REQUIRES_REVIEW';
  status_explanation?: string;
}

export interface InstitutionCapacity {
  institution_code: string;
  institution_name: string;
  academic_session?: string;
  total_approved_intake: number;
  total_enrolled: number;
  remaining_capacity?: number;
  overall_utilization_pct: number;
  programme_allocations_total?: number;
  has_allocation_warning?: boolean;
  allocation_warning_message?: string;
  programmes: ProgrammeCapacityItem[];
  has_capacity_warnings: boolean;
}

export interface ImportPreviewResponse {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  detected_columns: string[];
  matched_institutions: Array<{
    code: string;
    name: string;
    records_count: number;
    status: string;
  }>;
  unmatched_institutions: string[];
  programme_mapping_issues: string[];
  intake_capacity_warnings: string[];
  sample_preview: Array<{
    row_index: number;
    apaar_id: string;
    student_name: string;
    institute_code: string;
    institute_name: string;
    programme: string;
    is_valid: boolean;
    issues: string[];
  }>;
}

export interface BatchImportSummary {
  batch_id: string;
  total_records: number;
  created: number;
  updated: number;
  skipped: number;
  clean_approved: number;
  duplicate_collisions: number;
  intake_warnings: number;
  rejected_details?: Array<{
    row_index: number;
    apaar_id: string;
    student_name: string;
    reason: string;
  }>;
  merkle_batch_hash: string;
  errors: string[];
  records: StudentRecord[];
}

export interface DashboardMetrics {
  is_node_view?: boolean;
  institution_code?: string;
  institution_name?: string;
  total_institutions?: number;
  total_students: number;
  verified_count: number;
  pending_count: number;
  attention_count: number;
  duplicate_count: number;
  warning_count: number;
  current_enrolment?: number;
  approved_intake_capacity?: number;
  capacity_utilization_pct?: number;
  programmes_count?: number;
  institutes_count: number;
  is_empty: boolean;
  has_critical_conflicts: boolean;
  duplicate_cases?: Array<{
    id: string;
    apaar_id: string;
    student_name: string;
    institute_code: string;
    institute_name: string;
    notes?: string;
  }>;
  institutions_needing_attention?: Array<{
    code: string;
    name: string;
    duplicates: number;
    warnings: number;
    status: string;
  }>;
  programmes_nearing_capacity?: Array<{
    institution_code?: string;
    institution_name?: string;
    name: string;
    code?: string;
    intake_cap: number;
    intake_current: number;
    utilization_pct: number;
  }>;
  pending_reviews_count?: number;
  resolved_reviews_count?: number;
  total_findings_count?: number;
}

export interface VerificationResult {
  apaar_id: string;
  student_name: string;
  institute: string;
  institute_code: string;
  programme: string;
  admission_year: string;
  status: string;
  is_valid: boolean;
  has_duplicate_collision: boolean;
  has_intake_warning: boolean;
  merkle_root: string;
  ecdsa_signature: string;
  timestamp: string;
  adapter_mode: string;
  source_type?: string;
  is_sandbox?: boolean;
  is_external_official?: boolean;
  details: string;
  dob?: string;
  category?: string;
  gender?: string;
  enrollment_number?: string;
}

export interface VerificationHistoryItem {
  id: string;
  apaar_masked: string;
  apaar_raw: string;
  status: 'CLEAN' | 'COLLISION' | 'QUOTA ALERT' | 'NOT FOUND' | string;
  timestamp: string;
  institution_code?: string | null;
  institution_name?: string | null;
  programme?: string | null;
  source_type: string;
  is_sandbox: boolean;
}

export interface VerificationHistoryResponse {
  items: VerificationHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

export function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem('vidya_verify_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      sessionStorage.setItem('vidya_verify_session_id', sid);
    }
    return sid;
  } catch (e) {
    return 'sess_fallback_' + Math.random().toString(36).substring(2, 10);
  }
}

export interface IntegrityFinding {
  id: string;
  finding_type: 'DUPLICATE_CONCURRENT_ENROLMENT' | 'INTAKE_CAPACITY_EXCEEDED' | 'FORMAT_MISMATCH' | 'INSTITUTION_PROGRAMME_MISMATCH' | 'DATA_INTEGRITY_INCONSISTENCY';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  apaar_id_masked: string;
  apaar_id: string;
  student_name: string;
  primary_institute_code: string;
  primary_institute_name: string;
  secondary_institute_code?: string;
  secondary_institute_name?: string;
  programme: string;
  admission_year: string;
  affected_record_ids: string[];
  reason: string;
  review_status: 'PENDING_REVIEW' | 'IN_REVIEW' | 'RESOLVED_CLEARED' | 'RESOLVED_CONFIRMED_VIOLATION' | 'DISMISSED';
  review_decision?: string;
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  detection_timestamp: string;
}

export interface AuditEvent {
  id: string;
  actor_email: string;
  actor_role: string;
  actor_institution?: string;
  action: string;
  target_type: string;
  target_id?: string;
  details: string;
  outcome: string;
  timestamp: string;
}

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('vidya_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to sign in. Please check your credentials.');
    }
    return res.json();
  },

  async register(data: {
    aicte_id: string;
    institute_name: string;
    nodal_officer: string;
    email: string;
    password: string;
    region: string;
  }): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed.');
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Session invalid');
    }
    return res.json();
  },

  async updateProfile(data: {
    full_name?: string;
    phone?: string;
    designation?: string;
    department?: string;
  }): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Could not update profile');
    }
    return res.json();
  },

  async changePassword(old_password: string, new_password: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ old_password, new_password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Password change failed.');
    }
    return res.json();
  },

  // Analytics & Dashboard Metrics
  async getMetrics(scope?: string): Promise<DashboardMetrics> {
    const params = new URLSearchParams();
    if (scope) params.append('scope', scope);
    const res = await fetch(`${API_BASE}/api/analytics/metrics?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to load metrics');
    }
    return res.json();
  },

  // Institutions Management
  async getInstitutions(search?: string, status?: string): Promise<Institution[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);

    const res = await fetch(`${API_BASE}/api/institutions?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to load institutions');
    }
    return res.json();
  },

  async getInstitution(code: string): Promise<Institution> {
    const res = await fetch(`${API_BASE}/api/institutions/${encodeURIComponent(code)}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Institution ${code} not found`);
    }
    return res.json();
  },

  async createInstitution(data: {
    code: string;
    name: string;
    type?: string;
    state: string;
    city: string;
    address?: string;
    contact_email?: string;
    contact_phone?: string;
    status?: 'approved' | 'pending_review' | 'provisional';
    sanctioned_intake: number;
    academic_session: string;
  }): Promise<Institution> {
    const res = await fetch(`${API_BASE}/api/institutions`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create institution');
    }
    return res.json();
  },

  async configureInstitutionIntake(code: string, data: {
    academic_session: string;
    sanctioned_intake: number;
  }): Promise<Institution> {
    const res = await fetch(`${API_BASE}/api/institutions/${encodeURIComponent(code)}/intakes`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to configure institution intake');
    }
    return res.json();
  },

  async updateInstitution(code: string, data: Partial<Institution>): Promise<Institution> {
    const res = await fetch(`${API_BASE}/api/institutions/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update institution');
    }
    return res.json();
  },

  // Programmes under an Institution
  async getProgrammes(code: string): Promise<InstitutionProgramme[]> {
    const res = await fetch(`${API_BASE}/api/institutions/${encodeURIComponent(code)}/programmes`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to load institution programmes');
    }
    return res.json();
  },

  async createProgramme(code: string, data: {
    name: string;
    code?: string;
    admission_year?: string;
    intake_cap?: number;
    status?: string;
  }): Promise<InstitutionProgramme> {
    const res = await fetch(`${API_BASE}/api/institutions/${encodeURIComponent(code)}/programmes`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create programme');
    }
    return res.json();
  },

  async getInstitutionCapacity(code: string): Promise<InstitutionCapacity> {
    const res = await fetch(`${API_BASE}/api/institutions/${encodeURIComponent(code)}/capacity`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to load capacity analytics');
    }
    return res.json();
  },

  async getInstitutionHistory(code: string): Promise<{ institution_code: string; total_records: number; events: any[] }> {
    const res = await fetch(`${API_BASE}/api/institutions/${encodeURIComponent(code)}/history`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to load verification history');
    }
    return res.json();
  },

  async getInstitutionStudents(code: string, search?: string, programme?: string): Promise<StudentRecord[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (programme) params.append('programme', programme);
    const res = await fetch(`${API_BASE}/api/institutions/${encodeURIComponent(code)}/students?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to load institution students');
    }
    return res.json();
  },

  // Students Directory
  async getStudents(search?: string, status?: string, institute_code?: string): Promise<StudentRecord[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);
    if (institute_code && institute_code !== 'all') params.append('institute_code', institute_code);

    const res = await fetch(`${API_BASE}/api/students?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch student records');
    }
    return res.json();
  },

  async addStudent(data: {
    apaar_id: string;
    student_name: string;
    institute_code: string;
    institute_name?: string;
    programme: string;
    admission_year?: string;
    enrollment_number?: string;
    email?: string;
    dob?: string;
    category?: string;
    gender?: string;
    intake_current?: number;
    intake_cap?: number;
    notes?: string;
  }): Promise<StudentRecord> {
    const res = await fetch(`${API_BASE}/api/students`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to add student');
    }
    return res.json();
  },

  async seedDemoStudents(): Promise<{ message: string; count: number }> {
    const res = await fetch(`${API_BASE}/api/students/seed-demo`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to seed demo data');
    }
    return res.json();
  },

  async clearAllStudents(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/api/students/clear-all`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to clear students');
    }
    return res.json();
  },

  async deleteStudent(apaarId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/students/${encodeURIComponent(apaarId)}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to remove student record');
    }
  },

  async getStudent(identifier: string): Promise<StudentRecord> {
    const res = await fetch(`${API_BASE}/api/students/${encodeURIComponent(identifier)}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to load student record details');
    }
    return res.json();
  },

  // Batch CSV Import & Preview
  async previewImportBatch(records: any[]): Promise<ImportPreviewResponse> {
    const res = await fetch(`${API_BASE}/api/imports/preview`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(records),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate import preview');
    }
    return res.json();
  },

  async importBatch(records: any[], autoCreate = false): Promise<BatchImportSummary> {
    const params = new URLSearchParams();
    if (autoCreate) params.append('auto_create_institutions', 'true');
    const res = await fetch(`${API_BASE}/api/imports/batch?${params.toString()}`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(records),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to process import batch');
    }
    return res.json();
  },

  // Verify APAAR
  async verifyApaar(apaarId: string, sessionId?: string): Promise<VerificationResult> {
    const sid = sessionId || getOrCreateSessionId();
    const res = await fetch(`${API_BASE}/api/verify/apaar?apaar_id=${encodeURIComponent(apaarId)}&session_id=${encodeURIComponent(sid)}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'APAAR verification failed');
    }
    return res.json();
  },

  // Verification History
  async getVerificationHistory(params?: {
    limit?: number;
    offset?: number;
    sessionId?: string;
  }): Promise<VerificationHistoryResponse> {
    const sid = params?.sessionId || getOrCreateSessionId();
    const limit = params?.limit ?? 10;
    const offset = params?.offset ?? 0;
    const q = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (sid) {
      q.append('session_id', sid);
    }
    const res = await fetch(`${API_BASE}/api/verify/history?${q.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to load verification history');
    }
    return res.json();
  },

  // Integrity Findings & Review Workflow
  async getFindings(params?: {
    review_status?: string;
    finding_type?: string;
    severity?: string;
    search?: string;
  }): Promise<IntegrityFinding[]> {
    const q = new URLSearchParams();
    if (params?.review_status && params.review_status !== 'all') q.append('review_status', params.review_status);
    if (params?.finding_type && params.finding_type !== 'all') q.append('finding_type', params.finding_type);
    if (params?.severity && params.severity !== 'all') q.append('severity', params.severity);
    if (params?.search) q.append('search', params.search);

    const res = await fetch(`${API_BASE}/api/findings?${q.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to load integrity findings');
    }
    return res.json();
  },

  async getFindingDetail(id: string): Promise<{ finding: IntegrityFinding; affected_records: StudentRecord[] }> {
    const res = await fetch(`${API_BASE}/api/findings/${encodeURIComponent(id)}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to load finding details');
    }
    return res.json();
  },

  async reviewFinding(
    id: string,
    decisionOrPayload: string | { decision?: string; status?: string; notes?: string; new_status?: string },
    notes?: string,
    newStatus: string = 'RESOLVED_CLEARED'
  ): Promise<IntegrityFinding> {
    let bodyPayload: { decision: string; notes?: string; new_status?: string };

    if (typeof decisionOrPayload === 'object' && decisionOrPayload !== null) {
      bodyPayload = {
        decision: decisionOrPayload.decision || decisionOrPayload.status || 'REVIEW_DETERMINATION',
        notes: decisionOrPayload.notes,
        new_status: decisionOrPayload.new_status || decisionOrPayload.status || newStatus,
      };
    } else {
      bodyPayload = {
        decision: decisionOrPayload,
        notes,
        new_status: newStatus,
      };
    }

    const res = await fetch(`${API_BASE}/api/findings/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(bodyPayload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit finding review');
    }
    return res.json();
  },

  // Import Template
  async getImportTemplate(): Promise<{ filename: string; csv: string }> {
    const res = await fetch(`${API_BASE}/api/imports/template`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to download import template');
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(params?: {
    action?: string;
    actor_email?: string;
    institution?: string;
    outcome?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditEvent[]> {
    const q = new URLSearchParams();
    if (params?.action) q.append('action', params.action);
    if (params?.actor_email) q.append('actor_email', params.actor_email);
    if (params?.institution) q.append('institution', params.institution);
    if (params?.outcome) q.append('outcome', params.outcome);
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/api/audit/logs?${q.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to load audit logs');
    }
    return res.json();
  },

  // Reports
  async getEnrolmentSummary(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/reports/enrolment-summary`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load enrolment summary report');
    return res.json();
  },

  async getIntakeCapacityReport(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/reports/intake-capacity`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load intake capacity report');
    return res.json();
  },

  async getDuplicateFindingsReport(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/reports/duplicate-findings`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load duplicate findings report');
    return res.json();
  },

  async getPrintableSummary(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/reports/printable-summary`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to generate printable summary report');
    return res.json();
  },

  async exportReportCsv(reportType: 'enrolment' | 'capacity' | 'findings' | 'audit' | 'verification-history'): Promise<{ filename: string; csv: string }> {
    const res = await fetch(`${API_BASE}/api/reports/export/${reportType}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(`Failed to export ${reportType} report CSV`);
    return res.json();
  },

  async exportErrorsCsv(errors: any[]): Promise<{ filename: string; csv: string }> {
    const res = await fetch(`${API_BASE}/api/imports/export-errors-csv`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(errors),
    });
    if (!res.ok) throw new Error('Failed to generate error CSV');
    return res.json();
  },
};
