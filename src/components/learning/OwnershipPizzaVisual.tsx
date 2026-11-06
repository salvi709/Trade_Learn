import React, { useState } from 'react';
import { Pizza, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';

export const OwnershipPizzaVisual: React.FC = () => {
  const [slicesOwned, setSlicesOwned] = useState<number>(10);
  const totalSlices = 100;
  const companyValuation = 10000000; // ₹1 Crore
  const sharePrice = companyValuation / totalSlices; // ₹1,00,000 per slice
  const userOwnershipPercent = (slicesOwned / totalSlices) * 100;
  const userEquityValue = slicesOwned * sharePrice;

  return (
    <div className="theme-card border theme-border rounded-2xl p-6 theme-main-text my-6 shadow-sm">
      <div className="flex items-center justify-between border-b theme-border pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
            <Pizza className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-semibold theme-main-text">Interactive Pizza Slice: What is a Share?</h4>
            <p className="text-xs theme-secondary-text">Drag the slider to see how owning slices changes your company ownership.</p>
          </div>
        </div>
        <span className="text-xs font-mono theme-soft-accent-bg theme-primary-text border theme-border px-2.5 py-1 rounded-full font-semibold">
          Simulated Model
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Visual Pizza Slices */}
        <div className="flex flex-col items-center justify-center p-6 theme-surface-subtle rounded-xl border theme-border">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Circular representation */}
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#64748b"
                strokeOpacity="0.2"
                strokeWidth="18"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="currentColor"
                className="text-emerald-500 transition-all duration-300"
                strokeWidth="18"
                strokeDasharray={`${(userOwnershipPercent * 251.2) / 100} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center">
              <span className="text-2xl font-bold font-heading theme-main-text">{userOwnershipPercent}%</span>
              <span className="text-[11px] theme-muted-text font-medium">Your Share</span>
            </div>
          </div>
          <p className="text-xs theme-muted-text mt-4 text-center">
            Total Pizza: <strong className="theme-main-text">100 Slices (Total Shares)</strong>
          </p>
        </div>

        {/* Controls and calculations */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold theme-main-text">Slices (Shares) You Own:</label>
              <span className="text-sm font-mono font-bold theme-primary-text theme-soft-accent-bg px-2.5 py-0.5 rounded-lg border theme-border">
                {slicesOwned} / 100 slices
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={slicesOwned}
              onChange={(e) => setSlicesOwned(Number(e.target.value))}
              className="w-full h-2 theme-surface-elevated rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] theme-muted-text mt-1">
              <span>1 share (1%)</span>
              <span>50 shares (50%)</span>
              <span>100 shares (100%)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
              <span className="text-[11px] theme-muted-text block font-medium">Total Company Value</span>
              <span className="text-sm font-semibold font-mono theme-main-text">₹1,00,00,000 (1 Cr)</span>
            </div>
            <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
              <span className="text-[11px] theme-muted-text block font-medium">Value of 1 Share</span>
              <span className="text-sm font-semibold font-mono text-emerald-500">₹1,00,000</span>
            </div>
            <div className="p-3 theme-soft-accent-bg rounded-xl border theme-border col-span-2">
              <span className="text-[11px] theme-primary-text block font-semibold">Your Total Ownership Value</span>
              <span className="text-lg font-bold font-mono theme-primary-text">
                ₹{userEquityValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="p-3 theme-surface-subtle rounded-xl text-xs theme-secondary-text leading-relaxed border theme-border">
            💡 If this company generates <strong className="text-emerald-500">₹10,00,000</strong> annual net profit, your {userOwnershipPercent}% slice entitles you to a proportional claim of <strong className="text-emerald-500">₹{((1000000 * userOwnershipPercent) / 100).toLocaleString('en-IN')}</strong> of those earnings!
          </div>
        </div>
      </div>
    </div>
  );
};
