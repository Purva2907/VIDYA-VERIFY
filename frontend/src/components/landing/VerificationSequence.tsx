import React, { useEffect, useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  SearchCode,
  Database,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const VerificationSequence: React.FC = () => {
  const { ref, isRevealed } = useScrollReveal({ threshold: 0.15 });
  const [activeStep, setActiveStep] = useState<number>(0);
  const [illuminatedStep, setIlluminatedStep] = useState<number>(-1);

  const steps = [
    {
      step: '01',
      title: 'Institution Ingestion',
      subtitle: 'Enrolment Manifest Upload',
      description:
        'AICTE-affiliated institutions submit student enrolment manifests via CSV batch upload or individual record addition.',
      icon: <UploadCloud className="w-5 h-5 text-[#2391FF]" />,
      badge: 'INGESTION',
      code: 'POST /api/imports/batch',
      accentColor: '#2391FF',
    },
    {
      step: '02',
      title: 'APAAR Structure Validation',
      subtitle: 'Format & Character Checks',
      description:
        'The ingestion gateway validates 12-digit APAAR alphanumeric identifiers and verifies format validity.',
      icon: <CheckCircle2 className="w-5 h-5 text-[#FFF83F]" />,
      badge: 'VERIFICATION',
      code: 'VALIDATE { apaar_id: "9024-8172-5501-IN" }',
      accentColor: '#FFF83F',
    },
    {
      step: '03',
      title: 'Integrity Cross-Check',
      subtitle: 'Duplicate & Seat Quota Evaluation',
      description:
        'The engine checks for multi-institution concurrent enrolments and verifies student counts against sanctioned intake limits.',
      icon: <SearchCode className="w-5 h-5 text-[#F70063]" />,
      badge: 'CROSS-CHECK',
      code: 'INTEGRITY_CHECK: EVALUATE_COLLISION()',
      accentColor: '#F70063',
    },
    {
      step: '04',
      title: 'Ledger Recording',
      subtitle: 'Merkle Digest Generation',
      description:
        'Records are added to the active regulatory ledger, calculating deterministic Merkle batch hashes for verifiable auditing.',
      icon: <Database className="w-5 h-5 text-[#2391FF]" />,
      badge: 'RECORDED',
      code: 'MERKLE_ROOT: 0x99238E...DB30',
      accentColor: '#2391FF',
    },
    {
      step: '05',
      title: 'Authorized Verification',
      subtitle: 'Query & Verification Portal',
      description:
        'Authorized auditors and institutions verify credentials on demand using the verification sandbox portal.',
      icon: <ShieldCheck className="w-5 h-5 text-[#FFCD54]" />,
      badge: 'VERIFIED RESULT',
      code: 'GET /api/verify/apaar?apaar_id=...',
      accentColor: '#FFCD54',
    },
  ];

  // Brief sequential illumination wave when the section enters the viewport
  useEffect(() => {
    if (!isRevealed) return;

    const timers: NodeJS.Timeout[] = [];
    steps.forEach((_, idx) => {
      const t = setTimeout(() => {
        setIlluminatedStep(idx);
      }, 400 + idx * 350);
      timers.push(t);
    });

    const resetTimer = setTimeout(() => {
      setIlluminatedStep(-1);
    }, 400 + steps.length * 350 + 600);
    timers.push(resetTimer);

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isRevealed]);

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="py-24 relative bg-transparent transition-colors overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[550px] h-[350px] bg-[#2391FF]/6 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading with Staggered Entrance */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div
            className="reveal-transition inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/30 text-[var(--color-brand-blue)] text-xs font-semibold mb-3 backdrop-blur-md"
            style={{
              opacity: isRevealed ? 1 : 0,
              transform: isRevealed ? 'translateY(0)' : 'translateY(16px)',
              transitionDelay: '0ms',
            }}
          >
            <Sparkles className="w-3 h-3 text-[#2391FF]" />
            <span className="tracking-wide">HOW IT WORKS</span>
          </div>

          <h2
            className="reveal-transition text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]"
            style={{
              opacity: isRevealed ? 1 : 0,
              transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: '100ms',
            }}
          >
            5-Stage Verification Protocol
          </h2>

          <p
            className="reveal-transition mt-3 text-sm sm:text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto"
            style={{
              opacity: isRevealed ? 1 : 0,
              transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: '200ms',
            }}
          >
            From institutional bulk submission to instant cryptographic verification.
          </p>
        </div>

        {/* Timeline Container with Animated Connecting Line */}
        <div className="relative">
          {/* Horizontal Connecting Line on Wide Screens (behind cards) */}
          <div className="hidden md:block absolute top-[52px] left-[6%] right-[6%] h-[2px] z-0 overflow-hidden pointer-events-none">
            {/* Base line */}
            <div className="w-full h-full bg-white/[0.08]" />
            {/* Animated glowing pulse line */}
            <div
              className="absolute inset-0 h-full animate-connector-gradient"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, #2391FF 30%, #FFF83F 50%, #F70063 70%, transparent 100%)',
                opacity: isRevealed ? 0.75 : 0,
                transition: 'opacity 1s ease',
              }}
            />
          </div>

          {/* Vertical Connecting Line on Narrow/Mobile Screens */}
          <div className="md:hidden absolute top-8 bottom-8 left-8 w-[2px] bg-gradient-to-b from-[#2391FF]/40 via-[#F70063]/40 to-[#FFCD54]/40 z-0 pointer-events-none" />

          {/* 5 Stage Glass Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
            {steps.map((st, idx) => {
              const isIlluminated = illuminatedStep === idx;
              const isSelected = activeStep === idx;

              return (
                <div
                  key={st.step}
                  onClick={() => setActiveStep(idx)}
                  className={`reveal-transition group relative rounded-2xl p-5 cursor-pointer glass-panel-translucent transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#2391FF] shadow-[0_0_25px_rgba(35,145,255,0.25)] -translate-y-1'
                      : isIlluminated
                      ? 'border-[#FFF83F]/80 shadow-[0_0_25px_rgba(255,248,63,0.3)] -translate-y-1'
                      : 'hover:border-[#2391FF]/50 hover:-translate-y-1'
                  }`}
                  style={{
                    opacity: isRevealed ? 1 : 0,
                    transform: isRevealed
                      ? 'perspective(1000px) rotateX(0deg) translateY(0)'
                      : 'perspective(1000px) rotateX(6deg) translateY(32px)',
                    transitionDelay: `${250 + idx * 90}ms`,
                  }}
                >
                  <div>
                    {/* Header: Step Number + Outline Icon */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`font-mono-code font-bold text-xs tracking-wider transition-colors ${
                          isSelected || isIlluminated ? 'text-[#2391FF]' : 'text-[var(--color-text-muted)]'
                        }`}
                      >
                        {st.step}
                      </span>

                      <div
                        className="p-2 rounded-xl bg-black/40 border border-white/[0.08] transition-all duration-300 group-hover:scale-105"
                        style={{
                          boxShadow:
                            isSelected || isIlluminated
                              ? `0 0 16px ${st.accentColor}40`
                              : `0 0 8px ${st.accentColor}10`,
                          borderColor: isSelected || isIlluminated ? st.accentColor : undefined,
                        }}
                      >
                        {st.icon}
                      </div>
                    </div>

                    {/* Stage Title */}
                    <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-brand-blue)] transition-colors">
                      {st.title}
                    </h3>

                    {/* Subtitle */}
                    <div
                      className="text-[11px] font-medium mb-2.5 transition-colors"
                      style={{ color: st.accentColor }}
                    >
                      {st.subtitle}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                      {st.description}
                    </p>
                  </div>

                  {/* Code snippet / Endpoint bar */}
                  <div className="pt-3 border-t border-white/[0.06]">
                    <span className="text-[10px] font-mono-code text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] truncate block transition-colors">
                      {st.code}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
