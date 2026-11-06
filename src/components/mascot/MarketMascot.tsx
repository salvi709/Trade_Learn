import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  TrendingUp, 
  ShieldAlert, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  Brain
} from 'lucide-react';
import { cn } from '../../lib/utils';

// High-fidelity generated 3D mascot artwork
export const MASCOT_ASSETS = {
  bull_celebrating: '/src/assets/images/mascot_bull_celebrating_1793789973636.jpg',
  bear_strategist: '/src/assets/images/mascot_bear_strategist_1793789975796.jpg',
  duo_greeting: '/src/assets/images/mascot_duo_greeting_1793789976336.jpg',
  duo_learning: '/src/assets/images/mascot_duo_learning_1793789976943.jpg',
};

export type MascotCharacter = 'bull' | 'bear' | 'duo';
export type MascotPose = 'greeting' | 'celebrating' | 'thinking' | 'explaining' | 'encouraging' | 'warning';
export type MascotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface MarketMascotProps {
  character?: MascotCharacter;
  pose?: MascotPose;
  size?: MascotSize;
  className?: string;
  dialogue?: string;
  dialogueTitle?: string;
  bubblePosition?: 'top' | 'right' | 'bottom';
  interactive?: boolean;
  onClick?: () => void;
}

const SIZE_CONFIGS: Record<MascotSize, { img: string; badge: string; text: string }> = {
  xs: { img: 'w-7 h-7', badge: 'w-3 h-3', text: 'text-[10px]' },
  sm: { img: 'w-10 h-10', badge: 'w-4 h-4', text: 'text-xs' },
  md: { img: 'w-16 h-16', badge: 'w-5 h-5', text: 'text-xs' },
  lg: { img: 'w-24 h-24', badge: 'w-6 h-6', text: 'text-sm' },
  xl: { img: 'w-36 h-36', badge: 'w-8 h-8', text: 'text-base' },
};

const POSE_INFO: Record<MascotPose, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  greeting: { label: 'Hello!', icon: Sparkles },
  celebrating: { label: 'Great Job!', icon: CheckCircle2 },
  thinking: { label: 'Thinking...', icon: Brain },
  explaining: { label: 'Key Insight', icon: Lightbulb },
  encouraging: { label: 'Keep Going!', icon: ThumbsUp },
  warning: { label: 'Risk Caution', icon: AlertTriangle },
};

export const MarketMascot: React.FC<MarketMascotProps> = ({
  character = 'bull',
  pose = 'greeting',
  size = 'md',
  className = '',
  dialogue,
  dialogueTitle,
  bubblePosition = 'right',
  interactive = true,
  onClick,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const sizeConfig = SIZE_CONFIGS[size];
  const poseInfo = POSE_INFO[pose];
  const PoseIcon = poseInfo.icon;

  // Resolve best image representation based on character and pose
  const getImageSource = () => {
    if (character === 'duo') {
      return pose === 'explaining' || pose === 'thinking'
        ? MASCOT_ASSETS.duo_learning
        : MASCOT_ASSETS.duo_greeting;
    }
    if (character === 'bull') {
      return MASCOT_ASSETS.bull_celebrating;
    }
    // Bear
    return MASCOT_ASSETS.bear_strategist;
  };

  const isBull = character === 'bull';
  const isBear = character === 'bear';
  const isDuo = character === 'duo';

  const characterName = isBull 
    ? 'Bullish Bob' 
    : isBear 
    ? 'Bearish Ben' 
    : 'Bob & Ben';

  const roleSubtitle = isBull
    ? 'The Optimist · Growth & Momentum'
    : isBear
    ? 'The Strategist · Risk Defense'
    : 'Market Mentors';

  return (
    <div className={cn("inline-flex items-center gap-3 relative select-none", className)}>
      {/* Animated Mascot Character Avatar / Badge */}
      <motion.div
        whileHover={interactive && !shouldReduceMotion ? { scale: 1.05, y: -2 } : undefined}
        whileTap={interactive && !shouldReduceMotion ? { scale: 0.96 } : undefined}
        onClick={onClick}
        className={cn(
          "relative rounded-2xl p-0.5 shadow-sm overflow-hidden flex-shrink-0 border transition-colors",
          isBull && "bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-500 border-emerald-600/30",
          isBear && "bg-gradient-to-tr from-rose-800 via-rose-700 to-amber-700 border-rose-600/30",
          isDuo && "bg-gradient-to-tr from-emerald-700 via-teal-600 to-rose-700 border-emerald-500/30",
          interactive && "cursor-pointer"
        )}
      >
        <div className={cn("relative rounded-xl overflow-hidden bg-slate-900", sizeConfig.img)}>
          <img
            src={getImageSource()}
            alt={`${characterName} - ${roleSubtitle}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />

          {/* Character Identity Ribbon Badge */}
          <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-0.5 px-1 text-center">
            <span className={cn(
              "font-heading font-black tracking-wider uppercase text-[8px] block truncate",
              isBull && "text-emerald-300",
              isBear && "text-rose-300",
              isDuo && "text-amber-300"
            )}>
              {isBull ? 'BULL' : isBear ? 'BEAR' : 'DUO'}
            </span>
          </div>
        </div>

        {/* Small Pose Action Icon Pill */}
        <div className={cn(
          "absolute -top-1 -right-1 p-1 rounded-full border shadow-xs flex items-center justify-center",
          isBull && "bg-[#0D6847] text-white border-emerald-300/40",
          isBear && "bg-[#B82E3B] text-white border-rose-300/40",
          isDuo && "bg-amber-600 text-white border-amber-300/40"
        )}>
          <PoseIcon className={sizeConfig.badge} />
        </div>
      </motion.div>

      {/* Speech Bubble / Dialogue Card (if provided) */}
      {dialogue && (
        <motion.div
          initial={{ opacity: 0, x: bubblePosition === 'right' ? 8 : 0, y: bubblePosition === 'top' ? -8 : 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative p-3 rounded-xl theme-card border theme-border shadow-xs max-w-sm text-left leading-relaxed",
            isBull && "hover:border-[#0D6847]/40 dark:hover:border-emerald-500/40",
            isBear && "hover:border-[#B82E3B]/40 dark:hover:border-rose-500/40"
          )}
        >
          {/* Subtle colored accent badge */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "w-2 h-2 rounded-full",
                isBull && "bg-[#0D6847] dark:bg-emerald-400",
                isBear && "bg-[#B82E3B] dark:bg-rose-400",
                isDuo && "bg-amber-500"
              )} />
              <span className="text-[11px] font-bold font-heading theme-main-text">
                {dialogueTitle || characterName}
              </span>
            </div>
            <span className={cn(
              "text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border",
              isBull && "bg-emerald-500/10 text-[#0D6847] dark:text-emerald-300 border-emerald-500/20",
              isBear && "bg-rose-500/10 text-[#B82E3B] dark:text-rose-300 border-rose-500/20",
              isDuo && "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
            )}>
              {poseInfo.label}
            </span>
          </div>

          <p className={cn("theme-secondary-text font-normal", sizeConfig.text)}>
            {dialogue}
          </p>

          <span className="text-[9px] theme-muted-text font-mono mt-1 block">
            {roleSubtitle}
          </span>
        </motion.div>
      )}
    </div>
  );
};
