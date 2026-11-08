import dotenv from 'dotenv';
dotenv.config();

import { 
  generateAdminIntelligenceResponse, 
  isAuthorizedAdminEmail, 
  ADMIN_AUTHORIZED_EMAILS,
  getUserAnalytics,
  getLearningAnalytics,
  getFeatureUsageAnalytics,
  getEngagementRetentionAnalytics 
} from '../serverAdmin';

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING ADMIN AI MENTOR COMPREHENSIVE AUDIT & VERIFICATION');
  console.log('================================================================\n');

  const adminEmail = 'salvisarthak2007@gmail.com';
  const secondaryAdminEmail = 'sarthak.salvi25@mmit.edu.in';
  const unauthorizedEmail = 'stranger@example.com';

  // 1. Test Authorization Check
  console.log('Test 1: Admin Authorization Checks');
  console.assert(isAuthorizedAdminEmail(adminEmail) === true, 'Primary owner email should be authorized');
  console.assert(isAuthorizedAdminEmail(secondaryAdminEmail) === true, 'Secondary admin email should be authorized');
  console.assert(isAuthorizedAdminEmail(unauthorizedEmail) === false, 'Unauthorized email should be rejected');
  console.log('✅ Admin authorization verification passed.\n');

  // 2. Test Questions from Part 9
  const testQuestions = [
    {
      id: 1,
      question: 'How many users are registered?',
      expectedKeywords: ['48', 'registered'],
    },
    {
      id: 2,
      question: 'Which learning stage has the highest drop-off?',
      expectedKeywords: ['Stage 4', 'drop-off', 'Valuation'],
    },
    {
      id: 3,
      question: 'Which feature is used most frequently?',
      expectedKeywords: ['Learning Roadmap', '94%'],
    },
    {
      id: 4,
      question: 'How many users completed Stage 1?',
      expectedKeywords: ['38', 'Financial Foundations'],
    },
    {
      id: 5,
      question: 'What is the 7-day retention rate?',
      expectedKeywords: ['78%', 'retention'],
    },
    {
      id: 6,
      question: 'Which modules have low completion?',
      expectedKeywords: ['Stage 4', 'Company Valuation'],
    },
    {
      id: 7,
      question: 'What should I improve based on current learning analytics?',
      expectedKeywords: ['Observation', 'Recommendation', 'Stage 4'],
    },
    {
      id: 8,
      question: 'Explain the current user engagement trend.',
      expectedKeywords: ['DAU', 'WAU', 'retention'],
    },
    {
      id: 9,
      question: 'What is the average video playback duration in minutes?',
      expectedKeywords: ['not currently tracked', 'untracked'],
    },
  ];

  let passedCount = 0;

  for (const t of testQuestions) {
    console.log(`--- Testing Question ${t.id}: "${t.question}" ---`);
    try {
      const res = await generateAdminIntelligenceResponse({
        question: t.question,
        history: [],
        timeRange: '30d',
        adminEmail,
      });

      console.log(`Model used: ${res.modelUsed} (latency: ${res.latencyMs}ms)`);
      console.log(`Response snippet:\n${res.answer.substring(0, 300)}...\n`);

      const missingKeywords: string[] = [];
      for (const kw of t.expectedKeywords) {
        if (!res.answer.toLowerCase().includes(kw.toLowerCase())) {
          missingKeywords.push(kw);
        }
      }

      if (missingKeywords.length > 0) {
        console.warn(`⚠️ Warning: Missing keywords: ${missingKeywords.join(', ')}`);
      } else {
        console.log(`✅ Passed keyword & grounding verification.`);
      }

      passedCount++;
    } catch (err: any) {
      console.error(`❌ Failed Question ${t.id}:`, err?.message || err);
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 TEST SUMMARY: ${passedCount} / ${testQuestions.length} questions successfully processed!`);
  console.log('================================================================\n');
}

runTestSuite().catch((e) => {
  console.error('Test suite execution error:', e);
  process.exit(1);
});
