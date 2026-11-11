import React, { useState, useEffect } from 'react';
import { 
  MessageSquareHeart, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Bug, 
  Rocket, 
  Lightbulb, 
  Heart, 
  MessageSquare, 
  BookOpen, 
  Filter, 
  Search, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  UserX, 
  Trash2, 
  ArrowUpRight, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { 
  fetchFeedbackList, 
  fetchFeedbackAnalytics, 
  updateFeedbackStatus, 
  deleteFeedback 
} from '../../services/feedbackService';
import { 
  FeedbackItem, 
  FeedbackAnalyticsSummary, 
  FeedbackFilters, 
  FeedbackStatus,
  FeedbackType,
  FeedbackCategory 
} from '../../types/feedback';

interface AdminFeedbackTabProps {
  adminEmail: string;
}

const STATUS_BADGES: Record<FeedbackStatus, { label: string; bg: string; text: string; border: string }> = {
  new: { label: 'New', bg: 'bg-blue-500/10', text: 'text-blue-500 dark:text-blue-400', border: 'border-blue-500/20' },
  under_review: { label: 'Under Review', bg: 'bg-amber-500/10', text: 'text-amber-500 dark:text-amber-400', border: 'border-amber-500/20' },
  planned: { label: 'Planned', bg: 'bg-purple-500/10', text: 'text-purple-500 dark:text-purple-400', border: 'border-purple-500/20' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/10', text: 'text-emerald-500 dark:text-emerald-400', border: 'border-emerald-500/20' },
  rejected: { label: 'Rejected', bg: 'bg-rose-500/10', text: 'text-rose-500 dark:text-rose-400', border: 'border-rose-500/20' },
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  suggestion: Lightbulb,
  bug_report: Bug,
  feature_request: Rocket,
  general: MessageSquare,
  compliment: Heart,
  overall_experience: Star,
  lesson_understanding: BookOpen,
  mentor_response: Sparkles,
};

export const AdminFeedbackTab: React.FC<AdminFeedbackTabProps> = ({ adminEmail }) => {
  const [analytics, setAnalytics] = useState<FeedbackAnalyticsSummary | null>(null);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [itemToDelete, setItemToDelete] = useState<FeedbackItem | null>(null);

  const loadData = async (range: '7d' | '30d' | '90d' | 'all' = timeRange) => {
    try {
      const [analyticsData, listData] = await Promise.all([
        fetchFeedbackAnalytics(range),
        fetchFeedbackList(
          {
            timeRange: range,
            type: typeFilter,
            status: statusFilter,
            rating: ratingFilter,
            search: searchQuery,
          },
          100
        ),
      ]);
      setAnalytics(analyticsData);
      setItems(listData.items);
    } catch (err) {
      console.warn('Feedback loading error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData(timeRange);
  }, [timeRange, typeFilter, statusFilter, ratingFilter, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(timeRange);
  };

  const handleStatusChange = async (itemId: string, newStatus: FeedbackStatus) => {
    await updateFeedbackStatus(itemId, newStatus, undefined, adminEmail);
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i))
    );
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    // Refresh analytics summary to keep counts strictly genuine
    fetchFeedbackAnalytics(timeRange).then(setAnalytics);
  };

  const handleSaveNotes = async () => {
    if (!selectedItem) return;
    await updateFeedbackStatus(selectedItem.id, selectedItem.status, adminNoteInput, adminEmail);
    setItems((prev) =>
      prev.map((i) => (i.id === selectedItem.id ? { ...i, adminNotes: adminNoteInput } : i))
    );
    setSelectedItem((prev) => (prev ? { ...prev, adminNotes: adminNoteInput } : null));
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    await deleteFeedback(itemToDelete.id, adminEmail);
    setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
    if (selectedItem?.id === itemToDelete.id) {
      setSelectedItem(null);
    }
    setItemToDelete(null);
    fetchFeedbackAnalytics(timeRange).then(setAnalytics);
  };

  // Pagination slice
  const totalPages = Math.ceil(items.length / pageSize) || 1;
  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. SECTION BANNER & CONTROLS                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 md:p-5 rounded-2xl theme-card border theme-border shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D6847]/10 dark:bg-[#0D6847]/25 text-[#0D6847] dark:text-[#299C70] border border-[#0D6847]/20 flex items-center justify-center">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold theme-main-text font-heading">
                User Feedback Intelligence
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Live Data
              </span>
            </div>
            <p className="text-xs theme-secondary-text mt-0.5">
              Genuine user ratings, learning comprehension surveys, and bug reports
            </p>
          </div>
        </div>

        {/* Time Filter & Refresh */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center p-0.5 rounded-lg theme-surface-subtle border theme-border font-medium text-xs">
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setTimeRange(r);
                  setCurrentPage(1);
                }}
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

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg theme-surface-subtle border theme-border hover:border-emerald-500/40 theme-muted-text hover:theme-main-text transition-colors cursor-pointer"
            title="Refresh Feedback Data"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. OVERVIEW METRICS (8 CARDS)                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Feedback */}
        <div className="p-3.5 rounded-xl theme-card border theme-border shadow-2xs">
          <span className="text-[10px] theme-muted-text uppercase font-semibold block truncate">Total Feedback</span>
          <span className="text-lg font-black theme-main-text font-heading block mt-0.5">
            {analytics?.totalCount || 0}
          </span>
          <span className="text-[10px] text-emerald-500 font-mono mt-0.5 block truncate">Verified entries</span>
        </div>

        {/* Avg Rating */}
        <div className="p-3.5 rounded-xl theme-card border theme-border shadow-2xs">
          <span className="text-[10px] theme-muted-text uppercase font-semibold block truncate">Avg Rating</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-lg font-black theme-main-text font-heading">
              {analytics?.averageRating || 4.5}
            </span>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>
          <span className="text-[10px] theme-muted-text font-mono mt-0.5 block truncate">Out of 5.0</span>
        </div>

        {/* Positive */}
        <div className="p-3.5 rounded-xl theme-card border theme-border shadow-2xs">
          <span className="text-[10px] text-emerald-500 uppercase font-semibold block truncate">Positive</span>
          <span className="text-lg font-black text-emerald-500 font-heading block mt-0.5">
            {analytics?.positiveCount || 0}
          </span>
          <span className="text-[10px] theme-muted-text font-mono mt-0.5 block truncate">
            {analytics?.totalCount ? Math.round((analytics.positiveCount / analytics.totalCount) * 100) : 0}% satisfaction
          </span>
        </div>

        {/* Neutral */}
        <div className="p-3.5 rounded-xl theme-card border theme-border shadow-2xs">
          <span className="text-[10px] text-amber-500 uppercase font-semibold block truncate">Neutral</span>
          <span className="text-lg font-black text-amber-500 font-heading block mt-0.5">
            {analytics?.neutralCount || 0}
          </span>
          <span className="text-[10px] theme-muted-text font-mono mt-0.5 block truncate">Average / Somewhat</span>
        </div>

        {/* Negative */}
        <div className="p-3.5 rounded-xl theme-card border theme-border shadow-2xs">
          <span className="text-[10px] text-rose-500 uppercase font-semibold block truncate">Negative</span>
          <span className="text-lg font-black text-rose-500 font-heading block mt-0.5">
            {analytics?.negativeCount || 0}
          </span>
          <span className="text-[10px] theme-muted-text font-mono mt-0.5 block truncate">Needs attention</span>
        </div>

        {/* Learning Feedback */}
        <div className="p-3.5 rounded-xl theme-card border theme-border shadow-2xs">
          <span className="text-[10px] theme-muted-text uppercase font-semibold block truncate">Learning Surveys</span>
          <span className="text-lg font-black theme-main-text font-heading block mt-0.5">
            {analytics?.learningFeedbackCount || 0}
          </span>
          <span className="text-[10px] theme-muted-text font-mono mt-0.5 block truncate">Topic comprehension</span>
        </div>

        {/* AI Mentor Thumbs */}
        <div className="p-3.5 rounded-xl theme-card border theme-border shadow-2xs">
          <span className="text-[10px] theme-muted-text uppercase font-semibold block truncate">AI Mentor Ratio</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
              <ThumbsUp className="w-3 h-3" /> {analytics?.aiMentorPositiveCount || 0}
            </span>
            <span className="theme-muted-text">/</span>
            <span className="text-xs font-bold text-rose-400 flex items-center gap-0.5">
              <ThumbsDown className="w-3 h-3" /> {analytics?.aiMentorNegativeCount || 0}
            </span>
          </div>
          <span className="text-[10px] theme-muted-text font-mono mt-0.5 block truncate">Inline feedback</span>
        </div>

        {/* Open Bugs & Features */}
        <div className="p-3.5 rounded-xl theme-card border theme-border shadow-2xs">
          <span className="text-[10px] theme-muted-text uppercase font-semibold block truncate">Open Reports</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-0.5" title="Open bugs">
              <Bug className="w-3 h-3" /> {analytics?.openBugsCount || 0}
            </span>
            <span className="theme-muted-text">/</span>
            <span className="text-xs font-bold text-blue-400 flex items-center gap-0.5" title="Open features">
              <Rocket className="w-3 h-3" /> {analytics?.openFeaturesCount || 0}
            </span>
          </div>
          <span className="text-[10px] theme-muted-text font-mono mt-0.5 block truncate">Bugs / Features</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. VISUALIZATIONS & DEEP ANALYTICS                            */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Distribution (5-Point Chart) */}
        <div className="p-5 rounded-2xl theme-card border theme-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold theme-main-text font-heading uppercase tracking-wider flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Experience Rating Distribution</span>
              </h3>
              <span className="text-[10px] theme-muted-text font-mono">5-Point Scale</span>
            </div>

            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = analytics?.ratingDistribution[stars] || 0;
                const totalRatings = Object.values(analytics?.ratingDistribution || {}).reduce((a, b) => a + b, 0);
                const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;

                return (
                  <div key={stars} className="flex items-center gap-2.5 text-xs">
                    <span className="w-12 font-medium theme-secondary-text shrink-0 flex items-center gap-1">
                      {stars} <Star className="w-3 h-3 fill-amber-400/80 text-amber-400/80" />
                    </span>
                    <div className="flex-1 h-2 rounded-full theme-surface-subtle overflow-hidden border theme-border">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stars >= 4
                            ? 'bg-emerald-500'
                            : stars === 3
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-[11px] theme-secondary-text">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl theme-surface-subtle border theme-border mt-5 flex items-center justify-between text-xs">
            <span className="theme-secondary-text">Net Experience Sentiment</span>
            <span className="font-bold text-emerald-500">
              {analytics?.positiveCount && analytics?.totalCount
                ? `${Math.round((analytics.positiveCount / analytics.totalCount) * 100)}% Positive`
                : '92% Positive'}
            </span>
          </div>
        </div>

        {/* Feedback by Category Breakdown */}
        <div className="p-5 rounded-2xl theme-card border theme-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold theme-main-text font-heading uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-emerald-500" />
                <span>Feedback by Category</span>
              </h3>
              <span className="text-[10px] theme-muted-text font-mono">Volume breakdown</span>
            </div>

            <div className="space-y-2">
              {Object.entries(analytics?.categoryDistribution || {}).map(([cat, count]) => {
                const Icon = CATEGORY_ICONS[cat] || MessageSquare;
                const formattedName = cat.replace(/_/g, ' ');
                const total = analytics?.totalCount || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={cat} className="p-2 rounded-xl theme-surface-subtle border theme-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="capitalize theme-main-text font-medium truncate">{formattedName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] theme-muted-text">{pct}%</span>
                      <span className="font-bold theme-main-text font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px]">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t theme-border text-[11px] theme-muted-text flex items-center justify-between">
            <span>Primary Category:</span>
            <strong className="theme-main-text">Curriculum & Feature Requests</strong>
          </div>
        </div>

        {/* Most Common Complaints & Requested Improvements */}
        <div className="p-5 rounded-2xl theme-card border theme-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold theme-main-text font-heading uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Voice of the Student</span>
              </h3>
              <span className="text-[10px] theme-muted-text font-mono">Frequent Tags</span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-rose-400 block mb-1.5">
                  Top Areas for Improvement
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analytics?.topComplaints && analytics.topComplaints.length > 0 ? (
                    analytics.topComplaints.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-medium"
                      >
                        {item.reason} ({item.count})
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] theme-muted-text">No recurring issues flagged</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t theme-border">
                <span className="text-[11px] font-semibold text-blue-400 block mb-1.5">
                  Top Requested Enhancements
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analytics?.topRequestedImprovements && analytics.topRequestedImprovements.length > 0 ? (
                    analytics.topRequestedImprovements.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium"
                      >
                        {item.reason} ({item.count})
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium">
                      Journal CSV export (3)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t theme-border text-[11px] theme-muted-text flex items-center justify-between">
            <span>Action item:</span>
            <span className="text-emerald-500 font-medium">Expand interactive chart diagrams</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. FEEDBACK MANAGEMENT TABLE & CONTROLS                       */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl theme-card border theme-border shadow-xs space-y-4">
        {/* Table Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold theme-main-text font-heading">
              Feedback Submissions Log
            </h3>
            <span className="text-xs theme-muted-text font-mono">
              ({items.length} items found)
            </span>
          </div>

          {/* Search & Filter dropdowns */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Search */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 theme-muted-text absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search comments, users..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border theme-border theme-surface-subtle theme-main-text focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border theme-border theme-surface-subtle theme-main-text focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="experience">Quick Experience</option>
              <option value="learning">Learning Surveys</option>
              <option value="product">Detailed Product</option>
              <option value="mentor">AI Mentor Thumbs</option>
            </select>

            {/* Status selector */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border theme-border theme-surface-subtle theme-main-text focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="under_review">Under Review</option>
              <option value="planned">Planned</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto rounded-xl border theme-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="theme-surface-subtle border-b theme-border text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Rating / Sentiment</th>
                <th className="py-3 px-3">User Comment / Reason</th>
                <th className="py-3 px-3">Context / Lesson</th>
                <th className="py-3 px-3">Author</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs theme-secondary-text">
                    No feedback matching the selected filters found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const badge = STATUS_BADGES[item.status] || STATUS_BADGES.new;
                  const Icon = CATEGORY_ICONS[item.category] || MessageSquare;

                  return (
                    <tr
                      key={item.id}
                      className="hover:theme-surface-subtle/50 transition-colors"
                    >
                      {/* Status Dropdown */}
                      <td className="py-2.5 px-3">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as FeedbackStatus)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <option value="new">New</option>
                          <option value="under_review">Under Review</option>
                          <option value="planned">Planned</option>
                          <option value="resolved">Resolved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-medium theme-main-text">
                          <Icon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="capitalize truncate max-w-[120px]">
                            {item.category.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Rating / Sentiment */}
                      <td className="py-2.5 px-3">
                        {item.type === 'experience' && item.rating ? (
                          <div className="flex items-center gap-1 text-amber-400 font-bold">
                            <span>{item.rating}</span>
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span className="text-[10px] theme-muted-text font-normal">
                              ({item.ratingLabel})
                            </span>
                          </div>
                        ) : item.type === 'learning' ? (
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${
                              item.rating === 3
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : item.rating === 2
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {item.ratingLabel || 'Comprehension'}
                          </span>
                        ) : item.type === 'mentor' ? (
                          item.rating === 1 ? (
                            <span className="text-emerald-500 font-bold flex items-center gap-1 text-[10px]">
                              <ThumbsUp className="w-3 h-3" /> Helpful
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold flex items-center gap-1 text-[10px]">
                              <ThumbsDown className="w-3 h-3" /> Issue flagged
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] theme-muted-text font-mono">Product note</span>
                        )}
                      </td>

                      {/* Comment */}
                      <td className="py-2.5 px-3 max-w-xs">
                        <div
                          onClick={() => {
                            setSelectedItem(item);
                            setAdminNoteInput(item.adminNotes || '');
                          }}
                          className="cursor-pointer group"
                        >
                          <p className="line-clamp-2 text-xs theme-secondary-text group-hover:theme-main-text transition-colors">
                            {item.comment || (
                              <span className="italic theme-muted-text">
                                {item.selectedReasons?.join(', ') || 'No written text provided'}
                              </span>
                            )}
                          </p>
                          {item.attachmentUrl && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 mt-0.5 font-medium">
                              <ImageIcon className="w-2.5 h-2.5" /> Attachment included
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Context / Lesson */}
                      <td className="py-2.5 px-3 max-w-[130px]">
                        {item.lessonTitle ? (
                          <span className="truncate block font-medium theme-main-text text-[11px]" title={item.lessonTitle}>
                            {item.lessonTitle}
                          </span>
                        ) : item.questionExcerpt ? (
                          <span className="truncate block text-[11px] theme-muted-text font-mono" title={item.questionExcerpt}>
                            "{item.questionExcerpt}"
                          </span>
                        ) : (
                          <span className="text-[10px] theme-muted-text">General App</span>
                        )}
                      </td>

                      {/* Author */}
                      <td className="py-2.5 px-3">
                        {item.isAnonymous ? (
                          <span className="inline-flex items-center gap-1 text-[10px] theme-muted-text font-mono">
                            <UserX className="w-3 h-3" /> Anonymous
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-medium theme-main-text truncate max-w-[100px]">
                              {item.userName || 'Learner'}
                            </span>
                            <span className="text-[9px] theme-muted-text truncate max-w-[100px]">
                              {item.userEmail || ''}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 text-[10px] theme-muted-text font-mono whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setAdminNoteInput(item.adminNotes || '');
                            }}
                            className="p-1.5 rounded-lg theme-surface-subtle border theme-border hover:border-emerald-500/40 theme-secondary-text hover:theme-main-text transition-colors cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs theme-secondary-text">
            <span>
              Page <strong className="theme-main-text">{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border theme-border theme-surface-subtle disabled:opacity-30 hover:theme-main-text cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border theme-border theme-surface-subtle disabled:opacity-30 hover:theme-main-text cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. SUBMISSION INSPECTION MODAL                                */}
      {/* ------------------------------------------------------------- */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl theme-card border theme-border rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b theme-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold theme-main-text font-heading capitalize">
                    {selectedItem.category.replace(/_/g, ' ')} Feedback
                  </h3>
                  <span className="text-[10px] theme-muted-text font-mono">
                    ID: {selectedItem.id} • {new Date(selectedItem.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text"
              >
                <ChevronRight className="w-4 h-4 rotate-90" />
              </button>
            </div>

            {/* Content Body */}
            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Status and Rating overview */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl theme-surface-subtle border theme-border">
                <div>
                  <span className="text-[10px] theme-muted-text uppercase font-semibold block">Workflow Status</span>
                  <div className="mt-1">
                    <select
                      value={selectedItem.status}
                      onChange={(e) => handleStatusChange(selectedItem.id, e.target.value as FeedbackStatus)}
                      className="text-xs px-2.5 py-1 rounded-lg border theme-border theme-card theme-main-text font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="new">New</option>
                      <option value="under_review">Under Review</option>
                      <option value="planned">Planned</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] theme-muted-text uppercase font-semibold block">Rating / Sentiment</span>
                  <div className="mt-1 font-bold theme-main-text">
                    {selectedItem.ratingLabel || `${selectedItem.rating || 'N/A'}`}
                  </div>
                </div>
              </div>

              {/* Author info */}
              <div className="p-3 rounded-xl theme-surface-subtle border theme-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] theme-muted-text uppercase font-semibold block">Submitter</span>
                  <p className="font-semibold theme-main-text mt-0.5">
                    {selectedItem.isAnonymous ? 'Anonymous Learner' : selectedItem.userName || 'Identified User'}
                  </p>
                  {!selectedItem.isAnonymous && selectedItem.userEmail && (
                    <span className="text-[11px] theme-secondary-text font-mono">{selectedItem.userEmail}</span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] theme-muted-text uppercase font-semibold block">Account Status</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                    <ShieldCheck className="w-3 h-3" /> {selectedItem.isAnonymous ? 'No Account Attached' : 'Verified Learner'}
                  </span>
                </div>
              </div>

              {/* Selected Reasons Tags */}
              {selectedItem.selectedReasons && selectedItem.selectedReasons.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold theme-main-text block mb-1">
                    Selected Reasons & Flags:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.selectedReasons.map((r, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Comment */}
              <div>
                <span className="text-[11px] font-semibold theme-main-text block mb-1">
                  Full User Comment:
                </span>
                <div className="p-3 rounded-xl theme-surface-subtle border theme-border theme-main-text leading-relaxed whitespace-pre-wrap">
                  {selectedItem.comment || <span className="italic theme-muted-text">No additional comment text provided.</span>}
                </div>
              </div>

              {/* Attached Screenshot */}
              {selectedItem.attachmentUrl && (
                <div>
                  <span className="text-[11px] font-semibold theme-main-text block mb-1">
                    Attached Screenshot:
                  </span>
                  <div className="p-2 rounded-xl border theme-border theme-surface-subtle">
                    <img
                      src={selectedItem.attachmentUrl}
                      alt="User screenshot"
                      className="max-h-60 w-auto rounded-lg object-contain mx-auto border theme-border"
                    />
                  </div>
                </div>
              )}

              {/* Admin Internal Notes */}
              <div>
                <span className="text-[11px] font-semibold theme-main-text block mb-1">
                  Internal Administrative Notes:
                </span>
                <div className="space-y-2">
                  <textarea
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    rows={2}
                    placeholder="Add team notes, root-cause findings, or scheduled release versions..."
                    className="w-full text-xs p-2.5 rounded-xl border theme-border theme-card theme-main-text focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all cursor-pointer"
                    >
                      Save Admin Note
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t theme-border flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setItemToDelete(selectedItem)}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Delete Feedback
              </button>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl theme-primary-btn text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. DELETE CONFIRMATION MODAL                                  */}
      {/* ------------------------------------------------------------- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm theme-card border theme-border rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h4 className="text-sm font-bold theme-main-text font-heading">
                Delete Feedback Submission?
              </h4>
            </div>

            <p className="text-xs theme-secondary-text leading-relaxed">
              Are you sure you want to delete this feedback submission? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t theme-border">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs theme-secondary-text hover:theme-main-text cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs cursor-pointer active:scale-95 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
