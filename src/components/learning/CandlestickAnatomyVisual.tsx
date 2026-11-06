import React, { useState } from 'react';
import { Info } from 'lucide-react';

export const CandlestickAnatomyVisual: React.FC = () => {
  const [hoverPart, setHoverPart] = useState<string | null>(null);
  const [candleType, setCandleType] = useState<'BULLISH' | 'BEARISH'>('BULLISH');

  const infoText: Record<string, string> = {
    high: 'HIGH: The absolute highest price buyers were able to reach during the session.',
    close: candleType === 'BULLISH' 
      ? 'CLOSE: The final traded price when the session ended. Since it is HIGHER than Open, the candle is green (bullish win!).' 
      : 'CLOSE: The final traded price when the session ended. Since it is LOWER than Open, the candle is red (bearish win!).',
    open: candleType === 'BULLISH'
      ? 'OPEN: The initial price where trading started when the session opened.'
      : 'OPEN: The starting price of the session. Sellers pushed the price down from here.',
    low: 'LOW: The lowest price point touched during the session before buyers stepped in.',
    body: 'REAL BODY: The rectangular zone showing the price difference between the Open and the Close.',
    upperWick: 'UPPER WICK / SHADOW: Demonstrates how far buyers pushed the price up before being beaten back down by sellers.',
    lowerWick: 'LOWER WICK / SHADOW: Demonstrates how far sellers pushed the price down before buyers rejected those cheap prices.'
  };

  return (
    <div className="theme-card border theme-border rounded-3xl p-6 md:p-8 my-6 theme-card-shadow theme-main-text">
      <div className="flex flex-wrap items-center justify-between border-b theme-border pb-4 mb-5 gap-3">
        <div>
          <h4 className="text-lg font-bold theme-main-text font-heading">Interactive Candlestick Anatomy</h4>
          <p className="text-xs theme-secondary-text">Hover over any part of the candlestick to inspect its market psychology.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCandleType('BULLISH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              candleType === 'BULLISH' ? 'bg-emerald-600 text-white shadow-xs' : 'theme-surface-subtle theme-secondary-text hover:theme-surface-elevated'
            }`}
          >
            Green (Bullish)
          </button>
          <button
            type="button"
            onClick={() => setCandleType('BEARISH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              candleType === 'BEARISH' ? 'bg-rose-600 text-white shadow-xs' : 'theme-surface-subtle theme-secondary-text hover:theme-surface-elevated'
            }`}
          >
            Red (Bearish)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Candlestick SVG visualization */}
        <div className="flex justify-center p-6 theme-surface-subtle rounded-2xl border theme-border">
          <svg viewBox="0 0 200 300" className="w-56 h-72 select-none">
            {/* Upper Wick */}
            <line
              x1="100"
              y1="30"
              x2="100"
              y2="80"
              stroke={candleType === 'BULLISH' ? '#16A66A' : '#E5484D'}
              strokeWidth="4"
              className="cursor-pointer transition-all hover:stroke-emerald-400 hover:stroke-width-6"
              onMouseEnter={() => setHoverPart('upperWick')}
              onMouseLeave={() => setHoverPart(null)}
            />
            {/* High marker label */}
            <circle 
              cx="100" 
              cy="30" 
              r="6" 
              fill="#E59F1A" 
              className="cursor-pointer hover:scale-125 transition-all"
              onMouseEnter={() => setHoverPart('high')}
              onMouseLeave={() => setHoverPart(null)}
            />
            <text x="115" y="34" fill="#94a3b8" fontSize="12" fontFamily="monospace">HIGH ₹520</text>

            {/* Real Body */}
            <rect
              x="65"
              y="80"
              width="70"
              height="140"
              rx="4"
              fill={candleType === 'BULLISH' ? '#16A66A' : '#E5484D'}
              className="cursor-pointer transition-all hover:opacity-90 hover:stroke-2 hover:stroke-emerald-400"
              onMouseEnter={() => setHoverPart('body')}
              onMouseLeave={() => setHoverPart(null)}
            />

            {/* Open / Close markers */}
            {candleType === 'BULLISH' ? (
              <>
                <text x="145" y="85" fill="#16A66A" fontSize="11" fontWeight="bold" fontFamily="monospace">CLOSE ₹505</text>
                <text x="145" y="222" fill="#94a3b8" fontSize="11" fontFamily="monospace">OPEN ₹480</text>
              </>
            ) : (
              <>
                <text x="145" y="85" fill="#94a3b8" fontSize="11" fontFamily="monospace">OPEN ₹505</text>
                <text x="145" y="222" fill="#E5484D" fontSize="11" fontWeight="bold" fontFamily="monospace">CLOSE ₹480</text>
              </>
            )}

            {/* Lower Wick */}
            <line
              x1="100"
              y1="220"
              x2="100"
              y2="270"
              stroke={candleType === 'BULLISH' ? '#16A66A' : '#E5484D'}
              strokeWidth="4"
              className="cursor-pointer transition-all hover:stroke-emerald-400 hover:stroke-width-6"
              onMouseEnter={() => setHoverPart('lowerWick')}
              onMouseLeave={() => setHoverPart(null)}
            />
            {/* Low marker label */}
            <circle 
              cx="100" 
              cy="270" 
              r="6" 
              fill="#E59F1A" 
              className="cursor-pointer hover:scale-125 transition-all"
              onMouseEnter={() => setHoverPart('low')}
              onMouseLeave={() => setHoverPart(null)}
            />
            <text x="115" y="274" fill="#94a3b8" fontSize="12" fontFamily="monospace">LOW ₹465</text>
          </svg>
        </div>

        {/* Detailed Explanation Display */}
        <div className="space-y-4">
          <div className="p-4 theme-surface-subtle rounded-2xl border theme-border min-h-[140px] flex flex-col justify-center">
            <div className="flex items-center gap-2 theme-primary-text mb-2 font-semibold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" />
              {hoverPart ? hoverPart.toUpperCase() : 'HOVER OVER ANY PART'}
            </div>
            <p className="text-sm theme-secondary-text leading-relaxed">
              {hoverPart ? infoText[hoverPart] : 'Move your mouse or finger over the wick, the real body, or the high/low dots on the left to reveal the battle behind that price.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
              <strong className="theme-main-text block mb-1">Session Summary:</strong>
              <span className="theme-secondary-text">Open: ₹{candleType === 'BULLISH' ? '480' : '505'}</span><br />
              <span className="theme-secondary-text">Close: ₹{candleType === 'BULLISH' ? '505' : '480'}</span>
            </div>
            <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
              <strong className="theme-main-text block mb-1">Total Range:</strong>
              <span className="theme-secondary-text">High: ₹520.00</span><br />
              <span className="theme-secondary-text">Low: ₹465.00 (Range: ₹55)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
