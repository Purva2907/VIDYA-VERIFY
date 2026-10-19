import React from 'react';
import { ShieldCheck, Lock, KeyRound, History, FileCheck, Ban } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  const securityPillars = [
    {
      title: 'Role-Based Access Control (RBAC)',
      description:
        'Granular partition between Institution Verifiers and AICTE Central Regulatory Administrators. Self-assignment of administrative regulator status is strictly prevented.',
      icon: <KeyRound className="w-5 h-5 text-[#2391FF]" />,
    },
    {
      title: 'Merkle Tree Audit Verification',
      description:
        'Deterministic hash tree generation for batches of records, enabling verifiable and tamper-evident audit trails.',
      icon: <History className="w-5 h-5 text-[#FFF83F]" />,
    },
    {
      title: 'Privacy-Preserving Identifier Masking',
      description:
        'APAAR identifiers are masked by default across dashboard views, revealing sensitive details only on demand by authenticated personnel.',
      icon: <Lock className="w-5 h-5 text-[#2391FF]" />,
    },
    {
      title: 'Session & Intake Validation',
      description:
        'Student enrolment session records are validated against sanctioned seat quotas, preventing retroactive seat inflation.',
      icon: <FileCheck className="w-5 h-5 text-[#2391FF]" />,
    },
    {
      title: 'Immediate Collision Invalidation',
      description:
        'Should an admission conflict or duplicate enrolment be flagged, verification records reflect the conflict immediately.',
      icon: <Ban className="w-5 h-5 text-[#F70063]" />,
    },
    {
      title: 'Verifiable Receipts',
      description:
        'Each verified record generates a unique cryptographic digest receipt for reference by institutions and regulatory auditors.',
      icon: <ShieldCheck className="w-5 h-5 text-[#FFCD54]" />,
    },
  ];

  return (
    <section id="security" className="py-20 relative bg-[var(--color-bg-secondary)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Governance */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/25 text-[var(--color-brand-blue)] text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GOVERNANCE &amp; SECURITY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] leading-tight">
              Rigorous Security &amp; Institutional Governance
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              VIDYA-VERIFY enforces strict verification bounds designed explicitly for AICTE Problem Statement 26263, ensuring complete institutional accountability.
            </p>

            <div className="mt-8 p-4 rounded-2xl app-card">
              <div className="text-xs font-semibold text-[var(--color-brand-blue)] mb-1">
                AICTE PROBLEM STATEMENT 26263 COMPLIANT
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Ensures single-institution enrolment integrity, approved intake monitoring, and format validation for all technical students.
              </p>
            </div>
          </div>

          {/* Right Column: Pillars Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {securityPillars.map((pillar, idx) => (
              <div
                key={idx}
                className="app-card p-5 hover:border-[var(--color-border-highlight)] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex items-center justify-center mb-3">
                  {pillar.icon}
                </div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1.5">
                  {pillar.title}
                </h3>
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
