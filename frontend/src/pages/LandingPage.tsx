import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react';
import { AcademicIdentityCard3D } from '../components/3d/AcademicIdentityCard3D';
import { FeatureCards } from '../components/landing/FeatureCards';
import { VerificationSequence } from '../components/landing/VerificationSequence';
import { SecuritySection } from '../components/landing/SecuritySection';
import { HeroIdentityCard } from '../components/landing/HeroIdentityCard';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const LandingPage: React.FC = () => {
  const { ref: ctaRef, isRevealed: ctaRevealed } = useScrollReveal({ threshold: 0.15 });

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] transition-colors overflow-x-hidden">
      {/* Navigation */}
      <GlassNavbar />

      {/* Full-Screen Immersive 3D Hero Section */}
      <section className="relative min-h-[92svh] lg:min-h-screen flex items-center pt-24 pb-16 lg:pt-28 lg:pb-20 overflow-hidden bg-[var(--color-bg-main)]">
        {/* Full-bleed 3D Academic Identity Canvas - EXACT Background Preserved */}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading, Description, Actions & Highlights */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Eyebrow Badge */}
              <div className="animate-text-reveal-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/30 text-[var(--color-brand-blue)] text-xs font-semibold backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[var(--color-brand-yellow)] animate-pulse" />
                <span>AICTE PROBLEM STATEMENT 26263</span>
              </div>

              {/* Main Headline with line-by-line animated reveal */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
                <span className="block animate-text-reveal-1">Every Student.</span>
                <span className="block animate-text-reveal-2">
                  One <span className="text-[var(--color-brand-blue)]">Trusted Academic Identity</span>.
                </span>
              </h1>

              {/* Supporting Description */}
              <p className="animate-text-reveal-3 text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-lg">
                A unified platform for student data integrity, enrolment monitoring, and secure academic record verification across AICTE-approved institutions.
              </p>

              {/* Primary Action Buttons */}
              <div className="animate-text-reveal-3 flex flex-col sm:flex-row items-center gap-3.5 pt-2">
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-white bg-[var(--color-brand-blue)] hover:bg-[#1c7ee0] rounded-2xl shadow-lg hover:shadow-[0_0_25px_rgba(35,145,255,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Access Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/verify"
                  className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-[var(--color-text-primary)] rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]/60 backdrop-blur-md hover:bg-[var(--color-surface-hover)] hover:border-[#2391FF]/50 hover:shadow-[0_0_20px_rgba(35,145,255,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-[var(--color-brand-yellow)]" />
                  <span>Verify Record</span>
                </Link>
              </div>

              {/* Sandbox Status Label */}
              <div className="animate-text-reveal-3 pt-1 flex items-center gap-2 text-xs font-mono-code text-[var(--color-text-muted)]">
                <span className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)] animate-ping" />
                <span className="tracking-wider uppercase">
                  DEMO ENVIRONMENT · SANDBOX VERIFICATION
                </span>
              </div>

              {/* Trust Highlights */}
              <div className="animate-text-reveal-3 grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.08] max-w-lg">
                <div className="p-3.5 rounded-2xl glass-panel-translucent">
                  <div className="text-lg font-bold text-[var(--color-text-primary)] font-mono-code">
                    10,480+
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                    Approved Institutes
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl glass-panel-translucent">
                  <div className="text-lg font-bold text-[#F70063] font-mono-code">
                    0 Duplicate
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                    Enrolments Allowed
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl glass-panel-translucent">
                  <div className="text-lg font-bold text-[#FFCD54] font-mono-code">
                    100%
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                    Quota Monitored
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Floating Academic Identity Glass Card */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center lg:justify-end">
              <HeroIdentityCard className="w-full max-w-md animate-float-gently" />
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

      {/* Feature Section with Staggered Scroll Reveal */}
      <FeatureCards />

      {/* How It Works Section with Animated Connecting Timeline */}
      <VerificationSequence />

      {/* Security Architecture with Glass Composition */}
      <SecuritySection />

      {/* Final Call to Action - Immersive Glass Panel */}
      <section
        ref={ctaRef}
        className="py-24 relative bg-transparent text-center transition-colors overflow-hidden"
      >
        {/* Soft Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#2391FF]/8 blur-[160px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div
            className="reveal-transition rounded-3xl p-8 sm:p-12 lg:p-16 glass-panel-hero border-[#2391FF]/30 relative overflow-hidden"
            style={{
              opacity: ctaRevealed ? 1 : 0,
              transform: ctaRevealed
                ? 'perspective(1000px) rotateX(0deg) translateY(0)'
                : 'perspective(1000px) rotateX(5deg) translateY(32px)',
              transitionDelay: '100ms',
            }}
          >
            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2391FF]/10 border border-[#2391FF]/30 text-[#2391FF] text-xs font-semibold mb-4 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2391FF] animate-pulse" />
              <span>AICTE VERIFICATION ECOSYSTEM</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              Ensure Trust Across Every Academic Record
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
              Prevent duplicate enrolments and monitor approved intake compliance across AICTE-approved institutions nationwide.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-[var(--color-brand-blue)] hover:bg-[#1c7ee0] rounded-2xl shadow-lg hover:shadow-[0_0_25px_rgba(35,145,255,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Access Management Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/verify"
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-[var(--color-text-primary)] rounded-2xl border border-[var(--color-border-subtle)] bg-black/40 hover:bg-white/[0.06] hover:border-[#2391FF]/40 hover:shadow-[0_0_20px_rgba(35,145,255,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Explore Verification Sandbox
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
