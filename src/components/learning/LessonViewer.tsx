import React, { useState, useEffect } from 'react';
import { Lesson } from '../../types';
import { OwnershipPizzaVisual } from './OwnershipPizzaVisual';
import { OrderBookSimulator } from './OrderBookSimulator';
import { PositionSizeCalculator } from './PositionSizeCalculator';
import { CandlestickAnatomyVisual } from './CandlestickAnatomyVisual';
import { ExpectationSimulator } from './ExpectationSimulator';
import { RevenueWaterfallVisual } from './RevenueWaterfallVisual';
import { 
  Sparkles, 
  BrainCircuit, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Bot,
  RotateCcw
} from 'lucide-react';
import { MarketMascot } from '../mascot/MarketMascot';

interface LessonViewerProps {
  lesson: Lesson;
  isCompleted: boolean;
  savedAnswers?: Record<string, number>;
  savedScore?: number;
  onCompleteLesson: (lessonId: string, quizScore?: number, answers?: Record<string, number>) => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  onOpenMentor?: (initialPrompt?: string) => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  isCompleted,
  savedAnswers,
  savedScore,
  onCompleteLesson,
  onNavigateNext,
  onNavigatePrev,
  onOpenMentor,
}) => {
  const [mode, setMode] = useState<'eli15' | 'deep_dive'>('eli15');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(() => savedAnswers || {});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(() => isCompleted || false);

  // Sync state whenever active lesson or completion status changes
  useEffect(() => {
    setSelectedAnswers(savedAnswers || {});
    setQuizSubmitted(isCompleted || false);
  }, [lesson.id, savedAnswers, isCompleted]);

  const handleSelectAnswer = (questionId: string, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const calculateScore = () => {
    let correct = 0;
    lesson.quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return Math.round((correct / (lesson.quiz.length || 1)) * 100);
  };

  const calculateCorrectCount = () => {
    let correct = 0;
    lesson.quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  };

  const handleFinishQuiz = () => {
    setQuizSubmitted(true);
    const score = calculateScore();
    onCompleteLesson(lesson.id, score, selectedAnswers);
  };

  const handleRetakeQuiz = () => {
    setQuizSubmitted(false);
    setSelectedAnswers({});
  };

  const answeredCount = Object.keys(selectedAnswers).filter((qId) => 
    lesson.quiz.some((q) => q.id === qId)
  ).length;
  const allAnswered = lesson.quiz.length > 0 && lesson.quiz.every((q) => selectedAnswers[q.id] !== undefined);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div 
        id="lesson-header-card"
        className="theme-card border theme-border rounded-3xl p-6 md:p-8 theme-card-shadow relative overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold theme-primary-text uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Lesson Reader</span>
            <span className="theme-muted-text">•</span>
            <span className="flex items-center gap-1 theme-secondary-text lowercase font-mono">
              <Clock className="w-3.5 h-3.5" /> {lesson.readTimeMinutes} min read
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex theme-surface-subtle p-1 rounded-2xl border theme-border">
            <button
              type="button"
              id="btn-mode-eli15"
              onClick={() => setMode('eli15')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer interactive-btn ${
                mode === 'eli15'
                  ? 'theme-btn-primary shadow-xs'
                  : 'theme-secondary-text hover:theme-main-text'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explain Like I'm 15</span>
            </button>
            <button
              type="button"
              id="btn-mode-deepdive"
              onClick={() => setMode('deep_dive')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer interactive-btn ${
                mode === 'deep_dive'
                  ? 'theme-btn-primary shadow-xs'
                  : 'theme-secondary-text hover:theme-main-text'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Technical Deep Dive</span>
            </button>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-black font-heading theme-main-text mb-2">
          {lesson.title}
        </h1>
        <p className="text-xs md:text-sm theme-secondary-text max-w-2xl leading-relaxed">
          {lesson.shortDesc}
        </p>

        {isCompleted && (
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 theme-positive-text border border-emerald-500/20 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 theme-positive-text" />
            <span>Completed & Mastered</span>
            {savedScore !== undefined && (
              <span className="font-mono ml-1 font-bold">({savedScore}%)</span>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {mode === 'eli15' ? (
        <div className="space-y-6">
          <div className="theme-card border theme-border rounded-3xl p-6 md:p-8 space-y-6 theme-card-shadow">
            <div className="border-b theme-border pb-4">
              <span className="text-[11px] uppercase font-mono font-bold theme-warning-text tracking-wider block mb-1">
                Intuitive Real-Life Analogy
              </span>
              <h3 className="text-xl font-bold font-heading theme-main-text">
                {lesson.eli15.analogyTitle}
              </h3>
            </div>

            <div className="theme-main-text text-sm md:text-base leading-relaxed space-y-4">
              <p>{lesson.eli15.explanation}</p>
              <div className="p-4 theme-surface-subtle rounded-2xl border theme-border theme-secondary-text italic border-l-4 border-l-emerald-500 text-sm">
                "{lesson.eli15.realLifeAnalogy}"
              </div>
            </div>

            <div className="p-4 theme-soft-accent-bg rounded-2xl border theme-border flex items-start gap-3.5">
              <MarketMascot character="bull" pose="explaining" size="sm" interactive={false} />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider theme-primary-text font-bold">
                    Bullish Bob's Key Takeaway
                  </span>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold">▲ Growth Rule</span>
                </div>
                <p className="text-xs sm:text-sm theme-main-text leading-relaxed font-medium">
                  {lesson.eli15.keyTakeaway}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="theme-card border theme-border rounded-3xl p-6 md:p-8 space-y-6 theme-card-shadow">
            <div className="border-b theme-border pb-4">
              <span className="text-[11px] uppercase font-mono font-bold theme-primary-text tracking-wider block mb-1">
                Institutional & Quantitative Mechanics
              </span>
              <h3 className="text-xl font-bold font-heading theme-main-text">
                Technical Deep Dive
              </h3>
            </div>

            <p className="theme-main-text text-sm md:text-base leading-relaxed">
              {lesson.deepDive.technicalOverview}
            </p>

            {lesson.deepDive.formulasAndMetrics && lesson.deepDive.formulasAndMetrics.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono font-bold theme-muted-text uppercase tracking-wider block">
                  Core Formulas & Calculations:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {lesson.deepDive.formulasAndMetrics.map((item, idx) => (
                    <div key={idx} className="theme-surface-subtle p-4 rounded-2xl border theme-border space-y-2">
                      <div className="text-xs font-bold theme-main-text">{item.label}</div>
                      <div className="font-mono text-xs theme-primary-text font-bold theme-card px-3 py-2 rounded-xl border theme-border shadow-2xs">
                        {item.formula}
                      </div>
                      <div className="text-xs theme-secondary-text leading-relaxed">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 theme-surface-subtle rounded-2xl border theme-border text-xs sm:text-sm theme-secondary-text space-y-1">
              <strong className="theme-main-text block font-semibold">Market Dynamics & Order Flow:</strong>
              <p>{lesson.deepDive.marketMechanics}</p>
            </div>

            <div className="p-4 rounded-2xl border border-[#B82E3B]/30 bg-[#B82E3B]/10 flex items-start gap-3.5">
              <MarketMascot character="bear" pose="warning" size="sm" interactive={false} />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-[#B82E3B] dark:text-[#E66B6B] block text-xs font-bold uppercase tracking-wider">
                    Bearish Ben's Capital Risk Perspective
                  </strong>
                  <span className="text-[10px] font-mono text-[#B82E3B] dark:text-[#E66B6B] font-bold">▼ Risk Defense</span>
                </div>
                <p className="text-xs sm:text-sm theme-main-text leading-relaxed">
                  {lesson.deepDive.riskInsight}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Activity Widget if present */}
      {lesson.interactiveType === 'ownership_pizza' && <OwnershipPizzaVisual />}
      {lesson.interactiveType === 'order_book' && <OrderBookSimulator />}
      {lesson.interactiveType === 'risk_calculator' && <PositionSizeCalculator />}
      {lesson.interactiveType === 'candlestick_anatomy' && <CandlestickAnatomyVisual />}
      {lesson.interactiveType === 'expectation_simulator' && <ExpectationSimulator />}
      {lesson.interactiveType === 'revenue_waterfall' && <RevenueWaterfallVisual />}

      {/* Quick Quiz Section */}
      <div 
        id="lesson-quiz-container"
        className="theme-card border theme-border rounded-3xl p-6 md:p-8 space-y-6 theme-card-shadow"
      >
        <div className="flex items-center justify-between border-b theme-border pb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 theme-primary-text" />
            <h3 className="text-lg font-bold font-heading theme-main-text">
              Lesson Mastery Checkpoint
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono theme-muted-text">
              {answeredCount} of {lesson.quiz.length} Answered
            </span>
            {quizSubmitted && (
              <button
                type="button"
                onClick={handleRetakeQuiz}
                className="text-xs font-semibold theme-primary-text hover:underline flex items-center gap-1 cursor-pointer interactive-btn"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {lesson.quiz.map((q, qIndex) => {
            const isSelected = selectedAnswers[q.id] !== undefined;

            return (
              <div key={q.id} className="theme-surface-subtle p-5 rounded-2xl border theme-border space-y-4">
                <div className="text-sm font-semibold theme-main-text flex items-start gap-2">
                  <span className="theme-primary-text font-mono font-bold shrink-0">
                    Q{qIndex + 1}.
                  </span>
                  <span>{q.question}</span>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, optIndex) => {
                    const isCurrentOptionSelected = selectedAnswers[q.id] === optIndex;
                    const isCorrect = q.correctIndex === optIndex;

                    let optionStyles = 'theme-card border theme-border hover:border-slate-400 theme-secondary-text';
                    if (quizSubmitted) {
                      if (isCorrect) {
                        optionStyles = 'bg-emerald-500/10 border-emerald-500 theme-positive-text font-semibold';
                      } else if (isCurrentOptionSelected && !isCorrect) {
                        optionStyles = 'bg-rose-500/10 border-rose-500 theme-negative-text font-semibold';
                      } else {
                        optionStyles = 'theme-surface-subtle theme-border theme-muted-text opacity-60';
                      }
                    } else if (isCurrentOptionSelected) {
                      optionStyles = 'theme-soft-accent-bg border-emerald-500 theme-primary-text font-semibold ring-1 ring-emerald-500/30';
                    }

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        disabled={quizSubmitted}
                        onClick={() => handleSelectAnswer(q.id, optIndex)}
                        className={`w-full text-left p-3.5 rounded-xl text-xs md:text-sm border transition-all flex items-center justify-between cursor-pointer interactive-quiz-option ${optionStyles}`}
                      >
                        <span>{opt}</span>
                        {quizSubmitted && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 theme-positive-text shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <div className="p-3 theme-card rounded-xl text-xs theme-secondary-text border theme-border leading-relaxed">
                    <strong className="theme-primary-text block mb-0.5">Explanation:</strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!quizSubmitted ? (
          <button
            type="button"
            id="btn-submit-lesson-quiz"
            onClick={handleFinishQuiz}
            disabled={!allAnswered}
            className="w-full py-3.5 theme-btn-primary disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer interactive-btn"
          >
            {allAnswered 
              ? 'Submit Answers & Complete Lesson' 
              : `Answer All Questions to Complete (${answeredCount}/${lesson.quiz.length})`}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 theme-surface-subtle p-5 rounded-2xl border theme-border">
              <div className="flex items-center gap-4">
                {calculateScore() >= 80 ? (
                  <MarketMascot character="bull" pose="celebrating" size="sm" interactive={false} />
                ) : (
                  <MarketMascot character="bear" pose="thinking" size="sm" interactive={false} />
                )}
                <div>
                  <span className="text-xs theme-muted-text block">Checkpoint Score</span>
                  <span className={`text-xl font-bold font-mono ${calculateScore() >= 80 ? 'theme-positive-text' : 'text-[#B82E3B] dark:text-[#E66B6B]'}`}>
                    {calculateScore()}% ({calculateCorrectCount()}/{lesson.quiz.length} Correct)
                  </span>
                  <span className="text-xs theme-secondary-text block mt-0.5">
                    {calculateScore() >= 80
                      ? 'Bullish Bob: "Superb execution! You grasped the growth concepts cleanly."'
                      : 'Bearish Ben: "Patience builds mastery. Review the explanations below to patch your defense!"'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                {onOpenMentor && (
                  <button
                    type="button"
                    id="btn-ask-mentor-about-lesson"
                    onClick={() => onOpenMentor(`Can you explain more about ${lesson.title} and give me another practical example?`)}
                    className="px-4 py-2 theme-card hover:theme-surface-subtle theme-main-text text-xs font-semibold rounded-xl border theme-border cursor-pointer flex items-center gap-1.5 shadow-2xs interactive-btn"
                  >
                    <Bot className="w-4 h-4 theme-primary-text" />
                    <span>Ask Mentor</span>
                  </button>
                )}
                {onNavigateNext && (
                  <button
                    type="button"
                    id="btn-next-lesson-cta"
                    onClick={onNavigateNext}
                    className="px-5 py-2 theme-btn-primary text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer interactive-btn"
                  >
                    <span>Next Lesson</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation controls */}
      <div className="flex justify-between items-center pt-2">
        {onNavigatePrev ? (
          <button
            type="button"
            onClick={onNavigatePrev}
            className="px-4 py-2 theme-card hover:theme-surface-subtle theme-main-text rounded-xl text-xs font-semibold border theme-border flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Lesson
          </button>
        ) : <div />}

        {onNavigateNext && (
          <button
            type="button"
            onClick={onNavigateNext}
            className="px-4 py-2 theme-card hover:theme-surface-subtle theme-main-text rounded-xl text-xs font-semibold border theme-border flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            Next Lesson <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
