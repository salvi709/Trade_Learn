'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  TrendingUp, 
  BookOpen, 
  ShieldCheck, 
  Compass, 
  Search, 
  BookA, 
  Bot, 
  Trophy, 
  FileText, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Shield,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE, APP_VERSION } from '@/src/config/branding';

export interface FooterLink {
  title: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isExternal?: boolean;
}

export interface FooterSection {
  label: string;
  links: FooterLink[];
}

export interface ShareMarketFooterProps {
  onSignIn?: () => void;
  onSignUp?: () => void;
  onGetStarted?: () => void;
  onExploreApp?: () => void;
  onSelectTab?: (tabId: string) => void;
  className?: string;
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>['className'];
  children: ReactNode;
};

export function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Footer({
  onSignIn,
  onSignUp,
  onGetStarted,
  onExploreApp,
  onSelectTab,
  className = '',
}: ShareMarketFooterProps = {}) {
  // Navigation sections strictly matching existing ShareMarket application capabilities
  const footerSections: FooterSection[] = [
    {
      label: 'Curriculum & Learn',
      links: [
        {
          title: 'Learning Roadmap',
          href: '#progression',
          onClick: onGetStarted || (() => onSelectTab?.('roadmap')),
          icon: Compass,
        },
        {
          title: 'Module 1: Equity Foundations',
          href: '#progression',
          onClick: onGetStarted || (() => onSelectTab?.('roadmap')),
          badge: 'Free',
          icon: BookOpen,
        },
        {
          title: 'A-Z Market Glossary',
          onClick: () => onSelectTab?.('glossary') || onExploreApp?.(),
          icon: BookA,
        },
        {
          title: 'Mastery Certification',
          onClick: () => onSelectTab?.('final_challenge') || onGetStarted?.(),
          badge: 'Test',
          icon: Trophy,
        },
      ],
    },
    {
      label: 'Risk-Free Practice',
      links: [
        {
          title: 'Paper Trading Lab',
          href: '#practice',
          onClick: onExploreApp || (() => onSelectTab?.('paper_trading')),
          badge: '₹1 Lakh Sim',
          icon: TrendingUp,
        },
        {
          title: 'Reflective Trade Journal',
          onClick: () => onSelectTab?.('journal') || onExploreApp?.(),
          icon: FileText,
        },
        {
          title: 'Scenario & Order Simulator',
          href: '#practice',
          onClick: onExploreApp || (() => onSelectTab?.('paper_trading')),
          icon: Activity,
        },
        {
          title: 'Daily Discipline Streaks',
          href: '#streaks',
          icon: Sparkles,
        },
      ],
    },
    {
      label: 'Forensic Lab & AI',
      links: [
        {
          title: 'AI Market Mentor',
          href: '#mentor',
          onClick: () => onSelectTab?.('mentor') || onExploreApp?.(),
          badge: 'Socratic',
          icon: Bot,
        },
        {
          title: 'Stock Detective Lab',
          href: '#challenges',
          onClick: () => onSelectTab?.('stock_detective') || onExploreApp?.(),
          icon: Search,
        },
        {
          title: 'Scam & FOMO Detector',
          href: '#challenges',
          onClick: () => onSelectTab?.('scam_detector') || onExploreApp?.(),
          badge: 'Defense',
          icon: ShieldCheck,
        },
      ],
    },
    {
      label: 'Account & Platform',
      links: [
        {
          title: 'Learner Dashboard',
          onClick: onSignIn || (() => onSelectTab?.('dashboard')),
        },
        {
          title: 'Cloud Sync & Progress',
          onClick: onSignIn || onSignUp,
        },
        {
          title: 'Guided App Tour',
          onClick: onExploreApp,
          icon: RotateCcw,
        },
        {
          title: 'Risk Policy & Integrity',
          href: '#top',
          icon: Shield,
        },
      ],
    },
  ];

  const handleLinkClick = (e: React.MouseEvent, link: FooterLink) => {
    if (link.onClick) {
      e.preventDefault();
      link.onClick();
    } else if (link.href?.startsWith('#')) {
      e.preventDefault();
      const targetElement = document.querySelector(link.href);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer
      className={`relative w-full border-t border-slate-200 dark:border-gray-900 bg-white dark:bg-black text-slate-900 dark:text-white px-6 pt-16 pb-12 overflow-hidden ${className}`}
      aria-label="ShareMarket Platform Footer"
    >
      {/* Top subtle radial green glow & glowing divider beam */}
      <div 
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-44 w-full max-w-5xl bg-[radial-gradient(ellipse_at_top,rgba(13,104,71,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.14),transparent_70%)]" 
        aria-hidden="true"
      />
      <div 
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-2/3 max-w-2xl bg-gradient-to-r from-transparent via-[#0D6847]/35 dark:via-emerald-500/40 to-transparent blur-[0.5px]" 
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 mb-16">
          {/* Brand & Mission Statement Column (4 columns on lg) */}
          <AnimatedContainer className="lg:col-span-4 space-y-5" delay={0.05}>
            {/* Logo + Name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#095237] via-[#0D6847] to-emerald-500 text-white font-black text-base flex items-center justify-center shadow-lg shadow-emerald-600/20 border border-emerald-400/30">
                TQ
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-slate-900 dark:text-white text-lg font-heading">
                    ShareMarket
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-500/30 text-[#0D6847] dark:text-emerald-400 font-semibold">
                    Sim v{APP_VERSION}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-gray-500">{APP_TAGLINE}</span>
              </div>
            </div>

            {/* Clear value proposition */}
            <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed max-w-sm">
              Learn the stock market. Practice without risking real money. From understanding your first share to mastering forensic balance sheet analysis.
            </p>

            {/* Live Paper Simulator Status Banner */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-800/80 bg-slate-50 dark:bg-gray-950/70 text-xs text-slate-700 dark:text-gray-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0D6847] dark:bg-emerald-500"></span>
              </span>
              <span className="font-mono text-slate-500 dark:text-gray-400">Sandbox Capital:</span>
              <span className="font-mono font-semibold text-[#0D6847] dark:text-emerald-400">₹1,00,000 Live Virtual Cash</span>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {onGetStarted && (
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="interactive-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0D6847] hover:bg-[#095237] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer"
                >
                  Start Learning Free
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
              {onSignIn && (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="interactive-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 bg-slate-50 dark:bg-gray-900/50 hover:bg-slate-100 dark:hover:bg-gray-900 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all duration-200 cursor-pointer"
                >
                  Sign In / Sync
                </button>
              )}
            </div>
          </AnimatedContainer>

          {/* Navigation Columns (8 columns on lg) */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerSections.map((section, sectionIdx) => (
              <AnimatedContainer
                key={section.label}
                delay={0.1 + sectionIdx * 0.08}
                className="space-y-4"
              >
                <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-slate-700 dark:text-gray-300">
                  {section.label}
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {section.links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <li key={link.title}>
                        <a
                          href={link.href || '#'}
                          onClick={(e) => handleLinkClick(e, link)}
                          className="group inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-400 hover:text-[#0D6847] dark:hover:text-white transition-colors duration-200 cursor-pointer"
                        >
                          {Icon && (
                            <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500 group-hover:text-[#0D6847] dark:group-hover:text-emerald-400 transition-colors duration-200 shrink-0" />
                          )}
                          <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                            {link.title}
                          </span>
                          {link.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[#0D6847] dark:text-emerald-400 font-semibold">
                              {link.badge}
                            </span>
                          )}
                          {link.isExternal && (
                            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </AnimatedContainer>
            ))}
          </div>
        </div>

        {/* Regulatory & Safety Transparency Notice */}
        <AnimatedContainer delay={0.4} className="border-t border-slate-200 dark:border-gray-900/80 pt-8 pb-6">
          <div className="rounded-xl border border-slate-200 dark:border-gray-800/60 bg-slate-50 dark:bg-gray-950/40 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#0D6847] dark:text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Risk Disclosure & Educational Mandate
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-gray-400 leading-relaxed max-w-4xl">
                  {APP_NAME} (ShareMarket) is an educational simulation platform. All portfolio holdings, cash amounts (including the ₹1,00,000 starting credit), prices, and stock symbols are purely simulated. No real money can ever be deposited, traded, or lost. This platform is not a broker, registered investment adviser (RIA), or research analyst with SEBI or the SEC.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block text-[11px] font-mono font-semibold text-[#0D6847] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-lg">
                100% Zero Capital Risk
              </span>
            </div>
          </div>
        </AnimatedContainer>

        {/* Bottom Bar: Copyright & Sub-Nav */}
        <div className="pt-6 border-t border-slate-200 dark:border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} {APP_NAME} &bull; ShareMarket. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="text-slate-600 dark:text-gray-400">Educational Sandbox</span>
            <span>&bull;</span>
            <span className="text-slate-600 dark:text-gray-400">Strictly Non-Advisory</span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0D6847] dark:bg-emerald-500"></span>
              Virtual Engine Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer as ShareMarketFooter };
