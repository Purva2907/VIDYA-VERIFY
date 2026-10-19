import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  UserCheck,
  Fingerprint,
} from 'lucide-react';
import { AcademicIdentityCard3D } from '../components/3d/AcademicIdentityCard3D';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [aicteId, setAicteId] = useState('1-9482103');
  const [instituteName, setInstituteName] = useState('Delhi Institute of Technology & Science');
  const [nodalOfficer, setNodalOfficer] = useState('Dr. Rajesh Verma');
  const [email, setEmail] = useState('registrar@dits.ac.in');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('Northern Region (Delhi)');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Password and confirmation key do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Security key must contain at least 8 characters.');
      return;
    }

    if (!acceptedTerms) {
      setError('Please acknowledge the AICTE APAAR data integrity compliance terms.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-[#050914] text-[#F8FAFC] flex flex-col justify-center items-center py-10 px-4 sm:px-6 overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-35 z-0 flex items-center justify-center">
        <AcademicIdentityCard3D className="w-full h-full max-w-5xl" interactiveControls={false} />
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto mb-4 flex items-center justify-between">
        <Link
          to="/login"
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0b1326]/70 backdrop-blur-md text-slate-300 hover:text-[#2391FF] transition-all text-xs border border-[#2391FF]/20"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-[#2391FF]" />
          <span className="font-mono-code">Back to Sign In</span>
        </Link>
        <span className="text-[10px] font-mono-code text-[#FFF83F] px-2.5 py-1 rounded-full bg-[#FFF83F]/10 border border-[#FFF83F]/20">
          INSTITUTION NODE ONBOARDING
        </span>
      </div>

      {/* Registration Card */}
      <div className="relative z-10 w-full max-w-xl mx-auto rounded-3xl bg-[#0b1326]/75 backdrop-blur-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-[0_0_50px_rgba(35,145,255,0.2)] border border-[#2391FF]/30">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2391FF]/15 border border-[#2391FF]/30 text-[#2391FF] mb-2 text-xs font-mono-code">
            <Building2 className="w-3.5 h-3.5" />
            <span>AICTE APPROVED INSTITUTION NODE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Register Academic Node
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect your campus registry to the National APAAR Integrity Engine
          </p>
        </div>

        {/* Security Policy Reminder: AICTE Regulator accounts cannot be self-provisioned */}
        <div className="p-3 rounded-2xl bg-[#FFCD54]/10 border border-[#FFCD54]/30 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#FFCD54] shrink-0 mt-0.5" />
          <div className="text-slate-300 text-[11px] leading-relaxed">
            <strong className="text-[#FFCD54]">Regulatory Role Notice:</strong> AICTE Regulation Bureau auditor credentials are issued exclusively via internal AICTE executive keys. Institutions may only provision verified Node verifier accounts.
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#F70063]/15 border border-[#F70063]/40 text-xs text-[#FF4D8D]">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-[#FFF83F]/15 border border-[#FFF83F]/40 text-xs text-[#FFF83F] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Institution Node registered successfully! Redirecting to Sign In...</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4 text-xs font-mono-code">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-slate-300">AICTE PERMANENT ID</label>
              <input
                type="text"
                required
                value={aicteId}
                onChange={(e) => setAicteId(e.target.value)}
                placeholder="1-9482103"
                className="py-2.5 px-3 rounded-xl bg-[#050914]/80 border border-white/10 text-white focus:outline-none focus:border-[#2391FF]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">AICTE REGION</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="py-2.5 px-3 rounded-xl bg-[#050914]/80 border border-white/10 text-white focus:outline-none focus:border-[#2391FF]"
              >
                <option>Northern Region (Delhi / Haryana / Punjab)</option>
                <option>Western Region (Maharashtra / Goa)</option>
                <option>Southern Region (Karnataka / Kerala)</option>
                <option>Eastern Region (West Bengal / Odisha)</option>
                <option>Central Region (Madhya Pradesh / Chhattisgarh)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-300">OFFICIAL INSTITUTION NAME</label>
            <input
              type="text"
              required
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
              placeholder="e.g. Delhi Institute of Technology"
              className="py-2.5 px-3 rounded-xl bg-[#050914]/80 border border-white/10 text-white focus:outline-none focus:border-[#2391FF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-slate-300">NODAL OFFICER NAME</label>
              <input
                type="text"
                required
                value={nodalOfficer}
                onChange={(e) => setNodalOfficer(e.target.value)}
                placeholder="Dr. Full Name"
                className="py-2.5 px-3 rounded-xl bg-[#050914]/80 border border-white/10 text-white focus:outline-none focus:border-[#2391FF]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">OFFICIAL INSTITUTIONAL EMAIL</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="registrar@institute.ac.in"
                className="py-2.5 px-3 rounded-xl bg-[#050914]/80 border border-white/10 text-white focus:outline-none focus:border-[#2391FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-slate-300">SECURITY ACCESS KEY</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="py-2.5 px-3 rounded-xl bg-[#050914]/80 border border-white/10 text-white focus:outline-none focus:border-[#2391FF]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">CONFIRM SECURITY KEY</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                className="py-2.5 px-3 rounded-xl bg-[#050914]/80 border border-white/10 text-white focus:outline-none focus:border-[#2391FF]"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 pt-1 text-slate-400 cursor-pointer text-[11px] font-sans">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded bg-[#101B32] checked:bg-[#2391FF] text-[#2391FF] focus:ring-0 accent-[#2391FF]"
            />
            <span>
              I certify that I am the authorized registrar / nodal officer for this AICTE institution, and agree to enforce APAAR data integrity protocols without duplicate seat inflation.
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-mono-code text-xs font-bold text-white bg-[#2391FF] hover:bg-[#1a80e5] shadow-[0_0_25px_rgba(35,145,255,0.45)] transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? 'Registering Cryptographic Node...' : 'Register Institution Node'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-[#2391FF] hover:underline font-semibold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
