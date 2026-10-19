import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { AcademicIdentityCard3D } from '../components/3d/AcademicIdentityCard3D';
import { ThemeToggle } from '../components/navigation/ThemeToggle';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleQuickFill = (targetEmail: string, targetPass: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid institutional email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] flex flex-col justify-center items-center py-10 px-4 sm:px-6 transition-colors overflow-hidden">
      {/* Background 3D Academic Identity Canvas (Subtle & Restrained) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0 flex items-center justify-center">
        <AcademicIdentityCard3D
          className="w-full h-full max-w-4xl"
          interactiveControls={false}
          compact={false}
        />
      </div>

      {/* Top Bar Navigation */}
      <div className="relative z-10 w-full max-w-md mx-auto mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-brand-blue)] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto app-card p-6 sm:p-8 bg-[var(--color-surface-card)] shadow-2xl">
        {/* Emblem & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/30 text-[var(--color-brand-blue)] mb-3 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Welcome to VIDYA-VERIFY
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            Sign in to manage and verify student records securely.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/30 text-xs text-[var(--color-brand-pink)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@institute.edu or admin@aicte.gov.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-blue)] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-blue)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[var(--color-border-subtle)] text-[var(--color-brand-blue)] focus:ring-[var(--color-brand-blue)]"
              />
              <span>Remember me</span>
            </label>

            <span className="text-[11px] text-[var(--color-text-muted)]">
              Managed via institutional SSO
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-[var(--color-brand-blue)] hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-fill profiles for evaluation */}
        <div className="mt-6 pt-5 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2.5">
            <Info className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
            <span>Sample Demo Credentials:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-left">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@aicte.gov.in', 'AdminPass@2026')}
              className="p-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-brand-blue)] text-[11px] transition-colors"
            >
              <div className="font-semibold text-[var(--color-text-primary)]">AICTE Admin</div>
              <div className="text-[10px] text-[var(--color-text-muted)] truncate">admin@aicte.gov.in</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('verifier@institute.edu', 'VerifyPass@2026')}
              className="p-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-brand-blue)] text-[11px] transition-colors"
            >
              <div className="font-semibold text-[var(--color-text-primary)]">Institute Verifier</div>
              <div className="text-[10px] text-[var(--color-text-muted)] truncate">verifier@institute.edu</div>
            </button>
          </div>
        </div>

        {/* Institutional Registration Link */}
        <div className="mt-5 text-center text-xs text-[var(--color-text-secondary)]">
          Need new institutional access?{' '}
          <Link
            to="/register"
            className="font-semibold text-[var(--color-brand-blue)] hover:underline"
          >
            Register Institution
          </Link>
        </div>
      </div>
    </div>
  );
};
