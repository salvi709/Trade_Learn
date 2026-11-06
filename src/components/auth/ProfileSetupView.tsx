import React, { useState, useEffect } from 'react';
import { 
  User, 
  AtSign, 
  Calendar, 
  Check, 
  CheckCircle2, 
  Palette, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { AppTheme, ExperienceLevel, UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { AVATAR_OPTIONS, getAvatarById, DEFAULT_AVATAR_ID } from '../../config/avatars';
import { validateUsername } from '../../utils/username';
import { checkUsernameAvailability } from '../../services/firebase';

export interface ProfileSetupViewProps {
  initialProfile?: Partial<UserProfile> | null;
  userEmail?: string;
  onComplete: (completedProfile: Partial<UserProfile>) => Promise<void> | void;
}

export const ProfileSetupView: React.FC<ProfileSetupViewProps> = ({
  initialProfile,
  onComplete,
}) => {
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState<string>(initialProfile?.displayName || '');
  const [username, setUsername] = useState<string>(initialProfile?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<string>(initialProfile?.avatarId || DEFAULT_AVATAR_ID);
  const [birthday, setBirthday] = useState<string>(initialProfile?.birthday || '');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(initialProfile?.experienceLevel || 'beginner');
  const [learningGoals, setLearningGoals] = useState<string[]>(
    initialProfile?.learningGoals || ['basics', 'risk_management']
  );
  const initialResolvedTheme: AppTheme =
    initialProfile?.theme === 'premium_emerald' || initialProfile?.theme === 'royal_blue'
      ? initialProfile.theme
      : 'royal_blue';
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(initialResolvedTheme);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // On mount: ensure page starts at the top and active theme matches selectedTheme immediately
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (theme !== selectedTheme) {
      setTheme(selectedTheme);
    }
  }, []);

  // Toggle Goal selection
  const toggleGoal = (goalKey: string) => {
    if (goalKey === 'everything') {
      if (learningGoals.includes('everything')) {
        setLearningGoals(['basics']);
      } else {
        setLearningGoals(['basics', 'investing', 'trading', 'technical_analysis', 'risk_management', 'everything']);
      }
      return;
    }

    setLearningGoals((prev) => {
      const filtered = prev.filter((g) => g !== 'everything');
      if (filtered.includes(goalKey)) {
        return filtered.filter((g) => g !== goalKey);
      } else {
        return [...filtered, goalKey];
      }
    });
  };

  const handleFinishSetup = async () => {
    setSubmitError(null);
    setUsernameError(null);

    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      setSubmitError('Please enter your name to personalize your learning account.');
      return;
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      const val = validateUsername(trimmedUsername);
      if (!val.isValid) {
        setUsernameError(val.error || 'Invalid username format.');
        return;
      }
      try {
        const check = await checkUsernameAvailability(val.normalized, initialProfile?.uid);
        if (!check.available) {
          setUsernameError(check.reason || 'This username is already taken. Please choose another.');
          return;
        }
      } catch (err) {
        console.warn('Username check warning:', err);
      }
    }

    setIsSubmitting(true);
    try {
      setTheme(selectedTheme);
      await onComplete({
        displayName: trimmedDisplayName,
        username: trimmedUsername || undefined,
        avatarId,
        birthday,
        experienceLevel,
        learningGoals,
        theme: selectedTheme,
        onboardingCompleted: true,
        appIntroductionCompleted: false,
      });
    } catch (err: any) {
      console.warn('Profile completion error:', err);
      setSubmitError(err?.message || 'Failed to save your profile to the database. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 theme-bg transition-colors duration-300">
      <div 
        id="profile-setup-screen"
        className="max-w-2xl w-full theme-card rounded-3xl border theme-border theme-card-shadow p-6 sm:p-10 space-y-8 animate-in fade-in duration-300 my-6 shadow-xl"
      >
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[11px] font-mono font-bold theme-primary-text theme-soft-accent-bg border theme-border px-3 py-1 rounded-full uppercase tracking-wider">
            Profile Personalization
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading theme-main-text pt-1">
            Customize Your Educational Journey
          </h2>
          <p className="text-xs sm:text-sm theme-secondary-text">
            Personalize your identity, avatar, experience level, and visual theme before entering the platform.
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Name, Username & Birthday */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold theme-main-text block mb-1.5">
                1. What is your name? <span className="text-emerald-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 theme-muted-text absolute left-3 top-3.5" />
                <input
                  type="text"
                  id="input-setup-name"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  placeholder="e.g. Sarthak Salvi"
                  className="w-full pl-9 pr-3 py-2.5 theme-surface-subtle border theme-border rounded-xl text-xs theme-main-text focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold theme-main-text block mb-1.5">
                2. Choose username (optional)
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 theme-muted-text absolute left-3 top-3.5" />
                <input
                  type="text"
                  id="input-setup-username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError) setUsernameError(null);
                  }}
                  placeholder="e.g. sarthak_trader"
                  className={`w-full pl-9 pr-3 py-2.5 theme-surface-subtle border rounded-xl text-xs theme-main-text focus:outline-none font-mono transition-colors ${
                    usernameError ? 'border-rose-500 focus:border-rose-500' : 'theme-border focus:border-emerald-500'
                  }`}
                />
              </div>
              {usernameError && (
                <p className="text-[10px] text-rose-500 mt-1">{usernameError}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold theme-main-text block mb-1.5">
                3. When is your birthday?
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 theme-muted-text absolute left-3 top-3.5" />
                <input
                  type="date"
                  id="input-setup-birthday"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 theme-surface-subtle border theme-border rounded-xl text-xs theme-main-text focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Choose Profile Avatar */}
          <div className="space-y-2">
            <label className="text-xs font-bold theme-main-text block flex items-center justify-between">
              <span>2. Choose your Financial Persona Avatar:</span>
              <span className="text-[11px] font-normal theme-secondary-text">
                Selected: <strong className="theme-main-text">{getAvatarById(avatarId).name}</strong>
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {AVATAR_OPTIONS.map((av) => {
                const isSelected = avatarId === av.id;
                return (
                  <div
                    key={av.id}
                    id={`avatar-option-${av.id}`}
                    onClick={() => setAvatarId(av.id)}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-between ${
                      isSelected
                        ? 'border-emerald-500 theme-soft-accent-bg ring-2 ring-emerald-500/20 shadow-xs'
                        : 'theme-border theme-surface-subtle hover:theme-surface-elevated'
                    }`}
                  >
                    <div className="text-2xl mb-1">{av.svgIcon}</div>
                    <div className="font-bold text-[11px] theme-main-text leading-tight truncate w-full">
                      {av.name}
                    </div>
                    <span className="text-[9px] theme-muted-text font-mono mt-1 block truncate w-full">
                      {av.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Current Experience */}
          <div className="space-y-2">
            <label className="text-xs font-bold theme-main-text block">
              3. What is your current stock market experience?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'beginner', label: 'Complete beginner', desc: 'New to finance, stocks, and terminology' },
                { id: 'basics', label: 'I know the basics', desc: 'Know what stocks are, but never traded' },
                { id: 'charts', label: "I've studied charts", desc: 'Familiar with candlesticks & support/resistance' },
                { id: 'paper_trader', label: "I've tried paper trading", desc: 'Practiced simulations or placed real trades' },
              ].map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => setExperienceLevel(exp.id as ExperienceLevel)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    experienceLevel === exp.id
                      ? 'border-emerald-500 theme-soft-accent-bg shadow-xs ring-1 ring-emerald-500/30'
                      : 'theme-border theme-surface-subtle hover:theme-surface-elevated'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs theme-main-text">{exp.label}</div>
                    {experienceLevel === exp.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] theme-secondary-text mt-0.5">{exp.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 4: What do you want to learn? (Checkboxes) */}
          <div className="space-y-2">
            <label className="text-xs font-bold theme-main-text block">
              4. What do you want to learn? (Select all that apply)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'basics', label: 'Stock Market Basics' },
                { id: 'investing', label: 'Long-term Investing' },
                { id: 'trading', label: 'Short-term Trading' },
                { id: 'technical_analysis', label: 'Technical Analysis' },
                { id: 'risk_management', label: 'Risk Management' },
                { id: 'everything', label: 'Everything' },
              ].map((goal) => {
                const isChecked = learningGoals.includes(goal.id);
                return (
                  <div
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                      isChecked
                        ? 'theme-soft-accent-bg border-emerald-500 theme-main-text font-bold'
                        : 'theme-surface-subtle theme-border theme-secondary-text hover:theme-surface-elevated'
                    }`}
                  >
                    <span className="truncate">{goal.label}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                      isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'theme-border theme-card'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 5: Visual Theme Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold theme-main-text block flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-emerald-500" />
              <span>5. Choose your visual theme:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Theme 1: Donezo Light */}
              <div
                id="theme-choice-royal-blue"
                onClick={() => {
                  setSelectedTheme('royal_blue');
                  setTheme('royal_blue');
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedTheme === 'royal_blue'
                    ? 'border-[#0D6847] shadow-md ring-2 ring-[#0D6847]/20 theme-card'
                    : 'theme-border theme-surface-subtle hover:theme-surface-elevated'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-xs theme-main-text">
                    Donezo Light
                  </div>
                  {selectedTheme === 'royal_blue' && (
                    <span className="text-[10px] font-bold bg-[#0D6847] text-white px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] theme-secondary-text mb-3 leading-tight">
                  Clean bright canvas with rich forest green primary CTA, deep charcoal text, and fresh mint highlights.
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md border border-slate-300 shadow-2xs" style={{ backgroundColor: '#F4F5F7' }} title="Canvas" />
                  <div className="w-6 h-6 rounded-md shadow-2xs" style={{ backgroundColor: '#0D6847' }} title="Primary Forest Green" />
                  <div className="w-6 h-6 rounded-md shadow-2xs" style={{ backgroundColor: '#10B981' }} title="Accent Emerald" />
                  <div className="w-6 h-6 rounded-md shadow-2xs" style={{ backgroundColor: '#E6F4ED' }} title="Mint Soft Accent" />
                </div>
              </div>

              {/* Theme 2: Modern Dark */}
              <div
                id="theme-choice-premium-emerald"
                onClick={() => {
                  setSelectedTheme('premium_emerald');
                  setTheme('premium_emerald');
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedTheme === 'premium_emerald'
                    ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20 theme-card'
                    : 'theme-border theme-surface-subtle hover:theme-surface-elevated'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-xs theme-main-text">
                    Modern Dark
                  </div>
                  {selectedTheme === 'premium_emerald' && (
                    <span className="text-[10px] font-bold bg-emerald-500 text-black px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] theme-secondary-text mb-3 leading-tight">
                  Deep black canvas with unified brand emerald green accents, white text, and elevated dark cards.
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md border border-slate-800 shadow-2xs" style={{ backgroundColor: '#000000' }} title="True Black Canvas" />
                  <div className="w-6 h-6 rounded-md border border-slate-800 shadow-2xs" style={{ backgroundColor: '#0D1117' }} title="Dark Card" />
                  <div className="w-6 h-6 rounded-md shadow-2xs" style={{ backgroundColor: '#10B981' }} title="ShareMarket Emerald Green" />
                  <div className="w-6 h-6 rounded-md shadow-2xs" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }} title="Emerald Soft Accent" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert Box */}
        {submitError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Profile Save Error</span>
              <span>{submitError}</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            id="btn-continue-to-app"
            disabled={isSubmitting}
            onClick={handleFinishSetup}
            className="w-full py-3.5 theme-btn-primary font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>Continue to App</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
