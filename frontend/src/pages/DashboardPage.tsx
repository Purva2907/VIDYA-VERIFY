import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  CopyX,
  Gauge,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  QrCode,
  ArrowUpRight,
  RefreshCw,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';

interface StudentRecord {
  id: string;
  apaarId: string;
  name: string;
  institute: string;
  instituteCode: string;
  programme: string;
  intakeStatus: string;
  integrityStatus: 'verified' | 'duplicate' | 'warning' | 'pending';
  lastUpdated: string;
}

export const DashboardPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'duplicate' | 'warning'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  // Synthetic student dataset for demonstration
  const [students, setStudents] = useState<StudentRecord[]>([
    {
      id: 'REC-01',
      apaarId: '9024-8172-5501-IN',
      name: 'Aarav V. Suryavanshi',
      institute: 'Indian Institute of Technology, Delhi',
      instituteCode: 'IND-AICTE-1042',
      programme: 'B.Tech Computer Science & AI',
      intakeStatus: '120/120 (Within Quota)',
      integrityStatus: 'verified',
      lastUpdated: '2026-10-19 18:24',
    },
    {
      id: 'REC-02',
      apaarId: '3391-4412-8920-IN',
      name: 'Priya N. Kulkarni',
      institute: 'Mumbai Tech University // Delhi Tech Campus',
      instituteCode: 'COLLISION: DEL/MUM',
      programme: 'B.Tech Information Technology',
      intakeStatus: 'Concurrent Dual Enrolment',
      integrityStatus: 'duplicate',
      lastUpdated: '2026-10-19 17:15',
    },
    {
      id: 'REC-03',
      apaarId: '7721-1049-3382-IN',
      name: 'Rohan M. Nair',
      institute: 'Southern Institute of Engineering, Bangalore',
      instituteCode: 'IND-AICTE-4891',
      programme: 'B.Tech Electronics & Comm.',
      intakeStatus: '124/120 (Exceeded Cap)',
      integrityStatus: 'warning',
      lastUpdated: '2026-10-19 16:50',
    },
    {
      id: 'REC-04',
      apaarId: '5512-9014-2281-IN',
      name: 'Ananya S. Iyer',
      institute: 'National Institute of Technology, Trichy',
      instituteCode: 'IND-AICTE-2204',
      programme: 'B.Tech Mechanical Engineering',
      intakeStatus: '90/90 (Within Quota)',
      integrityStatus: 'verified',
      lastUpdated: '2026-10-19 15:40',
    },
    {
      id: 'REC-05',
      apaarId: '8834-1120-7463-IN',
      name: 'Vikramaditya Rao',
      institute: 'Kolkata Engineering College',
      instituteCode: 'IND-AICTE-3109',
      programme: 'B.Tech Electrical & Electronics',
      intakeStatus: '60/60 (Within Quota)',
      integrityStatus: 'verified',
      lastUpdated: '2026-10-19 14:12',
    },
    {
      id: 'REC-06',
      apaarId: '1092-4482-9901-IN',
      name: 'Devika Pillai',
      institute: 'Pune College of Applied Tech',
      instituteCode: 'IND-AICTE-5501',
      programme: 'B.Tech Civil Engineering',
      intakeStatus: '62/60 (Capacity Alert)',
      integrityStatus: 'warning',
      lastUpdated: '2026-10-19 13:05',
    },
  ]);

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.apaarId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.institute.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.integrityStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#050914] text-[#F8FAFC] selection:bg-[#2391FF]/30 selection:text-white relative">
      <GlassNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Dashboard Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#2391FF]/20 text-[#2391FF] border border-[#2391FF]/40">
                AICTE REGULATION BUREAU
              </span>
              <span className="text-xs font-mono-code text-slate-400">
                ACTIVE NODE: IND-DEL-04 (SUPERVISORY)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Student Integrity &amp; Enrolment Ledger
            </h1>
            <p className="text-xs sm:text-sm text-[#A6B4CC] mt-0.5">
              Real-time APAAR identity cross-referencing, multi-campus duplicate detection, and approved intake compliance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/import"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 border border-white/12 hover:border-[#2391FF]/40 text-white flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#2391FF]" />
              <span>Import CSV Batch</span>
            </Link>

            <Link
              to="/verify"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2391FF] hover:bg-[#4ea6ff] text-[#050914] flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(35,145,255,0.4)]"
            >
              <QrCode className="w-4 h-4" />
              <span>APAAR Sandbox Verifier</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Telemetry Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          {/* Card 1 */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-[#2391FF]/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono-code text-slate-400">TOTAL SYNTHETIC RECORDS</span>
              <div className="w-8 h-8 rounded-lg bg-[#2391FF]/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#2391FF]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono-code text-white">1,842,910</div>
            <div className="mt-2 text-xs text-[#2391FF] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>10,480 Approved Institutes</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-[#FFF83F]/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono-code text-slate-400">APAAR VERIFIED (99.8%)</span>
              <div className="w-8 h-8 rounded-lg bg-[#FFF83F]/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#FFF83F]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono-code text-[#FFF83F]">1,839,400</div>
            <div className="mt-2 text-xs text-slate-300 flex items-center gap-1">
              <span>Cryptographically Sealed</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-5 rounded-2xl border border-[#F70063]/30 bg-[#F70063]/5 hover:border-[#F70063]/60 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono-code text-[#FF4D8D]">DUPLICATE COLLISIONS</span>
              <div className="w-8 h-8 rounded-lg bg-[#F70063]/20 flex items-center justify-center">
                <CopyX className="w-4 h-4 text-[#F70063]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono-code text-[#F70063]">312 FLAGGED</div>
            <div className="mt-2 text-xs text-[#FF4D8D] flex items-center gap-1">
              <span>Dual-Institution Conflicts</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-5 rounded-2xl border border-[#FFCD54]/30 bg-[#FFCD54]/5 hover:border-[#FFCD54]/60 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono-code text-[#FFCD54]">INTAKE CAP WARNINGS</span>
              <div className="w-8 h-8 rounded-lg bg-[#FFCD54]/20 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-[#FFCD54]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono-code text-[#FFCD54]">14 INSTITUTES</div>
            <div className="mt-2 text-xs text-[#FFCD54] flex items-center gap-1">
              <span>Seat Quota Exceeded</span>
            </div>
          </div>
        </div>

        {/* Section: Real-time Duplicate Alert Spotlight */}
        <div className="p-4 rounded-2xl bg-[#F70063]/10 border border-[#F70063]/40 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F70063]/20 flex items-center justify-center shrink-0 mt-0.5">
              <CopyX className="w-5 h-5 text-[#F70063]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code font-bold text-[#F70063]">
                  CRITICAL CONFLICT DETECTED
                </span>
                <span className="w-2 h-2 rounded-full bg-[#F70063] animate-ping" />
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                APAAR ID <code className="bg-black/50 px-1.5 py-0.5 rounded text-[#FFF83F]">3391-4412-8920-IN</code> is currently enroled simultaneously at <strong>Delhi Tech Campus</strong> and <strong>Mumbai Tech University</strong> for Academic Session 2024-25.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const rec = students.find((s) => s.id === 'REC-02');
                if (rec) setSelectedStudent(rec);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#F70063] hover:bg-[#d60055] text-white text-xs font-bold font-mono-code transition-colors shadow-md"
            >
              Review Conflict
            </button>
          </div>
        </div>

        {/* Search, Filter, and Records Table */}
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Controls bar */}
          <div className="p-5 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search APAAR ID, Student Name, Campus..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080F20] border border-white/10 text-xs font-mono-code text-white placeholder:text-slate-500 focus:outline-none focus:border-[#2391FF]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-mono-code text-slate-400 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                Filter:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('verified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-all ${
                  statusFilter === 'verified'
                    ? 'bg-[#2391FF]/30 text-[#60A5FA] border border-[#2391FF]/50'
                    : 'text-slate-400 hover:text-[#60A5FA]'
                }`}
              >
                Verified
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('duplicate')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-all ${
                  statusFilter === 'duplicate'
                    ? 'bg-[#F70063]/30 text-[#FF4D8D] border border-[#F70063]/50'
                    : 'text-slate-400 hover:text-[#FF4D8D]'
                }`}
              >
                Duplicate Collision
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('warning')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-all ${
                  statusFilter === 'warning'
                    ? 'bg-[#FFCD54]/30 text-[#FFCD54] border border-[#FFCD54]/50'
                    : 'text-slate-400 hover:text-[#FFCD54]'
                }`}
              >
                Intake Warning
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-code">
              <thead className="bg-[#080F20]/70 text-slate-400 border-b border-white/10 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-5">APAAR Identifier</th>
                  <th className="py-3 px-5">Student Candidate</th>
                  <th className="py-3 px-5">Institute / Affiliation</th>
                  <th className="py-3 px-5">Programme &amp; Quota</th>
                  <th className="py-3 px-5">Integrity State</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    onClick={() => setSelectedStudent(item)}
                  >
                    <td className="py-4 px-5">
                      <span className="font-bold text-white group-hover:text-[#2391FF] transition-colors">
                        {item.apaarId}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white font-sans">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.id}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-300 font-sans">{item.institute}</div>
                      <div className="text-[10px] text-slate-500">{item.instituteCode}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-300 font-sans">{item.programme}</div>
                      <div className="text-[10px] text-slate-400">{item.intakeStatus}</div>
                    </td>
                    <td className="py-4 px-5">
                      {item.integrityStatus === 'verified' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#2391FF]/15 text-[#2391FF] border border-[#2391FF]/30 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          VERIFIED
                        </span>
                      )}
                      {item.integrityStatus === 'duplicate' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F70063]/15 text-[#F70063] border border-[#F70063]/30 inline-flex items-center gap-1 shadow-[0_0_10px_rgba(247,0,99,0.3)]">
                          <CopyX className="w-3 h-3" />
                          DUPLICATE
                        </span>
                      )}
                      {item.integrityStatus === 'warning' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          INTAKE CAP
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(item);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#2391FF]/20 text-slate-400 hover:text-[#2391FF] transition-all"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Record Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-[#2391FF]/40 max-w-xl w-full shadow-2xl relative animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#2391FF]" />
                  <span className="text-xs font-mono-code text-slate-300">
                    AICTE APAAR RECORD DOSSIER
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <span className="text-[11px] font-mono-code text-slate-400 block">STUDENT CANDIDATE</span>
                  <h3 className="text-xl font-bold text-white font-sans">{selectedStudent.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono-code">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-400 block mb-1">SOVEREIGN APAAR ID</span>
                    <span className="text-[#2391FF] font-bold">{selectedStudent.apaarId}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-400 block mb-1">INTEGRITY STATE</span>
                    <span
                      className={`font-bold ${
                        selectedStudent.integrityStatus === 'duplicate'
                          ? 'text-[#F70063]'
                          : selectedStudent.integrityStatus === 'warning'
                          ? 'text-[#FFCD54]'
                          : 'text-[#2391FF]'
                      }`}
                    >
                      {selectedStudent.integrityStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs font-mono-code">
                  <span className="text-slate-400 block mb-1">AFFILIATED INSTITUTION</span>
                  <div className="text-white font-sans">{selectedStudent.institute}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">{selectedStudent.instituteCode}</div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs font-mono-code">
                  <span className="text-slate-400 block mb-1">INTAKE QUOTA AUDIT</span>
                  <div className="text-[#FFF83F] font-bold">{selectedStudent.intakeStatus}</div>
                  <div className="text-slate-400 text-[10px] mt-1">
                    Regulatory Cap verified against AICTE approval manifest 2024-25.
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-mono-code bg-white/5 hover:bg-white/10 text-white"
                >
                  Close Dossier
                </button>
                <Link
                  to={`/verify?apaar=${encodeURIComponent(selectedStudent.apaarId)}`}
                  className="px-4 py-2 rounded-xl text-xs font-mono-code font-bold bg-[#2391FF] text-[#050914] shadow-[0_0_15px_rgba(35,145,255,0.4)]"
                >
                  Verify in Sandbox
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
