import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  CheckCircle2,
  CopyX,
  AlertTriangle,
  Clock,
  Loader2,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';
import { AddStudentModal } from '../components/dashboard/AddStudentModal';
import { StudentDetailsModal } from '../components/dashboard/StudentDetailsModal';
import { api } from '../services/api';
import type { StudentRecord, Institution } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const StudentsPage: React.FC = () => {
  const { user } = useAuth();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [selectedStudentInitial, setSelectedStudentInitial] = useState<StudentRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isAuditor = user?.role === 'auditor';

  // Load institutions list for filter dropdown
  useEffect(() => {
    async function loadInstitutions() {
      try {
        const instList = await api.getInstitutions();
        setInstitutions(instList);
      } catch (err) {
        console.error('Failed to load institutions filter list:', err);
      }
    }
    loadInstitutions();
  }, []);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getStudents(
        searchTerm || undefined,
        statusFilter || undefined,
        selectedInstFilter !== 'all' ? selectedInstFilter : undefined
      );
      setStudents(data);
    } catch (err) {
      console.error('Failed to load student records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, selectedInstFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const handleStudentAdded = (newStudent: StudentRecord) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleDeleteStudent = async (apaarId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove the record for APAAR ${apaarId}?`)) {
      return;
    }
    try {
      await api.deleteStudent(apaarId);
      setStudents((prev) => prev.filter((s) => s.apaar_id !== apaarId));
    } catch (err) {
      alert('Could not remove student record.');
    }
  };

  const maskApaar = (id: string) => {
    const parts = id.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-••••-••••-${parts[parts.length - 1]}`;
    }
    return `${id.slice(0, 4)}••••${id.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] transition-colors">
      <GlassNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border border-[var(--color-brand-blue)]/25">
                <Users className="w-3 h-3" />
                <span>STUDENT RECORDS LEDGER</span>
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {isAuditor ? 'National Multi-Institution Database' : user?.institute_name || 'Institution-Scoped Records'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Student Records</h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
              Sovereign APAAR verified candidates, course admissions, and academic integrity logs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--color-brand-blue)] text-white hover:opacity-90 inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>

            <Link
              to="/import"
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] hover:border-[var(--color-brand-blue)] inline-flex items-center gap-1.5 text-[var(--color-text-primary)]"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#FFCD54]" />
              <span>Import CSV</span>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student candidate name, APAAR ID, programme..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-blue)] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Institution Filter (visible to Platform Admins) */}
            {isAuditor && (
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--color-text-secondary)] font-medium">Institution:</span>
                <select
                  value={selectedInstFilter}
                  onChange={(e) => setSelectedInstFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)] font-medium"
                >
                  <option value="all">All Institutions ({institutions.length})</option>
                  {institutions.map((i) => (
                    <option key={i.code} value={i.code}>
                      {i.code} - {i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div className="inline-flex rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] p-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'verified', label: 'Verified' },
                { id: 'pending', label: 'Pending' },
                { id: 'warning', label: 'Needs Review' },
                { id: 'duplicate', label: 'Duplicate' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === st.id
                      ? 'bg-[var(--color-brand-blue)] text-white font-semibold'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Student Records Table */}
        <div className="mt-6">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
              <p className="text-xs text-[var(--color-text-secondary)]">Loading student ledger records...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="py-20 rounded-2xl app-card text-center p-8 border border-dashed border-[var(--color-border-subtle)]">
              <Users className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2" />
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">No Student Records Found</h3>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto mt-1">
                {searchTerm || selectedInstFilter !== 'all' || statusFilter !== 'all'
                  ? 'No records match your active query filters. Try resetting search criteria.'
                  : 'Start enrolling candidates or import your batch manifest CSV.'}
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--color-brand-blue)] text-white hover:opacity-90 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Student</span>
              </button>
            </div>
          ) : (
            <div className="app-card border border-[var(--color-border-subtle)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] font-semibold">
                      <th className="py-3 px-4">Student &amp; Email</th>
                      <th className="py-3 px-4">Masked APAAR ID</th>
                      <th className="py-3 px-4">Institution / Code</th>
                      <th className="py-3 px-4">Programme &amp; Session</th>
                      <th className="py-3 px-4">Integrity Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[var(--color-text-primary)]">{s.student_name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-[var(--color-text-muted)]">{s.email || '—'}</span>
                            {s.category && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-brand-yellow)]/10 text-[var(--color-brand-yellow)] border border-[var(--color-brand-yellow)]/20">
                                {s.category}
                              </span>
                            )}
                            {s.gender && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
                                {s.gender}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono-code font-bold text-[var(--color-brand-blue)]">
                          {maskApaar(s.apaar_id)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[var(--color-text-primary)]">{s.institute_name}</div>
                          <div className="text-[10px] text-[var(--color-text-muted)] font-mono-code">{s.institute_code}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[var(--color-text-primary)]">{s.programme}</div>
                          <div className="text-[10px] text-[var(--color-text-muted)] font-mono-code">{s.admission_year}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {s.integrity_status === 'verified' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#2391FF]/15 text-[#2391FF] border border-[#2391FF]/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          )}
                          {s.integrity_status === 'duplicate' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F70063]/15 text-[#F70063] border border-[#F70063]/30">
                              <CopyX className="w-3 h-3" />
                              <span>Duplicate Collision</span>
                            </span>
                          )}
                          {s.integrity_status === 'warning' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Intake Capacity Alert</span>
                            </span>
                          )}
                          {s.integrity_status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF83F]/15 text-[#D97706] dark:text-[#FFF83F] border border-[#FFF83F]/30">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentInitial(s)}
                              className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-brand-blue)] hover:bg-[var(--color-surface-hover)] transition-colors"
                              title="View Record Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteStudent(s.apaar_id, e)}
                              className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[#F70063] hover:bg-[#F70063]/10 transition-colors"
                              title="Remove Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStudentAdded={handleStudentAdded}
      />

      {/* Student Details Modal */}
      {selectedStudentInitial && (
        <StudentDetailsModal
          isOpen={true}
          student={selectedStudentInitial}
          onClose={() => setSelectedStudentInitial(null)}
        />
      )}
    </div>
  );
};
