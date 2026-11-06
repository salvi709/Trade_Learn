import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Check, 
  Flame, 
  Trophy, 
  BookOpen, 
  Coins, 
  UserCheck, 
  Target, 
  Calendar,
  Sparkles,
  Shield,
  Award
} from 'lucide-react';
import { UserProfile, UserProgress, PaperPortfolio } from '../../types';
import { getAvatarById } from '../../config/avatars';
import { cn } from '../../lib/utils';

interface MyProfileCardProps {
  profile: UserProfile;
  progress: UserProgress;
  portfolio: PaperPortfolio;
  currentUser?: any;
  className?: string;
}

export const MyProfileCard: React.FC<MyProfileCardProps> = ({
  profile,
  progress,
  portfolio,
  currentUser,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isFollowing, setIsFollowing] = useState<boolean>(true); // Study mode active toggle
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const currentAvatar = getAvatarById(profile.avatarId);
  const streak = progress.currentStreak || progress.learningStreakDays || 1;
  const completedCount = progress.completedLessons?.length || 0;
  const masteryPercent = progress.overallProgress || 0;
  const displayName = profile.displayName || (currentUser?.displayName || 'TradeQuest Scholar');
  const currencySymbol = profile.currency === 'USD' ? '$' : profile.currency === 'EUR' ? '€' : profile.currency === 'GBP' ? '£' : profile.currency === 'JPY' ? '¥' : '₹';

  // Calculate learning tier
  const getLearnerTier = () => {
    if (masteryPercent >= 90) return { title: 'Master Market Strategist', color: 'from-amber-500 to-emerald-500', icon: Award };
    if (masteryPercent >= 60) return { title: 'Advanced Technical Analyst', color: 'from-blue-500 to-indigo-500', icon: Trophy };
    if (masteryPercent >= 30) return { title: 'Disciplined Paper Trader', color: 'from-emerald-500 to-teal-500', icon: Shield };
    return { title: 'Foundational Explorer', color: 'from-slate-500 to-emerald-600', icon: Sparkles };
  };

  const tier = getLearnerTier();
  const TierIcon = tier.icon;

  const letterVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring" as const,
        damping: 10,
        stiffness: 220,
      }
    },
  };

  const handleShareProfile = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between border-b theme-border pb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 theme-primary-text" />
          <h3 className="text-base font-bold font-heading theme-main-text">
            My Profile
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider theme-primary-text theme-soft-accent-bg px-2.5 py-1 rounded-full border theme-border font-bold">
            Public Learner Card
          </span>
        </div>
      </div>

      {/* Main Profile Showcase Card */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl theme-card border theme-border shadow-md"
      >
        {/* Banner Decorative Ambient Top Accent */}
        <div 
          className="h-28 w-full relative overflow-hidden flex items-end px-6 pb-3"
          style={{
            background: `linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 50%, transparent 100%)`
          }}
        >
          {/* Subtle Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Tier Badge pill top right */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md border theme-border text-[11px] font-semibold theme-main-text shadow-xs">
            <TierIcon className="w-3.5 h-3.5 theme-primary-text" />
            <span>{tier.title}</span>
          </div>
        </div>

        {/* Profile Content Container */}
        <div className="p-6 pt-0 space-y-6">
          {/* Avatar & Main Identity Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              {/* Avatar Icon Box */}
              <motion.div 
                whileHover={shouldReduceMotion ? {} : { scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="w-20 h-20 rounded-2xl theme-card border-2 theme-border shadow-lg flex items-center justify-center text-4xl shrink-0 relative z-10"
              >
                {currentAvatar.svgIcon}
                <div 
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 theme-card shadow-xs"
                  title="Verified TradeQuest Scholar"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </motion.div>

              {/* Names & Handle */}
              <div className="space-y-0.5 min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading theme-main-text flex items-center flex-wrap">
                    {displayName.split("").map((letter: string, index: number) => (
                      <motion.span
                        key={index}
                        variants={letterVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: shouldReduceMotion ? 0 : index * 0.02 }}
                        className="inline-block"
                      >
                        {letter === " " ? "\u00A0" : letter}
                      </motion.span>
                    ))}
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-xs theme-secondary-text font-mono">
                  <span>{profile.username ? `@${profile.username}` : `@${displayName.toLowerCase().replace(/\s+/g, '')}`}</span>
                  <span>•</span>
                  <span className="theme-primary-text font-semibold">{currentAvatar.name}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShareProfile}
                className="px-3.5 py-2 theme-surface-subtle hover:theme-surface-elevated theme-main-text text-xs font-semibold rounded-xl border theme-border transition-all cursor-pointer shadow-2xs"
              >
                {copiedLink ? 'Copied Link!' : 'Share Profile'}
              </button>
              <button
                type="button"
                onClick={() => setIsFollowing(!isFollowing)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5",
                  isFollowing
                    ? "theme-btn-primary"
                    : "theme-surface-subtle theme-main-text hover:theme-surface-elevated border theme-border"
                )}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Study Mode: Active</span>
                  </>
                ) : (
                  <span>Activate Study Mode</span>
                )}
              </button>
            </div>
          </div>

          {/* Persona Role & Bio */}
          <div className="p-4 rounded-2xl theme-surface-subtle border theme-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold theme-main-text">{currentAvatar.role}</span>
              <span className="text-[11px] font-mono theme-muted-text">Strategy Persona</span>
            </div>
            <p className="text-xs theme-secondary-text leading-relaxed">
              {currentAvatar.description}
            </p>
          </div>

          {/* Key Live Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Streak */}
            <div className="p-3.5 rounded-2xl theme-surface-subtle border theme-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider theme-muted-text font-semibold">
                  Active Streak
                </span>
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-lg font-bold font-mono text-amber-500">
                {streak} {streak === 1 ? 'day' : 'days'}
              </div>
              <div className="text-[10px] theme-muted-text">Daily habit consistency</div>
            </div>

            {/* Curriculum Mastery */}
            <div className="p-3.5 rounded-2xl theme-surface-subtle border theme-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider theme-muted-text font-semibold">
                  Curriculum
                </span>
                <Trophy className="w-4 h-4 theme-primary-text" />
              </div>
              <div className="text-lg font-bold font-mono theme-primary-text">
                {masteryPercent}%
              </div>
              <div className="text-[10px] theme-muted-text">{completedCount} of 10 stages completed</div>
            </div>

            {/* Lessons Completed */}
            <div className="p-3.5 rounded-2xl theme-surface-subtle border theme-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider theme-muted-text font-semibold">
                  Lessons Done
                </span>
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-lg font-bold font-mono theme-main-text">
                {completedCount}
              </div>
              <div className="text-[10px] theme-muted-text">Interactive chapters</div>
            </div>

            {/* Virtual Cash */}
            <div className="p-3.5 rounded-2xl theme-surface-subtle border theme-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider theme-muted-text font-semibold">
                  Paper Capital
                </span>
                <Coins className="w-4 h-4 theme-positive-text" />
              </div>
              <div className="text-lg font-bold font-mono theme-positive-text truncate">
                {currencySymbol}{portfolio.virtualCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] theme-muted-text">Risk-free paper trading</div>
            </div>
          </div>

          {/* Badges / Philosophy Tags */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="px-3 py-1 rounded-xl theme-surface-subtle border theme-border theme-secondary-text font-medium flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 theme-primary-text" />
              Goal: {profile.learningGoal ? profile.learningGoal.replace('_', ' ').toUpperCase() : 'ALL-ROUND MASTERY'}
            </span>
            <span className="px-3 py-1 rounded-xl theme-surface-subtle border theme-border theme-secondary-text font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 theme-primary-text" />
              Joined: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
            </span>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold flex items-center gap-1.5">
              <Check className="w-3 h-3" />
              Risk-First Discipline
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
