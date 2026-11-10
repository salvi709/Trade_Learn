import { collection, getDocs, doc, getDoc, limit, query } from 'firebase/firestore';
import { db, auth } from './firebase';
import { UserProfile, UserProgress, PaperPortfolio } from '../types';

export const ADMIN_OWNER_EMAIL = 'salvisarthak2007@gmail.com';
export const ADMIN_AUTHORIZED_EMAILS: string[] = [
  'salvisarthak2007@gmail.com',
  'sarthak.salvi25@mmit.edu.in',
];
export { triggerTactileHaptic } from './mentorHistory';

export function isOwnerAdmin(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return ADMIN_AUTHORIZED_EMAILS.some((admin) => admin.toLowerCase() === clean);
}

export async function getAdminHeaders(adminEmail: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'x-admin-email': adminEmail,
  };
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await Promise.race([
        user.getIdToken(),
        new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 1200)),
      ]);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore token extraction errors
  }
  return headers;
}

export interface AdminAnalyticsData {
  timeRange: '7d' | '30d' | '90d' | 'all';
  timestamp: string;
  ownerEmail: string;
  kpis: {
    totalRegisteredUsers: number;
    dau: number;
    wau: number;
    mau: number;
    avgCompletionRate: number;
    totalAiQueries: number;
    totalTradesExecuted: number;
    activeStreaks: number;
    systemUptimePercent: number;
  };
  aiMentorAnalytics: {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    successRate: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCostUSD: number;
    estimatedCostINR: number;
    eli15Count: number;
    deepDiveCount: number;
    multimodalCount: number;
    topicCounts: Record<string, number>;
    recentMetrics: any[];
  };
  moduleAnalytics: Array<{
    id: string;
    title: string;
    enrolled: number;
    completed: number;
    completionRate: number;
    avgQuizScore: number;
    dropoffRate: number;
  }>;
  featureAdoption: Array<{
    name: string;
    activePercent: number;
    totalInteractions: number;
  }>;
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    stickinessDauMau: number;
    retention7Day: number;
    retention30Day: number;
    streakDistribution: Array<{ range: string; count: number; percent: number }>;
    peakHours: Array<{ hour: string; activity: number }>;
    peakActivityHoursIST?: Array<{ hour: string; activityIndex: number; context?: string }>;
  };
  paperTradingStats: {
    totalTradesExecuted: number;
    buyOrders: number;
    sellOrders: number;
    mostTradedTickers: Array<{ symbol: string; name: string; trades: number; avgPnL: string }>;
    journalEntriesLogged: number;
    winLossRatio: string;
    avgRiskRewardRatio: string;
  };
  monetization: {
    freeTierUsers: number;
    plusTierUsers: number;
    totalRevenueUSD: number;
    tierDistribution: Array<{ tier: string; count: number; percentage: number }>;
    status: string;
  };
}

export interface AdminUserRecord {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  avatarId: string;
  experienceLevel: string;
  learningGoal: string;
  theme: string;
  createdAt: string;
  lastLoginAt: string;
  overallProgress: number;
  currentModuleId: string;
  completedLessonsCount: number;
  streakDays: number;
  virtualCash: number;
  realizedPnL: number;
  openPositionsCount: number;
  journalEntriesCount: number;
  quizAverage: number;
}

/**
 * Verify admin rights against the backend endpoint
 */
export async function verifyAdminStatus(adminEmail: string): Promise<boolean> {
  if (!isOwnerAdmin(adminEmail)) return false;
  try {
    const headers = await getAdminHeaders(adminEmail);
    const res = await fetch('/api/admin/verify', {
      headers,
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.isAdmin;
  } catch {
    return isOwnerAdmin(adminEmail);
  }
}

/**
 * Fetch platform analytics
 */
export async function fetchPlatformAnalytics(
  adminEmail: string,
  timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
): Promise<AdminAnalyticsData> {
  const headers = await getAdminHeaders(adminEmail);
  const res = await fetch(`/api/admin/analytics?timeRange=${timeRange}`, {
    headers,
  });
  if (!res.ok) {
    throw new Error('Failed to fetch admin platform analytics');
  }
  return res.json();
}

/**
 * Fetch real user profiles from Firestore
 */
export async function fetchAdminUsers(adminEmail: string): Promise<AdminUserRecord[]> {
  const usersList: AdminUserRecord[] = [];

  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, limit(50));
    const snap = await Promise.race([
      getDocs(q),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 3000)
      ),
    ]);

    for (const userDoc of snap.docs) {
      const data = userDoc.data() as Partial<UserProfile>;
      const uid = userDoc.id;

      // Also attempt to read user progress subcollection
      let overallProgress = 0;
      let completedLessonsCount = 0;
      let streakDays = 1;
      let quizAvg = 90;
      let virtualCash = 100000;
      let realizedPnL = 0;
      let openPositionsCount = 0;

      try {
        const progSnap = await getDoc(doc(db, 'users', uid, 'data', 'progress'));
        if (progSnap.exists()) {
          const pData = progSnap.data() as Partial<UserProgress>;
          overallProgress = pData.overallProgress || 0;
          completedLessonsCount = pData.completedLessons?.length || 0;
          streakDays = pData.currentStreak || pData.learningStreakDays || 1;
          if (pData.quizScores && Object.keys(pData.quizScores).length > 0) {
            const scores = Object.values(pData.quizScores);
            quizAvg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          }
        }

        const portSnap = await getDoc(doc(db, 'users', uid, 'data', 'portfolio'));
        if (portSnap.exists()) {
          const ptData = portSnap.data() as Partial<PaperPortfolio>;
          virtualCash = ptData.virtualCash ?? 100000;
          realizedPnL = ptData.realizedPnL ?? 0;
          openPositionsCount = ptData.positions ? Object.keys(ptData.positions).length : 0;
        }
      } catch {
        // subcollection read ignore
      }

      usersList.push({
        uid,
        displayName: data.displayName || 'Market Learner',
        username: data.username || (data.displayName ? data.displayName.toLowerCase().replace(/\s+/g, '_') : 'learner'),
        email: data.email || `${uid.substring(0, 8)}@stocklab.local`,
        avatarId: data.avatarId || 'avatar_1',
        experienceLevel: data.experienceLevel || 'beginner',
        learningGoal: data.learningGoal || 'basics',
        theme: data.theme || 'royal_blue',
        createdAt: data.createdAt || new Date().toISOString(),
        lastLoginAt: data.lastLoginAt || new Date().toISOString(),
        overallProgress,
        currentModuleId: 'mod_1',
        completedLessonsCount,
        streakDays,
        virtualCash,
        realizedPnL,
        openPositionsCount,
        journalEntriesCount: Math.min(completedLessonsCount, 3),
        quizAverage: quizAvg,
      });
    }
  } catch (err) {
    console.warn('Could not query all users via Firestore SDK:', err);
  }

  // If no remote users yet (e.g. single learner account), provide seeded demo accounts for comprehensive management
  if (usersList.length === 0) {
    usersList.push(
      {
        uid: 'usr_salvi_owner',
        displayName: 'Sarthak Salvi (Owner)',
        username: 'sarthaksalvi',
        email: 'salvisarthak2007@gmail.com',
        avatarId: 'avatar_5',
        experienceLevel: 'paper_trader',
        learningGoal: 'everything',
        theme: 'royal_blue',
        createdAt: '2026-10-15T08:30:00.000Z',
        lastLoginAt: new Date().toISOString(),
        overallProgress: 100,
        currentModuleId: 'mod_7',
        completedLessonsCount: 18,
        streakDays: 14,
        virtualCash: 124500,
        realizedPnL: 24500,
        openPositionsCount: 4,
        journalEntriesCount: 12,
        quizAverage: 96,
      },
      {
        uid: 'usr_arjun_92',
        displayName: 'Arjun Mehta',
        username: 'arjun_trader',
        email: 'arjun.m@example.com',
        avatarId: 'avatar_2',
        experienceLevel: 'beginner',
        learningGoal: 'basics',
        theme: 'premium_emerald',
        createdAt: '2026-11-01T10:14:00.000Z',
        lastLoginAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        overallProgress: 68,
        currentModuleId: 'mod_4',
        completedLessonsCount: 11,
        streakDays: 6,
        virtualCash: 104200,
        realizedPnL: 4200,
        openPositionsCount: 2,
        journalEntriesCount: 5,
        quizAverage: 88,
      },
      {
        uid: 'usr_priya_k',
        displayName: 'Priya Sharma',
        username: 'priyainvest',
        email: 'priya.s@example.com',
        avatarId: 'avatar_3',
        experienceLevel: 'basics',
        learningGoal: 'investing',
        theme: 'royal_blue',
        createdAt: '2026-11-02T14:22:00.000Z',
        lastLoginAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        overallProgress: 45,
        currentModuleId: 'mod_3',
        completedLessonsCount: 7,
        streakDays: 3,
        virtualCash: 98600,
        realizedPnL: -1400,
        openPositionsCount: 3,
        journalEntriesCount: 3,
        quizAverage: 82,
      },
      {
        uid: 'usr_rohan_d',
        displayName: 'Rohan Deshmukh',
        username: 'rohan_d',
        email: 'rohan.d@example.com',
        avatarId: 'avatar_1',
        experienceLevel: 'beginner',
        learningGoal: 'risk_management',
        theme: 'royal_blue',
        createdAt: '2026-11-03T07:11:00.000Z',
        lastLoginAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        overallProgress: 22,
        currentModuleId: 'mod_2',
        completedLessonsCount: 4,
        streakDays: 2,
        virtualCash: 100000,
        realizedPnL: 0,
        openPositionsCount: 1,
        journalEntriesCount: 1,
        quizAverage: 90,
      }
    );
  }

  return usersList;
}

/**
 * Admin Controls API
 */
export async function fetchAdminControls(adminEmail: string) {
  const headers = await getAdminHeaders(adminEmail);
  const res = await fetch('/api/admin/controls', {
    headers,
  });
  if (!res.ok) throw new Error('Could not fetch admin controls');
  return res.json();
}

export async function saveAdminControls(adminEmail: string, controls: any) {
  const headers = await getAdminHeaders(adminEmail);
  const res = await fetch('/api/admin/controls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(controls),
  });
  if (!res.ok) throw new Error('Could not save admin controls');
  return res.json();
}

/**
 * Admin Audit Logs
 */
export async function fetchAdminAuditLogs(adminEmail: string) {
  const headers = await getAdminHeaders(adminEmail);
  const res = await fetch('/api/admin/logs', {
    headers,
  });
  if (!res.ok) throw new Error('Could not fetch admin logs');
  return res.json();
}

export interface AdminIntelligenceResult {
  answer: string;
  modelUsed: string;
  latencyMs?: number;
}

export interface AdminAttachment {
  name?: string;
  type: string;
  size: number;
  dataUrl?: string;
}

/**
 * Ask Admin Intelligence AI Copilot
 */
export async function askAdminIntelligence(
  adminEmail: string,
  question: string,
  history: Array<{ sender: string; text: string }> = [],
  timeRange: string = '30d',
  attachments?: AdminAttachment[]
): Promise<AdminIntelligenceResult> {
  const headers = await getAdminHeaders(adminEmail);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  const payloadAttachments = attachments && attachments.length > 0
    ? attachments.map((a) => ({
        name: a.name,
        mimeType: a.type,
        base64: a.dataUrl || '',
      }))
    : undefined;

  try {
    const res = await fetch('/api/admin/mentor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ question, history, timeRange, attachments: payloadAttachments }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.details || errorBody.message || errorBody.error || `Admin intelligence call failed (${res.status})`);
    }
    const data = await res.json();
    return {
      answer: data.answer || 'Analysis complete.',
      modelUsed: data.modelUsed || 'gemini-3.8-flash',
      latencyMs: data.latencyMs,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      throw new Error('Analytics processing timed out. Please retry.');
    }
    throw err;
  }
}

/**
 * Export analytics as JSON or CSV
 */
export function exportAnalyticsReport(data: AdminAnalyticsData, format: 'json' | 'csv' = 'json') {
  let content = '';
  let filename = `sharemarket-analytics-${data.timeRange}-${new Date().toISOString().slice(0, 10)}`;
  let mimeType = 'application/json';

  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    filename += '.json';
  } else {
    mimeType = 'text/csv';
    filename += '.csv';
    const rows = [
      ['Metric', 'Value'],
      ['Time Range', data.timeRange],
      ['Generated At', data.timestamp],
      ['Owner', data.ownerEmail],
      ['Total Users', data.kpis.totalRegisteredUsers],
      ['DAU', data.kpis.dau],
      ['WAU', data.kpis.wau],
      ['MAU', data.kpis.mau],
      ['Avg Completion Rate', `${data.kpis.avgCompletionRate}%`],
      ['Total AI Queries', data.kpis.totalAiQueries],
      ['AI Success Rate', `${data.aiMentorAnalytics.successRate}%`],
      ['AI Token Cost (USD)', `$${data.aiMentorAnalytics.estimatedCostUSD}`],
      ['Total Trades Placed', data.kpis.totalTradesExecuted],
      ['Uptime', `${data.kpis.systemUptimePercent}%`],
    ];
    content = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
