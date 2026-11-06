import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Compass,
  X,
  Sparkles,
} from 'lucide-react';
import { GUIDED_TOUR_STEPS, GuidedTourStep, TourPlacement } from '../../config/guidedTourSteps';
import { AppTheme } from '../../types';

interface InteractiveGuidedTourProps {
  isOpen: boolean;
  activeTab: string;
  onNavigateTab: (tabId: string) => void;
  onFinish: () => void;
  onSkip: () => void;
  onStepSidebarChange?: (isSidebarTarget: boolean) => void;
  activeTheme?: AppTheme;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

interface ComputedTooltipPosition {
  top: number;
  left: number;
  placement: TourPlacement | 'center';
  arrowLeft?: number;
  arrowTop?: number;
}

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_GAP = 16;
const VIEWPORT_MARGIN = 16;

export const InteractiveGuidedTour: React.FC<InteractiveGuidedTourProps> = ({
  isOpen,
  activeTab,
  onNavigateTab,
  onFinish,
  onSkip,
  onStepSidebarChange,
  activeTheme,
}) => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipSize, setTooltipSize] = useState<{ width: number; height: number }>({
    width: 360,
    height: 220,
  });
  const [isTransitioningRoute, setIsTransitioningRoute] = useState<boolean>(false);

  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const steps: GuidedTourStep[] = GUIDED_TOUR_STEPS;
  const currentStep = steps[stepIndex] || steps[0];
  const totalSteps = steps.length;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;
  const isDark = activeTheme === 'premium_emerald';

  // Reset to step 0 whenever tour is newly opened
  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
    } else if (onStepSidebarChange) {
      onStepSidebarChange(false);
    }
  }, [isOpen]);

  // Notify parent layout if mobile drawer needs to open for sidebar targets
  useEffect(() => {
    if (!isOpen || !onStepSidebarChange) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    onStepSidebarChange(Boolean(isMobile && currentStep?.isSidebarTarget));
  }, [isOpen, currentStep, onStepSidebarChange]);

  // Measure tooltip card dimensions whenever step changes
  useEffect(() => {
    if (!isOpen || !tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setTooltipSize({ width: rect.width, height: rect.height });
    }
  }, [isOpen, stepIndex, targetRect?.width]);

  // Function to locate target element and update its bounding rect
  const updateTargetRect = useCallback(
    (shouldScrollIntoView = false): boolean => {
      if (!isOpen || !currentStep) return false;
      const el = document.querySelector(currentStep.target) as HTMLElement | null;
      if (!el) {
        return false;
      }

      const rawRect = el.getBoundingClientRect();
      if (rawRect.width === 0 && rawRect.height === 0) {
        return false;
      }

      if (shouldScrollIntoView && !currentStep.isSidebarTarget) {
        const vh = window.innerHeight;
        const isOutOfComfortZone =
          rawRect.top < 84 ||
          rawRect.bottom > vh - 84 ||
          (rawRect.height < vh - 160 && (rawRect.top < 60 || rawRect.bottom > vh - 60));

        if (isOutOfComfortZone) {
          try {
            el.scrollIntoView({
              behavior: 'smooth',
              block: rawRect.height > vh * 0.7 ? 'start' : 'center',
              inline: 'nearest',
            });
          } catch {
            el.scrollIntoView();
          }
        }
      }

      const freshRect = el.getBoundingClientRect();
      setTargetRect({
        top: freshRect.top,
        left: freshRect.left,
        width: freshRect.width,
        height: freshRect.height,
        bottom: freshRect.bottom,
        right: freshRect.right,
      });
      return true;
    },
    [isOpen, currentStep]
  );

  // Synchronize route and locate target element when step changes
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 45; // ~750ms max search window while tab/drawer mounts

    // Ensure the correct route/tab is active
    if (activeTab !== currentStep.route) {
      setIsTransitioningRoute(true);
      onNavigateTab(currentStep.route);
    } else {
      setIsTransitioningRoute(false);
    }

    const locateAndTrack = () => {
      if (cancelled) return;
      const found = updateTargetRect(attempts === 0 || isTransitioningRoute);

      if (found) {
        setIsTransitioningRoute(false);
        // Keep tracking smoothly for ~450ms to follow smooth scrolling or mobile drawer slide
        let trackFrames = 0;
        const followScroll = () => {
          if (cancelled || trackFrames > 28) return;
          trackFrames += 1;
          updateTargetRect(false);
          rafRef.current = window.requestAnimationFrame(followScroll);
        };
        rafRef.current = window.requestAnimationFrame(followScroll);
      } else if (attempts < maxAttempts) {
        attempts += 1;
        rafRef.current = window.requestAnimationFrame(locateAndTrack);
      } else {
        // Fallback if target element is not visible on current screen size
        setTargetRect(null);
        setIsTransitioningRoute(false);
      }
    };

    rafRef.current = window.requestAnimationFrame(locateAndTrack);

    return () => {
      cancelled = true;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isOpen, stepIndex, currentStep, activeTab, onNavigateTab, updateTargetRect]);

  // Listen to window scroll & resize events to keep spotlight locked to element
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateTargetRect(false);
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updateTargetRect]);

  // Keyboard navigation support (ArrowRight, ArrowLeft, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (isLastStep) {
          onFinish();
        } else {
          setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isFirstStep) {
          setStepIndex((prev) => Math.max(0, prev - 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFirstStep, isLastStep, totalSteps, onFinish, onSkip]);

  if (!isOpen || !currentStep) return null;

  // Compute clamped spotlight cutout coordinates
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  const cutout = targetRect
    ? {
        top: Math.max(4, targetRect.top - SPOTLIGHT_PADDING),
        left: Math.max(4, targetRect.left - SPOTLIGHT_PADDING),
        width: Math.min(vw - 8, targetRect.width + SPOTLIGHT_PADDING * 2),
        height: Math.min(vh - 8, targetRect.height + SPOTLIGHT_PADDING * 2),
        bottom: Math.min(vh - 4, targetRect.bottom + SPOTLIGHT_PADDING),
        right: Math.min(vw - 4, targetRect.right + SPOTLIGHT_PADDING),
      }
    : null;

  // Compute smart viewport-aware tooltip position and directional pointer arrow
  const computeTooltipPosition = (): ComputedTooltipPosition => {
    const cardW = Math.min(tooltipSize.width || 360, vw - VIEWPORT_MARGIN * 2);
    const cardH = tooltipSize.height || 225;

    if (!cutout) {
      return {
        top: Math.max(VIEWPORT_MARGIN, (vh - cardH) / 2),
        left: Math.max(VIEWPORT_MARGIN, (vw - cardW) / 2),
        placement: 'center',
      };
    }

    const spaceBottom = vh - cutout.bottom - VIEWPORT_MARGIN;
    const spaceTop = cutout.top - VIEWPORT_MARGIN;
    const spaceRight = vw - cutout.right - VIEWPORT_MARGIN;
    const spaceLeft = cutout.left - VIEWPORT_MARGIN;

    const isMobileViewport = vw < 768;

    // Candidate order starting with preferredPlacement
    const candidates: TourPlacement[] = isMobileViewport
      ? ['bottom', 'top']
      : [
          currentStep.preferredPlacement,
          'bottom',
          'top',
          'right',
          'left',
        ].filter((v, idx, arr) => arr.indexOf(v) === idx) as TourPlacement[];

    let chosenPlacement: TourPlacement = currentStep.preferredPlacement;
    let foundFit = false;

    for (const candidate of candidates) {
      if (candidate === 'bottom' && spaceBottom >= cardH + TOOLTIP_GAP) {
        chosenPlacement = 'bottom';
        foundFit = true;
        break;
      }
      if (candidate === 'top' && spaceTop >= cardH + TOOLTIP_GAP) {
        chosenPlacement = 'top';
        foundFit = true;
        break;
      }
      if (candidate === 'right' && spaceRight >= cardW + TOOLTIP_GAP) {
        chosenPlacement = 'right';
        foundFit = true;
        break;
      }
      if (candidate === 'left' && spaceLeft >= cardW + TOOLTIP_GAP) {
        chosenPlacement = 'left';
        foundFit = true;
        break;
      }
    }

    // If no side has full room, pick the side with the greatest available space
    if (!foundFit) {
      if (isMobileViewport) {
        chosenPlacement = spaceBottom >= spaceTop ? 'bottom' : 'top';
      } else {
        const spaces: { side: TourPlacement; space: number }[] = [
          { side: 'bottom', space: spaceBottom },
          { side: 'top', space: spaceTop },
          { side: 'right', space: spaceRight },
          { side: 'left', space: spaceLeft },
        ];
        spaces.sort((a, b) => b.space - a.space);
        chosenPlacement = spaces[0].side;
      }
    }

    const targetCenterX = cutout.left + cutout.width / 2;
    const targetCenterY = cutout.top + cutout.height / 2;

    let top = VIEWPORT_MARGIN;
    let left = VIEWPORT_MARGIN;

    if (chosenPlacement === 'bottom') {
      top = Math.min(vh - cardH - VIEWPORT_MARGIN, cutout.bottom + TOOLTIP_GAP);
      top = Math.max(VIEWPORT_MARGIN, top);
      left = Math.min(
        vw - cardW - VIEWPORT_MARGIN,
        Math.max(VIEWPORT_MARGIN, targetCenterX - cardW / 2)
      );
      const arrowLeft = Math.min(cardW - 28, Math.max(28, targetCenterX - left));
      return { top, left, placement: 'bottom', arrowLeft };
    }

    if (chosenPlacement === 'top') {
      top = Math.max(VIEWPORT_MARGIN, cutout.top - cardH - TOOLTIP_GAP);
      top = Math.min(vh - cardH - VIEWPORT_MARGIN, top);
      left = Math.min(
        vw - cardW - VIEWPORT_MARGIN,
        Math.max(VIEWPORT_MARGIN, targetCenterX - cardW / 2)
      );
      const arrowLeft = Math.min(cardW - 28, Math.max(28, targetCenterX - left));
      return { top, left, placement: 'top', arrowLeft };
    }

    if (chosenPlacement === 'right') {
      left = Math.min(vw - cardW - VIEWPORT_MARGIN, cutout.right + TOOLTIP_GAP);
      left = Math.max(VIEWPORT_MARGIN, left);
      top = Math.min(
        vh - cardH - VIEWPORT_MARGIN,
        Math.max(VIEWPORT_MARGIN, targetCenterY - cardH / 2)
      );
      const arrowTop = Math.min(cardH - 28, Math.max(28, targetCenterY - top));
      return { top, left, placement: 'right', arrowTop };
    }

    // chosenPlacement === 'left'
    left = Math.max(VIEWPORT_MARGIN, cutout.left - cardW - TOOLTIP_GAP);
    left = Math.min(vw - cardW - VIEWPORT_MARGIN, left);
    top = Math.min(
      vh - cardH - VIEWPORT_MARGIN,
      Math.max(VIEWPORT_MARGIN, targetCenterY - cardH / 2)
    );
    const arrowTop = Math.min(cardH - 28, Math.max(28, targetCenterY - top));
    return { top, left, placement: 'left', arrowTop };
  };

  const tooltipPos = computeTooltipPosition();
  const progressPercentage = Math.round(((stepIndex + 1) / totalSteps) * 100);
  const accentColor = isDark ? '#10B981' : '#0D6847';
  const dimFill = isDark ? 'rgba(2, 6, 23, 0.76)' : 'rgba(15, 23, 42, 0.62)';

  const handleNext = () => {
    if (isLastStep) {
      onFinish();
    } else {
      setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setStepIndex((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div
      id="interactive-guided-tour-root"
      className="fixed inset-0 z-50 pointer-events-auto select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-tour-step-title"
    >
      {/* 1. SVG Dimmed Backdrop with Crisp Spotlight Cutout */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto"
        width={vw}
        height={vh}
        viewBox={`0 0 ${vw} ${vh}`}
        preserveAspectRatio="none"
      >
        <defs>
          <mask id="guided-tour-spotlight-mask">
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {cutout && (
              <rect
                x={cutout.left}
                y={cutout.top}
                width={cutout.width}
                height={cutout.height}
                rx={20}
                ry={20}
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Dimmed overlay outside the spotlight cutout */}
        <rect
          x="0"
          y="0"
          width={vw}
          height={vh}
          fill={dimFill}
          mask="url(#guided-tour-spotlight-mask)"
        />
      </svg>

      {/* 2. Elevated Spotlight Frame around Highlighted UI Element */}
      {cutout && (
        <motion.div
          initial={false}
          animate={{
            top: cutout.top,
            left: cutout.left,
            width: cutout.width,
            height: cutout.height,
          }}
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 30,
            mass: 0.7,
          }}
          className="fixed pointer-events-none rounded-[20px] z-50"
          style={{
            border: `2px solid ${accentColor}`,
            boxShadow: isDark
              ? '0 0 0 4px rgba(16, 185, 129, 0.22), 0 12px 32px -4px rgba(0, 0, 0, 0.6)'
              : '0 0 0 4px rgba(13, 104, 71, 0.18), 0 12px 32px -4px rgba(15, 23, 42, 0.28)',
          }}
        />
      )}

      {/* 3. Floating Explanation Card with Directional Pointer Arrow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            top: tooltipPos.top,
            left: tooltipPos.left,
          }}
          exit={{ opacity: 0, scale: 0.96, y: 4 }}
          transition={{
             duration: 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: Math.min(368, vw - VIEWPORT_MARGIN * 2),
          }}
          className="fixed z-50 theme-card border theme-border rounded-2xl p-5 shadow-2xl pointer-events-auto"
        >
          {/* Directional Pointer Arrow */}
          {tooltipPos.placement === 'bottom' && tooltipPos.arrowLeft !== undefined && (
            <div
              className="w-3.5 h-3.5 theme-card border-l border-t theme-border rotate-45 absolute -top-2 pointer-events-none"
              style={{ left: tooltipPos.arrowLeft - 7 }}
            />
          )}
          {tooltipPos.placement === 'top' && tooltipPos.arrowLeft !== undefined && (
            <div
              className="w-3.5 h-3.5 theme-card border-r border-b theme-border rotate-45 absolute -bottom-2 pointer-events-none"
              style={{ left: tooltipPos.arrowLeft - 7 }}
            />
          )}
          {tooltipPos.placement === 'right' && tooltipPos.arrowTop !== undefined && (
            <div
              className="w-3.5 h-3.5 theme-card border-l border-b theme-border rotate-45 absolute -left-2 pointer-events-none"
              style={{ top: tooltipPos.arrowTop - 7 }}
            />
          )}
          {tooltipPos.placement === 'left' && tooltipPos.arrowTop !== undefined && (
            <div
              className="w-3.5 h-3.5 theme-card border-r border-t theme-border rotate-45 absolute -right-2 pointer-events-none"
              style={{ top: tooltipPos.arrowTop - 7 }}
            />
          )}

          {/* Top Bar: Section Label + Step Counter + Skip Close */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold theme-soft-accent-bg theme-primary-text border theme-border truncate">
                <Compass className="w-3 h-3 shrink-0" />
                <span className="truncate">{currentStep.sectionLabel}</span>
              </span>
              <span className="text-[11px] font-mono font-semibold theme-muted-text shrink-0">
                Step {stepIndex + 1} of {totalSteps}
              </span>
            </div>

            <button
              type="button"
              id="btn-guided-tour-close"
              onClick={onSkip}
              title="Skip Tour (Esc)"
              className="p-1 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-surface-subtle transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Progress Bar */}
          <div className="w-full h-1.5 theme-surface-subtle rounded-full overflow-hidden mb-3.5 border theme-border">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>

          {/* Step Title & Concise 1-2 Line Description */}
          <div className="space-y-1.5 mb-4">
            <h3
              id="guided-tour-step-title"
              className="text-sm sm:text-base font-bold font-heading theme-main-text leading-snug"
            >
              {currentStep.title}
            </h3>
            <p className="text-xs sm:text-[13px] theme-secondary-text leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Bottom Controls: Skip Tour | Previous | Next / Finish Tour */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t theme-border">
            <button
              type="button"
              id="btn-guided-tour-skip"
              onClick={onSkip}
              className="text-xs font-semibold theme-secondary-text hover:theme-main-text transition-colors cursor-pointer py-1.5 px-2 rounded-lg hover:theme-surface-subtle"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  id="btn-guided-tour-prev"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-xl border theme-border theme-surface-subtle hover:theme-surface-elevated theme-main-text text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              )}

              <button
                type="button"
                id="btn-guided-tour-next"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl theme-btn-primary text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {isLastStep ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Start Learning</span>
                    <Check className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
