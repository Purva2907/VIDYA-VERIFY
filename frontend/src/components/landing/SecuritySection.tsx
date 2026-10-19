import React from 'react';
import { ShieldCheck, Lock, KeyRound, History, FileCheck, Ban, CheckCircle } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  const securityPillars = [
    {
      title: 'Role-Based Sovereign Authorization (RBAC)',
      description:
        'Granular partition between Institution Data Nodes, AICTE Central Regulatory Auditors, and Public Verification Entities. Self-assignment of regulator status is strictly forbidden.',
      icon: <KeyRound className="w-5 h-5 text-[#2391FF]" />,
    },
    {
      title: 'Cryptographic Merkle Audit Trails',
      description:
        'Immutable event logging for all data transactions, intake modifications, and verification requests, enabling non-repudiation and regulatory auditing.',
      icon: <History className="w-5 h-5 text-[#FFF83F]" />,
    },
    {
      title: 'Privacy-Aware DPDPA Consent Protocols',
      description:
        'Direct compliance with Indian Digital Personal Data Protection Act (DPDPA). Real APAAR identities are masked, using synthetic tokens in sandbox and encrypted digests in logs.',
      icon: <Lock className="w-5 h-5 text-[#2391FF]" />,
    },
    {
      title: 'Immutable Academic Versioning',
      description:
        'Student semester completions, degree certificates, and transfers are versioned cryptographically, completely precluding retroactive seat tampering or diploma counterfeiting.',
      icon: <FileCheck className="w-5 h-5 text-[#60A5FA]" />,
    },
    {
      title: 'Revocable Cryptographic Receipts',
      description:
        'Should an admission discrepancy, dual-registration collision, or disciplinary sanction occur, verification receipts are invalidated immediately across the registry.',
      icon: <Ban className="w-5 h-5 text-[#F70063]" />,
    },
    {
      title: 'Zero-Knowledge Credential Proofs',
      description:
        'Third-party employers can verify that a candidate graduated from an accredited AICTE programme without accessing personal private data or sovereign Aadhaar/APAAR seed keys.',
      icon: <ShieldCheck className="w-5 h-5 text-[#FFCD54]" />,
    },
  ];

  return (
    <section id="security" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Trust Architecture */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2391FF]/15 border border-[#2391FF]/30 text-[#2391FF] text-xs font-mono-code mb-4 shadow-[0_0_15px_rgba(35,145,255,0.2)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2391FF]" />
              <span>ENTERPRISE GOVERNANCE ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Trust Built On <span className="text-gradient-blue">Cryptographic Rigor</span>, Not Promises.
            </h2>
            <p className="mt-4 text-base text-[#A6B4CC] leading-relaxed">
              VIDYA-VERIFY enforces strict mathematical verification bounds. Designed explicitly for AICTE Problem Statement 26263, our security architecture ensures total institutional accountability.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-[#FFF83F] shrink-0" />
                <span>Zero unencrypted student PII stored or exposed in URLs</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-[#2391FF] shrink-0" />
                <span>Sandbox adapter architecture with simulated responses clearly marked</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-[#FFCD54] shrink-0" />
                <span>Automated dual-enrolment detection across 10,000+ technical colleges</span>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-2xl glass-panel border border-[#2391FF]/20 bg-[#080F20]/70">
              <div className="text-xs font-mono-code text-slate-400 mb-1">
                // REGULATORY COMPLIANCE DIRECTIVE
              </div>
              <div className="text-sm font-semibold text-white">
                All demonstration telemetry uses synthesized non-production records to safeguard privacy while proving full architectural readiness.
              </div>
            </div>
          </div>

          {/* Right Column: 6 Security Pillars Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {securityPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-[#2391FF]/40 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#080F20] border border-white/10 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:border-[#2391FF]/50 transition-all">
                  {pillar.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#2391FF] transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-xs text-[#A6B4CC] leading-relaxed">
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
