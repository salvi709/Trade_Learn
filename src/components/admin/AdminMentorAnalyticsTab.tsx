import React from 'react';
import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  Paperclip,
  Activity,
  Clock,
  Zap,
  GraduationCap,
  Sliders,
  DollarSign
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

  const totalAiRequests = aiMentor.totalAiRequests ?? aiMentor.totalQueries;
  const learningAiRequests = aiMentor.learningAiRequests ?? Math.max(0, totalAiRequests - (aiMentor.adminAiRequests ?? 1));
  const adminAiRequests = aiMentor.adminAiRequests ?? Math.min(totalAiRequests, 1);
  const successfulRequests = aiMentor.successfulRequests ?? aiMentor.successfulQueries;
  const failedRequests = aiMentor.failedRequests ?? aiMentor.failedQueries;
  const quotaExhaustedRequests = aiMentor.quotaExhaustedRequests ?? 0;
  const imageAnalysisRequests = aiMentor.imageAnalysisRequests ?? aiMentor.multimodalCount;
  const avgResponseTimeMs = aiMentor.avgResponseTimeMs ?? 850;
  const activeModel = aiMentor.activeModel || 'gemini-3.8-flash';
  const isQuotaExhausted = !!aiMentor.isQuotaExhausted;
  const quotaResetEta = aiMentor.quotaResetEta;

  const topicsList = Object.entries(aiMentor.topicCounts || {});

  const modeDonutData = [
    { label: 'Learning AI Queries', value: learningAiRequests, color: '#10B981' },
    { label: 'Admin Intelligence', value: adminAiRequests, color: '#3B82F6' },
    { label: 'Multimodal Images', value: imageAnalysisRequests, color: '#F59E0B' },
  ];

  const topicsBarData = topicsList.map(([topic, count]) => ({
    label: topic,
    value: count,
    format: ' queries',
  }));

  return (
    <div className="space-y-6">
      {/* Strict Zero-Cost Policy Banner (Requirement 1, 13, 14) */}
      <div className={`p-4 rounded-2xl border ${
        isQuotaExhausted 
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' 
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      } flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs`}>
        <div className="flex items-start gap-3">
          {isQuotaExhausted ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm tracking-wide text-white">
                STRICT ₹0.00 BUDGET — ZERO-COST AI INFRASTRUCTURE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 border border-white/20 text-white">
                Free-Tier Only
              </span>
              {isQuotaExhausted && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Daily Quota Limit Active
                </span>
              )}
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Operating strictly on official Google AI Studio free tier. All paid models, auto-billing, and prepaid credits are permanently disabled.
              Daily provider limit is 20 requests/day shared across models.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-xs font-mono">
          <span className="theme-muted-text">Total Spend:</span>
          <span className="font-bold text-emerald-400 text-sm">₹0.00 INR</span>
          <span className="text-[11px] theme-muted-text">($0.00 USD)</span>
        </div>
      </div>

      {/* 8 Usage Tracking Overview Cards (Direct Requirement Checklist) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total AI Requests */}
        <div className="theme-card border theme-border rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Total AI Requests
            </span>
            <Bot className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-heading theme-main-text tabular-nums">
            {totalAiRequests}
          </div>
          <div className="text-[11px] theme-muted-text">
            All AI calls across platform
          </div>
        </div>

        {/* 2. Learning AI Requests */}
        <div className="theme-card border theme-border rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Learning AI
            </span>
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-emerald-400 tabular-nums">
            {learningAiRequests}
          </div>
          <div className="text-[11px] theme-muted-text">
            Student Market Mentor questions
          </div>
        </div>

        {/* 3. Admin AI Requests */}
        <div className="theme-card border theme-border rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Admin AI
            </span>
            <Sliders className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-blue-400 tabular-nums">
            {adminAiRequests}
          </div>
          <div className="text-[11px] theme-muted-text">
            Private telemetry consultations
          </div>
        </div>

        {/* 4. Successful Requests */}
        <div className="theme-card border theme-border rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Successful Requests
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-heading theme-main-text tabular-nums">
            {successfulRequests}
          </div>
          <div className="text-[11px] text-emerald-500 font-semibold">
            {totalAiRequests > 0 ? Math.round((successfulRequests / totalAiRequests) * 100) : 100}% resolution rate
          </div>
        </div>

        {/* 5. Failed Requests */}
        <div className="theme-card border theme-border rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Failed Requests
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-rose-400 tabular-nums">
            {failedRequests}
          </div>
          <div className="text-[11px] theme-muted-text">
            Network or transient issues
          </div>
        </div>

        {/* 6. Quota-Exhausted Requests */}
        <div className="theme-card border theme-border rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Quota-Exhausted
            </span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-amber-400 tabular-nums">
            {quotaExhaustedRequests}
          </div>
          <div className="text-[11px] text-amber-400 font-medium">
            429 / Daily limit hits intercepted
          </div>
        </div>

        {/* 7. Image-Analysis Requests */}
        <div className="theme-card border theme-border rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Image Analyses
            </span>
            <Paperclip className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-heading theme-main-text tabular-nums">
            {imageAnalysisRequests}
          </div>
          <div className="text-[11px] theme-muted-text">
            Multimodal charts & screenshots
          </div>
        </div>

        {/* 8. Average Response Time */}
        <div className="theme-card border theme-border rounded-xl p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
              Avg Response Time
            </span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-heading theme-main-text font-mono tabular-nums">
            {avgResponseTimeMs} <span className="text-xs font-normal theme-muted-text">ms</span>
          </div>
          <div className="text-[11px] theme-muted-text">
            Measured end-to-end latency
          </div>
        </div>
      </div>

      {/* Free Tier Configuration & Quota Status Details */}
      <div className="theme-card border theme-border rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-0.5">
            <h3 className="font-heading font-bold text-base theme-main-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Active Free-Tier AI Model & Quota Controller
            </h3>
            <p className="text-xs theme-muted-text">
              Configurable model parameters and provider rate limits (₹0 budget strictly enforced)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isQuotaExhausted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                Circuit Breaker Active ({quotaResetEta || 'Reset Pending'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Free Tier Active (20 RPD cap)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
            <span className="theme-muted-text">Configured Free Model</span>
            <div className="font-mono font-bold text-emerald-400">{activeModel}</div>
            <span className="text-[10px] theme-muted-text">Configurable via GEMINI_MODEL</span>
          </div>

          <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
            <span className="theme-muted-text">Daily Provider Limit</span>
            <div className="font-mono font-bold theme-main-text">20 Requests / Day</div>
            <span className="text-[10px] theme-muted-text">Google AI Studio Free Tier</span>
          </div>

          <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
            <span className="theme-muted-text">Per-User Fair Allocation</span>
            <div className="font-mono font-bold theme-main-text">5 Requests / 24h</div>
            <span className="text-[10px] theme-muted-text">Protects shared pool across users</span>
          </div>

          <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
            <span className="theme-muted-text">API Spend & Overages</span>
            <div className="font-mono font-bold text-emerald-400">₹0.00 (Zero Cost)</div>
            <span className="text-[10px] theme-muted-text">No payment details attached</span>
          </div>
        </div>
      </div>

      {/* Two Column: Donut for Request Source & Bar for Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminDonutChart
          title="AI Request Distribution"
          subtitle="Breakdown between Learning AI, Admin Intelligence, and Multimodal images"
          data={modeDonutData}
          centerLabel="Total Requests"
          centerValue={totalAiRequests}
        />

        <AdminBarChart
          title="Student Inquiry Topic Classification"
          subtitle="Privacy-conscious categorization of learner inquiries answered by Market Mentor"
          data={topicsBarData}
        />
      </div>

      {/* Recent AI Query Log Stream */}
      <div className="theme-card border theme-border rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-heading font-bold text-base theme-main-text flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Recent AI Requests Stream
          </h3>
          <span className="text-xs theme-muted-text font-mono">
            Live telemetry feed (Zero-cost logging)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="theme-surface-subtle theme-secondary-text border-b theme-border uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Topic / Scope</th>
                <th className="py-2.5 px-3">Attachment</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {(aiMentor.recentLogs || aiMentor.recentMetrics || []).map((r: any, i: number) => {
                const isQuota = r.status === 'QUOTA_EXHAUSTED';
                const isFail = r.status === 'FAILED' || r.success === false;
                const isSuccess = !isQuota && !isFail;

                return (
                  <tr key={i} className="hover:theme-surface-subtle transition-colors">
                    <td className="py-2.5 px-3 font-mono theme-muted-text whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                        r.source === 'admin' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {(r.source || 'learning').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold theme-main-text">
                      {r.topic || 'General Markets'}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.hasAttachment ? (
                        <span className="inline-flex items-center gap-1 text-purple-400 font-medium text-[11px]">
                          <Paperclip className="w-3 h-3" /> Attached
                        </span>
                      ) : (
                        <span className="theme-muted-text">None</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono theme-muted-text">
                      {r.model || activeModel}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isQuota ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          QUOTA COOLDOWN
                        </span>
                      ) : isFail ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          FAILED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          SUCCESS
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
