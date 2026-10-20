import React from 'react';
import { ShieldCheck, GraduationCap, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-main)] relative z-10 pt-16 pb-12 overflow-hidden transition-colors">
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[var(--color-border-subtle)]">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5 text-[var(--color-brand-blue)]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-[var(--color-text-primary)]">VIDYA-VERIFY</span>
                <span className="text-xs text-[var(--color-text-secondary)]">AICTE Student Integrity &amp; Verification Platform</span>
              </div>
            </div>

            <p className="text-sm text-[var(--color-text-secondary)] max-w-md leading-relaxed">
              Empowering institutions and regulatory bodies with APAAR credential format verification, cross-institution duplicate enrolment prevention, and approved intake quota compliance.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="px-3 py-1 rounded-xl bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/25 text-[11px] font-mono-code text-[var(--color-brand-blue)]">
                AICTE PS-26263 · SANDBOX PROTOTYPE
              </div>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono-code uppercase tracking-wider text-[var(--color-text-primary)] font-semibold">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li>
                <Link to="/verify" className="hover:text-[var(--color-brand-blue)] transition-colors">
                  APAAR Sandbox Verifier
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[var(--color-brand-blue)] transition-colors">
                  Management Dashboard
                </Link>
              </li>
              <li>
                <Link to="/import" className="hover:text-[var(--color-brand-blue)] transition-colors">
                  CSV Bulk Ingestion
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Governance & Regulatory */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono-code uppercase tracking-wider text-[var(--color-text-primary)] font-semibold">
              Governance
            </h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li>
                <span className="text-[var(--color-text-muted)]">Problem Statement ID:</span>{' '}
                <strong className="text-[var(--color-text-primary)]">26263</strong>
              </li>
              <li>
                <span className="text-[var(--color-text-muted)]">Department:</span> Regulation Bureau
              </li>
              <li>
                <span className="text-[var(--color-text-muted)]">Organization:</span> AICTE
              </li>
              <li>
                <span className="text-[var(--color-text-muted)]">Environment:</span> Demonstration Sandbox
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-secondary)]">
          <div>
            &copy; {new Date().getFullYear()} VIDYA-VERIFY · AICTE Student Integrity &amp; Verification Platform.
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)]">
            Demonstration Prototype for AICTE Hackathon
          </div>
        </div>
      </div>
    </footer>
  );
};
