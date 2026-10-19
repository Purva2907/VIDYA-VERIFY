import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Shield,
  Building,
} from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const isAuditor = user.role === 'auditor';
  const roleLabel = isAuditor ? 'AICTE Administrator' : 'Institution Verifier';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] hover:border-[var(--color-border-highlight)] transition-all shadow-sm"
      >
        <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue)] text-white font-bold text-xs flex items-center justify-center shadow-sm">
          {getInitials(user.full_name || user.email)}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight">
            {user.full_name || user.email.split('@')[0]}
          </span>
          <span className="text-[10px] text-[var(--color-text-secondary)] leading-tight">
            {roleLabel}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-xl p-2 z-50 text-xs">
          {/* User Header Summary */}
          <div className="p-3 border-b border-[var(--color-border-subtle)] mb-1">
            <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
              {user.full_name}
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)] truncate">
              {user.email}
            </p>
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border border-[var(--color-brand-blue)]/25 text-[10px] font-medium">
              {isAuditor ? (
                <Shield className="w-3 h-3" />
              ) : (
                <Building className="w-3 h-3" />
              )}
              <span>{roleLabel}</span>
            </div>
          </div>

          {/* Menu Items */}
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-brand-blue)] transition-colors"
          >
            <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <span>Profile &amp; Account</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              toggleTheme();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#FFF83F]" />
              ) : (
                <Moon className="w-4 h-4 text-[#2391FF]" />
              )}
              <span>Appearance</span>
            </div>
            <span className="text-[10px] font-medium text-[var(--color-text-secondary)] capitalize">
              {theme} mode
            </span>
          </button>

          <div className="my-1 border-t border-[var(--color-border-subtle)]" />

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-brand-pink)] hover:bg-[var(--color-brand-pink)]/10 transition-colors text-left font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
