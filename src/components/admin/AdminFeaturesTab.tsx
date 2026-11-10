import React from 'react';
import { 
  TrendingUp, 
  BookOpen, 
  Bot, 
  FileText, 
  Search, 
  ShieldCheck, 
  BookA, 
  PieChart, 
  BarChart3,
  Layers
} from 'lucide-react';
import { AdminAnalyticsData } from '../../services/adminService';
import { AdminBarChart, AdminDonutChart } from './AdminCharts';

interface AdminFeaturesTabProps {
  analytics: AdminAnalyticsData;
}

export const AdminFeaturesTab: React.FC<AdminFeaturesTabProps> = ({ analytics }) => {
  const featureAdoption = analytics?.featureAdoption || [];
  const paperTradingStats = analytics?.paperTradingStats || {
    totalTradesExecuted: 0,
    buyOrders: 0,
    sellOrders: 0,
    mostTradedTickers: [],
    journalEntriesLogged: 0,
    winLossRatio: '0% / 0%',
    avgRiskRewardRatio: '1 : 2',
  };

  const featureBarData = featureAdoption.map((f) => ({
    label: f.name,
    value: f.activePercent,
    format: '%',
    subText: `${f.totalInteractions} runs`,
  }));

  const orderDonutData = [
    { label: 'Buy Orders', value: paperTradingStats.buyOrders || 0, color: '#0D6847', sentiment: 'bull' as const },
    { label: 'Sell Orders', value: paperTradingStats.sellOrders || 0, color: '#B82E3B', sentiment: 'bear' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Feature Adoption Bar Chart */}
      <AdminBarChart
        title="Interactive Platform Feature Adoption & Usage Rates"
        subtitle="Percentage of active learners engaging with each simulated laboratory tool"
        data={featureBarData}
        maxValue={100}
      />

      {/* Paper Trading Deep-dive Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Traded Tickers */}
        <div className="lg:col-span-2 theme-card border theme-border rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base theme-main-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Paper Trading Lab — Top Simulated Tickers
              </h3>
              <p className="text-xs theme-muted-text">
                Fictional enterprises most traded by students in the paper simulator
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-mono">
              {paperTradingStats.totalTradesExecuted} Total Trades
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="theme-surface-subtle theme-secondary-text border-b theme-border uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Ticker Symbol</th>
                  <th className="py-2.5 px-3">Company Name</th>
                  <th className="py-2.5 px-3 text-center">Trade Volume</th>
                  <th className="py-2.5 px-3 text-right">Avg Learner PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-border">
                {(paperTradingStats.mostTradedTickers || []).map((t) => (
                  <tr key={t.symbol} className="hover:theme-surface-subtle transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-500">
                      {t.symbol}
                    </td>
                    <td className="py-3 px-3 theme-main-text font-medium">
                      {t.name}
                    </td>
                    <td className="py-3 px-3 text-center font-mono theme-muted-text">
                      {t.trades} orders
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-500">
                      {t.avgPnL}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trade Execution & Journal Discipline Ratios */}
        <div className="theme-card border theme-border rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-base theme-main-text flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              Discipline & Ratios
            </h3>
            <p className="text-xs theme-muted-text leading-relaxed">
              Execution behavior and trading journal habit compliance among active students.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl theme-surface-subtle border theme-border space-y-1">
              <span className="text-xs theme-muted-text">Order Side Breakdown</span>
              <div className="flex items-center justify-between text-xs font-semibold pt-1">
                <span className="text-[#0D6847] dark:text-[#299C70] font-mono flex items-center gap-1">
                  ▲ {paperTradingStats.buyOrders} Buys ({Math.round((paperTradingStats.buyOrders / paperTradingStats.totalTradesExecuted) * 100)}%)
                </span>
                <span className="text-[#B82E3B] dark:text-[#E66B6B] font-mono flex items-center gap-1">
                  ▼ {paperTradingStats.sellOrders} Sells ({Math.round((paperTradingStats.sellOrders / paperTradingStats.totalTradesExecuted) * 100)}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden mt-1">
                <div style={{ width: `${(paperTradingStats.buyOrders / paperTradingStats.totalTradesExecuted) * 100}%` }} className="bg-[#0D6847] h-full" />
                <div style={{ width: `${(paperTradingStats.sellOrders / paperTradingStats.totalTradesExecuted) * 100}%` }} className="bg-[#B82E3B] h-full" />
              </div>
            </div>

            <div className="p-3 rounded-xl theme-surface-subtle border theme-border flex items-center justify-between text-xs">
              <span className="theme-muted-text">Win / Loss Ratio:</span>
              <span className="font-mono font-bold text-emerald-500">{paperTradingStats.winLossRatio}</span>
            </div>

            <div className="p-3 rounded-xl theme-surface-subtle border theme-border flex items-center justify-between text-xs">
              <span className="theme-muted-text">Avg Risk/Reward Ratio:</span>
              <span className="font-mono font-bold text-blue-500">{paperTradingStats.avgRiskRewardRatio}</span>
            </div>

            <div className="p-3 rounded-xl theme-surface-subtle border theme-border flex items-center justify-between text-xs">
              <span className="theme-muted-text">Journal Reflection Entries:</span>
              <span className="font-mono font-bold text-amber-500">{paperTradingStats.journalEntriesLogged} written</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Donut Chart for Buy vs Sell Orders */}
      <AdminDonutChart
        title="Simulated Order Sentiment Distribution (Buy vs Sell)"
        subtitle="Distribution of long positions (bullish expansion) versus short/profit-taking sales (bearish defense)"
        data={orderDonutData}
        centerLabel="Total Trades"
        centerValue={paperTradingStats.totalTradesExecuted}
      />
    </div>
  );
};
