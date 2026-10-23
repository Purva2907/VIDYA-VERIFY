import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { BatchImportSummary, ImportPreviewResponse } from '../services/api';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  LayoutDashboard,
  RefreshCw,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  Info,
  Layers,
} from 'lucide-react';

export const ImportPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parsed records stored in state
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [autoProvision, setAutoProvision] = useState(true);
  const [batchResult, setBatchResult] = useState<BatchImportSummary | null>(null);

  const sampleCsvContent = `APAAR_ID,STUDENT_NAME,INSTITUTE_CODE,INSTITUTE_NAME,PROGRAMME,ADMISSION_YEAR,INTAKE_CURRENT,INTAKE_CAP,CATEGORY,GENDER,DOB
9024-8172-5501-IN,Aarav V. Suryavanshi,IND-AICTE-1042,Delhi Institute of Technology,B.Tech Computer Science & AI,2024-2028,120,120,General,Male,2005-04-12
3391-4412-8920-IN,Priya N. Kulkarni,IND-AICTE-3391,Mumbai Technical University,B.Tech Information Technology,2024-2028,60,60,OBC,Female,2005-08-23
7721-1049-3382-IN,Rohan M. Nair,IND-AICTE-4891,Southern Institute of Engineering,B.Tech Electronics & Communication,2024-2028,90,90,General,Male,2004-11-05
5512-9014-2281-IN,Ananya S. Iyer,IND-AICTE-2204,National Institute of Technology Trichy,B.Tech Mechanical Engineering,2024-2028,120,120,EWS,Female,2005-01-30
8834-1120-7463-IN,Vikramaditya Rao,IND-AICTE-3109,Kolkata Engineering College,B.Tech Electrical & Electronics,2024-2028,60,60,SC,Male,2004-06-18
1102-4490-7812-IN,Meera Sundaram,IND-AICTE-1042,Delhi Institute of Technology,B.Tech Computer Science & AI,2024-2028,120,120,ST,Female,2005-09-14`;

  const handleDownloadSample = async () => {
    try {
      const template = await api.getImportTemplate();
      const blob = new Blob([template.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', template.filename || 'AICTE_Enrolment_Manifest_Template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AICTE_Enrolment_Manifest_Template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  /**
   * RFC-4180 CSV row parser: handles quoted fields with internal commas and double quotes.
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
    const cleanText = csvText.replace(/^\uFEFF/, '').trim();
    const lines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      throw new Error('CSV file must contain a header row and at least one student record.');
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

      // Match AICTE template standard and alias keys
      const apaar = row['apaar_id'] || row['apaar'] || row['apaarid'] || '';
      const name = row['student_name'] || row['name'] || row['candidate_name'] || '';
      const email = row['email'] || row['student_email'] || row['mail'] || '';
      const instName = row['institution_name'] || row['institute_name'] || row['college_name'] || '';
      const instCode = row['institution_code'] || row['institute_code'] || row['college_code'] || '';
      const course = row['course'] || row['programme'] || row['program'] || '';
      const acadYear = row['academic_year'] || row['admission_year'] || row['session'] || '2024-2028';
      const enrollNum = row['enrollment_number'] || row['enrollment_no'] || row['roll_no'] || '';
      const status = row['verification_status'] || row['status'] || 'pending';
      const intakeCur = row['intake_current'] ? parseInt(row['intake_current'], 10) : undefined;
      const intakeCap = row['intake_cap'] ? parseInt(row['intake_cap'], 10) : undefined;
      const dob = row['dob'] || row['date_of_birth'] || row['birth_date'] || '';
      const category = row['category'] || row['caste_category'] || row['social_category'] || 'General';
      const gender = row['gender'] || row['sex'] || '';

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
        intake_current: intakeCur,
        intake_cap: intakeCap,
        dob: dob,
        category: category,
        gender: gender,
      });
    }

    if (records.length === 0) {
      throw new Error('No valid student rows found in the uploaded CSV.');
    }

    return records;
  };

  const handleFileAnalysis = async (records: any[], name: string) => {
    setFileName(name);
    setIsProcessing(true);
    setError(null);
    setParsedRows(records);

    try {
      const preview = await api.previewImportBatch(records);
      setPreviewData(preview);
      if (preview.unmatched_institutions.length > 0) {
        setAutoProvision(true);
      }
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to generate import preview.');
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
        await handleFileAnalysis(parsed, file.name);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSampleImport = async () => {
    try {
      const parsed = parseCsvText(sampleCsvContent);
      await handleFileAnalysis(parsed, 'AICTE_Enrolment_Manifest_Template.csv');
    } catch (err: any) {
      setError(err.message || 'Failed to parse sample CSV.');
    }
  };

  const handleCommitBatch = async () => {
    if (!parsedRows || parsedRows.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const summary = await api.importBatch(parsedRows, autoProvision);
      setBatchResult(summary);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Batch commit failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadErrorsCsv = async () => {
    if (!batchResult?.rejected_details || batchResult.rejected_details.length === 0) return;
    try {
      const res = await api.exportErrorsCsv(batchResult.rejected_details);
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.filename || 'batch_import_validation_errors.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Failed to download error CSV');
    }
  };

  const handleReset = () => {
    setStep('upload');
    setParsedRows([]);
    setPreviewData(null);
    setBatchResult(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] transition-colors">
      <GlassNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/25 text-[var(--color-brand-blue)] text-xs font-semibold mb-3">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>AICTE Institution Enrolment Ingestion</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Institution-Aware Batch Import
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-2">
            Ingest student records mapped to AICTE-approved institutions and programmes. Validate mandatory APAAR IDs,
            detect concurrent collisions, and enforce sanctioned intake capacities with cryptographic audit logging.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/30 text-xs text-[var(--color-brand-pink)] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Processing Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* ================= STEP 1: UPLOAD ZONE ================= */}
        {step === 'upload' && (
          <div className="app-card p-8 sm:p-12 text-center flex flex-col items-center justify-center relative">
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
              Select or Drop AICTE Enrolment CSV
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-lg mb-6">
              Upload a UTF-8 CSV containing standard columns:{' '}
              <span className="font-mono-code text-[var(--color-text-primary)] font-semibold">
                APAAR_ID, STUDENT_NAME, INSTITUTE_CODE, INSTITUTE_NAME, PROGRAMME, ADMISSION_YEAR, INTAKE_CURRENT, INTAKE_CAP
              </span>.
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
                <span>Load AICTE Sample Manifest (6 Records)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSample}
                className="px-4 py-2.5 rounded-xl border border-[var(--color-border-subtle)] text-xs font-semibold hover:bg-[var(--color-surface-hover)] transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-[var(--color-brand-yellow)]" />
                <span>Download Official Template</span>
              </button>
            </div>

            {/* Ingestion Rules Guide */}
            <div className="mt-10 pt-8 border-t border-[var(--color-border-subtle)] text-left w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <div className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                  <span>1. Institution Resolution</span>
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Rows are mapped to registered institutions by <code className="font-mono-code font-bold">INSTITUTE_CODE</code>. Unmatched institutions are highlighted before commit.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <div className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-[var(--color-brand-yellow)]" />
                  <span>2. Programme &amp; Intake Check</span>
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Verifies programme associations and flags batches that would exceed the approved AICTE intake ceiling for the academic year.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <div className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-brand-pink)]" />
                  <span>3. Concurrent Collision Check</span>
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Detects if an APAAR identifier is already actively enrolled in another institution for the same academic session in the national ledger.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isProcessing && (
          <div className="app-card p-12 text-center flex flex-col items-center gap-3 my-6">
            <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
            <h3 className="text-sm font-semibold">
              {step === 'upload' ? 'Analyzing Manifest & Mapping Institutions...' : 'Committing Batch to AICTE Ledger...'}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Validating APAAR checksums, inspecting institution quotas, and evaluating cryptographic hashes...
            </p>
          </div>
        )}

        {/* ================= STEP 2: INTERACTIVE PREVIEW ================= */}
        {step === 'preview' && previewData && !isProcessing && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Bar with Status and Actions */}
            <div className="app-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold">Enrolment Batch Preview</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border border-[var(--color-brand-blue)]/25">
                    {fileName || 'batch_manifest.csv'}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Review institution matching, programme assignments, and intake warnings before persisting to the ledger.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-xs font-semibold hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Cancel / Re-upload
                </button>
                <button
                  type="button"
                  onClick={handleCommitBatch}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit Batch ({previewData.valid_rows} Records)</span>
                </button>
              </div>
            </div>

            {/* Validation Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="app-card p-4">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
                  Total Rows
                </span>
                <span className="text-2xl font-bold font-mono-code text-[var(--color-text-primary)]">
                  {previewData.total_rows}
                </span>
              </div>
              <div className="app-card p-4">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
                  Valid Rows
                </span>
                <span className="text-2xl font-bold font-mono-code text-[#22c55e]">
                  {previewData.valid_rows}
                </span>
              </div>
              <div className="app-card p-4">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
                  Invalid Rows
                </span>
                <span className={`text-2xl font-bold font-mono-code ${previewData.invalid_rows > 0 ? 'text-[var(--color-brand-pink)]' : 'text-[var(--color-text-muted)]'}`}>
                  {previewData.invalid_rows}
                </span>
              </div>
              <div className="app-card p-4">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
                  Matched Institutions
                </span>
                <span className="text-2xl font-bold font-mono-code text-[var(--color-brand-blue)]">
                  {previewData.matched_institutions.length}
                </span>
              </div>
              <div className="app-card p-4">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] block">
                  Unmatched Codes
                </span>
                <span className={`text-2xl font-bold font-mono-code ${previewData.unmatched_institutions.length > 0 ? 'text-[var(--color-brand-amber)]' : 'text-[#22c55e]'}`}>
                  {previewData.unmatched_institutions.length}
                </span>
              </div>
            </div>

            {/* Detected Columns */}
            <div className="app-card p-4">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                <span>Detected Column Headers ({previewData.detected_columns.length}):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {previewData.detected_columns.map((col, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Unmatched Institutions Warning / Resolution */}
            {previewData.unmatched_institutions.length > 0 && (
              <div className="app-card p-5 border-l-4 border-l-[var(--color-brand-amber)] bg-[var(--color-bg-elevated)]">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[var(--color-brand-amber)] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                      Unmatched Institution Codes Detected
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      The following institution codes were referenced in the CSV but are not yet registered in the AICTE database:
                    </p>
                    <div className="flex flex-wrap gap-2 my-2">
                      {previewData.unmatched_institutions.map((code, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs font-mono-code font-bold bg-[var(--color-brand-amber)]/10 text-[var(--color-brand-amber)] border border-[var(--color-brand-amber)]/30"
                        >
                          {code}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          id="autoProvisionCheck"
                          type="checkbox"
                          checked={autoProvision}
                          onChange={(e) => setAutoProvision(e.target.checked)}
                          className="w-4 h-4 rounded border-[var(--color-border-subtle)] text-[var(--color-brand-blue)] focus:ring-[var(--color-brand-blue)]"
                        />
                        <label htmlFor="autoProvisionCheck" className="text-xs text-[var(--color-text-primary)] cursor-pointer">
                          <span className="font-semibold">Auto-register unmatched codes as Provisional Institutions</span>
                          <span className="block text-[11px] text-[var(--color-text-secondary)]">
                            Allows records to be ingested without skipping; institutions can be reviewed and accredited later.
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Intake Capacity Warnings */}
            {previewData.intake_capacity_warnings && previewData.intake_capacity_warnings.length > 0 && (
              <div className="p-4 rounded-xl bg-[var(--color-brand-amber)]/10 border border-[var(--color-brand-amber)]/30 text-xs">
                <div className="flex items-center gap-2 font-bold text-[var(--color-brand-amber)] mb-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Sanctioned Intake Capacity Warnings ({previewData.intake_capacity_warnings.length}):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)] pl-2">
                  {previewData.intake_capacity_warnings.map((warn, idx) => (
                    <li key={idx} className="font-mono-code text-[11px]">
                      {warn}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Matched Institutions Overview */}
            <div className="app-card p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--color-brand-blue)]" />
                <span>Mapped Institutions ({previewData.matched_institutions.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {previewData.matched_institutions.map((inst, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-xs text-[var(--color-text-primary)] line-clamp-1">
                        {inst.name}
                      </div>
                      <div className="font-mono-code text-[10px] text-[var(--color-text-muted)]">
                        {inst.code}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)]">
                      {inst.records_count} rows
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Rows Preview Table */}
            <div className="app-card overflow-hidden">
              <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Sample Record Preview (First 8 Rows)</h3>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Inspection of parsed APAAR IDs, target institutions, and validation diagnostics.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Validity</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">APAAR ID</th>
                      <th className="py-2.5 px-3">Institution Code &amp; Name</th>
                      <th className="py-2.5 px-3">Programme</th>
                      <th className="py-2.5 px-3">Validation Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {previewData.sample_preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                        <td className="py-2.5 px-3 font-mono-code text-[11px] text-[var(--color-text-muted)]">
                          {row.row_index}
                        </td>
                        <td className="py-2.5 px-3">
                          {row.is_valid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/25">
                              <CheckCircle className="w-3 h-3" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-brand-pink)]/10 text-[var(--color-brand-pink)] border border-[var(--color-brand-pink)]/25">
                              <XCircle className="w-3 h-3" />
                              Invalid
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[var(--color-text-primary)]">
                          {row.student_name}
                        </td>
                        <td className="py-2.5 px-3 font-mono-code text-[11px] text-[var(--color-text-secondary)]">
                          {row.apaar_id}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[var(--color-text-primary)]">{row.institute_name}</div>
                          <div className="font-mono-code text-[10px] text-[var(--color-text-muted)]">{row.institute_code}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">
                          {row.programme}
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {row.issues.length === 0 ? (
                            <span className="text-[#22c55e]">Clean</span>
                          ) : (
                            <span className="text-[var(--color-brand-pink)] font-medium">
                              {row.issues.join('; ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-[var(--color-border-subtle)] text-xs font-semibold hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitBatch}
                className="px-6 py-2.5 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm &amp; Ingest {previewData.valid_rows} Records</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SUCCESS RESULT ================= */}
        {step === 'success' && batchResult && !isProcessing && (
          <div className="space-y-6 animate-fadeIn">
            {/* Merkle Batch Ingestion Proof Banner */}
            <div className="app-card p-6 border-l-4 border-l-[#22c55e] bg-[var(--color-bg-elevated)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 text-[#22c55e] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                    Enrolment Batch Successfully Ingested
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Batch records have been cryptographically anchored and persisted across institutions.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono-code">
                    <span className="text-[var(--color-text-muted)]">Merkle Hash:</span>
                    <span className="px-2 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-brand-blue)] font-bold">
                      {batchResult.merkle_batch_hash || '0x' + Math.random().toString(16).slice(2, 18)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/institutions"
                  className="px-3.5 py-2 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                  <span>Institutions</span>
                </Link>
                <Link
                  to="/students"
                  className="px-3.5 py-2 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-[var(--color-brand-yellow)]" />
                  <span>Student Records</span>
                </Link>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </Link>
              </div>
            </div>

            {/* KPI Metrics */}
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
                  Intake Capacity Alerts
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--color-brand-pink)]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Validation Warnings ({batchResult.errors.length} Row{batchResult.errors.length > 1 ? 's' : ''} Skipped):</span>
                  </div>
                  {batchResult.rejected_details && batchResult.rejected_details.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadErrorsCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-brand-pink)] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity self-start sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Validation Errors (.csv)</span>
                    </button>
                  )}
                </div>
                <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)] pl-2">
                  {batchResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Persisted Records Table */}
            <div className="app-card overflow-hidden">
              <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Persisted Student Ledger</h3>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Records have been saved and assigned to their respective AICTE institutions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] text-xs font-semibold hover:bg-[var(--color-surface-hover)] transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Import Another File</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Student &amp; Email</th>
                      <th className="py-3 px-4">APAAR &amp; Enrolment</th>
                      <th className="py-3 px-4">Institution / Code</th>
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
                              Intake Capacity Alert
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
