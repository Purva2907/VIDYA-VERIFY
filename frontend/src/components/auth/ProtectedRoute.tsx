import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Array<'auditor' | 'node' | 'student'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] text-[var(--color-text-primary)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--color-brand-blue)] animate-spin" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Verifying secure session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Preserve attempted URL location to redirect back after sign in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)] text-[var(--color-text-primary)] px-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-[var(--color-brand-pink)]/15 border border-[var(--color-brand-pink)]/30 mx-auto flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-[var(--color-brand-pink)]" />
          </div>
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mb-6">
            Your account ({user.role}) does not have permission to access this administrative resource.
          </p>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-brand-blue)] text-white hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};
