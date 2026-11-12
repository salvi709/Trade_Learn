import React, { useEffect } from 'react';
import { MarketNewsItem } from '../../types';
import { 
  X, 
  ExternalLink, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Share2, 
  Building2, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
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
        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
          <TrendingUp className="w-3.5 h-3.5" /> Market Bullish
        </span>
      );
    }
    if (article.sentiment === 'NEGATIVE') {
      return (
        <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
          <TrendingDown className="w-3.5 h-3.5" /> Market Bearish
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-neutral-400 font-medium">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] bg-[#0A0D11] border border-[#1F2937] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A222D] bg-[#0E131A]/60">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-500">
              {categoryLabels[article.category] || article.category}
            </span>
            {article.isBreaking && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
                BREAKING
              </span>
            )}
            {article.isTrending && !article.isBreaking && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                TRENDING
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#1E2633] transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Main Headline */}
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
            {article.title}
          </h2>

          {/* Quiet Unboxed Metadata Line (Zero-Pill Rule) */}
          <div className="flex flex-wrap items-center gap-y-1.5 text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-500" />
              {article.publisher}
            </span>
            <span className="mx-2 text-neutral-600">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              Published {article.timeAgo || formatDate(article.publishedAt)}
            </span>
            <span className="mx-2 text-neutral-600">·</span>
            {getSentimentIcon()}
          </div>

          {/* Summary / Lead */}
          <div className="bg-[#0D1219] p-5 rounded-xl border border-[#1E2633] space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Market Summary & Context
            </div>
            <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-normal">
              {article.summary}
            </p>
          </div>

          {/* Related Symbols / Tickers */}
          {article.symbols && article.symbols.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Relevant Instruments / Symbols:
              </span>
              <div className="flex flex-wrap gap-2">
                {article.symbols.map((sym) => (
                  <span
                    key={sym}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-[#131B24] border border-[#232F3E] text-neutral-200"
                  >
                    ${sym}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Publisher & Feed Attribution Section */}
          <div className="p-4 rounded-xl bg-[#090D12] border border-[#19222E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Verified Financial Press Feed
              </div>
              <p className="text-xs text-neutral-500">
                Original story authored by <strong className="text-neutral-400 font-semibold">{article.publisher}</strong>. 
                Retrieved via syndicated financial feeds.
              </p>
            </div>

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#0D6847] hover:bg-[#107c55] text-white shadow transition-all shrink-0 active:scale-[0.98]"
            >
              <span>Read Original Article</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Related Stories */}
          {relatedArticles.length > 0 && (
            <div className="pt-4 border-t border-[#18212C] space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Related Market Stories
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedArticles.slice(0, 2).map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="p-3.5 rounded-xl bg-[#0C1117] border border-[#1C2532] hover:border-neutral-700 transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="text-[11px] text-neutral-400 font-medium">
                        {rel.publisher} · {rel.timeAgo}
                      </div>
                      <h4 className="text-xs font-medium text-neutral-200 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                    </div>
                    <div className="pt-2 flex items-center text-[11px] text-emerald-500 font-medium group-hover:translate-x-0.5 transition-transform">
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
        <div className="px-6 py-3 border-t border-[#18212C] bg-[#0A0D11] flex items-center justify-between text-xs text-neutral-500">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[#18212D] text-neutral-300 font-mono text-[10px]">Esc</kbd> to return</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-[#232E3E] hover:bg-[#16202C] text-neutral-300 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
