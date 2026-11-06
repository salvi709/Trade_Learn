import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Trophy, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  Brain
} from 'lucide-react';
import { AdminAnalyticsData } from '../../services/adminService';
import { AdminBarChart } from './AdminCharts';

interface AdminLearningTabProps {
  analytics: AdminAnalyticsData;
}

export const AdminLearningTab: React.FC<AdminLearningTabProps> = ({ analytics }) => {
  const { moduleAnalytics } = analytics;

  // Key bottleneck findings
  const highDropoffModule = [...moduleAnalytics].sort((a, b) => b.dropoffRate - a.dropoffRate)[0];
  const lowestQuizModule = [...moduleAnalytics].sort((a, b) => a.avgQuizScore - b.avgQuizScore)[0];

  const difficultQuestions = [
    {
      module: 'Company Valuation & Analysis',
      question: 'Why can a company with rising profits still experience a sharp stock price decline?',
      failRate: '34% Fail Rate',
      pedagogyNote: 'Learners confuse historical profit with forward guidance. We recommend emphasizing the "lemonade stand future expectations" analogy.',
    },
    {
      module: 'Market Orders & Settlement',
      question: 'What happens if a Market Order is executed during an illiquid gap-down opening?',
      failRate: '28% Fail Rate',
      pedagogyNote: 'Students frequently mistake Market Orders for guaranteed price execution. Reinforce Limit Orders as capital survival shield.',
    },
    {
      module: 'Risk Defense & Psychology',
      question: 'How does the 1% account risk rule differ from allocating 1% position size?',
      failRate: '26% Fail Rate',
      pedagogyNote: 'Common point of confusion between Stop-Loss dollar distance vs Total Position capital.',
    },
  ];

  // Bar chart data comparing quiz averages across stages
  const quizScoreBarData = moduleAnalytics.map((m) => ({
    label: m.title.replace(/^Level \d+:\s*/, '').substring(0, 20),
    value: m.avgQuizScore,
    format: '%',
    subText: `${m.completionRate}% completed`,
  }));

  return (
    <div className="space-y-6">
      {/* Top Pedagogical Insight Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Highest Drop-off Notice */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            Curriculum Drop-off Bottleneck
          </div>
          <h4 className="font-heading font-bold text-base theme-main-text">
            {highDropoffModule.title} ({highDropoffModule.dropoffRate}% drop-off)
          </h4>
          <p className="text-xs theme-muted-text leading-relaxed">
            Learners show the largest hesitation when progressing into forensic detective audits. Consider introducing a 60-second interactive guided hint.
          </p>
        </div>

        {/* Lowest Quiz Score Alert */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-blue-500 text-xs font-semibold uppercase tracking-wider">
            <Brain className="w-4 h-4" />
            Concepts Needing Reinforcement
          </div>
          <h4 className="font-heading font-bold text-base theme-main-text">
            {lowestQuizModule.title} (Avg Score: {lowestQuizModule.avgQuizScore}%)
          </h4>
          <p className="text-xs theme-muted-text leading-relaxed">
            Accounting mechanics and valuation ratios present the steepest learning curve. Market Mentor has been tuned to provide simple everyday analogies for these questions.
          </p>
        </div>
      </div>

      {/* Bar Chart: Stage Quiz Mastery */}
      <AdminBarChart
        title="Stage Quiz Average Performance Comparison"
        subtitle="Average quiz accuracy across each progressive curriculum stage"
        data={quizScoreBarData}
        maxValue={100}
      />

      {/* Module Completion Performance Table */}
      <div className="theme-card border theme-border rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base theme-main-text">
              Curriculum Module Analytics Breakdown
            </h3>
            <p className="text-xs theme-muted-text">
              Enrollment, completion percentages, quiz performance, and retention drop-offs
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="theme-surface-subtle theme-secondary-text border-b theme-border uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Stage Module</th>
                <th className="py-3 px-4">Learners Enrolled</th>
                <th className="py-3 px-4">Completion Rate</th>
                <th className="py-3 px-4">Quiz Score Avg</th>
                <th className="py-3 px-4">Drop-off Rate</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {moduleAnalytics.map((m, idx) => (
                <tr key={m.id} className="hover:theme-surface-subtle transition-colors">
                  <td className="py-3.5 px-4 font-semibold theme-main-text flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full theme-surface-elevated theme-border border theme-secondary-text text-[10px] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    {m.title}
                  </td>
                  <td className="py-3.5 px-4 theme-muted-text font-mono">
                    {m.enrolled} learners
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${m.completionRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-emerald-500 font-mono">{m.completionRate}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold theme-main-text font-mono">{m.avgQuizScore}%</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono theme-muted-text">
                    <span className={m.dropoffRate > 20 ? 'text-amber-500 font-bold' : ''}>
                      {m.dropoffRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Healthy
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Most Failed Questions & Recommended Pedagogical Fixes */}
      <div className="theme-card border theme-border rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base theme-main-text flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              Challenging Quiz Questions & Learning Diagnosis
            </h3>
            <p className="text-xs theme-muted-text">
              Questions with high failure rates and suggested mentoring interventions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {difficultQuestions.map((q, idx) => (
            <div key={idx} className="p-4 rounded-xl theme-surface-subtle border theme-border space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider font-semibold">
                    {q.module}
                  </span>
                  <div className="text-xs font-semibold theme-main-text">
                    &quot;{q.question}&quot;
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/15 text-red-500 border border-red-500/30 shrink-0 font-mono">
                  {q.failRate}
                </span>
              </div>
              <p className="text-[11px] theme-muted-text border-t theme-border pt-2 leading-relaxed">
                <strong className="theme-main-text">Pedagogical Recommendation:</strong> {q.pedagogyNote}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
