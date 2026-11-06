import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME, APP_TAGLINE } from '../../config/branding';

interface StartupBrandRevealProps {
  onComplete: () => void;
  durationMs?: number;
}

export const StartupBrandReveal: React.FC<StartupBrandRevealProps> = ({
  onComplete,
  durationMs = 1800,
}) => {
  const [stage, setStage] = useState<'logo' | 'name' | 'tagline' | 'done'>('logo');

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }

    const t1 = setTimeout(() => setStage('name'), 350);
    const t2 = setTimeout(() => setStage('tagline'), 700);
    const t3 = setTimeout(() => {
      setStage('done');
      onComplete();
    }, durationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [durationMs, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        id="startup-brand-reveal"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
        onClick={onComplete}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white cursor-pointer select-none px-6"
      >
        <div className="flex flex-col items-center text-center max-w-sm space-y-4">
          {/* Step 1: Existing Brand Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-500 flex items-center justify-center font-black text-white text-2xl sm:text-3xl shadow-xl shadow-emerald-500/20 border border-emerald-500/30"
          >
            TQ
          </motion.div>

          {/* Step 2: Existing App Name */}
          <div className="space-y-1">
            <motion.h1
              initial={{ y: 8, opacity: 0 }}
              animate={stage !== 'logo' ? { y: 0, opacity: 1 } : { y: 8, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-2xl sm:text-3xl font-bold tracking-tight font-heading text-white"
            >
              {APP_NAME}
            </motion.h1>

            {/* Step 3: Existing Tagline */}
            <motion.p
              initial={{ y: 6, opacity: 0 }}
              animate={stage === 'tagline' || stage === 'done' ? { y: 0, opacity: 1 } : { y: 6, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-xs sm:text-sm font-mono text-emerald-400 font-medium tracking-wide"
            >
              {APP_TAGLINE}
            </motion.p>
          </div>
        </div>

        {/* Subtle skip prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="absolute bottom-8 text-[11px] font-mono text-gray-400"
        >
          Click anywhere to skip
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
