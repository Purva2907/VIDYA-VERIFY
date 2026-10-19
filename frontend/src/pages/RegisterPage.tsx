import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AcademicIdentityCard3D } from '../components/3d/AcademicIdentityCard3D';
import { ThemeToggle } from '../components/navigation/ThemeToggle';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [aicteId, setAicteId] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [nodalOfficer, setNodalOfficer] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('Northern Region (Delhi / NCR)');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Password and confirmation do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (!acceptedTerms) {
      setError('Please acknowledge the institutional data verification guidelines.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        aicte_id: aicteId.trim(),
        institute_name: instituteName.trim(),
        nodal_officer: nodalOfficer.trim(),
        email: email.trim(),
        password,
        region,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] flex flex-col justify-center items-center py-10 px-4 sm:px-6 transition-colors overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0 flex items-center justify-center">
        <AcademicIdentityCard3D className="w-full h-full max-w-4xl" interactiveControls={false} />
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto mb-4 flex items-center justify-between">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-brand-blue)] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Registration Card */}
      <div className="relative z-10 w-full max-w-xl mx-auto app-card p-6 sm:p-8 bg-[var(--color-surface-card)] shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/30 text-[var(--color-brand-blue)] mb-3 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Register Institution
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Register your institution for student enrolment verification and APAAR record tracking.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/30 text-xs text-[var(--color-brand-pink)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/30 text-xs text-[var(--color-brand-blue)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Institution registered successfully! Redirecting to dashboard...</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                AICTE Permanent Institute ID *
              </label>
              <input
                type="text"
                required
                value={aicteId}
                onChange={(e) => setAicteId(e.target.value)}
                placeholder="e.g. 1-9482103"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] font-mono-code text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                AICTE Region *
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              >
                <option>Northern Region (Delhi / NCR / Punjab / Haryana)</option>
                <option>Western Region (Maharashtra / Goa)</option>
                <option>Southern Region (Karnataka / Kerala / Tamil Nadu)</option>
                <option>Eastern Region (West Bengal / Odisha / Bihar)</option>
                <option>Central Region (Madhya Pradesh / Uttar Pradesh)</option>
              </select>
            </div>
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
              placeholder="e.g. Delhi Institute of Technology & Science"
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Nodal Officer / Registrar Full Name *
              </label>
              <input
                type="text"
                required
                value={nodalOfficer}
                onChange={(e) => setNodalOfficer(e.target.value)}
                placeholder="Dr. Rajesh Verma"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Official Institutional Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="registrar@institute.edu"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text-secondary)] mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded border-[var(--color-border-subtle)] text-[var(--color-brand-blue)]"
            />
            <span className="text-[11px] text-[var(--color-text-secondary)]">
              I certify that I am an authorized representative of this institution and agree to adhere to student data verification guidelines.
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-[var(--color-brand-blue)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 mt-2 shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Institution...</span>
              </>
            ) : (
              <span>Complete Institutional Registration</span>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[var(--color-text-secondary)]">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-[var(--color-brand-blue)] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
