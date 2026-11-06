export type AppTheme = 'royal_blue' | 'premium_emerald';

export type ExperienceLevel = 'beginner' | 'basics' | 'charts' | 'paper_trader';

export type LearningGoal = 
  | 'basics' 
  | 'investing' 
  | 'trading' 
  | 'technical_analysis' 
  | 'risk_management' 
  | 'everything';

export type ProfileCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

export interface UserProfile {
  uid: string;
  displayName: string;
  username?: string;
  email: string;
  photoURL?: string;
  avatarId?: string;
  avatarSeed?: string;
  birthday?: string;
  currency?: ProfileCurrency;
  experienceLevel?: ExperienceLevel;
  learningGoal?: LearningGoal;
  learningGoals?: string[];
  theme?: AppTheme;
  onboardingCompleted: boolean;
  appIntroductionCompleted?: boolean;
  guidedTourCompleted?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserProgress {
  overallProgress: number; // 0 to 100
  currentModuleId: string;
  currentLessonId: string;
  completedLessons: string[]; // lesson IDs
  completedModules: string[]; // module IDs
  quizScores?: Record<string, number>; // lessonId -> percentage score (0-100)
  quizAnswers?: Record<string, Record<string, number>>; // lessonId -> { questionId: selectedOptionIndex }
  lastVisitedAt: string;
  learningStreakDays: number;
  lastStreakDate?: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  todayCompleted: boolean;
  totalActiveDays: number;
  weeklyActivity?: Record<string, boolean>;
}

export interface QuizAttempt {
  quizId: string;
  score: number; // 0-100
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
}

export interface Position {
  symbol: string;
  name: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  stopLoss?: number;
  targetPrice?: number;
}

export interface PaperPortfolio {
  virtualCash: number; // starts at 1,00,000 (INR)
  realizedPnL: number;
  positions: Record<string, Position>;
  lastUpdated: string;
}

export interface TradeOrder {
  id: string;
  timestamp: string;
  symbol: string;
  name: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
  stopLoss?: number;
  targetPrice?: number;
  realizedPnL?: number;
}

export interface JournalEntry {
  id: string;
  tradeId?: string;
  symbol?: string;
  reasoning: string;
  emotions: string;
  lessonLearned: string;
  mistakes: string;
  followedPlan: boolean;
  timestamp: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'learning' | 'discipline' | 'analysis' | 'simulation';
  unlockedAt?: string;
}

export interface UserSettings {
  theme: AppTheme;
  defaultExplanationMode: 'eli15' | 'deep_dive';
  soundEffects: boolean;
  notifications: boolean;
  audioFeedback?: boolean;
}

// Curriculum structures
export type InteractiveType = 
  | 'ownership_pizza' 
  | 'order_book' 
  | 'risk_calculator' 
  | 'candlestick_anatomy' 
  | 'expectation_simulator' 
  | 'revenue_waterfall'
  | 'compound_growth'
  | 'none';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Eli15Content {
  analogyTitle: string;
  explanation: string;
  realLifeAnalogy: string;
  keyTakeaway: string;
}

export interface DeepDiveContent {
  technicalOverview: string;
  formulasAndMetrics?: { label: string; formula: string; detail: string }[];
  marketMechanics: string;
  riskInsight: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  shortDesc: string;
  readTimeMinutes: number;
  eli15: Eli15Content;
  deepDive: DeepDiveContent;
  interactiveType?: InteractiveType;
  quiz: QuizQuestion[];
}

export type ModuleStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';

export interface Module {
  id: string;
  levelNumber: number;
  title: string;
  tagline: string;
  badge: string;
  icon?: string;
  prerequisites: string[]; // IDs of required prerequisite modules
  estimatedTime: string; // e.g. '~35 minutes'
  skills: string[]; // key skills gained
  conceptsPreview: string[]; // preview of core concepts
  lessons: Lesson[];
}

// Market Data structures
export interface FictionalStock {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  description: string;
  marketCap?: string;
  marketCapCr?: number;
  peRatio: number;
  pbRatio?: number;
  roe: string;
  eps?: number;
  revenue?: string;
  netProfit?: string;
  debtToEquity: number;
  low52w: number;
  high52w: number;
  priceHistory: { time: string; price: number; volume?: number }[];
}

export interface GlossaryTerm {
  term: string;
  category: string;
  definition: string;
  example: string;
  relatedTerms?: string[];
}

export interface RedFlagScenario {
  id: string;
  title: string;
  channel: string;
  sender: string;
  message: string;
  clues: string[];
  explanation: string;
  verdict: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK';
}

export interface WhatWouldYouDoScenario {
  id: string;
  category: string;
  situation: string;
  options: {
    text: string;
    scoreExplanation: string;
    isDisciplined: boolean;
  }[];
}
