import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { StudentRecord, BatchImportSummary } from '../services/api';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  CopyX,
  AlertTriangle,
  Download,
  ShieldCheck,
  ArrowRight,
  Loader2,
  FileText,
  AlertCircle,
  LayoutDashboard,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

export const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchImportSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleCsvContent = `student_name,email,institution_name,institution_code,course,academic_year,apaar_id,enrollment_number,verification_status
Aarav V. Suryavanshi,aarav.surya@dit.ac.in,Delhi Institute of Technology,IND-AICTE-1042,B.Tech Computer Science,2024-2028,9024-8172-5501-IN,ENR-2024-001,pending
Priya N. Kulkarni,priya.k@mtu.edu.in,Mumbai Technical University,IND-AICTE-3391,B.Tech Information Technology,2024-2028,3391-4412-8920-IN,ENR-2024-002,pending
Rohan M. Nair,rohan.nair@sie.ac.in,Southern Institute of Engineering,IND-AICTE-4891,B.Tech Electronics & Communication,2024-2028,7721-1049-3382-IN,ENR-2024-003,pending
Ananya S. Iyer,ananya.iyer@nitt.edu,National Institute of Technology Trichy,IND-AICTE-2204,B.Tech Mechanical Engineering,2024-2028,5512-9014-2281-IN,ENR-2024-004,pending
Vikramaditya Rao,vikram.rao@kec.edu.in,Kolkata Engineering College,IND-AICTE-3109,B.Tech Electrical & Electronics,2024-2028,8834-1120-7463-IN,ENR-2024-005,pending
Meera Sundaram,meera.s@dit.ac.in,Delhi Institute of Technology,IND-AICTE-1042,B.Tech Artificial Intelligence,2024-2028,1102-4490-7812-IN,ENR-2024-006,pending`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'AICTE_Student_Enrolment_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Robust RFC-4180 CSV row parser: handles quoted fields with internal commas and double quotes.
   */
  const parseCsvRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCsvText = (csvText: string) => {
    // Strip UTF-8 BOM if present
    const cleanText = csvText.replace(/^\uFEFF/, '').trim();
    const lines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      throw new Error('CSV file must have a header row and at least one student record.');
    }

    const headers = parseCsvRow(lines[0]).map((h) => h.toLowerCase().replace(/['"]+/g, '').trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = parseCsvRow(lines[i]);
      if (parts.length === 0 || (parts.length === 1 && !parts[0])) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] ? parts[idx].replace(/^["']|["']$/g, '').trim() : '';
      });

      // Map accurately from standard 9 headers or legacy variations
      const apaar = row['apaar_id'] || row['apaar'] || row['apaarid'] || '';
      const name = row['student_name'] || row['name'] || row['candidate_name'] || '';
      const email = row['email'] || row['student_email'] || row['mail'] || '';
      const instName = row['institution_name'] || row['institute_name'] || row['college_name'] || '';
      const instCode = row['institution_code'] || row['institute_code'] || row['college_code'] || '';
      const course = row['course'] || row['programme'] || row['program'] || '';
      const acadYear = row['academic_year'] || row['admission_year'] || row['session'] || '';
      const enrollNum = row['enrollment_number'] || row['enrollment_no'] || row['roll_no'] || '';
      const status = row['verification_status'] || row['status'] || '';

      records.push({
        apaar_id: apaar,
        student_name: name,
        email: email,
        institution_name: instName,
        institution_code: instCode,
        course: course,
        academic_year: acadYear,
        enrollment_number: enrollNum,
        verification_status: status,
      });
    }

    if (records.length === 0) {
      throw new Error('No valid student rows found in the uploaded CSV.');
    }

    return records;
  };

  const processRecords = async (records: any[], name: string) => {
    setFileName(name);
    setIsProcessing(true);
    setError(null);
    setBatchResult(null);

    try {
      const summary = await api.importBatch(records);
      setBatchResult(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to process import batch.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsvText(text);
        await processRecords(parsed, file.name);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSampleImport = async () => {
    const parsed = parseCsvText(sampleCsvContent);
    await processRecords(parsed, 'Sample_Admissions_Template.csv');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] transition-colors">
      <GlassNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/25 text-[var(--color-brand-blue)] text-xs font-semibold mb-3">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>AICTE Student Ledger Ingestion</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Import Student Enrolment Batch
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-2">
            Upload institutional student admission CSV files. The Integrity Engine validates APAAR structures,
            persists student details, detects concurrent campus collisions, and updates existing records in real time.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="app-card p-8 shadow-xl mb-8 flex flex-col items-center justify-center text-center relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h2 className="text-lg font-bold mb-1">
            Choose CSV File to Upload
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-lg mb-6">
            Supports UTF-8 CSV containing standard headers: <code className="font-mono-code font-bold text-[var(--color-brand-blue)]">student_name, email, institution_name, institution_code, course, academic_year, apaar_id, enrollment_number, verification_status</code>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Browse CSV File</span>
            </button>

            <button
              type="button"
              onClick={handleSampleImport}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-xs font-semibold hover:border-[var(--color-brand-blue)] transition-colors flex items-center gap-2"
            >
              <span>Import 6 Sample Records</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-4 py-2.5 rounded-xl border border-[var(--color-border-subtle)] text-xs font-semibold hover:bg-[var(--color-surface-hover)] transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[var(--color-brand-yellow)]" />
              <span>Download Template</span>
            </button>
          </div>

          {fileName && (
            <div className="mt-4 text-xs font-mono-code text-[var(--color-text-secondary)]">
              Selected: <span className="font-semibold text-[var(--color-text-primary)]">{fileName}</span>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {isProcessing && (
          <div className="app-card p-12 text-center flex flex-col items-center gap-3 my-6">
            <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
            <h3 className="text-sm font-semibold">Processing &amp; Evaluating Enrolment Batch...</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Cross-referencing APAAR records, evaluating collisions, and persisting records into the student ledger...
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/30 text-xs text-[var(--color-brand-pink)] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Import Processing Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Batch Results */}
        {batchResult && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="app-card p-4">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
                  Total Processed
                </span>
                <span className="text-2xl font-bold font-mono-code text-[var(--color-text-primary)]">
                  {batchResult.total_records}
                </span>
              </div>
              <div className="app-card p-4">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
                  New Created
                </span>
                <span className="text-2xl font-bold font-mono-code text-[var(--color-brand-blue)]">
                  {batchResult.created}
                </span>
              </div>
              <div className="app-card p-4">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
                  Updated Existing
                </span>
                <span className="text-2xl font-bold font-mono-code text-[#22c55e]">
                  {batchResult.updated}
                </span>
              </div>
              <div className="app-card p-4">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
                  Duplicate Collisions
                </span>
                <span className="text-2xl font-bold font-mono-code text-[var(--color-brand-pink)]">
                  {batchResult.duplicate_collisions}
                </span>
              </div>
              <div className="app-card p-4">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
                  Intake Warnings
                </span>
                <span className="text-2xl font-bold font-mono-code text-[var(--color-brand-amber)]">
                  {batchResult.intake_warnings}
                </span>
              </div>
              <div className="app-card p-4">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
                  Skipped / Errors
                </span>
                <span className={`text-2xl font-bold font-mono-code ${batchResult.skipped > 0 ? 'text-[var(--color-brand-pink)]' : 'text-[var(--color-text-muted)]'}`}>
                  {batchResult.skipped}
                </span>
              </div>
            </div>

            {/* Validation Errors Notice */}
            {batchResult.errors && batchResult.errors.length > 0 && (
              <div className="p-4 rounded-xl bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/30 text-xs">
                <div className="flex items-center gap-2 font-bold text-[var(--color-brand-pink)] mb-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Validation Warnings ({batchResult.errors.length} Row{batchResult.errors.length > 1 ? 's' : ''} Skipped):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)] pl-2">
                  {batchResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Imported Records Table */}
            <div className="app-card overflow-hidden">
              <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Persisted Student Records</h3>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    All valid records have been saved into the active database ledger and are visible on the dashboard.
                  </p>
                </div>
                <Link
                  to="/dashboard"
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>View in Dashboard</span>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Student &amp; Email</th>
                      <th className="py-3 px-4">APAAR &amp; Enrolment</th>
                      <th className="py-3 px-4">Institution / Campus</th>
                      <th className="py-3 px-4">Course &amp; Session</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Verification Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {batchResult.records.map((r, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[var(--color-text-primary)]">
                            {r.student_name}
                          </div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">
                            {r.email || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono-code">
                          <div className="text-[var(--color-text-secondary)] font-semibold">
                            {r.apaar_id}
                          </div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">
                            {r.enrollment_number || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[var(--color-text-primary)]">
                            {r.institution_name || r.institute_name}
                          </div>
                          <div className="text-[10px] font-mono-code text-[var(--color-text-muted)]">
                            {r.institution_code || r.institute_code}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[var(--color-text-primary)] font-medium">
                            {r.course || r.programme}
                          </div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">
                            {r.academic_year || r.admission_year}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {r.integrity_status === 'verified' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2391FF]/10 text-[#2391FF] border border-[#2391FF]/25">
                              Verified
                            </span>
                          )}
                          {r.integrity_status === 'duplicate' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F70063]/10 text-[#F70063] border border-[#F70063]/25">
                              Duplicate
                            </span>
                          )}
                          {r.integrity_status === 'warning' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30">
                              Quota Warning
                            </span>
                          )}
                          {r.integrity_status === 'pending' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-[var(--color-text-secondary)] max-w-xs truncate">
                          {r.notes || 'Clean record'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
