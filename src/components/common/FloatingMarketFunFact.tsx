import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { MarketFunFact } from '../../types';
import { 
  getNextUniqueFunFact, 
  hasShownFunFactThisSession, 
  markFunFactShownThisSession 
} from '../../utils/funFactRotation';

interface FloatingMarketFunFactProps {
  // Flag indicating if user is currently in a tour or onboarding flow
  isTourOrOnboardingActive?: boolean;
}

export const FloatingMarketFunFact: React.FC<FloatingMarketFunFactProps> = ({
  isTourOrOnboardingActive = false,
}) => {
  const [currentFact, setCurrentFact] = useState<MarketFunFact | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    // Do not show during tours or onboarding
    if (isTourOrOnboardingActive) {
      setIsVisible(false);
      return;
    }

    // Check if already displayed this session
    if (hasShownFunFactThisSession()) {
      return;
    }

    // Delay display slightly after dashboard loads so user can take in the initial screen
    const timer = setTimeout(() => {
      try {
        const fact = getNextUniqueFunFact();
        setCurrentFact(fact);
        setIsVisible(true);
        markFunFactShownThisSession();
      } catch (err) {
        console.warn('Could not load market fun fact:', err);
      }
    }, 2800);

    return () => clearTimeout(timer);
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

  if (!isVisible || !currentFact || isTourOrOnboardingActive) {
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
          className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-35 max-w-[340px] sm:max-w-[380px] w-full"
          role="complementary"
          aria-label="Daily Market Fun Fact"
        >
          <div className="fintech-card p-4 rounded-2xl shadow-xl border border-emerald-500/25 bg-slate-900/95 dark:bg-black/95 text-white backdrop-blur-md relative overflow-hidden transition-all duration-200">
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
    </AnimatePresence>
  );
};
