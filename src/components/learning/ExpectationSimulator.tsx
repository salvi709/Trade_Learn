import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export const ExpectationSimulator: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<number>(0);
  const [userPrediction, setUserPrediction] = useState<'RISE' | 'FALL' | 'FLAT' | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);

  const scenarios = [
    {
      company: 'Nova Tech Cloud',
      headline: 'Nova Tech reports +28% Quarterly Profit Growth!',
      expectation: 'Market analysts already expected +35% growth, and the CEO warned about slower software renewals next quarter.',
      actualReaction: 'FALL',
      priceChange: '-4.2%',
      explanation: 'Even though +28% is fantastic profit growth, it missed the +35% whisper expectation, and the cautious forward guidance frightened institutions!'
    },
    {
      company: 'Greencore Clean Energy',
      headline: 'Greencore reports a ₹50 Crore Quarterly Net Loss.',
      expectation: 'Due to unexpected equipment delays, analysts had braced for a catastrophic ₹120 Crore loss.',
      actualReaction: 'RISE',
      priceChange: '+3.8%',
      explanation: 'Loss was far smaller than feared! The market breathed a sigh of relief ("less bad than expected"), triggering a relief rally.'
    }
  ];

  const current = scenarios[selectedScenario];

  const handlePredict = (choice: 'RISE' | 'FALL' | 'FLAT') => {
    setUserPrediction(choice);
    setRevealed(true);
  };

  const handleNext = () => {
    setSelectedScenario((prev) => (prev + 1) % scenarios.length);
    setUserPrediction(null);
    setRevealed(false);
  };

  return (
    <div className="theme-card border theme-border rounded-2xl p-6 theme-main-text my-6 shadow-sm">
      <div className="flex items-center justify-between border-b theme-border pb-4 mb-5">
        <div>
          <h4 className="text-lg font-semibold theme-main-text">Interactive News vs. Market Reaction Simulator</h4>
          <p className="text-xs theme-secondary-text">Discover why "good news" does not always cause a stock to rise.</p>
        </div>
        <button
          type="button"
          onClick={handleNext}
          className="text-xs theme-primary-text hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          Next Scenario <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="theme-surface-subtle p-5 rounded-xl border theme-border mb-6">
        <span className="text-[11px] font-mono theme-primary-text font-semibold uppercase tracking-wider block mb-1">
          {current.company} • Breaking Headline
        </span>
        <h3 className="text-base md:text-lg font-bold theme-main-text mb-2">"{current.headline}"</h3>
        <div className="p-3 theme-card rounded-lg text-xs theme-secondary-text border theme-border">
          <strong className="text-amber-500 block mb-0.5">Behind the scenes (Prior Expectations):</strong>
          {current.expectation}
        </div>
      </div>

      {!revealed ? (
        <div>
          <p className="text-xs font-semibold theme-secondary-text mb-3 text-center">
            How do you predict the market will react today?
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handlePredict('RISE')}
              className="py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
            >
              📈 Price May Rise
            </button>
            <button
              type="button"
              onClick={() => handlePredict('FALL')}
              className="py-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold text-xs hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
            >
              📉 Price May Fall
            </button>
            <button
              type="button"
              onClick={() => handlePredict('FLAT')}
              className="py-3 px-4 rounded-xl theme-surface-subtle border theme-border theme-secondary-text font-bold text-xs hover:theme-surface-elevated hover:theme-main-text transition-all cursor-pointer"
            >
              ⚖️ Price Stays Flat
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 theme-surface-subtle rounded-xl border theme-border animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {userPrediction === current.actualReaction ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Insightful intuition!
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                  <HelpCircle className="w-4 h-4 text-amber-500" /> Surprise lesson!
                </span>
              )}
            </div>
            <span className={`text-sm font-bold font-mono ${current.actualReaction === 'RISE' ? 'text-emerald-500' : 'text-rose-500'}`}>
              Market Move: {current.priceChange}
            </span>
          </div>

          <p className="text-xs theme-secondary-text leading-relaxed">
            {current.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
