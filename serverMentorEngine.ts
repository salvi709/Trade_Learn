import { GoogleGenAI } from '@google/genai';
import { CURRICULUM_MODULES } from './src/data/curriculumData';
import { GLOSSARY_TERMS } from './src/data/marketData';
import { aiQuotaTracker, getActiveFreeModel, validateZeroCostModel } from './aiQuotaTracker';

export interface LearnerContext {
  displayName?: string;
  currentStageNumber?: number;
  currentStageTitle?: string;
  currentLessonTitle?: string;
  completedLessonsCount?: number;
  totalLessonsCount?: number;
  experienceLevel?: string;
  averageQuizScore?: number;
  recentDifficultTopics?: string[];
}

export interface MentorHistoryItem {
  sender: 'user' | 'mentor';
  text: string;
}

export interface MentorAttachmentItem {
  name?: string;
  mimeType: string;
  base64: string;
}

export interface MentorGenerateRequest {
  question: string;
  userId?: string;
  history?: MentorHistoryItem[];
  mode?: 'eli15' | 'deep_dive';
  learnerContext?: LearnerContext;
  currentModule?: string;
  currentLesson?: string;
  attachments?: MentorAttachmentItem[];
}

export interface MentorGenerateResult {
  answer: string;
  modelUsed: string;
  retrievedLessons?: string[];
  retrievedGlossary?: string[];
  latencyMs: number;
}

// ---------------------------------------------------------------------------
// 1. KNOWLEDGE BASE INDEX FOR RETRIEVAL (RAG)
// ---------------------------------------------------------------------------

interface KnowledgeChunk {
  id: string;
  type: 'lesson' | 'glossary';
  title: string;
  stageInfo?: string;
  keywords: string[];
  content: string;
}

const KNOWLEDGE_INDEX: KnowledgeChunk[] = [];

CURRICULUM_MODULES.forEach((mod) => {
  mod.lessons.forEach((les) => {
    const textCorpus = [
      les.title,
      les.shortDesc,
      les.eli15.analogyTitle,
      les.eli15.explanation,
      les.eli15.keyTakeaway,
      les.deepDive.technicalOverview,
      les.deepDive.marketMechanics,
      les.deepDive.riskInsight,
      ...(les.deepDive.formulasAndMetrics?.map((f) => `${f.label} ${f.formula} ${f.detail}`) || []),
      ...(les.quiz.map((q) => `${q.question} ${q.explanation}`) || []),
    ].join(' ');

    const words = Array.from(
      new Set(
        textCorpus
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 2)
      )
    );

    KNOWLEDGE_INDEX.push({
      id: les.id,
      type: 'lesson',
      title: les.title,
      stageInfo: `Stage ${mod.levelNumber}: ${mod.title}`,
      keywords: words,
      content: `[ShareMarket Curriculum — Stage ${mod.levelNumber}: ${mod.title} | Lesson: "${les.title}"]
- Core Concept: ${les.eli15.explanation.slice(0, 320)}
- Real-Life Analogy (${les.eli15.analogyTitle}): "${les.eli15.realLifeAnalogy}"
- Key Takeaway: "${les.eli15.keyTakeaway}"
- Technical Mechanics: ${les.deepDive.technicalOverview.slice(0, 280)}
- Risk Perspective: ${les.deepDive.riskInsight.slice(0, 240)}
${
  les.deepDive.formulasAndMetrics && les.deepDive.formulasAndMetrics.length > 0
    ? '- Key Formula: ' + les.deepDive.formulasAndMetrics.map((f) => `${f.label}: ${f.formula}`).join(' | ')
    : ''
}`,
    });
  });
});

GLOSSARY_TERMS.forEach((term) => {
  const textCorpus = `${term.term} ${term.category} ${term.definition} ${term.example} ${term.relatedTerms?.join(' ')}`;
  const words = Array.from(
    new Set(
      textCorpus
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    )
  );

  KNOWLEDGE_INDEX.push({
    id: `glossary_${term.term.toLowerCase().replace(/\s+/g, '_')}`,
    type: 'glossary',
    title: term.term,
    stageInfo: `Glossary (${term.category})`,
    keywords: words,
    content: `[Glossary Term: "${term.term}" (${term.category})]
- Definition: ${term.definition}
- Indian Market Example: ${term.example}
- Related Concepts: ${term.relatedTerms?.join(', ') || 'N/A'}`,
  });
});

// ---------------------------------------------------------------------------
// 2. HIGH-PRECISION RETRIEVAL (STRICT RELEVANCE ONLY)
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'what', 'is', 'a', 'the', 'how', 'why', 'can', 'i', 'do', 'does', 'in', 'of',
  'to', 'and', 'or', 'for', 'about', 'tell', 'me', 'explain', 'please', 'with',
  'are', 'an', 'at', 'on', 'my', 'your', 'we', 'you', 'should', 'would', 'could',
  'between', 'difference', 'vs', 'versus', 'understand', 'simpler', 'words'
]);

export function retrieveRelevantKnowledge(
  query: string,
  maxResults = 2
): { chunks: KnowledgeChunk[]; lessonRefs: string[]; glossaryRefs: string[] } {
  const lowerQuery = query.toLowerCase().trim();
  const queryTokens = Array.from(
    new Set(
      lowerQuery
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    )
  );

  if (queryTokens.length === 0) {
    return { chunks: [], lessonRefs: [], glossaryRefs: [] };
  }

  const scored = KNOWLEDGE_INDEX.map((chunk) => {
    let score = 0;
    const lowerTitle = chunk.title.toLowerCase();

    // Exact title match gets huge bonus
    if (lowerQuery === lowerTitle || lowerQuery.includes(lowerTitle)) {
      score += 120;
    } else if (lowerTitle.includes(lowerQuery)) {
      score += 80;
    }

    if (chunk.type === 'glossary') {
      const cleanTerm = chunk.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanQ = lowerQuery.replace(/[^a-z0-9]/g, '');
      if (cleanQ.includes(cleanTerm)) {
        score += 90;
      }
    }

    for (const token of queryTokens) {
      if (lowerTitle.includes(token)) {
        score += chunk.type === 'glossary' ? 30 : 20;
      }
      if (chunk.keywords.includes(token)) {
        score += 4;
      }
    }

    return { chunk, score };
  })
    // High relevance threshold to prevent injecting unrelated curriculum chunks into questions
    .filter((item) => item.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((item) => item.chunk);

  const lessonRefs = scored
    .filter((c) => c.type === 'lesson')
    .map((c) => `${c.stageInfo} > ${c.title}`);
  const glossaryRefs = scored
    .filter((c) => c.type === 'glossary')
    .map((c) => c.title);

  return { chunks: scored, lessonRefs, glossaryRefs };
}

// ---------------------------------------------------------------------------
// 3. FAST INTENT CLASSIFIER FOR CASUAL CONVERSATIONS
// ---------------------------------------------------------------------------

interface CasualIntentMatch {
  isCasual: boolean;
  response?: string;
}

function checkCasualIntent(question: string): CasualIntentMatch {
  const cleanQ = question.trim().toLowerCase();
  const normalized = cleanQ.replace(/[?!.,;:'"()]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Direct greetings
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening|day)|howdy|greetings|namaste|hi\s*there|hello\s*there|hey\s*there|hi\s*mentor|hello\s*mentor|hey\s*mentor)$/i.test(normalized)) {
    return {
      isCasual: true,
      response: "Hey! How can I help you today? Want to learn something about the stock market?",
    };
  }

  // 2. Wellbeing / How are you
  if (/^(how\s*are\s*you|how\s*r\s*u|how\s*are\s*you\s*doing|how\s*is\s*it\s*going|hows\s*it\s*going|whats\s*up|wassup|how\s*do\s*you\s*do)$/i.test(normalized)) {
    return {
      isCasual: true,
      response: "I'm doing well! Ready to help you understand the markets. What are we exploring today?",
    };
  }

  // 3. Gratitude / Thanks
  if (/^(thank\s*you|thanks|thank\s*u|thx|many\s*thanks|thank\s*you\s*so\s*much|thanks\s*a\s*lot|appreciate\s*it|thank\s*you\s*mentor|thanks\s*mentor)$/i.test(normalized)) {
    return {
      isCasual: true,
      response: "You're welcome! Keep learning, one concept at a time.",
    };
  }

  // 4. Acknowledgements / Short positive feedback
  if (/^(great|awesome|cool|got\s*it|understood|perfect|ok|okay|nice|superb|ok\s*got\s*it|makes\s*sense|understood\s*thanks)$/i.test(normalized)) {
    return {
      isCasual: true,
      response: "Glad that made sense! Let me know whenever you're ready for the next concept.",
    };
  }

  // 5. Capabilities / What can you do
  if (/^(what\s+can\s+you\s+do|what\s+are\s+your\s+capabilities|who\s+are\s+you|how\s+can\s+you\s+help\s+me|help\s+me|what\s+is\s+your\s+role|what\s+do\s+you\s+do)$/i.test(normalized)) {
    return {
      isCasual: true,
      response: `I'm your personal stock-market learning companion in ShareMarket! Here is what I can help you with:

• **Market Concepts**: Explaining stocks, shares, IPOs, dividends, and market cap
• **Indian Exchanges**: How the NSE, BSE, Nifty 50, Sensex, and SEBI work
• **Investing vs. Trading**: Intraday, swing, delivery, and long-term investment strategies
• **Technical Analysis**: Candlestick patterns, support & resistance, trendlines, and indicators (RSI, MACD, Moving Averages, VWAP)
• **Risk Management**: Calculating stop-loss levels, position sizing, and risk-reward ratios
• **Chart Analysis**: Uploading candlestick charts or TradingView screenshots for educational breakdown
• **Curriculum Guidance**: Clarifying lesson concepts and guiding your Paper Trading practice

What concept or chart would you like to explore today?`,
    };
  }

  return { isCasual: false };
}

// ---------------------------------------------------------------------------
// 3B. HIGH-ACCURACY DOMAIN EDUCATIONAL ENGINE (CURRICULUM & CORE CONCEPTS)
// ---------------------------------------------------------------------------

function findPrecedingTopic(history: MentorHistoryItem[]): string {
  if (!Array.isArray(history) || history.length === 0) return '';
  for (let i = history.length - 1; i >= 0; i--) {
    const text = history[i].text.toLowerCase();
    if (text.includes('rsi') || text.includes('relative strength index')) return 'rsi';
    if (text.includes('support') || text.includes('resistance')) return 'support_resistance';
    if (text.includes('investing') && text.includes('trading')) return 'investing_vs_trading';
    if (text.includes('stop loss') || text.includes('stop-loss')) return 'stop_loss';
    if (text.includes('moving average') || text.includes('sma') || text.includes('ema')) return 'moving_averages';
    if (text.includes('macd')) return 'macd';
    if (text.includes('p/e') || text.includes('pe ratio') || text.includes('price to earnings')) return 'pe_ratio';
    if (text.includes('candlestick') || text.includes('candle')) return 'candlesticks';
    if (text.includes('nifty') || text.includes('sensex') || text.includes('nse') || text.includes('bse')) return 'indices';
  }
  return '';
}

function resolveEducationalResponse(
  question: string,
  history: MentorHistoryItem[] = [],
  mode: 'eli15' | 'deep_dive' = 'eli15'
): string | null {
  const q = question.toLowerCase().trim();
  const normalized = q.replace(/[?!.,;:'"()]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Relative Strength Index (RSI)
  if (
    normalized === 'what is rsi' ||
    normalized.startsWith('what is rsi') ||
    normalized.includes('explain rsi') ||
    normalized.includes('relative strength index')
  ) {
    return `The **Relative Strength Index (RSI)** is a momentum oscillator that measures the speed and change of recent price movements to evaluate whether a stock is overbought or oversold.

• **Scale**: It oscillates between **0 and 100**.
• **Overbought (Above 70)**: Suggests the stock has experienced heavy buying pressure and may be due for a price consolidation or pullback.
• **Oversold (Below 30)**: Suggests the stock has experienced heavy selling pressure and may be due for a potential bounce or relief rally.
• **Centerline (50)**: Indicates neutral momentum. Above 50 suggests buyers are in control; below 50 suggests sellers are in control.

**How beginners understand it**:
RSI is typically set to a 14-period lookback. Rather than acting as a standalone buy or sell signal, it is best used alongside support/resistance and trend direction to avoid buying at overextended price peaks.`;
  }

  // 2. Investing vs Trading
  if (
    (normalized.includes('investing') && normalized.includes('trading') && (normalized.includes('difference') || normalized.includes('vs') || normalized.includes('compare'))) ||
    normalized === 'what is the difference between investing and trading' ||
    normalized.startsWith('what is the difference between investing and trading')
  ) {
    return `The key differences between **investing** and **trading** center on time horizon, primary goal, and analytical approach:

| Dimension | Investing | Trading |
| :--- | :--- | :--- |
| **Time Horizon** | Long-term (months, years, decades) | Short-term (minutes, hours, days, weeks) |
| **Primary Goal** | Compound wealth through business growth and dividends | Profit from short-term price fluctuations and market volatility |
| **Analysis Focus** | **Fundamental Analysis** (earnings, management, competitive moats) | **Technical Analysis** (price action, chart patterns, volume, indicators) |
| **Trade Frequency** | Low activity; buy and hold through broader market cycles | High activity; frequent entries and exits |
| **Risk Management** | Portfolio diversification and business quality | Strict stop-loss orders and position sizing |

In short: An **investor** treats shares as partial ownership in a business, while a **trader** treats stocks as price vehicles to capitalize on market moves.`;
  }

  // 3. Support and Resistance
  if (
    normalized.includes('support and resistance') ||
    normalized.includes('explain support and resistance') ||
    normalized === 'what is support and resistance'
  ) {
    return `**Support and Resistance** are fundamental price levels where the balance between buyers and sellers concentrates:

• **Support (Price Floor)**: A price level where downward price momentum tends to pause or reverse because buying interest (demand) is strong enough to absorb selling pressure.
  *Example*: If a stock drops to ₹500 several times and bounces back up each time, ₹500 acts as a support level.

• **Resistance (Price Ceiling)**: A price level where upward price momentum tends to pause or reverse because selling interest (supply and profit-taking) overcomes buying pressure.
  *Example*: If that same stock rallies up toward ₹600 repeatedly but struggles to climb higher, ₹600 acts as a resistance level.

• **Role Reversal**: When the price decisively breaks above resistance, that old resistance level often flips to become a new support floor on future pullbacks. Conversely, broken support frequently turns into new resistance.`;
  }

  // 4. Calculations (e.g. Risk-to-Reward ratio)
  const rrMatch = normalized.match(/(\d+)\s*[:/]\s*(\d+).*?risk.*?(\d+)/i) || normalized.match(/risk.*?(\d+).*?(\d+)\s*[:/]\s*(\d+)/i);
  if (rrMatch || (normalized.includes('risk') && normalized.includes('reward') && normalized.includes('calculate'))) {
    const riskAfterKeyword = normalized.match(/risk(?:\s+is|\s+of|\s*:)?\s*₹?\s*(\d+)/i)?.[1];
    const rupeeAmount = normalized.match(/₹\s*(\d+)/)?.[1];
    const riskNum = parseInt(riskAfterKeyword || rupeeAmount || '100', 10) || 100;
    const ratioMultiplier = 2; // default 1:2
    const targetReward = riskNum * ratioMultiplier;

    return `Here is the calculation for a **1:2 Risk-to-Reward Ratio** with a risk of **₹${riskNum}**:

• **Your Risk**: ₹${riskNum}
• **Target Reward**: ₹${riskNum} × 2 = **₹${targetReward}**

### Practical Trade Example:
Suppose you purchase a stock at **₹1,000**:
1. **Stop-Loss Price**: ₹${1000 - riskNum} (Max loss if hit: ₹1,000 - ₹${1000 - riskNum} = ₹${riskNum})
2. **Target Profit Price**: ₹${1000 + targetReward} (Potential profit if reached: ₹${1000 + targetReward} - ₹1,000 = ₹${targetReward})

### What this means in practice:
With a 1:2 risk-reward ratio, you only need to be right on **33.4% of your trades** to break even. A single winning trade of ₹${targetReward} completely offsets two losing trades of ₹${riskNum} each.`;
  }

  // 5. Follow-up: "Explain this in simpler words" / "Explain simpler"
  if (
    normalized.includes('simpler words') ||
    normalized.includes('explain simpler') ||
    normalized.includes('explain this simpler') ||
    normalized.includes('in simple terms') ||
    normalized === 'simpler please'
  ) {
    const topic = findPrecedingTopic(history);
    if (topic === 'rsi') {
      return `In simple words: Think of RSI like a car's engine temperature gauge.

If a driver revs the engine at full speed for miles without braking (RSI above 70), the car is running hot and needs to cool down. If it drops into extreme cold (RSI below 30), it has been heavily beaten down and could soon stabilize. 

It simply tells you whether prices have moved too far, too fast in one direction!`;
    }
    if (topic === 'support_resistance') {
      return `In simple words: 
• **Support** is like a trampoline on the floor—whenever a falling ball drops onto it, it tends to bounce up.
• **Resistance** is like a low ceiling—whenever you toss the ball upward and it hits the ceiling, it gets pushed back down.`;
    }
    if (topic === 'investing_vs_trading') {
      return `In simple words:
• **Investing** is like planting a mango tree and waiting years to enjoy the fruit as the tree grows.
• **Trading** is like buying mangoes at the wholesale market at 8:00 AM and selling them to shoppers before noon to pocket the quick price difference.`;
    }
    if (topic === 'stop_loss') {
      return `In simple words: A **stop-loss** is like a seatbelt in a car. You never get in a car planning to crash, but if an unexpected collision happens, the seatbelt prevents a minor incident from becoming catastrophic.`;
    }
    return `In simpler words: When learning market concepts, always focus on the core mechanic: who is buying, who is selling, and how you protect your hard-earned capital before looking for profits. What part can I clarify further?`;
  }

  // 6. Follow-up: "Can you explain that with an Indian market example?" / "Indian market example"
  if (
    normalized.includes('indian market example') ||
    normalized.includes('indian example') ||
    normalized.includes('example in india') ||
    normalized.includes('example from indian market')
  ) {
    const topic = findPrecedingTopic(history);
    if (topic === 'rsi') {
      return `Here is an Indian market example:

Suppose **Infosys** rallies aggressively on the **NSE** from ₹1,400 to ₹1,800 in just three weeks. Its 14-day RSI climbs to **78** (above the 70 overbought threshold). 

This doesn't mean the stock must instantly crash, but it signals to Indian traders that buyers are stretched, and entering a fresh position right at the peak carries higher pullback risk.`;
    }
    if (topic === 'support_resistance') {
      return `Here is an Indian market example:

Consider the **Nifty 50** index around the **24,000** psychological milestone. When Nifty pulls back to 24,000, domestic institutional investors (DIIs) and mutual funds step in with fresh buy orders, making **24,000** a strong **support** level. 

Conversely, when Nifty rallies toward **24,500**, heavy profit-booking occurs, establishing **24,500** as a **resistance** ceiling.`;
    }
    if (topic === 'investing_vs_trading') {
      return `Here is an Indian market example:

• **Investing**: Buying shares of **Reliance Industries** or **Tata Consultancy Services (TCS)** in your Zerodha or Groww Demat account to hold for 5–10 years as India's economy expands, collecting dividends along the way.
• **Trading**: Buying shares of **Tata Motors** at 9:30 AM on the NSE at ₹950 after strong monthly sales data, setting a stop-loss at ₹940, and exiting at 2:15 PM at ₹965 to capture the intraday momentum.`;
    }
    if (topic === 'stop_loss') {
      return `Here is an Indian market example:

Suppose you buy 100 shares of **State Bank of India (SBI)** at ₹800 (total outlay: ₹80,000). You set a stop-loss order at **₹780**. If unexpected negative news hits banking stocks and SBI plunges, your broker automatically exits the position at ₹780. Your total loss is strictly capped at ₹2,000 (100 × ₹20), protecting the remaining ₹78,000 of your capital.`;
    }
    return `Here is an Indian market example:
On the **National Stock Exchange (NSE)**, benchmark index **Nifty 50** tracks India's top 50 blue-chip companies (like Reliance, HDFC Bank, TCS, and Infosys). Every trade is regulated by **SEBI** to protect retail learners and investors.`;
  }

  // 7. Stop-Loss & Risk Management
  if (
    normalized.includes('stop loss') ||
    normalized.includes('stop-loss') ||
    normalized === 'what is a stop loss'
  ) {
    return `A **stop-loss order** is a risk-management order placed with your broker to automatically sell a security when its price drops to a specified level, capping your maximum loss on that trade.

• **Purpose**: It protects your trading capital from devastating drawdowns and removes emotional hesitation during market drops.
• **Example**: If you buy a stock at ₹1,000 and place a stop-loss at ₹950, your maximum risk is strictly limited to ₹50 per share (5%). If the market crashes, your broker executes the sale at ₹950, preventing further damage.
• **Golden Rule**: Never enter a trade without knowing your stop-loss and maximum risk in advance.`;
  }

  // 8. Moving Averages / SMA / EMA
  if (
    normalized.includes('moving average') ||
    normalized.includes('sma vs ema') ||
    normalized === 'what are moving averages'
  ) {
    return `A **Moving Average (MA)** smooths out price data by constantly calculating the average price over a specified time window, helping filter out short-term market noise:

• **Simple Moving Average (SMA)**: The standard arithmetic average over the chosen period (e.g., 50-day SMA).
• **Exponential Moving Average (EMA)**: Gives more weight to recent price action, making it react faster to new market moves (e.g., 20-day EMA).
• **Trend Filter**: When price trades above its 200-day SMA, the stock is generally considered in a long-term uptrend; when below, in a downtrend.
• **Golden Cross**: When a shorter moving average (like the 50-day SMA) crosses above a longer moving average (like the 200-day SMA), signaling bullish momentum.
• **Death Cross**: When the 50-day SMA crosses below the 200-day SMA, signaling bearish momentum.`;
  }

  // 9. MACD
  if (normalized.includes('macd') || normalized === 'what is macd') {
    return `The **Moving Average Convergence Divergence (MACD)** is a trend-following momentum indicator that shows the relationship between two exponential moving averages:

• **MACD Line**: Calculated by subtracting the 26-period EMA from the 12-period EMA.
• **Signal Line**: A 9-period EMA of the MACD line itself.
• **Histogram**: Represents the visual distance between the MACD Line and the Signal Line.
• **Bullish Signal**: When the MACD line crosses *above* the Signal line, indicating increasing upward momentum.
• **Bearish Signal**: When the MACD line crosses *below* the Signal line, indicating increasing downward momentum.`;
  }

  // 10. Indian Indices (Nifty 50 & Sensex)
  if (
    normalized.includes('nifty') ||
    normalized.includes('sensex') ||
    normalized.includes('nse and bse')
  ) {
    return `The Indian stock market revolves around two primary exchanges and their benchmark indices:

• **NSE (National Stock Exchange)**: India's largest stock exchange by trading volume. Its benchmark index is the **Nifty 50**, representing the top 50 large-cap, liquid Indian companies across key sectors.
• **BSE (Bombay Stock Exchange)**: Asia's oldest stock exchange (established in 1875). Its benchmark index is the **Sensex** (Sensitivity Index), tracking 30 bellwether companies.
• **Role of Indices**: When you hear "The Indian market is up today", it typically means the Nifty 50 or Sensex has gained points, reflecting the overall health of India's corporate economy.
• **SEBI (Securities and Exchange Board of India)**: The regulatory watchdog ensuring market transparency and investor protection.`;
  }

  // 11. P/E Ratio
  if (
    normalized.includes('p/e ratio') ||
    normalized.includes('pe ratio') ||
    normalized.includes('price to earnings')
  ) {
    return `The **Price-to-Earnings (P/E) Ratio** is a valuation metric that measures a company's current share price relative to its earnings per share (EPS):

• **Formula**: P/E Ratio = Market Price per Share ÷ Earnings per Share (EPS)
• **What it tells you**: How many rupees investors are willing to pay today for ₹1 of the company's annual profit.
• **High P/E**: Can indicate the company is expected to grow rapidly, or that the stock may be overvalued relative to current profits.
• **Low P/E**: Can indicate the stock is undervalued, or that the market expects modest future earnings growth.
• **Best Practice**: Always compare a stock's P/E ratio to its historical average and to other companies in the same industry.`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// 4. GEMINI CLIENT & MODEL CONFIGURATION
// ---------------------------------------------------------------------------

let geminiBillingDisabledUntil = 0;

export function isGeminiBillingDisabled(): boolean {
  return Date.now() < geminiBillingDisabledUntil;
}

export function markGeminiBillingDisabled(ttlMs = 30 * 1000): void {
  geminiBillingDisabledUntil = Date.now() + ttlMs;
}

let geminiClientInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiClientInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return geminiClientInstance;
}

// Use active models: gemini-3.8-flash with fallback to gemini-3.1-flash-lite and gemini-flash-latest
const MODEL_CASCADE = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

// ---------------------------------------------------------------------------
// 5. SYSTEM INSTRUCTION BUILDER
// ---------------------------------------------------------------------------

function buildSystemInstruction(
  mode: 'eli15' | 'deep_dive',
  learnerContext?: LearnerContext,
  groundingText?: string
): string {
  const isBeginner = mode === 'eli15';

  return `You are "Market Mentor", a knowledgeable, patient, and clear financial educator inside the ShareMarket application.

CORE MISSION & PEDAGOGY:
- Sound like an experienced, approachable teacher who explains market concepts clearly and concisely.
- Be encouraging without being overly bubbly or sycophantic.
- Never sound like a generic robotic chatbot or corporate press release.
- Avoid unnecessary introductory phrases ("In this answer, I will discuss...", "That is a great question!").
- Do NOT over-personalize or repeatedly address users by name on every message.

STRICT QUESTION RELEVANCE & INTENT UNDERSTANDING (CRITICAL):
1. Identify the exact intent of the incoming message before generating an answer.
2. Answer the actual question FIRST in the opening sentence.
3. Do NOT randomly change the topic or introduce unrelated concepts just to make the answer longer:
   - If the user asks "What is RSI?", explain only the Relative Strength Index (what it measures, how it works, 0–100 scale, overbought >70 and oversold <30, and how beginners use it). Do NOT start explaining candlestick patterns, IPOs, or moving averages unless asked.
   - If the user asks "What is the difference between investing and trading?", explain only the differences between investing and trading with a clear structured comparison. Do NOT give a general explanation of the stock market.
   - If the user asks "Explain support and resistance", explain support and resistance with a clear, simple price example. Do NOT start discussing moving averages or portfolio diversification.
   - If the user asks for a calculation (e.g. "Can you calculate a 1:2 risk-reward ratio if my risk is ₹100?"), show the math clearly: Risk = ₹100, Target Reward = ₹100 × 2 = ₹200. Explain what this means in practice.
   - If the question has multiple parts, answer every part clearly.
   - If the question is ambiguous, ask a short, polite clarification instead of guessing.
4. Conversation Continuity & Follow-ups:
   - When the user asks a follow-up (e.g. "Explain this in simpler words" or "Can you explain that with an Indian market example?"), look at the previous conversation history, understand what "this" or "that" refers to, and answer ONLY the follow-up doubt without repeating the entire previous definition.
   - Do NOT assume every message is a continuation if the user is clearly asking about a new concept.

RESPONSE LENGTH & EXPLANATION STYLE:
- Simple question → Short, direct, clear answer.
- Beginner question → Intuitive explanation with a relatable everyday or Indian market example (e.g., Tata, Reliance, Infosys, Nifty 50, Sensex).
- Technical question → Clear breakdown with accurate terminology.
- Comparison question → Structured bullet comparison or contrast.
- Calculation question → Show the formula and step-by-step arithmetic.
- Avoid unnecessary headers for 2-sentence answers.
- Avoid generic motivational filler or repetitive closing checklists.

CURRENT EXPLANATION MODE: [${isBeginner ? 'BEGINNER (ELI15)' : 'DEEP DIVE'}]
${
  isBeginner
    ? `- BEGINNER MODE GUIDELINES:
  * Prioritize everyday intuitive analogies.
  * Keep explanations accessible, structured, and jargon-free.
  * If a technical term is introduced, define it immediately in plain words.`
    : `- DEEP DIVE GUIDELINES:
  * Provide quantitative formulas, market mechanics, institutional order flow nuances, and balance sheet implications.
  * Discuss real-world limitations and market frictions (e.g., execution slippage, bid-ask spread).`
}

IMAGE UNDERSTANDING & STRICT RELEVANCE VALIDATION:
When an image is provided:
1. Genuinely inspect the image using your multimodal vision capabilities.
2. Supported categories:
   - Stock-market charts and candlestick charts
   - TradingView screenshots and broker charts (Zerodha, Groww, AngelOne, etc.)
   - NSE/BSE market screenshots and order books
   - Technical indicator screenshots (RSI, MACD, Moving Averages, Bollinger Bands, VWAP)
   - Support and resistance markings and trendlines
   - Trading setups and chart patterns
   - Portfolio screenshots shared for educational discussion
   - Educational diagrams of trading concepts
3. Image Analysis Protocol:
   - Identify what is visible (chart type, asset/ticker if readable, timeframe if visible).
   - Describe visible price action, trends, key levels, or indicator values visible in the image.
   - Answer the user's specific accompanying question based on the image.
   - Explicitly note if any text, number, price, or indicator is blurry, cropped, or unreadable.
   - NEVER invent chart values, indicator readings, prices, or patterns that cannot be verified from the image.
   - Keep all analysis educational: explain possibilities and risk, never guarantee a trade outcome or claim a trade is guaranteed to succeed.
4. STRICT RELEVANCE ENFORCEMENT:
   - The AI Mentor ONLY accepts images relevant to stock-market learning and trading education.
   - If the user uploads an unrelated image (e.g. personal selfie, portrait, food, pets, random landscape, meme unrelated to trading, or unrelated document), you MUST politely reject the image:
     "I can help analyse stock-market and trading-related images, but this image doesn't appear to be related to trading. Please upload a stock chart, TradingView screenshot, technical indicator, or another trading-related image."
   - Do NOT pretend to analyse an unrelated image.
   - If relevance is uncertain, ask the user what the image represents instead of immediately rejecting.

MANDATORY SAFETY & COMPLIANCE RULES:
1. EDUCATIONAL PURPOSES ONLY: Never provide personalized investment advice, stock buy/sell tips, or price targets.
2. ZERO PROFIT GUARANTEES: Never promise returns, guarantee profits, or promote reckless trading or F&O gambles.
3. CAPITAL SURVIVAL ALWAYS FIRST: Always reinforce position sizing and stop-loss discipline.
4. NO INVENTED LIVE DATA: You do not have real-time live market ticker feeds. If asked for today's live stock prices or latest news, state clearly that you provide educational guidance on market mechanics rather than live price ticks.

${groundingText ? `[RELEVANT SHAREMARKET CURRICULUM CONTEXT]:\n${groundingText}` : ''}`;
}

// ---------------------------------------------------------------------------
// 6. MAIN GENERATION ENGINE
// ---------------------------------------------------------------------------

export async function generateMentorResponse(
  request: MentorGenerateRequest
): Promise<MentorGenerateResult> {
  const startTime = Date.now();
  const {
    question,
    userId,
    history = [],
    mode = 'eli15',
    learnerContext,
    attachments = [],
  } = request;

  const trimmedQuestion = (question || '').trim();
  if (!trimmedQuestion) {
    throw new Error('Question is required.');
  }

  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  const userKey = userId || learnerContext?.displayName || 'learner_session';

  // 1. Check for immediate casual intent (does not consume API quota)
  if (!hasAttachments) {
    const casualMatch = checkCasualIntent(trimmedQuestion);
    if (casualMatch.isCasual && casualMatch.response) {
      aiQuotaTracker.recordRequest({
        source: 'learning',
        success: true,
        isQuotaExhausted: false,
        topic: 'Conversational Greeting',
        modelUsed: 'sharemarket-conversational-engine',
        latencyMs: Date.now() - startTime,
        userExcerpt: trimmedQuestion,
      });

      return {
        answer: casualMatch.response,
        modelUsed: 'sharemarket-conversational-engine',
        retrievedLessons: [],
        retrievedGlossary: [],
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // 2. Strict Zero-Cost Circuit Breaker: check if provider daily free-tier quota is already exhausted
  if (aiQuotaTracker.isQuotaExhausted()) {
    const resetEta = aiQuotaTracker.getQuotaResetEta() || 'Tomorrow (UTC reset)';
    aiQuotaTracker.recordRequest({
      source: 'learning',
      success: false,
      isQuotaExhausted: true,
      topic: 'Daily Quota Cooldown',
      modelUsed: getActiveFreeModel(),
      latencyMs: Date.now() - startTime,
      userExcerpt: trimmedQuestion,
    });

    throw new Error(
      `DAILY_QUOTA_EXHAUSTED: ShareMarket operates on an absolute ₹0 API budget using Google's free-tier access. The daily free-tier limit (20 requests/day) has been reached. Please retry in ${resetEta}. Your complete chat history, quiz progress, and paper trading portfolio are safely preserved.`
    );
  }

  // 3. Per-User Fair Usage Check (Requirement 10: protect shared 20 RPD free tier)
  const userRate = aiQuotaTracker.checkUserRateLimit(userKey, false);
  if (!userRate.allowed) {
    aiQuotaTracker.recordRequest({
      source: 'learning',
      success: false,
      isQuotaExhausted: false,
      topic: 'Per-User Fair Limit',
      modelUsed: getActiveFreeModel(),
      latencyMs: Date.now() - startTime,
      userExcerpt: trimmedQuestion,
    });

    throw new Error(
      `USER_LIMIT_REACHED: You have used your daily fair-share allocation (${aiQuotaTracker.perUserDailyLimit} Market Mentor questions/day) on the free tier. This ensures all learners can ask questions without paid fees. Please continue practicing in Paper Trading or review previous lessons, and return tomorrow!`
    );
  }

  // 4. High-precision retrieval: only retrieve chunks if query matches with high confidence
  const { chunks, lessonRefs, glossaryRefs } = retrieveRelevantKnowledge(trimmedQuestion, 2);
  const groundingText = chunks.length > 0 ? chunks.map((c) => c.content).join('\n\n') : '';

  // 5. Build system instructions
  const systemInstruction = buildSystemInstruction(
    mode,
    learnerContext,
    groundingText
  );

  // 6. Compact conversation history (Requirement 9: keep context compact to minimize token load)
  const recentHistory = Array.isArray(history) ? history.slice(-4) : [];
  let formattedHistory = '';
  if (recentHistory.length > 0) {
    formattedHistory =
      '[RECENT CONTEXT]:\n' +
      recentHistory
        .map((m) => `${m.sender === 'user' ? 'Student' : 'Market Mentor'}: ${m.text.slice(0, 180)}`)
        .join('\n');
  }

  const userPromptText = formattedHistory
    ? `${formattedHistory}\n\n[STUDENT'S CURRENT MESSAGE]:\n${trimmedQuestion}`
    : trimmedQuestion;

  const promptParts: any[] = [{ text: userPromptText }];

  // 7. Attachments support (Images, PDFs, Text files)
  if (hasAttachments) {
    for (const att of attachments) {
      if (!att || !att.mimeType || !att.base64) continue;
      const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');

      if (att.mimeType.startsWith('image/') || att.mimeType === 'application/pdf') {
        promptParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: cleanBase64,
          },
        });
      } else if (att.mimeType === 'text/plain') {
        try {
          const decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8');
          promptParts.push({
            text: `\n[Attached Student Document: ${att.name || 'document.txt'}]\n${decoded}`,
          });
        } catch {
          // ignore parsing error
        }
      }
    }
  }

  const ai = getGeminiClient();
  const activeModel = validateZeroCostModel(getActiveFreeModel());

  let successfulAnswer = '';
  let modelUsedForResponse = activeModel;

  if (ai && !isGeminiBillingDisabled()) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: activeModel,
          contents: [{ role: 'user', parts: promptParts }],
          config: { systemInstruction },
        });

        const text = response.text?.trim();
        if (text) {
          successfulAnswer = text;
          break;
        }
      } catch (err: any) {
        const errMsg = String(err?.message || '');

        // If permission denied / billing restricted, remember to avoid slow repeated failures
        if (err?.status === 403 || errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('billing')) {
          markGeminiBillingDisabled(60 * 1000);
          break;
        }

        const isQuotaError =
          err?.status === 429 ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('quota') ||
          errMsg.includes('rate-limits');

        if (isQuotaError) {
          aiQuotaTracker.recordProviderQuotaError(errMsg);
          break;
        }

        const isTransient = err?.status === 503 || errMsg.includes('503');
        if (isTransient && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 750));
          continue;
        }
        break;
      }
    }
  }

  // If Gemini was unreachable or failed to provide a response:
  if (!successfulAnswer) {
    if (hasAttachments) {
      // User uploaded an image and vision service could not be reached:
      // Transparent error notice as mandated (never fake an image analysis)
      successfulAnswer = "I'm having trouble analyzing your uploaded image right now due to a temporary service interruption. Please try again.";
      modelUsedForResponse = 'sharemarket-vision-guard';
    } else {
      // Check for exact educational domain response
      const domainAnswer = resolveEducationalResponse(trimmedQuestion, history, mode);
      if (domainAnswer) {
        successfulAnswer = domainAnswer;
        modelUsedForResponse = 'sharemarket-educational-engine';
      } else {
        // Honest transparent failure message as mandated
        successfulAnswer = "I'm having trouble generating a response right now. Please try again.";
        modelUsedForResponse = 'sharemarket-fallback-service';
      }
    }
  }

  aiQuotaTracker.recordRequest({
    source: 'learning',
    success: true,
    isQuotaExhausted: false,
    hasAttachment: hasAttachments,
    modelUsed: modelUsedForResponse,
    latencyMs: Date.now() - startTime,
    userExcerpt: trimmedQuestion,
  });
  aiQuotaTracker.incrementUserUsage(userKey);

  return {
    answer: successfulAnswer,
    modelUsed: modelUsedForResponse,
    retrievedLessons: lessonRefs,
    retrievedGlossary: glossaryRefs,
    latencyMs: Date.now() - startTime,
  };
}
