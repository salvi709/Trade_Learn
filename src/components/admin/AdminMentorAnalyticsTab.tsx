import React from 'react';
import { 
  Bot, 
  Sparkles, 
  DollarSign, 
  Cpu, 
  PieChart, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Paperclip,
  Activity
} from 'lucide-react';
import { AdminAnalyticsData } from '../../services/adminService';
import { AdminDonutChart, AdminBarChart } from './AdminCharts';

interface AdminMentorAnalyticsTabProps {
  analytics: AdminAnalyticsData;
}

export const AdminMentorAnalyticsTab: React.FC<AdminMentorAnalyticsTabProps> = ({ analytics }) => {
  const aiMentor = analytics?.aiMentorAnalytics || {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    successRate: 100,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    estimatedCostUSD: 0,
    estimatedCostINR: 0,
    eli15Count: 0,
    deepDiveCount: 0,
    multimodalCount: 0,
    topicCounts: {},
    recentMetrics: [],
  };

  const topicsList = Object.entries(aiMentor.topicCounts || {});

  const modeDonutData = [
    { label: 'ELI15 Analogies', value: aiMentor.eli15Count || 0, color: '#10B981' },
    { label: 'Deep Dive Quantitative', value: aiMentor.deepDiveCount || 0, color: '#3B82F6' },
    { label: 'Multimodal Files', value: aiMentor.multimodalCount || 0, color: '#F59E0B' },
  ];

  const topicsBarData = topicsList.map(([topic, count]) => ({
    label: topic,
    value: count,
    format: ' queries',
  }));

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inquiries */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Total Inquiries
            </span>
            <Bot className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-heading theme-main-text tabular-nums">
            {aiMentor.totalQueries}
          </div>
          <div className="text-xs text-emerald-500 font-medium">
            {aiMentor.successRate}% Success Resolution
          </div>
        </div>

        {/* Estimated Token Cost */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Gemini 2.5 Flash Cost
            </span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-heading theme-main-text tabular-nums">
            ${aiMentor.estimatedCostUSD} <span className="text-xs font-normal theme-muted-text">USD</span>
          </div>
          <div className="text-xs theme-muted-text font-mono">
            Approx ₹{aiMentor.estimatedCostINR} INR
          </div>
        </div>

        {/* Total Tokens Consumed */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Tokens Processed
            </span>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-heading theme-main-text font-mono tabular-nums">
            {((aiMentor.totalInputTokens || 0) + (aiMentor.totalOutputTokens || 0)).toLocaleString()}
          </div>
          <div className="text-xs theme-muted-text">
            {(aiMentor.totalInputTokens || 0).toLocaleString()} in / {(aiMentor.totalOutputTokens || 0).toLocaleString()} out
          </div>
        </div>

        {/* Multimodal Attachments */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Multimodal Analyses
            </span>
            <Paperclip className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-heading theme-main-text tabular-nums">
            {aiMentor.multimodalCount}
          </div>
          <div className="text-xs text-amber-500 font-medium">
            Charts & Financial PDFs analyzed
          </div>
        </div>
      </div>

      {/* Two Column: Donut for Mode Breakdown & Bar for Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mode Distribution Donut */}
        <AdminDonutChart
          title="Pedagogical Explanation Modes"
          subtitle="Breakdown between beginner analogies (ELI15), quantitative metrics (Deep Dive), and image uploads"
          data={modeDonutData}
          centerLabel="Total Calls"
          centerValue={aiMentor.totalQueries}
        />

        {/* Topic Classification Bar Chart */}
        <AdminBarChart
          title="Student Inquiry Topic Classification"
          subtitle="Privacy-conscious categorization of learner inquiries answered by Gemini"
          data={topicsBarData}
        />
      </div>

      {/* Cost & Latency Rates Card */}
      <div className="theme-card border theme-border rounded-xl p-5 space-y-4 shadow-xs">
        <div className="space-y-1">
          <h3 className="font-heading font-bold text-base theme-main-text flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Gemini 2.5 Flash Telemetry & Pricing Tier
          </h3>
          <p className="text-xs theme-muted-text">
            Model endpoint operational parameters and estimated token budgets
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
            <span className="theme-muted-text">Production Model</span>
            <div className="font-mono font-bold text-emerald-500">gemini-2.5-flash</div>
          </div>
          <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
            <span className="theme-muted-text">Input Token Rate</span>
            <div className="font-mono font-bold theme-main-text">$0.075 / 1M tokens</div>
          </div>
          <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
            <span className="theme-muted-text">Output Token Rate</span>
            <div className="font-mono font-bold theme-main-text">$0.300 / 1M tokens</div>
          </div>
          <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
            <span className="theme-muted-text">Projected Monthly Cost</span>
            <div className="font-mono font-bold text-emerald-500">&lt; $1.50 USD</div>
          </div>
        </div>
      </div>

      {/* Recent AI Query Log Stream */}
      <div className="theme-card border theme-border rounded-xl p-5 space-y-3 shadow-xs">
        <h3 className="font-heading font-bold text-base theme-main-text flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Recent AI Mentor Requests Stream
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="theme-surface-subtle theme-secondary-text border-b theme-border uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Classified Topic</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Attachment</th>
                <th className="py-2.5 px-3">Tokens (Est)</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {(aiMentor.recentMetrics || []).map((r, i) => (
                <tr key={i} className="hover:theme-surface-subtle transition-colors">
                  <td className="py-2.5 px-3 font-mono theme-muted-text">
                    {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 font-semibold theme-main-text">
                    {r.topic}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                      r.mode === 'deep_dive' ? 'bg-blue-500/15 text-blue-500' : 'bg-emerald-500/15 text-emerald-500'
                    }`}>
                      {r.mode.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {r.hasAttachment ? (
                      <span className="inline-flex items-center gap-1 text-amber-500 font-medium text-[11px]">
                        <Paperclip className="w-3 h-3" /> Attached
                      </span>
                    ) : (
                      <span className="theme-muted-text">None</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono theme-muted-text">
                    {r.estimatedInputTokens + r.estimatedOutputTokens} tokens
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                      SUCCESS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
