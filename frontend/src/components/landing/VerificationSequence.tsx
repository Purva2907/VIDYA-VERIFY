import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, SearchCode, Database, ShieldCheck, ArrowRight, Play } from 'lucide-react';

export const VerificationSequence: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      step: '01',
      title: 'Institution Upload',
      subtitle: 'Batch Enrolment Data',
      description:
        'AICTE-affiliated institutions securely submit semester or annual enrolment manifests via encrypted CSV batch uploader or automated API node.',
      icon: <UploadCloud className="w-5 h-5 text-[#2391FF]" />,
      badge: 'INGESTION',
      code: 'POST /api/v1/enrolment/batch-stream',
    },
    {
      step: '02',
      title: 'APAAR Validation',
      subtitle: 'Identity Synthetics & Format',
      description:
        'The ingestion gateway parses 12-digit APAAR identifiers, verifies Luhn checksums, and queries the local synthetic identity cache for validity.',
      icon: <CheckCircle2 className="w-5 h-5 text-[#FFF83F]" />,
      badge: 'VERIFICATION',
      code: 'VERIFY { apaar: "9024-8172-5501-IN" }',
    },
    {
      step: '03',
      title: 'Integrity Analysis',
      subtitle: 'Duplicate & Quota Engine',
      description:
        'The core engine tests for multi-institution collision (e.g. concurrent B.Tech enrolments in two universities) and ensures AICTE approved intake seat caps are respected.',
      icon: <SearchCode className="w-5 h-5 text-[#F70063]" />,
      badge: 'CROSS-CHECK',
      code: 'COLLISION_DETECT: 0 FOUND (CLEAN)',
    },
    {
      step: '04',
      title: 'Central Repository',
      subtitle: 'Cryptographic Ledger Seal',
      description:
        'Clean academic records receive an internal immutable UUID, ECDSA digital signature, and Merkle tree root hash stored in the central regulatory ledger.',
      icon: <Database className="w-5 h-5 text-[#2391FF]" />,
      badge: 'IMMUTABLE SEED',
      code: 'ECDSA_SIG: 0x8F72B4...C09A11',
    },
    {
      step: '05',
      title: 'Authorized Verification',
      subtitle: 'Instant QR & Portal Proof',
      description:
        'Authorized verifiers, employers, embassies, and regulatory auditors verify credentials in seconds using signed QR receipts or direct public sandbox query.',
      icon: <ShieldCheck className="w-5 h-5 text-[#FFCD54]" />,
      badge: 'CERTIFIED RECEIPT',
      code: 'STATUS: VALIDATED BY AICTE ENGINE',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-[#080F20]/50 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF83F]/15 border border-[#FFF83F]/30 text-[#FFF83F] text-xs font-mono-code mb-4 shadow-[0_0_15px_rgba(255,248,63,0.2)]">
            <Play className="w-3 h-3 fill-current" />
            <span>5-STAGE VERIFICATION LIFECYCLE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            How The <span className="text-gradient-cyan">Integrity Pipeline</span> Operates
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#A6B4CC] leading-relaxed">
            From decentralized institution bulk uploads to cryptographically signed verification receipts, each record undergoes automated validation.
          </p>
        </div>

        {/* Step Sequence Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((item, index) => {
            const isCurrent = activeStep === index;
            return (
              <div
                key={item.step}
                onClick={() => setActiveStep(index)}
                className={`glass-panel p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? 'border-[#2391FF] bg-[#101B32]/90 shadow-[0_0_25px_rgba(35,145,255,0.25)] scale-[1.02]'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono-code font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                      STEP {item.step}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#080F20] border border-white/10 flex items-center justify-center">
                      {item.icon}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                  <div className="text-xs font-medium text-[#2391FF] mb-3">{item.subtitle}</div>
                  <p className="text-xs text-[#A6B4CC] leading-relaxed mb-4">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="text-[10px] font-mono-code text-slate-400 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 truncate">
                    {item.code}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Simulator Preview of selected step */}
        <div className="mt-10 glass-panel-elevated p-6 rounded-3xl border border-[#2391FF]/30 max-w-4xl mx-auto shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#2391FF] animate-ping" />
              <div>
                <span className="text-xs font-mono-code text-slate-400 uppercase tracking-wider">
                  Live Stage Telemetry Feed
                </span>
                <h4 className="text-lg font-bold text-white">
                  Stage {steps[activeStep].step} — {steps[activeStep].title}
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-code px-3 py-1 rounded-full bg-[#2391FF]/15 text-[#2391FF] border border-[#2391FF]/30">
                AICTE Engine Sandbox: Normal
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono-code">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-slate-400 block mb-1">// Ingestion Hash</span>
              <span className="text-[#60A5FA]">SHA-256: 0x9b72a4...de8190</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-slate-400 block mb-1">// Cross-Institution Sync</span>
              <span className="text-[#FFF83F]">10,482 Institutes Monitored</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-slate-400 block mb-1">// Verification Latency</span>
              <span className="text-[#2391FF]">&lt; 140ms Automated Proof</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
