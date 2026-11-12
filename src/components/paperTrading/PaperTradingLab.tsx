import React, { useState } from 'react';
import { 
  FictionalStock, 
  PaperPortfolio, 
  Position, 
  TradeOrder 
} from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ShoppingBag, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  PieChart
} from 'lucide-react';
import { MarketMascot } from '../mascot/MarketMascot';

interface PaperTradingProps {
  portfolio: PaperPortfolio;
  stocks: FictionalStock[];
  tradeHistory: TradeOrder[];
  onExecuteTrade: (order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    stopLoss?: number;
    targetPrice?: number;
  }) => { success: boolean; message: string };
  onOpenJournalForTrade?: (symbol: string) => void;
}

export const PaperTradingLab: React.FC<PaperTradingProps> = ({
  portfolio,
  stocks,
  tradeHistory,
  onExecuteTrade,
  onOpenJournalForTrade,
}) => {
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>(stocks[0]?.symbol || 'NOVA');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<number>(10);
  const [useStopLoss, setUseStopLoss] = useState<boolean>(true);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [useTarget, setUseTarget] = useState<boolean>(true);
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [tradeStatus, setTradeStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [chartHoverIdx, setChartHoverIdx] = useState<number | null>(null);
  const [chartHovered, setChartHovered] = useState<boolean>(false);
  const [chartDims, setChartDims] = useState<{ width: number; height: number }>({ width: 600, height: 160 });
  const chartSvgRef = React.useRef<SVGSVGElement | null>(null);
  const chartWrapperRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!chartWrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setChartDims({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });
    ro.observe(chartWrapperRef.current);
    return () => ro.disconnect();
  }, []);

  const selectedStock = stocks.find((s) => s.symbol === selectedStockSymbol) || stocks[0];
  const userPosition: Position | undefined = portfolio.positions[selectedStock.symbol];

  // Set default stop loss and target when stock changes
  React.useEffect(() => {
    if (selectedStock) {
      setStopLoss(Math.round(selectedStock.currentPrice * 0.95)); // -5%
      setTargetPrice(Math.round(selectedStock.currentPrice * 1.10)); // +10%
    }
  }, [selectedStock.symbol]);

  // Compute total portfolio valuation
  let totalEquityHoldingsValue = 0;
  let totalUnrealizedPnL = 0;

  Object.values(portfolio.positions).forEach((pos) => {
    const liveStock = stocks.find((s) => s.symbol === pos.symbol);
    const livePrice = liveStock ? liveStock.currentPrice : pos.currentPrice;
    const positionVal = pos.shares * livePrice;
    const pnl = positionVal - (pos.shares * pos.averagePrice);
    totalEquityHoldingsValue += positionVal;
    totalUnrealizedPnL += pnl;
  });

  const totalPortfolioNetWorth = portfolio.virtualCash + totalEquityHoldingsValue;
  const orderTotal = quantity * selectedStock.currentPrice;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTradeStatus(null);

    if (quantity <= 0) {
      setTradeStatus({ success: false, message: 'Quantity must be at least 1 share.' });
      return;
    }

    if (side === 'BUY' && orderTotal > portfolio.virtualCash) {
      setTradeStatus({ 
        success: false, 
        message: `Insufficient virtual cash. Required: ₹${orderTotal.toLocaleString('en-IN')}, Available: ₹${portfolio.virtualCash.toLocaleString('en-IN')}` 
      });
      return;
    }

    if (side === 'SELL') {
      const owned = userPosition?.shares || 0;
      if (owned < quantity) {
        setTradeStatus({ 
          success: false, 
          message: `Cannot sell ${quantity} shares. You only own ${owned} shares of ${selectedStock.symbol}.` 
        });
        return;
      }
    }

    const result = onExecuteTrade({
      symbol: selectedStock.symbol,
      side,
      quantity,
      price: selectedStock.currentPrice,
      stopLoss: useStopLoss ? stopLoss : undefined,
      targetPrice: useTarget ? targetPrice : undefined,
    });

    setTradeStatus(result);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Simulation Disclaimer Banner */}
      <div className="theme-surface-subtle border theme-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs theme-secondary-text">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg theme-card border theme-border flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 theme-positive-text" />
          </div>
          <div>
            <span className="font-semibold theme-main-text">Educational Paper Trading Simulator</span>
            <p className="text-[11px] theme-muted-text mt-0.5">
              Live-calculated fictional market universe with ₹1,00,000 virtual capital. Real market mechanics with zero financial risk.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="theme-secondary-text font-medium">Virtual Exchange Active</span>
        </div>
      </div>

      {/* Portfolio Balance Header Bar */}
      <div
        data-tour="paper-trading-balance"
        className="theme-card border theme-border rounded-2xl p-4 sm:p-5 shadow-2xs grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y lg:divide-y-0 lg:divide-x theme-border"
      >
        <div className="pt-2 lg:pt-0 lg:px-3 first:pt-0 first:px-0">
          <span className="text-[11px] font-mono uppercase tracking-wider theme-muted-text block mb-1">Total Net Worth</span>
          <div className="text-xl sm:text-2xl font-bold font-mono theme-main-text tracking-tight">
            ₹{totalPortfolioNetWorth.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] theme-muted-text mt-0.5 block">Cash + stock value</span>
        </div>

        <div className="pt-2 lg:pt-0 lg:px-4">
          <span className="text-[11px] font-mono uppercase tracking-wider theme-muted-text block mb-1">Virtual Cash</span>
          <div className="text-xl sm:text-2xl font-bold font-mono theme-primary-text tracking-tight">
            ₹{portfolio.virtualCash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] theme-muted-text mt-0.5 block">Available liquidity</span>
        </div>

        <div className="pt-2 lg:pt-0 lg:px-4">
          <span className="text-[11px] font-mono uppercase tracking-wider theme-muted-text block mb-1">Holdings Value</span>
          <div className="text-xl sm:text-2xl font-bold font-mono theme-main-text tracking-tight">
            ₹{totalEquityHoldingsValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] theme-muted-text mt-0.5 block">
            {Object.keys(portfolio.positions).length} active {Object.keys(portfolio.positions).length === 1 ? 'position' : 'positions'}
          </span>
        </div>

        <div className="pt-2 lg:pt-0 lg:px-4">
          <span className="text-[11px] font-mono uppercase tracking-wider theme-muted-text block mb-1">Unrealized P&L</span>
          <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${totalUnrealizedPnL >= 0 ? 'theme-positive-text' : 'theme-negative-text'}`}>
            {totalUnrealizedPnL >= 0 ? '+' : ''}₹{totalUnrealizedPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] theme-muted-text mt-0.5 block">
            {totalEquityHoldingsValue > 0 ? `${((totalUnrealizedPnL / (totalEquityHoldingsValue - totalUnrealizedPnL || 1)) * 100).toFixed(2)}% return` : 'No active exposure'}
          </span>
        </div>
      </div>

      {/* Main Trade Execution & Stock Universe Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Stock Picker & Chart/Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Selector Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {stocks.map((s) => {
              const isSelected = s.symbol === selectedStock.symbol;
              return (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => setSelectedStockSymbol(s.symbol)}
                  className={`p-3 rounded-2xl border text-left min-w-[140px] transition-all cursor-pointer interactive-card ${
                    isSelected
                      ? 'theme-soft-accent-bg border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                      : 'theme-card theme-border hover:border-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold theme-main-text font-mono">{s.symbol}</div>
                  <div className="text-[11px] theme-secondary-text truncate">{s.name}</div>
                  <div className="mt-1 flex items-center justify-between text-xs font-mono">
                    <span className="theme-main-text font-semibold">₹{s.currentPrice.toFixed(2)}</span>
                    <span className={`font-bold ${s.changePercent >= 0 ? 'theme-positive-text' : 'theme-negative-text'}`}>
                      {s.changePercent >= 0 ? '+' : ''}{s.changePercent}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stock Details Card */}
          <div className="fintech-card p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b theme-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold theme-main-text font-heading">{selectedStock.name}</h3>
                  <span className="text-xs font-mono bg-[#0D6847]/15 text-emerald-500 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                    {selectedStock.symbol}
                  </span>
                </div>
                <p className="text-xs theme-secondary-text mt-0.5">{selectedStock.sector} • {selectedStock.description}</p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold font-mono theme-main-text tracking-tight">
                  ₹{selectedStock.currentPrice.toFixed(2)}
                </div>
                <div className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${
                  selectedStock.change >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {selectedStock.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {selectedStock.change >= 0 ? '+' : ''}₹{selectedStock.change.toFixed(2)} ({selectedStock.changePercent}%)
                </div>
              </div>
            </div>

            {/* Price Chart Simulation with SVG Glowing Curve & Dynamic Overlays */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono theme-secondary-text font-semibold uppercase tracking-wider">
                    Today's Simulated Intraday Trend
                  </span>
                  {chartHovered && chartHoverIdx !== null && selectedStock.priceHistory[chartHoverIdx] && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 font-bold border border-emerald-500/30">
                      ₹{selectedStock.priceHistory[chartHoverIdx].price.toFixed(2)} at {selectedStock.priceHistory[chartHoverIdx].time}
                    </span>
                  )}
                </div>
                <span className="text-[11px] theme-muted-text font-mono">9:15 AM - 3:30 PM IST · Scrub to Inspect</span>
              </div>

              {/* Glowing SVG Area Curve with Interactive Cursor & Input Boundaries */}
              <div ref={chartWrapperRef} className="w-full h-44 theme-surface-subtle p-3 rounded-2xl border theme-border relative overflow-hidden select-none">
                {(() => {
                  const padX = 20;
                  const padTop = 14;
                  const padBottom = 20;
                  const plotWidth = Math.max(10, chartDims.width - padX * 2);
                  const plotHeight = Math.max(10, chartDims.height - padTop - padBottom);

                  const minP = Math.min(...selectedStock.priceHistory.map((p) => p.price));
                  const maxP = Math.max(...selectedStock.priceHistory.map((p) => p.price));
                  const range = maxP - minP || 1;

                  const chartPts = selectedStock.priceHistory.map((pt, i) => {
                    const x = padX + (i / (selectedStock.priceHistory.length - 1 || 1)) * plotWidth;
                    const y = padTop + plotHeight - ((pt.price - minP) / range) * plotHeight;
                    return { x, y, price: pt.price, time: pt.time };
                  });

                  const pathStr = chartPts.reduce((acc, pt, i) => {
                    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                  }, '');

                  const areaStr = `${pathStr} L ${padX + plotWidth} ${chartDims.height - padBottom + 2} L ${padX} ${chartDims.height - padBottom + 2} Z`;

                  // Calculate Y coordinate for user stop loss and target price
                  const getPriceY = (val: number) => {
                    return padTop + plotHeight - ((val - minP) / range) * plotHeight;
                  };

                  const activeHoverPoint = (chartHovered && chartHoverIdx !== null && chartPts[chartHoverIdx])
                    ? chartPts[chartHoverIdx]
                    : null;

                  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
                    if (!chartSvgRef.current) return;
                    const rect = chartSvgRef.current.getBoundingClientRect();
                    const clientX = e.clientX - rect.left;
                    const clampedX = Math.max(padX, Math.min(padX + plotWidth, clientX));
                    const ratio = (clampedX - padX) / plotWidth;
                    const idx = Math.max(0, Math.min(chartPts.length - 1, Math.round(ratio * (chartPts.length - 1))));
                    setChartHoverIdx(idx);
                    setChartHovered(true);
                  };

                  return (
                    <svg
                      ref={chartSvgRef}
                      viewBox={`0 0 ${chartDims.width} ${chartDims.height}`}
                      className="w-full h-full overflow-visible cursor-crosshair touch-none select-none"
                      onPointerMove={handlePointer}
                      onPointerDown={handlePointer}
                      onPointerLeave={() => {
                        setChartHovered(false);
                        setChartHoverIdx(null);
                      }}
                    >
                      <defs>
                        <linearGradient id="paperChartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Dynamic Target Price Boundary Line (Responds to user targetPrice input) */}
                      {useTarget && targetPrice > 0 && (
                        <g className="transition-all duration-200">
                          <line
                            x1={padX}
                            y1={Math.max(padTop, Math.min(chartDims.height - padBottom, getPriceY(targetPrice)))}
                            x2={padX + plotWidth}
                            y2={Math.max(padTop, Math.min(chartDims.height - padBottom, getPriceY(targetPrice)))}
                            stroke="#10B981"
                            strokeWidth="1.2"
                            strokeDasharray="3 3"
                            opacity="0.8"
                          />
                          <text
                            x={padX + plotWidth - 75}
                            y={Math.max(12, getPriceY(targetPrice) - 3)}
                            fill="#10B981"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            TARGET ₹{targetPrice}
                          </text>
                        </g>
                      )}

                      {/* Dynamic Stop-Loss Boundary Line (Responds to user stopLoss input) */}
                      {useStopLoss && stopLoss > 0 && (
                        <g className="transition-all duration-200">
                          <line
                            x1={padX}
                            y1={Math.max(padTop, Math.min(chartDims.height - padBottom, getPriceY(stopLoss)))}
                            x2={padX + plotWidth}
                            y2={Math.max(padTop, Math.min(chartDims.height - padBottom, getPriceY(stopLoss)))}
                            stroke="#F43F5E"
                            strokeWidth="1.2"
                            strokeDasharray="3 3"
                            opacity="0.8"
                          />
                          <text
                            x={padX + plotWidth - 85}
                            y={Math.min(chartDims.height - 4, getPriceY(stopLoss) + 11)}
                            fill="#F43F5E"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            STOP-LOSS ₹{stopLoss}
                          </text>
                        </g>
                      )}

                      {/* Area fill */}
                      <path d={areaStr} fill="url(#paperChartGlow)" />

                      {/* Glowing line */}
                      <path
                        d={pathStr}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />

                      {/* Regular Data Points - 100% Circular */}
                      {chartPts.map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r={chartHoverIdx === i ? 5 : 3}
                          fill={chartHoverIdx === i ? '#FFFFFF' : '#10B981'}
                          stroke={chartHoverIdx === i ? '#10B981' : '#000000'}
                          strokeWidth={chartHoverIdx === i ? 2 : 1.2}
                          className="transition-all duration-150"
                        />
                      ))}

                      {/* Interactive Crosshair Guideline on Cursor Movement */}
                      {activeHoverPoint && (
                        <g className="pointer-events-none">
                          <line
                            x1={activeHoverPoint.x}
                            y1={padTop}
                            x2={activeHoverPoint.x}
                            y2={chartDims.height - padBottom}
                            stroke="#10B981"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            opacity="0.75"
                          />
                          <line
                            x1={padX}
                            y1={activeHoverPoint.y}
                            x2={padX + plotWidth}
                            y2={activeHoverPoint.y}
                            stroke="#10B981"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            opacity="0.75"
                          />
                          <circle
                            cx={activeHoverPoint.x}
                            cy={activeHoverPoint.y}
                            r={5.5}
                            fill="#10B981"
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          />
                        </g>
                      )}
                    </svg>
                  );
                })()}

                {/* Micro time labels */}
                <div className="flex justify-between items-center text-[10px] font-mono theme-muted-text mt-1 border-t theme-border pt-1">
                  {selectedStock.priceHistory.map((p, idx) => (
                    <span 
                      key={idx}
                      className={chartHoverIdx === idx ? 'text-emerald-500 font-bold' : undefined}
                    >
                      {p.time}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Fundamental Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                <span className="text-[10px] theme-muted-text block font-medium">P/E Ratio</span>
                <span className="text-sm font-bold font-mono theme-main-text">{selectedStock.peRatio}</span>
              </div>
              <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                <span className="text-[10px] theme-muted-text block font-medium">ROE</span>
                <span className="text-sm font-bold font-mono theme-positive-text">{selectedStock.roe}</span>
              </div>
              <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                <span className="text-[10px] theme-muted-text block font-medium">Debt-to-Equity</span>
                <span className="text-sm font-bold font-mono theme-main-text">{selectedStock.debtToEquity}</span>
              </div>
              <div className="p-3 theme-surface-subtle rounded-xl border theme-border">
                <span className="text-[10px] theme-muted-text block font-medium">52W Range</span>
                <span className="text-xs font-mono theme-secondary-text">₹{selectedStock.low52w} - ₹{selectedStock.high52w}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Placement Ticket */}
        <div className="space-y-6">
          <form
            onSubmit={handleSubmitOrder}
            data-tour="paper-trading-order-ticket"
            className="fintech-card p-6 space-y-5"
          >
            <h3 className="text-base font-bold theme-main-text flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-500" />
              Simulated Order Ticket
            </h3>

            {/* Buy / Sell switch */}
            <div className="grid grid-cols-2 gap-2 theme-surface-subtle p-1 rounded-2xl border theme-border">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer interactive-btn ${
                  side === 'BUY'
                    ? 'theme-btn-primary shadow-xs'
                    : 'theme-secondary-text hover:theme-main-text'
                }`}
              >
                Buy (Long)
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer interactive-btn ${
                  side === 'SELL'
                    ? 'theme-btn-bear shadow-xs'
                    : 'theme-secondary-text hover:theme-main-text'
                }`}
              >
                Sell (Exit)
              </button>
            </div>

            {/* Position check */}
            <div className="text-xs theme-secondary-text flex justify-between px-1">
              <span>You currently own:</span>
              <span className="font-mono font-bold theme-main-text">
                {userPosition ? `${userPosition.shares} shares` : '0 shares'}
              </span>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs font-semibold theme-secondary-text block mb-1.5">Number of Shares:</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full theme-surface-subtle border theme-border rounded-xl px-3 py-2 text-sm font-mono theme-main-text interactive-input focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(25)}
                  className="px-2.5 py-2 theme-surface-subtle theme-main-text rounded-xl text-xs font-mono border theme-border hover:theme-card cursor-pointer font-semibold interactive-btn"
                >
                  25
                </button>
                <button
                  type="button"
                  onClick={() => setQuantity(50)}
                  className="px-2.5 py-2 theme-surface-subtle theme-main-text rounded-xl text-xs font-mono border theme-border hover:theme-card cursor-pointer font-semibold interactive-btn"
                >
                  50
                </button>
              </div>
            </div>

            {/* Stop Loss (Risk Management) */}
            <div className="p-3 theme-surface-subtle rounded-xl border theme-border space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold theme-secondary-text flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 theme-warning-text" />
                  Planned Stop-Loss (₹):
                </label>
                <input
                  type="checkbox"
                  checked={useStopLoss}
                  onChange={(e) => setUseStopLoss(e.target.checked)}
                  className="accent-emerald-500"
                />
              </div>
              {useStopLoss && (
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full theme-card border border-rose-400 rounded-lg px-2.5 py-1 text-xs font-mono theme-negative-text"
                />
              )}
            </div>

            {/* Target Price */}
            <div className="p-3 theme-surface-subtle rounded-xl border theme-border space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold theme-secondary-text flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 theme-positive-text" />
                  Planned Target (₹):
                </label>
                <input
                  type="checkbox"
                  checked={useTarget}
                  onChange={(e) => setUseTarget(e.target.checked)}
                  className="accent-emerald-500"
                />
              </div>
              {useTarget && (
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full theme-card border border-emerald-400 rounded-lg px-2.5 py-1 text-xs font-mono theme-positive-text"
                />
              )}
            </div>

            {/* Total Required */}
            <div className="pt-2 border-t theme-border flex justify-between items-center text-xs">
              <span className="theme-secondary-text font-medium">Order Value:</span>
              <span className="text-base font-bold font-mono theme-main-text">
                ₹{orderTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer interactive-btn ${
                side === 'BUY'
                  ? 'theme-btn-primary'
                  : 'theme-btn-bear'
              }`}
            >
              {side === 'BUY' ? `Buy ${quantity} ${selectedStock.symbol}` : `Sell ${quantity} ${selectedStock.symbol}`}
            </button>

            {tradeStatus && (
              <div className={`p-4 rounded-xl text-xs leading-relaxed border space-y-2 ${
                tradeStatus.success 
                  ? 'theme-surface-subtle theme-positive-text border-emerald-500/30' 
                  : 'theme-surface-subtle text-[#B82E3B] dark:text-[#E66B6B] border-[#B82E3B]/30'
              }`}>
                <div className="flex items-start gap-3">
                  {tradeStatus.success ? (
                    side === 'BUY' ? (
                      <MarketMascot character="bull" pose="celebrating" size="xs" interactive={false} />
                    ) : (
                      <MarketMascot character="bear" pose="warning" size="xs" interactive={false} />
                    )
                  ) : (
                    <MarketMascot character="bear" pose="thinking" size="xs" interactive={false} />
                  )}
                  <div className="space-y-1 min-w-0">
                    <span className="font-bold block">
                      {tradeStatus.message}
                    </span>
                    <span className="text-[11px] theme-secondary-text block">
                      {tradeStatus.success
                        ? side === 'BUY'
                          ? 'Bullish Bob: "Ownership secured! Give your investment thesis time to compound."'
                          : 'Bearish Ben: "Order completed! Adhering to your exit plan keeps trading psychology sharp."'
                        : 'Bearish Ben: "Check your virtual cash balance or available shares before placing again."'}
                    </span>
                  </div>
                </div>

                {tradeStatus.success && onOpenJournalForTrade && (
                  <button
                    type="button"
                    onClick={() => onOpenJournalForTrade(selectedStock.symbol)}
                    className="mt-2 block theme-primary-text hover:underline font-semibold cursor-pointer text-xs"
                  >
                    Log this trade in your Trading Journal ✍️
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Open Positions Table */}
      <div className="fintech-card p-6 space-y-4">
        <h3 className="text-base font-bold theme-main-text flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-500" />
          Open Simulated Portfolio Positions
        </h3>

        {Object.keys(portfolio.positions).length === 0 ? (
          <div className="p-8 text-center theme-surface-subtle rounded-2xl border theme-border theme-secondary-text text-sm">
            You currently hold 0 open stock positions. Select a stock above to place your first educational paper trade!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="theme-surface-subtle theme-secondary-text font-mono border-b theme-border">
                <tr>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Shares</th>
                  <th className="p-3">Avg Buy Price</th>
                  <th className="p-3">Current Price</th>
                  <th className="p-3">Market Value</th>
                  <th className="p-3">Unrealized P&L</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-border font-mono">
                {Object.values(portfolio.positions).map((pos) => {
                  const stock = stocks.find(s => s.symbol === pos.symbol);
                  const curPrice = stock ? stock.currentPrice : pos.currentPrice;
                  const currentVal = pos.shares * curPrice;
                  const pnl = currentVal - (pos.shares * pos.averagePrice);
                  const pnlPct = (pnl / (pos.shares * pos.averagePrice)) * 100;

                  return (
                    <tr key={pos.symbol} className="hover:theme-surface-subtle transition-colors">
                      <td className="p-3 font-bold theme-main-text">{pos.symbol}</td>
                      <td className="p-3 theme-secondary-text">{pos.shares}</td>
                      <td className="p-3 theme-secondary-text">₹{pos.averagePrice.toFixed(2)}</td>
                      <td className="p-3 theme-main-text font-bold">₹{curPrice.toFixed(2)}</td>
                      <td className="p-3 theme-secondary-text">₹{currentVal.toFixed(2)}</td>
                      <td className={`p-3 font-bold ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)} ({pnlPct.toFixed(1)}%)
                      </td>
                      <td className="p-3 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStockSymbol(pos.symbol);
                            setSide('SELL');
                            setQuantity(pos.shares);
                          }}
                          className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg hover:bg-rose-600 hover:text-white transition-all cursor-pointer font-semibold"
                        >
                          Quick Exit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade History Log */}
      <div className="fintech-card p-6 space-y-4">
        <h3 className="text-base font-bold theme-main-text flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-500" />
          Recent Paper Trade Execution History
        </h3>

        {tradeHistory.length === 0 ? (
          <div className="p-6 text-center theme-muted-text text-xs font-mono theme-surface-subtle rounded-2xl border theme-border">
            No executed orders recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="theme-surface-subtle theme-secondary-text border-b theme-border">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Side</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Shares</th>
                  <th className="p-3">Executed Price</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-border theme-secondary-text">
                {tradeHistory.slice(0, 8).map((trade) => (
                  <tr key={trade.id} className="hover:theme-surface-subtle">
                    <td className="p-3 theme-muted-text text-[11px]">{new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-3 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        trade.side === 'BUY' ? 'bg-emerald-500/10 theme-positive-text border border-emerald-500/20' : 'bg-rose-500/10 theme-negative-text border border-rose-500/20'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="p-3 font-bold theme-main-text">{trade.symbol}</td>
                    <td className="p-3">{trade.quantity}</td>
                    <td className="p-3">₹{trade.price.toFixed(2)}</td>
                    <td className="p-3 font-medium">₹{trade.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td className="p-3 font-semibold">
                      {trade.realizedPnL !== undefined ? (
                        <span className={trade.realizedPnL >= 0 ? 'theme-positive-text' : 'theme-negative-text'}>
                          {trade.realizedPnL >= 0 ? '+' : ''}₹{trade.realizedPnL.toFixed(2)}
                        </span>
                      ) : (
                        <span className="theme-muted-text">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
