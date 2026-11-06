import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  RotateCcw,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  AdminAnalyticsData, 
  askAdminIntelligence, 
  triggerTactileHaptic 
} from '../../services/adminService';
import {
  fetchAdminMentorConversations,
  fetchAdminMentorMessages,
  createAdminMentorConversation,
  saveAdminMentorMessage,
  clearAllAdminMentorConversations,
  MentorMessage,
  MentorConversation,
} from '../../services/mentorHistory';

interface AdminIntelligenceMentorTabProps {
  adminEmail: string;
  analytics: AdminAnalyticsData;
}

export const AdminIntelligenceMentorTab: React.FC<AdminIntelligenceMentorTabProps> = ({
  adminEmail,
  analytics,
}) => {
  const [conversations, setConversations] = useState<MentorConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const defaultWelcome: MentorMessage = {
    id: 'admin_welcome',
    sender: 'mentor',
    text: `Hello Sarthak! I am **ShareMarket Admin Intelligence**, your executive platform analytics copilot.\n\nI have real-time visibility into the current cohort: **${analytics.kpis.totalRegisteredUsers} registered learners**, **${analytics.kpis.dau} active today**, **${analytics.kpis.avgCompletionRate}% avg curriculum completion**, and **${analytics.kpis.totalAiQueries} AI queries**.\n\nAsk me anything about student bottlenecks, drop-off rates, paper trading popularity, or pedagogical recommendations!`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
  };

  // Load conversations on mount
  useEffect(() => {
    fetchAdminMentorConversations(adminEmail).then((convs) => {
      setConversations(convs);
      if (convs.length > 0) {
        setActiveConvId(convs[0].id);
        fetchAdminMentorMessages(adminEmail, convs[0].id).then((msgs) => {
          setMessages(msgs.length > 0 ? msgs : [defaultWelcome]);
        });
      } else {
        setMessages([defaultWelcome]);
      }
    });
  }, [adminEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  const handleSelectConversation = async (convId: string) => {
    triggerTactileHaptic(6);
    setActiveConvId(convId);
    setLoading(true);
    try {
      const msgs = await fetchAdminMentorMessages(adminEmail, convId);
      setMessages(msgs.length > 0 ? msgs : [defaultWelcome]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    triggerTactileHaptic(8);
    setActiveConvId(null);
    setMessages([defaultWelcome]);
    setInputText('');
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all Admin Intelligence conversation history?')) return;
    triggerTactileHaptic(10);
    await clearAllAdminMentorConversations(adminEmail);
    setConversations([]);
    setActiveConvId(null);
    setMessages([defaultWelcome]);
  };

  const handleCopy = async (id: string, text: string) => {
    triggerTactileHaptic(6);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || loading) return;

    triggerTactileHaptic(8);
    setInputText('');

    let convId = activeConvId;
    if (!convId) {
      const newConv = await createAdminMentorConversation(adminEmail, textToSend);
      convId = newConv.id;
      setActiveConvId(convId);
      setConversations((prev) => [newConv, ...prev]);
    }

    const userMsg: MentorMessage = {
      id: 'admin_usr_' + Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev.filter((m) => m.id !== 'admin_welcome'), userMsg]);
    setLoading(true);

    if (convId) {
      await saveAdminMentorMessage(adminEmail, convId, userMsg);
    }

    try {
      const recentHistory = messages
        .filter((m) => m.id !== 'admin_welcome')
        .slice(-6)
        .map((m) => ({ sender: m.sender, text: m.text }));

      const reply = await askAdminIntelligence(
        adminEmail,
        textToSend,
        [...recentHistory, { sender: 'user', text: textToSend }],
        analytics.timeRange
      );

      const aiMsg: MentorMessage = {
        id: 'admin_ai_' + Date.now(),
        sender: 'mentor',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (convId) {
        await saveAdminMentorMessage(adminEmail, convId, aiMsg);
      }
    } catch (err: any) {
      const errorMsg: MentorMessage = {
        id: 'admin_ai_err_' + Date.now(),
        sender: 'mentor',
        text: `Consultation note: High-signal analysis could not be retrieved from Gemini (${err.message}). You can consult the raw metrics tables in the other tabs.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'Summarize learner engagement and 7-day retention trends',
    'Which module has the highest drop-off and what should we improve?',
    'What are students asking the AI Mentor most frequently?',
    'Analyze Paper Trading activity and the most popular fictional stocks',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[720px]">
      {/* Sidebar / Conversation History List */}
      <div className="lg:col-span-1 theme-card border theme-border rounded-xl p-4 flex flex-col justify-between overflow-hidden">
        <div className="space-y-3 overflow-hidden flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-xs theme-main-text uppercase tracking-wider">
              Admin Intel Sessions
            </h4>
            <button
              type="button"
              onClick={handleNewChat}
              className="p-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>

          <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 text-xs">
            {conversations.length === 0 ? (
              <p className="text-[11px] theme-muted-text italic py-4 text-center">
                No past sessions. Ask an intelligence question to begin.
              </p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectConversation(c.id)}
                  className={`w-full p-2.5 rounded-lg text-left transition-colors cursor-pointer block truncate ${
                    activeConvId === c.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                      : 'hover:bg-slate-800/60 theme-muted-text hover:theme-main-text'
                  }`}
                >
                  <div className="truncate">{c.title}</div>
                  <div className="text-[10px] opacity-70 font-mono mt-0.5">
                    {new Date(c.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {conversations.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="w-full mt-3 py-1.5 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear Admin Sessions
          </button>
        )}
      </div>

      {/* Main Chat Interface */}
      <div className="lg:col-span-3 theme-card border theme-border rounded-xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b theme-border flex items-center justify-between theme-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xs theme-main-text flex items-center gap-1.5">
                ShareMarket Admin Intelligence
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-500 font-mono">
                  Grounded Analytics
                </span>
              </h3>
              <p className="text-[10px] theme-muted-text">
                Direct insights synthesized from real student data & curriculum metrics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            className="text-xs theme-muted-text hover:theme-main-text flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-3.5 space-y-2 relative group ${
                    isUser
                      ? 'theme-primary-bg text-white shadow-md'
                      : 'theme-surface-subtle border theme-border theme-main-text'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div className="flex items-center justify-between text-[10px] opacity-70 border-t theme-border pt-1">
                    <span>{m.time}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(m.id, m.text)}
                      className="hover:opacity-100 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 text-xs items-center theme-muted-text">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>Synthesizing platform intelligence with Gemini 2.5 Flash...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sample Prompts & Input Box */}
        <div className="p-3.5 border-t theme-border theme-surface-subtle space-y-3">
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5">
              {sampleQuestions.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-md theme-surface-elevated hover:theme-card border theme-border text-[11px] theme-muted-text hover:theme-main-text transition-colors cursor-pointer text-left shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Admin Intelligence about student engagement, quiz results, or drop-off rates..."
              className="flex-1 py-2 px-3 rounded-lg theme-surface-elevated border theme-border text-xs theme-main-text placeholder:theme-muted-text focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || !inputText.trim()}
              className="py-2 px-3.5 rounded-lg theme-primary-btn font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
