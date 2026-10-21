import React from 'react';
import { ShieldCheck, Lock, KeyRound, History, FileCheck, Ban } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const SecuritySection: React.FC = () => {
  const { ref, isRevealed } = useScrollReveal({ threshold: 0.15 });

  const securityPillars = [
    {
      title: 'Role-Based Access Control (RBAC)',
      description:
        'Granular partition between Institution Verifiers and AICTE Central Regulatory Administrators. Self-assignment of administrative regulator status is strictly prevented.',
      icon: <KeyRound className="w-5 h-5 text-[#2391FF]" />,
      accentColor: '#2391FF',
      status: 'ENFORCED',
    },
    {
      title: 'Merkle Tree Audit Verification',
      description:
        'Deterministic hash tree generation for batches of records, enabling verifiable and tamper-evident audit trails.',
      icon: <History className="w-5 h-5 text-[#FFF83F]" />,
      accentColor: '#FFF83F',
      status: 'CRYPTOGRAPHIC',
    },
    {
      title: 'Privacy-Preserving Identifier Masking',
      description:
        'APAAR identifiers are masked by default across dashboard views, revealing sensitive details only on demand by authenticated personnel.',
      icon: <Lock className="w-5 h-5 text-[#2391FF]" />,
      accentColor: '#2391FF',
      status: 'CONFIDENTIAL',
    },
    {
      title: 'Session & Intake Validation',
      description:
        'Student enrolment session records are validated against sanctioned intake quotas, preventing retroactive seat inflation.',
      icon: <FileCheck className="w-5 h-5 text-[#2391FF]" />,
      accentColor: '#2391FF',
      status: 'VERIFIED',
    },
    {
      title: 'Immediate Collision Invalidation',
      description:
        'Should an admission conflict or duplicate enrolment be flagged, verification records reflect the conflict immediately.',
      icon: <Ban className="w-5 h-5 text-[#F70063]" />,
      accentColor: '#F70063',
      status: 'SHIELDED',
    },
    {
      title: 'Cryptographic Verification Receipts',
      description:
        'Each verified record generates a unique cryptographic digest receipt for reference by institutions and regulatory auditors.',
      icon: <ShieldCheck className="w-5 h-5 text-[#FFCD54]" />,
      accentColor: '#FFCD54',
      status: 'AUTHENTICATED',
    },
  ];

  return (
    <section
      id="security"
      ref={ref}
      className="py-24 relative bg-transparent transition-colors overflow-hidden"
    >
      {/* Background Soft Depth Glows */}
      <div className="absolute top-1/3 left-10 w-[450px] h-[450px] bg-[#2391FF]/5 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-[#FFF83F]/4 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Governance */}
          <div className="lg:col-span-5">
            {/* Eyebrow Badge */}
            <div
              className="reveal-transition inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/30 text-[var(--color-brand-blue)] text-xs font-semibold mb-3 backdrop-blur-md"
              style={{
                opacity: isRevealed ? 1 : 0,
                transform: isRevealed ? 'translateY(0)' : 'translateY(16px)',
                transitionDelay: '0ms',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GOVERNANCE &amp; SECURITY</span>
            </div>

            {/* Main Heading */}
            <h2
              className="reveal-transition text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.15]"
              style={{
                opacity: isRevealed ? 1 : 0,
                transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: '120ms',
              }}
            >
              Rigorous Security &amp; Institutional Governance
            </h2>

            {/* Description */}
            <p
              className="reveal-transition mt-3 text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed"
              style={{
                opacity: isRevealed ? 1 : 0,
                transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: '220ms',
              }}
            >
              VIDYA-VERIFY enforces strict verification bounds designed explicitly for AICTE Problem Statement 26263, ensuring complete institutional accountability.
            </p>

            {/* Glass Compliance Callout Panel */}
            <div
              className="reveal-transition mt-8 p-5 rounded-2xl glass-panel-translucent border-[#2391FF]/30 relative overflow-hidden"
              style={{
                opacity: isRevealed ? 1 : 0,
                transform: isRevealed ? 'translateY(0)' : 'translateY(24px)',
                transitionDelay: '320ms',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono-code font-bold text-[var(--color-brand-blue)] tracking-wider">
                  AICTE PROBLEM STATEMENT 26263 COMPLIANT
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono-code text-[#2391FF] px-2 py-0.5 rounded-full bg-[#2391FF]/10 border border-[#2391FF]/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2391FF] animate-pulse" />
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Ensures single-institution enrolment integrity, approved intake monitoring, and format validation for all technical students.
              </p>
            </div>
          </div>

          {/* Right Column: 6 Pillars Glass Composition */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {securityPillars.map((pillar, idx) => (
              <div
                key={idx}
                className="reveal-transition group relative rounded-2xl p-5 glass-panel-translucent hover:border-[#2391FF]/50 hover:shadow-[0_8px_30px_rgba(35,145,255,0.12)] hover:-translate-y-1 transition-all duration-300"
                style={{
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed
                    ? 'perspective(1000px) rotateX(0deg) translateY(0)'
                    : 'perspective(1000px) rotateX(5deg) translateY(28px)',
                  transitionDelay: `${300 + idx * 80}ms`,
                }}
              >
                {/* Header: Icon + Tiny Status Indicator */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-center group-hover:scale-105 transition-transform"
                    style={{
                      boxShadow: `0 0 14px ${pillar.accentColor}18`,
                    }}
                  >
                    {pillar.icon}
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[9px] font-mono-code text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: pillar.accentColor }}
                    />
                    <span>{pillar.status}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1.5 group-hover:text-[var(--color-brand-blue)] transition-colors">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
