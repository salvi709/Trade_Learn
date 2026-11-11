import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, HeartHandshake } from 'lucide-react';
import { submitFeedback, recordFeedbackDismissed } from '../../services/feedbackService';

interface ExperienceFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

const RATINGS = [
  { value: 1, emoji: '😞', label: 'Very poor' },
  { value: 2, emoji: '🙁', label: 'Poor' },
  { value: 3, emoji: '😐', label: 'Average' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😍', label: 'Excellent' },
];

const IMPROVEMENT_OPTIONS = [
  'Difficult to understand',
  'Something is not working',
  'Navigation is confusing',
  'Content needs improvement',
  'Other',
];

export const ExperienceFeedbackModal: React.FC<ExperienceFeedbackModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRatingClick = (val: number) => {
    setSelectedRating(val);
  };

  const handleToggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleDismiss = () => {
    recordFeedbackDismissed('experience');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRating || submitting) return;

    setSubmitting(true);
    const ratingObj = RATINGS.find((r) => r.value === selectedRating);

    await submitFeedback({
      type: 'experience',
      category: 'overall_experience',
      rating: selectedRating,
      ratingLabel: ratingObj?.label || null,
      comment: comment.trim() || null,
      selectedReasons,
      userId,
      userName,
      userEmail,
      isAnonymous: false,
    });

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      // Reset state for next time
      setTimeout(() => {
        setSubmitted(false);
        setSelectedRating(null);
        setSelectedReasons([]);
        setComment('');
      }, 300);
    }, 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md theme-card border theme-border rounded-2xl shadow-2xl overflow-hidden p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold theme-main-text font-heading">
                  Quick Experience Feedback
                </h3>
                <p className="text-xs theme-secondary-text">Your thoughts help us refine ShareMarket</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-surface-subtle transition-colors cursor-pointer"
              title="Maybe later"
              aria-label="Dismiss feedback modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center flex flex-col items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3 animate-bounce" />
              <h4 className="text-sm font-bold theme-main-text">Thank you for your feedback!</h4>
              <p className="text-xs theme-secondary-text mt-1">
                We review every response to make learning the stock market simpler.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold theme-main-text mb-2.5 text-center">
                  How has your experience with ShareMarket been?
                </label>

                {/* 5-point emoji ratings */}
                <div className="grid grid-cols-5 gap-2">
                  {RATINGS.map((r) => {
                    const isSelected = selectedRating === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => handleRatingClick(r.value)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 theme-main-text shadow-xs ring-1 ring-emerald-500'
                            : 'theme-surface-subtle theme-border hover:border-emerald-500/40 text-muted-foreground'
                        }`}
                      >
                        <span className="text-2xl mb-1">{r.emoji}</span>
                        <span className="text-[10px] font-medium leading-tight text-center">
                          {r.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Follow-up for low ratings (1-2) */}
              {selectedRating !== null && selectedRating <= 2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 pt-1 border-t theme-border"
                >
                  <label className="block text-xs font-semibold theme-main-text">
                    What could we improve?
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {IMPROVEMENT_OPTIONS.map((opt) => {
                      const active = selectedReasons.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleToggleReason(opt)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            active
                              ? 'bg-rose-500/15 border-rose-500 text-rose-300 font-semibold'
                              : 'theme-surface-subtle theme-border theme-secondary-text hover:theme-main-text'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Optional short comment */}
              {selectedRating !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-1.5"
                >
                  <label className="block text-[11px] font-medium theme-secondary-text">
                    Any specific details or suggestions? (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="Tell us what you loved or what felt unclear..."
                    className="w-full text-xs p-2.5 rounded-xl border theme-border theme-card theme-main-text focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t theme-border">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-xs theme-secondary-text hover:theme-main-text font-medium cursor-pointer"
                >
                  Maybe later
                </button>

                <button
                  type="submit"
                  disabled={!selectedRating || submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Submit</span>
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
