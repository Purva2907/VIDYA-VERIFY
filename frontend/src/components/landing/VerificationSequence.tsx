import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, SearchCode, Database, ShieldCheck, ArrowRight } from 'lucide-react';

export const VerificationSequence: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

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
    },
  ];

  return (
    <section id="how-it-works" className="py-20 relative bg-[var(--color-bg-main)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/25 text-[var(--color-brand-blue)] text-xs font-semibold mb-3">
            <span>HOW IT WORKS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
            5-Stage Verification Protocol
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[var(--color-text-secondary)]">
            From institutional bulk submission to instant cryptographic verification.
          </p>
        </div>

        {/* Step Cards Horizontal Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((st, idx) => (
            <div
              key={st.step}
              onClick={() => setActiveStep(idx)}
              className={`app-card p-5 cursor-pointer transition-all ${
                activeStep === idx
                  ? 'border-[var(--color-brand-blue)] shadow-md'
                  : 'hover:border-[var(--color-border-highlight)]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-code font-bold text-xs text-[var(--color-brand-blue)]">
                  {st.step}
                </span>
                <div className="p-1.5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  {st.icon}
                </div>
              </div>

              <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1">
                {st.title}
              </h3>
              <div className="text-[11px] text-[var(--color-brand-blue)] font-medium mb-2">
                {st.subtitle}
              </div>

              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                {st.description}
              </p>

              <div className="pt-3 border-t border-[var(--color-border-subtle)]">
                <span className="text-[10px] font-mono-code text-[var(--color-text-muted)] truncate block">
                  {st.code}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
