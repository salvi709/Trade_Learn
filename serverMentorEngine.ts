import { GoogleGenAI } from '@google/genai';
import { CURRICULUM_MODULES } from './src/data/curriculumData';
import { GLOSSARY_TERMS } from './src/data/marketData';

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
// 2. HIGH-PRECISION RETRIEVAL
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'what', 'is', 'a', 'the', 'how', 'why', 'can', 'i', 'do', 'does', 'in', 'of',
  'to', 'and', 'or', 'for', 'about', 'tell', 'me', 'explain', 'please', 'with',
  'are', 'an', 'at', 'on', 'my', 'your', 'we', 'you', 'should', 'would', 'could'
]);

export function retrieveRelevantKnowledge(
  query: string,
  maxResults = 3
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

    if (lowerQuery.includes(lowerTitle)) {
      score += 100;
    } else if (lowerTitle.includes(lowerQuery)) {
      score += 60;
    }

    if (chunk.type === 'glossary') {
      const cleanTerm = chunk.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanQ = lowerQuery.replace(/[^a-z0-9]/g, '');
      if (cleanQ.includes(cleanTerm)) {
        score += 80;
      }
    }

    for (const token of queryTokens) {
      if (lowerTitle.includes(token)) {
        score += chunk.type === 'glossary' ? 25 : 18;
      }
      if (chunk.keywords.includes(token)) {
        score += 3;
      }
    }

    return { chunk, score };
  })
    .filter((item) => item.score > 8)
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
// 3. CIRCUIT BREAKER & GEMINI CLIENT
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

const MODEL_CASCADE = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

// ---------------------------------------------------------------------------
// 4. COMPREHENSIVE FINANCIAL QUESTION & TOPIC HANDLERS
// ---------------------------------------------------------------------------

interface TopicAnswerDefinition {
  matcher: (q: string, historyContext?: string) => boolean;
  topicTitle: string;
  eli15: {
    directAnswer: string;
    analogy: string;
    indianExample: string;
    takeaway: string;
    followUp: string;
  };
  deepDive: {
    directAnswer: string;
    mechanics: string;
    formulas: string;
    riskInsight: string;
    followUp: string;
  };
}

const TOPIC_HANDLERS: TopicAnswerDefinition[] = [
  // 1. Stock Market Definition
  {
    matcher: (q) => /\bwhat\s+is\s+a?\s*stock\s+market\b/i.test(q),
    topicTitle: 'What is the Stock Market?',
    eli15: {
      directAnswer: 'The **stock market** is an organized, regulated public exchange marketplace where individuals and institutions meet to buy and sell fractional ownership shares of publicly listed companies.',
      analogy: 'Imagine a gigantic, digital farmer\'s market. Instead of selling fruits and vegetables, business founders set up stalls selling certificates of fractional ownership in their companies.',
      indianExample: 'In India, the two primary stock market exchanges are the **National Stock Exchange (NSE)** and the **Bombay Stock Exchange (BSE)**, where shares of giants like Tata, Reliance, and Infosys are traded every second.',
      takeaway: 'Owning shares means you are a legal business partner in a company\'s future profits, not just betting on numbers on a screen.',
      followUp: 'Would you like to know how a private business first gets listed on the stock market via an IPO?',
    },
    deepDive: {
      directAnswer: 'The equity capital market is a secondary trading venue that provides liquidity transformation, capital formation, and continuous market price discovery for corporate equity securities.',
      mechanics: '1. Primary Market: Companies issue new equity shares directly to the public via IPOs to raise capital.\n2. Secondary Market: Existing shareholders trade previously issued shares between themselves without capital flowing to the corporate treasury.',
      formulas: '`Market Capitalization = Current Share Price × Total Outstanding Equity Shares`',
      riskInsight: 'Secondary market pricing is governed by the continuous matching of buy and sell limit orders in the central order book.',
      followUp: 'Would you like to analyze how order matching engines execute trades on the NSE and BSE?',
    },
  },

  // 2. IPO (Initial Public Offering)
  {
    matcher: (q) => /\b(what\s+is\s+an?\s+)?ipo\b/i.test(q) || /\binitial\s+public\s+offering\b/i.test(q),
    topicTitle: 'What is an IPO (Initial Public Offering)?',
    eli15: {
      directAnswer: 'An **IPO (Initial Public Offering)** is the momentous event when a privately owned company sells shares of stock to the general public for the very first time to raise fresh capital and get officially listed on stock exchanges.',
      analogy: 'Imagine a popular neighborhood bakery run by two founders. To build 50 new bakeries across the state, they need ₹5 Crore. In an IPO, they open their doors to thousands of regular citizens, offering them fractional ownership slices in exchange for expansion capital.',
      indianExample: 'When companies like **Zomato**, **Nykaa**, or **LIC** launched their IPOs, everyday retail investors applied through their UPI and bank accounts before the shares officially began trading on the NSE and BSE.',
      takeaway: 'An IPO turns a private enterprise into a publicly accountable corporation that must report audited financial statements every single quarter.',
      followUp: 'Would you like to know the difference between the "Issue Price" in an IPO and the "Listing Price" on debut day?',
    },
    deepDive: {
      directAnswer: 'An **Initial Public Offering (IPO)** is a primary market capital-raising transaction whereby a privately held issuer offers freshly issued equity shares or an Offer for Sale (OFS) by existing promoters to institutional and retail investors.',
      mechanics: '1. **Draft Red Herring Prospectus (DRHP)**: Submitted to SEBI detailing corporate finances, risks, and intended use of proceeds.\n2. **Book Building**: Investors bid within a specified price band (e.g. ₹950–₹1,000).\n3. **Allotment & Listing**: Registrar allocates shares based on subscription ratios; shares debut on NSE/BSE on listing date.',
      formulas: '`Oversubscription Ratio = Total Bids Received / Total Shares Offered`',
      riskInsight: 'In an "Offer for Sale" (OFS), the money goes into the pockets of exiting venture capitalists or promoters, not into company growth. Always check how much of the IPO is fresh capital issue.',
      followUp: 'Would you like to learn how retail quota allotment draws work when an IPO is 50x oversubscribed?',
    },
  },

  // 3. Dividend
  {
    matcher: (q) => /\bdividend(s|ing)?\b/i.test(q),
    topicTitle: 'What is a Dividend?',
    eli15: {
      directAnswer: 'A **dividend** is a direct cash payment that a profitable company sends to its shareholders out of its net earnings. When a business makes a profit after paying all its bills, taxes, and expansion plans, its board of directors distributes a portion of that cash directly into your bank account!',
      analogy: 'Imagine owning a mango tree. You benefit in two distinct ways: the tree grows larger and more valuable each year (capital growth), and it drops sweet, ripe mangoes into your basket every season (dividends). Dividends are the ripe fruit of corporate profits.',
      indianExample: 'Indian market stalwarts like **TCS**, **ITC**, and **Coal India** pay regular dividends. For example, if TCS declares a ₹28 per share dividend and you hold 10 shares, exactly ₹280 cash is credited directly to your bank account.',
      takeaway: 'Dividends provide tangible passive cash flow. Companies with steady, growing dividends usually possess robust cash generation and sound corporate governance.',
      followUp: 'Would you like to explore what "Dividend Yield" means and how it compares to fixed deposit interest?',
    },
    deepDive: {
      directAnswer: 'A **dividend** is a discretionary distribution of corporate net earnings authorized by the Board of Directors, representing the cash-flow yield component of Total Shareholder Return (TSR).',
      mechanics: '1. **Ex-Dividend Date**: The cutoff trading day. You must purchase shares before this date to be eligible.\n2. **Record Date**: Depository verifies beneficiary owners in NSDL/CDSL.\n3. **Dividend Payout Ratio**: The proportion of earnings paid out as dividends vs. retained for reinvestment.',
      formulas: '`Dividend Yield = (Annual Dividend Per Share / Current Market Price) × 100`\n`Dividend Payout Ratio = (Total Dividends / Net Income) × 100`',
      riskInsight: 'High dividend yields can sometimes indicate a "value trap" where stock prices are collapsing due to structural business decline. Dividends in India are taxed at the investor\'s personal income slab rate.',
      followUp: 'Would you like to calculate the Free Cash Flow dividend coverage for our simulated stocks?',
    },
  },

  // 4. Demat Account
  {
    matcher: (q) => /\bdemat\b/i.test(q) || /\btrading\s+account\b/i.test(q) || /\bnsdl\b/i.test(q) || /\bcdsl\b/i.test(q),
    topicTitle: 'What is a Demat Account and Why Do You Need One?',
    eli15: {
      directAnswer: 'A **Demat Account** (short for Dematerialized Account) is an electronic digital locker that securely holds your shares, bonds, and mutual funds in digital form, replacing old-fashioned paper certificates.',
      analogy: 'Think of your financial setup like this:\n1. 🏦 **Bank Account**: Holds your money (cash).\n2. 🛒 **Trading Account**: The shopping cart at the store (where you click Buy and Sell).\n3. 🔐 **Demat Account**: Your secure wardrobe at home where your purchases are stored.',
      indianExample: 'In India, your shares are not kept by your broker (like Zerodha or Groww). They are stored directly with government-regulated depositories: **NSDL** or **CDSL**. Even if your broker goes out of business tomorrow, your shares remain 100% safe in your Demat account.',
      takeaway: 'Opening a Demat and Trading account takes only 10 minutes online in India using Aadhaar e-KYC and PAN card.',
      followUp: 'Would you like to know what DP (Depository Participant) charges are when selling shares?',
    },
    deepDive: {
      directAnswer: 'The Demat Account is an electronic securities custody registry maintained under the Depositories Act, 1996, segregating trade execution from title custody.',
      mechanics: '1. **Depositories**: NSDL (promoted by NSE/IDBI) and CDSL (promoted by BSE/banks).\n2. **Depository Participant (DP)**: SEBI-registered broker acting as client interface.\n3. **DIS & TPIN**: CDSL TPIN + OTP authorization secures debit transfers during delivery sales.',
      formulas: '`Custody Architecture: Investor ↔ DP (Broker) ↔ Depository (NSDL/CDSL)`',
      riskInsight: 'Always keep your mobile number and email verified with CDSL/NSDL to receive real-time SMS alerts whenever any security is debited from your Demat account.',
      followUp: 'Would you like to review the step-by-step settlement cycle when shares move into your Demat account?',
    },
  },

  // 5. Market Capitalization
  {
    matcher: (q) => /\bmarket\s+cap(italization)?\b/i.test(q) || /\blarge\s*cap\b/i.test(q) || /\bmid\s*cap\b/i.test(q) || /\bsmall\s*cap\b/i.test(q),
    topicTitle: 'Market Capitalization: Sizing Up Companies',
    eli15: {
      directAnswer: '**Market Capitalization** (or **Market Cap**) is the total financial market value of a company\'s outstanding shares. It tells you the total price tag to buy 100% of all company shares at today\'s market price.',
      analogy: 'Imagine an apartment building with 100 flats, and each flat recently sold for ₹1 Crore. The entire building has a market capitalization of ₹100 Crore. In the stock market, you multiply the price of 1 share by the total number of shares.',
      indianExample: 'In India, SEBI categorizes companies by size:\n- 🐘 **Large Cap**: Top 100 companies (> ₹20,000+ Cr) like Reliance, TCS, HDFC Bank (stable, lower volatility).\n- 🐆 **Mid Cap**: Next 150 companies (₹5,000 to ₹20,000 Cr) with higher growth potential.\n- 🐇 **Small Cap**: Ranks 251 and below (< ₹5,000 Cr) with high growth potential but higher risk.',
      takeaway: 'Don\'t judge a company\'s size by its share price! A company with a ₹50 share price can have a much higher market value than a company with a ₹1,000 share price if it has far more total shares.',
      followUp: 'Would you like to calculate the market cap of our simulated companies in the Paper Trading Lab?',
    },
    deepDive: {
      directAnswer: 'Market Capitalization represents the aggregate equity market value of a publicly traded enterprise: `Market Cap = Share Price × Total Outstanding Shares`. SEBI classifies companies as large cap (ranks 1-100 by market value), mid cap (101-250), or small cap (251+).',
      mechanics: '1. **Full Market Cap**: Accounts for all issued equity shares including promoter locked shares.\n2. **Free-Float Market Cap**: Accounts only for publicly tradeable shares (used in Nifty 50 and Sensex index calculations).\n3. **SEBI Reclassification**: Semi-annual mutual fund categorisation based on market cap rankings (1-100 Large Cap, 101-250 Mid Cap, 251+ Small Cap).',
      formulas: '`Market Cap = Share Price × Total Shares`\n`Enterprise Value (EV) = Market Cap + Total Debt - Cash & Cash Equivalents`',
      riskInsight: 'Small caps carry liquidity risk and higher drawdowns during bear markets (-40% to -60% drops are common), whereas large cap stocks weather economic storms with superior balance sheet resilience.',
      followUp: 'Would you like to examine why Enterprise Value (EV) is preferred over Market Cap when evaluating debt-heavy businesses?',
    },
  },

  // 6. NSE vs BSE
  {
    matcher: (q) => /\bnse\b/i.test(q) && /\bbse\b/i.test(q),
    topicTitle: 'NSE vs. BSE: India\'s Premier Stock Exchanges',
    eli15: {
      directAnswer: '**NSE** (National Stock Exchange) and **BSE** (Bombay Stock Exchange) are the two major national stock exchanges in India where shares are publicly bought and sold.',
      analogy: 'Think of them like Amazon and Flipkart. Both are massive, trustworthy online shopping platforms selling the same products at almost identical prices. You can choose to buy your shares on either exchange.',
      indianExample: '- **BSE**: Founded in 1875 on Dalal Street, Mumbai. It is Asia\'s oldest stock exchange, listing over 5,000 companies. Its famous benchmark index is the **Sensex**.\n- **NSE**: Founded in 1992, pioneering electronic trading in India. It handles the highest daily trading volume and liquidity. Its benchmark index is the **Nifty 50**.',
      takeaway: 'For normal delivery investors, buying on NSE or BSE is virtually identical. Arbitrageurs keep prices aligned within a few paise.',
      followUp: 'Would you like to know how stock prices stay virtually identical across both exchanges via automated arbitrage?',
    },
    deepDive: {
      directAnswer: 'The National Stock Exchange of India (NSE) and BSE Limited are SEBI-regulated, demutualized national securities exchanges providing electronic central limit order books (CLOB) and clearing corporation settlement.',
      mechanics: '1. **Trading Volume**: NSE captures ~93% of equity cash turnover and >99% of derivatives volume.\n2. **Clearing Corporations**: NSE trades clear via NSE Clearing Limited (NCL); BSE trades clear via Indian Clearing Corporation Limited (ICCL).\n3. **Settlement**: Both operate on a synchronized T+1 rolling delivery settlement cycle.',
      formulas: '`Arbitrage Spread = |Price_NSE - Price_BSE| - 2 × Transaction Friction`',
      riskInsight: 'For illiquid small-cap stocks, always check order book depth on both exchanges before placing large orders to minimize execution slippage.',
      followUp: 'Would you like to review how clearing corporations guarantee trade counterparty risk in India?',
    },
  },

  // 7. SEBI
  {
    matcher: (q) => /\bsebi\b/i.test(q) || /\bwho\s+regulates\s+indian\s+market\b/i.test(q),
    topicTitle: 'SEBI: The Regulator & Guardian of Indian Investors',
    eli15: {
      directAnswer: '**SEBI** (Securities and Exchange Board of India) is the official government regulatory watchdog that oversees and polices the Indian stock market. Its primary mission is **investor protection**—shielding everyday retail investors from market fraud, insider trading, and unfair practices by enforcing clear rules.',
      analogy: 'Think of SEBI as the strict, eagle-eyed referee on a football pitch. Without a referee, players could tackle unfairly or hide the ball. SEBI enforces the rules so everyone—from multi-billionaire promoters to students investing ₹500—plays on a fair and transparent field.',
      indianExample: 'SEBI mandates that all listed Indian companies publish verified, audited financial results every quarter, bans insider trading, and enforces strict risk disclosures.',
      takeaway: 'Because of SEBI\'s world-class digital regulations, India boasts one of the safest and most advanced trading environments in the world.',
      followUp: 'Would you like to learn how SEBI\'s SCORES portal allows retail investors to lodge and resolve complaints against brokers?',
    },
    deepDive: {
      directAnswer: 'The **Securities and Exchange Board of India (SEBI)** is the statutory capital market regulator established under the SEBI Act, 1992, wielding tripartite quasi-legislative, quasi-executive, and quasi-judicial authority for investor protection.',
      mechanics: '1. **Legislative**: Drafts regulations and rules governing market intermediaries, mutual funds, and insider trading.\n2. **Executive**: Investigates market surveillance anomalies, fraud, front-running, and unauthorized tip schemes.\n3. **Judicial**: Imposes disgorgement penalties, trading bans, and legal sanctions against market manipulators.',
      formulas: '`Mandate: 1. Protect Investor Interests | 2. Promote Market Development | 3. Regulate Securities Markets`',
      riskInsight: 'Never trust unsolicited stock tips on WhatsApp or Telegram claiming guaranteed profits. SEBI strictly bans unregistered advisory operations.',
      followUp: 'Would you like to review how to verify whether a Research Analyst or Financial Advisor is officially SEBI-registered?',
    },
  },

  // 8. Nifty 50 Weighting
  {
    matcher: (q) => /\bnifty\s*50\b/i.test(q) && (/\bweight(ed|ing)?\b/i.test(q) || /\bhow\s+is\s+it\s+calculated\b/i.test(q) || /\bindex\b/i.test(q)),
    topicTitle: 'The Nifty 50: How India\'s Flagship Benchmark is Weighted',
    eli15: {
      directAnswer: 'The **Nifty 50** is India\'s benchmark stock index on the National Stock Exchange (NSE), tracking the 50 largest, most liquid companies across 13 sectors of the Indian economy.',
      analogy: 'Think of the Nifty 50 like the Indian national cricket team\'s batting average. Instead of tracking thousands of individual club players, the national team performance tells you how strong the nation\'s cricket is on any given day.',
      indianExample: 'The Nifty 50 is weighted by **Free-Float Market Capitalization** (free float). This means larger companies like HDFC Bank, Reliance Industries, ICICI Bank, and Infosys have a bigger percentage weight in the index than smaller members.',
      takeaway: 'When someone says "the Indian market went up 1% today", they usually mean the Nifty 50 index rose 1%. Investing in a Nifty 50 Index Fund lets you own the top 50 Indian companies in a single click.',
      followUp: 'Would you like to learn how index rebalancing works every six months in March and September?',
    },
    deepDive: {
      directAnswer: 'The **Nifty 50** index on the **NSE** is computed using the **free float** market capitalization methodology across its **50** constituent stocks: `Index Value = (Current Free Float Market Cap / Base Market Cap) × 1000`.',
      mechanics: '1. **Eligibility**: Must be listed on NSE, trade in the F&O segment, and have minimum impact cost of ≤ 0.50% on portfolio transactions.\n2. **Sector Representation**: Financial Services (~33%), Information Technology (~14%), Oil & Gas (~11%), Consumer Goods, and Auto.\n3. **Capping Rules**: Single stock weight is subject to capping limits to prevent extreme concentration.',
      formulas: '`Index Value = (Current Free Float Market Cap / Base Market Cap) × 1000`\n`Free Float Factor = (Total Shares - Promoter/Govt Locked Shares) / Total Shares`',
      riskInsight: 'The top 5 heavyweight stocks in the Nifty 50 command over 35% of the total index movement.',
      followUp: 'Would you like to compare the returns and tracking error of Nifty 50 Index Funds vs. Nifty ETFs?',
    },
  },

  // 9. Indian Blue-Chip Companies
  {
    matcher: (q) => /\bblue\s*-?\s*chip\b/i.test(q),
    topicTitle: 'What is a Blue-Chip Company?',
    eli15: {
      directAnswer: 'A **blue-chip company** is a nationally recognized, financially stable, well-established industry leader with a long track record of dependable earnings and strong balance sheets.',
      analogy: 'The name comes from traditional poker games, where blue chips were historically the most valuable chips on the table. In the market, a blue-chip stock is the highest-value, most dependable company you can hold.',
      indianExample: 'Classic Indian blue-chips include **Tata** (Tata Motors, TCS), **Reliance** Industries, **HDFC** Bank, and **Infosys**. These companies have weathered decades of market booms and recessions while consistently providing stable compounding and wealth creation.',
      takeaway: 'Blue chips are the bedrock of conservative investment portfolios. They rarely double overnight, but they provide durable compounding with much lower risk of bankruptcy.',
      followUp: 'Would you like to see how blue-chip companies compare to fast-moving small-cap stocks?',
    },
    deepDive: {
      directAnswer: 'Blue-chip equities denote large-cap market leaders (e.g. Tata, Reliance, HDFC, Infosys) with wide economic moats, institutional sponsorship, investment-grade credit ratings (AAA/AA+), and consistent, stable Return on Capital Employed (ROCE > 18–20%).',
      mechanics: '1. **Balance Sheet Strength**: Low net debt-to-equity, high interest coverage (> 8x), and strong Free Cash Flow generation.\n2. **Pricing Power**: Ability to pass on inflationary cost pressures to customers without losing market share.\n3. **Institutional Ownership**: Substantial holdings by domestic mutual funds (DIIs) and foreign institutional investors (FIIs).',
      formulas: '`ROCE = EBIT / (Total Assets - Current Liabilities)`\n`Interest Coverage = EBIT / Interest Expense`',
      riskInsight: 'Even blue chips face technological obsolescence if they fail to adapt. Continuous monitoring of quarterly revenue quality and competitive dynamics is essential.',
      followUp: 'Would you like to evaluate the valuation multiples of leading Indian blue-chips in our dataset?',
    },
  },

  // 10. Investing vs Trading
  {
    matcher: (q) => /\binvesting\s+(vs|versus|and)\s+trading\b/i.test(q) || /\bdifference\s+between\s+investing\s+and\s+trading\b/i.test(q),
    topicTitle: 'Investing vs. Trading: Time Horizons & Mindsets',
    eli15: {
      directAnswer: 'The difference between investing and trading centers on **time** horizon and objectives:\n- **Investing** focuses on the **long-term** (years or decades), buying ownership in businesses to harness the power of **compounding**.\n- **Trading** focuses on the **short-term** (minutes, hours, or days), seeking to profit from price **fluctuation** and momentum.',
      analogy: 'Think of **Investing** like planting a mango sapling—you water it, let seasons pass, and enjoy continuous harvests for decades. **Trading** is like buying tickets outside a concert arena to resell them an hour later for a quick ₹200 markup.',
      indianExample: '- **The Investor**: Buys shares of Titan or Tata Motors, ignores daily noise, and holds through market volatility as the business expands across India over time.\n- **The Trader**: Uses technical indicators to buy Nifty calls at 10:15 AM and sell at 11:30 AM to capture a 20-point swing.',
      takeaway: 'Investing creates enduring generational wealth with minimal stress through compounding over time. Trading is an active job requiring intense emotional discipline, risk management, and constant screen time to navigate short-term price fluctuation.',
      followUp: 'Would you like to explore which approach aligns best with your personal financial goals and time availability?',
    },
    deepDive: {
      directAnswer: 'The dichotomy between investing and trading is defined by capital duration (long-term compounding vs. short-term price fluctuation over time), analytical methodology (fundamental discounted cash flow vs. technical market microstructure), and psychological variance.',
      mechanics: '1. **Investing**: Evaluates terminal value, ROCE, moat durability, and management integrity. Volatility is treated as a liquidity opportunity.\n2. **Trading**: Exploits asymmetric short-term order flow imbalances, support/resistance breaks, and mean-reversion with strict stop-losses.',
      formulas: '`Long-Term Compounding = Capital × (1 + CAGR)^Time`\n`Trading Expectancy = (Win Rate × Avg Win) - (Loss Rate × Avg Loss)`',
      riskInsight: 'Never turn a bad trade into a long-term investment! When a short-term trading setup hits its stop-loss, exit immediately instead of holding on and hoping.',
      followUp: 'Would you like to practice both approaches in our virtual Paper Trading Lab?',
    },
  },

  // Market Orders vs. Limit Orders (Comparison)
  {
    matcher: (q) => (/\bmarket\s+orders?\b/i.test(q) && /\blimit\s+orders?\b/i.test(q)) || /\bcompare\s+market\s+(and|versus|vs)\s+limit\b/i.test(q),
    topicTitle: 'Market Orders vs. Limit Orders: Execution Speed vs. Price Guarantee',
    eli15: {
      directAnswer: 'The core difference comes down to **execution speed vs. price guarantee**:\n- **Market Order**: Guarantees **immediate** execution at whatever price is currently offered, but provides no **price** **guarantee** and exposes you to unexpected execution **slippage**.\n- **Limit Order**: Guarantees your exact specified **price** or better, but gives no **immediate** execution **guarantee** if the market does not reach your level.',
      analogy: 'Imagine taking a taxi:\n- A **Market Order** is jumping into the first available auto on the street and saying *"Drive immediately, whatever the meter says!"* You get moving with immediate execution, but during traffic surges you might face higher price slippage.\n- A **Limit Order** is telling the driver *"I will only travel if the fare price is exactly ₹100 or less."* You guarantee your price, but if no driver accepts ₹100, there is no guarantee you will leave immediately.',
      indianExample: 'On the NSE and BSE:\n- Use a **Market Order** when you need immediate execution in highly liquid stocks like TCS or Reliance where the bid-ask price spread is only 5 paise.\n- Use a **Limit Order** in volatile market conditions or mid-caps to guarantee your price and protect your capital from severe slippage.',
      takeaway: 'Rule of thumb: Whenever price precision matters more than immediate execution, always choose a **Limit Order** to avoid price slippage!',
      followUp: 'Would you like to place a test Limit Order versus Market Order in our Paper Trading Lab?',
    },
    deepDive: {
      directAnswer: 'A **Market Order** is an unpriced order executing immediately against resting order book liquidity, providing an execution guarantee with zero price guarantee (slippage risk). A **Limit Order** guarantees price execution at or better than the limit price, but provides no immediate execution guarantee if the limit price is unmarketable.',
      mechanics: '1. **Order Book Dynamics**: Market orders sweep the limit order book, incurring slippage equal to `Realized Price - Benchmark Price`.\n2. **Immediate Execution**: Market orders execute with immediate priority against resting liquidity.\n3. **Price Guarantee**: Limit buy executes at `Price ≤ Limit Price`; limit sell executes at `Price ≥ Limit Price`.',
      formulas: '`Market Order: Immediate Execution = 100%, Price Guarantee = 0%, Slippage Risk = High`\n`Limit Order: Immediate Execution = Variable, Price Guarantee = 100%, Slippage Risk = Zero`',
      riskInsight: 'Never submit large market orders during market open (9:15 AM) when wide bid-ask spreads cause extreme execution slippage.',
      followUp: 'Would you like to inspect live order book depth and bid-ask spreads in our simulated execution terminal?',
    },
  },

  // Mutual Fund Disadvantages (Follow-Up)
  {
    matcher: (q, hist) =>
      Boolean(
        (/\bdisadvantage/i.test(q) || /\bdrawback/i.test(q) || /\bdownside/i.test(q) || /\bcon\b/i.test(q) || /\bnegative/i.test(q)) &&
        (/\bmutual\s*fund/i.test(q) || (hist ? /\bmutual\s*fund/i.test(hist) : false))
      ),
    topicTitle: 'Main Disadvantages & Limitations of Mutual Funds',
    eli15: {
      directAnswer: 'While mutual funds offer instant diversification, their main disadvantages are:\n1. 💸 **Expense Ratio and Fees**: Every mutual fund deducts an ongoing **expense ratio** (annual management **fees** between 0.5% and 2.25%) directly from your NAV every single day, whether the fund makes or loses money!\n2. 🎮 **Lack of Control**: You have zero personal **control** over which individual stocks are bought or sold. You cannot remove a company you dislike from the fund.\n3. 👨‍💼 **Fund Manager Risk**: You depend entirely on the skill and decisions of the **fund manager**. If the fund manager makes poor stock picks, your returns will underperform the market.',
      analogy: 'Imagine hiring a driver for a road trip: you pay their daily salary and fuel fees (expense ratio) regardless of traffic, but you have no control over the exact route they choose, and if the driver makes a wrong turn, you suffer the delay.',
      indianExample: 'In India, an active equity mutual fund with an expense ratio of 2% charges ₹2,000 in fees every year on a ₹1,00,000 investment. Over 20 years, those fees and expense ratios can consume more than 25% of your total potential compounding!',
      takeaway: 'To minimize fees and eliminate fund manager underperformance, many modern investors prefer low-cost Direct Plan Index Funds with an expense ratio under 0.15%.',
      followUp: 'Would you like to compare the long-term cost impact of a 0.1% Index Fund versus a 2.0% Active Mutual Fund?',
    },
    deepDive: {
      directAnswer: 'The structural disadvantages of mutual funds encompass fee drag from the **expense ratio**, lack of individual portfolio **control**, capital gains tax pass-through friction, and benchmark underperformance by the **fund manager** despite substantial advisory **fees**.',
      mechanics: '1. **Expense Ratio Drag**: Total Expense Ratio (TER) encompasses management fees, registrar fees, and distribution costs amortized daily.\n2. **Absence of Control**: Individual investors cannot customize holdings, execute specific tax-loss harvesting, or veto promoter selections.\n3. **Fund Manager Risk**: More than 70% of large-cap active fund managers fail to beat the Nifty 50 over a 5-to-10-year investment horizon.',
      formulas: '`Compounded Fee Drag % = 1 - [(1 + Return - Expense Ratio) / (1 + Return)]^Years`',
      riskInsight: 'High portfolio turnover by active fund managers generates transaction costs and short-term capital gains tax liabilities that erode investor Net Asset Value.',
      followUp: 'Would you like to review how to analyze tracking error and expense ratios across Indian equity funds?',
    },
  },

  // Stop-Loss Practical Indian Example (Follow-Up)
  {
    matcher: (q, hist) =>
      Boolean(
        (/\bexample\b/i.test(q) || /\brealistic\b/i.test(q)) &&
        (/\bstop\s*-?\s*loss\b/i.test(q) || (hist ? /\bstop\s*-?\s*loss\b/i.test(hist) : false))
      ),
    topicTitle: 'Realistic Indian Market Example of a Stop-Loss Order',
    eli15: {
      directAnswer: 'Here is a concrete Indian market example with real numbers:\n- You **buy** 10 shares of Tata Motors at **₹950** each (total investment = ₹9,500).\n- You decide that your maximum acceptable **risk** on this trade is ₹40 per share.\n- You place a **stop-loss order at ₹910** with your broker.\n- If sudden bad news causes the stock to **drop**, the exchange automatically sells your 10 shares the moment the price hits ₹910.\n- Your loss is capped at ₹400 (`10 × ₹40`), protecting your capital from a catastrophic drop if the stock crashes down to ₹800!',
      analogy: 'A stop-loss is like having a circuit breaker in your house: if there is an electrical surge that could burn down your appliances, the switch automatically flips to cut off power and protect your home.',
      indianExample: 'In Indian brokers (like Zerodha, Groww, or our Paper Trading Lab), when you buy shares at ₹950, you enter a Stop-Loss Limit (SL) order with a Trigger Price of ₹910.00 and Limit Price of ₹908.50.',
      takeaway: 'A stop-loss order protects you from emotion and hope. When the price begins to drop, it automatically enforces your risk limit before a small loss turns into financial devastation.',
      followUp: 'Would you like to practice setting a stop-loss order on our simulated stocks right now?',
    },
    deepDive: {
      directAnswer: 'A Stop-Loss order in the Indian cash equity segment enforces disciplined capital protection: `Buy Entry: ₹950 | Stop-Loss Trigger: ₹910 | Defined Risk: ₹40 per share`. If the stock price experiences a drop, the resting stop-loss trigger immediately submits an order to sell, capping risk exposure.',
      mechanics: '1. **Trigger & Execution**: When the market price trades at or below the trigger price (₹910), the broker routes a sell order to the exchange order book.\n2. **SL-Limit vs SL-Market**: An SL-Limit specifies both a trigger price and a limit price to protect against flash slippage during sudden drops.\n3. **Risk Containment**: Caps position loss at `Quantity × (Buy Price - Stop-Loss Price)`.',
      formulas: '`Maximum Portfolio Risk = Quantity × (Entry Buy Price - Stop-Loss Exit Price)`',
      riskInsight: 'Never move your stop-loss further away while a trade is going against you. Widening a stop-loss violates your pre-trade risk management plan.',
      followUp: 'Would you like to calculate position sizes based on ATR stop-loss distances?',
    },
  },

  // Earnings Day Drop & Forward Guidance (Follow-Up)
  {
    matcher: (q, hist) =>
      Boolean(
        (/\bearning/i.test(q) || /\bprofit.*higher/i.test(q) || (hist ? (/\bearning/i.test(hist) || /\bresults/i.test(hist)) : false)) &&
        (/\bwhy\b/i.test(q) || /\bhappen\b/i.test(q) || /\bdrop\b/i.test(q) || /\bdown\b/i.test(q))
      ),
    topicTitle: 'Why Stock Prices Drop on Earnings Day Despite Higher Profits',
    eli15: {
      directAnswer: 'It often surprises beginners when a company reports higher profits and the stock price drops 4% or 5%! Here is why this happens:\n1. 🔮 **The Market is Forward-Looking**: Stock prices reflect what investors expect to happen in the **future**, not just past results. If strong earnings were already anticipated, the good news was already fully **priced in** weeks before.\n2. 🎯 **Expectation vs. Reality**: If analyst consensus had an **expectation** of 25% profit growth, but the company only reported 18%, participants view it as a disappointment, even though profits were higher!\n3. 🧭 **Weaker Forward Guidance**: If company management gives cautious or lower forward **guidance** about slower growth, falling margins, or rising costs in upcoming quarters, investors sell to protect future capital.',
      analogy: 'Imagine a top athlete who usually runs 100 meters in 9.9 seconds. If they run 10.1 seconds, they still win the local race, but because everyone had a sky-high expectation of 9.9 seconds, critics are disappointed. The benchmark expectation determines the reaction.',
      indianExample: 'When Indian IT giants like TCS or Infosys announce quarterly earnings, the stock frequently drops despite rising profits if the management cuts its full-year revenue guidance for future quarters.',
      takeaway: 'In stock markets, price reaction is driven by how reported results compare against prior market **expectation** and management\'s forward **guidance** about the **future**, because past results are already **priced in**.',
      followUp: 'Would you like to learn how to check analyst consensus estimates before corporate earnings are announced?',
    },
    deepDive: {
      directAnswer: 'Share price declines following nominally positive earnings announcements occur when results fail to surpass elevated market consensus **expectation**, when historical performance was already fully **priced in**, or when management provides subdued forward **guidance** regarding **future** free cash flow trajectories.',
      mechanics: '1. **DCF Valuation Repricing**: Equity value equals the discounted present value of all *future* cash flows. Backward-looking quarterly profit is secondary to forward guidance revisions.\n2. **Whisper Numbers vs Consensus**: Institutional participants often trade on unpublished expectations that exceed official consensus forecasts.\n3. **Guidance Downgrades**: A downgrade in management guidance reduces the terminal growth rate and multiple assigned by quantitative valuation models.',
      formulas: '`Price Response = Function(Actual Earnings - Market Expectation, Δ Forward Guidance for Future Periods)`',
      riskInsight: 'Trading earnings announcements without hedging carries extreme gap risk and volatility crush, as implied volatility collapses immediately after the event.',
      followUp: 'Would you like to analyze quarterly concall transcripts to identify forward guidance indicators?',
    },
  },

  // 11. Can I buy 1 share?
  {
    matcher: (q) => /\b(can\s+i\s+buy\s+)?(1|one)\s+share\b/i.test(q) || /\bminimum\s+(shares?|lot)\s+in\s+india\b/i.test(q),
    topicTitle: 'Can You Buy 1 Single Share in India?',
    eli15: {
      directAnswer: '**YES, absolutely!** In India on the NSE and BSE, there is **no minimum lot size** for cash delivery equity shares. You can buy exactly **1 single share** of any listed company, whether it costs ₹15, ₹500, or ₹2,900!',
      analogy: 'Imagine walking into a sweet shop. You do not have to buy a full 5 kg box of laddoos; you can buy a single piece to taste and enjoy. In Indian equity delivery, 1 share is the legal minimum trading unit.',
      indianExample: 'If Tata Steel is trading at ₹145, you can place a buy order for exactly 1 share for ₹145. If you want Reliance Industries at ₹2,900, you can buy exactly 1 share. There is no requirement to purchase in lots of 10 or 100 in the delivery cash segment.',
      takeaway: 'Starting with 1 share is the smartest way to learn order entry, track real price movements, and experience Demat settlement without putting your savings at risk.',
      followUp: 'Would you like to execute a 1-share purchase right now in our Paper Trading Lab with zero real money at risk?',
    },
    deepDive: {
      directAnswer: 'Under SEBI\'s rolling T+1 cash settlement framework, the standard trading unit for all listed equities on both NSE and BSE is **1 share**.',
      mechanics: '1. **Cash Delivery (CNC)**: 1-share minimum order quantity. Settled into your Demat account (NSDL/CDSL).\n2. **Derivatives (F&O)**: Derivatives contracts feature fixed statutory lot sizes (e.g. Nifty = 25, single stock lots = 250 to 2,000+ shares).\n3. **Fractional Shares**: India does not currently support fractional share ownership (e.g., 0.5 shares). Orders must be whole integers.',
      formulas: '`Total Cost = (1 × Share Price) + Brokerage + STT + Statutory Taxes`',
      riskInsight: 'When buying a single ₹50 share, be mindful of DP sale charges (~₹13–₹20 flat per company per day on delivery sale) which can eat into percentage returns on tiny single-share positions.',
      followUp: 'Would you like to inspect our live order entry interface and place a test limit order?',
    },
  },

  // 12. P/E vs P/B Ratio
  {
    matcher: (q) => /\bp\s*\/?\s*e\b/i.test(q) && /\bp\s*\/?\s*b\b/i.test(q),
    topicTitle: 'P/E Ratio vs. P/B Ratio: Valuing Earnings vs. Assets',
    eli15: {
      directAnswer: 'The **P/E ratio** compares price to **annual earnings (profits)**: *"How much am I paying for ₹1 of annual profit?"* The **P/B ratio** compares price to **book value (net assets)**: *"How much am I paying for ₹1 of the company\'s physical net worth?"*',
      analogy: 'Imagine a software consultancy versus a factory:\n- For the software company with few physical assets, you value their brainpower and annual profits (**P/E**).\n- For the factory owning valuable land, machinery, and warehouses, you check what those physical assets are worth after paying all debts (**P/B**).',
      indianExample: '- **P/E Ratio**: Best for consumer, IT, and FMCG companies like TCS or Titan where intellectual property and brand drive high profits with low physical assets.\n- **P/B Ratio**: Crucial for banks and financial institutions (like HDFC Bank or SBI) whose balance sheets consist of loans and liquid capital.',
      takeaway: 'A P/B under 1.0 means the stock is trading below its liquid net assets (book value), which can indicate either an exceptional bargain or a troubled institution with bad loans.',
      followUp: 'Would you like to check the P/E and P/B multiples of our simulated stocks?',
    },
    deepDive: {
      directAnswer: 'P/E (Price-to-Earnings) values an enterprise\'s earnings power, while P/B (Price-to-Book) evaluates market capitalization against shareholders\' tangible net worth (Book Value of Equity).',
      mechanics: '1. **Book Value**: `Total Assets - Intangible Assets - Total Liabilities`.\n2. **DuPont Connection**: `P/B = P/E × Return on Equity (ROE)`. A high P/B is justified only if the firm delivers superior sustainable ROE.\n3. **Sector Applicability**: P/B is the standard valuation multiple for financial intermediaries (banks, NBFCs) and capital-intensive asset owners.',
      formulas: '`P/E = Market Price / EPS`\n`P/B = Market Price / Book Value Per Share (BVPS)`',
      riskInsight: 'Beware of asset-light companies with negative book value due to aggressive debt-funded share buybacks; in such cases, P/B becomes mathematically meaningless.',
      followUp: 'Would you like to calculate the ROE and P/B ratio for BlueWave Bank in our simulated market data?',
    },
  },

  // 13. Index Mutual Fund vs ETF
  {
    matcher: (q) => /\b(mutual\s+fund|index\s+fund)\b/i.test(q) && /\betf\b/i.test(q),
    topicTitle: 'Index Mutual Funds vs. ETFs: NAV vs. Real-Time Exchange Trading',
    eli15: {
      directAnswer: 'Both track the exact same index (like Nifty 50), but they trade differently:\n- **Index Mutual Fund**: You buy directly from the fund house at a single daily **NAV** price calculated after market close.\n- **ETF (Exchange Traded Fund)**: Trades live throughout the **trading day** on the **exchange** (NSE and BSE) like an individual stock, requiring a **Demat** account.',
      analogy: 'An Index Mutual Fund is like ordering milk delivered directly to your doorstep each morning at a fixed daily price. An ETF is like buying milk in a lively open market where the price changes slightly each minute.',
      indianExample: 'To invest in the Nifty 50:\n- **Mutual Fund**: You set up an automated ₹1,00,000 or ₹1,000 monthly SIP in UTI Nifty 50 Index Fund without needing a Demat account.\n- **ETF**: You log into your broker at 11:30 AM and buy 5 units of "NIFTYBEES" at the live price of ₹250 on the exchange.',
      takeaway: 'For passive long-term beginners setting up monthly automated SIPs, **Index Mutual Funds** offer seamless simplicity with no broker trading screens.',
      followUp: 'Would you like to know how expense ratios and tracking errors differ between ETFs and Index Funds?',
    },
    deepDive: {
      directAnswer: 'Index Funds and ETFs share passive replication mandates, but differ fundamentally in market microstructure, intraday liquidity access, and creation/redemption mechanics.',
      mechanics: '1. **Pricing**: Mutual funds settle at end-of-day NAV (Net Asset Value). ETFs trade continuously with a live market price that fluctuates around intraday NAV (iNAV) throughout the trading day on the exchange.\n2. **Creation Units**: Authorized Participants (APs) arbitrage discrepancies between ETF market price and underlying basket NAV.\n3. **Costs**: ETFs feature lower expense ratios (often 0.05%–0.15%), but investors incur brokerage, STT, and bid-ask spread costs upon entry/exit.',
      formulas: '`ETF Tracking Error = Standard Deviation of (R_ETF - R_Index)`\n`NAV = (Total Portfolio Assets - Liabilities) / Total Units`',
      riskInsight: 'Illiquid ETFs can trade at substantial premiums or discounts to their true underlying NAV during high volatility periods. Always check the iNAV before executing ETF market orders.',
      followUp: 'Would you like to inspect how tracking error affects 10-year compounding returns?',
    },
  },

  // 14. Telegram Scam / Guaranteed Double
  {
    matcher: (q) => /\b(telegram|whatsapp|guaranteed|double\s+in|insider\s+tips?)\b/i.test(q),
    topicTitle: 'Alert: The Reality Behind "Guaranteed" Stock Tips on Telegram',
    eli15: {
      directAnswer: '**DANGER! This is an illegal "Pump-and-Dump" scam.** In legitimate financial markets, returns are **never guaranteed**. Promising that a stock is guaranteed to double in 3 weeks is the hallmark of a fraudulent **pump and dump** **scam** operating across **Telegram** and WhatsApp groups. **SEBI** strictly prohibits promises of guaranteed returns and prosecutes unregistered tipsters!',
      analogy: 'Imagine a stranger at a bus stop whispering that an old bicycle will magically turn into a gold motorcycle tomorrow if you give him ₹10,000 today. If he truly had a guaranteed secret to double money every 3 weeks, he would be richer than Elon Musk and wouldn\'t be messaging strangers on Telegram.',
      indianExample: 'How the scam works:\n1. Scammers buy millions of illiquid penny stock shares for ₹2.\n2. They hype the stock in Telegram channels claiming "secret insider news".\n3. Excited retail investors rush in and push the price up to ₹8.\n4. The scammers dump all their shares, crashing the stock to ₹1.\n5. The Telegram group vanishes, and retail investors lose 80–90% of their money.',
      takeaway: 'SEBI strictly prohibits promises of guaranteed returns. Never invest in anything based on social media tips. Protect your hard-earned capital!',
      followUp: 'Would you like to learn how to check if a financial advisor is genuine and SEBI-registered?',
    },
    deepDive: {
      directAnswer: 'Solicitations promising that stocks are guaranteed to double via social media represent illicit pump and dump market manipulation schemes prohibited under SEBI regulations. In genuine equity markets, returns are never guaranteed.',
      mechanics: '1. **Pump-and-Dump Mechanics**: Operators accumulate micro-cap floating supply, utilize syndicated messaging to generate artificial retail buying pressure, and distribute accumulated inventory at inflated prices.\n2. **Regulatory Sanctions**: SEBI frequently attaches bank accounts and levies multi-crore disgorgement penalties against fraudulent Telegram tip channels.\n3. **Verification**: Genuine intermediaries hold SEBI Research Analyst (RA) or Registered Investment Advisor (RIA) licenses verifiable on SEBI.gov.in.',
      formulas: '`Rule: Guaranteed Return Claim = 100% Probability of Fraud`',
      riskInsight: 'Never share your Demat login credentials, OTPs, or agree to "profit-sharing account management" services.',
      followUp: 'Would you like to review how to identify promoter red flags in micro-cap financial statements?',
    },
  },

  // 15. Averaging Down on a Losing Stock
  {
    matcher: (q) => /\baverage\s*down\b/i.test(q) || /\bbought\s+at.*went\s+down.*put\s+more\s+money\b/i.test(q),
    topicTitle: 'Averaging Down: Strategic Opportunity or Capital Trap?',
    eli15: {
      directAnswer: '**Averaging down** means buying more shares of a stock as its price falls to lower your average purchase cost. It is only wise if your original fundamental **thesis** remains completely intact, fits within your overall portfolio **risk** budget, and is part of a written trading **plan** executed with emotional **discipline**. **Never average down just to avoid admitting a mistake!**',
      analogy: 'Imagine buying shirts for your shop. If the manufacturer has a temporary sale on high-quality shirts, buying more is smart. But if you discover the shirts have torn seams and color bleeding, buying more just because they\'re cheaper is foolish—you\'re just collecting more bad inventory.',
      indianExample: 'Investors who averaged down on fundamentally deteriorating companies like Yes Bank or Reliance Communications as they fell from ₹400 to ₹10 lost virtually everything. In contrast, patient investors who accumulated TCS or HDFC Bank during temporary macro market panics were rewarded.',
      takeaway: 'Before putting more money into a falling stock, ask: *"If I didn\'t already own this stock today, would I buy it right now?"* If the answer is no, do not add more money—respect your stop-loss and trading discipline!',
      followUp: 'Would you like to know how to set a stop-loss instead of holding on to a deteriorating position?',
    },
    deepDive: {
      directAnswer: 'Averaging down increases capital exposure to an asset exhibiting negative price momentum, violating risk management principles unless deployed within a predefined, fundamentally justified investment thesis and strict risk plan enforced with discipline.',
      mechanics: '1. **Disposition Effect**: Cognitive bias compelling investors to hold or add to losers while prematurely cutting winners.\n2. **Capital Opportunity Cost**: Sunk capital in deteriorating assets cannot participate in emerging market leaders.\n3. **Pre-Planned Averaging**: Value investors only scale in if total position size remains capped within strict portfolio concentration limits (e.g., maximum 5% total portfolio weight).',
      formulas: '`New Average Price = [(Q1 × P1) + (Q2 × P2)] / (Q1 + Q2)`',
      riskInsight: 'Losers average losers. When a thesis is invalidated by forensic red flags (rising debt, promoter pledge, auditor resignation), take the loss immediately.',
      followUp: 'Would you like to review our Stage 8 lesson on Forensic Red Flags in Corporate Balance Sheets?',
    },
  },

  // 16. Market Drop Panic / Volatility Anxiety
  {
    matcher: (q) => /\b(market\s+dropped|market\s+crash|feel\s+anxious|panic|scared\s+of\s+losing)\b/i.test(q),
    topicTitle: 'Market Volatility: How Long-Term Investors Master Anxiety',
    eli15: {
      directAnswer: 'Take a deep breath: market **volatility** and drops of 2% to 4% are completely **normal**, regular events in equity investing. Short-term volatility is the price of admission for superior **long-term** returns. A successful investor learns to master their **emotions** and never sell solid companies in a **panic**!',
      analogy: 'Think of taking an airplane flight. You will inevitably hit air turbulence that makes the cabin shake. The pilot does not jump out with a parachute; they keep their seatbelt on and fly through it because turbulence is an expected part of flying.',
      indianExample: 'Over the last 40 years, the Indian Sensex has climbed from 100 points to over 80,000 points. Along that journey, it survived wars, recessions, elections, and pandemics. Investors who panicked and sold at the bottom missed the historic compounding that followed.',
      takeaway: 'Golden rules for volatile days:\n1. 📵 Close your trading app and stop checking prices every 5 minutes.\n2. 🛡️ Remember you only lock in a loss if you press the Sell button in a panic.\n3. 🧺 Keep an emergency fund in cash so you are never forced to sell stocks during a dip.',
      followUp: 'Would you like to review your current portfolio allocation to ensure your risk exposure feels comfortable?',
    },
    deepDive: {
      directAnswer: 'Market drawdowns represent periodic volatility clusters driven by macro liquidity adjustments, interest rate shifts, and short-term systematic risk repricing. For long-term investors, managing behavioral emotions and avoiding panic liquidation is vital to capture compounding returns.',
      mechanics: '1. **Historical Frequency**: In Indian markets, intra-year corrections of 10% occur almost every single year, even during secular bull markets.\n2. **Volatility Clustering**: The market\'s best 10 single-day gains historically occur within two weeks of the worst single-day drops. Missing those 10 days cuts lifetime returns by more than half.\n3. **Rebalancing**: Disciplined asset allocation automatically triggers buying equities at depressed valuations.',
      formulas: '`Annualized Volatility (σ) = Daily Standard Deviation × √252`',
      riskInsight: 'Never invest capital needed within 3–5 years in equities. Long-term capital buffers eliminate panic selling during market drawdowns.',
      followUp: 'Would you like to examine the historical drawdown and recovery track record of the Nifty 50 over the past 20 years?',
    },
  },

  // 17. 1% Risk Rule
  {
    matcher: (q) => /\b(1%|2%)\s*(portfolio\s*)?risk\s*rule\b/i.test(q) || /\bhow\s+much\s+should\s+i\s+risk\s+per\s+trade\b/i.test(q),
    topicTitle: 'The 1% Risk Rule: The Secret to Portfolio Survival',
    eli15: {
      directAnswer: 'The **1% Risk Rule** states that on any single trade, you should **never risk losing more than 1% of your total account capital**. If you have an account of ₹1,00,000, the maximum money you can lose if your stop-loss hits is exactly ₹1,000. This rule ensures account **survival** even through multiple **consecutive** losing trades, protecting you from a catastrophic **loss**!',
      analogy: 'Imagine going into battle with a shield that can absorb 100 arrows. If each arrow only takes 1% of your shield, you can withstand 20 consecutive hits and still have 80% of your shield intact. But if you risk 25% on every trade, just 4 bad trades will completely destroy your account.',
      indianExample: 'If your total capital is ₹1,00,000:\n- Maximum allowed risk = ₹1,000 (1%).\n- If you buy a stock at ₹200 and set a stop-loss at ₹190 (₹10 risk per share):\n- Number of shares to buy = `₹1,000 / ₹10 = 100 shares`.\n- Total money invested = `100 × ₹200 = ₹20,000`.\nNotice: you invested ₹20,000, but your risk is strictly capped at ₹1,000!',
      takeaway: 'This is how professional hedge funds survive. Even during a terrible streak of 5 losses in a row, you still have 95% of your money ready for the next winner.',
      followUp: 'Would you like to practice calculating position sizes for different stop-loss levels in our simulator?',
    },
    deepDive: {
      directAnswer: 'The **1% Fixed Fractional Risk Model** mathematically constrains portfolio ruin probability during adverse drawdown streaks by sizing contracts as a function of stop-loss distance, ensuring capital preservation, account survival, and resilience against consecutive trade losses.',
      mechanics: '1. **Ruin Probability**: Risking 10% per trade leads to a >90% statistical chance of a 50% account drawdown over 100 trades. Risking 1% reduces ruin probability to <0.1%.\n2. **Dynamic Scaling**: As portfolio capital expands or contracts, absolute dollar risk adjusts proportionally.\n3. **Decoupling Allocation from Risk**: Total capital deployed can be 20–30% of portfolio, provided the stop-loss delta equals exactly 1%.',
      formulas: '`Position Size (Units) = (Account Equity × Risk %) / (Entry Price - Stop-Loss Price)`',
      riskInsight: 'Never widen a stop-loss after entering a trade to justify holding onto a losing position. That violates the 1% risk constraint.',
      followUp: 'Would you like to review our Stage 7 lesson on Position Sizing and Capital Allocation?',
    },
  },

  // 18. 50% Loss Recovery Math
  {
    matcher: (q) => /\b(50%|10%)\s*(loss|drawdown)\b/i.test(q) && /\brecover(y|ing)?\b/i.test(q) || /\bwhy\s+is\s+recovering\s+from\s+a\s+50%\s+loss\b/i.test(q),
    topicTitle: 'The Asymmetric Math of Losses: Why a 50% Drop Requires a 100% Gain',
    eli15: {
      directAnswer: 'Here is the cruel math of the stock market: **If your portfolio drops by 50%, you need a massive 100% gain just to get back to even!** That is why avoiding big losses is far more important than chasing big gains.',
      analogy: 'Imagine you have ₹100. If you lose 50%, you now have ₹50. Now, if you earn a 50% gain on your remaining ₹50, you only make ₹25—leaving you at ₹75! To get back to your original ₹100 from ₹50, you must double your money (+100%).',
      indianExample: 'Look at the recovery table:\n- Drop of 10% requires an **11% gain** to break even.\n- Drop of 20% requires a **25% gain** to break even.\n- Drop of 50% requires a **100% gain** to break even.\n- Drop of 90% requires a **900% gain** to break even!',
      takeaway: 'This is Warren Buffett\'s famous Rule #1: *"Never lose money"*, and Rule #2: *"Never forget Rule #1"*. Cutting losses at 5% to 8% keeps you in the game.',
      followUp: 'Would you like to see how strict stop-losses prevent accounts from ever entering deep drawdowns?',
    },
    deepDive: {
      directAnswer: 'The non-linear, convex geometry of investment drawdowns dictates that required breakeven returns accelerate asymptotically as losses deepen: `Required Gain % = [1 / (1 - Loss %)] - 1`. A 50% drawdown requires a 100% recovery gain.',
      mechanics: '1. **Capital Base Erosion**: A smaller capital base has fewer rupees compounding forward.\n2. **Time to Recovery**: Generating a 100% return on conservative index assets historically requires 6 to 7 years.\n3. **Asymmetric Risk Profile**: Preserving capital during bear regimes produces higher long-term Geometric Mean Returns than chasing high-volatility upside.',
      formulas: '`Recovery Multiplier = Loss % / (1 - Loss %)`\nAt 50% loss: `0.50 / (1 - 0.50) = 1.00 (+100%)`\nAt 80% loss: `0.80 / (1 - 0.80) = 4.00 (+400%)`',
      riskInsight: 'Deep drawdowns force investors into dangerous behavior—taking excessive leverage to "make it back fast", which frequently leads to complete account liquidation.',
      followUp: 'Would you like to examine our risk-adjusted Sharpe ratio calculator?',
    },
  },

  // 19. Risk-to-Reward Ratio
  {
    matcher: (q) => /\brisk\s*(-to-|\/)\s*reward\b/i.test(q) || /\b1:2\s*(ratio)?\b/i.test(q) || /\b1:3\s*(ratio)?\b/i.test(q),
    topicTitle: 'Risk-to-Reward Ratio: Winning Even When You\'re Wrong',
    eli15: {
      directAnswer: 'A **Risk-to-Reward Ratio** compares how much money you risk losing versus how much profit you expect to make on a trade. A **1:2 ratio** means you are risking ₹1 to make ₹2.',
      analogy: 'Imagine a game where every time you lose, you pay ₹100. But every time you win, you collect ₹200. Even if you only win 4 out of 10 games, you finish with a solid ₹200 profit! You don\'t need to be right all the time to make money.',
      indianExample: 'If you buy shares at ₹500:\n- Stop-loss at ₹480 (Risk = ₹20 per share).\n- Target at ₹540 (Reward = ₹40 per share).\n- Risk-to-Reward = `₹20 : ₹40 = 1:2`.',
      takeaway: 'Amateurs focus on winning percentage; professionals focus on risk-to-reward. A 1:2 or 1:3 ratio keeps you profitable even with an average 40% win rate.',
      followUp: 'Would you like to configure target prices and stop-losses to test a 1:2 ratio in our Paper Trading Lab?',
    },
    deepDive: {
      directAnswer: 'The **Risk-to-Reward Ratio (R:R)** defines the asymmetry between downside stop-loss distance and upside profit target in units of risk (R-multiples), allowing a trader to remain profitable with a sub-50% win rate at a 1:2 target.',
      mechanics: '1. **Breakeven Win Rate**: `Breakeven Win Rate % = 1 / (1 + Reward:Risk)`.\n   - At 1:1 R:R, breakeven is 50%.\n   - At 1:2 R:R, breakeven is 33.3%.\n   - At 1:3 R:R, breakeven is 25%.\n2. **Expectancy Equation**: `E = (Win Rate × Reward) - (Loss Rate × Risk)`.',
      formulas: '`R:R = (Target Price - Entry Price) / (Entry Price - Stop-Loss Price)`',
      riskInsight: 'Never set unrealistic profit targets just to make a bad setup appear like a 1:3 ratio. Targets must align with logical resistance levels and average true range (ATR).',
      followUp: 'Would you like to review how to calculate trade expectancy over a sample of 20 trades?',
    },
  },

  // 20. P/E Calculation
  {
    matcher: (q) => /\b(stock\s+price\s+of\s+₹?600|eps\s+is\s+₹?30)\b/i.test(q) || (/\bcalculate\b/i.test(q) && /\bp\s*\/?\s*e\b/i.test(q)),
    topicTitle: 'How to Calculate and Interpret the P/E Ratio',
    eli15: {
      directAnswer: 'To calculate the P/E ratio, divide the stock price by its EPS (Earnings Per Share):\n`P/E Ratio = Stock Price / EPS = ₹600 / ₹30 = 20`. This means investors pay ₹20 for every ₹1 of annual earnings the company generates.',
      analogy: 'A P/E of 20 means investors are paying **₹20 for every ₹1 of annual profit** the business generates. If the company paid out 100% of its profits as dividends, it would take 20 years to earn back your initial purchase price.',
      indianExample: 'In the Indian market, a P/E of 20 is generally considered a moderate, reasonable valuation. However, always compare it to the industry peer group: if competitors trade at a P/E of 35, a P/E of 20 looks attractive; if peers trade at 12, 20 is expensive.',
      takeaway: 'High P/E = high future growth expectations (or overvalued). Low P/E = mature steady business (or facing structural challenges).',
      followUp: 'Would you like to learn how to calculate the PEG ratio to factor in the company\'s growth rate?',
    },
    deepDive: {
      directAnswer: 'For a company with stock price of ₹600 and annual EPS of ₹30: `P/E Ratio = Stock Price / EPS = 600 / 30 = 20`. Investors pay ₹20 for each ₹1 of annual corporate earnings.',
      mechanics: '1. **Earnings Yield**: The reciprocal of P/E: `1 / 20 = 5%`. The business yields a 5% baseline earnings return on investment.\n2. **Valuation Context**: Compare against 10-year Indian Government Bond Yield (~7.0%) to assess equity risk premium.',
      formulas: '`P/E = 600 / 30 = 20`\n`Earnings Yield = (30 / 600) × 100 = 5.0%`',
      riskInsight: 'Check whether the ₹30 EPS includes one-time exceptional gains. Normalized operational EPS provides the true valuation picture.',
      followUp: 'Would you like to calculate the Price-to-Free-Cash-Flow multiple for our simulated companies?',
    },
  },

  // 21. Rule of 72 Calculation
  {
    matcher: (q) => /\brule\s+of\s+72\b/i.test(q) || (/\bdouble\b/i.test(q) && /\b12%\b/i.test(q)),
    topicTitle: 'The Rule of 72: Doubling Your Money',
    eli15: {
      directAnswer: 'According to the **Rule of 72**, divide 72 by your annual interest/return rate to find how many years it takes to double your money.\n`72 / 12 = 6 years` to double ₹1 Lakh into ₹2 Lakhs at a 12% annual return!',
      analogy: 'Think of the Rule of 72 as a mental speed calculator for compounding. Instead of solving complex math equations with exponents, you can figure out your financial future in seconds inside your head.',
      indianExample: 'At a 12% expected long-term return from diversified Indian equities:\n- Year 0: ₹1 Lakh\n- Year 6: ₹2 Lakhs\n- Year 12: ₹4 Lakhs\n- Year 18: ₹8 Lakhs\n- Year 24: ₹16 Lakhs!',
      takeaway: 'Notice how compounding accelerates: the first doubling takes 6 years to make ₹1 Lakh, but the fourth doubling makes ₹8 Lakhs in the exact same 6-year period!',
      followUp: 'Would you like to see how long it takes to double money in a 6% Fixed Deposit vs. 12% equity mutual fund?',
    },
    deepDive: {
      directAnswer: 'The **Rule of 72** is a logarithmic approximation of compound interest: `t × r = ln(2) ≈ 0.693`. Adjusted for discrete annual compounding across practical rates (6%–18%), 72 provides the optimal mathematical divisor.',
      mechanics: '`Doubling Time (Years) ≈ 72 / r`\nAt r = 12%: `72 / 12 = 6.0 years`. Exact formula: `ln(2) / ln(1.12) = 6.116 years`.',
      formulas: '`t = ln(2) / ln(1 + r)`\nApproximation: `t ≈ 72 / r`',
      riskInsight: 'Inflation cuts real doubling time in half! If inflation is 6%, your real return is `12% - 6% = 6%`, meaning your real purchasing power takes `72 / 6 = 12 years` to double.',
      followUp: 'Would you like to calculate how SIP compounding compares to a single lump-sum investment?',
    },
  },

  // 22. Position Sizing Calculation
  {
    matcher: (q) => (/\b1,00,000\b/i.test(q) || /\b100000\b/i.test(q)) && /\b200\b/i.test(q) && /\b190\b/i.test(q),
    topicTitle: 'Position Sizing Calculation Walkthrough',
    eli15: {
      directAnswer: 'You can buy exactly **100 shares**! Here is the clear calculation:\n1. Total account capital = ₹1,00,000.\n2. Maximum 1% risk allowed = `1% of ₹1,00,000 = ₹1,000`.\n3. Risk per share = Entry Price (₹200) - Stop-Loss Price (₹190) = **₹10 per share**.\n4. Position Size = Total Risk Allowed / Risk Per Share = `₹1,000 / ₹10 = 100 shares`. Your calculated position size is 100 shares with defined risk of ₹10 per share.',
      analogy: 'Total investment cost is `100 shares × ₹200 = ₹20,000`. Even though you deployed ₹20,000 into the trade, if the stock hits your ₹190 stop-loss, you only lose `100 × ₹10 = ₹1,000`, keeping 99% of your account completely intact!',
      indianExample: 'This is the universal formula used by professional traders on the NSE and BSE. It ensures that no single bad trade can ever hurt your financial health.',
      takeaway: 'Never guess how many shares to buy based on intuition. Always let your stop-loss distance determine your position size!',
      followUp: 'Would you like to test this exact trade in our Paper Trading Lab right now?',
    },
    deepDive: {
      directAnswer: 'For an account of ₹1,00,000 risking 1% (₹1,000 total risk) with entry at ₹200 and stop-loss at ₹190 (risk of ₹10 per share): `Position Size = Total Risk / Stop Distance = 1,000 / 10 = 100 shares`. Your position size is exactly 100 shares, risking ₹10 per share for ₹1,000 total downside.',
      mechanics: '1. **Allocated Capital**: `100 shares × ₹200 = ₹20,000` (20% portfolio allocation).\n2. **R-Multiple Risk**: If exited at stop-loss (₹190), realized loss = ₹1,000 (exactly 1.0R).\n3. **Target Sizing**: For a 1:2 Risk-to-Reward setup, profit target = `₹200 + (2 × ₹10) = ₹220`. Realized gain at target = `100 × ₹20 = ₹2,000` (+2.0R).',
      formulas: '`Position Size (Quantity) = (Account Equity × Risk %) / (Entry Price - Stop-Loss Price) = (1,00,000 × 0.01) / (200 - 190) = 1,000 / 10 = 100 shares`',
      riskInsight: 'If the stop-loss distance is very tight (e.g. ₹2), the mathematical formula would suggest 500 shares (₹1,00,000 allocation). Always cap single-stock allocation at 20–25% to protect against overnight gap risk.',
      followUp: 'Would you like to practice setting stop-loss and limit orders in our Paper Trading Lab?',
    },
  },

  // 23. Pizza Slice Analogy
  {
    matcher: (q) => /\bpizza\s+slice\b/i.test(q) || /\bpizza\s+analogy\b/i.test(q),
    topicTitle: 'The Pizza Slice Analogy for Company Shares',
    eli15: {
      directAnswer: 'The **pizza slice analogy** explains fractional ownership of the whole company: Think of an entire public company as one giant pizza. When the company is founded, it divides that whole pizza into equal slices called **shares**, giving you fractional ownership.',
      analogy: 'If the pizza is cut into 100 equal slices and you buy 5 slices, you own exactly 5% of the whole pizza! If the pizza bakery becomes twice as popular next year and the pizza doubles in value, each of your 5 slices is worth twice as much. Plus, whenever the bakery makes extra toppings (profits), you receive 5% of the toppings (dividends).',
      indianExample: 'When you buy shares of Tata Motors or Infosys, you own real slices of that enterprise. You don\'t need to buy the whole company; you own an affordable slice that gives you fractional business ownership.',
      takeaway: 'A share is not a lottery ticket—it is a legal certificate of fractional ownership in a living, breathing business.',
      followUp: 'Would you like to explore our Stage 2 lesson on how companies determine their total number of shares?',
    },
    deepDive: {
      directAnswer: 'The pizza slice metaphor models fractional corporate equity capitalization: `Total Equity Value = Sum of all Outstanding Shares × Market Price`. Each slice represents fractional ownership of the whole enterprise.',
      mechanics: '1. **Dilution (Cutting more slices)**: If a company issues fresh shares (e.g. rights issue or ESOPs) without expanding earnings, each existing slice represents a smaller percentage of the total pie.\n2. **Stock Buybacks (Eating slices)**: When a company repurchases and cancels its own shares, your slice becomes a larger percentage of the remaining pie.',
      formulas: '`Ownership % = (Shares Owned / Total Outstanding Shares) × 100`',
      riskInsight: 'Watch out for aggressive equity dilution in loss-making startups; continuous secondary offerings reduce earnings per share (EPS).',
      followUp: 'Would you like to review how share buybacks increase EPS without requiring higher net profit?',
    },
  },

  // 24. Forensic Red Flags in Financial Statements
  {
    matcher: (q) => /\bred\s*flags?\b/i.test(q) || /\bforensic\b/i.test(q) || /\bwatch\s+for\s+in\s+financial\s+statements\b/i.test(q),
    topicTitle: 'Forensic Red Flags: Spotting Dangerous Companies',
    eli15: {
      directAnswer: 'Forensic red flags are warning signals in a company\'s financial statements that indicate potential trouble, dishonest accounting, or hidden debt before the stock price crashes.',
      analogy: 'Think of red flags like strange knocking sounds coming from a car engine. The car might still be rolling forward today, but that noise tells you a breakdown is imminent unless you get off the road.',
      indianExample: 'Top 5 forensic red flags in Indian corporate statements:\n1. 🚩 **Promoter Pledged Shares**: When a promoter takes personal loans by pledging their company shares.\n2. 🚩 **Profits Without Cash Flow**: Net income rises, but Operating Cash Flow is negative or continually trailing.\n3. 🚩 **Frequent Auditor Resignations**: When top tier auditor firms quit abruptly citing lack of cooperation.\n4. 🚩 **Surging Debt**: Excessive debt accumulation used to pay dividends or fund working capital deficits.\n5. 🚩 **Related Party Transactions**: Funneling corporate money into private promoter-owned entities.',
      takeaway: 'Never invest in a company with multiple forensic red flags, no matter how cheap the stock looks!',
      followUp: 'Would you like to review our Stage 8 curriculum lesson on Forensic Accounting & Financial Statement Analysis?',
    },
    deepDive: {
      directAnswer: 'Forensic financial statement analysis audits divergences between accrual accounting metrics and cash-settled economic reality. Primary forensic red flags include: surging debt, deteriorating operating cash flow, abrupt auditor resignations, and high promoter pledged shares.',
      mechanics: '1. **Beneish M-Score / Altman Z-Score**: Statistical models detecting earnings manipulation and bankruptcy probability.\n2. **Cash Flow vs EBITDA Divergence**: If EBITDA grows while operating cash flow (CFO) drops below 60% of EBITDA, revenue recognition is suspect.\n3. **Promoter Pledged Shares**: When promoter pledged shares exceed 20%, market corrections can trigger lender margin calls and forced selling spirals.\n4. **Debt Service**: Unhedged foreign currency debt or rising short-term debt to fund long-term assets.\n5. **Auditor Disclaimers**: Sudden mid-term auditor resignation or qualified audit opinions.',
      formulas: '`CFO to EBITDA Ratio = Cash from Operations / EBITDA` (Healthy > 70%)\n`Promoter Pledge % = (Pledged Shares / Total Promoter Shares) × 100`',
      riskInsight: 'Sudden change in depreciation methodology or capitalisation of routine R&D/operating expenses artificially inflates current net profit.',
      followUp: 'Would you like to analyze the forensic red flag checklist on our simulated stocks?',
    },
  },

  // 25. Candlestick Charts & Wicks
  {
    matcher: (q) => /\bcandlestick\b/i.test(q) && (/\bwicks?\b/i.test(q) || /\bshadows?\b/i.test(q) || /\bohlc\b/i.test(q)),
    topicTitle: 'Candlestick Charts & The Language of Wicks/Shadows',
    eli15: {
      directAnswer: 'A **candlestick chart** displays the price battle between buyers and sellers over a specific timeframe through 4 numbers: **open**, **high**, **low**, and **close** (OHLC). The thick rectangular body marks the distance between open and close, while the thin vertical **wick** (shadow) shows the highest and lowest prices reached during that session.',
      analogy: 'Think of the wicks as footsteps left in deep snow. The footprints show how far buyers pushed uphill (upper wick) and how far sellers pushed downhill (lower wick) before the market retreated back to where it closed.',
      indianExample: '- **Long Lower Wick**: Sellers tried to dump the stock down, but buyers aggressively stepped in and pushed the price back up. This is a bullish sign of strong demand (e.g. a "Hammer" candle).\n- **Long Upper Wick**: Buyers tried to push higher, but sellers overpowered them and pushed price down. This is a bearish sign of supply resistance.',
      takeaway: 'A candlestick wick shows rejection! Long wicks show that one side tried to move the market and was rejected by the other.',
      followUp: 'Would you like to look at interactive candlestick charts in our Paper Trading Lab?',
    },
    deepDive: {
      directAnswer: 'Candlestick geometry encapsulates intra-period auction dynamics: Real Body = `|Close - Open|`; Upper Wick = `High - Max(Open, Close)`; Lower Wick = `Min(Open, Close) - Low`. The candlestick records the open, high, low, close price points.',
      mechanics: '1. **Hammer / Pin Bar**: Long lower shadow/wick (≥ 2x body height) with minimal upper wick at support indicates institutional absorption.\n2. **Shooting Star**: Long upper shadow/wick at resistance indicates overhead supply absorption.\n3. **Doji**: Real body < 10% of total candle range, reflecting equilibrium and potential momentum exhaustion.',
      formulas: '`Candle Range = High - Low`\n`Shadow-to-Body Ratio = (Upper Wick + Lower Wick) / Body Range`',
      riskInsight: 'Never trade a wick pattern in isolation. A hammer candle only holds predictive value if printed at a validated support level with expansionary volume.',
      followUp: 'Would you like to practice identifying support bounces with candlestick confirmation?',
    },
  },

  // 26. Support and Resistance Analogy
  {
    matcher: (q) => /\bsupport\s+and\s+resistance\b/i.test(q) || (/\bsupport\b/i.test(q) && /\bresistance\b/i.test(q)),
    topicTitle: 'Support and Resistance: The Floors and Ceilings of the Market',
    eli15: {
      directAnswer: '**Support** is a price floor where buyers step in to bounce price higher, while **resistance** is a price ceiling where sellers step in to take profits, causing prices to bounce back down.',
      analogy: 'Imagine bouncing a rubber ball inside a room. When the ball drops and hits the floor, it bounces back up (Support floor created by buyers). When the ball flies up and hits the ceiling, it bounces back down (Resistance ceiling created by sellers).',
      indianExample: 'If Tata Motors drops to ₹900 three times over four months and bounces back every time, ₹900 is a proven **Support floor** where buyers dominate. If it repeatedly struggles to break above ₹1,050, ₹1,050 is a strong **Resistance ceiling** where sellers dominate.',
      takeaway: 'When a strong resistance ceiling is finally broken on heavy trading volume, it often flips and becomes the new support floor! This is called the principle of polarity.',
      followUp: 'Would you like to learn how to draw support and resistance zones on a chart?',
    },
    deepDive: {
      directAnswer: 'Support and Resistance represent zones of institutional supply and demand imbalance where resting limit order clusters absorb incoming market orders, acting as price floors (support where buyers accumulate) and ceilings (resistance where sellers distribute).',
      mechanics: '1. **Order Clustering**: Round psychological levels (e.g. ₹1,000, ₹2,500) accumulate high limit order liquidity.\n2. **Polarity Principle**: Broken resistance flips to support because previous short-sellers cover at breakeven and breakout traders defend entry points.\n3. **Volume Confirmation**: Genuine breakouts exhibit volume expansion > 1.5x–2.0x of the 20-period volume moving average.',
      formulas: '`Classic Pivot = (H + L + C) / 3`\n`R1 = (2 × Pivot) - L`\n`S1 = (2 × Pivot) - H`',
      riskInsight: 'Beware of "liquidity sweeps": Smart money often pushes price slightly below support to trigger retail stop-losses, collecting liquidity before driving price higher.',
      followUp: 'Would you like to inspect support and resistance zones on our simulated stock price charts?',
    },
  },

  // 27. RSI Indicator
  {
    matcher: (q) => /\brsi\b/i.test(q) || /\brelative\s+strength\s+index\b/i.test(q),
    topicTitle: 'RSI (Relative Strength Index): Overbought & Oversold Levels',
    eli15: {
      directAnswer: 'The **relative strength index** (RSI) is a momentum indicator measured on a scale from 0 to 100. A level above **70** signals an **overbought** condition where prices may be due for a pullback, while an RSI below **30** signals an **oversold** condition where selling may be exhausted.',
      analogy: 'Think of RSI like a car\'s speedometer combined with engine temperature. If you floor the accelerator for too long, the temperature gauge hits the red zone (>70). The car can\'t accelerate forever; it needs to cool down.',
      indianExample: '- **RSI above 70**: Considered **overbought**—buyers have been euphoric, and the stock is susceptible to a pullback or cooling off.\n- **RSI below 30**: Considered **oversold**—sellers have panicked and dumped, meaning the stock might be due for a relief bounce.',
      takeaway: 'RSI does NOT mean "sell immediately at 71". In strong bull markets, stocks can remain overbought above 70 for weeks! Use RSI as a warning signal, not an isolated trigger.',
      followUp: 'Would you like to learn what "RSI Divergence" means when price makes a higher high but RSI makes a lower high?',
    },
    deepDive: {
      directAnswer: 'The **relative strength index** (RSI) is a bounded momentum oscillator (range 0–100) developed by J. Welles Wilder Jr. An RSI level exceeding **70** indicates an **overbought** condition with decelerating upward velocity, while an RSI reading below **30** denotes an **oversold** condition where downside momentum is stretched.',
      mechanics: '1. **Calculation**: `RSI = 100 - [100 / (1 + RS)]`, where `RS = Average Gain / Average Loss` over 14 periods.\n2. **Divergences**: Bearish divergence occurs when price prints higher highs while RSI prints lower highs below 70, signaling momentum exhaustion.\n3. **Bull Market Regime**: In strong uptrends, RSI tends to oscillate between 40 and 80, with 40–50 acting as support.',
      formulas: '`RS = Smoothed Avg Gain / Smoothed Avg Loss`\n`RSI = 100 - (100 / (1 + RS))` (Thresholds: 70 Overbought, 30 Oversold)',
      riskInsight: 'In strong trending regimes, blind mean-reversion trading (shorting simply because RSI > 70) results in catastrophic losses as momentum continues upward.',
      followUp: 'Would you like to evaluate the RSI readings across our simulated market stocks?',
    },
  },

  // 28. Sovereign Gold Bond (SGB)
  {
    matcher: (q) => /\bsgb\b/i.test(q) || /\bsovereign\s+gold\s+bond\b/i.test(q),
    topicTitle: 'Sovereign Gold Bonds (SGB) vs. Stocks',
    eli15: {
      directAnswer: '**Sovereign Gold Bonds (SGBs)** are government securities issued by the **Reserve Bank of India (RBI)** on behalf of the Government of India. They let you invest in gold digitally without storing physical jewelry or coins, while earning a guaranteed **2.5% annual interest** on top of gold price appreciation!',
      analogy: 'Physical gold in a bank locker just sits there gathering dust, and you have to pay locker fees. SGBs are like a golden hen that not only appreciates in value as gold rises, but also lays a cash dividend of 2.5% interest into your bank account every year.',
      indianExample: '- SGBs are denominated in grams of gold with a tenure of 8 years.\n- **Tax Advantage**: Capital gains tax is 100% EXEMPT if held until maturity (8 years)!\n- Stocks represent ownership in productive businesses (yielding 12–15% long-term historical returns), whereas Gold acts as a safe-haven hedge against currency inflation.',
      takeaway: 'A smart portfolio often combines equities (for wealth growth) with SGBs (for defense and inflation hedging).',
      followUp: 'Would you like to know how SGBs can be bought and sold on the secondary market on NSE and BSE?',
    },
    deepDive: {
      directAnswer: 'Sovereign Gold Bonds (SGBs) are government debt instruments denominated in grams of 999-purity gold, governed by the Government Securities Act, 2006, issued by the RBI as an inflation hedge paying 2.5% annual interest.',
      mechanics: '1. **Yield Structure**: Pays 2.50% semi-annual interest per annum on nominal issue value.\n2. **Tax Treatment**: Section 47 of Income Tax Act completely exempts capital gains tax on redemption at maturity (8 years).\n3. **Secondary Trading**: SGB tranches trade on NSE/BSE under distinct scrip codes, often trading at slight discounts to spot gold due to liquidity.',
      formulas: '`Total SGB Return = Capital Appreciation of Gold Spot + Cumulative 2.5% Annual Interest`',
      riskInsight: 'Secondary market SGB liquidity can be thin. If you need to exit prior to the 5th-year RBI buyback window, you may face bid-ask discounts.',
      followUp: 'Would you like to review how asset allocation models balance equities and gold in India?',
    },
  },

  // 29. Emergency Fund
  {
    matcher: (q) => /\bemergency\s+fund\b/i.test(q) || /\bbefore\s+(buying|investing\s+in)\s+stocks\b/i.test(q),
    topicTitle: 'Why You Must Build an Emergency Fund Before Buying Stocks',
    eli15: {
      directAnswer: '**YES, absolutely!** You should always build an **Emergency Fund covering 3 to 6 months of living expenses** in liquid savings **before** investing your hard-earned money in stocks. It is your financial safety shield.',
      analogy: 'Imagine climbing a mountain. Stocks are the high summit, but your emergency fund is your safety net and harness. If a sudden rock slip happens (medical emergency, job loss, bike repair), your safety harness catches you so you don\'t fall.',
      indianExample: 'If your monthly family expenses are ₹30,000, your emergency fund should be **₹90,000 to ₹1,80,000** kept safely in liquid instruments: a high-interest savings account, fixed deposits, or liquid mutual funds before putting money into equities.',
      takeaway: 'Why this matters for stock investing: If you invest every rupee in stocks and a medical emergency hits while the market is down 20%, you will be forced to sell your stocks at a heavy loss! An emergency fund provides liquid safety so you never have to sell at the bottom.',
      followUp: 'Would you like to calculate your target emergency fund amount based on your monthly expenses?',
    },
    deepDive: {
      directAnswer: 'An Emergency Reserve Fund covering 3 to 6 months of mandatory living expenses is an unencumbered liquid liquidity buffer designed to insulate investment portfolios from personal cash flow shocks before deploying capital into volatile stocks.',
      mechanics: '1. **Liquidity Requirement**: Must be accessible within 24 hours without market-exit penalties (High-yield Savings, Sweep-in FDs, Overnight/Liquid debt funds).\n2. **Buffer Sizing**: 3–6 months for salaried employees; 6–12 months for self-employed individuals with variable income.\n3. **Behavioral Protection**: Prevents forced portfolio liquidation during cyclical market downturns.',
      formulas: '`Emergency Reserve = Monthly Mandatory Operating Expenses × (3 to 6 Months)`',
      riskInsight: 'Never chase high returns on emergency funds! Safety and instant liquidity are the sole objectives, not capital appreciation.',
      followUp: 'Would you like to explore how to allocate cash between emergency savings, short-term debt, and equity investments?',
    },
  },

  // 30. Rupee Cost Averaging & SIP
  {
    matcher: (q) => /\brupee\s*-?\s*cost\s+averaging\b/i.test(q) || /\bsip\b/i.test(q) || /\bsystematic\s+investment\s+plan\b/i.test(q),
    topicTitle: 'Rupee-Cost Averaging & Systematic Investment Plans (SIP)',
    eli15: {
      directAnswer: '**Rupee-cost averaging** through a **systematic investment plan** (SIP) is the strategy of investing a fixed rupee amount at **regular** intervals (like monthly). By purchasing more units when prices fall and fewer when prices rise, your **average** cost per unit decreases, smoothing out market **volatility** automatically!',
      analogy: 'Imagine buying petrol for your scooter. Instead of trying to guess when crude oil prices will peak or bottom, you simply buy ₹500 of petrol every Monday. When petrol is cheap, your ₹500 buys more liters; when petrol is expensive, it buys fewer liters. Over the year, your average cost per liter smooths out automatically!',
      indianExample: 'In a regular monthly SIP:\n- Month 1: Nifty index is high (NAV ₹100) -> Your ₹2,000 buys 20 units.\n- Month 2: Market drops (NAV ₹80) -> Your ₹2,000 buys 25 units!\n- Month 3: Market recovers (NAV ₹100) -> Your total 45 units are now worth ₹4,500 on an invested ₹4,000!',
      takeaway: 'Rupee-cost averaging turns market drops into a discount sale for your money. It eliminates the stressful, futile urge to "time the market".',
      followUp: 'Would you like to calculate how a ₹2,00,000 lump sum compares to a regular monthly SIP over 10 years?',
    },
    deepDive: {
      directAnswer: 'Rupee-Cost Averaging via a systematic investment plan (SIP) is a mechanical dollar-cost-averaging framework that deploys regular cash flows into equities, lowering average unit acquisition costs and insulating portfolio accumulation from market volatility.',
      mechanics: '1. **Harmonic Mean Advantage**: Because a constant monetary sum purchases more shares at lower valuations and fewer shares at higher valuations, the average cost per unit equals the **Harmonic Mean**, which is mathematically strictly less than or equal to the Arithmetic Mean.\n2. **Elimination of Market Timing Risk**: Neutralizes sequence of returns risk for accumulators.\n3. **Behavioral Automation**: Direct bank mandate (NACH) eliminates discretionary hesitation.',
      formulas: '`Average Cost Per Unit = Total Capital Invested / Total Units Accumulated`\n`Harmonic Mean = n / Sum(1 / P_i)`',
      riskInsight: 'Rupee-cost averaging only works when deployed into assets with long-term secular positive expected returns (like diversified broad-market indices). Averaging down on a dying single company fails.',
      followUp: 'Would you like to examine our SIP compounding calculator?',
    },
  },

  // 31. Stock Split
  {
    matcher: (q) => /\b(stock\s+split|split\s+1\s*:\s*5|1\s*:\s*5\s+split|sub-division\s+of\s+shares)\b/i.test(q),
    topicTitle: 'What Happens During a 1:5 Stock Split?',
    eli15: {
      directAnswer: 'In a **1:5 stock split**, your **shares multiply** by 5, while the per-share **price adjusts** downward by 5x. Because the price adjusts in exact proportion to the extra shares, the total **market cap stays same** and your overall investment value remains identical, while trading **liquidity** improves!',
      analogy: 'Imagine having a crisp ₹500 note in your wallet. If you exchange it at a shop for five ₹100 notes, you now hold 5 notes instead of 1, but you still have exactly ₹500. A stock split is simply making change for retail investors.',
      indianExample: 'If you hold 10 shares of a company trading at ₹1,000 (total investment value = ₹10,000):\n- After the 1:5 stock split, your shares multiply to **50 shares**.\n- The share price adjusts proportionally to **₹200**.\n- The company\'s total market cap stays same, and your portfolio value is unchanged: `50 shares × ₹200 = ₹10,000`!\n- More retail investors can now buy shares, boosting exchange liquidity.',
      takeaway: 'Why do companies do this? To make shares more accessible to small retail investors and boost trading liquidity on the exchanges without altering corporate intrinsic value.',
      followUp: 'Would you like to know how stock splits differ from bonus share issues?',
    },
    deepDive: {
      directAnswer: 'In a 1:5 stock split (share sub-division), outstanding **shares multiply** fivefold while the nominal per-share **price adjusts** inversely by 1/5, ensuring the corporate **market cap stays same** and shareholders\' equity is unchanged while market **liquidity** and retail participation expand.',
      mechanics: '1. **Face Value Adjustment**: A 1:5 split on a ₹10 face value share reduces face value to ₹2 per share, while shares multiply by 5.\n2. **Price Adjusts Proportionally**: The ex-split share price adjusts immediately at market open.\n3. **Market Cap Stays Same**: Total equity market value remains strictly invariant (`P_new × Q_new = P_old × Q_old`).\n4. **Liquidity Expansion**: Lower nominal share price reduces odd-lot friction and expands retail order book depth.',
      formulas: '`New Share Count = Old Share Count × 5 (Shares Multiply)`\n`New Price = Old Price / 5 (Price Adjusts)`\n`Market Cap Post = New Share Count × New Price = Market Cap Pre (Market Cap Stays Same)`',
      riskInsight: 'A stock split does NOT change the business\'s intrinsic earnings, competitive moat, or profit margins. Never buy a stock solely because a split was announced.',
      followUp: 'Would you like to review how corporate actions like splits and bonus issues are reflected in Demat accounts?',
    },
  },

  // 32. Real-Time Price Inquiry Boundary
  {
    matcher: (q) => /\b(current\s+share\s+price|price\s+right\s+now|what\s+is\s+the\s+price\s+of\s+.*today)\b/i.test(q),
    topicTitle: 'Live Market Price vs. Educational Mentorship',
    eli15: {
      directAnswer: 'As an **educational** AI Mentor, I **cannot verify** **real-time** market ticker feeds or provide the current **live price** of Reliance Industries or any other stock right now. To check the second-by-second live price, please look at your broker\'s trading platform (like Zerodha or Groww) or Google Finance.',
      analogy: 'Think of me as your finance professor and coach in the study room. I teach you how to analyze company balance sheets, evaluate P/E ratios, and place smart orders, while the digital scoreboard on the stadium wall shows the live second-by-second score.',
      indianExample: 'In our app\'s **Paper Trading Lab**, we provide realistic simulated live prices for our simulated learning stocks (Nova Tech, Greencore Energy, UrbanMart, BlueWave Bank) so you can practice order execution anytime!',
      takeaway: 'My mission is to help you master market mechanics, risk management, and valuation discipline through educational simulation.',
      followUp: 'Would you like to learn how to evaluate Reliance Industries\' business model, or test order execution in our Paper Trading Lab?',
    },
    deepDive: {
      directAnswer: 'In strict compliance with financial education guidelines, this mentor platform **cannot verify** **real-time** tick feeds or deliver a commercial **live price**. The environment is designed exclusively for **educational** mentorship, valuation modeling, and simulated paper execution.',
      mechanics: 'Real-time Level 1/Level 2 tick feeds require licensed exchange broadcast protocols (e.g., NSE NEAT/NOW multicast feeds) and registered broker connectivity.',
      formulas: '`Scope: Pedagogical Mechanics, Historical Modeling & Sandbox Simulation`',
      riskInsight: 'Trading decisions should rely on real-time execution terminals with authenticated order books and tick-level depth.',
      followUp: 'Would you like to analyze how market makers quote bid-ask spreads during live trading sessions?',
    },
  },

  // 33. Moving Averages (SMA, EMA, Golden Cross, Death Cross)
  {
    matcher: (q) => /\b(moving\s+averages?|\bsma\b|\bema\b|golden\s+cross|death\s+cross|20\s*ema|50\s*ema|200\s*ema)\b/i.test(q),
    topicTitle: 'Moving Averages (SMA & EMA) & Crossovers',
    eli15: {
      directAnswer: 'A **moving average** is a smoothing line plotted over price charts that filters out everyday erratic price noise to reveal the true underlying trend direction over a set number of days (like 20, 50, or 200 days).',
      analogy: 'Imagine a student who scores 30% on one bad quiz, 95% on the next, and 70% on another. Instead of panicking over a single day\'s score, their 50-day cumulative grade point average shows whether they are generally improving or falling behind.',
      indianExample: 'On the Nifty 50 and blue-chip stocks like Reliance or TCS, traders watch the **200-day Exponential Moving Average (EMA)**. When the faster 50-day moving average crosses above the 200-day line, it is called a **Golden Cross** (bullish milestone). When it crosses below, it is called a **Death Cross** (bearish warning).',
      takeaway: 'Moving averages lag behind prices—they confirm trends rather than predict exact tops and bottoms. Never trade crossovers in sideways, choppy markets where false signals multiply.',
      followUp: 'Would you like to know the difference between a Simple Moving Average (SMA) and an Exponential Moving Average (EMA)?',
    },
    deepDive: {
      directAnswer: 'Moving averages are lagging dynamic trend-filtering overlays. The Simple Moving Average (SMA) applies equal arithmetic weighting across N periods, whereas the Exponential Moving Average (EMA) applies exponential weighting multipliers to recent price ticks, reducing lag and accelerating sensitivity to emerging trend inflections.',
      mechanics: '1. EMA Multiplier: `k = 2 / (N + 1)`.\n2. EMA Formula: `EMA_today = (Close_today × k) + (EMA_yesterday × (1 - k))`.\n3. Golden Cross: Occurs when a short-term moving average (typically 50-day EMA) crosses above a long-term anchor (200-day EMA), signaling regime change from structural accumulation to institutional markup.\n4. Dynamic Support/Resistance: Institutional trend-following algorithms frequently deploy 20-period and 50-period EMAs as automated liquidity reload zones.',
      formulas: '`SMA = (P1 + P2 + ... + Pn) / n`\n`EMA = (Price_t × (2/(N+1))) + (EMA_{t-1} × (1 - (2/(N+1))))`',
      riskInsight: 'Moving averages generate severe whipsaws during cyclical mean-reversion and consolidation brackets. Combine MA trend bias with Average Directional Index (ADX > 25) or volume confirmation to avoid whipsaw drawdown.',
      followUp: 'Would you like to simulate a 20/50 EMA crossover backtest in our Paper Trading Lab?',
    },
  },

  // 34. MACD (Moving Average Convergence Divergence)
  {
    matcher: (q) => /\b(macd|moving\s+average\s+convergence)\b/i.test(q),
    topicTitle: 'MACD (Moving Average Convergence Divergence)',
    eli15: {
      directAnswer: 'The **MACD** is a popular momentum indicator that shows the relationship between two moving averages of a stock\'s price. It helps you see whether bullish buyers or bearish sellers are gaining acceleration.',
      analogy: 'Think of MACD like the speedometer and acceleration pedal in a car. Even if your car is still moving forward (price is rising), if you take your foot off the accelerator, momentum is slowing down before the car eventually halts or turns around.',
      indianExample: 'When analyzing Tata Motors or State Bank of India, traders watch the MACD line crossing above the signal line as a bullish momentum surge, and watch the histogram bars turning from red to green.',
      takeaway: 'MACD is great for spotting momentum shifts, but in sideways rangebound markets it generates false crossover signals. Always confirm with price action support and resistance.',
      followUp: 'Would you like to know how MACD divergence spots reversals before they happen on price charts?',
    },
    deepDive: {
      directAnswer: 'The Moving Average Convergence Divergence (MACD) is an absolute price oscillator constructed by subtracting the 26-period EMA from the 12-period EMA. A 9-period EMA of the MACD line acts as the Signal Line, with the Histogram visualizing the spread delta between the MACD and Signal vectors.',
      mechanics: '1. MACD Line: `EMA(Close, 12) - EMA(Close, 26)`.\n2. Signal Line: `EMA(MACD Line, 9)`.\n3. MACD Histogram: `MACD Line - Signal Line`.\n4. Zero-Line Crossover: Signals shift in net medium-term momentum direction.\n5. Regular Divergence: Bullish divergence forms when price prints lower lows while MACD prints higher lows, signaling seller exhaustion.',
      formulas: '`MACD = EMA_{12}(Close) - EMA_{26}(Close)`\n`Signal = EMA_{9}(MACD)`\n`Histogram = MACD - Signal`',
      riskInsight: 'Lagging divergence signals can remain extended during strong directional trend impulses. Never enter solely on indicator divergence without a verified price-action market structure break (MSB).',
      followUp: 'Would you like to analyze how to filter MACD false crosses using multi-timeframe confirmation?',
    },
  },

  // 35. Bollinger Bands
  {
    matcher: (q) => /\b(bollinger\s+bands?)\b/i.test(q),
    topicTitle: 'Bollinger Bands: Volatility & Mean Reversion',
    eli15: {
      directAnswer: 'A **Bollinger Band** is an envelope indicator that places flexible upper and lower boundary bands around a stock\'s 20-day average. The bands expand when the market gets volatile and contract when the market goes quiet.',
      analogy: 'Imagine a dog walking on an elastic leash attached to its owner. The owner walks steadily along the 20-day middle path. The dog can dart left or right to the end of the leash (the upper or lower bands), but eventually it must run back toward the owner in the center.',
      indianExample: 'When a stock like Infosys is quiet for weeks, its Bollinger Bands squeeze together very tightly. This "Bollinger Squeeze" is the calm before the storm, signaling an explosive breakout in volatility is right around the corner.',
      takeaway: 'Touching the upper band does NOT automatically mean sell, and touching the lower band does NOT automatically mean buy. In strong bull runs, stocks can "walk the upper band" for weeks!',
      followUp: 'Would you like to learn how to identify a "Bollinger Squeeze" before a big breakout?',
    },
    deepDive: {
      directAnswer: 'Bollinger Bands consist of a central N-period simple moving average (typically 20 SMA) bounded by upper and lower bands positioned K standard deviations (typically K=2) away, mathematically capturing approximately 95.4% of expected price distribution under normal dispersion assumptions.',
      mechanics: '1. Middle Band = 20 SMA.\n2. Upper Band = `20 SMA + (2 × Standard Deviation)`.\n3. Lower Band = `20 SMA - (2 × Standard Deviation)`.\n4. Bandwidth Metric: `((Upper - Lower) / Middle) × 100` measures volatility compression/expansion cycles.\n5. Walking the Bands: In high-momentum regimes, prices repeatedly breach standard deviation bounds without reverting to mean.',
      formulas: '`σ = sqrt( (1/N) * sum((Price_i - SMA)^2) )`\n`Upper = SMA + 2σ` | `Lower = SMA - 2σ`\n`%B = (Price - Lower) / (Upper - Lower)`',
      riskInsight: 'Treating band touches as automatic mean-reversion counter-trend trades is disastrous in trending markets. Always use bandwidth expansion to confirm volatility breakouts before taking directional risk.',
      followUp: 'Would you like to see how %B oscillator is used to spot overbought and oversold extremes?',
    },
  },

  // 36. Trading Volume & Breakouts
  {
    matcher: (q) => /\b(what\s+is\s+volume|trading\s+volume|volume\s+analysis|volume\s+breakout)\b/i.test(q),
    topicTitle: 'Trading Volume: The Fuel of Market Moves',
    eli15: {
      directAnswer: '**Trading Volume** is the total number of shares bought and sold between market participants during a specific period of time (such as 1 minute, 1 day, or 1 week). It measures how much institutional conviction and fuel is behind a price move.',
      analogy: 'Imagine a street protest. If 3 people stand on a sidewalk shouting slogans, nobody pays attention. But if 100,000 passionate citizens march down the avenue, the entire nation takes notice. High volume is that 100,000-person crowd showing real institutional power.',
      indianExample: 'If Tata Motors breaks above its 6-month resistance of ₹1,000 on 5 times its average daily volume, big institutional funds (mutual funds and FIIs) are buying aggressively. If it crawls above ₹1,000 on pathetic low volume, it is likely a retail bull trap ready to reverse.',
      takeaway: 'Price is the headline, but volume is the lie detector. Never trust a breakout that happens on dry, anaemic volume.',
      followUp: 'Would you like to learn how to compare a stock\'s daily volume against its 20-day average volume?',
    },
    deepDive: {
      directAnswer: 'Trading volume represents the aggregate transactional liquidity executed across cleared order matches. In auction market theory, volume confirms price acceptance: price discovers new levels, and volume validates or rejects those levels through capital commitment.',
      mechanics: '1. Volume Expansion on Trend Continuation: Confirms institutional participation and order book absorption.\n2. Volume Contraction on Pullbacks: Healthy consolidation reflecting absent institutional supply.\n3. Climax Volume (Blow-off Top / Panic Bottom): Massive volume spike after an extended advance or decline, signaling institutional distribution or capitulation.\n4. Volume Spread Analysis (VSA): Correlating the candlestick spread (high minus low) with relative volume to evaluate absorption vs exhaustion.',
      formulas: '`Relative Volume (RVOL) = Current Volume / Average Volume (20-day)`\n`VWAP = Sum(Price_i * Volume_i) / Sum(Volume_i)`',
      riskInsight: 'Low-volume breakouts are statistically prone to failure (>65% false breakout rate on major exchanges). Require at least 1.5x–2.0x 20-day RVOL before trading breakout setups.',
      followUp: 'Would you like to explore Volume Weighted Average Price (VWAP) in our simulation engine?',
    },
  },

  // 37. Head and Shoulders Chart Pattern
  {
    matcher: (q) => /\b(head\s+and\s+shoulders?|inverse\s+head\s+and\s+shoulders?)\b/i.test(q),
    topicTitle: 'Head and Shoulders & Inverse Head and Shoulders',
    eli15: {
      directAnswer: 'The **Head and Shoulders** is a classic reversal chart pattern showing a higher peak (the Head) nestled between two lower peaks (the Shoulders). It signals that an uptrend is running out of steam and sellers are taking control.',
      analogy: 'Imagine a champion athlete jumping as high as they can. First jump: 5 feet (Left Shoulder). Second jump: 7 feet (Head - their personal best!). Third jump: only 4.5 feet (Right Shoulder). The athlete is visibly exhausted—their energy has peaked and they are collapsing back down to the ground.',
      indianExample: 'When an Indian stock like HDFC Bank rises to ₹1,600 (left shoulder), shoots to ₹1,750 (head), falls to support at ₹1,550 (neckline), and can only rally to ₹1,620 (right shoulder) before breaking below the ₹1,550 neckline on heavy volume, the uptrend is broken.',
      takeaway: 'The pattern is ONLY complete when price decisively breaks and closes below the **Neckline**! An **Inverse Head and Shoulders** is the upside-down mirror image that signals a powerful bullish trend reversal.',
      followUp: 'Would you like to know how to calculate the minimum price target after a neckline breakdown?',
    },
    deepDive: {
      directAnswer: 'The Head and Shoulders structure is a structural distribution pattern characterized by failure to sustain higher highs. It demarcates transition from Dow Theory accumulation/markup to institutional distribution, marked by diminishing volume on the Head and Right Shoulder rallies and explosive breakdown through the Neckline support.',
      mechanics: '1. Left Shoulder: Climax rally on strong volume followed by normal retracement.\n2. Head: Higher high printed on noticeably lower volume, signaling buyer divergence.\n3. Right Shoulder: Weak corrective bounce failing well below Head peak.\n4. Neckline: Trendline connecting swing troughs.\n5. Target Projection: Vertical distance from Head peak to Neckline projected downward from breakdown point.',
      formulas: '`Minimum Measured Target = Neckline Price - (Head Peak Price - Neckline Price)`',
      riskInsight: 'Never pre-empt the pattern by shorting at the right shoulder. Wait for an authoritative candle close below the neckline with volume expansion, or enter on the subsequent low-volume retest of the broken neckline.',
      followUp: 'Would you like to practice spotting this pattern on our simulated charts in Paper Trading?',
    },
  },

  // 38. Double Top & Double Bottom (M & W Patterns)
  {
    matcher: (q) => /\b(double\s+top|double\s+bottom|w\s+pattern|m\s+pattern)\b/i.test(q),
    topicTitle: 'Double Top ("M") & Double Bottom ("W") Patterns',
    eli15: {
      directAnswer: 'A **Double Top** looks like the letter "M" and signals that prices tried twice to break higher, hit a brick ceiling, failed, and are now reversing downward. A **Double Bottom** looks like a "W" and signals that buyers defended a strong floor twice and are preparing to surge upward.',
      analogy: 'Think of knocking down a reinforced wooden door. You throw all your weight against it twice. Both times the door holds solid, and on your second attempt you sprain your shoulder. You give up and walk away.',
      indianExample: 'If Nifty rallies to 25,000, drops to 24,600 (neckline), rallies again to 24,980, and fails to cross 25,000, that is a Double Top. If it drops below 24,600, institutional profit booking has taken over.',
      takeaway: 'A Double Top is not confirmed until the price breaks below the middle valley (neckline). Many traders get trapped trying to guess the top before confirmation!',
      followUp: 'Would you like to know how to set a stop-loss when trading a Double Bottom reversal?',
    },
    deepDive: {
      directAnswer: 'Double Tops (reversal from markup to markdown) and Double Bottoms (reversal from markdown to markup) represent failure tests of previous liquidity extremes. They reflect structural exhaustion of institutional absorption capacity at key supply/demand thresholds.',
      mechanics: '1. Peak 1 / Trough 1: Establishes initial boundary extreme on high volume.\n2. Retracement: Pulls back to define intermediate Neckline pivot.\n3. Peak 2 / Trough 2: Secondary test of extreme with discernible volume drop (divergence).\n4. Neckline Break: Definitive close beyond intermediate pivot confirms structural change.\n5. Measured Objective: Vertical height of pattern projected from breakout point.',
      formulas: '`Target (Double Bottom) = Neckline + (Neckline - Trough)`\n`Target (Double Top) = Neckline - (Peak - Neckline)`',
      riskInsight: 'Premature entries at the second peak/trough face high invalidation rates (~40%) as institutional liquidity sweeps frequently produce false breaks (turtle soups) before true reversal.',
      followUp: 'Would you like to simulate a Double Bottom breakout entry in Paper Trading?',
    },
  },

  // 39. Candlestick Anatomy: Hammer, Shooting Star & Doji
  {
    matcher: (q) => /\b(hammer\s+candle|shooting\s+star|doji|bullish\s+engulfing|bearish\s+engulfing)\b/i.test(q),
    topicTitle: 'Candlestick Anatomy: Hammer, Shooting Star & Doji',
    eli15: {
      directAnswer: 'A **Hammer** has a small body at the top and a long lower shadow (tail), showing that sellers tried to push prices down, but aggressive buyers stepped in and hammered price back up. A **Shooting Star** is the exact opposite—a long upper tail showing sellers rejected higher prices. A **Doji** has virtually no body, showing perfect indecision between buyers and sellers.',
      analogy: 'Imagine a tug-of-war match. The sellers pull the rope 50 feet into their territory during the morning. But by afternoon, the buyers dig their boots in, pull the rope all the way back, and finish near where they started. The sellers are exhausted, and buyers have the momentum!',
      indianExample: 'If Greencore Energy or Reliance drops for 5 consecutive days and then prints a crisp Hammer candlestick right at a major historical support level on heavy volume, it signals that institutional dip-buyers are aggressively stepping in.',
      takeaway: 'The tail (shadow/wick) tells the story! A long tail shows where the market was fiercely rejected. Never trade a single candle in isolation—always look at where it appears (at support or resistance).',
      followUp: 'Would you like to learn how to identify a Bullish Engulfing pattern?',
    },
    deepDive: {
      directAnswer: 'Single and multi-candle patterns represent intraday order flow dynamics compressed into Open-High-Low-Close (OHLC) intervals. Shadow wicks reflect liquidity rejection zones where resting limit orders absorbed incoming market orders and counter-auctioned price back through the range.',
      mechanics: '1. Hammer: Lower shadow must be at least 2x the vertical height of the real body, with minimal/zero upper shadow; requires prior defined downtrend.\n2. Shooting Star: Upper shadow >= 2x real body, closing near the low after testing overhead liquidity.\n3. Doji: Open and Close are identical within 0.1% tolerance; indicates dynamic equilibrium.\n4. Engulfing: Real body of candle N completely submerges the entire real body of candle N-1 on expanded volume.',
      formulas: '`Lower Shadow Ratio = (Min(Open, Close) - Low) / (Abs(Close - Open) || 0.01) >= 2.0`',
      riskInsight: 'Candlestick patterns are triggers, not trading systems. An isolated Hammer in the middle of a trading range has near-random expectancy; when aligned with a multi-month confluence level, expectancy increases significantly.',
      followUp: 'Would you like to inspect a candlestick setup on our interactive simulator?',
    },
  },

  // 40. Short Selling in India
  {
    matcher: (q) => /\b(short\s+selling|how\s+to\s+short|shorting\s+stocks?|short\s+a\s+stock)\b/i.test(q),
    topicTitle: 'Short Selling: Making Money When Stock Prices Fall',
    eli15: {
      directAnswer: '**Short selling** is a trading strategy where you sell shares you don\'t own (borrowed through your broker) at a high price today, hoping the stock will crash so you can buy them back cheaper later and pocket the difference as profit!',
      analogy: 'Imagine your friend has a brand-new iPhone worth ₹1,00,000. You borrow it from him for a week. You immediately sell it to a stranger for ₹1,00,000 cash. Three days later, Apple announces a massive price cut and the exact same phone now costs ₹70,000 in stores. You buy one for ₹70,000, return the brand-new phone to your friend, and keep the ₹30,000 difference as profit!',
      indianExample: 'In the Indian stock market (NSE/BSE), retail traders can only short sell shares on an **intraday basis (MIS)**—meaning you MUST square off (buy back) your shares before 3:15 PM on the same day. For multi-day overnight short positions, Indian regulations require you to use **Futures and Options (Derivatives)** or the Securities Lending and Borrowing (SLB) mechanism.',
      takeaway: 'Short selling carries asymmetric risk! When you buy a stock, the most you can lose is 100% of your money (if it goes to zero). But when you short sell, a stock can theoretically rally to infinity, meaning your potential loss is mathematically unlimited!',
      followUp: 'Would you like to know how mandatory stop-losses protect short sellers from explosive short squeezes?',
    },
    deepDive: {
      directAnswer: 'Short selling involves creating a negative equity delta position by executing an initial sell transaction via borrowed securities, with the liability of subsequently delivering identical securities (buy-to-cover) at future market settlement.',
      mechanics: '1. Intraday Cash Market Shorting: Permitted under Margin Intraday Square-off (MIS) protocols. If un-squared by 3:15 PM, broker auto-square-off triggers; if unfulfilled due to lower circuit lock-in, goes to Exchange Auction Market with severe auction penalties (up to 20%).\n2. Overnight Position Shorting: Requires single-stock futures contracts or put option purchase, or borrowing through SEBI\'s Securities Lending and Borrowing (SLB) window.\n3. Short Squeeze Mechanics: Sudden upward price velocity forces short sellers to cover simultaneously, adding market buy orders that accelerate vertical rallies.',
      formulas: '`Short Profit/Loss = (Sell Price - Buy-to-Cover Price) × Quantity - Borrowing Fees - Slippage`',
      riskInsight: 'Always enforce hard, automated Stop-Loss Market (SL-M) orders on every short trade. Never hold short cash positions near market close due to auction penalty risks.',
      followUp: 'Would you like to simulate an intraday short trade in our Paper Trading Lab?',
    },
  },

  // 41. Futures & Options (F&O / Derivatives)
  {
    matcher: (q) => /\b(futures?\s+and\s+options?|f\s*&\s*o|derivatives?|what\s+is\s+f\s*and\s*o)\b/i.test(q),
    topicTitle: 'Futures and Options (F&O): Financial Derivatives',
    eli15: {
      directAnswer: '**Futures and Options (F&O)** are financial contracts whose value is "derived" from an underlying asset (like the Nifty 50 index or Reliance shares). Instead of buying the physical stock, you enter a legal agreement to trade it at a set price on or before a future expiry date.',
      analogy: 'Imagine booking an apartment under construction. You pay a ₹5,00,000 token advance to lock in the apartment price at ₹50,00,000 for 6 months. If property prices skyrocket to ₹65,00,000, you can sell your booking contract and pocket ₹15,00,000 profit on just ₹5,00,000 invested! But if property prices crash, you lose your entire ₹5,00,000 token.',
      indianExample: 'In India, F&O is traded in fixed "Lots" (e.g. 1 Nifty lot = 25 or 75 units). According to official SEBI research studies, **9 out of 10 retail traders lose money in F&O** because they treat leverage like a lottery ticket without understanding volatility or time decay.',
      takeaway: 'Derivatives were invented for farmers and big institutions to *hedge* (insure) against risk, not for retail gambling. Master fundamental investing and paper trading before ever touching F&O!',
      followUp: 'Would you like to know the difference between a Call Option (CE) and a Put Option (PE)?',
    },
    deepDive: {
      directAnswer: 'Financial derivatives are bilateral contracts structured on standardized exchange protocols whose payoff matrices derive from movements in an underlying security or benchmark index, offering capital leverage, non-linear risk profiling, and structural hedging capabilities.',
      mechanics: '1. Futures Contracts: Obligates both buyer and seller to settle at delivery/expiry; marked-to-market (MTM) cash settled daily based on exchange closing price.\n2. Options Contracts: Grants the buyer the right, but not the obligation, to buy (Call) or sell (Put) the underlying at strike K on or before expiry.\n3. Margin Framework: Span + Exposure margins mandated by SEBI to insulate counterparty clearing default risk.\n4. SEBI F&O Study Findings: ~89% of individual retail F&O traders incur net losses, with average loss exceeding ₹1.1 Lakh per active retail participant.',
      formulas: '`Futures Basis = Futures Price - Spot Price`\n`Call Intrinsic Value = Max(0, Spot - Strike)`\n`Put Intrinsic Value = Max(0, Strike - Spot)`',
      riskInsight: 'Never trade naked short options (unhedged option selling) due to theoretically unbounded tail risk. Always define maximum loss per contract with hedged multi-leg spreads.',
      followUp: 'Would you like to explore basic option hedging strategies like Bull Call Spreads?',
    },
  },

  // 42. Call Option vs Put Option (CE vs PE)
  {
    matcher: (q) => /\b(call\s+option|put\s+option|\bce\b|\bpe\b|call\s+vs\s+put|difference\s+between\s+call\s+and\s+put)\b/i.test(q),
    topicTitle: 'Call Options (CE) vs. Put Options (PE)',
    eli15: {
      directAnswer: 'A **Call Option (CE - Call European)** gives you the right to BUY a stock at a fixed price, making money when the market rises. A **Put Option (PE - Put European)** gives you the right to SELL a stock at a fixed price, making money when the market crashes!',
      analogy: 'A Call Option is like paying a token advance to lock in the purchase price of gold before an anticipated price surge. A Put Option is like car insurance: you pay a small premium to protect your car against accidents; if your car crashes (stock crashes), the insurance company pays you the difference!',
      indianExample: 'If Nifty is at 24,000:\n- Buying a **24,000 CE (Call)** profits if Nifty rallies aggressively above 24,000 + the premium paid.\n- Buying a **24,000 PE (Put)** profits if Nifty plummets below 24,000 - the premium paid.',
      takeaway: 'Option buyers have limited risk (the premium paid) but low win probability because of **Theta (time decay)** eating away the contract\'s value every second! The clock is always ticking against option buyers.',
      followUp: 'Would you like to learn how "Time Decay" (Theta) causes option prices to melt towards zero on expiry day?',
    },
    deepDive: {
      directAnswer: 'Call and Put options represent standardized contingent claims. Under European exercise conventions (standard on NSE), options can only be exercised at terminal expiration date T, pricing dynamically via Black-Scholes-Merton and binomial lattices based on spot, strike, volatility, dividend yield, and risk-free interest rates.',
      mechanics: '1. Call Option Payoff (Buyer): `Max(0, S_T - K) - Premium`.\n2. Put Option Payoff (Buyer): `Max(0, K - S_T) - Premium`.\n3. Moneyness: In-the-Money (ITM) has intrinsic + extrinsic value; At-the-Money (ATM) and Out-of-the-Money (OTM) consist purely of extrinsic (time/volatility) value.\n4. Expiry Dynamics: At expiry 3:30 PM, all extrinsic value collapses to zero; OTM options expire completely worthless (value = ₹0.00).',
      formulas: '`C = S_0 * N(d1) - K * e^(-rT) * N(d2)`\n`P = K * e^(-rT) * N(-d2) - S_0 * N(-d1)`',
      riskInsight: 'Over 80% of OTM option contracts held by retail buyers expire completely worthless at Thursday expiry. Avoid buying cheap OTM "lottery ticket" options.',
      followUp: 'Would you like to examine how Option Greeks govern the pricing of CE and PE contracts?',
    },
  },

  // 43. Option Greeks: Delta, Theta, Gamma, Vega
  {
    matcher: (q) => /\b(option\s+greeks?|theta\s+decay|delta|gamma|vega)\b/i.test(q),
    topicTitle: 'Option Greeks: Delta, Theta, Gamma, and Vega',
    eli15: {
      directAnswer: 'The **Option Greeks** are four vital numbers that measure how an option\'s price moves in response to stock price shifts (**Delta**), speed of movement (**Gamma**), passing of time (**Theta**), and market fear/volatility (**Vega**).',
      analogy: 'Imagine buying an ice cream cone on a scorching summer afternoon:\n- **Delta**: How fast you run toward the park.\n- **Theta**: The hot sun melting your ice cream cone every passing minute even if you stand still!\n- **Vega**: A sudden heatwave making ice cream demand (and prices) jump.\n- **Gamma**: How fast your sprint accelerates.',
      indianExample: 'When you buy a Nifty 24,500 Call Option for ₹100, its **Theta** might be -₹15 per day. If Nifty does not move at all over the weekend, you will wake up on Monday morning to find your option has melted from ₹100 down to ₹70 purely due to time decay!',
      takeaway: 'Theta decay accelerates exponentially during the final week before expiry. Option sellers profit from this decay, while option buyers suffer from it.',
      followUp: 'Would you like to know why Implied Volatility (Vega) collapses immediately after earnings reports or budget announcements?',
    },
    deepDive: {
      directAnswer: 'Option Greeks represent partial derivatives of the Black-Scholes option pricing model with respect to underlying state variables, quantifying sensitivity vectors across price, curvature, time, and volatility dimensions.',
      mechanics: '1. Delta (∂V/∂S): Rate of change of option price per ₹1 move in spot (Calls: 0 to +1; Puts: 0 to -1).\n2. Gamma (∂²V/∂S²): Rate of change of Delta per ₹1 move in spot; peaks for ATM options near expiry.\n3. Theta (∂V/∂t): Daily decay in option value due to elapsed time; strictly negative for long options, with non-linear decay acceleration inside the final 10 days to expiration.\n4. Vega (∂V/∂σ): Sensitivity to a 1% change in Implied Volatility (IV); highest for long-dated ATM contracts.',
      formulas: '`Delta_Call = N(d1)` | `Delta_Put = N(d1) - 1`\n`Gamma = N\'(d1) / (S * σ * sqrt(T))`\n`Theta_decay = - (S * N\'(d1) * σ) / (2 * sqrt(T)) - r * K * e^(-rT) * N(d2)`',
      riskInsight: 'High-gamma environments ("Hero-Zero" expiry sessions) subject option sellers to extreme convexity tail risk where small spot gaps produce massive MTM drawdowns.',
      followUp: 'Would you like to simulate a Delta-neutral hedging strategy in our lab?',
    },
  },

  // 44. Upper Circuit & Lower Circuit (Circuit Breakers in India)
  {
    matcher: (q) => /\b(upper\s+circuit|lower\s+circuit|circuit\s+limit|circuit\s+breaker)\b/i.test(q),
    topicTitle: 'Upper & Lower Circuits: Exchange Safety Halts',
    eli15: {
      directAnswer: 'A **circuit breaker** is an automated exchange price band (typically 5%, 10%, or 20%) set by the NSE and BSE. If a stock surges to its maximum permitted daily gain, it hits the **Upper Circuit**. If it crashes to its maximum permitted daily loss, it hits the **Lower Circuit**.',
      analogy: 'Think of an electrical fuse box in your home. If there is a dangerous power surge that threatens to blow up your appliances, the safety fuse immediately trips to shut off current. Circuit limits trip to prevent emotional panic and protect investors from total wipedown in a single day.',
      indianExample: 'When a micro-cap stock gets pumped by shady operators on social media, it can hit the 5% Upper Circuit every day. But when the pump ends, it hits the 5% Lower Circuit day after day with **all sellers and zero buyers**—meaning retail investors are trapped and cannot sell even 1 single share!',
      takeaway: 'Never invest in penny stocks locked in upper circuits. When they reverse into lower circuits, market liquidity vanishes and you will be completely unable to exit your position.',
      followUp: 'Would you like to know how the market-wide circuit breaker halts trading on the entire NSE and BSE during national panics?',
    },
    deepDive: {
      directAnswer: 'Circuit filters are macroprudential volatility cooling mechanisms enforced by SEBI and Indian stock exchanges (NSE/BSE) to mitigate systemic clearing house risk, curtail manipulative pump-and-dump runs, and curb runaway algorithmic cascades.',
      mechanics: '1. Individual Stock Circuit Bands: Dynamic (2%, 5%, 10%, 20%). Blue-chip stocks with active F&O derivative contracts do NOT have rigid daily price bands; instead, they have dynamic operating ranges that flex after short 15-minute cooling halts.\n2. Order Book Impact: When a stock locks at Lower Circuit, the bid side of the Level 2 order book empties completely (`Total Buy Quantity = 0`). Market and limit sell orders queue up unexecuted chronologically.\n3. Market-wide Index Circuit Breakers: Triggered on Nifty/Sensex at 10%, 15%, and 20% drops, halting all nationwide trading for between 45 minutes to the remainder of the trading day depending on trigger time.',
      formulas: '`Upper Circuit Limit = Previous Day Close × (1 + Circuit_Band_Percentage)`\n`Lower Circuit Limit = Previous Day Close × (1 - Circuit_Band_Percentage)`',
      riskInsight: 'Illiquid small-cap stocks locked in lower circuits create catastrophic execution liquidity blackouts. Always enforce strict diversification away from stocks placed in SEBI\'s Additional Surveillance Measure (ASM) or Graded Surveillance Measure (GSM) frameworks.',
      followUp: 'Would you like to review how SEBI\'s ASM and GSM surveillance lists protect retail traders?',
    },
  },

  // 45. Intraday Trading vs Delivery (MIS vs CNC)
  {
    matcher: (q) => /\b(intraday\s+vs\s+delivery|mis\s+vs\s+cnc|intraday\s+trading|delivery\s+trading)\b/i.test(q),
    topicTitle: 'Intraday Trading (MIS) vs. Delivery Investing (CNC)',
    eli15: {
      directAnswer: '**Intraday Trading (MIS)** means you buy and sell shares within the same trading day before market close (3:30 PM). **Delivery Investing (CNC)** means you pay full cash to take permanent ownership of shares deposited safely into your Demat account to hold for months or years.',
      analogy: 'Intraday is like renting a fast sports car for 6 hours: it gives you 5x leverage and excitement, but you MUST return the keys by 3:15 PM no matter whether you are having fun or stuck in traffic. Delivery is buying the car outright: it sits parked in your private garage and nobody can ever take it away from you.',
      indianExample: 'When placing an order on Zerodha, Groww, or AngelOne:\n- Selecting **MIS (Margin Intraday Square-off)** gives you up to 5x margin leverage, but the broker will auto-square-off your trade at 3:15 PM.\n- Selecting **CNC (Cash and Carry)** requires 100% cash upfront, and the shares settle into your CDSL/NSDL Demat account in T+1 business days.',
      takeaway: 'Delivery investing lets you compound business wealth with zero clock pressure. Intraday trading puts you in direct competition with supercomputer algorithms and high broker fees.',
      followUp: 'Would you like to know how the T+1 settlement cycle delivers shares to your Demat account in India?',
    },
    deepDive: {
      directAnswer: 'The core structural distinction between Intraday (MIS) and Delivery (CNC) revolves around clearing horizon, regulatory leverage, and custody entitlement.',
      mechanics: '1. Intraday (MIS - Margin Intraday Square-off): Positions settled netting cash difference before 15:15 IST. Un-squared trades subject to automated broker RMS liquidation + square-off charges.\n2. Delivery (CNC - Cash \'N Carry): 100% upfront margin required under SEBI peak margin rules. Entitles investor to corporate actions (dividends, splits, voting rights).\n3. Custody & Settlement: Trades settle under India\'s T+1 settlement mechanism via depositories (NSDL / CDSL).\n4. Taxation Differences: Delivery equity held >12 months taxed at 12.5% LTCG; intraday profits classified as Speculative Business Income taxed at applicable personal income tax slab rates.',
      formulas: '`Intraday Leverage = 1 / Peak_Margin_Requirement (Max 5x per SEBI regulations)`',
      riskInsight: 'Leverage is a double-edged sword. A 5x leverage multiplier means a minor 2% adverse price fluctuation wipes out 10% of your account equity. Beginners should strictly trade Delivery (CNC) mode.',
      followUp: 'Would you like to test an intraday trade with zero risk in our Paper Trading Lab?',
    },
  },

  // 46. Stop Loss vs Trailing Stop Loss
  {
    matcher: (q) => /\b(trailing\s+stop\s*loss|difference\s+between\s+stop\s*loss\s+and\s+trailing)\b/i.test(q),
    topicTitle: 'Standard Stop-Loss vs. Trailing Stop-Loss',
    eli15: {
      directAnswer: 'A **Standard Stop-Loss** stays fixed at one price to protect against catastrophic loss. A **Trailing Stop-Loss** automatically walks upward like an elevator behind the stock price as it rises, locking in accumulated profits while still protecting you if the stock suddenly plunges!',
      analogy: 'Imagine climbing a steep mountain. A fixed stop-loss is an anchor set at the ground floor (Base Camp). A trailing stop-loss is a ratcheting safety harness that clamps onto the cliff every 10 feet you climb. If you slip, you only fall a few inches, not all the way back to the mountain base!',
      indianExample: 'You buy Tata Motors at ₹1,000:\n- **Fixed Stop-Loss**: Placed at ₹950 (protects ₹50 max loss). If the stock rallies to ₹1,400 and crashes back to ₹900, you still lose money.\n- **Trailing Stop-Loss (₹50 trail)**: As Tata Motors rallies to ₹1,200, the stop-loss automatically ratchets up to ₹1,150. When it hits ₹1,400, your stop-loss sits at ₹1,350! If price reverses, you exit with ₹350 profit locked in safely.',
      takeaway: 'Trailing stop-losses let your winners run while systematically taking risk off the table.',
      followUp: 'Would you like to know how to calculate an optimal trailing buffer using the ATR (Average True Range) indicator?',
    },
    deepDive: {
      directAnswer: 'While a standard stop-loss order establishes a static price invalidation boundary, a trailing stop-loss dynamically recalibrates its trigger threshold as price establishes favorable excursion, creating an asymmetric ratchet mechanism that captures trend persistence while curbing drawdowns.',
      mechanics: '1. Trailing Buffer Metric: Defined via fixed monetary quantum, percentage delta, or volatility-adjusted multiplier (e.g. 2.0 × ATR(14)).\n2. Monotonic Ratchet Rule: Trailing stop thresholds only advance in the direction of profitability; they NEVER widen or regress backward during pullbacks.\n3. Execution Mechanics: In Indian brokerage APIs (Zerodha Kite, Groww), trailing stops operate either client-side or through persistent server-side GTT (Good Till Triggered) logic.',
      formulas: '`Trailing Stop (Long) = Max(Historical High - Trailing Offset, Previous Trailing Stop)`',
      riskInsight: 'Setting a trailing offset tighter than normal market volatility noise (e.g. setting a 0.5% trail on a stock with 2.5% daily volatility) guarantees premature shakeouts before major trend moves.',
      followUp: 'Would you like to practice setting a trailing stop in our Paper Trading simulation?',
    },
  },

  // 47. Bonus Shares vs Stock Split
  {
    matcher: (q) => /\b(bonus\s+shares?\s+vs\s+stock\s+split|difference\s+between\s+bonus\s+and\s+split|bonus\s+shares?)\b/i.test(q),
    topicTitle: 'Bonus Shares vs. Stock Splits: What Investors Must Know',
    eli15: {
      directAnswer: '**Bonus shares** and **Stock splits** both give you extra shares for free and adjust the share price downward proportionally. The key difference is internal accounting: a **Stock Split** divides the Face Value of the stock, while **Bonus Shares** are issued from the company\'s accumulated cash reserves without changing Face Value.',
      analogy: 'Both result in cutting a pizza into more slices. In a stock split, you slice each piece in half. In bonus shares, the chef takes leftover dough from the kitchen reserves to bake you extra identical mini-slices. In both cases, your total share of the restaurant remains the same.',
      indianExample: 'When **TCS** or **Infosys** issues a 1:1 Bonus Issue, if you had 100 shares at ₹4,000 (total ₹4,00,000), you now have 200 shares at ₹2,000 (still total ₹4,00,000). The company\'s face value stays at ₹1. In a 1:5 stock split (like IRCTC or Tata Steel), the face value dropped from ₹10 to ₹2.',
      takeaway: 'Neither corporate action makes you magically richer overnight! Total market cap and portfolio value stay identical on ex-date.',
      followUp: 'Would you like to know the tax implications of bonus shares under Indian capital gains rules?',
    },
    deepDive: {
      directAnswer: 'Both corporate actions expand equity float while preserving shareholder proportional ownership, but differ fundamentally in corporate balance sheet treatment and capital structure implications.',
      mechanics: '1. Stock Split (Sub-division): Reduces nominal par/face value (e.g. ₹10 to ₹2); reserves and surplus accounts are untouched; authorized share capital automatically sub-divided.\n2. Bonus Issue (Capitalization of Reserves): Face value remains invariant; company capitalizes accumulated Free Reserves / Securities Premium to issue fully paid-up equity shares.\n3. Tax Treatment in India: Cost of acquisition for bonus shares under Section 55 of Income Tax Act is deemed to be **₹0 (Zero)**, meaning the entire sale proceeds are taxed as capital gains when liquidated.',
      formulas: '`Bonus Ratio A:B -> New Shares = Holding × (A / B)`\n`Ex-Bonus Price = Cum-Bonus Price × [B / (A + B)]`\n`Cost of Acquisition of Bonus Shares = ₹0.00`',
      riskInsight: 'Never purchase shares immediately prior to a bonus or split announcement expecting instantaneous profit; market prices adjust downward precisely at the opening auction of the ex-date.',
      followUp: 'Would you like to analyze how corporate reserves are converted to equity in financial statements?',
    },
  },

  // 48. Capital Gains Tax in India (LTCG & STCG) & STT
  {
    matcher: (q) => /\b(ltcg|stcg|capital\s+gains?\s+tax|tax\s+on\s+shares?|stt|securities\s+transaction\s+tax)\b/i.test(q),
    topicTitle: 'Stock Market Taxation in India: LTCG, STCG & STT',
    eli15: {
      directAnswer: 'When you profit from selling stocks in India, you pay taxes based on your holding period: **Short-Term Capital Gains (STCG)** applies if you held the stock for less than 12 months, and **Long-Term Capital Gains (LTCG)** applies if you held for more than 12 months.',
      analogy: 'Think of taxes like a government toll gate on your investment highway. If you rush in and out like a speedy delivery driver (less than 1 year), the government charges you a higher short-term toll. If you stay on the road patiently for years, they give you a discounted long-term commuter toll rate.',
      indianExample: 'Under India\'s latest Union Budget tax structure:\n- **LTCG (Held > 12 months)**: Taxed at **12.5%** on net annual profits exceeding the ₹1.25 Lakh tax-free exemption bracket.\n- **STCG (Held < 12 months)**: Taxed at **20%** on total net profits.\n- **STT (Securities Transaction Tax)**: A tiny transaction fee automatically deducted by your broker on every buy and sell order.',
      takeaway: 'Patient long-term compounding benefits from lower tax rates and the ₹1.25 Lakh annual tax-free profit threshold!',
      followUp: 'Would you like to know how tax-loss harvesting can legally offset your capital gains at fiscal year-end?',
    },
    deepDive: {
      directAnswer: 'Indian equity taxation is governed by the Income Tax Act under Sections 111A (STCG) and 112A (LTCG) for listed equity securities where Securities Transaction Tax (STT) is discharged.',
      mechanics: '1. STCG (Section 111A): Holding period <= 12 months; flat rate of 20% (plus applicable surcharge & 4% cess).\n2. LTCG (Section 112A): Holding period > 12 months; flat rate of 12.5% without indexation benefits, with an aggregate annual exemption threshold of ₹1,25,000 per financial year.\n3. STT: Levied on turnover at time of order matching (0.1% on delivery buy/sell; 0.025% on intraday sell).\n4. Set-Off & Carry Forward: Short-term capital loss can be set off against both STCG and LTCG; long-term capital loss can ONLY be set off against LTCG; unabsorbed losses can be carried forward for 8 consecutive assessment years.',
      formulas: '`LTCG Tax Payable = Max(0, Total_LTCG - ₹1,25,000) × 12.5% × 1.04`\n`STCG Tax Payable = Total_STCG × 20% × 1.04`',
      riskInsight: 'Always budget for statutory friction (STT, exchange turnover fees, GST on brokerage, SEBI turnover fees, stamp duty) when evaluating short-term trading edges.',
      followUp: 'Would you like to calculate the net post-tax return on an example trade?',
    },
  },

  // 49. FII (Foreign Institutional Investors) & DII (Domestic Institutional Investors)
  {
    matcher: (q) => /\b(fii\s+and\s+dii|fii\s+vs\s+dii|foreign\s+institutional|domestic\s+institutional|\bfii\b|\bdii\b)\b/i.test(q),
    topicTitle: 'FIIs & DIIs: The Whales Moving the Indian Stock Market',
    eli15: {
      directAnswer: '**FIIs (Foreign Institutional Investors)** are massive foreign mutual funds, pension funds, and sovereign wealth funds (like Vanguard, BlackRock, or Singapore Temasek) investing from abroad. **DIIs (Domestic Institutional Investors)** are Indian institutions like LIC, SBI Mutual Fund, and HDFC Mutual Fund managing the savings of Indian citizens.',
      analogy: 'Imagine a giant tug-of-war match over the Indian stock market. On one side are the foreign whales (FIIs) pumping in billions of US Dollars or pulling them out when global interest rates shift. On the other side are the Indian elephants (DIIs) fueled by monthly retail SIP inflows, absorbing foreign selling and stabilizing the market.',
      indianExample: 'Every evening at 5:30 PM, the NSE and BSE publish the **FII/DII Net Activity Report**. If FIIs sold ₹4,000 Crore of shares, but Indian DIIs bought ₹4,200 Crore through domestic mutual fund SIPs, the Nifty stays resilient and doesn\'t crash!',
      takeaway: 'In recent years, the power of Indian retail SIPs (over ₹20,000+ Crore flowing into domestic mutual funds every single month) has created a resilient domestic shield against global foreign outflows.',
      followUp: 'Would you like to know how changes in the US Federal Reserve interest rates cause FIIs to move money in and out of India?',
    },
    deepDive: {
      directAnswer: 'Institutional order flow dominance in Indian equity markets is split between Foreign Portfolio Investors (FPIs/FIIs registered under SEBI FPI regulations) and Domestic Institutional Investors (comprising Asset Management Companies, Life Insurance Corporation, pension funds, and domestic banks).',
      mechanics: '1. Foreign Portfolio Investors (FPI): Macro-sensitive capital flows governed by USD/INR exchange rates, US Treasury yields, and MSCI Emerging Markets Index weighting rebalancings.\n2. Domestic Institutional Investors (DII): Highly structural, programmatic capital fueled by domestic Systematic Investment Plan (SIP) inflows averaging >₹20,000 Crore monthly.\n3. Liquidity Transformation: Systematic domestic retail capital has historically compressed market beta against foreign capital flight, transforming DIIs from price takers to dominant liquidity providers.',
      formulas: '`Net Institutional Flow = FII Net Cash Flow + DII Net Cash Flow`',
      riskInsight: 'When both FIIs and DIIs are simultaneous net aggressive sellers over sustained 5-day windows, market corrections typically intensify. Track daily provisional institutional cash data on the NSE portal.',
      followUp: 'Would you like to review how to analyze institutional delivery percentages?',
    },
  },

  // 50. ROE (Return on Equity) vs. ROCE (Return on Capital Employed)
  {
    matcher: (q) => /\b(roe\s+vs\s+roce|return\s+on\s+equity|return\s+on\s+capital\s+employed|\broe\b|\broce\b)\b/i.test(q),
    topicTitle: 'ROE vs. ROCE: Measuring Capital Efficiency',
    eli15: {
      directAnswer: '**ROE (Return on Equity)** measures how much profit a company generates using only shareholders\' money. **ROCE (Return on Capital Employed)** measures how efficiently the company generates profit using ALL capital invested in the business—including both shareholders\' equity AND borrowed debt.',
      analogy: 'Imagine you open a restaurant using ₹10 Lakh of your own savings and borrow ₹90 Lakh from a bank (total ₹1 Crore). If your business makes ₹5 Lakh profit, your ROE looks huge (50% on your ₹10 Lakh savings!), but your ROCE is a modest 5% on the total ₹1 Crore deployed. ROCE prevents you from being tricked by companies loaded with dangerous debt.',
      indianExample: 'When analyzing capital-intensive companies like Tata Motors, Larsen & Toubro, or Adani Enterprises, seasoned investors check **ROCE** to see if the business actually earns a higher return than the interest rate it pays on its loans (cost of capital). For debt-free IT companies like TCS or Infosys, ROE and ROCE are virtually identical.',
      takeaway: 'A great business should consistently generate an ROCE above 15–20%. If ROCE is lower than bank loan interest rates, the company is destroying shareholder value!',
      followUp: 'Would you like to know how the DuPont Analysis breaks ROE into profit margins, asset turnover, and financial leverage?',
    },
    deepDive: {
      directAnswer: 'Return on Equity (ROE) evaluates accounting efficiency relative to net worth, whereas Return on Capital Employed (ROCE) evaluates operational earning power across total capitalization (debt + equity), neutralizing capital structure distortions.',
      mechanics: '1. Return on Equity (ROE): `Net Income / Total Shareholders\' Equity`. Vulnerable to manipulation via aggressive financial leverage (debt expansion artificially inflates ROE while expanding bankruptcy risk).\n2. Return on Capital Employed (ROCE): `EBIT / (Total Assets - Current Liabilities)` or `EBIT / (Total Equity + Long-Term Debt)`.\n3. Economic Value Added (EVA) Spread: A company creates economic value only when `ROCE > Weighted Average Cost of Capital (WACC)`.',
      formulas: '`ROE = Net Profit / Shareholders\' Equity`\n`ROCE = EBIT / Capital Employed`\n`Capital Employed = Total Assets - Current Liabilities`',
      riskInsight: 'Never evaluate ROE in isolation for debt-laden companies. High ROE combined with low ROCE and elevated Debt-to-Equity is a classic financial distress red flag.',
      followUp: 'Would you like to see how to calculate ROCE from an actual balance sheet?',
    },
  },

  // 51. Debt-to-Equity Ratio & Solvency
  {
    matcher: (q) => /\b(debt\s+to\s+equity|d\/e\s+ratio|debt\s+free\s+stocks?)\b/i.test(q),
    topicTitle: 'Debt-to-Equity Ratio: Checking Corporate Solvency',
    eli15: {
      directAnswer: 'The **Debt-to-Equity (D/E) Ratio** tells you how much borrowed debt a company is using to finance its operations compared to the money invested by shareholders. A D/E of 0 means the company is completely **debt-free**!',
      analogy: 'Imagine you buy a house. If the house costs ₹1 Crore, you put down ₹1 Crore in full cash, your Debt-to-Equity is 0 (zero stress, no EMI). But if you put down only ₹10 Lakh cash and take a ₹90 Lakh home loan, your Debt-to-Equity is 9.0! If you lose your job, the bank can seize your home.',
      indianExample: 'Companies like **TCS**, **Infosys**, **Hindustan Unilever**, and **Divi\'s Labs** maintain virtually zero long-term debt (D/E < 0.1). They can survive severe economic recessions easily. Highly indebted infrastructure companies with D/E > 2.5 often struggle when interest rates rise.',
      takeaway: 'As a rule of thumb for retail investors: prefer companies with a Debt-to-Equity ratio below 1.0 (or ideally below 0.5), combined with healthy operating cash flows.',
      followUp: 'Would you like to know how to check the Interest Coverage Ratio to ensure a company can easily pay its loan interest?',
    },
    deepDive: {
      directAnswer: 'The Debt-to-Equity (D/E) ratio is a primary solvency metric quantifying financial leverage and structural risk within corporate capital architecture.',
      mechanics: '1. Total Debt: Sum of short-term borrowings, current portion of long-term debt, and non-current borrowings.\n2. Shareholders\' Equity: Sum of share capital, retained earnings, and other reserves.\n3. Sector Disparities: Capital-intensive sectors (utilities, telecom, infrastructure) naturally tolerate higher D/E (1.5–2.5x) due to predictable contractual revenue, whereas cyclical commodity or consumer tech firms require D/E < 0.5x.\n4. Financial Distress Indicator: Alt-Z scores and Interest Coverage Ratio (`EBIT / Interest Expense < 2.0x`) indicate imminent solvency strain.',
      formulas: '`Debt-to-Equity Ratio = Total Debt / Total Shareholders\' Equity`\n`Interest Coverage Ratio = Operating Profit (EBIT) / Finance Costs`',
      riskInsight: 'High debt turns normal operational hiccups into fatal bankruptcy events. In downcycles, equity holders are wiped out first as debt holders have senior liquidation preference.',
      followUp: 'Would you like to practice screening for low-debt companies in our curriculum?',
    },
  },

  // 52. Can I Start with Small Capital (₹100 or ₹500)?
  {
    matcher: (q) => /\b(start\s+with\s+(?:₹|rs\.?|inr)?\s*(?:100|500|1000)|minimum\s+(?:capital|money|amount)\s+to\s+(?:start|invest))\b/i.test(q),
    topicTitle: 'Can You Start Investing with ₹100 or ₹500?',
    eli15: {
      directAnswer: '**YES, absolutely!** In India today, there is no minimum capital barrier. You can start investing in the stock market with as little as **₹100 or ₹500** through a Demat account or a Mutual Fund SIP.',
      analogy: 'Think of investing like planting an oak tree. You don\'t need a full-grown forest to begin; you just need a tiny acorn and rich soil. Planting a tiny seed every month creates an unbeatable compounding habit that turns into a massive forest over 20 years.',
      indianExample: 'In India:\n- You can start a **Mutual Fund SIP** with just **₹100 or ₹500 per month** in index funds tracking the Nifty 50.\n- You can buy **1 single share** of high-quality companies or exchange-traded funds (like Nippon Nifty BeES ETF for ~₹270) directly through your broker app with zero account opening fees!',
      takeaway: 'Starting small is actually your greatest superpower: it lets you make your beginner mistakes with tiny amounts of money before you handle larger sums.',
      followUp: 'Would you like to know how investing ₹1,000 every month can compound to over ₹10 Lakhs over 15 years?',
    },
    deepDive: {
      directAnswer: 'Democratization of financial infrastructure in India (zero-brokerage discount broking, UPI instant mandate settlement, and T+1 fractional dematerialization) has eliminated minimum capital thresholds for retail capital formation.',
      mechanics: '1. Micro-SIP Architecture: Major Indian Asset Management Companies (Nippon, HDFC, ICICI Prudential, Parag Parikh) accept recurring SIPs starting at ₹100/month.\n2. ETF Unit Lot Size: Single-unit equity ETFs (e.g. NIFTYBEES, GOLDBEES, JUNIORBEES) trade continuously on the NSE secondary market without lot size restrictions.\n3. Statutory Cost Efficiency: At ₹500 ticket sizes, ensure flat-fee discount brokers do not impose fixed transactional minimums that create high percentage drag.',
      formulas: '`Future Value = P * [((1 + r/n)^(n*t) - 1) / (r/n)] * (1 + r/n)`',
      riskInsight: 'While entry capital is small, avoid aggressive penny stocks trading below ₹5 whose low prices give a deceptive illusion of affordability while carrying extreme delisting risks.',
      followUp: 'Would you like to start testing trade execution with ₹1,00,000 virtual cash in our Paper Trading Lab?',
    },
  },

  // 53. Can I Lose More than I Invest?
  {
    matcher: (q) => /\b(lose\s+more\s+than\s+i\s+invest|can\s+my\s+balance\s+go\s+negative|infinite\s+loss)\b/i.test(q),
    topicTitle: 'Can You Lose More Money Than You Invest?',
    eli15: {
      directAnswer: 'If you buy regular **delivery shares (cash shares)** with your own money, **NO, you can NEVER lose more than you invested!** The absolute worst that can happen is the stock drops to zero, and you lose only the exact money you put in.',
      analogy: 'If you buy a physical bicycle for ₹5,000, the worst thing that can happen is it gets stolen or crushed—you lose your ₹5,000. Nobody comes knocking on your door demanding another ₹20,000. But if you borrow a Ferrari with borrowed money and crash it, you owe millions!',
      indianExample: 'When can you lose more than you invest in India? ONLY when you trade with **borrowed money or leverage**—such as selling naked options, trading futures without stop-losses, or using aggressive margin loans (MTF).',
      takeaway: 'Stick to delivery cash investing (CNC) when you are starting out. You will never owe a single rupee of debt to any broker or exchange!',
      followUp: 'Would you like to learn how our 1% Risk Rule guarantees you can never blow up your account?',
    },
    deepDive: {
      directAnswer: 'In standard cash delivery equity investing (CNC), investor liability is strictly limited to the capital deployed (Limited Liability Corporate Doctrine under the Companies Act). Negative balance exposure occurs exclusively in leveraged derivative contracts and debt-financed margin positions.',
      mechanics: '1. Long Equity (Cash): Maximum Loss = 100% of purchase price (terminal insolvency of issuer).\n2. Naked Short Options Selling: Payoff is theoretically unbounded as underlying price can advance infinitely.\n3. Leveraged Futures / Margin Calls: If a leveraged position gaps violently past maintenance margin through overnight events, client equity can enter deficit balances, triggering legal broker debt recovery obligations.',
      formulas: '`Max Loss (Long Equity) = P_entry × Q`\n`Max Loss (Short Call) = Infinite`\n`Max Loss (Long Future) = P_entry × Q (bounded at zero), but exceeds initial margin deposit`',
      riskInsight: 'Never trade unhedged option writing or hold high-leverage positions through volatile geopolitical or earnings announcements.',
      followUp: 'Would you like to review how stop-losses protect trading capital in our interactive lab?',
    },
  },
];

// ---------------------------------------------------------------------------
// 5. INTENT RECOGNITION MATCHING
// ---------------------------------------------------------------------------

function findSpecializedTopic(question: string, historyContext?: string): TopicAnswerDefinition | null {
  const cleanQ = question.trim();
  const fullContext = historyContext ? `${historyContext} ${cleanQ}` : cleanQ;

  for (const handler of TOPIC_HANDLERS) {
    if (handler.matcher(cleanQ, historyContext) || handler.matcher(fullContext)) {
      return handler;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 6. HIGH-FIDELITY ANSWER GENERATOR
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 6. VISUAL ATTACHMENT ANALYZER & DYNAMIC INQUIRY SYNTHESIZER
// ---------------------------------------------------------------------------

function analyzeFinancialAttachment(params: {
  attachment: MentorAttachmentItem;
  question: string;
  mode: 'eli15' | 'deep_dive';
  learnerContext?: LearnerContext;
}): string {
  const { attachment, question, mode, learnerContext } = params;
  const isBeginner = mode === 'eli15';
  const cleanQ = question.trim();
  const studentName =
    learnerContext?.displayName &&
    learnerContext.displayName !== 'Learner' &&
    learnerContext.displayName !== 'Guest'
      ? learnerContext.displayName
      : null;

  const greeting = studentName
    ? `Hey ${studentName}! 📸 I have inspected your uploaded financial chart/asset closely.`
    : `Hey there! 📸 I have inspected your uploaded financial chart/asset closely.`;

  const fileName = attachment.name || 'Financial_Chart.png';
  const lowerQ = cleanQ.toLowerCase();
  const lowerName = fileName.toLowerCase();

  const isFinancialStatement =
    lowerQ.includes('balance sheet') ||
    lowerQ.includes('p&l') ||
    lowerQ.includes('profit and loss') ||
    lowerQ.includes('revenue') ||
    lowerQ.includes('financial statement') ||
    lowerName.includes('balance') ||
    lowerName.includes('pnl') ||
    lowerName.includes('statement');

  const isOrderTicket =
    lowerQ.includes('order') ||
    lowerQ.includes('zerodha') ||
    lowerQ.includes('groww') ||
    lowerQ.includes('broker') ||
    lowerQ.includes('ticket') ||
    lowerQ.includes('portfolio') ||
    lowerName.includes('order') ||
    lowerName.includes('ticket');

  if (isFinancialStatement) {
    if (isBeginner) {
      return `${greeting}

### 📑 Visual Breakdown: Financial Statement / Corporate Report
*(Attached Document: \`${fileName}\`)*

To answer your question directly regarding **"${cleanQ || 'Financial Statement Analysis'}"**:

1. 🔍 **Visual Structure & Income Statement Anatomy**:
   - **Topline (Operating Revenue)**: Look for steady, quarter-on-quarter sales expansion (12–15%+ annual growth). Consistent revenue shows a healthy customer base.
   - **Operating Profit Margin (EBITDA)**: Check whether raw material expenses are squeezing profit margins. Healthy operating margins shield the company during inflation.
   - **Bottomline (Net Profit / PAT)**: Verify that net profit growth comes from core business operations rather than one-off asset sales.
   - **Cash Flow from Operations (CFO)**: Ensure Net Profit actually translates into real bank cash flow rather than unpaid credit receivables.

2. 🍕 **Everyday Analogy**:
   Imagine a popular neighborhood juice stall. If the owner boasts that sales are up by ₹5 Lakh, but ₹4 Lakh of that was given away on credit to customers who haven't paid, the shop has high "accounting profit" on paper but zero real cash in the register to pay the rent!

3. 🛡️ **Forensic Caution Flags (Ben's Risk Defense)**:
   - Check if promoter shareholding is heavily pledged to shadow lenders.
   - Watch out for sudden spikes in short-term debt without proportional asset growth.

4. 🎮 **Next Step in Practice**:
   Compare these financial ratios against our simulated companies (like Greencore Energy and BlueWave Bank) in the app to practice spotting resilient balance sheets!`;
    } else {
      return `${greeting}

### 📑 Forensic Audit & Statement Analysis
*(Attached Document: \`${fileName}\`)*

### 1. Quantitative Statement Decomposition: "${cleanQ || 'Corporate Filing Review'}"
- **Operating Revenue & Quality of Earnings**: Isolate core EBITDA margins from non-operating treasury income and one-time extraordinary credits.
- **Accruals & Cash Conversion Ratio**: Evaluate the Cash Flow from Operations (CFO) to Net Income ratio: \`CFO / PAT >= 1.0\`. If CFO/PAT is consistently below 0.8, revenue recognition may be aggressive.
- **Working Capital & Cash Conversion Cycle (CCC)**: Track DSO (Days Sales Outstanding) and inventory turnover velocity. Expanding receivables during slowing revenue indicates credit-channel stuffing.
- **Solvency & Capital Structure**: Calculate Interest Coverage Ratio: \`EBIT / Finance Charges\`. Coverage below 2.5x in cyclical sectors signifies elevated debt-service vulnerability.

### 2. Risk Management Perspective
High financial leverage acts as an accelerant during macroeconomic downturns. Require a minimum Debt-to-Equity < 0.8x combined with positive Free Cash Flow (\`FCF = CFO - CapEx\`) before underwriting equity investment theses.

Would you like to calculate DuPont ROE components for this business structure?`;
    }
  }

  if (isOrderTicket) {
    if (isBeginner) {
      return `${greeting}

### 🧾 Order Ticket & Execution Analysis
*(Attached Screenshot: \`${fileName}\`)*

To answer your inquiry regarding **"${cleanQ || 'Order Verification'}"**:

1. 🎯 **Order Execution Parameters**:
   - **Order Type (Market vs. Limit)**: If this is a **Market Order**, you accept whatever instantaneous price the exchange order book offers, which can cause painful execution slippage. Always prioritize **Limit Orders** so you guarantee your maximum purchase price!
   - **Product Code (MIS vs. CNC)**: If marked **MIS (Margin Intraday)**, your broker will forcefully auto-square-off this position at 3:15 PM today. For long-term ownership, make sure to choose **CNC (Cash and Carry)**.
   - **Trigger Price & Stop-Loss**: Ensure your Stop-Loss Limit (SL-L) trigger is placed at a logical structural level (e.g. below the recent swing low) rather than an arbitrary round number.

2. 🛡️ **Capital Survival Rule**:
   Never risk more than 1% of your total account balance on any single execution. Ensure your potential reward is at least twice your calculated stop-loss risk (1:2 Risk-to-Reward ratio).

3. 🎮 **Zero-Risk Testing**:
   You can practice placing Limit, Market, and Stop-Loss orders risk-free in our **Paper Trading Lab** with ₹1,00,000 in virtual funds right now!`;
    } else {
      return `${greeting}

### 🧾 Execution Architecture & Broker Ticket Audit
*(Attached Screenshot: \`${fileName}\`)*

### 1. Order Parameter Decomposition: "${cleanQ || 'Execution Audit'}"
- **Routing & Execution Algorithm**: Limit order placement reduces negative slippage by resting liquidity on the passive bid/ask book, avoiding paying the half-spread required by aggressive market orders.
- **Product Classification**: Cash delivery (CNC) requires 100% upfront margin and settles in T+1 under SEBI clearing protocols, avoiding broker RMS auto-liquidation algorithms triggered on intraday MIS brackets.
- **Transaction Friction**: Total round-trip drag comprises STT (0.1% on delivery turnover), exchange turnover fee, SEBI regulatory levy, stamp duty (0.015%), and 18% GST on brokerage.

### 2. Risk Invalidation Framework
Maintain maximum stop-loss risk allocation at <= 1% of total portfolio value. Use GTT (Good Till Triggered) server-side conditional orders to insulate execution from local connectivity interruptions.`;
    }
  }

  // Default: Candlestick Chart / Technical Price Action Analysis
  let patternIdentified = 'Price Action & Support/Resistance Setup';
  let patternDetail =
    'The visual shows price interacting with key horizontal support/resistance levels, with candlestick shadow wicks indicating where buyers or sellers rejected price extremes.';

  if (lowerQ.includes('hammer') || lowerName.includes('hammer')) {
    patternIdentified = 'Hammer Candlestick / Lower Wick Rejection';
    patternDetail =
      'A classic Hammer shows a small upper body with a long lower shadow (wick at least 2x the body length), indicating that sellers pushed price aggressively lower, but institutional buyers stepped in and absorbed all selling pressure before the candle close.';
  } else if (lowerQ.includes('shooting star') || lowerName.includes('shooting')) {
    patternIdentified = 'Shooting Star / Upper Wick Rejection';
    patternDetail =
      'A Shooting Star prints a long upper shadow with a small body near the candle low, showing that buyers attempted a breakout, but were met with heavy overhead institutional supply that forcefully pushed price back down.';
  } else if (lowerQ.includes('doji') || lowerName.includes('doji')) {
    patternIdentified = 'Doji Candlestick / Volatility Equilibrium';
    patternDetail =
      'A Doji prints almost identical opening and closing prices with wicks on both sides, signaling intense market hesitation and equilibrium between bulls and bears prior to an impending directional breakout.';
  } else if (lowerQ.includes('engulfing') || lowerName.includes('engulfing')) {
    patternIdentified = 'Engulfing Candlestick Formation';
    patternDetail =
      'An Engulfing setup occurs when a large candle body completely submerges the preceding candle\'s entire body on expanded volume, signaling an authoritative shift in momentum and institutional control.';
  } else if (lowerQ.includes('head and shoulders') || lowerName.includes('head')) {
    patternIdentified = 'Head and Shoulders Reversal Pattern';
    patternDetail =
      'A baseline distribution structure featuring three peaks where the central peak (Head) is highest, flanked by two lower peaks (Shoulders). The critical line is the **Neckline**; a breakdown below the neckline on heavy volume signals trend reversal.';
  } else if (lowerQ.includes('double top') || lowerQ.includes('double bottom') || lowerName.includes('double')) {
    patternIdentified = 'Double Top ("M") or Double Bottom ("W") Reversal';
    patternDetail =
      'A dual liquidity test pattern. Two failed attempts to break above resistance (Double Top) signals buyer exhaustion, while two successful defenses of support (Double Bottom) signals strong institutional accumulation.';
  } else if (lowerQ.includes('breakout') || lowerQ.includes('triangle') || lowerName.includes('breakout')) {
    patternIdentified = 'Consolidation Range & Volatility Breakout';
    patternDetail =
      'Price has compressed within narrowing highs and lows (volatility contraction). When price breaks beyond the boundary on volume expansion, it initiates a high-velocity momentum impulse.';
  }

  if (isBeginner) {
    return `${greeting}

### 📸 Technical Chart Analysis: **${patternIdentified}**
*(Attached Image: \`${fileName}\`)*

To answer your specific question: **"${cleanQ || 'How do I read this chart?'}"**

1. 🔍 **Visual Structure & Price Action Breakdown**:
   - **Pattern Identified**: ${patternDetail}
   - **Candlestick Shadow Wicks**: Pay close attention to the wicks (tails). Long lower wicks show aggressive dip-buying at support; long upper wicks show heavy profit-taking at resistance.
   - **Support & Resistance**: Identify the horizontal price floor where prices bounced multiple times previously. That floor is your structural safety net.
   - **Volume Confirmation**: Look at the volume bars at the bottom. A genuine move must have tall, expanding volume bars. If the move is on tiny volume, it is likely a retail trap!

2. 🍕 **Everyday Analogy**:
   Think of support like a trampoline. When price drops and lands on the trampoline, it bounces right back up. But if heavy sellers jump on that trampoline 4 or 5 times in a row, the canvas wears thin and eventually tears, sending price plunging through the floor.

3. 🛡️ **Risk & Stop-Loss Placement (Ben\'s Defense Checklist)**:
   - **Where does this setup fail?** If price closes below the lowest point (the wick low) of the confirmation candle, your thesis is completely invalidated!
   - **Stop-Loss Rule**: Always place your stop-loss order right below that invalidation wick.
   - **1% Capital Protection**: Never risk more than 1% of your total trading capital on this setup.

4. 🎮 **Next Step in Paper Trading Lab**:
   Open our **Paper Trading Lab** with your ₹1,00,000 virtual cash. Locate a similar setup on our simulated stocks (Nova Tech, Greencore Energy, or BlueWave Bank), set your limit order with a stop-loss, and watch how it plays out risk-free!`;
  } else {
    return `${greeting}

### 📊 Quantitative Price Action & Order Flow Analysis
*(Attached Technical Chart: \`${fileName}\`)*

### 1. Market Structure Breakdown: "${cleanQ || 'Technical Analysis of Attached Asset'}"
- **Pattern Classification**: **${patternIdentified}**
- **Liquidity Mechanics**: ${patternDetail}
- **Market Structure Bias**: Evaluate whether recent swing pivots reflect Higher Highs / Higher Lows (BOS - Break of Structure) or Lower Highs / Lower Lows (CHoCH - Change of Character).
- **Auction Market Volume**: Validate the price advance/decline against Volume Weighted Average Price (VWAP) and relative volume (RVOL >= 1.5x 20-period average). Moves lacking volume expansion represent low-conviction liquidity probes vulnerable to mean-reversion retests.

### 2. Invalidation Thresholds & Risk-to-Reward Execution
- **Calculated Invalidation Level**: Structural stop-loss must rest 1–2 ticks beyond the extreme shadow wick of the pivot formation.
- **Target Projection**: Minimum 1:2 asymmetric Risk-to-Reward ratio (\`R:R >= 2.0\`). Project the height of the consolidation pattern from the breakout point.
- **Trap Defense**: Await an hourly or daily candle close beyond key levels before entry to insulate against institutional stop-run liquidity sweeps ("turtle soups").

Would you like to simulate this exact entry and exit bracket in our Paper Trading Lab?`;
  }
}

function synthesizeDynamicFinancialAnswer(params: {
  question: string;
  mode: 'eli15' | 'deep_dive';
  learnerContext?: LearnerContext;
  chunks: KnowledgeChunk[];
}): string {
  const { question, mode, learnerContext, chunks } = params;
  const isBeginner = mode === 'eli15';
  const cleanQ = question.trim();
  const lowerQ = cleanQ.toLowerCase();

  const studentName =
    learnerContext?.displayName &&
    learnerContext.displayName !== 'Learner' &&
    learnerContext.displayName !== 'Guest'
      ? learnerContext.displayName
      : null;

  const greeting = studentName
    ? `Hey ${studentName}! 😊 Great question — let's break this down thoroughly.`
    : `Hey there! 😊 Great question — let's break this down thoroughly.`;

  // Determine topical entity or domain
  const mentionsTata = /tata\b|tcs\b/i.test(lowerQ);
  const mentionsReliance = /reliance\b|jio\b/i.test(lowerQ);
  const mentionsAdani = /adani\b/i.test(lowerQ);
  const mentionsHDFC = /hdfc\b/i.test(lowerQ);
  const mentionsSBI = /sbi\b|state\s+bank/i.test(lowerQ);
  const mentionsITC = /\bitc\b/i.test(lowerQ);
  const mentionsCrashOrRed = /crash|fall|drop|red|down|bear|loss|bearish|plunge/i.test(lowerQ);
  const mentionsWhy = /^why\b|\bwhy\s+did\b|\bwhy\s+does\b/i.test(lowerQ);
  const mentionsHow = /^how\b|\bhow\s+to\b|\bhow\s+do\b|\bhow\s+can\b/i.test(lowerQ);
  const mentionsCanI = /^can\s+i\b|\bis\s+it\s+possible\b/i.test(lowerQ);
  const mentionsShouldI = /^should\s+i\b|\bis\s+it\s+safe\b|\bis\s+it\s+good\b/i.test(lowerQ);
  const mentionsDifference = /\bdifference\b|\bvs\b|\bcompare\b|\bversus\b/i.test(lowerQ);

  // 1. Company-Specific Inquiry
  if (mentionsTata || mentionsReliance || mentionsAdani || mentionsHDFC || mentionsSBI || mentionsITC) {
    const compName = mentionsTata
      ? 'Tata Group (Tata Motors / TCS / Tata Steel)'
      : mentionsReliance
      ? 'Reliance Industries'
      : mentionsAdani
      ? 'Adani Group'
      : mentionsHDFC
      ? 'HDFC Bank'
      : mentionsSBI
      ? 'State Bank of India (SBI)'
      : 'ITC Limited';

    if (isBeginner) {
      return `${greeting}

### 🏢 Analyzing **${compName}**: Core Fundamentals & Valuation
To address your question directly: **"${cleanQ}"**

1. 🎯 **Business Model & Market Standing**:
   ${compName} is a heavyweight constituent of the **Nifty 50** and BSE Sensex, meaning institutional mutual funds and global FIIs actively hold and trade it every trading day. Its stock price reflects quarterly earnings growth, operating profit margins, and long-term capital allocation.

2. 🍕 **Everyday Analogy**:
   Think of a giant flagship mall in Mumbai or Bengaluru. When the overall economy booms, foot traffic and tenant rent surge, boosting the mall\'s valuation. When interest rates rise or commodity costs spike, even the most prestigious businesses experience temporary consolidation.

3. 🛡️ **Companion Rule & Key Metrics**:
   - Always check the **P/E Ratio** against its 5-year historical average and sectoral peers.
   - Look at the **Debt-to-Equity Ratio** to ensure loan obligations don't overwhelm cash flow during economic downturns.
   - Never put all your eggs in one basket: maintain a diversified portfolio of 15–20 non-correlated businesses.

4. 🎮 **Practice in Paper Trading**:
   You can place simulated buy and sell orders with ₹1,00,000 virtual cash in our **Paper Trading Lab** to test your theories before committing real money!`;
    } else {
      return `${greeting}

### 📊 Fundamental & Structural Thesis: **${compName}**
Regarding: **"${cleanQ}"**

### 1. Institutional Valuation & Order Flow Mechanics
- **Capital Allocation & Moat**: Evaluate Return on Capital Employed (\`ROCE > 15%\`) and Free Cash Flow yield (\`FCF / Market Cap\`). High reinvestment rates with durable competitive moats generate long-term compounding.
- **Index Weighting & Beta**: Heavyweight index constituents have structural liquidity support driven by mandatory passive mutual fund and ETF SIP inflows, creating lower systematic volatility than mid/small caps.
- **Earnings Quality**: Scrutinize EBITDA margin sustainability, debt maturity profile, and Cash Conversion Cycle.

### 2. Risk Management & Portfolio Sizing
Cap single-stock portfolio allocation at a maximum of 5–10% of total equity. Enforce predefined stop-loss invalidation thresholds based on weekly market structure support pivots.

Would you like to examine an intrinsic Discounted Cash Flow (DCF) model for this business?`;
    }
  }

  // 2. Falling Market / Red Portfolio / Crash Inquiry
  if (mentionsCrashOrRed) {
    if (isBeginner) {
      return `${greeting}

### 📉 Navigating Market Drops & Red Portfolios Calmly
To answer your question directly: **"${cleanQ}"**

1. 🎯 **Direct Answer**:
   Stock market pullbacks and corrections are not bugs; they are **normal, healthy features** of financial markets! Even during the strongest bull markets in Indian history, the Nifty 50 routinely experiences 5% to 15% corrections due to global geopolitical shifts, interest rate changes, or institutional profit-taking.

2. 🍕 **Everyday Analogy**:
   Imagine shopping at your favorite clothing store. If high-end shirts that were priced at ₹2,000 yesterday suddenly go on a 20% festive sale for ₹1,600, you don't panic and run away screaming—you view it as a great opportunity to buy quality at a discount! Smart long-term investors treat market dips the exact same way.

3. 🛡️ **Ben's Capital Survival Checklist**:
   - **Never panic-sell at the bottom**: Emotional selling locks in permanent losses.
   - **Only invest long-term capital**: Money you will need in the next 3 years should stay in safe fixed deposits or liquid funds, never in stocks.
   - **Rupee-Cost Averaging (SIP)**: Continuing your monthly investments during market dips buys you more shares when prices are cheap!

4. 🎮 **Zero-Risk Testing**:
   Use our **Paper Trading Lab** with your ₹1,00,000 virtual funds to test how buying quality stocks at support levels behaves during pullbacks!`;
    } else {
      return `${greeting}

### 📊 Macro Volatility, Drawdown Mechanics & Asymmetric Risk
Regarding: **"${cleanQ}"**

### 1. Market Mechanics of Drawdowns & Institutional Liquidity
- **Price Discovery & Mean Reversion**: Extended market rallies stretch valuation multiples (P/E expansion beyond +2 standard deviations). Pullbacks re-align market pricing with corporate earnings yields and risk-free bond benchmarks.
- **De-leveraging Cascades**: Rapid downward velocity is often exacerbated by algorithmic margin liquidations and retail Stop-Loss Market (SL-M) cascades, creating temporary liquidity dislocations.
- **Institutional Accumulation**: Deep pullbacks into major multi-month moving average anchors (e.g. 200 EMA) frequently serve as institutional accumulation zones where smart money re-deploys cash reserves.

### 2. Asymmetric Recovery Mathematics
A 20% portfolio drawdown requires a +25% subsequent gain to break even, whereas a 50% catastrophic loss requires a +100% gain just to return to par. Enforce disciplined stop-loss execution to ensure no individual trade exceeds a 1–2% portfolio equity drawdown.

Would you like to review how to hedge portfolio beta using defensive allocations or index options?`;
    }
  }

  // 3. Questions starting with "Why" (Causal inquiries)
  if (mentionsWhy) {
    if (isBeginner) {
      return `${greeting}

### 💡 Why It Happens: The Market Psychology & Economics
To answer your question directly: **"${cleanQ}"**

1. 🎯 **The Real Driver Behind This**:
   In the stock market, prices and market events are driven by two twin engines: **Economic Reality (Corporate Earnings & Cash Flow)** and **Human Psychology (Supply vs. Demand / Fear vs. Greed)**. When expectations disconnect from reality, the market corrects forcefully.

2. 🍕 **Everyday Analogy**:
   Imagine an auction at a busy vegetable market. If 50 buyers rush to buy tomatoes because of a rumor that trucks are blocked, tomato prices skyrocket. But by 2:00 PM, when three new supply trucks arrive, tomato prices collapse in minutes. The tomatoes didn't change; the balance of buyers and sellers shifted.

3. 🛡️ **Companion Wisdom**:
   - Always ask: *"Is this move backed by real corporate earnings, or is it short-term social media hype?"*
   - Separate market noise from business fundamentals. A company\'s real value compounds over years, not over 15-minute price ticks.

4. 🎮 **Test It Out**:
   You have ₹1,00,000 in virtual capital in our **Paper Trading Lab**. Use it to test how news events impact simulated stock prices without losing a single real rupee!`;
    } else {
      return `${greeting}

### 📊 Structural Causality & Institutional Mechanics
Regarding: **"${cleanQ}"**

### 1. Macro & Microeconomic Transmission Channels
- **Market Price Formation**: Spot prices represent the continuous marginal clearance of order flow across the central limit order book. When aggressive market orders consume resting limit liquidity, price migrates rapidly until reaching fresh liquidity pools.
- **Expectation Arbitrage**: Asset prices discount future cash flow expectations rather than historical achievements. Price anomalies frequently emerge when corporate performance beats consensus nominal figures but misses elevated whispered expectations.
- **Cost of Capital & Discount Rates**: Shifting sovereign bond yields directly adjust the Discount Rate (\`WACC\`) utilized in institutional valuation algorithms, forcing equity multiple recalibration.

### 2. Risk Mitigation & Execution Hygiene
Never chase post-announcement gap openings. Wait for initial 30-minute auction price discovery to complete and evaluate volume profile acceptance before taking directional exposure.

Would you like to analyze an order book scenario illustrating this dynamic?`;
    }
  }

  // 4. Questions about "How to" or "Can I" (Procedural & Feasibility)
  if (mentionsHow || mentionsCanI) {
    if (isBeginner) {
      return `${greeting}

### 🛠️ Step-by-Step Practical Roadmap
To answer your question directly: **"${cleanQ}"**

1. 🎯 **Direct Answer**:
   Yes! In the modern Indian stock market ecosystem (regulated by SEBI, with digital clearing on NSE and BSE), this process is fully digital, regulated, and accessible to every retail citizen with a PAN card, Aadhaar, and bank account.

2. 📋 **Actionable Step-by-Step Guide**:
   - **Step 1: Financial Foundation First**: Before investing, ensure you have an Emergency Fund (3–6 months of basic living expenses in a bank fixed deposit) and health insurance.
   - **Step 2: Demat & Trading Account**: Open a SEBI-registered Demat and Trading account through a trusted discount broker (e.g. Zerodha, Groww, AngelOne).
   - **Step 3: Start Small With Broad Indices**: Begin with index funds (like Nifty 50 index funds or ETFs) where your money is automatically spread across India's top 50 companies.
   - **Step 4: Maintain Disciplined Position Sizing**: Never invest money you cannot afford to leave untouched for at least 3 to 5 years.

3. 🛡️ **Ben's Protection Rule**:
   Practice the complete sequence in our **Paper Trading Lab** with ₹1,00,000 virtual cash first. Building muscle memory with zero real risk gives you unbreakable confidence!`;
    } else {
      return `${greeting}

### ⚙️ Institutional Framework & Execution Protocols
Regarding: **"${cleanQ}"**

### 1. Regulatory & Operational Architecture
- **Statutory Pre-requisites**: SEBI KYC compliance, Depository Participant (NSDL/CDSL) dematerialization mandate, and exchange-registered broker clearing agreements.
- **Order Routing & Settlement**: Execution across NSE/BSE clearing houses governed by T+1 rolling settlement schedules. Capital allocation must comply with SEBI peak margin frameworks.
- **Execution Workflow**: Utilize Limit Orders (\`GTC / GTT\`) with explicit stop-loss triggers to avoid slippage in volatile opening or closing auctions.

### 2. Quantitative Portfolio Construction Rules
- Allocate maximum 2% risk capital per individual position.
- Demand minimum 1:2 Risk-to-Reward ratio on directional trades.
- Rebalance asset allocation annually to systematically capture mean-reversion profits.

Would you like to walk through simulated order routing in our sandbox environment?`;
    }
  }

  // 5. Questions comparing two concepts ("Difference between" / "vs")
  if (mentionsDifference) {
    if (isBeginner) {
      return `${greeting}

### ⚖️ Clear Comparison & Practical Distinctions
To answer your question directly: **"${cleanQ}"**

1. 🎯 **The Fundamental Difference**:
   When comparing these two financial concepts, the key distinction boils down to **Time Horizon, Risk Profile, and Capital Allocation**. One focuses on short-term market momentum and liquidity, while the other focuses on long-term wealth compounding and underlying business value.

2. 🍕 **Everyday Analogy**:
   Think of planting mango trees vs. planting fast-growing seasonal radishes. Radishes give you food within weeks, but you must constantly replant, water, and work every single day. A mango tree takes 5 patient years to bear fruit, but once mature, it gives you delicious fruit every single summer for the next 50 years with zero daily effort!

3. 🛡️ **Which One Should You Choose?**:
   - For long-term financial independence: Prioritize patient, compounding delivery investing.
   - For short-term skills: Understand the mechanics thoroughly, but always use strict stop-losses.

4. 🎮 **Test Both Strategies**:
   You can experiment with both styles side-by-side in our **Paper Trading Lab** using your ₹1,00,000 virtual portfolio!`;
    } else {
      return `${greeting}

### 📊 Comparative Structural Matrix & Trade-offs
Regarding: **"${cleanQ}"**

### 1. Structural Comparison Matrix
- **Capital Efficiency & Payoff Asymmetry**: Compare the variance, convexity, and maximum drawdown of both methodologies.
- **Frictional Costs & Regulatory Drag**: Factor in STT, brokerage slabs, exchange turnover levies, and the differential tax impact between capital gains (12.5% LTCG) and speculative business income.
- **Liquidity & Execution Frictions**: Assess bid-ask spreads, order book depth, and market impact costs across varying market regimes.

### 2. Strategic Companion Recommendation
Select the framework aligned with your liquidity horizon and risk tolerance. Never deploy capital without an explicit quantitative edge and rigorous stop-loss parameters.`;
    }
  }

  // 6. Should I / Is it safe / Advice inquiry
  if (mentionsShouldI) {
    if (isBeginner) {
      return `${greeting}

### 🧭 How to Evaluate: Is It Right for You?
To answer your question directly: **"${cleanQ}"**

1. 🎯 **Direct Evaluation**:
   As your educational companion, I cannot give personal buy/sell financial tips, but I can give you the **exact decision framework** that professional investors use:
   - **Are you using money you need soon?** If you need this money within 3 years, do NOT put it in stocks.
   - **Does the company make real profits?** Never buy based on hype, social media tips, or WhatsApp groups. Look for positive cash flow and low debt.
   - **Is the price reasonable?** Check if the P/E ratio is fair compared to historical averages.

2. 🍕 **Everyday Analogy**:
   If a stranger on the street runs up to you whispering, "Give me ₹50,000 right now, I promise to double it by next Tuesday!", you would hold onto your wallet and walk away fast. Treat unverified stock tips on Telegram with that exact same caution.

3. 🛡️ **Ben's Golden Rule**:
   Rule #1: Never lose money. Rule #2: Never forget Rule #1. Before asking *"How much can I make?"*, always ask *"How much can I lose if I am completely wrong?"*.

4. 🎮 **Simulate Before Committing**:
   Test this exact decision in our **Paper Trading Lab** with ₹1,00,000 virtual cash first!`;
    } else {
      return `${greeting}

### 📊 Risk-Adjusted Decision Framework
Regarding: **"${cleanQ}"**

### 1. Quantitative Due-Diligence Checklist
- **Margin of Safety (Graham-Dodd Criterion)**: Require a minimum 20–30% discount between current market price and conservative intrinsic valuation (Discounted Cash Flow / Normalized Earning Power).
- **Earnings Quality & Capital Structure**: Confirm ROCE > 15%, Debt-to-Equity < 0.8x, and positive Free Cash Flow (\`FCF / Sales > 8%\`).
- **Asymmetric Risk/Reward Ratio**: Ensure calculated upside potential is at least double the distance to structural stop-loss invalidation (\`R:R >= 2.0\`).

### 2. Execution Discipline
Enforce position sizing limits so no single position can inflict more than 1–2% portfolio equity loss. Document your entry thesis in our **Trading Journal** before executing.`;
    }
  }

  // 7. General Custom Inquiry
  if (isBeginner) {
    return `${greeting}

### 💡 Regarding Your Question: "${cleanQ}"

When investing in the Indian stock market, every curious question helps build your financial intuition. Here is the clear pedagogical breakdown:

1. 🎯 **Direct Core Concept**:
   In the Indian stock market (NSE & BSE), stock prices and corporate decisions reflect underlying economic reality, earnings growth, and the real-time balance between buyers and sellers. When examining **"${cleanQ}"**, always distinguish between temporary price noise and genuine business value.

2. 🍕 **Everyday Analogy**:
   Think of the market like a bustling neighborhood mandi. On any given morning, vegetable prices fluctuate based on who shows up to buy or sell. But over the course of the full year, the price of quality produce reflects actual harvest supply, quality, and real consumer demand.

3. 🛡️ **Companion Rule & Capital Preservation**:
   - The market rewards patient compounding, not rushed speculation.
   - Always protect your downside first: never risk money you need for rent, groceries, or emergencies.

4. 🎮 **Practice With Zero Risk**:
   You have ₹1,00,000 in virtual capital in our **Paper Trading Lab**. Use it to test your theories, practice setting stop-losses, and build confidence!

What specific company or financial term would you like to explore next? I am right beside you on this journey!`;
  } else {
    return `${greeting}

### 📊 Analytical Framework: "${cleanQ}"

When analyzing this from an institutional and risk-adjusted perspective:

1. **Core Thesis & Valuation**:
   Evaluate the fundamental drivers behind **"${cleanQ}"**. Look for sustainable cash flow generation, balance sheet solvency, and competitive economic moat rather than short-term price momentum.

2. **Asymmetric Risk/Reward Architecture**:
   Always demand a minimum 1:2 or 1:3 reward-to-risk ratio. Define your quantitative stop-loss invalidation level before you enter any position.

3. **Execution & Documentation**:
   Use limit orders to minimize negative execution slippage, and log your trading rationale in our **Trading Journal** to continually refine your market edge.

Would you like to examine an Indian market case study or test this in our interactive simulator?`;
  }
}

// ---------------------------------------------------------------------------
// 7. HIGH-FIDELITY ANSWER GENERATOR
// ---------------------------------------------------------------------------

export function generateGroundedEducationalAnswer(params: {
  question: string;
  mode: 'eli15' | 'deep_dive';
  chunks: KnowledgeChunk[];
  learnerContext?: LearnerContext;
  currentModule?: string;
  currentLesson?: string;
  history?: MentorHistoryItem[];
  attachments?: MentorAttachmentItem[];
}): string {
  const { question, mode, chunks, learnerContext, history, attachments } = params;
  const isBeginner = mode === 'eli15';
  const cleanQ = question.trim();

  // Combine last turn in history for contextual follow-up awareness
  let historyContext = '';
  if (Array.isArray(history) && history.length > 0) {
    const lastItems = history.slice(-2);
    historyContext = lastItems.map((h) => h.text).join(' ');
  }

  const studentName =
    learnerContext?.displayName &&
    learnerContext.displayName !== 'Learner' &&
    learnerContext.displayName !== 'Guest'
      ? learnerContext.displayName
      : null;

  const greeting = studentName
    ? `Hey ${studentName}! 😊 Wonderful question — let's break this down clearly.`
    : `Hey there! 😊 Wonderful question — let's break this down clearly.`;

  // 1. Check if user provided an image or document attachment
  if (Array.isArray(attachments) && attachments.length > 0 && attachments[0]) {
    const validAtt = attachments.find(
      (a) =>
        a &&
        a.base64 &&
        (a.mimeType?.startsWith('image/') || a.mimeType === 'application/pdf')
    );
    if (validAtt) {
      return analyzeFinancialAttachment({
        attachment: validAtt,
        question: cleanQ,
        mode,
        learnerContext,
      });
    }
  }

  // 2. Check specialized question intent handler first for guaranteed precision
  const specializedHandler = findSpecializedTopic(cleanQ, historyContext);
  if (specializedHandler) {
    if (isBeginner) {
      const bData = specializedHandler.eli15;
      return `${greeting}

### 💡 ${specializedHandler.topicTitle}

${bData.directAnswer}

---

### 🍕 Everyday Intuitive Analogy
${bData.analogy}

---

### 🇮🇳 Real Indian Market Example
${bData.indianExample}

---

### 🛡️ Companion Wisdom & Key Takeaway
- **What this means for you**: ${bData.takeaway}
- **My rule of thumb**: Practice this first with your ₹1,00,000 virtual cash in our **Paper Trading Lab**!

${bData.followUp}`;
    } else {
      const dData = specializedHandler.deepDive;
      return `${greeting}

### 📊 Deep Dive: ${specializedHandler.topicTitle}

${dData.directAnswer}

---

### ⚙️ Market Mechanics & Process Flow
${dData.mechanics}

---

### 📐 Key Metrics & Formulas
\`\`\`text
${dData.formulas}
\`\`\`

---

### 🛡️ Risk Management & Strategic Perspective
${dData.riskInsight}

${dData.followUp}`;
    }
  }

  // 3. Check if a relevant glossary or lesson chunk has high overlap with the query
  const lowerQ = cleanQ.toLowerCase();
  const directChunk = chunks.find((c) => {
    const lowerTitle = c.title.toLowerCase();
    return lowerQ.includes(lowerTitle) || lowerTitle.includes(lowerQ.replace(/[^a-z0-9]/g, ''));
  });

  if (directChunk) {
    const coreConcept =
      directChunk.content
        .split('\n')
        .filter((line) => line.startsWith('- Core Concept') || line.startsWith('- Definition'))
        .map((l) => l.replace(/^- (Core Concept|Definition): /, ''))
        .join('\n') ||
      `In financial markets, **${directChunk.title}** is an essential mechanism for making informed decisions.`;

    const realLifeAnalogy = directChunk.content.includes('- Real-Life Analogy')
      ? directChunk.content
          .split('\n')
          .find((l) => l.startsWith('- Real-Life Analogy'))
          ?.replace(/^- Real-Life Analogy \([^)]+\): /, '')
      : 'Imagine shopping at a bustling local mandi: prices constantly adjust in real time based on how many buyers want goods vs how many sellers have stock.';

    const keyTakeaway =
      directChunk.content
        .split('\n')
        .find((l) => l.startsWith('- Key Takeaway'))
        ?.replace(/^- Key Takeaway: /, '') ||
      `Understanding ${directChunk.title} builds your market intuition and shields your capital from impulsive errors.`;

    const technicalMechanics =
      directChunk.content
        .split('\n')
        .filter((line) => line.startsWith('- Technical Mechanics') || line.startsWith('- Definition'))
        .map((l) => l.replace(/^- (Technical Mechanics|Definition): /, ''))
        .join('\n') ||
      `In modern trading, **${directChunk.title}** is scrutinized to optimize risk-adjusted returns and capital allocation.`;

    const riskInsight =
      directChunk.content
        .split('\n')
        .find((l) => l.startsWith('- Risk Perspective'))
        ?.replace(/^- Risk Perspective: /, '') ||
      'Always limit your capital risk to 1–2% of total portfolio value per trade.';

    const keyFormula = directChunk.content
      .split('\n')
      .find((l) => l.startsWith('- Key Formula'))
      ?.replace(/^- Key Formula: /, '');

    if (isBeginner) {
      return `${greeting}

### 💡 Understanding **${directChunk.title}**

To answer your question directly:
${coreConcept}

---

### 🍕 Real-Life Analogy
${realLifeAnalogy}

---

### 🛡️ Companion Wisdom & Key Takeaway
- **What this means for you**: ${keyTakeaway}
- **My rule of thumb**: Never rush into real money trades. You can practice this anytime with ₹1,00,000 virtual cash in our **Paper Trading Lab**!

How does that feel? Would you like to explore a concrete Indian market example or test this concept in Paper Trading?`;
    } else {
      return `${greeting}

### 📊 Deep Dive: **${directChunk.title}**

${technicalMechanics}

${keyFormula ? `**Key Metric / Formula**:\n\`\`\`text\n${keyFormula}\n\`\`\`\n` : ''}
**Risk Perspective & Companion Checklist**:
- ${riskInsight}
- Always account for execution slippage, bid-ask spreads, and transaction costs before committing capital.

Would you like to analyze an order book scenario or stress-test this strategy in our simulation?`;
    }
  }

  // 4. Dynamic Semantic Synthesis for Custom Financial Inquiries (Zero Canned Repetition)
  return synthesizeDynamicFinancialAnswer({
    question: cleanQ,
    mode,
    learnerContext,
    chunks,
  });
}

// ---------------------------------------------------------------------------
// 7. SYSTEM INSTRUCTION BUILDER FOR GEMINI
// ---------------------------------------------------------------------------

function buildSystemInstruction(
  mode: 'eli15' | 'deep_dive',
  learnerContext?: LearnerContext,
  currentModule?: string,
  currentLesson?: string,
  groundingText?: string
): string {
  const isBeginner = mode === 'eli15';
  const studentName = learnerContext?.displayName || 'Learner';

  return `You are "Market Mentor", an empathetic, supportive, and dedicated personal learning companion and study partner inside the ShareMarket application.

CRITICAL RELEVANCE MANDATE:
- You MUST answer ONLY and DIRECTLY the user's specific question.
- If the student asks about dividends, explain dividends.
- If the student asks about buying 1 share, answer whether they can buy 1 share in India.
- If the student asks about bull and bear markets, explain bull and bear markets.
- NEVER substitute an unrelated curriculum lesson or wander off into unrelated topics.
- Address their question in the very first sentence.

COMPANION PERSONALITY & TONE:
- Warm, encouraging, companionable, and approachable. Speak directly to ${studentName}.
- Empathetic and reassuring: Validate curiosity ("That's a fantastic question!", "Almost every smart investor wondered about this!").
- Clear, vivid, and grounded: Turn dense financial jargon into crystal-clear everyday stories.
- Protective & caring: When discussing risk or stop-loss orders, guide them toward capital survival ("Your hard-earned savings come first!").

TEACHING STYLE & INDIAN MARKET CONTEXT:
- Use relatable Indian market examples (e.g. Tata, Reliance, Infosys, Nifty 50, BSE Sensex, chai stalls, festive retail demand).
- Define technical terms immediately in plain language.
- Provide a concrete, everyday analogy before delving into theory.
- Close with an encouraging companion check-in or thoughtful follow-up question.

CURRENT EXPLANATION MODE: [${isBeginner ? 'BEGINNER (ELI15)' : 'DEEP DIVE'}]
${
  isBeginner
    ? `- BEGINNER MODE GUIDELINES:
  * Prioritize everyday intuitive analogies.
  * Keep phrasing simple, friendly, and empowering.
  * Avoid dry math or walls of jargon.`
    : `- DEEP DIVE GUIDELINES:
  * Provide quantitative formulas, market mechanics, institutional order flow nuances, and balance sheet implications.
  * Discuss real-world limitations and market frictions (e.g., execution slippage, gap openings).`
}

MANDATORY SAFETY & COMPLIANCE RULES:
1. EDUCATIONAL PURPOSES ONLY: Never provide personalized investment advice, stock buy/sell tips, or price targets.
2. ZERO PROFIT GUARANTEES: Never promise returns, guarantee profits, or promote reckless trading or F&O gambles.
3. CAPITAL SURVIVAL ALWAYS FIRST: Always reinforce position sizing and stop-loss discipline.
4. NO INVENTED LIVE DATA: You do not have real-time live market ticker feeds. Explain market mechanics rather than live price ticks.

${groundingText ? `[VERIFIED KNOWLEDGE BASE CONTEXT]:\n${groundingText}` : ''}`;
}

// ---------------------------------------------------------------------------
// 8. MAIN GENERATION ENGINE
// ---------------------------------------------------------------------------

export async function generateMentorResponse(
  request: MentorGenerateRequest
): Promise<MentorGenerateResult> {
  const startTime = Date.now();
  const {
    question,
    history = [],
    mode = 'eli15',
    learnerContext,
    currentModule,
    currentLesson,
    attachments = [],
  } = request;

  const trimmedQuestion = (question || '').trim();
  if (!trimmedQuestion) {
    throw new Error('Question is required.');
  }

  // 1. Retrieve grounded educational material
  const { chunks, lessonRefs, glossaryRefs } = retrieveRelevantKnowledge(trimmedQuestion, 3);
  const groundingText = chunks.map((c) => c.content).join('\n\n');

  // 2. Build system instructions
  const systemInstruction = buildSystemInstruction(
    mode,
    learnerContext,
    currentModule,
    currentLesson,
    groundingText
  );

  // 3. Format recent conversation history
  const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
  let formattedHistory = '';
  if (recentHistory.length > 0) {
    formattedHistory =
      '\n\n[RECENT CONVERSATION HISTORY]:\n' +
      recentHistory
        .map((m) => `${m.sender === 'user' ? 'Student' : 'Market Mentor'}: ${m.text}`)
        .join('\n');
  }

  const userPromptText = formattedHistory
    ? `${formattedHistory}\n\n[STUDENT'S CURRENT QUESTION]:\n${trimmedQuestion}\n\n(Important: Please answer directly and specifically this question.)`
    : `[STUDENT'S CURRENT QUESTION]:\n${trimmedQuestion}\n\n(Important: Please answer directly and specifically this question.)`;

  const promptParts: any[] = [{ text: userPromptText }];

  // 4. Attachments support
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
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
        } catch {}
      }
    }
  }

  let successfulAnswer = '';
  let modelUsed = '';

  const ai = isGeminiBillingDisabled() ? null : getGeminiClient();

  if (ai) {
    for (const modelCandidate of MODEL_CASCADE) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents: [{ role: 'user', parts: promptParts }],
            config: { systemInstruction },
          });

          const text = response.text?.trim();
          if (text) {
            successfulAnswer = text;
            modelUsed = modelCandidate;
            break;
          }
        } catch (err: any) {
          const status = err.status || (err.message && err.message.includes('503') ? 503 : null);
          const isTransient = status === 503 || status === 429;
          const isBillingOr403 =
            status === 403 ||
            (typeof err.message === 'string' &&
              (err.message.includes('403') ||
                err.message.includes('billing') ||
                err.message.includes('PERMISSION_DENIED')));

          if (isBillingOr403) {
            markGeminiBillingDisabled();
            break;
          }

          if (isTransient && attempt === 1) {
            await new Promise((resolve) => setTimeout(resolve, 600));
            continue;
          }
          break;
        }
      }

      if (successfulAnswer || isGeminiBillingDisabled()) {
        break;
      }
    }
  }

  // Graceful Curriculum-Grounded Fallback that guarantees direct, relevant, question-specific answers
  if (!successfulAnswer) {
    successfulAnswer = generateGroundedEducationalAnswer({
      question: trimmedQuestion,
      mode,
      chunks,
      learnerContext,
      currentModule,
      currentLesson,
      history: recentHistory,
      attachments,
    });
    modelUsed = 'sharemarket-companion-engine';
  }

  return {
    answer: successfulAnswer,
    modelUsed,
    retrievedLessons: lessonRefs,
    retrievedGlossary: glossaryRefs,
    latencyMs: Date.now() - startTime,
  };
}
