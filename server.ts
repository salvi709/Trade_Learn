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
  ADMIN_AUTHORIZED_EMAILS,
  isAuthorizedAdminEmail,
  adminStore, 
  classifyTopic, 
  generatePlatformAnalytics,
  generateAdminIntelligenceResponse 
} from './serverAdmin';
import { generateMentorResponse } from './serverMentorEngine';

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy-initialized Gemini client with telemetry header
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return geminiClient;
}

function checkAdminAuth(req: Request): { authorized: boolean; email: string } {
  let email = (req.headers['x-admin-email'] as string) || (req.query.adminEmail as string) || req.body?.adminEmail;
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload?.email) {
          email = payload.email;
        }
      }
    } catch {}
  }
  const authorized = isAuthorizedAdminEmail(email);
  return { authorized, email: email || ADMIN_OWNER_EMAIL };
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
// ADMIN PRIVATE & SECURE APIS (Restricted to Authorized Administrators)
// ---------------------------------------------------------------------------

app.get('/api/admin/verify', (req: Request, res: Response) => {
  const adminAuth = checkAdminAuth(req);
  if (!adminAuth.authorized) {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Only authorized platform administrators have permissions to access this command portal.'
    });
  }

  return res.json({
    isAdmin: true,
    email: adminAuth.email,
    role: 'Owner & Superadmin',
    verifiedAt: new Date().toISOString(),
  });
});

app.get('/api/admin/analytics', (req: Request, res: Response) => {
  const adminAuth = checkAdminAuth(req);
  if (!adminAuth.authorized) {
    return res.status(403).json({ error: 'Access Denied: Admin verification failed.' });
  }

  const timeRange = (req.query.timeRange as '7d' | '30d' | '90d' | 'all') || '30d';
  const analytics = generatePlatformAnalytics(timeRange);
  return res.json(analytics);
});

// Admin AI Mentor ("ShareMarket Admin Intelligence")
app.post(['/api/admin/mentor', '/api/admin/intelligence'], async (req: Request, res: Response) => {
  const adminAuth = checkAdminAuth(req);

  if (!adminAuth.authorized) {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Only authorized platform administrators have access to this intelligence portal.'
    });
  }

  const { question, history, timeRange = '30d' } = req.body;
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  try {
    const result = await generateAdminIntelligenceResponse({
      question: question.trim(),
      history,
      timeRange,
      adminEmail: adminAuth.email,
    });

    return res.json({
      answer: result.answer,
      modelUsed: result.modelUsed,
      latencyMs: result.latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Admin mentor error:', error);
    return res.status(500).json({
      error: 'Failed to synthesize platform intelligence.',
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
