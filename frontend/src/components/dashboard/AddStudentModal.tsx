import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { StudentRecord, Institution, InstitutionProgramme } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, UserPlus, Loader2, AlertCircle, Building2, BookOpen, Info, ShieldCheck } from 'lucide-react';

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
  defaultInstituteCode,
  defaultInstituteName,
}) => {
  const { user } = useAuth();

  // Form student-specific fields
  const [apaarId, setApaarId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('General');
  const [notes, setNotes] = useState('');

  // Institution and Programme selection
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstCode, setSelectedInstCode] = useState<string>('');
  const [programmes, setProgrammes] = useState<InstitutionProgramme[]>([]);
  const [selectedProgName, setSelectedProgName] = useState<string>('');
  const [selectedProgYear, setSelectedProgYear] = useState<string>('2024-2028');

  // Loading states
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [isLoadingProgrammes, setIsLoadingProgrammes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if user is institution-scoped (node officer)
  const isNodeUser = user?.role === 'node' && Boolean(user?.institute_id);
  const nodeInstCode = user?.institute_id?.trim().toUpperCase();

  // Load institutions on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setError(null);
    setIsLoadingInstitutions(true);

    api.getInstitutions()
      .then((data) => {
        if (!isMounted) return;
        setInstitutions(data);

        // Determine default institution
        let initialCode = '';
        if (isNodeUser && nodeInstCode) {
          initialCode = nodeInstCode;
        } else if (defaultInstituteCode) {
          initialCode = defaultInstituteCode.trim().toUpperCase();
        } else if (data.length > 0) {
          initialCode = data[0].code;
        }
        setSelectedInstCode(initialCode);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load institutions.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingInstitutions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, isNodeUser, nodeInstCode, defaultInstituteCode]);

  // Load programmes whenever selected institution changes
  useEffect(() => {
    if (!isOpen || !selectedInstCode) {
      setProgrammes([]);
      setSelectedProgName('');
      return;
    }

    let isMounted = true;
    setIsLoadingProgrammes(true);

    api.getProgrammes(selectedInstCode)
      .then((progs) => {
        if (!isMounted) return;
        setProgrammes(progs);
        if (progs.length > 0) {
          setSelectedProgName(progs[0].name);
          setSelectedProgYear(progs[0].admission_year || '2024-2028');
        } else {
          setSelectedProgName('');
          setSelectedProgYear('2024-2028');
        }
      })
      .catch(() => {
        if (isMounted) {
          setProgrammes([]);
          setSelectedProgName('');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingProgrammes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedInstCode]);

  // Selected programme object
  const activeProgramme = programmes.find(
    (p) => p.name.trim().toLowerCase() === selectedProgName.trim().toLowerCase()
  );

  const handleProgrammeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pName = e.target.value;
    setSelectedProgName(pName);
    const found = programmes.find((p) => p.name.trim().toLowerCase() === pName.trim().toLowerCase());
    if (found) {
      setSelectedProgYear(found.admission_year || '2024-2028');
    }
  };

  const resetForm = () => {
    setApaarId('');
    setStudentName('');
    setEnrollmentNumber('');
    setEmail('');
    setDob('');
    setGender('');
    setCategory('General');
    setNotes('');
    setError(null);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanApaar = apaarId.trim();
    if (!cleanApaar || cleanApaar.length < 12) {
      setError('APAAR ID must contain at least 12 valid characters (e.g. 9024-8172-5501-IN).');
      return;
    }

    if (!studentName.trim()) {
      setError('Student full name is required.');
      return;
    }

    if (!selectedInstCode) {
      setError('Please select an enrolling institution.');
      return;
    }

    if (!selectedProgName) {
      setError('Please select a registered programme for this institution.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find official institution name from loaded records
      const instObj = institutions.find(
        (i) => i.code.trim().toUpperCase() === selectedInstCode.trim().toUpperCase()
      );
      const officialInstName = instObj?.name || defaultInstituteName || selectedInstCode;

      // Note: Current intake count and approved intake cap are NOT submitted from client.
      // The backend computes current enrolment dynamically and enforces the persisted cap.
      const newRec = await api.addStudent({
        apaar_id: cleanApaar,
        student_name: studentName.trim(),
        institute_code: selectedInstCode.trim().toUpperCase(),
        institute_name: officialInstName,
        programme: selectedProgName.trim(),
        admission_year: selectedProgYear.trim() || undefined,
        enrollment_number: enrollmentNumber.trim() || undefined,
        email: email.trim() || undefined,
        dob: dob.trim() || undefined,
        category: category.trim() || undefined,
        gender: gender.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onStudentAdded(newRec);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register student record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue)]/15 text-[var(--color-brand-blue)] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Register Student Record
              </h2>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Enroll student candidate under institution and programme ledger
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

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/30 text-[var(--color-brand-pink)] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Institution & Programme Selection */}
          <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] space-y-3">
            <div className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)] text-xs">
              <Building2 className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
              <span>Enrolling Campus & Programme Scoping</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
                  Institution *
                </label>
                {isLoadingInstitutions ? (
                  <div className="flex items-center gap-2 py-2 text-[var(--color-text-muted)]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading institutions...</span>
                  </div>
                ) : (
                  <select
                    value={selectedInstCode}
                    onChange={(e) => setSelectedInstCode(e.target.value)}
                    disabled={isNodeUser}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {institutions.length === 0 ? (
                      <option value="">No institutions registered</option>
                    ) : (
                      institutions.map((inst) => (
                        <option key={inst.code} value={inst.code}>
                          {inst.name} ({inst.code})
                        </option>
                      ))
                    )}
                  </select>
                )}
                {isNodeUser && (
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[var(--color-brand-blue)]" />
                    <span>Locked to your authorized nodal campus</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
                  Programme / Course *
                </label>
                {isLoadingProgrammes ? (
                  <div className="flex items-center gap-2 py-2 text-[var(--color-text-muted)]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading programmes...</span>
                  </div>
                ) : (
                  <select
                    value={selectedProgName}
                    onChange={handleProgrammeChange}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                  >
                    {programmes.length === 0 ? (
                      <option value="">No programmes registered for campus</option>
                    ) : (
                      programmes.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} {p.code ? `(${p.code})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
            </div>

            {/* Read-Only Persisted Capacity Context */}
            {activeProgramme && (
              <div className="mt-2 pt-2 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-[var(--color-brand-blue)]" />
                  <span>Session: <strong className="text-[var(--color-text-primary)] font-mono-code">{activeProgramme.admission_year}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-[#FFCD54]" />
                  <span>Persisted Enrolment: <strong className="text-[var(--color-text-primary)] font-mono-code">{activeProgramme.intake_current} / {activeProgramme.intake_cap} seats</strong></span>
                </span>
              </div>
            )}
          </div>

          {/* Section: Core Student Identifiers */}
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

          {/* Section: Academic Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Enrollment / Roll Number
              </label>
              <input
                type="text"
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value)}
                placeholder="e.g. EN2024-8841"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Academic Session / Year
              </label>
              <input
                type="text"
                value={selectedProgYear}
                onChange={(e) => setSelectedProgYear(e.target.value)}
                placeholder="2024-2028"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>
          </div>

          {/* Section: Student Demographics & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.edu"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Social Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
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
              disabled={isSubmitting || institutions.length === 0 || programmes.length === 0}
              className="px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white font-semibold hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Record...</span>
                </>
              ) : (
                <span>Register Student Record</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
