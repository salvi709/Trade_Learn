import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Check as CheckIcon,
  Search,
  Paperclip,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { MarketMascot } from '../mascot/MarketMascot';
import { APP_NAME } from '../../config/branding';
import {
  MentorMessage,
  MentorConversation,
  MentorAttachment,
  triggerTactileHaptic,
  updateMentorMessageAndTruncate,
} from '../../services/mentorHistory';
import { MentorFeedbackInline } from '../feedback/MentorFeedbackInline';

export type { MentorMessage, MentorConversation, MentorAttachment };

interface MentorProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  currentModuleTitle?: string;
  currentLessonTitle?: string;
  userId?: string;
  conversations?: MentorConversation[];
  activeConversationId?: string | null;
  onSelectConversation?: (convId: string) => void;
  onNewChat?: () => void;
  onRenameConversation?: (convId: string, newTitle: string) => Promise<void>;
  onDeleteConversation?: (convId: string) => Promise<void>;
  onClearAllConversations?: () => Promise<void>;
  messages?: MentorMessage[];
  loading?: boolean;
  isSwitchingConversation?: boolean;
  explanationMode?: 'eli15' | 'deep_dive';
  onChangeExplanationMode?: (mode: 'eli15' | 'deep_dive') => void;
  onSendMessage?: (question: string, attachments?: MentorAttachment[]) => Promise<void> | void;
  onEditMessage?: (messageId: string, newText: string) => Promise<void> | void;
  onDeleteMessage?: (messageId: string) => Promise<void> | void;
  onRetryMessage?: (messageId?: string) => Promise<void> | void;
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const MarketMentor: React.FC<MentorProps> = ({
  initialPrompt,
  onClearInitialPrompt,
  currentModuleTitle = 'Start Here: Financial Foundations',
  currentLessonTitle = 'What is Money & Inflation',
  userId = 'guest',
  conversations = [],
  activeConversationId = null,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onClearAllConversations,
  messages: externalMessages,
  loading: externalLoading,
  isSwitchingConversation = false,
  explanationMode: externalMode,
  onChangeExplanationMode,
  onSendMessage: externalSendMessage,
  onEditMessage: externalEditMessage,
  onDeleteMessage,
  onRetryMessage,
}) => {
  // Local state fallbacks if standalone
  const defaultWelcomeMessage: MentorMessage = {
    id: 'welcome',
    sender: 'mentor',
    text: `Hey there! 👋 I'm your Market Mentor & personal learning companion in ${APP_NAME}.\n\nThink of me as your financial study buddy: whether you're wondering how P/E ratios work, how stop-loss orders protect your hard-earned savings, or how to spot traps in the market, we're in this together. I break everything down using clean, everyday analogies with zero jargon!\n\nWhat's on your mind today? Ask me any question below!`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
  };

  const [localMessages, setLocalMessages] = useState<MentorMessage[]>([defaultWelcomeMessage]);
  const [inputText, setInputText] = useState<string>(initialPrompt || '');
  const [localMode, setLocalMode] = useState<'eli15' | 'deep_dive'>('eli15');
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing state for user messages
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState<string>('');

  // Attachment state (PNG, JPG, WEBP, PDF, TXT)
  const [attachment, setAttachment] = useState<MentorAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);

  // Rename state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  // Modal confirmations
  const [convToDelete, setConvToDelete] = useState<MentorConversation | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const messages = externalMessages ?? localMessages;
  const loading = externalLoading ?? localLoading;
  const explanationMode = externalMode ?? localMode;

  useEffect(() => {
    if (initialPrompt !== undefined) {
      setInputText(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  useEffect(() => {
    if (editingConvId) {
      editInputRef.current?.focus();
    }
  }, [editingConvId]);

  const setExplanationMode = (mode: 'eli15' | 'deep_dive') => {
    triggerTactileHaptic(6);
    if (onChangeExplanationMode) {
      onChangeExplanationMode(mode);
    } else {
      setLocalMode(mode);
    }
  };

  const samplePrompts = [
    'Why did a stock drop even though profits were good?',
    'Explain what a P/E ratio is using an everyday analogy',
    'What is the difference between a Limit order and a Market order?',
    'Explain the 1% risk rule and why position sizing matters',
  ];

  const handleCopyMessage = async (msgId: string, text: string) => {
    triggerTactileHaptic(6);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    triggerTactileHaptic(8);
    if (onDeleteMessage) {
      await onDeleteMessage(msgId);
    } else {
      setLocalMessages((prev) => {
        const remaining = prev.filter((m) => m.id !== msgId);
        return remaining.length > 0 ? remaining : [defaultWelcomeMessage];
      });
    }
  };

  const handleRetryMessage = async (msgId?: string) => {
    triggerTactileHaptic(8);
    if (onRetryMessage) {
      await onRetryMessage(msgId);
    } else if (lastFailedQuestion) {
      handleSendMessage(lastFailedQuestion);
    }
  };

  const handleStartRename = (conv: MentorConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerTactileHaptic(6);
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = async () => {
    if (!editingConvId) return;
    const trimmed = editingTitle.trim();
    if (trimmed && onRenameConversation) {
      triggerTactileHaptic(8);
      await onRenameConversation(editingConvId, trimmed);
    }
    setEditingConvId(null);
  };

  const handleCancelRename = () => {
    setEditingConvId(null);
    setEditingTitle('');
  };

  const handleStartEdit = (msg: MentorMessage) => {
    triggerTactileHaptic(6);
    setEditingMessageId(msg.id);
    setEditingMessageText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const handleSaveEdit = async (msgId: string) => {
    const trimmed = editingMessageText.trim();
    if (!trimmed || loading) return;
    triggerTactileHaptic(8);
    setEditingMessageId(null);

    if (externalEditMessage) {
      try {
        await externalEditMessage(msgId, trimmed);
      } catch (err) {
        console.warn('Edit error:', err);
      }
      return;
    }

    // Standalone fallback: truncate and regenerate
    if (activeConversationId) {
      const truncated = await updateMentorMessageAndTruncate(
        userId,
        activeConversationId,
        msgId,
        trimmed
      );
      setLocalMessages(truncated);
      await handleSendMessage(trimmed);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentError(null);

    // Max 5MB check
    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError('File size exceeds 5MB limit. Please upload an image or document smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result as string,
      });
      triggerTactileHaptic(6);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || loading) return;

    const currentAttachment = attachment;
    triggerTactileHaptic(8);
    setInputText('');
    setAttachment(null);
    setAttachmentError(null);
    setLastFailedQuestion(null);
    if (onClearInitialPrompt) onClearInitialPrompt();

    if (externalSendMessage) {
      try {
        await externalSendMessage(textToSend, currentAttachment ? [currentAttachment] : undefined);
      } catch {
        setLastFailedQuestion(textToSend);
      }
      return;
    }

    const nowIso = new Date().toISOString();
    const userMsg: MentorMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: nowIso,
      ...(currentAttachment ? { attachments: [currentAttachment] } : {}),
    };

    setLocalMessages((prev) => [...prev, userMsg]);
    setLocalLoading(true);

    try {
      const recentHistory = [...messages, userMsg].slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const payloadAttachments = currentAttachment
        ? [
            {
              name: currentAttachment.name,
              mimeType: currentAttachment.type,
              base64: currentAttachment.dataUrl || '',
            },
          ]
        : undefined;

      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          question: textToSend,
          history: recentHistory,
          mode: explanationMode,
          currentModule: currentModuleTitle,
          currentLesson: currentLessonTitle,
          attachments: payloadAttachments,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to receive response from Market Mentor.');
      }

      setLastFailedQuestion(null);
      setLocalMessages((prev) => [
        ...prev,
        {
          id: 'mentor_' + Date.now(),
          sender: 'mentor',
          text: data.answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      console.warn('Market Mentor inquiry failed:', err);
      setLastFailedQuestion(textToSend);
      const isQuotaExceeded =
        err?.message?.includes('DAILY_QUOTA_EXHAUSTED') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('429') ||
        err?.message?.includes('quota');
      const isUserLimit =
        err?.message?.includes('USER_LIMIT_REACHED') ||
        err?.message?.includes('Fair-use daily limit');

      let errorText = `⚠️ **Could not reach Market Mentor**: ${err?.message || 'The AI service is experiencing high demand.'}\n\nPlease click **Retry** below or re-submit your question.`;
      if (isQuotaExceeded) {
        errorText = `⚠️ **Daily Free Quota Exhausted (Strict ₹0 Budget)**\n\nShareMarket operates with an absolute zero-cost policy using Google AI Studio's officially provided free tier (20 requests/day). The shared project quota has been reached for today and will automatically reset within 24 hours.\n\n🔒 **Your chat history is saved.** No payment or paid model is ever enabled. Please check back after quota refresh!`;
      } else if (isUserLimit) {
        errorText = `⚠️ **Fair-Use Limit Reached (Strict ₹0 Budget)**\n\nTo ensure all learners have free access under our ₹0 spending policy, each account has a fair-use limit of 5 AI inquiries per day. Your quota will renew tomorrow!`;
      }

      setLocalMessages((prev) => [
        ...prev,
        {
          id: 'mentor_error_' + Date.now(),
          sender: 'mentor',
          text: errorText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLocalLoading(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      data-tour="ai-mentor-workspace"
      className="max-w-6xl mx-auto h-[calc(100vh-8.5rem)] min-h-[580px] flex flex-col md:flex-row theme-card border theme-border rounded-3xl overflow-hidden shadow-xs relative"
    >
      {/* ------------------------------------------------------------- */}
      {/* Desktop & Mobile History Sidebar/Drawer                      */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`
          transition-all duration-300 ease-in-out border-r theme-border theme-surface-subtle flex flex-col shrink-0 z-30
          ${
            isSidebarOpen
              ? 'hidden md:flex md:w-72 lg:w-80'
              : 'hidden md:flex md:w-0 md:opacity-0 md:pointer-events-none'
          }
          ${
            isMobileDrawerOpen
              ? 'fixed inset-y-0 left-0 w-80 max-w-[85vw] !flex shadow-2xl z-50'
              : ''
          }
        `}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b theme-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 theme-primary-text" />
            <h4 className="font-bold text-xs theme-main-text font-heading uppercase tracking-wider">
              Chat History
            </h4>
          </div>

          <div className="flex items-center gap-1">
            {/* Mobile close drawer button */}
            {isMobileDrawerOpen && (
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-card transition-colors md:hidden"
                aria-label="Close History"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Desktop collapse sidebar button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-card transition-colors hidden md:block cursor-pointer active:scale-95"
              title="Collapse history sidebar"
              aria-label="Collapse history sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Chat Action Button */}
        <div className="p-3">
          <button
            type="button"
            id="btn-mentor-new-chat"
            onClick={() => {
              triggerTactileHaptic(8);
              if (onNewChat) onNewChat();
              setIsMobileDrawerOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs theme-btn-primary shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Conversations Input */}
        {conversations.length > 4 && (
          <div className="px-3 pb-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 theme-muted-text absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg theme-card border theme-border theme-main-text placeholder:theme-muted-text focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs theme-muted-text space-y-2">
              <div className="w-9 h-9 rounded-full theme-soft-accent-bg border theme-border flex items-center justify-center mx-auto theme-primary-text">
                <Bot className="w-4 h-4" />
              </div>
              <p className="font-medium text-xs theme-secondary-text">No conversations yet</p>
              <p className="text-[11px] leading-relaxed">
                Ask a question to start your first interactive learning session!
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditing = editingConvId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (isEditing) return;
                    triggerTactileHaptic(6);
                    if (onSelectConversation) onSelectConversation(conv.id);
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`
                    group relative rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-[0.99]
                    ${
                      isActive
                        ? 'theme-soft-accent-bg theme-main-text font-bold border theme-border shadow-2xs'
                        : 'theme-secondary-text hover:theme-main-text hover:theme-card border border-transparent'
                    }
                  `}
                >
                  {/* Left accent bar for active chat */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-500" />
                  )}

                  <div className="flex-1 min-w-0 pr-1 pl-1">
                    {isEditing ? (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename();
                            if (e.key === 'Escape') handleCancelRename();
                          }}
                          className="w-full text-xs px-1.5 py-0.5 rounded border border-emerald-500 theme-card theme-main-text focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSaveRename}
                          className="p-1 text-emerald-500 hover:text-emerald-400"
                          title="Save title"
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelRename}
                          className="p-1 theme-secondary-text hover:theme-main-text"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="truncate text-xs font-medium leading-snug">{conv.title}</p>
                        <span className="text-[10px] theme-muted-text font-mono block mt-0.5">
                          {formatRelativeTime(conv.updatedAt)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Action buttons on hover / touch / focus */}
                  {/* Action buttons (always visible and easily accessible) */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(conv, e)}
                        className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-surface-subtle transition-colors cursor-pointer"
                        title="Rename conversation"
                        aria-label="Rename conversation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerTactileHaptic(8);
                          setConvToDelete(conv);
                        }}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer with Clear All */}
        {conversations.length > 0 && (
          <div className="p-3 border-t theme-border">
            <button
              type="button"
              id="btn-mentor-clear-all"
              onClick={() => {
                triggerTactileHaptic(8);
                setShowClearAllModal(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* Main Chat Area                                                */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mentor Top Header */}
        <div className="p-3.5 md:p-4 theme-surface-subtle border-b theme-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Toggle History Sidebar button (Desktop) */}
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl theme-card border theme-border theme-secondary-text hover:theme-main-text transition-colors hidden md:flex items-center gap-1 text-xs font-semibold cursor-pointer active:scale-95"
                title="Open chat history sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
                <span className="text-[11px]">History</span>
              </button>
            )}

            {/* Mobile open history button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 rounded-xl theme-card border theme-border theme-secondary-text hover:theme-main-text transition-colors md:hidden flex items-center gap-1 text-xs font-semibold cursor-pointer active:scale-95"
              title="Open chat history"
            >
              <MessageSquare className="w-4 h-4 theme-primary-text" />
              <span className="text-[11px]">Chats</span>
            </button>

            <div className="p-2 theme-soft-accent-bg border theme-border rounded-xl theme-primary-text shadow-2xs">
              <Bot className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold theme-main-text font-heading text-sm sm:text-base truncate">
                  Market Mentor
                </h3>
                <span className="text-[9px] font-mono theme-positive-text bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                  AI Tutor
                </span>
              </div>
              <p className="text-[11px] theme-secondary-text truncate max-w-[210px] sm:max-w-xs md:max-w-md">
                Context: <strong className="theme-main-text">{currentModuleTitle}</strong>
              </p>
            </div>
          </div>

          {/* Action buttons and Mode selector */}
          <div className="flex items-center gap-2">
            {/* Quick New Chat Button */}
            <button
              type="button"
              id="btn-mentor-header-new-chat"
              onClick={() => {
                triggerTactileHaptic(6);
                if (onNewChat) {
                  onNewChat();
                } else {
                  setLocalMessages([defaultWelcomeMessage]);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold theme-surface-subtle border theme-border hover:theme-card theme-secondary-text hover:theme-main-text transition-all cursor-pointer active:scale-95"
              title="Start a fresh conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            {/* Quick Delete Chat Button */}
            {(activeConversationId || messages.some((m) => m.id !== 'welcome')) && (
              <button
                type="button"
                id="btn-mentor-header-delete-chat"
                onClick={() => {
                  triggerTactileHaptic(8);
                  if (activeConversationId) {
                    const currentConv = conversations.find((c) => c.id === activeConversationId);
                    if (currentConv) {
                      setConvToDelete(currentConv);
                    } else if (onDeleteConversation) {
                      void onDeleteConversation(activeConversationId);
                    }
                  } else {
                    // Chat has not been saved into a named conversation yet, clear active messages
                    if (onNewChat) {
                      onNewChat();
                    } else {
                      setLocalMessages([defaultWelcomeMessage]);
                    }
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
                title="Delete this entire conversation"
                aria-label="Delete this conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Chat</span>
              </button>
            )}


            <div className="flex theme-card p-0.5 rounded-xl border theme-border shadow-2xs">
              <button
                type="button"
                id="btn-mentor-eli15"
                onClick={() => setExplanationMode('eli15')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer interactive-btn active:scale-95 ${
                  explanationMode === 'eli15'
                    ? 'theme-primary-bg shadow-2xs'
                    : 'theme-secondary-text hover:theme-main-text'
                }`}
              >
                ELI15 Analogy
              </button>
              <button
                type="button"
                id="btn-mentor-deepdive"
                onClick={() => setExplanationMode('deep_dive')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer interactive-btn active:scale-95 ${
                  explanationMode === 'deep_dive'
                    ? 'theme-primary-bg shadow-2xs'
                    : 'theme-secondary-text hover:theme-main-text'
                }`}
              >
                Deep Dive
              </button>
            </div>
          </div>
        </div>

        {/* Safety Notice Banner */}
        <div className="theme-soft-accent-bg border-b theme-border px-4 py-1.5 text-[11px] theme-primary-text flex items-center gap-2 font-medium">
          <AlertCircle className="w-3.5 h-3.5 theme-primary-text shrink-0" />
          <span className="truncate">
            Mentor explains financial mechanics for learning only. No real-world buy/sell tips or profit guarantees.
          </span>
        </div>

        {/* Message Chat Flow */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Skeleton state when switching conversations */}
          {isSwitchingConversation ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl theme-surface-subtle" />
                <div className="h-16 w-3/4 theme-surface-subtle rounded-2xl" />
              </div>
              <div className="flex items-start gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-xl theme-surface-subtle" />
                <div className="h-12 w-1/2 theme-surface-subtle rounded-2xl" />
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl theme-surface-subtle" />
                <div className="h-24 w-2/3 theme-surface-subtle rounded-2xl" />
              </div>
            </div>
          ) : (
            <>
              {messages.length <= 1 && (
                <div className="p-4 rounded-2xl theme-card border theme-border shadow-2xs flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <MarketMascot character="duo" pose="explaining" size="sm" interactive={false} />
                  <div className="space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-heading font-bold text-sm theme-main-text">Meet Bullish Bob & Bearish Ben</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">Learning Duo</span>
                    </div>
                    <p className="text-xs theme-secondary-text leading-relaxed">
                      Bob brings long-term compounding optimism (70%), and Ben ensures disciplined risk defense (30%). Together with your Market Mentor, they break down complex finance with clean analogies!
                    </p>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              const isCopied = copiedMessageId === msg.id;
              const isEditingThis = editingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      isUser
                        ? 'theme-primary-bg'
                        : 'theme-soft-accent-bg theme-primary-text border theme-border'
                    }`}
                  >
                    {isUser ? 'You' : <Bot className="w-4 h-4" />}
                  </div>

                  {isEditingThis ? (
                    <div className="space-y-2 w-full min-w-[260px] max-w-[85%] md:max-w-[80%] rounded-2xl p-3 theme-card border border-[#0D6847] dark:border-emerald-500 shadow-lg">
                      <div className="text-[11px] font-semibold text-[#0D6847] dark:text-emerald-400 flex items-center gap-1 mb-1">
                        <Edit2 className="w-3 h-3" />
                        Edit Question (Subsequent replies will be regenerated)
                      </div>
                      <textarea
                        value={editingMessageText}
                        onChange={(e) => setEditingMessageText(e.target.value)}
                        className="w-full p-2.5 rounded-xl theme-surface-subtle border theme-border text-xs theme-main-text focus:outline-none focus:border-[#0D6847] dark:focus:border-emerald-500 resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 rounded-lg theme-surface-subtle border theme-border hover:bg-slate-200/70 dark:hover:bg-slate-700 theme-secondary-text text-[11px] font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(msg.id)}
                          disabled={!editingMessageText.trim() || loading}
                          className="px-3 py-1 rounded-lg theme-primary-btn font-semibold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                        >
                          <Check className="w-3 h-3" />
                          Save & Regenerate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`group/msg relative max-w-[85%] md:max-w-[80%] rounded-2xl p-4 leading-relaxed ${
                        isUser
                          ? 'bg-[#0D6847] text-white rounded-tr-none shadow-[0_0_15px_rgba(13,104,71,0.4)] font-medium'
                          : 'theme-surface-subtle border theme-border theme-main-text rounded-tl-none whitespace-pre-line shadow-2xs'
                      }`}
                    >
                      {/* Attachments preview if present */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2 space-y-1.5">
                          {msg.attachments.map((att, attIdx) => (
                            <div
                              key={attIdx}
                              className="p-1.5 px-2 rounded-lg bg-black/20 border border-white/10 flex items-center gap-2 text-[11px]"
                            >
                              {att.type.startsWith('image/') && att.dataUrl ? (
                                <img
                                  src={att.dataUrl}
                                  alt="attachment"
                                  className="w-8 h-8 rounded object-cover border border-white/20"
                                />
                              ) : (
                                <FileText className="w-4 h-4 opacity-80" />
                              )}
                              <span className="truncate max-w-[160px] font-medium">{att.name}</span>
                              <span className="text-[10px] opacity-75 font-mono">
                                ({(att.size / 1024).toFixed(0)} KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.text}

                      <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono ${
                              isUser ? 'opacity-80' : 'theme-muted-text'
                            }`}
                          >
                            {msg.time}
                          </span>
                          {msg.isEdited && (
                            <span className="text-[9px] opacity-75 italic">(edited)</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* User Edit Button */}
                          {isUser && !loading && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(msg)}
                              className="flex items-center gap-1 text-[10px] opacity-80 hover:opacity-100 transition-opacity cursor-pointer active:scale-95 text-white"
                              title="Edit question and regenerate response"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                          )}

                          {/* Mentor Retry Response Button */}
                          {!isUser && msg.id !== 'welcome' && (
                            <button
                              type="button"
                              onClick={() => handleRetryMessage(msg.id)}
                              disabled={loading}
                              className="flex items-center gap-1 text-[10px] theme-secondary-text hover:text-emerald-400 transition-colors cursor-pointer active:scale-95 disabled:opacity-40"
                              title="Retry and answer properly"
                              aria-label="Retry this answer"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Retry</span>
                            </button>
                          )}

                          {/* Mentor Copy Response Button */}
                          {!isUser && (
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.id, msg.text)}
                              className="flex items-center gap-1 text-[10px] theme-secondary-text hover:theme-main-text transition-colors cursor-pointer active:scale-95"
                              title="Copy message to clipboard"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* AI Mentor Inline Evaluation (Thumbs Up / Down) */}
                          {!isUser && msg.id !== 'welcome' && !msg.id.startsWith('mentor_error_') && (
                            <MentorFeedbackInline
                              messageId={msg.id}
                              conversationId={activeConversationId}
                              questionExcerpt={idx > 0 ? messages[idx - 1]?.text : undefined}
                              userId={userId}
                            />
                          )}

                          {/* Delete unwanted individual message button */}
                          {msg.id !== 'welcome' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              disabled={loading}
                              className={`flex items-center gap-1 text-[10px] transition-colors cursor-pointer active:scale-95 ${
                                isUser
                                  ? 'text-rose-200/80 hover:text-white'
                                  : 'text-rose-400/80 hover:text-rose-300'
                              }`}
                              title="Delete this unwanted message"
                              aria-label="Delete this message"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

          {/* Thinking / Loading Animation */}
          {loading && (
            <div className="flex items-center gap-3 animate-in fade-in">
              <div className="w-8 h-8 rounded-xl theme-soft-accent-bg theme-primary-text flex items-center justify-center border theme-border">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 theme-surface-subtle border theme-border rounded-2xl rounded-tl-none text-xs theme-secondary-text flex items-center gap-2 shadow-2xs">
                <Sparkles className="w-4 h-4 theme-primary-text animate-pulse" />
                <span>Market Mentor is crafting an intuitive explanation...</span>
              </div>
            </div>
          )}

          {/* Retry notice if last request failed */}
          {(lastFailedQuestion || messages.some((m) => m.id.startsWith('mentor_error_'))) && !loading && (
            <div className="p-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 text-[#B82E3B] dark:text-rose-400 shrink-0" />
                <span>
                  {messages.some((m) => m.text?.includes('Zero-Cost') || m.text?.includes('₹0 Budget'))
                    ? 'Free daily quota limit reached. Cooldown active.'
                    : 'Could not reach Market Mentor. Click retry to answer.'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleRetryMessage()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer active:scale-95 shadow-sm transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts pills when conversation is fresh */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t theme-border theme-surface-subtle flex gap-2 overflow-x-auto">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="text-[11px] theme-card hover:theme-surface-subtle theme-secondary-text border theme-border px-3 py-1.5 rounded-full shrink-0 transition-all cursor-pointer shadow-2xs interactive-btn active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Box with Multimodal Attachment Support */}
        <div className="p-3 md:p-4 theme-card border-t theme-border">
          {/* File Attachment Preview */}
          {attachment && (
            <div className="mb-2 p-2 px-3 rounded-xl theme-surface-subtle border border-[#0D6847]/35 dark:border-emerald-500/40 flex items-center justify-between text-xs shadow-sm">
              <div className="flex items-center gap-2 truncate">
                {attachment.type.startsWith('image/') && attachment.dataUrl ? (
                  <img
                    src={attachment.dataUrl}
                    alt="Preview"
                    className="w-7 h-7 rounded object-cover border border-emerald-500/30 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded bg-emerald-500/15 flex items-center justify-center text-[#0D6847] dark:text-emerald-400 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="truncate">
                  <span className="font-medium theme-main-text truncate block">{attachment.name}</span>
                  <span className="text-[10px] theme-muted-text font-mono">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 theme-muted-text hover:theme-main-text cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* File size or validation error */}
          {attachmentError && (
            <div className="mb-2 p-2 px-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
              <span>{attachmentError}</span>
              <button type="button" onClick={() => setAttachmentError(null)} className="cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
              className="hidden"
            />

            {/* Paperclip Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image (PNG, JPG, WEBP) or document (PDF, TXT)"
              className="p-2.5 rounded-xl theme-surface-subtle border theme-border hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              id="input-mentor-question"
              placeholder="Ask anything or attach a chart / financial document..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 theme-surface-subtle border theme-border rounded-xl px-4 py-2.5 text-xs md:text-sm theme-main-text interactive-input focus:outline-none focus:border-emerald-500 placeholder:theme-muted-text"
            />
            <button
              type="submit"
              id="btn-send-mentor-question"
              disabled={(!inputText.trim() && !attachment) || loading}
              className="p-3 theme-primary-bg disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer shrink-0 interactive-btn active:scale-95"
              aria-label="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Delete Single Conversation Modal                              */}
      {/* ------------------------------------------------------------- */}
      {convToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="theme-card border theme-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h4 className="font-bold theme-main-text font-heading text-base">
                Delete Conversation?
              </h4>
              <p className="text-xs theme-secondary-text mt-1 leading-relaxed">
                Are you sure you want to delete &ldquo;
                <strong className="theme-main-text">{convToDelete.title}</strong>
                &rdquo;? All messages in this conversation will be permanently removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConvToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold theme-surface-subtle border theme-border theme-secondary-text hover:theme-main-text transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  triggerTactileHaptic(8);
                  const targetId = convToDelete.id;
                  setConvToDelete(null);
                  if (onDeleteConversation) {
                    await onDeleteConversation(targetId);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Clear All Conversations Modal                                 */}
      {/* ------------------------------------------------------------- */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="theme-card border theme-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h4 className="font-bold theme-main-text font-heading text-base">
                Clear All Conversations?
              </h4>
              <p className="text-xs theme-secondary-text mt-1 leading-relaxed">
                This will permanently delete all your saved AI Mentor conversation history and messages. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold theme-surface-subtle border theme-border theme-secondary-text hover:theme-main-text transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  triggerTactileHaptic(8);
                  setShowClearAllModal(false);
                  if (onClearAllConversations) {
                    await onClearAllConversations();
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
