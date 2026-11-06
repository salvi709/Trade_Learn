import { FictionalStock, RedFlagScenario, WhatWouldYouDoScenario, GlossaryTerm } from '../types';

export const FICTIONAL_STOCKS: FictionalStock[] = [
  {
    symbol: 'NOVA',
    name: 'Nova Tech Cloud',
    sector: 'Enterprise Software & Cloud',
    currentPrice: 742.50,
    change: 14.20,
    changePercent: 1.95,
    marketCap: '₹74,250 Cr',
    peRatio: 28.4,
    pbRatio: 4.8,
    roe: '21.5%',
    eps: 26.15,
    high52w: 820.00,
    low52w: 530.00,
    description: 'A simulated high-growth enterprise SaaS company providing automated data pipeline solutions.',
    revenue: '₹12,400 Cr',
    netProfit: '₹2,680 Cr',
    debtToEquity: 0.12,
    priceHistory: [
      { time: '09:15', price: 728.30, volume: 15400 },
      { time: '10:30', price: 732.10, volume: 22000 },
      { time: '11:45', price: 738.00, volume: 18500 },
      { time: '13:00', price: 736.40, volume: 14200 },
      { time: '14:15', price: 741.00, volume: 31000 },
      { time: '15:30', price: 742.50, volume: 42000 }
    ]
  },
  {
    symbol: 'GREENCORE',
    name: 'Greencore Clean Energy',
    sector: 'Renewables & Power',
    currentPrice: 388.20,
    change: -4.60,
    changePercent: -1.17,
    marketCap: '₹38,820 Cr',
    peRatio: 36.2,
    pbRatio: 3.9,
    roe: '14.2%',
    eps: 10.72,
    high52w: 440.00,
    low52w: 260.00,
    description: 'Simulated utility-scale solar and wind developer with high capital expenditures and long-term supply contracts.',
    revenue: '₹8,900 Cr',
    netProfit: '₹950 Cr',
    debtToEquity: 1.15,
    priceHistory: [
      { time: '09:15', price: 392.80, volume: 21000 },
      { time: '10:30', price: 390.10, volume: 16500 },
      { time: '11:45', price: 387.40, volume: 19800 },
      { time: '13:00', price: 386.00, volume: 12400 },
      { time: '14:15', price: 389.10, volume: 24000 },
      { time: '15:30', price: 388.20, volume: 30500 }
    ]
  },
  {
    symbol: 'URBAN',
    name: 'UrbanMart Retail',
    sector: 'Consumer Discretionary & Grocery',
    currentPrice: 1215.00,
    change: 8.50,
    changePercent: 0.70,
    marketCap: '₹1,21,500 Cr',
    peRatio: 42.1,
    pbRatio: 7.2,
    roe: '24.8%',
    eps: 28.85,
    high52w: 1350.00,
    low52w: 980.00,
    description: 'Simulated nationwide supermarket and hypermarket chain known for high inventory turnover and thin margins.',
    revenue: '₹48,200 Cr',
    netProfit: '₹2,885 Cr',
    debtToEquity: 0.05,
    priceHistory: [
      { time: '09:15', price: 1206.50, volume: 8400 },
      { time: '10:30', price: 1210.00, volume: 11200 },
      { time: '11:45', price: 1218.40, volume: 14600 },
      { time: '13:00', price: 1214.00, volume: 9200 },
      { time: '14:15', price: 1212.80, volume: 12500 },
      { time: '15:30', price: 1215.00, volume: 18400 }
    ]
  },
  {
    symbol: 'BLUEWAVE',
    name: 'BlueWave Banking & Finance',
    sector: 'Financial Services',
    currentPrice: 852.40,
    change: 18.90,
    changePercent: 2.27,
    marketCap: '₹95,200 Cr',
    peRatio: 16.5,
    pbRatio: 2.1,
    roe: '17.6%',
    eps: 51.66,
    high52w: 910.00,
    low52w: 690.00,
    description: 'Simulated private sector banking franchise with steady loan book expansion and low non-performing assets.',
    revenue: '₹31,400 Cr',
    netProfit: '₹5,750 Cr',
    debtToEquity: 3.40,
    priceHistory: [
      { time: '09:15', price: 833.50, volume: 34000 },
      { time: '10:30', price: 842.00, volume: 29000 },
      { time: '11:45', price: 846.50, volume: 21000 },
      { time: '13:00', price: 848.20, volume: 17500 },
      { time: '14:15', price: 851.00, volume: 28000 },
      { time: '15:30', price: 852.40, volume: 46000 }
    ]
  },
  {
    symbol: 'MEDIXA',
    name: 'Medixa Healthcare',
    sector: 'Pharma & Biotech',
    currentPrice: 512.10,
    change: -2.30,
    changePercent: -0.45,
    marketCap: '₹25,600 Cr',
    peRatio: 22.8,
    pbRatio: 3.4,
    roe: '15.9%',
    eps: 22.46,
    high52w: 580.00,
    low52w: 420.00,
    description: 'Simulated generic drug and active pharmaceutical ingredient (API) manufacturer with global export compliance.',
    revenue: '₹6,450 Cr',
    netProfit: '₹1,120 Cr',
    debtToEquity: 0.28,
    priceHistory: [
      { time: '09:15', price: 514.40, volume: 9200 },
      { time: '10:30', price: 511.00, volume: 12000 },
      { time: '11:45', price: 509.80, volume: 8900 },
      { time: '13:00', price: 513.20, volume: 7400 },
      { time: '14:15', price: 511.50, volume: 11400 },
      { time: '15:30', price: 512.10, volume: 15600 }
    ]
  },
  {
    symbol: 'SOLARIS',
    name: 'Solaris Precision Systems',
    sector: 'Industrial Engineering',
    currentPrice: 245.80,
    change: 5.60,
    changePercent: 2.33,
    marketCap: '₹14,750 Cr',
    peRatio: 19.4,
    pbRatio: 2.8,
    roe: '18.1%',
    eps: 12.67,
    high52w: 275.00,
    low52w: 180.00,
    description: 'Simulated robotics and automated factory sensor equipment provider with rising order backlogs.',
    revenue: '₹3,800 Cr',
    netProfit: '₹760 Cr',
    debtToEquity: 0.35,
    priceHistory: [
      { time: '09:15', price: 240.20, volume: 14500 },
      { time: '10:30', price: 242.80, volume: 19000 },
      { time: '11:45', price: 244.10, volume: 16200 },
      { time: '13:00', price: 243.50, volume: 11000 },
      { time: '14:15', price: 246.20, volume: 22500 },
      { time: '15:30', price: 245.80, volume: 31000 }
    ]
  }
];

export const RED_FLAG_SCENARIOS: RedFlagScenario[] = [
  {
    id: 'scam_1',
    title: 'The "Secret VIP" WhatsApp Stock Tips Group',
    channel: 'WhatsApp Notification',
    sender: '+91 98765-XXXXX (VIP Wealth Club)',
    message: '🔥 SURESHOT JACKPOT CALL! Buy XYZ Microcap tomorrow at 9:15 AM! Targeted 300% return in 5 days! Operators are buying. Join our VIP Premium Channel for ₹9,999/month. 100% Guaranteed Accuracy! 🚀',
    verdict: 'HIGH_RISK',
    explanation: 'No legitimate investor or analyst can guarantee returns, let alone 300% in 5 days. This matches classic pump-and-dump scheme patterns targeting illiquid stocks.',
    clues: [
      'Claims of "100% Guaranteed Accuracy" (markets never guarantee profits)',
      'Artificial urgency ("Buy tomorrow at 9:15 AM")',
      'Unregistered tips channel asking for paid subscriptions',
      'Mention of "operators" orchestrating price movements'
    ]
  },
  {
    id: 'scam_2',
    title: 'The "Double Your Money in 48 Hours" Crypto Bot',
    channel: 'Telegram Direct Message',
    sender: '@Official_Global_Arbitrage_Desk',
    message: 'Hello sir, deposit ₹25,000 into our automated AI arbitrage pool. Receive ₹50,000 directly back to your bank account in 48 hours without any market risk. Over 10,000 satisfied users!',
    verdict: 'HIGH_RISK',
    explanation: 'Doubling money in 48 hours is a mathematical impossibility in sound financial markets. This is a Ponzi or upfront-fee theft scheme.',
    clues: [
      'Promise of "No market risk"',
      'Absurdly short doubling timeframe (48 hours)',
      'Direct peer-to-peer deposit requests without a licensed depository or broker',
      'Unsolicited direct messaging'
    ]
  },
  {
    id: 'scam_3',
    title: 'Official SEBI-Registered Broker Educational Newsletter',
    channel: 'Email Newsletter',
    sender: 'research@licensed-brokerage.com',
    message: 'Weekly Market Digest: Overview of corporate quarterly earnings, RBI monetary policy committee preview, and macroeconomic inflation metrics. Investments in securities market are subject to market risks. Read all scheme related documents carefully before investing.',
    verdict: 'SAFE',
    explanation: 'This email contains educational analysis, discusses economic data calmly, does not promise profits, and clearly displays mandatory statutory risk disclaimers.',
    clues: [
      'Official registered domain with verified credentials',
      'No promise of guaranteed profits or magic systems',
      'Explicit statutory risk warnings included',
      'Focuses on macroeconomic context and corporate reports'
    ]
  },
  {
    id: 'scam_4',
    title: 'Screenshot of "₹18,00,000 Daily Profit" on Instagram Reels',
    channel: 'Instagram Sponsored Post',
    sender: '@Trader_King_Superstar',
    message: 'Made ₹18 Lakhs before 10 AM sipping chai! ☕ You are poor because you work a 9-to-5 job. Buy my masterclass algorithm course today for 90% discount. Limited slots left!',
    verdict: 'SUSPICIOUS',
    explanation: 'Flashy lifestyle marketing using inspect-element modified screenshots or paper-trading accounts is widely used by course sellers who make money from course fees, not actual trading.',
    clues: [
      'Emotional manipulation shaming regular honest employment',
      'Flashy screenshots that can easily be faked or inspected',
      'Manufactured artificial scarcity ("limited slots")',
      'Hiding the fact that trading involves severe drawdowns'
    ]
  }
];

export const WHAT_WOULD_YOU_DO_SCENARIOS: WhatWouldYouDoScenario[] = [
  {
    id: 'scenario_1',
    situation: 'You bought shares in a company after reading its annual report. Today, the stock drops 8% because overall market sentiment is jittery over global interest rates. The company fundamentals and earnings have not changed.',
    category: 'Fear',
    options: [
      {
        text: 'Panic-sell everything immediately at market price because you cannot bear seeing red numbers.',
        scoreExplanation: 'Emotional panic selling often locks in temporary market fluctuations as permanent capital losses without checking whether the investment premise has actually changed.',
        isDisciplined: false
      },
      {
        text: 'Review your original thesis, investment horizon, and pre-defined risk tolerance before deciding.',
        scoreExplanation: 'Disciplined investors pause and examine fundamentals versus macro noise. If the company is sound and within risk limits, temporary volatility is normal.',
        isDisciplined: true
      },
      {
        text: 'Borrow money from your friends to double down immediately to recover the loss faster.',
        scoreExplanation: 'Using borrowed leverage to average down during stress is a dangerous mistake that can magnify losses.',
        isDisciplined: false
      }
    ]
  },
  {
    id: 'scenario_2',
    situation: 'A friend tells you: "A biotech stock is up 40% this week! Everyone in our group chat is buying it today. If you don’t buy now, you will miss the next multibagger!"',
    category: 'FOMO',
    options: [
      {
        text: 'Pour half of your savings into it right now so you do not feel left out of the group conversation.',
        scoreExplanation: 'Classic FOMO (Fear Of Missing Out). Buying at the peak of social media hype frequently results in buying at maximum enthusiasm right before a sharp correction.',
        isDisciplined: false
      },
      {
        text: 'Politely acknowledge your friend, but refrain from trading any stock you have not researched yourself.',
        scoreExplanation: 'Financial independence means sticking to your own circle of competence and rules, regardless of peer hype.',
        isDisciplined: true
      },
      {
        text: 'Take aggressive short derivative positions to prove your friend wrong.',
        scoreExplanation: 'Trading out of spite or ego is an emotional trap that clouds risk assessment.',
        isDisciplined: false
      }
    ]
  },
  {
    id: 'scenario_3',
    situation: 'You closed a trade that hit your stop-loss, taking a planned 1.5% loss on your capital. You feel an intense urge to make back that money immediately in the next 10 minutes.',
    category: 'Revenge Trading',
    options: [
      {
        text: 'Immediately double your position size on a random fast-moving stock to win back the loss.',
        scoreExplanation: 'Revenge trading is the #1 reason trading accounts get wiped out. Emotion takes over risk management.',
        isDisciplined: false
      },
      {
        text: 'Step away from the screen, take a walk, log the trade in your journal, and only return with a calm mind.',
        scoreExplanation: 'Top practitioners know that taking planned losses is part of the cost of business. Taking a break prevents compounding emotional errors.',
        isDisciplined: true
      }
    ]
  }
];

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Ask (Offer)',
    category: 'Market Mechanics',
    definition: 'The lowest price a seller is willing to accept for a share of stock.',
    example: 'If seller asks ₹750, you must pay at least ₹750 to buy instantly at market.',
    relatedTerms: ['Bid', 'Spread', 'Market Order']
  },
  {
    term: 'Bid',
    category: 'Market Mechanics',
    definition: 'The highest price a buyer is currently willing to pay for a share.',
    example: 'If buyer bids ₹748, a seller can immediately sell to them at ₹748.',
    relatedTerms: ['Ask', 'Spread', 'Limit Order']
  },
  {
    term: 'Bear Market',
    category: 'Market Sentiment',
    definition: 'A prolonged period of falling stock prices, typically defined as a decline of 20% or more from recent peaks amid widespread pessimism.',
    example: 'During a bear market, investor sentiment is defensive and stock valuations often compress.',
    relatedTerms: ['Bull Market', 'Drawdown', 'Volatility']
  },
  {
    term: 'Bull Market',
    category: 'Market Sentiment',
    definition: 'A market condition where prices are consistently rising or expected to rise, characterized by optimism and investor confidence.',
    example: 'In a sustained bull market, corporate earnings growth and economic expansion drive equities higher.',
    relatedTerms: ['Bear Market', 'Market Cycle']
  },
  {
    term: 'Candlestick',
    category: 'Technical Analysis',
    definition: 'A visual chart element that displays the Open, High, Low, and Close (OHLC) prices of an asset for a specific time period.',
    example: 'A green candle indicates the closing price was higher than the opening price during that interval.',
    relatedTerms: ['OHLC', 'Support', 'Resistance', 'Moving Average']
  },
  {
    term: 'Demat Account',
    category: 'Accounts & Infrastructure',
    definition: 'Short for Dematerialized account. An electronic account that securely holds shares and securities in digital form instead of paper certificates.',
    example: 'In India, your shares reside in depositories like NSDL or CDSL linked to your Demat account.',
    relatedTerms: ['Trading Account', 'Broker', 'Depository']
  },
  {
    term: 'Dividend',
    category: 'Fundamental Analysis',
    definition: 'A distribution of a portion of a company\'s net earnings paid out to shareholders as cash or additional stock.',
    example: 'If a company declares a dividend of ₹5 per share and you hold 100 shares, you receive ₹500 directly in your bank account.',
    relatedTerms: ['EPS', 'Net Profit', 'Dividend Yield']
  },
  {
    term: 'EPS (Earnings Per Share)',
    category: 'Fundamental Analysis',
    definition: 'A company\'s net profit divided by the total number of outstanding equity shares.',
    example: 'If profit is ₹100 Cr and there are 10 Cr shares, EPS is ₹10 per share.',
    relatedTerms: ['P/E Ratio', 'Net Profit', 'Revenue']
  },
  {
    term: 'Equity',
    category: 'Market Basics',
    definition: 'The value of shares issued by a company; represents residual ownership in the business after all liabilities are paid.',
    example: 'Buying equity makes you a part-owner of the company\'s future profits and assets.',
    relatedTerms: ['Share', 'Stock', 'Market Cap']
  },
  {
    term: 'IPO (Initial Public Offering)',
    category: 'Market Basics',
    definition: 'The first time a private company issues shares of stock to the general public to raise capital and get listed on an exchange.',
    example: 'Before listing on the NSE or BSE, a company sells shares through an IPO prospectus.',
    relatedTerms: ['Listed Company', 'NSE', 'BSE']
  },
  {
    term: 'Limit Order',
    category: 'Trading Orders',
    definition: 'An order to buy or sell a stock at a specific price or better, ensuring you do not pay more than your specified price.',
    example: 'A buy limit order at ₹500 will only execute if the price is ₹500 or lower.',
    relatedTerms: ['Market Order', 'Stop-Loss', 'Slippage']
  },
  {
    term: 'Market Capitalization',
    category: 'Fundamental Analysis',
    definition: 'The total market value of a company\'s outstanding shares, calculated by multiplying current share price by total shares.',
    example: '10 Crore shares at ₹500 each = ₹5,000 Crore market cap.',
    relatedTerms: ['P/E Ratio', 'Large Cap', 'Mid Cap', 'Small Cap']
  },
  {
    term: 'Market Order',
    category: 'Trading Orders',
    definition: 'An instruction to buy or sell a security immediately at the best available current market price.',
    example: 'A market buy order executes right away against existing Ask orders in the order book.',
    relatedTerms: ['Limit Order', 'Bid', 'Ask']
  },
  {
    term: 'Nifty 50',
    category: 'Indices',
    definition: 'The flagship benchmark stock index of the National Stock Exchange of India (NSE), tracking 50 of the largest and most liquid Indian companies.',
    example: 'When reporters say "the Indian market rose 1% today", they often refer to the Nifty 50 index.',
    relatedTerms: ['Sensex', 'NSE', 'Index']
  },
  {
    term: 'P/E Ratio (Price-to-Earnings)',
    category: 'Valuation Metrics',
    definition: 'The ratio for valuing a company that measures its current share price relative to its per-share earnings.',
    example: 'A stock priced at ₹300 with an EPS of ₹15 has a P/E ratio of 20 (investors pay ₹20 for every ₹1 of annual profit).',
    relatedTerms: ['EPS', 'P/B Ratio', 'Valuation']
  },
  {
    term: 'Resistance',
    category: 'Technical Analysis',
    definition: 'A price level where selling pressure has historically overcome buying pressure, preventing the price from rising further.',
    example: 'If a stock struggles to climb past ₹800 three times in a row, ₹800 is a resistance zone.',
    relatedTerms: ['Support', 'Breakout', 'Candlestick']
  },
  {
    term: 'RSI (Relative Strength Index)',
    category: 'Technical Analysis',
    definition: 'A momentum oscillator measured between 0 and 100 that evaluates the velocity and magnitude of recent price changes.',
    example: 'Traditionally, RSI readings above 70 indicate overbought conditions, while below 30 indicate oversold conditions.',
    relatedTerms: ['Moving Average', 'Momentum', 'Trend']
  },
  {
    term: 'Sensex (BSE 30)',
    category: 'Indices',
    definition: 'The oldest benchmark stock index in India, tracking 30 prominent, financially sound companies listed on the Bombay Stock Exchange (BSE).',
    example: 'The Sensex provides a quick pulse of general market direction in India.',
    relatedTerms: ['Nifty 50', 'BSE', 'Index']
  },
  {
    term: 'Stop-Loss',
    category: 'Risk Management',
    definition: 'A predetermined exit order designed to limit an investor\'s loss on a position if the market moves unfavorably.',
    example: 'Buying at ₹100 with a stop-loss at ₹95 caps your loss at ₹5 per share (5%).',
    relatedTerms: ['Position Sizing', 'Risk/Reward', 'Capital Protection']
  },
  {
    term: 'Support',
    category: 'Technical Analysis',
    definition: 'A price level where a downtrend is expected to pause due to a concentration of demand or buying interest.',
    example: 'Whenever the stock drops to ₹450, buyers step in to absorb sellers, forming support.',
    relatedTerms: ['Resistance', 'Breakout', 'Trend']
  },
  {
    term: 'Volume',
    category: 'Market Mechanics',
    definition: 'The total number of shares traded during a given time period.',
    example: 'High volume on a breakout gives stronger confirmation of market conviction than low volume.',
    relatedTerms: ['Liquidity', 'Candlestick', 'Order Book']
  }
];
