import React, { useState, useRef } from 'react';
import { 
  motion, 
  useMotionValue, 
  useTransform, 
  useSpring, 
  useReducedMotion, 
  useAnimationControls, 
  type MotionValue 
} from 'framer-motion';
import { 
  TrendingUp, 
  BookOpen, 
  ShieldCheck, 
  Compass, 
  Search, 
  BookA, 
  Bot, 
  Trophy, 
  Settings, 
  LogOut,
  Menu,
  X,
  FileText,
  Cloud,
  Palette,
  Flame,
  RotateCcw,
  ShieldAlert,
  PanelLeftOpen,
  PanelLeftClose,
  MessageSquareHeart
} from 'lucide-react';
import { UserProfile, UserProgress, PaperPortfolio } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarById } from '../../config/avatars';
import { APP_NAME, APP_SHORT_NAME, APP_TAGLINE, APP_LOGO } from '../../config/branding';
import { ADMIN_OWNER_EMAIL } from '../../services/adminService';
import { GooeyInput } from '../ui/gooey-input';

const FAR_Y = 99999;
const RADIUS_Y = 65;

interface VerticalDockNavItemProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  mouseY: MotionValue<number>;
  reduce: boolean;
  isHovered: boolean;
  onEnter: () => void;
  isCollapsed?: boolean;
}

function VerticalDockNavItem({
  id,
  label,
  icon: Icon,
  isActive,
  onClick,
  mouseY,
  reduce,
  isHovered,
  onEnter,
  isCollapsed = false,
}: VerticalDockNavItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const dist = useTransform(mouseY, (y: number) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? y - (r.y + r.height / 2) : FAR_Y;
  });

  const rawX = useTransform(dist, (d: number) => {
    const t = Math.min(1, Math.abs(d) / RADIUS_Y);
    return 3.5 * ((1 + Math.cos(Math.PI * t)) / 2);
  });
  const rawScale = useTransform(dist, (d: number) => {
    const t = Math.min(1, Math.abs(d) / RADIUS_Y);
    return 1 + 0.04 * ((1 + Math.cos(Math.PI * t)) / 2);
  });

  const x = useSpring(rawX, { mass: 0.1, stiffness: 280, damping: 22 });
  const scale = useSpring(rawScale, { mass: 0.1, stiffness: 280, damping: 22 });

  const bounce = useAnimationControls();
  const handleClick = () => {
    if (!reduce) {
      void bounce.start({
        scale: [1, 0.96, 1.02, 1],
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
      });
    }
    onClick();
  };

  return (
    <div className="relative group">
      <motion.button
        ref={ref}
        id={`nav-item-${id}`}
        data-tour={`nav-${id}`}
        type="button"
        onClick={handleClick}
        onMouseEnter={() => {
          onEnter();
          setShowTooltip(true);
        }}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => {
          onEnter();
          setShowTooltip(true);
        }}
        onBlur={() => setShowTooltip(false)}
        animate={bounce}
        style={{
          transformOrigin: 'left center',
          x: reduce ? 0 : x,
        }}
        className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group outline-none select-none interactive-nav-item ${
          isCollapsed ? 'justify-center' : 'justify-between'
        } ${
          isActive
            ? 'bg-[#0D6847] text-white shadow-[0_0_18px_-2px_rgba(13,104,71,0.55)] font-bold ring-1 ring-emerald-400/30'
            : 'theme-secondary-text hover:theme-main-text hover:bg-white/[0.04] dark:hover:bg-emerald-950/20 hover:shadow-2xs'
        }`}
      >
        {isCollapsed ? (
          // Collapsed: Icon only
          <motion.div
            style={{ scale: reduce ? 1 : scale }}
            className={`p-1 rounded-lg transition-colors shrink-0 ${
              isActive 
                ? 'bg-white/20 text-white' 
                : 'text-muted-foreground group-hover:theme-primary-text'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'theme-muted-text group-hover:text-emerald-400'}`} />
          </motion.div>
        ) : (
          // Expanded: Icon + Label + Indicator
          <>
            <div className="flex items-center gap-3 min-w-0">
              <motion.div
                style={{ scale: reduce ? 1 : scale }}
                className={`p-1 rounded-lg transition-colors shrink-0 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'theme-surface-subtle text-muted-foreground group-hover:theme-primary-text'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'theme-muted-text group-hover:text-emerald-400'}`} />
              </motion.div>
              <span className="truncate">{label}</span>
            </div>

            {/* Active dot or subtle proximity hover dot */}
            {isActive ? (
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_#10B981] shrink-0 mr-1"
              />
            ) : isHovered ? (
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full theme-primary-bg opacity-70 shrink-0 mr-1"
              />
            ) : null}
          </>
        )}
      </motion.button>
    </div>
  );
}

interface NavigationLayoutProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  profile: UserProfile;
  progress: UserProgress;
  portfolio: PaperPortfolio;
  currentUser?: any;
  onOpenAuthModal?: () => void;
  onSignOut: () => void;
  onRestartFromBeginning?: () => void;
  forceMobileMenuOpen?: boolean;
  onOpenSearch?: () => void;
  onOpenFeedback?: () => void;
  children: React.ReactNode;
}

export const NavigationLayout: React.FC<NavigationLayoutProps> = ({
  currentTab,
  onSelectTab,
  profile,
  progress,
  portfolio,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  onRestartFromBeginning,
  forceMobileMenuOpen,
  onOpenSearch,
  onOpenFeedback,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  
  // Collapsible sidebar state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('smll_sidebar_collapsed');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    if (typeof forceMobileMenuOpen === 'boolean') {
      setMobileMenuOpen(forceMobileMenuOpen);
    }
  }, [forceMobileMenuOpen]);
  
  // Persist sidebar state
  React.useEffect(() => {
    try {
      localStorage.setItem('smll_sidebar_collapsed', isSidebarCollapsed.toString());
    } catch {
      // Ignore storage errors
    }
  }, [isSidebarCollapsed]);
  
  const { theme, toggleTheme, themeConfig } = useTheme();
  const reduce = !!useReducedMotion();
  const mouseY = useMotionValue(FAR_Y);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);

  const userAvatar = getAvatarById(profile.avatarId);
  const isOwner = currentUser?.email?.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase();
  
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const navSections = [
    {
      heading: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Compass },
      ]
    },
    {
      heading: 'CURRICULUM',
      items: [
        { id: 'roadmap', label: 'Learning Roadmap', icon: BookOpen },
        { id: 'mentor', label: 'Market Mentor AI', icon: Bot },
        { id: 'final_challenge', label: 'Mastery Assessment', icon: Trophy },
      ]
    },
    {
      heading: 'SIMULATION & LABS',
      items: [
        { id: 'paper_trading', label: 'Paper Trading Lab', icon: TrendingUp },
        { id: 'journal', label: 'Trading Journal', icon: FileText },
        { id: 'stock_detective', label: 'Stock Detective', icon: Search },
        { id: 'scam_detector', label: 'Risk & Scam Detector', icon: ShieldCheck },
      ]
    },
    {
      heading: 'RESOURCES',
      items: [
        { id: 'glossary', label: 'A-Z Glossary', icon: BookA },
        { id: 'settings', label: 'Settings & Profile', icon: Settings },
        { id: 'feedback', label: 'Feedback', icon: MessageSquareHeart },
      ]
    },
    {
      heading: 'SYSTEM',
      items: [
        { 
          id: 'admin', 
          label: isOwner ? 'Admin Command Portal' : 'Admin Portal (Owner)', 
          icon: ShieldAlert 
        },
      ]
    }
  ];

  const handleNavClick = (id: string) => {
    if (id === 'feedback') {
      if (onOpenFeedback) {
        onOpenFeedback();
      } else {
        onSelectTab('feedback');
      }
    } else {
      onSelectTab(id);
    }
    setMobileMenuOpen(false);
  };

  const streak = progress.currentStreak || progress.learningStreakDays || 1;

  return (
    <div className="min-h-screen flex flex-col md:flex-row theme-bg theme-main-text transition-colors duration-200 relative">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 theme-card border-b theme-border sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <img src={APP_LOGO} alt={APP_NAME} className="w-8 h-8 object-contain rounded-lg shadow-2xs" />
          <div>
            <div className="text-sm font-bold theme-main-text font-heading">{APP_NAME}</div>
            <div className="text-[10px] theme-secondary-text">{APP_TAGLINE}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Global Search Button */}
          {onOpenSearch && (
            <button
              type="button"
              id="btn-mobile-search"
              onClick={onOpenSearch}
              className="p-2 rounded-xl theme-surface-subtle theme-secondary-text hover:theme-main-text transition-all border theme-border cursor-pointer interactive-btn"
              title="Search features (⌘K)"
            >
              <Search className="w-4 h-4 theme-primary-text" />
            </button>
          )}

          {/* Mobile Admin Portal Quick Button */}
          <button
            type="button"
            id="btn-mobile-admin"
            onClick={() => handleNavClick('admin')}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
              currentTab === 'admin'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500 font-bold'
                : isOwner
                ? 'theme-surface-subtle border-emerald-500/40 text-emerald-500 font-bold'
                : 'theme-surface-subtle theme-border theme-secondary-text'
            }`}
            title="Open Admin Command Portal"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-bold">Admin</span>
          </button>

          {currentUser && (
            <button
              type="button"
              id="btn-mobile-logout"
              onClick={onSignOut}
              className="px-2.5 py-1.5 rounded-xl theme-surface-subtle theme-secondary-text hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border theme-border"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden xs:inline">Logout</span>
            </button>
          )}

          {/* Mobile Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl theme-surface-subtle theme-secondary-text hover:opacity-80 transition-all border theme-border cursor-pointer interactive-btn"
            title={`Active: ${themeConfig.name}. Click to switch theme.`}
          >
            <Palette className="w-4 h-4 theme-primary-text" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl theme-surface-subtle theme-main-text hover:opacity-80 border theme-border cursor-pointer interactive-btn"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-35 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen theme-card border-r theme-border flex flex-col justify-between z-40 shadow-sm transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:w-20' : 'w-68 lg:w-72'
        } ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isSidebarCollapsed ? 'p-3' : 'p-4 lg:p-5'
        }`}
      >
        <div className="space-y-4">
          {/* Brand Logo & Controls */}
          <div className={`flex items-center px-1 ${isSidebarCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
            <div className={`flex items-center gap-2.5 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
              <img 
                src={APP_LOGO} 
                alt={APP_NAME} 
                className={`object-contain rounded-xl shadow-2xs transition-all ${isSidebarCollapsed ? 'w-10 h-10' : 'w-9 h-9'}`} 
              />
              {!isSidebarCollapsed && (
                <div>
                  <h1 className="text-sm font-bold theme-main-text font-heading tracking-tight leading-tight">
                    {APP_NAME}
                  </h1>
                  <span className="text-[10px] theme-secondary-text font-medium block">
                    {APP_TAGLINE}
                  </span>
                </div>
              )}
            </div>

            <div className={`flex items-center gap-1.5 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
              {/* Collapse/Expand Toggle Button */}
              <button
                type="button"
                id="btn-toggle-sidebar"
                onClick={handleToggleSidebar}
                className="p-1.5 rounded-xl border theme-border hover:theme-primary-bg hover:text-white theme-surface-subtle theme-secondary-text transition-all cursor-pointer shadow-2xs interactive-btn group"
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* Desktop Theme Switcher Button */}
              {!isSidebarCollapsed && (
                <button
                  type="button"
                  id="btn-theme-switcher"
                  data-tour="theme-switcher"
                  onClick={toggleTheme}
                  className="p-1.5 rounded-xl border theme-border hover:border-slate-400 theme-surface-subtle theme-secondary-text transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs interactive-btn"
                  title={`Active: ${themeConfig.name}. Click to switch theme.`}
                >
                  <div 
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs" 
                    style={{ backgroundColor: themeConfig.palette.primary }} 
                  />
                  <span className="text-[10px] font-mono font-bold theme-secondary-text hidden xl:inline">
                    {themeConfig.name.includes('Light') ? 'Light' : 'Dark'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Global Search GooeyInput Trigger */}
          {onOpenSearch && !isSidebarCollapsed && (
            <div className="px-1" data-tour="global-search-trigger">
              <GooeyInput
                isTriggerOnly
                onClick={onOpenSearch}
                placeholder="Search features (⌘K)..."
                shortcut="⌘K"
              />
            </div>
          )}
          
          {/* Collapsed Search Button */}
          {onOpenSearch && isSidebarCollapsed && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full p-2.5 rounded-xl theme-surface-subtle border theme-border hover:theme-primary-bg hover:text-white transition-all cursor-pointer flex items-center justify-center interactive-btn group"
              title="Search features (⌘K)"
            >
              <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* User Profile Mini Badge with Avatar */}
          <div className={`theme-surface-subtle rounded-2xl border theme-border interactive-card ${isSidebarCollapsed ? 'p-2' : 'p-3 space-y-2'}`}>
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-10 h-10 rounded-xl theme-card border theme-border flex items-center justify-center text-xl shadow-2xs cursor-pointer hover:scale-105 transition-transform" 
                  title={`${profile.displayName || 'Learner'} • ${userAvatar.name}`}
                >
                  {userAvatar.svgIcon}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/20" title={`${streak} day streak`}>
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{streak}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl theme-card border theme-border flex items-center justify-center shrink-0 text-lg shadow-2xs" title={userAvatar.name}>
                      {userAvatar.svgIcon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold theme-main-text truncate">
                        {profile.displayName || (currentUser ? currentUser.email : 'Learner')}
                      </div>
                      <div className="text-[10px] theme-muted-text font-mono truncate">
                        {profile.username ? `@${profile.username}` : userAvatar.name}
                      </div>
                    </div>
                  </div>

                  {/* Mini streak chip */}
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 shrink-0">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{streak}d</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between border-t theme-border text-[10px] font-mono">
                  <span className="theme-muted-text">Virtual Balance:</span>
                  <span className="font-bold theme-positive-text">
                    ₹{portfolio.virtualCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                {/* Cloud Sync trigger if in guest mode */}
                {!currentUser && onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="w-full py-1.5 px-2 theme-card hover:theme-surface-subtle border theme-border rounded-xl text-[11px] theme-primary-text font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs interactive-btn"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Save to Cloud</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Prominent Admin Command Portal Entrypoint */}
          <button
            type="button"
            id="btn-admin-portal-prominent"
            data-tour="admin-portal-button"
            onClick={() => handleNavClick('admin')}
            className={`w-full rounded-2xl border transition-all cursor-pointer shadow-xs group interactive-btn ${
              isSidebarCollapsed ? 'p-2.5' : 'py-2.5 px-3'
            } ${
              currentTab === 'admin'
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-500 font-bold ring-1 ring-emerald-500/30'
                : isOwner
                ? 'theme-surface-subtle hover:theme-card border-emerald-500/40 text-emerald-500 hover:border-emerald-500 font-bold'
                : 'theme-surface-subtle hover:theme-card theme-border theme-secondary-text'
            } ${
              isSidebarCollapsed ? 'flex flex-col items-center gap-1' : 'flex items-center justify-between'
            }`}
            title={isSidebarCollapsed ? (isOwner ? 'Admin Portal (Owner)' : 'Admin Portal') : undefined}
          >
            {isSidebarCollapsed ? (
              <>
                <span className={`p-1.5 rounded-xl shrink-0 transition-colors ${
                  currentTab === 'admin' 
                    ? 'bg-emerald-500/30 text-emerald-500' 
                    : isOwner 
                    ? 'bg-emerald-500/15 text-emerald-500 group-hover:bg-emerald-500/25' 
                    : 'theme-surface-elevated theme-secondary-text'
                }`}>
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded uppercase tracking-wider ${
                  isOwner ? 'bg-emerald-500/20 text-emerald-500' : 'theme-surface-elevated theme-muted-text'
                }`}>
                  {isOwner ? '✓' : 'A'}
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`p-1.5 rounded-xl shrink-0 transition-colors ${
                    currentTab === 'admin' 
                      ? 'bg-emerald-500/30 text-emerald-500' 
                      : isOwner 
                      ? 'bg-emerald-500/15 text-emerald-500 group-hover:bg-emerald-500/25' 
                      : 'theme-surface-elevated theme-secondary-text'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                  </span>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-bold truncate">Admin Command Portal</div>
                    <div className="text-[10px] theme-muted-text font-mono truncate">
                      {isOwner ? '⚡ Owner Verified' : 'Restricted (Owner)'}
                    </div>
                  </div>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                  isOwner ? 'bg-emerald-500/20 text-emerald-500' : 'theme-surface-elevated theme-muted-text'
                }`}>
                  {isOwner ? 'Live' : 'Admin'}
                </span>
              </>
            )}
          </button>

          {/* Navigation Links Grouped with Vertical Proximity Springs */}
          <nav 
            data-tour="sidebar-navigation"
            onMouseMove={(e) => {
              if (!reduce) mouseY.set(e.clientY);
            }}
            onMouseLeave={() => {
              mouseY.set(FAR_Y);
              setHoveredNavId(null);
            }}
            className={`space-y-4 overflow-y-auto pr-1 ${
              isSidebarCollapsed ? 'max-h-[calc(100vh-18rem)]' : 'max-h-[calc(100vh-22rem)]'
            }`}
          >
            {navSections.map((section) => (
              <div key={section.heading} className="space-y-1">
                {!isSidebarCollapsed && (
                  <div className="px-3 text-[10px] font-mono uppercase tracking-wider theme-muted-text font-semibold">
                    {section.heading}
                  </div>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <div key={item.id} className="relative group">
                      <VerticalDockNavItem
                        id={item.id}
                        label={item.label}
                        icon={item.icon}
                        isActive={currentTab === item.id}
                        onClick={() => handleNavClick(item.id)}
                        mouseY={mouseY}
                        reduce={reduce}
                        isHovered={hoveredNavId === item.id}
                        onEnter={() => setHoveredNavId(item.id)}
                        isCollapsed={isSidebarCollapsed}
                      />
                      
                      {/* Tooltip for collapsed state */}
                      {isSidebarCollapsed && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                          {item.label}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Safety Disclaimers & Auth */}
        <div className={`pt-3 border-t theme-border ${isSidebarCollapsed ? 'space-y-1' : 'space-y-2.5'}`}>
          {!isSidebarCollapsed && (
            <div className="p-2.5 theme-surface-subtle rounded-xl border theme-border text-[10px] theme-secondary-text leading-relaxed">
              🛡️ <strong>Educational Simulation:</strong> No real capital at risk. Practice before real markets.
            </div>
          )}

          <div className={`${isSidebarCollapsed ? 'flex flex-col items-center gap-1' : 'space-y-1'}`}>
            {onRestartFromBeginning && (
              <button
                type="button"
                id="btn-sidebar-restart"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onRestartFromBeginning();
                }}
                className={`transition-all cursor-pointer interactive-btn ${
                  isSidebarCollapsed 
                    ? 'p-2 rounded-xl theme-surface-subtle border theme-border hover:theme-primary-bg hover:text-white flex items-center justify-center w-full group' 
                    : 'w-full flex items-center justify-center gap-1.5 py-1.5 text-xs theme-secondary-text hover:theme-main-text hover:theme-surface-subtle rounded-lg'
                }`}
                title={isSidebarCollapsed ? 'Start from Beginning' : undefined}
              >
                <RotateCcw className={`${isSidebarCollapsed ? 'w-4 h-4 group-hover:scale-110 transition-transform' : 'w-3.5 h-3.5'}`} />
                {!isSidebarCollapsed && <span>Start from Beginning</span>}
              </button>
            )}

            {currentUser ? (
              <button
                type="button"
                id="btn-signout-cloud"
                onClick={onSignOut}
                className={`transition-all cursor-pointer interactive-btn ${
                  isSidebarCollapsed 
                    ? 'p-2 rounded-xl theme-surface-subtle border theme-border hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center w-full group' 
                    : 'w-full flex items-center justify-center gap-2 py-1.5 text-xs theme-secondary-text hover:text-rose-600'
                }`}
                title={isSidebarCollapsed ? 'Logout' : undefined}
              >
                <LogOut className={`${isSidebarCollapsed ? 'w-4 h-4 group-hover:scale-110 transition-transform' : 'w-3.5 h-3.5'}`} />
                {!isSidebarCollapsed && <span>Logout</span>}
              </button>
            ) : (
              <button
                type="button"
                id="btn-sidebar-auth"
                onClick={onOpenAuthModal}
                className={`transition-all cursor-pointer interactive-btn ${
                  isSidebarCollapsed 
                    ? 'p-2 rounded-xl theme-surface-subtle border theme-border hover:theme-primary-bg hover:text-white flex items-center justify-center w-full group' 
                    : 'w-full flex items-center justify-center gap-2 py-1.5 text-xs theme-primary-text hover:underline font-semibold'
                }`}
                title={isSidebarCollapsed ? 'Cloud Sync' : undefined}
              >
                <Cloud className={`${isSidebarCollapsed ? 'w-4 h-4 group-hover:scale-110 transition-transform' : 'w-3.5 h-3.5'}`} />
                {!isSidebarCollapsed && <span>Cloud Sync</span>}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Viewport - Adjusts based on sidebar state */}
      <main className={`flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-h-screen transition-all duration-300 pb-24 md:pb-8 ${
        isSidebarCollapsed ? 'md:ml-0' : ''
      }`}>
        {children}
      </main>

      {/* Mobile Bottom Quick Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 theme-card border-t theme-border px-2 py-2 flex items-center justify-around z-30 shadow-md">
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-semibold interactive-btn ${
            currentTab === 'dashboard' ? 'theme-primary-text font-bold' : 'theme-secondary-text'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('roadmap')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-semibold interactive-btn ${
            currentTab === 'roadmap' ? 'theme-primary-text font-bold' : 'theme-secondary-text'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Learn</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('paper_trading')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-semibold interactive-btn ${
            currentTab === 'paper_trading' ? 'theme-primary-text font-bold' : 'theme-secondary-text'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Trade</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('mentor')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-semibold interactive-btn ${
            currentTab === 'mentor' ? 'theme-primary-text font-bold' : 'theme-secondary-text'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Mentor</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-semibold theme-secondary-text interactive-btn"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </div>
    </div>
  );
};
