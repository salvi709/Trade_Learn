import React from 'react';
import { Module } from '../../types';
import { Sparkles, ArrowRight, X, Unlock, CheckCircle2 } from 'lucide-react';

interface UnlockCelebrationModalProps {
  module: Module;
  onStartLearning: () => void;
  onClose: () => void;
}

export const UnlockCelebrationModal: React.FC<UnlockCelebrationModalProps> = ({
  module,
  onStartLearning,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-300">
      <div 
        id="unlock-celebration-card"
        className="w-full max-w-md theme-card rounded-3xl border theme-border shadow-2xl p-6 md:p-8 text-center space-y-5 relative animate-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          id="btn-close-unlock-celebration"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 theme-muted-text hover:theme-main-text rounded-xl hover:theme-surface-subtle transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration icon with subtle glowing ring */}
        <div className="w-16 h-16 rounded-2xl theme-soft-accent-bg border theme-border theme-primary-text flex items-center justify-center mx-auto shadow-sm">
          <Unlock className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 theme-soft-accent-bg theme-primary-text border theme-border rounded-full text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            New Stage Unlocked!
          </div>

          <h3 className="text-xl md:text-2xl font-bold font-heading theme-main-text">
            {module.title}
          </h3>

          <p className="text-xs md:text-sm theme-secondary-text leading-relaxed max-w-sm mx-auto">
            You have satisfied all prerequisite learning stages. You are now prepared to study this topic safely.
          </p>
        </div>

        {/* Skills pill preview */}
        <div className="p-3 theme-surface-subtle border theme-border rounded-2xl text-left space-y-1.5">
          <div className="text-[11px] font-mono font-bold theme-muted-text uppercase tracking-wider">
            Ready to learn:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {module.skills.slice(0, 3).map((skill, idx) => (
              <span 
                key={idx}
                className="text-xs theme-card border theme-border theme-main-text px-2 py-0.5 rounded-md font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            id="btn-start-unlocked-module"
            onClick={onStartLearning}
            className="flex-1 py-3 px-4 theme-btn-primary font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Start Learning Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 theme-surface-subtle hover:theme-surface-elevated theme-main-text font-bold text-xs rounded-xl transition-all cursor-pointer border theme-border"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
