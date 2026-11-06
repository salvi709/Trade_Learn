export interface EvaluationQuestion {
  id: string;
  category:
    | 'basic_definition'
    | 'indian_market'
    | 'follow_up'
    | 'comparison'
    | 'scenario'
    | 'risk_management'
    | 'calculation'
    | 'curriculum_lesson'
    | 'outside_curriculum';
  question: string;
  history?: Array<{ sender: 'user' | 'mentor'; text: string }>;
  mode: 'eli15' | 'deep_dive';
  learnerStage?: number;
  expectedKeywords: string[];
  prohibitedPhrases?: string[];
}

export const MENTOR_EVALUATION_DATASET: EvaluationQuestion[] = [
  // 1. Basic Definitions
  {
    id: 'eval_01',
    category: 'basic_definition',
    question: 'What is a stock market?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['company', 'ownership', 'share', 'market'],
  },
  {
    id: 'eval_02',
    category: 'basic_definition',
    question: 'Explain what an IPO means in simple terms.',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['initial public offering', 'private', 'public', 'capital'],
  },
  {
    id: 'eval_03',
    category: 'basic_definition',
    question: 'What is a dividend?',
    mode: 'eli15',
    learnerStage: 2,
    expectedKeywords: ['profit', 'shareholder', 'cash', 'earnings'],
  },
  {
    id: 'eval_04',
    category: 'basic_definition',
    question: 'What is a Demat account and why do I need one in India?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['dematerialized', 'electronic', 'shares', 'nsdl', 'cdsl'],
  },
  {
    id: 'eval_05',
    category: 'basic_definition',
    question: 'What is market capitalization and how is it calculated?',
    mode: 'deep_dive',
    learnerStage: 2,
    expectedKeywords: ['shares', 'price', 'market value', 'large cap'],
  },

  // 2. Indian Stock Market Specifics
  {
    id: 'eval_06',
    category: 'indian_market',
    question: 'What is the difference between NSE and BSE?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['national stock exchange', 'bombay stock exchange', 'nifty', 'sensex'],
  },
  {
    id: 'eval_07',
    category: 'indian_market',
    question: 'What is the role of SEBI in the Indian capital market?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['regulator', 'investor protection', 'rules', 'fraud'],
  },
  {
    id: 'eval_08',
    category: 'indian_market',
    question: 'What is the Nifty 50 and how is it weighted?',
    mode: 'deep_dive',
    learnerStage: 4,
    expectedKeywords: ['50', 'index', 'free float', 'nse'],
  },
  {
    id: 'eval_09',
    category: 'indian_market',
    question: 'Can you give an example of an Indian blue-chip company and why it is called that?',
    mode: 'eli15',
    learnerStage: 2,
    expectedKeywords: ['tata', 'reliance', 'infosys', 'hdfc', 'stable'],
  },

  // 3. Comparisons
  {
    id: 'eval_10',
    category: 'comparison',
    question: 'What is the exact difference between investing and trading?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['time', 'long-term', 'short-term', 'compounding', 'fluctuation'],
  },
  {
    id: 'eval_11',
    category: 'comparison',
    question: 'Compare Market Orders versus Limit Orders. When should I use each?',
    mode: 'eli15',
    learnerStage: 3,
    expectedKeywords: ['price', 'immediate', 'guarantee', 'slippage'],
  },
  {
    id: 'eval_12',
    category: 'comparison',
    question: 'What is the difference between P/E Ratio and P/B Ratio?',
    mode: 'deep_dive',
    learnerStage: 2,
    expectedKeywords: ['earnings', 'book value', 'net worth', 'valuation'],
  },
  {
    id: 'eval_13',
    category: 'comparison',
    question: 'How does an Index Mutual Fund differ from buying an ETF?',
    mode: 'eli15',
    learnerStage: 4,
    expectedKeywords: ['nav', 'trading day', 'exchange', 'demat'],
  },

  // 4. Follow-up Questions (Conversational Memory)
  {
    id: 'eval_14',
    category: 'follow_up',
    question: 'What are their main disadvantages?',
    history: [
      { sender: 'user', text: 'Can you explain what mutual funds are?' },
      { sender: 'mentor', text: 'A mutual fund pools money from many investors to purchase a diversified basket of stocks or bonds managed by a professional fund manager.' },
    ],
    mode: 'eli15',
    learnerStage: 4,
    expectedKeywords: ['expense ratio', 'control', 'fund manager', 'fees'],
  },
  {
    id: 'eval_15',
    category: 'follow_up',
    question: 'Can you give me a realistic Indian example of that?',
    history: [
      { sender: 'user', text: 'What is a stop-loss order?' },
      { sender: 'mentor', text: 'A stop-loss order automatically triggers a sell order when a stock drops to a price you specified, cutting your losses.' },
    ],
    mode: 'eli15',
    learnerStage: 3,
    expectedKeywords: ['₹', 'buy', 'drop', 'risk'],
  },
  {
    id: 'eval_16',
    category: 'follow_up',
    question: 'Why does that happen even if profits were higher?',
    history: [
      { sender: 'user', text: 'Why do stock prices sometimes drop on earnings day?' },
      { sender: 'mentor', text: 'Stock prices can drop even on good quarterly results if market participants expected even higher earnings or if the company gave weaker forward guidance.' },
    ],
    mode: 'deep_dive',
    learnerStage: 5,
    expectedKeywords: ['expectation', 'guidance', 'priced in', 'future'],
  },

  // 5. Scenarios
  {
    id: 'eval_17',
    category: 'scenario',
    question: 'A friend told me a stock is guaranteed to double in 3 weeks because of insider tips on Telegram. What should I do?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['scam', 'pump and dump', 'telegram', 'sebi', 'never guaranteed'],
  },
  {
    id: 'eval_18',
    category: 'scenario',
    question: 'I bought a stock at ₹500, it went down to ₹420, and I feel like putting more money in to average down. Is that wise?',
    mode: 'eli15',
    learnerStage: 6,
    expectedKeywords: ['average down', 'thesis', 'risk', 'plan', 'discipline'],
  },
  {
    id: 'eval_19',
    category: 'scenario',
    question: 'The whole market dropped 3% today and I feel anxious. How should a long-term investor handle this feeling?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['volatility', 'normal', 'long-term', 'emotions', 'panic'],
  },

  // 6. Risk Management & Position Sizing
  {
    id: 'eval_20',
    category: 'risk_management',
    question: 'What is the 1% or 2% portfolio risk rule and why is it essential?',
    mode: 'eli15',
    learnerStage: 7,
    expectedKeywords: ['capital', 'loss', 'account', 'survival', 'consecutive'],
  },
  {
    id: 'eval_21',
    category: 'risk_management',
    question: 'Why is recovering from a 50% loss mathematically so much harder than recovering from a 10% loss?',
    mode: 'deep_dive',
    learnerStage: 7,
    expectedKeywords: ['100%', 'drawdown', 'recovery', 'math'],
  },
  {
    id: 'eval_22',
    category: 'risk_management',
    question: 'What is a risk-to-reward ratio and what makes a 1:2 ratio attractive?',
    mode: 'deep_dive',
    learnerStage: 7,
    expectedKeywords: ['risk', 'reward', 'win rate', 'target', 'stop-loss'],
  },

  // 7. Calculations & Quantitative Questions
  {
    id: 'eval_23',
    category: 'calculation',
    question: 'If a company has a stock price of ₹600 and its annual EPS is ₹30, what is its P/E ratio and how do I interpret it?',
    mode: 'deep_dive',
    learnerStage: 2,
    expectedKeywords: ['20', '600', '30', 'earnings', 'pay'],
  },
  {
    id: 'eval_24',
    category: 'calculation',
    question: 'According to the Rule of 72, if my investment yields 12% per year, how long will it take to double ₹1 Lakh into ₹2 Lakhs?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['6 years', '72 / 12', 'double'],
  },
  {
    id: 'eval_25',
    category: 'calculation',
    question: 'If I have an account of ₹1,00,000 and want to risk at most 1% (₹1,000) on a trade where I buy at ₹200 and set a stop-loss at ₹190, how many shares can I buy?',
    mode: 'deep_dive',
    learnerStage: 7,
    expectedKeywords: ['100 shares', '10 per share', '1,000', 'position size'],
  },

  // 8. Specific ShareMarket Curriculum Lessons
  {
    id: 'eval_26',
    category: 'curriculum_lesson',
    question: 'How do you explain the pizza slice analogy for company shares?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['pizza', 'slice', 'ownership', 'whole'],
  },
  {
    id: 'eval_27',
    category: 'curriculum_lesson',
    question: 'What are the main forensic red flags to watch for in corporate financial statements?',
    mode: 'deep_dive',
    learnerStage: 8,
    expectedKeywords: ['debt', 'cash flow', 'auditor', 'pledged', 'promoter'],
  },
  {
    id: 'eval_28',
    category: 'curriculum_lesson',
    question: 'What is a candlestick chart and what do the wicks/shadows show?',
    mode: 'eli15',
    learnerStage: 4,
    expectedKeywords: ['open', 'high', 'low', 'close', 'wick'],
  },
  {
    id: 'eval_29',
    category: 'curriculum_lesson',
    question: 'Explain what support and resistance mean using an intuitive analogy.',
    mode: 'eli15',
    learnerStage: 5,
    expectedKeywords: ['floor', 'ceiling', 'bounce', 'buyers', 'sellers'],
  },
  {
    id: 'eval_30',
    category: 'curriculum_lesson',
    question: 'What is the RSI indicator and what do levels 70 and 30 signify?',
    mode: 'deep_dive',
    learnerStage: 5,
    expectedKeywords: ['relative strength index', 'overbought', 'oversold', '70', '30'],
  },

  // 9. Questions Outside the Immediate Curriculum
  {
    id: 'eval_31',
    category: 'outside_curriculum',
    question: 'What is sovereign gold bond (SGB) in India and how does it compare to stocks?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['gold', 'rbi', 'interest', 'hedge'],
  },
  {
    id: 'eval_32',
    category: 'outside_curriculum',
    question: 'What is an emergency fund and should I build one before buying stocks?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['months', 'expenses', 'liquid', 'before', 'safety'],
  },
  {
    id: 'eval_33',
    category: 'outside_curriculum',
    question: 'What is rupee-cost averaging through an SIP?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['systematic investment plan', 'regular', 'average', 'volatility'],
  },
  {
    id: 'eval_34',
    category: 'outside_curriculum',
    question: 'What happens when a stock undergoes a 1:5 stock split?',
    mode: 'deep_dive',
    learnerStage: 2,
    expectedKeywords: ['shares multiply', 'price adjusts', 'market cap stays same', 'liquidity'],
  },
  {
    id: 'eval_35',
    category: 'outside_curriculum',
    question: 'Can you tell me what the current share price of Reliance Industries is right now?',
    mode: 'eli15',
    learnerStage: 1,
    expectedKeywords: ['cannot verify', 'live price', 'educational', 'real-time'],
  },
];
