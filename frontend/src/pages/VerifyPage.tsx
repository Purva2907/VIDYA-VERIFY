import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import type { VerificationResult } from '../services/api';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';
import {
  Search,
  CheckCircle2,
  CopyX,
  AlertTriangle,
  ShieldCheck,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Info,
  Calendar,
  Award,
  FileCheck,
  Hash,
  Fingerprint,
  Share2,
  FileText,
  CheckSquare,
  Clock,
} from 'lucide-react';

interface RecentItem {
  id: string;
  apaar_raw: string;
  masked: string;
  status: 'CLEAN' | 'COLLISION' | 'QUOTA';
  timeAgo: string;
}

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

  // Recent verification records matching reference screenshot
  const recentVerifications: RecentItem[] = [
    {
      id: 'rec_1',
      apaar_raw: '9024-8172-5501-IN',
      masked: '9024-••••••••-5501',
      status: 'CLEAN',
      timeAgo: '2 mins ago',
    },
    {
      id: 'rec_2',
      apaar_raw: '3391-4412-8920-IN',
      masked: '3391-••••••••-8920',
      status: 'COLLISION',
      timeAgo: '10 mins ago',
    },
    {
      id: 'rec_3',
      apaar_raw: '7721-1849-3382-IN',
      masked: '7721-••••••••-3382',
      status: 'QUOTA',
      timeAgo: '18 mins ago',
    },
    {
      id: 'rec_4',
      apaar_raw: '6112-9901-1190-IN',
      masked: '6112-••••••••-1190',
      status: 'CLEAN',
      timeAgo: '25 mins ago',
    },
    {
      id: 'rec_5',
      apaar_raw: '8843-1209-7712-IN',
      masked: '8843-••••••••-7712',
      status: 'CLEAN',
      timeAgo: '42 mins ago',
    },
  ];

  const handleVerify = async (e?: React.FormEvent, targetId?: string) => {
    if (e) e.preventDefault();
    const idToVerify = (targetId || inputApaar).trim();
    if (!idToVerify) return;

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.verifyApaar(idToVerify);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the APAAR identifier format.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('apaar')) {
      handleVerify(undefined, searchParams.get('apaar')!);
    }
  }, [searchParams]);

  const selectSample = (apaar: string) => {
    setInputApaar(apaar);
    handleVerify(undefined, apaar);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskApaar = (id: string) => {
    if (showFullApaar) return id;
    const parts = id.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-••••••••-${parts[parts.length - 1]}`;
    }
    return id.substring(0, 4) + '••••••••' + id.substring(id.length - 4);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between selection:bg-[#2391FF] selection:text-white">
      <GlassNavbar />

      <main className="max-w-[1640px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1 flex flex-col">
        {/* Main Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-7">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Academic Record Verification
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9CAE] mt-2 leading-relaxed font-normal">
            Query student APAAR identifiers to review enrolment status, multi-campus collision status, and sanctioned intake compliance.
          </p>
        </div>

        {/* 3-Column Enterprise Workspace */}
        <div className="flex flex-col lg:flex-row gap-4.5 items-stretch flex-1">
          {/* LEFT COLUMN: How Verification Works */}
          <div className="w-full lg:w-[295px] xl:w-[315px] shrink-0 flex flex-col">
            <div className="rounded-2xl bg-[#06080c] border border-[#182633] p-5 flex flex-col justify-between h-full shadow-lg">
              <div>
                <div className="flex items-center gap-2 text-white">
                  <div className="w-5 h-5 rounded-full border border-[#2391FF] flex items-center justify-center text-[#2391FF]">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    How Verification Works
                  </h2>
                </div>
                <p className="text-xs text-[#8E9CAE] mt-2.5 leading-relaxed">
                  This tool validates student academic records against the institution's authorized ledger and checks for potential integrity issues.
                </p>

                {/* Vertically Connected Numbered Steps */}
                <div className="mt-6 relative pl-1 space-y-6">
                  {/* Subtle Vertical Connector Line */}
                  <div className="absolute left-[18px] top-3.5 bottom-3.5 w-px bg-[#15273b]" />

                  {/* Step 1 */}
                  <div className="relative flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full border border-[#2391FF] bg-[#071321] text-[#2391FF] flex items-center justify-center text-xs font-bold shrink-0 z-10 shadow-sm">
                      1
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">
                        APAAR Format Validation
                      </h3>
                      <p className="text-[11px] text-[#8E9CAE] mt-0.5 leading-normal">
                        Checks identifier structure and format.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full border border-[#2391FF] bg-[#071321] text-[#2391FF] flex items-center justify-center text-xs font-bold shrink-0 z-10 shadow-sm">
                      2
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">
                        Academic Ledger Lookup
                      </h3>
                      <p className="text-[11px] text-[#8E9CAE] mt-0.5 leading-normal">
                        Fetches record from participating institution's verified data.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full border border-[#2391FF] bg-[#071321] text-[#2391FF] flex items-center justify-center text-xs font-bold shrink-0 z-10 shadow-sm">
                      3
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">
                        Cross-Institution Check
                      </h3>
                      <p className="text-[11px] text-[#8E9CAE] mt-0.5 leading-normal">
                        Detects duplicate or concurrent enrolments across campuses.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full border border-[#2391FF] bg-[#071321] text-[#2391FF] flex items-center justify-center text-xs font-bold shrink-0 z-10 shadow-sm">
                      4
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">
                        Intake Compliance
                      </h3>
                      <p className="text-[11px] text-[#8E9CAE] mt-0.5 leading-normal">
                        Validates against sanctioned programme intake limits.
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="relative flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full border border-[#2391FF] bg-[#071321] text-[#2391FF] flex items-center justify-center text-xs font-bold shrink-0 z-10 shadow-sm">
                      5
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">
                        Cryptographic Verification
                      </h3>
                      <p className="text-[11px] text-[#8E9CAE] mt-0.5 leading-normal">
                        Verifies record integrity using SHA-256 and ECDSA signatures (when available).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pink Sandbox Environment Callout Box */}
              <div className="mt-8 p-3.5 rounded-xl border border-[#F70063]/40 bg-[#16050e] flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-[#F70063] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F70063]">
                    Sandbox Environment
                  </h4>
                  <p className="text-[11px] text-[#C2CCD6] mt-0.5 leading-snug">
                    This is a demonstration environment. Not connected to the official live APAAR registry.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Main Verification Area */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* 3 Compact Overview Cards (Horizontal Row) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: APAAR Identity Check (Blue) */}
              <div className="rounded-xl p-3.5 bg-[#06121f]/90 border border-[#1b3d64] relative flex items-start gap-3 shadow-md">
                <Fingerprint className="w-9 h-9 text-[#2391FF] shrink-0 mt-0.5" />
                <div className="pr-6">
                  <h3 className="font-bold text-xs text-white leading-tight">
                    APAAR Identity Check
                  </h3>
                  <p className="text-[10px] text-[#8E9CAE] mt-0.5 leading-snug">
                    Format validation and structural verification
                  </p>
                </div>
                <span className="font-bold text-base text-[#2391FF] absolute top-3 right-3 font-mono-code">
                  01
                </span>
              </div>

              {/* Card 2: Cross-Campus Detection (Pink) */}
              <div className="rounded-xl p-3.5 bg-[#15050c]/90 border border-[#4d132b] relative flex items-start gap-3 shadow-md">
                <Share2 className="w-8 h-8 text-[#F70063] shrink-0 mt-0.5" />
                <div className="pr-6">
                  <h3 className="font-bold text-xs text-white leading-tight">
                    Cross-Campus Detection
                  </h3>
                  <p className="text-[10px] text-[#8E9CAE] mt-0.5 leading-snug">
                    Finds potential duplicate enrolments across institutions
                  </p>
                </div>
                <span className="font-bold text-base text-[#F70063] absolute top-3 right-3 font-mono-code">
                  02
                </span>
              </div>

              {/* Card 3: Intake Compliance (Yellow/Amber) */}
              <div className="rounded-xl p-3.5 bg-[#140f04]/90 border border-[#443510] relative flex items-start gap-3 shadow-md">
                <div className="w-8 h-8 flex items-end gap-1 shrink-0 mt-1 pb-1">
                  <div className="w-2 h-3.5 bg-[#FFCD54] rounded-xs" />
                  <div className="w-2 h-5 bg-[#FFCD54] rounded-xs" />
                  <div className="w-2 h-7 bg-[#FFCD54] rounded-xs" />
                </div>
                <div className="pr-6">
                  <h3 className="font-bold text-xs text-white leading-tight">
                    Intake Compliance
                  </h3>
                  <p className="text-[10px] text-[#8E9CAE] mt-0.5 leading-snug">
                    Validates against sanctioned programme capacity
                  </p>
                </div>
                <span className="font-bold text-base text-[#FFCD54] absolute top-3 right-3 font-mono-code">
                  03
                </span>
              </div>
            </div>

            {/* Main "Verify a student record" Card */}
            <div className="rounded-2xl bg-[#06080c] border border-[#182633] p-5 shadow-lg">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-[#2391FF]" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Verify a student record
                </h2>
              </div>
              <p className="text-xs text-[#8E9CAE] mt-1">
                Enter an APAAR identifier to review academic details and integrity status.
              </p>

              {/* Search input & Verify button on same row */}
              <form onSubmit={handleVerify} className="mt-4 flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#607286] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inputApaar}
                    onChange={(e) => setInputApaar(e.target.value)}
                    placeholder="Enter APAAR identifier..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#020407] border border-[#182633] text-xs font-mono-code text-white placeholder:text-[#506275] focus:outline-none focus:border-[#2391FF] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-6 py-2.5 rounded-xl bg-[#2391FF] hover:bg-[#1f80e0] text-white text-xs font-semibold flex items-center justify-center gap-2 shrink-0 transition-all shadow-sm disabled:opacity-50"
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

              {/* Sample Queries on Single Row */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] text-[#8E9CAE]">Sample queries:</span>
                <button
                  type="button"
                  onClick={() => selectSample('9024-8172-5501-IN')}
                  className="px-3 py-1 rounded-full border border-[#1b3d64] bg-[#071321] text-[#2391FF] font-mono-code text-[11px] hover:border-[#2391FF] transition-colors"
                >
                  9024-8172-5501-IN (Clean)
                </button>
                <button
                  type="button"
                  onClick={() => selectSample('3391-4412-8920-IN')}
                  className="px-3 py-1 rounded-full border border-[#4d132b] bg-[#15050c] text-[#F70063] font-mono-code text-[11px] hover:border-[#F70063] transition-colors"
                >
                  3391-4412-8920-IN (Collision)
                </button>
                <button
                  type="button"
                  onClick={() => selectSample('7721-1849-3382-IN')}
                  className="px-3 py-1 rounded-full border border-[#443510] bg-[#140f04] text-[#FFCD54] font-mono-code text-[11px] hover:border-[#FFCD54] transition-colors"
                >
                  7721-1849-3382-IN (Quota Alert)
                </button>
              </div>
            </div>

            {/* Verification Result Panel */}
            <div className="rounded-2xl bg-[#06080c] border border-[#182633] p-5 flex-1 min-h-[340px] shadow-lg flex flex-col">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Verification Result
                </h2>
              </div>
              <p className="text-xs text-[#8E9CAE] mt-0.5">
                Student record details, integrity checks, and compliance status will appear here.
              </p>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3.5 rounded-xl bg-[#F70063]/10 border border-[#F70063]/30 text-xs text-[#F70063] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Verification Error</div>
                    <div className="mt-0.5 text-gray-300">{error}</div>
                  </div>
                </div>
              )}

              {/* No record queried yet (Empty State) */}
              {!result && !error && (
                <div className="mt-4 rounded-xl border border-[#121c26] bg-[#020407]/40 py-16 flex flex-col items-center justify-center text-center px-4 flex-1">
                  <div className="w-14 h-14 rounded-full bg-[#0a1420] border border-[#182633] flex items-center justify-center mb-3.5 shadow-inner">
                    <Search className="w-6 h-6 text-[#6B7C90]" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    No record queried yet
                  </h3>
                  <p className="text-xs text-[#8E9CAE] mt-1">
                    Enter an APAAR ID above or use a{' '}
                    <button
                      type="button"
                      onClick={() => selectSample('9024-8172-5501-IN')}
                      className="text-[#2391FF] underline hover:text-[#52a8ff]"
                    >
                      sample query
                    </button>{' '}
                    to see verification results.
                  </p>
                </div>
              )}

              {/* Result Rendered Card */}
              {result && (
                <div className="mt-4 rounded-xl border border-[#182633] bg-[#020407] overflow-hidden shadow-inner text-xs">
                  {/* Result Header Status Banner */}
                  <div
                    className={`p-4 border-b border-[#182633] flex items-center justify-between ${
                      result.is_valid
                        ? 'bg-[#2391FF]/10'
                        : result.has_duplicate_collision
                        ? 'bg-[#F70063]/10'
                        : 'bg-[#FFCD54]/10'
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
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-white">
                            {result.is_valid
                              ? 'Academic Integrity Verified'
                              : result.has_duplicate_collision
                              ? 'Duplicate Enrolment Flagged'
                              : 'Intake Capacity Warning'}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-code ${
                              result.source_type === 'DATABASE_PERSISTED_LEDGER'
                                ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30'
                                : 'bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30'
                            }`}
                          >
                            {result.source_type === 'DATABASE_PERSISTED_LEDGER'
                              ? 'Authoritative Database Record'
                              : 'Sandbox Simulation'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8E9CAE] mt-0.5">
                          {result.adapter_mode} · Verified at{' '}
                          {new Date(result.timestamp).toLocaleTimeString()}
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
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-[#070a0e] border border-[#182633]">
                        <span className="text-[10px] font-semibold text-[#8E9CAE] uppercase block mb-1">
                          Student Candidate
                        </span>
                        <div className="text-base font-bold text-white">
                          {result.student_name}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#070a0e] border border-[#182633]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-[#8E9CAE] uppercase">
                            APAAR ID
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowFullApaar(!showFullApaar)}
                            className="text-[11px] text-[#2391FF] hover:underline flex items-center gap-1 font-medium"
                          >
                            {showFullApaar ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            <span>{showFullApaar ? 'Mask' : 'Reveal'}</span>
                          </button>
                        </div>
                        <div className="font-mono-code font-bold text-sm text-white">
                          {maskApaar(result.apaar_id)}
                        </div>
                      </div>
                    </div>

                    {/* Demographics & Classification */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-xl border border-[#182633] bg-[#070a0e]">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8E9CAE] uppercase">
                          <Calendar className="w-3.5 h-3.5 text-[#2391FF]" />
                          <span>Date of Birth</span>
                        </div>
                        <div className="font-semibold text-xs text-white mt-1">
                          {result.dob || '—'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl border border-[#182633] bg-[#070a0e]">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8E9CAE] uppercase">
                          <Award className="w-3.5 h-3.5 text-[#FFCD54]" />
                          <span>Category</span>
                        </div>
                        <div className="font-semibold text-xs text-[#FFCD54] mt-1">
                          {result.category || 'General'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl border border-[#182633] bg-[#070a0e]">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8E9CAE] uppercase">
                          <FileCheck className="w-3.5 h-3.5 text-[#F70063]" />
                          <span>Gender</span>
                        </div>
                        <div className="font-semibold text-xs text-white mt-1">
                          {result.gender || '—'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl border border-[#182633] bg-[#070a0e]">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8E9CAE] uppercase">
                          <Hash className="w-3.5 h-3.5 text-[#2391FF]" />
                          <span>Enrollment No</span>
                        </div>
                        <div className="font-mono-code font-bold text-xs text-white mt-1 truncate">
                          {result.enrollment_number || '—'}
                        </div>
                      </div>
                    </div>

                    {/* Institution & Programme */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border border-[#182633] bg-[#070a0e]">
                        <span className="text-[10px] font-semibold text-[#8E9CAE] uppercase block mb-0.5">
                          Institution
                        </span>
                        <div className="font-semibold text-white">
                          {result.institute}
                        </div>
                        <div className="text-[11px] font-mono-code text-[#6B7C90] mt-0.5">
                          {result.institute_code}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-[#182633] bg-[#070a0e]">
                        <span className="text-[10px] font-semibold text-[#8E9CAE] uppercase block mb-0.5">
                          Programme &amp; Year
                        </span>
                        <div className="font-semibold text-white">
                          {result.programme}
                        </div>
                        <div className="text-[11px] text-[#6B7C90] mt-0.5">
                          Session: {result.admission_year}
                        </div>
                      </div>
                    </div>

                    {/* Integrity Analysis Details */}
                    <div className="p-3.5 rounded-xl bg-[#070a0e] border border-[#182633]">
                      <span className="text-[10px] font-semibold uppercase text-[#8E9CAE] block mb-1">
                        Findings &amp; Integrity Analysis
                      </span>
                      <p className="text-xs text-gray-200 leading-relaxed">
                        {result.details}
                      </p>
                    </div>

                    {/* Verification Receipt Hash */}
                    <div className="p-3 rounded-xl border border-[#182633] bg-[#070a0e] space-y-1 font-mono-code text-[11px]">
                      <div className="flex items-center justify-between text-[#8E9CAE]">
                        <span>Verification Receipt Hash</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(result.merkle_root)}
                          className="hover:text-[#2391FF] flex items-center gap-1 transition-colors"
                        >
                          {copied ? (
                            <Check className="w-3.5 h-3.5 text-[#2391FF]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="text-white truncate font-semibold">
                        {result.merkle_root}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Verification Sidebar */}
          <div className="w-full lg:w-[305px] xl:w-[325px] shrink-0 flex flex-col gap-4">
            {/* Top Card: Verification Checklist */}
            <div className="rounded-2xl bg-[#06080c] border border-[#182633] p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-3.5">
                <CheckSquare className="w-4 h-4 text-[#2391FF]" />
                <h3 className="font-bold text-xs text-white tracking-tight">
                  Verification Checklist
                </h3>
              </div>

              <div className="space-y-3">
                {/* Check 1 (Blue) */}
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#2391FF] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white leading-tight">
                      APAAR format validation
                    </h4>
                    <p className="text-[10px] text-[#8E9CAE] mt-0.5">
                      Validates identifier structure
                    </p>
                  </div>
                </div>

                {/* Check 2 (Blue) */}
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#2391FF] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white leading-tight">
                      Academic ledger lookup
                    </h4>
                    <p className="text-[10px] text-[#8E9CAE] mt-0.5">
                      Retrieves record from institution
                    </p>
                  </div>
                </div>

                {/* Check 3 (Pink) */}
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#F70063] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white leading-tight">
                      Cross-institution duplicate check
                    </h4>
                    <p className="text-[10px] text-[#8E9CAE] mt-0.5">
                      Detects concurrent enrolments
                    </p>
                  </div>
                </div>

                {/* Check 4 (Yellow) */}
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#FFCD54] text-[#050914] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">
                    4
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white leading-tight">
                      Intake capacity compliance
                    </h4>
                    <p className="text-[10px] text-[#8E9CAE] mt-0.5">
                      Compares against sanctioned limits
                    </p>
                  </div>
                </div>

                {/* Check 5 (Blue) */}
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#2391FF] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">
                    5
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white leading-tight">
                      Cryptographic signature verification
                    </h4>
                    <p className="text-[10px] text-[#8E9CAE] mt-0.5">
                      Validates record integrity (when available)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Card: Recent Verifications */}
            <div className="rounded-2xl bg-[#06080c] border border-[#182633] p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2391FF]" />
                  <h3 className="font-bold text-xs text-white tracking-tight">
                    Recent Verifications
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => selectSample('9024-8172-5501-IN')}
                  className="text-[11px] font-semibold text-[#2391FF] hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5">
                {recentVerifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectSample(item.apaar_raw)}
                    className="w-full flex items-center justify-between text-left p-1 rounded-lg hover:bg-[#0c141e] transition-colors group"
                  >
                    <span className="font-mono-code text-[11px] text-gray-300 group-hover:text-white transition-colors">
                      {item.masked}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono-code ${
                          item.status === 'CLEAN'
                            ? 'border border-[#2391FF]/40 text-[#2391FF] bg-[#2391FF]/10'
                            : item.status === 'COLLISION'
                            ? 'border border-[#F70063]/40 text-[#F70063] bg-[#F70063]/10'
                            : 'border border-[#FFCD54]/40 text-[#FFCD54] bg-[#FFCD54]/10'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-[10px] text-[#607286] w-16 text-right shrink-0">
                        {item.timeAgo}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Card: Status Legend */}
            <div className="rounded-2xl bg-[#06080c] border border-[#182633] p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 flex items-end gap-0.5 text-[#2391FF]">
                  <div className="w-1 h-2 bg-[#2391FF] rounded-xs" />
                  <div className="w-1 h-3 bg-[#2391FF] rounded-xs" />
                  <div className="w-1 h-4 bg-[#2391FF] rounded-xs" />
                </div>
                <h3 className="font-bold text-xs text-white tracking-tight">
                  Status Legend
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {/* Clean */}
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2391FF] shrink-0" />
                  <span className="font-semibold text-xs text-white w-20 shrink-0">
                    Clean
                  </span>
                  <span className="text-[11px] text-[#8E9CAE]">
                    Valid record, no issues found
                  </span>
                </div>

                {/* Collision */}
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F70063] shrink-0" />
                  <span className="font-semibold text-xs text-white w-20 shrink-0">
                    Collision
                  </span>
                  <span className="text-[11px] text-[#8E9CAE]">
                    Potential duplicate enrolment
                  </span>
                </div>

                {/* Quota Alert */}
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFCD54] shrink-0" />
                  <span className="font-semibold text-xs text-white w-20 shrink-0">
                    Quota Alert
                  </span>
                  <span className="text-[11px] text-[#8E9CAE]">
                    Exceeds sanctioned intake capacity
                  </span>
                </div>

                {/* Not Found */}
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#6B7280] shrink-0" />
                  <span className="font-semibold text-xs text-white w-20 shrink-0">
                    Not Found
                  </span>
                  <span className="text-[11px] text-[#8E9CAE]">
                    No record in participating ledger
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
