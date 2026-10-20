import React, { useState, useEffect } from 'react';
import { X, BookOpen, AlertCircle, Loader2, Gauge, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import type { InstitutionProgramme } from '../../services/api';

interface EditProgrammeModalProps {
  isOpen: boolean;
  institutionCode: string;
  programme: InstitutionProgramme | null;
  onClose: () => void;
  onProgrammeUpdated: (programme: InstitutionProgramme) => void;
}

export const EditProgrammeModal: React.FC<EditProgrammeModalProps> = ({
  isOpen,
  institutionCode,
  programme,
  onClose,
  onProgrammeUpdated,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [admissionYear, setAdmissionYear] = useState('2024-2028');
  const [intakeCap, setIntakeCap] = useState(60);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (programme) {
      setName(programme.name || '');
      setCode(programme.code || '');
      setAdmissionYear(programme.admission_year || '2024-2028');
      setIntakeCap(programme.intake_cap || 60);
      setError(null);
    }
  }, [programme, isOpen]);

  if (!isOpen || !programme) return null;

  const currentEnrolled = programme.intake_current || 0;
  const parsedCap = Math.max(1, Number(intakeCap) || 1);
  const isExceeded = currentEnrolled > parsedCap;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Programme name cannot be empty.');
      return;
    }

    if (parsedCap < 1) {
      setError('Approved intake cap must be at least 1 seat.');
      return;
    }

    setIsLoading(true);
    try {
      const updated = await api.updateProgramme(institutionCode, programme.id, {
        name: cleanName,
        code: code.trim() || undefined,
        admission_year: admissionYear.trim() || undefined,
        intake_cap: parsedCap,
      });

      onProgrammeUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update programme intake cap.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl app-modal border border-[var(--color-border-subtle)] p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-blue)]/15 border border-[var(--color-brand-blue)]/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[var(--color-brand-blue)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Manage Programme & Intake Cap</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Institution: <span className="font-mono-code text-[var(--color-brand-blue)]">{institutionCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#F70063]/10 border border-[#F70063]/25 flex items-start gap-2 text-xs text-[#F70063]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left text-xs">
          {/* Read-Only Enrolled Count Context */}
          <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                <span>Current Enrolled Count (Read-Only)</span>
              </span>
              <span className="font-mono-code font-bold text-sm text-[var(--color-text-primary)]">
                {currentEnrolled} Students
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Enrolment is calculated dynamically from persisted verified student records and cannot be directly overwritten.
            </p>
            {isExceeded && (
              <div className="mt-1 p-2 rounded-lg bg-[#F70063]/10 border border-[#F70063]/30 text-[#F70063] flex items-center gap-1.5 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Enrolment exceeds newly proposed cap. An intake capacity warning will be registered during audit.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
              Programme / Course Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. B.Tech Computer Science & Engineering"
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Programme Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CSE-2024"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Academic Session / Year *
              </label>
              <input
                type="text"
                required
                value={admissionYear}
                onChange={(e) => setAdmissionYear(e.target.value)}
                placeholder="2024-2028"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
              Sanctioned Intake Cap (Approved Regulatory Limit) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={intakeCap}
              onChange={(e) => setIntakeCap(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
            />
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
              Only authorized central regulators or designated institution nodal officers can configure approved programme quotas.
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white font-semibold hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Programme Settings...</span>
                </>
              ) : (
                <span>Save Intake Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
