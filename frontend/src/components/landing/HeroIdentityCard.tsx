import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Cpu,
  Layers,
  GraduationCap,
  Building2,
  Lock,
  Sparkles,
} from 'lucide-react';

interface HeroIdentityCardProps {
  className?: string;
}

export const HeroIdentityCard: React.FC<HeroIdentityCardProps> = ({ className = '' }) => {
  // Sequential verification indicators state
  // 0: Initial/Scanning, 1: Identity, 2: Institution, 3: Enrolment, 4: Integrity
  const [activeStep, setActiveStep] = useState<number>(1);
  const [scanCompleted, setScanCompleted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Check reduced motion
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setActiveStep(4);
      setScanCompleted(true);
      return;
    }

    // Cinematic step progression cycle (repeats every 8 seconds)
    const cycle = () => {
      setScanCompleted(false);
      setActiveStep(1);

      const t1 = setTimeout(() => setActiveStep(2), 1200);
      const t2 = setTimeout(() => setActiveStep(3), 2400);
      const t3 = setTimeout(() => {
        setActiveStep(4);
        setScanCompleted(true);
      }, 3600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    };

    const cleanupFirst = cycle();
    const interval = setInterval(cycle, 8000);

    return () => {
      cleanupFirst();
      clearInterval(interval);
    };
  }, []);

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText('9024-8172-5501');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative select-none ${className}`}>
      {/* Floating Decorative Interface Badges Around Card */}
      <div className="hidden sm:flex items-center gap-2 absolute -top-5 -left-3 z-20 px-3 py-1.5 rounded-full bg-[#070e1a]/80 backdrop-blur-xl border border-[#2391FF]/30 shadow-lg animate-float-gently">
        <span className="w-2 h-2 rounded-full bg-[#2391FF] animate-ping" />
        <span className="text-[10px] font-mono-code font-bold text-[#2391FF] tracking-wider uppercase">
          AICTE REGISTRY · SYNCHRONIZED
        </span>
      </div>

      <div
        className="hidden md:flex items-center gap-2 absolute -bottom-4 -right-2 z-20 px-3 py-1.5 rounded-full bg-[#08121f]/85 backdrop-blur-xl border border-[#FFCD54]/30 shadow-lg"
        style={{ animation: 'floatGently 7s ease-in-out infinite 1s' }}
      >
        <span className="w-2 h-2 rounded-full bg-[#FFCD54]" />
        <span className="text-[10px] font-mono-code font-bold text-[#FFCD54] tracking-wider uppercase">
          SANCTIONED SEATS · 120/120 OK
        </span>
      </div>

      <div
        className="hidden lg:flex items-center gap-2 absolute top-1/2 -right-6 -translate-y-1/2 z-20 px-2.5 py-1.5 rounded-xl bg-[#090e18]/80 backdrop-blur-xl border border-[#2391FF]/25 shadow-lg"
        style={{ animation: 'floatGently 8s ease-in-out infinite 2s' }}
      >
        <Lock className="w-3.5 h-3.5 text-[#2391FF]" />
        <span className="text-[9px] font-mono-code text-[var(--color-text-secondary)]">
          MERKLE: 0x99238E...DB30
        </span>
      </div>

      {/* Main Glass Academic Identity Card */}
      <div
        className={`relative w-full max-w-lg mx-auto rounded-3xl glass-panel-hero overflow-hidden transition-all duration-500 ${
          scanCompleted ? 'animate-edge-glow border-[#2391FF]/50' : 'border-[#2391FF]/25'
        }`}
        style={{
          boxShadow: scanCompleted
            ? '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(35, 145, 255, 0.25)'
            : '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Animated Scanning Laser Line */}
        <div
          className="absolute left-0 right-0 h-[2px] z-30 pointer-events-none animate-scan-sweep"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, #2391FF 20%, #FFF83F 50%, #2391FF 80%, transparent 100%)',
            boxShadow: '0 0 16px 2px rgba(35, 145, 255, 0.8), 0 0 4px 1px rgba(255, 248, 63, 0.9)',
          }}
        />

        {/* Card Header Bar */}
        <div className="px-5 py-4 border-b border-[#2391FF]/15 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2391FF]/15 border border-[#2391FF]/30 text-[#2391FF] text-[10px] font-mono-code font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2391FF] animate-pulse" />
              ACADEMIC IDENTITY • SANDBOX
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-[var(--color-border-subtle)] text-[10px] font-mono-code text-[var(--color-text-muted)]">
              <Sparkles className="w-3 h-3 text-[#FFCD54]" />
              <span>SHA-256</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#2391FF]/40" />
          </div>
        </div>

        {/* Card Body: Fictional Student Profile */}
        <div className="p-5 space-y-4">
          {/* Identity Info Row */}
          <div className="flex items-start gap-4">
            {/* Student Avatar Hologram Placeholder */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#0c2244]/80 to-[#071326]/80 border border-[#2391FF]/35 flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-[#2391FF]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2391FF]/15 to-transparent pointer-events-none" />
              <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#FFF83F] border border-black shadow-sm" />
            </div>

            {/* Candidate & Masked APAAR Identifier */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono-code font-semibold tracking-wider text-[var(--color-brand-blue)] uppercase">
                  Candidate Profile
                </span>
                <span className="text-[10px] font-mono-code text-[#FFCD54] px-1.5 py-0.5 rounded bg-[#FFCD54]/10 border border-[#FFCD54]/25">
                  SAMPLE DATA
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] tracking-tight truncate mt-0.5">
                Aarav V. Suryavanshi
              </h4>

              {/* Masked Sovereign APAAR Identifier with Copy */}
              <div className="mt-1 flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/40 border border-[#2391FF]/25 text-xs font-mono-code text-[var(--color-text-primary)]">
                  <span className="text-[var(--color-text-muted)] text-[10px]">APAAR:</span>
                  <span className="tracking-wider">9024-••••-••••-5501</span>
                </div>
                <button
                  type="button"
                  onClick={copyId}
                  title="Copy sample identifier"
                  className="p-1 rounded hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2391FF]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Academic Affiliation Details */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              <Building2 className="w-3.5 h-3.5 text-[#2391FF] flex-shrink-0" />
              <span className="font-semibold text-[var(--color-text-primary)] truncate">
                Delhi Institute of Technology
              </span>
              <span className="text-[10px] font-mono-code text-[#2391FF] flex-shrink-0">
                [IND-AICTE-1042]
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono-code pt-1 border-t border-white/[0.04]">
              <span className="truncate">B.Tech Computer Science &amp; AI</span>
              <span className="text-[var(--color-text-secondary)] flex-shrink-0 ml-2">
                Session 2024-25
              </span>
            </div>
          </div>

          {/* Sequential Verification Status Indicators */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
                Verification Protocol Sequence
              </span>
              <span className="text-[10px] font-mono-code text-[#2391FF]">
                {scanCompleted ? 'ALL CHECKS PASSED' : `STAGE 0${activeStep}/04`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Check 1: Identity Structure */}
              <div
                className={`p-2.5 rounded-xl border transition-all duration-300 ${
                  activeStep >= 1
                    ? 'bg-[#2391FF]/10 border-[#2391FF]/40 text-[#2391FF]'
                    : 'bg-white/[0.02] border-white/[0.05] text-[var(--color-text-muted)] opacity-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      activeStep >= 1 ? 'text-[#2391FF]' : 'text-[var(--color-text-muted)]'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-[var(--color-text-primary)]">
                    Identity Structure
                  </span>
                </div>
                <div className="text-[10px] font-mono-code text-[var(--color-text-secondary)]">
                  {activeStep >= 1 ? '12-Digit Format Valid' : 'Awaiting Check...'}
                </div>
              </div>

              {/* Check 2: Institution Match */}
              <div
                className={`p-2.5 rounded-xl border transition-all duration-300 ${
                  activeStep >= 2
                    ? 'bg-[#2391FF]/10 border-[#2391FF]/40 text-[#2391FF]'
                    : 'bg-white/[0.02] border-white/[0.05] text-[var(--color-text-muted)] opacity-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2
                    className={`w-3.5 h-3.5 ${
                      activeStep >= 2 ? 'text-[#2391FF]' : 'text-[var(--color-text-muted)]'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-[var(--color-text-primary)]">
                    Institution Match
                  </span>
                </div>
                <div className="text-[10px] font-mono-code text-[var(--color-text-secondary)]">
                  {activeStep >= 2 ? 'AICTE Affiliated · #1042' : 'Verifying...'}
                </div>
              </div>

              {/* Check 3: Enrolment Status */}
              <div
                className={`p-2.5 rounded-xl border transition-all duration-300 ${
                  activeStep >= 3
                    ? 'bg-[#FFCD54]/10 border-[#FFCD54]/40 text-[#FFCD54]'
                    : 'bg-white/[0.02] border-white/[0.05] text-[var(--color-text-muted)] opacity-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Layers
                    className={`w-3.5 h-3.5 ${
                      activeStep >= 3 ? 'text-[#FFCD54]' : 'text-[var(--color-text-muted)]'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-[var(--color-text-primary)]">
                    Enrolment Status
                  </span>
                </div>
                <div className="text-[10px] font-mono-code text-[var(--color-text-secondary)]">
                  {activeStep >= 3 ? 'Single Active Record' : 'Queued...'}
                </div>
              </div>

              {/* Check 4: Integrity Check */}
              <div
                className={`p-2.5 rounded-xl border transition-all duration-300 ${
                  activeStep >= 4
                    ? 'bg-[#F70063]/10 border-[#F70063]/40 text-[#F70063]'
                    : 'bg-white/[0.02] border-white/[0.05] text-[var(--color-text-muted)] opacity-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck
                    className={`w-3.5 h-3.5 ${
                      activeStep >= 4 ? 'text-[#F70063]' : 'text-[var(--color-text-muted)]'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-[var(--color-text-primary)]">
                    Integrity Check
                  </span>
                </div>
                <div className="text-[10px] font-mono-code text-[var(--color-text-secondary)]">
                  {activeStep >= 4 ? 'Zero Dual-Enrolments' : 'Pending...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Ledger Hash Bar */}
        <div className="px-5 py-3 bg-black/45 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono-code text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5 truncate">
            <Cpu className="w-3 h-3 text-[#2391FF]" />
            <span className="truncate">RECEIPT: 0x8F72B4...C09A11</span>
          </div>
          <span className="flex-shrink-0 text-[#FFF83F] font-bold">
            {scanCompleted ? 'AUTHENTIC' : 'SCANNING'}
          </span>
        </div>
      </div>
    </div>
  );
};
