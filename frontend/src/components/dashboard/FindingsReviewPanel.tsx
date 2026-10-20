import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { IntegrityFinding, AuditEvent } from '../../services/api';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  FileText,
  Search,
  Building2,
  GraduationCap,
  Eye,
  RefreshCw,
  Loader2,
  FileCheck,
  X,
  History,
  ShieldCheck,
  ArrowUpDown,
} from 'lucide-react';

interface FindingsReviewPanelProps {
  onFindingReviewed?: () => void;
}

export const FindingsReviewPanel: React.FC<FindingsReviewPanelProps> = ({ onFindingReviewed }) => {
  const [activeTab, setActiveTab] = useState<'findings' | 'audit' | 'reports'>('findings');
  const [findings, setFindings] = useState<IntegrityFinding[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected finding for modal inspection & review
  const [selectedFinding, setSelectedFinding] = useState<IntegrityFinding | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('RESOLVED_CONFIRMED_VIOLATION');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);

  // Report export loading
  const [exportingType, setExportingType] = useState<string | null>(null);

  const fetchFindings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getFindings();
      setFindings(data);
    } catch (err) {
      console.error('Error fetching findings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs({ limit: 25 });
      setAuditLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'findings') {
      fetchFindings();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchFindings, fetchAuditLogs]);

  const handleOpenReviewModal = (finding: IntegrityFinding) => {
    setSelectedFinding(finding);
    setReviewStatus(
      finding.review_status === 'PENDING_REVIEW'
        ? 'RESOLVED_CONFIRMED_VIOLATION'
        : finding.review_status
    );
    setReviewNotes(finding.review_notes || '');
    setReviewSuccessMessage(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;

    setIsSubmittingReview(true);
    try {
      const updated = await api.reviewFinding(selectedFinding.id, {
        status: reviewStatus,
        notes: reviewNotes,
      });

      // Update in local state
      setFindings((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
      setSelectedFinding(updated);
      setReviewSuccessMessage('Review determination successfully committed to regulatory audit ledger.');
      if (onFindingReviewed) onFindingReviewed();
      setTimeout(() => {
        setReviewSuccessMessage(null);
        setSelectedFinding(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleExportReport = async (type: 'enrolment' | 'capacity' | 'findings') => {
    setExportingType(type);
    try {
      const res = await api.exportReportCsv(type);
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || `Failed to export ${type} report.`);
    } finally {
      setExportingType(null);
    }
  };

  // Filtered findings
  const filteredFindings = findings.filter((f) => {
    if (statusFilter !== 'ALL' && f.review_status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.student_name?.toLowerCase().includes(q);
      const matchInst = f.primary_institute_name?.toLowerCase().includes(q) || f.primary_institute_code?.toLowerCase().includes(q);
      const matchApaar = f.apaar_id?.toLowerCase().includes(q) || f.apaar_id_masked?.toLowerCase().includes(q);
      const matchReason = f.reason?.toLowerCase().includes(q);
      if (!matchName && !matchInst && !matchApaar && !matchReason) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F70063]/15 text-[#F70063] border border-[#F70063]/30">
            <ShieldAlert className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30">
            <AlertTriangle className="w-3 h-3" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#2391FF]/10 text-[#2391FF] border border-[#2391FF]/30">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/25">
            <Clock className="w-3 h-3" />
            Pending Action
          </span>
        );
      case 'RESOLVED_CONFIRMED_VIOLATION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F70063]/15 text-[#F70063] border border-[#F70063]/25">
            <ShieldAlert className="w-3 h-3" />
            Confirmed Violation
          </span>
        );
      case 'RESOLVED_CLEARED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25">
            <CheckCircle2 className="w-3 h-3" />
            Cleared / Validated
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2391FF]/15 text-[#2391FF] border border-[#2391FF]/25">
            <Clock className="w-3 h-3" />
            Investigating
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="app-card border border-[var(--color-border-subtle)] overflow-hidden my-6">
      {/* Header with Navigation Tabs */}
      <div className="p-4 sm:p-5 border-b border-[var(--color-border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              Data Integrity &amp; Regulatory Review Center
            </h2>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            AICTE Problem Statement 26263 · Duplicate collision resolution, quota compliance, and immutable audit logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('findings')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'findings'
                ? 'bg-[var(--color-brand-blue)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Integrity Findings ({findings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-[var(--color-brand-blue)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-[var(--color-brand-blue)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Compliance Reports</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTEGRITY FINDINGS */}
      {activeTab === 'findings' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student, masked APAAR, institution code, or reason..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-xs focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="RESOLVED_CONFIRMED_VIOLATION">Confirmed Violations</option>
                  <option value="RESOLVED_CLEARED">Cleared / Validated</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Info</option>
                </select>
              </div>

              <button
                type="button"
                onClick={fetchFindings}
                title="Refresh findings"
                className="p-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table of Findings */}
          <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Finding Type &amp; Summary</th>
                    <th className="py-2.5 px-3">Candidate &amp; Masked APAAR</th>
                    <th className="py-2.5 px-3">Involved Institutions</th>
                    <th className="py-2.5 px-3">Review Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {isLoading && findings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-blue)] mx-auto mb-2" />
                        <span>Querying integrity engine findings...</span>
                      </td>
                    </tr>
                  ) : filteredFindings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                        <CheckCircle2 className="w-6 h-6 text-[#22c55e] mx-auto mb-2 opacity-80" />
                        <span>No integrity findings match the active criteria.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredFindings.map((f) => (
                      <tr key={f.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                        <td className="py-3 px-3">{getSeverityBadge(f.severity)}</td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-bold text-[var(--color-text-primary)] text-xs">
                            {f.finding_type.replace(/_/g, ' ')}
                          </div>
                          <div className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1 mt-0.5">
                            {f.reason}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono-code">
                          <div className="font-bold text-xs text-[var(--color-text-primary)]">
                            {f.student_name}
                          </div>
                          <div className="text-[11px] text-[var(--color-brand-blue)]">
                            {f.apaar_id_masked}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-xs text-[var(--color-text-primary)]">
                            {f.primary_institute_name} ({f.primary_institute_code})
                          </div>
                          {f.secondary_institute_name && (
                            <div className="text-[11px] text-[#F70063] font-medium mt-0.5">
                              Collision: {f.secondary_institute_name} ({f.secondary_institute_code})
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(f.review_status)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(f)}
                            className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[11px] font-semibold hover:border-[var(--color-brand-blue)] text-[var(--color-text-primary)] transition-colors"
                          >
                            Review &bull; Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL STREAM */}
      {activeTab === 'audit' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Authorized Operational Events Recorded on Institutional Ledger
            </span>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="text-xs text-[var(--color-brand-blue)] hover:underline flex items-center gap-1 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Log Stream</span>
            </button>
          </div>

          <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code">
                <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-semibold font-sans">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor / Principal</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Target Reference</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Context Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)] text-[11px]">
                  {isLoading && auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-text-muted)] font-sans">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-blue)] mx-auto mb-2" />
                        <span>Fetching audit events...</span>
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-text-muted)] font-sans">
                        <span>No audit events recorded yet.</span>
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[var(--color-surface-hover)]">
                        <td className="py-2.5 px-3 text-[var(--color-text-muted)] whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--color-brand-blue)] font-semibold">
                          {log.actor_email}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--color-brand-yellow)] font-bold">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--color-text-primary)]">
                          {log.target_type}: {log.target_id || 'GLOBAL'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.outcome === 'SUCCESS'
                              ? 'bg-[#22c55e]/15 text-[#22c55e]'
                              : 'bg-[#F70063]/15 text-[#F70063]'
                          }`}>
                            {log.outcome}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--color-text-secondary)] font-sans max-w-sm truncate">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REGULATORY COMPLIANCE REPORTS */}
      {activeTab === 'reports' && (
        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Export persistent institution and student enrolment datasets aligned with AICTE regulatory guidelines. Reports reflect real-time database state.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Report 1: Enrolment Summary */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                  <FileText className="w-4 h-4 text-[var(--color-brand-blue)]" />
                  <span>Enrolment Summary Report</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                  Aggregate campus breakdown: verified records, pending reviews, quota alerts, and duplicate counts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportReport('enrolment')}
                disabled={exportingType === 'enrolment'}
                className="w-full py-2 px-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-brand-blue)] text-xs font-semibold flex items-center justify-center gap-2 text-[var(--color-text-primary)] transition-colors"
              >
                {exportingType === 'enrolment' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                )}
                <span>Download Enrolment CSV</span>
              </button>
            </div>

            {/* Report 2: Intake Capacity Utilization */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                  <GraduationCap className="w-4 h-4 text-[var(--color-brand-yellow)]" />
                  <span>Intake Capacity Compliance</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                  Programme-level seat allocation vs. approved intake cap. Flags exceeding or near-capacity programmes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportReport('capacity')}
                disabled={exportingType === 'capacity'}
                className="w-full py-2 px-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-brand-yellow)] text-xs font-semibold flex items-center justify-center gap-2 text-[var(--color-text-primary)] transition-colors"
              >
                {exportingType === 'capacity' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[var(--color-brand-yellow)]" />
                )}
                <span>Download Capacity CSV</span>
              </button>
            </div>

            {/* Report 3: Duplicate & Integrity Findings */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                  <ShieldAlert className="w-4 h-4 text-[#F70063]" />
                  <span>Duplicate &amp; Violation Registry</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                  Complete finding log of concurrent enrolments, mismatched identifiers, and review determinations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportReport('findings')}
                disabled={exportingType === 'findings'}
                className="w-full py-2 px-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[#F70063] text-xs font-semibold flex items-center justify-center gap-2 text-[var(--color-text-primary)] transition-colors"
              >
                {exportingType === 'findings' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[#F70063]" />
                )}
                <span>Download Findings CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW & INSPECTION MODAL */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    Integrity Finding Review &amp; Adjudication
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Finding ID: <span className="font-mono-code">{selectedFinding.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFinding(null)}
                className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitReview} className="p-6 space-y-4 overflow-y-auto text-xs">
              {reviewSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{reviewSuccessMessage}</span>
                </div>
              )}

              {/* Finding Snapshot */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(selectedFinding.severity)}
                    <span className="font-bold text-xs text-[var(--color-text-primary)]">
                      {selectedFinding.finding_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>{getStatusBadge(selectedFinding.review_status)}</div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border-subtle)] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">Student Name</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{selectedFinding.student_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">Masked APAAR</span>
                    <span className="font-mono-code font-bold text-[var(--color-brand-blue)]">
                      {selectedFinding.apaar_id_masked}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">Reason &amp; Diagnosis</span>
                  <p className="text-xs text-[var(--color-text-primary)] mt-0.5 leading-relaxed bg-[var(--color-surface-card)] p-2.5 rounded-lg border border-[var(--color-border-subtle)]">
                    {selectedFinding.reason}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                    <span className="text-[10px] text-[var(--color-text-muted)] block">Primary Campus</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {selectedFinding.primary_institute_name} ({selectedFinding.primary_institute_code})
                    </span>
                  </div>
                  {selectedFinding.secondary_institute_name && (
                    <div className="p-2 rounded bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/25">
                      <span className="text-[10px] text-[var(--color-brand-pink)] block">Concurrent Collision</span>
                      <span className="font-semibold text-[var(--color-brand-pink)]">
                        {selectedFinding.secondary_institute_name} ({selectedFinding.secondary_institute_code})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Adjudication Form */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Regulatory Determination Status <span className="text-[#F70063]">*</span>
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)] font-medium"
                    required
                  >
                    <option value="RESOLVED_CONFIRMED_VIOLATION">Confirm Violation (Duplicate or Over-Cap Confirmed)</option>
                    <option value="RESOLVED_CLEARED">Clear Finding (Legitimate Concurrent/Approved Transfer)</option>
                    <option value="IN_REVIEW">Under Active Investigation</option>
                    <option value="DISMISSED">Dismiss (False Alarm / Retracted)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Reviewer Justification &amp; Audit Notes <span className="text-[#F70063]">*</span>
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    placeholder="Enter official justification, student interview notes, or regulatory rationale..."
                    className="w-full p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)] leading-relaxed"
                    required
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedFinding(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-xs font-semibold hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmittingReview ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Commit Review Determination</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
