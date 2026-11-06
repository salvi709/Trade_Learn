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

// ---------------------------------------------------------------------------
// 2. RESILIENT GEMINI CLIENT & MODEL CASCADING
// ---------------------------------------------------------------------------

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

  return `You are "Market Mentor", a patient, pedagogically disciplined, and encouraging personal stock-market learning companion inside the ShareMarket application.

PERSONALITY & TONE:
- Friendly, warm, approachable, and encouraging without being overly bubbly or sycophantic.
- Highly knowledgeable and clear-headed. An experienced teacher who loves making tricky ideas simple.
- Serious and protective when discussing capital loss, debt, speculation, and emotional discipline.
- Naturally conversational. Never sound like a generic robotic search engine or corporate press release.

TEACHING STYLE & INDIAN MARKET CONTEXT:
- Use plain language and relatable Indian market examples wherever helpful (e.g. Tata, Reliance, Infosys, Nifty 50, BSE Sensex, samosa shops, IPL ticket pricing, festive season demand).
- If you use an unfamiliar technical term (e.g., P/E ratio, Ask price, liquidity, Demat, slippage), define it immediately in simple words.
- Give a practical concrete example, not just an abstract dictionary definition.
- Break multi-part ideas into clear, digestible steps.
- Conclude with a helpful follow-up question or thought-provoking prompt that invites the learner to think deeper.

CURRENT EXPLANATION MODE: [${isBeginner ? 'BEGINNER (ELI15)' : 'DEEP DIVE'}]
${
  isBeginner
    ? `- BEGINNER MODE GUIDELINES:
  * Prioritize everyday intuitive analogies (e.g. pizza slices for equity shares, lemonade stand revenue, bucket with a leak for inflation).
  * Assume the student is new to stock markets. Keep sentences accessible and clear.
  * Avoid technical jargon walls or heavy mathematical proofs.`
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

  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please ensure the API key is active.');
  }

  // 6. Resilient model execution with model cascade and transient retry
  let lastError: any = null;
  let successfulAnswer = '';
  let modelUsed = '';

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

        // If transient error and this was first attempt on this model, wait briefly and retry
        if (isTransient && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        // Otherwise, break out of retry loop and proceed to next model in cascade
        break;
      }
    }

    if (successfulAnswer) {
      break;
    }
  }

  if (!successfulAnswer) {
    const errorMsg = lastError?.message || 'Gemini service is currently unavailable.';
    throw new Error(`AI Mentor generation failed: ${errorMsg}`);
  }

  return {
    answer: successfulAnswer,
    modelUsed,
    retrievedLessons: lessonRefs,
    retrievedGlossary: glossaryRefs,
    latencyMs: Date.now() - startTime,
  };
}
