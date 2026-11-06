import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Sparkles, ArrowRight, ShieldCheck, TrendingUp, Bot } from 'lucide-react';
import { MASCOT_ASSETS } from '../mascot/MarketMascot';

interface MascotWelcomePopupProps {
  displayName?: string;
  currentStageTitle?: string;
  onOpenMentor?: (prompt?: string) => void;
  className?: string;
}

const STORAGE_KEY = 'sharemarket_welcome_popup_dismissed_session';

const WELCOME_GREETINGS = [
  {
    id: 'welcome_1',
    bullText: "Hey! Welcome back. Ready to discover how compounding builds long-term wealth?",
    bearText: "Remember, understanding the business is always more important than rushing into a trade.",
    suggestionPrompt: "How does compound growth work in the stock market?",
  },
  {
    id: 'welcome_2',
    bullText: "Every successful investor started from zero. You're building genuine market literacy step by step!",
    bearText: "Rule #1 is capital defense: Always protect your downside and define your maximum risk beforehand.",
    suggestionPrompt: "What is the best way to manage risk on a stock position?",
  },
  {
    id: 'welcome_3',
    bullText: "A green day or a red day—every session in the simulator teaches something valuable about price action!",
    bearText: "Keep your emotions calm and your stop-loss respected. Patience is the greatest edge in the market.",
    suggestionPrompt: "Why do stock prices fluctuate and how should a beginner react?",
  },
  {
    id: 'welcome_4',
    bullText: "Great businesses grow over time. Focus on revenue, cash flow, and durable competitive advantages!",
    bearText: "And beware of hype and tips! Independent thinking and forensic checks keep your capital safe.",
    suggestionPrompt: "What should I look for in a company balance sheet?",
  },
];

export const MascotWelcomePopup: React.FC<MascotWelcomePopupProps> = ({
  displayName = 'Learner',
  currentStageTitle,
  onOpenMentor,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [greetingIndex, setGreetingIndex] = useState<number>(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Check if dismissed in this session
    try {
      const isDismissed = sessionStorage.getItem(STORAGE_KEY);
      if (isDismissed) {
        return;
      }
    } catch {
      // ignore
    }

    // Select greeting based on day of month to rotate naturally
    const day = new Date().getDate();
    setGreetingIndex(day % WELCOME_GREETINGS.length);

    // Subtle 800ms delay so the dashboard loads smoothly before greeting pops in
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 850);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const currentGreeting = WELCOME_GREETINGS[greetingIndex];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="mascot-welcome-card"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.92 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          role="region"
          aria-label="Welcome greeting from Bullish Bob and Bearish Ben"
          className={`fixed bottom-5 right-5 z-40 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] pointer-events-auto shadow-2xl ${className}`}
        >
          <div className="theme-card border-2 theme-border rounded-3xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md bg-opacity-95">
            {/* Top decorative accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0D6847] via-emerald-500 to-[#B82E3B]" />

            {/* Header: Title + Close Button */}
            <div className="flex items-center justify-between pb-3 border-b theme-border">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg theme-soft-accent-bg flex items-center justify-center text-xs theme-primary-text">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-heading theme-main-text">
                    Welcome back, {displayName}!
                  </h4>
                  {currentStageTitle && (
                    <span className="text-[10px] theme-muted-text font-mono truncate block max-w-[200px]">
                      {currentStageTitle}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Close welcome greeting"
                className="w-7 h-7 rounded-xl theme-surface-subtle border theme-border theme-muted-text hover:theme-main-text flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mascot Avatars & Speech Bubbles */}
            <div className="py-3.5 space-y-3">
              {/* Bullish Bob Greeting */}
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-[#0D6847]/40 shadow-xs bg-[#0D6847]/10">
                    <img
                      src={MASCOT_ASSETS.bull_celebrating}
                      alt="Bullish Bob"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0D6847] text-white flex items-center justify-center text-[9px] shadow-xs">
                    ▲
                  </span>
                </div>

                <div className="flex-1 theme-surface-subtle p-3 rounded-2xl rounded-tl-sm border border-emerald-500/25 space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-[#0D6847] dark:text-[#299C70] block uppercase tracking-wider">
                    Bullish Bob · The Optimist
                  </span>
                  <p className="text-xs theme-main-text leading-snug font-medium">
                    "{currentGreeting.bullText}"
                  </p>
                </div>
              </div>

              {/* Bearish Ben Greeting */}
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-[#B82E3B]/40 shadow-xs bg-[#B82E3B]/10">
                    <img
                      src={MASCOT_ASSETS.bear_strategist}
                      alt="Bearish Ben"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#B82E3B] text-white flex items-center justify-center text-[9px] shadow-xs">
                    ▼
                  </span>
                </div>

                <div className="flex-1 theme-surface-subtle p-3 rounded-2xl rounded-tl-sm border border-[#B82E3B]/25 space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-[#B82E3B] dark:text-[#E66B6B] block uppercase tracking-wider">
                    Bearish Ben · The Strategist
                  </span>
                  <p className="text-xs theme-secondary-text leading-snug">
                    "{currentGreeting.bearText}"
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2.5 border-t theme-border flex items-center justify-between gap-2 text-xs">
              {onOpenMentor && (
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss();
                    onOpenMentor(currentGreeting.suggestionPrompt);
                  }}
                  className="theme-secondary-text hover:theme-main-text font-semibold flex items-center gap-1.5 cursor-pointer py-1 text-[11px]"
                >
                  <Bot className="w-3.5 h-3.5 theme-primary-text" />
                  <span>Ask Mentor a Question</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDismiss}
                className="ml-auto px-4 py-1.5 theme-btn-primary font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Got it!
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
