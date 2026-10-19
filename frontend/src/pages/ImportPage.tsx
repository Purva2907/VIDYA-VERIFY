import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  CopyX,
  AlertTriangle,
  Download,
  ShieldCheck,
  ArrowRight,
  Database,
  FileText,
} from 'lucide-react';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';

interface ParsedRecord {
  apaarId: string;
  name: string;
  programme: string;
  quotaYear: string;
  status: 'valid' | 'duplicate_collision' | 'intake_warning';
  notes: string;
}

export const ImportPage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [records, setRecords] = useState<ParsedRecord[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const sampleCsvContent = `APAAR_ID,STUDENT_NAME,INSTITUTE_CODE,PROGRAMME,ADMISSION_YEAR
9024-8172-5501-IN,Aarav V. Suryavanshi,IND-AICTE-1042,B.Tech Computer Science,2024
3391-4412-8920-IN,Priya N. Kulkarni,IND-AICTE-3391,B.Tech Information Technology,2024
7721-1049-3382-IN,Rohan M. Nair,IND-AICTE-4891,B.Tech Electronics & Comm,2024
5512-9014-2281-IN,Ananya S. Iyer,IND-AICTE-2204,B.Tech Mechanical Engg,2024
8834-1120-7463-IN,Vikramaditya Rao,IND-AICTE-3109,B.Tech Electrical Engg,2024`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'AICTE_Enrolment_Template_Sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateUpload = (name: string) => {
    setFileName(name);
    setIsProcessing(true);
    setRecords(null);

    setTimeout(() => {
      setIsProcessing(false);
      setRecords([
        {
          apaarId: '9024-8172-5501-IN',
          name: 'Aarav V. Suryavanshi',
          programme: 'B.Tech Computer Science & AI',
          quotaYear: '2024-25',
          status: 'valid',
          notes: 'Format valid. Luhn checksum passed. Clean registry match.',
        },
        {
          apaarId: '3391-4412-8920-IN',
          name: 'Priya N. Kulkarni',
          programme: 'B.Tech Information Technology',
          quotaYear: '2024-25',
          status: 'duplicate_collision',
          notes: 'Collision: Identical APAAR actively registered in Mumbai Tech Univ.',
        },
        {
          apaarId: '7721-1049-3382-IN',
          name: 'Rohan M. Nair',
          programme: 'B.Tech Electronics & Comm.',
          quotaYear: '2024-25',
          status: 'intake_warning',
          notes: 'Quota Alert: Admission brings enrolled count to 121/120 cap.',
        },
        {
          apaarId: '5512-9014-2281-IN',
          name: 'Ananya S. Iyer',
          programme: 'B.Tech Mechanical Engineering',
          quotaYear: '2024-25',
          status: 'valid',
          notes: 'Format valid. Seat within approved intake (90/90).',
        },
        {
          apaarId: '8834-1120-7463-IN',
          name: 'Vikramaditya Rao',
          programme: 'B.Tech Electrical & Electronics',
          quotaYear: '2024-25',
          status: 'valid',
          notes: 'Format valid. Zero collisions recorded.',
        },
      ]);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#050914] text-[#F8FAFC] selection:bg-[#2391FF]/30 selection:text-white relative">
      <GlassNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2391FF]/15 border border-[#2391FF]/30 text-[#2391FF] text-xs font-mono-code mb-3 shadow-[0_0_15px_rgba(35,145,255,0.2)]">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>AICTE INTAKE ENFORCEMENT ENGINE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Bulk Enrolment CSV Ingestion
          </h1>
          <p className="text-xs sm:text-sm text-[#A6B4CC] mt-2">
            Upload institutional student admission manifests. The Integrity Engine performs instant batch APAAR validation, dual-enrolment collision detection, and intake quota calculation.
          </p>
        </div>

        {/* Upload Zone & Download Template */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl mb-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-[#2391FF]/10 border border-[#2391FF]/30 flex items-center justify-center mb-4 text-[#2391FF] shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-white mb-1">
            Drag &amp; Drop Student Manifest CSV
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-6">
            Supports UTF-8 formatted CSV files containing student APAAR identifiers, personal details, admitted programme, and session codes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleSimulateUpload('AICTE_Admissions_Batch_2024_25.csv')}
              disabled={isProcessing}
              className="px-6 py-3 rounded-2xl bg-[#2391FF] hover:bg-[#4ea6ff] text-[#050914] text-xs font-mono-code font-bold shadow-[0_0_20px_rgba(35,145,255,0.4)] transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isProcessing ? 'Parsing & Scanning...' : 'Process Demo Manifest CSV'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-code text-white transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#FFF83F]" />
              <span>Download CSV Template</span>
            </button>
          </div>

          {fileName && (
            <div className="mt-4 text-xs font-mono-code text-[#2391FF] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>File Selected: {fileName}</span>
            </div>
          )}
        </div>

        {/* Ingestion Results Table */}
        {records && (
          <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl animate-fadeIn">
            {/* Batch Summary Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 mb-6 border-b border-white/10 text-xs font-mono-code">
              <div className="p-4 rounded-2xl bg-[#2391FF]/10 border border-[#2391FF]/30">
                <span className="text-slate-400 block mb-1">RECORDS VALIDATED</span>
                <span className="text-2xl font-bold text-white">5 Records Processed</span>
                <span className="text-[10px] text-[#2391FF] block mt-1">3 Clean &amp; Approved</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F70063]/10 border border-[#F70063]/30">
                <span className="text-slate-400 block mb-1">DUPLICATE COLLISIONS</span>
                <span className="text-2xl font-bold text-[#F70063]">1 Collision Flagged</span>
                <span className="text-[10px] text-[#FF4D8D] block mt-1">Multi-campus dual enrolment</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFCD54]/10 border border-[#FFCD54]/30">
                <span className="text-slate-400 block mb-1">INTAKE CAP ALERTS</span>
                <span className="text-2xl font-bold text-[#FFCD54]">1 Quota Warning</span>
                <span className="text-[10px] text-[#FFCD54] block mt-1">Sanctioned seats exceeded</span>
              </div>
            </div>

            {/* Ingestion Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code">
                <thead className="bg-[#080F20] text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">APAAR ID</th>
                    <th className="py-3 px-4">Student Candidate</th>
                    <th className="py-3 px-4">Programme</th>
                    <th className="py-3 px-4">Integrity Status</th>
                    <th className="py-3 px-4">Validation Finding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {records.map((r) => (
                    <tr key={r.apaarId} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-bold text-white">{r.apaarId}</td>
                      <td className="py-3 px-4 font-sans text-white">{r.name}</td>
                      <td className="py-3 px-4 text-slate-300 font-sans">{r.programme}</td>
                      <td className="py-3 px-4">
                        {r.status === 'valid' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2391FF]/15 text-[#2391FF] border border-[#2391FF]/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            APPROVED
                          </span>
                        )}
                        {r.status === 'duplicate_collision' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F70063]/15 text-[#F70063] border border-[#F70063]/30 inline-flex items-center gap-1">
                            <CopyX className="w-3 h-3" />
                            COLLISION
                          </span>
                        )}
                        {r.status === 'intake_warning' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            CAP WARNING
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans text-xs">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs font-mono-code">
              <span className="text-slate-400">Batch Hash: 0xBATCH_MANIFEST_7729_A90</span>
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-[#2391FF] text-[#050914] font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(35,145,255,0.4)]"
              >
                <span>Commit to Regulatory Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
