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
  const normalized = cleanQ.replace(/[?!.,;:]/g, '').trim();

  // 1. Direct greetings
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|greetings|namaste|hi\s*there|hello\s*there|hey\s*there)$/i.test(normalized)) {
    return {
      isCasual: true,
      response: "Hey! How can I help you today? Want to learn something about the stock market?",
    };
  }

  // 2. Wellbeing / How are you
  if (/^(how\s*are\s*you|how\s*r\s*u|how\s*are\s*you\s*doing|how\s*is\s*it\s*going|hows\s*it\s*going|whats\s*up|wassup)$/i.test(normalized)) {
    return {
      isCasual: true,
      response: "I'm doing well! Ready to help you understand the markets. What are we exploring today?",
    };
  }

  // 3. Gratitude / Thanks
  if (/^(thank\s*you|thanks|thank\s*u|thx|many\s*thanks|thank\s*you\s*so\s*much|thanks\s*a\s*lot|appreciate\s*it)$/i.test(normalized)) {
    return {
      isCasual: true,
      response: "You're welcome! Keep learning, one concept at a time.",
    };
  }

  // 4. Acknowledgements / Short positive feedback
  if (/^(great|awesome|cool|got\s*it|understood|perfect|ok|okay|nice|superb)$/i.test(normalized)) {
    return {
      isCasual: true,
      response: "Glad that made sense! Let me know whenever you're ready for the next concept.",
    };
  }

  // 5. Capabilities / What can you do
  if (/^(what\s+can\s+you\s+do|what\s+are\s+your\s+capabilities|who\s+are\s+you|how\s+can\s+you\s+help\s+me|help\s+me)$/i.test(normalized)) {
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
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please ensure the API key is active.');
  }

  // 8. Zero-Cost Model Selection (Requirement 4 & 13)
  const activeModel = validateZeroCostModel(getActiveFreeModel());

  let successfulAnswer = '';
  let lastError: any = null;

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
      lastError = err;
      const errMsg = String(err?.message || '');

      // Check if this is a 429 / RESOURCE_EXHAUSTED / Quota limit error
      const isQuotaError =
        err?.status === 429 ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('quota') ||
        errMsg.includes('rate-limits') ||
        errMsg.includes('free_tier_requests');

      if (isQuotaError) {
        // Daily quota exhausted: activate circuit breaker immediately; DO NOT retry (Requirement 6)
        const quotaInfo = aiQuotaTracker.recordProviderQuotaError(errMsg);
        aiQuotaTracker.recordRequest({
          source: 'learning',
          success: false,
          isQuotaExhausted: true,
          hasAttachment: hasAttachments,
          modelUsed: activeModel,
          latencyMs: Date.now() - startTime,
          userExcerpt: trimmedQuestion,
        });

        throw new Error(
          `DAILY_QUOTA_EXHAUSTED: ShareMarket operates on a strict ₹0 budget using Google's free-tier access. The daily free-tier limit (20 requests/day) has been reached. Please retry in ${quotaInfo.resetEta}. Your complete chat history, quiz progress, and paper trading portfolio are safely preserved.`
        );
      }

      // If transient 503 (server demand spike), retry once after a short delay
      const isTransient = err?.status === 503 || errMsg.includes('503');
      if (isTransient && attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 750));
        continue;
      }
      break;
    }
  }

  if (!successfulAnswer) {
    aiQuotaTracker.recordRequest({
      source: 'learning',
      success: false,
      isQuotaExhausted: false,
      hasAttachment: hasAttachments,
      modelUsed: activeModel,
      latencyMs: Date.now() - startTime,
      userExcerpt: trimmedQuestion,
    });

    let cleanDetail = '';
    if (lastError?.message) {
      try {
        const parsed = JSON.parse(lastError.message);
        if (parsed.error?.message) {
          cleanDetail = parsed.error.message;
        }
      } catch {
        cleanDetail = lastError.message;
      }
    }
    const userFriendlyNotice = cleanDetail
      ? cleanDetail
      : 'The AI service is currently experiencing high demand. Spikes in demand are usually temporary.';
    throw new Error(`Market Mentor is temporarily unavailable: ${userFriendlyNotice}`);
  }

  // Record successful query & update per-user count
  aiQuotaTracker.recordRequest({
    source: 'learning',
    success: true,
    isQuotaExhausted: false,
    hasAttachment: hasAttachments,
    modelUsed: activeModel,
    latencyMs: Date.now() - startTime,
    userExcerpt: trimmedQuestion,
  });
  aiQuotaTracker.incrementUserUsage(userKey);

  return {
    answer: successfulAnswer,
    modelUsed: activeModel,
    retrievedLessons: lessonRefs,
    retrievedGlossary: glossaryRefs,
    latencyMs: Date.now() - startTime,
  };
}
