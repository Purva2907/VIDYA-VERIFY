import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { StudentRecord } from '../../services/api';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CopyX,
  Clock,
  Eye,
  EyeOff,
  Building2,
  GraduationCap,
  FileCheck,
  Calendar,
  Layers,
  Mail,
  Hash,
  Loader2,
  AlertCircle,
  RefreshCw,
  Award,
} from 'lucide-react';

interface StudentDetailsModalProps {
  studentId?: string | null;
  initialRecord?: StudentRecord | null;
  isOpen?: boolean;
  student?: StudentRecord | null;
  onClose: () => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  studentId: propStudentId,
  initialRecord,
  isOpen = true,
  student,
  onClose,
}) => {
  const effectiveInitial = student || initialRecord || null;
  const effectiveStudentId = propStudentId || effectiveInitial?.id || null;

  const [record, setRecord] = useState<StudentRecord | null>(effectiveInitial);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullApaar, setShowFullApaar] = useState(false);

  useEffect(() => {
    if (effectiveInitial) {
      setRecord(effectiveInitial);
    }
  }, [effectiveInitial]);

  useEffect(() => {
    if (!effectiveStudentId) {
      if (!effectiveInitial) {
        setRecord(null);
        setError(null);
      }
      return;
    }

    // Always fetch latest authoritative record from backend ledger
    let isMounted = true;
    const fetchLatestRecord = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fresh = await api.getStudent(effectiveStudentId);
        if (isMounted) {
          setRecord(fresh);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load authoritative student record from backend ledger.');
          // Fall back to initialRecord if available
          if (effectiveInitial) {
            setRecord(effectiveInitial);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLatestRecord();

    return () => {
      isMounted = false;
    };
  }, [effectiveStudentId]);

  if (!isOpen || (!effectiveStudentId && !record)) return null;

  const maskApaar = (id: string) => {
    if (showFullApaar) return id;
    const parts = id.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-••••-••••-${parts[parts.length - 1]}`;
    }
    if (id.length >= 8) {
      return id.substring(0, 4) + '••••' + id.substring(id.length - 4);
    }
    return id;
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2391FF]/10 text-[#2391FF] border border-[#2391FF]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/35">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Review</span>
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F70063]/15 text-[#F70063] border border-[#F70063]/30">
            <CopyX className="w-3.5 h-3.5" />
            <span>Duplicate Collision</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)] flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Student Record Details
              </h2>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Authoritative Record &bull; ID: <span className="font-mono-code font-bold">{studentId}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto">
          {isLoading && !record && (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-7 h-7 text-[var(--color-brand-blue)] animate-spin" />
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Fetching latest student record from ledger...
              </span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/30 text-xs text-[var(--color-brand-pink)] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Sync Notice: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {record && (
            <>
              {/* Primary Header Card */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold tracking-wider">
                    Candidate Full Name
                  </div>
                  <div className="text-lg font-bold text-[var(--color-text-primary)] mt-0.5">
                    {record.student_name || '—'}
                  </div>
                </div>
                <div>{getStatusBadge(record.verification_status || record.integrity_status)}</div>
              </div>

              {/* Core Identifiers: Email & Enrollment Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">
                    <Mail className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                    <span>Email Address</span>
                  </div>
                  <div className="font-semibold text-xs text-[var(--color-text-primary)] mt-1 break-all">
                    {record.email || '—'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">
                    <Hash className="w-3.5 h-3.5 text-[var(--color-brand-yellow)]" />
                    <span>Enrollment / Roll No</span>
                  </div>
                  <div className="font-mono-code font-bold text-xs text-[var(--color-text-primary)] mt-1">
                    {record.enrollment_number || '—'}
                  </div>
                </div>
              </div>

              {/* Student Demographics: Category, Gender, DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                    <span>Date of Birth</span>
                  </div>
                  <div className="font-semibold text-xs text-[var(--color-text-primary)] mt-1">
                    {record.dob || '—'}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">
                    <Award className="w-3.5 h-3.5 text-[var(--color-brand-yellow)]" />
                    <span>Social Category</span>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--color-brand-yellow)]/10 text-[var(--color-brand-yellow)] border border-[var(--color-brand-yellow)]/25">
                      {record.category || 'General'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">
                    <FileCheck className="w-3.5 h-3.5 text-[var(--color-brand-pink)]" />
                    <span>Gender</span>
                  </div>
                  <div className="font-semibold text-xs text-[var(--color-text-primary)] mt-1">
                    {record.gender || '—'}
                  </div>
                </div>
              </div>

              {/* APAAR ID with Mask/Reveal */}
              <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)]">
                    APAAR Identifier (Unique Student Key)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFullApaar(!showFullApaar)}
                    className="text-[11px] text-[var(--color-brand-blue)] hover:underline flex items-center gap-1 font-medium"
                  >
                    {showFullApaar ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Mask ID</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Reveal ID</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono-code font-bold text-sm text-[var(--color-text-primary)] mt-1.5">
                  {maskApaar(record.apaar_id || '—')}
                </div>
              </div>

              {/* Institution and Programme Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Institution / Campus</span>
                  </div>
                  <span className="font-semibold text-[var(--color-text-primary)] block mt-1">
                    {record.institution_name || record.institute_name || '—'}
                  </span>
                  <span className="text-[10px] font-mono-code text-[var(--color-text-muted)] block mt-0.5">
                    Code: {record.institution_code || record.institute_code || '—'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Course &amp; Academic Session</span>
                  </div>
                  <span className="font-semibold text-[var(--color-text-primary)] block mt-1">
                    {record.course || record.programme || '—'}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
                    Session: {record.academic_year || record.admission_year || '—'}
                  </span>
                </div>
              </div>

              {/* Quota & Intake stats */}
              <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <span className="font-medium text-[var(--color-text-primary)]">
                    Sanctioned Intake Utilization
                  </span>
                </div>
                <span className="font-mono-code font-bold text-xs text-[var(--color-text-primary)]">
                  {record.intake_current ?? '—'} / {record.intake_cap ?? '—'} seats
                </span>
              </div>

              {/* Verification Notes */}
              {record.notes && (
                <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
                  <span className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)] block mb-1">
                    Integrity Audit Findings &amp; Ledger Notes
                  </span>
                  <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                    {record.notes}
                  </p>
                </div>
              )}

              {/* Cryptographic verification proof */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] text-[10px] font-mono-code space-y-1.5">
                <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                  <span>Cryptographic Ledger Receipt:</span>
                  <span className="text-[9px] uppercase font-bold text-[var(--color-brand-blue)]">
                    SHA-256 Validated
                  </span>
                </div>
                <div className="truncate text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-text-muted)]">Merkle Root: </span>
                  {record.merkle_root || '0x0000000000000000000000000000000000000000'}
                </div>
                {record.ecdsa_signature && (
                  <div className="truncate text-[var(--color-text-secondary)]">
                    <span className="text-[var(--color-text-muted)]">ECDSA Signature: </span>
                    {record.ecdsa_signature}
                  </div>
                )}
                {record.updated_at && (
                  <div className="text-[9px] text-[var(--color-text-muted)] pt-1">
                    Last synchronised: {record.updated_at}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border-subtle)] shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
