import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Menu, X, ArrowRight, Database, CheckCircle2 } from 'lucide-react';

export const GlassNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Platform', href: '/#platform' },
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Security', href: '/#security' },
    { label: 'Verify Record', href: '/verify' },
    { label: 'Dashboard', href: '/dashboard' },
  ];

  const isCurrent = (path: string) => {
    if (path.startsWith('/#')) return location.pathname === '/' && location.hash === path.substring(1);
    return location.pathname === path;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-3 bg-[#050914]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2391FF]/30 to-[#0B1220] border border-[#2391FF]/40 flex items-center justify-center shadow-[0_0_15px_rgba(35,145,255,0.3)] group-hover:border-[#2391FF] transition-all">
                <ShieldCheck className="w-5 h-5 text-[#2391FF] group-hover:scale-110 transition-transform" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#050914] border border-[#FFF83F] flex items-center justify-center">
                <GraduationCap className="w-2.5 h-2.5 text-[#FFF83F]" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-[#2391FF] transition-colors">
                  VIDYA-VERIFY
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono-code font-bold uppercase rounded bg-[#2391FF]/15 text-[#2391FF] border border-[#2391FF]/30">
                  AICTE 26263
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                Student Integrity &amp; Verification Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#101B32]/60 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-lg">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all ${
                  isCurrent(link.href)
                    ? 'text-white bg-[#2391FF]/25 border border-[#2391FF]/40 shadow-[0_0_12px_rgba(35,145,255,0.3)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/verify"
              className="px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white rounded-xl hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FFF83F]" />
              <span>Sandbox Verify</span>
            </Link>

            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:border-[#2391FF]/40"
            >
              Sign In
            </Link>

            <Link
              to="/dashboard"
              className="px-4 py-2 text-xs font-semibold text-[#050914] bg-[#2391FF] hover:bg-[#4ea6ff] rounded-xl shadow-[0_0_20px_rgba(35,145,255,0.4)] transition-all flex items-center gap-1.5 group"
            >
              <span>Access Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#2391FF]/20 border border-[#2391FF]/40 rounded-lg"
            >
              Sign In
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
              aria-label="Toggle Navigation"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden mt-2 mx-4 p-4 rounded-2xl glass-panel-elevated border border-white/15 flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs text-slate-400 font-mono-code">
            <span>AICTE REGULATION BUREAU</span>
            <span className="text-[#2391FF]">NODE: LIVE</span>
          </div>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className="px-3 py-2 text-sm text-slate-200 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <Link
              to="/verify"
              onClick={() => setIsMobileOpen(false)}
              className="w-full py-2.5 px-4 text-center text-xs font-semibold rounded-xl bg-white/5 border border-white/10 text-white"
            >
              Open Sandbox Verifier
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setIsMobileOpen(false)}
              className="w-full py-2.5 px-4 text-center text-xs font-semibold rounded-xl bg-[#2391FF] text-[#050914] shadow-[0_0_15px_rgba(35,145,255,0.4)]"
            >
              Enter Dashboard Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
