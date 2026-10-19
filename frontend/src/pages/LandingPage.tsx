import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react';
import { AcademicIdentityCard3D } from '../components/3d/AcademicIdentityCard3D';
import { FeatureCards } from '../components/landing/FeatureCards';
import { VerificationSequence } from '../components/landing/VerificationSequence';
import { SecuritySection } from '../components/landing/SecuritySection';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] transition-colors overflow-x-hidden">
      {/* Navigation */}
      <GlassNavbar />

      {/* Full-Screen Immersive 3D Hero Section */}
      <section className="relative min-h-[92svh] lg:min-h-screen flex items-center pt-24 pb-16 lg:pt-28 lg:pb-20 overflow-hidden bg-[var(--color-bg-main)]">
        {/* Full-bleed 3D Academic Identity Canvas */}
        <AcademicIdentityCard3D
          fullScreen={true}
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        />

        {/* Soft Radial Vignette / Gradient Overlay to Blend 3D Scene Seamlessly into the Website */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              'radial-gradient(ellipse 90% 85% at 75% 50%, transparent 25%, var(--color-bg-main) 96%)',
          }}
        />

        {/* Subtle Ambient Color Glow for Atmospheric Depth */}
        <div className="absolute top-1/4 left-1/3 w-[480px] h-[480px] rounded-full bg-[#2391FF]/10 blur-[150px] pointer-events-none z-[1]" />
        <div className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] rounded-full bg-[#FFCD54]/8 blur-[130px] pointer-events-none z-[1]" />

        {/* Hero Content Layer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-xl lg:max-w-2xl space-y-6 text-left">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/25 text-[var(--color-brand-blue)] text-xs font-semibold backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand-yellow)]" />
              <span>AICTE PROBLEM STATEMENT 26263</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
              Every Student. <br />
              One <span className="text-[var(--color-brand-blue)]">Trusted Academic Identity</span>.
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-lg">
              A unified platform for student data integrity, enrolment monitoring, and secure academic record verification across AICTE-approved institutions.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-[var(--color-brand-blue)] hover:opacity-90 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
              >
                <span>Access Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/verify"
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-[var(--color-text-primary)] rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]/80 backdrop-blur-md hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-highlight)] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-[var(--color-brand-yellow)]" />
                <span>Verify Record</span>
              </Link>
            </div>

            {/* Sandbox Status Label */}
            <div className="pt-1 flex items-center gap-2 text-xs font-mono-code text-[var(--color-text-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)]" />
              <span className="tracking-wider uppercase">
                DEMO ENVIRONMENT · SANDBOX VERIFICATION
              </span>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--color-border-subtle)] max-w-lg">
              <div className="p-3.5 rounded-2xl app-card bg-[var(--color-surface-card)]/80 backdrop-blur-md">
                <div className="text-lg font-bold text-[var(--color-text-primary)] font-mono-code">
                  10,480+
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                  Approved Institutes
                </div>
              </div>
              <div className="p-3.5 rounded-2xl app-card bg-[var(--color-surface-card)]/80 backdrop-blur-md">
                <div className="text-lg font-bold text-[#F70063] font-mono-code">
                  0 Duplicate
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                  Enrolments Allowed
                </div>
              </div>
              <div className="p-3.5 rounded-2xl app-card bg-[var(--color-surface-card)]/80 backdrop-blur-md">
                <div className="text-lg font-bold text-[#FFCD54] font-mono-code">
                  100%
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                  Quota Monitored
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 opacity-70 z-10 pointer-events-none">
          <span className="text-[10px] font-mono-code text-[var(--color-text-muted)] uppercase tracking-widest">
            Scroll To Explore
          </span>
          <ChevronDown className="w-4 h-4 text-[var(--color-brand-blue)] animate-bounce" />
        </div>
      </section>

      {/* Feature Section */}
      <FeatureCards />

      {/* How It Works Section */}
      <VerificationSequence />

      {/* Security Architecture */}
      <SecuritySection />

      {/* Final Call to Action */}
      <section className="py-20 relative bg-[var(--color-bg-main)] border-t border-[var(--color-border-subtle)] text-center transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Ensure Trust Across Every Academic Record
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--color-text-secondary)] max-w-xl mx-auto">
            Prevent duplicate enrolments and monitor approved intake compliance across AICTE-approved institutions nationwide.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-[var(--color-brand-blue)] hover:opacity-90 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <span>Access Management Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/verify"
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-[var(--color-text-primary)] rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-hover)] transition-all"
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
