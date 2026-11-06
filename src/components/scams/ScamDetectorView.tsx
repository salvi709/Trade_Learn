import React, { useState } from 'react';
import { RED_FLAG_SCENARIOS, WHAT_WOULD_YOU_DO_SCENARIOS } from '../../data/marketData';
import { RedFlagScenario, WhatWouldYouDoScenario } from '../../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  ArrowRight, 
  MessageSquare,
  Search,
  Sparkles
} from 'lucide-react';

export const ScamDetectorView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SCAMS' | 'SCENARIOS'>('SCAMS');
  const [selectedScam, setSelectedScam] = useState<RedFlagScenario>(RED_FLAG_SCENARIOS[0]);
  const [userScamGuess, setUserScamGuess] = useState<'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | null>(null);

  // Scenarios state
  const [scenarioIndex, setScenarioIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const currentScenario: WhatWouldYouDoScenario = WHAT_WOULD_YOU_DO_SCENARIOS[scenarioIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Switcher Tabs */}
      <div className="flex theme-surface-subtle p-1.5 rounded-2xl border theme-border w-fit mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('SCAMS')}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer interactive-btn ${
            activeTab === 'SCAMS'
              ? 'theme-primary-bg text-white shadow-xs'
              : 'theme-secondary-text hover:theme-main-text'
          }`}
        >
          🚨 Financial Scam Detector
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SCENARIOS')}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer interactive-btn ${
            activeTab === 'SCENARIOS'
              ? 'theme-primary-bg text-white shadow-xs'
              : 'theme-secondary-text hover:theme-main-text'
          }`}
        >
          🧠 "What Would You Do?" Scenarios
        </button>
      </div>

      {activeTab === 'SCAMS' ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="theme-card border theme-border rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl theme-negative-text">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold theme-main-text font-heading">
                  Financial Scam & Red-Flag Detective
                </h2>
                <p className="text-xs theme-secondary-text">
                  Learn to spot fake screenshots, Telegram stock pumps, and "guaranteed double money" frauds.
                </p>
              </div>
            </div>
          </div>

          {/* Scenario Selector Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {RED_FLAG_SCENARIOS.map((scam) => (
              <button
                key={scam.id}
                type="button"
                onClick={() => {
                  setSelectedScam(scam);
                  setUserScamGuess(null);
                }}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer interactive-btn ${
                  selectedScam.id === scam.id
                    ? 'theme-primary-bg text-white border-emerald-500 shadow-xs'
                    : 'theme-card theme-secondary-text border theme-border hover:theme-main-text hover:theme-surface-subtle'
                }`}
              >
                {scam.title}
              </button>
            ))}
          </div>

          {/* Active Scam Investigation Card */}
          <div
            data-tour="scam-detector-card"
            className="theme-card border theme-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm"
          >
            <div className="flex justify-between items-center border-b theme-border pb-4">
              <span className="text-xs font-mono font-bold theme-primary-text theme-soft-accent-bg px-2.5 py-1 rounded-lg border theme-border">
                {selectedScam.channel}
              </span>
              <span className="text-xs theme-muted-text font-mono">
                From: {selectedScam.sender}
              </span>
            </div>

            {/* Simulated Chat Message Display */}
            <div className="p-5 theme-surface-subtle rounded-2xl border theme-border font-sans text-sm theme-main-text leading-relaxed shadow-inner">
              <div className="flex items-center gap-2 mb-2 text-xs theme-muted-text font-semibold">
                <MessageSquare className="w-3.5 h-3.5" /> Incoming Message
              </div>
              <p className="whitespace-pre-line theme-main-text">{selectedScam.message}</p>
            </div>

            {/* User Assessment Buttons */}
            <div>
              <p className="text-xs font-semibold theme-secondary-text mb-3 text-center">
                What is your fraud assessment of this message?
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setUserScamGuess('SAFE')}
                  className={`py-3 rounded-xl font-bold text-xs border transition-all cursor-pointer interactive-btn ${
                    userScamGuess === 'SAFE'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'theme-card theme-secondary-text border theme-border hover:border-emerald-500'
                  }`}
                >
                  🟢 SAFE & LEGITIMATE
                </button>
                <button
                  type="button"
                  onClick={() => setUserScamGuess('SUSPICIOUS')}
                  className={`py-3 rounded-xl font-bold text-xs border transition-all cursor-pointer interactive-btn ${
                    userScamGuess === 'SUSPICIOUS'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'theme-card theme-secondary-text border theme-border hover:border-amber-500'
                  }`}
                >
                  🟡 SUSPICIOUS
                </button>
                <button
                  type="button"
                  onClick={() => setUserScamGuess('HIGH_RISK')}
                  className={`py-3 rounded-xl font-bold text-xs border transition-all cursor-pointer interactive-btn ${
                    userScamGuess === 'HIGH_RISK'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : 'theme-card theme-secondary-text border theme-border hover:border-rose-500'
                  }`}
                >
                  🔴 HIGH RISK FRAUD
                </button>
              </div>
            </div>

            {/* Clues and Verdict Breakdown */}
            {userScamGuess && (
              <div className="theme-surface-subtle p-6 rounded-2xl border theme-border space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {userScamGuess === selectedScam.verdict ? (
                      <span className="theme-positive-text font-bold text-xs flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <CheckCircle className="w-4 h-4 theme-positive-text" /> Correct Assessment!
                      </span>
                    ) : (
                      <span className="theme-negative-text font-bold text-xs flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                        <AlertTriangle className="w-4 h-4 theme-negative-text" /> Careful! This is actually {selectedScam.verdict}.
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold theme-main-text uppercase">
                    Official Verdict: {selectedScam.verdict}
                  </span>
                </div>

                <p className="text-xs md:text-sm theme-secondary-text leading-relaxed">
                  {selectedScam.explanation}
                </p>

                <div className="space-y-2 pt-2 border-t theme-border">
                  <span className="text-xs font-bold uppercase tracking-wider theme-warning-text block">
                    Forensic Red Flags Identified:
                  </span>
                  <ul className="space-y-1.5">
                    {selectedScam.clues.map((clue, idx) => (
                      <li key={idx} className="text-xs theme-secondary-text flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        {clue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* What Would You Do Scenarios */
        <div className="space-y-6">
          <div className="theme-card border theme-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b theme-border pb-4">
              <span className="text-xs font-bold theme-warning-text uppercase tracking-wider">
                Psychological Dilemma • {currentScenario.category}
              </span>
              <span className="text-xs theme-muted-text font-mono">
                Scenario {scenarioIndex + 1} of {WHAT_WOULD_YOU_DO_SCENARIOS.length}
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-bold theme-main-text leading-relaxed font-heading">
              "{currentScenario.situation}"
            </h3>

            <div className="space-y-3">
              {currentScenario.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                return (
                  <div key={idx} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full text-left p-4 rounded-2xl text-xs md:text-sm border transition-all cursor-pointer ${
                        isSelected
                          ? opt.isDisciplined
                            ? 'bg-emerald-500/10 border-emerald-500 theme-positive-text font-medium ring-1 ring-emerald-500'
                            : 'bg-rose-500/10 border-rose-500 theme-negative-text font-medium ring-1 ring-rose-500'
                          : 'theme-surface-subtle border theme-border theme-secondary-text hover:border-slate-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{opt.text}</span>
                        {isSelected && (
                          <span className={`text-xs font-bold ml-2 shrink-0 ${opt.isDisciplined ? 'theme-positive-text' : 'theme-negative-text'}`}>
                            {opt.isDisciplined ? 'Disciplined Choice' : 'Emotional Trap'}
                          </span>
                        )}
                      </div>
                    </button>

                    {isSelected && (
                      <div className="p-3 theme-surface-subtle rounded-xl border theme-border text-xs theme-secondary-text leading-relaxed ml-2 font-medium">
                        <strong className="theme-primary-text block mb-0.5">Psychology Breakdown:</strong>
                        {opt.scoreExplanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t theme-border">
              <button
                type="button"
                onClick={() => {
                  setScenarioIndex((prev) => (prev + 1) % WHAT_WOULD_YOU_DO_SCENARIOS.length);
                  setSelectedOption(null);
                }}
                className="px-5 py-2.5 theme-btn-primary font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                Next Scenario <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
