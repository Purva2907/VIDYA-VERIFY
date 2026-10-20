import React, { useState, useEffect } from 'react';
import { X, Gauge, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import type { Institution } from '../../services/api';

interface Props {
  isOpen: boolean;
  institutionCode: string;
  currentSession?: string;
  currentIntake?: number;
  onClose: () => void;
  onIntakeUpdated: (institution: Institution) => void;
}

export const ConfigureInstitutionIntakeModal: React.FC<Props> = ({
  isOpen,
  institutionCode,
  currentSession = '2024-2028',
  currentIntake = 300,
  onClose,
  onIntakeUpdated,
}) => {
  const [academicSession, setAcademicSession] = useState(currentSession);
  const [sanctionedIntake, setSanctionedIntake] = useState(String(currentIntake));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAcademicSession(currentSession || '2024-2028');
      setSanctionedIntake(String(currentIntake || 300));
      setError(null);
    }
  }, [isOpen, currentSession, currentIntake]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanSession = academicSession.trim();
    if (!cleanSession) {
      setError('Academic Session is required (e.g. 2024-2028).');
      return;
    }

    if (!sanctionedIntake || sanctionedIntake.trim() === '') {
      setError('Sanctioned Intake is required.');
      return;
    }

    const intakeNum = Number(sanctionedIntake);
    if (isNaN(intakeNum) || !Number.isInteger(intakeNum) || intakeNum <= 0) {
      setError('Total Sanctioned Intake must be a positive whole integer greater than zero.');
      return;
    }

    setIsLoading(true);
    try {
      const updated = await api.configureInstitutionIntake(institutionCode, {
        academic_session: cleanSession,
        sanctioned_intake: intakeNum,
      });

      onIntakeUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update sanctioned intake.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl app-modal border border-[var(--color-border-subtle)] p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-blue)]/15 border border-[var(--color-brand-blue)]/30 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-[var(--color-brand-blue)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Configure Institution Intake</h2>
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
          <div>
            <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
              Academic Session *
            </label>
            <input
              type="text"
              required
              value={academicSession}
              onChange={(e) => setAcademicSession(e.target.value)}
              placeholder="e.g. 2024-2028"
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
            />
            <span className="text-[10px] text-[var(--color-text-muted)] mt-1 block">
              Session format: YYYY-YYYY (e.g., 2024-2028, 2025-2029)
            </span>
          </div>

          <div>
            <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
              Total Sanctioned Intake Capacity *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={sanctionedIntake}
              onChange={(e) => setSanctionedIntake(e.target.value)}
              placeholder="e.g. 300"
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
            />
            <span className="text-[10px] text-[var(--color-text-muted)] mt-1 block">
              Maximum total student admission quota across all programmes for this academic session.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)]">
            <p>
              Changes are tracked in the audit trail. Programme allocations exceeding this total will trigger compliance warnings.
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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
