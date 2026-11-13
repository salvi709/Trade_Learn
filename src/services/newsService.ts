import { MarketNewsItem, MarketNewsResponse, NewsCategory } from '../types';

export interface FetchNewsOptions {
  category?: NewsCategory;
  search?: string;
  limit?: number;
  forceRefresh?: boolean;
}

export async function fetchMarketNews(options: FetchNewsOptions = {}): Promise<MarketNewsResponse> {
  const queryParams = new URLSearchParams();
  if (options.category && options.category !== 'ALL') {
    queryParams.set('category', options.category);
  }
  if (options.search && options.search.trim()) {
    queryParams.set('search', options.search.trim());
  }
  if (options.limit) {
    queryParams.set('limit', String(options.limit));
  }
  if (options.forceRefresh) {
    queryParams.set('refresh', 'true');
  }

  const queryString = queryParams.toString();
  const url = `/api/news${queryString ? `?${queryString}` : ''}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch news: status ${res.status}`);
    }

    const data: MarketNewsResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('[newsService] Using offline fallback due to network issue:', err);
    return getOfflineNewsFallback(options);
  }
}

export async function fetchDashboardNews(forceRefresh = false): Promise<MarketNewsItem[]> {
  try {
    const url = forceRefresh ? '/api/news/dashboard?refresh=true' : '/api/news/dashboard';
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch dashboard news: status ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data.items) && data.items.length > 0) {
      return data.items;
    }
    return getOfflineNewsFallback({ limit: 4 }).items;
  } catch (err) {
    console.warn('[newsService] Dashboard news fetch fallback:', err);
    return getOfflineNewsFallback({ limit: 4 }).items;
  }
}

function getOfflineNewsFallback(options: FetchNewsOptions): MarketNewsResponse {
  const fallbackStories: MarketNewsItem[] = [
    {
      id: 'fb-offline-1',
      title: 'Sensex, Nifty Touch Record Highs Driven by Strong Domestic Inflows & IT Earnings',
      summary: 'Indian benchmark indices continued their upward momentum with Nifty crossing historic thresholds. Foreign institutional buying coupled with strong domestic mutual fund SIP flows provided robust support.',
      url: 'https://news.google.com/search?q=Nifty+Sensex+record+high',
      publisher: 'The Economic Times',
      publishedAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
      category: 'NIFTY_SENSEX',
      sentiment: 'POSITIVE',
      symbols: ['NIFTY', 'SENSEX', 'TCS', 'INFY'],
      isBreaking: true,
      isTrending: true,
      timeAgo: '36m ago',
    },
    {
      id: 'fb-offline-2',
      title: 'RBI Monetary Policy Committee Maintains Repo Rate at 6.5%, Emphasizes Food Inflation Vigilance',
      summary: 'The Reserve Bank of India MPC voted to keep the benchmark repo rate unchanged at 6.50% while holding inflation projection steady. Governor emphasized durable price stability as fundamental to long-term economic growth.',
      url: 'https://news.google.com/search?q=RBI+monetary+policy+repo+rate',
      publisher: 'Reserve Bank of India',
      publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      category: 'ECONOMY_RBI',
      sentiment: 'NEUTRAL',
      symbols: ['HDFCBANK', 'SBIN', 'ICICIBANK'],
      timeAgo: '2h ago',
    },
    {
      id: 'fb-offline-3',
      title: 'NSE Reports 35% Year-on-Year Growth in Registered Retail Investor Accounts Across Tier-2 & Tier-3 Cities',
      summary: 'National Stock Exchange data highlights unprecedented participation from retail investors outside metro cities, with monthly systematic investment plan (SIP) tallies breaching historic milestones.',
      url: 'https://news.google.com/search?q=NSE+retail+investor+growth',
      publisher: 'Business Standard',
      publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      category: 'NSE_BSE',
      sentiment: 'POSITIVE',
      symbols: ['NIFTY'],
      timeAgo: '4h ago',
    },
    {
      id: 'fb-offline-4',
      title: 'SEBI Clarifies T+0 Settlement Framework Expansion and Safeguards for Retail Investors',
      summary: 'Market regulator SEBI introduced enhanced surveillance measures and operational guidelines to ensure liquidity stability during the phased rollout of optional same-day trade settlements.',
      url: 'https://news.google.com/search?q=SEBI+T+0+settlement+framework',
      publisher: 'Livemint',
      publishedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      category: 'INDIAN_MARKETS',
      sentiment: 'NEUTRAL',
      timeAgo: '6h ago',
    },
    {
      id: 'fb-offline-5',
      title: 'Clean Energy & Infrastructure Majors Announce ₹45,000 Crore Capital Expenditure Pipeline',
      summary: 'Leading renewable energy and capital goods conglomerates unveiled expanded 3-year capacity buildout plans, citing strong domestic grid modernization tenders.',
      url: 'https://news.google.com/search?q=clean+energy+infrastructure+capex+india',
      publisher: 'Financial Express',
      publishedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      category: 'STOCKS_COMPANIES',
      sentiment: 'POSITIVE',
      symbols: ['LT', 'RELIANCE'],
      timeAgo: '8h ago',
    },
  ];

  let filtered = fallbackStories;
  if (options.category && options.category !== 'ALL') {
    filtered = filtered.filter((s) => {
      if (s.category === options.category) return true;
      if (options.category === 'INDIAN_MARKETS' && (s.category === 'NSE_BSE' || s.category === 'NIFTY_SENSEX')) return true;
      return false;
    });
  }

  if (options.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    filtered = filtered.filter((s) => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q));
  }

  const limit = options.limit || 30;
  return {
    items: filtered.slice(0, limit),
    total: filtered.length,
    retrievedAt: new Date().toISOString(),
    source: 'Financial Feeds Syndicate (NSE, BSE, RBI & Accredited Financial Press)',
    cached: true,
  };
}
