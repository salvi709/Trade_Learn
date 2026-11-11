import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check, X, Send } from 'lucide-react';
import { submitFeedback } from '../../services/feedbackService';

interface MentorFeedbackInlineProps {
  messageId: string;
  conversationId?: string | null;
  questionExcerpt?: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

const MENTOR_DISSATISFACTION_REASONS = [
  'Incorrect information',
  "Didn't answer my question",
  'Difficult to understand',
  'Irrelevant response',
  'Other',
];

export const MentorFeedbackInline: React.FC<MentorFeedbackInlineProps> = ({
  messageId,
  conversationId,
  questionExcerpt,
  userId,
  userName,
  userEmail,
}) => {
  const [rated, setRated] = useState<'up' | 'down' | null>(null);
  const [showDownDetails, setShowDownDetails] = useState<boolean>(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedDown, setSubmittedDown] = useState<boolean>(false);

  const handleThumbsUp = async () => {
    if (rated !== null) return;
    setRated('up');
    try {
      await submitFeedback({
        type: 'mentor',
        category: 'mentor_response',
        rating: 1,
        ratingLabel: 'Thumbs Up',
        messageId,
        conversationId,
        questionExcerpt,
        userId,
        userName,
        userEmail,
        isAnonymous: false,
      });
    } catch {
      // Ignore
    }
  };

  const handleThumbsDownClick = () => {
    if (rated === 'down' && !showDownDetails) return;
    setRated('down');
    setShowDownDetails(true);
  };

  const handleToggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleSubmitDownDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitFeedback({
        type: 'mentor',
        category: 'mentor_response',
        rating: -1,
        ratingLabel: 'Thumbs Down',
        messageId,
        conversationId,
        questionExcerpt,
        selectedReasons,
        comment: comment.trim() || null,
        userId,
        userName,
        userEmail,
        isAnonymous: false,
      });
      setSubmittedDown(true);
      setShowDownDetails(false);
    } catch {
      setShowDownDetails(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative inline-block mt-0.5">
      <div className="flex items-center gap-1.5 text-[10px]">
        {/* Thumbs Up button */}
        <button
          type="button"
          onClick={handleThumbsUp}
          disabled={rated !== null}
          className={`p-1 rounded-md transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
            rated === 'up'
              ? 'text-emerald-400 bg-emerald-500/15 font-bold ring-1 ring-emerald-500/30'
              : 'theme-secondary-text hover:text-emerald-400 hover:bg-emerald-500/10'
          }`}
          title="Accurate and helpful explanation"
          aria-label="Thumbs up this response"
        >
          {rated === 'up' ? (
            <>
              <Check className="w-3 h-3" />
              <span>Helpful</span>
            </>
          ) : (
            <ThumbsUp className="w-3 h-3" />
          )}
        </button>

        {/* Thumbs Down button */}
        <button
          type="button"
          onClick={handleThumbsDownClick}
          disabled={rated === 'up' || (rated === 'down' && submittedDown)}
          className={`p-1 rounded-md transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
            rated === 'down'
              ? 'text-rose-400 bg-rose-500/15 font-bold ring-1 ring-rose-500/30'
              : 'theme-secondary-text hover:text-rose-400 hover:bg-rose-500/10'
          }`}
          title="Did not explain well or contained an issue"
          aria-label="Thumbs down this response"
        >
          {submittedDown ? (
            <span>Reported</span>
          ) : (
            <ThumbsDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Inline Thumbs-down follow-up popover */}
      {showDownDetails && (
        <div className="absolute left-0 bottom-full mb-2 w-72 p-3 rounded-2xl theme-card border theme-border shadow-xl z-30 animate-in fade-in zoom-in-95 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold theme-main-text text-[11px]">
              What was wrong with this response?
            </span>
            <button
              type="button"
              onClick={() => setShowDownDetails(false)}
              className="p-1 rounded theme-secondary-text hover:theme-main-text"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <form onSubmit={handleSubmitDownDetails} className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {MENTOR_DISSATISFACTION_REASONS.map((reason) => {
                const active = selectedReasons.includes(reason);
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => handleToggleReason(reason)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      active
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold'
                        : 'theme-surface-subtle theme-border theme-secondary-text hover:theme-main-text'
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional comment or what was confusing..."
              maxLength={200}
              className="w-full text-[11px] px-2 py-1.5 rounded-lg border theme-border theme-surface-subtle theme-main-text focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setShowDownDetails(false)}
                className="text-[10px] theme-secondary-text hover:theme-main-text px-2 py-1"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-2.5 h-2.5" />
                <span>Submit</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
