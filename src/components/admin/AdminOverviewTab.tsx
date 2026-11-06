import React from 'react';
import { 
  Users, 
  TrendingUp, 
  BookOpen, 
  Bot, 
  CheckCircle2, 
  Activity, 
  DollarSign, 
  Flame, 
  ShieldCheck, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { AdminAnalyticsData } from '../../services/adminService';
import { AdminDonutChart, AdminBarChart, AdminLineChart } from './AdminCharts';

interface AdminOverviewTabProps {
  analytics: AdminAnalyticsData;
  onSelectTab: (tabId: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({ analytics, onSelectTab }) => {
  const { kpis, aiMentorAnalytics, moduleAnalytics, engagement, featureAdoption, monetization } = analytics;

  const kpiCards = [
    {
      title: 'Total Registered Learners',
      value: kpis.totalRegisteredUsers,
      sub: `${kpis.dau} active today (DAU)`,
      icon: Users,
      trend: '+12% this week',
      tabTarget: 'users',
      color: 'emerald',
    },
    {
      title: 'Active Streaks Maintained',
      value: kpis.activeStreaks,
      sub: `${engagement.stickinessDauMau}% DAU/MAU stickiness`,
      icon: Flame,
      trend: '+3 new records',
      tabTarget: 'engagement',
      color: 'amber',
    },
    {
      title: 'Avg Curriculum Completion',
      value: `${kpis.avgCompletionRate}%`,
      sub: 'Across 7 progressive stages',
      icon: BookOpen,
      trend: '89% in Foundations',
      tabTarget: 'learning',
      color: 'blue',
    },
    {
      title: 'AI Mentor Inquiries',
      value: kpis.totalAiQueries,
      sub: `${aiMentorAnalytics.successRate}% resolution rate`,
      icon: Bot,
      trend: `$${aiMentorAnalytics.estimatedCostUSD} token cost`,
      tabTarget: 'ai_mentor',
      color: 'purple',
    },
    {
      title: 'Paper Trades Executed',
      value: kpis.totalTradesExecuted,
      sub: `${analytics.paperTradingStats.buyOrders} Buy / ${analytics.paperTradingStats.sellOrders} Sell`,
      icon: TrendingUp,
      trend: '+28 orders logged',
      tabTarget: 'features',
      color: 'emerald',
    },
    {
      title: 'Platform System Health',
      value: `${kpis.systemUptimePercent}%`,
      sub: 'Gemini 2.5 Flash active',
      icon: ShieldCheck,
      trend: '< 240ms API latency',
      tabTarget: 'controls',
      color: 'teal',
    },
  ];

  // Stage distribution donut data
  const stageDonutData = moduleAnalytics.map((m) => ({
    label: m.title.replace(/^Level \d+:\s*/, '').substring(0, 18),
    value: m.completed,
    subLabel: `${m.completionRate}% completion`,
  }));

  // Feature adoption bar data
  const featureBarData = featureAdoption.map((f) => ({
    label: f.name,
    value: f.activePercent,
    format: '%',
    subText: `${f.totalInteractions} runs`,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectTab(kpi.tabTarget)}
              className="theme-card border theme-border rounded-xl p-5 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-xs relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
                    {kpi.title}
                  </span>
                  <div className="text-2xl lg:text-3xl font-extrabold font-heading theme-main-text tabular-nums">
                    {kpi.value}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t theme-border">
                <span className="theme-muted-text">{kpi.sub}</span>
                <span className="text-emerald-500 font-medium flex items-center gap-0.5">
                  {kpi.trend}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Charts Section (Donut & Line Graph) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Line Chart: Learner DAU & AI Requests */}
        <AdminLineChart
          title="Daily Learner Activity & AI Queries"
          subtitle="7-day rolling volume for daily active learners (DAU) and AI queries"
        />

        {/* Interactive Donut Chart: Curriculum Completion by Stage */}
        <AdminDonutChart
          title="Curriculum Stage Completion Distribution"
          subtitle="Proportion of students who completed each of the 7 progressive stages"
          data={stageDonutData}
          centerLabel="Total Finished"
          centerValue={kpis.totalRegisteredUsers}
        />
      </div>

      {/* Two Column Section: Feature Adoption & AI Mentor Quick Intel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Adoption Bar Chart */}
        <div className="lg:col-span-2">
          <AdminBarChart
            title="Interactive Feature Adoption Rate"
            subtitle="Percentage of active learners engaging with core practice modules"
            data={featureBarData}
            maxValue={100}
          />
        </div>

        {/* AI Mentor Quick Intel */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-bold text-base theme-main-text">
                AI Mentor Intel
              </h3>
            </div>
            <p className="text-xs theme-muted-text leading-relaxed">
              Real-time Gemini 2.5 Flash query distribution and educational topic classification.
            </p>
          </div>

          <div className="p-3.5 rounded-xl theme-surface-subtle border theme-border space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="theme-muted-text">Mode: ELI15 Analogies</span>
              <span className="font-mono font-bold text-emerald-500">{aiMentorAnalytics.eli15Count} calls</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="theme-muted-text">Mode: Deep Dive</span>
              <span className="font-mono font-bold text-blue-500">{aiMentorAnalytics.deepDiveCount} calls</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="theme-muted-text">Multimodal Uploads</span>
              <span className="font-mono font-bold text-amber-500">{aiMentorAnalytics.multimodalCount} files</span>
            </div>
            <div className="flex justify-between items-center border-t theme-border pt-1.5">
              <span className="theme-muted-text">Est. Gemini Token Cost</span>
              <span className="font-mono font-bold theme-main-text">${aiMentorAnalytics.estimatedCostUSD} USD</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('admin_ai')}
            className="w-full py-2.5 px-3 rounded-lg theme-primary-btn font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <Bot className="w-3.5 h-3.5" />
            Consult Admin Intelligence Copilot
          </button>
        </div>
      </div>
    </div>
  );
};
