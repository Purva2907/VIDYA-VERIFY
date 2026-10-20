import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { StudentRecord, DashboardMetrics, Institution } from '../services/api';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';
import { AddStudentModal } from '../components/dashboard/AddStudentModal';
import { AddInstitutionModal } from '../components/dashboard/AddInstitutionModal';
import { StudentDetailsModal } from '../components/dashboard/StudentDetailsModal';
import { FindingsReviewPanel } from '../components/dashboard/FindingsReviewPanel';
import {
  Users,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CopyX,
  Search,
  Plus,
  FileSpreadsheet,
  QrCode,
  Trash2,
  Eye,
  RefreshCw,
  Building2,
  Shield,
  Loader2,
  Sparkles,
  ArrowRight,
  Gauge,
  BookOpen,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedStudentInitial, setSelectedStudentInitial] = useState<StudentRecord | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddInstitutionOpen, setIsAddInstitutionOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [demoBannerMessage, setDemoBannerMessage] = useState<string | null>(null);

  const isAuditor = user?.role === 'auditor';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [metricsData, studentsData, instData] = await Promise.all([
        api.getMetrics(),
        api.getStudents(),
        api.getInstitutions(),
      ]);
      setMetrics(metricsData);
      setStudents(studentsData);
      setInstitutions(instData);
    } catch (err) {
      console.error('Error fetching dashboard overview:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      await api.seedDemoStudents();
      setDemoBannerMessage('Sample demonstration records loaded successfully.');
      setTimeout(() => setDemoBannerMessage(null), 5000);
      fetchData();
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Clear all student records to test the onboarding workflow and empty state?')) return;
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
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border border-[var(--color-brand-blue)]/25 uppercase font-mono-code">
                {isAuditor ? <Shield className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                <span>{isAuditor ? 'Platform Administrator' : 'Institution Administrator'}</span>
              </span>
              <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                {user?.institute_name || 'AICTE Regulatory System'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.full_name || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
              {isAuditor
                ? 'Overview of institutional profiles, cross-campus enrolment integrity, and capacity monitoring.'
                : `Managing academic records and approved programme capacity for ${user?.institute_name || 'your institution'}.`}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isAuditor && (
              <button
                type="button"
                onClick={() => setIsAddInstitutionOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] hover:border-[var(--color-brand-blue)] text-[var(--color-text-primary)] transition-all flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4 text-[var(--color-brand-blue)]" />
                <span>Add Institution</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddStudentOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--color-brand-blue)] text-white hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>

            <Link
              to="/import"
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#FFCD54]" />
              <span>Batch Import</span>
            </Link>

            <Link
              to="/verify"
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] flex items-center gap-1.5 transition-all shadow-sm"
            >
              <QrCode className="w-4 h-4 text-[#FFF83F]" />
              <span>Verification</span>
            </Link>
          </div>
        </div>

        {/* Demo Notification Banner */}
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

        {/* 4 Summary Cards (Role Scoped) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          {isAuditor ? (
            /* Platform Administrator Cards */
            <>
              {/* Card 1: Total Institutions */}
              <Link to="/institutions" className="app-card p-5 group hover:border-[var(--color-brand-blue)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Total Institutions
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue)]/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[var(--color-brand-blue)]" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono-code text-[var(--color-text-primary)]">
                  {isLoading ? '...' : (metrics?.total_institutions ?? institutions.length)}
                </div>
                <div className="mt-1 text-[11px] text-[var(--color-text-secondary)] flex items-center justify-between">
                  <span>AICTE Approved Campuses</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-blue)] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              {/* Card 2: Total Student Records */}
              <Link to="/students" className="app-card p-5 group hover:border-[var(--color-brand-blue)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Total Student Records
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue)]/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[var(--color-brand-blue)]" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono-code text-[var(--color-text-primary)]">
                  {isLoading ? '...' : (metrics?.total_students ?? 0)}
                </div>
                <div className="mt-1 text-[11px] text-[var(--color-text-secondary)] flex items-center justify-between">
                  <span>{metrics?.verified_count || 0} Cryptographically Verified</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-blue)] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              {/* Card 3: Pending Verifications */}
              <div className="app-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Pending Verifications
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#FFCD54]/15 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#FFCD54]" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono-code text-[#FFCD54]">
                  {isLoading ? '...' : (metrics?.pending_count ?? 0)}
                </div>
                <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                  Awaiting campus nodal sign-off
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
                  {isLoading ? '...' : (metrics?.attention_count ?? 0)}
                </div>
                <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                  {metrics?.duplicate_count || 0} duplicate, {metrics?.warning_count || 0} quota alert
                </div>
              </div>
            </>
          ) : (
            /* Institution Administrator / Verifier Scoped Cards */
            <>
              {/* Card 1: My Institution */}
              <div className="app-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Assigned Campus
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue)]/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[var(--color-brand-blue)]" />
                  </div>
                </div>
                <div className="font-bold text-base text-[var(--color-text-primary)] truncate">
                  {metrics?.institution_name || user?.institute_name || 'My Campus'}
                </div>
                <div className="mt-1 font-mono-code text-[11px] text-[var(--color-brand-blue)]">
                  {metrics?.institution_code || user?.institute_id || 'IND-AICTE-1042'}
                </div>
              </div>

              {/* Card 2: Campus Students */}
              <Link to="/students" className="app-card p-5 group hover:border-[var(--color-brand-blue)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Campus Enrolments
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue)]/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[var(--color-brand-blue)]" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono-code text-[var(--color-text-primary)]">
                  {isLoading ? '...' : (metrics?.total_students ?? 0)}
                </div>
                <div className="mt-1 text-[11px] text-[var(--color-text-secondary)] flex items-center justify-between">
                  <span>{metrics?.verified_count || 0} verified</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-blue)]" />
                </div>
              </Link>

              {/* Card 3: Pending Campus Verifications */}
              <div className="app-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Pending Verifications
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#FFCD54]/15 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#FFCD54]" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono-code text-[#FFCD54]">
                  {isLoading ? '...' : (metrics?.pending_count ?? 0)}
                </div>
                <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                  Awaiting institutional verification
                </div>
              </div>

              {/* Card 4: Intake & Capacity Utilization */}
              <div className="app-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Sanctioned Intake Capacity
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-hover)] flex items-center justify-center">
                    <Gauge className="w-4 h-4 text-[var(--color-brand-blue)]" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono-code text-[var(--color-text-primary)]">
                  {metrics?.current_enrolment ?? 0} / {metrics?.approved_intake_capacity ?? 120}
                </div>
                <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                  {metrics?.capacity_utilization_pct ?? 0}% quota capacity utilized
                </div>
              </div>
            </>
          )}
        </div>

        {/* Empty State Onboarding Workflow (when database is empty) */}
        {metrics?.is_empty && (
          <div className="my-8 p-6 sm:p-8 rounded-2xl app-card border border-dashed border-[var(--color-border-subtle)] text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30 uppercase font-mono-code">
                Onboarding Setup Guide
              </span>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Welcome to VIDYA-VERIFY — Complete Institutional Onboarding
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xl mt-1">
              Follow this verified 4-step sequence to configure your institutions, programmes, and student enrolment records.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)] font-bold text-xs flex items-center justify-center font-mono-code">
                  1
                </div>
                <div className="font-bold text-xs text-[var(--color-text-primary)]">Create or Select Institution</div>
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  Register campus codes (e.g. IND-AICTE-1042) and establish accredited credentials.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddInstitutionOpen(true)}
                  className="mt-2 text-xs font-semibold text-[var(--color-brand-blue)] hover:underline inline-flex items-center gap-1"
                >
                  <span>Add Institution</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)] font-bold text-xs flex items-center justify-center font-mono-code">
                  2
                </div>
                <div className="font-bold text-xs text-[var(--color-text-primary)]">Add Approved Programmes</div>
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  Define technical programmes, academic sessions, and regulatory sanctioned intake caps.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)] font-bold text-xs flex items-center justify-center font-mono-code">
                  3
                </div>
                <div className="font-bold text-xs text-[var(--color-text-primary)]">Import Enrolment Data</div>
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  Upload CSV manifests mapped to sovereign APAAR IDs and institution codes.
                </p>
                <Link
                  to="/import"
                  className="mt-2 text-xs font-semibold text-[var(--color-brand-blue)] hover:underline inline-flex items-center gap-1"
                >
                  <span>Batch Import</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)] font-bold text-xs flex items-center justify-center font-mono-code">
                  4
                </div>
                <div className="font-bold text-xs text-[var(--color-text-primary)]">Review Verifications</div>
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  Audit cryptographic Merkle roots, check concurrent duplicates, and inspect quota utilization.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">
                Want to evaluate the system with pre-populated AICTE sample data?
              </span>
              <button
                type="button"
                onClick={handleSeedDemoData}
                disabled={isSeeding}
                className="px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-semibold hover:opacity-90 inline-flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FFF83F]" />
                <span>Load Sample AICTE Demo Data</span>
              </button>
            </div>
          </div>
        )}

        {/* Real Duplicate Enrolment Conflict Alert (Displayed ONLY if real duplicate records exist!) */}
        {metrics && metrics.duplicate_cases && metrics.duplicate_cases.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#F70063]/10 border border-[#F70063]/30 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F70063]/20 flex items-center justify-center shrink-0 mt-0.5">
                <CopyX className="w-4 h-4 text-[#F70063]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F70063]">
                    CRITICAL COLLISION: CONCURRENT ENROLMENT IDENTIFIED
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#F70063] animate-pulse" />
                </div>
                <p className="text-xs text-[var(--color-text-primary)] mt-0.5">
                  Candidate <span className="font-semibold">{metrics.duplicate_cases[0].student_name}</span> (APAAR <code className="px-1 py-0.5 rounded bg-[var(--color-bg-secondary)] font-mono-code">{maskApaar(metrics.duplicate_cases[0].apaar_id)}</code>) is concurrently enrolled across multiple technical campuses.
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] font-mono-code mt-0.5">
                  {metrics.duplicate_cases[0].notes}
                </p>
              </div>
            </div>

            <Link
              to="/students"
              className="px-3.5 py-1.5 rounded-xl bg-[#F70063] hover:opacity-90 text-white text-xs font-semibold shrink-0 shadow-sm inline-flex items-center gap-1"
            >
              <span>Review Conflicts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Sections Grid: Institutions Needing Attention & Programmes Nearing Capacity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
          {/* Section 1: Institutions Needing Attention */}
          <div className="app-card p-5 border border-[var(--color-border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--color-brand-blue)]" />
                <span>Institutions Needing Attention</span>
              </h3>
              <Link
                to="/institutions"
                className="text-xs text-[var(--color-brand-blue)] hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {(!metrics?.institutions_needing_attention || metrics.institutions_needing_attention.length === 0) ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-subtle)] rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-[#2391FF] mx-auto mb-1.5 opacity-80" />
                <p>All institutional campuses operating within approved quotas and zero conflicts.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {metrics.institutions_needing_attention.map((inst) => (
                  <Link
                    key={inst.code}
                    to={`/institutions/${encodeURIComponent(inst.code)}`}
                    className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-brand-blue)] flex items-center justify-between transition-colors text-xs"
                  >
                    <div>
                      <div className="font-bold text-[var(--color-text-primary)]">{inst.name}</div>
                      <div className="font-mono-code text-[10px] text-[var(--color-brand-blue)] mt-0.5">{inst.code}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {inst.duplicates > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F70063]/15 text-[#F70063] font-semibold text-[10px]">
                          {inst.duplicates} Collision
                        </span>
                      )}
                      {inst.warnings > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FFCD54]/15 text-[#FFCD54] font-semibold text-[10px]">
                          {inst.warnings} Quota Alert
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Programmes Nearing or Exceeding Capacity */}
          <div className="app-card p-5 border border-[var(--color-border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#FFCD54]" />
                <span>Programmes Nearing Sanctioned Capacity</span>
              </h3>
            </div>

            {(!metrics?.programmes_nearing_capacity || metrics.programmes_nearing_capacity.length === 0) ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-subtle)] rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-[#2391FF] mx-auto mb-1.5 opacity-80" />
                <p>No programmes currently nearing or exceeding regulatory capacity limits.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {metrics.programmes_nearing_capacity.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[var(--color-text-primary)]">{p.name}</span>
                        {p.institution_name && (
                          <span className="text-[10px] text-[var(--color-text-muted)] ml-2">
                            ({p.institution_name})
                          </span>
                        )}
                      </div>
                      <span className={`font-mono-code font-bold ${p.is_exceeded ? 'text-[#F70063]' : 'text-[#FFCD54]'}`}>
                        {p.intake_current} / {p.intake_cap} seats ({p.utilization_pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                      <div
                        className={`h-full ${p.is_exceeded ? 'bg-[#F70063]' : 'bg-[#FFCD54]'}`}
                        style={{ width: `${Math.min(p.utilization_pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 2.5: AICTE Problem Statement 26263 Data Integrity Findings, Review Adjudication & Regulatory Audit */}
        <FindingsReviewPanel onFindingReviewed={() => fetchData()} />

        {/* Section 3: Recent Student Enrolments & Quick Links */}
        <div className="app-card border border-[var(--color-border-subtle)] overflow-hidden my-6">
          <div className="p-4 sm:p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Recent Student Ledger Enrolments
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Latest verified candidate records registered across institutions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/students"
                className="px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-xs text-[var(--color-text-primary)] hover:border-[var(--color-brand-blue)] flex items-center gap-1 transition-colors"
              >
                <span>View Full Directory ({students.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] font-semibold">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Masked APAAR ID</th>
                  <th className="py-3 px-4">Campus / Code</th>
                  <th className="py-3 px-4">Programme</th>
                  <th className="py-3 px-4">Integrity Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {students.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">
                      {s.student_name}
                    </td>
                    <td className="py-3 px-4 font-mono-code font-bold text-[var(--color-brand-blue)]">
                      {maskApaar(s.apaar_id)}
                    </td>
                    <td className="py-3 px-4">
                      <div>{s.institute_name}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)] font-mono-code">{s.institute_code}</div>
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text-primary)]">
                      {s.programme}
                    </td>
                    <td className="py-3 px-4">
                      {s.integrity_status === 'verified' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2391FF]/15 text-[#2391FF]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      )}
                      {s.integrity_status === 'duplicate' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F70063]/15 text-[#F70063]">
                          <CopyX className="w-3 h-3" />
                          <span>Duplicate</span>
                        </span>
                      )}
                      {s.integrity_status === 'warning' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFCD54]/15 text-[#FFCD54]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Needs Review</span>
                        </span>
                      )}
                      {s.integrity_status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF83F]/15 text-[#D97706] dark:text-[#FFF83F]">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentInitial(s)}
                        className="p-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-brand-blue)]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Controls Footer */}
        <div className="mt-8 pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)]" />
            <span>AICTE Platform Statement 26263 · Institutional Ledger Operational</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSeedDemoData}
              disabled={isSeeding}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline"
            >
              Reset Demo Records
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={handleClearData}
              disabled={isSeeding}
              className="text-[var(--color-text-secondary)] hover:text-[#F70063] hover:underline"
            >
              Clear to Empty State
            </button>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onStudentAdded={() => fetchData()}
      />

      <AddInstitutionModal
        isOpen={isAddInstitutionOpen}
        onClose={() => setIsAddInstitutionOpen(false)}
        onInstitutionCreated={() => fetchData()}
      />

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
