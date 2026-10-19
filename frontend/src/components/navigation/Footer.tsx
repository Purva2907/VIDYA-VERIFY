import React from 'react';
import { ShieldCheck, GraduationCap, ExternalLink, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-[#050914] relative z-10 pt-16 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2391FF]/30 to-[#0B1220] border border-[#2391FF]/40 flex items-center justify-center shadow-[0_0_15px_rgba(35,145,255,0.3)]">
                <ShieldCheck className="w-5 h-5 text-[#2391FF]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white">VIDYA-VERIFY</span>
                <span className="text-xs text-slate-400">AICTE Student Integrity &amp; Verification Platform</span>
              </div>
            </div>

            <p className="text-sm text-[#A6B4CC] max-w-md leading-relaxed">
              Empowering AICTE Regulation Bureau with automated APAAR credential verification, cross-institution duplicate enrolment prevention, and real-time intake seat compliance.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/Purva2907/VIDYA-VERIFY.git"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#2391FF]/40 text-xs text-slate-300 hover:text-white transition-all"
              >
                <svg className="w-4 h-4 text-[#2391FF] fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>

              <div className="px-3 py-1 rounded-xl bg-[#2391FF]/10 border border-[#2391FF]/25 text-[11px] font-mono-code text-[#2391FF]">
                PS-26263 · SMART AUTOMATION
              </div>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono-code uppercase tracking-wider text-slate-300 font-semibold">
              Platform Features
            </h4>
            <ul className="space-y-2 text-sm text-[#A6B4CC]">
              <li>
                <Link to="/verify" className="hover:text-white transition-colors">
                  APAAR Sandbox Verifier
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Regulatory Integrity Dashboard
                </Link>
              </li>
              <li>
                <Link to="/import" className="hover:text-white transition-colors">
                  CSV Bulk Enrolment Upload
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  5-Stage Verification Protocol
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Intake Capacity Gauges
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Governance & Regulatory */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono-code uppercase tracking-wider text-slate-300 font-semibold">
              Governance &amp; Specs
            </h4>
            <ul className="space-y-2 text-sm text-[#A6B4CC]">
              <li>
                <span className="text-slate-400">Problem Statement ID:</span>{' '}
                <strong className="text-white">26263</strong>
              </li>
              <li>
                <span className="text-slate-400">Department:</span> Regulation Bureau
              </li>
              <li>
                <span className="text-slate-400">Organization:</span> AICTE
              </li>
              <li>
                <span className="text-slate-400">DPDPA 2023:</span> Privacy Preserving
              </li>
              <li>
                <span className="text-slate-400">Telemetry:</span> Synthetic Demo Dataset
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono-code">
          <div>
            &copy; 2026 VIDYA-VERIFY · All Rights Reserved. Built for AICTE Smart Automation.
          </div>
          <div className="flex items-center gap-2">
            <span>Demo Environment · Sandbox Verification Mode Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
