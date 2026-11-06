import React, { useState } from 'react';
import { ShieldAlert, Calculator, AlertTriangle } from 'lucide-react';

export const PositionSizeCalculator: React.FC = () => {
  const [accountSize, setAccountSize] = useState<number>(100000);
  const [maxRiskPercent, setMaxRiskPercent] = useState<number>(1); // 1%
  const [entryPrice, setEntryPrice] = useState<number>(450);
  const [stopLossPrice, setStopLossPrice] = useState<number>(430);
  const [targetPrice, setTargetPrice] = useState<number>(490);

  const riskPerShare = Math.max(0.1, entryPrice - stopLossPrice);
  const rewardPerShare = Math.max(0, targetPrice - entryPrice);
  const maxRiskAmount = (accountSize * maxRiskPercent) / 100;
  const maxShares = Math.floor(maxRiskAmount / riskPerShare);
  const totalInvestmentRequired = maxShares * entryPrice;
  const riskRewardRatio = riskPerShare > 0 ? (rewardPerShare / riskPerShare).toFixed(2) : '0';

  const isLeveraged = totalInvestmentRequired > accountSize;

  return (
    <div className="theme-card border theme-border rounded-2xl p-6 theme-main-text my-6 shadow-sm">
      <div className="flex items-center justify-between border-b theme-border pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-semibold theme-main-text">Interactive Position Size & Risk/Reward Calculator</h4>
            <p className="text-xs theme-secondary-text">Never risk your financial survival. Calculate the exact math before clicking buy.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input sliders */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold theme-main-text">Total Virtual Account Size (₹):</label>
              <span className="text-xs font-mono font-bold theme-main-text">₹{accountSize.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="1000000"
              step="10000"
              value={accountSize}
              onChange={(e) => setAccountSize(Number(e.target.value))}
              className="w-full h-2 theme-surface-elevated rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold theme-main-text">Max Risk on this Single Trade (%):</label>
              <span className="text-xs font-mono font-bold text-rose-500">{maxRiskPercent}% (₹{maxRiskAmount.toLocaleString('en-IN')})</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={maxRiskPercent}
              onChange={(e) => setMaxRiskPercent(Number(e.target.value))}
              className="w-full h-2 theme-surface-elevated rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] theme-muted-text mt-1">
              <span>0.5% (Very Safe)</span>
              <span>1% - 2% (Golden Standard)</span>
              <span>5% (Extremely High Risk)</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] theme-secondary-text font-medium block mb-1">Entry Price (₹)</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full theme-surface-subtle border theme-border rounded-xl px-2.5 py-1.5 text-xs font-mono theme-main-text focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-rose-500 font-medium block mb-1">Stop-Loss (₹)</label>
              <input
                type="number"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value))}
                className="w-full theme-surface-subtle border border-rose-500/40 rounded-xl px-2.5 py-1.5 text-xs font-mono text-rose-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-emerald-500 font-medium block mb-1">Target Price (₹)</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full theme-surface-subtle border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-xs font-mono text-emerald-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Calculated Results */}
        <div className="theme-surface-subtle rounded-xl border theme-border p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h5 className="text-xs uppercase tracking-wider theme-main-text font-bold flex items-center gap-1.5">
              <Calculator className="w-4 h-4 theme-primary-text" /> Mathematically Safe Execution
            </h5>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 theme-card rounded-xl border theme-border">
                <span className="text-[10px] theme-muted-text block">Risk Per Share</span>
                <span className="text-base font-bold font-mono text-rose-500">₹{riskPerShare.toFixed(2)}</span>
              </div>

              <div className="p-3 theme-card rounded-xl border theme-border">
                <span className="text-[10px] theme-muted-text block">Max Shares to Buy</span>
                <span className="text-base font-bold font-mono theme-primary-text">{maxShares} shares</span>
              </div>

              <div className="p-3 theme-card rounded-xl border theme-border">
                <span className="text-[10px] theme-muted-text block">Total Investment Cost</span>
                <span className="text-sm font-semibold font-mono theme-main-text">₹{totalInvestmentRequired.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-3 theme-card rounded-xl border theme-border">
                <span className="text-[10px] theme-muted-text block">Risk / Reward Ratio</span>
                <span className={`text-base font-bold font-mono ${Number(riskRewardRatio) >= 2 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  1 : {riskRewardRatio}
                </span>
              </div>
            </div>

            {isLeveraged && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>Notice: Total capital required exceeds your current account size. In real trading, using borrowed leverage introduces danger of total wipeout. Reduce position or use a tighter stop-loss.</span>
              </div>
            )}
          </div>

          <div className="p-3 theme-soft-accent-bg rounded-xl border theme-border text-xs theme-secondary-text mt-4 leading-relaxed font-medium">
            🛡️ If you buy <strong className="theme-main-text">{maxShares} shares</strong> and the stock drops to your stop-loss of <strong className="text-rose-500">₹{stopLossPrice}</strong>, your total loss is capped at exactly <strong className="text-rose-500">₹{(maxShares * riskPerShare).toFixed(0)}</strong> (1% of account). You live to trade another day!
          </div>
        </div>
      </div>
    </div>
  );
};
