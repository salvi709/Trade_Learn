import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Compass,
  BookOpen,
  FileText,
  TrendingUp,
  ShieldCheck,
  Bot,
  BookA,
  Settings,
  Trophy,
  RotateCcw,
  Palette,
  ShieldAlert,
  Users,
  CornerDownLeft,
  X,
  History,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  SearchItem,
  SearchCategory,
  searchFeatures,
  getRecentSearchItems,
  saveRecentSearchId,
  clearRecentSearches
} from '../../services/searchIndexService';
import { GooeyInput } from '../ui/gooey-input';
import { triggerTactileHaptic } from '../../services/mentorHistory';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  onNavigateTab: (tabId: string) => void;
  onSelectLessonById?: (lessonId: string) => void;
  onTriggerAction?: (actionId: string) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  BookOpen,
  FileText,
  TrendingUp,
  ShieldCheck,
  Bot,
  BookA,
  Settings,
  Trophy,
  RotateCcw,
  Palette,
  ShieldAlert,
  Users,
};

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateTab,
  onSelectLessonById,
  onTriggerAction,
}) => {
  const [queryText, setQueryText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<SearchItem[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const isOwner = currentUser?.email?.toLowerCase() === 'salvisarthak2007@gmail.com';

  useEffect(() => {
    if (isOpen) {
      setRecentItems(getRecentSearchItems(currentUser?.email));
      setQueryText('');
      setSelectedIndex(0);
      triggerTactileHaptic(5);
    }
  }, [isOpen, currentUser]);

  const results = useMemo(() => {
    return searchFeatures(queryText, selectedCategory, currentUser?.email);
  }, [queryText, selectedCategory, currentUser]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [queryText, selectedCategory]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
        triggerTactileHaptic(4);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
        triggerTactileHaptic(4);
      } else if (e.key === 'Enter') {
        if (results.length > 0 && results[selectedIndex]) {
          e.preventDefault();
          handleSelectItem(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelectItem = (item: SearchItem) => {
    triggerTactileHaptic(8);
    saveRecentSearchId(item.id);
    onClose();

    if (item.actionId && onTriggerAction) {
      onTriggerAction(item.actionId);
      return;
    }

    if (item.lessonId && onSelectLessonById) {
      onSelectLessonById(item.lessonId);
      return;
    }

    if (item.tabId) {
      onNavigateTab(item.tabId);
    }
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentItems([]);
  };

  const categories: Array<{ id: SearchCategory; label: string }> = [
    { id: 'all', label: 'All Results' },
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'lessons', label: 'Lessons' },
    { id: 'tools', label: 'Practice Tools' },
    { id: 'actions', label: 'Quick Actions' },
    ...(isOwner ? [{ id: 'admin' as SearchCategory, label: 'Admin' }] : []),
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 md:pt-20 p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Search Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl theme-card border theme-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10"
        >
          {/* Header Input Area with GooeyInput */}
          <div className="p-4 border-b theme-border flex items-center gap-3">
            <div className="flex-1">
              <GooeyInput
                autoFocus
                value={queryText}
                onChange={(val) => setQueryText(val)}
                onClear={() => setQueryText('')}
                placeholder="Search stages, lessons, paper trading, scam detector..."
                shortcut="ESC to close"
                inputClassName="py-3 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl theme-surface-subtle theme-muted-text hover:theme-main-text border theme-border transition-colors cursor-pointer"
              title="Close search modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter Bar */}
          <div className="px-4 py-2 theme-surface-subtle border-b theme-border flex items-center gap-1.5 overflow-x-auto text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 font-medium transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'theme-primary-bg text-white shadow-2xs font-bold'
                    : 'theme-secondary-text hover:theme-main-text hover:theme-card'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results List Viewport */}
          <div ref={listRef} className="overflow-y-auto flex-1 p-2 space-y-1 divide-y divide-transparent">
            {/* When query is empty, show recent searches first if available */}
            {!queryText.trim() && recentItems.length > 0 && selectedCategory === 'all' && (
              <div className="px-3 py-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] theme-muted-text font-semibold uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={handleClearRecent}
                    className="hover:theme-main-text hover:underline lowercase font-normal text-[10px] cursor-pointer"
                  >
                    Clear history
                  </button>
                </div>
                <div className="space-y-1">
                  {recentItems.map((item) => {
                    const Icon = ICON_MAP[item.iconName || 'FileText'] || FileText;
                    return (
                      <div
                        key={`recent_${item.id}`}
                        onClick={() => handleSelectItem(item)}
                        className="flex items-center justify-between p-2.5 rounded-xl theme-surface-subtle hover:theme-card border theme-border transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 theme-primary-text shrink-0" />
                          <span className="text-xs font-semibold theme-main-text truncate">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] theme-muted-text shrink-0">
                          <span>{item.categoryLabel}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3 pb-1 border-b theme-border text-[11px] theme-muted-text font-semibold uppercase tracking-wider">
                  Suggested Destinations
                </div>
              </div>
            )}

            {/* Results Items */}
            {results.length > 0 ? (
              results.map((item, index) => {
                const Icon = ICON_MAP[item.iconName || 'FileText'] || FileText;
                const isSelected = index === selectedIndex;

                return (
                  <div
                    key={item.id}
                    data-index={index}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'theme-surface-subtle ring-1 ring-emerald-500/50 shadow-xs'
                        : 'hover:theme-surface-subtle'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? 'theme-primary-bg text-white'
                            : 'theme-surface-elevated theme-border border text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold theme-main-text leading-tight">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded theme-surface-elevated theme-border border theme-secondary-text">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-xs theme-secondary-text line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="flex items-center gap-1.5 text-[10px] theme-muted-text font-mono pt-0.5">
                          <span>{item.path}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-[11px] theme-muted-text">
                      {isSelected ? (
                        <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono theme-primary-text font-bold theme-surface-elevated theme-border border shadow-2xs">
                          <span>Enter</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </kbd>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl theme-surface-subtle theme-border border flex items-center justify-center mx-auto text-emerald-500">
                  <Search className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold theme-main-text">No matches found</div>
                  <p className="text-xs theme-muted-text max-w-sm mx-auto">
                    We could not find anything matching &quot;{queryText}&quot;. Try searching for &quot;inflation&quot;, &quot;paper trading&quot;, &quot;scam detector&quot;, or &quot;P/E ratio&quot;.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Hotkeys */}
          <div className="px-4 py-2.5 theme-surface-subtle border-t theme-border flex items-center justify-between text-[11px] theme-muted-text font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded theme-surface-elevated theme-border border text-[9px]">↑</kbd>
                <kbd className="px-1 py-0.5 rounded theme-surface-elevated theme-border border text-[9px]">↓</kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded theme-surface-elevated theme-border border text-[9px]">↵</kbd>
                <span>select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded theme-surface-elevated theme-border border text-[9px]">esc</kbd>
                <span>close</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px]">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>ShareMarket Instant Search</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
