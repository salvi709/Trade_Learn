import React, { useState } from 'react';
import { Module } from '../../types';
import { 
  Lock, 
  CheckCircle2, 
  Circle, 
  Clock, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { getPrerequisiteChecklist } from '../../data/curriculumData';
import { APP_NAME } from '../../config/branding';

interface LockedModulePreviewProps {
  module: Module;
  completedLessons: string[];
  completedModules: string[];
  onClose: () => void;
  onNavigateToModule?: (moduleId: string) => void;
}

export const LockedModulePreview: React.FC<LockedModulePreviewProps> = ({
  module,
  completedLessons,
  completedModules,
  onClose,
  onNavigateToModule
}) => {
  const [showFullPreview, setShowFullPreview] = useState<boolean>(false);
  const checklist = getPrerequisiteChecklist(module, completedLessons, completedModules);
  const nextIncompletePrereq = checklist.find((item) => !item.isCompleted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="locked-module-modal"
        className="w-full max-w-2xl theme-card rounded-3xl border theme-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with lock accent */}
        <div className="p-6 md:p-8 theme-surface-subtle border-b theme-border relative">
          <button
            type="button"
            id="btn-close-locked-preview"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 theme-muted-text hover:theme-main-text hover:theme-surface-elevated rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                  Level {module.levelNumber} • Locked Section
                </span>
                <span className="text-[11px] font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-emerald-500" /> Preview Available
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold font-heading theme-main-text pt-1">
                {module.title}
              </h2>
              <p className="text-xs md:text-sm theme-secondary-text leading-relaxed">
                {module.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 theme-main-text">
          {/* Section Summary Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs md:text-sm theme-secondary-text leading-relaxed space-y-1.5">
            <div className="font-bold text-amber-500 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Info className="w-4 h-4 shrink-0" />
              This section is currently locked
            </div>
            <p className="text-xs">
              In {APP_NAME}, modules build systematically on fundamental concepts. Complete the previous learning stages to unlock full access.
            </p>
          </div>

          {/* Prerequisite Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold theme-main-text uppercase tracking-wider flex items-center gap-2">
              <span>To Unlock {module.title}:</span>
            </h4>

            <div className="theme-surface-subtle border theme-border rounded-2xl p-4 divide-y theme-border text-xs md:text-sm">
              {checklist.map((item) => (
                <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 theme-muted-text shrink-0" />
                    )}
                    <span className={`font-medium truncate ${item.isCompleted ? 'theme-muted-text line-through opacity-75' : 'theme-main-text font-semibold'}`}>
                      {item.title}
                    </span>
                  </div>

                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                    item.isCompleted 
                      ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 font-semibold' 
                      : 'text-amber-500 bg-amber-500/10 border border-amber-500/20 font-semibold'
                  }`}>
                    {item.isCompleted ? '✓ Completed' : '○ Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* What user will learn in this section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold theme-main-text uppercase tracking-wider">
                Learn how disciplined traders think about:
              </h4>
              <button
                type="button"
                id="btn-toggle-full-preview"
                onClick={() => setShowFullPreview(!showFullPreview)}
                className="text-xs font-semibold theme-primary-text hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showFullPreview ? 'Hide Syllabus' : 'View Syllabus Preview'}
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showFullPreview ? 'rotate-90' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {module.skills.map((skill, idx) => (
                <div 
                  key={idx} 
                  className="p-3 theme-card border theme-border rounded-xl text-xs flex items-center gap-2 theme-secondary-text shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full theme-primary-bg shrink-0"></span>
                  <span className="font-medium">{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expandable Full Preview Details */}
          {showFullPreview && (
            <div className="space-y-4 pt-2 border-t theme-border animate-in fade-in duration-200">
              <div className="flex items-center gap-4 text-xs theme-muted-text font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {module.estimatedTime}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> {module.lessons.length} Lessons
                </span>
              </div>

              {/* Concepts preview */}
              <div className="theme-surface-subtle border theme-border rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold theme-main-text">Core Concepts Preview:</div>
                <div className="flex flex-wrap gap-1.5">
                  {module.conceptsPreview.map((concept, idx) => (
                    <span 
                      key={idx} 
                      className="text-[11px] theme-card border theme-border theme-secondary-text px-2.5 py-1 rounded-lg font-medium"
                    >
                      • {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lessons Syllabus */}
              <div className="space-y-2">
                <div className="text-xs font-bold theme-main-text">Lessons in this Module:</div>
                <div className="space-y-2">
                  {module.lessons.map((les, idx) => (
                    <div 
                      key={les.id}
                      className="p-3 theme-surface-subtle border theme-border rounded-xl flex items-center justify-between text-xs theme-secondary-text"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Lock className="w-3.5 h-3.5 theme-muted-text shrink-0" />
                        <span className="font-semibold theme-main-text truncate">
                          {idx + 1}. {les.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono theme-muted-text shrink-0">
                        {les.readTimeMinutes}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 md:p-6 theme-surface-subtle border-t theme-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs theme-secondary-text text-center sm:text-left">
            {nextIncompletePrereq ? (
              <span>
                Required next:{' '}
                <strong className="theme-main-text">{nextIncompletePrereq.title}</strong>
              </span>
            ) : (
              <span>Complete earlier stages to unlock.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {nextIncompletePrereq && onNavigateToModule && (
              <button
                type="button"
                id="btn-go-to-prereq"
                onClick={() => {
                  onNavigateToModule(nextIncompletePrereq.id);
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2.5 theme-btn-primary font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Go to {nextIncompletePrereq.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              disabled
              id="btn-start-locked-lesson-disabled"
              title="This section unlocks after you complete the previous learning stages."
              className="w-full sm:w-auto px-4 py-2.5 theme-surface-subtle theme-muted-text border theme-border font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Section Locked</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
