import React, { useState } from 'react';
import { 
  Search, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const StockDetectiveView: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<number>(0);
  const [userSelection, setUserSelection] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);

  const cases = [
    {
      company: 'Zenith Retail Chain Ltd.',
      sector: 'Consumer Fashion & Apparel',
      metrics: {
        revenue: '₹14,500 Cr (+32% YoY)',
        netProfit: '₹420 Cr (−18% YoY)',
        debt: '₹6,800 Cr (+75% YoY)',
        operatingCashFlow: '−₹180 Cr (Negative cash burn)',
        peRatio: '68.5',
        promoterPledge: '48% of founder shares pledged as loan collateral'
      },
      question: 'You are an equity forensic investigator. Which metric is the most alarming red flag that threatens shareholder solvency?',
      options: [
        'Revenue grew 32% (sales are booming)',
        'P/E ratio is 68.5 (the market is excited)',
        'Negative Operating Cash Flow combined with massive debt surge and 48% promoter pledge',
        'Company is in the consumer fashion sector'
      ],
      correctIndex: 2,
      analysis: 'While top-line revenue looked spectacular (+32%), the business was actually burning cash from operations (−₹180 Cr), funding aggressive retail store openings through mounting debt (+75%), and founders pledged nearly half their shares for bank loans! If the stock price dips, pledged shares can face forced margin liquidation.'
    },
    {
      company: 'AeroPrecision Castings Ltd.',
      sector: 'Industrial Defense Components',
      metrics: {
        revenue: '₹2,400 Cr (+14% YoY)',
        netProfit: '₹410 Cr (+16% YoY)',
        debt: '₹120 Cr (Virtually zero net debt)',
        operatingCashFlow: '₹480 Cr (Strong free cash conversion)',
        peRatio: '18.2',
        promoterPledge: '0% (Founders hold 62% debt-free)'
      },
      question: 'What does this company\'s balance sheet profile indicate to a fundamental value investor?',
      options: [
        'Extreme financial distress with immediate bankruptcy risk',
        'A conservative, cash-generative business with high earnings quality and balance sheet resilience',
        'A pump-and-dump speculative penny stock',
        'The company must be liquidated immediately'
      ],
      correctIndex: 1,
      analysis: 'This business has outstanding financial hygiene: steady 14-16% growth, net cash generation exceeding accounting profit (₹480 Cr cash vs ₹410 Cr net profit), minimal debt, zero promoter pledges, and a modest P/E ratio of 18.2. It represents durable earnings quality.'
    }
  ];

  const current = cases[selectedCase];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="theme-card border theme-border rounded-3xl p-6 md:p-8 theme-card-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 theme-soft-accent-bg theme-primary-text border theme-border rounded-xl">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold theme-main-text font-heading">
              Stock Detective: Financial Forensic Lab
            </h2>
            <p className="text-xs theme-secondary-text">
              Uncover hidden balance sheet vulnerabilities beneath flashy corporate revenue headlines.
            </p>
          </div>
        </div>
      </div>

      {/* Case Selector Tabs */}
      <div className="flex gap-2">
        {cases.map((c, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setSelectedCase(idx);
              setUserSelection(null);
              setRevealed(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer interactive-btn ${
              selectedCase === idx
                ? 'theme-primary-bg text-white shadow-xs'
                : 'theme-card theme-secondary-text border theme-border hover:theme-main-text hover:theme-surface-subtle'
            }`}
          >
            Investigation Case #{idx + 1}: {c.company.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Case Dossier */}
      <div
        data-tour="stock-detective-case"
        className="theme-card interactive-card border theme-border rounded-3xl p-6 md:p-8 space-y-6 theme-card-shadow"
      >
        <div className="border-b theme-border pb-4">
          <span className="text-xs font-mono font-bold theme-primary-text uppercase tracking-wider block mb-1">
            {current.sector}
          </span>
          <h3 className="text-xl font-bold theme-main-text font-heading">{current.company}</h3>
        </div>

        {/* Financial Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
            <span className="text-[10px] theme-muted-text block">Annual Sales</span>
            <span className="text-xs font-mono font-bold theme-main-text">{current.metrics.revenue}</span>
          </div>
          <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
            <span className="text-[10px] theme-muted-text block">Reported Net Profit</span>
            <span className="text-xs font-mono font-bold theme-main-text">{current.metrics.netProfit}</span>
          </div>
          <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
            <span className="text-[10px] theme-muted-text block">Total Balance Sheet Debt</span>
            <span className="text-xs font-mono font-bold theme-main-text">{current.metrics.debt}</span>
          </div>
          <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
            <span className="text-[10px] theme-muted-text block">Operating Cash Flow</span>
            <span className="text-xs font-mono font-bold theme-main-text">{current.metrics.operatingCashFlow}</span>
          </div>
          <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
            <span className="text-[10px] theme-muted-text block">P/E Ratio</span>
            <span className="text-xs font-mono font-bold theme-main-text">{current.metrics.peRatio}</span>
          </div>
          <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
            <span className="text-[10px] theme-muted-text block">Founder / Promoter Pledge</span>
            <span className="text-xs font-mono font-bold theme-main-text">{current.metrics.promoterPledge}</span>
          </div>
        </div>

        {/* Question & Options */}
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-semibold theme-main-text leading-relaxed">
            {current.question}
          </h4>

          <div className="space-y-2">
            {current.options.map((opt, idx) => {
              const isSelected = userSelection === idx;
              const isCorrect = idx === current.correctIndex;

              let styles = 'theme-surface-subtle theme-border theme-secondary-text hover:border-slate-400 interactive-list-item';
              if (revealed) {
                if (isCorrect) {
                  styles = 'theme-surface-subtle border-emerald-500/50 theme-positive-text font-semibold';
                } else if (isSelected && !isCorrect) {
                  styles = 'theme-surface-subtle border-rose-500/50 theme-negative-text font-semibold';
                } else {
                  styles = 'theme-surface-subtle theme-border theme-muted-text opacity-60';
                }
              } else if (isSelected) {
                styles = 'theme-soft-accent-bg border-emerald-500 theme-primary-text font-semibold ring-1 ring-emerald-500/30';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={revealed}
                  onClick={() => setUserSelection(idx)}
                  className={`w-full text-left p-3.5 rounded-xl text-xs md:text-sm border transition-all cursor-pointer interactive-quiz-option ${styles}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {!revealed ? (
            <button
              type="button"
              disabled={userSelection === null}
              onClick={() => setRevealed(true)}
              className="w-full py-3 theme-btn-primary disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer interactive-btn"
            >
              Verify Forensic Analysis
            </button>
          ) : (
            <div className="p-4 theme-surface-subtle rounded-2xl border theme-border space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                {userSelection === current.correctIndex ? (
                  <span className="theme-positive-text font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 theme-positive-text" /> Outstanding Forensic Eye!
                  </span>
                ) : (
                  <span className="theme-warning-text font-bold text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 theme-warning-text" /> Notice the key warning indicator below:
                  </span>
                )}
              </div>
              <p className="text-xs theme-secondary-text leading-relaxed">
                {current.analysis}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
