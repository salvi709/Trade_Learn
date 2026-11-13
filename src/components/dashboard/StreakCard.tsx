import React from 'react';
import { Flame, Check, Sparkles, Calendar } from 'lucide-react';
import { UserProgress } from '../../types';
import { getCurrentWeekStatus } from '../../utils/streak';

interface StreakCardProps {
  progress: UserProgress;
  onActionClick?: () => void;
  className?: string;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  progress,
  onActionClick,
  className = '',
}) => {
  const weekDays = getCurrentWeekStatus(progress);
  const streak = progress.currentStreak || progress.learningStreakDays || 0;
  const longest = progress.longestStreak || Math.max(streak, 1);
  const isTodayDone = progress.todayCompleted;

  return (
    <div
      id="bento-streak-card"
      className={`theme-card interactive-card rounded-2xl p-5 md:p-6 border relative overflow-hidden flex flex-col justify-between ${className}`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider theme-muted-text font-semibold">
                Daily Habit
              </div>
              <h3 className="text-base font-bold theme-main-text font-heading flex items-center gap-1.5 leading-none">
                <span>{streak} DAY STREAK</span>
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono theme-muted-text font-medium block">
              Best: <strong className="theme-main-text font-bold">{longest} days</strong>
            </span>
          </div>
        </div>

        {/* Motivational subtext */}
        <p className="text-xs theme-secondary-text mb-4 leading-relaxed">
          {isTodayDone
            ? "Great job! You completed today's learning activity."
            : "Complete today's learning activity to keep your streak going."}
        </p>

        {/* 7-Day Week Calendar Strip */}
        <div className="theme-surface-subtle border theme-border rounded-xl p-3 mb-4">
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {weekDays.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span
                  className={`text-[10px] font-mono font-bold ${
                    day.isToday ? 'theme-primary-text' : 'theme-muted-text'
                  }`}
                >
                  {day.label}
                </span>

                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    day.isCompleted
                      ? 'theme-positive-text bg-emerald-500/20 border border-emerald-500/30 shadow-2xs'
                      : day.isToday
                      ? 'border-2 border-dashed theme-primary-text theme-soft-accent-bg'
                      : 'theme-card border theme-border theme-muted-text'
                  }`}
                  title={`${day.fullLabel}: ${
                    day.isCompleted
                      ? 'Completed'
                      : day.isToday
                      ? 'Pending Today'
                      : 'Upcoming'
                  }`}
                >
                  {day.isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : day.isToday ? (
                    <div className="w-2 h-2 rounded-full theme-primary-bg animate-pulse" />
                  ) : (
                    <span className="text-[10px]">•</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Prompt */}
      <div className="pt-2 border-t theme-border flex items-center justify-between text-[11px]">
        <span className="theme-muted-text font-mono">
          Total active days: <strong className="theme-main-text">{progress.totalActiveDays || 1}</strong>
        </span>
        {!isTodayDone && onActionClick && (
          <button
            type="button"
            onClick={onActionClick}
            className="theme-primary-text hover:underline font-semibold cursor-pointer"
          >
            Study a lesson &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
