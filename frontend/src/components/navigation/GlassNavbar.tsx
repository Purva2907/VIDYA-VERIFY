import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Menu, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

export const GlassNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Public links
  const publicLinks = [
    { label: 'Platform', href: '/#platform' },
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Security', href: '/#security' },
    { label: 'Verify Record', href: '/verify' },
  ];

  // Authenticated links (Institution-Centric System)
  const authLinks = [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Institutions', href: '/institutions' },
    { label: 'Student Records', href: '/students' },
    { label: 'Batch Import', href: '/import' },
    { label: 'Verification', href: '/verify' },
  ];

  const links = isAuthenticated ? authLinks : publicLinks;

  const isCurrent = (path: string) => {
    if (path.startsWith('/#')) return location.pathname === '/' && location.hash === path.substring(1);
    return location.pathname === path;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'py-3 glass-navbar glass-navbar-scrolled'
          : 'py-4 bg-transparent'
      }`}
    >
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] flex items-center justify-center shadow-sm group-hover:border-[var(--color-brand-blue)] transition-all">
                <ShieldCheck className="w-5 h-5 text-[var(--color-brand-blue)] transition-transform group-hover:scale-105" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-bg-main)] border border-[var(--color-brand-yellow)] flex items-center justify-center">
                <GraduationCap className="w-2.5 h-2.5 text-[var(--color-brand-yellow)]" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-blue)] transition-colors">
                  VIDYA-VERIFY
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono-code font-bold uppercase rounded bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border border-[var(--color-brand-blue)]/25">
                  AICTE 26263
                </span>
              </div>
              <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                Student Integrity &amp; Verification Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[var(--color-surface-card)] px-3 py-1.5 rounded-full border border-[var(--color-border-subtle)] shadow-sm">
            {links.map((link) => {
              const active = isCurrent(link.href);
              const isAnchor = link.href.startsWith('/#');
              return isAnchor ? (
                <a
                  key={link.label}
                  href={link.href}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all ${
                    active
                      ? 'text-white bg-[var(--color-brand-blue)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all ${
                    active
                      ? 'text-white bg-[var(--color-brand-blue)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Side Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            <ThemeToggle />

            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand-blue)] rounded-xl hover:bg-[var(--color-surface-hover)] transition-all"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[var(--color-brand-blue)] hover:opacity-90 rounded-xl transition-all shadow-sm flex items-center gap-1.5 group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[var(--color-brand-blue)] rounded-lg"
              >
                Sign In
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)]"
              aria-label="Toggle Navigation"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden mt-2 mx-4 p-4 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-xl flex flex-col gap-2">
          {links.map((link) => {
            const isAnchor = link.href.startsWith('/#');
            return isAnchor ? (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-xl transition-all"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-xl transition-all"
              >
                {link.label}
              </Link>
            );
          })}

          {!isAuthenticated && (
            <div className="pt-2 border-t border-[var(--color-border-subtle)] flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setIsMobileOpen(false)}
                className="w-full py-2 px-4 text-center text-xs font-semibold rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileOpen(false)}
                className="w-full py-2 px-4 text-center text-xs font-semibold rounded-xl bg-[var(--color-brand-blue)] text-white"
              >
                Institutional Registration
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
