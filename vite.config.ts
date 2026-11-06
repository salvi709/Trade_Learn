import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

import { 
  ADMIN_OWNER_EMAIL, 
  adminStore, 
  classifyTopic, 
  generatePlatformAnalytics 
} from './serverAdmin';
import { generateMentorResponse } from './serverMentorEngine';

function geminiMentorPlugin() {
  let geminiClient: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI | null {
    if (!geminiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        geminiClient = new GoogleGenAI({ apiKey });
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

  const checkAdminAuth = (req: any, query: any, bodyData: any): boolean => {
    const email = req.headers['x-admin-email'] || query.get('adminEmail') || bodyData?.adminEmail;
    return String(email || '').toLowerCase().trim() === ADMIN_OWNER_EMAIL.toLowerCase();
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
          const { question, history, mode = 'eli15', currentModule, currentLesson, attachments, learnerContext } = data;

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
          console.error('Mentor error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              error: err?.message || 'Failed to consult Market Mentor. Please retry.',
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

        if (!checkAdminAuth(req, urlObj.searchParams, bodyData)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            error: 'Access Denied',
            message: 'Only the platform owner (salvisarthak2007@gmail.com) has permissions to access this command portal.'
          }));
        }

        res.setHeader('Content-Type', 'application/json');

        if (pathname === '/api/admin/verify') {
          return res.end(JSON.stringify({
            isAdmin: true,
            email: ADMIN_OWNER_EMAIL,
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
              adminEmail: ADMIN_OWNER_EMAIL,
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
          const { question, history, timeRange = '30d' } = bodyData;
          const analytics = generatePlatformAnalytics(timeRange);
          const ai = getGenAI();

          if (!ai) {
            return res.end(JSON.stringify({
              answer: `**ShareMarket Admin Intelligence (Dev Fallback)**:
Current Registered Learners: **${analytics.kpis.totalRegisteredUsers}**
Daily Active Users (DAU): **${analytics.kpis.dau}** | WAU: **${analytics.kpis.wau}** | MAU: **${analytics.kpis.mau}**
Average Curriculum Completion: **${analytics.kpis.avgCompletionRate}%**
AI Mentor Queries: **${analytics.kpis.totalAiQueries}** (Success Rate: ${analytics.aiMentorAnalytics.successRate}%)

Strategic Recommendation:
1. Module 2 ("Company Valuation") has the lowest quiz score average (84%)—review question clarity.
2. 76% of users engage actively with Paper Trading.
3. Cost remains well within budget ($${analytics.aiMentorAnalytics.estimatedCostUSD} USD).`,
              modelUsed: 'dev-admin-intel',
            }));
          }

          try {
            const adminSystemPrompt = `You are "ShareMarket Admin Intelligence", an expert educational analytics advisor for the Owner (${ADMIN_OWNER_EMAIL}).
Live platform metrics:
- Users: ${analytics.kpis.totalRegisteredUsers}
- DAU: ${analytics.kpis.dau}, WAU: ${analytics.kpis.wau}, MAU: ${analytics.kpis.mau}
- Completion Rate: ${analytics.kpis.avgCompletionRate}%
- Total AI Inquiries: ${analytics.kpis.totalAiQueries}
- Estimated Cost: $${analytics.aiMentorAnalytics.estimatedCostUSD} USD (₹${analytics.aiMentorAnalytics.estimatedCostINR} INR)
- Inquired Topics: ${JSON.stringify(analytics.aiMentorAnalytics.topicCounts)}
Provide concise, executive-level answers with bold numbers and actionable bullet points.`;

            let historyTranscript = '';
            if (Array.isArray(history) && history.length > 0) {
              const recent = history.slice(-6);
              historyTranscript = `\n\nRecent Admin Conversation History:\n` +
                recent.map((m: any) => `${m.sender === 'user' ? 'Owner' : 'Admin Intelligence'}: ${m.text}`).join('\n');
            }

            let answerText = 'Analytics compiled successfully.';
            let modelUsed = 'gemini-3.8-flash';
            for (const m of ['gemini-3.8-flash', 'gemini-3.1-flash-lite']) {
              try {
                const response = await ai.models.generateContent({
                  model: m,
                  contents: [
                    {
                      role: 'user',
                      parts: [{ text: `${historyTranscript ? historyTranscript + '\n\n' : ''}Owner's Question: ${question}` }]
                    }
                  ],
                  config: {
                    systemInstruction: adminSystemPrompt,
                  }
                });
                if (response.text) {
                  answerText = response.text;
                  modelUsed = m;
                  break;
                }
              } catch {
                // Smooth fallback to next model in list
              }
            }

            return res.end(JSON.stringify({
              answer: answerText,
              modelUsed,
              timestamp: new Date().toISOString(),
            }));
          } catch (e: any) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: e.message }));
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
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
