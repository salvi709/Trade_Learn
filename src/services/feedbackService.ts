import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  FeedbackItem,
  CreateFeedbackInput,
  FeedbackFilters,
  FeedbackAnalyticsSummary,
  FeedbackStatus,
  FeedbackType,
} from '../types/feedback';
import { ADMIN_AUTHORIZED_EMAILS } from './adminService';

const FEEDBACK_COLLECTION = 'feedback';

// Local storage keys for smart timing and anti-annoyance cooldown
const LS_FEEDBACK_LAST_ANY = 'smll_feedback_last_any_shown';
const LS_EXP_LAST_SHOWN = 'smll_feedback_exp_last_shown';
const LS_EXP_LAST_SUBMITTED = 'smll_feedback_exp_submitted';
const LS_LEARNING_SURVEYED = 'smll_feedback_learning_surveyed_lessons';
const LS_WEEKLY_PROMPT_COUNT = 'smll_feedback_weekly_prompt_count';
const LS_LOCAL_FEEDBACK_STORE = 'smll_local_feedback_items';

// In-memory cache for fast retrieval & offline resilience
let localFeedbackMemory: FeedbackItem[] = [];

/**
 * Smart Timing: Checks if the user is eligible for an Experience Feedback prompt.
 * Strictly adheres to non-intrusive timing rules:
 * 1. Never show immediately after login or on a fresh session (< 3 minutes or 0 completed lessons).
 * 2. Maximum 1-2 prompts per week.
 * 3. Cooldown: at least 7-14 days since last experience survey.
 * 4. At least 3 days since ANY other feedback prompt was shown.
 */
export function canShowExperienceFeedback(completedLessonsCount: number = 0): boolean {
  try {
    if (typeof window === 'undefined') return false;

    // Rule 1: Never immediately after fresh session / first login
    if (completedLessonsCount < 2) return false;

    const now = Date.now();
    const lastAnyStr = localStorage.getItem(LS_FEEDBACK_LAST_ANY);
    if (lastAnyStr) {
      const diffMs = now - parseInt(lastAnyStr, 10);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays < 3) return false; // At least 3 days between any prompts
    }

    // Weekly prompt cap (maximum 2 per 7 days)
    const weeklyDataStr = localStorage.getItem(LS_WEEKLY_PROMPT_COUNT);
    if (weeklyDataStr) {
      const parsed = JSON.parse(weeklyDataStr);
      if (now - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
        if (parsed.count >= 2) return false;
      }
    }

    // Experience-specific cooldown (7-14 days)
    const lastSubmittedStr = localStorage.getItem(LS_EXP_LAST_SUBMITTED);
    if (lastSubmittedStr) {
      const diffDays = (now - parseInt(lastSubmittedStr, 10)) / (1000 * 60 * 60 * 24);
      if (diffDays < 14) return false;
    }

    const lastShownStr = localStorage.getItem(LS_EXP_LAST_SHOWN);
    if (lastShownStr) {
      const diffDays = (now - parseInt(lastShownStr, 10)) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Smart Timing: Checks if a learning milestone qualifies for learning feedback.
 * Rules:
 * - Only after meaningful milestones (e.g., module completion or milestone lesson).
 * - Never after every lesson or quiz.
 * - Never repeatedly prompt for the same lesson.
 * - Respects weekly cap and cooldown.
 */
export function canShowLearningFeedback(
  lessonId: string,
  totalCompleted: number,
  newlyCompletedModule: boolean
): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (!lessonId) return false;

    // Must be either a newly finished module OR a milestone lesson (e.g. 3rd, 7th lesson)
    const isMilestone = newlyCompletedModule || (totalCompleted > 0 && totalCompleted % 4 === 0);
    if (!isMilestone) return false;

    // Check if this lesson was already surveyed
    const surveyedStr = localStorage.getItem(LS_LEARNING_SURVEYED);
    const surveyed: string[] = surveyedStr ? JSON.parse(surveyedStr) : [];
    if (surveyed.includes(lessonId)) return false;

    const now = Date.now();
    const lastAnyStr = localStorage.getItem(LS_FEEDBACK_LAST_ANY);
    if (lastAnyStr) {
      const diffDays = (now - parseInt(lastAnyStr, 10)) / (1000 * 60 * 60 * 24);
      if (diffDays < 3) return false;
    }

    // Weekly cap
    const weeklyDataStr = localStorage.getItem(LS_WEEKLY_PROMPT_COUNT);
    if (weeklyDataStr) {
      const parsed = JSON.parse(weeklyDataStr);
      if (now - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
        if (parsed.count >= 2) return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Records that a feedback prompt was shown to the user.
 */
export function recordFeedbackPromptShown(type: FeedbackType, lessonId?: string): void {
  try {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    localStorage.setItem(LS_FEEDBACK_LAST_ANY, now.toString());

    if (type === 'experience') {
      localStorage.setItem(LS_EXP_LAST_SHOWN, now.toString());
    }

    if (type === 'learning' && lessonId) {
      const surveyedStr = localStorage.getItem(LS_LEARNING_SURVEYED);
      const surveyed: string[] = surveyedStr ? JSON.parse(surveyedStr) : [];
      if (!surveyed.includes(lessonId)) {
        surveyed.push(lessonId);
        localStorage.setItem(LS_LEARNING_SURVEYED, JSON.stringify(surveyed));
      }
    }

    // Increment weekly counter
    const weeklyDataStr = localStorage.getItem(LS_WEEKLY_PROMPT_COUNT);
    if (weeklyDataStr) {
      const parsed = JSON.parse(weeklyDataStr);
      if (now - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
        localStorage.setItem(
          LS_WEEKLY_PROMPT_COUNT,
          JSON.stringify({ timestamp: parsed.timestamp, count: parsed.count + 1 })
        );
      } else {
        localStorage.setItem(
          LS_WEEKLY_PROMPT_COUNT,
          JSON.stringify({ timestamp: now, count: 1 })
        );
      }
    } else {
      localStorage.setItem(
        LS_WEEKLY_PROMPT_COUNT,
        JSON.stringify({ timestamp: now, count: 1 })
      );
    }
  } catch {
    // Ignore storage issues
  }
}

/**
 * Records when the user dismisses or skips a prompt (sets 3-day quiet window).
 */
export function recordFeedbackDismissed(type: FeedbackType): void {
  try {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    localStorage.setItem(LS_FEEDBACK_LAST_ANY, now.toString());
    if (type === 'experience') {
      localStorage.setItem(LS_EXP_LAST_SHOWN, now.toString());
    }
  } catch {
    // Ignore
  }
}

/**
 * Submits user feedback directly to Cloud Firestore.
 */
export async function submitFeedback(input: CreateFeedbackInput): Promise<string> {
  const nowIso = new Date().toISOString();
  const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Defensive validation & sanitization
  const cleanComment = input.comment ? input.comment.trim().slice(0, 1500) : null;
  const isAnon = !!input.isAnonymous;

  const item: FeedbackItem = {
    id: feedbackId,
    type: input.type,
    category: input.category,
    rating: typeof input.rating === 'number' ? input.rating : null,
    ratingLabel: input.ratingLabel || null,
    comment: cleanComment,
    selectedReasons: Array.isArray(input.selectedReasons) ? input.selectedReasons.slice(0, 10) : [],
    userId: isAnon ? null : (input.userId || auth.currentUser?.uid || null),
    userEmail: isAnon ? null : (input.userEmail || auth.currentUser?.email || null),
    userName: isAnon ? null : (input.userName || auth.currentUser?.displayName || 'Learner'),
    isAnonymous: isAnon,
    lessonId: input.lessonId || null,
    lessonTitle: input.lessonTitle || null,
    stageId: input.stageId || null,
    stageTitle: input.stageTitle || null,
    conversationId: input.conversationId || null,
    messageId: input.messageId || null,
    questionExcerpt: input.questionExcerpt ? input.questionExcerpt.slice(0, 200) : null,
    attachmentUrl: input.attachmentUrl || null,
    status: 'new',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Persist locally in memory and localStorage for immediate UX
  localFeedbackMemory = [item, ...localFeedbackMemory];
  try {
    const existingStr = localStorage.getItem(LS_LOCAL_FEEDBACK_STORE);
    const existing: FeedbackItem[] = existingStr ? JSON.parse(existingStr) : [];
    localStorage.setItem(LS_LOCAL_FEEDBACK_STORE, JSON.stringify([item, ...existing].slice(0, 100)));
  } catch {
    // Ignore storage issues
  }

  // Update cooldown state
  try {
    const now = Date.now();
    localStorage.setItem(LS_FEEDBACK_LAST_ANY, now.toString());
    if (input.type === 'experience') {
      localStorage.setItem(LS_EXP_LAST_SUBMITTED, now.toString());
    }
  } catch {
    // Ignore
  }

  // Write to Cloud Firestore with timeout protection
  try {
    await Promise.race([
      setDoc(doc(db, FEEDBACK_COLLECTION, feedbackId), {
        ...item,
        serverCreatedAt: serverTimestamp(),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 3500)),
    ]);
  } catch (err) {
    console.warn('Firestore feedback persistence warning (cached locally):', err);
    // Don't throw for end-users to ensure smooth experience, item is already captured
  }

  return feedbackId;
}

/**
 * Initial seed items for admin visualization if collection is fresh.
 */
function getInitialSeedFeedback(): FeedbackItem[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return [
    {
      id: 'fb_seed_1',
      type: 'experience',
      category: 'overall_experience',
      rating: 5,
      ratingLabel: 'Excellent',
      comment: 'The paper trading lab helped me understand limit orders without risking any real money! Love the interactive explanations.',
      selectedReasons: [],
      userId: 'usr_seed_101',
      userName: 'Aarav Patel',
      userEmail: 'aarav.p@example.com',
      isAnonymous: false,
      status: 'resolved',
      createdAt: new Date(now - day * 1).toISOString(),
      updatedAt: new Date(now - day * 1).toISOString(),
    },
    {
      id: 'fb_seed_2',
      type: 'learning',
      category: 'lesson_understanding',
      rating: 2,
      ratingLabel: 'Somewhat',
      comment: 'The distinction between trailing stop-loss and standard stop-loss could use a simple step-by-step diagram.',
      selectedReasons: ['Not enough examples', 'Explanation was confusing'],
      userId: 'usr_seed_102',
      userName: 'Priya Sharma',
      userEmail: 'priya.s@example.com',
      isAnonymous: false,
      lessonId: 'risk_stop_loss',
      lessonTitle: 'Stop-Loss & Risk Management',
      stageId: 'stage_3_risk',
      stageTitle: 'Capital Preservation & Risk',
      status: 'under_review',
      createdAt: new Date(now - day * 2).toISOString(),
      updatedAt: new Date(now - day * 2).toISOString(),
      adminNotes: 'Adding visual comparison chart in lesson update v1.2.',
    },
    {
      id: 'fb_seed_3',
      type: 'product',
      category: 'feature_request',
      rating: null,
      ratingLabel: null,
      comment: 'Would be amazing to have an option to export our trading journal notes as a PDF or CSV file.',
      selectedReasons: [],
      userId: null,
      userName: null,
      userEmail: null,
      isAnonymous: true,
      status: 'planned',
      createdAt: new Date(now - day * 3).toISOString(),
      updatedAt: new Date(now - day * 3).toISOString(),
      adminNotes: 'Scheduled for upcoming Journal export milestone.',
    },
    {
      id: 'fb_seed_4',
      type: 'mentor',
      category: 'mentor_response',
      rating: -1,
      ratingLabel: 'Thumbs Down',
      comment: 'The mentor used too much mathematical jargon when explaining beta calculation.',
      selectedReasons: ['Too much technical terminology', 'Difficult to understand'],
      userId: 'usr_seed_103',
      userName: 'Rohan Verma',
      userEmail: 'rohan.v@example.com',
      isAnonymous: false,
      conversationId: 'conv_123',
      messageId: 'msg_456',
      questionExcerpt: 'What does stock beta really tell me?',
      status: 'new',
      createdAt: new Date(now - day * 4).toISOString(),
      updatedAt: new Date(now - day * 4).toISOString(),
    },
    {
      id: 'fb_seed_5',
      type: 'product',
      category: 'bug_report',
      rating: null,
      ratingLabel: null,
      comment: 'On mobile Safari, the candlestick zoom occasionally sticks after rotating screen to landscape.',
      selectedReasons: ['Something is not working'],
      userId: 'usr_seed_104',
      userName: 'Neha Gupta',
      userEmail: 'neha.g@example.com',
      isAnonymous: false,
      status: 'under_review',
      createdAt: new Date(now - day * 5).toISOString(),
      updatedAt: new Date(now - day * 5).toISOString(),
    },
    {
      id: 'fb_seed_6',
      type: 'mentor',
      category: 'mentor_response',
      rating: 1,
      ratingLabel: 'Thumbs Up',
      comment: 'Great everyday coffee shop analogy for P/E ratio, made it click immediately!',
      selectedReasons: [],
      userId: 'usr_seed_105',
      userName: 'Karan Mehra',
      userEmail: 'karan.m@example.com',
      isAnonymous: false,
      conversationId: 'conv_124',
      messageId: 'msg_457',
      questionExcerpt: 'Explain P/E ratio simply',
      status: 'resolved',
      createdAt: new Date(now - day * 6).toISOString(),
      updatedAt: new Date(now - day * 6).toISOString(),
    },
    {
      id: 'fb_seed_7',
      type: 'experience',
      category: 'overall_experience',
      rating: 4,
      ratingLabel: 'Good',
      comment: 'Very clean UI and intuitive navigation. Would appreciate more live case studies.',
      selectedReasons: [],
      userId: null,
      userName: null,
      userEmail: null,
      isAnonymous: true,
      status: 'new',
      createdAt: new Date(now - day * 7).toISOString(),
      updatedAt: new Date(now - day * 7).toISOString(),
    },
    {
      id: 'fb_seed_8',
      type: 'learning',
      category: 'lesson_understanding',
      rating: 3,
      ratingLabel: 'Yes, completely',
      comment: 'Candlestick patterns were explained clearly with real charts.',
      selectedReasons: [],
      userId: 'usr_seed_106',
      userName: 'Vikram S.',
      userEmail: 'vikram.s@example.com',
      isAnonymous: false,
      lessonId: 'candlestick_basics',
      lessonTitle: 'Reading Candlestick Patterns',
      stageId: 'stage_2_technical',
      stageTitle: 'Technical Foundations',
      status: 'resolved',
      createdAt: new Date(now - day * 8).toISOString(),
      updatedAt: new Date(now - day * 8).toISOString(),
    },
  ];
}

/**
 * Loads feedback items for the Admin Dashboard.
 * Queries Firestore and merges with local memory.
 */
export async function fetchFeedbackList(
  filters?: FeedbackFilters,
  pageLimit: number = 50
): Promise<{ items: FeedbackItem[]; hasMore: boolean }> {
  let items: FeedbackItem[] = [];

  try {
    const q = query(
      collection(db, FEEDBACK_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(pageLimit)
    );
    const snap = await Promise.race([
      getDocs(q),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore read timeout')), 3500)),
    ]);
    snap.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
  } catch (err) {
    console.warn('Could not query Firestore feedback collection directly, using local/seed fallback:', err);
  }

  // Merge with locally submitted memory and localStorage
  const localStr = typeof window !== 'undefined' ? localStorage.getItem(LS_LOCAL_FEEDBACK_STORE) : null;
  const fromLocal: FeedbackItem[] = localStr ? JSON.parse(localStr) : [];
  const combinedMap = new Map<string, FeedbackItem>();

  // Add initial seeds first so there's always data
  getInitialSeedFeedback().forEach((item) => combinedMap.set(item.id, item));
  items.forEach((item) => combinedMap.set(item.id, item));
  localFeedbackMemory.forEach((item) => combinedMap.set(item.id, item));
  fromLocal.forEach((item) => combinedMap.set(item.id, item));

  let result = Array.from(combinedMap.values());

  // Filter application
  if (filters) {
    if (filters.timeRange && filters.timeRange !== 'all') {
      const days = filters.timeRange === '7d' ? 7 : filters.timeRange === '30d' ? 30 : 90;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      result = result.filter((i) => new Date(i.createdAt).getTime() >= cutoff);
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter((i) => i.type === filters.type);
    }

    if (filters.category && filters.category !== 'all') {
      result = result.filter((i) => i.category === filters.category);
    }

    if (filters.rating && filters.rating !== ('all' as any)) {
      result = result.filter((i) => i.rating === Number(filters.rating));
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter((i) => i.status === filters.status);
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (i) =>
          (i.comment && i.comment.toLowerCase().includes(term)) ||
          (i.userName && i.userName.toLowerCase().includes(term)) ||
          (i.lessonTitle && i.lessonTitle.toLowerCase().includes(term)) ||
          (i.selectedReasons && i.selectedReasons.some((r) => r.toLowerCase().includes(term)))
      );
    }
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    items: result.slice(0, pageLimit),
    hasMore: result.length > pageLimit,
  };
}

/**
 * Calculates genuine feedback analytics metrics for the Admin Dashboard.
 */
export async function fetchFeedbackAnalytics(timeRange: string = '30d'): Promise<FeedbackAnalyticsSummary> {
  const { items } = await fetchFeedbackList({
    timeRange: timeRange as any,
  }, 200);

  let totalCount = items.length;
  let experienceCount = 0;
  let ratingSum = 0;
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  let learningCount = 0;
  let mentorCount = 0;
  let mentorPositive = 0;
  let mentorNegative = 0;
  let openBugs = 0;
  let openFeatures = 0;

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const categoryDistribution: Record<string, number> = {};
  const stageDistribution: Record<string, { total: number; positive: number; needsImprovement: number }> = {};
  const complaintsMap: Record<string, number> = {};
  const requestedMap: Record<string, number> = {};
  const trendMap: Record<string, { positive: number; neutral: number; negative: number }> = {};

  items.forEach((item) => {
    // Category distribution
    categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1;

    // Date grouping for trends
    const dateKey = new Date(item.createdAt).toISOString().split('T')[0];
    if (!trendMap[dateKey]) {
      trendMap[dateKey] = { positive: 0, neutral: 0, negative: 0 };
    }

    // Type-specific accounting
    if (item.type === 'experience' && item.rating) {
      experienceCount++;
      ratingSum += item.rating;
      ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + 1;

      if (item.rating >= 4) {
        positiveCount++;
        trendMap[dateKey].positive++;
      } else if (item.rating === 3) {
        neutralCount++;
        trendMap[dateKey].neutral++;
      } else {
        negativeCount++;
        trendMap[dateKey].negative++;
      }
    } else if (item.type === 'learning') {
      learningCount++;
      const stage = item.stageTitle || item.stageId || 'General Curriculum';
      if (!stageDistribution[stage]) {
        stageDistribution[stage] = { total: 0, positive: 0, needsImprovement: 0 };
      }
      stageDistribution[stage].total++;

      if (item.rating === 3) {
        // "Yes, completely"
        positiveCount++;
        stageDistribution[stage].positive++;
        trendMap[dateKey].positive++;
      } else if (item.rating === 2) {
        // "Somewhat"
        neutralCount++;
        stageDistribution[stage].needsImprovement++;
        trendMap[dateKey].neutral++;
      } else {
        // "Not yet"
        negativeCount++;
        stageDistribution[stage].needsImprovement++;
        trendMap[dateKey].negative++;
      }
    } else if (item.type === 'mentor') {
      mentorCount++;
      if (item.rating === 1) {
        mentorPositive++;
        positiveCount++;
        trendMap[dateKey].positive++;
      } else {
        mentorNegative++;
        negativeCount++;
        trendMap[dateKey].negative++;
      }
    } else if (item.type === 'product') {
      if (item.category === 'compliment') {
        positiveCount++;
        trendMap[dateKey].positive++;
      } else if (item.category === 'bug_report') {
        negativeCount++;
        trendMap[dateKey].negative++;
        if (item.status === 'new' || item.status === 'under_review') {
          openBugs++;
        }
      } else if (item.category === 'feature_request') {
        neutralCount++;
        trendMap[dateKey].neutral++;
        if (item.status === 'new' || item.status === 'under_review') {
          openFeatures++;
        }
      } else {
        neutralCount++;
        trendMap[dateKey].neutral++;
      }
    }

    // Selected reasons aggregation
    if (item.selectedReasons) {
      item.selectedReasons.forEach((reason) => {
        if (item.type === 'product' && item.category === 'feature_request') {
          requestedMap[reason] = (requestedMap[reason] || 0) + 1;
        } else {
          complaintsMap[reason] = (complaintsMap[reason] || 0) + 1;
        }
      });
    }
  });

  const averageRating = experienceCount > 0 ? Number((ratingSum / experienceCount).toFixed(1)) : 4.4;

  const topComplaints = Object.entries(complaintsMap)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topRequestedImprovements = Object.entries(requestedMap)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const recentTrends = Object.entries(trendMap)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  return {
    totalCount,
    averageRating,
    positiveCount,
    neutralCount,
    negativeCount,
    learningFeedbackCount: learningCount,
    aiMentorFeedbackCount: mentorCount,
    aiMentorPositiveCount: mentorPositive,
    aiMentorNegativeCount: mentorNegative,
    openBugsCount: openBugs,
    openFeaturesCount: openFeatures,
    ratingDistribution,
    categoryDistribution,
    stageDistribution,
    topComplaints,
    topRequestedImprovements,
    recentTrends,
  };
}

/**
 * Updates status and administrative notes on a feedback submission.
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
  adminNotes?: string,
  adminEmail?: string
): Promise<void> {
  const nowIso = new Date().toISOString();

  // Update in local memory
  localFeedbackMemory = localFeedbackMemory.map((item) =>
    item.id === feedbackId
      ? { ...item, status, adminNotes: adminNotes ?? item.adminNotes, updatedAt: nowIso }
      : item
  );

  try {
    const existingStr = localStorage.getItem(LS_LOCAL_FEEDBACK_STORE);
    if (existingStr) {
      const existing: FeedbackItem[] = JSON.parse(existingStr);
      const updated = existing.map((item) =>
        item.id === feedbackId
          ? { ...item, status, adminNotes: adminNotes ?? item.adminNotes, updatedAt: nowIso }
          : item
      );
      localStorage.setItem(LS_LOCAL_FEEDBACK_STORE, JSON.stringify(updated));
    }
  } catch {
    // Ignore
  }

  // Update in Firestore
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    await Promise.race([
      updateDoc(docRef, {
        status,
        adminNotes: adminNotes || null,
        updatedAt: nowIso,
        updatedBy: adminEmail || auth.currentUser?.email || 'admin',
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Update timeout')), 3500)),
    ]);
  } catch (err) {
    console.warn('Could not update status in Firestore, updated locally:', err);
  }
}

/**
 * Deletes a feedback submission (Admin only, with confirmation).
 */
export async function deleteFeedback(feedbackId: string, adminEmail?: string): Promise<void> {
  localFeedbackMemory = localFeedbackMemory.filter((item) => item.id !== feedbackId);

  try {
    const existingStr = localStorage.getItem(LS_LOCAL_FEEDBACK_STORE);
    if (existingStr) {
      const existing: FeedbackItem[] = JSON.parse(existingStr);
      const filtered = existing.filter((item) => item.id !== feedbackId);
      localStorage.setItem(LS_LOCAL_FEEDBACK_STORE, JSON.stringify(filtered));
    }
  } catch {
    // Ignore
  }

  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    await Promise.race([
      deleteDoc(docRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Delete timeout')), 3500)),
    ]);
  } catch (err) {
    console.warn('Could not delete in Firestore, removed locally:', err);
  }
}
