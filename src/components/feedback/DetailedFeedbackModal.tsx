import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Paperclip, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Sparkles,
  Lightbulb,
  Bug,
  Rocket,
  MessageSquare,
  Heart
} from 'lucide-react';
import { submitFeedback } from '../../services/feedbackService';
import { FeedbackCategory } from '../../types/feedback';

interface DetailedFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

const CATEGORIES: { id: FeedbackCategory; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'bug_report', label: 'Bug report', icon: Bug, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { id: 'feature_request', label: 'Feature request', icon: Rocket, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { id: 'general', label: 'General feedback', icon: MessageSquare, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'compliment', label: 'Something I liked', icon: Heart, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
];

export const DetailedFeedbackModal: React.FC<DetailedFeedbackModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
}) => {
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [comment, setComment] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentError(null);

    // Validate type (PNG, JPG, WEBP)
    if (!file.type.startsWith('image/')) {
      setAttachmentError('Only image attachments (PNG, JPG, WEBP) are supported.');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAttachmentError('Image exceeds 2MB limit. Please attach a smaller screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Client-side downscale if needed to keep under 150KB
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setScreenshotDataUrl(compressedDataUrl);
          setScreenshotName(file.name);
        } else {
          setScreenshotDataUrl(dataUrl);
          setScreenshotName(file.name);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setScreenshotDataUrl(null);
    setScreenshotName(null);
    setAttachmentError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) {
      setErrorMsg('Please describe your feedback or observation.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      await submitFeedback({
        type: 'product',
        category,
        comment: trimmed,
        attachmentUrl: screenshotDataUrl || null,
        isAnonymous,
        userId: isAnonymous ? null : userId,
        userName: isAnonymous ? null : userName,
        userEmail: isAnonymous ? null : userEmail,
      });

      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          setSubmitted(false);
          setComment('');
          setCategory('suggestion');
          setScreenshotDataUrl(null);
          setScreenshotName(null);
          setIsAnonymous(false);
        }, 300);
      }, 2000);
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err?.message || 'Failed to submit feedback. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg theme-card border theme-border rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b theme-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold theme-main-text font-heading">
                  Send Feedback to ShareMarket Team
                </h3>
                <p className="text-xs theme-secondary-text">
                  Suggestions, bug reports, and ideas directly help us improve
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-surface-subtle transition-colors cursor-pointer"
              aria-label="Close feedback modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center flex flex-col items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3 animate-bounce" />
              <h4 className="text-base font-bold theme-main-text">Feedback Received!</h4>
              <p className="text-xs theme-secondary-text mt-1.5 max-w-xs">
                Thank you for contributing to ShareMarket. Our engineering and curriculum teams review every note.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto pr-1">
              {/* Category Selection */}
              <div>
                <label className="block text-xs font-semibold theme-main-text mb-2">
                  Feedback Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 theme-main-text shadow-xs ring-1 ring-emerald-500'
                            : 'theme-surface-subtle theme-border hover:border-emerald-500/40 theme-secondary-text'
                        }`}
                      >
                        <div className={`p-1 rounded-lg border ${cat.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold theme-main-text">
                    Your Feedback <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] theme-muted-text font-mono">
                    {comment.length} / 1500
                  </span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  maxLength={1500}
                  rows={4}
                  required
                  placeholder={
                    category === 'bug_report'
                      ? 'Describe what happened, what you expected, and steps to reproduce...'
                      : category === 'feature_request'
                      ? 'What tool or feature would help you trade or learn better?'
                      : 'Tell us how we can make ShareMarket more enjoyable...'
                  }
                  className="w-full text-xs p-3 rounded-xl border theme-border theme-card theme-main-text focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none shadow-2xs leading-relaxed"
                />
              </div>

              {/* Optional Screenshot Attachment */}
              <div>
                <label className="block text-xs font-semibold theme-main-text mb-1.5">
                  Optional Screenshot
                </label>

                {screenshotDataUrl ? (
                  <div className="p-2.5 rounded-xl theme-surface-subtle border theme-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={screenshotDataUrl}
                        alt="Screenshot preview"
                        className="w-12 h-10 object-cover rounded-lg border theme-border shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium theme-main-text truncate">
                          {screenshotName || 'screenshot.jpg'}
                        </p>
                        <span className="text-[10px] text-emerald-500 font-mono">Ready to upload</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove screenshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed theme-border hover:border-emerald-500/60 theme-surface-subtle flex items-center justify-center gap-2 text-xs theme-secondary-text hover:theme-main-text transition-all cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attach a screenshot (PNG, JPG, max 2MB)</span>
                    </button>
                  </div>
                )}

                {attachmentError && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{attachmentError}</span>
                  </p>
                )}
              </div>

              {/* Anonymous Checkbox */}
              <div className="p-3 rounded-xl theme-surface-subtle border theme-border flex items-start gap-2.5">
                <input
                  id="cb-anonymous-feedback"
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 rounded border-gray-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="cb-anonymous-feedback"
                  className="text-xs theme-main-text cursor-pointer select-none leading-snug"
                >
                  <span className="font-semibold block">Submit anonymously</span>
                  <span className="text-[11px] theme-secondary-text block">
                    Your name and email address will not be attached to this feedback item.
                  </span>
                </label>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t theme-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs theme-secondary-text hover:theme-main-text font-medium cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
