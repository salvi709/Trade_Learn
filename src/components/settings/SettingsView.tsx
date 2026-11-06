import React, { useState } from 'react';
import { UserProfile, UserProgress, PaperPortfolio, UserSettings, AppTheme } from '../../types';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Download, 
  LogOut, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Cloud, 
  Palette, 
  Check,
  Compass,
  Play,
  User,
  UserCheck,
  AtSign,
  Calendar,
  Coins,
  Pencil,
  ShieldAlert
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { AVATAR_OPTIONS, getAvatarById, AvatarOption } from '../../config/avatars';
import { ADMIN_OWNER_EMAIL } from '../../services/adminService';
import { EditProfileModal } from './EditProfileModal';
import { MyProfileCard } from './MyProfileCard';

interface SettingsProps {
  profile: UserProfile;
  progress: UserProgress;
  portfolio: PaperPortfolio;
  settings: UserSettings;
  currentUser?: any;
  onOpenAuthModal?: () => void;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onUpdateProfile?: (newProfile: Partial<UserProfile>) => void;
  onResetProgress: () => void;
  onSignOut: () => void;
  onReplayTour?: () => void;
  onReplayGuidedTour?: () => void;
  onRestartFromBeginning?: () => void;
  onNavigateToAdmin?: () => void;
}

export const SettingsView: React.FC<SettingsProps> = ({
  profile,
  progress,
  portfolio,
  settings,
  currentUser,
  onOpenAuthModal,
  onUpdateSettings,
  onUpdateProfile,
  onResetProgress,
  onSignOut,
  onReplayTour,
  onReplayGuidedTour,
  onRestartFromBeginning,
  onNavigateToAdmin,
}) => {
  const { theme, setTheme } = useTheme();
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);

  const handleExportData = () => {
    const backupData = {
      profile,
      progress,
      portfolio,
      settings,
      theme,
      exportedAt: new Date().toISOString(),
      disclaimer: "Educational simulation backup data from TradeQuest."
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tradequest_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDoReset = () => {
    onResetProgress();
    setConfirmReset(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    onUpdateSettings({ theme: newTheme });
  };

  const isRoyal = theme === 'royal_blue';
  const isEmerald = theme === 'premium_emerald';
  const currentAvatar = getAvatarById(profile.avatarId);

  const handleAvatarChange = (avatarId: string) => {
    if (onUpdateProfile) {
      onUpdateProfile({ avatarId });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Settings Header */}
      <div 
        id="settings-header-card"
        className="theme-card rounded-3xl p-6 md:p-8 border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 theme-soft-accent-bg rounded-xl theme-primary-text">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-heading theme-main-text">
              Platform & Account Settings
            </h2>
            <p className="text-xs theme-secondary-text">
              Personalize your visual theme, edit your profile, back up learning data, or manage your account.
            </p>
          </div>
        </div>
      </div>

      {/* New Interactive "My Profile" Showcase Section */}
      <div id="settings-my-profile-section">
        <MyProfileCard
          profile={profile}
          progress={progress}
          portfolio={portfolio}
          currentUser={currentUser}
        />
      </div>

      {/* Profile Overview Card with Edit Profile action */}
      <div
        id="settings-profile-summary-card"
        className="theme-card rounded-3xl p-6 md:p-8 space-y-4 border theme-border shadow-2xs"
      >
        <div className="flex items-center justify-between border-b theme-border pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 theme-primary-text" />
            <h3 className="text-base font-bold font-heading theme-main-text">
              Learner Profile
            </h3>
          </div>

          <button
            type="button"
            id="btn-edit-profile-card"
            onClick={() => setIsEditProfileOpen(true)}
            className="px-3.5 py-1.5 theme-surface-subtle hover:theme-surface-elevated border theme-border rounded-xl text-xs font-bold theme-primary-text flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {/* Display Name */}
          <div className="p-3.5 theme-surface-subtle rounded-2xl border theme-border space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider theme-muted-text font-semibold flex items-center gap-1">
              <User className="w-3 h-3 theme-muted-text" />
              <span>Full Name</span>
            </span>
            <div className="text-xs font-bold theme-main-text truncate">
              {profile.displayName || 'Learner'}
            </div>
          </div>

          {/* Username */}
          <div className="p-3.5 theme-surface-subtle rounded-2xl border theme-border space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider theme-muted-text font-semibold flex items-center gap-1">
              <AtSign className="w-3 h-3 theme-muted-text" />
              <span>Username</span>
            </span>
            <div className="text-xs font-bold font-mono theme-primary-text truncate">
              {profile.username ? `@${profile.username}` : <span className="theme-muted-text font-normal italic">Not set</span>}
            </div>
          </div>

          {/* Birthday */}
          <div className="p-3.5 theme-surface-subtle rounded-2xl border theme-border space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider theme-muted-text font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 theme-muted-text" />
              <span>Birthday</span>
            </span>
            <div className="text-xs font-semibold theme-main-text truncate">
              {profile.birthday || <span className="theme-muted-text font-normal italic">Not set</span>}
            </div>
          </div>

          {/* Currency */}
          <div className="p-3.5 theme-surface-subtle rounded-2xl border theme-border space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider theme-muted-text font-semibold flex items-center gap-1">
              <Coins className="w-3 h-3 theme-muted-text" />
              <span>Currency</span>
            </span>
            <div className="text-xs font-bold theme-primary-text truncate">
              {profile.currency || 'INR'} ({profile.currency === 'USD' ? '$' : profile.currency === 'EUR' ? '€' : profile.currency === 'GBP' ? '£' : profile.currency === 'JPY' ? '¥' : '₹'})
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Persona Section */}
      <div 
        id="settings-avatar-section"
        className="theme-card rounded-3xl p-6 md:p-8 space-y-5 border theme-border shadow-2xs"
      >
        <div className="flex items-center justify-between border-b theme-border pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 theme-primary-text" />
            <h3 className="text-base font-bold font-heading theme-main-text">
              Financial Persona Avatar
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl">{currentAvatar.svgIcon}</span>
            <span className="text-xs font-bold font-mono theme-main-text">{currentAvatar.name}</span>
          </div>
        </div>

        <p className="text-xs theme-secondary-text">
          Select an avatar persona to represent your profile across the dashboard, learning roadmap, and trade journal.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {AVATAR_OPTIONS.map((av: AvatarOption) => {
            const isSelected = profile.avatarId === av.id;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => handleAvatarChange(av.id)}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 theme-soft-accent-bg ring-2 ring-emerald-500/20 shadow-xs'
                    : 'theme-border theme-surface-subtle hover:theme-surface-elevated'
                }`}
              >
                <div className="text-2xl">{av.svgIcon}</div>
                <div className="font-bold text-xs theme-main-text truncate w-full">{av.name}</div>
                <div className="text-[10px] theme-muted-text truncate w-full">{av.role}</div>
                {isSelected && (
                  <span className="text-[9px] font-mono font-bold theme-primary-text theme-soft-accent-bg px-2 py-0.5 rounded-full mt-0.5">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Preference Section */}
      <div 
        id="settings-theme-section"
        className="theme-card rounded-3xl p-6 md:p-8 space-y-5 border shadow-2xs"
      >
        <div className="flex items-center gap-2 border-b theme-border pb-3">
          <Palette className="w-5 h-5 theme-primary-text" />
          <h3 className="text-base font-bold font-heading theme-main-text">
            Visual Theme Selection
          </h3>
        </div>

        <p className="text-xs theme-secondary-text">
          Choose between Donezo-inspired Light Canvas and Modern Graphite Electric Lime Dark Mode. Both provide high contrast and zero eye strain.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme 1: Donezo Light */}
          <div
            id="theme-select-royal-blue"
            onClick={() => handleThemeChange('royal_blue')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all theme-card interactive-card ${
              isRoyal
                ? 'border-[#0D6847] shadow-sm ring-2 ring-[#0D6847]/20'
                : 'theme-border hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm theme-main-text">
                Donezo Light
              </div>
              {isRoyal && (
                <span className="text-[10px] font-bold bg-[#0D6847] text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Active
                </span>
              )}
            </div>
            <p className="text-xs theme-secondary-text mb-4 leading-relaxed">
              Clean off-white canvas with rich forest green primary, white cards, and mint accents.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg border theme-border shadow-2xs" style={{ backgroundColor: '#F4F5F7' }} title="Background" />
              <div className="w-7 h-7 rounded-lg shadow-2xs" style={{ backgroundColor: '#FFFFFF' }} title="Card Surface" />
              <div className="w-7 h-7 rounded-lg shadow-2xs" style={{ backgroundColor: '#0D6847' }} title="Forest Green Primary" />
              <div className="w-7 h-7 rounded-lg shadow-2xs" style={{ backgroundColor: '#E6F4ED' }} title="Mint Accent" />
            </div>
          </div>

          {/* Theme 2: Modern Dark */}
          <div
            id="theme-select-premium-emerald"
            onClick={() => handleThemeChange('premium_emerald')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all theme-card interactive-card ${
              isEmerald
                ? 'border-[#10B981] shadow-sm ring-2 ring-[#10B981]/20'
                : 'theme-border hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm theme-main-text">
                Modern Dark
              </div>
              {isEmerald && (
                <span className="text-[10px] font-bold bg-[#10B981] text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Active
                </span>
              )}
            </div>
            <p className="text-xs theme-secondary-text mb-4 leading-relaxed">
              Deep true-black canvas with unified brand emerald highlights and elevated dark cards.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg border theme-border shadow-2xs" style={{ backgroundColor: '#000000' }} title="True Black Canvas" />
              <div className="w-7 h-7 rounded-lg shadow-2xs" style={{ backgroundColor: '#0D1117' }} title="Elevated Dark Card" />
              <div className="w-7 h-7 rounded-lg shadow-2xs" style={{ backgroundColor: '#10B981' }} title="Brand Emerald Primary" />
              <div className="w-7 h-7 rounded-lg shadow-2xs" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }} title="Emerald Glow Accent" />
            </div>
          </div>
        </div>
      </div>

      {/* App Overview & Onboarding Tour */}
      <div 
        id="settings-tour-section"
        data-tour="settings-tour-controls"
        className="theme-card rounded-3xl p-6 md:p-8 space-y-4 border theme-border shadow-2xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold font-heading theme-main-text flex items-center gap-2">
              <Compass className="w-5 h-5 theme-primary-text" />
              <span>App Overview & Guided Product Tour</span>
            </h3>
            <p className="text-xs theme-secondary-text">
              Replay the conceptual App Overview or launch the interactive Guided Product Tour across the live interface anytime.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {onRestartFromBeginning && (
              <button
                type="button"
                id="btn-restart-app-experience"
                onClick={onRestartFromBeginning}
                className="px-4 py-2.5 theme-surface-subtle hover:theme-surface-elevated theme-main-text rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer border theme-border transition-all interactive-btn"
                title="Return to the initial landing screen from the very beginning"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start from Beginning</span>
              </button>
            )}

            {onReplayTour && (
              <button
                type="button"
                id="btn-replay-tour"
                onClick={onReplayTour}
                className="px-4 py-2.5 theme-surface-subtle hover:theme-surface-elevated theme-main-text rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer border theme-border shrink-0 transition-all interactive-btn"
              >
                <Play className="w-3.5 h-3.5 theme-primary-text" />
                <span>Replay App Overview</span>
              </button>
            )}

            {onReplayGuidedTour && (
              <button
                type="button"
                id="btn-replay-guided-tour"
                onClick={onReplayGuidedTour}
                className="px-4 py-2.5 theme-btn-primary rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer shrink-0 interactive-btn"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Replay Guided Tour</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Learning Preferences */}
      <div className="theme-card border theme-border rounded-3xl p-6 md:p-8 space-y-5 shadow-2xs">
        <h3 className="text-base font-bold font-heading theme-main-text border-b theme-border pb-3">
          Pedagogical Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 theme-surface-subtle rounded-2xl border theme-border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold theme-main-text block">Default Lesson Style</span>
              <span className="text-[11px] theme-secondary-text">Initial view mode for lessons</span>
            </div>
            <select
              id="select-default-explanation-mode"
              value={settings.defaultExplanationMode}
              onChange={(e) => onUpdateSettings({ defaultExplanationMode: e.target.value as any })}
              className="theme-card border theme-border rounded-xl px-3 py-1.5 text-xs theme-main-text focus:outline-none focus:border-emerald-500"
            >
              <option value="eli15">Explain Like I'm 15</option>
              <option value="deep_dive">Technical Deep Dive</option>
            </select>
          </div>

          <div className="p-4 theme-surface-subtle rounded-2xl border theme-border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold theme-main-text block">Cloud Synchronization</span>
              <span className="text-[11px] theme-secondary-text">Firestore Persistence</span>
            </div>
            <span className="text-xs font-mono font-bold theme-primary-text theme-soft-accent-bg px-2.5 py-1 rounded-full border theme-border">
              {currentUser ? 'Active & Synced' : 'Offline / Guest'}
            </span>
          </div>
        </div>
      </div>

      {/* Backup & Export Section */}
      <div className="theme-card border theme-border rounded-3xl p-6 md:p-8 space-y-4 shadow-2xs">
        <h3 className="text-base font-bold font-heading theme-main-text">Data Export & Backup</h3>
        <p className="text-xs theme-secondary-text leading-relaxed">
          Download a clean JSON archive containing your completed roadmap badges, quiz scores, paper portfolio positions, and journal reflections.
        </p>

        <button
          type="button"
          id="btn-export-learning-data"
          onClick={handleExportData}
          className="px-5 py-2.5 theme-surface-subtle hover:theme-surface-elevated theme-main-text text-xs font-bold rounded-xl border theme-border flex items-center gap-2 cursor-pointer transition-all interactive-btn"
        >
          <Download className="w-4 h-4 theme-primary-text" />
          <span>Export Educational Data (JSON)</span>
        </button>
      </div>

      {/* Reset Progress Danger Zone */}
      <div className="theme-card border border-rose-500/30 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xs">
        <h3 className="text-base font-bold text-rose-500 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Reset Learning Progress</span>
        </h3>
        <p className="text-xs theme-secondary-text leading-relaxed">
          This will reset your completed lessons, quiz scores, paper trading positions, and reset your virtual balance back to ₹1,00,000. Your user account and login will remain intact.
        </p>

        {!confirmReset ? (
          <button
            type="button"
            id="btn-confirm-reset-trigger"
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Reset All Learning Progress
          </button>
        ) : (
          <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/30 space-y-3">
            <span className="text-xs text-rose-500 font-semibold block">
              Are you sure? This action will reset your progress to Level 1.
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                id="btn-execute-reset"
                onClick={handleDoReset}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Yes, Reset Everything
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 theme-surface-subtle theme-main-text text-xs font-semibold rounded-xl border theme-border hover:theme-surface-elevated cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resetSuccess && (
          <div className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Learning progress and virtual cash successfully reset to baseline!</span>
          </div>
        )}
      </div>

      {/* Admin Command Portal Card */}
      <div className="theme-card border border-emerald-500/30 rounded-3xl p-6 space-y-4 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-heading theme-main-text">
                  Admin Command Portal
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  {currentUser?.email?.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase() ? 'Authorized Owner' : 'Owner Protected'}
                </span>
              </div>
              <p className="text-xs theme-secondary-text mt-0.5">
                Live user management, system metrics, audit logs, and AI Mentor analytics for {ADMIN_OWNER_EMAIL}.
              </p>
            </div>
          </div>

          {onNavigateToAdmin && (
            <button
              type="button"
              id="btn-settings-open-admin"
              onClick={onNavigateToAdmin}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] shrink-0"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Launch Admin Portal</span>
            </button>
          )}
        </div>
      </div>

      {/* Cloud Account & Sign Out */}
      <div className="theme-card border theme-border rounded-3xl p-6 space-y-4 shadow-2xs">
        <h3 className="text-sm font-bold font-heading theme-main-text flex items-center gap-2">
          <Cloud className="w-4 h-4 theme-primary-text" />
          <span>Cloud Account & Synchronization</span>
        </h3>
        
        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 theme-surface-subtle rounded-2xl border theme-border">
            <div>
              <div className="text-xs font-bold theme-main-text">Signed in via Firebase</div>
              <div className="text-xs theme-secondary-text">{currentUser.email || currentUser.displayName || 'Connected User'}</div>
            </div>
            <button
              type="button"
              id="btn-settings-signout"
              onClick={onSignOut}
              className="px-4 py-2 theme-card hover:bg-rose-500/10 text-rose-500 rounded-xl text-xs font-semibold border theme-border hover:border-rose-500/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 theme-surface-subtle rounded-2xl border theme-border">
            <div>
              <div className="text-xs font-bold theme-main-text">Guest Mode (Local Storage)</div>
              <div className="text-xs theme-secondary-text">Your trades and progress are stored safely in your browser.</div>
            </div>
            {onOpenAuthModal && (
              <button
                type="button"
                id="btn-settings-cloud-sync"
                onClick={onOpenAuthModal}
                className="px-4 py-2 theme-btn-primary text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>Sync with Cloud</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={profile}
        currentUser={currentUser}
        onProfileUpdated={(updatedProfile) => {
          if (onUpdateProfile) {
            onUpdateProfile(updatedProfile);
          }
        }}
      />
    </div>
  );
};
