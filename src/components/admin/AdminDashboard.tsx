import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Layers, 
  Bot, 
  Activity, 
  DollarSign, 
  Sliders, 
  Sparkles,
  LayoutDashboard,
  CheckCircle2
} from 'lucide-react';
import { 
  ADMIN_OWNER_EMAIL, 
  AdminAnalyticsData, 
  AdminUserRecord, 
  fetchPlatformAnalytics, 
  fetchAdminUsers,
  triggerTactileHaptic
} from '../../services/adminService';
import { APP_NAME } from '../../config/branding';

import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminLearningTab } from './AdminLearningTab';
import { AdminFeaturesTab } from './AdminFeaturesTab';
import { AdminMentorAnalyticsTab } from './AdminMentorAnalyticsTab';
import { AdminEngagementTab } from './AdminEngagementTab';
import { AdminMonetizationTab } from './AdminMonetizationTab';
import { AdminControlsTab } from './AdminControlsTab';
import { AdminIntelligenceMentorTab } from './AdminIntelligenceMentorTab';

interface AdminDashboardProps {
  adminEmail: string;
  onReturnToApp: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminEmail, onReturnToApp }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async (range: '7d' | '30d' | '90d' | 'all' = timeRange) => {
    try {
      const [analyticsData, usersData] = await Promise.all([
        fetchPlatformAnalytics(adminEmail, range),
        fetchAdminUsers(adminEmail),
      ]);
      setAnalytics(analyticsData);
      setUsers(usersData);
    } catch (err) {
      console.warn('Admin load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(timeRange);
  }, [adminEmail, timeRange]);

  const handleRefresh = () => {
    triggerTactileHaptic(8);
    setRefreshing(true);
    loadData(timeRange);
  };

  const handleTimeRangeChange = (range: '7d' | '30d' | '90d' | 'all') => {
    triggerTactileHaptic(6);
    setTimeRange(range);
    setRefreshing(true);
    loadData(range);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users, badge: users.length || 48 },
    { id: 'learning', label: 'Learning Analytics', icon: BookOpen },
    { id: 'features', label: 'Feature Usage', icon: Layers },
    { id: 'ai_mentor', label: 'AI Mentor Analytics', icon: Bot },
    { id: 'engagement', label: 'Retention & Engagement', icon: Activity },
    { id: 'monetization', label: 'Monetization', icon: DollarSign },
    { id: 'controls', label: 'System Controls', icon: Sliders },
    { id: 'admin_ai', label: 'Admin Intelligence AI', icon: Sparkles, highlight: true },
  ];

  return (
    <div className="min-h-screen theme-bg theme-main-text pb-16">
      {/* Top Header Bar */}
      <header className="theme-card border-b theme-border sticky top-0 z-40 shadow-xs backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Brand & System Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center font-black font-heading shadow-md shadow-emerald-500/20">
              SM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-sm md:text-base tracking-tight theme-main-text">
                  {APP_NAME} <span className="text-[#0D6847] dark:text-[#299C70]">Admin Command Portal</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0D6847]/15 text-[#0D6847] dark:text-[#299C70] border border-[#0D6847]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D6847] dark:bg-[#299C70] animate-pulse" />
                  Systems Operational
                </span>
              </div>
              <div className="text-[11px] theme-muted-text flex items-center gap-2">
                <span>Owner: <strong className="theme-main-text font-mono">{ADMIN_OWNER_EMAIL}</strong></span>
                <span>•</span>
                <span>Gemini 2.5 Flash Online</span>
              </div>
            </div>
          </div>

          {/* Time Filter & Quick Actions */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Timeframe Tabs */}
            <div className="flex items-center p-0.5 rounded-lg theme-surface-subtle border theme-border font-medium">
              {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleTimeRangeChange(r)}
                  className={`py-1 px-2.5 rounded-md transition-all cursor-pointer ${
                    timeRange === r
                      ? 'theme-primary-bg text-white font-bold shadow-xs'
                      : 'theme-muted-text hover:theme-main-text'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh Analytics"
              className="p-2 rounded-lg theme-surface-subtle border theme-border hover:border-emerald-500/40 theme-muted-text hover:theme-main-text transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
            </button>

            {/* Return to Learner Mode Button */}
            <button
              type="button"
              onClick={onReturnToApp}
              className="py-1.5 px-3 rounded-lg theme-primary-btn font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Learner Mode
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar border-t theme-border pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  triggerTactileHaptic(6);
                  setActiveTab(item.id);
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all border-b-2 ${
                  isActive
                    ? 'border-[#0D6847] text-[#0D6847] dark:border-[#299C70] dark:text-[#299C70] bg-[#0D6847]/10'
                    : 'border-transparent theme-muted-text hover:theme-main-text hover:theme-surface-subtle'
                } ${item.highlight && !isActive ? 'text-amber-500 font-bold' : ''}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0D6847] dark:text-[#299C70]' : ''}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] theme-surface-elevated theme-border border theme-muted-text font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading || !analytics ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs theme-muted-text">
              Aggregating live platform analytics from Cloud Firestore...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <AdminOverviewTab analytics={analytics} onSelectTab={setActiveTab} />
            )}
            {activeTab === 'users' && (
              <AdminUsersTab users={users} loading={refreshing} />
            )}
            {activeTab === 'learning' && (
              <AdminLearningTab analytics={analytics} />
            )}
            {activeTab === 'features' && (
              <AdminFeaturesTab analytics={analytics} />
            )}
            {activeTab === 'ai_mentor' && (
              <AdminMentorAnalyticsTab analytics={analytics} />
            )}
            {activeTab === 'engagement' && (
              <AdminEngagementTab analytics={analytics} />
            )}
            {activeTab === 'monetization' && (
              <AdminMonetizationTab analytics={analytics} />
            )}
            {activeTab === 'controls' && (
              <AdminControlsTab adminEmail={adminEmail} analytics={analytics} />
            )}
            {activeTab === 'admin_ai' && (
              <AdminIntelligenceMentorTab adminEmail={adminEmail} analytics={analytics} />
            )}
          </>
        )}
      </main>
    </div>
  );
};
