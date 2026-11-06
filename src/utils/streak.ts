import { UserProgress } from '../types';

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD strings
 */
export function getCalendarDayDiff(dateStrA: string, dateStrB: string): number {
  try {
    const [yA, mA, dA] = dateStrA.split('-').map(Number);
    const [yB, mB, dB] = dateStrB.split('-').map(Number);
    const dtA = new Date(yA, mA - 1, dA);
    const dtB = new Date(yB, mB - 1, dB);
    const diffMs = dtA.getTime() - dtB.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

/**
 * Evaluates progress on session start to determine if today's activity is already done
 * or if streak was broken.
 */
export function normalizeStreakOnLoad(progress: UserProgress): UserProgress {
  const today = getLocalDateString();
  const lastDate = progress.lastActiveDate || progress.lastStreakDate || '';

  if (!lastDate) {
    return {
      ...progress,
      currentStreak: progress.currentStreak || progress.learningStreakDays || 1,
      longestStreak: progress.longestStreak || Math.max(progress.learningStreakDays || 1, 1),
      lastActiveDate: today,
      todayCompleted: true,
      totalActiveDays: progress.totalActiveDays || 1,
      weeklyActivity: progress.weeklyActivity || { [today]: true },
    };
  }

  const dayDiff = getCalendarDayDiff(today, lastDate);

  if (dayDiff === 0) {
    // Already completed today
    return {
      ...progress,
      currentStreak: progress.currentStreak || progress.learningStreakDays || 1,
      longestStreak: progress.longestStreak || Math.max(progress.learningStreakDays || 1, 1),
      todayCompleted: true,
      lastActiveDate: today,
      weeklyActivity: { ...(progress.weeklyActivity || {}), [today]: true }
    };
  } else if (dayDiff === 1) {
    // Completed yesterday. Streak is alive at current count, waiting for today's activity!
    return {
      ...progress,
      currentStreak: progress.currentStreak || progress.learningStreakDays || 1,
      longestStreak: progress.longestStreak || Math.max(progress.learningStreakDays || 1, 1),
      todayCompleted: false,
    };
  } else {
    // Missed a day. Streak resets to 0 until activity is logged today.
    return {
      ...progress,
      currentStreak: 0,
      longestStreak: progress.longestStreak || progress.learningStreakDays || 1,
      todayCompleted: false,
    };
  }
}

/**
 * Registers meaningful learning activity (lesson completion, quiz submission, paper trade, journal entry).
 * Increments streak once per calendar day.
 */
export function recordLearningActivity(progress: UserProgress): {
  updatedProgress: UserProgress;
  streakIncremented: boolean;
} {
  const today = getLocalDateString();
  const lastDate = progress.lastActiveDate || progress.lastStreakDate || '';
  const weekly = { ...(progress.weeklyActivity || {}) };
  weekly[today] = true;

  if (lastDate === today && progress.todayCompleted) {
    // Already counted today's streak!
    return {
      updatedProgress: {
        ...progress,
        todayCompleted: true,
        weeklyActivity: weekly,
        lastVisitedAt: new Date().toISOString(),
      },
      streakIncremented: false,
    };
  }

  const dayDiff = lastDate ? getCalendarDayDiff(today, lastDate) : 999;
  let newCurrent = 1;

  if (dayDiff === 1) {
    // Continued from yesterday
    newCurrent = (progress.currentStreak || 0) + 1;
  } else if (dayDiff === 0) {
    // Same day, make sure it is at least 1
    newCurrent = Math.max(1, progress.currentStreak || 1);
  } else {
    // Streak was broken or fresh start
    newCurrent = 1;
  }

  const newLongest = Math.max(progress.longestStreak || 0, newCurrent);
  const newTotalDays = (progress.totalActiveDays || 0) + 1;

  const updatedProgress: UserProgress = {
    ...progress,
    currentStreak: newCurrent,
    learningStreakDays: newCurrent,
    longestStreak: newLongest,
    lastActiveDate: today,
    todayCompleted: true,
    totalActiveDays: newTotalDays,
    weeklyActivity: weekly,
    lastVisitedAt: new Date().toISOString(),
  };

  return {
    updatedProgress,
    streakIncremented: true,
  };
}

export interface DayOfWeekStatus {
  label: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
  fullLabel: string;
  dateStr: string;
  isToday: boolean;
  isCompleted: boolean;
  isFuture: boolean;
}

/**
 * Generates Monday-to-Sunday week status
 */
export function getCurrentWeekStatus(progress: UserProgress): DayOfWeekStatus[] {
  const now = new Date();
  const todayStr = getLocalDateString(now);

  // Day of week in JS: 0=Sun, 1=Mon, ..., 6=Sat
  // We want Monday as start of week: Mon=0, Tue=1, ..., Sun=6
  const currentDayOfWeek = (now.getDay() + 6) % 7; 

  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDayOfWeek);

  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const fullLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const days: DayOfWeekStatus[] = [];
  const weekly = progress.weeklyActivity || {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = getLocalDateString(d);
    const isToday = dateStr === todayStr;
    const isFuture = d > now && !isToday;
    const isCompleted = Boolean(weekly[dateStr]);

    days.push({
      label: labels[i],
      fullLabel: fullLabels[i],
      dateStr,
      isToday,
      isCompleted,
      isFuture,
    });
  }

  return days;
}
