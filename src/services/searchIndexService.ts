import { CURRICULUM_MODULES } from '../data/curriculumData';
import { ADMIN_OWNER_EMAIL } from './adminService';
import { Lesson } from '../types';

export type SearchCategory = 'all' | 'curriculum' | 'lessons' | 'tools' | 'actions' | 'admin';

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: 'curriculum' | 'lessons' | 'tools' | 'actions' | 'admin';
  categoryLabel: string;
  path: string;
  keywords: string[];
  tabId?: string;
  lessonId?: string;
  actionId?: string;
  adminOnly?: boolean;
  badge?: string;
  iconName?: string;
}

const RECENT_SEARCHES_KEY = 'smll_recent_search_ids_v1';

// Build static registry of all searchable destinations
export function getSearchIndex(currentUserEmail?: string | null): SearchItem[] {
  const isOwner = currentUserEmail?.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase();
  const items: SearchItem[] = [];

  // 1. Core Feature Tabs
  items.push(
    {
      id: 'tab_dashboard',
      title: 'Home Dashboard',
      description: 'Your learning progress summary, streak tracker, active holdings, and daily market lessons.',
      category: 'tools',
      categoryLabel: 'Workspace',
      path: 'Home → Dashboard',
      tabId: 'dashboard',
      keywords: ['home', 'dashboard', 'progress', 'streak', 'overview', 'summary', 'today', 'portfolio'],
      iconName: 'Compass',
    },
    {
      id: 'tab_roadmap',
      title: 'Learning Roadmap',
      description: 'Complete 7-stage structured curriculum from Financial Foundations to Psychology & Risk.',
      category: 'curriculum',
      categoryLabel: 'Curriculum',
      path: 'Learn → Learning Roadmap',
      tabId: 'roadmap',
      keywords: ['roadmap', 'curriculum', 'stages', 'levels', 'modules', 'syllabus', 'lessons', 'course'],
      iconName: 'BookOpen',
    },
    {
      id: 'tab_final_challenge',
      title: 'Mastery Challenge',
      description: 'The comprehensive final evaluation test covering all 7 stages to prove market readiness.',
      category: 'curriculum',
      categoryLabel: 'Curriculum',
      path: 'Learn → Mastery Challenge',
      tabId: 'final_challenge',
      keywords: ['quiz', 'exam', 'mastery', 'challenge', 'final', 'test', 'evaluation', 'certificate'],
      iconName: 'Trophy',
    },
    {
      id: 'tab_paper_trading',
      title: 'Paper Trading Lab',
      description: 'Realistic virtual stock order simulator with live simulated prices and ₹1,00,000 cash balance.',
      category: 'tools',
      categoryLabel: 'Practice Lab',
      path: 'Practice → Paper Trading Lab',
      tabId: 'paper_trading',
      keywords: ['paper trading', 'trade', 'buy', 'sell', 'orders', 'virtual', 'portfolio', 'stocks', 'nse', 'bse', 'reliance', 'tcs', 'hdfc', 'execution'],
      iconName: 'TrendingUp',
    },
    {
      id: 'tab_journal',
      title: 'Trading Journal',
      description: 'Log trade rationales, emotions, mistake tags, and review performance without financial stress.',
      category: 'tools',
      categoryLabel: 'Practice Lab',
      path: 'Practice → Trading Journal',
      tabId: 'journal',
      keywords: ['journal', 'log', 'diary', 'trades', 'mistakes', 'fomo', 'emotions', 'rationales', 'review'],
      iconName: 'FileText',
    },
    {
      id: 'tab_stock_detective',
      title: 'Stock Detective & Forensic Audit',
      description: 'Interactive case studies to uncover balance sheet red flags, promoter pledges, and debt traps.',
      category: 'tools',
      categoryLabel: 'Practice Lab',
      path: 'Practice → Stock Detective',
      tabId: 'stock_detective',
      keywords: ['detective', 'forensic', 'audit', 'balance sheet', 'red flags', 'debt', 'promoter pledge', 'accounting', 'scandal'],
      iconName: 'Search',
    },
    {
      id: 'tab_scam_detector',
      title: 'Scam & Risk Detector',
      description: 'Audit dubious WhatsApp/Telegram tip channels, Ponzi promises, and pump-and-dump setups.',
      category: 'tools',
      categoryLabel: 'Practice Lab',
      path: 'Practice → Scam & Risk Detector',
      tabId: 'scam_detector',
      keywords: ['scam', 'fraud', 'telegram tips', 'fake advisor', 'pump and dump', 'ponzi', 'risk detector', 'guaranteed returns'],
      iconName: 'ShieldCheck',
    },
    {
      id: 'tab_mentor',
      title: 'Ask Market Mentor (Gemini 2.5)',
      description: 'Interactive AI tutor providing ELI15 analogies, deep dive mechanics, and chart explanations.',
      category: 'tools',
      categoryLabel: 'AI Tutor',
      path: 'Mentor → Ask Market Mentor',
      tabId: 'mentor',
      keywords: ['mentor', 'ai', 'gemini', 'eli15', 'analogy', 'ask', 'tutor', 'doubt', 'chat', 'assistant'],
      iconName: 'Bot',
    },
    {
      id: 'tab_glossary',
      title: 'A-Z Market Glossary',
      description: 'Instant searchable glossary of 50+ stock market concepts, ratios, and technical terms.',
      category: 'tools',
      categoryLabel: 'Reference',
      path: 'Other → A-Z Glossary',
      tabId: 'glossary',
      keywords: ['glossary', 'dictionary', 'definitions', 'pe ratio', 'pb ratio', 'cagr', 'bull', 'bear', 'dividends', 'ipo', 'sip', 'terms'],
      iconName: 'BookA',
    },
    {
      id: 'tab_settings',
      title: 'Settings & Profile',
      description: 'Configure your avatar, username, dark/light theme, audio feedback, and tour replays.',
      category: 'actions',
      categoryLabel: 'Settings',
      path: 'Other → Settings',
      tabId: 'settings',
      keywords: ['settings', 'preferences', 'profile', 'avatar', 'theme', 'dark mode', 'light mode', 'sound', 'reset'],
      iconName: 'Settings',
    }
  );

  // 2. Curriculum Modules (Stages 1 to 7)
  CURRICULUM_MODULES.forEach((mod) => {
    items.push({
      id: `module_${mod.id}`,
      title: `Stage ${mod.levelNumber}: ${mod.title}`,
      description: mod.tagline || `Estimated completion: ${mod.estimatedTime}. Includes ${mod.lessons.length} lessons.`,
      category: 'curriculum',
      categoryLabel: 'Stage Module',
      path: `Roadmap → Stage ${mod.levelNumber}`,
      tabId: 'roadmap',
      keywords: [
        'stage',
        'level',
        `stage ${mod.levelNumber}`,
        `level ${mod.levelNumber}`,
        mod.title.toLowerCase(),
        ...(mod.skills || []).map((s) => s.toLowerCase()),
        ...(mod.conceptsPreview || []).map((c) => c.toLowerCase()),
      ],
      badge: mod.badge,
      iconName: 'BookOpen',
    });

    // 3. Individual Lessons
    mod.lessons.forEach((les, idx) => {
      items.push({
        id: `lesson_${les.id}`,
        title: les.title,
        description: les.shortDesc || les.eli15?.keyTakeaway || `Interactive lesson with quiz in Stage ${mod.levelNumber}.`,
        category: 'lessons',
        categoryLabel: `Stage ${mod.levelNumber} Lesson`,
        path: `Roadmap → Stage ${mod.levelNumber} (${mod.title}) → Lesson ${idx + 1}`,
        tabId: 'lesson_viewer',
        lessonId: les.id,
        keywords: [
          'lesson',
          les.title.toLowerCase(),
          ...(les.interactiveType ? [les.interactiveType.toLowerCase()] : []),
          mod.title.toLowerCase(),
          ...(les.eli15?.analogyTitle ? [les.eli15.analogyTitle.toLowerCase()] : []),
          ...(les.deepDive?.formulasAndMetrics?.map((f) => f.label.toLowerCase()) || []),
        ],
        badge: `${les.readTimeMinutes} min read`,
        iconName: 'FileText',
      });
    });
  });

  // 4. Actionable Utilities & Shortcuts
  items.push(
    {
      id: 'action_replay_guided_tour',
      title: 'Replay Guided Product Tour',
      description: 'Take an interactive step-by-step walkthrough of the ShareMarket interface and its core tools.',
      category: 'actions',
      categoryLabel: 'Quick Action',
      path: 'Actions → Guided Tour',
      actionId: 'replay_guided_tour',
      keywords: ['walkthrough', 'tour', 'guide', 'help', 'tutorial', 'onboarding', 'interface', 'how to use'],
      iconName: 'Compass',
    },
    {
      id: 'action_replay_welcome_tour',
      title: 'Replay App Welcome Overview',
      description: 'View the introductory philosophy and mission cards explaining zero-risk simulated learning.',
      category: 'actions',
      categoryLabel: 'Quick Action',
      path: 'Actions → Welcome Overview',
      actionId: 'replay_welcome_tour',
      keywords: ['welcome', 'overview', 'philosophy', 'intro', 'slides', 'about', 'concept'],
      iconName: 'RotateCcw',
    },
    {
      id: 'action_toggle_theme',
      title: 'Toggle Theme (Light / Dark Mode)',
      description: 'Switch between Modern Dark (black & emerald) and Donezo Light (clean off-white).',
      category: 'actions',
      categoryLabel: 'Quick Action',
      path: 'Actions → Theme Switcher',
      actionId: 'toggle_theme',
      keywords: ['theme', 'dark mode', 'light mode', 'color', 'appearance', 'palette'],
      iconName: 'Palette',
    },
    {
      id: 'action_open_mentor_doubt',
      title: 'Ask AI Mentor a Stock Question',
      description: 'Open the Market Mentor chatbot immediately to ask about any stock concept or market event.',
      category: 'actions',
      categoryLabel: 'Quick Action',
      path: 'Actions → Market Mentor',
      actionId: 'open_mentor',
      keywords: ['ask', 'question', 'doubt', 'help', 'ai', 'mentor'],
      iconName: 'Bot',
    }
  );

  // 5. Protected Admin Destinations (ONLY for owner)
  if (isOwner) {
    items.push(
      {
        id: 'admin_portal_overview',
        title: 'Admin Command Portal',
        description: 'Comprehensive system overview, registered users, KPI health, and platform analytics.',
        category: 'admin',
        categoryLabel: 'Owner Admin',
        path: 'System → Admin Portal',
        tabId: 'admin',
        adminOnly: true,
        badge: '⚡ Owner Only',
        keywords: ['admin', 'owner', 'dashboard', 'analytics', 'kpis', 'dau', 'mau', 'management', 'portal'],
        iconName: 'ShieldAlert',
      },
      {
        id: 'admin_users_view',
        title: 'Admin: Learner Profiles & Firestore Data',
        description: 'View, search, filter, and inspect registered learner accounts and paper portfolios.',
        category: 'admin',
        categoryLabel: 'Owner Admin',
        path: 'System → Admin Portal → Users',
        tabId: 'admin',
        adminOnly: true,
        badge: 'Users',
        keywords: ['admin users', 'learners', 'profiles', 'accounts', 'firestore', 'pii'],
        iconName: 'Users',
      },
      {
        id: 'admin_learning_view',
        title: 'Admin: Curriculum & Quiz Drop-off',
        description: 'Inspect stage completion percentages, quiz failure hotspots, and learning bottlenecks.',
        category: 'admin',
        categoryLabel: 'Owner Admin',
        path: 'System → Admin Portal → Learning',
        tabId: 'admin',
        adminOnly: true,
        badge: 'Pedagogy',
        keywords: ['admin learning', 'dropoff', 'quiz scores', 'bottlenecks', 'curriculum analytics'],
        iconName: 'BookOpen',
      },
      {
        id: 'admin_mentor_view',
        title: 'Admin: AI Mentor Costs & Token Telemetry',
        description: 'Monitor Gemini 2.5 Flash query count, token usage, estimated costs, and latency.',
        category: 'admin',
        categoryLabel: 'Owner Admin',
        path: 'System → Admin Portal → AI Mentor',
        tabId: 'admin',
        adminOnly: true,
        badge: 'AI Telemetry',
        keywords: ['admin ai', 'tokens', 'cost', 'gemini', 'latency', 'queries'],
        iconName: 'Bot',
      }
    );
  }

  return items;
}

/**
 * High-speed, client-side fuzzy scoring search
 */
export function searchFeatures(
  queryText: string,
  category: SearchCategory = 'all',
  currentUserEmail?: string | null
): SearchItem[] {
  const index = getSearchIndex(currentUserEmail);
  const q = queryText.trim().toLowerCase();

  let filtered = index;
  if (category !== 'all') {
    filtered = filtered.filter((item) => item.category === category);
  }

  if (!q) {
    // If no query, return high-priority curated items
    return filtered.slice(0, 8);
  }

  const scored: Array<{ item: SearchItem; score: number }> = [];

  for (const item of filtered) {
    let score = 0;
    const itemTitle = item.title.toLowerCase();
    const itemDesc = item.description.toLowerCase();
    const itemPath = item.path.toLowerCase();

    // Exact title match
    if (itemTitle === q) score += 1000;
    else if (itemTitle.startsWith(q)) score += 500;
    else if (itemTitle.includes(` ${q}`)) score += 350;
    else if (itemTitle.includes(q)) score += 200;

    // Keywords matching
    for (const kw of item.keywords) {
      if (kw === q) score += 300;
      else if (kw.startsWith(q)) score += 150;
      else if (kw.includes(q)) score += 80;
    }

    // Description match
    if (itemDesc.includes(q)) score += 40;

    // Path match
    if (itemPath.includes(q)) score += 30;

    // Multi-token fuzzy match (if user typed multiple words e.g. "risk rules" or "paper buy")
    const queryTokens = q.split(/\s+/).filter(Boolean);
    if (queryTokens.length > 1) {
      const allTokensPresent = queryTokens.every(
        (t) => itemTitle.includes(t) || itemDesc.includes(t) || item.keywords.some((k) => k.includes(t))
      );
      if (allTokensPresent) score += 250;
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}

/**
 * Manage recent searches in localStorage
 */
export function getRecentSearchItems(currentUserEmail?: string | null): SearchItem[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const ids: string[] = JSON.parse(raw);
    const index = getSearchIndex(currentUserEmail);
    const map = new Map(index.map((i) => [i.id, i]));
    return ids.map((id) => map.get(id)).filter((i): i is SearchItem => Boolean(i));
  } catch {
    return [];
  }
}

export function saveRecentSearchId(itemId: string): void {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const updated = [itemId, ...ids.filter((id) => id !== itemId)].slice(0, 6);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore
  }
}
