import React, { useState } from 'react';
import { Layers, ArrowDown } from 'lucide-react';

export const RevenueWaterfallVisual: React.FC = () => {
  const [revenue, setRevenue] = useState<number>(100);
  const [cogsPercent, setCogsPercent] = useState<number>(35);
  const [opexPercent, setOpexPercent] = useState<number>(25);
  const [taxPercent, setTaxPercent] = useState<number>(15);

  const cogs = (revenue * cogsPercent) / 100;
  const grossProfit = revenue - cogs;
  const opex = (revenue * opexPercent) / 100;
  const operatingProfit = grossProfit - opex;
  const taxes = (operatingProfit > 0 ? operatingProfit * taxPercent : 0) / 100;
  const netProfit = operatingProfit - taxes;

  return (
    <div className="theme-card border theme-border rounded-2xl p-6 theme-main-text my-6 shadow-sm">
      <div className="flex items-center justify-between border-b theme-border pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 theme-soft-accent-bg border theme-border rounded-xl theme-primary-text">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-semibold theme-main-text">Financial Statement Waterfall</h4>
            <p className="text-xs theme-secondary-text">Watch how ₹100 Crore in sales trickles down into actual Net Profit.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Waterfall Bars */}
        <div className="space-y-3 theme-surface-subtle p-4 rounded-xl border theme-border font-mono text-xs">
          <div>
            <div className="flex justify-between theme-main-text font-semibold mb-1">
              <span>Topline Revenue</span>
              <span className="text-emerald-500 font-bold">₹{revenue.toFixed(1)} Cr</span>
            </div>
            <div className="w-full theme-surface-elevated h-6 rounded-lg overflow-hidden flex">
              <div className="bg-emerald-600 h-full w-full"></div>
            </div>
          </div>

          <div className="pl-4 border-l-2 theme-border space-y-3">
            <div>
              <div className="flex justify-between theme-secondary-text mb-0.5">
                <span>− Direct Raw Material Costs (COGS)</span>
                <span className="text-rose-500 font-semibold">−₹{cogs.toFixed(1)} Cr</span>
              </div>
              <div className="w-full theme-surface-elevated h-4 rounded overflow-hidden">
                <div className="bg-rose-500 h-full" style={{ width: `${(cogs / revenue) * 100}%` }}></div>
              </div>
            </div>

            <div className="pt-1">
              <div className="flex justify-between theme-main-text font-semibold mb-0.5">
                <span>= Gross Profit</span>
                <span className="theme-main-text font-bold">₹{grossProfit.toFixed(1)} Cr</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between theme-secondary-text mb-0.5">
                <span>− Operating Salaries & Rent (SG&A)</span>
                <span className="text-rose-500 font-semibold">−₹{opex.toFixed(1)} Cr</span>
              </div>
              <div className="w-full theme-surface-elevated h-4 rounded overflow-hidden">
                <div className="bg-rose-400 h-full" style={{ width: `${(opex / revenue) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between theme-secondary-text mb-0.5">
                <span>− Corporate Taxes & Interest</span>
                <span className="text-rose-500 font-semibold">−₹{taxes.toFixed(1)} Cr</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t theme-border">
            <div className="flex justify-between items-center theme-soft-accent-bg p-3 rounded-xl border theme-border">
              <div>
                <span className="text-xs font-sans font-bold theme-primary-text block">Bottom-line Net Profit (PAT):</span>
                <span className="text-[10px] theme-secondary-text font-semibold">Profit Margin: {((netProfit / revenue) * 100).toFixed(1)}%</span>
              </div>
              <span className={`text-base font-bold ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                ₹{netProfit.toFixed(1)} Cr
              </span>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4 flex flex-col justify-center">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="theme-main-text font-semibold">Raw Material & Cost of Goods:</span>
              <span className="text-rose-500 font-mono font-bold">{cogsPercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="70"
              value={cogsPercent}
              onChange={(e) => setCogsPercent(Number(e.target.value))}
              className="w-full h-2 theme-surface-elevated rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="theme-main-text font-semibold">Employee Salaries & Marketing:</span>
              <span className="text-rose-500 font-mono font-bold">{opexPercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={opexPercent}
              onChange={(e) => setOpexPercent(Number(e.target.value))}
              className="w-full h-2 theme-surface-elevated rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          <div className="p-4 theme-surface-subtle rounded-xl border theme-border text-xs theme-secondary-text leading-relaxed">
            💡 <strong>Crucial Investor Takeaway:</strong> If raw material or salary costs rise without the company being able to raise its prices, net profit rapidly evaporates. This is why great investors look for companies with <em>"pricing power"</em> and steady operating margins.
          </div>
        </div>
      </div>
    </div>
  );
};
