import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { MarketFunFact } from '../../types';
import { MARKET_FUN_FACTS } from '../../data/marketFunFacts';
import { 
  getNextUniqueFunFact, 
  markFunFactShownThisSession 
} from '../../utils/funFactRotation';

interface FloatingMarketFunFactProps {
  // Flag indicating if user is currently in a modal tour or onboarding flow
  isTourOrOnboardingActive?: boolean;
}

export const FloatingMarketFunFact: React.FC<FloatingMarketFunFactProps> = ({
  isTourOrOnboardingActive = false,
}) => {
  const [currentFact, setCurrentFact] = useState<MarketFunFact>(() => {
    try {
      return getNextUniqueFunFact();
    } catch {
      return MARKET_FUN_FACTS[0];
    }
  });
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    // Hide while modal tour is active
    if (isTourOrOnboardingActive) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
      markFunFactShownThisSession();
    }
  }, [isTourOrOnboardingActive]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleNextFact = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextFact = getNextUniqueFunFact();
      setCurrentFact(nextFact);
    } catch {
      // Keep existing
    }
  };

  if (isTourOrOnboardingActive) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed bottom-24 right-4 md:bottom-24 md:right-6 z-50 max-w-[340px] sm:max-w-[380px] w-full"
          role="complementary"
          aria-label="Daily Market Fun Fact"
        >
          <div className="fintech-card p-4 rounded-2xl shadow-2xl border border-emerald-500/30 bg-slate-900/95 dark:bg-black/95 text-white backdrop-blur-md relative overflow-hidden transition-all duration-200">
            {/* Subtle glow backdrop */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header: Icon, Category & Close Button */}
            <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#0D6847] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Lightbulb className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                      DID YOU KNOW?
                    </span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      {currentFact.categoryLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Dismiss fun fact"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fact Body */}
            <div className="space-y-1.5 relative z-10">
              <h4 className="text-xs font-bold font-heading text-white leading-snug">
                {currentFact.title}
              </h4>
              <p className="text-[12px] text-slate-200 leading-relaxed">
                {currentFact.fact}
              </p>

              {/* Expandable Explanation Details */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800"
                >
                  <p className="mb-1.5">{currentFact.explanation}</p>
                  <div className="text-[10px] font-mono text-slate-500">
                    Source: {currentFact.sourceRef}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono relative z-10">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{isExpanded ? 'Less detail' : 'Why this matters'}</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleNextFact}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="View another verified market fact"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Next fact</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Minimized Pill to Re-open if Dismissed */}
      {!isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={() => setIsVisible(true)}
          className="fixed bottom-24 right-4 md:bottom-24 md:right-6 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 dark:bg-black/95 border border-emerald-500/40 text-emerald-400 text-xs font-medium shadow-xl hover:bg-slate-800 hover:border-emerald-500/70 transition cursor-pointer backdrop-blur-md group"
          title="Open Daily Market Fact"
          aria-label="Open Daily Market Fact"
        >
          <div className="w-5 h-5 rounded-full bg-[#0D6847] text-white flex items-center justify-center shrink-0">
            <Lightbulb className="w-3 h-3 text-emerald-300" />
          </div>
          <span className="font-mono text-[11px] font-semibold text-slate-200 group-hover:text-white">
            Market Fact
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
