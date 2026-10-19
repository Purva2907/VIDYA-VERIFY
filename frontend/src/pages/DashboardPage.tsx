import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { StudentRecord, DashboardMetrics } from '../services/api';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';
import { AddStudentModal } from '../components/dashboard/AddStudentModal';
import { StudentDetailsModal } from '../components/dashboard/StudentDetailsModal';
import {
  Users,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CopyX,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  QrCode,
  ExternalLink,
  Trash2,
  Eye,
  RefreshCw,
  Database,
  Building,
  Shield,
  Loader2,
  Inbox,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'warning' | 'duplicate'>('all');

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentInitial, setSelectedStudentInitial] = useState<StudentRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [demoBannerMessage, setDemoBannerMessage] = useState<string | null>(null);

  const isAuditor = user?.role === 'auditor';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [metricsData, studentsData] = await Promise.all([
        api.getMetrics(),
        api.getStudents(),
      ]);
      setMetrics(metricsData);
      setStudents(studentsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewStudent = (s: StudentRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedStudentId(s.id || s.apaar_id);
    setSelectedStudentInitial(s);
  };

  const handleStudentAdded = (newStudent: StudentRecord) => {
    setStudents((prev) => [newStudent, ...prev]);
    fetchData(); // refresh metrics
  };

  const handleDeleteStudent = async (apaarId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove the record for APAAR ${apaarId}?`)) {
      return;
    }
    try {
      await api.deleteStudent(apaarId);
      setStudents((prev) => prev.filter((s) => s.apaar_id !== apaarId));
      fetchData();
    } catch (err) {
      alert('Could not remove student record.');
    }
  };

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const res = await api.seedDemoStudents();
      setDemoBannerMessage('Sample demonstration records loaded successfully.');
      setTimeout(() => setDemoBannerMessage(null), 5000);
      fetchData();
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Clear all student records to test empty state?')) return;
    setIsSeeding(true);
    try {
      await api.clearAllStudents();
      setDemoBannerMessage('Student database cleared to empty state.');
      setTimeout(() => setDemoBannerMessage(null), 5000);
      fetchData();
    } finally {
      setIsSeeding(false);
    }
  };

  // Filter student list
  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.student_name.toLowerCase().includes(q) ||
      s.apaar_id.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.enrollment_number && s.enrollment_number.toLowerCase().includes(q)) ||
      (s.institution_name || s.institute_name || '').toLowerCase().includes(q) ||
      (s.institution_code || s.institute_code || '').toLowerCase().includes(q) ||
      (s.course || s.programme || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || s.integrity_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Identify any critical duplicate conflict in the real data
  const realDuplicateStudent = students.find((s) => s.integrity_status === 'duplicate');

  const maskApaar = (id: string) => {
    const parts = id.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-••••-••••-${parts[parts.length - 1]}`;
    }
    return id.substring(0, 4) + '••••' + id.substring(id.length - 4);
  };

  const renderStatusBadge = (status: StudentRecord['integrity_status']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2391FF]/10 text-[#2391FF] border border-[#2391FF]/30">
            <ShieldCheck className="w-3 h-3" />
            <span>Verified</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/35">
            <AlertTriangle className="w-3 h-3" />
            <span>Needs Review</span>
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F70063]/15 text-[#F70063] border border-[#F70063]/30">
            <CopyX className="w-3 h-3" />
            <span>Duplicate Detected</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] transition-colors">
      <GlassNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border border-[var(--color-brand-blue)]/25">
                {isAuditor ? <Shield className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                <span>{isAuditor ? 'AICTE Central Bureau' : 'Institution Node'}</span>
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {user?.institute_name || 'Academic Administration'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.full_name || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
              {isAuditor
                ? 'Overview of institutional student records, cross-campus enrolment integrity, and intake monitoring.'
                : `Managing academic records and APAAR integrity for ${user?.institute_name || 'your institution'}.`}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--color-brand-blue)] text-white hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>

            <Link
              to="/import"
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-[var(--color-brand-blue)]" />
              <span>Import CSV</span>
            </Link>

            <Link
              to="/verify"
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] flex items-center gap-1.5 transition-all shadow-sm"
            >
              <QrCode className="w-4 h-4 text-[var(--color-brand-yellow)]" />
              <span>Sandbox Verify</span>
            </Link>
          </div>
        </div>

        {/* Demo Mode & Evaluator Notification Banner */}
        {demoBannerMessage && (
          <div className="mt-4 p-3 rounded-xl bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/30 text-xs text-[var(--color-brand-blue)] flex items-center justify-between">
            <span>{demoBannerMessage}</span>
            <button
              type="button"
              onClick={() => setDemoBannerMessage(null)}
              className="text-xs underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          {/* Card 1: Total Students */}
          <div className="app-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Total Students
              </span>
              <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue)]/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-[var(--color-brand-blue)]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono-code text-[var(--color-text-primary)]">
              {isLoading ? (
                <div className="h-8 w-16 bg-[var(--color-border-subtle)] animate-pulse rounded" />
              ) : (
                metrics?.total_students ?? 0
              )}
            </div>
            <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
              {metrics?.institutes_count || 0} active campus record(s)
            </div>
          </div>

          {/* Card 2: Verified Records */}
          <div className="app-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Verified Records
              </span>
              <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue)]/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[var(--color-brand-blue)]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono-code text-[var(--color-brand-blue)]">
              {isLoading ? (
                <div className="h-8 w-16 bg-[var(--color-border-subtle)] animate-pulse rounded" />
              ) : (
                metrics?.verified_count ?? 0
              )}
            </div>
            <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
              {metrics?.total_students ? `${Math.round(((metrics.verified_count || 0) / metrics.total_students) * 100)}% verified` : '0%'}
            </div>
          </div>

          {/* Card 3: Pending Verification */}
          <div className="app-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Pending Verification
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FFCD54]/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#FFCD54]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono-code text-[#FFCD54]">
              {isLoading ? (
                <div className="h-8 w-16 bg-[var(--color-border-subtle)] animate-pulse rounded" />
              ) : (
                metrics?.pending_count ?? 0
              )}
            </div>
            <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
              Awaiting institutional confirmation
            </div>
          </div>

          {/* Card 4: Records Requiring Attention */}
          <div className="app-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Requiring Attention
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F70063]/15 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[#F70063]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono-code text-[#F70063]">
              {isLoading ? (
                <div className="h-8 w-16 bg-[var(--color-border-subtle)] animate-pulse rounded" />
              ) : (
                metrics?.attention_count ?? 0
              )}
            </div>
            <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
              {metrics?.duplicate_count || 0} duplicate, {metrics?.warning_count || 0} quota alert
            </div>
          </div>
        </div>

        {/* Real Duplicate Collision Warning (Shown ONLY when actual data has a duplicate!) */}
        {metrics && metrics.duplicate_count > 0 && realDuplicateStudent && (
          <div className="p-4 rounded-2xl bg-[#F70063]/10 border border-[#F70063]/30 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F70063]/20 flex items-center justify-center shrink-0 mt-0.5">
                <CopyX className="w-4 h-4 text-[#F70063]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F70063]">
                    DUPLICATE ENROLMENT COLLISION FLAGGED
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#F70063] animate-pulse" />
                </div>
                <p className="text-xs text-[var(--color-text-primary)] mt-0.5">
                  APAAR ID <code className="px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] font-mono-code font-bold">{maskApaar(realDuplicateStudent.apaar_id)}</code> ({realDuplicateStudent.student_name}) has concurrent enrolment records.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudent(realDuplicateStudent)}
              className="px-3.5 py-1.5 rounded-xl bg-[#F70063] hover:opacity-90 text-white text-xs font-semibold transition-opacity shrink-0 shadow-sm"
            >
              Review Conflict
            </button>
          </div>
        )}

        {/* Student Records Table & Controls */}
        <div className="app-card overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-[var(--color-border-subtle)] flex flex-col lg:flex-row items-center justify-between gap-3.5">
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name, APAAR, campus..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 text-xs">
              <span className="text-[var(--color-text-secondary)] font-medium mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                Status:
              </span>
              {(['all', 'verified', 'pending', 'warning', 'duplicate'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors capitalize shrink-0 ${
                    statusFilter === st
                      ? 'bg-[var(--color-brand-blue)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {st === 'all' ? `All (${students.length})` : st === 'warning' ? 'Needs Review' : st === 'duplicate' ? 'Duplicate' : st}
                </button>
              ))}
            </div>

            {/* Evaluator Data Reset Helpers */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fetchData()}
                disabled={isLoading}
                title="Refresh student records from ledger"
                className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-brand-blue)] flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[var(--color-brand-blue)]' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={handleSeedDemoData}
                disabled={isSeeding}
                title="Load sample demonstration records"
                className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-brand-blue)] flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-[#FFF83F]" />
                <span>Load Sample Data</span>
              </button>
              <button
                type="button"
                onClick={handleClearData}
                disabled={isSeeding}
                title="Clear all records to test empty state"
                className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink)] flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-[var(--color-text-secondary)] flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-blue)]" />
                <span>Loading student records from ledger...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              /* Empty State */
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-secondary)] mb-3">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  {students.length === 0 ? 'No student records yet' : 'No records match your filter'}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mt-1 mb-5">
                  {students.length === 0
                    ? 'Start by adding an individual student record, importing a CSV batch, or loading sample demonstration records.'
                    : 'Try clearing your search query or switching the status filter.'}
                </p>
                {students.length === 0 && (
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--color-brand-blue)] text-white hover:opacity-90"
                    >
                      Add First Student
                    </button>
                    <button
                      type="button"
                      onClick={handleSeedDemoData}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      Load Sample Data
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] font-semibold">
                    <th className="py-3 px-4">Student &amp; Email</th>
                    <th className="py-3 px-4">APAAR &amp; Enrolment No</th>
                    <th className="py-3 px-4">Institution / Campus</th>
                    <th className="py-3 px-4">Course &amp; Session</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {filteredStudents.map((s) => (
                    <tr
                      key={s.id || s.apaar_id}
                      onClick={() => handleViewStudent(s)}
                      className="hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[var(--color-text-primary)]">
                          {s.student_name}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] truncate max-w-xs">
                          {s.email || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono-code">
                        <div className="text-[var(--color-text-secondary)] font-medium">
                          {maskApaar(s.apaar_id)}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)]">
                          {s.enrollment_number || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[var(--color-text-primary)] truncate max-w-xs">
                          {s.institution_name || s.institute_name}
                        </div>
                        <div className="text-[10px] font-mono-code text-[var(--color-text-muted)]">
                          {s.institution_code || s.institute_code}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {s.course || s.programme}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)]">
                          {s.academic_year || s.admission_year}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(s.integrity_status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleViewStudent(s, e)}
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-brand-blue)] hover:bg-[var(--color-surface-hover)] transition-colors"
                            title="View student record details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteStudent(s.apaar_id, e)}
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-brand-pink)] hover:bg-[var(--color-surface-hover)] transition-colors"
                            title="Delete student record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer */}
          {!isLoading && filteredStudents.length > 0 && (
            <div className="p-3.5 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
              <span>
                Showing {filteredStudents.length} of {students.length} student record(s)
              </span>
              <span className="font-mono-code text-[10px]">
                Active Ledger Session
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStudentAdded={handleStudentAdded}
        defaultInstituteCode={user?.institute_id || 'IND-AICTE-1042'}
        defaultInstituteName={user?.institute_name || 'Delhi Institute of Technology'}
      />

      <StudentDetailsModal
        studentId={selectedStudentId}
        initialRecord={selectedStudentInitial}
        onClose={() => {
          setSelectedStudentId(null);
          setSelectedStudentInitial(null);
        }}
      />

      <Footer />
    </div>
  );
};
