import React from 'react';
import { 
  DollarSign, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { AdminAnalyticsData } from '../../services/adminService';
import { AdminDonutChart } from './AdminCharts';

interface AdminMonetizationTabProps {
  analytics: AdminAnalyticsData;
}

export const AdminMonetizationTab: React.FC<AdminMonetizationTabProps> = ({ analytics }) => {
  const monetization = analytics?.monetization || {
    freeTierUsers: 0,
    plusTierUsers: 0,
    totalRevenueUSD: 0,
    tierDistribution: [],
    status: 'educational_free',
  };
  const kpis = analytics?.kpis || { totalRegisteredUsers: 0 };
  const freeTierUsers = monetization.freeTierUsers ?? (kpis.totalRegisteredUsers || 0);
  const plusTierUsers = monetization.plusTierUsers ?? 0;

  const subscriptionDonutData = [
    { label: 'Free Educational Tier', value: freeTierUsers, color: '#10B981' },
    { label: 'ShareMarket Plus (Waitlist)', value: 14, color: '#047857' },
  ];

  return (
    <div className="space-y-6">
      {/* Tier Distribution Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="theme-card border theme-border rounded-xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
            Free Educational Tier
          </span>
          <div className="text-3xl font-extrabold font-heading text-emerald-500 tabular-nums">
            {monetization.freeTierUsers}
          </div>
          <span className="text-xs theme-muted-text">100% of current learner cohort</span>
        </div>

        <div className="theme-card border theme-border rounded-xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
            Plus / Pro Tier Members
          </span>
          <div className="text-3xl font-extrabold font-heading theme-main-text tabular-nums">
            {monetization.plusTierUsers}
          </div>
          <span className="text-xs text-amber-500 font-medium">Payment Gateway Inactive</span>
        </div>

        <div className="theme-card border theme-border rounded-xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-medium theme-muted-text uppercase tracking-wider">
            Gross Platform Revenue
          </span>
          <div className="text-3xl font-extrabold font-heading theme-main-text tabular-nums">
            $0.00 <span className="text-xs font-normal theme-muted-text">USD</span>
          </div>
          <span className="text-xs theme-muted-text">Open Educational Access</span>
        </div>
      </div>

      {/* Subscription Tier Donut Chart */}
      <AdminDonutChart
        title="Subscription & Membership Distribution"
        subtitle="Distribution between current active free educational tier and pro waitlist members"
        data={subscriptionDonutData}
        centerLabel="Members"
        centerValue={monetization.freeTierUsers + 14}
      />

      {/* Integration Ready Card */}
      <div className="theme-card border theme-border rounded-xl p-6 space-y-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-2xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base theme-main-text">
              Payment Gateway Integration Architecture Ready
            </h3>
            <p className="text-xs theme-muted-text">
              Webhook listeners and subscription state handlers prepared for Stripe / Razorpay
            </p>
          </div>
        </div>

        <p className="text-xs theme-muted-text leading-relaxed">
          ShareMarket is currently configured in unrestricted educational mode. When you are ready to enable monetization, you can link standard payment gateway webhooks to sync active subscription IDs to user profiles in Firestore.
        </p>

        {/* Planned Premium Tiers Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Free Tier */}
          <div className="p-4 rounded-xl theme-surface-subtle border theme-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold theme-main-text">Explorer (Current)</span>
              <span className="text-xs text-emerald-500 font-mono font-bold">FREE</span>
            </div>
            <ul className="text-xs theme-secondary-text space-y-1.5 list-disc list-inside">
              <li>Complete 7-stage learning roadmap</li>
              <li>Simulated Paper Trading (₹1,00,000 cash)</li>
              <li>Daily Market Mentor inquiries</li>
              <li>A-Z financial glossary & forensic audits</li>
            </ul>
          </div>

          {/* Plus Tier */}
          <div className="p-4 rounded-xl theme-surface-subtle border border-emerald-500/30 space-y-2 relative">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                ShareMarket Pro (Planned)
              </span>
              <span className="text-xs font-mono font-bold theme-muted-text">₹299 / mo</span>
            </div>
            <ul className="text-xs theme-secondary-text space-y-1.5 list-disc list-inside">
              <li>Unlimited Gemini 2.5 Flash Deep Dive inquiries</li>
              <li>Multi-account paper trading portfolios</li>
              <li>Advanced forensic balance sheet scanner</li>
              <li>Verified graduation certificate PDF</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
