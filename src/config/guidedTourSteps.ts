export type TourPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface GuidedTourStep {
  id: string;
  route: string;
  target: string;
  sectionLabel: string;
  title: string;
  description: string;
  preferredPlacement: TourPlacement;
  isSidebarTarget?: boolean;
}

export const GUIDED_TOUR_STEPS: GuidedTourStep[] = [
  // 1. Dashboard Welcome & Current Status (Section 01)
  {
    id: 'dashboard-welcome',
    route: 'dashboard',
    target: '[data-tour="dashboard-welcome"]',
    sectionLabel: '01 • Your Journey',
    title: 'Your Learning Home & Status',
    description:
      'This is your learning home—track your investor level, curriculum progress, and daily streak at a glance.',
    preferredPlacement: 'bottom',
  },
  // 2. Continue Where You Left Off (Section 02)
  {
    id: 'continue-learning',
    route: 'dashboard',
    target: '[data-tour="continue-learning"]',
    sectionLabel: '02 • Next Step',
    title: 'Continue Where You Left Off',
    description:
      'Jump straight back into your next recommended lesson and see its core learning objective immediately.',
    preferredPlacement: 'bottom',
  },
  // 3. Core ShareMarket Tools (Section 03)
  {
    id: 'dashboard-core-tools',
    route: 'dashboard',
    target: '[data-tour="dashboard-core-tools"]',
    sectionLabel: '03 • Core Tools',
    title: 'Quick Access to Key Tools',
    description:
      'Open the Paper Trading Lab, Market Mentor, Curriculum, Forensic Lab, or Trading Journal from one clean row.',
    preferredPlacement: 'bottom',
  },
  // 4. 10-Stage Learning Roadmap (Section 04)
  {
    id: 'dashboard-roadmap-matrix',
    route: 'dashboard',
    target: '[data-tour="dashboard-roadmap-matrix"]',
    sectionLabel: '04 • Learning Roadmap',
    title: '10-Stage Learning Journey',
    description:
      'Follow the 10-stage journey from foundational market basics to advanced understanding, or preview locked stages anytime.',
    preferredPlacement: 'top',
  },
  // 5. Curriculum & Learning Page
  {
    id: 'learning-roadmap-stages',
    route: 'roadmap',
    target: '[data-tour="learning-roadmap-stages"]',
    sectionLabel: 'Curriculum & Learn',
    title: 'Structured Lessons & Quizzes',
    description:
      'Learn market concepts through bite-sized lessons, plain-English analogies, and quizzes that unlock advanced modules.',
    preferredPlacement: 'bottom',
  },
  // 6. Paper Trading Lab
  {
    id: 'paper-trading-balance',
    route: 'paper_trading',
    target: '[data-tour="paper-trading-balance"]',
    sectionLabel: 'Paper Trading',
    title: 'Practice with ₹1,00,000 Virtual Money',
    description:
      'Practice investing and trading with virtual cash, simulated stop-loss orders, and zero real financial risk.',
    preferredPlacement: 'bottom',
  },
  // 7. Persistent Floating AI Mentor
  {
    id: 'floating-ai-mentor',
    route: 'dashboard',
    target: '[data-tour="floating-ai-mentor"]',
    sectionLabel: 'AI Companion',
    title: 'Always-Available Market Mentor',
    description:
      'Click this floating shortcut from any screen to ask questions and get everyday analogies whenever something feels confusing.',
    preferredPlacement: 'left',
  },
  // 8. Practice & Challenges (Grouped)
  {
    id: 'practice-challenges',
    route: 'scam_detector',
    target: '[data-tour="scam-detector-card"]',
    sectionLabel: 'Practice & Challenges',
    title: 'Scenarios, Forensics & Challenges',
    description:
      'Test what you have learned through real-world market scenarios, Stock Detective cases, and the Mastery Challenge.',
    preferredPlacement: 'bottom',
  },
  // 9. Journal & Reference Tools (Grouped)
  {
    id: 'journal-and-tools',
    route: 'journal',
    target: '[data-tour="trading-journal-form"]',
    sectionLabel: 'Journal & Glossary',
    title: 'Reflect & Track Improvement',
    description:
      'Log your simulated trade decisions to build calm discipline, and use the sidebar Glossary or Settings anytime.',
    preferredPlacement: 'bottom',
  },
  // 10. Final Step — Start Learning
  {
    id: 'ready-start-learning',
    route: 'dashboard',
    target: '[data-tour="continue-learning"]',
    sectionLabel: 'Start Learning',
    title: "You're Ready to Begin",
    description:
      "You're ready. Start your first lesson and learn at your own pace—your progress saves automatically.",
    preferredPlacement: 'bottom',
  },
];
