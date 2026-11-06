import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  TrendingUp,
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Bot,
  Lock,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  CheckSquare,
  Target,
  FileText,
  Layers,
  Search,
} from 'lucide-react';
import { UserProfile, UserProgress, PaperPortfolio, Module, Lesson } from '../../types';
import { getModuleStatus, getNextRecommendedLesson } from '../../data/curriculumData';
import { getAvatarById } from '../../config/avatars';
import { LockedModulePreview } from '../learning/LockedModulePreview';
import { StreakCard } from './StreakCard';
import { MarketMascot } from '../mascot/MarketMascot';
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

  // Progress within the active stage
  const currentStageCompletedCount = currentModule
    ? currentModule.lessons.filter((l) => progress.completedLessons.includes(l.id)).length
    : 0;
  const currentStageTotalCount = currentModule ? currentModule.lessons.length : 1;

  // Determine learner level
  let levelTitle = 'Level 1: Novice Observer';
  if (completedCount >= 10) {
    levelTitle = 'Level 5: Certified Market Analyst';
  } else if (completedCount >= 7) {
    levelTitle = 'Level 4: Market Literate';
  } else if (completedCount >= 4) {
    levelTitle = 'Level 3: Chart Explorer';
  } else if (completedCount >= 2) {
    levelTitle = 'Level 2: Basic Builder';
  }

  const completedModulesCount = modules.filter(
    (m) => getModuleStatus(m, progress.completedLessons, progress.completedModules) === 'COMPLETED'
  ).length;

  const quizScoresList = Object.values(progress.quizScores || {});
  const averageQuizScore =
    quizScoresList.length > 0
      ? Math.round(quizScoresList.reduce((a, b) => a + b, 0) / quizScoresList.length)
      : 100;

  const avatar = getAvatarById(profile.avatarId);
  const formattedVirtualCash = `₹${portfolio.virtualCash.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

  // Concise Core ShareMarket Tools (Section 03)
  const coreTools = [
    {
      id: 'paper_trading',
      dataTour: 'tool-paper-trading',
      icon: TrendingUp,
      title: 'Paper Trading Lab',
      description: `Practice trading with ${formattedVirtualCash} virtual money.`,
      actionLabel: 'Open',
      onClick: () => onNavigateTab('paper_trading'),
    },
    {
      id: 'mentor',
      dataTour: 'tool-ai-mentor',
      icon: Bot,
      title: 'Market Mentor',
      description: 'Ask questions and understand difficult concepts.',
      actionLabel: 'Open',
      onClick: () => onOpenMentor(),
    },
    {
      id: 'roadmap',
      dataTour: 'tool-curriculum',
      icon: BookOpen,
      title: 'Curriculum & Lessons',
      description: 'Access structured stages, examples, and quizzes.',
      actionLabel: 'Open',
      onClick: () => onNavigateTab('roadmap'),
    },
    {
      id: 'stock_detective',
      dataTour: 'tool-strategy',
      icon: Search,
      title: 'Forensic & Strategy Lab',
      description: 'Analyze company red flags and market scenarios.',
      actionLabel: 'Open',
      onClick: () => onNavigateTab('stock_detective'),
    },
    {
      id: 'journal',
      dataTour: 'tool-journal',
      icon: FileText,
      title: 'Trading Journal',
      description: 'Log trade rationale and build calm discipline.',
      actionLabel: 'Open',
      onClick: () => onNavigateTab('journal'),
    },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* =====================================================================
          SECTION 01 — WELCOME & CURRENT STATUS ("Where am I right now?")
         ===================================================================== */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: PREMIUM_EASE }}
        aria-label="Your Journey and Current Status"
        className="space-y-3"
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest theme-primary-text">
            01 — Your Journey
          </span>
          <span className="text-[11px] font-mono theme-muted-text">
            Stage {currentModule.levelNumber} of {modules.length}
          </span>
        </div>

        <div
          id="dashboard-hero-banner"
          data-tour="dashboard-welcome"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
        >
          {/* Main Welcome & Overall Status Card */}
          <div className="lg:col-span-7 theme-card interactive-card rounded-3xl p-6 sm:p-7 border theme-border shadow-2xs flex flex-col justify-between space-y-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl theme-soft-accent-bg border theme-border flex items-center justify-center text-3xl sm:text-4xl shadow-xs shrink-0">
                {avatar.svgIcon}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold theme-primary-text theme-soft-accent-bg px-2.5 py-0.5 rounded-full border theme-border">
                    {levelTitle}
                  </span>
                  <span className="text-xs text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {progress.currentStreak || progress.learningStreakDays || 1} Day Streak
                  </span>
                  <span className="text-[11px] font-mono theme-muted-text hidden sm:inline">
                    • {avatar.role}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold font-heading theme-main-text tracking-tight">
                  Welcome back, {profile.displayName || 'Learner'}!
                </h1>

                <p className="text-xs sm:text-sm theme-secondary-text leading-relaxed">
                  You are currently on{' '}
                  <strong className="theme-main-text font-semibold">
                    Stage {currentModule.levelNumber}: {currentModule.title}
                  </strong>
                  . Learn step-by-step and practice risk-free at your own pace.
                </p>
              </div>
            </div>

            {/* Calm Secondary Progress Summary Bar */}
            <div className="pt-4 border-t theme-border space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="theme-secondary-text font-medium">
                  Overall Curriculum Progress
                </span>
                <span className="font-mono font-bold theme-main-text">
                  {progressPercent}% ({completedCount}/{totalLessonsCount} lessons)
                </span>
              </div>

              <div className="w-full theme-surface-subtle h-2 rounded-full overflow-hidden border theme-border">
                <div
                  className="theme-primary-bg h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px] font-mono theme-muted-text">
                <span>
                  Stages Completed:{' '}
                  <strong className="theme-main-text">
                    {completedModulesCount}/{modules.length}
                  </strong>
                </span>
                <span>
                  Quiz Accuracy:{' '}
                  <strong className="theme-primary-text">{averageQuizScore}%</strong>
                </span>
                <span>
                  Virtual Balance:{' '}
                  <strong className="theme-positive-text">{formattedVirtualCash}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Companion Daily Streak & Habit Card */}
          <div data-tour="dashboard-streak" className="lg:col-span-5">
            <StreakCard
              progress={progress}
              onActionClick={() => currentLesson && onSelectLesson(currentLesson)}
              className="h-full"
            />
          </div>
        </div>
      </motion.section>

      {/* Interactive Bull & Bear Welcome Pop-up (Dismissible, once per session, non-blocking) */}
      <MascotWelcomePopup
        displayName={profile.displayName || 'Learner'}
        currentStageTitle={`Stage ${currentModule.levelNumber}: ${currentModule.title}`}
        onOpenMentor={onOpenMentor}
      />

      {/* =====================================================================
          SECTION 02 — CONTINUE WHERE YOU LEFT OFF ("What should I do next?")
         ===================================================================== */}
      {currentLesson && (
        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, delay: 0.08, ease: PREMIUM_EASE }}
          aria-label="Continue Learning"
          className="space-y-3"
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest theme-primary-text">
              02 — Continue Learning
            </span>
            <span className="text-[11px] font-mono theme-muted-text">
              Recommended Next Step
            </span>
          </div>

          <div
            data-tour="continue-learning"
            className="theme-card interactive-card rounded-3xl p-6 sm:p-8 border theme-border shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div className="space-y-3.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-mono uppercase theme-primary-text theme-soft-accent-bg font-bold tracking-wider px-2.5 py-0.5 rounded-lg border theme-border">
                  Stage {currentModule.levelNumber} • {currentModule.badge}
                </span>
                <span className="text-xs theme-secondary-text font-semibold">
                  {currentModule.title}
                </span>
                <span className="text-[11px] font-mono theme-muted-text flex items-center gap-1 ml-auto sm:ml-0">
                  <Clock className="w-3.5 h-3.5" />
                  {currentLesson.readTimeMinutes} min read
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading theme-main-text leading-tight">
                  {currentLesson.title}
                </h2>
                <p className="text-xs sm:text-sm theme-secondary-text leading-relaxed mt-1">
                  {currentLesson.shortDesc}
                </p>
              </div>

              {currentLesson.eli15?.keyTakeaway && (
                <div className="theme-surface-subtle border theme-border rounded-2xl p-3.5 flex items-start gap-2.5">
                  <CheckSquare className="w-4 h-4 theme-primary-text shrink-0 mt-0.5" />
                  <div className="text-xs theme-main-text leading-relaxed">
                    <span className="font-mono uppercase text-[10px] theme-muted-text font-semibold block mb-0.5">
                      Core Learning Objective
                    </span>
                    {currentLesson.eli15.keyTakeaway}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 theme-border shrink-0">
              <div className="flex items-center gap-1.5 text-xs theme-secondary-text font-mono">
                <Target className="w-4 h-4 theme-primary-text shrink-0" />
                <span>
                  Stage Progress: {currentStageCompletedCount}/{currentStageTotalCount} lessons
                </span>
              </div>

              <button
                type="button"
                id="btn-continue-learning-cta"
                onClick={() => onSelectLesson(currentLesson)}
                className="group px-6 py-3.5 theme-btn-primary font-bold text-xs sm:text-sm rounded-2xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all interactive-btn"
              >
                <span>Continue Lesson</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* =====================================================================
          SECTION 03 — CORE SHAREMARKET TOOLS ("What tools do I have?")
         ===================================================================== */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.16, ease: PREMIUM_EASE }}
        aria-label="Core ShareMarket Tools"
        className="space-y-3"
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest theme-primary-text">
            03 — Explore & Practice
          </span>
          <span className="text-[11px] font-mono theme-muted-text">
            Core Platform Shortcuts
          </span>
        </div>

        <div
          data-tour="dashboard-core-tools"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {coreTools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                type="button"
                data-tour={tool.dataTour}
                onClick={tool.onClick}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: shouldReduceMotion ? 0 : 0.18 + idx * 0.06,
                  ease: PREMIUM_EASE,
                }}
                className="group theme-card interactive-card rounded-2xl p-5 border theme-border text-left flex flex-col justify-between gap-4 cursor-pointer shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl theme-soft-accent-bg border theme-border flex items-center justify-center theme-primary-text transition-transform duration-200 group-hover:scale-105">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold font-heading theme-main-text">
                      {tool.title}
                    </h3>
                    <p className="text-xs theme-secondary-text leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t theme-border flex items-center justify-between text-xs font-bold theme-primary-text">
                  <span>{tool.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* =====================================================================
          SECTION 04 — 10-STAGE LEARNING ROADMAP ("What's my full journey?")
         ===================================================================== */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.55, ease: PREMIUM_EASE }}
        aria-label="10-Stage Learning Roadmap"
        className="space-y-3"
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest theme-primary-text">
            04 — Learning Roadmap
          </span>
          <span className="text-[11px] font-mono theme-muted-text">
            10 Sequential Stages
          </span>
        </div>

        <div
          data-tour="dashboard-roadmap-matrix"
          className="theme-card rounded-3xl p-6 sm:p-8 border theme-border shadow-2xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 theme-primary-text" />
                <h3 className="text-lg sm:text-xl font-bold font-heading theme-main-text">
                  10-Stage Learning Roadmap
                </h3>
              </div>
              <p className="text-xs theme-secondary-text">
                Sequential milestone structure. Complete each stage to unlock advanced chart analysis and paper trading.
              </p>
            </div>

            <button
              type="button"
              id="btn-view-full-roadmap"
              onClick={() => onNavigateTab('roadmap')}
              className="group text-xs font-bold theme-primary-text hover:underline flex items-center gap-1 cursor-pointer shrink-0 interactive-btn"
            >
              <span>View Full Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* 10 Modules Grid Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {modules.map((mod) => {
              const status = getModuleStatus(
                mod,
                progress.completedLessons,
                progress.completedModules
              );
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
                      const nextLes =
                        mod.lessons.find((l) => !progress.completedLessons.includes(l.id)) ||
                        mod.lessons[0];
                      onSelectLesson(nextLes);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between space-y-3 theme-card interactive-card cursor-pointer ${
                    isCompleted
                      ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : isInProgress
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'theme-border opacity-85'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold theme-muted-text uppercase">
                        Stage {mod.levelNumber}
                      </span>

                      {isCompleted && (
                        <span className="text-[10px] font-mono font-bold theme-primary-text theme-soft-accent-bg px-2 py-0.5 rounded-full flex items-center gap-1 border theme-border">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-[10px] font-mono font-bold theme-primary-text theme-soft-accent-bg px-2 py-0.5 rounded-full flex items-center gap-1 border theme-border">
                          <span className="w-1.5 h-1.5 rounded-full theme-primary-bg animate-pulse"></span>
                          Active
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-[10px] font-mono font-bold theme-muted-text theme-surface-subtle px-2 py-0.5 rounded-full flex items-center gap-1 border theme-border">
                          <Lock className="w-2.5 h-2.5 theme-muted-text" /> Locked
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold theme-main-text line-clamp-1">
                      {mod.title}
                    </h4>
                    <p className="text-[11px] theme-secondary-text line-clamp-2 leading-tight">
                      {mod.tagline}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t theme-border flex items-center justify-between">
                    <span className="text-[10px] font-mono theme-muted-text">
                      {mod.lessons.length} Lessons
                    </span>

                    {isLocked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLockedModule(mod);
                        }}
                        className="text-[11px] font-bold theme-secondary-text hover:theme-main-text flex items-center gap-1 cursor-pointer interactive-btn"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextLes =
                            mod.lessons.find((l) => !progress.completedLessons.includes(l.id)) ||
                            mod.lessons[0];
                          onSelectLesson(nextLes);
                        }}
                        className="text-[11px] font-bold theme-primary-text hover:underline flex items-center gap-1 cursor-pointer interactive-btn"
                      >
                        <span>{isCompleted ? 'Review' : 'Open'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Educational Safety & Integrity Banner */}
      <div className="theme-surface-subtle border theme-border rounded-2xl p-4 flex items-center gap-3 text-xs theme-secondary-text">
        <ShieldCheck className="w-5 h-5 theme-primary-text shrink-0" />
        <div>
          <strong className="theme-main-text font-semibold">
            Educational Simulation Environment:
          </strong>{' '}
          All quotes, paper trading balances, and mentor responses are strictly designed for risk-free learning and conceptual mastery. No real money or real securities are transacted.
        </div>
      </div>

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
