import React, { useState } from 'react';
import { JournalEntry } from '../../types';
import { BookOpen, Plus, Sparkles, CheckCircle2, History, AlertTriangle } from 'lucide-react';

interface TradingJournalProps {
  entries: JournalEntry[];
  onSaveEntry: (entry: JournalEntry) => void;
  defaultSymbol?: string;
}

export const TradingJournal: React.FC<TradingJournalProps> = ({
  entries,
  onSaveEntry,
  defaultSymbol = '',
}) => {
  const [symbol, setSymbol] = useState<string>(defaultSymbol);
  const [reasoning, setReasoning] = useState<string>('');
  const [emotions, setEmotions] = useState<string>('Calm and focused');
  const [lessonLearned, setLessonLearned] = useState<string>('');
  const [mistakes, setMistakes] = useState<string>('');
  const [followedPlan, setFollowedPlan] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasoning.trim()) return;

    const newEntry: JournalEntry = {
      id: 'journal_' + Date.now(),
      symbol: symbol.toUpperCase() || undefined,
      reasoning,
      emotions,
      lessonLearned,
      mistakes,
      followedPlan,
      timestamp: new Date().toISOString(),
    };

    onSaveEntry(newEntry);
    setSavedSuccess(true);
    setReasoning('');
    setLessonLearned('');
    setMistakes('');

    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="theme-card border theme-border rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 theme-soft-accent-bg border theme-border rounded-xl theme-primary-text">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold theme-main-text font-heading">
              Disciplined Trading Journal
            </h2>
            <p className="text-xs theme-secondary-text">
              "The best traders are not those who never lose, but those who study their decisions relentlessly."
            </p>
          </div>
        </div>
      </div>

      {/* New Journal Entry Form */}
      <form
        onSubmit={handleSubmit}
        data-tour="trading-journal-form"
        className="theme-card border theme-border rounded-3xl p-6 md:p-8 space-y-5 shadow-sm"
      >
        <h3 className="text-base font-bold theme-main-text flex items-center gap-2">
          <Plus className="w-4 h-4 theme-primary-text" /> Log a Trade Decision & Reflection
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold theme-secondary-text block mb-1">Stock Symbol (Optional):</label>
            <input
              type="text"
              placeholder="e.g. NOVA, GREENCORE"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full theme-surface-subtle border theme-border rounded-xl px-3 py-2 text-xs font-mono theme-main-text focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold theme-secondary-text block mb-1">Emotional State When Entering:</label>
            <select
              value={emotions}
              onChange={(e) => setEmotions(e.target.value)}
              className="w-full theme-surface-subtle border theme-border rounded-xl px-3 py-2 text-xs theme-main-text focus:outline-none focus:border-emerald-500"
            >
              <option value="Calm and focused">Calm and methodical (Ideal)</option>
              <option value="Fearful / Anxious">Fearful / Anxious (Afraid to lose)</option>
              <option value="FOMO (Rushing in)">FOMO (Saw green candles, jumped in)</option>
              <option value="Revenge (Angry after loss)">Revenge (Angry after a loss)</option>
              <option value="Overconfident">Overconfident (Winning streak)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold theme-secondary-text block mb-1">
            Why did I enter this trade? (Original Thesis / Technical Setup):
          </label>
          <textarea
            required
            rows={3}
            placeholder="e.g. Stock bounced off 50-day moving average with high volume. Risk was strictly capped at ₹500 with a 1:2.5 risk-to-reward ratio."
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            className="w-full theme-surface-subtle border theme-border rounded-xl p-3 text-xs theme-main-text focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold theme-secondary-text block mb-1">What did I learn?</label>
            <input
              type="text"
              placeholder="e.g. Setting a stop-loss beforehand removed all anxiety."
              value={lessonLearned}
              onChange={(e) => setLessonLearned(e.target.value)}
              className="w-full theme-surface-subtle border theme-border rounded-xl px-3 py-2 text-xs theme-main-text focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold theme-secondary-text block mb-1">Any mistakes made?</label>
            <input
              type="text"
              placeholder="e.g. Exited winning trade too early out of impatience."
              value={mistakes}
              onChange={(e) => setMistakes(e.target.value)}
              className="w-full theme-surface-subtle border theme-border rounded-xl px-3 py-2 text-xs theme-main-text focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 theme-surface-subtle rounded-xl border theme-border">
          <input
            type="checkbox"
            id="planCheckbox"
            checked={followedPlan}
            onChange={(e) => setFollowedPlan(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 cursor-pointer"
          />
          <label htmlFor="planCheckbox" className="text-xs theme-main-text cursor-pointer font-medium">
            I respected my pre-defined risk plan and position size on this trade.
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-3 theme-btn-primary font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer interactive-btn"
        >
          Save Journal Reflection
        </button>

        {savedSuccess && (
          <div className="p-3 theme-surface-subtle theme-positive-text border border-emerald-500/30 rounded-xl text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 theme-positive-text" />
            Journal entry successfully recorded and synced to cloud!
          </div>
        )}
      </form>

      {/* Historical Entries List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold theme-main-text flex items-center gap-2">
          <History className="w-4 h-4 theme-primary-text" /> Previous Reflections ({entries.length})
        </h3>

        {entries.length === 0 ? (
          <div className="p-8 text-center theme-card border theme-border rounded-2xl theme-secondary-text text-xs shadow-2xs">
            No journal entries yet. Developing a daily journaling habit is what separates professional market analysts from emotional gamblers.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="theme-card interactive-card border theme-border rounded-2xl p-5 space-y-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b theme-border pb-3">
                  <div className="flex items-center gap-2">
                    {entry.symbol && (
                      <span className="font-mono font-bold theme-primary-text text-xs theme-soft-accent-bg px-2.5 py-0.5 rounded border theme-border">
                        {entry.symbol}
                      </span>
                    )}
                    <span className="text-xs theme-muted-text font-medium">
                      {new Date(entry.timestamp).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="theme-muted-text">Mindset:</span>
                    <span className="theme-main-text font-semibold">{entry.emotions}</span>
                    {entry.followedPlan ? (
                      <span className="theme-positive-text bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                        Disciplined
                      </span>
                    ) : (
                      <span className="theme-negative-text bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
                        Broke Plan
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs md:text-sm theme-main-text leading-relaxed">
                  <strong className="theme-muted-text block text-[11px] mb-0.5">Thesis:</strong>
                  {entry.reasoning}
                </p>

                {(entry.lessonLearned || entry.mistakes) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t theme-border text-xs">
                    {entry.lessonLearned && (
                      <div className="theme-positive-text bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                        <strong>Takeaway:</strong> {entry.lessonLearned}
                      </div>
                    )}
                    {entry.mistakes && (
                      <div className="theme-negative-text bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                        <strong>Mistake to avoid:</strong> {entry.mistakes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
