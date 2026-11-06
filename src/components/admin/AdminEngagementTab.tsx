import React from 'react';
import { 
  Users, 
  Flame, 
  Clock, 
  Calendar, 
  TrendingUp, 
  BarChart2, 
  Activity,
  HeartHandshake
} from 'lucide-react';
import { AdminAnalyticsData } from '../../services/adminService';
import { AdminDonutChart, AdminBarChart } from './AdminCharts';

interface AdminEngagementTabProps {
  analytics: AdminAnalyticsData;
}

export const AdminEngagementTab: React.FC<AdminEngagementTabProps> = ({ analytics }) => {
  const { engagement } = analytics;

  const streakDonutData = engagement.streakDistribution.map((s) => ({
    label: s.range,
    value: s.count,
    subLabel: `${s.percent}% of active`,
  }));

  const peakHoursBarData = engagement.peakHours.map((h) => ({
    label: h.hour,
    value: h.activity,
    format: ' active',
  }));

  return (
    <div className="space-y-6">
      {/* Top Active User Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* DAU */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
            Daily Active Learners (DAU)
          </span>
          <div className="text-3xl font-extrabold font-heading text-emerald-500 tabular-nums">
            {engagement.dau}
          </div>
          <span className="text-xs theme-muted-text">Active in past 24 hours</span>
        </div>

        {/* WAU */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
            Weekly Active Learners (WAU)
          </span>
          <div className="text-3xl font-extrabold font-heading text-blue-500 tabular-nums">
            {engagement.wau}
          </div>
          <span className="text-xs theme-muted-text">Active in past 7 days</span>
        </div>

        {/* MAU */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
            Monthly Active Learners (MAU)
          </span>
          <div className="text-3xl font-extrabold font-heading theme-main-text tabular-nums">
            {engagement.mau}
          </div>
          <span className="text-xs theme-muted-text">Active in past 30 days</span>
        </div>

        {/* Stickiness DAU / MAU */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
            Platform Stickiness (DAU/MAU)
          </span>
          <div className="text-3xl font-extrabold font-heading text-amber-500 tabular-nums">
            {engagement.stickinessDauMau}%
          </div>
          <span className="text-xs text-emerald-500 font-medium">Top quartile for educational apps</span>
        </div>
      </div>

      {/* Two Column: Donut for Streak Distribution & Peak Hours Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streak Distribution Donut */}
        <AdminDonutChart
          title="Learning Streak Distribution"
          subtitle="Breakdown of daily study consistency across the active learner population"
          data={streakDonutData}
          centerLabel="Active Streaks"
          centerValue={engagement.dau}
        />

        {/* Hourly Peak Activity */}
        <AdminBarChart
          title="Daily Activity Peak Hours"
          subtitle="Learner traffic volume by time of day (IST)"
          data={peakHoursBarData}
          maxValue={60}
        />
      </div>

      {/* Retention Rates Section */}
      <div className="theme-card border theme-border rounded-xl p-5 space-y-4 shadow-xs">
        <div>
          <h3 className="font-heading font-bold text-base theme-main-text flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-500" />
            Cohort Retention Benchmarks
          </h3>
          <p className="text-xs theme-muted-text">
            Percentage of learners continuing study after initial profile setup
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-xl theme-surface-subtle border theme-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium theme-main-text">Day 7 Learner Retention</span>
              <span className="font-mono text-emerald-500 font-bold">{engagement.retention7Day}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${engagement.retention7Day}%` }}
              />
            </div>
            <p className="text-[11px] theme-muted-text">
              Students returning to finish stages within their first week.
            </p>
          </div>

          <div className="p-4 rounded-xl theme-surface-subtle border theme-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium theme-main-text">Day 30 Platform Retention</span>
              <span className="font-mono text-blue-500 font-bold">{engagement.retention30Day}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${engagement.retention30Day}%` }}
              />
            </div>
            <p className="text-[11px] theme-muted-text">
              Active paper traders and journal writers after one month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
