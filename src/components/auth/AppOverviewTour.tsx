import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  Lock, 
  BookOpen, 
  TrendingUp, 
  Bot, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle,
  FileText,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { AppTheme } from '../../types';
import { APP_NAME, APP_TAGLINE } from '../../config/branding';

interface AppOverviewTourProps {
  onFinish: () => void;
  onSkip?: () => void;
  activeTheme?: AppTheme;
}

export const AppOverviewTour: React.FC<AppOverviewTourProps> = ({
  onFinish,
  onSkip,
  activeTheme = 'royal_blue',
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 8; // Steps 1 to 7 + Final Step (8)

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="app-overview-modal"
        className="w-full max-w-3xl theme-card rounded-3xl border theme-border shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Top Progress Indicator & Skip Header */}
        <div className="px-6 py-4 border-b theme-border theme-surface-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider theme-primary-text">
              App Overview • {currentStep} of {totalSteps}
            </span>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx + 1 === currentStep
                    ? 'w-6 theme-primary-bg'
                    : idx + 1 < currentStep
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 theme-border'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            id="btn-skip-tour"
            onClick={onSkip || onFinish}
            className="text-xs font-semibold theme-muted-text hover:theme-main-text transition-colors cursor-pointer"
          >
            Skip Tour
          </button>
        </div>

        {/* Dynamic Screen Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 theme-main-text">
          {/* SCREEN 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-6 text-center max-w-xl mx-auto py-4">
              <div className="w-16 h-16 rounded-2xl theme-soft-accent-bg theme-primary-text mx-auto flex items-center justify-center shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider theme-muted-text">
                  Welcome to {APP_NAME}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-heading theme-main-text tracking-tight">
                  Your journey from understanding the stock market to practicing it safely.
                </h2>
                <p className="text-sm theme-secondary-text leading-relaxed">
                  Learn the fundamentals, understand companies and charts, practice with virtual money, and build your financial knowledge step by step.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-left">
                <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                  <BookOpen className="w-4 h-4 theme-primary-text mb-1" />
                  <div className="font-bold text-xs theme-main-text">10-Stage Path</div>
                  <div className="text-[11px] theme-muted-text">Structured lessons</div>
                </div>
                <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                  <TrendingUp className="w-4 h-4 theme-primary-text mb-1" />
                  <div className="font-bold text-xs theme-main-text">Paper Trading</div>
                  <div className="text-[11px] theme-muted-text">₹1,00,000 virtual cash</div>
                </div>
                <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                  <Bot className="w-4 h-4 theme-primary-text mb-1" />
                  <div className="font-bold text-xs theme-main-text">Market Mentor</div>
                  <div className="text-[11px] theme-muted-text">ELI15 explanations</div>
                </div>
                <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                  <Flame className="w-4 h-4 text-amber-500 mb-1" />
                  <div className="font-bold text-xs theme-main-text">Daily Streaks</div>
                  <div className="text-[11px] theme-muted-text">Calendar habit tracking</div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 2: Learn the Foundations */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider theme-primary-text">
                  <span>🧠 Curriculum</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading theme-main-text">
                  Build your foundation first.
                </h2>
                <p className="text-xs sm:text-sm theme-secondary-text">
                  The learning path takes you from the basics to more advanced concepts without forcing you to skip the important foundations.
                </p>
              </div>

              {/* 9 Foundation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {[
                  { title: 'What stocks and shares actually are', desc: 'Legal partial ownership of real operating businesses.' },
                  { title: 'How stock markets work', desc: 'Buyers and sellers discovering fair prices in real time.' },
                  { title: 'Why prices move', desc: 'Supply, demand, investor expectations, and news flow.' },
                  { title: 'How companies make money', desc: 'Revenue streams, profit margins, and balance sheets.' },
                  { title: 'How to read financial info', desc: 'P/E ratios, earnings reports, and annual statements.' },
                  { title: 'How charts work', desc: 'Candlesticks, trends, support levels, and resistance.' },
                  { title: 'Investing vs trading', desc: 'Long-term wealth building vs short-term position management.' },
                  { title: 'Risk management', desc: 'Position sizing, stop-loss protection, and portfolio survival.' },
                  { title: 'Trading psychology', desc: 'Avoiding FOMO, revenge trading, and emotional mistakes.' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 theme-surface-subtle rounded-xl border theme-border space-y-1 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full theme-soft-accent-bg theme-primary-text text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold theme-main-text leading-tight">{item.title}</h4>
                    </div>
                    <p className="text-[11px] theme-muted-text pl-6 leading-tight">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 3: Follow Your Learning Path (Locked Progression) */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider theme-primary-text">
                  <span>🧭 Guided Progression</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading theme-main-text">
                  Follow your structured learning roadmap.
                </h2>
                <p className="text-xs sm:text-sm theme-secondary-text">
                  You can explore and preview what's ahead anytime, but advanced lessons unlock as you complete the foundations.
                </p>
              </div>

              {/* Miniature visual roadmap */}
              <div className="theme-surface-subtle border theme-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold theme-main-text pb-2 border-b theme-border">
                  <Layers className="w-4 h-4 theme-primary-text" />
                  <span>Sequential Progression Hierarchy</span>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Stage 1: Financial Foundations (Start Here)', status: 'unlocked', icon: CheckCircle2, tag: 'Available Now' },
                    { label: 'Stage 2: Stock Market Basics & Exchanges', status: 'active', icon: BookOpen, tag: 'Next Up' },
                    { label: 'Stage 3: Understanding Real Companies', status: 'locked', icon: Lock, tag: 'Unlocks after Stage 2' },
                    { label: 'Stage 4: Reading Charts & Candlesticks', status: 'locked', icon: Lock, tag: 'Unlocks after Stage 3' },
                    { label: 'Stage 5: Risk Management & Survival', status: 'locked', icon: Lock, tag: 'Prerequisite for Trading' },
                    { label: 'Stage 6: Paper Trading Lab', status: 'locked', icon: Lock, tag: 'Practice Simulation' },
                  ].map((st, i) => {
                    const Icon = st.icon;
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          st.status === 'unlocked'
                            ? 'theme-soft-accent-bg border-emerald-500/30 theme-primary-text font-semibold'
                            : st.status === 'active'
                            ? 'theme-card border-emerald-500 theme-primary-text font-bold shadow-2xs'
                            : 'theme-surface-elevated border theme-border theme-muted-text'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 shrink-0 ${st.status === 'unlocked' ? 'theme-primary-text' : st.status === 'active' ? 'theme-primary-text' : 'theme-muted-text'}`} />
                          <span>{st.label}</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-80">{st.tag}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 theme-soft-accent-bg border theme-border rounded-xl text-xs theme-secondary-text flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 theme-primary-text shrink-0 mt-0.5" />
                <span>
                  <strong className="theme-main-text">Why prerequisites matter:</strong> Real-world financial losses almost always come from attempting advanced trading without understanding fundamental order types and risk sizing.
                </span>
              </div>
            </div>
          )}

          {/* SCREEN 4: Practice Without Real Money */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider theme-primary-text">
                  <span>🧪 Paper Trading</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading theme-main-text">
                  Practice trading using virtual money.
                </h2>
                <p className="text-xs sm:text-sm theme-secondary-text">
                  Experiment freely with order types, stop-loss protection, and profit targets with zero capital at risk.
                </p>
              </div>

              {/* Miniature Paper Trading Preview */}
              <div className="theme-surface-subtle border theme-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase theme-muted-text">Virtual Portfolio Capital</span>
                    <div className="text-2xl font-black font-mono theme-primary-text">
                      ₹1,00,000.00
                    </div>
                  </div>
                  <span className="text-xs font-bold theme-soft-accent-bg theme-primary-text px-3 py-1 rounded-full border theme-border">
                    Safe Simulation
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 theme-card rounded-xl border theme-border">
                    <span className="text-[10px] font-mono theme-muted-text block">Positions</span>
                    <span className="text-xs font-bold theme-main-text">Real-time tracking</span>
                  </div>
                  <div className="p-3 theme-card rounded-xl border theme-border">
                    <span className="text-[10px] font-mono theme-muted-text block">Stop-Losses</span>
                    <span className="text-xs font-bold theme-main-text">Hard risk boundaries</span>
                  </div>
                  <div className="p-3 theme-card rounded-xl border theme-border">
                    <span className="text-[10px] font-mono theme-muted-text block">Trade History</span>
                    <span className="text-xs font-bold theme-main-text">Audit all fills</span>
                  </div>
                  <div className="p-3 theme-card rounded-xl border theme-border">
                    <span className="text-[10px] font-mono theme-muted-text block">Trading Journal</span>
                    <span className="text-xs font-bold theme-main-text">Record trade rationale</span>
                  </div>
                  <div className="p-3 theme-card rounded-xl border theme-border">
                    <span className="text-[10px] font-mono theme-muted-text block">Risk Calculator</span>
                    <span className="text-xs font-bold theme-main-text">1% risk position size</span>
                  </div>
                  <div className="p-3 theme-card rounded-xl border theme-border">
                    <span className="text-[10px] font-mono theme-muted-text block">P&L Analytics</span>
                    <span className="text-xs font-bold theme-main-text">Analyze mistakes</span>
                  </div>
                </div>
              </div>

              <div className="p-3 theme-soft-accent-bg border theme-border rounded-xl text-xs theme-secondary-text flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 theme-primary-text shrink-0" />
                <span>
                  <strong className="theme-main-text">Simulation Notice:</strong> Virtual paper money does not reflect real broker execution slippage or real profits. Use it purely as an educational simulator.
                </span>
              </div>
            </div>
          )}

          {/* SCREEN 5: Meet Your Market Mentor */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider theme-primary-text">
                  <span>🤖 AI Educational Tutor</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading theme-main-text">
                  Stuck on a concept? Ask the Market Mentor.
                </h2>
                <p className="text-xs sm:text-sm theme-secondary-text">
                  Get patient, jargon-free explanations, real-world analogies, and personalized conceptual answers anytime.
                </p>
              </div>

              {/* Chat Interface Preview */}
              <div className="theme-surface-subtle border theme-border rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl theme-primary-bg text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="theme-card p-3.5 rounded-2xl rounded-tl-xs border theme-border text-xs theme-main-text space-y-1 shadow-2xs max-w-lg">
                    <p className="font-semibold theme-primary-text text-[11px]">Market Mentor</p>
                    <p className="theme-secondary-text">
                      "Think of buying a share like buying a single slice of an 8-slice pizza. If the pizza shop gets more customers and makes more profit, your slice becomes more valuable!"
                    </p>
                  </div>
                </div>

                {/* Example prompts */}
                <div className="pt-2">
                  <span className="text-[10px] font-mono uppercase theme-muted-text block mb-2">
                    Popular questions you can ask:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Explain P/E ratio like I'm 15",
                      "Why do stock prices move?",
                      "What does a candlestick mean?",
                      "Explain risk vs reward",
                      "Quiz me on market order types"
                    ].map((prompt, i) => (
                      <span
                        key={i}
                        className="text-[11px] theme-card border theme-border hover:border-emerald-500 theme-main-text px-3 py-1 rounded-lg shadow-2xs transition-colors"
                      >
                        "{prompt}"
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 theme-surface-subtle border theme-border rounded-xl text-xs theme-muted-text">
                ⚠️ The Market Mentor is an educational guide. It never gives stock tips, price targets, or financial advice.
              </div>
            </div>
          )}

          {/* SCREEN 6: Track Your Progress */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider theme-primary-text">
                  <span>📈 Account Sync</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading theme-main-text">
                  Your learning journey is saved to your account.
                </h2>
                <p className="text-xs sm:text-sm theme-secondary-text">
                  Every lesson finished, quiz score achieved, paper trade placed, and journal note written is safely persisted in the cloud.
                </p>
              </div>

              {/* Progress metric cards preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 theme-surface-subtle rounded-2xl border theme-border space-y-1">
                  <span className="text-[10px] font-mono theme-muted-text uppercase">Curriculum</span>
                  <div className="text-lg font-bold font-mono theme-main-text">10 Stages</div>
                  <span className="text-[11px] theme-muted-text">Comprehensive path</span>
                </div>
                <div className="p-4 theme-surface-subtle rounded-2xl border theme-border space-y-1">
                  <span className="text-[10px] font-mono theme-muted-text uppercase">Interactive Quizzes</span>
                  <div className="text-lg font-bold font-mono theme-primary-text">Scored Mastery</div>
                  <span className="text-[11px] theme-muted-text">Immediate explanations</span>
                </div>
                <div className="p-4 theme-surface-subtle rounded-2xl border theme-border space-y-1">
                  <span className="text-[10px] font-mono theme-muted-text uppercase">Achievements</span>
                  <div className="text-lg font-bold font-mono text-amber-500">Milestone Badges</div>
                  <span className="text-[11px] theme-muted-text">Earned as you learn</span>
                </div>
                <div className="p-4 theme-surface-subtle rounded-2xl border theme-border space-y-1">
                  <span className="text-[10px] font-mono theme-muted-text uppercase">Trading Journal</span>
                  <div className="text-lg font-bold font-mono theme-primary-text">Reflection Log</div>
                  <span className="text-[11px] theme-muted-text">Track your psychology</span>
                </div>
              </div>

              <div className="p-4 theme-card border theme-border rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold theme-main-text">
                  <span>Seamless Cloud Synchronization</span>
                  <span className="theme-primary-text flex items-center gap-1 font-mono">
                    <Check className="w-3.5 h-3.5" /> Synchronized
                  </span>
                </div>
                <p className="text-xs theme-muted-text">
                  Switch between laptop, tablet, and mobile anytime. Your learning streak and paper portfolio remain intact.
                </p>
              </div>
            </div>
          )}

          {/* SCREEN 7: Build Your Learning Streak */}
          {currentStep === 7 && (
            <div className="space-y-5">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                  <span>🔥 Consistency</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading theme-main-text">
                  Build your daily learning streak.
                </h2>
                <p className="text-xs sm:text-sm theme-secondary-text">
                  Learn a little every day. Complete one lesson, quiz, paper trade, or journal entry to advance your streak.
                </p>
              </div>

              {/* Streak Milestone Strip */}
              <div className="theme-surface-subtle border theme-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm theme-main-text">Calendar-Based Tracking</h4>
                      <p className="text-xs theme-muted-text">1 meaningful learning activity = 1 day marked</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { days: 1, label: 'Day 1', desc: 'First Step' },
                    { days: 2, label: 'Day 2', desc: 'Building Momentum' },
                    { days: 3, label: 'Day 3', desc: 'Rhythm' },
                    { days: 7, label: 'Day 7', desc: '1 Week Streak' },
                    { days: 14, label: 'Day 14', desc: 'Mastery Habit' },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className="p-3 theme-card rounded-xl border theme-border flex flex-col items-center gap-1 shadow-2xs"
                    >
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                        <Flame className="w-3.5 h-3.5" /> {m.days}
                      </span>
                      <span className="text-[10px] font-bold theme-main-text">{m.label}</span>
                      <span className="text-[9px] theme-muted-text truncate w-full">{m.desc}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs theme-secondary-text leading-relaxed">
                  We don't punish you for taking your time or logging in once a day. The goal is steady, stress-free financial literacy.
                </p>
              </div>
            </div>
          )}

          {/* SCREEN 8: Final Call to Action */}
          {currentStep === 8 && (
            <div className="space-y-6 text-center max-w-lg mx-auto py-2">
              <div className="w-16 h-16 rounded-3xl theme-primary-bg text-white mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider theme-primary-text">
                  You're Ready To Begin
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-heading theme-main-text">
                  Your Journey Starts Here
                </h2>
                <p className="text-xs sm:text-sm theme-secondary-text">
                  Remember our guiding motto:
                  <br />
                  <strong className="theme-main-text">"Explore freely, learn progressively, practice safely."</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                  <div className="font-bold text-xs theme-main-text mb-0.5">🧠 Learn</div>
                  <p className="text-[11px] theme-muted-text">Complete Stage 1 foundation lessons</p>
                </div>
                <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                  <div className="font-bold text-xs theme-main-text mb-0.5">🧪 Practice</div>
                  <p className="text-[11px] theme-muted-text">Unlock paper trading as you advance</p>
                </div>
                <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                  <div className="font-bold text-xs theme-main-text mb-0.5">🤖 Ask the Mentor</div>
                  <p className="text-[11px] theme-muted-text">Clarify questions anytime</p>
                </div>
                <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                  <div className="font-bold text-xs theme-main-text mb-0.5">🔥 Build Your Streak</div>
                  <p className="text-[11px] theme-muted-text">Day 1 starts right now</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="px-6 py-4 border-t theme-border theme-surface-subtle flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                id="btn-tour-prev"
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl border theme-border theme-card hover:theme-surface-elevated text-xs font-semibold theme-main-text flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < totalSteps ? (
              <button
                type="button"
                id="btn-tour-next"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl theme-btn-primary text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>{currentStep === 1 ? "Let's Explore" : 'Next'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-tour-finish"
                onClick={onFinish}
                className="px-8 py-3 rounded-xl theme-btn-primary text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Start Learning</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
