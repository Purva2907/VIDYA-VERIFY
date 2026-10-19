import React, { useState } from 'react';
import { api } from '../../services/api';
import type { StudentRecord } from '../../services/api';
import { X, UserPlus, Loader2, AlertCircle } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: (student: StudentRecord) => void;
  defaultInstituteCode?: string;
  defaultInstituteName?: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onStudentAdded,
  defaultInstituteCode = 'IND-AICTE-1042',
  defaultInstituteName = 'Delhi Institute of Technology',
}) => {
  const [apaarId, setApaarId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [instituteCode, setInstituteCode] = useState(defaultInstituteCode);
  const [instituteName, setInstituteName] = useState(defaultInstituteName);
  const [programme, setProgramme] = useState('B.Tech Computer Science & Engineering');
  const [admissionYear, setAdmissionYear] = useState('2024-2028');
  const [intakeCurrent, setIntakeCurrent] = useState('60');
  const [intakeCap, setIntakeCap] = useState('60');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!apaarId.trim() || apaarId.trim().length < 12) {
      setError('APAAR ID must contain at least 12 valid characters (e.g. 9024-8172-5501-IN).');
      return;
    }
    if (!studentName.trim()) {
      setError('Student name is required.');
      return;
    }

    setIsLoading(true);
    try {
      const newRec = await api.addStudent({
        apaar_id: apaarId.trim(),
        student_name: studentName.trim(),
        institute_code: instituteCode.trim(),
        institute_name: instituteName.trim(),
        programme: programme.trim(),
        admission_year: admissionYear.trim(),
        intake_current: parseInt(intakeCurrent, 10) || 60,
        intake_cap: parseInt(intakeCap, 10) || 60,
        notes: notes.trim() || undefined,
      });
      onStudentAdded(newRec);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add student record.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Add Student Record
              </h2>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Register candidate for APAAR integrity cross-referencing
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/30 text-[var(--color-brand-pink)] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                APAAR ID *
              </label>
              <input
                type="text"
                required
                value={apaarId}
                onChange={(e) => setApaarId(e.target.value)}
                placeholder="e.g. 9024-8172-5501-IN"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Candidate Full Name"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Institution Code *
              </label>
              <input
                type="text"
                required
                value={instituteCode}
                onChange={(e) => setInstituteCode(e.target.value)}
                placeholder="IND-AICTE-1042"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Institution Name *
              </label>
              <input
                type="text"
                required
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                placeholder="Enrolling Institution"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Programme / Course *
              </label>
              <input
                type="text"
                required
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
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
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Current Intake Count
              </label>
              <input
                type="number"
                value={intakeCurrent}
                onChange={(e) => setIntakeCurrent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Approved Intake Cap
              </label>
              <input
                type="number"
                value={intakeCap}
                onChange={(e) => setIntakeCap(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
              Internal Verification Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lateral entry candidate"
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
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
                  <span>Evaluating Record...</span>
                </>
              ) : (
                <span>Add Record</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
