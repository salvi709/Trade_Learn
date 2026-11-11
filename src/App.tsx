import React, { useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  UserProgress, 
  PaperPortfolio, 
  UserSettings, 
  Lesson, 
  Module, 
  TradeOrder, 
  JournalEntry, 
  AppTheme 
} from './types';
import { 
  auth, 
  onAuthStateChange, 
  signOutUser,
  fetchUserProfile,
  saveUserProfile,
  saveUserProfileWithUsername,
  fetchUserProgress,
  saveUserProgress,
  fetchPaperPortfolio,
  savePaperPortfolio,
  fetchTradeHistory,
  saveTradeOrder,
  fetchJournalEntries,
  saveJournalEntry,
  fetchUserSettings,
  saveUserSettings,
  resetUserData,
  DEFAULT_PROGRESS,
  DEFAULT_PORTFOLIO,
  DEFAULT_SETTINGS
} from './services/firebase';
import { CURRICULUM_MODULES, getModuleStatus, isLessonUnlocked } from './data/curriculumData';
import { FICTIONAL_STOCKS } from './data/marketData';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DEFAULT_AVATAR_ID } from './config/avatars';
import { APP_NAME } from './config/branding';

// UI Components
import SaaSTemplate from '@/components/ui/saa-s-template';
import { NavigationLayout } from './components/layout/NavigationLayout';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileSetupView } from './components/auth/ProfileSetupView';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { LearningRoadmap } from './components/roadmap/LearningRoadmap';
import { LessonViewer } from './components/learning/LessonViewer';
import { UnlockCelebrationModal } from './components/learning/UnlockCelebrationModal';
import { PaperTradingLab } from './components/paperTrading/PaperTradingLab';
import { TradingJournal } from './components/journal/TradingJournal';
import { StockDetectiveView } from './components/analysis/StockDetectiveView';
import { ScamDetectorView } from './components/scams/ScamDetectorView';
import { FinalChallengeView } from './components/challenge/FinalChallengeView';
import { GlossaryView } from './components/glossary/GlossaryView';
import { MarketMentor } from './components/mentor/MarketMentor';
import { FloatingAIMentor } from './components/mentor/FloatingAIMentor';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminAccessDenied } from './components/admin/AdminAccessDenied';
import { ADMIN_OWNER_EMAIL, isOwnerAdmin } from './services/adminService';
import {
  MentorConversation,
  MentorMessage,
  MentorAttachment,
  fetchUserConversations,
  fetchConversationMessages,
  createMentorConversation,
  saveMentorMessage,
  renameMentorConversation,
  deleteMentorConversation,
  deleteMentorMessage,
  clearAllMentorConversations,
  updateMentorMessageAndTruncate,
} from './services/mentorHistory';
import { SettingsView } from './components/settings/SettingsView';
import { AppOverviewTour } from './components/auth/AppOverviewTour';
import { InteractiveGuidedTour } from './components/tour/InteractiveGuidedTour';
import { StartupBrandReveal } from './components/branding/StartupBrandReveal';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { normalizeStreakOnLoad, recordLearningActivity, getLocalDateString } from './utils/streak';
import { AlertCircle } from 'lucide-react';
import { ExperienceFeedbackModal } from './components/feedback/ExperienceFeedbackModal';
import { LearningFeedbackModal } from './components/feedback/LearningFeedbackModal';
import { DetailedFeedbackModal } from './components/feedback/DetailedFeedbackModal';
import { 
  canShowExperienceFeedback, 
  canShowLearningFeedback, 
  recordFeedbackPromptShown 
} from './services/feedbackService';

function AppContent() {
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [showStartupReveal, setShowStartupReveal] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('restart') === 'true') return true;
      return !sessionStorage.getItem('tq_startup_revealed');
    } catch {
      return true;
    }
  });

  const [showTour, setShowTour] = useState<boolean>(false);
  const [showGuidedTour, setShowGuidedTour] = useState<boolean>(false);
  const [forceMobileSidebarOpen, setForceMobileSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  
  // Feedback System State
  const [showDetailedFeedback, setShowDetailedFeedback] = useState<boolean>(false);
  const [showExperienceFeedback, setShowExperienceFeedback] = useState<boolean>(false);
  const [learningFeedbackTarget, setLearningFeedbackTarget] = useState<{
    lessonId: string;
    lessonTitle: string;
    stageId?: string;
    stageTitle?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/admin') return 'admin';
        const params = new URLSearchParams(window.location.search);
        if (params.get('tab') === 'admin') return 'admin';
      }
    } catch {}
    return 'dashboard';
  });

  // Global keyboard shortcuts (Cmd+K, Ctrl+K, or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      try {
        if (window.location.pathname === '/admin') {
          setActiveTab('admin');
        } else if (window.location.pathname === '/' || window.location.pathname === '') {
          setActiveTab((prev) => (prev === 'admin' ? 'dashboard' : prev));
        }
      } catch {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    try {
      if (tabId === 'admin') {
        window.history.pushState({}, '', '/admin');
      } else if (window.location.pathname === '/admin') {
        window.history.pushState({}, '', '/');
      }
    } catch {}
  };
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const defaultWelcomeMessage: MentorMessage = {
    id: 'welcome',
    sender: 'mentor',
    text: `Hey there! 👋 I'm your Market Mentor & personal learning companion in ${APP_NAME}.\n\nThink of me as your dedicated financial study buddy: whether you're wondering how P/E ratios work, how stop-loss orders protect your hard-earned savings, or how to spot traps in the market, we're in this together. I break everything down using clean, everyday analogies with zero jargon!\n\nWhat's on your mind today? Ask me any question below!`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
  };

  const [mentorInitialPrompt, setMentorInitialPrompt] = useState<string | undefined>(undefined);
  const [mentorConversations, setMentorConversations] = useState<MentorConversation[]>([]);
  const [activeMentorConversationId, setActiveMentorConversationId] = useState<string | null>(null);
  const [isSwitchingConversation, setIsSwitchingConversation] = useState<boolean>(false);
  const [mentorMessages, setMentorMessages] = useState<MentorMessage[]>([defaultWelcomeMessage]);
  const [mentorLoading, setMentorLoading] = useState<boolean>(false);
  const [mentorHasUnreadResponse, setMentorHasUnreadResponse] = useState<boolean>(false);
  const [mentorExplanationMode, setMentorExplanationMode] = useState<'eli15' | 'deep_dive'>('eli15');
  const activeTabRef = useRef<string>('dashboard');
  const [journalDefaultSymbol, setJournalDefaultSymbol] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [celebrationModule, setCelebrationModule] = useState<Module | null>(null);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Main application state
  const [profile, setProfile] = useState<UserProfile>({
    uid: 'local_learner',
    email: 'learner@stocklab.local',
    displayName: 'Learner',
    avatarId: DEFAULT_AVATAR_ID,
    onboardingCompleted: false,
    theme: 'royal_blue',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  });

  const [progress, setProgress] = useState<UserProgress>(() => {
    const today = getLocalDateString();
    return {
      overallProgress: 0,
      completedLessons: [],
      completedModules: [],
      currentModuleId: 'mod_1',
      currentLessonId: 'les_1_1',
      quizScores: {},
      quizAnswers: {},
      learningStreakDays: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: today,
      todayCompleted: false,
      totalActiveDays: 0,
      weeklyActivity: {},
      lastVisitedAt: new Date().toISOString(),
    };
  });

  const [portfolio, setPortfolio] = useState<PaperPortfolio>(DEFAULT_PORTFOLIO);
  const [tradeHistory, setTradeHistory] = useState<TradeOrder[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Restart URL handler
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('restart') === 'true') {
      localStorage.removeItem('smll_onboarding_completed_v2');
      localStorage.removeItem('smll_tour_completed_v2');
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      setShowTour(false);
      return;
    }
  }, []);

  // Dedicated profile loader: Loads profile and user data deterministically
  const loadUserProfileData = async (user: any) => {
    if (user.isGuest) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const existing = await fetchUserProfile(user.uid);

      if (existing && existing.onboardingCompleted) {
        // Determine whether App Overview Tour is complete for this user:
        // 1. Explicitly marked true in profile or user-scoped storage
        // 2. Legacy profile where appIntroductionCompleted was undefined
        const hasCompletedTourFlag =
          existing.appIntroductionCompleted === true ||
          localStorage.getItem(`smll_tour_completed_${user.uid}`) === 'true';
        const isLegacyCompletedProfile =
          existing.appIntroductionCompleted === undefined &&
          localStorage.getItem(`smll_tour_pending_${user.uid}`) !== 'true';

        const resolvedTourCompleted = hasCompletedTourFlag || isLegacyCompletedProfile;

        const hasCompletedGuidedTourFlag =
          existing.guidedTourCompleted === true ||
          localStorage.getItem(`smll_guided_tour_completed_${user.uid}`) === 'true';
        const isLegacyGuidedTourProfile =
          existing.guidedTourCompleted === undefined &&
          localStorage.getItem(`smll_guided_tour_pending_${user.uid}`) !== 'true';

        const resolvedGuidedTourCompleted =
          hasCompletedGuidedTourFlag || isLegacyGuidedTourProfile;

        const resolvedProfile: UserProfile = {
          ...existing,
          onboardingCompleted: true,
          appIntroductionCompleted: resolvedTourCompleted,
          guidedTourCompleted: resolvedGuidedTourCompleted,
        };

        setProfile(resolvedProfile);
        if (existing.theme) {
          const userTheme = existing.theme;
          setTheme(userTheme);
          setSettings((prev) => ({ ...prev, theme: userTheme }));
        }

        // Parallel load of auxiliary user data
        try {
          const [uProgress, uPortfolio, uSettings, uTrades, uJournal] = await Promise.all([
            fetchUserProgress(user.uid),
            fetchPaperPortfolio(user.uid),
            fetchUserSettings(user.uid),
            fetchTradeHistory(user.uid),
            fetchJournalEntries(user.uid),
          ]);
          setProgress(uProgress);
          setPortfolio(uPortfolio);
          setSettings((prev) => ({ ...prev, ...uSettings, theme: existing.theme || uSettings.theme || prev.theme }));
          setTradeHistory(uTrades);
          setJournalEntries(uJournal);
          void loadMentorHistory(user.uid);
        } catch (loadErr) {
          console.warn('Firestore user data load notice:', loadErr);
        }

        setProfileLoading(false);
      } else {
        // New user or profile setup not completed
        const initialTheme: AppTheme =
          existing?.theme === 'premium_emerald' || existing?.theme === 'royal_blue'
            ? existing.theme
            : 'royal_blue';
        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || existing?.email || '',
          displayName:
            existing?.displayName ||
            user.displayName ||
            (user.email ? user.email.split('@')[0] : 'Learner'),
          ...(user.photoURL || existing?.photoURL ? { photoURL: user.photoURL || existing?.photoURL } : {}),
          avatarId: existing?.avatarId || DEFAULT_AVATAR_ID,
          currency: existing?.currency || 'INR',
          theme: initialTheme,
          ...(existing || {}),
          onboardingCompleted: false,
          appIntroductionCompleted: false,
          guidedTourCompleted: false,
          createdAt: existing?.createdAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        setTheme(initialTheme);
        setSettings((prev) => ({ ...prev, theme: initialTheme }));
        setProfile(initialProfile);
        setProfileLoading(false);
      }
    } catch (err: any) {
      console.warn('Profile restore error:', err);
      setProfileError(err?.message || 'Database connection error. Please try again.');
      setProfileLoading(false);
    }
  };

  // Single authoritative Firebase auth listener
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChange(async (user: any) => {
      if (!isMounted) return;
      if (user && !user.isGuest) {
        setProfileLoading(true);
      }
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        await loadUserProfileData(user);
      } else {
        setProfileLoading(false);
        setProfileError(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Enter as guest handler
  const handleEnterAsGuest = () => {
    const guestUser = {
      uid: 'guest_user',
      email: 'guest@sharemarket.local',
      displayName: 'Guest Learner',
      isGuest: true,
    };
    setTheme('royal_blue');
    setSettings((prev) => ({ ...prev, theme: 'royal_blue' }));
    setCurrentUser(guestUser);
    setProfile({
      uid: 'guest_user',
      email: 'guest@sharemarket.local',
      displayName: 'Guest Learner',
      avatarId: DEFAULT_AVATAR_ID,
      onboardingCompleted: false,
      appIntroductionCompleted: false,
      guidedTourCompleted: false,
      theme: 'royal_blue',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    });
    setProfileLoading(false);
    setProfileError(null);
    void loadMentorHistory('guest_user');
  };

  // Finish profile setup handler: Persists profile and transitions to App Overview for new users
  const handleFinishProfileSetup = async (completedProfile: Partial<UserProfile>) => {
    const targetUid = currentUser ? currentUser.uid : profile.uid;
    const nowIso = new Date().toISOString();
    const newProfile: UserProfile = {
      ...profile,
      ...completedProfile,
      uid: targetUid,
      email: currentUser?.email || profile.email,
      displayName: completedProfile.displayName?.trim() || profile.displayName || 'Learner',
      onboardingCompleted: true,
      appIntroductionCompleted: false,
      guidedTourCompleted: false,
      createdAt: profile.createdAt || nowIso,
      lastLoginAt: nowIso,
    };

    if (completedProfile.theme) {
      const userTheme = completedProfile.theme;
      setTheme(userTheme);
      setSettings((prev) => ({ ...prev, theme: userTheme }));
    }

    // Mark first-time App Overview and Guided Tour as pending for this user
    if (targetUid) {
      localStorage.setItem(`smll_tour_pending_${targetUid}`, 'true');
      localStorage.removeItem(`smll_tour_completed_${targetUid}`);
      localStorage.setItem(`smll_guided_tour_pending_${targetUid}`, 'true');
      localStorage.removeItem(`smll_guided_tour_completed_${targetUid}`);
    }

    if (currentUser && !currentUser.isGuest) {
      if (newProfile.username) {
        const res = await saveUserProfileWithUsername(targetUid, newProfile);
        if (!res.success) {
          throw new Error(res.error || 'Failed to claim username.');
        }
      } else {
        await saveUserProfile(targetUid, newProfile);
      }

      // Seed initial progress and settings
      await Promise.allSettled([
        saveUserProgress(targetUid, progress),
        savePaperPortfolio(targetUid, portfolio),
        saveUserSettings(targetUid, { ...settings, theme: completedProfile.theme || settings.theme }),
      ]);
    }

    // Update profile state: onboardingCompleted = true, appIntroductionCompleted = false
    // Routing will deterministically render AppOverviewTour next before Dashboard
    setProfile(newProfile);
  };

  // Sign out / Logout handler
  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Sign out note:', e);
    }
    setCurrentUser(null);
    setProfileLoading(false);
    setProfileError(null);
    setShowTour(false);
    setShowGuidedTour(false);
    setForceMobileSidebarOpen(false);

    // Clean reset state
    setProgress(DEFAULT_PROGRESS);
    setPortfolio(DEFAULT_PORTFOLIO);
    setSettings(DEFAULT_SETTINGS);
    setTradeHistory([]);
    setJournalEntries([]);
    setProfile({
      uid: 'local_learner',
      email: '',
      displayName: 'Learner',
      avatarId: DEFAULT_AVATAR_ID,
      onboardingCompleted: false,
      appIntroductionCompleted: false,
      guidedTourCompleted: false,
      theme: 'royal_blue',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    });
    setMentorConversations([]);
    setActiveMentorConversationId(null);
    setMentorMessages([defaultWelcomeMessage]);
  };

  // Complete first-time onboarding App Overview Tour -> Transition into Interactive Guided Tour
  const handleFinishTour = async () => {
    setShowTour(false);
    const targetUid = currentUser ? currentUser.uid : profile.uid;
    if (targetUid) {
      localStorage.setItem(`smll_tour_completed_${targetUid}`, 'true');
      localStorage.removeItem(`smll_tour_pending_${targetUid}`);
    }
    const updatedProfile: UserProfile = {
      ...profile,
      onboardingCompleted: true,
      appIntroductionCompleted: true,
      guidedTourCompleted: false,
    };
    setProfile(updatedProfile);
    setActiveTab('dashboard');
    if (currentUser && !currentUser.isGuest) {
      await saveUserProfile(currentUser.uid, updatedProfile);
    }
  };

  // Complete or skip Interactive Guided Product Tour -> Persist & return to Dashboard
  const handleFinishGuidedTour = async () => {
    setShowGuidedTour(false);
    setForceMobileSidebarOpen(false);
    const targetUid = currentUser ? currentUser.uid : profile.uid;
    if (targetUid) {
      localStorage.setItem(`smll_guided_tour_completed_${targetUid}`, 'true');
      localStorage.removeItem(`smll_guided_tour_pending_${targetUid}`);
    }
    const updatedProfile: UserProfile = {
      ...profile,
      onboardingCompleted: true,
      appIntroductionCompleted: true,
      guidedTourCompleted: true,
    };
    setProfile(updatedProfile);
    setActiveTab('dashboard');
    if (currentUser && !currentUser.isGuest) {
      await saveUserProfile(currentUser.uid, updatedProfile);
    }
  };

  // Close manual Replay App Tour from Settings without altering onboarding/progress state
  const handleCloseReplayTour = () => {
    setShowTour(false);
  };

  // Handler for completing a lesson
  const handleCompleteLesson = (lessonId: string, quizScore?: number, answers?: Record<string, number>) => {
    // Record current locked modules to check if a new module unlocks
    const prevLockedModuleIds = new Set(
      CURRICULUM_MODULES
        .filter((m) => getModuleStatus(m, progress.completedLessons, progress.completedModules) === 'LOCKED')
        .map((m) => m.id)
    );

    const updatedCompleted = Array.from(new Set([...progress.completedLessons, lessonId]));
    const updatedScores = quizScore !== undefined 
      ? { ...(progress.quizScores || {}), [lessonId]: quizScore } 
      : progress.quizScores;

    const updatedAnswers = answers !== undefined
      ? { ...(progress.quizAnswers || {}), [lessonId]: answers }
      : progress.quizAnswers;

    // Check which modules are fully finished
    const newlyCompletedModules: string[] = [];
    CURRICULUM_MODULES.forEach((mod) => {
      const allLessonsDone = mod.lessons.every((l) => updatedCompleted.includes(l.id));
      if (allLessonsDone && !progress.completedModules.includes(mod.id)) {
        newlyCompletedModules.push(mod.id);
      }
    });

    const updatedCompletedModules = Array.from(
      new Set([...progress.completedModules, ...newlyCompletedModules])
    );

    // Calculate total lessons and overall percentage
    const totalLessons = CURRICULUM_MODULES.reduce((acc, m) => acc + m.lessons.length, 0);
    const overallProgress = Math.min(100, Math.round((updatedCompleted.length / totalLessons) * 100));

    // Register streak increment for meaningful activity
    const { updatedProgress: streakProgress } = recordLearningActivity(progress);

    const newProgress: UserProgress = {
      ...streakProgress,
      overallProgress,
      completedLessons: updatedCompleted,
      completedModules: updatedCompletedModules,
      quizScores: updatedScores,
      quizAnswers: updatedAnswers,
      lastVisitedAt: new Date().toISOString(),
    };

    setProgress(newProgress);
    if (currentUser && !currentUser.isGuest) {
      saveUserProgress(currentUser.uid, newProgress);
    }

    // Check if any previously locked module is now newly unlocked
    const newlyUnlocked = CURRICULUM_MODULES.find((m) => {
      const wasLocked = prevLockedModuleIds.has(m.id);
      const isNowAvailable = getModuleStatus(m, updatedCompleted, updatedCompletedModules) === 'AVAILABLE';
      return wasLocked && isNowAvailable;
    });

    if (newlyUnlocked) {
      setCelebrationModule(newlyUnlocked);
    }

    // Smart Timing: Check for milestone learning comprehension feedback
    const activeMod = CURRICULUM_MODULES.find((m) => m.lessons.some((l) => l.id === lessonId));
    const activeLes = activeMod?.lessons.find((l) => l.id === lessonId);
    if (activeLes && canShowLearningFeedback(lessonId, updatedCompleted.length, newlyCompletedModules.length > 0)) {
      setTimeout(() => {
        recordFeedbackPromptShown('learning', lessonId);
        setLearningFeedbackTarget({
          lessonId,
          lessonTitle: activeLes.title,
          stageId: activeMod?.id,
          stageTitle: activeMod?.title,
        });
      }, 1800);
    }
  };

  // Smart Timing: Check for periodic overall experience feedback (7-14 days cooldown, never on turn 0)
  useEffect(() => {
    if (
      showTour ||
      showGuidedTour ||
      activeLesson ||
      learningFeedbackTarget ||
      showDetailedFeedback ||
      showExperienceFeedback
    ) {
      return;
    }

    const timer = setTimeout(() => {
      if (canShowExperienceFeedback(progress.completedLessons.length)) {
        recordFeedbackPromptShown('experience');
        setShowExperienceFeedback(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [
    progress.completedLessons.length,
    showTour,
    showGuidedTour,
    activeLesson,
    learningFeedbackTarget,
    showDetailedFeedback,
    showExperienceFeedback,
  ]);

  // Handler for paper trade execution
  const handleExecuteTrade = (order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    stopLoss?: number;
    targetPrice?: number;
  }) => {
    const orderTotal = order.quantity * order.price;
    const liveStock = FICTIONAL_STOCKS.find((s) => s.symbol === order.symbol);
    const existingPosition = portfolio.positions[order.symbol];

    let newVirtualCash = portfolio.virtualCash;
    const newPositions = { ...portfolio.positions };
    let realizedGainLoss = 0;

    if (order.side === 'BUY') {
      if (orderTotal > portfolio.virtualCash) {
        return { success: false, message: 'Insufficient virtual cash.' };
      }

      newVirtualCash -= orderTotal;
      if (existingPosition) {
        const totalOldCost = existingPosition.shares * existingPosition.averagePrice;
        const totalNewShares = existingPosition.shares + order.quantity;
        const newAvgPrice = (totalOldCost + orderTotal) / totalNewShares;

        newPositions[order.symbol] = {
          ...existingPosition,
          shares: totalNewShares,
          averagePrice: newAvgPrice,
          currentPrice: order.price,
          unrealizedPnL: (order.price - newAvgPrice) * totalNewShares,
          unrealizedPnLPercent: ((order.price - newAvgPrice) / newAvgPrice) * 100,
          stopLoss: order.stopLoss,
          targetPrice: order.targetPrice,
        };
      } else {
        newPositions[order.symbol] = {
          symbol: order.symbol,
          name: liveStock?.name || order.symbol,
          shares: order.quantity,
          averagePrice: order.price,
          currentPrice: order.price,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          stopLoss: order.stopLoss,
          targetPrice: order.targetPrice,
        };
      }
    } else {
      // SELL
      if (!existingPosition || existingPosition.shares < order.quantity) {
        return { success: false, message: 'Not enough shares owned to execute sell.' };
      }

      const costBasis = order.quantity * existingPosition.averagePrice;
      realizedGainLoss = orderTotal - costBasis;
      newVirtualCash += orderTotal;

      const remainingShares = existingPosition.shares - order.quantity;
      if (remainingShares <= 0) {
        delete newPositions[order.symbol];
      } else {
        newPositions[order.symbol] = {
          ...existingPosition,
          shares: remainingShares,
          unrealizedPnL: (order.price - existingPosition.averagePrice) * remainingShares,
          unrealizedPnLPercent: ((order.price - existingPosition.averagePrice) / existingPosition.averagePrice) * 100,
        };
      }
    }

    const updatedPortfolio: PaperPortfolio = {
      virtualCash: newVirtualCash,
      positions: newPositions,
      realizedPnL: portfolio.realizedPnL + realizedGainLoss,
      lastUpdated: new Date().toISOString(),
    };

    const newTradeOrder: TradeOrder = {
      id: 'trade_' + Date.now(),
      symbol: order.symbol,
      name: liveStock?.name || order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price,
      totalAmount: orderTotal,
      timestamp: new Date().toISOString(),
      stopLoss: order.stopLoss,
      targetPrice: order.targetPrice,
      realizedPnL: order.side === 'SELL' ? realizedGainLoss : undefined,
    };

    setPortfolio(updatedPortfolio);
    setTradeHistory((prev) => [newTradeOrder, ...prev]);

    // Record streak activity for paper trade
    const { updatedProgress: streakProgress } = recordLearningActivity(progress);
    setProgress(streakProgress);

    if (currentUser && !currentUser.isGuest) {
      savePaperPortfolio(currentUser.uid, updatedPortfolio);
      saveTradeOrder(currentUser.uid, newTradeOrder);
      saveUserProgress(currentUser.uid, streakProgress);
    }

    return {
      success: true,
      message: `Successfully executed ${order.side} order for ${order.quantity} shares of ${order.symbol} at ₹${order.price.toFixed(2)}.`
    };
  };

  // Handler for adding journal entries
  const handleSaveJournal = (entry: JournalEntry) => {
    setJournalEntries((prev) => [entry, ...prev]);
    const { updatedProgress: streakProgress } = recordLearningActivity(progress);
    setProgress(streakProgress);
    if (currentUser && !currentUser.isGuest) {
      saveJournalEntry(currentUser.uid, entry);
      saveUserProgress(currentUser.uid, streakProgress);
    }
  };

  // Reset progress handler
  const handleResetProgress = async () => {
    const today = getLocalDateString();
    const freshProgress: UserProgress = {
      overallProgress: 0,
      completedLessons: [],
      completedModules: [],
      currentModuleId: 'mod_1',
      currentLessonId: 'les_1_1',
      quizScores: {},
      quizAnswers: {},
      learningStreakDays: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: today,
      todayCompleted: false,
      totalActiveDays: 0,
      weeklyActivity: {},
      lastVisitedAt: new Date().toISOString(),
    };

    const freshPortfolio: PaperPortfolio = {
      virtualCash: 100000,
      positions: {},
      realizedPnL: 0,
      lastUpdated: new Date().toISOString(),
    };

    setProgress(freshProgress);
    setPortfolio(freshPortfolio);
    setTradeHistory([]);
    setJournalEntries([]);

    if (currentUser && !currentUser.isGuest) {
      await resetUserData(currentUser.uid);
    }
  };

  // Handler to restart experience from the very beginning (landing page)
  const handleRestartFromBeginning = async () => {
    localStorage.removeItem('smll_onboarding_completed_v2');
    localStorage.removeItem('smll_tour_completed_v2');
    sessionStorage.removeItem('tq_startup_revealed');
    if (currentUser) {
      await signOutUser();
      setCurrentUser(null);
    }
    setShowStartupReveal(true);
    setShowTour(false);
  };

  // Open mentor with a question
  const handleOpenMentor = (prompt?: string) => {
    setMentorInitialPrompt(prompt);
    setMentorHasUnreadResponse(false);
    setActiveTab('mentor');
  };

  // Keep activeTabRef synced and clear unread mentor indicator when entering mentor tab
  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === 'mentor') {
      setMentorHasUnreadResponse(false);
    }
  }, [activeTab]);

  // Open journal with default stock
  const handleOpenJournalForTrade = (symbol: string) => {
    setJournalDefaultSymbol(symbol);
    setActiveTab('journal');
  };

  // Navigate to lesson with lock verification
  const handleSelectLesson = (lesson: Lesson) => {
    const parentModule = CURRICULUM_MODULES.find(m => m.id === lesson.moduleId);
    if (parentModule) {
      const modStatus = getModuleStatus(parentModule, progress.completedLessons, progress.completedModules);
      const isUnlocked = isLessonUnlocked(lesson, parentModule, progress.completedLessons, modStatus);
      if (!isUnlocked && modStatus === 'LOCKED') {
        setActiveTab('roadmap');
        return;
      }
    }
    setActiveLesson(lesson);
    setActiveTab('lesson_viewer');
  };

  // Direct lesson lookup for global feature search
  const handleSelectLessonById = (lessonId: string) => {
    for (const mod of CURRICULUM_MODULES) {
      const found = mod.lessons.find((l) => l.id === lessonId);
      if (found) {
        handleSelectLesson(found);
        return;
      }
    }
  };

  // Direct action execution from global feature search
  const handleTriggerSearchAction = (actionId: string) => {
    if (actionId === 'replay_guided_tour') {
      setActiveTab('dashboard');
      setShowGuidedTour(true);
    } else if (actionId === 'replay_welcome_tour') {
      setShowTour(true);
    } else if (actionId === 'toggle_theme') {
      const nextTheme = theme === 'royal_blue' ? 'premium_emerald' : 'royal_blue';
      setTheme(nextTheme);
      setSettings((prev) => ({ ...prev, theme: nextTheme }));
      if (currentUser && !currentUser.isGuest) {
        saveUserSettings(currentUser.uid, { ...settings, theme: nextTheme });
      }
    } else if (actionId === 'open_mentor') {
      handleOpenMentor();
    } else if (actionId === 'open_feedback') {
      setShowDetailedFeedback(true);
    }
  };

  // Find current active module and lesson titles for contextual AI mentoring
  const currentModuleObj = CURRICULUM_MODULES.find((m) => m.id === progress.currentModuleId) || CURRICULUM_MODULES[0];
  const currentLessonObj = activeLesson || currentModuleObj.lessons.find((l) => !progress.completedLessons.includes(l.id)) || currentModuleObj.lessons[0];

  // Effective User ID for scoped mentor conversation persistence
  const effectiveUid = currentUser?.uid || profile.uid || 'guest_user';

  // Load user-specific conversation history
  const loadMentorHistory = async (uid: string) => {
    try {
      const convs = await fetchUserConversations(uid);
      setMentorConversations(convs);
      if (convs.length > 0) {
        const mostRecent = convs[0];
        setActiveMentorConversationId(mostRecent.id);
        const msgs = await fetchConversationMessages(uid, mostRecent.id);
        if (msgs && msgs.length > 0) {
          setMentorMessages(msgs);
        } else {
          setMentorMessages([defaultWelcomeMessage]);
        }
      } else {
        setActiveMentorConversationId(null);
        setMentorMessages([defaultWelcomeMessage]);
      }
    } catch (e) {
      console.warn('Could not load mentor history:', e);
    }
  };

  // Switch conversation
  const handleSelectConversation = async (convId: string) => {
    if (convId === activeMentorConversationId) return;
    setIsSwitchingConversation(true);
    setActiveMentorConversationId(convId);
    try {
      const msgs = await fetchConversationMessages(effectiveUid, convId);
      setMentorMessages(msgs.length > 0 ? msgs : [defaultWelcomeMessage]);
    } catch (err) {
      console.warn('Error switching conversation:', err);
    } finally {
      setIsSwitchingConversation(false);
    }
  };

  // Start new fresh chat
  const handleNewMentorChat = () => {
    setActiveMentorConversationId(null);
    setMentorMessages([defaultWelcomeMessage]);
  };

  // Rename conversation
  const handleRenameMentorConversation = async (convId: string, newTitle: string) => {
    await renameMentorConversation(effectiveUid, convId, newTitle);
    setMentorConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c))
    );
  };

  // Delete conversation with instant optimistic state update
  const handleDeleteMentorConversation = async (convId: string) => {
    let nextConvToSelect: string | null = null;
    let shouldResetActive = false;

    // 1. Immediately update UI state so conversation vanishes instantly
    setMentorConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== convId);
      if (activeMentorConversationId === convId) {
        if (remaining.length > 0) {
          nextConvToSelect = remaining[0].id;
        } else {
          shouldResetActive = true;
        }
      }
      return remaining;
    });

    if (nextConvToSelect) {
      setActiveMentorConversationId(nextConvToSelect);
      try {
        const msgs = await fetchConversationMessages(effectiveUid, nextConvToSelect);
        setMentorMessages(msgs.length > 0 ? msgs : [defaultWelcomeMessage]);
      } catch {
        setMentorMessages([defaultWelcomeMessage]);
      }
    } else if (shouldResetActive || activeMentorConversationId === convId) {
      setActiveMentorConversationId(null);
      setMentorMessages([defaultWelcomeMessage]);
    }

    // 2. Concurrently purge storage and Firestore in background
    try {
      await deleteMentorConversation(effectiveUid, convId);
    } catch (err) {
      console.warn('Background delete mentor conversation note:', err);
    }
  };

  // Clear all conversations with instant optimistic state update
  const handleClearAllMentorConversations = async () => {
    setMentorConversations([]);
    handleNewMentorChat();
    try {
      await clearAllMentorConversations(effectiveUid);
    } catch (err) {
      console.warn('Background clear all conversations note:', err);
    }
  };


  // Shared AI Market Mentor question handler with persistent history & context window
  const handleSendMentorMessage = async (
    questionText: string,
    attachments?: MentorAttachment[],
    isRetry = false
  ) => {
    const trimmed = questionText.trim();
    if (!trimmed || mentorLoading) return;

    let convId = activeMentorConversationId;

    // If no active conversation, create one with deterministic title from first question
    if (!convId) {
      try {
        const newConv = await createMentorConversation(effectiveUid, trimmed, mentorExplanationMode);
        convId = newConv.id;
        setActiveMentorConversationId(convId);
        setMentorConversations((prev) => [newConv, ...prev.filter((c) => c.id !== convId)]);
      } catch (err) {
        console.warn('Could not create conversation:', err);
      }
    }

    const nowIso = new Date().toISOString();
    const userMsg: MentorMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: nowIso,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    };

    if (!isRetry) {
      // Filter out welcome message placeholder if starting dialogue
      setMentorMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== 'welcome');
        return [...filtered, userMsg];
      });

      if (convId) {
        void saveMentorMessage(effectiveUid, convId, userMsg);
      }
    }

    setMentorLoading(true);
    setMentorHasUnreadResponse(false);

    // Build context window from recent turns (last 6 messages)
    const baseList = mentorMessages.filter((m) => m.id !== 'welcome');
    const recentHistory = (isRetry ? baseList : [...baseList, userMsg])
      .slice(-6)
      .map((m) => ({ sender: m.sender, text: m.text }));

    const payloadAttachments = attachments && attachments.length > 0
      ? attachments.map((a) => ({
          name: a.name,
          mimeType: a.type,
          base64: a.dataUrl || '',
        }))
      : undefined;

    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          userId: effectiveUid,
          history: recentHistory,
          mode: mentorExplanationMode,
          currentModule: currentModuleObj.title,
          currentLesson: currentLessonObj.title,
          attachments: payloadAttachments,
          learnerContext: {
            displayName: profile.displayName || 'Learner',
            currentStageNumber: currentModuleObj.levelNumber,
            currentStageTitle: currentModuleObj.title,
            currentLessonTitle: currentLessonObj.title,
            completedLessonsCount: progress.completedLessons.length,
            totalLessonsCount: CURRICULUM_MODULES.reduce((acc, m) => acc + m.lessons.length, 0),
            experienceLevel: profile.experienceLevel,
            averageQuizScore: Object.values(progress.quizScores || {}).length > 0
              ? Math.round(Object.values(progress.quizScores || {}).reduce((a, b) => a + b, 0) / Object.values(progress.quizScores || {}).length)
              : undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to receive response from Market Mentor.');
      }

      const mentorReplyText = data.answer;

      const mentorMsg: MentorMessage = {
        id: 'mentor_' + Date.now(),
        sender: 'mentor',
        text: mentorReplyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      };

      setMentorMessages((prev) => [...prev, mentorMsg]);

      if (convId) {
        void saveMentorMessage(effectiveUid, convId, mentorMsg);

        // Update conversation in sidebar list and promote to top
        setMentorConversations((prev) => {
          const existing = prev.find((c) => c.id === convId);
          const updated: MentorConversation = {
            ...(existing || {
              id: convId,
              title: trimmed.substring(0, 35),
              createdAt: nowIso,
              explanationMode: mentorExplanationMode,
            }),
            updatedAt: new Date().toISOString(),
            lastMessagePreview: mentorReplyText.substring(0, 70),
          };
          return [updated, ...prev.filter((c) => c.id !== convId)];
        });
      }

      if (activeTabRef.current !== 'mentor') {
        setMentorHasUnreadResponse(true);
      }
    } catch (err: any) {
      console.warn('Market Mentor inquiry failed:', err);
      const errMsg = err?.message || 'The AI service is experiencing high demand.';
      const isQuota = errMsg.includes('DAILY_QUOTA_EXHAUSTED') || errMsg.includes('limit: 20') || errMsg.includes('quota exceeded');
      const isUserLimit = errMsg.includes('USER_LIMIT_REACHED');

      let userFacingText = '';
      if (isQuota) {
        userFacingText = `⚠️ **Daily Free-Tier AI Quota Reached (20 requests/day)**\n\nShareMarket operates on a strict ₹0 budget using Google's official free-tier AI access. The shared daily limit has been reached.\n\n🕒 **Quota Reset**: The free tier automatically resets tomorrow (UTC). Your chat history, progress, and paper portfolio are completely safe!\n\nFeel free to explore our learning modules, review previous lesson quizzes, or practice in Paper Trading while the daily quota refreshes.`;
      } else if (isUserLimit) {
        userFacingText = `⚠️ **Daily Fair-Share Limit Reached**\n\nYou've used your daily allocation (5 questions/day) on the free tier. This ensures all learners can ask Market Mentor questions without paid fees.\n\nYour chat history is saved. Please review your previous notes or practice in Paper Trading and return tomorrow!`;
      } else {
        userFacingText = `⚠️ **Could not reach Market Mentor**: ${errMsg}\n\nPlease click **Retry** below or re-submit your question.`;
      }

      // Display transparent, actionable error notice instead of silent canned text
      const errorNoticeMsg: MentorMessage = {
        id: 'mentor_error_' + Date.now(),
        sender: 'mentor',
        text: userFacingText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      };

      setMentorMessages((prev) => [...prev, errorNoticeMsg]);

      if (convId) {
        void saveMentorMessage(effectiveUid, convId, errorNoticeMsg);
      }

      if (activeTabRef.current !== 'mentor') {
        setMentorHasUnreadResponse(true);
      }
    } finally {
      setMentorLoading(false);
    }
  };

  // Inline Message Edit Handler: truncates subsequent messages and regenerates response
  const handleEditMentorMessage = async (messageId: string, newText: string) => {
    const convId = activeMentorConversationId;
    if (!convId || mentorLoading) return;

    setMentorLoading(true);
    try {
      const truncated = await updateMentorMessageAndTruncate(effectiveUid, convId, messageId, newText);
      setMentorMessages(truncated);

      const targetMsg = truncated[truncated.length - 1];
      const recentHistory = truncated.slice(0, -1).slice(-6).map((m) => ({ sender: m.sender, text: m.text }));

      const payloadAttachments = targetMsg.attachments && targetMsg.attachments.length > 0
        ? targetMsg.attachments.map((a) => ({
            name: a.name,
            mimeType: a.type,
            base64: a.dataUrl || '',
          }))
        : undefined;

      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newText,
          history: recentHistory,
          mode: mentorExplanationMode,
          currentModule: currentModuleObj.title,
          currentLesson: currentLessonObj.title,
          attachments: payloadAttachments,
          learnerContext: {
            displayName: profile.displayName || 'Learner',
            currentStageNumber: currentModuleObj.levelNumber,
            currentStageTitle: currentModuleObj.title,
            currentLessonTitle: currentLessonObj.title,
            completedLessonsCount: progress.completedLessons.length,
            totalLessonsCount: CURRICULUM_MODULES.reduce((acc, m) => acc + m.lessons.length, 0),
            experienceLevel: profile.experienceLevel,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to regenerate response from Market Mentor.');
      }

      const mentorReplyText = data.answer;

      const mentorMsg: MentorMessage = {
        id: 'mentor_' + Date.now(),
        sender: 'mentor',
        text: mentorReplyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      };

      setMentorMessages((prev) => [...prev, mentorMsg]);
      void saveMentorMessage(effectiveUid, convId, mentorMsg);

      // Update last message preview in conversations
      setMentorConversations((prev) => {
        const existing = prev.find((c) => c.id === convId);
        if (!existing) return prev;
        const updated: MentorConversation = {
          ...existing,
          updatedAt: new Date().toISOString(),
          lastMessagePreview: mentorReplyText.substring(0, 70),
        };
        return [updated, ...prev.filter((c) => c.id !== convId)];
      });
    } catch (err) {
      console.warn('Regeneration after edit failed:', err);
    } finally {
      setMentorLoading(false);
    }
  };

  // Individual message deletion handler for removing unwanted questions or answers
  const handleDeleteMentorMessage = async (messageId: string) => {
    const convId = activeMentorConversationId;
    let filteredList: MentorMessage[] = [];
    // 1. Immediately update UI state so unwanted message disappears instantly
    setMentorMessages((prev) => {
      const filtered = prev.filter((m) => m.id !== messageId);
      filteredList = filtered;
      return filtered.length > 0 ? filtered : [defaultWelcomeMessage];
    });

    // 2. Concurrently remove from storage and Firestore
    if (convId && messageId !== 'welcome') {
      try {
        await deleteMentorMessage(effectiveUid, convId, messageId, filteredList);
      } catch (err) {
        console.warn('Delete message note:', err);
      }
    }
  };


  // Dedicated Retry handler for AI answers
  const handleRetryMentorMessage = async (targetMsgId?: string) => {
    if (mentorLoading) return;

    let questionToRetry = '';
    let attachmentsToRetry: MentorAttachment[] | undefined;
    const currentMsgs = [...mentorMessages];

    let targetIdx = -1;
    if (targetMsgId) {
      targetIdx = currentMsgs.findIndex((m) => m.id === targetMsgId);
    } else {
      // Find the last mentor message
      for (let i = currentMsgs.length - 1; i >= 0; i--) {
        if (currentMsgs[i].sender === 'mentor') {
          targetIdx = i;
          break;
        }
      }
    }

    if (targetIdx !== -1) {
      // Find the user question preceding this target message
      for (let i = targetIdx - 1; i >= 0; i--) {
        if (currentMsgs[i].sender === 'user') {
          questionToRetry = currentMsgs[i].text;
          attachmentsToRetry = currentMsgs[i].attachments;
          break;
        }
      }
      // Remove the target mentor message or error bubble from state and storage
      const targetMsg = currentMsgs[targetIdx];
      if (targetMsg && targetMsg.id !== 'welcome') {
        if (activeMentorConversationId) {
          void deleteMentorMessage(effectiveUid, activeMentorConversationId, targetMsg.id);
        }
        setMentorMessages((prev) => prev.filter((m) => m.id !== targetMsg.id));
      }
    }

    // Fallback to the latest user message
    if (!questionToRetry) {
      const lastUser = [...currentMsgs].reverse().find((m) => m.sender === 'user');
      if (lastUser) {
        questionToRetry = lastUser.text;
        attachmentsToRetry = lastUser.attachments;
      }
    }

    if (!questionToRetry) return;

    await handleSendMentorMessage(questionToRetry, attachmentsToRetry, true);
  };

  // Find next and prev lessons for navigation
  const allLessonsFlat = CURRICULUM_MODULES.flatMap((m) => m.lessons);
  const activeLessonIdx = activeLesson ? allLessonsFlat.findIndex((l) => l.id === activeLesson.id) : -1;
  const nextLesson = activeLessonIdx >= 0 && activeLessonIdx < allLessonsFlat.length - 1 ? allLessonsFlat[activeLessonIdx + 1] : null;
  const prevLesson = activeLessonIdx > 0 ? allLessonsFlat[activeLessonIdx - 1] : null;

  // 1. Initial platform authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen theme-bg flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-500 text-white flex items-center justify-center font-black font-heading text-xl shadow-lg shadow-emerald-600/20 border border-emerald-500/30 animate-pulse">
          TQ
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold theme-main-text font-heading">{APP_NAME}</h2>
          <p className="text-xs theme-secondary-text">Initializing educational platform...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Public Landing Page
  if (!currentUser) {
    return (
      <>
        {showStartupReveal && (
          <StartupBrandReveal
            onComplete={() => {
              setShowStartupReveal(false);
              sessionStorage.setItem('tq_startup_revealed', 'true');
            }}
          />
        )}
        <SaaSTemplate
          onSignIn={() => {
            setAuthModalInitialMode('LOGIN');
            setIsAuthModalOpen(true);
          }}
          onSignUp={() => {
            setAuthModalInitialMode('REGISTER');
            setIsAuthModalOpen(true);
          }}
          onGetStarted={() => {
            setAuthModalInitialMode('REGISTER');
            setIsAuthModalOpen(true);
          }}
          onExploreApp={handleEnterAsGuest}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalInitialMode}
          onClose={() => setIsAuthModalOpen(false)}
          onContinueAsGuest={() => {
            setIsAuthModalOpen(false);
            handleEnterAsGuest();
          }}
          onSuccess={() => {
            setIsAuthModalOpen(false);
          }}
        />
      </>
    );
  }

  // 3. Authenticated + Profile Loading State
  if (profileLoading) {
    return (
      <div className="min-h-screen theme-bg flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-500 text-white flex items-center justify-center font-black font-heading text-xl shadow-lg shadow-emerald-600/20 border border-emerald-500/30 animate-pulse">
          TQ
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold theme-main-text font-heading">{APP_NAME}</h2>
          <p className="text-xs theme-secondary-text">Loading educational profile...</p>
        </div>
      </div>
    );
  }

  // 4. Authenticated + Firestore Connection Error State
  if (profileError) {
    return (
      <div className="min-h-screen theme-bg flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="max-w-md w-full theme-card p-6 sm:p-8 rounded-3xl border theme-border shadow-xl space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold theme-main-text font-heading">Database Connection Notice</h3>
            <p className="text-xs theme-secondary-text leading-relaxed">{profileError}</p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => currentUser && loadUserProfileData(currentUser)}
              className="flex-1 py-2.5 theme-btn-primary rounded-xl font-bold text-xs shadow-xs cursor-pointer"
            >
              Retry Connection
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2.5 theme-surface-subtle theme-border border rounded-xl font-semibold text-xs theme-secondary-text hover:theme-main-text cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Authenticated + Profile Incomplete: Profile Creation View
  if (!profile.onboardingCompleted) {
    return (
      <ProfileSetupView
        initialProfile={profile}
        userEmail={currentUser.email}
        onComplete={handleFinishProfileSetup}
      />
    );
  }

  // 6. Authenticated + Profile Complete + App Overview Incomplete: Dedicated First-Time App Overview
  if (!profile.appIntroductionCompleted) {
    return (
      <div className="min-h-screen w-full theme-bg flex items-center justify-center">
        <AppOverviewTour
          onFinish={handleFinishTour}
          onSkip={handleFinishTour}
          activeTheme={theme}
        />
      </div>
    );
  }

  // 6.5. Admin Command Portal Route (/admin or activeTab === 'admin')
  if (activeTab === 'admin') {
    const isOwner = isOwnerAdmin(currentUser?.email);
    if (isOwner) {
      return (
        <AdminDashboard
          adminEmail={currentUser?.email || ADMIN_OWNER_EMAIL}
          onReturnToApp={() => handleSelectTab('dashboard')}
        />
      );
    }
    return (
      <AdminAccessDenied
        currentEmail={currentUser?.email}
        onReturnToDashboard={() => handleSelectTab('dashboard')}
      />
    );
  }

  // 7. Authenticated User (with Profile & App Overview completed): Main Application
  return (
    <>
      <NavigationLayout
        currentTab={activeTab}
        onSelectTab={(tabId) => {
          handleSelectTab(tabId);
          if (tabId !== 'lesson_viewer') {
            setActiveLesson(null);
          }
        }}
        profile={profile}
        progress={progress}
        portfolio={portfolio}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onRestartFromBeginning={handleRestartFromBeginning}
        forceMobileMenuOpen={forceMobileSidebarOpen}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenFeedback={() => setShowDetailedFeedback(true)}
      >
        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <DashboardHome
            profile={profile}
            progress={progress}
            portfolio={portfolio}
            modules={CURRICULUM_MODULES}
            onSelectLesson={handleSelectLesson}
            onNavigateTab={setActiveTab}
            onOpenMentor={handleOpenMentor}
          />
        )}

        {/* 2. Learning Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <LearningRoadmap
            modules={CURRICULUM_MODULES}
            completedLessons={progress.completedLessons}
            completedModules={progress.completedModules}
            currentLessonId={progress.currentLessonId}
            onSelectLesson={handleSelectLesson}
          />
        )}

        {/* 3. Lesson Viewer Tab (Keyed by lesson.id to guarantee 100% scoped isolation) */}
        {activeTab === 'lesson_viewer' && activeLesson && (
          <LessonViewer
            key={activeLesson.id}
            lesson={activeLesson}
            isCompleted={progress.completedLessons.includes(activeLesson.id)}
            savedAnswers={progress.quizAnswers?.[activeLesson.id]}
            savedScore={progress.quizScores?.[activeLesson.id]}
            onCompleteLesson={handleCompleteLesson}
            onNavigateNext={nextLesson ? () => handleSelectLesson(nextLesson) : undefined}
            onNavigatePrev={prevLesson ? () => handleSelectLesson(prevLesson) : undefined}
            onOpenMentor={handleOpenMentor}
          />
        )}

        {/* 4. Paper Trading Lab Tab */}
        {activeTab === 'paper_trading' && (
          <PaperTradingLab
            portfolio={portfolio}
            stocks={FICTIONAL_STOCKS}
            tradeHistory={tradeHistory}
            onExecuteTrade={handleExecuteTrade}
            onOpenJournalForTrade={handleOpenJournalForTrade}
          />
        )}

        {/* 5. Trading Journal Tab */}
        {activeTab === 'journal' && (
          <TradingJournal
            entries={journalEntries}
            onSaveEntry={handleSaveJournal}
            defaultSymbol={journalDefaultSymbol}
          />
        )}

        {/* 6. Stock Detective Forensic Lab Tab */}
        {activeTab === 'stock_detective' && <StockDetectiveView />}

        {/* 7. Scam & FOMO Detector Tab */}
        {activeTab === 'scam_detector' && <ScamDetectorView />}

        {/* 8. Final Mastery Challenge Tab */}
        {activeTab === 'final_challenge' && (
          <FinalChallengeView
            onCompleteChallenge={(score) => {
              if (score >= 70) {
                handleCompleteLesson('final_mastery_assessment', score);
              }
            }}
          />
        )}

        {/* 9. A-Z Glossary Tab */}
        {activeTab === 'glossary' && <GlossaryView />}

        {/* 10. AI Market Mentor Tab */}
        {activeTab === 'mentor' && (
          <MarketMentor
            initialPrompt={mentorInitialPrompt}
            onClearInitialPrompt={() => setMentorInitialPrompt(undefined)}
            currentModuleTitle={currentModuleObj.title}
            currentLessonTitle={currentLessonObj.title}
            userId={effectiveUid}
            conversations={mentorConversations}
            activeConversationId={activeMentorConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewMentorChat}
            onRenameConversation={handleRenameMentorConversation}
            onDeleteConversation={handleDeleteMentorConversation}
            onClearAllConversations={handleClearAllMentorConversations}
            messages={mentorMessages}
            loading={mentorLoading}
            isSwitchingConversation={isSwitchingConversation}
            explanationMode={mentorExplanationMode}
            onChangeExplanationMode={setMentorExplanationMode}
            onSendMessage={handleSendMentorMessage}
            onEditMessage={handleEditMentorMessage}
            onDeleteMessage={handleDeleteMentorMessage}
            onRetryMessage={handleRetryMentorMessage}
          />
        )}

        {/* 11. Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsView
            profile={profile}
            progress={progress}
            portfolio={portfolio}
            settings={settings}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onUpdateSettings={(newSettings) => {
              const updated = { ...settings, ...newSettings };
              setSettings(updated);
              if (currentUser && !currentUser.isGuest) saveUserSettings(currentUser.uid, updated);
            }}
            onUpdateProfile={(newProfile) => {
              const updated = { ...profile, ...newProfile };
              setProfile(updated);
              if (newProfile.theme) {
                const updatedTheme = newProfile.theme;
                setTheme(updatedTheme);
                setSettings((prev) => ({ ...prev, theme: updatedTheme }));
                if (currentUser && !currentUser.isGuest) {
                  saveUserSettings(currentUser.uid, { ...settings, theme: updatedTheme });
                }
              }
              if (currentUser && !currentUser.isGuest) {
                saveUserProfile(currentUser.uid, updated);
              }
            }}
            onResetProgress={handleResetProgress}
            onSignOut={handleSignOut}
            onReplayTour={() => setShowTour(true)}
            onReplayGuidedTour={() => {
              setActiveTab('dashboard');
              setShowGuidedTour(true);
            }}
            onRestartFromBeginning={handleRestartFromBeginning}
            onNavigateToAdmin={() => handleSelectTab('admin')}
          />
        )}

        {/* 12. Admin Command Portal (Protected for designated Owner) */}
        {activeTab === 'admin' && (
          isOwnerAdmin(currentUser?.email) ? (
            <AdminDashboard
              adminEmail={currentUser?.email || ADMIN_OWNER_EMAIL}
              onReturnToApp={() => handleSelectTab('dashboard')}
            />
          ) : (
            <AdminAccessDenied
              currentEmail={currentUser?.email}
              onReturnToDashboard={() => handleSelectTab('dashboard')}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )
        )}
      </NavigationLayout>

      {/* Persistent Floating AI Market Mentor Shortcut across Authenticated Views */}
      <FloatingAIMentor
        messages={mentorMessages}
        loading={mentorLoading}
        hasUnreadResponse={mentorHasUnreadResponse}
        explanationMode={mentorExplanationMode}
        onChangeExplanationMode={setMentorExplanationMode}
        onSendMessage={handleSendMentorMessage}
        onRetryMessage={handleRetryMentorMessage}
        onDeleteMessage={handleDeleteMentorMessage}
        onDeleteConversation={() => {
          if (activeMentorConversationId) {
            void handleDeleteMentorConversation(activeMentorConversationId);
          } else {
            handleNewMentorChat();
          }
        }}
        onClearUnread={() => setMentorHasUnreadResponse(false)}
        onOpenFullMentor={() => handleOpenMentor()}
        currentModuleTitle={currentModuleObj.title}
        activeConversationTitle={
          mentorConversations.find((c) => c.id === activeMentorConversationId)?.title
        }
        onNewChat={handleNewMentorChat}
        isHidden={activeTab === 'mentor' || showTour}
      />


      {/* First-Time or Replayed Interactive Guided Product Tour */}
      <InteractiveGuidedTour
        isOpen={!profile.guidedTourCompleted || showGuidedTour}
        activeTab={activeTab}
        onNavigateTab={(tabId) => {
          setActiveTab(tabId);
          if (tabId !== 'lesson_viewer') {
            setActiveLesson(null);
          }
        }}
        onFinish={handleFinishGuidedTour}
        onSkip={handleFinishGuidedTour}
        onStepSidebarChange={setForceMobileSidebarOpen}
        activeTheme={theme}
      />

      {/* Manual Replay of App Overview from Settings */}
      {showTour && (
        <AppOverviewTour
          onFinish={handleCloseReplayTour}
          onSkip={handleCloseReplayTour}
          activeTheme={theme}
        />
      )}

      {/* Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onContinueAsGuest={() => {
          setIsAuthModalOpen(false);
          setActiveTab('dashboard');
        }}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setActiveTab('dashboard');
        }}
      />

      {/* Module Unlock Celebration Modal */}
      {celebrationModule && (
        <UnlockCelebrationModal
          module={celebrationModule}
          onStartLearning={() => {
            const firstLesson = celebrationModule.lessons[0];
            setCelebrationModule(null);
            if (firstLesson) {
              handleSelectLesson(firstLesson);
            }
          }}
          onClose={() => setCelebrationModule(null)}
        />
      )}

      {/* Global Feature & Course Navigation Search (⌘K / Ctrl+K / /) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentUser={currentUser}
        onNavigateTab={(tabId) => {
          handleSelectTab(tabId);
          if (tabId !== 'lesson_viewer') {
            setActiveLesson(null);
          }
        }}
        onSelectLessonById={handleSelectLessonById}
        onTriggerAction={handleTriggerSearchAction}
      />

      {/* Permanent Accessible Detailed Product Feedback Modal */}
      <DetailedFeedbackModal
        isOpen={showDetailedFeedback}
        onClose={() => setShowDetailedFeedback(false)}
        userId={effectiveUid}
        userName={profile.displayName}
        userEmail={profile.email}
      />

      {/* Smart Timing Quick Experience Feedback Modal */}
      <ExperienceFeedbackModal
        isOpen={showExperienceFeedback}
        onClose={() => setShowExperienceFeedback(false)}
        userId={effectiveUid}
        userName={profile.displayName}
        userEmail={profile.email}
      />

      {/* Milestone Learning Comprehension Feedback Modal */}
      {learningFeedbackTarget && (
        <LearningFeedbackModal
          isOpen={!!learningFeedbackTarget}
          onClose={() => setLearningFeedbackTarget(null)}
          lessonId={learningFeedbackTarget.lessonId}
          lessonTitle={learningFeedbackTarget.lessonTitle}
          stageId={learningFeedbackTarget.stageId}
          stageTitle={learningFeedbackTarget.stageTitle}
          userId={effectiveUid}
          userName={profile.displayName}
          userEmail={profile.email}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
