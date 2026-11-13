import React, { useEffect } from 'react';
import { MarketNewsItem } from '../../types';
import {
  X,
  ExternalLink,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ArticleDetailModalProps {
  article: MarketNewsItem | null;
  onClose: () => void;
  onSelectRelated: (article: MarketNewsItem) => void;
  relatedArticles: MarketNewsItem[];
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  onClose,
  onSelectRelated,
  relatedArticles,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!article) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getSentimentIcon = () => {
    if (article.sentiment === 'POSITIVE') {
      return (
        <span className="inline-flex items-center gap-1 text-[#0D6847] dark:text-emerald-400 font-semibold">
          <TrendingUp className="w-3.5 h-3.5" /> Market Bullish
        </span>
      );
    }
    if (article.sentiment === 'NEGATIVE') {
      return (
        <span className="inline-flex items-center gap-1 text-[#B82E3B] dark:text-rose-400 font-semibold">
          <TrendingDown className="w-3.5 h-3.5" /> Market Bearish
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 theme-secondary-text font-medium">
        <Minus className="w-3.5 h-3.5" /> Market Neutral
      </span>
    );
  };

  const categoryLabels: Record<string, string> = {
    INDIAN_MARKETS: 'Indian Markets',
    NSE_BSE: 'NSE & BSE',
    NIFTY_SENSEX: 'Nifty & Sensex',
    STOCKS_COMPANIES: 'Stocks & Corporate',
    IPO_LISTINGS: 'IPO & Listings',
    TECHNICAL_ANALYSIS: 'Technical Analysis',
    ECONOMY_RBI: 'Economy & RBI',
    GLOBAL_MARKETS: 'Global Markets',
    CORPORATE_ANNOUNCEMENTS: 'Corporate Filing',
    COMMODITIES_CURRENCY: 'Commodities & FX',
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/55 dark:bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#131A24]/80">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider font-bold text-[#0D6847] dark:text-emerald-400 font-mono">
              {categoryLabels[article.category] || article.category}
            </span>
            {article.isBreaking && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#B82E3B] text-white animate-pulse">
                BREAKING
              </span>
            )}
            {article.isTrending && !article.isBreaking && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                TRENDING
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Main Headline */}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug font-heading">
            {article.title}
          </h2>

          {/* Quiet Unboxed Metadata Line */}
          <div className="flex flex-wrap items-center gap-y-1.5 text-xs text-slate-600 dark:text-neutral-400 font-mono">
            <span className="font-semibold text-slate-900 dark:text-neutral-200 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#0D6847] dark:text-emerald-500" />
              {article.publisher}
            </span>
            <span className="mx-2 opacity-50">&bull;</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 opacity-70" />
              Published {article.timeAgo || formatDate(article.publishedAt)}
            </span>
            <span className="mx-2 opacity-50">&bull;</span>
            {getSentimentIcon()}
          </div>

          {/* Summary / Lead */}
          <div className="bg-slate-50 dark:bg-[#131A24] p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0D6847] dark:text-emerald-400 uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              Market Summary &amp; Context
            </div>
            <p className="text-sm sm:text-base text-slate-700 dark:text-neutral-200 leading-relaxed font-normal">
              {article.summary}
            </p>
          </div>

          {/* Related Symbols / Tickers */}
          {article.symbols && article.symbols.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
                Relevant Instruments / Symbols:
              </span>
              <div className="flex flex-wrap gap-2">
                {article.symbols.map((sym) => (
                  <span
                    key={sym}
                    className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-neutral-200"
                  >
                    ${sym}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Publisher & Feed Attribution Section */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-[#0D1614] border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-900 dark:text-neutral-200 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0D6847] dark:text-emerald-400" />
                Verified Financial Press Feed
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400">
                Original story authored by{' '}
                <strong className="text-slate-900 dark:text-neutral-200 font-semibold">
                  {article.publisher}
                </strong>
                . Retrieved via live syndicated financial feeds.
              </p>
            </div>

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-[#0D6847] hover:bg-[#095237] text-white shadow-xs transition-all shrink-0 active:scale-[0.98]"
            >
              <span>Read Original Article</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Related Stories */}
          {relatedArticles.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-mono">
                Related Market Stories
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedArticles.slice(0, 2).map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121821] border border-slate-200 dark:border-slate-800 hover:border-[#0D6847]/50 dark:hover:border-emerald-500/40 hover:bg-white dark:hover:bg-[#16202C] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono font-medium">
                        {rel.publisher} &bull; {rel.timeAgo}
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-neutral-200 group-hover:text-[#0D6847] dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                    </div>
                    <div className="pt-2 flex items-center text-[11px] text-[#0D6847] dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D1117] flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <span>
            Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-neutral-300 font-mono text-[10px]">
              Esc
            </kbd>{' '}
            to return
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
