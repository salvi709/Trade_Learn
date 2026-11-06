import React, { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BentoCardProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4;
  headerAction?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  id?: string;
  dataTour?: string;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.35, 
      ease: [0, 0, 0.2, 1] 
    } 
  },
};

export function BentoCard({
  title,
  description,
  icon,
  children,
  className,
  colSpan = 1,
  headerAction,
  footer,
  onClick,
  id,
  dataTour,
}: BentoCardProps) {
  const colSpanClasses: Record<number, string> = {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-2 lg:col-span-3",
    4: "col-span-1 md:col-span-2 lg:col-span-4",
  };

  return (
    <motion.div
      id={id}
      data-tour={dataTour}
      variants={itemVariants}
      onClick={onClick}
      className={cn(
        "theme-card interactive-card border theme-border rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-2xs",
        colSpanClasses[colSpan] || "col-span-1",
        className
      )}
    >
      {(title || icon || headerAction) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {icon && <div className="theme-primary-text">{icon}</div>}
              {typeof title === "string" ? (
                <h3 className="font-bold text-base font-heading theme-main-text leading-snug">
                  {title}
                </h3>
              ) : (
                title
              )}
            </div>
            {description && (
              <p className="text-xs theme-secondary-text leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      {children && <div className="flex-1 w-full">{children}</div>}

      {footer && <div className="mt-4 pt-3 border-t theme-border">{footer}</div>}
    </motion.div>
  );
}

export default BentoCard;
