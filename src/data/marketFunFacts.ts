import { MarketFunFact } from '../types';

export const MARKET_FUN_FACTS: MarketFunFact[] = [
  // 1. Stock Market History
  {
    id: 'fact_01',
    category: 'history',
    categoryLabel: 'Market History',
    title: 'The World’s First Stock Exchange',
    fact: 'The Amsterdam Stock Exchange, established in 1602 by the Dutch East India Company (VOC), is widely considered the world’s first formal stock market.',
    explanation: 'The Dutch East India Company issued the first recorded publicly traded shares and bonds to finance risky maritime trade expeditions to the East Indies, creating the modern joint-stock company model.',
    sourceRef: 'World Federation of Exchanges Historical Archives / VOC Museum Records'
  },
  {
    id: 'fact_02',
    category: 'history',
    categoryLabel: 'Market History',
    title: 'The Buttonwood Agreement Under a Tree',
    fact: 'The New York Stock Exchange (NYSE) was born on May 17, 1792, when 24 stockbrokers signed an agreement under a buttonwood tree on Wall Street.',
    explanation: 'The agreement established rules for trading government bonds and bank stocks, as well as fixing a standard commission rate of 0.25%, laying the foundation for Wall Street.',
    sourceRef: 'NYSE Archives, Buttonwood Agreement Documentation (1792)'
  },
  {
    id: 'fact_03',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'Asia’s Oldest Stock Exchange',
    fact: 'The Bombay Stock Exchange (BSE), founded in 1875, is the oldest stock exchange in all of Asia.',
    explanation: 'It started under a banyan tree opposite Mumbai Town Hall, where 22 stockbrokers met informally in the 1850s before organizing into "The Native Share & Stock Brokers’ Association" in 1875.',
    sourceRef: 'BSE India Official Commemorative Heritage Volume (1875–Present)'
  },
  {
    id: 'fact_04',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'Dalal Street’s Literal Meaning',
    fact: 'The iconic name "Dalal Street" in Mumbai literally translates to "Broker’s Street" in Marathi and Hindi.',
    explanation: 'As the broker association grew, it purchased land on Rampart Row in South Mumbai, officially renaming the lane Dalal Street in 1899.',
    sourceRef: 'Mumbai Heritage Conservation Society & BSE Archives'
  },
  {
    id: 'fact_05',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'Sensex Base Value & Year',
    fact: 'The BSE Sensex was formulated in 1986 with a baseline value set at 100 points, pegged to the fiscal year 1978–79.',
    explanation: 'Created by market analyst Deepak Mohoni, the portmanteau "Sensex" (Sensitive Index) tracks 30 fundamentally sound and actively traded companies across key economic sectors in India.',
    sourceRef: 'BSE Index Methodology Handbook'
  },
  {
    id: 'fact_06',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'The Birth of the National Stock Exchange (NSE)',
    fact: 'The National Stock Exchange of India (NSE) was incorporated in 1992 and introduced fully electronic screen-based satellite trading to India in 1994.',
    explanation: 'Before the NSE launched its VSAT satellite technology, Indian brokers traded via shouting and physical hand signals in open-outcry rings, with paper settlement delays taking weeks.',
    sourceRef: 'Pherwani Committee Report (1991) & NSE Historical Evolution'
  },
  {
    id: 'fact_07',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'Nifty 50 Inception',
    fact: 'The Nifty 50 index was launched by the NSE on April 22, 1996, with a base value of 1,000 points and a base date of November 3, 1995.',
    explanation: 'The name is a blend of "National" and "Fifty", measuring the performance of the 50 largest Indian blue-chip companies weighted by free-float market capitalization.',
    sourceRef: 'NSE Indices Ltd Methodology Manual'
  },
  {
    id: 'fact_08',
    category: 'terminology',
    categoryLabel: 'Trading Terminology',
    title: 'Why Are They Called "Bulls" and "Bears"?',
    fact: 'The terms "Bull" and "Bear" describe market direction based on how the two animals physically attack.',
    explanation: 'A bull thrusts its horns upwards (rising prices, optimism), whereas a bear swipes its heavy paws downwards (falling prices, caution).',
    sourceRef: 'Oxford English Dictionary of Financial Terms'
  },
  {
    id: 'fact_09',
    category: 'terminology',
    categoryLabel: 'Trading Terminology',
    title: 'The Origin of the Word "Bear" From Animal Skins',
    fact: 'The term "Bear Market" historically predates "Bull" and stems from an old 18th-century proverb about selling bear skins before catching the bear.',
    explanation: 'Middlemen who sold bearskins before receiving them hoped purchase prices would drop before delivery—giving rise to the term "bear skin jobbers" for traders betting on falling prices.',
    sourceRef: 'Financial History Review, Cambridge University Press'
  },
  {
    id: 'fact_10',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'Paperless Demat Accounts Revolution',
    fact: 'Until 1996, Indian shares were paper certificates. The introduction of Dematerialization (Demat) eliminated fake certificates and signature mismatch frauds.',
    explanation: 'The Depositories Act of 1996 allowed National Securities Depository Limited (NSDL) to hold securities electronically in digital accounts, speeding up trade settlements from 21 days down to modern T+1.',
    sourceRef: 'Depositories Act (1996), Government of India'
  },
  {
    id: 'fact_11',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'India Pioneered Global T+1 Settlement',
    fact: 'In January 2023, India became only the second major stock market in the world (after China) to completely shift all equities to T+1 settlement.',
    explanation: 'T+1 means if you buy or sell shares on Monday, trade settlement and cash transfers are finalized by Tuesday evening, far ahead of the US and Europe which transitioned in mid-2024.',
    sourceRef: 'SEBI Circular on T+1 Rolling Settlement (Jan 2023)'
  },
  {
    id: 'fact_12',
    category: 'investing',
    categoryLabel: 'Investing Fundamentals',
    title: 'The Mathematical Rule of 72',
    fact: 'To estimate how many years it will take to double your investment at a fixed annual return, divide 72 by the annual interest rate.',
    explanation: 'For example, at a 12% compounding rate, your capital doubles in approximately 6 years (72 ÷ 12 = 6). At 8%, it doubles in approximately 9 years.',
    sourceRef: 'Luca Pacioli, Summa de Arithmetica (1494)'
  },
  {
    id: 'fact_13',
    category: 'famous_events',
    categoryLabel: 'Famous Events',
    title: 'Black Monday: The Largest Single-Day Crash',
    fact: 'On October 19, 1987 (Black Monday), the Dow Jones Industrial Average crashed 22.6% in a single trading session.',
    explanation: 'The collapse was exacerbated by early algorithmic "portfolio insurance" computer programs that triggered automated stop-loss market sells into an illiquid order book, creating modern circuit breakers.',
    sourceRef: 'Brady Commission Report on the October 1987 Market Break'
  },
  {
    id: 'fact_14',
    category: 'terminology',
    categoryLabel: 'Trading Terminology',
    title: 'What Is a Market Circuit Breaker?',
    fact: 'Circuit breakers are regulatory emergency switches that temporarily halt all trading when an index swings excessively within a single session.',
    explanation: 'In India, SEBI triggers market halts at 10%, 15%, and 20% index moves up or down to allow panic to subside, let orders queue cleanly, and curb computerized cascade liquidations.',
    sourceRef: 'SEBI Master Circular on Market-Wide Circuit Breakers'
  },
  {
    id: 'fact_15',
    category: 'patterns',
    categoryLabel: 'Candlestick Patterns',
    title: 'Candlesticks Were Invented for Rice Trading',
    fact: 'Japanese candlestick charts were invented in the 1700s by Homma Munehisa, a wealthy rice merchant in Sakata, Japan.',
    explanation: 'Homma discovered that while rice prices reflected weather supply and demand, they were heavily influenced by market psychology, fear, and greed—which could be charted using open, high, low, and close.',
    sourceRef: 'The Fountain of Gold: The Three Monkey Record of Money (1755)'
  },
  {
    id: 'fact_16',
    category: 'patterns',
    categoryLabel: 'Candlestick Patterns',
    title: 'The Meaning of a "Doji"',
    fact: 'In Japanese, the word "Doji" (同時) means "the same" or "a coincidence", denoting a candle whose open and close prices are virtually identical.',
    explanation: 'A Doji reflects complete equilibrium and indecision between buyers (bulls) and sellers (bears). When occurring after a prolonged trend, it frequently foreshadows an impending reversal.',
    sourceRef: 'Japanese Candlestick Charting Techniques by Steve Nison'
  },
  {
    id: 'fact_17',
    category: 'investing',
    categoryLabel: 'Investing Fundamentals',
    title: 'Dividends Account for Massive Long-Term Returns',
    fact: 'Over a 50-year horizon, reinvested dividends and dividend compounding have accounted for over 75% of the total return of the broad stock market.',
    explanation: 'While stock price appreciation captures headlines, the geometric compounding of dividend payouts purchasing additional shares during bear markets provides immense mathematical tailwinds.',
    sourceRef: 'S&P Dow Jones Indices Historical Total Return Studies'
  },
  {
    id: 'fact_18',
    category: 'psychology',
    categoryLabel: 'Market Psychology',
    title: 'Loss Aversion: Losses Hurt Twice as Much as Gains',
    fact: 'Behavioral economists proved that the psychological pain of losing ₹10,000 is approximately twice as intense as the joy of winning ₹10,000.',
    explanation: 'Discovered by Nobel laureates Daniel Kahneman and Amos Tversky, Prospect Theory explains why retail traders hold losing positions too long hoping to break even, while selling winners prematurely.',
    sourceRef: 'Kahneman & Tversky, Prospect Theory: An Analysis of Decision under Risk (1979)'
  },
  {
    id: 'fact_19',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'The "Cotton King" Who Saved Mumbai’s Markets',
    fact: 'During the American Civil War (1861–1865), Mumbai trader Premchand Roychand earned colossal wealth exporting Indian cotton to Manchester mills.',
    explanation: 'Though the subsequent 1865 cotton crash wiped out many brokers, Roychand’s organizational efforts laid the permanent financial foundation for establishing the Bombay Stock Exchange a decade later.',
    sourceRef: 'Royal Asiatic Society of Mumbai Historical Archives'
  },
  {
    id: 'fact_20',
    category: 'famous_events',
    categoryLabel: 'Famous Events',
    title: 'The Tulip Mania of 1637',
    fact: 'During the Dutch Tulip Mania in 1637, a single rare "Semper Augustus" tulip bulb could trade for the price of an entire canal mansion and 12 acres of farmland.',
    explanation: 'It is considered the earliest recorded speculative asset bubble. When buyers refused to show up for delivery at an auction in Haarlem, the market evaporated within days.',
    sourceRef: 'Extraordinary Popular Delusions and the Madness of Crowds by Charles Mackay'
  },
  {
    id: 'fact_21',
    category: 'investing',
    categoryLabel: 'Investing Fundamentals',
    title: 'Warren Buffett’s 99% Wealth Timeline',
    fact: 'Over 99% of Warren Buffett’s multi-billion-dollar net worth was accumulated after his 50th birthday, and over 90% after his 65th.',
    explanation: 'Buffett’s greatest secret is not merely stock picking, but uninterrupted mathematical longevity: he began investing at age 10 and allowed compound interest to work across more than 80 continuous years.',
    sourceRef: 'The Snowball: Warren Buffett and the Business of Life by Alice Schroeder'
  },
  {
    id: 'fact_22',
    category: 'terminology',
    categoryLabel: 'Trading Terminology',
    title: 'What Does "Blue Chip" Actually Mean?',
    fact: 'The phrase "Blue Chip" comes from poker, where blue chips historically possessed the highest monetary value on the gaming table.',
    explanation: 'Financial writer Oliver Gingold coined the term in 1923 while standing near a ticker tape machine at Dow Jones, noting stocks trading above $200 a share as "blue chip stocks".',
    sourceRef: 'Dow Jones Historical Archives (1923)'
  },
  {
    id: 'fact_23',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'SEBI’s Statutory Transformation in 1992',
    fact: 'The Securities and Exchange Board of India (SEBI) existed as an administrative non-statutory body from 1988, but received real statutory enforcement powers only in 1992.',
    explanation: 'The SEBI Act was passed by Parliament in April 1992 following market irregularities, giving the regulator independent authority to inspect books, penalize fraud, and license market intermediaries.',
    sourceRef: 'SEBI Act 1992, Gazette of India'
  },
  {
    id: 'fact_24',
    category: 'terminology',
    categoryLabel: 'Trading Terminology',
    title: 'Dead Cat Bounce',
    fact: 'The phrase "Dead Cat Bounce" describes a temporary, short-lived recovery in the price of a declining stock, derived from an old Wall Street saying.',
    explanation: 'The grim idiom implies that "even a dead cat will bounce if dropped from a great enough height"—warning traders not to confuse a temporary pullback in a downtrend with a genuine recovery.',
    sourceRef: 'Financial Times Archives (First recorded use, December 1985)'
  },
  {
    id: 'fact_25',
    category: 'investing',
    categoryLabel: 'Investing Fundamentals',
    title: 'Rupee Cost Averaging (SIP)',
    fact: 'Investing a fixed amount at regular intervals mathematically guarantees that you purchase more units when prices are cheap and fewer units when prices are high.',
    explanation: 'Known as Dollar-Cost or Rupee-Cost Averaging, Systematic Investment Plans (SIPs) neutralize the emotional hazard of trying to time market tops and bottoms.',
    sourceRef: 'Benjamin Graham, The Intelligent Investor (1949)'
  },
  {
    id: 'fact_26',
    category: 'psychology',
    categoryLabel: 'Market Psychology',
    title: 'The Disposition Effect in Trading',
    fact: 'Novice investors have a documented tendency to sell profitable positions too quickly while clinging desperately to losing positions for months.',
    explanation: 'First identified by Shefrin and Statman in 1985, this cognitive bias stems from a psychological refusal to admit a mistake, hoping the loss will turn around so the ego avoids regret.',
    sourceRef: 'Journal of Finance: The Disposition to Sell Winners Too Early and Ride Losers'
  },
  {
    id: 'fact_27',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'Sensex Peak Milestone History',
    fact: 'The Sensex took 21 years to reach 10,000 points in 2006, but surged from 50,000 to 70,000 points in less than 3 years.',
    explanation: 'This highlights the exponential nature of compounding: each subsequent 10,000-point milestone requires a smaller percentage gain than the previous one.',
    sourceRef: 'BSE Index Historical Milestone Chronology'
  },
  {
    id: 'fact_28',
    category: 'terminology',
    categoryLabel: 'Trading Terminology',
    title: 'Why Are They Called "Bonds"?',
    fact: 'The word "Bond" comes from the concept of a binding contractual promise or legal shackles connecting debtor and creditor.',
    explanation: 'Unlike equity (ownership shares), bonds represent pure debt obligations where the issuer is legally bound to pay fixed interest coupons and return the principal upon maturity.',
    sourceRef: 'Etymological Dictionary of Financial Instruments'
  },
  {
    id: 'fact_29',
    category: 'famous_events',
    categoryLabel: 'Famous Events',
    title: 'Sir Isaac Newton Lost a Fortune in Stocks',
    fact: 'Sir Isaac Newton, one of history’s greatest mathematical geniuses, lost an estimated £20,000 (millions in today’s money) in the South Sea Bubble of 1720.',
    explanation: 'After initially taking a profit, Newton saw friends making fortunes as the stock continued skyrocketing, re-bought near the peak out of FOMO, and lamented: "I can calculate the motions of heavenly bodies, but not the madness of people."',
    sourceRef: 'Bank of England Archives & Historical Letters of Isaac Newton'
  },
  {
    id: 'fact_30',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'The Muhurat Trading Tradition',
    fact: 'Indian stock exchanges host a unique, non-scheduled 1-hour trading session every year on Diwali evening called "Muhurat Trading".',
    explanation: 'Originating over a century ago among Gujarati and Marwari merchant communities, this auspicious session marks the start of the traditional Hindu financial year (Samvat), dedicated to Goddess Lakshmi.',
    sourceRef: 'BSE Cultural Archives & National Stock Exchange Circulars'
  },
  {
    id: 'fact_31',
    category: 'investing',
    categoryLabel: 'Investing Fundamentals',
    title: 'P/E Ratio Does Not Tell the Whole Story',
    fact: 'A low Price-to-Earnings (P/E) ratio does not automatically indicate a bargain; it could be a "Value Trap" signaling a company with declining future prospects.',
    explanation: 'Cyclical industries like steel and shipping often have single-digit P/E ratios at the absolute peak of an economic cycle right before profits collapse, misleading beginners.',
    sourceRef: 'Peter Lynch, One Up On Wall Street'
  },
  {
    id: 'fact_32',
    category: 'terminology',
    categoryLabel: 'Trading Terminology',
    title: 'The Origin of "Stag" in IPO Markets',
    fact: 'In financial parlance, a "Stag" is an investor who applies for shares in an Initial Public Offering (IPO) purely to flip them for a listing gain on day one.',
    explanation: 'Unlike bulls (long-term optimists) or bears (pessimists), stags care only about listing premiums and exit the security the moment the opening bell rings.',
    sourceRef: 'Investopedia Financial Terminology Index'
  },
  {
    id: 'fact_33',
    category: 'patterns',
    categoryLabel: 'Candlestick Patterns',
    title: 'The Hammer and Hanging Man',
    fact: 'A "Hammer" and a "Hanging Man" have the exact same physical shape—a small body with a long lower shadow—yet signal opposite trend reversals based purely on prior context.',
    explanation: 'Appearing after a steep downtrend, it is a bullish Hammer showing buyers rejected lower prices. Appearing at the peak of an uptrend, it is a bearish Hanging Man warning that selling pressure has emerged.',
    sourceRef: 'Technical Analysis of the Financial Markets by John J. Murphy'
  },
  {
    id: 'fact_34',
    category: 'psychology',
    categoryLabel: 'Market Psychology',
    title: 'The Danger of Confirmation Bias',
    fact: 'Once a trader buys a stock, their brain naturally seeks out only bullish articles and rejects negative analysis, creating dangerous blind spots.',
    explanation: 'Disciplined institutional investors practice "Red Teaming"—deliberately writing a comprehensive thesis on why their favorite stock might fail before risking capital.',
    sourceRef: 'Thinking, Fast and Slow by Daniel Kahneman'
  },
  {
    id: 'fact_35',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'Over 16 Crore Registered Demat Accounts in India',
    fact: 'India’s retail investor participation exploded post-2020, with total registered Demat accounts crossing 160 million in 2024, up from just 40 million in 2019.',
    explanation: 'Mobile smartphones, zero-brokerage apps, Aadhaar-based e-KYC, and UPI mandate payment infrastructure triggered one of the fastest financial inclusion waves in world history.',
    sourceRef: 'SEBI Monthly Investor Demat Statistics Bulletin'
  },
  {
    id: 'fact_36',
    category: 'famous_events',
    categoryLabel: 'Famous Events',
    title: 'The 2010 Flash Crash',
    fact: 'On May 6, 2010, the US stock market crashed 9% (nearly 1,000 Dow points) within 36 minutes before recovering almost all losses by the closing bell.',
    explanation: 'A large institutional algorithmic sell order combined with high-frequency market-making algorithms canceling their bids drained order book liquidity, triggering the creation of modern single-stock price bands.',
    sourceRef: 'CFTC & SEC Joint Report on Findings Regarding Market Events of May 6, 2010'
  },
  {
    id: 'fact_37',
    category: 'investing',
    categoryLabel: 'Investing Fundamentals',
    title: 'Index Funds Beat 85%+ of Active Fund Managers',
    fact: 'Over a 15-year horizon, standard low-cost index funds tracking benchmark indices like the Nifty 50 or S&P 500 outperform over 85% of actively managed mutual funds.',
    explanation: 'High management expense ratios, transaction churning costs, and cash drag make it statistically difficult for active managers to beat the broad market consistently over decades.',
    sourceRef: 'S&P SPIVA India Scorecard Annual Studies'
  },
  {
    id: 'fact_38',
    category: 'terminology',
    categoryLabel: 'Trading Terminology',
    title: 'The Meaning of "Short Selling"',
    fact: 'Short selling involves borrowing shares you do not own from a broker, selling them at current prices, and hoping to buy them back later at a lower price to return them.',
    explanation: 'While potential profit on a short trade is capped at 100% (if the stock drops to zero), the theoretical loss is mathematically infinite if the stock keeps rocketing upwards.',
    sourceRef: 'SEC Office of Investor Education and Advocacy Bulletin'
  },
  {
    id: 'fact_39',
    category: 'history',
    categoryLabel: 'Market History',
    title: 'Ticker Tape Machines Shaped Modern Wall Street',
    fact: 'Invented by Edward Calahan in 1867 and improved by Thomas Edison in 1869, ticker tape machines revolutionized market transparency.',
    explanation: 'Before ticker tape, stock prices were delivered by young runners or telegraph. The ticker printed telegraphic prices onto continuous narrow paper strips, accompanied by a signature ticking mechanical sound.',
    sourceRef: 'Smithsonian National Museum of American History'
  },
  {
    id: 'fact_40',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'India’s Gold Holdings vs Equities',
    fact: 'Indian households are estimated to hold over 25,000 tonnes of physical gold—more than the combined official reserves of the top 5 global central banks.',
    explanation: 'Historically, physical gold and real estate were preferred stores of value, but equity investments have rapidly expanded as financial literacy and digital capital markets mature.',
    sourceRef: 'World Gold Council Household Holdings Report'
  },
  {
    id: 'fact_41',
    category: 'psychology',
    categoryLabel: 'Market Psychology',
    title: 'The "Gambler’s Fallacy" in Chart Analysis',
    fact: 'Believing that a stock that has fallen 5 days in a row "is due for an up day" is an example of the Gambler’s Fallacy.',
    explanation: 'Each trading session is governed by current supply, demand, and incoming fundamental information. The market has no memory of how many red candles came before.',
    sourceRef: 'Amos Tversky, Belief in the Law of Small Numbers'
  },
  {
    id: 'fact_42',
    category: 'investing',
    categoryLabel: 'Investing Fundamentals',
    title: 'Debt-to-Equity: The Solvency Metric',
    fact: 'Companies with a Debt-to-Equity ratio greater than 2.0 carry significant leverage risks during rising interest rate cycles.',
    explanation: 'When central banks raise benchmark repo rates to fight inflation, highly indebted companies must spend higher fractions of operating profits on interest servicing, squeezing net margins.',
    sourceRef: 'CFA Institute Corporate Finance Curriculum'
  },
  {
    id: 'fact_43',
    category: 'famous_events',
    categoryLabel: 'Famous Events',
    title: 'The 2008 Global Financial Crisis & Lehman Brothers',
    fact: 'On September 15, 2008, 158-year-old investment bank Lehman Brothers filed the largest bankruptcy in US history with over $619 billion in debt.',
    explanation: 'Excessive leverage in subprime mortgage-backed securities and credit default swaps froze global interbank lending, prompting worldwide government bailouts and regulatory overhaul.',
    sourceRef: 'Financial Crisis Inquiry Commission Final Report (2011)'
  },
  {
    id: 'fact_44',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'The Role of Clearing Corporations',
    fact: 'When you trade on Indian exchanges, you never face default risk from the counterparty because the clearing corporation acts as the central counterparty to every trade.',
    explanation: 'The clearing corporation (such as NCL or ICCL) steps in between buyer and seller, guaranteeing settlement even if a brokerage firm or trader defaults on obligations.',
    sourceRef: 'SEBI Clearing and Settlement Regulations'
  },
  {
    id: 'fact_45',
    category: 'terminology',
    categoryLabel: 'Trading Terminology',
    title: 'What Is the "Bid-Ask Spread"?',
    fact: 'The gap between the highest price a buyer is willing to pay (Bid) and the lowest price a seller is willing to accept (Ask) is the Bid-Ask Spread.',
    explanation: 'In highly liquid stocks like Reliance or TCS, this spread is often just 5 paise. In illiquid micro-caps, wide spreads represent hidden transaction friction that can erode profits.',
    sourceRef: 'Market Liquidity and Microstructure by Larry Harris'
  },
  {
    id: 'fact_46',
    category: 'psychology',
    categoryLabel: 'Market Psychology',
    title: 'The Herd Mentality Trap',
    fact: 'When an investment becomes the primary topic of conversation among friends, cab drivers, and social media influencers, it is often at maximum speculative euphoria.',
    explanation: 'As legendary investor Bernard Baruch famously quipped: when his shoe-shine boy began offering him unsolicited stock tips in 1929, he sold all his holdings before the crash.',
    sourceRef: 'Baruch: My Own Story (1957 autobiography)'
  },
  {
    id: 'fact_47',
    category: 'investing',
    categoryLabel: 'Investing Fundamentals',
    title: 'Return on Equity (ROE)',
    fact: 'Return on Equity (ROE) measures how efficiently management converts each rupee of shareholder equity into bottom-line net profit.',
    explanation: 'An ROE consistently above 15% without excessive balance sheet debt is widely considered a hallmark of a durable corporate economic moat.',
    sourceRef: 'Security Analysis by Graham & Dodd'
  },
  {
    id: 'fact_48',
    category: 'patterns',
    categoryLabel: 'Candlestick Patterns',
    title: 'The Engulfing Pattern',
    fact: 'A Bullish Engulfing pattern forms when a small red candle is completely overshadowed and swallowed by a large green candle the following day.',
    explanation: 'It visually communicates that while sellers were initially in control, buyers stormed the market with overwhelming volume, reversing the prevailing momentum.',
    sourceRef: 'Encyclopedia of Candlestick Charts by Thomas N. Bulkowski'
  },
  {
    id: 'fact_49',
    category: 'history',
    categoryLabel: 'Market History',
    title: 'The Origin of the Term "Wall Street"',
    fact: 'Wall Street in lower Manhattan was originally an earthen wall built by Dutch settlers in 1653 to protect the colony of New Amsterdam from attacks.',
    explanation: 'Although the defensive wooden stockade was dismantled in 1699, the street retaining its name evolved into a hub for merchants and eventually the financial capital of the world.',
    sourceRef: 'New-York Historical Society Archives'
  },
  {
    id: 'fact_50',
    category: 'famous_events',
    categoryLabel: 'Famous Events',
    title: 'March 2020 Covid Circuit Breaker Halt',
    fact: 'On March 13, 2020, both the BSE Sensex and NSE Nifty hit the 10% lower circuit breaker within 15 minutes of opening, freezing trade for 45 minutes.',
    explanation: 'Remarkably, after trading resumed and central banks promised liquidity, the market staged a historic intra-day rebound of over 5,000 Sensex points before embarking on an unprecedented multi-year bull run.',
    sourceRef: 'NSE & BSE Market Action Circulars (March 13, 2020)'
  },
  {
    id: 'fact_51',
    category: 'indian_markets',
    categoryLabel: 'Indian Markets',
    title: 'Mutual Funds Sahi Hai Campaign',
    fact: 'Launched by AMFI in March 2017, the "Mutual Funds Sahi Hai" initiative is recognized as one of the world’s most successful financial literacy programs.',
    explanation: 'It helped demystify systematic investment plans (SIPs) for everyday Indian households, shifting national savings from physical assets like gold and real estate into institutional equity mutual funds.',
    sourceRef: 'Association of Mutual Funds in India (AMFI) Annual Reports'
  },
  {
    id: 'fact_52',
    category: 'investing',
    categoryLabel: 'Investing Fundamentals',
    title: 'Inflation: The Silent Capital Destroyer',
    fact: 'At a 6% annual inflation rate, the purchasing power of idle cash kept in a savings bank or locker is cut in half every 12 years.',
    explanation: 'Equities historically provide the most accessible hedge against consumer inflation because healthy companies raise prices to preserve operating margins as production costs climb.',
    sourceRef: 'Reserve Bank of India Monetary Policy Report & Macro Inflation Data'
  }
];
