import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Maximize2,
  MessageSquare,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { MentorMessage } from './MarketMentor';
import { triggerTactileHaptic } from '../../services/mentorHistory';

interface FloatingAIMentorProps {
  messages: MentorMessage[];
  loading: boolean;
  hasUnreadResponse: boolean;
  explanationMode: 'eli15' | 'deep_dive';
  onChangeExplanationMode: (mode: 'eli15' | 'deep_dive') => void;
  onSendMessage: (question: string, attachments?: any) => Promise<void> | void;
  onRetryMessage?: (messageId?: string) => Promise<void> | void;
  onDeleteMessage?: (messageId: string) => Promise<void> | void;
  onDeleteConversation?: () => Promise<void> | void;
  onClearUnread: () => void;
  onOpenFullMentor: () => void;
  currentModuleTitle: string;
  activeConversationTitle?: string;
  onNewChat?: () => void;
  isHidden?: boolean;
}

const PREMIUM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const FloatingAIMentor: React.FC<FloatingAIMentorProps> = ({
  messages,
  loading,
  hasUnreadResponse,
  explanationMode,
  onChangeExplanationMode,
  onSendMessage,
  onRetryMessage,
  onDeleteMessage,
  onDeleteConversation,
  onClearUnread,
  onOpenFullMentor,
  currentModuleTitle,
  activeConversationTitle,
  onNewChat,
  isHidden = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Scroll to latest message when panel opens or messages update
  useEffect(() => {
    if (isOpen) {
      onClearUnread();
      chatEndRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  }, [isOpen, messages.length, loading, onClearUnread, shouldReduceMotion]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => window.clearTimeout(id);
    }
  }, [isOpen]);

  // Close drawer on Escape
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

  if (isHidden) return null;

  const quickPrompts = [
    "Explain P/E ratio like I'm 15",
    'What is a stop-loss order?',
    'Market vs Limit order?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || loading) return;
    setInputText('');
    onSendMessage(trimmed);
  };

  return (
    <div
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex flex-col items-end pointer-events-none"
      aria-live="polite"
    >
      {/* Compact Floating Mentor Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.24, ease: PREMIUM_EASE }}
            role="dialog"
            aria-label="Ask Market Mentor Assistant"
            className="pointer-events-auto mb-3 w-[calc(100vw-2rem)] sm:w-96 max-h-[72vh] sm:max-h-[520px] flex flex-col theme-card border theme-border rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 theme-surface-subtle border-b theme-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl theme-soft-accent-bg border theme-border flex items-center justify-center theme-primary-text shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold font-heading theme-main-text truncate">
                      Market Mentor
                    </h4>
                    <span className="text-[9px] font-mono theme-positive-text bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">
                      AI Tutor
                    </span>
                  </div>
                  <p className="text-[10px] theme-secondary-text truncate">
                    {activeConversationTitle || currentModuleTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {onNewChat && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerTactileHaptic(8);
                      onNewChat();
                    }}
                    title="Start New Chat"
                    aria-label="Start New Chat"
                    className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-card transition-colors cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDeleteConversation && messages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerTactileHaptic(8);
                      onDeleteConversation();
                    }}
                    title="Delete this unwanted conversation"
                    aria-label="Delete conversation"
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFullMentor();
                  }}
                  title="Open Full Market Mentor Workspace"
                  aria-label="Open Full Market Mentor Workspace"
                  className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-card transition-colors cursor-pointer active:scale-95"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Minimize Mentor (Esc)"
                  aria-label="Minimize Market Mentor"
                  className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-card transition-colors cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode Toggle Strip */}
            <div className="px-4 py-2 border-b theme-border flex items-center justify-between gap-2 text-[11px] theme-card">
              <span className="theme-muted-text font-mono text-[10px]">Explanation style:</span>
              <div className="flex theme-surface-subtle p-0.5 rounded-lg border theme-border">
                <button
                  type="button"
                  onClick={() => onChangeExplanationMode('eli15')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    explanationMode === 'eli15'
                      ? 'theme-primary-bg shadow-2xs'
                      : 'theme-secondary-text hover:theme-main-text'
                  }`}
                >
                  ELI15 Analogy
                </button>
                <button
                  type="button"
                  onClick={() => onChangeExplanationMode('deep_dive')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    explanationMode === 'deep_dive'
                      ? 'theme-primary-bg shadow-2xs'
                      : 'theme-secondary-text hover:theme-main-text'
                  }`}
                >
                  Deep Dive
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs max-h-72">
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
                          ? 'theme-primary-bg'
                          : 'theme-soft-accent-bg theme-primary-text border theme-border'
                      }`}
                    >
                      {isUser ? 'You' : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`max-w-[82%] rounded-2xl p-3 leading-relaxed ${
                        isUser
                          ? 'theme-primary-bg rounded-tr-none shadow-2xs'
                          : 'theme-surface-subtle border theme-border theme-main-text rounded-tl-none whitespace-pre-line shadow-2xs'
                      }`}
                    >
                      {msg.text}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span
                          className={`text-[9px] font-mono ${
                            isUser ? 'opacity-80' : 'theme-muted-text'
                          }`}
                        >
                          {msg.time}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {!isUser && msg.id !== 'welcome' && onRetryMessage && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerTactileHaptic(8);
                                onRetryMessage(msg.id);
                              }}
                              disabled={loading}
                              className="text-[9px] theme-secondary-text hover:text-emerald-400 flex items-center gap-0.5 cursor-pointer active:scale-95 disabled:opacity-40"
                              title="Retry and answer properly"
                              aria-label="Retry answer"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Retry</span>
                            </button>
                          )}
                          {!isUser && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerTactileHaptic(6);
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(msg.text);
                                  setCopiedMsgId(msg.id);
                                  setTimeout(() => setCopiedMsgId(null), 1800);
                                }
                              }}
                              className="text-[9px] theme-secondary-text hover:theme-main-text flex items-center gap-0.5 cursor-pointer active:scale-95"
                              title="Copy message"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          )}
                          {msg.id !== 'welcome' && onDeleteMessage && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerTactileHaptic(8);
                                onDeleteMessage(msg.id);
                              }}
                              disabled={loading}
                              className={`text-[9px] flex items-center gap-0.5 cursor-pointer active:scale-95 ${
                                isUser ? 'text-rose-200/80 hover:text-white' : 'text-rose-400/80 hover:text-rose-300'
                              }`}
                              title="Delete this unwanted message"
                              aria-label="Delete message"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg theme-soft-accent-bg theme-primary-text flex items-center justify-center border theme-border">
                    <Bot className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="p-2.5 theme-surface-subtle border theme-border rounded-2xl rounded-tl-none text-[11px] theme-secondary-text flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 theme-primary-text animate-pulse" />
                    <span>Crafting explanation...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Chips when conversation is fresh */}
            {messages.length <= 2 && (
              <div className="px-3.5 py-2 border-t theme-border theme-surface-subtle flex gap-1.5 overflow-x-auto">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={loading}
                    onClick={() => onSendMessage(prompt)}
                    className="text-[10px] theme-card hover:theme-surface-elevated theme-secondary-text hover:theme-main-text border theme-border px-2.5 py-1 rounded-full shrink-0 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="p-3 theme-card border-t theme-border flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask a market question..."
                className="flex-1 theme-surface-subtle border theme-border rounded-xl px-3 py-2 text-xs theme-main-text focus:outline-none focus:border-emerald-500 placeholder:theme-muted-text"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                aria-label="Send question to Market Mentor"
                className="p-2 theme-primary-bg disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-2xs transition-all cursor-pointer shrink-0 interactive-btn"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Floating Action Button + Hover Tooltip */}
      <div className="relative flex items-center gap-2.5 pointer-events-auto">
        {/* Small Hover/Focus Tooltip when drawer is closed */}
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 6, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 4, scale: 0.96 }}
              transition={{ duration: 0.16, ease: PREMIUM_EASE }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl theme-card border theme-border shadow-lg text-xs font-semibold theme-main-text whitespace-nowrap pointer-events-none"
            >
              <span>
                {loading
                  ? 'Market Mentor is thinking...'
                  : hasUnreadResponse
                  ? 'New Mentor response ready'
                  : 'Your Learning Companion · Ask Mentor'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Button */}
        <motion.button
          type="button"
          id="btn-floating-ai-mentor"
          data-tour="floating-ai-mentor"
          aria-label={
            loading
              ? 'Market Mentor is generating a response'
              : hasUnreadResponse
              ? 'Market Mentor response ready — click to view'
              : 'Ask Market Mentor'
          }
          aria-expanded={isOpen}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (hasUnreadResponse) {
              onClearUnread();
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
          className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full theme-btn-primary shadow-xl flex items-center justify-center cursor-pointer border border-emerald-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          {/* 1. Thinking State: Subtle rotating/pulsing ring when AI is actively generating */}
          {loading && (
            <span
              aria-hidden="true"
              className="absolute -inset-1 rounded-full border-2 border-emerald-400/80 border-t-transparent animate-spin pointer-events-none"
            />
          )}

          {/* 2. Response Ready State: Subtle one-time ring + indicator dot when minimized */}
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
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black shadow-xs"
              />
            </>
          )}

          {/* Icon */}
          {isOpen ? (
            <MessageSquare className="w-5 h-5" />
          ) : (
            <Bot className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${loading ? 'animate-pulse' : ''}`} />
          )}
        </motion.button>
      </div>
    </div>
  );
};
