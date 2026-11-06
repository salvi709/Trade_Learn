import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, Mail } from 'lucide-react';
import { ADMIN_OWNER_EMAIL } from '../../services/adminService';
import { APP_NAME } from '../../config/branding';

interface AdminAccessDeniedProps {
  currentEmail?: string | null;
  onReturnToDashboard: () => void;
  onOpenAuthModal?: () => void;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  currentEmail,
  onReturnToDashboard,
  onOpenAuthModal,
}) => {
  return (
    <div className="min-h-screen theme-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full theme-card border theme-border rounded-2xl p-6 md:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <Lock className="w-3.5 h-3.5" />
            Restricted Area
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-heading theme-main-text">
            Admin Access Required
          </h1>
          <p className="text-sm theme-muted-text leading-relaxed">
            The {APP_NAME} Admin Intelligence & Command Portal is strictly reserved for the designated owner.
          </p>
        </div>

        <div className="p-3.5 rounded-xl theme-surface-subtle border theme-border text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="theme-muted-text">Designated Administrator:</span>
            <span className="font-mono text-emerald-500 font-medium flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {ADMIN_OWNER_EMAIL}
            </span>
          </div>
          <div className="flex items-center justify-between border-t theme-border pt-2">
            <span className="theme-muted-text">Current Account:</span>
            <span className="font-mono theme-main-text truncate max-w-[180px]">
              {currentEmail || 'Guest / Unverified'}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {onOpenAuthModal && (!currentEmail || currentEmail.toLowerCase() !== ADMIN_OWNER_EMAIL.toLowerCase()) && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="w-full py-2.5 px-4 rounded-xl theme-primary-btn font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
            >
              <Mail className="w-4 h-4" />
              Sign In as Admin ({ADMIN_OWNER_EMAIL})
            </button>
          )}

          <button
            type="button"
            onClick={onReturnToDashboard}
            className="w-full py-2.5 px-4 rounded-xl theme-surface-subtle border theme-border font-semibold text-xs theme-main-text flex items-center justify-center gap-2 cursor-pointer hover:theme-surface-elevated transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Learner Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
