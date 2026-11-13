import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  MarketNewsItem,
  MarketNewsResponse,
  NewsCategory,
} from '../../types';
import { fetchMarketNews } from '../../services/newsService';
import { ArticleDetailModal } from './ArticleDetailModal';
import {
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  AlertCircle,
  Building2,
  Filter,
  CheckCircle2,
  Newspaper,
  Flame,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';

const CATEGORIES: { id: NewsCategory; label: string }[] = [
  { id: 'ALL', label: 'All Headlines' },
  { id: 'INDIAN_MARKETS', label: 'Indian Markets' },
  { id: 'NIFTY_SENSEX', label: 'Nifty & Sensex' },
  { id: 'NSE_BSE', label: 'NSE & BSE' },
  { id: 'STOCKS_COMPANIES', label: 'Corporate & Equities' },
  { id: 'IPO_LISTINGS', label: 'IPO & Listings' },
  { id: 'ECONOMY_RBI', label: 'Economy & RBI' },
  { id: 'TECHNICAL_ANALYSIS', label: 'Technical Analysis' },
  { id: 'GLOBAL_MARKETS', label: 'Global Markets' },
  { id: 'CORPORATE_ANNOUNCEMENTS', label: 'Regulatory Filings' },
  { id: 'COMMODITIES_CURRENCY', label: 'Commodities & FX' },
];

const AUTO_REFRESH_MS = 10 * 60 * 1000; // Sync automatically every 10 minutes

function getMarketDayKey(): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function getFormattedMarketDate(): string {
  try {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return new Date().toDateString();
  }
}

export const MarketNewsCenter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newsData, setNewsData] = useState<MarketNewsResponse | null>(null);
  const [activeArticle, setActiveArticle] = useState<MarketNewsItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [marketDateLabel, setMarketDateLabel] = useState<string>(getFormattedMarketDate);
  const lastDayKeyRef = useRef<string>(getMarketDayKey());
  const lastFetchedMsRef = useRef<number>(0);

  const loadNews = useCallback(
    async (isManualRefresh = false, silentBackground = false) => {
      if (isManualRefresh && !silentBackground) setRefreshing(true);
      else if (!silentBackground) setLoading(true);

      try {
        const data = await fetchMarketNews({
          category: selectedCategory,
          search: searchQuery.trim() || undefined,
          limit: 40,
          forceRefresh: isManualRefresh,
        });
        setNewsData(data);
        setLastUpdated(new Date());
        setMarketDateLabel(getFormattedMarketDate());
        lastDayKeyRef.current = getMarketDayKey();
        lastFetchedMsRef.current = Date.now();
      } catch (err) {
        console.error('Error fetching market news:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCategory, searchQuery]
  );

  // Fetch when category changes
  useEffect(() => {
    loadNews(false);
  }, [selectedCategory]);

  // Daily market rollover & 10-minute auto-sync (tab focus, visibility, and interval)
  useEffect(() => {
    const checkAndSync = () => {
      const todayKey = getMarketDayKey();
      const elapsed = Date.now() - lastFetchedMsRef.current;
      if (todayKey !== lastDayKeyRef.current || elapsed >= AUTO_REFRESH_MS) {
        loadNews(true, true);
      }
    };

    const intervalId = window.setInterval(checkAndSync, AUTO_REFRESH_MS);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndSync();
      }
    };
    window.addEventListener('focus', checkAndSync);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', checkAndSync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadNews]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadNews(false);
  };

  // Filter client-side by sentiment if set
  const displayedItems = useMemo(() => {
    if (!newsData?.items) return [];
    if (sentimentFilter === 'ALL') return newsData.items;
    return newsData.items.filter((item) => item.sentiment === sentimentFilter);
  }, [newsData, sentimentFilter]);

  // Breaking news story (top banner)
  const breakingStory = useMemo(() => {
    return displayedItems.find((i) => i.isBreaking) || displayedItems.find((i) => i.isTrending);
  }, [displayedItems]);

  // Editorial Broadsheet Split:
  // 1) Lead Story (left 7 cols)
  // 2) "At a Glance" Top 4 Wire Headlines (right 5 cols)
  // 3) Bottom 2-column Dispatches Grid (remaining stories)
  const leadStory = displayedItems[0];
  const atAGlanceStories = displayedItems.slice(1, 5);
  const gridStories = displayedItems.slice(5);

  // Related articles for modal
  const modalRelated = useMemo(() => {
    if (!activeArticle || !newsData?.items) return [];
    return newsData.items
      .filter(
        (i) =>
          i.id !== activeArticle.id &&
          (i.category === activeArticle.category || i.publisher === activeArticle.publisher)
      )
      .slice(0, 3);
  }, [activeArticle, newsData]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in theme-main-text">
      {/* Editorial Broadsheet Masthead Header */}
      <div className="border-b-2 border-slate-900/15 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono uppercase tracking-wider">
            <span className="inline-flex items-center gap-1.5 text-[#0D6847] dark:text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#0D6847] dark:bg-emerald-400 animate-pulse" />
              Daily Market Dispatch
            </span>
            <span className="theme-muted-text">&bull;</span>
            <span className="inline-flex items-center gap-1 theme-secondary-text font-medium">
              <Calendar className="w-3 h-3" />
              {marketDateLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#0D6847]/10 dark:bg-emerald-500/15 border border-[#0D6847]/20 dark:border-emerald-500/30 text-[#0D6847] dark:text-emerald-400">
              <Newspaper className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight theme-main-text font-heading">
              Market News
            </h1>
          </div>

          <p className="text-xs sm:text-sm theme-secondary-text max-w-2xl leading-relaxed">
            Daily curated financial press feeds, RBI &amp; regulatory updates, corporate filings, and live market movers.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] theme-secondary-text font-medium">
              Feed Mode: <span className="theme-main-text font-semibold">{newsData?.cached ? 'Daily Snapshot' : 'Live Synced'}</span>
            </div>
            <div className="text-[10px] theme-muted-text font-mono">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadNews(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl theme-card border theme-border hover:border-[#0D6847]/50 dark:hover:border-emerald-500/50 theme-main-text shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Sync Latest Market Headlines"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#0D6847] dark:text-emerald-400' : 'theme-secondary-text'}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>

      {/* Breaking / Market Alert Ticker Bar */}
      {breakingStory && (
        <div
          onClick={() => setActiveArticle(breakingStory)}
          className="px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/35 hover:border-rose-400 dark:hover:border-rose-400/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <span className="px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#B82E3B] text-white shrink-0 inline-flex items-center gap-1 shadow-2xs">
              <Flame className="w-3 h-3 animate-pulse" />
              {breakingStory.isBreaking ? 'Breaking' : 'Key Move'}
            </span>
            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-rose-50 group-hover:text-[#B82E3B] dark:group-hover:text-rose-200 transition-colors line-clamp-1">
              {breakingStory.title}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-rose-200/80 shrink-0 self-end sm:self-auto">
            <span className="font-semibold">{breakingStory.publisher}</span>
            <span className="opacity-50">&bull;</span>
            <span>{breakingStory.timeAgo}</span>
            <ArrowUpRight className="w-4 h-4 text-[#B82E3B] dark:text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      )}

      {/* Category Filter Strip */}
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-1.5 min-w-max">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-[#0D6847] text-white shadow-xs'
                    : 'theme-card theme-secondary-text hover:theme-main-text border theme-border hover:border-[#0D6847]/40'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls Bar: Search & Sentiment Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 theme-card p-3 rounded-2xl border theme-border shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 theme-muted-text absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search headlines by company, sector, or symbol (e.g. NIFTY, RBI, Reliance)..."
            className="w-full pl-9 pr-28 py-2 rounded-xl theme-surface-subtle border theme-border text-xs theme-main-text placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#0D6847] dark:focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadNews(false);
              }}
              className="absolute right-16 top-1/2 -translate-y-1/2 theme-muted-text hover:theme-main-text text-xs font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold theme-card hover:theme-surface-subtle theme-main-text rounded-lg border theme-border cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Sentiment Filter Tabs */}
        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 text-xs">
          <span className="text-[11px] theme-muted-text mr-1 flex items-center gap-1 font-medium">
            <Filter className="w-3 h-3" /> Tone:
          </span>
          <button
            type="button"
            onClick={() => setSentimentFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              sentimentFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'theme-secondary-text hover:theme-main-text'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSentimentFilter('POSITIVE')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              sentimentFilter === 'POSITIVE'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0D6847] dark:text-emerald-400 border border-[#0D6847]/30 dark:border-emerald-500/30'
                : 'theme-secondary-text hover:text-[#0D6847] dark:hover:text-emerald-400'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> Bullish
          </button>
          <button
            type="button"
            onClick={() => setSentimentFilter('NEGATIVE')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              sentimentFilter === 'NEGATIVE'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-[#B82E3B] dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                : 'theme-secondary-text hover:text-[#B82E3B] dark:hover:text-rose-400'
            }`}
          >
            <TrendingDown className="w-3 h-3" /> Bearish
          </button>
          <button
            type="button"
            onClick={() => setSentimentFilter('NEUTRAL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              sentimentFilter === 'NEUTRAL'
                ? 'bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-neutral-200 border border-slate-300 dark:border-neutral-700'
                : 'theme-secondary-text hover:theme-main-text'
            }`}
          >
            <Minus className="w-3 h-3" /> Neutral
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 p-6 rounded-2xl theme-card border theme-border animate-pulse space-y-4">
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-7 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-900 rounded" />
            <div className="h-4 w-4/5 bg-slate-100 dark:bg-slate-900 rounded" />
          </div>
          <div className="lg:col-span-5 p-5 rounded-2xl theme-card border theme-border animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2 pb-3 border-b theme-border last:border-none">
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-900 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && displayedItems.length === 0 && (
        <div className="p-12 text-center rounded-2xl theme-card border theme-border space-y-3 shadow-2xs">
          <AlertCircle className="w-8 h-8 theme-muted-text mx-auto" />
          <h3 className="text-base font-semibold theme-main-text">No market headlines found</h3>
          <p className="text-xs theme-secondary-text max-w-md mx-auto">
            No active stories match &quot;{searchQuery || selectedCategory}&quot;. Try resetting your filters or refreshing the daily feed.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSentimentFilter('ALL');
              loadNews(false);
            }}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-[#0D6847] hover:bg-[#095237] text-white transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Editorial Broadsheet Content Layout */}
      {!loading && displayedItems.length > 0 && (
        <div className="space-y-6">
          {/* Asymmetric Above-the-Fold Front Page Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left 7 Cols: Lead Dispatch Spotlight */}
            {leadStory && (
              <article
                onClick={() => setActiveArticle(leadStory)}
                className="lg:col-span-7 theme-card rounded-2xl border theme-border hover:border-[#0D6847]/60 dark:hover:border-emerald-500/50 p-6 sm:p-7 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-5 relative overflow-hidden"
              >
                {/* Top Editorial Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0D6847] via-emerald-500 to-teal-500" />

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#0D6847] dark:text-emerald-400">
                        Lead Dispatch
                      </span>
                      <span className="theme-muted-text">&bull;</span>
                      <span className="font-semibold theme-main-text inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#0D6847] dark:text-emerald-400" />
                        {leadStory.publisher}
                      </span>
                      <span className="theme-muted-text">&bull;</span>
                      <span className="inline-flex items-center gap-1 theme-muted-text">
                        <Clock className="w-3.5 h-3.5" />
                        {leadStory.timeAgo}
                      </span>
                    </div>

                    <div>
                      {leadStory.sentiment === 'POSITIVE' && (
                        <span className="text-[11px] font-semibold text-[#0D6847] dark:text-emerald-400 inline-flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Bullish Pulse
                        </span>
                      )}
                      {leadStory.sentiment === 'NEGATIVE' && (
                        <span className="text-[11px] font-semibold text-[#B82E3B] dark:text-rose-400 inline-flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" /> Bearish Pulse
                        </span>
                      )}
                      {leadStory.sentiment === 'NEUTRAL' && (
                        <span className="text-[11px] font-medium theme-muted-text inline-flex items-center gap-1">
                          <Minus className="w-3 h-3" /> Market Update
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold theme-main-text group-hover:text-[#0D6847] dark:group-hover:text-emerald-400 transition-colors tracking-tight leading-snug">
                      {leadStory.title}
                    </h2>
                    <p className="text-sm theme-secondary-text line-clamp-4 leading-relaxed">
                      {leadStory.summary}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t theme-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {leadStory.symbols && leadStory.symbols.length > 0 ? (
                      leadStory.symbols.map((sym) => (
                        <span
                          key={sym}
                          className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                        >
                          ${sym}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] font-mono theme-muted-text">Broad Market Coverage</span>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-bold text-[#0D6847] dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Read full story &amp; context</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </article>
            )}

            {/* Right 5 Cols: "At a Glance" Top Market Wire Column */}
            {atAGlanceStories.length > 0 && (
              <div className="lg:col-span-5 theme-card rounded-2xl border theme-border p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-1 border-b theme-border">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0D6847] dark:text-emerald-400">
                      Top Headlines Wire
                    </span>
                    <span className="text-[10px] font-mono theme-muted-text">Quick Scan</span>
                  </div>

                  <div className="divide-y theme-border">
                    {atAGlanceStories.map((story, idx) => (
                      <button
                        key={story.id}
                        type="button"
                        onClick={() => setActiveArticle(story)}
                        className="w-full text-left py-3 first:pt-2.5 last:pb-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] -mx-2 px-2 rounded-xl transition-colors cursor-pointer group flex items-start gap-3"
                      >
                        <span className="font-mono text-xs font-bold theme-muted-text group-hover:text-[#0D6847] dark:group-hover:text-emerald-400 pt-0.5 shrink-0">
                          0{idx + 2}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2 text-[10px] font-mono theme-muted-text">
                            <span className="font-semibold theme-secondary-text truncate">
                              {story.publisher}
                            </span>
                            <span className="shrink-0">{story.timeAgo}</span>
                          </div>
                          <h3 className="text-xs sm:text-[13px] font-semibold theme-main-text group-hover:text-[#0D6847] dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                            {story.title}
                          </h3>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t theme-border flex items-center justify-between text-[11px] theme-muted-text font-mono">
                  <span>Showing {displayedItems.length} curated stories</span>
                  <span className="text-[#0D6847] dark:text-emerald-400 font-semibold">Today&apos;s Edition</span>
                </div>
              </div>
            )}
          </div>

          {/* Remaining Dispatches: Clean Two-Column Editorial Wire Grid */}
          {gridStories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b theme-border pb-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider theme-secondary-text">
                  Latest Market Dispatches
                </h2>
                <span className="text-[11px] font-mono theme-muted-text">
                  Click any dispatch for full context
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gridStories.map((story) => {
                  const sentimentAccent =
                    story.sentiment === 'POSITIVE'
                      ? 'border-l-[#0D6847] dark:border-l-emerald-500'
                      : story.sentiment === 'NEGATIVE'
                      ? 'border-l-[#B82E3B] dark:border-l-rose-500'
                      : 'border-l-slate-300 dark:border-l-slate-700';

                  return (
                    <article
                      key={story.id}
                      onClick={() => setActiveArticle(story)}
                      className={`p-5 rounded-2xl theme-card border theme-border border-l-4 ${sentimentAccent} hover:border-[#0D6847]/50 dark:hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-3`}
                    >
                      <div className="space-y-2">
                        {/* Quiet Unboxed Metadata Line */}
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-semibold theme-secondary-text truncate max-w-[180px]">
                            {story.publisher}
                          </span>
                          <span className="theme-muted-text shrink-0">{story.timeAgo}</span>
                        </div>

                        <h3 className="text-sm sm:text-[15px] font-bold theme-main-text group-hover:text-[#0D6847] dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                          {story.title}
                        </h3>

                        <p className="text-xs theme-secondary-text line-clamp-2 leading-relaxed">
                          {story.summary}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t theme-border flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 overflow-hidden font-mono">
                          {story.symbols && story.symbols.length > 0 ? (
                            story.symbols.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="text-[10px] font-semibold theme-secondary-text"
                              >
                                ${s}
                              </span>
                            ))
                          ) : (
                            <span className="theme-muted-text text-[10px]">Market Brief</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 font-semibold">
                          {story.sentiment === 'POSITIVE' && (
                            <span className="text-[#0D6847] dark:text-emerald-400 flex items-center gap-0.5">
                              <TrendingUp className="w-3 h-3" /> Bullish
                            </span>
                          )}
                          {story.sentiment === 'NEGATIVE' && (
                            <span className="text-[#B82E3B] dark:text-rose-400 flex items-center gap-0.5">
                              <TrendingDown className="w-3 h-3" /> Bearish
                            </span>
                          )}
                          {story.sentiment === 'NEUTRAL' && (
                            <span className="theme-muted-text font-medium">Neutral</span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Syndication Footer Note */}
      <div className="p-4 rounded-2xl theme-surface-subtle border theme-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs theme-secondary-text">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#0D6847] dark:text-emerald-500 shrink-0" />
          <span>
            Feeds syndicated daily from Economic Times, Livemint, Business Standard, BSE, NSE, and RBI communications.
          </span>
        </div>
        <div className="text-[11px] font-mono theme-muted-text">
          Auto-updates daily &amp; every 10 mins
        </div>
      </div>

      {/* Article Detail Modal */}
      {activeArticle && (
        <ArticleDetailModal
          article={activeArticle}
          onClose={() => setActiveArticle(null)}
          onSelectRelated={(rel) => setActiveArticle(rel)}
          relatedArticles={modalRelated}
        />
      )}
    </div>
  );
};
