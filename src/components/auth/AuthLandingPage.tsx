import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Mail, 
  Lock, 
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { auth, googleProvider, authenticateSignIn, authenticateSignUp } from '../../services/firebase';
import { signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { APP_NAME, APP_TAGLINE } from '../../config/branding';
import { 
  getFriendlyAuthErrorMessage, 
  isOperationNotAllowed, 
  FIREBASE_AUTH_PROVIDERS_URL 
} from '../../utils/authErrors';

interface AuthLandingProps {
  onAuthenticated: () => void;
}

export const AuthLandingPage: React.FC<AuthLandingProps> = ({ onAuthenticated }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [isOpDisabled, setIsOpDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setNoticeMsg(null);
    setIsOpDisabled(false);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onAuthenticated();
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setErrorMsg('Pop-up window was blocked. Please allow popups or use Email & Password below.');
      } else {
        setErrorMsg(getFriendlyAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNoticeMsg(null);
    setIsOpDisabled(false);
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
      onAuthenticated();
    } catch (err: any) {
      setIsOpDisabled(isOperationNotAllowed(err));
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
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

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-black text-slate-900 dark:text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Subtle radial gradient glow matching landing page hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-emerald-950/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-emerald-500/5 dark:bg-emerald-900/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header aligned with landing page top navigation */}
      <header className="border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#095237] via-[#0D6847] to-emerald-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-emerald-600/25">
              TQ
            </div>
            <div>
              <span className="font-heading font-black text-sm tracking-tight text-slate-900 dark:text-white block">
                {APP_NAME}
              </span>
              <span className="text-[10px] font-mono text-[#0D6847] dark:text-emerald-400/90 block -mt-0.5">
                {APP_TAGLINE}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                setErrorMsg(null);
                setNoticeMsg(null);
              }}
              className="text-xs font-semibold text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50 dark:bg-white/5 transition-all cursor-pointer interactive-btn"
            >
              {authMode === 'LOGIN' ? 'Need an account?' : 'Already have account?'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col items-center justify-center text-center space-y-6 relative z-10 w-full">
        {/* Badge and Title matching Landing hero */}
        <div className="max-w-xl space-y-3">
          <aside className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#0D6847]/25 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-[#0D6847] dark:text-emerald-400 text-xs font-mono backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#0D6847] dark:text-emerald-400" />
            <span>Interactive Financial Simulation & Learning</span>
          </aside>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight text-slate-900 dark:text-white">
            {authMode === 'LOGIN' ? 'Sign in to TradeQuest' : 'Start Your Trading Journey'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
            {authMode === 'LOGIN'
              ? 'Access your saved curriculum progress, paper portfolio, and forensic journal notes.'
              : 'Master stock analysis, order types, and risk management with zero capital at risk.'}
          </p>
        </div>

        {/* Auth Card matching Landing Page Bento style */}
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-gray-950 dark:via-gray-950 dark:to-black p-6 sm:p-8 relative shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-5 text-left interactive-card">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-emerald-500/10 dark:bg-emerald-500/15 blur-[50px] pointer-events-none rounded-full" />

          {/* Mode Switcher */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-gray-900/90 border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setErrorMsg(null);
                setNoticeMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer interactive-btn ${
                authMode === 'LOGIN'
                  ? 'bg-white dark:bg-white text-slate-900 dark:text-black shadow-xs font-bold'
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
                setNoticeMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer interactive-btn ${
                authMode === 'REGISTER'
                  ? 'bg-white dark:bg-white text-slate-900 dark:text-black shadow-xs font-bold'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white font-semibold text-xs flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer interactive-btn disabled:opacity-50"
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
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
            <span>OR CONTINUE WITH EMAIL</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="learner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 interactive-input focus:outline-none focus:border-[#0D6847] dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-gray-300">Password</label>
                {authMode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-[#0D6847] dark:text-emerald-400 hover:underline cursor-pointer font-medium"
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
                  className="w-full bg-slate-50 dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 interactive-input focus:outline-none focus:border-[#0D6847] dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
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
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-[#B82E3B] dark:text-rose-300 leading-relaxed flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#B82E3B] dark:text-rose-400 mt-0.5" />
                  <div className="flex-1">
                    <span>{errorMsg}</span>
                  </div>
                </div>

                {isOpDisabled && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400 text-xs">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>How to enable Email/Password login:</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-700 dark:text-gray-400">
                      <li>Open your Firebase Console for this project.</li>
                      <li>Navigate to <strong>Build &gt; Authentication &gt; Sign-in method</strong>.</li>
                      <li>Click <strong>Email/Password</strong> and toggle <strong>Enable</strong> ON, then click <strong>Save</strong>.</li>
                    </ol>
                    <div className="pt-1 flex flex-col sm:flex-row gap-2">
                      <a
                        href={FIREBASE_AUTH_PROVIDERS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white dark:text-black rounded-lg font-bold text-[11px] transition-colors interactive-btn"
                      >
                        <span>Open Firebase Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white rounded-lg font-semibold text-[11px] transition-colors cursor-pointer interactive-btn"
                      >
                        <span>Use Google Sign-In</span>
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

            {/* Emerald CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0D6847] hover:bg-[#095237] dark:bg-gradient-to-r dark:from-emerald-500 dark:via-emerald-400 dark:to-emerald-500 dark:hover:from-emerald-400 dark:hover:to-emerald-500 text-white dark:text-black font-semibold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer interactive-btn disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : authMode === 'LOGIN' ? 'Sign In to TradeQuest' : 'Create Free Account'}
            </button>
          </form>

          {/* Toggle Footnote */}
          <div className="text-center text-xs text-slate-600 dark:text-gray-400 pt-1">
            {authMode === 'LOGIN' ? (
              <span>
                New to TradeQuest?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setNoticeMsg(null);
                    setAuthMode('REGISTER');
                  }}
                  className="text-[#0D6847] dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Create free account
                </button>
              </span>
            ) : (
              <span>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setNoticeMsg(null);
                    setAuthMode('LOGIN');
                  }}
                  className="text-[#0D6847] dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Sign in here
                </button>
              </span>
            )}
          </div>
        </div>
      </main>

      {/* Footer aligned with landing page footer */}
      <footer className="border-t border-slate-200 dark:border-white/10 py-6 text-center text-xs text-slate-500 dark:text-gray-500">
        <p>© 2026 {APP_NAME}. Purely for educational simulation and financial literacy.</p>
      </footer>
    </div>
  );
};
