import React from "react";
import { 
  Bot, 
  BarChart3, 
  Music, 
  BellRing, 
  TerminalSquare, 
  Users, 
  Cloud, 
  Globe, 
  Calendar as CalendarIcon,
  Play,
  CheckCircle2
} from "lucide-react";

export const AiAssistantDemo = () => (
  <div className="p-3 theme-surface-subtle border theme-border rounded-xl text-xs space-y-2">
    <div className="flex items-center gap-2 font-mono text-[11px] theme-primary-text">
      <Bot className="w-3.5 h-3.5" />
      <span>AI Assistant active</span>
    </div>
    <p className="theme-secondary-text text-[11px]">
      "Ready to generate, review, and test your trading strategies."
    </p>
  </div>
);

export const AnalyticsDemo = () => (
  <div className="h-20 flex items-end gap-1.5 pt-2">
    {[35, 60, 45, 80, 70, 95, 85].map((h, i) => (
      <div key={i} className="flex-1 theme-surface-subtle rounded-t-md overflow-hidden h-full flex items-end">
        <div 
          className="w-full theme-primary-bg rounded-t-md" 
          style={{ height: `${h}%` }}
        />
      </div>
    ))}
  </div>
);

export const MusicPlayerDemo = () => (
  <div className="p-3 theme-surface-subtle border theme-border rounded-xl flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Music className="w-4 h-4 theme-primary-text" />
      <span className="text-xs font-bold theme-main-text">Focus Audio</span>
    </div>
    <Play className="w-3.5 h-3.5 theme-primary-text" />
  </div>
);

export const NotificationsDemo = () => (
  <div className="space-y-1.5 text-xs">
    <div className="p-2 theme-surface-subtle border theme-border rounded-lg flex items-center gap-2">
      <BellRing className="w-3.5 h-3.5 text-amber-500" />
      <span className="text-[11px] theme-main-text">Stage 2 completed</span>
    </div>
  </div>
);

export const TerminalDemo = () => (
  <div className="p-3 bg-black/80 rounded-xl font-mono text-[11px] text-emerald-400 space-y-1">
    <div>$ tradequest --simulate-order</div>
    <div className="text-gray-400">Order filled: 10 shares @ ₹2,420 (Risk-free)</div>
  </div>
);

export const TeamMembersDemo = () => (
  <div className="flex -space-x-2 overflow-hidden py-1">
    {['🧑‍💻', '👩‍💼', '👨‍🏫'].map((emoji, i) => (
      <div key={i} className="inline-block h-7 w-7 rounded-full ring-2 ring-background theme-surface-subtle flex items-center justify-center text-xs">
        {emoji}
      </div>
    ))}
  </div>
);

export const StorageDemo = () => (
  <div className="p-3 theme-surface-subtle border theme-border rounded-xl flex items-center justify-between text-xs">
    <span className="theme-secondary-text">Cloud Sync</span>
    <span className="theme-positive-text font-bold flex items-center gap-1">
      <CheckCircle2 className="w-3.5 h-3.5" /> 100%
    </span>
  </div>
);

export const ProgressDemo = () => (
  <div className="w-full theme-surface-subtle h-2 rounded-full overflow-hidden border theme-border">
    <div className="theme-primary-bg h-full rounded-full" style={{ width: "75%" }} />
  </div>
);

export const CalendarDemo = () => (
  <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] pt-1">
    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
      <div key={i} className="p-1 rounded theme-surface-subtle theme-muted-text">
        {d}
      </div>
    ))}
  </div>
);
