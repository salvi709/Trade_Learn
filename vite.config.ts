import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

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

function geminiMentorPlugin() {
  let geminiClient: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI | null {
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

  const parseBody = (req: any): Promise<string> => {
    return new Promise((resolve) => {
      if (req.body) {
        resolve(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
        return;
      }
      let buf = '';
      req.on('data', (chunk: any) => {
        buf += chunk;
      });
      req.on('end', () => {
        resolve(buf);
      });
      if (req.readableEnded) {
        resolve(buf);
      }
    });
  };

  const checkAdminAuth = (req: any, query: any, bodyData: any): { authorized: boolean; email: string } => {
    let email = req.headers['x-admin-email'] || query?.get?.('adminEmail') || bodyData?.adminEmail;
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
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
  };

  return {
    name: 'gemini-mentor-api',
    configureServer(server: any) {
      // 1. Regular Educational Market Mentor
      server.middlewares.use('/api/mentor', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('Method Not Allowed');
        }

        try {
          const raw = await parseBody(req);
          const data = JSON.parse(raw || '{}');
          const { question, userId, history, mode = 'eli15', currentModule, currentLesson, attachments, learnerContext } = data;

          if (!question || typeof question !== 'string') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Question is required.' }));
          }

          const topic = classifyTopic(question);
          const hasAttachment = Array.isArray(attachments) && attachments.length > 0;
          const estimatedInputTokens = Math.ceil(question.length / 4) + (hasAttachment ? 350 : 0) + (Array.isArray(history) ? history.length * 40 : 0);

          const result = await generateMentorResponse({
            question,
            userId: userId || (req.headers['x-user-id'] as string),
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

          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              answer: result.answer,
              modelUsed: result.modelUsed,
              retrievedLessons: result.retrievedLessons,
              retrievedGlossary: result.retrievedGlossary,
              latencyMs: result.latencyMs,
              topic,
            })
          );
        } catch (err: any) {
          const errMsg = err?.message || 'Failed to consult Market Mentor. Please retry.';
          const isQuota = errMsg.includes('DAILY_QUOTA_EXHAUSTED') || errMsg.includes('USER_LIMIT_REACHED');
          res.statusCode = isQuota ? 429 : 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              error: errMsg,
              isQuotaExhausted: errMsg.includes('DAILY_QUOTA_EXHAUSTED'),
              isUserLimit: errMsg.includes('USER_LIMIT_REACHED'),
            })
          );
        }
      });

      // 2. Admin APIs Middleware
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;

        if (!pathname.startsWith('/api/admin/')) {
          return next();
        }

        const rawBody = req.method === 'POST' ? await parseBody(req) : '{}';
        const bodyData = JSON.parse(rawBody || '{}');

        const adminAuth = checkAdminAuth(req, urlObj.searchParams, bodyData);
        if (!adminAuth.authorized) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            error: 'Access Denied',
            message: 'Only authorized platform administrators have permissions to access this command portal.'
          }));
        }

        res.setHeader('Content-Type', 'application/json');

        if (pathname === '/api/admin/verify') {
          return res.end(JSON.stringify({
            isAdmin: true,
            email: adminAuth.email,
            role: 'Owner & Superadmin',
            verifiedAt: new Date().toISOString(),
          }));
        }

        if (pathname === '/api/admin/analytics') {
          const timeRange = (urlObj.searchParams.get('timeRange') as any) || '30d';
          return res.end(JSON.stringify(generatePlatformAnalytics(timeRange)));
        }

        if (pathname === '/api/admin/controls') {
          if (req.method === 'POST') {
            const { aiMentorDailyLimit, geminiActive, freeTierQueryCap, maintenanceMode } = bodyData;
            if (typeof aiMentorDailyLimit === 'number') adminStore.controls.aiMentorDailyLimit = aiMentorDailyLimit;
            if (typeof geminiActive === 'boolean') adminStore.controls.geminiActive = geminiActive;
            if (typeof freeTierQueryCap === 'number') adminStore.controls.freeTierQueryCap = freeTierQueryCap;
            if (typeof maintenanceMode === 'boolean') adminStore.controls.maintenanceMode = maintenanceMode;
            adminStore.recordAuditLog({
              adminEmail: adminAuth.email,
              action: 'UPDATE_CONTROLS',
              target: 'Platform System Controls',
              details: `Updated parameters: Limit=${adminStore.controls.aiMentorDailyLimit}, Active=${adminStore.controls.geminiActive}`,
              status: 'SUCCESS',
            });
            return res.end(JSON.stringify({ success: true, controls: adminStore.controls }));
          }
          return res.end(JSON.stringify(adminStore.controls));
        }

        if (pathname === '/api/admin/logs') {
          return res.end(JSON.stringify({ logs: adminStore.auditLogs }));
        }

        if (pathname === '/api/admin/mentor') {
          const { question, history, timeRange = '30d', attachments } = bodyData;
          if (!question || typeof question !== 'string' || !question.trim()) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Question is required.' }));
          }

          try {
            const result = await generateAdminIntelligenceResponse({
              question: question.trim(),
              history,
              timeRange,
              adminEmail: adminAuth.email,
              attachments,
            });

            return res.end(
              JSON.stringify({
                answer: result.answer,
                modelUsed: result.modelUsed,
                latencyMs: result.latencyMs,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (e: any) {
            console.error('Admin mentor endpoint error:', e);
            res.statusCode = 500;
            return res.end(JSON.stringify({
              error: 'Failed to synthesize platform intelligence.',
              details: e?.message || String(e),
            }));
          }
        }

        return next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiMentorPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
