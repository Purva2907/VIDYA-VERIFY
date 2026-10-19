import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  CopyX,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  FileCheck,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';

interface VerificationResult {
  apaarId: string;
  studentName: string;
  institute: string;
  instituteCode: string;
  programme: string;
  admissionYear: string;
  status: 'valid' | 'duplicate_collision' | 'intake_exceeded' | 'invalid_checksum';
  merkleRoot: string;
  ecdsaSig: string;
  timestamp: string;
  details: string;
}

export const VerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [inputApaar, setInputApaar] = useState(searchParams.get('apaar') || '9024-8172-5501-IN');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const mockDatabase: Record<string, VerificationResult> = {
    '9024-8172-5501-IN': {
      apaarId: '9024-8172-5501-IN',
      studentName: 'Aarav V. Suryavanshi',
      institute: 'Indian Institute of Technology, Delhi',
      instituteCode: 'IND-AICTE-1042',
      programme: 'B.Tech in Computer Science & AI',
      admissionYear: '2023-2027',
      status: 'valid',
      merkleRoot: '0x99238E10BC4489DF11234858900ACDB30',
      ecdsaSig: '0x8F72B4DE99A1C09A11FE848911C49A098E',
      timestamp: new Date().toISOString(),
      details: 'All integrity checks passed. Zero duplicate enrolment collisions detected. Institute intake quota verified within limits (120/120).',
    },
    '3391-4412-8920-IN': {
      apaarId: '3391-4412-8920-IN',
      studentName: 'Priya N. Kulkarni',
      institute: 'Mumbai Tech University // Delhi Tech Campus',
      instituteCode: 'COLLISION: DEL/MUM',
      programme: 'B.Tech Information Technology',
      admissionYear: '2024-2028',
      status: 'duplicate_collision',
      merkleRoot: '0x4488A019DF77C3908811AA223399BCDE',
      ecdsaSig: '0xCOLLISION_ALERT_HASH_00994411',
      timestamp: new Date().toISOString(),
      details: 'CRITICAL DUPLICATE DETECTED: This APAAR ID is registered in two simultaneous full-time technical programmes across different universities without dual-degree AICTE authorization.',
    },
    '7721-1049-3382-IN': {
      apaarId: '7721-1049-3382-IN',
      studentName: 'Rohan M. Nair',
      institute: 'Southern Institute of Engineering, Bangalore',
      instituteCode: 'IND-AICTE-4891',
      programme: 'B.Tech Electronics & Communication',
      admissionYear: '2024-2028',
      status: 'intake_exceeded',
      merkleRoot: '0x8899FFAA112233445566778899AABBCC',
      ecdsaSig: '0xINTAKE_CAP_EXCEEDED_124_OF_120',
      timestamp: new Date().toISOString(),
      details: 'SANCTIONED INTAKE EXCEEDED: The admitting institution has registered 124 students against an approved AICTE quota cap of 120 seats. Requires Regulatory Bureau review.',
    },
  };

  const executeVerification = (idToVerify: string) => {
    setIsVerifying(true);
    setResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      const clean = idToVerify.trim();
      if (mockDatabase[clean]) {
        setResult(mockDatabase[clean]);
      } else {
        // Fallback simulated result
        setResult({
          apaarId: clean,
          studentName: 'Simulated Candidate Record',
          institute: 'AICTE Accredited Engineering College',
          instituteCode: 'IND-DEMO-001',
          programme: 'B.Tech Standard Programme',
          admissionYear: '2024-2028',
          status: 'valid',
          merkleRoot: '0xSIMULATED_MERKLE_ROOT_77889900',
          ecdsaSig: '0xSIMULATED_ECDSA_SIGNATURE_5566',
          timestamp: new Date().toISOString(),
          details: 'Demonstration verification generated via Sandbox Adapter. Synthetic record evaluated successfully.',
        });
      }
    }, 800);
  };

  useEffect(() => {
    if (inputApaar) {
      executeVerification(inputApaar);
    }
  }, []);

  const handleCopyHash = () => {
    if (result) {
      navigator.clipboard.writeText(result.ecdsaSig);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050914] text-[#F8FAFC] selection:bg-[#2391FF]/30 selection:text-white relative">
      <GlassNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2391FF]/15 border border-[#2391FF]/30 text-[#2391FF] text-xs font-mono-code mb-3 shadow-[0_0_15px_rgba(35,145,255,0.2)]">
            <QrCode className="w-3.5 h-3.5" />
            <span>AICTE APAAR INTEGRITY ENGINE · SANDBOX VERIFIER</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Academic Record &amp; QR Verifier
          </h1>
          <p className="text-xs sm:text-sm text-[#A6B4CC] mt-2">
            Verify sovereign student credentials, inspect cryptographic Merkle proofs, and detect multi-institution collisions instantly.
          </p>
        </div>

        {/* Verifier Query Input Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeVerification(inputApaar);
            }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputApaar}
                onChange={(e) => setInputApaar(e.target.value)}
                placeholder="Enter 12-Digit APAAR ID (e.g. 9024-8172-5501-IN)"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#080F20] border border-white/10 text-xs sm:text-sm font-mono-code text-white placeholder:text-slate-500 focus:outline-none focus:border-[#2391FF]"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-mono-code text-xs font-bold text-[#050914] bg-[#2391FF] hover:bg-[#4ea6ff] shadow-[0_0_20px_rgba(35,145,255,0.4)] transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isVerifying ? 'Scanning Registry...' : 'Verify Credential'}</span>
            </button>
          </form>

          {/* Preset Evaluation Scenarios */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs font-mono-code">
            <span className="text-slate-400 text-[11px]">Evaluation Presets:</span>
            <button
              type="button"
              onClick={() => {
                setInputApaar('9024-8172-5501-IN');
                executeVerification('9024-8172-5501-IN');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#2391FF]/10 text-[#60A5FA] border border-[#2391FF]/30 hover:bg-[#2391FF]/20"
            >
              Clean Valid Student
            </button>
            <button
              type="button"
              onClick={() => {
                setInputApaar('3391-4412-8920-IN');
                executeVerification('3391-4412-8920-IN');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#F70063]/10 text-[#FF4D8D] border border-[#F70063]/30 hover:bg-[#F70063]/20"
            >
              Duplicate Collision Flag
            </button>
            <button
              type="button"
              onClick={() => {
                setInputApaar('7721-1049-3382-IN');
                executeVerification('7721-1049-3382-IN');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#FFCD54]/10 text-[#FFCD54] border border-[#FFCD54]/30 hover:bg-[#FFCD54]/20"
            >
              Intake Quota Exceeded
            </button>
          </div>
        </div>

        {/* Verification Result Dossier */}
        {result && (
          <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative animate-fadeIn">
            {/* Status Header Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
                    result.status === 'valid'
                      ? 'bg-[#2391FF]/20 border-[#2391FF]/50 text-[#2391FF]'
                      : result.status === 'duplicate_collision'
                      ? 'bg-[#F70063]/20 border-[#F70063]/50 text-[#F70063]'
                      : 'bg-[#FFCD54]/20 border-[#FFCD54]/50 text-[#FFCD54]'
                  }`}
                >
                  {result.status === 'valid' && <CheckCircle2 className="w-6 h-6" />}
                  {result.status === 'duplicate_collision' && <CopyX className="w-6 h-6" />}
                  {result.status === 'intake_exceeded' && <AlertTriangle className="w-6 h-6" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono-code font-bold uppercase tracking-wider ${
                        result.status === 'valid'
                          ? 'text-[#2391FF]'
                          : result.status === 'duplicate_collision'
                          ? 'text-[#F70063]'
                          : 'text-[#FFCD54]'
                      }`}
                    >
                      {result.status === 'valid' && 'CRYPTOGRAPHICALLY VALID CREDENTIAL'}
                      {result.status === 'duplicate_collision' && 'CRITICAL DUPLICATE COLLISION DETECTED'}
                      {result.status === 'intake_exceeded' && 'APPROVED INTAKE QUOTA EXCEEDED'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-0.5">{result.studentName}</h2>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
                  title="Print Verification Receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-code text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#FFF83F]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Signature'}</span>
                </button>
              </div>
            </div>

            {/* Credential Data Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 text-xs font-mono-code">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-slate-400 block mb-1">SOVEREIGN APAAR IDENTIFIER</span>
                <span className="text-base font-bold text-[#2391FF]">{result.apaarId}</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-slate-400 block mb-1">ACADEMIC PROGRAMME</span>
                <span className="text-base font-bold text-white">{result.programme}</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-slate-400 block mb-1">AFFILIATED INSTITUTION</span>
                <span className="text-sm font-semibold text-white font-sans">{result.institute}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Code: {result.instituteCode}</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-slate-400 block mb-1">ADMISSION SESSION</span>
                <span className="text-base font-bold text-[#FFF83F]">{result.admissionYear}</span>
              </div>
            </div>

            {/* Diagnostic Details Banner */}
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                result.status === 'valid'
                  ? 'bg-[#2391FF]/10 border-[#2391FF]/30 text-slate-200'
                  : result.status === 'duplicate_collision'
                  ? 'bg-[#F70063]/15 border-[#F70063]/40 text-[#FFB4AB]'
                  : 'bg-[#FFCD54]/10 border-[#FFCD54]/30 text-[#FFCD54]'
              }`}
            >
              <strong>Integrity Engine Finding:</strong> {result.details}
            </div>

            {/* Cryptographic Ledger Proofs Box */}
            <div className="mt-6 p-4 rounded-2xl bg-[#080F20] border border-white/10 text-xs font-mono-code space-y-2">
              <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-2">
                Cryptographic Ledger Signatures (ECDSA &amp; Merkle Root)
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
                <span className="text-slate-400">Merkle Root:</span>
                <span className="text-[#60A5FA] break-all">{result.merkleRoot}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
                <span className="text-slate-400">ECDSA Signature:</span>
                <span className="text-[#FFF83F] break-all">{result.ecdsaSig}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
                <span className="text-slate-400">Verification Timestamp:</span>
                <span className="text-slate-300">{result.timestamp}</span>
              </div>
            </div>

            {/* Regulatory Sandbox Disclaimer */}
            <div className="mt-6 text-center text-[11px] text-slate-500 font-mono-code">
              DEMO ENVIRONMENT · SANDBOX VERIFICATION. Uses synthetic test records to demonstrate adapter architecture.
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
