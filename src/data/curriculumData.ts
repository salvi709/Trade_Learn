import { Module, Lesson, ModuleStatus } from '../types';

export const CURRICULUM_MODULES: Module[] = [
  // LEVEL 1: START HERE
  {
    id: 'mod_1',
    levelNumber: 1,
    title: 'Start Here: Financial Foundations',
    tagline: 'Why money loses value and how investing actually works.',
    badge: 'Foundation',
    icon: 'Landmark',
    prerequisites: [],
    estimatedTime: '~25 mins',
    skills: ['Inflation protection', 'Compounding calculations', 'Asset allocation fundamentals', 'Time-horizon selection'],
    conceptsPreview: ['Purchasing power erosion', 'The Rule of 72', 'Compound growth formula', 'Saving vs. Investing vs. Trading'],
    lessons: [
      {
        id: 'les_1_1',
        moduleId: 'mod_1',
        title: 'What is Money & The Silent Thief: Inflation',
        shortDesc: 'Why leaving cash in a piggy bank or basic savings account slowly shrinks your purchasing power.',
        readTimeMinutes: 4,
        eli15: {
          analogyTitle: 'The Samosa / Movie Ticket Analogy',
          explanation: 'Money is simply a tool we use to trade our time and energy for goods. However, if you store ₹100 under your mattress for 10 years, that ₹100 does not disappear—instead, what that ₹100 can BUY disappears! Ten years ago, ₹100 bought 10 samosas. Today, it might only buy 4 samosas. That silent price increase is Inflation.',
          realLifeAnalogy: 'Imagine a leaky bucket of water. If you do nothing, water slowly drips out. Inflation is the drip. Investing is your effort to add fresh water back into the bucket so your savings survive.',
          keyTakeaway: 'Cash in a zero-interest jar loses purchasing power every year due to inflation. Investing seeks to grow your savings faster than the cost of living.'
        },
        deepDive: {
          technicalOverview: 'Inflation is the annualized rate at which the general price level of goods and services rises, eroding currency purchasing power. Central banks typically target an inflation band of around 4–6%.',
          formulasAndMetrics: [
            {
              label: 'Real Rate of Return Formula',
              formula: 'Real Return ≈ Nominal Return − Inflation Rate',
              detail: 'If a bank deposit yields 6% nominal interest, but inflation is 6.5%, your real economic return is −0.5% (net loss of purchasing power).'
            },
            {
              label: 'Rule of 72 (Doubling Time)',
              formula: 'Years to Double ≈ 72 / Annual Interest Rate',
              detail: 'At 12% annualized return, capital doubles in ~6 years. At 6%, it takes 12 years.'
            }
          ],
          marketMechanics: 'Capital market instruments (equities, index funds, productive enterprises) historically provide a hedge against inflation over long horizons because profitable companies raise prices to preserve operating margins.',
          riskInsight: 'Losing money in investments is a known volatility risk, but keeping 100% cash is a 100% guaranteed loss of purchasing power over decades.'
        },
        interactiveType: 'ownership_pizza',
        quiz: [
          {
            id: 'les_1_1_q1',
            question: 'If your savings account gives 4% interest per year, and inflation is 6% per year, what happens to your purchasing power?',
            options: [
              'It increases by 2% because you earned interest',
              'It decreases by approximately 2% in real terms',
              'It stays completely identical',
              'It doubles automatically every year'
            ],
            correctIndex: 1,
            explanation: 'When inflation (6%) exceeds your nominal yield (4%), the real rate of return is negative (~ -2%), meaning your money buys fewer goods over time.'
          },
          {
            id: 'les_1_1_q2',
            question: 'According to the Rule of 72, approximately how many years will it take for ₹50,000 to double into ₹1,00,000 at a 12% annualized return?',
            options: [
              'Approximately 6 years (72 / 12 = 6)',
              'Approximately 12 years',
              'Approximately 24 years',
              'Approximately 2 years'
            ],
            correctIndex: 0,
            explanation: 'The Rule of 72 estimates doubling time: 72 divided by the 12% rate of return equals approximately 6 years.'
          },
          {
            id: 'les_1_1_q3',
            question: 'Rohan leaves ₹1,00,000 in cash inside a home safe for 15 years. Which of the following is true?',
            options: [
              'The nominal count is ₹1,00,000, but its purchasing power will have drastically fallen due to inflation',
              'The ₹1,00,000 will increase because cash is scarce',
              'Rohan earned 0% risk and therefore made the best financial decision possible',
              'The money will automatically double due to bank interest'
            ],
            correctIndex: 0,
            explanation: 'Physical cash preserves nominal quantity but continuously loses real purchasing power as prices for goods and services rise.'
          },
          {
            id: 'les_1_1_q4',
            question: 'Why can productive, profitable businesses provide an effective long-term hedge against inflation?',
            options: [
              'Because they can raise prices on their goods and services as their input costs rise',
              'Because the government forbids businesses from experiencing inflation',
              'Because company bank accounts are immune to price changes',
              'Because stocks never experience price drops'
            ],
            correctIndex: 0,
            explanation: 'Companies with pricing power pass higher input costs to consumers, allowing earnings and dividends to grow alongside or faster than inflation.'
          },
          {
            id: 'les_1_1_q5',
            question: 'What is the crucial difference between "Nominal Return" and "Real Return"?',
            options: [
              'Nominal return is the raw stated percentage gain; Real return subtracts inflation to reveal actual purchasing power change',
              'Nominal return is only for stock traders; Real return is only for real estate buyers',
              'Nominal return is always negative; Real return is always positive',
              'There is no difference between them'
            ],
            correctIndex: 0,
            explanation: 'Nominal return is the numerical increase on paper, while real return measures how much more you can actually buy after accounting for inflation.'
          }
        ]
      },
      {
        id: 'les_1_2',
        moduleId: 'mod_1',
        title: 'Saving vs. Investing vs. Trading',
        shortDesc: 'Understand the essential differences in timeframe, risk profile, and mindset.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'Planting Seeds vs. Storing Seeds',
          explanation: 'Saving is like keeping grain safely stored in a sealed jar for emergencies. It is safe, but it will never multiply. Investing is like planting some grain seeds in fertile soil, watering them, and patiently waiting seasons for a bountiful harvest. Trading is like setting up a market stall to exchange seeds back and forth several times a week hoping to profit on price swings.',
          realLifeAnalogy: 'Think of driving: Saving is parking in your driveway (zero movement, safe). Investing is driving at the speed limit on a highway toward your goal (steady, disciplined). Trading is driving in a go-kart race (requires intense skill, fast reactions, higher risk of crash).',
          keyTakeaway: 'You don\'t need to trade to build wealth. Most people achieve financial freedom simply through patient long-term investing in diversified businesses.'
        },
        deepDive: {
          technicalOverview: 'Asset allocation divides wealth into liquid safety capital (cash/fixed deposits for short-term liquidity), equity investments (multi-year ownership in growing businesses), and tactical trading (short-term momentum or swing positions where strict stop-losses govern survival).',
          formulasAndMetrics: [
            {
              label: 'Compounding Equation',
              formula: 'A = P × (1 + r/n)^(nt)',
              detail: 'Time (t) is the exponential multiplier. Small differences in annual return (r) compound dramatically over 20-30 years.'
            }
          ],
          marketMechanics: 'Short-term trading is often a zero-sum or negative-sum game after brokerages, exchange fees, transaction taxes (STT), and capital gains taxes. Long-term equity investing is positive-sum because the underlying global economy and corporate revenues expand.',
          riskInsight: 'Never trade with money you need for rent, medical emergencies, or education in the next 12 to 24 months.'
        },
        quiz: [
          {
            id: 'les_1_2_q1',
            question: 'Which statement accurately describes long-term investing versus short-term trading?',
            options: [
              'Trading is always better because you get rich in two days',
              'Investing focuses on multi-year business growth; trading focuses on short-term price fluctuations and risk control',
              'Investing requires you to sit in front of charts 8 hours every day',
              'Trading carries zero risk if you use technical indicators'
            ],
            correctIndex: 1,
            explanation: 'Investors act as part-owners of enterprises over years. Traders participate in short-term market momentum and demand strict capital protection rules.'
          },
          {
            id: 'les_1_2_q2',
            question: 'Why is long-term equity investing considered a "positive-sum" game while high-frequency trading tends to be zero/negative-sum?',
            options: [
              'Because the overall economy and company profits grow over time, creating new aggregate wealth',
              'Because stock brokers return all trading fees at the end of the year',
              'Because the government reimburses all stock market losses',
              'Because everyone in the stock market always wins every trade'
            ],
            correctIndex: 0,
            explanation: 'Over decades, corporate productivity and revenues expand, creating genuine new wealth for long-term business owners.'
          },
          {
            id: 'les_1_2_q3',
            question: 'Priya has ₹50,000 saved for her college tuition fee due next month. How should she allocate this money?',
            options: [
              'Keep it in a liquid, safe bank account or emergency fund—never risk short-term necessary funds in the market',
              'Put 100% into high-volatility penny stocks to double it before tuition is due',
              'Buy out-of-the-money derivatives expiring this week',
              'Give it to a social media influencer promising 50% weekly returns'
            ],
            correctIndex: 0,
            explanation: 'Money needed in the short term (< 1-2 years) for essential life commitments should never be exposed to market volatility.'
          },
          {
            id: 'les_1_2_q4',
            question: 'What is the single most powerful mathematical variable in the compound interest formula A = P(1 + r/n)^(nt)?',
            options: [
              'Time (t), because it acts as the exponential power',
              'The bank branch address',
              'The day of the week you open the account',
              'The color of your checkbook'
            ],
            correctIndex: 0,
            explanation: 'Time is the exponent in compounding. Starting 10 years earlier creates exponential differences in wealth generation even with modest capital.'
          },
          {
            id: 'les_1_2_q5',
            question: 'What is the primary role of "Saving" in a healthy personal finance system?',
            options: [
              'Providing a financial safety net for emergencies and immediate cash needs without volatility',
              'Generating 30% annual returns to retire early',
              'Predicting tomorrow morning stock market gap-ups',
              'Replacing all business ownership'
            ],
            correctIndex: 0,
            explanation: 'Savings provide peace of mind, liquidity, and emergency protection, allowing your long-term investments to stay invested uninterrupted.'
          }
        ]
      }
    ]
  },

  // LEVEL 2: STOCK MARKET BASICS
  {
    id: 'mod_2',
    levelNumber: 2,
    title: 'Stock Market Basics',
    tagline: 'What is a company, what is a share, and how does the market work?',
    badge: 'Core Concepts',
    icon: 'Coins',
    prerequisites: ['mod_1'],
    estimatedTime: '~30 mins',
    skills: ['Fractional ownership analysis', 'Market capitalization sizing', 'Stock exchange mechanics', 'Index benchmarking'],
    conceptsPreview: ['The Pizza Slice Analogy', 'Primary IPO vs Secondary Market', 'Nifty/Sensex basket weighting', 'Demat vs Trading accounts'],
    lessons: [
      {
        id: 'les_2_1',
        moduleId: 'mod_2',
        title: 'What is a Stock? (The Pizza Slice Analogy)',
        shortDesc: 'Why companies issue shares and what ownership really means.',
        readTimeMinutes: 4,
        eli15: {
          analogyTitle: 'The 1,000-Slice Pizza Parlor',
          explanation: 'Imagine you and your best friend open a delicious pizza bakery called "Aroma Pizza". You need ₹1,00,000 for high-end ovens and dough mixers, but you only have ₹50,000. So you invite 50 classmates to contribute ₹1,000 each. In return, you divide the entire company into 100 equal "shares". Each person who gave ₹1,000 owns 1 share (1% of the bakery!). If Aroma Pizza makes ₹20,000 profit, your 1 share is entitled to its proportion of that success.',
          realLifeAnalogy: 'A share is literally a certificate of fractional ownership. If a company has 10,000 total shares and you buy 100, you own 1% of everything the company owns and earns.',
          keyTakeaway: 'A stock is not just a fluctuating number on a glass screen—it is legal partial ownership of a real business with real customers, employees, and assets.'
        },
        deepDive: {
          technicalOverview: 'Equity capital represents the permanent capital of a joint-stock enterprise. Companies issue shares via Initial Public Offerings (IPO) in the primary market to raise non-debt capital for expansion, debt retirement, or research & development. Once listed, these shares trade among investors on secondary exchanges like the National Stock Exchange (NSE) or Bombay Stock Exchange (BSE).',
          formulasAndMetrics: [
            {
              label: 'Market Capitalization',
              formula: 'Market Cap = Current Share Price × Total Outstanding Shares',
              detail: 'If a firm has 50 crore shares outstanding at ₹400 per share, its total market valuation is ₹20,000 crore.'
            }
          ],
          marketMechanics: 'When you buy shares on the stock exchange (secondary market), the money goes to the seller (another investor), NOT directly to the company. The company only received capital during its primary issuance (IPO or follow-on offering).',
          riskInsight: 'As an equity shareholder, you have residual claim. If a company goes bankrupt, lenders and bondholders get paid first; equity holders receive what remains, which can be zero.'
        },
        interactiveType: 'ownership_pizza',
        quiz: [
          {
            id: 'les_2_1_q1',
            question: 'When you purchase 10 shares of a company on the stock exchange, who receives your money?',
            options: [
              'The CEO of the company receives the money directly',
              'Another investor or trader who was selling those 10 shares',
              'The government bank keeps the money in escrow',
              'The stock exchange keeps 100% of the funds'
            ],
            correctIndex: 1,
            explanation: 'On the secondary market (the stock exchange), buyers buy from existing shareholders who wish to sell. The company only raises capital during primary issuances like an IPO.'
          },
          {
            id: 'les_2_1_q2',
            question: 'If Company ABC has 10 crore outstanding shares and the current market price is ₹250 per share, what is its Market Capitalization?',
            options: [
              '₹2,500 Crore (10 crore × ₹250 = ₹2,500 Cr)',
              '₹250 Crore',
              '₹10 Crore',
              '₹25,000 Crore'
            ],
            correctIndex: 0,
            explanation: 'Market Cap is total outstanding shares multiplied by the current stock price: 10,00,00,000 × ₹250 = ₹2,500 Crore.'
          },
          {
            id: 'les_2_1_q3',
            question: 'What is the primary legal distinction between being an Equity Shareholder vs. a Bondholder (lender)?',
            options: [
              'Shareholders are partial owners with residual profit claims; bondholders are creditors who receive fixed interest and priority in liquidation',
              'Shareholders receive guaranteed daily salaries',
              'Bondholders own 100% of company physical machinery',
              'There is no legal difference between shares and debt'
            ],
            correctIndex: 0,
            explanation: 'Equity represents fractional ownership with upside profit participation, while bonds are debt obligations with prioritized repayment claims.'
          },
          {
            id: 'les_2_1_q4',
            question: 'Why do established companies choose to do an Initial Public Offering (IPO)?',
            options: [
              'To raise public equity capital for expansion, pay off expensive debt, or provide liquidity to early founders',
              'Because the law forces all companies to become public after 2 years',
              'To avoid paying salaries to their employees',
              'To eliminate competition permanently'
            ],
            correctIndex: 0,
            explanation: 'IPOs allow companies to access public equity markets to fund strategic growth and create transparent liquidity for existing investors.'
          },
          {
            id: 'les_2_1_q5',
            question: 'If a company announces a dividend payout, who is entitled to receive that dividend?',
            options: [
              'All verified equity shareholders of record on the specified record date',
              'Only the largest institutional bank',
              'Only people who executed day trades this morning',
              'Only the board members'
            ],
            correctIndex: 0,
            explanation: 'Dividends are distributed proportionally to all shareholders of record who hold the stock before the ex-dividend date.'
          }
        ]
      },
      {
        id: 'les_2_2',
        moduleId: 'mod_2',
        title: 'Exchanges, Indices & Demat Accounts',
        shortDesc: 'How the NSE, BSE, Nifty 50, and modern digital brokerages connect together.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The Central Market & The Thermometer',
          explanation: 'Imagine a gigantic, clean farmers market hall where thousands of sellers meet buyers with clear digital price tags. That is the Stock Exchange (like the NSE or BSE). To know if the overall market is doing well today, you don\'t check all 5,000 vegetables one by one—you look at a single summary gauge called an Index (like the Nifty 50 or Sensex). If the top 50 biggest companies are up on average, the index is green!',
          realLifeAnalogy: 'Your Demat Account is like a digital locker for your stock certificates (managed by depositories like NSDL/CDSL). Your Trading Account is the checkout counter that lets you place buy and sell instructions.',
          keyTakeaway: 'An index is a weighted basket showing the health of the top companies. You don\'t need to pick individual stocks to invest in the country\'s economic growth.'
        },
        deepDive: {
          technicalOverview: 'Major indices like the Nifty 50 and S&P BSE Sensex use a Free-Float Market Capitalization weighted methodology. This means larger publicly tradable corporations (like Reliance or TCS) exert greater influence on index movement than smaller firms.',
          formulasAndMetrics: [
            {
              label: 'Free-Float Market Cap',
              formula: 'Free-Float Cap = Total Shares × Price × (1 − Promoter Holding %)',
              detail: 'Only shares freely available for public trading are counted in index weight calculation.'
            }
          ],
          marketMechanics: 'Electronic book-entry settlement ensures shares move from the seller\'s Demat account to the buyer\'s Demat account safely under regulatory oversight (SEBI in India, SEC in the USA).',
          riskInsight: 'Investing in broad-market index funds removes single-company bankruptcy risk through automatic diversification across dozens of leading industry leaders.'
        },
        quiz: [
          {
            id: 'les_2_2_q1',
            question: 'What is the primary function of a stock market index like the Nifty 50 or S&P 500?',
            options: [
              'To serve as a benchmark thermometer measuring the aggregated performance of top representative companies',
              'To guarantee that no stock can ever fall in value',
              'To force all companies to charge the same price for goods',
              'To eliminate government taxes on trading'
            ],
            correctIndex: 0,
            explanation: 'An index reflects the weighted average price movement of its constituent companies, providing a benchmark for the overall economy or sector.'
          },
          {
            id: 'les_2_2_q2',
            question: 'What is the distinct role of a Demat Account compared to a Trading Account?',
            options: [
              'A Demat account holds your shares in electronic custody; a Trading account places buy/sell orders with the exchange',
              'A Demat account is only for buying gold; Trading account is for crypto',
              'A Demat account is managed by the police department',
              'There is no difference; they are two names for physical cash'
            ],
            correctIndex: 0,
            explanation: 'A Demat (Dematerialized) account acts as your electronic share vault, while your Trading account interfaces with the broker to place market transactions.'
          },
          {
            id: 'les_2_2_q3',
            question: 'Why does a 2% change in a gigantic company like Reliance affect the Nifty 50 index much more than a 2% change in a smaller Nifty constituent?',
            options: [
              'Because the Nifty 50 is weighted by Free-Float Market Capitalization, giving larger companies higher index weights',
              'Because large companies have louder commercials on television',
              'Because the exchange manually edits index numbers based on founder popularity',
              'Because small companies are not included in math calculations'
            ],
            correctIndex: 0,
            explanation: 'Free-float market cap weighting gives companies with larger publicly tradable market valuations a proportionately higher weight in index movements.'
          },
          {
            id: 'les_2_2_q4',
            question: 'Which regulatory authority oversees securities exchanges, brokers, and mutual funds in India to protect investor fairness?',
            options: [
              'SEBI (Securities and Exchange Board of India)',
              'TRAI',
              'ISRO',
              'Municipal Corporation'
            ],
            correctIndex: 0,
            explanation: 'SEBI is the apex regulatory body regulating capital market participants, enforcing disclosures, and defending retail investor rights.'
          },
          {
            id: 'les_2_2_q5',
            question: 'What major risk is dramatically reduced when an investor buys an Index Fund rather than a single individual stock?',
            options: [
              'Single-company idiosyncratic risk (e.g. unexpected management scandal or single-firm bankruptcy)',
              'All market volatility is eliminated forever',
              'Inflation is deleted from the world economy',
              'Brokers are forced to give 50% cash bonuses'
            ],
            correctIndex: 0,
            explanation: 'Index funds provide broad diversification across 50+ industry leaders, neutralizing the catastrophic impact if any single company fails.'
          }
        ]
      }
    ]
  },

  // LEVEL 3: BUYING & SELLING MECHANICS
  {
    id: 'mod_3',
    levelNumber: 3,
    title: 'Buying & Selling Mechanics',
    tagline: 'Market vs Limit orders, the bid-ask spread, order books, and trade settlement.',
    badge: 'Execution',
    icon: 'ArrowLeftRight',
    prerequisites: ['mod_2'],
    estimatedTime: '~30 mins',
    skills: ['Order type selection', 'Slippage prevention', 'Reading depth & liquidity', 'Settlement cycle navigation'],
    conceptsPreview: ['Market Orders vs Limit Orders', 'The Bid-Ask Spread', 'The Order Matching Engine', 'T+1 Settlement Cycle'],
    lessons: [
      {
        id: 'les_3_1',
        moduleId: 'mod_3',
        title: 'Order Types: Market Orders vs. Limit Orders',
        shortDesc: 'Why placing a market order in an illiquid stock can cost you unexpected money.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The "Get It Right Now" vs. "My Price Only" Buyer',
          explanation: 'Imagine walking into an antique shop. If you yell: "I want this antique vase RIGHT NOW, charge whatever price the seller wants!", you just placed a MARKET ORDER. You get it instantly, but you might pay far more than you expected. If instead you say: "I will only buy this vase if the price is ₹500 or lower; otherwise I will walk away", you placed a LIMIT ORDER. You control the price, but if no seller agrees to ₹500, your trade will not execute.',
          realLifeAnalogy: 'Market Order = Guarantee of EXECUTION, but NO guarantee of price. Limit Order = Guarantee of MAXIMUM PRICE, but NO guarantee of execution.',
          keyTakeaway: 'For disciplined beginners, Limit Orders prevent "slippage" and keep you in total control of the price you pay.'
        },
        deepDive: {
          technicalOverview: 'Market orders execute immediately against the best available opposite quote on the order book. In volatile or illiquid instruments, market orders sweep across multiple price levels (slippage), resulting in an average fill price significantly worse than the last traded price (LTP).',
          formulasAndMetrics: [
            {
              label: 'Execution Slippage',
              formula: 'Slippage = Actual Fill Price − Expected Displayed Price',
              detail: 'Positive slippage hurts buyers when buying above LTP or sellers when selling below LTP.'
            }
          ],
          marketMechanics: 'Limit orders enter the order book queue as "Maker" orders, providing liquidity. Market orders take liquidity from the book as "Takers".',
          riskInsight: 'Never place large market orders in small-cap stocks with thin trading volume during market open (9:15 AM) due to erratic opening volatility.'
        },
        interactiveType: 'order_book',
        quiz: [
          {
            id: 'les_3_1_q1',
            question: 'When is a Limit Order preferred over a Market Order?',
            options: [
              'When you want to guarantee that you buy at or below your specific target price',
              'When you must exit the market within 1 microsecond no matter what price you get',
              'When you want the broker to randomly pick a stock for you',
              'When you want to borrow money from other traders'
            ],
            correctIndex: 0,
            explanation: 'A limit order guarantees that your buy order will only fill at your specified price or better, protecting you from paying inflated prices.'
          },
          {
            id: 'les_3_1_q2',
            question: 'What is the primary risk of using a Market Order in a thinly traded, illiquid stock?',
            options: [
              'Severe slippage, where your order sweeps multiple expensive price tiers on the order book',
              'Your Demat account will be permanently locked',
              'The company will cancel its quarterly dividend',
              'Your order will never execute under any circumstances'
            ],
            correctIndex: 0,
            explanation: 'In illiquid stocks, insufficient sell orders at the top price mean a market buy order will match with sellers higher up the queue, causing heavy slippage.'
          },
          {
            id: 'les_3_1_q3',
            question: 'Vikram places a Limit Buy order for 50 shares of Tata Motors at ₹950. The stock trades between ₹952 and ₹960 all day. What happens to Vikram\'s order?',
            options: [
              'It remains unfilled (pending) because market price never dropped to his specified ₹950 limit',
              'It automatically buys at ₹960 anyway',
              'The exchange fines Vikram for waiting',
              'The shares are deducted from his Demat account immediately'
            ],
            correctIndex: 0,
            explanation: 'Limit orders protect your price: if the market does not reach or cross your limit price, the order does not execute.'
          },
          {
            id: 'les_3_1_q4',
            question: 'Which order type guarantees EXECUTION immediately, but does NOT guarantee the final price you pay?',
            options: [
              'Market Order',
              'Limit Order',
              'Good-Till-Triggered (GTT) Limit Order',
              'Post-Only Limit Order'
            ],
            correctIndex: 0,
            explanation: 'Market orders demand immediate execution against whatever prices exist in the opposing order queue.'
          },
          {
            id: 'les_3_1_q5',
            question: 'What is a Stop-Loss Limit (SL-L) order designed to do?',
            options: [
              'Trigger a protective exit order once price breaches a predetermined risk invalidation level',
              'Automatically double your position whenever you lose money',
              'Guarantee 100% daily trading profits',
              'Hide your identity from the tax department'
            ],
            correctIndex: 0,
            explanation: 'Stop-loss orders act as automated safety nets, exiting your trade to limit capital damage when price moves against your thesis.'
          }
        ]
      },
      {
        id: 'les_3_2',
        moduleId: 'mod_3',
        title: 'The Order Book & The Bid-Ask Spread',
        shortDesc: 'How buyers and sellers line up and how the exchange matching engine works.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The Auctioneer\'s Two Columns',
          explanation: 'Think of an auction with two visible columns on a chalkboard. On the left are BUYERS (the Bids), with the highest bidder sitting at the top: "I\'ll pay ₹99 for 50 shares". On the right are SELLERS (the Asks), with the lowest seller at the top: "I\'ll sell for ₹100 for 100 shares". Notice the difference: ₹100 − ₹99 = ₹1. That tiny gap is the SPREAD. No trade happens until either a buyer steps up to ₹100 or a seller steps down to ₹99!',
          realLifeAnalogy: 'Think of a currency exchange counter at an airport: they buy dollars from you at ₹82, but sell dollars to you at ₹85. The difference is the spread.',
          keyTakeaway: 'A narrow spread (e.g. ₹0.05 on Reliance) means high liquidity and low transaction friction. A wide spread costs you money the moment you enter and exit.'
        },
        deepDive: {
          technicalOverview: 'Electronic order matching engines sort buy orders in descending price order and sell orders in ascending price order, applying price-time priority (orders at the same price fill in the sequence they arrived).',
          formulasAndMetrics: [
            {
              label: 'Bid-Ask Spread %',
              formula: 'Spread % = ((Lowest Ask − Highest Bid) / Lowest Ask) × 100',
              detail: 'Liquid blue-chip stocks typically exhibit spread percentages under 0.02%.'
            }
          ],
          marketMechanics: 'High-frequency market makers continuously post bid and ask quotes, earning the fractional spread in exchange for providing instant liquidity to retail participants.',
          riskInsight: 'In illiquid penny stocks, the spread can be 5% to 10%, meaning you instantly start at a severe loss the second you execute.'
        },
        interactiveType: 'order_book',
        quiz: [
          {
            id: 'les_3_2_q1',
            question: 'What does a very narrow Bid-Ask spread (like ₹0.05 on a ₹1,000 stock) indicate?',
            options: [
              'High liquidity with abundant buyers and sellers trading actively',
              'The stock is frozen and no one wants it',
              'The company is going bankrupt tomorrow',
              'The stock exchange is charging higher penalty taxes'
            ],
            correctIndex: 0,
            explanation: 'Tight spreads signify high market depth and liquidity, allowing orders to execute smoothly with minimal transaction cost friction.'
          },
          {
            id: 'les_3_2_q2',
            question: 'In the market depth (order book), what is the "Bid" price and what is the "Ask" (or Offer) price?',
            options: [
              'Bid is the highest price a buyer is offering to pay; Ask is the lowest price a seller is willing to accept',
              'Bid is the price set by the government; Ask is the broker fee',
              'Bid is yesterday closing price; Ask is tomorrow forecast',
              'Bid is for sellers; Ask is for buyers'
            ],
            correctIndex: 0,
            explanation: 'Bids represent buyers queuing to buy at their stated prices; Asks represent sellers offering to sell.'
          },
          {
            id: 'les_3_2_q3',
            question: 'If highest Bid is ₹498 and lowest Ask is ₹502, what is the Bid-Ask spread?',
            options: [
              '₹4 (₹502 − ₹498 = ₹4)',
              '₹1,000',
              '₹500',
              '₹0.50'
            ],
            correctIndex: 0,
            explanation: 'The spread is the difference between lowest ask and highest bid: 502 − 498 = ₹4.'
          },
          {
            id: 'les_3_2_q4',
            question: 'What rule does the electronic exchange matching engine use to determine which order gets filled first among multiple orders at the same price?',
            options: [
              'Price-Time Priority (the order that arrived earliest at that price executes first)',
              'Alphabetical order of the trader name',
              'The trader with the largest Instagram following',
              'Random lottery draw every minute'
            ],
            correctIndex: 0,
            explanation: 'Modern electronic exchanges strictly use Price-Time Priority: best price first, and earliest timestamp among identical prices.'
          },
          {
            id: 'les_3_2_q5',
            question: 'In India and most major global exchanges, what is the standard settlement cycle for equity delivery (T+1)?',
            options: [
              'Trade day plus 1 business day (shares and funds finalize settlement by the next working day)',
              'Trade day plus 10 months',
              'Instant cash hand-to-hand delivery at the post office',
              'Trade day plus 30 calendar days'
            ],
            correctIndex: 0,
            explanation: 'Under the modern T+1 settlement cycle, bought shares transfer into your Demat account on the next business day following execution.'
          }
        ]
      }
    ]
  },

  // LEVEL 4: UNDERSTANDING COMPANIES & VALUATION
  {
    id: 'mod_4',
    levelNumber: 4,
    title: 'Understanding Companies & Valuation',
    tagline: 'From revenue to net profit, margins, P/E ratios, and spotting financial red flags.',
    badge: 'Forensic Lab',
    icon: 'Building2',
    prerequisites: ['mod_3'],
    estimatedTime: '~35 mins',
    skills: ['Income statement reading', 'Operating margin calculation', 'P/E multiple evaluation', 'Price-to-Book tangible check'],
    conceptsPreview: ['Revenue vs. Net Profit Waterfall', 'Earnings Per Share (EPS)', 'Price-to-Earnings (P/E) Benchmarking', 'Debt-to-Equity Red Flags'],
    lessons: [
      {
        id: 'les_4_1',
        moduleId: 'mod_4',
        title: 'The Financial Waterfall: Revenue to Net Profit',
        shortDesc: 'Why high sales mean nothing if a company burns all its cash on costs.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The Lemonade Stand Waterfall',
          explanation: 'Imagine you run a lemonade stand. On a hot summer day, customers hand you ₹1,000. That entire ₹1,000 is your REVENUE (Sales/Top-line). But can you put ₹1,000 into your wallet? No! You must pay ₹300 for lemons and sugar (Raw materials), ₹200 to your helper (Wages), ₹100 to rent the sidewalk table (Operating expense), and ₹50 in taxes to the municipality. What is left at the very bottom of the bucket (₹350) is your NET PROFIT (Bottom-line). Only net profit belongs to you as the owner!',
          realLifeAnalogy: 'Revenue is vanity. Profit is sanity. Cash flow is reality.',
          keyTakeaway: 'A company boasting "₹10,000 Crore in sales!" could still be losing ₹2,000 Crore every year. Always inspect the net profit margin.'
        },
        deepDive: {
          technicalOverview: 'A standard Profit & Loss statement cascades from Gross Revenue → COGS (Cost of Goods Sold) → Gross Margin → Operating Expenses (SG&A, R&D) → Operating Profit (EBITDA) → Depreciation & Amortization → Interest on Debt → Corporate Taxes → Net Income (PAT).',
          formulasAndMetrics: [
            {
              label: 'Net Profit Margin %',
              formula: 'Net Margin % = (Net Income / Total Revenue) × 100',
              detail: 'A steady net margin above 15% across several years indicates strong pricing power and operational discipline.'
            },
            {
              label: 'Earnings Per Share (EPS)',
              formula: 'EPS = Net Profit / Total Number of Outstanding Shares',
              detail: 'Tells you how many rupees of net profit the business generated for each share you hold.'
            }
          ],
          marketMechanics: 'Stock prices over multi-year periods track the growth trajectory of Earnings Per Share (EPS) and Return on Capital Employed (ROCE).',
          riskInsight: 'Watch out for companies that report accounting profit but have negative Cash Flow from Operations (CFO)—that frequently signals aggressive or fraudulent revenue recognition.'
        },
        interactiveType: 'revenue_waterfall',
        quiz: [
          {
            id: 'les_4_1_q1',
            question: 'If a company has ₹500 Crore in annual sales (revenue) and ₹550 Crore in total operating costs, interest, and taxes, what is its status?',
            options: [
              'It has a Net Loss of ₹50 Crore',
              'It has a Net Profit of ₹50 Crore because sales were very large',
              'It can pay huge dividends to shareholders',
              'The stock price must automatically increase by 10%'
            ],
            correctIndex: 0,
            explanation: 'When expenses exceed revenues, the firm generates a net loss. Continued losses consume cash reserves and risk insolvency.'
          },
          {
            id: 'les_4_1_q2',
            question: 'Company X generates ₹1,000 Crore in revenue and reports ₹200 Crore in net profit after all expenses. What is its Net Profit Margin?',
            options: [
              '20% (₹200 Cr / ₹1,000 Cr = 20%)',
              '5%',
              '200%',
              '2%'
            ],
            correctIndex: 0,
            explanation: 'Net Profit Margin is (Net Profit / Total Revenue) × 100 = (200 / 1000) × 100 = 20%.'
          },
          {
            id: 'les_4_1_q3',
            question: 'Why is Operating Cash Flow (CFO) often a safer gauge of business health than reported Net Accounting Profit?',
            options: [
              'Because cash flow shows actual money deposited into the bank, whereas accounting profit can include uncollected credit invoices and estimates',
              'Because accounting profit is illegal in public markets',
              'Because cash flow only counts on holidays',
              'Because cash flow ignores bank balances'
            ],
            correctIndex: 0,
            explanation: 'Cash Flow from Operations tracks genuine physical cash moving in and out, revealing whether accounting profits are turning into real bank balances.'
          },
          {
            id: 'les_4_1_q4',
            question: 'What does Earnings Per Share (EPS) tell an individual shareholder?',
            options: [
              'The portion of company net profit allocated to each individual outstanding share',
              'The total price you must pay to enter the stock exchange',
              'The salary of the chief executive officer',
              'The exact dividend you will receive tomorrow'
            ],
            correctIndex: 0,
            explanation: 'EPS is Net Profit divided by total outstanding shares, standardizing profitability on a per-share basis.'
          },
          {
            id: 'les_4_1_q5',
            question: 'What happens when a company with heavy debt (High Debt-to-Equity ratio) experiences a 20% drop in revenue during an economic slowdown?',
            options: [
              'Its fixed interest payments remain due, creating severe financial strain and risk of default',
              'The banks forgive all loans automatically',
              'The company profit increases by 20%',
              'Debt turns into equity without shareholder approval'
            ],
            correctIndex: 0,
            explanation: 'Debt requires mandatory fixed interest payments regardless of sales volume; when revenues fall, high debt quickly threatens company solvency.'
          }
        ]
      },
      {
        id: 'les_4_2',
        moduleId: 'mod_4',
        title: 'Valuation Ratios: P/E and P/B Made Simple',
        shortDesc: 'How to tell whether a stock is priced like an affordable car or an overpriced luxury mansion.',
        readTimeMinutes: 6,
        eli15: {
          analogyTitle: 'Buying an Apartment for Rental Income',
          explanation: 'Suppose you are looking to buy an apartment that generates ₹1,00,000 in rental profit every year. Seller A asks ₹10,00,000 for the apartment. You are paying 10 times annual profit (P/E = 10). Seller B across the street has an identical apartment earning the same ₹1,00,000, but asks ₹50,00,000! You would be paying 50 times annual profit (P/E = 50). The Price-to-Earnings (P/E) ratio simply asks: "How many rupees are you paying today for ₹1 of company profit?"',
          realLifeAnalogy: 'P/E = Price tag compared to what the business actually puts in its pocket every year.',
          keyTakeaway: 'A high P/E (e.g. 80) means investors expect explosive future profit growth. A low P/E (e.g. 12) might mean a bargain—or a troubled, declining business.'
        },
        deepDive: {
          technicalOverview: 'The Price-to-Earnings (P/E) multiple normalizes valuation across companies of different absolute sizes. Comparing P/E is only meaningful within the same sector (e.g. comparing IT company to IT company, not IT to steel manufacturers) and against the company\'s own 5-year historical median.',
          formulasAndMetrics: [
            {
              label: 'Price-to-Earnings Ratio',
              formula: 'P/E = Current Share Price / Annual EPS',
              detail: 'Inverse of P/E is the Earnings Yield (E/P). A P/E of 20 equals a 5% earnings yield.'
            },
            {
              label: 'Price-to-Book Ratio',
              formula: 'P/B = Market Price per Share / Book Value per Share',
              detail: 'Book value represents the net worth (Assets minus Liabilities) per share recorded on the balance sheet.'
            }
          ],
          marketMechanics: 'Value investing focuses on buying solid balance sheets at low P/E and P/B multiples. Growth investing pays higher multiples for companies expanding earnings at 25%+ per year.',
          riskInsight: 'Beware the "Value Trap": a stock with a tiny P/E of 5 looks cheap, but may be a dying business whose earnings are collapsing rapidly.'
        },
        quiz: [
          {
            id: 'les_4_2_q1',
            question: 'If Company X trades at ₹300 per share and earns ₹15 in annual net profit per share (EPS), what is its P/E ratio?',
            options: [
              'P/E of 20 (₹300 / ₹15 = 20)',
              'P/E of 300',
              'P/E of 45',
              'P/E of 2'
            ],
            correctIndex: 0,
            explanation: 'P/E is current price divided by EPS: 300 / 15 = 20. Investors are paying ₹20 for every ₹1 of current annual earnings.'
          },
          {
            id: 'les_4_2_q2',
            question: 'Why is it misleading to directly compare the P/E ratio of a fast-growing Software Cloud company (P/E 60) with a Capital-Intensive Steel Mill (P/E 8)?',
            options: [
              'Different business models have vastly different capital requirements, growth rates, margins, and reinvestment needs',
              'Because steel mills are illegal on the stock exchange',
              'Because software companies do not have shareholders',
              'Because P/E ratios are only calculated for steel companies'
            ],
            correctIndex: 0,
            explanation: 'P/E multiples reflect sector-specific growth rates, return on capital, and cyclicality. Compare companies within the same peer industry.'
          },
          {
            id: 'les_4_2_q3',
            question: 'What is a "Value Trap" in fundamental investing?',
            options: [
              'A stock that looks cheap with a low P/E or low P/B, but whose underlying business is permanently deteriorating or facing insolvency',
              'A high-growth stock that splits 2-for-1',
              'A dividend payment that arrives on Friday',
              'An index fund that tracks top 50 companies'
            ],
            correctIndex: 0,
            explanation: 'A value trap appears statistically cheap on trailing metrics, but declining earnings soon make the stock expensive in hindsight.'
          },
          {
            id: 'les_4_2_q4',
            question: 'What does a Price-to-Book (P/B) ratio of 0.8 typically signify for a manufacturing or banking company?',
            options: [
              'The stock is trading below the net accounting book value of its balance sheet assets',
              'The company has 80 times more debt than revenue',
              'The company share price is ₹0.80',
              'The stock will double tomorrow morning'
            ],
            correctIndex: 0,
            explanation: 'A P/B under 1.0 means market valuation is less than the net book assets recorded on the company balance sheet.'
          },
          {
            id: 'les_4_2_q5',
            question: 'If Company A and Company B both trade at ₹100 per share, but Company A earns EPS of ₹10 (P/E = 10) while Company B earns EPS of ₹1 (P/E = 100), which statement is true?',
            options: [
              'Company A is offering more current earnings per rupee invested than Company B, despite identical absolute stock prices',
              'Company B is 10 times cheaper because 100 is bigger',
              'Both companies are identical because their share prices are both ₹100',
              'Company A is going bankrupt'
            ],
            correctIndex: 0,
            explanation: 'Never judge a stock by absolute share price alone. Company A yields a 10% earnings yield (₹10/₹100) vs Company B\'s 1% yield (₹1/₹100).'
          }
        ]
      }
    ]
  },

  // LEVEL 5: READING CHARTS & PRICE ACTION
  {
    id: 'mod_5',
    levelNumber: 5,
    title: 'Reading Charts & Price Action',
    tagline: 'Candlesticks, support, resistance, trendlines, and the footprints of institutional money.',
    badge: 'Chart Lab',
    icon: 'LineChart',
    prerequisites: ['mod_4'],
    estimatedTime: '~35 mins',
    skills: ['Candlestick sentiment interpretation', 'Key support identification', 'Resistance zone mapping', 'Volume breakout confirmation'],
    conceptsPreview: ['OHLC Candlestick Anatomy', 'Wicks as Price Rejection', 'Polarity Principle (Old Resistance = New Support)', 'Dynamic Moving Averages'],
    lessons: [
      {
        id: 'les_5_1',
        moduleId: 'mod_5',
        title: 'Candlestick Anatomy: The Visual Tug-of-War',
        shortDesc: 'Learn how four numbers (Open, High, Low, Close) reveal buyer and seller psychology.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The Battlefield Flag',
          explanation: 'Imagine a daily tug-of-war battle between the Bulls (Buyers pushing price up) and the Bears (Sellers pushing price down). A Candlestick is the battle report! The colored rectangular box (the Body) shows where price opened and closed. If it is Green, buyers won the round. If it is Red, sellers pushed it lower. The thin sticks sticking out of the top and bottom (the Wicks/Shadows) show how high and low the battle reached before one team retreated.',
          realLifeAnalogy: 'A long upper wick means buyers tried to push price up to the sky, but sellers slammed the door shut and pushed it back down. That is a rejection of higher prices.',
          keyTakeaway: 'Candlesticks summarize market sentiment over any chosen timeframe (1 minute, 1 hour, or 1 day).'
        },
        deepDive: {
          technicalOverview: 'Each Japanese candlestick encodes four data points: Open, High, Low, Close (OHLC). The range between Open and Close is the real body. The extreme wicks mark liquidity sweeps and intra-session rejection.',
          formulasAndMetrics: [
            {
              label: 'True Range',
              formula: 'TR = Max(High − Low, |High − Prior Close|, |Low − Prior Close|)',
              detail: 'Forms the basis for volatility indicators like ATR (Average True Range).'
            }
          ],
          marketMechanics: 'Candlesticks summarize market sentiment during a discrete timeframe. Higher timeframes (daily/weekly) contain less random market noise than 1-minute intraday charts.',
          riskInsight: 'Never trade off a single candlestick pattern in isolation. Patterns only have statistical edge when evaluated in context with support, resistance, and trading volume.'
        },
        interactiveType: 'candlestick_anatomy',
        quiz: [
          {
            id: 'les_5_1_q1',
            question: 'What does a long upper wick (shadow) with a tiny body at the bottom of the candle typically signify?',
            options: [
              'Buyers pushed prices aggressively higher, but sellers stepped in with heavy supply and pushed it back down',
              'The market was closed during that hour',
              'Prices never moved at all',
              'The company paid a huge dividend'
            ],
            correctIndex: 0,
            explanation: 'The long upper wick marks the high of the session, but sellers rejected those higher prices and forced the close near the session low.'
          },
          {
            id: 'les_5_1_q2',
            question: 'What four price points construct every standard Japanese Candlestick?',
            options: [
              'Open, High, Low, Close (OHLC)',
              'Interest Rate, Tax Rate, Inflation, Gold Price',
              'CEO Age, Dividend, Revenue, Cash',
              'Yesterday High, Today High, Tomorrow High, Day After High'
            ],
            correctIndex: 0,
            explanation: 'Every candlestick represents the Open, High, Low, and Close prices for that specified timeframe.'
          },
          {
            id: 'les_5_1_q3',
            question: 'What does a long lower wick (hammer-like shape) formed at a major multi-month support level suggest?',
            options: [
              'Sellers attempted to push prices down, but buyers stepped in with strong demand to reject lower prices',
              'The stock is definitely going to zero today',
              'Trading has been permanently halted by the exchange',
              'The broker made a typographical error'
            ],
            correctIndex: 0,
            explanation: 'A long lower shadow indicates buyer absorption of sell orders, signaling potential price rejection and demand defense.'
          },
          {
            id: 'les_5_1_q4',
            question: 'Why do daily and weekly timeframe charts generally provide more reliable technical signals than 1-minute charts?',
            options: [
              'Higher timeframes aggregate significantly more institutional volume and filter out intraday high-frequency noise',
              'Because 1-minute charts are illegal for retail traders',
              'Because daily candles are drawn by hand by exchange officials',
              'Because weekly candles never have wicks'
            ],
            correctIndex: 0,
            explanation: 'Daily/weekly candles represent billions in collective institutional order flow, making support/resistance zones far more robust.'
          },
          {
            id: 'les_5_1_q5',
            question: 'What is a "Doji" candlestick characterized by?',
            options: [
              'An Open and Close price that are virtually identical, reflecting equilibrium or indecision between buyers and sellers',
              'A giant green rectangle with no wicks',
              'A candle that only appears on Sunday',
              'A candle with zero trading volume'
            ],
            correctIndex: 0,
            explanation: 'Dojis form when opening and closing prices are virtually equal, representing market balance and potential pause/reversal.'
          }
        ]
      },
      {
        id: 'les_5_2',
        moduleId: 'mod_5',
        title: 'Support, Resistance & Trend Lines',
        shortDesc: 'Floors, ceilings, and where market memory creates turning points.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The Bouncing Rubber Ball in a Two-Story Room',
          explanation: 'Imagine bouncing a rubber ball inside a room. When it hits the floor, it bounces back up. The floor is SUPPORT (a price level where buyers step in because they feel it is a bargain). When the ball hits the ceiling, it bounces back down. The ceiling is RESISTANCE (a price level where sellers say "this is expensive, let me take profits"). If the ball is thrown with tremendous force, it can punch through the ceiling—that is a BREAKOUT!',
          realLifeAnalogy: 'Support = Price Floor where buyers gather. Resistance = Price Ceiling where sellers gather. Breakout = Punching through with high volume.',
          keyTakeaway: 'Support and resistance are zones where previous trading decisions create collective memory for market participants.'
        },
        deepDive: {
          technicalOverview: 'Support and resistance arise from institutional order blocks, anchor points, and loss-aversion psychology. When price breaks cleanly above resistance, that prior ceiling frequently becomes new support (Polarity Principle), as previous short-sellers cover and breakout traders defend their entry level.',
          formulasAndMetrics: [
            {
              label: 'Volume Confirmation',
              formula: 'Valid Breakout ∝ Elevated Volume (> 1.5× 20-day MA Volume)',
              detail: 'A breakout on low volume is often a "Bull Trap" that quickly snaps back into the previous range.'
            }
          ],
          marketMechanics: 'Moving averages (such as 50-day and 200-day Simple Moving Averages) also act as dynamic support and resistance zones widely tracked by algorithmic institutional funds.',
          riskInsight: 'Never assume support will hold forever. A prudent participant always defines a stop-loss just below support in case the floor collapses.'
        },
        quiz: [
          {
            id: 'les_5_2_q1',
            question: 'What happens according to the Polarity Principle when price decisively breaks above a long-standing resistance ceiling?',
            options: [
              'That former resistance level often acts as new support on subsequent pullbacks',
              'The stock exchange closes trading for the month',
              'The company must issue new shares immediately',
              'Support is permanently erased from the chart'
            ],
            correctIndex: 0,
            explanation: 'Once resistance is broken, previous sellers who missed out and breakout buyers often defend that level, transforming old resistance into new support.'
          },
          {
            id: 'les_5_2_q2',
            question: 'Why is trading volume essential when evaluating whether a breakout above resistance is genuine or a fakeout ("Bull Trap")?',
            options: [
              'High volume confirms institutional participation and conviction; low-volume breakouts frequently lack follow-through and collapse',
              'Volume determines the color of your laptop screen',
              'Volume is used by tax authorities to charge extra fees',
              'Breakouts never fail if they happen on a Monday'
            ],
            correctIndex: 0,
            explanation: 'Breakouts with heavy volume signify large institutional buying power absorbing overhead supply.'
          },
          {
            id: 'les_5_2_q3',
            question: 'A stock has bounced upward from ₹450 three separate times over the past 6 months. What is the ₹450 level called?',
            options: [
              'A major Support level / demand floor',
              'An illegal price ceiling',
              'A dividend checkpoint',
              'A market order queue'
            ],
            correctIndex: 0,
            explanation: 'A price level where buyers consistently step in to halt declines and push price back upward is a key Support zone.'
          },
          {
            id: 'les_5_2_q4',
            question: 'How do technical traders use the 200-day Simple Moving Average (SMA)?',
            options: [
              'As a widely tracked institutional indicator of the long-term trend and dynamic support/resistance benchmark',
              'To calculate the exact date of next year IPOs',
              'To guarantee that a stock cannot fall more than ₹1',
              'To eliminate broker commissions'
            ],
            correctIndex: 0,
            explanation: 'The 200-day SMA is a cornerstone macro trend indicator used by global funds to distinguish long-term uptrends from structural downtrends.'
          },
          {
            id: 'les_5_2_q5',
            question: 'If an investor buys a stock near support at ₹500, where is the most logical placement for their protective Stop-Loss?',
            options: [
              'Just below the support level (e.g. ₹490), where the bullish support thesis would be proven mathematically invalid',
              'At ₹600 above the target',
              'Traders should never use stop-losses',
              'At ₹0'
            ],
            correctIndex: 0,
            explanation: 'A disciplined stop-loss sits slightly below the structure that invalidates your trade idea if breached.'
          }
        ]
      }
    ]
  },

  // LEVEL 6: INVESTING VS TRADING FRAMEWORKS
  {
    id: 'mod_6',
    levelNumber: 6,
    title: 'Investing vs. Trading Frameworks',
    tagline: 'Time horizons, fundamental vs technical analysis, and finding your edge.',
    badge: 'Strategy Lab',
    icon: 'Target',
    prerequisites: ['mod_5'],
    estimatedTime: '~30 mins',
    skills: ['Time horizon alignment', 'Strategy selection', 'Risk tolerance assessment', 'Active vs Passive balancing'],
    conceptsPreview: ['Value & Growth Investing', 'Swing vs Day Trading', 'Drawdown Tolerance', 'Tax & Friction Drag'],
    lessons: [
      {
        id: 'les_6_1',
        moduleId: 'mod_6',
        title: 'Fundamental Investor vs. Technical Trader',
        shortDesc: 'Understand which toolkit matches your goals, personality, and schedule.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The Real Estate Landlord vs The House Flipper',
          explanation: 'The Fundamental Investor is like a landlord who buys an apartment building in an up-and-coming neighborhood. They don\'t check housing prices every morning—they care about reliable tenants, rising rental income, and city development over 10 years. The Technical Trader is like a house flipper who buys a property today because short-term demand spiked, paints the walls, and sells it next week for a quick 5% profit margin. Both can succeed, but they play completely different games with completely different rules.',
          realLifeAnalogy: 'Investor asks: "Is this a great business at a fair price?" Trader asks: "Where is the momentum and where is my stop-loss?"',
          keyTakeaway: 'You do not need to compete with full-time professional day traders. For 95% of working professionals, disciplined long-term investing creates far superior peace of mind and cumulative wealth.'
        },
        deepDive: {
          technicalOverview: 'Fundamental analysis studies financial statements, management quality, competitive moats (Porter\'s Five Forces), and discounted cash flows (DCF). Technical analysis studies price trends, volume flow, market structure, and statistical indicators to exploit short-term supply/demand imbalances.',
          formulasAndMetrics: [
            {
              label: 'Transaction Friction Impact',
              formula: 'Net Return = Gross Return − (Brokerage + STT + Slippage + Short-Term Taxes)',
              detail: 'Frequent intraday trading can generate 15-25% annual performance drag purely in transaction costs.'
            }
          ],
          marketMechanics: 'Institutional hedge funds use algorithmic high-frequency trading (HFT) with colocation servers measuring latency in microseconds. Competing with HFT on intraday speed is a structural disadvantage for retail traders.',
          riskInsight: 'Clarity of identity is essential. Never start a trade as a "quick swing trade" and then turn it into a "long-term investment" just because it went into a loss.'
        },
        quiz: [
          {
            id: 'les_6_1_q1',
            question: 'What is a dangerous psychological mistake commonly made by beginner traders?',
            options: [
              'Buying a short-term trade, watching it drop past the stop-loss, and refusing to sell by claiming "I am now a long-term investor in this company"',
              'Having a written trading plan and executing it calmly',
              'Checking the company annual report before buying long-term shares',
              'Keeping cash reserves for emergencies'
            ],
            correctIndex: 0,
            explanation: 'Turning a failed short-term trade into a forced long-term holding is an emotional rationalization that ties up capital in depreciating assets.'
          },
          {
            id: 'les_6_1_q2',
            question: 'How does high portfolio turnover (frequent buying and selling) affect net trading results over a year?',
            options: [
              'It creates heavy cumulative drag from brokerage charges, Securities Transaction Tax (STT), exchange turnover fees, and short-term capital gains tax',
              'It eliminates all taxes completely',
              'It guarantees an extra 20% annual return from the government',
              'It has zero mathematical effect on returns'
            ],
            correctIndex: 0,
            explanation: 'Frequent turnover racks up transaction costs, slippage, and taxes, significantly reducing net compounded profits.'
          },
          {
            id: 'les_6_1_q3',
            question: 'What is a "Competitive Moat" that fundamental investors seek in great long-term companies?',
            options: [
              'A durable competitive advantage (such as strong brand loyalty, patents, network effects, or high switching costs) that protects profits from competitors',
              'A water canal dug around the company office building',
              'A high day-trading volume on 5-minute charts',
              'A government grant that lasts 2 days'
            ],
            correctIndex: 0,
            explanation: 'An economic moat protects a company\'s market share and pricing power against competitive encroachment for decades.'
          },
          {
            id: 'les_6_1_q4',
            question: 'Why do most working professionals choose systematic index investing or swing investing over full-time intraday scalping?',
            options: [
              'Because long-term investing requires minimal daily screen time while capturing broad economic growth without competing against high-frequency trading algorithms',
              'Because working professionals are prohibited by law from opening trading accounts',
              'Because index funds are run by artificial intelligence robots that never sleep',
              'Because intraday trading is only allowed on weekends'
            ],
            correctIndex: 0,
            explanation: 'Systematic investing allows individuals to build wealth alongside their career without the intense stress and screen time of intraday trading.'
          },
          {
            id: 'les_6_1_q5',
            question: 'What core question does a Technical Swing Trader ask before taking an entry?',
            options: [
              '"Is there a clear market structure and trend, where is my invalidation stop-loss, and does the reward outweigh the risk?"',
              '"What is the CEO favorite color?"',
              '"Will this company double its factory size over the next 30 years?"',
              '"Can I borrow 100% of my neighbor savings for this trade?"'
            ],
            correctIndex: 0,
            explanation: 'Traders focus on quantifiable edge, risk-to-reward asymmetry, and precise invalidation levels on the chart.'
          }
        ]
      },
      {
        id: 'les_6_2',
        moduleId: 'mod_6',
        title: 'Time Horizons & Drawdown Tolerance',
        shortDesc: 'Why aligning your time horizon with your liquidity needs is the foundation of peace of mind.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The Marathon Runner vs The 100m Sprinter',
          explanation: 'If a marathon runner starts sprinting at maximum speed in the first 100 meters, they will collapse long before the 42km finish line! In finance, time horizon is your pacing. If you are investing for retirement 25 years away, short-term quarterly market dips are just opportunities to buy shares at lower prices. But if you need the money in 6 months to buy a house, you cannot afford a 30% temporary drawdown.',
          realLifeAnalogy: 'Patience transforms market volatility from a terrifying enemy into a wealth-building friend.',
          keyTakeaway: 'Define when you will need the money BEFORE you allocate it to any asset class.'
        },
        deepDive: {
          technicalOverview: 'Maximum Drawdown measures the peak-to-trough decline of a portfolio before a new peak is achieved. Volatility is not the same as permanent capital loss, provided the participant has the liquidity horizon to hold through cyclical market contractions.',
          formulasAndMetrics: [
            {
              label: 'Maximum Drawdown (MDD)',
              formula: 'MDD = (Trough Value − Peak Value) / Peak Value',
              detail: 'Historical Nifty 50 drawdowns in major bear markets (2008, 2020) ranged from 30% to 55% before recovering to new all-time highs.'
            }
          ],
          marketMechanics: 'Historical rolling returns show that holding a diversified broad-market index fund for 7+ years dramatically reduces the probability of experiencing a negative return in Indian equities.',
          riskInsight: 'The biggest financial risk is not a market crash; it is being forced to sell your quality assets at the very bottom of a crash because you lacked an emergency cash buffer.'
        },
        quiz: [
          {
            id: 'les_6_2_q1',
            question: 'What is the primary danger of having an emergency fund of zero while investing 100% of your net worth in stocks?',
            options: [
              'An unexpected medical or job emergency could force you to liquidate stocks at the worst possible time during a market crash',
              'The stock exchange will deduct 50% penalty fees from your shares',
              'Your company shares will automatically convert into physical paper certificates',
              'Bank ATMs will stop working for you'
            ],
            correctIndex: 0,
            explanation: 'An emergency fund insulates your portfolio, ensuring you never become a forced seller during temporary market downturns.'
          },
          {
            id: 'les_6_2_q2',
            question: 'If a portfolio drops from a peak of ₹10,00,000 to ₹7,00,000 during a market correction, what is its Drawdown?',
            options: [
              '30% Drawdown ((₹10L − ₹7L) / ₹10L = 30%)',
              '70% Drawdown',
              '3% Drawdown',
              '₹300 Drawdown'
            ],
            correctIndex: 0,
            explanation: 'Drawdown is calculated as (Trough − Peak) / Peak: (7,00,000 − 10,00,000) / 10,00,000 = −30%.'
          },
          {
            id: 'les_6_2_q3',
            question: 'How should an investor view a 20% broad-market correction when they have a 20-year investment horizon and steady monthly income?',
            options: [
              'As a routine market cycle that allows them to accumulate valuable business shares at discounted prices via systematic investing',
              'As proof that all world businesses have failed forever',
              'As a reason to immediately sell everything at the bottom and never invest again',
              'As an error in the stock broker software'
            ],
            correctIndex: 0,
            explanation: 'For long-term accumulators, periodic market drawdowns lower average acquisition costs through disciplined dollar-cost averaging.'
          },
          {
            id: 'les_6_2_q4',
            question: 'What is the standard recommended size for a personal emergency fund before aggressively allocating to volatile equity investments?',
            options: [
              '3 to 6 months of essential living expenses kept in safe, liquid accounts',
              'Exactly ₹500',
              '25 years of luxury vacations',
              'Zero, because emergency funds are never needed'
            ],
            correctIndex: 0,
            explanation: 'A 3-6 month liquid safety cushion provides resilience against unforeseen emergencies without touching your long-term investments.'
          },
          {
            id: 'les_6_2_q5',
            question: 'What happens to the probability of experiencing a negative return in a diversified index fund as holding time increases from 1 day to 10 years?',
            options: [
              'The probability of a negative return drops drastically toward zero historically as business earnings compound',
              'The probability of losing money increases to 100%',
              'The return remains identical to a fixed deposit every single day',
              'Nothing changes because time has no impact on investing'
            ],
            correctIndex: 0,
            explanation: 'Historical market data shows that longer holding periods (7-10+ years) in broad indices overwhelmingly reward patient capital.'
          }
        ]
      }
    ]
  },

  // LEVEL 7: RISK MANAGEMENT: CAPITAL SURVIVAL
  {
    id: 'mod_7',
    levelNumber: 7,
    title: 'Risk Management: Capital Survival',
    tagline: 'Position sizing, stop-loss math, risk/reward ratios, and never blowing up.',
    badge: 'Non-Negotiable',
    icon: 'ShieldAlert',
    prerequisites: ['mod_6'],
    estimatedTime: '~35 mins',
    skills: ['Position sizing calculation', 'Hard stop-loss placement', 'Risk-to-reward optimization', 'Drawdown recovery math'],
    conceptsPreview: ['The 1% Capital Rule', 'Setting Hard Stop-Losses', 'Position Sizing Formula', 'Asymmetric Payoff Structures'],
    lessons: [
      {
        id: 'les_7_1',
        moduleId: 'mod_7',
        title: 'The 1% Risk Rule & Position Sizing Calculator',
        shortDesc: 'Why professional traders obsess over defense while amateurs obsess over profits.',
        readTimeMinutes: 6,
        eli15: {
          analogyTitle: 'The Armor and Shield Rule',
          explanation: 'Imagine you go into a video game boss battle with 100 hit points (HP). If you risk 50 HP on a single reckless swing, two bad mistakes end your game! But if you only risk 1 HP per swing, you can withstand 20 consecutive missteps, learn the boss\'s attack patterns, and survive to win. In the market, your money is your HP. The golden rule of survival is: NEVER risk losing more than 1% or 2% of your total account on any single trade.',
          realLifeAnalogy: 'Position size is the volume knob. Even a good song will blow out your speakers if the volume is cranked to 100. Size your trades so no single loss can ever ruin your month.',
          keyTakeaway: 'Risk per trade is NOT how much stock you buy—it is the difference between your entry price and your stop-loss, multiplied by quantity.'
        },
        deepDive: {
          technicalOverview: 'Position sizing is the primary determinant of risk of ruin. The fixed fractional model ensures your dollar risk scales down during drawdown streaks and scales up only as capital expands.',
          formulasAndMetrics: [
            {
              label: 'Position Sizing Formula',
              formula: 'Shares to Buy = Account Risk (₹) / (Entry Price − Stop-Loss Price)',
              detail: 'Example: On ₹1,00,000 account, 1% risk = ₹1,000. If Buy = ₹100 and Stop = ₹90 (₹10 risk/share), buy exactly 100 shares (₹1,000 / ₹10 = 100).'
            },
            {
              label: 'Drawdown Asymmetry',
              formula: 'Loss of 10% requires +11.1% to recover; Loss of 50% requires +100% to recover; Loss of 90% requires +900%!',
              detail: 'Protecting capital is mathematically non-negotiable because deep drawdowns become nearly impossible to overcome.'
            }
          ],
          marketMechanics: 'Automated Stop-Loss Market (SL-M) and Stop-Loss Limit (SL) orders sit with the exchange matching engine and automatically trigger if prices breach your invalidation level.',
          riskInsight: 'Amateurs ask: "How much money can I make if I am right?" Professionals ask: "How much will I lose if I am wrong, and can I afford it?"'
        },
        interactiveType: 'risk_calculator',
        quiz: [
          {
            id: 'les_7_1_q1',
            question: 'You have an educational virtual portfolio of ₹1,00,000. You want to risk at most 1% (₹1,000) on a trade. You enter at ₹200 with a stop-loss at ₹190 (₹10 risk per share). How many shares can you buy?',
            options: [
              '100 shares (₹1,000 / ₹10 = 100)',
              '500 shares',
              '1,000 shares',
              '10 shares'
            ],
            correctIndex: 0,
            explanation: 'Max risk (₹1,000) divided by risk-per-share (₹200 − ₹190 = ₹10) = 100 shares. Total investment = ₹20,000; if stopped out at ₹190, loss is exactly ₹1,000 (1%).'
          },
          {
            id: 'les_7_1_q2',
            question: 'If your portfolio suffers a severe 50% loss, what percentage return is required on the remaining capital just to break even?',
            options: [
              '100% gain required',
              '50% gain required',
              '25% gain required',
              '10% gain required'
            ],
            correctIndex: 0,
            explanation: 'If ₹1,00,000 falls 50% to ₹50,000, you must make ₹50,000 on that remaining ₹50,000 balance—which is a 100% gain!'
          },
          {
            id: 'les_7_1_q3',
            question: 'Why is "Risk per Trade" NOT the same thing as the total rupee amount of shares you purchase?',
            options: [
              'Risk per trade is the difference between Entry Price and Stop-Loss Price multiplied by quantity; you do not lose the entire share value unless the stock goes to ₹0',
              'Because stock prices are imaginary numbers',
              'Because brokers reimburse 100% of stock purchases',
              'Because buying shares has zero risk'
            ],
            correctIndex: 0,
            explanation: 'If you buy ₹20,000 worth of stock with a stop-loss set to exit at a ₹1,000 loss, your actual risked capital on that trade is ₹1,000.'
          },
          {
            id: 'les_7_1_q4',
            question: 'What happens to a trader who risks 20% of their total capital on every single trade?',
            options: [
              'A routine streak of 4-5 consecutive normal losses will wipe out over 60-70% of their entire account (Risk of Ruin)',
              'They are guaranteed to become a billionaire in 3 weeks',
              'The exchange gives them a special medal of honor',
              'Their win rate automatically jumps to 99%'
            ],
            correctIndex: 0,
            explanation: 'Even high-performing strategies experience 4-5 consecutive losses. Risking 20% per trade guarantees mathematical catastrophe over time.'
          },
          {
            id: 'les_7_1_q5',
            question: 'In a trade setup offering a 1:3 Risk-to-Reward ratio, what does this mean?',
            options: [
              'You are risking ₹1 to potentially make ₹3 if the target is reached',
              'You must pay 3 times the stock price to enter',
              'You lose 3 times your money on every trade',
              'You must trade 3 different stocks simultaneously'
            ],
            correctIndex: 0,
            explanation: 'A 1:3 R:R means your projected profit target is 3 times larger than your defined stop-loss risk amount.'
          }
        ]
      },
      {
        id: 'les_7_2',
        moduleId: 'mod_7',
        title: 'Hard Stop-Losses & Drawdown Recovery Math',
        shortDesc: 'Why moving your stop-loss further away is the quickest path to disaster.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The Circuit Breaker in Your Home',
          explanation: 'When electrical wiring in your home gets overloaded, the circuit breaker instantly trips and shuts off the power. It does not negotiate or say "let\'s wait 5 minutes to see if the fire goes away on its own!" A hard Stop-Loss is your personal financial circuit breaker. When a trade idea fails, the stop-loss trips and cuts the trade cleanly. Moving your stop-loss further away while losing is like taping the circuit breaker open while smoke fills the room.',
          realLifeAnalogy: 'Small losses are the normal cost of doing business. Catastrophic losses happen when you refuse to accept a small loss.',
          keyTakeaway: 'Always place a hard stop-loss in the trading system when entering. Never rely on "mental stop-losses" when emotions run hot.'
        },
        deepDive: {
          technicalOverview: 'A hard stop-loss eliminates cognitive freeze and panic paralysis. The drawdown recovery curve is non-linear: beyond 20% drawdown, the required return to recover escalates exponentially.',
          formulasAndMetrics: [
            {
              label: 'Break-Even Recovery Formula',
              formula: 'Required Gain % = (Drawdown % / (1 − Drawdown %)) × 100',
              detail: 'Drawdown of 20% needs +25%; Drawdown of 40% needs +66.7%; Drawdown of 80% needs +400%!'
            }
          ],
          marketMechanics: 'Exchange stop orders execute automatically when the trigger price is touched, removing emotional hesitation from trade execution.',
          riskInsight: 'The cardinal sin of trading: NEVER add money to an existing losing short-term swing trade to "average down" without a written strategy.'
        },
        quiz: [
          {
            id: 'les_7_2_q1',
            question: 'Why do disciplined traders avoid relying purely on "Mental Stop-Losses"?',
            options: [
              'Because when real money is on the line, emotional denial and hope frequently prevent humans from executing the exit manually',
              'Because mental stop-losses are forbidden by internet service providers',
              'Because brokers charge higher fees for mental stops',
              'Because mental stop-losses always win 100%'
            ],
            correctIndex: 0,
            explanation: 'System-entered hard stop-losses execute without hesitation, eliminating emotional paralysis and bargaining.'
          },
          {
            id: 'les_7_2_q2',
            question: 'If an account suffers an 80% drawdown, what gain is required on the remaining capital to recover the original starting balance?',
            options: [
              '400% gain required ((0.80 / 0.20) × 100 = 400%)',
              '80% gain required',
              '40% gain required',
              '20% gain required'
            ],
            correctIndex: 0,
            explanation: 'If ₹1,00,000 drops 80% to ₹20,000, you need an ₹80,000 gain on that remaining ₹20,000 balance—which is a 400% return.'
          },
          {
            id: 'les_7_2_q3',
            question: 'What is the dangerous habit of "Averaging Down on a Bad Trade"?',
            options: [
              'Buying more shares as a losing trade collapses further without a plan, multiplying capital exposure on a failing thesis',
              'Calculating your monthly savings rate',
              'Investing in a diversified index fund every month',
              'Setting a trailing stop-loss to lock in profit'
            ],
            correctIndex: 0,
            explanation: 'Averaging down on speculative or failing trades dramatically increases position size right when the market is proving your thesis wrong.'
          },
          {
            id: 'les_7_2_q4',
            question: 'What is the primary psychological purpose of accepting a small planned loss in trading?',
            options: [
              'To protect the vast majority of your capital so you can calmly take the next high-probability setup',
              'To show off in social media groups',
              'To pay extra taxes to the government',
              'To prove that trading is impossible'
            ],
            correctIndex: 0,
            explanation: 'Small losses keep you alive in the market. Preserving 99% of your capital gives you total freedom to execute future opportunities.'
          },
          {
            id: 'les_7_2_q5',
            question: 'When should your stop-loss price and position size be calculated?',
            options: [
              'BEFORE you click the buy button, as an integral part of your pre-trade plan',
              'Three days after the stock has dropped 40%',
              'Only when your broker calls you for margin',
              'Never, because planning removes spontaneous fun'
            ],
            correctIndex: 0,
            explanation: 'Pre-defining your risk parameters before entering removes emotional bias and ensures strict capital discipline.'
          }
        ]
      }
    ]
  },

  // LEVEL 8: TRADING PSYCHOLOGY & EMOTIONAL TRAPS
  {
    id: 'mod_8',
    levelNumber: 8,
    title: 'Trading Psychology & Emotional Traps',
    tagline: 'Mastering FOMO, greed, revenge trading, and overconfidence.',
    badge: 'Mental Edge',
    icon: 'Brain',
    prerequisites: ['mod_7'],
    estimatedTime: '~30 mins',
    skills: ['FOMO identification', 'Emotional discipline', 'Trading journal maintenance', 'Overtrading prevention'],
    conceptsPreview: ['Prospect Theory & Loss Aversion', 'Revenge Trading Triggers', 'Sunk Cost Fallacy', 'Probability Thinking vs Certainty'],
    lessons: [
      {
        id: 'les_8_1',
        moduleId: 'mod_8',
        title: 'The Psychological Enemies: FOMO & Revenge Trading',
        shortDesc: 'Why smart people make irrational financial decisions and how to build discipline.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'Chasing the Speeding Train',
          explanation: 'Have you ever run down the train platform trying to jump onto a train that is already speeding away? It is dangerous and you are likely to hurt yourself. In the market, seeing a stock spike 30% and frantically buying because you fear missing out is called FOMO (Fear Of Missing Out). When that stock suddenly reverses and triggers your stop-loss, getting furious and immediately entering a huge random trade to "win back my money" is called REVENGE TRADING. Both are purely emotional traps.',
          realLifeAnalogy: 'Emotions make you react. A trading plan makes you respond. The market does not know you exist, has no personal grudge against you, and will not care if you get angry.',
          keyTakeaway: 'The market provides new opportunities every single week. Missing one move will not hurt you; chasing an overextended move will.'
        },
        deepDive: {
          technicalOverview: 'Behavioral finance demonstrates that humans suffer from Prospect Theory (Kahneman & Tversky): the psychological pain of a loss is roughly twice as intense as the pleasure of an equivalent gain (Loss Aversion). This causes beginners to hold losing trades for months hoping to break even, while cutting winning trades too quickly.',
          formulasAndMetrics: [
            {
              label: 'The Trader Psychology Cycle',
              formula: 'Optimism → Euphoria → Anxiety → Denial → Panic → Despair → Relief',
              detail: 'Maximum financial risk occurs at the point of maximum euphoria (when everyone feels invincible).'
            }
          ],
          marketMechanics: 'Consistently profitable practitioners keep a strict Trading Journal. Documenting your entry rationale, emotional state, and post-trade review removes emotional ambiguity and builds methodical consistency.',
          riskInsight: 'If you feel your heart racing or palms sweating while holding a position, your position size is too large for your emotional risk tolerance.'
        },
        quiz: [
          {
            id: 'les_8_1_q1',
            question: 'What is the most constructive response immediately after experiencing a planned stop-loss exit?',
            options: [
              'Record the trade in your journal, review whether you followed your plan, and take a calm break',
              'Double your position size on another stock to immediately win the money back',
              'Complain angrily in Telegram discussion rooms',
              'Refuse to ever use a stop-loss again'
            ],
            correctIndex: 0,
            explanation: 'Planned losses are a normal operational cost of trading. Journaling and remaining calm protects you from destructive revenge trading.'
          },
          {
            id: 'les_8_1_q2',
            question: 'What is "FOMO" (Fear of Missing Out) and why is it dangerous in markets?',
            options: [
              'An emotional impulse to jump into a stock that has already surged dramatically, usually buying right at the overextended peak before a sharp reversal',
              'A special order type approved by the exchange',
              'A method to calculate corporate earnings',
              'A government tax on long-term investors'
            ],
            correctIndex: 0,
            explanation: 'FOMO causes participants to chase overextended moves at high prices without a valid risk-to-reward setup.'
          },
          {
            id: 'les_8_1_q3',
            question: 'What is "Revenge Trading"?',
            options: [
              'Entering reckless, oversized emotional trades immediately after a loss in an aggressive attempt to recover lost capital',
              'Reporting an illegal scam to SEBI',
              'Closing a profitable trade at your predetermined target',
              'Reading the company annual balance sheet'
            ],
            correctIndex: 0,
            explanation: 'Revenge trading is triggered by wounded ego and anger, leading to rapid capital depletion.'
          },
          {
            id: 'les_8_1_q4',
            question: 'According to Prospect Theory (Kahneman & Tversky), why do untrained investors hold losing trades for months while cutting winning trades after tiny gains?',
            options: [
              'Loss Aversion: the psychological pain of realizing a loss is twice as strong as the pleasure of a gain, causing people to hold losers hoping to break even',
              'Because brokers force people to hold losers',
              'Because winning trades carry higher interest rates',
              'Because taxes are only paid on winning trades'
            ],
            correctIndex: 0,
            explanation: 'Humans naturally hate admitting defeat, leading to the toxic habit of riding big losers while taking premature profits on winners.'
          },
          {
            id: 'les_8_1_q5',
            question: 'If you feel your heart pounding, anxiety rising, or an urge to stare at 1-minute candles every 5 seconds, what is the clear diagnostic cause?',
            options: [
              'Your position size is too large for your risk tolerance—reduce your quantity until you can sleep and work peacefully',
              'Your internet router is too slow',
              'The stock market is broken',
              'You need to double your leverage'
            ],
            correctIndex: 0,
            explanation: 'Physical anxiety and obsession indicate excessive financial exposure. Scale down position size until you feel calm.'
          }
        ]
      },
      {
        id: 'les_8_2',
        moduleId: 'mod_8',
        title: 'Loss Aversion & Trading Journal Discipline',
        shortDesc: 'How keeping a written record turns emotional mistakes into permanent trading wisdom.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The Athlete\'s Game Film Review',
          explanation: 'Top Olympic athletes do not just finish a match and forget about it—they sit down with their coach and watch the recorded video tape of every pass, jump, and error. Your Trading Journal is your game film! Writing down why you entered, what emotions you felt, whether you followed your stop-loss, and what the outcome was reveals your hidden behavioral patterns. It is the only way to transform random luck into repeatable skill.',
          realLifeAnalogy: 'What gets measured gets managed. If you don\'t journal your trades, you are repeating the same expensive mistakes forever.',
          keyTakeaway: 'A disciplined trading journal is the ultimate bridge between theory and professional execution.'
        },
        deepDive: {
          technicalOverview: 'A quantitative trading journal tracks setup category, entry price, planned stop, actual exit, R-multiple achieved (P&L / initial risk), emotional state rating, and rule compliance boolean.',
          formulasAndMetrics: [
            {
              label: 'Expectancy Ratio',
              formula: 'Expectancy = (Win Rate × Avg Win R) − (Loss Rate × 1.0 R)',
              detail: 'A system with a 45% win rate and 2.0 R average win yields a positive expectancy of +0.35 R per trade.'
            }
          ],
          marketMechanics: 'Top proprietary trading desks require traders to submit journal reviews before opening new positions each week.',
          riskInsight: 'Never judge the quality of a decision solely by its outcome. A trade that followed the plan but took a planned 1% loss is a GREAT decision. A trade that broke all rules and got lucky is a POISONOUS win.'
        },
        quiz: [
          {
            id: 'les_8_2_q1',
            question: 'What is a "Toxic Win" in trading education?',
            options: [
              'A trade where you completely broke your risk rules and had no stop-loss, but accidentally made money through sheer luck, reinforcing dangerous gambling habits',
              'A trade that earned 100% on a regulated index fund',
              'A trade that paid dividends on time',
              'A trade with zero brokerage fees'
            ],
            correctIndex: 0,
            explanation: 'Toxic wins reinforce reckless behavior, tricking the trader into believing rules are unnecessary until the inevitable catastrophe occurs.'
          },
          {
            id: 'les_8_2_q2',
            question: 'What are the essential items every entry in a Trading Journal should document?',
            options: [
              'Setup thesis, entry price, hard stop-loss, planned target, position size, emotional state, and rule-adherence review',
              'Only the profit amount and social media hashtags',
              'The weather forecast in Mumbai',
              'The names of people who disagreed with your trade'
            ],
            correctIndex: 0,
            explanation: 'A complete journal records the technical setup, risk parameters, psychological state, and post-trade lessons.'
          },
          {
            id: 'les_8_2_q3',
            question: 'If a trading strategy has a 40% win rate (loses 60% of trades) but averages ₹3,000 on wins and ₹1,000 on losses, is it profitable over 100 trades?',
            options: [
              'Yes! Highly profitable: 40 wins × ₹3,000 = ₹1,20,000 gain; 60 losses × ₹1,000 = ₹60,000 loss; Net profit = +₹60,000',
              'No, because win rate is below 50%',
              'No, because 60 losses is too many',
              'It breaks even at ₹0'
            ],
            correctIndex: 0,
            explanation: 'Positive mathematical expectancy depends on the combination of win rate and risk-to-reward ratio, not win rate alone.'
          },
          {
            id: 'les_8_2_q4',
            question: 'What is the "Sunk Cost Fallacy" in financial decision-making?',
            options: [
              'Refusing to sell a losing asset because you have already lost money on it, irrationally waiting to "just get my money back" while better opportunities pass by',
              'Paying trading fees to your broker',
              'Investing money in an emergency fund',
              'Buying an index fund every month'
            ],
            correctIndex: 0,
            explanation: 'Past losses cannot be recovered by holding poor assets. Evaluate current holdings purely on their future risk-adjusted potential.'
          },
          {
            id: 'les_8_2_q5',
            question: 'How does reviewing your trading journal every weekend improve long-term performance?',
            options: [
              'It highlights repeating behavioral mistakes (such as overtrading or cutting winners too soon), turning lessons into permanent discipline',
              'It forces the stock market to open on Sunday',
              'It guarantees you will never have a losing trade again',
              'It automatically files your tax return'
            ],
            correctIndex: 0,
            explanation: 'Consistent self-review identifies psychological leaks and reinforces successful, disciplined execution.'
          }
        ]
      }
    ]
  },

  // LEVEL 9: PAPER TRADING & MARKET EXPECTATIONS
  {
    id: 'mod_9',
    levelNumber: 9,
    title: 'Paper Trading & Market Expectations',
    tagline: 'Simulating trades with real discipline and understanding priced-in expectations.',
    badge: 'Simulation Lab',
    icon: 'TrendingUp',
    prerequisites: ['mod_8'],
    estimatedTime: '~35 mins',
    skills: ['Earnings surprise analysis', 'Forward guidance interpretation', 'Paper trade execution', 'Pre-trade checklist adherence'],
    conceptsPreview: ['Buy the Rumor, Sell the News', 'Earnings Guidance vs Past Results', 'Paper Trading Discipline', 'Simulated Capital Preservation'],
    lessons: [
      {
        id: 'les_9_1',
        moduleId: 'mod_9',
        title: 'Expectations vs. Reality: "Buy the Rumor, Sell the News"',
        shortDesc: 'Why a company can report record profits and still see its stock tumble.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The 98% Test Score Surprise',
          explanation: 'Imagine a brilliant student who everyone expects will score 100% on their final exam. When the grades come out, the student scores 94%. 94% is an objectively amazing grade! But because the teacher and parents expected 100%, everyone is slightly disappointed. In the stock market, prices reflect future expectations. If analysts expected a company\'s profits to grow by 40%, and profits only grow by 25%, the stock might drop even though the company did very well!',
          realLifeAnalogy: 'Markets trade on the future, not the past. By the time a headline hits the evening news, big institutional investors have usually already acted on it.',
          keyTakeaway: 'Stock prices react to how news compares to PRIOR EXPECTATIONS, not just whether the news sounds good in isolation.'
        },
        deepDive: {
          technicalOverview: 'Market efficiency dictates that consensus analyst expectations are priced into the stock leading up to the earnings report. The actual reported numbers trigger adjustments based on the variance (surprise factor) and crucially, management\'s forward-looking guidance for upcoming quarters.',
          formulasAndMetrics: [
            {
              label: 'Earnings Surprise',
              formula: 'Surprise % = (Reported EPS − Consensus Expected EPS) / Consensus Expected EPS',
              detail: 'A negative surprise often triggers instant institutional re-rating and downward price discovery.'
            }
          ],
          marketMechanics: 'Forward guidance matters more than past results. If a firm beats past quarterly earnings by 10% but announces that next quarter customer orders are declining 30%, the stock will typically sink immediately.',
          riskInsight: 'Never trade earnings releases with large directional bets without a defined risk limit; overnight gaps can leap right past mental stop-losses.'
        },
        interactiveType: 'expectation_simulator',
        quiz: [
          {
            id: 'les_9_1_q1',
            question: 'Why might a company\'s stock price drop 4% on the day it announces record quarterly profits?',
            options: [
              'Because the market expected even higher profits or management provided cautious future guidance',
              'Because profitable companies are not allowed on the exchange',
              'Because buyers forgot how to enter orders',
              'It is impossible; stock prices always rise when profits increase'
            ],
            correctIndex: 0,
            explanation: 'Markets price in forward expectations. If results fall short of whisper expectations or management forecasts future headwinds, prices adjust downward.'
          },
          {
            id: 'les_9_1_q2',
            question: 'What does the Wall Street adage "Buy the Rumor, Sell the News" describe?',
            options: [
              'Prices rally in anticipation of positive news as traders buy early; once the official news is announced, early buyers take profits by selling to late retail buyers',
              'Traders should only buy stocks from newspapers',
              'Rumors are legally binding corporate disclosures',
              'News channels control 100% of all stock prices'
            ],
            correctIndex: 0,
            explanation: 'Anticipation drives price increases leading up to an event; once the news becomes public fact, early participants take profits.'
          },
          {
            id: 'les_9_1_q3',
            question: 'Why does Management "Forward Guidance" for the next quarter carry more weight than the past quarter\'s historical revenue?',
            options: [
              'Because the intrinsic value of a stock is the present value of its FUTURE cash flows, not historical money already spent',
              'Because past revenue is deleted by accountants',
              'Because guidance is written in gold ink',
              'Because future guidance determines government tax rates'
            ],
            correctIndex: 0,
            explanation: 'Stock valuations discount future expected cash flows. A weak future outlook immediately re-prices the stock lower.'
          },
          {
            id: 'les_9_1_q4',
            question: 'Company ABC beats analyst quarterly earnings by 5%, but announces that its raw material costs will surge 40% next year due to supply shortages. What is the probable stock reaction?',
            options: [
              'The stock will likely fall as institutional analysts downgrade future profit margins and price targets',
              'The stock will double immediately because past earnings were positive',
              'The company will shut down its website',
              'The exchange will ban all trading in Company ABC'
            ],
            correctIndex: 0,
            explanation: 'Investors look forward; expected margin compression in future quarters outweighs a slight beat on trailing numbers.'
          },
          {
            id: 'les_9_1_q5',
            question: 'Why is holding large, unhedged short-term options or swing positions through an earnings announcement considered high risk?',
            options: [
              'Earnings releases often trigger severe overnight gap-ups or gap-downs that jump straight past normal stop-losses',
              'Because earnings are only announced on holidays',
              'Because options become worthless during business hours',
              'Because companies cancel trading during earnings'
            ],
            correctIndex: 0,
            explanation: 'Overnight binary events can gap beyond stop-loss orders, leading to significantly higher loss than planned.'
          }
        ]
      },
      {
        id: 'les_9_2',
        moduleId: 'mod_9',
        title: 'The Paper Trading Protocol: Simulating Like a Pro',
        shortDesc: 'How to practice in the virtual simulator without developing bad habits.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The Flight Simulator Rule',
          explanation: 'Before pilots fly a passenger jet with 300 passengers, they spend hundreds of hours in a high-tech flight simulator. If an engine catches fire in the simulator, they don\'t laugh and crash into a mountain just because "it\'s not real"—they practice the emergency checklist with deadly seriousness! Treat your ₹1,00,000 virtual cash exactly as if it were your hard-earned salary. If you gamble with virtual money, you will gamble with real money.',
          realLifeAnalogy: 'How you practice is how you perform. Respect the virtual cash and your future self will thank you.',
          keyTakeaway: 'Paper trading tests your process, your risk discipline, and your emotional patience before risking a single real rupee.'
        },
        deepDive: {
          technicalOverview: 'Paper trading bridges theoretical knowledge and practical execution. Always track every simulated trade in your Trading Journal with: (1) Setup hypothesis, (2) Calculated position size based on 1% risk, (3) Hard stop-loss level, (4) Target price, and (5) Post-execution review.',
          formulasAndMetrics: [
            {
              label: 'Win Rate vs Risk-Reward Payoff',
              formula: 'Expected Value = (Win Rate × Avg Win) − (Loss Rate × Avg Loss)',
              detail: 'Even with a 40% win rate, a 2:1 risk-to-reward ratio yields a mathematically profitable system over 100 trades.'
            }
          ],
          marketMechanics: 'Paper trading simulators provide real-time or historical bid/ask queues, allowing you to test market orders, limit orders, and stop-loss triggers without capital exposure.',
          riskInsight: 'Beware of "Simulator Euphoria": when you don\'t feel real financial pain on losses, you might underestimate how fear feels when real money is on the line.'
        },
        quiz: [
          {
            id: 'les_9_2_q1',
            question: 'What is the most effective mindset when using the Paper Trading Lab?',
            options: [
              'Treat the ₹1,00,000 virtual cash with the exact same discipline and risk limits as your own real money',
              'YOLO 100% of the virtual money into penny stocks because it is fake money',
              'Never use stop-losses because losses do not matter',
              'Only take trades after a stock has already jumped 500%'
            ],
            correctIndex: 0,
            explanation: 'Treating paper trading with real discipline builds the neural pathways, emotional patience, and methodical habits needed for real-world survival.'
          },
          {
            id: 'les_9_2_q2',
            question: 'What is "Simulator Euphoria" and why must learners watch out for it?',
            options: [
              'The illusion that trading is effortless because paper trading carries zero real emotional fear of losing personal savings',
              'A medical condition caused by staring at green charts',
              'A bonus awarded by the stock simulator',
              'A discount on virtual cash'
            ],
            correctIndex: 0,
            explanation: 'Without real capital on the line, psychological pressures like fear and greed are dampened. Respect this difference when transitioning to real markets.'
          },
          {
            id: 'les_9_2_q3',
            question: 'Which of the following is an ideal practice goal to achieve in the Paper Trading Lab before considering real-money trading?',
            options: [
              'Executing at least 30-50 consecutive simulated trades with strict 1% position sizing, predefined stop-losses, and complete journal entries',
              'Doubling the virtual account in 24 hours on one lucky penny stock trade',
              'Never logging into the trading journal',
              'Borrowing real money to buy virtual stocks'
            ],
            correctIndex: 0,
            explanation: 'Demonstrating consistent adherence to process across 30+ trades proves you have established disciplined execution habits.'
          },
          {
            id: 'les_9_2_q4',
            question: 'If a paper trade hits your planned stop-loss, what should you do in the simulator?',
            options: [
              'Close the position immediately according to plan, log the outcome in your journal, and analyze what the setup taught you',
              'Reset the simulator account balance to hide the loss',
              'Hold the trade forever until it turns green',
              'Delete the simulator app from your device'
            ],
            correctIndex: 0,
            explanation: 'Practicing clean stop-loss execution builds the automatic habit of cutting losses without emotional bargaining.'
          },
          {
            id: 'les_9_2_q5',
            question: 'What is the primary benefit of testing order types (Limit vs Market vs Stop) inside the Paper Trading Lab?',
            options: [
              'Gaining tactile, hands-on familiarity with order execution, spreads, and portfolio mechanics with zero capital risk',
              'Receiving tax refunds on virtual trades',
              'Winning cash prizes from brokers',
              'Skipping the need for financial education'
            ],
            correctIndex: 0,
            explanation: 'Safe simulation develops operational muscle memory so you never make costly order-entry mistakes with real money.'
          }
        ]
      }
    ]
  },

  // LEVEL 10: CAPSTONE MASTERY ASSESSMENT
  {
    id: 'mod_10',
    levelNumber: 10,
    title: 'Capstone Mastery Assessment',
    tagline: 'Synthesize fundamentals, technicals, risk math, and forensic scam detection.',
    badge: 'Certification',
    icon: 'Trophy',
    prerequisites: ['mod_9'],
    estimatedTime: '~40 mins',
    skills: ['Forensic accounting inspection', 'Scam and pump-and-dump detection', 'Integrated risk verification', 'Certified investor mindset'],
    conceptsPreview: ['Promoter Pledging Red Flags', 'Auditor Resignation Warnings', 'Guaranteed Returns Fraud Pattern', 'The Complete Pre-Trade Checklist'],
    lessons: [
      {
        id: 'les_10_1',
        moduleId: 'mod_10',
        title: 'Forensic Investigation: Spotting Market Scams & Red Flags',
        shortDesc: 'How to protect yourself from WhatsApp pump-and-dumps, fake SEBI advisors, and shady accounting.',
        readTimeMinutes: 6,
        eli15: {
          analogyTitle: 'The "Too Good to Be True" Magic Box',
          explanation: 'Imagine someone on Telegram whispers: "Give me ₹10,000, and my secret AI algorithm guarantees 20% return every single week with ZERO risk!" Run away as fast as you can! If someone genuinely possessed a secret machine that doubled money risk-free, they would borrow from a bank at 8% and become the richest person on planet Earth. They would NEVER message strangers on WhatsApp asking for ₹10,000!',
          realLifeAnalogy: 'Rule #1 of financial self-defense: Whenever someone promises "Guaranteed high returns with zero risk", the only guaranteed thing is that they are trying to steal your money.',
          keyTakeaway: 'Genuine markets have risk and uncertainty. Anyone claiming guaranteed market profits is running an illegal scam.'
        },
        deepDive: {
          technicalOverview: 'Regulatory forewarn markers include: (1) Unregistered entities operating Telegram/WhatsApp advisory channels, (2) Micro-cap stocks with sudden 20% upper-circuit spikes followed by promoter share dumping, (3) Auditor resignations during quarterly results, and (4) High promoter share pledging (> 50%).',
          formulasAndMetrics: [
            {
              label: 'Promoter Pledging Risk Ratio',
              formula: 'Pledge % = (Pledged Shares / Total Promoter Shares) × 100',
              detail: 'When pledge exceeds 50%, a price drop can trigger lender margin calls, leading to a cascade of forced selling.'
            }
          ],
          marketMechanics: 'SEBI mandates that only Registered Investment Advisors (SEBI RIA) or Research Analysts (SEBI RA) can provide licensed financial recommendations under strict compliance and risk disclosure rules.',
          riskInsight: 'Never share your Demat/Trading login credentials or OTP with any third party claiming to "manage your account for profit sharing".'
        },
        quiz: [
          {
            id: 'les_10_1_q1',
            question: 'What is the biggest red flag that a financial message or offer is a scam?',
            options: [
              'They promise guaranteed high returns with zero risk and ask for urgent payment via WhatsApp/Telegram',
              'They recommend reading the company annual report and practicing on a paper simulator',
              'They explain that all stock investments involve risk of loss',
              'They suggest using a 1% stop-loss'
            ],
            correctIndex: 0,
            explanation: 'Guaranteed high returns with zero risk is the hallmark of investment fraud. Genuine market returns always carry volatility and risk.'
          },
          {
            id: 'les_10_1_q2',
            question: 'What is a classic "Pump and Dump" scheme in micro-cap stocks?',
            options: [
              'Fraudsters buy cheap illiquid shares, hype them via fake news/social media to trap retail buyers, and then dump their shares at the peak, leaving retail investors with worthless stock',
              'A standard dividend reinvestment plan',
              'A company buying new water pumps for its factory',
              'An official IPO approved by SEBI'
            ],
            correctIndex: 0,
            explanation: 'Pump and dump operations artificially inflate illiquid stocks via hype before orchestrators sell off at retail expense.'
          },
          {
            id: 'les_10_1_q3',
            question: 'Why is high "Promoter Share Pledging" (> 50%) a dangerous balance sheet red flag for equity investors?',
            options: [
              'If the stock price falls, lenders holding pledged shares can trigger margin calls and dump millions of shares on the open market, causing a catastrophic price collapse',
              'Because pledged shares cannot receive emails',
              'Because promoters are required to double their salaries',
              'Because the company will be forced to merge with a bank'
            ],
            correctIndex: 0,
            explanation: 'High pledging exposes the stock to lender liquidation cascades if prices drop below loan collateral thresholds.'
          },
          {
            id: 'les_10_1_q4',
            question: 'What should an investor do if an independent Statutory Auditor abruptly resigns citing "lack of management cooperation and irregular accounting entries"?',
            options: [
              'Treat it as a severe forensic warning flag and exit or avoid the stock until independent clarity is established',
              'Immediately double their investment because auditor resignations mean higher profits',
              'Ignore the auditor because accounting does not matter',
              'File a complaint against the stock exchange'
            ],
            correctIndex: 0,
            explanation: 'Auditor resignations due to documentation discrepancies frequently precede severe accounting fraud disclosures.'
          },
          {
            id: 'les_10_1_q5',
            question: 'Should you ever share your Demat/Trading account password or OTP with someone claiming to be a "SEBI-verified Fund Manager offering 50% profit sharing"?',
            options: [
              'NEVER. Legitimate registered entities never ask for personal account passwords or OTPs; sharing credentials is a direct route to theft',
              'Yes, as long as they have a nice profile picture',
              'Yes, if they send a screenshot of a fake SEBI certificate',
              'Yes, on weekends only'
            ],
            correctIndex: 0,
            explanation: 'Never share login credentials or OTPs with anyone. Certified advisors manage funds through official regulated accounts, never personal logins.'
          }
        ]
      },
      {
        id: 'les_10_2',
        moduleId: 'mod_10',
        title: 'The Master Trader Checklist: Your Permanent Operating Manual',
        shortDesc: 'The 7-step pre-flight checklist every disciplined market participant executes before every trade.',
        readTimeMinutes: 5,
        eli15: {
          analogyTitle: 'The Airline Pilot\'s Pre-Flight Clipboard',
          explanation: 'Before a Boeing 787 backs away from the gate, the captain and co-pilot read 50 items off a physical clipboard: Fuel checked? Hydraulic pressure green? Flaps responsive? They never say: "Eh, I\'ve flown 100 times, let\'s just hit the gas!" In trading, your checklist is your lifejacket. Before you click BUY, check: Why am I buying? What is my exact stop-loss? Is my position size under 1% risk? Am I calm or am I having FOMO? If any check fails, do NOT trade.',
          realLifeAnalogy: 'Discipline is doing what you know you should do, especially when emotions tell you to do the opposite.',
          keyTakeaway: 'You have completed the educational foundations! Practice with patience in the Paper Trading Lab and protect your capital above all else.'
        },
        deepDive: {
          technicalOverview: 'A professional trading system consists of: (1) Setup identification (trend + support), (2) Invalidation level (exact price where thesis is proven false), (3) Calculated quantity (Fixed 1% Account Risk / (Entry − Stop)), (4) Positive expectancy (Target offering at least 2× the risked amount), (5) Post-trade journal entry.',
          formulasAndMetrics: [
            {
              label: 'Kelly Criterion (Theoretical Ceiling)',
              formula: 'f* = (p × b − q) / b',
              detail: 'Where p = win rate, b = odds received (R:R), q = 1 − p. Most professionals trade at fractional Kelly (1/4 or 1/5) to prevent catastrophic variance.'
            }
          ],
          marketMechanics: 'Markets reward process, not outcome on any single trade. A good trade that follows the rules can still lose money (a good loss); a bad trade that breaks the rules can accidentally make money (a toxic win that reinforces gambling).',
          riskInsight: 'Focus 100% on executing your checklist with flawless discipline. The returns will take care of themselves over time.'
        },
        quiz: [
          {
            id: 'les_10_2_q1',
            question: 'What defines a "Good Trade" in professional financial education?',
            options: [
              'A trade where you followed your pre-defined plan, sized your risk properly, and respected your stop-loss, regardless of whether it won or lost',
              'Any trade that made money, even if you YOLO\'d your entire life savings without a stop-loss',
              'A trade that you hid from your trading journal',
              'A trade copied blindly from a social media tipster'
            ],
            correctIndex: 0,
            explanation: 'Professional edge is about executing a positive-expectancy process consistently. Losses are a routine business cost; following your plan is the true definition of success.'
          },
          {
            id: 'les_10_2_q2',
            question: 'What is the core sequence of the 7-Step Pre-Trade Checklist?',
            options: [
              'Identify Setup → Define Stop-Loss → Calculate Position Size for 1% Risk → Verify 2:1 R:R → Check Emotions → Execute → Log in Journal',
              'Check Twitter → Buy Max Shares → Hope for Profit → Sell in Panic',
              'Borrow money → Buy random penny stock → Close eyes',
              'Enter market order at 9:15 AM → Complain to customer support'
            ],
            correctIndex: 0,
            explanation: 'A systematic checklist ensures risk, setup, sizing, and psychology are verified before capital is committed.'
          },
          {
            id: 'les_10_2_q3',
            question: 'If a trade setup offers a ₹500 potential profit but demands a ₹1,000 stop-loss risk (0.5:1 R:R), what should a disciplined trader do?',
            options: [
              'PASS on the trade, because the potential reward does not justify the disproportionate downside risk',
              'Take the trade anyway with 10 times leverage',
              'Remove the stop-loss so it cannot be hit',
              'Ask a stranger on Telegram what to do'
            ],
            correctIndex: 0,
            explanation: 'Disciplined traders only execute setups with asymmetric positive reward-to-risk profiles (preferring at least 1.5:1 or 2:1).'
          },
          {
            id: 'les_10_2_q4',
            question: 'Why is it critical to separate self-worth and mood from daily market outcomes?',
            options: [
              'Market variance on any individual day contains randomness; consistent long-term results come from emotional equanimity and process execution',
              'Because stock prices are personally controlled by your mood',
              'Because the exchange fines sad traders',
              'Because winning traders never experience losing days'
            ],
            correctIndex: 0,
            explanation: 'Emotional detachment keeps you objective, disciplined, and resilient through natural market fluctuations.'
          },
          {
            id: 'les_10_2_q5',
            question: 'What is the ultimate lifelong rule of TradeQuest?',
            options: [
              '"Explore freely, learn progressively, practice safely—protect your capital above all else!"',
              '"Gamble aggressively and chase every internet rumor"',
              '"Never study financial balance sheets"',
              '"Take maximum leverage on every trade"'
            ],
            correctIndex: 0,
            explanation: 'Capital defense, continuous learning, and structured discipline form the bedrock of enduring financial independence.'
          }
        ]
      }
    ]
  }
];

// Helper to determine module status based on prerequisites and completed lessons
export function getModuleStatus(
  module: Module, 
  completedLessons: string[], 
  completedModules: string[] = []
): ModuleStatus {
  // If all lessons in this module are completed, it's COMPLETED
  const allLessonsDone = module.lessons.length > 0 && module.lessons.every(l => completedLessons.includes(l.id));
  if (allLessonsDone || completedModules.includes(module.id)) {
    return 'COMPLETED';
  }

  // Check prerequisites
  if (!module.prerequisites || module.prerequisites.length === 0) {
    const hasStarted = module.lessons.some(l => completedLessons.includes(l.id));
    return hasStarted ? 'IN_PROGRESS' : 'AVAILABLE';
  }

  // Every prerequisite module must be completed
  const allPrereqsMet = module.prerequisites.every(prereqId => {
    if (completedModules.includes(prereqId)) return true;
    const prereqMod = CURRICULUM_MODULES.find(m => m.id === prereqId);
    if (!prereqMod) return true;
    return prereqMod.lessons.length > 0 && prereqMod.lessons.every(l => completedLessons.includes(l.id));
  });

  if (!allPrereqsMet) {
    return 'LOCKED';
  }

  const hasStarted = module.lessons.some(l => completedLessons.includes(l.id));
  return hasStarted ? 'IN_PROGRESS' : 'AVAILABLE';
}

// Helper to check if a specific lesson within a module is unlocked
export function isLessonUnlocked(
  lesson: Lesson, 
  module: Module, 
  completedLessons: string[], 
  moduleStatus: ModuleStatus
): boolean {
  // If module is locked, all its lessons are locked
  if (moduleStatus === 'LOCKED') return false;

  // If this lesson is already completed, it is always unlocked for revision
  if (completedLessons.includes(lesson.id)) return true;

  // Find index of this lesson in the module
  const lessonIdx = module.lessons.findIndex(l => l.id === lesson.id);
  if (lessonIdx <= 0) {
    // First lesson of an available/in-progress module is unlocked
    return true;
  }

  // Subsequent lessons require the immediately preceding lesson to be completed
  const prevLesson = module.lessons[lessonIdx - 1];
  return completedLessons.includes(prevLesson.id);
}

// Helper to get prerequisite checklist items with completion status
export function getPrerequisiteChecklist(
  module: Module, 
  completedLessons: string[], 
  completedModules: string[] = []
): { id: string; title: string; isCompleted: boolean }[] {
  if (!module.prerequisites || module.prerequisites.length === 0) return [];

  return module.prerequisites.map(prereqId => {
    const prereqMod = CURRICULUM_MODULES.find(m => m.id === prereqId);
    const title = prereqMod?.title || prereqId;
    const isCompleted = completedModules.includes(prereqId) || 
      (!!prereqMod && prereqMod.lessons.length > 0 && prereqMod.lessons.every(l => completedLessons.includes(l.id)));
    
    return {
      id: prereqId,
      title,
      isCompleted
    };
  });
}

// Helper to find next lesson to study
export function getNextRecommendedLesson(
  modules: Module[], 
  completedLessons: string[]
): { lesson: Lesson; module: Module } | null {
  for (const mod of modules) {
    const status = getModuleStatus(mod, completedLessons);
    if (status === 'LOCKED') continue;

    for (const les of mod.lessons) {
      if (!completedLessons.includes(les.id)) {
        return { lesson: les, module: mod };
      }
    }
  }
  // If everything is completed, return the first lesson of the final module
  const lastMod = modules[modules.length - 1];
  if (lastMod && lastMod.lessons.length > 0) {
    return { lesson: lastMod.lessons[0], module: lastMod };
  }
  return null;
}
