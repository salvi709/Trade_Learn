import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, CheckCircle2, Sparkles } from 'lucide-react';
import { submitFeedback, recordFeedbackDismissed } from '../../services/feedbackService';

interface LearningFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
  stageId?: string;
  stageTitle?: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

const UNDERSTANDING_OPTIONS = [
  { value: 3, label: 'Yes, completely', emoji: '✨', desc: 'Understood clearly' },
  { value: 2, label: 'Somewhat', emoji: '🤔', desc: 'Partially clear' },
  { value: 1, label: 'Not yet', emoji: '❓', desc: 'Still confusing' },
];

const DIFFICULTY_OPTIONS = [
  'Explanation was confusing',
  'Not enough examples',
  'Too much technical terminology',
  'Topic was too difficult',
  'Other',
];

export const LearningFeedbackModal: React.FC<LearningFeedbackModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  stageId,
  stageTitle,
  userId,
  userName,
  userEmail,
}) => {
  const [selectedUnderstanding, setSelectedUnderstanding] = useState<number | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleToggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleDismiss = () => {
    recordFeedbackDismissed('learning');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnderstanding || submitting) return;

    setSubmitting(true);
    const optObj = UNDERSTANDING_OPTIONS.find((o) => o.value === selectedUnderstanding);

    await submitFeedback({
      type: 'learning',
      category: 'lesson_understanding',
      rating: selectedUnderstanding,
      ratingLabel: optObj?.label || null,
      comment: comment.trim() || null,
      selectedReasons,
      lessonId,
      lessonTitle,
      stageId,
      stageTitle,
      userId,
      userName,
      userEmail,
      isAnonymous: false,
    });

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setTimeout(() => {
        setSubmitted(false);
        setSelectedUnderstanding(null);
        setSelectedReasons([]);
        setComment('');
      }, 300);
    }, 1800);
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
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 font-mono">
                  Milestone Check
                </span>
                <h3 className="text-sm font-bold theme-main-text font-heading leading-tight">
                  Did you understand this topic?
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg theme-secondary-text hover:theme-main-text hover:theme-surface-subtle transition-colors cursor-pointer"
              title="Skip"
              aria-label="Skip learning feedback"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Context Pill */}
          <div className="p-2.5 rounded-xl theme-surface-subtle border theme-border mb-4 text-xs">
            <span className="theme-muted-text">Lesson: </span>
            <strong className="theme-main-text">{lessonTitle}</strong>
            {stageTitle && (
              <span className="block text-[11px] theme-secondary-text mt-0.5">
                Stage: {stageTitle}
              </span>
            )}
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center flex flex-col items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 animate-bounce" />
              <h4 className="text-sm font-bold theme-main-text">Progress noted!</h4>
              <p className="text-xs theme-secondary-text mt-1">
                We adjust lessons and analogies based on student feedback.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Understanding choices */}
              <div className="grid grid-cols-3 gap-2">
                {UNDERSTANDING_OPTIONS.map((opt) => {
                  const isSelected = selectedUnderstanding === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedUnderstanding(opt.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer active:scale-95 text-center ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 theme-main-text font-bold shadow-xs ring-1 ring-emerald-500'
                          : 'theme-surface-subtle theme-border hover:border-emerald-500/40 text-muted-foreground'
                      }`}
                    >
                      <span className="text-2xl mb-1">{opt.emoji}</span>
                      <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                      <span className="text-[10px] theme-muted-text mt-0.5">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Follow-up if "Somewhat" or "Not yet" */}
              {selectedUnderstanding !== null && selectedUnderstanding <= 2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 pt-1 border-t theme-border"
                >
                  <label className="block text-xs font-semibold theme-main-text">
                    What was difficult? (Optional)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DIFFICULTY_OPTIONS.map((opt) => {
                      const active = selectedReasons.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleToggleReason(opt)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            active
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-semibold'
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

              {/* Optional comment */}
              {selectedUnderstanding !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-1.5"
                >
                  <label className="block text-[11px] font-medium theme-secondary-text">
                    What would make this lesson easier to grasp? (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="e.g., More visual chart examples, less financial jargon..."
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
                  Skip
                </button>

                <button
                  type="submit"
                  disabled={!selectedUnderstanding || submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <span>Saving...</span>
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
