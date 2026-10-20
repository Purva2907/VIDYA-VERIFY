import React from 'react';
import {
  Fingerprint,
  CopyX,
  Gauge,
  Cpu,
  QrCode,
  LineChart,
  Sparkles,
} from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentBorder: string;
  badge: string;
  metric: string;
  accentColor: string;
}

export const FeatureCards: React.FC = () => {
  const { ref, isRevealed } = useScrollReveal({ threshold: 0.12 });

  const features: FeatureItem[] = [
    {
      id: 'apaar-validation',
      title: 'APAAR Identity Validation',
      description:
        'Format validation and hash verification for One Nation, One Student ID (APAAR) across participating institutions.',
      icon: <Fingerprint className="w-5 h-5 text-[#2391FF]" />,
      accentBorder: 'hover:border-[#2391FF]/60 hover:shadow-[0_8px_30px_rgba(35,145,255,0.15)]',
      badge: 'FORMAT VERIFICATION',
      metric: '12-Digit Structure Checks',
      accentColor: '#2391FF',
    },
    {
      id: 'duplicate-detection',
      title: 'Cross-Institution Duplicate Detection',
      description:
        'Cross-enrolment indexing preventing simultaneous dual-enrolments across separate AICTE approved universities and campuses.',
      icon: <CopyX className="w-5 h-5 text-[#F70063]" />,
      accentBorder: 'hover:border-[#F70063]/60 hover:shadow-[0_8px_30px_rgba(247,0,99,0.15)]',
      badge: 'COLLISION SHIELD',
      metric: 'Dual-Enrolment Prevention',
      accentColor: '#F70063',
    },
    {
      id: 'intake-monitoring',
      title: 'Approved Intake Monitoring',
      description:
        'Comparison of registered students against sanctioned AICTE intake quotas, immediately highlighting unauthorized admissions.',
      icon: <Gauge className="w-5 h-5 text-[#FFCD54]" />,
      accentBorder: 'hover:border-[#FFCD54]/60 hover:shadow-[0_8px_30px_rgba(255,205,84,0.15)]',
      badge: 'REGULATORY CAP',
      metric: 'Sanctioned Seat Compliance',
      accentColor: '#FFCD54',
    },
    {
      id: 'anomaly-detection',
      title: 'Automated Audit Intelligence',
      description:
        'Validation checks for irregular admission entries, duplicate identifiers, and quota threshold violations.',
      icon: <Cpu className="w-5 h-5 text-[#2391FF]" />,
      accentBorder: 'hover:border-[#2391FF]/60 hover:shadow-[0_8px_30px_rgba(35,145,255,0.15)]',
      badge: 'AUDIT AUTOMATION',
      metric: 'Automated Anomaly Scoring',
      accentColor: '#2391FF',
    },
    {
      id: 'tamper-evident-credentials',
      title: 'Verifiable Verification Receipts',
      description:
        'Instant verification receipts with cryptographic digest hashes, providing provable confirmation of authenticity.',
      icon: <QrCode className="w-5 h-5 text-[#FFF83F]" />,
      accentBorder: 'hover:border-[#FFF83F]/60 hover:shadow-[0_8px_30px_rgba(255,248,63,0.15)]',
      badge: 'VERIFIABLE RECEIPTS',
      metric: 'Tamper-Evident Digest',
      accentColor: '#FFF83F',
    },
    {
      id: 'regulatory-telemetry',
      title: 'Institutional Administration',
      description:
        'Real-time enrollment summaries and statistics for AICTE regulation bureaus and institutional nodals.',
      icon: <LineChart className="w-5 h-5 text-[#2391FF]" />,
      accentBorder: 'hover:border-[#2391FF]/60 hover:shadow-[0_8px_30px_rgba(35,145,255,0.15)]',
      badge: 'REGULATION LEDGER',
      metric: 'Active Campus Insights',
      accentColor: '#2391FF',
    },
  ];

  return (
    <section
      id="features"
      ref={ref}
      className="py-24 relative bg-transparent transition-colors overflow-hidden"
    >
      {/* Background Soft Depth Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[350px] bg-[#2391FF]/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] bg-[#F70063]/5 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header with Staggered Entrance */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          {/* Eyebrow badge reveals first */}
          <div
            className="reveal-transition inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/30 text-[var(--color-brand-blue)] text-xs font-semibold mb-3 backdrop-blur-md"
            style={{
              opacity: isRevealed ? 1 : 0,
              transform: isRevealed ? 'translateY(0)' : 'translateY(16px)',
              transitionDelay: '0ms',
            }}
          >
            <Sparkles className="w-3 h-3 text-[#2391FF]" />
            <span className="tracking-wide">CORE ARCHITECTURE</span>
          </div>

          {/* Main heading reveals after eyebrow */}
          <h2
            className="reveal-transition text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]"
            style={{
              opacity: isRevealed ? 1 : 0,
              transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: '100ms',
            }}
          >
            Academic Verification &amp; Enrolment Integrity
          </h2>

          {/* Supporting text reveals shortly after */}
          <p
            className="reveal-transition mt-3 text-sm sm:text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto"
            style={{
              opacity: isRevealed ? 1 : 0,
              transform: isRevealed ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: '200ms',
            }}
          >
            A comprehensive suite for AICTE-approved institutions to maintain transparent records and detect enrolment discrepancies.
          </p>
        </div>

        {/* 6 Glass Cards with Staggered Scroll Entrance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={feature.id}
              className={`reveal-transition group relative rounded-2xl p-6 glass-panel-translucent ${feature.accentBorder} flex flex-col justify-between hover:-translate-y-1.5`}
              style={{
                opacity: isRevealed ? 1 : 0,
                transform: isRevealed
                  ? 'perspective(1000px) rotateX(0deg) translateY(0)'
                  : 'perspective(1000px) rotateX(5deg) translateY(32px)',
                transitionDelay: `${250 + idx * 80}ms`,
              }}
            >
              <div>
                {/* Top Row: Icon + Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-2.5 rounded-xl border transition-colors duration-300 bg-black/40 border-white/[0.08] group-hover:border-[#2391FF]/40"
                    style={{
                      boxShadow: `0 0 16px ${feature.accentColor}15`,
                    }}
                  >
                    {feature.icon}
                  </div>
                  <span className="text-[10px] font-mono-code font-bold tracking-wider text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
                    {feature.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-brand-blue)] transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Card Footer Metric */}
              <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono-code text-[var(--color-text-muted)]">
                <span>{feature.metric}</span>
                <span
                  className="w-1.5 h-1.5 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: feature.accentColor }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
