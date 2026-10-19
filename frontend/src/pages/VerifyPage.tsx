import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { VerificationResult } from '../services/api';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';
import {
  Search,
  CheckCircle2,
  CopyX,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Building2,
  GraduationCap,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Info,
} from 'lucide-react';

export const VerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [inputApaar, setInputApaar] = useState(
    searchParams.get('apaar') || '9024-8172-5501-IN'
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFullApaar, setShowFullApaar] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputApaar.trim()) return;

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.verifyApaar(inputApaar.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the APAAR identifier format.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('apaar')) {
      handleVerify();
    }
  }, [searchParams]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskApaar = (id: string) => {
    if (showFullApaar) return id;
    const parts = id.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-••••-••••-${parts[parts.length - 1]}`;
    }
    return id.substring(0, 4) + '••••' + id.substring(id.length - 4);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] transition-colors">
      <GlassNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Sandbox Notice Banner */}
        <div className="mb-8 p-3 rounded-xl bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/25 text-xs text-[var(--color-brand-blue)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              <strong>Sandbox Verification Environment:</strong> This simulator validates APAAR structures and cross-checks against the prototype academic ledger. Not connected to the official live APAAR registry.
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Academic Record Verification
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1.5">
            Query student APAAR identifiers to review enrolment status, multi-campus collision status, and sanctioned intake compliance.
          </p>
        </div>

        {/* Search Bar */}
        <div className="app-card p-4 sm:p-5 shadow-xl mb-8">
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputApaar}
                onChange={(e) => setInputApaar(e.target.value)}
                placeholder="Enter 12-digit APAAR ID (e.g. 9024-8172-5501-IN)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs font-mono-code text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-blue)]"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shrink-0 shadow-sm disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Record</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Test Samples */}
          <div className="mt-3.5 pt-3 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-[var(--color-text-secondary)]">Sample queries:</span>
            <button
              type="button"
              onClick={() => setInputApaar('9024-8172-5501-IN')}
              className="px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)] font-mono-code text-[11px] hover:border-[var(--color-brand-blue)] text-[var(--color-brand-blue)]"
            >
              9024-8172-5501-IN (Clean)
            </button>
            <button
              type="button"
              onClick={() => setInputApaar('3391-4412-8920-IN')}
              className="px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)] font-mono-code text-[11px] hover:border-[#F70063] text-[#F70063]"
            >
              3391-4412-8920-IN (Collision)
            </button>
            <button
              type="button"
              onClick={() => setInputApaar('7721-1049-3382-IN')}
              className="px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)] font-mono-code text-[11px] hover:border-[#FFCD54] text-[#FFCD54]"
            >
              7721-1049-3382-IN (Quota Alert)
            </button>
          </div>
        </div>

        {/* Error View */}
        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/30 text-xs text-[var(--color-brand-pink)] flex items-start gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Verification Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="app-card overflow-hidden shadow-2xl animate-fadeIn">
            {/* Result Header Status Banner */}
            <div
              className={`p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between ${
                result.is_valid
                  ? 'bg-[#2391FF]/10'
                  : result.has_duplicate_collision
                  ? 'bg-[#F70063]/10'
                  : 'bg-[#FFCD54]/15'
              }`}
            >
              <div className="flex items-center gap-3">
                {result.is_valid ? (
                  <CheckCircle2 className="w-6 h-6 text-[#2391FF]" />
                ) : result.has_duplicate_collision ? (
                  <CopyX className="w-6 h-6 text-[#F70063]" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-[#FFCD54]" />
                )}
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
                    {result.is_valid
                      ? 'Academic Integrity Verified'
                      : result.has_duplicate_collision
                      ? 'Duplicate Enrolment Flagged'
                      : 'Intake Capacity Warning'}
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    {result.adapter_mode} · Verified at {new Date(result.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-mono-code ${
                  result.is_valid
                    ? 'bg-[#2391FF] text-white'
                    : result.has_duplicate_collision
                    ? 'bg-[#F70063] text-white'
                    : 'bg-[#FFCD54] text-[#050914]'
                }`}
              >
                {result.status}
              </span>
            </div>

            {/* Candidate Details */}
            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase block mb-1">
                    Student Candidate
                  </span>
                  <div className="text-base font-bold text-[var(--color-text-primary)]">
                    {result.student_name}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">
                      APAAR ID
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFullApaar(!showFullApaar)}
                      className="text-[11px] text-[var(--color-brand-blue)] hover:underline flex items-center gap-1 font-medium"
                    >
                      {showFullApaar ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showFullApaar ? 'Mask' : 'Reveal'}</span>
                    </button>
                  </div>
                  <div className="font-mono-code font-bold text-sm text-[var(--color-text-primary)]">
                    {maskApaar(result.apaar_id)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)]">
                  <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase block mb-0.5">
                    Institution
                  </span>
                  <div className="font-semibold text-[var(--color-text-primary)]">
                    {result.institute}
                  </div>
                  <div className="text-[11px] font-mono-code text-[var(--color-text-muted)] mt-0.5">
                    {result.institute_code}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)]">
                  <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase block mb-0.5">
                    Programme &amp; Year
                  </span>
                  <div className="font-semibold text-[var(--color-text-primary)]">
                    {result.programme}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Session: {result.admission_year}
                  </div>
                </div>
              </div>

              {/* Integrity evaluation details */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <span className="text-[10px] font-semibold uppercase text-[var(--color-text-secondary)] block mb-1">
                  Findings &amp; Integrity Analysis
                </span>
                <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                  {result.details}
                </p>
              </div>

              {/* Cryptographic hash digest */}
              <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] space-y-1.5 font-mono-code text-[11px]">
                <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
                  <span>Verification Receipt Hash</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.merkle_root)}
                    className="hover:text-[var(--color-brand-blue)] flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-[var(--color-brand-blue)]" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-[var(--color-text-primary)] truncate font-semibold">
                  {result.merkle_root}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
