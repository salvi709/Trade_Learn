import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ShieldAlert, Award, AlertCircle } from 'lucide-react';

// Exact recommended Trading Chart Palettes
export const TRADING_CHART_GREENS = [
  '#0D6847', // 1. Primary Reference Green
  '#16845B', // 2. Medium Forest Green
  '#299C70', // 3. Vibrant Emerald Green
  '#72B99A', // 4. Soft Mint Green
];

export const TRADING_CHART_REDS = [
  '#B82E3B', // 1. Primary Bear Red
  '#D94B4B', // 2. Medium Coral Red
  '#E66B6B', // 3. Soft Rose Red
  '#F08A83', // 4. Warm Peach Red
];

// Balanced alternating Red & Green palette for adjacent segment differentiation
export const TRADING_BALANCED_PALETTE = [
  '#0D6847', // Green 1
  '#B82E3B', // Red 1
  '#299C70', // Green 2
  '#D94B4B', // Red 2
  '#16845B', // Green 3
  '#E66B6B', // Red 3
  '#72B99A', // Green 4
  '#F08A83', // Red 4
];

export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
  subLabel?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'bull' | 'bear';
  icon?: React.ComponentType<{ className?: string }>;
}

interface AdminDonutChartProps {
  title: string;
  subtitle?: string;
  data: DonutSlice[];
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

export const AdminDonutChart: React.FC<AdminDonutChartProps> = ({
  title,
  subtitle,
  data,
  centerLabel = 'Total',
  centerValue,
  className = '',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const slices = data.map((item, idx) => {
    const percent = item.value / total;
    const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
    const strokeDashoffset = -circumference * cumulativePercent;
    cumulativePercent += percent;

    // Pick explicit color or alternating red-green trading palette
    let assignedColor = item.color;
    if (!assignedColor) {
      if (item.sentiment === 'positive' || item.sentiment === 'bull') {
        assignedColor = TRADING_CHART_GREENS[idx % TRADING_CHART_GREENS.length];
      } else if (item.sentiment === 'negative' || item.sentiment === 'bear') {
        assignedColor = TRADING_CHART_REDS[idx % TRADING_CHART_REDS.length];
      } else {
        assignedColor = TRADING_BALANCED_PALETTE[idx % TRADING_BALANCED_PALETTE.length];
      }
    }

    return {
      ...item,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
      color: assignedColor,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className={`theme-card border theme-border rounded-xl p-5 space-y-4 shadow-xs ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="font-heading font-bold text-sm md:text-base theme-main-text">{title}</h4>
          {subtitle && <p className="text-xs theme-muted-text">{subtitle}</p>}
        </div>

        {/* Visual Accessibility Symbol Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono theme-muted-text">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#0D6847]" />
            <span>Green: Bullish / Complete</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#B82E3B]" />
            <span>Red: Bearish / Risk / Drop</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="fill-none stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="20"
            />
            {slices.map((slice, idx) => (
              <circle
                key={idx}
                cx="80"
                cy="80"
                r={radius}
                className="fill-none transition-all duration-300 cursor-pointer"
                stroke={slice.color}
                strokeWidth={hoveredIdx === idx ? 24 : 20}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="butt"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>

          {/* Center Info Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            <span className="text-[10px] theme-muted-text uppercase tracking-wider font-semibold truncate max-w-[100px]">
              {activeSlice ? activeSlice.label : centerLabel}
            </span>
            <span className="text-xl font-extrabold font-heading theme-main-text tabular-nums">
              {activeSlice ? `${activeSlice.percent}%` : centerValue ?? total}
            </span>
            {activeSlice && (
              <span className="text-[10px] font-mono font-bold" style={{ color: activeSlice.color }}>
                {activeSlice.value} records
              </span>
            )}
          </div>
        </div>

        {/* Legend with Accessible Status Identifiers */}
        <div className="flex-1 w-full space-y-1.5 text-xs max-h-52 overflow-y-auto pr-1">
          {slices.map((slice, idx) => {
            const isHovered = hoveredIdx === idx;
            const isGreenish = TRADING_CHART_GREENS.includes(slice.color) || slice.sentiment === 'positive' || slice.sentiment === 'bull';
            const isReddish = TRADING_CHART_REDS.includes(slice.color) || slice.sentiment === 'negative' || slice.sentiment === 'bear';

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer border border-transparent ${
                  isHovered ? 'theme-surface-subtle border-slate-300 dark:border-slate-700 shadow-2xs' : 'hover:theme-surface-subtle'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs border border-black/10"
                    style={{ backgroundColor: slice.color }}
                  />
                  {/* Accessibility marker: ▲ for growth/positive, ▼ for risk/negative */}
                  <span className="text-[10px] font-mono text-slate-400 shrink-0" title={isGreenish ? 'Bullish / Progression' : isReddish ? 'Risk / Drop' : 'Neutral'}>
                    {isGreenish ? '▲' : isReddish ? '▼' : '●'}
                  </span>
                  <span className="theme-main-text font-medium truncate max-w-[150px]">
                    {slice.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                  <span className="theme-muted-text">{slice.value}</span>
                  <span className="font-bold" style={{ color: slice.color }}>
                    {slice.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export interface BarItem {
  label: string;
  value: number;
  target?: number;
  format?: string;
  subText?: string;
  color?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface AdminBarChartProps {
  title: string;
  subtitle?: string;
  data: BarItem[];
  maxValue?: number;
  className?: string;
}

export const AdminBarChart: React.FC<AdminBarChartProps> = ({
  title,
  subtitle,
  data,
  maxValue,
  className = '',
}) => {
  const max = maxValue || Math.max(...data.map((d) => d.value), 100);

  return (
    <div className={`theme-card border theme-border rounded-xl p-5 space-y-4 shadow-xs ${className}`}>
      <div>
        <h4 className="font-heading font-bold text-sm md:text-base theme-main-text">{title}</h4>
        {subtitle && <p className="text-xs theme-muted-text">{subtitle}</p>}
      </div>

      <div className="space-y-3 pt-1">
        {data.map((item, idx) => {
          const percent = Math.min(100, Math.round((item.value / max) * 100));
          const isNegative = item.sentiment === 'negative';
          const barColor = item.color || (isNegative ? '#B82E3B' : '#0D6847');

          return (
            <div key={idx} className="space-y-1 group">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium theme-main-text truncate max-w-[220px]">
                  {item.label}
                </span>
                <div className="flex items-center gap-2.5 font-mono tabular-nums">
                  {item.subText && <span className="theme-muted-text text-[11px]">{item.subText}</span>}
                  <span className="font-bold" style={{ color: barColor }}>
                    {item.value}{item.format || ''}
                  </span>
                </div>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800/80 overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface LinePoint {
  date: string;
  greenMetric: number; // e.g. Inquiries / Successes
  redMetric: number;   // e.g. Drop-off / Risk flags / Incompletes
  greenLabel?: string;
  redLabel?: string;
}

interface AdminLineChartProps {
  title: string;
  subtitle?: string;
  data?: LinePoint[];
  className?: string;
}

export const AdminLineChart: React.FC<AdminLineChartProps> = ({
  title,
  subtitle,
  data,
  className = '',
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<LinePoint | null>(null);

  const points: LinePoint[] = data && data.length > 0 ? data : [
    { date: 'Mon', greenMetric: 142, redMetric: 28 },
    { date: 'Tue', greenMetric: 188, redMetric: 34 },
    { date: 'Wed', greenMetric: 215, redMetric: 39 },
    { date: 'Thu', greenMetric: 260, redMetric: 45 },
    { date: 'Fri', greenMetric: 240, redMetric: 42 },
    { date: 'Sat', greenMetric: 310, redMetric: 52 },
    { date: 'Sun', greenMetric: 348, redMetric: 58 },
  ];

  const maxVal = Math.max(...points.map((p) => Math.max(p.greenMetric, p.redMetric * 4)), 400);
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const getCoordinates = (val: number, idx: number) => {
    const x = paddingX + (idx / (points.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (val / maxVal) * (height - paddingY * 2);
    return { x, y };
  };

  const greenPoints = points.map((p, i) => getCoordinates(p.greenMetric, i));
  const redPoints = points.map((p, i) => getCoordinates(p.redMetric * 4, i)); // scaled for visual presence

  const greenPath = greenPoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );
  const greenArea = `${greenPath} L ${greenPoints[greenPoints.length - 1].x} ${height - paddingY} L ${greenPoints[0].x} ${height - paddingY} Z`;

  const redPath = redPoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  return (
    <div className={`theme-card border theme-border rounded-xl p-5 space-y-4 shadow-xs ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="font-heading font-bold text-sm md:text-base theme-main-text">{title}</h4>
          {subtitle && <p className="text-xs theme-muted-text">{subtitle}</p>}
        </div>

        {/* Trading-inspired Dual Green/Red Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D6847] dark:bg-emerald-400" />
            <span className="theme-muted-text">Active Progress (▲)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B82E3B] dark:bg-rose-400" />
            <span className="theme-muted-text">Risk / Drop-offs (▼)</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="tradingGreenArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0D6847" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0D6847" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            className="stroke-slate-200 dark:stroke-slate-800"
          />

          {/* Green Area & Line */}
          <path d={greenArea} fill="url(#tradingGreenArea)" />
          <path d={greenPath} fill="none" stroke="#0D6847" strokeWidth="2.5" strokeLinecap="round" className="dark:stroke-emerald-400" />

          {/* Red Risk/Drop-off Line */}
          <path d={redPath} fill="none" stroke="#B82E3B" strokeWidth="2" strokeDasharray="3 3" className="dark:stroke-rose-400" />

          {/* Point nodes & Tooltips */}
          {greenPoints.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint?.date === points[i].date ? 5 : 3.5}
                className="fill-[#0D6847] dark:fill-emerald-400 stroke-white dark:stroke-slate-900 transition-all cursor-pointer"
                strokeWidth="2"
                onMouseEnter={() => setHoveredPoint(points[i])}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <text
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-500 dark:fill-slate-400"
              >
                {points[i].date}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover info badge */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 p-2.5 rounded-xl theme-surface-subtle border theme-border text-xs font-mono shadow-md space-y-1">
            <div className="font-bold theme-main-text">{hoveredPoint.date}</div>
            <div className="text-[#0D6847] dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span>▲</span> {hoveredPoint.greenMetric} Active Learners
            </div>
            <div className="text-[#B82E3B] dark:text-rose-400 flex items-center gap-1">
              <span>▼</span> {hoveredPoint.redMetric} Risk & Drop-offs
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
