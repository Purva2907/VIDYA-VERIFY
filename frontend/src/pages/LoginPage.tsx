import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  School,
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { AcademicIdentityCard3D } from '../components/3d/AcademicIdentityCard3D';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'node' | 'auditor' | 'public'>('node');
  const [email, setEmail] = useState('admin@institute.aicte.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickFill = (targetEmail: string, roleType: 'node' | 'auditor') => {
    setEmail(targetEmail);
    setPassword('AICTE#2026$ZK_VALID');
    setRole(roleType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    setAuthStatus('Verifying Ledger Signature...');

    setTimeout(() => {
      if (!email.includes('@')) {
        setErrorMessage('Invalid academic node identifier format.');
        setIsLoading(false);
        setAuthStatus(null);
        return;
      }

      setAuthStatus('Cryptographic Signature Approved');
      setTimeout(() => {
        setIsLoading(false);
        // Persist session demo
        localStorage.setItem(
          'vidya_user',
          JSON.stringify({
            email,
            role,
            nodeId: 'IND-DEL-04',
            token: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.demo_token',
          })
        );
        navigate('/dashboard');
      }, 700);
    }, 1100);
  };

  return (
    <div className="relative min-h-screen bg-[#050914] text-[#F8FAFC] flex flex-col justify-center items-center py-8 px-4 sm:px-6 overflow-hidden">
      {/* 3D Background Academic Identity Canvas */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-45 z-0 flex items-center justify-center">
        <AcademicIdentityCard3D
          className="w-full h-full max-w-5xl"
          interactiveControls={false}
          compact={false}
        />
      </div>

      {/* Ambient Spectral Glows */}
      <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-[#2391FF]/20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-28 -right-20 w-96 h-96 rounded-full bg-[#F70063]/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#2391FF]/10 blur-[140px] pointer-events-none" />

      {/* Micro-grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#dee2f3 1px, transparent 1px), linear-gradient(90deg, #dee2f3 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Navigation Ribbon */}
      <div className="relative z-10 w-full max-w-md mx-auto mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0b1326]/70 backdrop-blur-md text-slate-300 hover:text-[#2391FF] transition-all duration-300 border border-[#2391FF]/20 text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-[#2391FF]" />
          <span className="font-mono-code">Return to Landing Page</span>
        </Link>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0b1326]/80 backdrop-blur-md border border-[#2391FF]/20 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFF83F] animate-pulse" />
          <span className="font-mono-code text-slate-300 tracking-wider uppercase text-[10px]">
            Node: IND-DEL-04
          </span>
        </div>
      </div>

      {/* Central Frosted Glass Cybernetic Container */}
      <div className="relative z-10 w-full max-w-md mx-auto rounded-3xl bg-[#0b1326]/60 backdrop-blur-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-[0_0_40px_rgba(35,145,255,0.22)] border border-[#2391FF]/30">
        {/* Portal Header & Brand Emblem */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-[#2391FF]/30 blur-md" />
            <div className="relative w-14 h-14 rounded-2xl bg-[#050914]/90 p-1.5 flex items-center justify-center border border-[#2391FF]/40 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-[#2391FF] filter drop-shadow-[0_0_10px_rgba(35,145,255,0.6)]" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2391FF]/15 border border-[#2391FF]/30 text-[#2391FF] mb-2 shadow-[0_0_12px_rgba(35,145,255,0.2)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono-code tracking-wider uppercase font-semibold">
              APAAR CRYPTOGRAPHIC IDENTITY ENGINE ACTIVE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            VIDYA-VERIFY
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Secure Academic Verification Portal
          </p>
        </div>

        {/* Role Selection Segmented Control */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono-code text-slate-400 flex items-center justify-between px-1">
            <span>AUTHORIZATION CONTEXT</span>
            <span className="text-[#2391FF] text-[10px]">ECDSA-SEC256K1</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#050914]/90 backdrop-blur-md border border-[#2391FF]/20">
            <button
              type="button"
              onClick={() => setRole('node')}
              className={`py-2 px-1 rounded-lg text-center transition-all duration-200 text-xs font-semibold ${
                role === 'node'
                  ? 'bg-[#2391FF]/25 text-[#2391FF] border border-[#2391FF]/40 shadow-[0_0_12px_rgba(35,145,255,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              Node
            </button>
            <button
              type="button"
              onClick={() => setRole('auditor')}
              className={`py-2 px-1 rounded-lg text-center transition-all duration-200 text-xs font-semibold ${
                role === 'auditor'
                  ? 'bg-[#2391FF]/25 text-[#2391FF] border border-[#2391FF]/40 shadow-[0_0_12px_rgba(35,145,255,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              Auditor
            </button>
            <button
              type="button"
              onClick={() => setRole('public')}
              className={`py-2 px-1 rounded-lg text-center transition-all duration-200 text-xs font-semibold ${
                role === 'public'
                  ? 'bg-[#2391FF]/25 text-[#2391FF] border border-[#2391FF]/40 shadow-[0_0_12px_rgba(35,145,255,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              Public
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#F70063]/15 border border-[#F70063]/40 text-xs text-[#FF4D8D] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Credential Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Field 1: Institution / APAAR Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono-code text-slate-300 flex items-center gap-1.5" htmlFor="email-input">
              <School className="w-3.5 h-3.5 text-[#2391FF]" />
              <span>INSTITUTION / APAAR ID EMAIL</span>
            </label>
            <div className="relative flex items-center rounded-xl bg-[#050914]/75 border border-[#404753]/50 transition-all focus-within:border-[#2391FF] focus-within:bg-[#050914] focus-within:shadow-[0_0_15px_rgba(35,145,255,0.25)]">
              <Mail className="w-4 h-4 text-slate-500 ml-3.5 mr-2 shrink-0 pointer-events-none" />
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@institute.aicte.gov.in"
                className="w-full py-3 pr-4 bg-transparent text-white placeholder:text-slate-600 font-mono-code text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Field 2: Security Access Key / Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono-code text-slate-300 flex items-center gap-1.5" htmlFor="password-input">
                <KeyRound className="w-3.5 h-3.5 text-[#2391FF]" />
                <span>HARDWARE / SECURITY KEY</span>
              </label>
              <a href="#" className="text-[11px] font-mono-code text-[#2391FF] hover:text-[#a5c8ff] transition-colors">
                Forgot Key?
              </a>
            </div>
            <div className="relative flex items-center rounded-xl bg-[#050914]/75 border border-[#404753]/50 transition-all focus-within:border-[#2391FF] focus-within:bg-[#050914] focus-within:shadow-[0_0_15px_rgba(35,145,255,0.25)]">
              <Lock className="w-4 h-4 text-slate-500 ml-3.5 mr-2 shrink-0 pointer-events-none" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full py-3 pr-11 bg-transparent text-white placeholder:text-slate-600 font-mono-code text-xs focus:outline-none tracking-wider"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Institutional Options Row */}
          <div className="flex items-center justify-between py-0.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-[#101B32] checked:bg-[#2391FF] text-[#2391FF] focus:ring-0 cursor-pointer accent-[#2391FF]"
              />
              <span className="text-slate-300">Remember node identity</span>
            </label>
            <span className="font-mono-code text-[#FFCD54] flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFF83F] animate-pulse" />
              2FA Active
            </span>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`relative mt-2 w-full py-3.5 px-5 rounded-xl font-mono-code text-xs font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99] border border-[#a5c8ff]/30 ${
              authStatus?.includes('Approved')
                ? 'bg-[#FFF83F] text-[#050914] shadow-[0_0_24px_rgba(255,248,63,0.5)]'
                : 'bg-[#2391FF] hover:bg-[#1a80e5] shadow-[0_0_24px_rgba(35,145,255,0.45)] hover:shadow-[0_0_32px_rgba(35,145,255,0.7)]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? authStatus : 'Sign In Securely'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Fill Telemetry Sandbox */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-px bg-white/10 flex-1" />
            <span className="font-mono-code text-slate-500 uppercase tracking-widest text-[10px]">
              Evaluation Profiles
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@aicte.gov.in', 'auditor')}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#111b33]/80 hover:bg-[#1b2744] text-slate-300 hover:text-white text-center transition-colors border border-[#2391FF]/20 text-xs font-mono-code"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFF83F]" />
              <span className="truncate">AICTE Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('verifier@iitd.ac.in', 'node')}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#111b33]/80 hover:bg-[#1b2744] text-slate-300 hover:text-white text-center transition-colors border border-[#2391FF]/20 text-xs font-mono-code"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2391FF]" />
              <span className="truncate">Institute Verifier</span>
            </button>
          </div>
        </div>

        {/* Link to Register */}
        <div className="text-center pt-1 text-xs text-slate-400">
          <span>Need institutional node registration? </span>
          <Link to="/register" className="text-[#2391FF] hover:underline font-semibold">
            Register Node
          </Link>
        </div>

        {/* Security & ZK Encryption Compliance Badge */}
        <div className="rounded-xl bg-[#050914]/85 p-3 flex flex-col gap-1.5 border border-[#2391FF]/20 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFF83F] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFF83F]" />
              </span>
              <span className="font-mono-code text-white font-medium text-[11px]">
                Protected Access Level 4
              </span>
            </div>
            <span className="font-mono-code text-[#FFCD54] text-[10px]">
              RFC-7519 COMPLIANT
            </span>
          </div>
          <p className="text-slate-400 text-[10px] leading-tight">
            Role-based sovereign authorization. Credentials cross-reconciled against National APAAR Registry via 256-bit Zero-Knowledge verification.
          </p>
        </div>

        {/* Audit Telemetry Notice */}
        <div className="flex items-center justify-center gap-1.5 text-center px-2">
          <p className="font-mono-code text-slate-500 text-[9px] uppercase tracking-wide">
            Authorised Personnel Only · Telemetry Cryptographically Logged
          </p>
        </div>
      </div>
    </div>
  );
};
