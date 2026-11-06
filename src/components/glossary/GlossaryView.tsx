import React, { useState } from 'react';
import { GLOSSARY_TERMS } from '../../data/marketData';
import { BookA, Search } from 'lucide-react';

export const GlossaryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(GLOSSARY_TERMS.map((t) => t.category)))];

  const filteredTerms = GLOSSARY_TERMS.filter((t) => {
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesSearch = 
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div
        data-tour="glossary-header"
        className="theme-card border theme-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 theme-card-shadow"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 theme-soft-accent-bg theme-primary-text border theme-border rounded-xl">
            <BookA className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold theme-main-text font-heading">
              A-Z Stock Market Glossary
            </h2>
            <p className="text-xs theme-secondary-text">
              Plain-English definitions, practical examples, and conceptual connections.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 theme-muted-text absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search terms (e.g. P/E, Demat, Bid)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full theme-surface-subtle border theme-border rounded-xl pl-9 pr-4 py-2 text-xs theme-main-text placeholder:theme-muted-text interactive-input focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer interactive-btn ${
              selectedCategory === cat
                ? 'theme-primary-bg text-white shadow-xs'
                : 'theme-card theme-secondary-text border theme-border hover:theme-main-text hover:theme-surface-subtle'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Glossary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTerms.map((item) => (
          <div
            key={item.term}
            className="theme-card interactive-card border theme-border hover:border-emerald-500 rounded-2xl p-5 space-y-3 transition-all theme-card-shadow"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold theme-main-text font-heading">{item.term}</h3>
              <span className="text-[10px] font-mono theme-primary-text theme-soft-accent-bg px-2 py-0.5 rounded border theme-border">
                {item.category}
              </span>
            </div>

            <p className="text-xs theme-secondary-text leading-relaxed">
              {item.definition}
            </p>

            <div className="p-3 theme-surface-subtle rounded-xl border theme-border text-xs theme-secondary-text">
              <strong className="theme-warning-text block text-[11px] mb-0.5 font-semibold">Practical Example:</strong>
              {item.example}
            </div>

            {item.relatedTerms && item.relatedTerms.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] theme-muted-text">Related:</span>
                {item.relatedTerms.map((rt) => (
                  <span
                    key={rt}
                    onClick={() => setSearchQuery(rt)}
                    className="text-[10px] font-mono theme-surface-subtle theme-secondary-text hover:theme-primary-text hover:theme-soft-accent-bg px-2 py-0.5 rounded cursor-pointer transition-colors border theme-border"
                  >
                    {rt}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
