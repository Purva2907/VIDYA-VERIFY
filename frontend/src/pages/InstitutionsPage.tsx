import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  Plus,
  ArrowRight,
  BookOpen,
  Users,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';
import { AddInstitutionModal } from '../components/dashboard/AddInstitutionModal';
import { api } from '../services/api';
import type { Institution } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const InstitutionsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending_review' | 'provisional'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isAuditor = user?.role === 'auditor';

  const fetchInstitutions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getInstitutions(searchTerm, statusFilter);
      setInstitutions(data);
    } catch (err) {
      console.error('Failed to load institutions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInstitutions();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchInstitutions]);

  const handleInstitutionCreated = (newInst: Institution) => {
    setInstitutions((prev) => [newInst, ...prev]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#2391FF]/15 text-[#2391FF] border border-[#2391FF]/30">
            <ShieldCheck className="w-3 h-3" />
            <span>AICTE Approved</span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFCD54]/15 text-[#FFCD54] border border-[#FFCD54]/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
      case 'provisional':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF83F]/15 text-[#D97706] dark:text-[#FFF83F] border border-[#FFF83F]/30">
            <span>Provisional</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
            {status}
          </span>
        );
    }
  };

  const getUtilizationColor = (pct: number) => {
    if (pct > 100) return 'text-[#F70063] bg-[#F70063]';
    if (pct >= 85) return 'text-[#FFCD54] bg-[#FFCD54]';
    return 'text-[#2391FF] bg-[#2391FF]';
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] transition-colors">
      <GlassNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border border-[var(--color-brand-blue)]/25">
                <Building2 className="w-3 h-3" />
                <span>INSTITUTION DIRECTORY</span>
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {institutions.length} Registered Campus{institutions.length === 1 ? '' : 'es'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Institutions</h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
              Manage institutional profiles, approved programmes, and enrolment capacity.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-[var(--color-brand-blue)] text-white hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Institution</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by institution name, campus code, city, state..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-blue)] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </span>
            <div className="inline-flex rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] p-0.5 text-xs">
              {(['all', 'approved', 'pending_review', 'provisional'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-[var(--color-brand-blue)] text-white font-semibold'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {st === 'all' ? 'All' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Institutions Grid */}
        <div className="mt-6">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
              <p className="text-xs text-[var(--color-text-secondary)]">Loading institution profiles...</p>
            </div>
          ) : institutions.length === 0 ? (
            <div className="py-20 rounded-2xl app-card text-center p-8 border border-dashed border-[var(--color-border-subtle)]">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-[var(--color-text-secondary)]" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">No Institutions Found</h3>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto mt-1">
                {searchTerm
                  ? `No institutions matched your query "${searchTerm}". Try adjusting your filters.`
                  : 'Get started by registering your first AICTE-approved institution.'}
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--color-brand-blue)] text-white hover:opacity-90 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Institution</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {institutions.map((inst) => {
                const util = inst.capacity_utilization_pct || 0;
                const isOverCap = util > 100;
                const isNearCap = util >= 85 && util <= 100;

                return (
                  <div
                    key={inst.code}
                    onClick={() => navigate(`/institutions/${encodeURIComponent(inst.code)}`)}
                    className="app-card p-5 cursor-pointer hover:border-[var(--color-brand-blue)] transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Code & Status */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="font-mono-code font-bold text-xs text-[var(--color-brand-blue)] tracking-wider">
                          {inst.code}
                        </span>
                        {getStatusBadge(inst.status)}
                      </div>

                      {/* Institution Name */}
                      <h3 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-blue)] transition-colors leading-snug line-clamp-2">
                        {inst.name}
                      </h3>

                      {/* Type and Location */}
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-1">
                        {inst.type}
                      </p>

                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                        <MapPin className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" />
                        <span className="truncate">{inst.city}, {inst.state}</span>
                      </div>
                    </div>

                    {/* Stats & Capacity Bar */}
                    <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-[var(--color-brand-blue)]" />
                          <div>
                            <div className="font-bold text-[var(--color-text-primary)] font-mono-code">
                              {inst.programmes_count}
                            </div>
                            <div className="text-[10px] text-[var(--color-text-muted)]">Programmes</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#FFCD54]" />
                          <div>
                            <div className="font-bold text-[var(--color-text-primary)] font-mono-code">
                              {inst.students_count}
                            </div>
                            <div className="text-[10px] text-[var(--color-text-muted)]">Enrolled Records</div>
                          </div>
                        </div>
                      </div>

                      {/* Capacity Utilization Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1 font-mono-code">
                          <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                            <Gauge className="w-3 h-3" />
                            <span>Utilization</span>
                          </span>
                          <span className={`font-bold ${isOverCap ? 'text-[#F70063]' : isNearCap ? 'text-[#FFCD54]' : 'text-[var(--color-text-primary)]'}`}>
                            {inst.current_enrolment} / {inst.total_approved_intake} seats ({util}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isOverCap ? 'bg-[#F70063]' : isNearCap ? 'bg-[#FFCD54]' : 'bg-[var(--color-brand-blue)]'
                            }`}
                            style={{ width: `${Math.min(util, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-brand-blue)] font-medium">
                        <span>View Institutional Profile</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Add Institution Modal */}
      <AddInstitutionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onInstitutionCreated={handleInstitutionCreated}
      />
    </div>
  );
};
