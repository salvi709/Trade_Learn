import React, { useState, useEffect, useMemo } from 'react';
import { 
  MarketNewsItem, 
  MarketNewsResponse, 
  NewsCategory 
} from '../../types';
import { fetchMarketNews } from '../../services/newsService';
import { ArticleDetailModal } from './ArticleDetailModal';
import { 
  Search, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ExternalLink, 
  Clock, 
  Sparkles, 
  AlertCircle,
  Building2,
  Filter,
  CheckCircle2,
  Newspaper,
  Flame,
  ArrowUpRight
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

export const MarketNewsCenter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newsData, setNewsData] = useState<MarketNewsResponse | null>(null);
  const [activeArticle, setActiveArticle] = useState<MarketNewsItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadNews = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchMarketNews({
        category: selectedCategory,
        search: searchQuery.trim() || undefined,
        limit: 40,
        forceRefresh: isManualRefresh,
      });
      setNewsData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching market news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews(false);
  }, [selectedCategory]);

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

  // Lead story & rest of items
  const leadStory = displayedItems[0];
  const regularStories = displayedItems.slice(1);

  // Related articles for modal
  const modalRelated = useMemo(() => {
    if (!activeArticle || !newsData?.items) return [];
    return newsData.items
      .filter((i) => i.id !== activeArticle.id && (i.category === activeArticle.category || i.publisher === activeArticle.publisher))
      .slice(0, 3);
  }, [activeArticle, newsData]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-neutral-100">
      {/* Editorial Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E2633]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#0D6847]/20 border border-[#0D6847]/40 text-emerald-400">
              <Newspaper className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              Market News
            </h1>
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#141B24] border border-[#232F3E] text-emerald-400">
              Live Syndicate
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-normal leading-relaxed">
            Real-time financial press feeds, monetary policy updates, exchange disclosures, and corporate intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-neutral-400">
              Syndicated Feed: <span className="text-neutral-300 font-medium">{newsData?.cached ? 'Cached' : 'Direct Stream'}</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">
              Synced {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <button
            onClick={() => loadNews(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[#111822] hover:bg-[#182332] border border-[#222E3E] text-neutral-200 transition active:scale-95 disabled:opacity-50"
            title="Refresh Latest News"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : 'text-neutral-400'}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Breaking / Trending Banner */}
      {breakingStory && (
        <div 
          onClick={() => setActiveArticle(breakingStory)}
          className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-[#11161F] to-[#0E131A] border border-rose-500/30 hover:border-rose-500/60 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="px-2 py-1 rounded text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 flex items-center gap-1 group-hover:scale-105 transition-transform duration-200">
              <Flame className="w-3 h-3 animate-pulse text-rose-400" />
              {breakingStory.isBreaking ? 'Breaking News' : 'Market Alert'}
            </span>
            <div className="text-xs sm:text-sm font-medium text-white group-hover:text-rose-200 transition-colors line-clamp-1">
              {breakingStory.title}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400 shrink-0 self-end sm:self-auto">
            <span>{breakingStory.publisher}</span>
            <span className="text-neutral-600">·</span>
            <span>{breakingStory.timeAgo}</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </div>
        </div>
      )}

      {/* Category Tabs (Scrollable) */}
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-1.5 min-w-max">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-[#0D6847] text-white shadow-sm font-semibold'
                    : 'bg-[#0E131A] text-neutral-400 hover:text-white hover:bg-[#141C24] border border-[#1A222D]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls Bar: Search & Sentiment Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0B0F15] p-3 rounded-xl border border-[#18212D]">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news by company, keyword, or symbol (e.g. NIFTY, RBI, Reliance)..."
            className="w-full pl-9 pr-20 py-2 rounded-lg bg-[#070A0E] border border-[#1C2633] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadNews(false);
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-medium bg-[#131C26] hover:bg-[#1B2735] text-neutral-300 rounded border border-[#223042]"
          >
            Search
          </button>
        </form>

        {/* Sentiment Filter Tabs */}
        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 text-xs">
          <span className="text-[11px] text-neutral-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Sentiment:
          </span>
          <button
            onClick={() => setSentimentFilter('ALL')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-all duration-150 hover:-translate-y-0.5 cursor-pointer ${
              sentimentFilter === 'ALL'
                ? 'bg-[#182230] text-white border border-[#2A3B50]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSentimentFilter('POSITIVE')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex items-center gap-1 ${
              sentimentFilter === 'POSITIVE'
                ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-emerald-400'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> Bullish
          </button>
          <button
            onClick={() => setSentimentFilter('NEGATIVE')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex items-center gap-1 ${
              sentimentFilter === 'NEGATIVE'
                ? 'bg-rose-950/50 text-rose-400 border border-rose-500/30'
                : 'text-neutral-400 hover:text-rose-400'
            }`}
          >
            <TrendingDown className="w-3 h-3" /> Bearish
          </button>
          <button
            onClick={() => setSentimentFilter('NEUTRAL')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex items-center gap-1 ${
              sentimentFilter === 'NEUTRAL'
                ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-300'
            }`}
          >
            <Minus className="w-3 h-3" /> Neutral
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-xl bg-[#0B0F15] border border-[#161F2A] animate-pulse space-y-3">
              <div className="h-3 w-28 bg-[#182330] rounded" />
              <div className="h-5 w-5/6 bg-[#182330] rounded" />
              <div className="h-3 w-full bg-[#141B24] rounded" />
              <div className="h-3 w-4/6 bg-[#141B24] rounded" />
              <div className="pt-2 flex justify-between">
                <div className="h-3 w-20 bg-[#16202C] rounded" />
                <div className="h-3 w-16 bg-[#16202C] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && displayedItems.length === 0 && (
        <div className="p-12 text-center rounded-xl bg-[#0A0D12] border border-[#18212D] space-y-3">
          <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto" />
          <h3 className="text-base font-semibold text-neutral-200">No market headlines found</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            No active stories match the selected criteria for &quot;{searchQuery || selectedCategory}&quot;. 
            Try resetting your filters or refreshing the syndicated feed.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSentimentFilter('ALL');
              loadNews(false);
            }}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#0D6847] hover:bg-[#107c55] text-white transition"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Content Layout */}
      {!loading && displayedItems.length > 0 && (
        <div className="space-y-6">
          {/* Hero / Lead Feature Story */}
          {leadStory && (
            <div
              onClick={() => setActiveArticle(leadStory)}
              className="p-6 rounded-2xl bg-[#0B0F14] border border-[#1C2634] hover:border-emerald-500/50 hover:bg-[#0D131B] hover:-translate-y-1 hover:shadow-2xl transition-all duration-200 cursor-pointer group space-y-4 shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {leadStory.publisher}
                  </span>
                  <span className="text-neutral-600">·</span>
                  <span className="flex items-center gap-1 text-neutral-400">
                    <Clock className="w-3.5 h-3.5" />
                    {leadStory.timeAgo}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {leadStory.sentiment === 'POSITIVE' && (
                    <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Bullish Pulse
                    </span>
                  )}
                  {leadStory.sentiment === 'NEGATIVE' && (
                    <span className="text-[11px] font-medium text-rose-400 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Bearish Pulse
                    </span>
                  )}
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#131B24] border border-[#232F3E] text-neutral-300">
                    Lead Story
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors tracking-tight leading-snug">
                  {leadStory.title}
                </h2>
                <p className="text-sm text-neutral-300 line-clamp-3 leading-relaxed">
                  {leadStory.summary}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#18212D]">
                <div className="flex flex-wrap gap-1.5">
                  {leadStory.symbols?.map((sym) => (
                    <span
                      key={sym}
                      className="px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-[#131C27] border border-[#1F2C3D] text-neutral-300"
                    >
                      ${sym}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Read full story & analysis</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}

          {/* Regular Stories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularStories.map((story) => (
              <div
                key={story.id}
                onClick={() => setActiveArticle(story)}
                className="p-5 rounded-xl bg-[#090D12] border border-[#17202B] hover:border-emerald-500/40 hover:bg-[#0D1219] hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  {/* Quiet Unboxed Metadata Line */}
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300 truncate max-w-[150px]">
                      {story.publisher}
                    </span>
                    <span className="text-neutral-500 font-mono shrink-0">
                      {story.timeAgo}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                    {story.title}
                  </h3>

                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {story.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#141C25] flex items-center justify-between text-[11px]">
                  {/* Stock Symbols */}
                  <div className="flex items-center gap-1 overflow-hidden">
                    {story.symbols && story.symbols.length > 0 ? (
                      story.symbols.slice(0, 2).map((s) => (
                        <span key={s} className="font-mono text-[10px] text-neutral-400">
                          ${s}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-500 text-[10px]">General Market</span>
                    )}
                  </div>

                  {/* Sentiment tag */}
                  <div className="flex items-center gap-1 shrink-0">
                    {story.sentiment === 'POSITIVE' && (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> Bullish
                      </span>
                    )}
                    {story.sentiment === 'NEGATIVE' && (
                      <span className="text-rose-400 flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" /> Bearish
                      </span>
                    )}
                    {story.sentiment === 'NEUTRAL' && (
                      <span className="text-neutral-500">
                        Neutral
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Syndication Footer Note */}
      <div className="p-4 rounded-xl bg-[#070A0E] border border-[#161E28] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Feeds syndicated from official financial press, BSE, NSE, and RBI communications.
          </span>
        </div>
        <div className="text-[11px] font-mono text-neutral-500">
          Source: Google News Financial Syndicate & Public Press Feeds
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
