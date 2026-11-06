import React, { useState } from 'react';
import { Module, Lesson, ModuleStatus } from '../../types';
import { 
  CheckCircle2, 
  Lock, 
  Play, 
  Clock, 
  ArrowRight, 
  Compass, 
  Sparkles, 
  ShieldCheck, 
  Circle, 
  ChevronRight,
  Eye,
  BookOpen
} from 'lucide-react';
import { getModuleStatus, isLessonUnlocked } from '../../data/curriculumData';
import { LockedModulePreview } from '../learning/LockedModulePreview';

interface LearningRoadmapProps {
  modules: Module[];
  completedLessons: string[];
  completedModules?: string[];
  currentLessonId: string;
  onSelectLesson: (lesson: Lesson) => void;
  onNavigateTab?: (tabId: string) => void;
}

export const LearningRoadmap: React.FC<LearningRoadmapProps> = ({
  modules,
  completedLessons,
  completedModules = [],
  currentLessonId,
  onSelectLesson,
  onNavigateTab,
}) => {
  const [selectedLockedModule, setSelectedLockedModule] = useState<Module | null>(null);

  // Calculate high-level stats
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalCompleted = completedLessons.length;
  const progressPercent = Math.round((totalCompleted / (totalLessons || 1)) * 100);

  const completedModulesCount = modules.filter(
    (m) => getModuleStatus(m, completedLessons, completedModules) === 'COMPLETED'
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Header Banner */}
      <div 
        id="roadmap-header-card"
        className="theme-card interactive-card border theme-border rounded-3xl p-6 md:p-8 shadow-sm space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider theme-primary-text theme-soft-accent-bg border theme-border px-2.5 py-0.5 rounded-md">
                Guided Progression
              </span>
              <span className="text-xs theme-secondary-text font-medium">
                {completedModulesCount} of {modules.length} Stages Mastered
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-heading theme-main-text">
              The 10-Stage Financial Roadmap
            </h2>
            <p className="text-xs md:text-sm theme-secondary-text max-w-2xl leading-relaxed">
              Explore freely, learn progressively, practice safely. Preview upcoming advanced modules at any time, and unlock lessons as you build fundamental proficiency.
            </p>
          </div>

          {/* Overall Progress Gauge */}
          <div className="theme-surface-subtle border theme-border rounded-2xl p-4 flex items-center gap-4 shrink-0">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="theme-border"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="theme-primary-text transition-all duration-500"
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-black font-mono theme-main-text">
                {progressPercent}%
              </span>
            </div>
            <div>
              <div className="text-xs font-bold theme-main-text">Overall Progress</div>
              <div className="text-[11px] theme-secondary-text">
                {totalCompleted} of {totalLessons} Lessons Done
              </div>
            </div>
          </div>
        </div>

        {/* Legend status indicators */}
        <div className="pt-3 border-t theme-border flex flex-wrap items-center gap-4 text-xs theme-secondary-text">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 theme-positive-text" />
            <span>✓ Completed</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full theme-primary-bg inline-block animate-pulse"></span>
            <span>◉ Current / In Progress</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Circle className="w-3.5 h-3.5 theme-muted-text" />
            <span>○ Available</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 theme-warning-text" />
            <span>🔒 Locked (Preview Available)</span>
          </div>
        </div>
      </div>

      {/* Modules Roadmap List */}
      <div className="space-y-6 relative">
        {/* Subtle vertical connector line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 theme-border hidden md:block" />

        {modules.map((mod) => {
          const status: ModuleStatus = getModuleStatus(mod, completedLessons, completedModules);
          const isCompleted = status === 'COMPLETED';
          const isInProgress = status === 'IN_PROGRESS';
          const isLocked = status === 'LOCKED';
          const isAvailable = status === 'AVAILABLE';

          const completedInMod = mod.lessons.filter((l) => completedLessons.includes(l.id)).length;

          return (
            <div key={mod.id} className="relative md:pl-16">
              {/* Level indicator badge on the timeline line */}
              <div
                className={`absolute left-0 top-6 w-12 h-12 rounded-2xl border hidden md:flex items-center justify-center font-mono font-bold text-xs transition-all shadow-xs ${
                  isCompleted
                    ? 'bg-emerald-500/10 theme-positive-text border-emerald-500/30'
                    : isInProgress
                    ? 'theme-soft-accent-bg theme-primary-text border-emerald-500 ring-2 ring-emerald-500/20'
                    : isAvailable
                    ? 'theme-card theme-main-text theme-border'
                    : 'theme-surface-subtle theme-warning-text theme-border'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 theme-positive-text" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4 theme-warning-text" />
                ) : (
                  `L${mod.levelNumber}`
                )}
              </div>

              {/* Module Card */}
              <div
                id={`module-card-${mod.id}`}
                data-tour={mod.id === 'mod_1' ? 'learning-roadmap-stages' : undefined}
                className={`theme-card interactive-card rounded-3xl border transition-all shadow-xs p-6 md:p-7 space-y-5 ${
                  isCompleted
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : isInProgress
                    ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                    : isAvailable
                    ? 'theme-border hover:border-slate-400'
                    : 'theme-border theme-surface-subtle'
                }`}
              >
                {/* Module Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b theme-border pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold theme-secondary-text theme-surface-subtle px-2 py-0.5 rounded border theme-border">
                        Stage {mod.levelNumber}
                      </span>

                      {/* Status Badges */}
                      {isCompleted && (
                        <span className="text-[11px] font-mono font-bold theme-positive-text bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> COMPLETED
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-[11px] font-mono font-bold theme-primary-text theme-soft-accent-bg border theme-border px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full theme-primary-bg animate-pulse"></span>
                          IN PROGRESS
                        </span>
                      )}
                      {isAvailable && (
                        <span className="text-[11px] font-mono font-bold theme-secondary-text theme-surface-subtle border theme-border px-2.5 py-0.5 rounded-full">
                          AVAILABLE
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-[11px] font-mono font-bold theme-warning-text bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3 theme-warning-text" /> LOCKED • PREVIEW AVAILABLE
                        </span>
                      )}

                      <span className="text-xs theme-secondary-text font-medium">
                        {completedInMod} / {mod.lessons.length} Lessons Finished
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold font-heading theme-main-text">
                      {mod.title}
                    </h3>
                    <p className="text-xs theme-secondary-text max-w-xl">
                      {mod.tagline}
                    </p>
                  </div>

                  {/* Estimated time and badge */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-mono theme-secondary-text flex items-center gap-1 theme-surface-subtle px-2.5 py-1 rounded-lg border theme-border">
                      <Clock className="w-3.5 h-3.5 theme-muted-text" /> {mod.estimatedTime}
                    </span>
                    <span className="text-xs font-mono theme-surface-subtle theme-main-text px-3 py-1 rounded-full font-semibold border theme-border">
                      {mod.badge}
                    </span>
                  </div>
                </div>

                {/* If Module is LOCKED: Show Friendly Preview Banner & Action */}
                {isLocked ? (
                  <div className="theme-surface-subtle border theme-border rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xs font-bold theme-warning-text flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 theme-warning-text" />
                          This section unlocks after you complete the previous learning stages.
                        </div>
                        <p className="text-xs theme-secondary-text">
                          You can freely preview the curriculum, skills gained, and key concepts right now.
                        </p>
                      </div>

                      <button
                        type="button"
                        id={`btn-preview-module-${mod.id}`}
                        onClick={() => setSelectedLockedModule(mod)}
                        className="px-3.5 py-2 theme-card hover:theme-surface-subtle theme-main-text border theme-border font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 theme-primary-text" />
                        <span>View Preview</span>
                      </button>
                    </div>

                    {/* Quick Skills list preview */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {mod.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] theme-card border theme-border theme-secondary-text px-2.5 py-0.5 rounded-md font-medium"
                        >
                          • {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Module is UNLOCKED: List lessons */
                  <div className="grid grid-cols-1 gap-2.5">
                    {mod.lessons.map((lesson, idx) => {
                      const isLessonDone = completedLessons.includes(lesson.id);
                      const isCurrent = currentLessonId === lesson.id;
                      const isUnlocked = isLessonUnlocked(lesson, mod, completedLessons, status);

                      return (
                        <div
                          key={lesson.id}
                          id={`lesson-item-${lesson.id}`}
                          onClick={() => {
                            if (isUnlocked) {
                              onSelectLesson(lesson);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                            isUnlocked ? 'interactive-list-item' : ''
                          } ${
                            isCurrent
                              ? 'theme-soft-accent-bg border-emerald-500 shadow-xs'
                              : isLessonDone
                              ? 'theme-surface-subtle theme-border hover:border-slate-400 cursor-pointer'
                              : isUnlocked
                              ? 'theme-card theme-border hover:border-emerald-500 hover:theme-surface-subtle cursor-pointer'
                              : 'theme-surface-subtle theme-border opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                                isLessonDone
                                  ? 'bg-emerald-500/10 theme-positive-text'
                                  : isCurrent
                                  ? 'theme-primary-bg'
                                  : isUnlocked
                                  ? 'theme-surface-subtle theme-main-text'
                                  : 'theme-surface-subtle theme-muted-text'
                              }`}
                            >
                              {isLessonDone ? (
                                <CheckCircle2 className="w-4 h-4 theme-positive-text" />
                              ) : isUnlocked ? (
                                <Play className="w-3.5 h-3.5 theme-primary-text fill-current" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 theme-muted-text" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-semibold theme-main-text truncate">
                                  {idx + 1}. {lesson.title}
                                </h4>
                                {isCurrent && (
                                  <span className="text-[10px] font-mono font-bold theme-primary-text theme-soft-accent-bg px-1.5 py-0.2 rounded border theme-border">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] theme-secondary-text truncate max-w-md">
                                {lesson.shortDesc}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[11px] theme-muted-text font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 theme-muted-text" /> {lesson.readTimeMinutes}m
                            </span>

                            {isUnlocked ? (
                              <button
                                type="button"
                                className="text-xs theme-primary-text font-bold flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <span>{isLessonDone ? 'Review' : 'Start'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-[11px] theme-muted-text flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Locked
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Locked Section Preview Modal */}
      {selectedLockedModule && (
        <LockedModulePreview
          module={selectedLockedModule}
          completedLessons={completedLessons}
          completedModules={completedModules}
          onClose={() => setSelectedLockedModule(null)}
          onNavigateToModule={(targetModId) => {
            const el = document.getElementById(`module-card-${targetModId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        />
      )}
    </div>
  );
};
