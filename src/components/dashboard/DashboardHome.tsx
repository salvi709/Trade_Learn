import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Bot,
  Lock,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  Target,
  FileText,
  Layers,
  Search,
  Sparkles,
  BarChart3,
  Award,
  Zap,
  ChevronRight,
  HelpCircle,
  Activity,
  ArrowUpRight,
  Sliders,
  Crosshair,
  RotateCcw
} from 'lucide-react';
import { UserProfile, UserProgress, PaperPortfolio, Module, Lesson } from '../../types';
import { getModuleStatus, getNextRecommendedLesson } from '../../data/curriculumData';
import { FICTIONAL_STOCKS } from '../../data/marketData';
import { getAvatarById } from '../../config/avatars';
import { LockedModulePreview } from '../learning/LockedModulePreview';
import { MascotWelcomePopup } from './MascotWelcomePopup';

interface DashboardHomeProps {
  profile: UserProfile;
  progress: UserProgress;
  portfolio: PaperPortfolio;
  modules: Module[];
  onSelectLesson: (lesson: Lesson) => void;
  onNavigateTab: (tabId: string) => void;
  onOpenMentor: (prompt?: string) => void;
}

const PREMIUM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  profile,
  progress,
  portfolio,
  modules,
  onSelectLesson,
  onNavigateTab,
  onOpenMentor,
}) => {
  const [selectedLockedModule, setSelectedLockedModule] = useState<Module | null>(null);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('NOVA');
  const [chartTimeframe, setChartTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');
  const [chartVolatility, setChartVolatility] = useState<'normal' | 'high'>('normal');
  const [showTechnicalSR, setShowTechnicalSR] = useState<boolean>(true);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [isChartHovered, setIsChartHovered] = useState<boolean>(false);
  const [cursorCoord, setCursorCoord] = useState<{ x: number; y: number } | null>(null);
  const dashboardChartSvgRef = useRef<SVGSVGElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartDimensions, setChartDimensions] = useState<{ width: number; height: number }>({ width: 560, height: 180 });

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const el = chartContainerRef.current;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 50) {
        setChartDimensions({ width: Math.round(rect.width), height: Math.round(rect.height || 180) });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleResetChart = () => {
    setSelectedStockSymbol('NOVA');
    setChartTimeframe('1D');
    setChartVolatility('normal');
    setShowTechnicalSR(true);
    setHoveredPointIndex(null);
    setIsChartHovered(false);
  };

  const [challengeAnswer, setChallengeAnswer] = useState<number | null>(null);
  const [challengeSubmitted, setChallengeSubmitted] = useState<boolean>(false);
  const shouldReduceMotion = useReducedMotion();

  // Determine next recommended lesson from real progress
  const recommended = getNextRecommendedLesson(modules, progress.completedLessons);
  const currentModule =
    recommended?.module || modules.find((m) => m.id === progress.currentModuleId) || modules[0];
  const currentLesson = recommended?.lesson || currentModule?.lessons[0];

  const totalLessonsCount = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = progress.completedLessons.length;
  const progressPercent = Math.min(
    100,
    Math.round((completedCount / (totalLessonsCount || 1)) * 100)
  );

  const completedModulesCount = modules.filter(
    (m) => getModuleStatus(m, progress.completedLessons, progress.completedModules) === 'COMPLETED'
  ).length;

  const quizScoresList = Object.values(progress.quizScores || {});
  const averageQuizScore =
    quizScoresList.length > 0
      ? Math.round(quizScoresList.reduce((a, b) => a + b, 0) / quizScoresList.length)
      : 100;

  const avatar = getAvatarById(profile.avatarId);
  const streak = progress.currentStreak || progress.learningStreakDays || 1;
  const formattedVirtualCash = `₹${portfolio.virtualCash.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

  // Active stock for the simulated intraday preview chart
  const activeStock = FICTIONAL_STOCKS.find((s) => s.symbol === selectedStockSymbol) || FICTIONAL_STOCKS[0];

  // Daily Checkpoint Challenge Data
  const dailyChallenge = {
    question: "You want to buy 50 shares of NOVA only if the price pulls back to ₹720. What order type should you place?",
    options: [
      { text: "Market Order (executes immediately at current price)", correct: false },
      { text: "Limit Order at ₹720 (waits until price drops to ₹720)", correct: true },
      { text: "Stop-Loss Order at ₹800 (triggers on breakout)", correct: false }
    ],
    explanation: "A Limit Order guarantees your maximum execution price. Setting a Buy Limit at ₹720 means your order will only fill at ₹720 or lower!"
  };

  const handleChallengeSelect = (index: number) => {
    if (challengeSubmitted) return;
    setChallengeAnswer(index);
    setChallengeSubmitted(true);
  };

  // 4 Top Metric Cards (Fintech Reference 3 & 4)
  const metricCards = [
    {
      id: 'curriculum',
      label: 'CURRICULUM MASTERY',
      value: `${progressPercent}%`,
      trend: `${completedCount}/${totalLessonsCount} Lessons Done`,
      isPositive: true,
      sparkline: 'M0 24 Q 25 18, 50 12 T 100 4',
      sublabel: `Stage ${currentModule.levelNumber} Active`,
      onClick: () => onNavigateTab('roadmap'),
    },
    {
      id: 'equity',
      label: 'VIRTUAL EQUITY',
      value: formattedVirtualCash,
      trend: '100% Risk-Free Sandbox',
      isPositive: true,
      sparkline: 'M0 20 Q 25 15, 50 16 T 100 6',
      sublabel: `${Object.keys(portfolio.positions).length} Open Positions`,
      onClick: () => onNavigateTab('paper_trading'),
    },
    {
      id: 'streak',
      label: 'CONSISTENCY HABIT',
      value: `${streak} Days`,
      trend: streak >= 3 ? 'Top 10% Consistency' : 'Building Daily Habit',
      isPositive: true,
      sparkline: 'M0 22 Q 25 20, 50 14 T 100 8',
      sublabel: `${progress.longestStreak || Math.max(streak, 1)} Day Record`,
      icon: Flame,
      onClick: () => onNavigateTab('roadmap'),
    },
    {
      id: 'accuracy',
      label: 'DECISION ACCURACY',
      value: `${averageQuizScore}%`,
      trend: 'Quiz Checkpoint Score',
      isPositive: averageQuizScore >= 75,
      sparkline: 'M0 16 Q 25 22, 50 12 T 100 2',
      sublabel: `${quizScoresList.length} Quizzes Completed`,
      onClick: () => onNavigateTab('roadmap'),
    },
  ];

  // Core Tools for 2x2 grid
  const coreTools = [
    {
      id: 'paper_trading',
      icon: TrendingUp,
      title: 'Paper Trading Lab',
      description: `Simulate real trades with ${formattedVirtualCash} virtual cash.`,
      action: 'Open Lab',
      onClick: () => onNavigateTab('paper_trading'),
      badge: 'Live Simulator'
    },
    {
      id: 'mentor',
      icon: Bot,
      title: 'Market Mentor AI',
      description: 'Ask questions, decode terminology, and analyze charts.',
      action: 'Ask Question',
      onClick: () => onOpenMentor(),
      badge: 'Instant Tutor'
    },
    {
      id: 'journal',
      icon: FileText,
      title: 'Trading Journal',
      description: 'Record entry thesis, emotional state, and discipline rules.',
      action: 'Open Journal',
      onClick: () => onNavigateTab('journal'),
      badge: 'Discipline'
    },
    {
      id: 'stock_detective',
      icon: Search,
      title: 'Forensic Detective',
      description: 'Analyze balance sheet red flags and spot fraudulent traps.',
      action: 'Investigate',
      onClick: () => onNavigateTab('stock_detective'),
      badge: 'Forensics'
    },
  ];

  // Generate dynamic data series for the selected timeframe, stock, and volatility
  const dynamicChartData = useMemo(() => {
    const basePrices = activeStock.priceHistory.map((p) => p.price);
    const lastPrice = activeStock.currentPrice;
    const volFactor = chartVolatility === 'high' ? 1.9 : 1.0;

    if (chartTimeframe === '1D') {
      return activeStock.priceHistory.map((p) => {
        const diff = p.price - (basePrices[0] || lastPrice);
        return {
          label: p.time,
          price: Math.round(((basePrices[0] || lastPrice) + diff * volFactor) * 100) / 100,
        };
      });
    }

    if (chartTimeframe === '1W') {
      const days = ['Mon 9:15', 'Tue 12:00', 'Wed 14:30', 'Thu 11:15', 'Today Close'];
      const openRef = basePrices[0] || lastPrice * 0.98;
      const step = (lastPrice - openRef) / 4;
      return days.map((day, i) => ({
        label: day,
        price: Math.round((openRef + step * i + (Math.sin(i * 1.5) * lastPrice * 0.012 * volFactor)) * 100) / 100,
      }));
    }

    if (chartTimeframe === '1M') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'];
      const swingLow = activeStock.low52w ? activeStock.low52w + (lastPrice - activeStock.low52w) * 0.45 : lastPrice * 0.93;
      const step = (lastPrice - swingLow) / 4;
      return weeks.map((w, i) => ({
        label: w,
        price: Math.round((swingLow + step * i + (Math.cos(i) * lastPrice * 0.015 * volFactor)) * 100) / 100,
      }));
    }

    // 1Y Macro
    const months = ['Q1', 'Q2', 'Q3', 'Q4', 'Now'];
    const low = activeStock.low52w || lastPrice * 0.85;
    const high = activeStock.high52w || lastPrice * 1.15;
    return months.map((m, i) => {
      const ratio = i / (months.length - 1);
      const pr = low + (high - low) * (0.35 + 0.55 * ratio + 0.08 * Math.sin(i * 1.4) * volFactor);
      return {
        label: m,
        price: Math.round(pr * 100) / 100,
      };
    });
  }, [activeStock, chartTimeframe, chartVolatility]);

  const minPrice = Math.min(...dynamicChartData.map((p) => p.price));
  const maxPrice = Math.max(...dynamicChartData.map((p) => p.price));
  const priceRange = maxPrice - minPrice || 1;

  // Key Support & Resistance bounds
  const supportPrice = Math.round((minPrice * 0.996) * 100) / 100;
  const resistancePrice = Math.round((maxPrice * 1.004) * 100) / 100;

  // Real pixel-based dimensions (Guarantees zero oval distortion)
  const padX = 24;
  const padTop = 16;
  const padBottom = 22;
  const plotWidth = Math.max(chartDimensions.width - padX * 2, 80);
  const plotHeight = Math.max(chartDimensions.height - padTop - padBottom, 50);

  const chartPoints = dynamicChartData.map((p, i) => {
    const x = padX + (i / (dynamicChartData.length - 1 || 1)) * plotWidth;
    const y = padTop + plotHeight - ((p.price - minPrice) / priceRange) * plotHeight;
    return { x, y, price: p.price, time: p.label };
  });

  const pathD = chartPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${padX + plotWidth} ${chartDimensions.height - padBottom + 4} L ${padX} ${chartDimensions.height - padBottom + 4} Z`;

  const supportY = padTop + plotHeight - ((supportPrice - minPrice) / priceRange) * plotHeight;
  const resistanceY = padTop + plotHeight - ((resistancePrice - minPrice) / priceRange) * plotHeight;

  // Active displayed point: hovered point if user is scrubbing, or the latest point
  const activeDisplayPoint = (isChartHovered && hoveredPointIndex !== null && chartPoints[hoveredPointIndex])
    ? chartPoints[hoveredPointIndex]
    : chartPoints[chartPoints.length - 1];

  const firstPrice = dynamicChartData[0]?.price || activeStock.currentPrice;
  const displayPriceDiff = activeDisplayPoint ? activeDisplayPoint.price - firstPrice : activeStock.change;
  const displayPricePercent = firstPrice ? ((displayPriceDiff / firstPrice) * 100).toFixed(2) : activeStock.changePercent;

  // Pointer move handler in actual pixel coordinate space
  const handleChartPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dashboardChartSvgRef.current) return;
    const rect = dashboardChartSvgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const clampedX = Math.max(padX, Math.min(padX + plotWidth, clientX));
    const normalizedRatio = (clampedX - padX) / plotWidth;
    const closestIdx = Math.max(0, Math.min(chartPoints.length - 1, Math.round(normalizedRatio * (chartPoints.length - 1))));

    setHoveredPointIndex(closestIdx);
    setCursorCoord({ x: clampedX, y: clientY });
    setIsChartHovered(true);
  };

  const handleChartPointerLeave = () => {
    setIsChartHovered(false);
    setHoveredPointIndex(null);
    setCursorCoord(null);
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* =====================================================================
          HEADER BAR: EDITORIAL TITLE & LIVE STATUS
         ===================================================================== */}
      <div 
        data-tour="dashboard-welcome"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b theme-border pb-5"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#0D6847] dark:text-[#10B981] font-bold uppercase tracking-wider">
              WORKSPACE // INSTITUTIONAL LEARNING LAB
            </span>
            <span className="theme-muted-text">·</span>
            <span className="theme-muted-text">Stage {currentModule.levelNumber} Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading theme-main-text tracking-tight">
            Financial Command Center
          </h1>
          <p className="text-xs sm:text-sm theme-secondary-text max-w-2xl">
            Welcome back, <strong className="theme-main-text font-semibold">{profile.displayName || 'Learner'}</strong>. Master market mechanics, analyze corporate financials, and build risk-free confidence.
          </p>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border theme-border theme-surface-subtle text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="theme-secondary-text font-medium">Virtual Exchange Live</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('roadmap')}
            className="px-3 py-1.5 rounded-xl border theme-border theme-surface-subtle hover:theme-card text-xs font-mono font-semibold theme-main-text transition-colors cursor-pointer"
          >
            {completedModulesCount}/{modules.length} Stages Mastered
          </button>
        </div>
      </div>

      {/* =====================================================================
          SECTION 1 — TOP 4 FINTECH KPI CARDS (References 1, 3, 4)
         ===================================================================== */}
      <div 
        data-tour="dashboard-core-tools"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {metricCards.map((card, idx) => (
          <motion.div
            key={card.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05, ease: PREMIUM_EASE }}
            onClick={card.onClick}
            className="fintech-card p-5 cursor-pointer interactive-card transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono tracking-wider theme-muted-text font-semibold uppercase">
                {card.label}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 theme-muted-text group-hover:text-emerald-400 transition-colors" />
            </div>

            <div className="flex items-baseline justify-between gap-2 mb-2">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono theme-main-text tracking-tight">
                {card.value}
              </div>
              {/* Mini Sparkline SVG */}
              <div className="w-16 h-7 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 100 28" className="w-full h-full overflow-visible">
                  <path
                    d={card.sparkline}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-500 font-semibold">{card.trend}</span>
              <span className="theme-muted-text">{card.sublabel}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* =====================================================================
          SECTION 2 — HERO STAGE PROGRESSION BANNER (References 2 'LearnWell' & 4)
         ===================================================================== */}
      {currentLesson && (
        <motion.div
          data-tour="continue-learning"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: PREMIUM_EASE }}
          className="fintech-hero-card p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
        >
          {/* Left Column: Continue Learning CTA */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0D6847] dark:text-[#10B981] bg-[#0D6847]/10 dark:bg-[#10B981]/15 px-2.5 py-0.5 rounded-md border border-[#0D6847]/20">
                ACTIVE LESSON · STAGE {currentModule.levelNumber}
              </span>
              <span className="theme-muted-text">·</span>
              <span className="text-xs font-mono theme-muted-text flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {currentLesson.readTimeMinutes} min read
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black font-heading theme-main-text leading-tight tracking-tight">
                {currentLesson.title}
              </h2>
              <p className="text-xs sm:text-sm theme-secondary-text leading-relaxed mt-1.5 max-w-xl">
                {currentLesson.shortDesc}
              </p>
            </div>

            {currentLesson.eli15?.keyTakeaway && (
              <div className="theme-surface-subtle border theme-border rounded-xl p-3 text-xs theme-main-text leading-relaxed max-w-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-[11px] text-emerald-500">Key Rule:</strong>
                  {currentLesson.eli15.keyTakeaway}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-1">
              <button
                type="button"
                id="btn-continue-learning-cta"
                onClick={() => onSelectLesson(currentLesson)}
                className="px-6 py-3 bg-[#0D6847] text-white font-bold text-xs sm:text-sm rounded-xl shadow-[0_0_20px_-3px_rgba(13,104,71,0.5)] hover:bg-[#095237] transition-all flex items-center gap-2 cursor-pointer interactive-btn"
              >
                <span>Continue Lesson</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('roadmap')}
                className="text-xs font-semibold theme-secondary-text hover:theme-main-text transition-colors cursor-pointer"
              >
                View Full Roadmap →
              </button>
            </div>
          </div>

          {/* Right Column: 3 Stage Cards Preview (LearnWell Reference 2) */}
          <div 
            data-tour="dashboard-roadmap-matrix"
            className="lg:col-span-5 grid grid-cols-3 gap-3"
          >
            {modules.slice(0, 3).map((mod, idx) => {
              const status = getModuleStatus(mod, progress.completedLessons, progress.completedModules);
              const isCompleted = status === 'COMPLETED';
              const isInProgress = status === 'IN_PROGRESS';
              const isLocked = status === 'LOCKED';

              return (
                <div
                  key={mod.id}
                  onClick={() => {
                    if (isLocked) {
                      setSelectedLockedModule(mod);
                    } else {
                      const nextL = mod.lessons.find((l) => !progress.completedLessons.includes(l.id)) || mod.lessons[0];
                      onSelectLesson(nextL);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
                    isInProgress
                      ? 'theme-card border-emerald-500 ring-1 ring-emerald-500/30 shadow-xs'
                      : isCompleted
                      ? 'theme-card border-emerald-500/40 bg-emerald-500/5'
                      : 'theme-surface-subtle theme-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold theme-muted-text block">
                      0{idx + 1}
                    </span>
                    <h3 className="text-xs font-bold theme-main-text line-clamp-2 leading-tight">
                      {mod.title.split(':')[0] || mod.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t theme-border flex items-center justify-between text-[10px] font-mono">
                    {isCompleted ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    ) : isInProgress ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                      </span>
                    ) : (
                      <span className="theme-muted-text flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* =====================================================================
          SECTION 3 — TWO-COLUMN INTERACTIVE WORKSPACE (References 1 & 4)
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Simulated Market Pulse Chart + Daily Challenge */}
        <div className="lg:col-span-7 space-y-6">
          {/* Simulated Intraday Market Curve (Auto Trades Chart style) */}
          {/* Simulated Intraday Market Curve (Interactive Cursor-Reactive Chart) */}
          <div className="fintech-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b theme-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-base font-bold font-heading theme-main-text">
                    Simulated Market Pulse
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                    Live Reactive
                  </span>
                </div>
                <p className="text-xs theme-secondary-text mt-0.5">
                  Move cursor over chart curve to inspect crosshair prices & patterns.
                </p>
              </div>

              {/* Stock Selector & Timeframe Bar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Stock Selector Tabs */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl theme-surface-subtle border theme-border font-mono text-xs">
                  {FICTIONAL_STOCKS.slice(0, 3).map((stock) => (
                    <button
                      key={stock.symbol}
                      type="button"
                      onClick={() => setSelectedStockSymbol(stock.symbol)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                        selectedStockSymbol === stock.symbol
                          ? 'bg-[#0D6847] text-white shadow-xs'
                          : 'theme-secondary-text hover:theme-main-text'
                      }`}
                    >
                      {stock.symbol}
                    </button>
                  ))}
                </div>

                {/* Timeframe Selector Tabs */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-xl theme-surface-subtle border theme-border font-mono text-xs">
                  {(['1D', '1W', '1M', '1Y'] as Array<'1D' | '1W' | '1M' | '1Y'>).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setChartTimeframe(tf)}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-bold text-[11px] ${
                        chartTimeframe === tf
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'theme-secondary-text hover:theme-main-text'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* S/R Boundaries Toggle */}
                <button
                  type="button"
                  onClick={() => setShowTechnicalSR((prev) => !prev)}
                  className={`px-2 py-1 rounded-xl border text-[11px] font-mono font-medium flex items-center gap-1 transition-all cursor-pointer ${
                    showTechnicalSR
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                      : 'theme-border theme-surface-subtle theme-secondary-text'
                  }`}
                  title="Toggle Support & Resistance Boundary Lines"
                >
                  <Layers className="w-3 h-3" />
                  <span>S/R</span>
                </button>

                {/* Volatility Setting (Prompt Requirement 2) */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-xl theme-surface-subtle border theme-border font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setChartVolatility('normal')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                      chartVolatility === 'normal'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'theme-secondary-text hover:theme-main-text'
                    }`}
                    title="Normal Volatility"
                  >
                    1x
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartVolatility('high')}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                      chartVolatility === 'high'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'theme-secondary-text hover:theme-main-text'
                    }`}
                    title="High Volatility Shock"
                  >
                    2x Vol
                  </button>
                </div>

                {/* Working Chart Reset Button */}
                <button
                  type="button"
                  onClick={handleResetChart}
                  className="px-2 py-1 rounded-xl border theme-border theme-surface-subtle hover:theme-card theme-secondary-text hover:theme-main-text text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1"
                  title="Reset Chart Parameters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Price Quote Header with Live Scrub Indicator */}
            <div className="flex items-baseline justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono theme-main-text tracking-tight">
                    ₹{activeDisplayPoint.price.toFixed(2)}
                  </div>
                  {isChartHovered && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30 animate-in fade-in">
                      {activeDisplayPoint.time}
                    </span>
                  )}
                </div>
                <div className="text-xs theme-muted-text mt-0.5">
                  {activeStock.name} · P/E {activeStock.peRatio} · {chartTimeframe} Window
                </div>
              </div>

              <div className="text-right">
                <span className={`text-sm font-mono font-bold flex items-center justify-end gap-1 ${
                  displayPriceDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {displayPriceDiff >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {displayPriceDiff >= 0 ? '+' : ''}₹{displayPriceDiff.toFixed(2)} ({displayPricePercent}%)
                </span>
                <span className="text-[11px] font-mono theme-muted-text">
                  {isChartHovered ? 'Inspecting Coordinate' : `${chartTimeframe} Simulated`}
                </span>
              </div>
            </div>

            {/* Glowing SVG Area Chart with Crosshair & Cursor Movement (Phase 1 Isotropic Scaling & Perfect Circles) */}
            <div ref={chartContainerRef} className="w-full h-48 relative pt-2">
              <svg 
                ref={dashboardChartSvgRef}
                viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
                className="w-full h-full overflow-visible cursor-crosshair touch-none select-none"
                onPointerMove={handleChartPointerMove}
                onPointerLeave={handleChartPointerLeave}
                onPointerDown={handleChartPointerMove}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                  <filter id="dashPointGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#10B981" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* Optional Support & Resistance Technical Levels */}
                {showTechnicalSR && (
                  <g className="transition-opacity duration-200">
                    {/* Resistance Line */}
                    <line
                      x1={padX}
                      y1={resistanceY}
                      x2={padX + plotWidth}
                      y2={resistanceY}
                      stroke="#F43F5E"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                      opacity="0.65"
                    />
                    <text 
                      x={padX + plotWidth - 68} 
                      y={Math.max(14, resistanceY - 4)} 
                      fill="#F43F5E" 
                      fontSize="9" 
                      fontFamily="monospace" 
                      fontWeight="bold"
                    >
                      RES ₹{resistancePrice}
                    </text>

                    {/* Support Line */}
                    <line
                      x1={padX}
                      y1={supportY}
                      x2={padX + plotWidth}
                      y2={supportY}
                      stroke="#10B981"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                      opacity="0.65"
                    />
                    <text 
                      x={padX + plotWidth - 68} 
                      y={Math.min(chartDimensions.height - padBottom, supportY + 12)} 
                      fill="#10B981" 
                      fontSize="9" 
                      fontFamily="monospace" 
                      fontWeight="bold"
                    >
                      SUP ₹{supportPrice}
                    </text>
                  </g>
                )}

                {/* Area Gradient Fill */}
                <path d={areaD} fill="url(#chartGradient)" />

                {/* Main Glowing Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />

                {/* Regular Points along the curve - Guaranteed true circles */}
                {chartPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPointIndex === i ? 5.5 : 2.5}
                    fill={hoveredPointIndex === i ? '#FFFFFF' : '#10B981'}
                    stroke={hoveredPointIndex === i ? '#10B981' : '#FFFFFF'}
                    strokeWidth={hoveredPointIndex === i ? 2.5 : 1}
                    className="transition-all duration-150"
                  />
                ))}

                {/* Interactive Crosshair Tracking on Cursor Movement */}
                {isChartHovered && cursorCoord && activeDisplayPoint && (
                  <g className="pointer-events-none transition-opacity duration-150">
                    {/* Vertical Time Guideline */}
                    <line
                      x1={activeDisplayPoint.x}
                      y1={padTop}
                      x2={activeDisplayPoint.x}
                      y2={chartDimensions.height - padBottom}
                      stroke="#10B981"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.75"
                    />
                    {/* Horizontal Price Guideline */}
                    <line
                      x1={padX}
                      y1={activeDisplayPoint.y}
                      x2={padX + plotWidth}
                      y2={activeDisplayPoint.y}
                      stroke="#10B981"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.75"
                    />
                    {/* Active Highlighted Pulse Marker - Guaranteed true circle */}
                    <circle
                      cx={activeDisplayPoint.x}
                      cy={activeDisplayPoint.y}
                      r={6.5}
                      fill="#10B981"
                      stroke="#FFFFFF"
                      strokeWidth={2.5}
                      style={{ filter: 'url(#dashPointGlow)' }}
                    />
                  </g>
                )}
              </svg>

              {/* Time Axis Labels Synchronized with dynamic data */}
              <div className="flex justify-between items-center text-[10px] font-mono theme-muted-text pt-2 border-t theme-border mt-1">
                {dynamicChartData.map((pt, idx) => (
                  <span 
                    key={idx}
                    className={hoveredPointIndex === idx ? 'text-emerald-500 font-bold' : undefined}
                  >
                    {pt.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Direct Action Link to Paper Trading */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs theme-secondary-text">
                Explore order execution & risk management on this security:
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('paper_trading')}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <span>Trade in Paper Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Daily Market Mastery Challenge */}
          <div className="fintech-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold font-heading theme-main-text">
                  Daily Market Checkpoint Challenge
                </h3>
              </div>
              <span className="text-[11px] font-mono theme-muted-text">+50 XP Practice</span>
            </div>

            <p className="text-xs sm:text-sm theme-main-text font-medium leading-relaxed">
              {dailyChallenge.question}
            </p>

            <div className="space-y-2">
              {dailyChallenge.options.map((option, idx) => {
                const isSelected = challengeAnswer === idx;
                let optionStyle = 'theme-surface-subtle theme-border hover:border-emerald-500/50';

                if (challengeSubmitted) {
                  if (option.correct) {
                    optionStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-semibold';
                  } else if (isSelected && !option.correct) {
                    optionStyle = 'bg-rose-500/10 border-rose-500 text-rose-500 font-semibold';
                  } else {
                    optionStyle = 'theme-surface-subtle opacity-50';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-emerald-500 bg-emerald-500/10';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChallengeSelect(idx)}
                    disabled={challengeSubmitted}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                  >
                    <span>{option.text}</span>
                    {challengeSubmitted && option.correct && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {challengeSubmitted && (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs theme-secondary-text leading-relaxed animate-in fade-in duration-200">
                <strong className="text-emerald-500 font-bold block mb-0.5">Analyst Insight:</strong>
                {dailyChallenge.explanation}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): AI Mentor Entry + Shortcuts & Milestones */}
        <div className="lg:col-span-5 space-y-6">
          {/* Compact AI Mentor Dashboard Entry Point (Prompt Requirement 3) */}
          <div 
            data-tour="dashboard-ai-companion"
            className="fintech-card p-5 border border-emerald-500/25 bg-gradient-to-br from-[#0D6847]/10 via-emerald-500/5 to-transparent relative overflow-hidden transition-all duration-300 hover:border-emerald-500/40 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0D6847] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Bot className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-heading theme-main-text">
                      Your AI Learning Companion
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                      24/7 AI
                    </span>
                  </div>
                  <p className="text-xs theme-secondary-text leading-relaxed">
                    Have a question about the market? Learn concepts and understand charts with your AI Mentor.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t theme-border flex items-center justify-between">
              <span className="text-[11px] font-mono theme-muted-text flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero jargon · Instant explanations</span>
              </span>
              <button
                type="button"
                onClick={() => onOpenMentor()}
                className="px-3.5 py-1.5 rounded-xl bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
              >
                <span>Ask AI Mentor</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Workspace Shortcuts Grid */}
          <div className="fintech-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold font-heading theme-main-text">
                  Workspace Shortcuts
                </h3>
              </div>
              <span className="text-[11px] font-mono theme-muted-text">Instant Tools</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coreTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.id}
                    onClick={tool.onClick}
                    className="p-3.5 rounded-xl border theme-border theme-surface-subtle hover:theme-card hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0D6847]/10 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold theme-main-text">{tool.title}</h4>
                      <p className="text-[11px] theme-secondary-text leading-tight line-clamp-2">
                        {tool.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-emerald-500 pt-1 border-t theme-border">
                      <span>{tool.action}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Curriculum Milestones Progression Box */}
          <div className="fintech-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold font-heading theme-main-text">
                  Curriculum Milestones
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('roadmap')}
                className="text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
              >
                All Stages →
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="theme-secondary-text">Overall Roadmap Completion</span>
                <span className="font-bold theme-main-text">{progressPercent}%</span>
              </div>

              <div className="w-full theme-surface-subtle h-2.5 rounded-full overflow-hidden border theme-border">
                <div
                  className="bg-[#0D6847] h-full rounded-full transition-all duration-500 shadow-[0_0_10px_#10B981]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl theme-surface-subtle border theme-border">
                  <span className="text-[10px] theme-muted-text uppercase block">Completed</span>
                  <span className="font-bold theme-main-text text-sm">
                    {completedModulesCount} of {modules.length} Stages
                  </span>
                </div>
                <div className="p-2.5 rounded-xl theme-surface-subtle border theme-border">
                  <span className="text-[10px] theme-muted-text uppercase block">Quiz Accuracy</span>
                  <span className="font-bold text-emerald-500 text-sm">
                    {averageQuizScore}% Average
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SAFETY & INTEGRITY FOOTER BANNER
         ===================================================================== */}
      <div className="theme-surface-subtle border theme-border rounded-2xl p-4 flex items-center gap-3 text-xs theme-secondary-text">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
        <div>
          <strong className="theme-main-text font-semibold">
            Educational Simulation Environment:
          </strong>{' '}
          All quotes, paper trading balances, and mentor responses are strictly designed for risk-free learning and conceptual mastery. No real money or real securities are transacted.
        </div>
      </div>

      {/* Interactive Mascot Pop-up (Dismissible, once per session) */}
      <MascotWelcomePopup
        displayName={profile.displayName || 'Learner'}
        currentStageTitle={`Stage ${currentModule.levelNumber}: ${currentModule.title}`}
        onOpenMentor={onOpenMentor}
      />

      {/* Locked Section Preview Modal */}
      {selectedLockedModule && (
        <LockedModulePreview
          module={selectedLockedModule}
          completedLessons={progress.completedLessons}
          completedModules={progress.completedModules}
          onClose={() => setSelectedLockedModule(null)}
          onNavigateToModule={() => {
            onNavigateTab('roadmap');
          }}
        />
      )}
    </div>
  );
};
