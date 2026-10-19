import React from 'react';
import {
  Fingerprint,
  CopyX,
  Gauge,
  Cpu,
  QrCode,
  LineChart,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  badge: string;
  metric: string;
}

export const FeatureCards: React.FC = () => {
  const features: FeatureItem[] = [
    {
      id: 'apaar-validation',
      title: 'APAAR Identity Validation',
      description:
        'Zero-knowledge format validation and cryptographic hash matching for One Nation, One Student ID (APAAR) across institutions.',
      icon: <Fingerprint className="w-6 h-6 text-[#2391FF]" />,
      accent: 'border-[#2391FF]/40 hover:border-[#2391FF]',
      badge: 'CORE ENGINE',
      metric: '12-Digit APAAR Format Verification',
    },
    {
      id: 'duplicate-detection',
      title: 'Cross-Institution Duplicate Detection',
      description:
        'Real-time collision indexing preventing simultaneous dual-enrolments across separate AICTE approved universities and campuses.',
      icon: <CopyX className="w-6 h-6 text-[#F70063]" />,
      accent: 'border-[#F70063]/40 hover:border-[#F70063]',
      badge: 'COLLISION SHIELD',
      metric: 'Zero-Collision Cross-Match Protocol',
    },
    {
      id: 'intake-monitoring',
      title: 'Approved Intake Monitoring',
      description:
        'Continuous comparison of registered students against sanctioned AICTE intake quotas, immediately highlighting unauthorized admissions.',
      icon: <Gauge className="w-6 h-6 text-[#FFCD54]" />,
      accent: 'border-[#FFCD54]/40 hover:border-[#FFCD54]',
      badge: 'REGULATORY CAP',
      metric: '100% Quota Enforcement Alerting',
    },
    {
      id: 'anomaly-detection',
      title: 'Intelligent Anomaly Detection',
      description:
        'Automated telemetry scanning for irregular submission velocities, inconsistent academic timelines, and synthetic identity injections.',
      icon: <Cpu className="w-6 h-6 text-[#FFF83F]" />,
      accent: 'border-[#FFF83F]/40 hover:border-[#FFF83F]',
      badge: 'INTEGRITY AUDIT',
      metric: 'Instant Batch Integrity Analysis',
    },
    {
      id: 'qr-verification',
      title: 'Secure Record & QR Verification',
      description:
        'Tamper-evident verification receipts and cryptographically signed QR codes for third-party employers, agencies, and embassies.',
      icon: <QrCode className="w-6 h-6 text-[#2391FF]" />,
      accent: 'border-[#2391FF]/40 hover:border-[#2391FF]',
      badge: 'VERIFIED CREDENTIAL',
      metric: 'ECDSA Signed Digital Ledger Receipts',
    },
    {
      id: 'regulatory-analytics',
      title: 'Regulatory Analytics & Telemetry',
      description:
        'Macro-level compliance dashboards for AICTE bureaus with regional enrolment heatmaps, branch-wise distribution, and audit logs.',
      icon: <LineChart className="w-6 h-6 text-[#60A5FA]" />,
      accent: 'border-[#2391FF]/40 hover:border-[#2391FF]',
      badge: 'NATIONAL OVERSIGHT',
      metric: 'Realtime Institutional Compliance',
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-[#2391FF]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#F70063]/10 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2391FF]/15 border border-[#2391FF]/30 text-[#2391FF] text-xs font-mono-code mb-4 shadow-[0_0_15px_rgba(35,145,255,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFF83F] animate-pulse" />
            <span>AICTE REGULATION BUREAU · HIGH-INTEGRITY SUITE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Architecture for Complete <span className="text-gradient-blue">Student Record Integrity</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#A6B4CC] leading-relaxed">
            Eliminating duplicate admissions, fraudulent identity credentials, and intake seat violations across India&apos;s higher technical education landscape.
          </p>
        </div>

        {/* 6 Glassmorphic Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item) => (
            <div
              key={item.id}
              className={`glass-panel p-7 rounded-3xl border transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group shadow-xl ${item.accent}`}
            >
              <div>
                {/* Header row with Icon and Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#080F20] border border-white/10 flex items-center justify-center group-hover:scale-105 group-hover:border-[#2391FF]/50 transition-all shadow-inner">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-mono-code px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 uppercase tracking-wider">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-[#2391FF] transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-[#A6B4CC] leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>

              {/* Metric bar */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono-code">
                <span className="text-slate-400">{item.metric}</span>
                <ArrowUpRight className="w-4 h-4 text-[#2391FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
