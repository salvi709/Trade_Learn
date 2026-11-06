import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Command } from "lucide-react";
import { cn } from "../../lib/utils";

export interface GooeyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onClick"> {
  value?: string;
  onChange?: (value: string) => void;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onClear?: () => void;
  shortcut?: string;
  isTriggerOnly?: boolean;
  containerClassName?: string;
  inputClassName?: string;
}

export const GooeyInput = React.forwardRef<HTMLInputElement, GooeyInputProps>(
  (
    {
      value = "",
      onChange,
      onClear,
      placeholder = "Search modules, lessons, tools, actions...",
      shortcut = "⌘K",
      isTriggerOnly = false,
      containerClassName,
      inputClassName,
      className,
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onChange) onChange("");
      if (onClear) onClear();
      inputRef.current?.focus();
    };

    const hasValue = Boolean(value && value.length > 0);

    // If trigger only, render button that mimics the premium search bar
    if (isTriggerOnly) {
      return (
        <button
          type="button"
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "relative w-full flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200 select-none",
            "theme-surface-subtle theme-card border theme-border hover:border-emerald-500/50 shadow-2xs group text-left",
            containerClassName,
            className
          )}
        >
          {/* Subtle liquid glow blob effect on hover/focus */}
          <div
            className={cn(
              "absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100",
              "bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-transparent"
            )}
          />

          <div className="flex items-center gap-2.5 min-w-0 z-10">
            <Search className="w-3.5 h-3.5 theme-muted-text group-hover:text-emerald-500 transition-colors shrink-0" />
            <span className="truncate theme-muted-text group-hover:theme-main-text transition-colors">
              {placeholder}
            </span>
          </div>

          {shortcut && (
            <kbd className="z-10 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md theme-surface-elevated theme-border border theme-muted-text shadow-2xs shrink-0">
              {shortcut}
            </kbd>
          )}
        </button>
      );
    }

    return (
      <div
        className={cn(
          "relative flex items-center w-full transition-all duration-200 rounded-xl",
          containerClassName
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gooey Liquid SVG Filter Definition */}
        <svg className="hidden">
          <defs>
            <filter id="sm-gooey-effect">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>

        {/* Ambient focus border glow */}
        <div
          className={cn(
            "absolute -inset-[1px] rounded-xl pointer-events-none transition-opacity duration-300",
            isFocused
              ? "opacity-100 ring-2 ring-emerald-500/30 border border-emerald-500/60"
              : isHovered
              ? "opacity-100 border border-emerald-500/30"
              : "opacity-0"
          )}
        />

        {/* Search Icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center">
          <Search
            className={cn(
              "w-4 h-4 transition-colors duration-200",
              isFocused ? "text-emerald-500" : "theme-muted-text"
            )}
          />
        </div>

        {/* Native Input */}
        <input
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          type="text"
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full pl-10 pr-16 py-2.5 text-xs rounded-xl transition-all duration-200 outline-none",
            "theme-surface-subtle theme-card border theme-border theme-main-text placeholder:theme-muted-text",
            "focus:border-emerald-500/70 focus:bg-transparent",
            inputClassName,
            className
          )}
          {...props}
        />

        {/* Trailing actions: Clear button and keyboard shortcut */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          <AnimatePresence>
            {hasValue && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md theme-muted-text hover:theme-main-text hover:theme-surface-elevated transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>

          {shortcut && !hasValue && (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md theme-surface-elevated theme-border border theme-muted-text shadow-2xs select-none">
              {shortcut}
            </kbd>
          )}
        </div>
      </div>
    );
  }
);

GooeyInput.displayName = "GooeyInput";
