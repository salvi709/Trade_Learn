import React, { useState, useRef, useId, useMemo } from 'react';
import { 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Sliders, 
  Layers, 
  Eye, 
  Sparkles,
  Maximize2,
  RotateCcw,
  Clock,
  Activity,
  BarChart2,
  CheckCircle2
} from 'lucide-react';

export type CandlestickPresetId = 
  | 'bullish_standard' 
  | 'bearish_standard' 
  | 'hammer' 
  | 'shooting_star' 
  | 'doji' 
  | 'bullish_marubozu' 
  | 'bearish_marubozu';

export type MultiCandlePatternId = 
  | 'bullish_engulfing' 
  | 'bearish_engulfing' 
  | 'morning_star' 
  | 'support_bounce' 
  | 'breakout_retest';

interface SinglePreset {
  id: CandlestickPresetId;
  label: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  open: number;
  close: number;
  high: number;
  low: number;
  patternName: string;
  significance: string;
}

interface MultiPreset {
  id: MultiCandlePatternId;
  label: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  patternName: string;
  description: string;
  candles: Array<{ open: number; close: number; high: number; low: number; label: string; role: string }>;
  supportPrice: number;
  resistancePrice: number;
}

const DEFAULT_SINGLE: { open: number; close: number; high: number; low: number } = {
  open: 480,
  close: 510,
  high: 525,
  low: 470,
};

const SINGLE_PRESETS: SinglePreset[] = [
  {
    id: 'bullish_standard',
    label: 'Standard Bullish',
    type: 'BULLISH',
    open: 480,
    close: 510,
    high: 525,
    low: 470,
    patternName: 'Bullish Expansion Candle',
    significance: 'Buyers maintain control throughout the session, closing higher than open with balanced wicks.',
  },
  {
    id: 'bearish_standard',
    label: 'Standard Bearish',
    type: 'BEARISH',
    open: 515,
    close: 485,
    high: 525,
    low: 475,
    patternName: 'Bearish Distribution Candle',
    significance: 'Sellers overwhelm buyers from the opening bell and press prices downward into the close.',
  },
  {
    id: 'hammer',
    label: 'Hammer (Reversal)',
    type: 'BULLISH',
    open: 495,
    close: 508,
    high: 512,
    low: 440,
    patternName: 'Bullish Hammer / Pin Bar',
    significance: 'Sellers attempted an intra-session breakdown, but buyers forcefully absorbed all supply and drove prices back to close near the highs.',
  },
  {
    id: 'shooting_star',
    label: 'Shooting Star',
    type: 'BEARISH',
    open: 490,
    close: 478,
    high: 550,
    low: 472,
    patternName: 'Shooting Star / Supply Rejection',
    significance: 'Buyers aggressively pushed to multi-session highs, but institutional sellers stepped in with heavy supply, forcing a weak close near the low.',
  },
  {
    id: 'doji',
    label: 'Doji (Indecision)',
    type: 'NEUTRAL',
    open: 500,
    close: 500,
    high: 535,
    low: 465,
    patternName: 'Doji Star (Equilibrium)',
    significance: 'Neither bulls nor bears could prevail. Open and Close are identical, signaling equilibrium or potential trend inflection.',
  },
  {
    id: 'bullish_marubozu',
    label: 'Bullish Marubozu',
    type: 'BULLISH',
    open: 460,
    close: 540,
    high: 540,
    low: 460,
    patternName: 'Bullish Marubozu (Zero Shadow)',
    significance: 'Unstoppable institutional demand from open to close. Open equals Low, Close equals High without any upper or lower shadows.',
  },
  {
    id: 'bearish_marubozu',
    label: 'Bearish Marubozu',
    type: 'BEARISH',
    open: 540,
    close: 460,
    high: 540,
    low: 460,
    patternName: 'Bearish Marubozu (Full Selloff)',
    significance: 'Relentless supply from opening to close without any buyer bounce. Open equals High, Close equals Low.',
  },
];

const MULTI_PRESETS: MultiPreset[] = [
  {
    id: 'bullish_engulfing',
    label: 'Bullish Engulfing',
    type: 'BULLISH',
    patternName: 'Bullish Engulfing Reversal',
    description: 'A small bearish session is completely engulfed by a large green candle whose body completely covers the prior candle, showing strong buyer takeover.',
    candles: [
      { open: 505, close: 490, high: 510, low: 486, label: 'Session 1', role: 'Downtrend Continuation' },
      { open: 492, close: 480, high: 496, low: 476, label: 'Session 2', role: 'Exhaustion Candle' },
      { open: 478, close: 512, high: 518, low: 475, label: 'Session 3', role: 'Bullish Engulfing Trigger' },
    ],
    supportPrice: 474,
    resistancePrice: 520,
  },
  {
    id: 'bearish_engulfing',
    label: 'Bearish Engulfing',
    type: 'BEARISH',
    patternName: 'Bearish Engulfing Reversal',
    description: 'After an upward trend, a small green candle is engulfed by an aggressive red selloff candle that wipes out the prior session gains.',
    candles: [
      { open: 480, close: 495, high: 498, low: 478, label: 'Session 1', role: 'Uptrend Momentum' },
      { open: 496, close: 510, high: 515, low: 492, label: 'Session 2', role: 'Late Buyer Push' },
      { open: 514, close: 482, high: 518, low: 479, label: 'Session 3', role: 'Bearish Engulfing Dump' },
    ],
    supportPrice: 475,
    resistancePrice: 518,
  },
  {
    id: 'morning_star',
    label: 'Morning Star',
    type: 'BULLISH',
    patternName: 'Three-Candle Morning Star Reversal',
    description: 'A 3-candle bottoming formation: 1) Long red candle, 2) Small indecision candle gapping lower, 3) Strong green candle recovering over 50% of candle 1.',
    candles: [
      { open: 520, close: 485, high: 524, low: 480, label: 'Day 1', role: 'Bearish Selloff' },
      { open: 475, close: 477, high: 486, low: 468, label: 'Day 2', role: 'Star / Indecision Doji' },
      { open: 482, close: 515, high: 518, low: 480, label: 'Day 3', role: 'Strong Buyer Confirmation' },
    ],
    supportPrice: 465,
    resistancePrice: 528,
  },
  {
    id: 'support_bounce',
    label: 'Support Bounce',
    type: 'BULLISH',
    patternName: 'Support Level Retest & Hammer Bounce',
    description: 'Price pulls back to a multi-week support floor, prints a long lower rejection wick, and confirms demand with a subsequent green candle.',
    candles: [
      { open: 515, close: 490, high: 518, low: 485, label: 'Bar 1', role: 'Pullback into Support' },
      { open: 488, close: 482, high: 492, low: 462, label: 'Bar 2', role: 'Support Retest / Hammer Wick' },
      { open: 484, close: 508, high: 512, low: 480, label: 'Bar 3', role: 'Strong Demand Defense' },
    ],
    supportPrice: 462,
    resistancePrice: 520,
  },
];

type TimeframeOption = '15M' | '1H' | '4H' | '1D';

export const CandlestickAnatomyVisual: React.FC = () => {
  const gradientId = useId();

  // Mode: Single Candlestick Anatomy vs Multi-Candle Pattern Lab
  const [labMode, setLabMode] = useState<'single' | 'multi'>('single');

  // Single Candle State
  const [activeSinglePreset, setActiveSinglePreset] = useState<CandlestickPresetId>('bullish_standard');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1D');
  const [openPrice, setOpenPrice] = useState<number>(DEFAULT_SINGLE.open);
  const [closePrice, setClosePrice] = useState<number>(DEFAULT_SINGLE.close);
  const [highPrice, setHighPrice] = useState<number>(DEFAULT_SINGLE.high);
  const [lowPrice, setLowPrice] = useState<number>(DEFAULT_SINGLE.low);
  const [volatility, setVolatility] = useState<'low' | 'normal' | 'high'>('normal');

  // Multi-Candle State
  const [activeMultiPreset, setActiveMultiPreset] = useState<MultiCandlePatternId>('bullish_engulfing');
  const [multiCandles, setMultiCandles] = useState(MULTI_PRESETS[0].candles);
  const [multiSupport, setMultiSupport] = useState<number>(MULTI_PRESETS[0].supportPrice);
  const [multiResistance, setMultiResistance] = useState<number>(MULTI_PRESETS[0].resistancePrice);
  const [multiHoverIdx, setMultiHoverIdx] = useState<number | null>(null);

  // Common Visual Settings
  const [showSupportResistance, setShowSupportResistance] = useState<boolean>(true);
  const [supportLevel, setSupportLevel] = useState<number>(460);
  const [resistanceLevel, setResistanceLevel] = useState<number>(535);

  // Interactive Cursor & Hover State (No 3D distortion)
  const [hoverPart, setHoverPart] = useState<string | null>(null);
  const [isHoveringChart, setIsHoveringChart] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; price: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Volatility scaling factor
  const volatilityMultiplier = volatility === 'low' ? 0.7 : volatility === 'high' ? 1.4 : 1.0;

  // Single Candle Derived Values
  const effectiveRangeSpread = (highPrice - lowPrice) * volatilityMultiplier;
  const midPrice = (openPrice + closePrice) / 2;
  const effectiveHigh = Math.max(highPrice, Math.round(midPrice + effectiveRangeSpread / 2));
  const effectiveLow = Math.min(lowPrice, Math.round(midPrice - effectiveRangeSpread / 2));

  const isBullish = closePrice > openPrice;
  const isDoji = Math.abs(closePrice - openPrice) <= 2;

  const candleColor = isDoji 
    ? '#E59F1A' 
    : isBullish 
    ? '#10B981' 
    : '#F43F5E';

  const bodyTopPrice = Math.max(openPrice, closePrice);
  const bodyBottomPrice = Math.min(openPrice, closePrice);

  const trueRange = Math.max(effectiveHigh - effectiveLow, 1);
  const bodyHeightVal = Math.max(Math.abs(closePrice - openPrice), 1);
  const upperWickHeight = Math.max(effectiveHigh - bodyTopPrice, 0);
  const lowerWickHeight = Math.max(bodyBottomPrice - effectiveLow, 0);

  const bodyRatio = Math.round((bodyHeightVal / trueRange) * 100);
  const upperWickRatio = Math.round((upperWickHeight / trueRange) * 100);
  const lowerWickRatio = Math.round((lowerWickHeight / trueRange) * 100);

  // Sizing & Scaling coordinates (Preserves exact isotropic 1:1 aspect ratio)
  // viewBox: 0 0 300 320
  const chartMin = Math.min(effectiveLow, supportLevel) - 15;
  const chartMax = Math.max(effectiveHigh, resistanceLevel) + 15;
  const priceToY = (price: number) => {
    const range = chartMax - chartMin || 1;
    const normalized = (price - chartMin) / range;
    return 275 - normalized * 230;
  };

  const yToPrice = (y: number) => {
    const normalized = (275 - y) / 230;
    return Math.round(chartMin + normalized * (chartMax - chartMin));
  };

  const yHigh = priceToY(effectiveHigh);
  const yLow = priceToY(effectiveLow);
  const yBodyTop = priceToY(bodyTopPrice);
  const yBodyBottom = priceToY(bodyBottomPrice);
  const candleBodyHeightSvg = Math.max(yBodyBottom - yBodyTop, 4);

  // Reset to original default values
  const handleReset = () => {
    if (labMode === 'single') {
      setOpenPrice(DEFAULT_SINGLE.open);
      setClosePrice(DEFAULT_SINGLE.close);
      setHighPrice(DEFAULT_SINGLE.high);
      setLowPrice(DEFAULT_SINGLE.low);
      setSupportLevel(460);
      setResistanceLevel(535);
      setVolatility('normal');
      setActiveSinglePreset('bullish_standard');
    } else {
      const preset = MULTI_PRESETS[0];
      setActiveMultiPreset(preset.id);
      setMultiCandles(preset.candles);
      setMultiSupport(preset.supportPrice);
      setMultiResistance(preset.resistancePrice);
    }
    setHoverPart(null);
    setCursorPos(null);
  };

  // Select a Single Preset
  const handleSelectSinglePreset = (preset: SinglePreset) => {
    setActiveSinglePreset(preset.id);
    setOpenPrice(preset.open);
    setClosePrice(preset.close);
    setHighPrice(preset.high);
    setLowPrice(preset.low);
    setSupportLevel(Math.min(preset.low - 10, 450));
    setResistanceLevel(Math.max(preset.high + 10, 540));
  };

  // Select a Multi-Candle Preset
  const handleSelectMultiPreset = (preset: MultiPreset) => {
    setActiveMultiPreset(preset.id);
    setMultiCandles(preset.candles);
    setMultiSupport(preset.supportPrice);
    setMultiResistance(preset.resistancePrice);
    setMultiHoverIdx(null);
  };

  // Safe manual adjustments
  const handleOpenChange = (val: number) => {
    setOpenPrice(val);
    if (val > highPrice) setHighPrice(val);
    if (val < lowPrice) setLowPrice(val);
  };

  const handleCloseChange = (val: number) => {
    setClosePrice(val);
    if (val > highPrice) setHighPrice(val);
    if (val < lowPrice) setLowPrice(val);
  };

  const handleHighChange = (val: number) => {
    const safeHigh = Math.max(val, openPrice, closePrice);
    setHighPrice(safeHigh);
  };

  const handleLowChange = (val: number) => {
    const safeLow = Math.min(val, openPrice, closePrice);
    setLowPrice(safeLow);
  };

  // Smooth Pointer Move (No parallax/tilt distortion)
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // ViewBox is 0 0 300 320 with preserveAspectRatio="xMidYMid meet"
    // Convert client coordinate into SVG coordinate
    const scale = Math.min(rect.width / 300, rect.height / 320) || 1;
    const offsetX = (rect.width - 300 * scale) / 2;
    const offsetY = (rect.height - 320 * scale) / 2;

    const svgX = Math.max(0, Math.min(300, (clientX - offsetX) / scale));
    const svgY = Math.max(0, Math.min(320, (clientY - offsetY) / scale));

    const price = yToPrice(svgY);
    setCursorPos({ x: svgX, y: svgY, price });
    setIsHoveringChart(true);
  };

  const handlePointerLeave = () => {
    setIsHoveringChart(false);
    setHoverPart(null);
    setCursorPos(null);
  };

  // Multi-candle min/max bounds
  const multiBounds = useMemo(() => {
    const allLows = multiCandles.map((c) => c.low);
    const allHighs = multiCandles.map((c) => c.high);
    const min = Math.min(...allLows, multiSupport) - 10;
    const max = Math.max(...allHighs, multiResistance) + 10;
    return { min, max, range: max - min || 1 };
  }, [multiCandles, multiSupport, multiResistance]);

  const multiPriceToY = (price: number) => {
    const norm = (price - multiBounds.min) / multiBounds.range;
    return 270 - norm * 210;
  };

  // Educational Analysis
  const getDynamicAnalysis = () => {
    if (labMode === 'multi') {
      const active = MULTI_PRESETS.find((p) => p.id === activeMultiPreset) || MULTI_PRESETS[0];
      return {
        title: active.patternName,
        desc: active.description,
        bias: active.type === 'BULLISH' ? 'Bullish Reversal Edge' : 'Bearish Breakdown Edge',
      };
    }

    if (isDoji) {
      return {
        title: 'Equilibrium / Market Indecision (Doji)',
        desc: `Buyers and sellers wrestled across a ₹${trueRange} range, but neither could establish dominance. The close (₹${closePrice}) ended virtually equal to open (₹${openPrice}). In high-volume zones, this signals exhaustion of the prior move.`,
        bias: 'Neutral / Potential Inflection',
      };
    }

    if (lowerWickRatio >= 50 && bodyRatio <= 35) {
      return {
        title: 'Bullish Hammer / Demand Defense',
        desc: `Heavy selling forced prices down to ₹${effectiveLow}, but aggressive buyers stepped in, absorbed all supply, and drove price back to close at ₹${closePrice}. The long lower shadow (${lowerWickRatio}% of candle) represents a severe rejection of lower prices.`,
        bias: 'Strong Bullish Defense',
      };
    }

    if (upperWickRatio >= 50 && bodyRatio <= 35) {
      return {
        title: 'Shooting Star / Supply Rejection',
        desc: `Buyers attempted an aggressive rally up to ₹${effectiveHigh}, but encountered an overwhelming wall of institutional sellers. Price was slammed back down to close near the lows at ₹${closePrice}. The long upper wick (${upperWickRatio}% of candle) proves sellers control overhead supply.`,
        bias: 'Strong Bearish Rejection',
      };
    }

    if (bodyRatio >= 80) {
      return {
        title: isBullish ? 'Bullish Marubozu (Dominant Momentum)' : 'Bearish Marubozu (Relentless Liquidation)',
        desc: isBullish
          ? `Buyers owned the entire session with almost zero pullbacks. The body occupies ${bodyRatio}% of the range, reflecting dominant demand from open to close.`
          : `Sellers dominated the entire session without allowing any counter-rally. The body occupies ${bodyRatio}% of the range, showing extreme supply pressure.`,
        bias: isBullish ? 'Dominant Buyer Trend' : 'Dominant Seller Trend',
      };
    }

    if (isBullish) {
      return {
        title: 'Standard Bullish Candle',
        desc: `Buyers established a net positive session, gaining ₹${closePrice - openPrice} (+${(((closePrice - openPrice) / openPrice) * 100).toFixed(1)}%). Upper wick shows resistance at ₹${effectiveHigh}, while lower wick shows buyers defended ₹${effectiveLow}.`,
        bias: 'Bullish Advantage',
      };
    }

    return {
      title: 'Standard Bearish Candle',
      desc: `Sellers gained net ground, knocking price down by ₹${openPrice - closePrice} (-${(((openPrice - closePrice) / openPrice) * 100).toFixed(1)}%). Lower wick reflects some late buyer absorption at ₹${effectiveLow}.`,
      bias: 'Bearish Advantage',
    };
  };

  const dynamicAnalysis = getDynamicAnalysis();

  return (
    <div className="theme-card border theme-border rounded-3xl p-6 md:p-8 my-6 theme-card-shadow theme-main-text">
      {/* =====================================================================
          HEADER & INTERACTION CONTROLS
         ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b theme-border pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#0D6847]/10 text-emerald-500">
              <Sliders className="w-4 h-4" />
            </span>
            <h4 className="text-lg sm:text-xl font-bold theme-main-text font-heading tracking-tight">
              Interactive Candlestick & Pattern Lab
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
              True Proportions
            </span>
          </div>
          <p className="text-xs theme-secondary-text mt-1">
            Experiment with OHLC values, volatility, and multi-candle formations. Circles and geometric elements retain 100% true circular geometry.
          </p>
        </div>

        {/* Mode Selector & Reset Button */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto font-mono text-xs">
          <div className="flex items-center gap-1 p-1 rounded-xl theme-surface-subtle border theme-border">
            <button
              type="button"
              onClick={() => setLabMode('single')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                labMode === 'single'
                  ? 'bg-[#0D6847] text-white shadow-xs'
                  : 'theme-secondary-text hover:theme-main-text'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Single Candle</span>
            </button>
            <button
              type="button"
              onClick={() => setLabMode('multi')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                labMode === 'multi'
                  ? 'bg-[#0D6847] text-white shadow-xs'
                  : 'theme-secondary-text hover:theme-main-text'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Multi-Candle Formations</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl border theme-border theme-surface-subtle hover:theme-surface-elevated text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer text-emerald-500"
            title="Reset to default pattern values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          PRESET SELECTION STRIP
         ===================================================================== */}
      <div className="mb-6">
        <div className="text-[11px] font-mono theme-muted-text uppercase font-semibold mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{labMode === 'single' ? 'Candlestick Presets:' : 'Multi-Candle Pattern Presets:'}</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {labMode === 'single'
            ? SINGLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectSinglePreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                    activeSinglePreset === preset.id
                      ? 'border-emerald-500 bg-[#0D6847] text-white shadow-xs font-semibold'
                      : 'theme-border theme-surface-subtle theme-secondary-text hover:border-emerald-500/40 hover:theme-main-text'
                  }`}
                >
                  {preset.type === 'BULLISH' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                  {preset.type === 'BEARISH' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                  {preset.type === 'NEUTRAL' && <Maximize2 className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{preset.label}</span>
                </button>
              ))
            : MULTI_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectMultiPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                    activeMultiPreset === preset.id
                      ? 'border-emerald-500 bg-[#0D6847] text-white shadow-xs font-semibold'
                      : 'theme-border theme-surface-subtle theme-secondary-text hover:border-emerald-500/40 hover:theme-main-text'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{preset.label}</span>
                </button>
              ))}
        </div>
      </div>

      {/* =====================================================================
          MAIN 2-COLUMN LAB: PROPORTIONAL CHART CANVAS + INTERACTIVE CONTROLS
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Preserved-Proportion SVG Pattern Chart */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div 
            className="w-full relative theme-surface-subtle rounded-2xl border theme-border p-4 sm:p-6 overflow-hidden select-none transition-all duration-200"
            style={{
              boxShadow: isHoveringChart ? '0 8px 24px -4px rgba(16, 185, 129, 0.12)' : 'none',
              borderColor: isHoveringChart ? 'rgba(16, 185, 129, 0.35)' : undefined,
            }}
          >
            {/* Live Chart Sub-Header */}
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 aspect-square" style={{ backgroundColor: candleColor }} />
                <span className="font-bold theme-main-text">{dynamicAnalysis.title}</span>
              </div>
              <span className="theme-muted-text text-[11px]">
                {labMode === 'single' ? `${timeframe} Candle · Range ₹${trueRange}` : 'Formation Series'}
              </span>
            </div>

            {/* Preserved Aspect Ratio SVG Canvas (Centers cleanly, no oval distortion) */}
            <div className="w-full max-w-sm sm:max-w-md mx-auto aspect-[300/320] flex items-center justify-center">
              <svg
                ref={svgRef}
                viewBox="0 0 300 320"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full cursor-crosshair touch-none select-none"
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                onPointerDown={handlePointerMove}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={candleColor} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={candleColor} stopOpacity="0.4" />
                  </linearGradient>
                  <filter id="candleGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor={candleColor} floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Background Price Grid Lines */}
                {[440, 480, 520, 560].map((gridPrice) => {
                  const y = labMode === 'single' ? priceToY(gridPrice) : multiPriceToY(gridPrice);
                  if (y < 25 || y > 295) return null;
                  return (
                    <g key={gridPrice} opacity="0.3">
                      <line x1="20" y1={y} x2="280" y2={y} stroke="currentColor" strokeDasharray="3 3" className="theme-border" />
                      <text x="282" y={y + 3} fontSize="9" fontFamily="monospace" fill="currentColor" className="theme-muted-text">
                        ₹{gridPrice}
                      </text>
                    </g>
                  );
                })}

                {/* S/R Boundaries */}
                {showSupportResistance && (
                  <g className="transition-opacity duration-200">
                    {/* Resistance Line */}
                    <line
                      x1="15"
                      y1={labMode === 'single' ? priceToY(resistanceLevel) : multiPriceToY(multiResistance)}
                      x2="280"
                      y2={labMode === 'single' ? priceToY(resistanceLevel) : multiPriceToY(multiResistance)}
                      stroke="#F43F5E"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.65"
                    />
                    <text
                      x="20"
                      y={labMode === 'single' ? priceToY(resistanceLevel) - 4 : multiPriceToY(multiResistance) - 4}
                      fill="#F43F5E"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      RESISTANCE ₹{labMode === 'single' ? resistanceLevel : multiResistance}
                    </text>

                    {/* Support Line */}
                    <line
                      x1="15"
                      y1={labMode === 'single' ? priceToY(supportLevel) : multiPriceToY(multiSupport)}
                      x2="280"
                      y2={labMode === 'single' ? priceToY(supportLevel) : multiPriceToY(multiSupport)}
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.65"
                    />
                    <text
                      x="20"
                      y={labMode === 'single' ? priceToY(supportLevel) + 12 : multiPriceToY(multiSupport) + 12}
                      fill="#10B981"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      SUPPORT ₹{labMode === 'single' ? supportLevel : multiSupport}
                    </text>
                  </g>
                )}

                {/* 1. SINGLE CANDLE RENDERING */}
                {labMode === 'single' && (
                  <g className="transition-all duration-200">
                    {/* Upper Wick */}
                    <line
                      x1="145"
                      y1={yHigh}
                      x2="145"
                      y2={yBodyTop}
                      stroke={candleColor}
                      strokeWidth={hoverPart === 'upperWick' ? '5.5' : '3.5'}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all"
                      style={{ filter: hoverPart === 'upperWick' ? 'url(#candleGlow)' : undefined }}
                      onPointerEnter={() => setHoverPart('upperWick')}
                    />

                    {/* Lower Wick */}
                    <line
                      x1="145"
                      y1={yBodyBottom}
                      x2="145"
                      y2={yLow}
                      stroke={candleColor}
                      strokeWidth={hoverPart === 'lowerWick' ? '5.5' : '3.5'}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all"
                      style={{ filter: hoverPart === 'lowerWick' ? 'url(#candleGlow)' : undefined }}
                      onPointerEnter={() => setHoverPart('lowerWick')}
                    />

                    {/* Real Body Rect */}
                    <rect
                      x="105"
                      y={yBodyTop}
                      width="80"
                      height={candleBodyHeightSvg}
                      rx="6"
                      fill={`url(#${gradientId})`}
                      stroke={candleColor}
                      strokeWidth={hoverPart === 'body' ? '2.5' : '1.5'}
                      className="cursor-pointer transition-all"
                      style={{ filter: hoverPart === 'body' ? 'url(#candleGlow)' : undefined }}
                      onPointerEnter={() => setHoverPart('body')}
                    />

                    {/* High Price True Circle Marker */}
                    <g className="cursor-pointer" onPointerEnter={() => setHoverPart('high')}>
                      <circle
                        cx="145"
                        cy={yHigh}
                        r="5.5"
                        fill="#E59F1A"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="transition-transform duration-200"
                      />
                      <text x="160" y={yHigh + 3} fill="#E59F1A" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        HIGH ₹{effectiveHigh}
                      </text>
                    </g>

                    {/* Open / Close Labels */}
                    <g>
                      <line x1="188" y1={yBodyTop} x2="198" y2={yBodyTop} stroke={candleColor} strokeWidth="1.5" />
                      <text
                        x="202"
                        y={yBodyTop + 3.5}
                        fill={isBullish ? '#10B981' : '#F43F5E'}
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {isBullish ? `CLOSE ₹${closePrice}` : `OPEN ₹${openPrice}`}
                      </text>

                      <line x1="188" y1={yBodyBottom} x2="198" y2={yBodyBottom} stroke={candleColor} strokeWidth="1.5" />
                      <text
                        x="202"
                        y={yBodyBottom + 3.5}
                        fill={isBullish ? '#64748B' : '#F43F5E'}
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {isBullish ? `OPEN ₹${openPrice}` : `CLOSE ₹${closePrice}`}
                      </text>
                    </g>

                    {/* Low Price True Circle Marker */}
                    <g className="cursor-pointer" onPointerEnter={() => setHoverPart('low')}>
                      <circle
                        cx="145"
                        cy={yLow}
                        r="5.5"
                        fill="#E59F1A"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="transition-transform duration-200"
                      />
                      <text x="160" y={yLow + 3} fill="#E59F1A" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        LOW ₹{effectiveLow}
                      </text>
                    </g>
                  </g>
                )}

                {/* 2. MULTI-CANDLE FORMATION RENDERING */}
                {labMode === 'multi' && (
                  <g className="transition-all duration-300">
                    {multiCandles.map((c, i) => {
                      const totalC = multiCandles.length;
                      const colWidth = 220 / totalC;
                      const cx = 40 + i * colWidth + colWidth / 2;
                      const cyHigh = multiPriceToY(c.high);
                      const cyLow = multiPriceToY(c.low);
                      const cyOpen = multiPriceToY(c.open);
                      const cyClose = multiPriceToY(c.close);
                      const cIsBullish = c.close >= c.open;
                      const color = cIsBullish ? '#10B981' : '#F43F5E';
                      const bTop = Math.min(cyOpen, cyClose);
                      const bHeight = Math.max(Math.abs(cyClose - cyOpen), 4);
                      const isHovered = multiHoverIdx === i;

                      return (
                        <g 
                          key={i} 
                          className="cursor-pointer transition-all"
                          onPointerEnter={() => setMultiHoverIdx(i)}
                          onPointerLeave={() => setMultiHoverIdx(null)}
                        >
                          {/* Candle Wick */}
                          <line
                            x1={cx}
                            y1={cyHigh}
                            x2={cx}
                            y2={cyLow}
                            stroke={color}
                            strokeWidth={isHovered ? '4' : '2.5'}
                            strokeLinecap="round"
                          />
                          {/* Candle Body */}
                          <rect
                            x={cx - (isHovered ? 18 : 14)}
                            y={bTop}
                            width={isHovered ? 36 : 28}
                            height={bHeight}
                            rx="4"
                            fill={color}
                            fillOpacity={isHovered ? 0.95 : 0.75}
                            stroke={color}
                            strokeWidth="1.5"
                            className="transition-all"
                          />
                          {/* Sequence Label */}
                          <text
                            x={cx}
                            y="298"
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="monospace"
                            fill="currentColor"
                            className={isHovered ? 'font-bold text-emerald-500 fill-current' : 'theme-muted-text fill-current'}
                          >
                            {c.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Crosshair Guidelines (Isotropic 1:1, perfectly round circle) */}
                {isHoveringChart && cursorPos && (
                  <g className="pointer-events-none transition-opacity duration-150">
                    <line x1="15" y1={cursorPos.y} x2="280" y2={cursorPos.y} stroke="#10B981" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
                    <line x1={cursorPos.x} y1="20" x2={cursorPos.x} y2="290" stroke="#10B981" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
                    {/* Circle is guaranteed circular because scale X == scale Y */}
                    <circle cx={cursorPos.x} cy={cursorPos.y} r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                    {/* Dynamic Price Bubble */}
                    <rect x="235" y={cursorPos.y - 9} width="58" height="18" rx="4" fill="#0D6847" />
                    <text x="242" y={cursorPos.y + 3.5} fill="#FFFFFF" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                      ₹{cursorPos.price}
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Bottom Status Indicator */}
            <div className="flex items-center justify-between text-[11px] font-mono theme-muted-text border-t theme-border pt-3 mt-2">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {labMode === 'single'
                    ? `Zone: ${hoverPart ? hoverPart.toUpperCase() : 'CANVAS'}`
                    : `Active: ${multiHoverIdx !== null ? multiCandles[multiHoverIdx]?.role : 'Hover over candle'}`}
                </span>
              </span>
              <span>Scrub: <strong className="theme-main-text">{cursorPos ? `₹${cursorPos.price}` : 'Hover to inspect'}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Dynamic Controls & Synchronized Analysis */}
        <div className="lg:col-span-5 space-y-4">
          {/* Controls Panel */}
          <div className="p-4 theme-surface-subtle rounded-2xl border theme-border space-y-3.5">
            <div className="flex items-center justify-between border-b theme-border pb-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider theme-main-text flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                <span>{labMode === 'single' ? 'Single Candle Parameters' : 'Multi-Candle Settings'}</span>
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] font-mono text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {labMode === 'single' ? (
              <>
                {/* Timeframe & Volatility Selector */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[10px] theme-muted-text uppercase block mb-1">Timeframe:</label>
                    <div className="flex gap-1 p-0.5 rounded-lg border theme-border theme-surface">
                      {(['15M', '1H', '4H', '1D'] as TimeframeOption[]).map((tf) => (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => setTimeframe(tf)}
                          className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            timeframe === tf ? 'bg-[#0D6847] text-white' : 'theme-secondary-text hover:theme-main-text'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] theme-muted-text uppercase block mb-1">Volatility:</label>
                    <div className="flex gap-1 p-0.5 rounded-lg border theme-border theme-surface">
                      {(['low', 'normal', 'high'] as Array<'low' | 'normal' | 'high'>).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVolatility(v)}
                          className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer capitalize transition-all ${
                            volatility === v ? 'bg-amber-600 text-white' : 'theme-secondary-text hover:theme-main-text'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Open Price Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="theme-secondary-text">Open Price:</span>
                    <span className="font-bold theme-main-text">₹{openPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="430"
                    max="560"
                    value={openPrice}
                    onChange={(e) => handleOpenChange(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-lg"
                  />
                </div>

                {/* Close Price Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="theme-secondary-text">Close Price:</span>
                    <span className="font-bold" style={{ color: candleColor }}>₹{closePrice}</span>
                  </div>
                  <input
                    type="range"
                    min="430"
                    max="560"
                    value={closePrice}
                    onChange={(e) => handleCloseChange(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-lg"
                  />
                </div>

                {/* High Price Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="theme-secondary-text">Session High:</span>
                    <span className="font-bold text-amber-500">₹{effectiveHigh}</span>
                  </div>
                  <input
                    type="range"
                    min={Math.max(openPrice, closePrice)}
                    max="580"
                    value={highPrice}
                    onChange={(e) => handleHighChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg"
                  />
                </div>

                {/* Low Price Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="theme-secondary-text">Session Low:</span>
                    <span className="font-bold text-amber-500">₹{effectiveLow}</span>
                  </div>
                  <input
                    type="range"
                    min="410"
                    max={Math.min(openPrice, closePrice)}
                    value={lowPrice}
                    onChange={(e) => handleLowChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg"
                  />
                </div>
              </>
            ) : (
              /* Multi-Candle Mode Controls */
              <div className="space-y-3 text-xs font-mono">
                <p className="theme-secondary-text leading-relaxed">
                  Select any formation preset above to observe how preceding candles set the stage for institutional reversals and breakouts.
                </p>
                <div className="p-3 rounded-xl border theme-border theme-surface space-y-2">
                  <div className="font-bold theme-main-text flex items-center justify-between">
                    <span>Pattern Sequence:</span>
                    <span className="text-emerald-500">{multiCandles.length} Candlesticks</span>
                  </div>
                  <div className="space-y-1.5">
                    {multiCandles.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-black/5 dark:bg-white/5">
                        <span className="font-semibold theme-main-text">{c.label}: {c.role}</span>
                        <span className={c.close >= c.open ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                          ₹{c.open} → ₹{c.close}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="theme-secondary-text">S/R Zones:</span>
                  <button
                    type="button"
                    onClick={() => setShowSupportResistance((prev) => !prev)}
                    className="px-3 py-1 rounded-lg border theme-border text-xs font-bold text-emerald-500"
                  >
                    {showSupportResistance ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Real-Time Mathematical Ratios Breakdown */}
          {labMode === 'single' && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-xl theme-surface-subtle border theme-border">
                <span className="text-[10px] theme-muted-text block uppercase">Upper Wick</span>
                <span className="font-bold text-amber-500">{upperWickRatio}%</span>
                <span className="text-[10px] theme-muted-text block">₹{upperWickHeight}</span>
              </div>
              <div className="p-2.5 rounded-xl theme-surface-subtle border theme-border">
                <span className="text-[10px] theme-muted-text block uppercase">Body Spread</span>
                <span className="font-bold" style={{ color: candleColor }}>{bodyRatio}%</span>
                <span className="text-[10px] theme-muted-text block">₹{bodyHeightVal}</span>
              </div>
              <div className="p-2.5 rounded-xl theme-surface-subtle border theme-border">
                <span className="text-[10px] theme-muted-text block uppercase">Lower Wick</span>
                <span className="font-bold text-emerald-500">{lowerWickRatio}%</span>
                <span className="text-[10px] theme-muted-text block">₹{lowerWickHeight}</span>
              </div>
            </div>
          )}

          {/* Real-Time Behavioral Market Psychology Insight */}
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider font-mono">
              <Info className="w-4 h-4 shrink-0" />
              <span>Pattern Psychology Insight</span>
            </div>
            <p className="text-xs sm:text-sm theme-main-text leading-relaxed">
              {dynamicAnalysis.desc}
            </p>
            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs font-mono">
              <span className="theme-muted-text">Statistical Bias:</span>
              <span className="font-bold text-emerald-500">{dynamicAnalysis.bias}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
