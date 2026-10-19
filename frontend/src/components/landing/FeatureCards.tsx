import React from 'react';
import {
  Fingerprint,
  CopyX,
  Gauge,
  Cpu,
  QrCode,
  LineChart,
} from 'lucide-react';

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentBorder: string;
  badge: string;
  metric: string;
}

export const FeatureCards: React.FC = () => {
  const features: FeatureItem[] = [
    {
      id: 'apaar-validation',
      title: 'APAAR Identity Validation',
      description:
        'Format validation and hash verification for One Nation, One Student ID (APAAR) across participating institutions.',
      icon: <Fingerprint className="w-6 h-6 text-[#2391FF]" />,
      accentBorder: 'border-[#2391FF]/30 hover:border-[#2391FF]',
      badge: 'FORMAT VERIFICATION',
      metric: '12-Digit Structure Checks',
    },
    {
      id: 'duplicate-detection',
      title: 'Cross-Institution Duplicate Detection',
      description:
        'Cross-enrolment indexing preventing simultaneous dual-enrolments across separate AICTE approved universities and campuses.',
      icon: <CopyX className="w-6 h-6 text-[#F70063]" />,
      accentBorder: 'border-[#F70063]/30 hover:border-[#F70063]',
      badge: 'COLLISION SHIELD',
      metric: 'Dual-Enrolment Prevention',
    },
    {
      id: 'intake-monitoring',
      title: 'Approved Intake Monitoring',
      description:
        'Comparison of registered students against sanctioned AICTE intake quotas, immediately highlighting unauthorized admissions.',
      icon: <Gauge className="w-6 h-6 text-[#FFCD54]" />,
      accentBorder: 'border-[#FFCD54]/30 hover:border-[#FFCD54]',
      badge: 'REGULATORY CAP',
      metric: 'Sanctioned Seat Compliance',
    },
    {
      id: 'anomaly-detection',
      title: 'Automated Audit Intelligence',
      description:
        'Validation checks for irregular admission entries, duplicate identifiers, and quota threshold violations.',
      icon: <Cpu className="w-6 h-6 text-[#2391FF]" />,
      accentBorder: 'border-[#2391FF]/30 hover:border-[#2391FF]',
      badge: 'AUDIT AUTOMATION',
      metric: 'Automated Anomaly Scoring',
    },
    {
      id: 'tamper-evident-credentials',
      title: 'Verifiable Verification Receipts',
      description:
        'Instant verification receipts with cryptographic digest hashes, providing provable confirmation of authenticity.',
      icon: <QrCode className="w-6 h-6 text-[#FFF83F]" />,
      accentBorder: 'border-[#FFF83F]/30 hover:border-[#FFF83F]',
      badge: 'VERIFIABLE RECEIPTS',
      metric: 'Tamper-Evident Digest',
    },
    {
      id: 'regulatory-telemetry',
      title: 'Institutional Administration',
      description:
        'Real-time enrollment summaries and statistics for AICTE regulation bureaus and institutional nodals.',
      icon: <LineChart className="w-6 h-6 text-[#2391FF]" />,
      accentBorder: 'border-[#2391FF]/30 hover:border-[#2391FF]',
      badge: 'REGULATION LEDGER',
      metric: 'Active Campus Insights',
    },
  ];

  return (
    <section id="features" className="py-20 relative bg-[var(--color-bg-secondary)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/25 text-[var(--color-brand-blue)] text-xs font-semibold mb-3">
            <span>CORE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Academic Verification &amp; Enrolment Integrity
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[var(--color-text-secondary)]">
            A comprehensive suite for AICTE-approved institutions to maintain transparent records and detect enrolment discrepancies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`app-card p-6 border ${feature.accentBorder} transition-all duration-200 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                    {feature.icon}
                  </div>
                  <span className="text-[10px] font-mono-code font-bold text-[var(--color-text-muted)] tracking-wider">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[var(--color-border-subtle)] text-[11px] font-mono-code text-[var(--color-text-muted)]">
                {feature.metric}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
