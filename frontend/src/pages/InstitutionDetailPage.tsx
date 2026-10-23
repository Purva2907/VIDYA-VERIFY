import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  BookOpen,
  Users,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  History,
  Plus,
  Search,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  FileSpreadsheet,
  CheckCircle2,
  CopyX,
  Clock,
  Loader2,
  ArrowRight,
  Eye,
  Settings2,
} from 'lucide-react';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';
import { AddProgrammeModal } from '../components/dashboard/AddProgrammeModal';
import { EditProgrammeModal } from '../components/dashboard/EditProgrammeModal';
import { ConfigureInstitutionIntakeModal } from '../components/dashboard/ConfigureInstitutionIntakeModal';
import { StudentDetailsModal } from '../components/dashboard/StudentDetailsModal';
import { api } from '../services/api';
import type {
  Institution,
  InstitutionProgramme,
  StudentRecord,
  InstitutionCapacity,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export const InstitutionDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [programmes, setProgrammes] = useState<InstitutionProgramme[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [capacity, setCapacity] = useState<InstitutionCapacity | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'programmes' | 'students' | 'capacity' | 'history'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddProgModalOpen, setIsAddProgModalOpen] = useState(false);
  const [isConfigureIntakeModalOpen, setIsConfigureIntakeModalOpen] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<InstitutionProgramme | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentInitial, setSelectedStudentInitial] = useState<StudentRecord | null>(null);

  const isAuditor = user?.role === 'auditor';
  const canManageProgrammes =
    user?.role === 'auditor' ||
    (user?.role === 'node' && (!user.institute_id || user.institute_id.trim().toUpperCase() === code?.trim().toUpperCase()));

  const loadInstitutionData = useCallback(async () => {
    if (!code) return;
    setIsLoading(true);
    setError(null);

    try {
      const [instData, progsData, studentsData, capData, histData] = await Promise.all([
        api.getInstitution(code),
        api.getProgrammes(code),
        api.getInstitutionStudents(code),
        api.getInstitutionCapacity(code),
        api.getInstitutionHistory(code),
      ]);

      setInstitution(instData);
      setProgrammes(progsData);
      setStudents(studentsData);
      setCapacity(capData);
      setHistory(histData.events || []);
    } catch (err: any) {
      console.error('Error loading institution:', err);
      setError(err.message || 'Failed to load institution details.');
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadInstitutionData();
  }, [loadInstitutionData]);

  const handleProgrammeCreated = (newProg: InstitutionProgramme) => {
    setProgrammes((prev) => [...prev, newProg]);
    loadInstitutionData(); // refresh computed counts
  };

  const handleProgrammeUpdated = (updated: InstitutionProgramme) => {
    setProgrammes((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    loadInstitutionData();
  };

  const handleIntakeUpdated = (updated: Institution) => {
    setInstitution(updated);
    loadInstitutionData();
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2391FF]/15 text-[#2391FF] border border-[#2391FF]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AICTE Approved</span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'provisional':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF83F]/15 text-[#D97706] dark:text-[#FFF83F] border border-[#FFF83F]/30">
            <span>Provisional</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
            {status || 'Active'}
          </span>
        );
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.student_name.toLowerCase().includes(q) ||
      s.apaar_id.toLowerCase().includes(q) ||
      s.programme.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  const maskApaar = (id: string) => {
    const parts = id.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-••••-••••-${parts[parts.length - 1]}`;
    }
    return `${id.slice(0, 4)}••••${id.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)]">
        <GlassNavbar />
        <div className="pt-40 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
          <p className="text-xs text-[var(--color-text-secondary)]">Loading institution ledger profile...</p>
        </div>
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)]">
        <GlassNavbar />
        <main className="max-w-4xl mx-auto px-4 pt-36 pb-16 text-center">
          <div className="p-8 rounded-2xl app-card border border-[#F70063]/30">
            <AlertTriangle className="w-10 h-10 text-[#F70063] mx-auto mb-3" />
            <h2 className="text-lg font-bold">Institution Not Accessible</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
              {error || `The institution code "${code}" could not be loaded.`}
            </p>
            <Link
              to="/institutions"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Institutions</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] transition-colors">
      <GlassNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Navigation Breadcrumb */}
        <div className="mb-4">
          <Link
            to="/institutions"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-brand-blue)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Institutions Directory</span>
          </Link>
        </div>

        {/* Institution Banner & Summary */}
        <div className="app-card p-6 border border-[var(--color-border-subtle)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono-code font-bold text-xs px-2.5 py-0.5 rounded-md bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border border-[var(--color-brand-blue)]/25">
                  {institution.code}
                </span>
                {getStatusBadge(institution.status)}
                <span className="text-xs text-[var(--color-text-muted)]">
                  Registered {institution.created_at}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                {institution.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                  <span>{institution.type}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FFCD54]" />
                  <span>{institution.city}, {institution.state}</span>
                </span>
                {institution.contact_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{institution.contact_email}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {canManageProgrammes && (
                <button
                  type="button"
                  onClick={() => setIsConfigureIntakeModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] hover:border-[var(--color-brand-blue)] inline-flex items-center gap-1.5 text-[var(--color-text-primary)]"
                >
                  <Settings2 className="w-4 h-4 text-[var(--color-brand-blue)]" />
                  <span>Configure Intake</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAddProgModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--color-brand-blue)] text-white hover:opacity-90 inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Programme</span>
              </button>

              <Link
                to="/import"
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] hover:border-[var(--color-brand-blue)] inline-flex items-center gap-1.5 text-[var(--color-text-primary)]"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#FFCD54]" />
                <span>Import Enrolment</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-[var(--color-border-subtle)]">
            <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
              <div className="text-[11px] text-[var(--color-text-secondary)] font-medium">Programmes</div>
              <div className="text-xl font-bold font-mono-code text-[var(--color-brand-blue)] mt-0.5">
                {institution.programmes_count}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
              <div className="text-[11px] text-[var(--color-text-secondary)] font-medium">Enrolled Students</div>
              <div className="text-xl font-bold font-mono-code text-[#FFCD54] mt-0.5">
                {institution.current_enrolment ?? institution.students_count}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">Sanctioned Intake</span>
                {institution.academic_session && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] font-mono-code text-[var(--color-text-muted)]">
                    {institution.academic_session}
                  </span>
                )}
              </div>
              <div className="text-xl font-bold font-mono-code text-[var(--color-text-primary)] mt-0.5">
                {institution.total_approved_intake} seats
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
              <div className="text-[11px] text-[var(--color-text-secondary)] font-medium">Remaining Seats</div>
              <div className={`text-xl font-bold font-mono-code mt-0.5 ${
                (institution.remaining_capacity ?? 0) <= 0
                  ? 'text-[#F70063]'
                  : (institution.remaining_capacity ?? 0) <= 15
                  ? 'text-[#FFCD54]'
                  : 'text-[#10B981]'
              }`}>
                {institution.remaining_capacity !== undefined ? `${institution.remaining_capacity} seats` : '—'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
              <div className="text-[11px] text-[var(--color-text-secondary)] font-medium">Capacity Utilization</div>
              <div className={`text-xl font-bold font-mono-code mt-0.5 ${
                institution.capacity_utilization_pct > 100
                  ? 'text-[#F70063]'
                  : institution.capacity_utilization_pct >= 85
                  ? 'text-[#FFCD54]'
                  : 'text-[var(--color-brand-blue)]'
              }`}>
                {institution.capacity_utilization_pct}%
              </div>
            </div>
          </div>

          {/* Allocation Warning Banner */}
          {institution.has_allocation_warning && (
            <div className="mt-4 p-3.5 rounded-xl bg-[#F70063]/10 border border-[#F70063]/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#F70063] shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="font-bold text-[#F70063] flex items-center gap-2">
                  <span>Programme Allocation Warning</span>
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[#F70063]/20">
                    Allocated: {institution.programme_allocations_total} / Sanctioned: {institution.total_approved_intake} seats
                  </span>
                </div>
                <p className="text-[var(--color-text-secondary)] mt-1">
                  {institution.allocation_warning_message ||
                    `The sum of programme intake quotas (${institution.programme_allocations_total}) exceeds the institution's total sanctioned intake (${institution.total_approved_intake}). Please review programme quota allocations or configure institution intake.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 5 Dedicated Tabs Navigation */}
        <div className="mt-6 border-b border-[var(--color-border-subtle)] flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'programmes', label: `Programmes (${programmes.length})`, icon: BookOpen },
            { id: 'students', label: `Student Records (${students.length})`, icon: Users },
            { id: 'capacity', label: 'Intake & Capacity', icon: Gauge },
            { id: 'history', label: `Verification History (${history.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                  active
                    ? 'border-[var(--color-brand-blue)] text-[var(--color-brand-blue)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="app-card p-5 border border-[var(--color-border-subtle)] space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--color-brand-blue)]" />
                <span>Institutional Details</span>
              </h3>
              <div className="space-y-2.5">
                <div>
                  <span className="text-[var(--color-text-muted)] block">Official Institution Code</span>
                  <span className="font-mono-code font-bold text-sm text-[var(--color-brand-blue)]">
                    {institution.code}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block">Institution Type</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{institution.type}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block">Physical Address</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {institution.address || `${institution.city}, ${institution.state}`}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] block">Administrative Contact</span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {institution.contact_email || 'Not registered'} · {institution.contact_phone || 'No phone recorded'}
                  </span>
                </div>
              </div>
            </div>

            <div className="app-card p-5 border border-[var(--color-border-subtle)] space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#FFCD54]" />
                <span>Academic Capacity Breakdown</span>
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                AICTE regulatory quota enforcement tracks enrolment against approved intake limits to prevent unauthorized admissions.
              </p>
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] space-y-2">
                <div className="flex items-center justify-between font-mono-code">
                  <span>Current Total Enrolment</span>
                  <span className="font-bold">{institution.current_enrolment} Students</span>
                </div>
                <div className="flex items-center justify-between font-mono-code">
                  <span>Approved Regulatory Cap</span>
                  <span className="font-bold">{institution.total_approved_intake} Seats</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-surface-hover)] overflow-hidden mt-1">
                  <div
                    className={`h-full ${
                      institution.capacity_utilization_pct > 100
                        ? 'bg-[#F70063]'
                        : institution.capacity_utilization_pct >= 85
                        ? 'bg-[#FFCD54]'
                        : 'bg-[var(--color-brand-blue)]'
                    }`}
                    style={{ width: `${Math.min(institution.capacity_utilization_pct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Programmes */}
        {activeTab === 'programmes' && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold">Approved Institutional Programmes</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Intake caps and academic quotas are managed here by authorized regulatory and institution officers.
                </p>
              </div>
              {canManageProgrammes && (
                <button
                  type="button"
                  onClick={() => setIsAddProgModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[var(--color-brand-blue)] text-white hover:opacity-90 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Programme</span>
                </button>
              )}
            </div>

            {programmes.length === 0 ? (
              <div className="py-16 text-center app-card p-6 border-dashed border-[var(--color-border-subtle)]">
                <BookOpen className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
                <p className="text-xs text-[var(--color-text-secondary)]">No programmes recorded for this institution.</p>
                <button
                  type="button"
                  onClick={() => setIsAddProgModalOpen(true)}
                  className="mt-3 px-3.5 py-1.5 text-xs rounded-xl bg-[var(--color-brand-blue)] text-white inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Programme</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programmes.map((prog) => {
                  const util = Math.round((prog.intake_current / prog.intake_cap) * 100) || 0;
                  const isExceeded = prog.intake_current > prog.intake_cap;

                  return (
                    <div key={prog.id} className="app-card p-4 border border-[var(--color-border-subtle)]">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-mono-code font-bold text-[var(--color-brand-blue)]">
                          {prog.code || 'DEG-PROG'}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono-code">
                          {prog.admission_year}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[var(--color-text-primary)] line-clamp-2">
                        {prog.name}
                      </h4>

                      <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono-code">
                          <span className="text-[var(--color-text-muted)]">Enrolled / Cap</span>
                          <span className={`font-bold ${isExceeded ? 'text-[#F70063]' : 'text-[var(--color-text-primary)]'}`}>
                            {prog.intake_current} / {prog.intake_cap} seats
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                          <div
                            className={`h-full ${isExceeded ? 'bg-[#F70063]' : util >= 85 ? 'bg-[#FFCD54]' : 'bg-[var(--color-brand-blue)]'}`}
                            style={{ width: `${Math.min(util, 100)}%` }}
                          />
                        </div>
                      </div>

                      {canManageProgrammes && (
                        <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingProgramme(prog)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/10 transition-colors"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                            <span>Configure Intake</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Student Records */}
        {activeTab === 'students' && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Filter student records..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
                />
              </div>

              <span className="text-xs text-[var(--color-text-secondary)]">
                Showing {filteredStudents.length} of {students.length} institutional records
              </span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="py-16 text-center app-card p-6 border-dashed border-[var(--color-border-subtle)]">
                <Users className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
                <p className="text-xs text-[var(--color-text-secondary)]">No student records enrolled under this institution.</p>
                <Link
                  to="/import"
                  className="mt-3 px-3.5 py-1.5 text-xs rounded-xl bg-[var(--color-brand-blue)] text-white inline-flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Import Records</span>
                </Link>
              </div>
            ) : (
              <div className="app-card border border-[var(--color-border-subtle)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] font-semibold">
                        <th className="py-3 px-4">Student Candidate</th>
                        <th className="py-3 px-4">Masked APAAR ID</th>
                        <th className="py-3 px-4">Programme</th>
                        <th className="py-3 px-4">Session</th>
                        <th className="py-3 px-4">Verification Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--color-text-primary)]">{s.student_name}</div>
                            <div className="text-[11px] text-[var(--color-text-muted)]">{s.email || '—'}</div>
                          </td>
                          <td className="py-3 px-4 font-mono-code text-[var(--color-brand-blue)] font-medium">
                            {maskApaar(s.apaar_id)}
                          </td>
                          <td className="py-3 px-4 text-[var(--color-text-primary)]">{s.programme}</td>
                          <td className="py-3 px-4 font-mono-code text-[var(--color-text-muted)]">{s.admission_year}</td>
                          <td className="py-3 px-4">
                            {s.integrity_status === 'verified' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2391FF]/15 text-[#2391FF] border border-[#2391FF]/30">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified</span>
                              </span>
                            )}
                            {s.integrity_status === 'duplicate' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F70063]/15 text-[#F70063] border border-[#F70063]/30">
                                <CopyX className="w-3 h-3" />
                                <span>Duplicate Flagged</span>
                              </span>
                            )}
                            {s.integrity_status === 'warning' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Intake Alert</span>
                              </span>
                            )}
                            {s.integrity_status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF83F]/15 text-[#D97706] dark:text-[#FFF83F] border border-[#FFF83F]/30">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentInitial(s)}
                              className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-brand-blue)] hover:bg-[var(--color-surface-hover)] transition-colors"
                              title="View Record Details"
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
            )}
          </div>
        )}

        {/* Tab 4: Intake & Capacity */}
        {activeTab === 'capacity' && capacity && (
          <div className="mt-6 space-y-4">
            {/* Institution-Level Sanctioned Capacity Card */}
            <div className="app-card p-5 border border-[var(--color-border-subtle)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-[var(--color-brand-blue)]" />
                    <span>Institution Sanctioned Intake Capacity</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Session <span className="font-mono-code font-bold text-[var(--color-text-primary)]">{institution.academic_session || '2024-2028'}</span> institution-level admission quota
                  </p>
                </div>
                {canManageProgrammes && (
                  <button
                    type="button"
                    onClick={() => setIsConfigureIntakeModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] hover:border-[var(--color-brand-blue)] inline-flex items-center gap-1.5 text-[var(--color-brand-blue)] transition-colors self-start sm:self-auto"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Configure Session Intake</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">Sanctioned Intake</span>
                  <span className="font-mono-code font-bold text-base text-[var(--color-text-primary)]">
                    {institution.total_approved_intake} seats
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">Enrolled Students</span>
                  <span className="font-mono-code font-bold text-base text-[#FFCD54]">
                    {institution.current_enrolment ?? institution.students_count}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">Remaining Capacity</span>
                  <span className={`font-mono-code font-bold text-base ${
                    (institution.remaining_capacity ?? 0) <= 0
                      ? 'text-[#F70063]'
                      : (institution.remaining_capacity ?? 0) <= 15
                      ? 'text-[#FFCD54]'
                      : 'text-[#10B981]'
                  }`}>
                    {institution.remaining_capacity !== undefined ? `${institution.remaining_capacity} seats` : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">Programme Quotas Total</span>
                  <span className={`font-mono-code font-bold text-base ${
                    institution.has_allocation_warning ? 'text-[#F70063]' : 'text-[var(--color-brand-blue)]'
                  }`}>
                    {institution.programme_allocations_total ?? 0} seats
                  </span>
                </div>
              </div>

              {/* Progress bar of institution utilization */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-secondary)]">Institution Intake Utilization</span>
                  <span className={`font-mono-code font-bold ${
                    institution.capacity_utilization_pct > 100
                      ? 'text-[#F70063]'
                      : institution.capacity_utilization_pct >= 85
                      ? 'text-[#FFCD54]'
                      : 'text-[var(--color-brand-blue)]'
                  }`}>
                    {institution.capacity_utilization_pct}% ({institution.current_enrolment ?? institution.students_count} / {institution.total_approved_intake} seats)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                  <div
                    className={`h-full ${
                      institution.capacity_utilization_pct > 100
                        ? 'bg-[#F70063]'
                        : institution.capacity_utilization_pct >= 85
                        ? 'bg-[#FFCD54]'
                        : 'bg-[var(--color-brand-blue)]'
                    }`}
                    style={{ width: `${Math.min(institution.capacity_utilization_pct, 100)}%` }}
                  />
                </div>
              </div>

              {institution.has_allocation_warning && (
                <div className="mt-4 p-3 rounded-xl bg-[#F70063]/10 border border-[#F70063]/30 flex items-start gap-2 text-xs text-[#F70063]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Quota Allocation Alert:</strong> The total programme intake quota ({institution.programme_allocations_total}) exceeds the institution sanctioned intake ({institution.total_approved_intake}). Adjust individual programme quotas or update the institution sanctioned intake ceiling.
                  </span>
                </div>
              )}
            </div>

            {/* Programme Quota Monitoring */}
            <div className="app-card p-5 border border-[var(--color-border-subtle)]">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <Gauge className="w-4 h-4 text-[#FFCD54]" />
                <span>Programme Quota Monitoring</span>
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mb-4">
                Regulatory compliance requires institutions to strictly admit candidates within sanctioned programme quotas.
              </p>

              <div className="space-y-4">
                {capacity.programmes.map((p) => (
                  <div key={p.programme_id} className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div>
                        <span className="font-bold text-[var(--color-text-primary)]">{p.programme_name}</span>
                        {p.programme_code && (
                          <span className="ml-2 font-mono-code text-[10px] text-[var(--color-brand-blue)]">
                            ({p.programme_code})
                          </span>
                        )}
                      </div>
                      <span className={`font-mono-code font-bold ${
                        p.status === 'EXCEEDED' || p.status === 'OVER_CAPACITY'
                          ? 'text-[#F70063]'
                          : p.status === 'NEAR_CAPACITY' || p.status === 'CAPACITY_REACHED'
                          ? 'text-[#FFCD54]'
                          : p.status === 'INTAKE_MISSING' || p.status === 'REQUIRES_REVIEW'
                          ? 'text-amber-400'
                          : 'text-[var(--color-brand-blue)]'
                      }`}>
                        {p.intake_current} admitted / {p.intake_cap} quota ({p.utilization_pct}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                      <div
                        className={`h-full ${
                          p.status === 'EXCEEDED' || p.status === 'OVER_CAPACITY'
                            ? 'bg-[#F70063]'
                            : p.status === 'NEAR_CAPACITY' || p.status === 'CAPACITY_REACHED'
                            ? 'bg-[#FFCD54]'
                            : p.status === 'INTAKE_MISSING' || p.status === 'REQUIRES_REVIEW'
                            ? 'bg-amber-400'
                            : 'bg-[var(--color-brand-blue)]'
                        }`}
                        style={{ width: `${Math.min(p.utilization_pct, 100)}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-code ${
                        p.status === 'EXCEEDED' || p.status === 'OVER_CAPACITY'
                          ? 'bg-[#F70063]/15 text-[#F70063] border border-[#F70063]/30'
                          : p.status === 'NEAR_CAPACITY' || p.status === 'CAPACITY_REACHED'
                          ? 'bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30'
                          : p.status === 'INTAKE_MISSING' || p.status === 'REQUIRES_REVIEW'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                      }`}>
                        {p.status}
                      </span>
                      {p.status_explanation && (
                        <span className="text-[11px] text-[var(--color-text-secondary)]">{p.status_explanation}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Verification History */}
        {activeTab === 'history' && (
          <div className="mt-6">
            <div className="app-card border border-[var(--color-border-subtle)] p-5">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-[var(--color-brand-blue)]" />
                <span>Cryptographic Verification Audit Trail</span>
              </h3>

              {history.length === 0 ? (
                <p className="text-xs text-[var(--color-text-secondary)]">No audit events logged yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {history.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[var(--color-text-primary)]">
                          {evt.student_name} ({maskApaar(evt.apaar_id)})
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          {evt.programme} · {evt.timestamp}
                        </div>
                        {evt.notes && (
                          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 font-mono-code">
                            {evt.notes}
                          </div>
                        )}
                      </div>
                      <span className="font-mono-code text-[10px] uppercase font-bold text-[var(--color-brand-blue)]">
                        {evt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Configure Institution Intake Modal */}
      <ConfigureInstitutionIntakeModal
        isOpen={isConfigureIntakeModalOpen}
        institutionCode={institution.code}
        currentSession={institution.academic_session || '2024-2028'}
        currentIntake={institution.total_approved_intake}
        onClose={() => setIsConfigureIntakeModalOpen(false)}
        onIntakeUpdated={handleIntakeUpdated}
      />

      {/* Add Programme Modal */}
      <AddProgrammeModal
        isOpen={isAddProgModalOpen}
        institutionCode={institution.code}
        onClose={() => setIsAddProgModalOpen(false)}
        onProgrammeCreated={handleProgrammeCreated}
      />

      {/* Edit Programme Modal */}
      <EditProgrammeModal
        isOpen={Boolean(editingProgramme)}
        institutionCode={institution.code}
        programme={editingProgramme}
        onClose={() => setEditingProgramme(null)}
        onProgrammeUpdated={handleProgrammeUpdated}
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
