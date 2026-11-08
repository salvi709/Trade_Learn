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
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  HelpCircle
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
  deleteAdminMentorConversation,
  clearAllAdminMentorConversations,
  MentorMessage,
  MentorConversation,
} from '../../services/mentorHistory';
import { auth } from '../../services/firebase';

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
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string>('gemini-3.8-flash');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Identifier for persistent conversation history (User UID or adminEmail)
  const getAdminIdentifier = () => auth.currentUser?.uid || adminEmail;

  const defaultWelcome: MentorMessage = {
    id: 'admin_welcome',
    sender: 'mentor',
    text: `### ShareMarket Executive Analytics Intelligence\n\nWelcome Administrator! I am your dedicated AI platform analyst powered by **Gemini 3.8 Flash** with live server-side telemetry.\n\n**Current Live Cohort Snapshot**:\n- **Registered Learners**: **${analytics.kpis.totalRegisteredUsers}**\n- **Active Learners**: **${analytics.kpis.dau} DAU** • **${analytics.kpis.wau} WAU** • **${analytics.kpis.mau} MAU**\n- **Curriculum Health**: **${analytics.kpis.avgCompletionRate}%** avg completion across all 10 stages\n- **Paper Trading**: **${analytics.paperTradingStats.totalTradesExecuted} simulated trades** executed\n- **Retention**: **${analytics.engagement.retention7Day}% 7-day retention**\n\nAsk any question below about student bottlenecks, drop-off rates, quiz scores, or retention trends!`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
  };

  // Load conversations on mount or admin change
  useEffect(() => {
    const adminId = getAdminIdentifier();
    fetchAdminMentorConversations(adminId).then((convs) => {
      setConversations(convs);
      if (convs.length > 0) {
        setActiveConvId(convs[0].id);
        fetchAdminMentorMessages(adminId, convs[0].id).then((msgs) => {
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
    setLastError(null);
    try {
      const adminId = getAdminIdentifier();
      const msgs = await fetchAdminMentorMessages(adminId, convId);
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
    setLastError(null);
    setLastFailedPrompt(null);
  };

  const handleDeleteSingleConversation = async (convId: string) => {
    if (!window.confirm('Delete this Admin Intelligence session?')) return;
    triggerTactileHaptic(8);
    const adminId = getAdminIdentifier();
    await deleteAdminMentorConversation(adminId, convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([defaultWelcome]);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all Admin Intelligence conversation history?')) return;
    triggerTactileHaptic(10);
    const adminId = getAdminIdentifier();
    await clearAllAdminMentorConversations(adminId);
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
    setLastError(null);
    setLastFailedPrompt(null);

    const adminId = getAdminIdentifier();
    let convId = activeConvId;
    if (!convId) {
      const newConv = await createAdminMentorConversation(adminId, textToSend);
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
      await saveAdminMentorMessage(adminId, convId, userMsg);
    }

    try {
      const recentHistory = messages
        .filter((m) => m.id !== 'admin_welcome')
        .slice(-6)
        .map((m) => ({ sender: m.sender, text: m.text }));

      const result = await askAdminIntelligence(
        adminEmail,
        textToSend,
        [...recentHistory, { sender: 'user', text: textToSend }],
        analytics.timeRange
      );

      setCurrentModel(result.modelUsed);

      const aiMsg: MentorMessage = {
        id: 'admin_ai_' + Date.now(),
        sender: 'mentor',
        text: result.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (convId) {
        await saveAdminMentorMessage(adminId, convId, aiMsg);
      }
    } catch (err: any) {
      console.error('Admin AI consultation error:', err);
      setLastError(err.message || 'Consultation failed');
      setLastFailedPrompt(textToSend);

      const errorMsg: MentorMessage = {
        id: 'admin_ai_err_' + Date.now(),
        sender: 'mentor',
        text: `**Intelligence Notice**: High-signal analysis could not be retrieved from the server (${err.message}).\n\nPlease verify network availability and try again using the button below.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'How many users are registered & active?',
    'Which learning stage has the highest drop-off?',
    'Which feature is used most frequently?',
    'How many users completed Stage 1?',
    'What is the 7-day retention rate?',
    'Which quizzes have the lowest average scores?',
    'What should I improve based on current learning analytics?',
    'Explain the current user engagement trend',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[740px]">
      {/* Sidebar: Admin Intelligence Sessions */}
      <div className="lg:col-span-1 theme-card border theme-border rounded-xl p-4 flex flex-col justify-between overflow-hidden shadow-xs">
        <div className="space-y-3 overflow-hidden flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-xs theme-main-text uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-emerald-500" />
              Admin Sessions
            </h4>
            <button
              type="button"
              onClick={handleNewChat}
              className="py-1 px-2 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>

          <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 text-xs">
            {conversations.length === 0 ? (
              <div className="text-center py-8 px-2 space-y-2">
                <p className="text-[11px] theme-muted-text italic">
                  No saved admin sessions yet.
                </p>
                <p className="text-[10px] theme-muted-text">
                  Ask an intelligence question to begin a new analytical thread.
                </p>
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group relative flex items-center justify-between p-2.5 rounded-lg text-left transition-colors cursor-pointer border ${
                    activeConvId === c.id
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
                      : 'hover:bg-slate-800/40 border-transparent theme-muted-text hover:theme-main-text'
                  }`}
                  onClick={() => handleSelectConversation(c.id)}
                >
                  <div className="truncate pr-5 flex-1">
                    <div className="truncate text-xs">{c.title}</div>
                    <div className="text-[10px] opacity-70 font-mono mt-0.5">
                      {new Date(c.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSingleConversation(c.id);
                    }}
                    title="Delete session"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-400 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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
            Clear All Sessions
          </button>
        )}
      </div>

      {/* Main Chat Interface */}
      <div className="lg:col-span-3 theme-card border theme-border rounded-xl flex flex-col justify-between overflow-hidden shadow-xs">
        {/* Header */}
        <div className="p-3.5 border-b theme-border flex items-center justify-between theme-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-xs theme-main-text">
                  ShareMarket Admin Intelligence
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-500 font-mono font-semibold">
                  {currentModel === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : currentModel}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/15 text-blue-400 font-mono">
                  Grounded Telemetry
                </span>
              </div>
              <p className="text-[10px] theme-muted-text">
                Evidence-based pedagogical recommendations & learner retention analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="text-xs theme-muted-text hover:theme-main-text flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-md theme-surface-elevated border theme-border"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Thread
            </button>
          </div>
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
                  className={`max-w-[85%] rounded-xl p-3.5 space-y-2 relative group shadow-2xs ${
                    isUser
                      ? 'theme-primary-bg text-white'
                      : 'theme-surface-subtle border theme-border theme-main-text'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs space-y-2 leading-relaxed">
                    {m.text}
                  </div>
                  <div className="flex items-center justify-between text-[10px] opacity-70 border-t theme-border pt-1 mt-2">
                    <span>{m.time}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(m.id, m.text)}
                      className="hover:opacity-100 flex items-center gap-1 cursor-pointer transition-opacity"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 text-xs items-center theme-muted-text py-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="animate-pulse font-medium">
                Synthesizing platform intelligence with Gemini 3.8 Flash...
              </span>
            </div>
          )}

          {lastError && lastFailedPrompt && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs flex items-center justify-between gap-3 text-red-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{lastError}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSend(lastFailedPrompt)}
                className="py-1 px-2.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sample Prompts & Input Box */}
        <div className="p-3.5 border-t theme-border theme-surface-subtle space-y-3">
          {messages.length <= 1 && (
            <div className="space-y-1.5">
              <div className="text-[10px] theme-muted-text font-semibold uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Suggested Platform Questions
              </div>
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
              placeholder="Ask Admin Intelligence about drop-off rates, 7-day retention, or quiz bottlenecks..."
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
