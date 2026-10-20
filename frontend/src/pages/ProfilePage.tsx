import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GlassNavbar } from '../components/navigation/GlassNavbar';
import { Footer } from '../components/navigation/Footer';
import {
  User,
  Building2,
  Mail,
  Shield,
  Phone,
  Briefcase,
  Calendar,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  LogOut,
  Loader2,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Profile fields state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [department, setDepartment] = useState(user?.department || '');

  // Password fields state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status flags
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) return null;

  const isAuditor = user.role === 'auditor';
  const roleLabel = isAuditor ? 'Platform Administrator' : 'Institution Administrator';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setIsUpdatingProfile(true);

    try {
      await updateProfile({
        full_name: fullName,
        phone,
        designation,
        department,
      });
      setProfileSuccess('Profile information updated successfully.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordSuccess('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-primary)] transition-colors">
      <GlassNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header Breadcrumb / Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Account Profile &amp; Settings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            Manage your authenticated credentials, institution details, and account preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: User Summary Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="app-card p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-[var(--color-brand-blue)] text-white font-bold text-2xl flex items-center justify-center mb-4 shadow-md">
                {getInitials(user.full_name || user.email)}
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {user.full_name}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {user.email}
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border border-[var(--color-brand-blue)]/25 text-xs font-medium">
                {isAuditor ? <Shield className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                <span>{roleLabel}</span>
              </div>

              <div className="w-full mt-6 pt-6 border-t border-[var(--color-border-subtle)] space-y-3 text-left text-xs">
                {user.institute_name && (
                  <div>
                    <span className="text-[var(--color-text-secondary)] block">Institution</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {user.institute_name}
                    </span>
                  </div>
                )}
                {user.institute_id && (
                  <div>
                    <span className="text-[var(--color-text-secondary)] block">Institute Code / AICTE ID</span>
                    <span className="font-mono-code font-semibold text-[var(--color-text-primary)]">
                      {user.institute_id}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[var(--color-text-secondary)] block">Account Registered</span>
                  <span className="text-[var(--color-text-primary)] flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                    <span>{user.created_at || 'Active'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Appearance Card */}
            <div className="app-card p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                Appearance &amp; Theme
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-[#FFF83F]" />
                  ) : (
                    <Sun className="w-4 h-4 text-[#2391FF]" />
                  )}
                  <span className="text-xs font-medium capitalize">
                    {theme} Theme Active
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] hover:border-[var(--color-brand-blue)]"
                >
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>

            {/* Sign Out Card */}
            <div className="app-card p-5">
              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[var(--color-brand-pink)]/10 text-[var(--color-brand-pink)] border border-[var(--color-brand-pink)]/30 hover:bg-[var(--color-brand-pink)]/20 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of VIDYA-VERIFY</span>
              </button>
            </div>
          </div>

          {/* Right Column: Edit Profile & Password */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Profile Form */}
            <div className="app-card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)] mb-5">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    Profile Information
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Update your official contact details. Your role and email are verified by the registry.
                  </p>
                </div>
                <User className="w-5 h-5 text-[var(--color-brand-blue)]" />
              </div>

              {profileSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/30 text-xs text-[var(--color-brand-blue)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/30 text-xs text-[var(--color-brand-pink)] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                      Email Address (Read-only)
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] opacity-60 border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                      Designation / Title
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Nodal Officer / Registrar"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                    Department / Bureau
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Academic Records Bureau"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-4 py-2.5 rounded-xl bg-[var(--color-brand-blue)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="app-card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)] mb-5">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    Security &amp; Password
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Change your password regularly to maintain institutional access security.
                  </p>
                </div>
                <Lock className="w-5 h-5 text-[var(--color-brand-amber)]" />
              </div>

              {passwordSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/30 text-xs text-[var(--color-brand-blue)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--color-brand-pink)]/10 border border-[var(--color-brand-pink)]/30 text-xs text-[var(--color-brand-pink)] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-type new password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand-blue)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-4 py-2.5 rounded-xl bg-[var(--color-brand-amber)] text-[#050914] text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
