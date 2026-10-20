import React, { useState } from 'react';
import { X, BookOpen, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import type { InstitutionProgramme } from '../../services/api';

interface Props {
  isOpen: boolean;
  institutionCode: string;
  onClose: () => void;
  onProgrammeCreated: (programme: InstitutionProgramme) => void;
}

export const AddProgrammeModal: React.FC<Props> = ({
  isOpen,
  institutionCode,
  onClose,
  onProgrammeCreated,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [admissionYear, setAdmissionYear] = useState('2024-2028');
  const [intakeCap, setIntakeCap] = useState(60);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Programme name cannot be empty.');
      return;
    }

    setIsLoading(true);
    try {
      const created = await api.createProgramme(institutionCode, {
        name: cleanName,
        code: code.trim() || undefined,
        admission_year: admissionYear.trim(),
        intake_cap: Number(intakeCap) || 60,
        status: 'active',
      });

      onProgrammeCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create programme.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl app-modal border border-[var(--color-border-subtle)] p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-blue)]/15 border border-[var(--color-brand-blue)]/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[var(--color-brand-blue)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Add Approved Programme</h2>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-left text-xs">
          <div>
            <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
              Programme Name *
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Programme Code (Optional)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. CSE-101"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Admission Year / Session
              </label>
              <input
                type="text"
                value={admissionYear}
                onChange={(e) => setAdmissionYear(e.target.value)}
                placeholder="2024-2028"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
              Approved Intake Capacity (Seats) *
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              required
              value={intakeCap}
              onChange={(e) => setIntakeCap(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
            />
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
              AICTE regulatory sanctioned intake limit for this academic session.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-[var(--color-border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--color-brand-blue)] hover:opacity-90 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Programme</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
