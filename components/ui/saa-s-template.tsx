import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useInView,
  useScroll,
  useTransform,
} from "framer-motion";
import { APP_NAME, APP_TAGLINE } from "@/src/config/branding";
import { Footer } from "./footer-section";

// Shared premium easing curve: cubic-bezier(0.22, 1, 0.36, 1)
const PREMIUM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Zero-layout-shift Typewriter component with natural blinking cursor that fades after completion
interface TypewriterTextProps {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  triggerOnView?: boolean;
  className?: string;
  cursorClassName?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speedMs = 42,
  startDelayMs = 0,
  triggerOnView = false,
  className = "",
  cursorClassName = "bg-emerald-400",
}) => {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.4 });
  const shouldStart = triggerOnView ? isInView : true;

  const [displayedCount, setDisplayedCount] = useState<number>(
    shouldReduceMotion ? text.length : 0
  );
  const [cursorVisible, setCursorVisible] = useState<boolean>(!shouldReduceMotion);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedCount(text.length);
      setCursorVisible(false);
      return;
    }
    if (!shouldStart) return;

    setDisplayedCount(0);
    setCursorVisible(true);

    let currentIdx = 0;
    let intervalId: number | undefined;
    let fadeTimeoutId: number | undefined;

    const startTimeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        currentIdx += 1;
        setDisplayedCount(currentIdx);
        if (currentIdx >= text.length) {
          if (intervalId) window.clearInterval(intervalId);
          fadeTimeoutId = window.setTimeout(() => {
            setCursorVisible(false);
          }, 950);
        }
      }, speedMs);
    }, startDelayMs);

    return () => {
      window.clearTimeout(startTimeoutId);
      if (intervalId) window.clearInterval(intervalId);
      if (fadeTimeoutId) window.clearTimeout(fadeTimeoutId);
    };
  }, [text, speedMs, startDelayMs, shouldStart, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const visibleSlice = text.slice(0, displayedCount);

  return (
    <span ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Invisible placeholder reserves exact width & height so zero layout shift occurs */}
      <span className="invisible select-none" aria-hidden="true">
        {text}
      </span>
      <span className="absolute inset-0">
        {visibleSlice}
        <span
          aria-hidden="true"
          className={`inline-block w-[1.5px] h-[0.95em] align-middle ml-0.5 transition-opacity duration-500 ${cursorClassName} ${
            cursorVisible ? "opacity-90 animate-pulse" : "opacity-0"
          }`}
        />
      </span>
    </span>
  );
};

// Viewport-triggered numeric count-up for real existing statistics (zero layout shift)
interface CountUpNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}

const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  prefix = "",
  suffix = "",
  durationMs = 900,
  className = "",
}) => {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [displayValue, setDisplayValue] = useState<number>(value);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    if (!isInView) return;

    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      let rafId: number;
      const startTime = performance.now();
      const startVal = Math.max(0, Math.round(value * 0.2));

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startVal + (value - startVal) * eased);
        setDisplayValue(current);
        if (progress < 1) {
          rafId = window.requestAnimationFrame(step);
        } else {
          setDisplayValue(value);
        }
      };

      rafId = window.requestAnimationFrame(step);
      return () => window.cancelAnimationFrame(rafId);
    } else {
      setDisplayValue(value);
    }
  }, [value, isInView, durationMs, shouldReduceMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
};

// Reusable Button Component matching the 21st.dev template design language
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "gradient" | "outline";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
    const baseStyles =
      "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none interactive-btn";

    const variants = {
      default: "bg-[#0D6847] text-white hover:bg-[#095237] dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-sm font-semibold",
      secondary: "bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800 dark:border-gray-800",
      ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-gray-900/60 dark:text-gray-300 dark:hover:text-white",
      gradient: "bg-gradient-to-b from-[#0D6847] to-[#095237] text-white dark:from-white dark:via-white/95 dark:to-white/70 dark:text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg font-semibold",
      outline: "border border-slate-300 dark:border-gray-800 bg-transparent text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-900/40",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-9 px-3.5 text-xs font-medium",
      lg: "h-12 px-7 text-base font-semibold",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// Clean, lightweight SVG Icons
export const ArrowRight = ({ className = "", size = 16 }: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-200 ease-out group-hover:translate-x-1 ${className}`}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const Menu = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

export const X = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const CheckIcon = ({ className = "", size = 16 }: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export interface NavigationProps {
  onSignIn?: () => void;
  onSignUp?: () => void;
  onExploreApp?: () => void;
}

// Navigation Bar
export const Navigation = React.memo<NavigationProps>(({ onSignIn, onSignUp, onExploreApp }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: PREMIUM_EASE }}
      className="fixed top-0 w-full z-50 border-b border-slate-200/80 dark:border-gray-800/60 bg-white/85 dark:bg-black/80 backdrop-blur-md"
    >
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#095237] via-[#0D6847] to-emerald-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-emerald-600/20">
              TQ
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">{APP_NAME}</div>
              <div className="text-[10px] text-slate-500 dark:text-gray-400 hidden sm:block tracking-wide mt-0.5">{APP_TAGLINE}</div>
            </div>
          </div>

          {/* High-level links */}
          <div className="hidden lg:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <a
              href="#learn"
              onClick={(e) => scrollToSection(e, "learn")}
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-400 hover:text-[#0D6847] dark:hover:text-white transition-colors"
            >
              Learn
            </a>
            <a
              href="#practice"
              onClick={(e) => scrollToSection(e, "practice")}
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-400 hover:text-[#0D6847] dark:hover:text-white transition-colors"
            >
              Practice Lab
            </a>
            <a
              href="#challenges"
              onClick={(e) => scrollToSection(e, "challenges")}
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-400 hover:text-[#0D6847] dark:hover:text-white transition-colors"
            >
              Challenges
            </a>
            <a
              href="#mentor"
              onClick={(e) => scrollToSection(e, "mentor")}
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-400 hover:text-[#0D6847] dark:hover:text-white transition-colors"
            >
              AI Mentor
            </a>
            <a
              href="#streaks"
              onClick={(e) => scrollToSection(e, "streaks")}
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-400 hover:text-[#0D6847] dark:hover:text-white transition-colors"
            >
              Streaks
            </a>
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSignIn}
            >
              Sign in
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onSignUp || onSignIn}
            >
              Start Learning
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white p-1.5 hover:bg-slate-100 dark:hover:bg-gray-900 rounded-lg transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: PREMIUM_EASE }}
            className="md:hidden bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-slate-200 dark:border-gray-800/60"
          >
            <div className="px-6 py-5 flex flex-col gap-3">
              <a
                href="#learn"
                className="text-sm text-slate-700 dark:text-gray-300 hover:text-[#0D6847] dark:hover:text-white transition-colors py-1.5"
                onClick={(e) => scrollToSection(e, "learn")}
              >
                Learn the Market
              </a>
              <a
                href="#practice"
                className="text-sm text-slate-700 dark:text-gray-300 hover:text-[#0D6847] dark:hover:text-white transition-colors py-1.5"
                onClick={(e) => scrollToSection(e, "practice")}
              >
                Practice Without Risk
              </a>
              <a
                href="#challenges"
                className="text-sm text-slate-700 dark:text-gray-300 hover:text-[#0D6847] dark:hover:text-white transition-colors py-1.5"
                onClick={(e) => scrollToSection(e, "challenges")}
              >
                Interactive Challenges
              </a>
              <a
                href="#mentor"
                className="text-sm text-slate-700 dark:text-gray-300 hover:text-[#0D6847] dark:hover:text-white transition-colors py-1.5"
                onClick={(e) => scrollToSection(e, "mentor")}
              >
                AI Mentor
              </a>
              <a
                href="#streaks"
                className="text-sm text-slate-700 dark:text-gray-300 hover:text-[#0D6847] dark:hover:text-white transition-colors py-1.5"
                onClick={(e) => scrollToSection(e, "streaks")}
              >
                Track Your Progress
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 dark:border-gray-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignIn?.();
                  }}
                  className="w-full justify-center"
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    (onSignUp || onSignIn)?.();
                  }}
                  className="w-full justify-center"
                >
                  Start Learning
                </Button>
                {onExploreApp && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onExploreApp();
                    }}
                    className="w-full justify-center text-blue-400 border-blue-900/50"
                  >
                    Explore Demo Platform &rarr;
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
});

Navigation.displayName = "Navigation";

export interface HeroProps {
  onGetStarted?: () => void;
  onExploreApp?: () => void;
}

// 1. HERO - Minimal, curious, highly visual
export const Hero = React.memo<HeroProps>(({ onGetStarted }) => {
  const [activeInteractivePill, setActiveInteractivePill] = useState<number>(0);
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);

  // Restrained scroll-linked depth for decorative glow & simulator frame (does not alter native scroll)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : 24]);
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : -10]);

  const heroPills = [
    { label: "Understand Basics", hint: "Demystify terminology & price movement" },
    { label: "Practice Paper Trades", hint: "₹1,00,000 risk-free virtual simulator" },
    { label: "Master Psychology", hint: "Overcome FOMO & emotional traps" },
  ];

  const scrollToLearn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    document.getElementById("learn")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={heroRef}
      className="relative flex flex-col items-center justify-start px-6 pt-32 pb-14 md:pt-40 md:pb-20 overflow-hidden"
    >
      {/* 1. Pill Badge (Eyebrow) with Typewriter phrase */}
      <motion.aside
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.06, ease: PREMIUM_EASE }}
        className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-gray-800 bg-emerald-50/90 dark:bg-gray-900/80 backdrop-blur-sm"
      >
        <span className="w-2 h-2 rounded-full bg-[#0D6847] dark:bg-emerald-500 animate-pulse"></span>
        <TypewriterText
          text="Zero real money required • Built for beginners"
          speedMs={36}
          startDelayMs={220}
          className="text-xs text-[#0D6847] dark:text-gray-300 font-semibold"
        />
      </motion.aside>

      {/* 2. Main Heading — Line-by-line masked upward reveal */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-center max-w-4xl px-4 leading-[1.08] mb-5 tracking-tight text-slate-900 dark:text-white">
        <span className="block overflow-hidden pb-1">
          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, y: "85%" }}
            animate={{ opacity: 1, y: "0%" }}
            transition={{ duration: 0.65, delay: 0.14, ease: PREMIUM_EASE }}
            className="block"
          >
            Learn the market
          </motion.span>
        </span>
        <span className="block overflow-hidden pb-1.5">
          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, y: "85%" }}
            animate={{ opacity: 1, y: "0%" }}
            transition={{ duration: 0.65, delay: 0.24, ease: PREMIUM_EASE }}
            className="block bg-gradient-to-r from-[#0D6847] via-emerald-600 to-teal-600 dark:from-emerald-500 dark:via-emerald-400 dark:to-emerald-500 bg-clip-text text-transparent"
          >
            before you risk your money.
          </motion.span>
        </span>
      </h1>

      {/* 3. Short Subtitle */}
      <motion.p
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.34, ease: PREMIUM_EASE }}
        className="text-base sm:text-lg text-center max-w-xl px-4 mb-8 text-slate-600 dark:text-gray-400 leading-relaxed"
      >
        Understand how stocks actually move, practice decisions with virtual cash,
        and build real confidence before investing a single rupee.
      </motion.p>

      {/* 4. Primary & Secondary CTAs */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.42, ease: PREMIUM_EASE }}
        className="flex flex-wrap items-center justify-center gap-3.5 relative z-10 mb-12"
      >
        <Button
          type="button"
          variant="gradient"
          size="lg"
          className="rounded-xl shadow-xl font-semibold cursor-pointer text-white dark:text-black"
          onClick={onGetStarted}
        >
          Start Learning
          <ArrowRight size={16} />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="rounded-xl cursor-pointer"
          onClick={scrollToLearn}
        >
          Explore the Journey
        </Button>
      </motion.div>

      {/* 5. Interactive Micro-Preview Mockup Frame */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.5, ease: PREMIUM_EASE }}
        style={{ y: mockupY }}
        className="w-full max-w-4xl relative"
      >
        <motion.div
          style={{ y: glowY }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-52 bg-emerald-500/10 blur-[100px] pointer-events-none -z-10 rounded-full"
        />

        <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/90 shadow-xl dark:shadow-2xl p-4 sm:p-6 backdrop-blur-md transition-colors duration-300 hover:border-emerald-500/40 dark:hover:border-gray-700/90">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200 dark:border-gray-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
              <span className="ml-2 font-mono text-slate-500 dark:text-gray-400 hidden sm:inline">{APP_NAME} &bull; Interactive Simulator</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 font-semibold">
                <CountUpNumber value={100000} prefix="₹" suffix=" Virtual Balance" durationMs={950} />
              </span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 text-[#0D6847] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 font-semibold">
                Risk-Free
              </span>
            </div>
          </div>

          {/* Interactive Toggle Showcase */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {heroPills.map((pill, idx) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => setActiveInteractivePill(idx)}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeInteractivePill === idx
                    ? "bg-[#0D6847] text-white dark:bg-white dark:text-black font-semibold shadow-sm scale-[1.02]"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-white dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-gray-800/90 bg-slate-50/90 dark:bg-black/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroPills[activeInteractivePill].label}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: PREMIUM_EASE }}
              >
                <div className="text-xs font-mono font-bold text-[#0D6847] dark:text-blue-400 uppercase tracking-wider mb-1">
                  Live Module Preview
                </div>
                <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  {heroPills[activeInteractivePill].label}
                </div>
                <div className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
                  <TypewriterText
                    key={heroPills[activeInteractivePill].hint}
                    text={heroPills[activeInteractivePill].hint}
                    speedMs={35}
                    startDelayMs={60}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
            <button
              type="button"
              onClick={onGetStarted}
              className="group text-xs px-4 py-2 rounded-lg bg-[#0D6847] hover:bg-[#095237] text-white dark:bg-gray-900 dark:hover:bg-gray-800 font-semibold border border-transparent dark:border-gray-700/80 dark:hover:border-emerald-500/40 cursor-pointer shrink-0 transition-all duration-200 flex items-center gap-1.5 interactive-btn"
            >
              <span>Try it in the app</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
});

Hero.displayName = "Hero";

// 2. HIGH-LEVEL PROGRESSION (Curriculum teasing, NOT exposing full lesson breakdown)
export const HighLevelProgressionSection = React.memo(() => {
  const shouldReduceMotion = useReducedMotion();
  const steps = [
    {
      title: "Basics",
      tag: "Foundations",
      desc: "Understand what stocks actually are and how markets find prices.",
      icon: "🌱",
    },
    {
      title: "Analysis",
      tag: "Evaluation",
      desc: "Learn how companies create value and how to read market charts.",
      icon: "🔍",
    },
    {
      title: "Practice",
      tag: "₹1,00,000 Simulator",
      desc: "Execute simulated orders without risking your hard-earned money.",
      icon: "🧪",
    },
    {
      title: "Confidence",
      tag: "Discipline",
      desc: "Master risk management, stop-losses, and trading psychology.",
      icon: "🛡️",
    },
  ];

  return (
    <section id="learn" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-gray-900">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: PREMIUM_EASE }}
        className="text-center max-w-2xl mx-auto mb-10"
      >
        <span className="text-xs uppercase tracking-widest text-[#0D6847] dark:text-emerald-500 font-bold font-mono block mb-2">
          The Journey
        </span>
        <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">
          Basics &rarr; Analysis &rarr; Practice &rarr; Confidence
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-sm">
          A calm, guided path designed to take you from total novice to clear-headed thinker.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((st, i) => (
          <motion.div
            key={st.title}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.55,
              delay: shouldReduceMotion ? 0 : i * 0.075,
              ease: PREMIUM_EASE,
            }}
            className="group interactive-card rounded-2xl border border-slate-200 dark:border-gray-800/80 bg-white dark:bg-gray-950/60 p-5 flex flex-col justify-between hover:border-[#0D6847]/50 dark:hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono">
                <span className="text-2xl transition-transform duration-200 group-hover:scale-105">{st.icon}</span>
                <span className="text-slate-400 dark:text-gray-500 font-semibold group-hover:text-[#0D6847] dark:group-hover:text-emerald-400 transition-colors">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{st.title}</h3>
              <span className="text-[11px] font-mono font-semibold text-[#0D6847] dark:text-emerald-500 block mb-2">{st.tag}</span>
              <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">{st.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-900/80 text-[11px] text-slate-500 group-hover:text-slate-800 dark:group-hover:text-gray-300 font-mono flex items-center justify-between transition-colors">
              <span>Step {i + 1} of 4</span>
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#0D6847] dark:group-hover:text-emerald-400">&rarr;</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
});

HighLevelProgressionSection.displayName = "HighLevelProgressionSection";

// 3. PRACTICE WITHOUT RISK - Interactive simulated order slip
export const PracticeLabSection = React.memo<{ onGetStarted?: () => void }>(({ onGetStarted }) => {
  const [sharesCount, setSharesCount] = useState<number>(10);
  const shouldReduceMotion = useReducedMotion();
  const sharePrice = 2420;
  const totalCost = sharesCount * sharePrice;

  const featureBullets = [
    "Zero real financial risk",
    "Practice stop-loss & risk management rules",
    "Integrated trade journal to record your thinking",
  ];

  return (
    <section id="practice" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-gray-900">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.65, ease: PREMIUM_EASE }}
        className="rounded-3xl border border-slate-200 dark:border-gray-800 bg-gradient-to-b from-white to-slate-50 dark:from-gray-950 dark:to-black p-6 sm:p-10 relative overflow-hidden shadow-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs uppercase tracking-widest text-[#0D6847] dark:text-emerald-500 font-bold font-mono block">
              Paper Trading Lab
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight leading-snug">
              Practice market decisions with{" "}
              <span className="text-[#0D6847] dark:text-emerald-500 font-bold">
                <CountUpNumber value={100000} prefix="₹" suffix=" virtual money." durationMs={950} />
              </span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
              Every learner gets a risk-free ₹1,00,000 balance to test trade setups, stop-loss orders,
              and position sizing without losing actual savings.
            </p>

            <div className="space-y-2 pt-1">
              {featureBullets.map((item, idx) => (
                <motion.div
                  key={item}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion ? 0 : 0.12 + idx * 0.07,
                    ease: PREMIUM_EASE,
                  }}
                  className="flex items-center gap-2 text-xs text-slate-700 dark:text-gray-300"
                >
                  <CheckIcon size={14} className="text-[#0D6847] dark:text-emerald-500" />
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="gradient"
                size="default"
                onClick={onGetStarted}
                className="cursor-pointer font-semibold"
              >
                Open Virtual Simulator
              </Button>
            </div>
          </div>

          {/* Interactive Calculator Card */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, delay: 0.12, ease: PREMIUM_EASE }}
            className="lg:col-span-6"
          >
            <div className="interactive-card rounded-2xl border border-slate-200 dark:border-gray-800 hover:border-[#0D6847]/40 dark:hover:border-emerald-500/35 bg-white dark:bg-black/80 p-5 sm:p-6 shadow-md dark:shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-gray-800/80">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase">Interactive Order Slip</span>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">NOVA Dynamics &bull; ₹{sharePrice}</div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#0D6847] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                    Simulator Mode
                  </span>
                </div>
              </div>

              {/* Slider / Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-gray-400">Quantity</span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">{sharesCount} Shares</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={sharesCount}
                  onChange={(e) => setSharesCount(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#0D6847] dark:accent-white"
                />

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 dark:text-gray-400">Total Simulated Cost:</span>
                  <span className="text-slate-900 dark:text-white font-bold text-sm">
                    <CountUpNumber value={totalCost} prefix="₹" durationMs={750} />
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-gray-500 font-mono text-center">
                * Simulated price. No real funds ever exchanged.
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
});

PracticeLabSection.displayName = "PracticeLabSection";

// 4. INTERACTIVE CHALLENGES - Quizzes & Scenarios teaser
export const InteractiveChallengesSection = React.memo(() => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="challenges" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-gray-900">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: PREMIUM_EASE }}
        className="text-center max-w-xl mx-auto mb-8"
      >
        <span className="text-xs uppercase tracking-widest text-[#0D6847] dark:text-emerald-500 font-bold font-mono block mb-2">
          Hands-on Lab
        </span>
        <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">
          <span className="text-[#0D6847] dark:text-emerald-500 font-semibold">Active Challenges</span>, Not Reading Textbooks
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-sm">
          Test your decision-making in real-world scenarios.
        </p>
      </motion.div>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6, delay: 0.08, ease: PREMIUM_EASE }}
        className="interactive-card max-w-2xl mx-auto rounded-2xl border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 bg-white dark:bg-gray-950/70 p-5 sm:p-7 space-y-4 shadow-sm"
      >
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-gray-400 pb-2 border-b border-slate-200 dark:border-gray-800">
          <span className="text-[#0D6847] dark:text-emerald-500 font-semibold">Quick Concept Check</span>
          <span>Click an option to test</span>
        </div>

        <h4 className="text-base font-medium text-slate-900 dark:text-white">
          If your bank gives 4% interest, but inflation is 6%, what happens to your purchasing power?
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedAnswer(0)}
            className={`interactive-quiz-option p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              selectedAnswer === 0
                ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-[#B82E3B] dark:text-rose-200 font-medium"
                : "border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-black/40 text-slate-700 dark:text-gray-300 hover:border-slate-300 dark:hover:border-gray-700"
            }`}
          >
            A) It grows by 2%
          </button>
          <button
            type="button"
            onClick={() => setSelectedAnswer(1)}
            className={`interactive-quiz-option p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
              selectedAnswer === 1
                ? "border-[#0D6847] dark:border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/20 text-[#0D6847] dark:text-emerald-300 font-semibold"
                : "border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-black/40 text-slate-700 dark:text-gray-300 hover:border-slate-300 dark:hover:border-gray-700"
            }`}
          >
            B) It shrinks by ~2% in real terms &check;
          </button>
        </div>

        <AnimatePresence mode="wait">
          {selectedAnswer !== null && (
            <motion.div
              key={selectedAnswer}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: PREMIUM_EASE }}
              className="p-3 rounded-xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 text-xs text-slate-700 dark:text-gray-300 font-mono"
            >
              {selectedAnswer === 1
                ? "Correct! Real return = Nominal Return − Inflation. Cash loses purchasing power over time."
                : "Not quite. Inflation (6%) outpaces interest (4%), eroding your real purchasing power."}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
});

InteractiveChallengesSection.displayName = "InteractiveChallengesSection";

// 5. AI MENTOR - Plain english tutor
export const AIMentorSection = React.memo(() => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="mentor" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-gray-900">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: PREMIUM_EASE }}
          className="lg:col-span-6 space-y-4"
        >
          <span className="text-xs uppercase tracking-widest text-purple-700 dark:text-purple-400 font-bold font-mono block">
            Educational Companion
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight leading-snug">
            AI Mentor &bull; Simple everyday analogies.
          </h2>
          <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
            Confused by P/E ratios, order books, or stop-losses?
            Your educational tutor explains concepts in plain language without financial jargon or stock tips.
          </p>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950/70 text-xs text-slate-700 dark:text-gray-300 space-y-1 shadow-2xs">
            <span className="font-semibold text-slate-900 dark:text-white block">Strictly Educational</span>
            <span>Focuses purely on concept clarity. Never provides trading calls or price predictions.</span>
          </div>
        </motion.div>

        {/* Chat snippet */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, delay: 0.1, ease: PREMIUM_EASE }}
          className="lg:col-span-6"
        >
          <div className="interactive-card rounded-2xl border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 bg-white dark:bg-black/90 p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-gray-800 text-xs">
              <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-600/30 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-[10px]">
                AI
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">Market Mentor</span>
              <span className="text-[10px] text-slate-500 dark:text-gray-500 font-mono ml-auto">
                <TypewriterText
                  text="Analogy Mode"
                  speedMs={45}
                  startDelayMs={250}
                  triggerOnView
                  cursorClassName="bg-purple-500 dark:bg-purple-400"
                />
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: 0.14, ease: PREMIUM_EASE }}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-900 dark:text-gray-200 ml-auto max-w-[85%]"
              >
                How does a P/E ratio work?
              </motion.div>
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: 0.32, ease: PREMIUM_EASE }}
                className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 text-slate-800 dark:text-gray-300 max-w-[90%] leading-relaxed"
              >
                Think of buying a lemonade stand earning <strong>₹10,000/yr</strong>. If you pay <strong>₹1,00,000</strong> to buy it, your P/E ratio is <strong>10</strong> (Price &divide; Earnings).
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

AIMentorSection.displayName = "AIMentorSection";

// 6. PROGRESS & STREAKS - Habit & motivation
export const ProgressSection = React.memo(() => {
  const shouldReduceMotion = useReducedMotion();

  const cards = [
    {
      badge: "STREAKS",
      badgeClass: "text-amber-600 dark:text-amber-400",
      title: "Daily Habit",
      desc: "10 minutes a day to retain financial concepts and protect your focus.",
    },
    {
      badge: "LEVELS",
      badgeClass: "text-blue-600 dark:text-blue-400",
      title: "Milestones",
      desc: "Unlock achievements as your understanding matures from novice to analyst.",
    },
    {
      badge: "JOURNAL",
      badgeClass: "text-[#0D6847] dark:text-emerald-500",
      title: "Trade Discipline",
      desc: "Log your simulated trade rationale and review mistakes without stress.",
    },
  ];

  return (
    <section id="streaks" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-gray-900">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: PREMIUM_EASE }}
        className="text-center max-w-xl mx-auto mb-8"
      >
        <span className="text-xs uppercase tracking-widest text-[#0D6847] dark:text-emerald-500 font-bold font-mono block mb-2">
          Habit Tracking
        </span>
        <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">
          <span className="text-[#0D6847] dark:text-emerald-500 font-semibold">Consistent Learning</span> Beats Frantic Trading
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-sm">
          Build daily momentum with streak rewards, badges, and reflection journals.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.badge}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.55,
              delay: shouldReduceMotion ? 0 : i * 0.075,
              ease: PREMIUM_EASE,
            }}
            className="interactive-card rounded-2xl border border-slate-200 dark:border-gray-800 hover:border-[#0D6847]/40 dark:hover:border-emerald-500/40 bg-white dark:bg-gray-950/60 p-5 shadow-xs"
          >
            <div className={`${card.badgeClass} font-mono text-xs font-bold mb-1`}>{card.badge}</div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{card.title}</h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
});

ProgressSection.displayName = "ProgressSection";

// 7. FINAL CTA
export const FinalCTASection = React.memo<{ onGetStarted?: () => void; onExploreApp?: () => void }>(
  ({ onGetStarted, onExploreApp }) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200 dark:border-gray-900 text-center">
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-slate-900 dark:text-white">
            <span className="block overflow-hidden pb-1">
              <motion.span
                initial={shouldReduceMotion ? false : { opacity: 0, y: "80%" }}
                whileInView={{ opacity: 1, y: "0%" }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.6, ease: PREMIUM_EASE }}
                className="block"
              >
                Understand first.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-1.5">
              <motion.span
                initial={shouldReduceMotion ? false : { opacity: 0, y: "80%" }}
                whileInView={{ opacity: 1, y: "0%" }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.6, delay: 0.1, ease: PREMIUM_EASE }}
                className="block"
              >
                <span className="bg-gradient-to-r from-[#0D6847] via-emerald-600 to-teal-600 dark:from-emerald-500 dark:via-emerald-400 dark:to-emerald-500 bg-clip-text text-transparent">
                  Practice next.
                </span>{" "}
                Decide later.
              </motion.span>
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            <TypewriterText
              text="Your stock market learning journey starts with zero risk."
              speedMs={38}
              startDelayMs={200}
              triggerOnView
            />
          </p>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, delay: 0.22, ease: PREMIUM_EASE }}
            className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
          >
            <Button
              type="button"
              variant="gradient"
              size="lg"
              className="rounded-xl shadow-xl font-semibold text-white dark:text-black cursor-pointer"
              onClick={onGetStarted}
            >
              Start Learning Free
              <ArrowRight size={16} />
            </Button>
            {onExploreApp && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="rounded-xl cursor-pointer"
                onClick={onExploreApp}
              >
                Launch Demo
              </Button>
            )}
          </motion.div>
        </div>
      </section>
    );
  }
);

FinalCTASection.displayName = "FinalCTASection";

export interface SaaSTemplateProps {
  onSignIn?: () => void;
  onSignUp?: () => void;
  onGetStarted?: () => void;
  onExploreApp?: () => void;
}

// Complete Refined Landing Page
export default function Component({
  onSignIn,
  onSignUp,
  onGetStarted,
  onExploreApp,
}: SaaSTemplateProps = {}) {
  return (
    <main className="min-h-screen bg-[#F4F5F7] dark:bg-black text-slate-900 dark:text-white selection:bg-[#0D6847] selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Navigation onSignIn={onSignIn} onSignUp={onSignUp} onExploreApp={onExploreApp} />
      <Hero onGetStarted={onGetStarted} onExploreApp={onExploreApp} />
      <HighLevelProgressionSection />
      <PracticeLabSection onGetStarted={onGetStarted} />
      <InteractiveChallengesSection />
      <AIMentorSection />
      <ProgressSection />
      <FinalCTASection onGetStarted={onGetStarted} onExploreApp={onExploreApp} />

      {/* ShareMarket High-Fidelity Themed Footer */}
      <Footer
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onGetStarted={onGetStarted}
        onExploreApp={onExploreApp}
      />
    </main>
  );
}

export { Component as SaaSTemplate };
