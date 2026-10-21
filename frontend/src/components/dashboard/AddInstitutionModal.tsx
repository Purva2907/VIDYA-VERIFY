import React, { useState } from 'react';
import { X, Building2, CheckCircle2, AlertCircle, Loader2, Gauge } from 'lucide-react';
import { api } from '../../services/api';
import type { Institution } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInstitutionCreated: (institution: Institution) => void;
}

export const AddInstitutionModal: React.FC<Props> = ({ isOpen, onClose, onInstitutionCreated }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('Autonomous Technical University');
  const [state, setState] = useState('Delhi');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [status, setStatus] = useState<'approved' | 'pending_review' | 'provisional'>('approved');
  const [sanctionedIntake, setSanctionedIntake] = useState('300');
  const [academicSession, setAcademicSession] = useState('2024-2028');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanCity = city.trim();
    const cleanSession = academicSession.trim();

    if (!cleanCode || !cleanName || !cleanCity) {
      setError('Please provide institution name, unique institution code, and city.');
      return;
    }

    if (!cleanSession) {
      setError('Academic Session is required (e.g. 2024-2028).');
      return;
    }

    if (!sanctionedIntake || sanctionedIntake.trim() === '') {
      setError('Total Sanctioned Intake is required.');
      return;
    }

    const intakeNum = Number(sanctionedIntake);
    if (isNaN(intakeNum) || !Number.isInteger(intakeNum) || intakeNum <= 0) {
      setError('Total Sanctioned Intake must be a positive whole integer greater than zero.');
      return;
    }

    setIsLoading(true);
    try {
      const created = await api.createInstitution({
        name: cleanName,
        code: cleanCode,
        type,
        state,
        city: cleanCity,
        address: address.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        status,
        sanctioned_intake: intakeNum,
        academic_session: cleanSession,
      });

      onInstitutionCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register institution.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl app-modal border border-[var(--color-border-subtle)] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-blue)]/15 border border-[var(--color-brand-blue)]/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[var(--color-brand-blue)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Add New Institution</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Register an AICTE-approved institution in the national ledger
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Institution Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Delhi Institute of Technology"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Institution Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="IND-AICTE-XXXX"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Institution Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              >
                <option value="Autonomous Technical University">Autonomous Technical University</option>
                <option value="State Technical University">State Technical University</option>
                <option value="Institute of National Importance">Institute of National Importance</option>
                <option value="Private Technical College">Private Technical College</option>
                <option value="Government Polytechnic">Government Polytechnic</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              >
                <option value="approved">Approved</option>
                <option value="pending_review">Pending Review</option>
                <option value="provisional">Provisional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                State *
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State / Union Territory"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
              Institution Address (Optional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Kashmere Gate, Delhi 110006"
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="registrar@institute.edu"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 ..."
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>
          </div>

          {/* Intake Configuration Section */}
          <div className="pt-3 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-lg bg-[var(--color-brand-blue)]/15 border border-[var(--color-brand-blue)]/30 flex items-center justify-center">
                <Gauge className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-text-primary)] text-xs">
                  Intake Configuration
                </h3>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  Session-specific sanctioned intake limit for the institution
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                  Total Sanctioned Intake *
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
                  Positive integer only (&gt; 0)
                </span>
              </div>

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
                  Session format: YYYY-YYYY
                </span>
              </div>
            </div>
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
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Register Institution</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
