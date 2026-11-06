import React from 'react';

export interface AvatarOption {
  id: string;
  name: string;
  role: string;
  description: string;
  category: 'investing' | 'trading' | 'analytics' | 'academic' | 'management';
  gradient: string;
  badgeColor: string;
  iconName: string;
  svgIcon: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'avatar_investor',
    name: 'Long-Term Investor',
    role: 'Compound Growth & Value',
    description: 'Patient capital builder focused on high-quality businesses and dividend compounding.',
    category: 'investing',
    gradient: 'from-blue-600 to-indigo-700',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    iconName: 'Landmark',
    svgIcon: '🏛️'
  },
  {
    id: 'avatar_trader',
    name: 'Discipline Trader',
    role: 'Price Action & Momentum',
    description: 'Methodical participant executing planned setups with strict risk controls and position sizing.',
    category: 'trading',
    gradient: 'from-emerald-600 to-teal-700',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    iconName: 'TrendingUp',
    svgIcon: '📈'
  },
  {
    id: 'avatar_analyst',
    name: 'Market Analyst',
    role: 'Fundamental Valuation',
    description: 'Forensic balance sheet reader who dissects revenue waterfalls, P/E multiples, and ROCE.',
    category: 'analytics',
    gradient: 'from-violet-600 to-purple-700',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    iconName: 'Building2',
    svgIcon: '🏢'
  },
  {
    id: 'avatar_chartist',
    name: 'Chart Analyst',
    role: 'Technical Structure',
    description: 'Specialist in candlestick anatomy, support/resistance polarity, and volume confirmation.',
    category: 'trading',
    gradient: 'from-cyan-600 to-blue-700',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    iconName: 'LineChart',
    svgIcon: '📊'
  },
  {
    id: 'avatar_student',
    name: 'Finance Student',
    role: 'Continuous Learner',
    description: 'Curious learner building financial foundations, inflation defense, and compounding intuition.',
    category: 'academic',
    gradient: 'from-amber-600 to-orange-700',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    iconName: 'GraduationCap',
    svgIcon: '🎓'
  },
  {
    id: 'avatar_data',
    name: 'Data Analyst',
    role: 'Quantitative Researcher',
    description: 'Number cruncher studying market depth, statistical expectancy, and bid-ask liquidity.',
    category: 'analytics',
    gradient: 'from-slate-700 to-slate-900',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    iconName: 'Database',
    svgIcon: '🔢'
  },
  {
    id: 'avatar_risk',
    name: 'Risk Manager',
    role: 'Capital Survival Guardian',
    description: 'Defense-first protector ensuring the 1% risk rule and drawdown recovery math are respected.',
    category: 'management',
    gradient: 'from-rose-600 to-red-700',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    iconName: 'ShieldCheck',
    svgIcon: '🛡️'
  },
  {
    id: 'avatar_researcher',
    name: 'Market Researcher',
    role: 'Forensic Scam Detective',
    description: 'Watchdog identifying promoter pledging red flags, auditor resignations, and WhatsApp tips fraud.',
    category: 'analytics',
    gradient: 'from-indigo-600 to-blue-800',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    iconName: 'Search',
    svgIcon: '🔍'
  },
  {
    id: 'avatar_pro',
    name: 'Finance Professional',
    role: 'Strategic Capital Allocator',
    description: 'Pragmatic strategist aligning multi-asset allocation, macro trends, and tax efficiency.',
    category: 'investing',
    gradient: 'from-emerald-700 to-green-800',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    iconName: 'Briefcase',
    svgIcon: '💼'
  },
  {
    id: 'avatar_beginner',
    name: 'Beginner Investor',
    role: 'First-Time Explorer',
    description: 'Starting the journey to replace money anxiety with structured knowledge and safe simulation.',
    category: 'academic',
    gradient: 'from-blue-500 to-teal-600',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    iconName: 'Sparkles',
    svgIcon: '🌱'
  }
];

export const DEFAULT_AVATAR_ID = 'avatar_investor';

export function getAvatarById(avatarId?: string): AvatarOption {
  return AVATAR_OPTIONS.find(a => a.id === avatarId) || AVATAR_OPTIONS[0];
}
