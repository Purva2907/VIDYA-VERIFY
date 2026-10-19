import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Database, CheckCircle2, ChevronDown, Sparkles, Building2, Users, AlertTriangle } from 'lucide-react';
import { AcademicIdentityCard3D } from '../components/3d/AcademicIdentityCard3D';
import type { DemoState } from '../components/3d/AcademicIdentityCard3D';
import { FeatureCards } from '../components/landing/FeatureCards';
import { VerificationSequence } from '../components/landing/VerificationSequence';
import { SecuritySection } from '../components/landing/SecuritySection';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';

export const LandingPage: React.FC = () => {
  const [demoState, setDemoState] = useState<DemoState>('idle');

  return (
    <div className="min-h-screen bg-[#050914] text-[#F8FAFC] selection:bg-[#2391FF]/30 selection:text-white relative overflow-x-hidden">
      {/* Navigation */}
      <GlassNavbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-28 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        {/* Subtle Cyber Atmospheric Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#dee2f3 1px, transparent 1px), linear-gradient(90deg, #dee2f3 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-10 w-[420px] h-[420px] rounded-full bg-[#2391FF]/15 blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] rounded-full bg-[#2391FF]/12 blur-[150px] pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-[360px] h-[360px] rounded-full bg-[#FFF83F]/8 blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2391FF]/12 border border-[#2391FF]/30 text-[#2391FF] text-xs font-mono-code shadow-[0_0_18px_rgba(35,145,255,0.25)]">
                <span className="w-2 h-2 rounded-full bg-[#FFF83F] animate-pulse" />
                <span>AICTE PROBLEM STATEMENT 26263</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                Every Student. <br />
                One <span className="text-gradient-blue">Trusted Academic Identity</span>.
              </h1>

              {/* Supporting Description */}
              <p className="text-base sm:text-lg text-[#A6B4CC] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                A unified platform for student data integrity, enrolment monitoring, and secure academic record verification across AICTE-approved institutions.
              </p>

              {/* Primary Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-[#050914] bg-[#2391FF] hover:bg-[#4ea6ff] rounded-2xl shadow-[0_0_28px_rgba(35,145,255,0.45)] hover:shadow-[0_0_36px_rgba(35,145,255,0.65)] transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
                >
                  <span>Explore Platform</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>

                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-white/5 hover:bg-white/10 rounded-2xl border border-white/12 hover:border-[#2391FF]/50 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#FFF83F]" />
                  <span>Access Portal</span>
                </Link>
              </div>

              {/* Sandbox Status Label */}
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-2 text-xs font-mono-code text-slate-400">
                <span className="w-2 h-2 rounded-full bg-[#2391FF]" />
                <span className="tracking-wider uppercase">
                  DEMO ENVIRONMENT · SANDBOX VERIFICATION
                </span>
              </div>

              {/* Quick Trust Highlights */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 max-w-lg mx-auto lg:mx-0">
                <div className="p-3 rounded-2xl glass-panel text-left">
                  <div className="text-lg font-bold text-white font-mono-code">10,480+</div>
                  <div className="text-[11px] text-slate-400">AICTE Institutes</div>
                </div>
                <div className="p-3 rounded-2xl glass-panel text-left">
                  <div className="text-lg font-bold text-[#F70063] font-mono-code">0 Duplicate</div>
                  <div className="text-[11px] text-slate-400">Enrolments Allowed</div>
                </div>
                <div className="p-3 rounded-2xl glass-panel text-left">
                  <div className="text-lg font-bold text-[#FFF83F] font-mono-code">&lt;140ms</div>
                  <div className="text-[11px] text-slate-400">Verification Latency</div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Holographic APAAR Academic Identity Centerpiece */}
            <div className="lg:col-span-6 relative">
              <div className="relative w-full flex items-center justify-center">
                <AcademicIdentityCard3D
                  externalState={demoState}
                  onStateChange={setDemoState}
                  interactiveControls={true}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">
            Scroll To Explore
          </span>
          <ChevronDown className="w-4 h-4 text-[#2391FF] animate-bounce" />
        </div>
      </section>

      {/* Trust Metrics Ribbon */}
      <section className="py-8 bg-[#080F20] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono-code">
                100%
              </span>
              <span className="text-xs text-[#A6B4CC] mt-1 font-medium">
                APAAR Format &amp; Luhn Integrity
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#2391FF] font-mono-code">
                Zero-Knowledge
              </span>
              <span className="text-xs text-[#A6B4CC] mt-1 font-medium">
                Privacy-Preserving Proofs
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#FFCD54] font-mono-code">
                120/120 Cap
              </span>
              <span className="text-xs text-[#A6B4CC] mt-1 font-medium">
                Sanctioned Intake Enforcement
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#FFF83F] font-mono-code">
                ECDSA-256
              </span>
              <span className="text-xs text-[#A6B4CC] mt-1 font-medium">
                Tamper-Evident QR Receipts
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <FeatureCards />

      {/* How It Works Section */}
      <VerificationSequence />

      {/* Security Architecture */}
      <SecuritySection />

      {/* Final Call to Action */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[#050914] to-[#080F20] border-t border-white/10">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full bg-[#2391FF]/15 blur-[140px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF83F]/15 border border-[#FFF83F]/30 text-[#FFF83F] text-xs font-mono-code mb-4">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>INSTANT DEPLOYMENT READY</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Build Trust Into Every <span className="text-gradient-blue">Academic Record</span>.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#A6B4CC] max-w-2xl mx-auto leading-relaxed">
            Eliminate credential fraud and ensure unassailable admissions compliance across all AICTE-approved institutions nationwide.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-[#050914] bg-[#2391FF] hover:bg-[#4ea6ff] rounded-2xl shadow-[0_0_30px_rgba(35,145,255,0.5)] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Access Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/verify"
              className="w-full sm:w-auto px-8 py-4 text-sm font-semibold text-white rounded-2xl bg-white/5 hover:bg-white/10 border border-white/12 hover:border-[#2391FF]/40 transition-all"
            >
              Explore Verification Sandbox
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
