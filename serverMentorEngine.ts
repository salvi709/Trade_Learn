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

// Index Curriculum Modules & Lessons
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

// Index Glossary Terms
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

/**
 * Retrieve top relevant knowledge chunks based on query terms
 */
export function retrieveRelevantKnowledge(query: string, maxResults = 3): { chunks: KnowledgeChunk[]; lessonRefs: string[]; glossaryRefs: string[] } {
  const queryTokens = Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    )
  );

  if (queryTokens.length === 0) {
    return { chunks: [], lessonRefs: [], glossaryRefs: [] };
  }

  const scored = KNOWLEDGE_INDEX.map((chunk) => {
    let score = 0;
    const lowerTitle = chunk.title.toLowerCase();

    // Exact title match gets huge bonus
    if (lowerTitle.includes(query.toLowerCase().trim())) {
      score += 50;
    }

    for (const token of queryTokens) {
      if (lowerTitle.includes(token)) {
        score += 15;
      }
      if (chunk.keywords.includes(token)) {
        score += 3;
      }
    }

    return { chunk, score };
  })
    .filter((item) => item.score > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((item) => item.chunk);

  const lessonRefs = scored.filter((c) => c.type === 'lesson').map((c) => `${c.stageInfo} > ${c.title}`);
  const glossaryRefs = scored.filter((c) => c.type === 'glossary').map((c) => c.title);

  return { chunks: scored, lessonRefs, glossaryRefs };
}

// Circuit breaker for projects where Gemini free tier is not available (403 PERMISSION_DENIED)
let geminiBillingDisabledUntil = 0;

export function isGeminiBillingDisabled(): boolean {
  return Date.now() < geminiBillingDisabledUntil;
}

export function markGeminiBillingDisabled(ttlMs = 15 * 60 * 1000): void {
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

// Model cascade in priority order
const MODEL_CASCADE = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

// ---------------------------------------------------------------------------
// 3. SYSTEM INSTRUCTION & PERSONALITY BUILDER
// ---------------------------------------------------------------------------

function buildSystemInstruction(
  mode: 'eli15' | 'deep_dive',
  learnerContext?: LearnerContext,
  currentModule?: string,
  currentLesson?: string,
  groundingText?: string
): string {
  const isBeginner = mode === 'eli15';

  let personalizationBlock = '';
  if (learnerContext) {
    const parts: string[] = [];
    if (learnerContext.displayName) {
      parts.push(`- Student Name: ${learnerContext.displayName}`);
    }
    if (learnerContext.currentStageNumber && learnerContext.currentStageTitle) {
      parts.push(`- Current Learning Stage: Stage ${learnerContext.currentStageNumber}: ${learnerContext.currentStageTitle}`);
    }
    if (learnerContext.currentLessonTitle) {
      parts.push(`- Active Lesson: "${learnerContext.currentLessonTitle}"`);
    }
    if (learnerContext.completedLessonsCount !== undefined && learnerContext.totalLessonsCount) {
      parts.push(`- Curriculum Progress: ${learnerContext.completedLessonsCount} of ${learnerContext.totalLessonsCount} lessons mastered`);
    }
    if (learnerContext.averageQuizScore !== undefined) {
      parts.push(`- Quiz Accuracy: ${learnerContext.averageQuizScore}%`);
    }
    if (learnerContext.experienceLevel) {
      parts.push(`- Self-Identified Level: ${learnerContext.experienceLevel}`);
    }

    if (parts.length > 0) {
      personalizationBlock = `\n[STUDENT LEARNING CONTEXT IN SHAREMARKET]:\n${parts.join('\n')}\n*Personalization Rule*: Naturally reference the student's current stage or learning level ONLY when it genuinely helps contextualize the answer. Never invent achievements or force-feed context.`;
    }
  } else if (currentModule || currentLesson) {
    personalizationBlock = `\n[STUDENT'S ACTIVE LESSON]: Stage "${currentModule || 'General'}", Lesson "${currentLesson || 'General'}".`;
  }

  let groundingBlock = '';
  if (groundingText && groundingText.trim().length > 0) {
    groundingBlock = `\n[OFFICIAL SHAREMARKET KNOWLEDGE BASE GROUNDING]:\nUse the following verified educational material from ShareMarket as your primary knowledge source:\n${groundingText}\n*Grounding Instruction*: Accurately reflect these definitions and analogies. When relevant, you may mention that this topic is covered in ShareMarket lessons.`;
  }

  const studentName = learnerContext?.displayName || 'Learner';

  return `You are "Market Mentor", an empathetic, supportive, and dedicated personal learning companion and study partner inside the ShareMarket application.

COMPANION PERSONALITY & TONE:
- Warm, encouraging, companionable, and approachable. Speak directly to ${studentName} as a friendly, trusted mentor walking beside them on their learning adventure.
- Empathetic and reassuring: If a concept seems intimidating or if the student expresses doubts, validate their curiosity ("That's a fantastic question!", "Almost every smart investor struggled with this at first!").
- Celebrate learning progress naturally and keep morale high. Make them feel empowered and supported.
- Clear, vivid, and grounded: An experienced friend who loves turning dense financial jargon into crystal-clear everyday stories.
- Protective & caring: When discussing risk, stop-loss orders, or emotional trading, gently guide them toward capital preservation with brotherly/sisterly wisdom ("Your hard-earned savings come first!").
- Conversational and human: Write with natural warmth, helpful formatting (bullet points, clear sections), and occasional friendly emoji touches (💡, 📈, 🛡️, 🤝).

TEACHING STYLE & INDIAN MARKET CONTEXT:
- Use relatable Indian market examples and cultural touchstones (e.g. Tata, Reliance, Infosys, Nifty 50, BSE Sensex, local chai stalls, festive retail rushes, cricket match tickets).
- Define technical terms immediately in plain, friendly language.
- Provide a concrete, everyday analogy before delving into theory.
- Always close with an encouraging companion check-in or thoughtful follow-up question inviting them to explore further.

CURRENT EXPLANATION MODE: [${isBeginner ? 'BEGINNER (ELI15)' : 'DEEP DIVE'}]
${
  isBeginner
    ? `- BEGINNER MODE GUIDELINES:
  * Prioritize everyday intuitive analogies (e.g. pizza slices for equity shares, lemonade stand revenue, a leaky bucket for inflation).
  * Assume the student is taking their first steps in finance. Keep phrasing simple, friendly, and empowering.
  * Avoid dry math or walls of jargon.`
    : `- DEEP DIVE GUIDELINES:
  * Provide quantitative formulas, market mechanics, institutional order flow nuances, and balance sheet implications.
  * Explain key ratios (P/E, P/B, Debt-to-Equity), order book dynamics (Bid/Ask spread, liquidity traps), and risk-adjusted metrics.
  * Discuss real-world limitations and market frictions (e.g., execution slippage, gap openings).`
}
${personalizationBlock}
${groundingBlock}

MANDATORY SAFETY & COMPLIANCE RULES:
1. EDUCATIONAL PURPOSES ONLY: Never provide personalized investment advice, stock buy/sell recommendations, stock tips, or price targets.
2. ZERO PROFIT GUARANTEES: Never promise returns, guarantee profits, or promote reckless trading, options/futures gambles, or get-rich-quick schemes.
3. CAPITAL SURVIVAL ALWAYS FIRST: Always reinforce position sizing, stop-loss discipline, and emotional composure before chasing returns.
4. NO INVENTED LIVE DATA: You do not have real-time live market ticker feeds. If asked for today's live stock prices or latest news, state clearly that you provide educational guidance on market mechanics rather than live price ticks.`;
}

// ---------------------------------------------------------------------------
// 4. MAIN GENERATION ENGINE WITH RETRIEVAL & RESILIENT FALLBACK
// ---------------------------------------------------------------------------

export async function generateMentorResponse(request: MentorGenerateRequest): Promise<MentorGenerateResult> {
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

  // 1. Retrieve grounded educational material from ShareMarket knowledge base
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

  // 3. Format multi-turn conversation history (limited to last 6-8 turns to manage token window & preserve relevance)
  const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
  let formattedHistory = '';
  if (recentHistory.length > 0) {
    formattedHistory =
      '\n\n[RECENT CONVERSATION HISTORY]:\n' +
      recentHistory
        .map((m) => `${m.sender === 'user' ? 'Student' : 'Market Mentor'}: ${m.text}`)
        .join('\n');
  }

  // 4. Construct user parts (system instruction is passed via config.systemInstruction)
  const userPromptText = formattedHistory
    ? `${formattedHistory}\n\n[STUDENT'S CURRENT QUESTION]:\n${trimmedQuestion}`
    : trimmedQuestion;

  const promptParts: any[] = [
    {
      text: userPromptText,
    },
  ];

  // 5. Attachments support (Images, PDFs, Text files)
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
        } catch {
          // ignore parsing error
        }
      }
    }
  }

  let lastError: any = null;
  let successfulAnswer = '';
  let modelUsed = '';

  const ai = isGeminiBillingDisabled() ? null : getGeminiClient();

  if (ai) {
    for (const modelCandidate of MODEL_CASCADE) {
      // Attempt up to 2 tries per model if transient (503 / 429) error occurs
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents: [
              {
                role: 'user',
                parts: promptParts,
              },
            ],
            config: {
              systemInstruction,
            },
          });

          const text = response.text?.trim();
          if (text) {
            successfulAnswer = text;
            modelUsed = modelCandidate;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const status = err.status || (err.message && err.message.includes('503') ? 503 : null);
          const isTransient = status === 503 || status === 429;
          const isBillingOr403 = status === 403 || (typeof err.message === 'string' && (err.message.includes('403') || err.message.includes('billing') || err.message.includes('PERMISSION_DENIED')));

          if (isBillingOr403) {
            markGeminiBillingDisabled();
            break;
          }

          // If transient error and this was first attempt on this model, wait briefly and retry
          if (isTransient && attempt === 1) {
            await new Promise((resolve) => setTimeout(resolve, 600));
            continue;
          }
          // Otherwise, break out of retry loop and proceed to next model in cascade
          break;
        }
      }

      if (successfulAnswer || isGeminiBillingDisabled()) {
        break;
      }
    }
  }

  // Graceful Curriculum-Grounded Fallback if Gemini API is disabled, quota-limited, or 403
  if (!successfulAnswer) {
    successfulAnswer = generateGroundedEducationalAnswer({
      question: trimmedQuestion,
      mode,
      chunks,
      learnerContext,
      currentModule,
      currentLesson,
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

/**
 * High-quality grounded pedagogical answer generator with a personal companion voice
 */
function generateGroundedEducationalAnswer(params: {
  question: string;
  mode: 'eli15' | 'deep_dive';
  chunks: KnowledgeChunk[];
  learnerContext?: LearnerContext;
  currentModule?: string;
  currentLesson?: string;
}): string {
  const { question, mode, chunks, learnerContext } = params;
  const isBeginner = mode === 'eli15';
  const studentName = learnerContext?.displayName && learnerContext.displayName !== 'Learner' && learnerContext.displayName !== 'Guest'
    ? learnerContext.displayName
    : null;

  const greeting = studentName
    ? `Hey ${studentName}! 😊 Wonderful question — I'm really glad you asked.`
    : `Hey there! 😊 Wonderful question — let's unpack this together.`;

  // If we found relevant curriculum chunks, synthesize an expert, companionable response
  if (chunks.length > 0) {
    const primaryChunk = chunks[0];
    const secondaryChunk = chunks[1];

    const coreConcept = primaryChunk.content
      .split('\n')
      .filter((line) => line.startsWith('- Core Concept') || line.startsWith('- Definition'))
      .map((l) => l.replace(/^- (Core Concept|Definition): /, ''))
      .join('\n') ||
      `In simple terms, **${primaryChunk.title}** is one of the foundational building blocks of smart market decision-making.`;

    const realLifeAnalogy = primaryChunk.content.includes('- Real-Life Analogy')
      ? primaryChunk.content
          .split('\n')
          .find((l) => l.startsWith('- Real-Life Analogy'))
          ?.replace(/^- Real-Life Analogy \([^)]+\): /, '')
      : 'Imagine walking into a vibrant local bazaar: buyers and sellers negotiate in real-time, agreeing on prices based on demand, supply, and trust.';

    const keyTakeaway = primaryChunk.content
      .split('\n')
      .find((l) => l.startsWith('- Key Takeaway'))
      ?.replace(/^- Key Takeaway: /, '') ||
      `Mastering ${primaryChunk.title} builds your market intuition and shields your capital from impulsive choices.`;

    const technicalMechanics = primaryChunk.content
      .split('\n')
      .filter((line) => line.startsWith('- Technical Mechanics') || line.startsWith('- Definition'))
      .map((l) => l.replace(/^- (Technical Mechanics|Definition): /, ''))
      .join('\n') ||
      `In financial markets, **${primaryChunk.title}** is analyzed quantitatively to assess risk, capital allocation efficiency, and price momentum.`;

    const riskInsight = primaryChunk.content
      .split('\n')
      .find((l) => l.startsWith('- Risk Perspective'))
      ?.replace(/^- Risk Perspective: /, '') ||
      'Always limit your capital risk to 1–2% of total portfolio value per trade.';

    const keyFormula = primaryChunk.content
      .split('\n')
      .find((l) => l.startsWith('- Key Formula'))
      ?.replace(/^- Key Formula: /, '');

    if (isBeginner) {
      return `${greeting}

### 💡 Understanding **${primaryChunk.title}**

${coreConcept}

---

### 🍕 Real-Life Analogy
${realLifeAnalogy}

---

### 🛡️ Companion Wisdom & Key Takeaway
- **What this means for you**: ${keyTakeaway}
- **My rule of thumb**: Never rush into real money trades. You can practice this anytime with ₹10,000 virtual cash in our **Paper Trading Lab**!
${secondaryChunk ? `\n*Next related topic in your journey*: **${secondaryChunk.title}** (${secondaryChunk.stageInfo || 'ShareMarket Guide'}).` : ''}

How does that feel? Would you like me to walk through a quick real-world Indian company example (like Tata or Reliance), or test it in Paper Trading?`;
    } else {
      return `${greeting}

### 📊 Deep Dive: **${primaryChunk.title}**

**Market Mechanics**:
${technicalMechanics}

${keyFormula ? `**Key Metric / Formula**:\n\`${keyFormula}\`\n` : ''}
**Risk Perspective & Companion Checklist**:
- ${riskInsight}
- Ensure healthy order book depth before entering size orders to prevent execution slippage.
${secondaryChunk ? `\n*Associated Curriculum Module*: **${secondaryChunk.title}** [${secondaryChunk.stageInfo || 'Advanced Topics'}].` : ''}

Let me know if you want to stress-test this strategy against historical volatility or evaluate an order book scenario!`;
    }
  }

  // Fallback for general or conversational questions
  if (isBeginner) {
    return `${greeting}

### 💡 Exploring "${question}"

In the stock market, every stock you buy is an actual slice of a living, breathing business. When that company delivers great products and grows profits over time, your fractional slice becomes more valuable!

Here are three golden rules I always remind my learning partners of:
1. 🛡️ **Capital Preservation First**: Never invest money you'll need in the next 3 to 5 years.
2. 🧺 **Diversification**: Don't put all your eggs in one basket — spread across sectors.
3. 🎮 **Practice Zero-Risk First**: Test your theories with virtual capital in our **Paper Trading Lab** until it feels second nature.

What specific stock, concept, or term would you like to dig into next? I'm right here with you!`;
  } else {
    return `${greeting}

### 📊 Financial Framework: "${question}"

When breaking this down with institutional discipline:
1. **Asymmetric Risk/Reward**: Target a minimum 1:2 or 1:3 reward-to-risk ratio so you stay profitable over time.
2. **Execution Discipline**: Prefer limit orders when price accuracy matters, and understand market liquidity depth.
3. **Journal Every Trade**: Log your thesis, emotion, and result in the Trading Journal to master your trading psychology.

Would you like to analyze an Indian market scenario or test this directly in our interactive simulators?`;
  }
}
