import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  ExternalLink,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  authenticateSignIn, 
  authenticateSignUp
} from '../../services/firebase';
import { 
  signInWithPopup, 
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFriendlyAuthErrorMessage, 
  isOperationNotAllowed, 
  isUnauthorizedDomain,
  FIREBASE_AUTH_PROVIDERS_URL,
  FIREBASE_AUTH_SETTINGS_URL
} from '../../utils/authErrors';
import { APP_NAME } from '../../config/branding';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onContinueAsGuest?: () => void;
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onContinueAsGuest,
  initialMode = 'LOGIN' 
}) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOpDisabled, setIsOpDisabled] = useState<boolean>(false);
  const [isUnauthorizedDomainState, setIsUnauthorizedDomainState] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync initialMode when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setErrorMsg(null);
      setIsOpDisabled(false);
      setIsUnauthorizedDomainState(false);
      setNoticeMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setNoticeMsg(null);
    setIsOpDisabled(false);
    setIsUnauthorizedDomainState(false);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Google sign-in attempt notice:', err);
      const unauthDomain = isUnauthorizedDomain(err);
      setIsUnauthorizedDomainState(unauthDomain);
      setIsOpDisabled(isOperationNotAllowed(err));
      setErrorMsg(getFriendlyAuthErrorMessage(err, 'login'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsOpDisabled(false);
    setIsUnauthorizedDomainState(false);
    setNoticeMsg(null);
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'LOGIN') {
        await authenticateSignIn(email, password);
      } else {
        await authenticateSignUp(email, password);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Email auth attempt notice:', err);
      const opDisabled = isOperationNotAllowed(err) || err.message?.includes('Firebase Console');
      setIsOpDisabled(opDisabled);
      setIsUnauthorizedDomainState(false);
      setErrorMsg(getFriendlyAuthErrorMessage(err, authMode === 'LOGIN' ? 'login' : 'signup'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Please enter your email address first to receive a password reset link.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setNoticeMsg('Password reset link sent to your email!');
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(getFriendlyAuthErrorMessage(err));
    }
  };

  const handleGuestEntry = () => {
    onClose();
    if (onContinueAsGuest) {
      onContinueAsGuest();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 dark:bg-black/85 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      {/* Modal Surface */}
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gradient-to-b dark:from-gray-950 dark:via-gray-950 dark:to-black p-6 sm:p-8 relative shadow-2xl space-y-5 text-slate-900 dark:text-white">
        {/* Subtle emerald top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-52 h-20 bg-emerald-500/10 blur-[60px] pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-900/80 border border-transparent hover:border-slate-200 dark:hover:border-gray-800 transition-all cursor-pointer interactive-btn"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="text-center space-y-3 pt-1">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#095237] via-[#0D6847] to-emerald-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-emerald-600/25 mx-auto">
            TQ
          </div>
          <div>
            <aside className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-gray-800 bg-slate-100/80 dark:bg-gray-900/80 backdrop-blur-sm mb-2">
              <span className="w-2 h-2 rounded-full bg-[#0D6847] dark:bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-slate-700 dark:text-gray-300 font-medium font-mono">
                {APP_NAME} &bull; Cloud Sync
              </span>
            </aside>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              {authMode === 'LOGIN' ? 'Welcome Back' : 'Create Free Account'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto mt-1">
              {authMode === 'LOGIN'
                ? 'Sign in to access your modules, journal notes, and paper portfolio on any device.'
                : 'Save your learning badges, custom journal theses, and simulation performance permanently.'}
            </p>
          </div>
        </div>

        {/* Segmented Auth Mode Switcher */}
        <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => {
              setAuthMode('LOGIN');
              setErrorMsg(null);
              setIsOpDisabled(false);
              setIsUnauthorizedDomainState(false);
              setNoticeMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer interactive-btn ${
              authMode === 'LOGIN'
                ? 'bg-white dark:bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('REGISTER');
              setErrorMsg(null);
              setIsOpDisabled(false);
              setIsUnauthorizedDomainState(false);
              setNoticeMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer interactive-btn ${
              authMode === 'REGISTER'
                ? 'bg-white dark:bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/90 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-900 dark:text-white font-semibold text-xs flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer interactive-btn disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

        <div className="flex items-center gap-3 text-slate-400 dark:text-gray-500 text-[10px] font-mono tracking-wider">
          <div className="flex-1 h-px bg-slate-200 dark:bg-gray-800/80"></div>
          <span>OR CONTINUE WITH EMAIL</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-gray-800/80"></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-gray-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="learner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-gray-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 interactive-input focus:outline-none focus:border-[#0D6847] dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-gray-300">Password</label>
              {authMode === 'LOGIN' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-medium text-[#0D6847] dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 interactive-input focus:outline-none focus:border-[#0D6847] dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 p-1 cursor-pointer transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-800 dark:text-rose-300 leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#B82E3B] dark:text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMsg}</span>
                </div>
              </div>

              {/* Dedicated Domain Authorization Helper Card */}
              {isUnauthorizedDomainState && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Authorize Domain for Google Sign-In</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-gray-300 leading-relaxed">
                    Firebase requires your current domain to be added to Authorized Domains before Google OAuth can open:
                  </p>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-black/60 border border-amber-200 dark:border-gray-800 rounded-xl">
                    <code className="text-[11px] font-mono text-[#0D6847] dark:text-emerald-400 flex-1 truncate select-all">
                      {typeof window !== 'undefined' ? window.location.hostname : 'current domain'}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(window.location.hostname);
                          setCopiedDomain(true);
                          setTimeout(() => setCopiedDomain(false), 2000);
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-[10px] font-mono font-semibold transition-colors cursor-pointer interactive-btn shrink-0"
                    >
                      {copiedDomain ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 dark:text-gray-400">
                    <li>Open Firebase Auth Settings below.</li>
                    <li>Scroll to <strong>Authorized domains</strong> and click <strong>Add domain</strong>.</li>
                    <li>Paste the copied domain and click <strong>Add</strong>.</li>
                  </ol>
                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <a
                      href={FIREBASE_AUTH_SETTINGS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-bold text-[11px] transition-colors interactive-btn"
                    >
                      <span>Open Firebase Settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={handleGuestEntry}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#0D6847]/30 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#0D6847] dark:text-emerald-300 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer interactive-btn"
                    >
                      <span>Continue as Guest</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dedicated Email/Password Provider Helper Card */}
              {isOpDisabled && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>How to enable Email/Password login:</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-700 dark:text-gray-300">
                    <li>
                      Open your Firebase Console: <br />
                      <a
                        href={FIREBASE_AUTH_PROVIDERS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-700 dark:text-amber-400 underline font-mono text-[10px] break-all hover:text-amber-900 dark:hover:text-amber-300"
                      >
                        {FIREBASE_AUTH_PROVIDERS_URL}
                      </a>
                    </li>
                    <li>
                      If you see a blue <strong>&quot;Get started&quot;</strong> button, click it first to initialize Authentication.
                    </li>
                    <li>
                      Click the <strong>Sign-in method</strong> tab (second tab at the top).
                    </li>
                    <li>
                      Click <strong>Email/Password</strong>, toggle <strong>Enable</strong> ON, and click <strong>Save</strong>.
                    </li>
                  </ol>
                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <a
                      href={FIREBASE_AUTH_PROVIDERS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-bold text-[11px] transition-colors interactive-btn"
                    >
                      <span>Open Firebase Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={handleGuestEntry}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#0D6847]/30 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#0D6847] dark:text-emerald-300 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer interactive-btn"
                    >
                      <span>Continue as Guest (Full Access)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {noticeMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-xs text-[#0D6847] dark:text-emerald-300 leading-relaxed flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0D6847] dark:text-emerald-400" />
              <span>{noticeMsg}</span>
            </div>
          )}

          {/* Primary CTA Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0D6847] hover:bg-[#095237] dark:bg-gradient-to-r dark:from-emerald-500 dark:via-emerald-400 dark:to-emerald-500 text-white dark:text-black font-semibold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer interactive-btn disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : authMode === 'LOGIN' ? 'Sign In to Sync' : 'Create Free Account'}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-gray-400 pt-1">
          {authMode === 'LOGIN' ? (
            <div className="w-full text-center">
              New to {APP_NAME}?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setIsOpDisabled(false);
                  setIsUnauthorizedDomainState(false);
                  setNoticeMsg(null);
                  setAuthMode('REGISTER');
                }}
                className="text-[#0D6847] dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
              >
                Create free account
              </button>
            </div>
          ) : (
            <div className="w-full text-center">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setIsOpDisabled(false);
                  setIsUnauthorizedDomainState(false);
                  setNoticeMsg(null);
                  setAuthMode('LOGIN');
                }}
                className="text-[#0D6847] dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
              >
                Sign in here
              </button>
            </div>
          )}
        </div>

        {/* Guest Exploration Link */}
        <div className="pt-2 border-t border-slate-200 dark:border-gray-900 text-center">
          <button
            type="button"
            onClick={handleGuestEntry}
            className="text-xs text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 interactive-btn font-medium"
          >
            <span>Continue as Guest (Full Risk-Free Simulator Access)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
