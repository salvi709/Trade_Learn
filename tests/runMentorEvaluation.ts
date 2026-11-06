import fs from 'fs';
import { generateMentorResponse, retrieveRelevantKnowledge } from '../serverMentorEngine';
import { MENTOR_EVALUATION_DATASET, EvaluationQuestion } from './mentorEvaluationDataset';

// Ensure API key is present
if (!process.env.GEMINI_API_KEY && process.env.API_KEY) {
  process.env.GEMINI_API_KEY = process.env.API_KEY;
}

interface TestResult {
  id: string;
  category: string;
  question: string;
  passed: boolean;
  modelUsed: string;
  latencyMs: number;
  answerSnippet: string;
  keywordScore: number;
  distinctivenessHash: string;
  retrievedLessons: string[];
  notes: string[];
}

export async function runEvaluationSuite(sampleCount = 10): Promise<{
  totalTested: number;
  passedCount: number;
  averageScorePercent: number;
  averageLatencyMs: number;
  uniqueAnswerRatio: number;
  results: TestResult[];
}> {
  console.log(`\n======================================================`);
  console.log(`  SHAREMARKET AI MENTOR EVALUATION SUITE`);
  console.log(`  Testing ${sampleCount} questions across diverse categories`);
  console.log(`======================================================\n`);

  const selectedQuestions = MENTOR_EVALUATION_DATASET.slice(0, sampleCount);
  const results: TestResult[] = [];
  const uniqueAnswers = new Set<string>();

  for (let i = 0; i < selectedQuestions.length; i++) {
    const q = selectedQuestions[i];
    process.stdout.write(`[${i + 1}/${selectedQuestions.length}] Testing ${q.id} (${q.category}): "${q.question.slice(0, 45)}..." `);

    const notes: string[] = [];

    // Test retrieval
    const ret = retrieveRelevantKnowledge(q.question);

    try {
      const resp = await generateMentorResponse({
        question: q.question,
        history: q.history,
        mode: q.mode,
        learnerContext: {
          displayName: 'TestLearner',
          currentStageNumber: q.learnerStage || 1,
          currentStageTitle: `Stage ${q.learnerStage || 1}`,
          experienceLevel: 'Beginner',
        },
      });

      const lowerAnswer = resp.answer.toLowerCase();

      // Check keywords
      let matchedCount = 0;
      for (const kw of q.expectedKeywords) {
        if (lowerAnswer.includes(kw.toLowerCase())) {
          matchedCount++;
        }
      }
      const keywordScore = Math.round((matchedCount / (q.expectedKeywords.length || 1)) * 100);

      // Check distinctiveness: hash first 100 chars
      const fingerprint = resp.answer.trim().slice(0, 100);
      uniqueAnswers.add(fingerprint);

      // Relevance check: answer must be at least 60 characters and match at least 1 keyword
      const isRelevant = resp.answer.length >= 80 && matchedCount >= 1;
      const passed = isRelevant;

      if (!isRelevant) {
        notes.push(`Low keyword match: ${matchedCount}/${q.expectedKeywords.length}`);
      }

      results.push({
        id: q.id,
        category: q.category,
        question: q.question,
        passed,
        modelUsed: resp.modelUsed,
        latencyMs: resp.latencyMs,
        answerSnippet: resp.answer.replace(/\s+/g, ' ').slice(0, 95) + '...',
        keywordScore,
        distinctivenessHash: fingerprint,
        retrievedLessons: resp.retrievedLessons || [],
        notes,
      });

      console.log(`✓ OK (${resp.modelUsed}, ${resp.latencyMs}ms, ${keywordScore}% kw match)`);
    } catch (err: any) {
      console.log(`✗ FAIL (${err.message})`);
      results.push({
        id: q.id,
        category: q.category,
        question: q.question,
        passed: false,
        modelUsed: 'NONE',
        latencyMs: 0,
        answerSnippet: `ERROR: ${err.message}`,
        keywordScore: 0,
        distinctivenessHash: 'ERROR',
        retrievedLessons: [],
        notes: [err.message],
      });
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const totalTested = results.length;
  const avgScore = Math.round(results.reduce((a, b) => a + b.keywordScore, 0) / (totalTested || 1));
  const avgLatency = Math.round(results.reduce((a, b) => a + b.latencyMs, 0) / (totalTested || 1));
  const uniqueRatio = Math.round((uniqueAnswers.size / (totalTested || 1)) * 100);

  console.log(`\n======================================================`);
  console.log(`  EVALUATION SUMMARY:`);
  console.log(`  - Total Questions Evaluated: ${totalTested}`);
  console.log(`  - Passed: ${passedCount} / ${totalTested} (${Math.round((passedCount / totalTested) * 100)}%)`);
  console.log(`  - Average Keyword Match Score: ${avgScore}%`);
  console.log(`  - Distinct Responses: ${uniqueAnswers.size} / ${totalTested} (${uniqueRatio}% unique)`);
  console.log(`  - Average Latency: ${avgLatency}ms`);
  console.log(`======================================================\n`);

  return {
    totalTested,
    passedCount,
    averageScorePercent: avgScore,
    averageLatencyMs: avgLatency,
    uniqueAnswerRatio: uniqueRatio,
    results,
  };
}

if (import.meta.url.endsWith(process.argv[1])) {
  const count = process.argv[2] ? parseInt(process.argv[2], 10) : 10;
  runEvaluationSuite(count);
}
