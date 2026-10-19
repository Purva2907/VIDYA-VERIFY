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

export interface BatchImportSummary {
  batch_id: string;
  total_records: number;
  created: number;
  updated: number;
  skipped: number;
  clean_approved: number;
  duplicate_collisions: number;
  intake_warnings: number;
  merkle_batch_hash: string;
  errors: string[];
  records: StudentRecord[];
}

export interface DashboardMetrics {
  total_students: number;
  verified_count: number;
  pending_count: number;
  attention_count: number;
  duplicate_count: number;
  warning_count: number;
  institutes_count: number;
  is_empty: boolean;
  has_critical_conflicts: boolean;
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
  details: string;
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

  // Analytics
  async getMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${API_BASE}/api/analytics/metrics`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to load metrics');
    }
    return res.json();
  },

  // Students
  async getStudents(search?: string, status?: string): Promise<StudentRecord[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);

    const res = await fetch(`${API_BASE}/api/students?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch student records');
    }
    return res.json();
  },

  async addStudent(data: {
    apaar_id: string;
    student_name: string;
    institute_code: string;
    institute_name: string;
    programme: string;
    admission_year: string;
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

  // Import
  async importBatch(records: any[]): Promise<BatchImportSummary> {
    const res = await fetch(`${API_BASE}/api/imports/batch`, {
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
  async verifyApaar(apaarId: string): Promise<VerificationResult> {
    const res = await fetch(`${API_BASE}/api/verify/apaar?apaar_id=${encodeURIComponent(apaarId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'APAAR verification failed');
    }
    return res.json();
  },
};
