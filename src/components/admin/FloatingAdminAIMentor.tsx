import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Send,
  X,
  Maximize2,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Bot,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { MentorMessage, MentorConversation } from '../../services/mentorHistory';
import {
  askAdminIntelligence,
  triggerTactileHaptic,
  AdminAnalyticsData,
} from '../../services/adminService';
import {
  fetchAdminMentorConversations,
  fetchAdminMentorMessages,
  createAdminMentorConversation,
  saveAdminMentorMessage,
} from '../../services/mentorHistory';
import { auth } from '../../services/firebase';

interface FloatingAdminAIMentorProps {
  adminEmail: string;
  analytics?: AdminAnalyticsData | null;
  onOpenFullIntelligenceTab?: () => void;
  activeAdminTab?: string;
}

const PREMIUM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const FloatingAdminAIMentor: React.FC<FloatingAdminAIMentorProps> = ({
  adminEmail,
  analytics,
  onOpenFullIntelligenceTab,
  activeAdminTab = 'overview',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [hasUnreadResponse, setHasUnreadResponse] = useState<boolean>(false);
  const [currentModel, setCurrentModel] = useState<string>('gemini-3.8-flash');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  const shouldReduceMotion = useReducedMotion();
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const getAdminIdentifier = () => auth.currentUser?.uid || adminEmail || 'admin_portal';

  const defaultWelcome: MentorMessage = {
    id: 'floating_admin_welcome',
    sender: 'mentor',
    text: `### ShareMarket Executive AI Copilot\n\nI am your live **Admin Intelligence Copilot** assisting you across the administrative portal.\n\nAsk me anytime about:\n- **Drop-off stages** (e.g. *Which stage has the highest drop-off?*)\n- **Active cohorts** (e.g. *What is our DAU, WAU & MAU?*)\n- **Quiz difficulty** (e.g. *Which quizzes have the lowest average scores?*)\n- **Platform retention** (e.g. *What is the 7-day retention rate?*)`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
  };

  // Load conversations on mount
  useEffect(() => {
    const adminId = getAdminIdentifier();
    fetchAdminMentorConversations(adminId).then((convs) => {
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

  // Scroll to latest message
  useEffect(() => {
    if (isOpen) {
      setHasUnreadResponse(false);
      chatEndRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  }, [isOpen, messages.length, loading, shouldReduceMotion]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => window.clearTimeout(id);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const quickAdminPrompts = [
    'Which learning stage has highest drop-off?',
    'How many users completed Stage 1?',
    'What is our 7-day retention rate?',
    'Which feature is used most frequently?',
  ];

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    triggerTactileHaptic(8);
    setInputText('');
    setLastError(null);
    setLastFailedPrompt(null);

    const adminId = getAdminIdentifier();
    let convId = activeConvId;

    if (!convId) {
      const newConv = await createAdminMentorConversation(adminId, trimmed);
      convId = newConv.id;
      setActiveConvId(convId);
    }

    const userMsg: MentorMessage = {
      id: 'admin_usr_' + Date.now(),
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev.filter((m) => m.id !== 'floating_admin_welcome'), userMsg]);
    setLoading(true);

    if (convId) {
      await saveAdminMentorMessage(adminId, convId, userMsg);
    }

    try {
      const recentHistory = messages
        .filter((m) => m.id !== 'floating_admin_welcome')
        .slice(-6)
        .map((m) => ({ sender: m.sender, text: m.text }));

      const result = await askAdminIntelligence(
        adminEmail,
        trimmed,
        [...recentHistory, { sender: 'user', text: trimmed }],
        analytics?.timeRange || '30d'
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
      if (!isOpen) {
        setHasUnreadResponse(true);
      }

      if (convId) {
        await saveAdminMentorMessage(adminId, convId, aiMsg);
      }
    } catch (err: any) {
      console.error('Floating Admin AI error:', err);
      setLastError(err.message || 'Consultation failed');
      setLastFailedPrompt(trimmed);

      const errorMsg: MentorMessage = {
        id: 'admin_ai_err_' + Date.now(),
        sender: 'mentor',
        text: `**Analysis Notice**: Could not synthesize response (${err.message}).\n\nPlease check network connectivity or click retry.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    triggerTactileHaptic(8);
    setActiveConvId(null);
    setMessages([defaultWelcome]);
    setInputText('');
    setLastError(null);
    setLastFailedPrompt(null);
  };

  const handleCopyMessage = async (msgId: string, text: string) => {
    triggerTactileHaptic(6);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 1800);
    } catch {}
  };

  return (
    <div
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end pointer-events-none"
      aria-live="polite"
    >
      {/* Floating Admin Assistant Modal Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.24, ease: PREMIUM_EASE }}
            role="dialog"
            aria-label="Admin Intelligence AI Assistant"
            className="pointer-events-auto mb-3 w-[calc(100vw-2rem)] sm:w-[440px] max-h-[75vh] sm:max-h-[580px] flex flex-col theme-card border theme-border rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md"
          >
            {/* Header */}
            <div className="px-4 py-3 theme-surface-subtle border-b theme-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold font-heading theme-main-text truncate">
                      Admin Intelligence Copilot
                    </h4>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded-full font-bold">
                      {currentModel === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Grounded AI'}
                    </span>
                  </div>
                  <p className="text-[10px] theme-secondary-text truncate">
                    Live Platform Analytics • 10 Curriculum Stages
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  title="Start New Analytical Query"
                  aria-label="Start New Query"
                  className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-card transition-colors cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                {onOpenFullIntelligenceTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenFullIntelligenceTab();
                    }}
                    title="Open Full Admin Intelligence Tab"
                    aria-label="Open Full Admin Intelligence Tab"
                    className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-card transition-colors cursor-pointer active:scale-95"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Minimize (Esc)"
                  aria-label="Minimize Admin Copilot"
                  className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-card transition-colors cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Portal Context Bar */}
            <div className="px-4 py-1.5 border-b theme-border flex items-center justify-between gap-2 text-[10px] theme-card font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>Viewing: <strong className="text-emerald-400 uppercase">{activeAdminTab}</strong></span>
              </span>
              <span>Telemetry: 100% Grounded</span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs max-h-80">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isUser
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isUser ? 'You' : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm'
                          : 'theme-surface-subtle border theme-border theme-main-text rounded-tl-none whitespace-pre-line shadow-xs'
                      }`}
                    >
                      <div className="space-y-1 text-xs">
                        {msg.text.split('\n\n').map((para, pIdx) => {
                          if (para.startsWith('### ')) {
                            return (
                              <h5 key={pIdx} className="font-heading font-bold text-xs text-emerald-400 mt-1 mb-1">
                                {para.replace('### ', '')}
                              </h5>
                            );
                          }
                          if (para.startsWith('- **') || para.startsWith('1. **')) {
                            return (
                              <div key={pIdx} className="pl-1 text-[11px] leading-relaxed opacity-95">
                                {para}
                              </div>
                            );
                          }
                          return <p key={pIdx} className="text-[11px] leading-relaxed">{para}</p>;
                        })}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-700/30">
                        <span
                          className={`text-[9px] font-mono ${
                            isUser ? 'opacity-80' : 'theme-muted-text'
                          }`}
                        >
                          {msg.time}
                        </span>
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="text-[9px] theme-secondary-text hover:theme-main-text flex items-center gap-0.5 cursor-pointer active:scale-95"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Bot className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="p-2.5 theme-surface-subtle border theme-border rounded-2xl rounded-tl-none text-[11px] theme-secondary-text flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Analyzing platform telemetry & curriculum data...</span>
                  </div>
                </div>
              )}

              {lastError && lastFailedPrompt && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs flex items-center justify-between gap-2 text-red-300">
                  <span className="truncate text-[11px]">{lastError}</span>
                  <button
                    type="button"
                    onClick={() => handleSendMessage(lastFailedPrompt)}
                    className="px-2 py-0.5 rounded-md bg-red-500/25 hover:bg-red-500/40 text-red-100 font-semibold text-[10px] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry
                  </button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggested Queries */}
            {messages.length <= 2 && (
              <div className="px-3.5 py-2 border-t theme-border theme-surface-subtle flex gap-1.5 overflow-x-auto">
                {quickAdminPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={loading}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[10px] theme-card hover:theme-surface-elevated theme-secondary-text hover:theme-main-text border theme-border px-2.5 py-1 rounded-full shrink-0 transition-colors cursor-pointer text-left whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="p-3 theme-card border-t theme-border flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about drop-off rates, quizzes, retention..."
                className="flex-1 theme-surface-subtle border theme-border rounded-xl px-3 py-2 text-xs theme-main-text focus:outline-none focus:border-emerald-500 placeholder:theme-muted-text"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                aria-label="Send analytical question"
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Floating Admin Bot Action Button */}
      <div className="relative flex items-center gap-2.5 pointer-events-auto">
        {/* Tooltip on hover */}
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 6, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 4, scale: 0.96 }}
              transition={{ duration: 0.16, ease: PREMIUM_EASE }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl theme-card border border-emerald-500/30 shadow-xl text-xs font-semibold theme-main-text whitespace-nowrap pointer-events-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {loading
                  ? 'Analyzing platform telemetry...'
                  : hasUnreadResponse
                  ? 'Admin Intelligence response ready'
                  : 'Ask Admin Intelligence Copilot'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Circle Button */}
        <motion.button
          type="button"
          id="btn-floating-admin-ai-mentor"
          aria-label={
            loading
              ? 'Admin AI is processing telemetry'
              : hasUnreadResponse
              ? 'Admin AI response ready'
              : 'Ask Admin Intelligence Copilot'
          }
          aria-expanded={isOpen}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (hasUnreadResponse) {
              setHasUnreadResponse(false);
            }
          }}
          animate={
            shouldReduceMotion
              ? { scale: 1 }
              : hasUnreadResponse && !isOpen
              ? { scale: [1, 1.09, 1] }
              : !isOpen && !loading
              ? { scale: [1, 1.025, 1] }
              : { scale: 1 }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : hasUnreadResponse && !isOpen
              ? { duration: 0.65, ease: PREMIUM_EASE, repeat: 0 }
              : !isOpen && !loading
              ? { duration: 4.2, ease: 'easeInOut', repeat: Infinity }
              : { duration: 0.2 }
          }
          whileHover={shouldReduceMotion ? undefined : { scale: 1.05, y: -2 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
          className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-xl flex items-center justify-center cursor-pointer border-2 border-emerald-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          {/* Active generation ring */}
          {loading && (
            <span
              aria-hidden="true"
              className="absolute -inset-1 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin pointer-events-none"
            />
          )}

          {/* Unread Response indicator */}
          {hasUnreadResponse && !isOpen && !loading && (
            <>
              <motion.span
                initial={{ scale: 0.9, opacity: 0.85 }}
                animate={{ scale: 1.45, opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut', repeat: 0 }}
                aria-hidden="true"
                className="absolute inset-0 rounded-full border-2 border-emerald-400 pointer-events-none"
              />
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-300 border-2 border-black shadow-xs"
              />
            </>
          )}

          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Bot className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${loading ? 'animate-pulse' : ''}`} />
          )}
        </motion.button>
      </div>
    </div>
  );
};
