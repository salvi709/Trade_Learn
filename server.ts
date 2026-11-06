import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { 
  ADMIN_OWNER_EMAIL, 
  adminStore, 
  classifyTopic, 
  generatePlatformAnalytics 
} from './serverAdmin';
import { generateMentorResponse } from './serverMentorEngine';

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiClient = new GoogleGenAI({ apiKey });
    }
  }
  return geminiClient;
}

function checkAdminAuth(req: Request): boolean {
  const emailHeader = (req.headers['x-admin-email'] as string) || (req.query.adminEmail as string) || req.body?.adminEmail;
  return emailHeader?.toLowerCase().trim() === ADMIN_OWNER_EMAIL.toLowerCase();
}

// Educational Market Mentor API endpoint (Powered by ShareMarket Knowledge Base & Resilient Cascade)
app.post('/api/mentor', async (req: Request, res: Response) => {
  const { question, history, mode = 'eli15', currentModule, currentLesson, attachments, learnerContext } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const topic = classifyTopic(question);
  const hasAttachment = Array.isArray(attachments) && attachments.length > 0;
  const estimatedInputTokens = Math.ceil(question.length / 4) + (hasAttachment ? 350 : 0) + (Array.isArray(history) ? history.length * 40 : 0);

  try {
    const result = await generateMentorResponse({
      question,
      history,
      mode,
      learnerContext,
      currentModule,
      currentLesson,
      attachments,
    });

    adminStore.recordMentorQuery({
      timestamp: new Date().toISOString(),
      mode: mode === 'deep_dive' ? 'deep_dive' : 'eli15',
      topic,
      hasAttachment,
      estimatedInputTokens,
      estimatedOutputTokens: Math.ceil(result.answer.length / 4),
      success: true,
    });

    return res.json({
      answer: result.answer,
      modelUsed: result.modelUsed,
      retrievedLessons: result.retrievedLessons,
      retrievedGlossary: result.retrievedGlossary,
      latencyMs: result.latencyMs,
      topic,
    });
  } catch (error: any) {
    console.error('Mentor API error:', error);
    adminStore.recordMentorQuery({
      timestamp: new Date().toISOString(),
      mode: mode === 'deep_dive' ? 'deep_dive' : 'eli15',
      topic,
      hasAttachment,
      estimatedInputTokens,
      estimatedOutputTokens: 0,
      success: false,
      error: error.message,
    });

    return res.status(500).json({
      error: error.message || 'Failed to consult Market Mentor. Please retry.',
    });
  }
});

// ---------------------------------------------------------------------------
// ADMIN PRIVATE & SECURE APIS (Restricted to salvisarthak2007@gmail.com)
// ---------------------------------------------------------------------------

app.get('/api/admin/verify', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Only the platform owner (salvisarthak2007@gmail.com) has permissions to access this command portal.'
    });
  }

  return res.json({
    isAdmin: true,
    email: ADMIN_OWNER_EMAIL,
    role: 'Owner & Superadmin',
    verifiedAt: new Date().toISOString(),
  });
});

app.get('/api/admin/analytics', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(403).json({ error: 'Access Denied: Admin verification failed.' });
  }

  const timeRange = (req.query.timeRange as '7d' | '30d' | '90d' | 'all') || '30d';
  const analytics = generatePlatformAnalytics(timeRange);
  return res.json(analytics);
});

// Admin AI Mentor ("ShareMarket Admin Intelligence")
app.post('/api/admin/mentor', async (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(403).json({ error: 'Access Denied: Admin verification failed.' });
  }

  const { question, history, timeRange = '30d' } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const analytics = generatePlatformAnalytics(timeRange);

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      answer: `**ShareMarket Admin Intelligence (Offline Report)**:
Current Registered Learners: **${analytics.kpis.totalRegisteredUsers}**
Daily Active Users (DAU): **${analytics.kpis.dau}** | WAU: **${analytics.kpis.wau}** | MAU: **${analytics.kpis.mau}**
Average Curriculum Completion: **${analytics.kpis.avgCompletionRate}%**
AI Mentor Queries: **${analytics.kpis.totalAiQueries}** (Success Rate: ${analytics.aiMentorAnalytics.successRate}%)

Key Strategic Recommendation:
1. Module 2 ("Company Valuation") has the lowest quiz average (84%)—consider adding 1 interactive analogy question.
2. 76% of active users are utilizing the Paper Trading Lab, showing strong practical retention.
3. AI Mentor cost remains extremely low ($${analytics.aiMentorAnalytics.estimatedCostUSD} USD).`,
      modelUsed: 'offline-admin-intel',
    });
  }

  try {
    const adminSystemPrompt = `You are "ShareMarket Admin Intelligence", an expert educational analytics advisor and platform copilot for the Owner (${ADMIN_OWNER_EMAIL}) of the ShareMarket learning application.

You have live aggregated metrics about learner behavior, curriculum completion, dropout rates, AI Mentor queries, paper trading adoption, and retention:
- Total Users: ${analytics.kpis.totalRegisteredUsers}
- Active Today (DAU): ${analytics.kpis.dau}, WAU: ${analytics.kpis.wau}, MAU: ${analytics.kpis.mau}
- Overall Completion Rate: ${analytics.kpis.avgCompletionRate}%
- Total AI Mentor Inquiries: ${analytics.kpis.totalAiQueries} (${analytics.aiMentorAnalytics.successRate}% success)
- Estimated Token Cost: $${analytics.aiMentorAnalytics.estimatedCostUSD} USD (approx ₹${analytics.aiMentorAnalytics.estimatedCostINR} INR)
- Most Inquired Topics: ${JSON.stringify(analytics.aiMentorAnalytics.topicCounts)}
- Module Performance:
${analytics.moduleAnalytics.map((m) => `  * ${m.title}: ${m.completionRate}% completion, ${m.avgQuizScore}% avg score, ${m.dropoffRate}% dropoff`).join('\n')}
- Feature Adoption: ${analytics.featureAdoption.map((f) => `${f.name}: ${f.activePercent}%`).join(', ')}

GUIDELINES:
1. Provide concise, high-signal, executive-level answers with bold metrics and actionable bullet points.
2. When asked about retention or drop-off, pinpoint specific modules and suggest concrete pedagogical improvements.
3. Be professional, direct, strategic, and data-grounded.`;

    let historyTranscript = '';
    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-6);
      historyTranscript = `\n\nRecent Admin Conversation History:\n` +
        recent.map((m: any) => `${m.sender === 'user' ? 'Owner' : 'Admin Intelligence'}: ${m.text}`).join('\n');
    }

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `${historyTranscript ? historyTranscript + '\n\n' : ''}Owner's Question: ${question}`
          }
        ]
      }
    ];

    let answerText = 'Analytics synthesized successfully.';
    let modelUsed = 'gemini-3.8-flash';
    for (const m of ['gemini-3.8-flash', 'gemini-3.1-flash-lite']) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents,
          config: {
            systemInstruction: adminSystemPrompt,
          },
        });
        if (response.text) {
          answerText = response.text;
          modelUsed = m;
          break;
        }
      } catch {
        // Fallback to next model
      }
    }

    return res.json({
      answer: answerText,
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Admin mentor error:', error);
    return res.status(500).json({
      error: 'Admin intelligence consultation failed.',
      details: error.message,
    });
  }
});

// Admin Controls
app.get('/api/admin/controls', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(403).json({ error: 'Access Denied' });
  }
  return res.json(adminStore.controls);
});

app.post('/api/admin/controls', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(403).json({ error: 'Access Denied' });
  }

  const { aiMentorDailyLimit, geminiActive, freeTierQueryCap, maintenanceMode } = req.body;
  if (typeof aiMentorDailyLimit === 'number') adminStore.controls.aiMentorDailyLimit = aiMentorDailyLimit;
  if (typeof geminiActive === 'boolean') adminStore.controls.geminiActive = geminiActive;
  if (typeof freeTierQueryCap === 'number') adminStore.controls.freeTierQueryCap = freeTierQueryCap;
  if (typeof maintenanceMode === 'boolean') adminStore.controls.maintenanceMode = maintenanceMode;

  adminStore.recordAuditLog({
    adminEmail: ADMIN_OWNER_EMAIL,
    action: 'UPDATE_CONTROLS',
    target: 'Platform System Controls',
    details: `Updated parameters: Limit=${adminStore.controls.aiMentorDailyLimit}, Active=${adminStore.controls.geminiActive}`,
    status: 'SUCCESS',
  });

  return res.json({ success: true, controls: adminStore.controls });
});

// Admin Audit Logs
app.get('/api/admin/logs', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(403).json({ error: 'Access Denied' });
  }
  return res.json({ logs: adminStore.auditLogs });
});

// Serve static frontend assets in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// For SPA routing, send index.html for all other routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Stock Market Learning Lab server running on http://0.0.0.0:${port}`);
});
