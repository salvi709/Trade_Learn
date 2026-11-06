import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Mail, 
  Lock, 
  User, 
  Calendar, 
  BookOpen, 
  Palette, 
  AlertCircle,
  ShieldCheck,
  AtSign,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { AppTheme, ExperienceLevel, UserProfile } from '../../types';
import { auth, googleProvider, fetchUserProfile, checkUsernameAvailability } from '../../services/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { AVATAR_OPTIONS, getAvatarById, DEFAULT_AVATAR_ID } from '../../config/avatars';
import { APP_NAME, APP_TAGLINE, APP_LOGO } from '../../config/branding';
import { validateUsername } from '../../utils/username';
import { 
  getFriendlyAuthErrorMessage, 
  isOperationNotAllowed, 
  FIREBASE_AUTH_PROVIDERS_URL 
} from '../../utils/authErrors';

interface LandingExperienceProps {
  onComplete: (profile: Partial<UserProfile>) => void;
  onExploreAsGuest: () => void;
  initialStep?: 'splash' | 'get_started' | 'auth' | 'setup';
  existingProfile?: UserProfile | null;
}

export const LandingExperience: React.FC<LandingExperienceProps> = ({
  onComplete,
  onExploreAsGuest,
  initialStep = 'splash',
  existingProfile
}) => {
  const { theme, setTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState<'splash' | 'get_started' | 'auth' | 'setup'>(initialStep);

  // Keyboard shortcut listener to press Enter or Space to continue on landing
  useEffect(() => {
    if (currentStep !== 'splash') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setCurrentStep('get_started');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  // Auth State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOpDisabled, setIsOpDisabled] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Setup Form State
  const [displayName, setDisplayName] = useState<string>(existingProfile?.displayName || '');
  const [username, setUsername] = useState<string>(existingProfile?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<string>(existingProfile?.avatarId || DEFAULT_AVATAR_ID);
  const [birthday, setBirthday] = useState<string>(existingProfile?.birthday || '');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(existingProfile?.experienceLevel || 'beginner');
  const [learningGoals, setLearningGoals] = useState<string[]>(
    existingProfile?.learningGoals || ['basics', 'risk_management']
  );
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(existingProfile?.theme || theme);

  // Check returning user or advance to setup
  const checkUserAfterAuth = async (uid: string, defaultName?: string) => {
    try {
      const existing = await fetchUserProfile(uid);
      if (existing && existing.onboardingCompleted) {
        onComplete(existing);
        return;
      }
    } catch (e) {
      console.warn('Profile lookup note:', e);
    }
    if (defaultName && !displayName) {
      setDisplayName(defaultName);
    }
    setCurrentStep('setup');
  };

  // Handle Google Auth
  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      onComplete({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Learner',
        onboardingCompleted: true,
      });
    } catch (err: any) {
      setAuthError(getFriendlyAuthErrorMessage(err, 'login'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Email Auth
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setIsOpDisabled(false);
    try {
      if (authMode === 'LOGIN') {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        onComplete({
          uid: cred.user.uid,
          email: cred.user.email || email,
          displayName: cred.user.displayName || email.split('@')[0],
          onboardingCompleted: true,
        });
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        onComplete({
          uid: cred.user.uid,
          email: cred.user.email || email,
          displayName: cred.user.displayName || email.split('@')[0],
          onboardingCompleted: true,
        });
      }
    } catch (err: any) {
      setIsOpDisabled(isOperationNotAllowed(err));
      setAuthError(getFriendlyAuthErrorMessage(err, authMode === 'LOGIN' ? 'login' : 'signup'));
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Please enter your email address first to receive a password reset link.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthNotice('Password reset link sent to your email address!');
      setAuthError(null);
    } catch (err: any) {
      setAuthError(getFriendlyAuthErrorMessage(err));
    }
  };

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

  // Finish Onboarding
  const handleFinishSetup = async () => {
    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      const val = validateUsername(trimmedUsername);
      if (!val.isValid) {
        setUsernameError(val.error || 'Invalid username');
        return;
      }
      try {
        const check = await checkUsernameAvailability(val.normalized);
        if (!check.available) {
          setUsernameError(check.reason || 'This username is already taken.');
          return;
        }
      } catch (err) {
        console.warn('Username check warning:', err);
      }
    }

    setTheme(selectedTheme);
    onComplete({
      displayName: displayName.trim() || 'Learner',
      username: trimmedUsername || undefined,
      avatarId,
      birthday,
      experienceLevel,
      learningGoals,
      theme: selectedTheme,
      onboardingCompleted: true,
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 theme-bg transition-colors duration-300">
      {/* SCREEN 1: POLISHED HERO LANDING EXPERIENCE */}
      {currentStep === 'splash' && (
        <div 
          id="landing-hero-screen"
          className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-center py-6 sm:py-10 px-4 select-none"
        >
          {/* Phase 1: Subtle Bright Ambient Motion Background */}
          <div className="absolute -top-16 -left-12 w-72 h-72 rounded-full theme-soft-accent-bg blur-3xl opacity-40 anim-landing-bg pointer-events-none" />
          <div 
            className="absolute -bottom-16 -right-12 w-72 h-72 rounded-full bg-slate-200/60 blur-3xl opacity-40 anim-landing-bg pointer-events-none" 
            style={{ animationDelay: '-11s' }} 
          />

          {/* Main Hero Card — Editorial / Modern Fintech Bento Soft-UI */}
          <div className="relative z-10 w-full bg-white/95 backdrop-blur-md rounded-3xl sm:rounded-4xl border theme-border theme-card-shadow p-7 sm:p-11 text-center flex flex-col items-center shadow-lg">
            
            {/* Quick Skip button for returning users / instant access */}
            <button
              type="button"
              id="btn-skip-landing"
              onClick={() => setCurrentStep('get_started')}
              className="absolute top-5 right-5 sm:top-6 sm:right-6 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              Skip
            </button>

            {/* Phase 2: Logo Entrance */}
            <div className="anim-landing-logo relative mb-5 sm:mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white border theme-border shadow-xs p-2.5 flex items-center justify-center">
                <img 
                  src={APP_LOGO} 
                  alt={APP_NAME} 
                  className="w-full h-full object-contain rounded-2xl" 
                />
              </div>
            </div>

            {/* Phase 3: App Name Entrance */}
            <div className="anim-landing-title space-y-1 mb-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading text-slate-900 tracking-tight">
                {APP_NAME}
              </h1>
            </div>

            {/* Phase 4: Tagline & Editorial Value Proposition */}
            <div className="anim-landing-tagline space-y-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full theme-soft-accent-bg border theme-border">
                <span className="text-[11px] sm:text-xs font-mono font-bold theme-primary-text tracking-wider uppercase">
                  {APP_TAGLINE}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Learning the stock market can be simple.
              </p>
            </div>

            {/* Phase 5: Subtle Decorative Learning / Market Animation */}
            <div className="anim-landing-chart-container w-full max-w-xs mx-auto my-2 px-1">
              <div className="relative h-16 w-full flex items-center justify-center">
                <svg 
                  className="w-full h-full overflow-visible" 
                  viewBox="0 0 300 70" 
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="landingLineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--app-primary)" stopOpacity="0.4" />
                      <stop offset="60%" stopColor="var(--app-primary)" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#16A66A" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="landingAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--app-primary)" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="var(--app-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Soft area fill beneath trajectory */}
                  <path
                    d="M 12 58 C 65 58, 100 44, 150 40 C 200 36, 240 20, 288 12 L 288 66 L 12 66 Z"
                    fill="url(#landingAreaGrad)"
                    className="anim-landing-nodes"
                  />

                  {/* Smooth learning line */}
                  <path
                    d="M 12 58 C 65 58, 100 44, 150 40 C 200 36, 240 20, 288 12"
                    stroke="url(#landingLineGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="anim-landing-chart"
                  />

                  {/* Milestone 1: Foundations */}
                  <g className="anim-landing-nodes">
                    <circle cx="12" cy="58" r="3.5" fill="var(--app-primary)" />
                    <circle cx="12" cy="58" r="7" stroke="var(--app-primary)" strokeOpacity="0.25" strokeWidth="1.5" />
                  </g>

                  {/* Milestone 2: Risk Discipline */}
                  <g className="anim-landing-nodes">
                    <circle cx="150" cy="40" r="3.5" fill="var(--app-primary)" />
                    <circle cx="150" cy="40" r="7" stroke="var(--app-primary)" strokeOpacity="0.25" strokeWidth="1.5" />
                  </g>

                  {/* Milestone 3: Execution Confidence */}
                  <g className="anim-landing-nodes">
                    <circle cx="288" cy="12" r="4" fill="#16A66A" />
                    <circle cx="288" cy="12" r="8" stroke="#16A66A" strokeOpacity="0.35" strokeWidth="2" />
                  </g>
                </svg>
              </div>

              {/* Milestone labels */}
              <div className="anim-landing-nodes flex items-center justify-between text-[10px] font-mono text-slate-400 px-2 pt-1.5">
                <span>Foundations</span>
                <span>Discipline</span>
                <span className="text-[#16A66A] font-semibold">Confidence</span>
              </div>
            </div>

            {/* Phase 6: Continue Button */}
            <div className="anim-landing-continue pt-5 w-full flex flex-col items-center">
              <button
                type="button"
                id="btn-landing-continue"
                onClick={() => setCurrentStep('get_started')}
                className="group w-full sm:w-auto min-w-[200px] px-8 py-3.5 sm:py-4 theme-btn-primary font-bold text-sm sm:text-base rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <p className="text-[11px] text-slate-400 mt-2.5 font-normal">
                Press <kbd className="font-mono text-slate-500 font-semibold px-1 py-0.5 bg-slate-100 rounded text-[10px]">Enter</kbd> or click to proceed
              </p>
            </div>

          </div>
        </div>
      )}

      {/* SCREEN 2: GET STARTED SCREEN */}
      {currentStep === 'get_started' && (
        <div 
          id="get-started-screen"
          className="max-w-xl w-full bg-white rounded-3xl border theme-border theme-card-shadow p-6 sm:p-10 space-y-8 animate-in fade-in duration-300"
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-white border theme-border p-1 mx-auto shadow-md flex items-center justify-center">
              <img src={APP_LOGO} alt={APP_NAME} className="w-full h-full object-contain rounded-xl" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 tracking-tight">
              {APP_NAME}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              From understanding your first share to practicing in our ₹1,00,000 risk-free simulator.
            </p>
          </div>

          {/* Three core pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-xl theme-soft-accent-bg theme-primary-text flex items-center justify-center mx-auto">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-slate-900 uppercase font-mono">1. Learn</div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Intuitive analogies, zero jargon, and clear valuation math.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-xl theme-soft-accent-bg theme-primary-text flex items-center justify-center mx-auto">
                <Compass className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-slate-900 uppercase font-mono">2. Understand</div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Order books, market mechanics, and risk management limits.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-xl theme-soft-accent-bg theme-primary-text flex items-center justify-center mx-auto">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-slate-900 uppercase font-mono">3. Practice</div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Virtual ₹1,00,000 simulator, live order slips, and journaling.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              id="btn-get-started-cta"
              onClick={() => setCurrentStep('auth')}
              className="w-full py-3.5 theme-btn-primary font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Get Started / Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-guest-explore"
              onClick={onExploreAsGuest}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Explore as Guest (Offline Demo)
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: FIREBASE AUTHENTICATION */}
      {currentStep === 'auth' && (
        <div 
          id="auth-screen"
          className="max-w-md w-full bg-white rounded-3xl border theme-border theme-card-shadow p-6 sm:p-8 space-y-6 animate-in fade-in duration-300"
        >
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono font-bold theme-primary-text theme-soft-accent-bg border theme-border px-3 py-1 rounded-full uppercase tracking-wider">
              Authentication & Cloud Sync
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900">
              {authMode === 'LOGIN' ? 'Sign In to Your Account' : 'Create Your Free Account'}
            </h2>
            <p className="text-xs text-slate-600">
              Save your learning roadmap badges, custom journal theses, and simulator trades permanently.
            </p>
          </div>

          {authError && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{authError}</span>
                </div>
              </div>

              {isOpDisabled && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-slate-700 space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>How to enable Email/Password in Firebase:</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Open your Firebase Console.</li>
                    <li>Navigate to <strong>Build &gt; Authentication &gt; Sign-in method</strong>.</li>
                    <li>Select <strong>Email/Password</strong> and toggle <strong>Enable</strong> ON, then click <strong>Save</strong>.</li>
                  </ol>
                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <a
                      href={FIREBASE_AUTH_PROVIDERS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-colors"
                    >
                      <span>Open Firebase Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      <span>Use Google Sign-In</span>
                    </button>
                    <button
                      type="button"
                      onClick={onExploreAsGuest}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      <span>Explore as Guest</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {authNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authNotice}</span>
            </div>
          )}

          {/* Google Continue */}
          <button
            type="button"
            id="btn-google-sign-in"
            onClick={handleGoogleAuth}
            disabled={authLoading}
            className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 text-slate-400 text-[11px] font-semibold">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span>OR CONTINUE WITH EMAIL</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  id="input-auth-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                {authMode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] theme-primary-text hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  id="input-auth-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-auth"
              disabled={authLoading}
              className="w-full py-3 theme-btn-primary font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {authLoading ? 'Processing...' : authMode === 'LOGIN' ? 'Log In' : 'Create Free Account'}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="text-center pt-1">
            <button
              type="button"
              id="btn-toggle-auth-mode"
              onClick={() => {
                setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                setAuthError(null);
                setAuthNotice(null);
              }}
              className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {authMode === 'LOGIN' ? (
                <span>Need an account? <strong className="theme-primary-text underline">Create one free</strong></span>
              ) : (
                <span>Already have an account? <strong className="theme-primary-text underline">Log in here</strong></span>
              )}
            </button>
          </div>

          <div className="text-center border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setCurrentStep('setup')}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Skip auth for now & customize profile →
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4: FIRST-TIME PROFILE SETUP WITH AVATAR SELECTION */}
      {currentStep === 'setup' && (
        <div 
          id="profile-setup-screen"
          className="max-w-2xl w-full bg-white rounded-3xl border theme-border theme-card-shadow p-6 sm:p-10 space-y-8 animate-in fade-in duration-300 my-6"
        >
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-mono font-bold theme-primary-text theme-soft-accent-bg border theme-border px-3 py-1 rounded-full uppercase tracking-wider">
              Profile Personalization
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 pt-1">
              Customize Your Educational Journey
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Personalize your identity, avatar, experience level, and visual theme.
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1: Name, Username & Birthday */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  1. What is your name?
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    id="input-setup-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Sarthak Salvi"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  2. Choose username
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    id="input-setup-username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (usernameError) setUsernameError(null);
                    }}
                    placeholder="e.g. sarthak_trader"
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white font-mono ${
                      usernameError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                </div>
                {usernameError && (
                  <p className="text-[10px] text-rose-600 mt-1">{usernameError}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  3. When is your birthday?
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="date"
                    id="input-setup-birthday"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Choose Profile Avatar */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block flex items-center justify-between">
                <span>3. Choose your Financial Persona Avatar:</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Selected: <strong className="text-slate-800">{getAvatarById(avatarId).name}</strong>
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
                          ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{av.svgIcon}</div>
                      <div className="font-bold text-[11px] text-slate-900 leading-tight truncate w-full">
                        {av.name}
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono mt-1 block truncate w-full">
                        {av.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Current Experience */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                4. What is your current stock market experience?
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
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600/30'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900">{exp.label}</div>
                      {experienceLevel === exp.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{exp.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 5: What do you want to learn? (Checkboxes) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                5. What do you want to learn? (Select all that apply)
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
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{goal.label}</span>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 6: Visual Theme Swatches */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-blue-600" />
                <span>6. Choose your visual theme:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Theme 1: Royal Blue */}
                <div
                  id="theme-choice-royal-blue"
                  onClick={() => {
                    setSelectedTheme('royal_blue');
                    setTheme('royal_blue');
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedTheme === 'royal_blue'
                      ? 'border-[#3157D5] shadow-md ring-2 ring-[#3157D5]/20 bg-white'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-xs text-[#172033]">
                      Royal Blue
                    </div>
                    {selectedTheme === 'royal_blue' && (
                      <span className="text-[10px] font-bold bg-[#3157D5] text-white px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#667085] mb-3 leading-tight">
                    Clean bright canvas with deep royal blue primary, high-contrast navy text, and sky blue accents.
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md border border-slate-300 shadow-2xs" style={{ backgroundColor: '#F7F9FC' }} title="Background" />
                    <div className="w-6 h-6 rounded-md shadow-2xs" style={{ backgroundColor: '#3157D5' }} title="Primary Royal Blue" />
                    <div className="w-6 h-6 rounded-md shadow-2xs" style={{ backgroundColor: '#5B7CFA' }} title="Secondary" />
                    <div className="w-6 h-6 rounded-md shadow-2xs" style={{ backgroundColor: '#DCE6FF' }} title="Soft Accent" />
                  </div>
                </div>

                {/* Theme 2: Premium Emerald */}
                <div
                  id="theme-choice-premium-emerald"
                  onClick={() => {
                    setSelectedTheme('premium_emerald');
                    setTheme('premium_emerald');
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedTheme === 'premium_emerald'
                      ? 'border-[#087F5B] shadow-md ring-2 ring-[#087F5B]/20 bg-white'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-xs text-[#17212B]">
                      Premium Emerald
                    </div>
                    {selectedTheme === 'premium_emerald' && (
                      <span className="text-[10px] font-bold bg-[#087F5B] text-white px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#667085] mb-3 leading-tight">
                    Clean bright canvas with rich emerald green primary, deep charcoal text, and fresh mint accents.
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md border border-slate-300 shadow-2xs" style={{ backgroundColor: '#F7F9FC' }} title="Background" />
                    <div className="w-6 h-6 rounded-md shadow-2xs" style={{ backgroundColor: '#087F5B' }} title="Primary Emerald" />
                    <div className="w-6 h-6 rounded-md shadow-2xs" style={{ backgroundColor: '#36B37E' }} title="Secondary" />
                    <div className="w-6 h-6 rounded-md shadow-2xs" style={{ backgroundColor: '#DDF5EC' }} title="Soft Accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              id="btn-start-my-journey"
              onClick={handleFinishSetup}
              className="w-full py-3.5 theme-btn-primary font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Start My Journey</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
