"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AnimatedTab {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface AnimatedTabsProps {
  tabs: AnimatedTab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
  activeColor?: string;
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  activeColor = "text-primary",
}: AnimatedTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1 rounded-2xl border-2 border-primary/30 bg-card/90 backdrop-blur-sm p-1 shadow-neon",
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.value;
        
        return (
          <motion.button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "relative flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-retro font-medium transition-all duration-300",
              isActive
                ? cn("bg-primary/20", activeColor)
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{
                rotate: isActive ? [0, 10, -10, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
              }}
            >
              <Icon size={18} />
            </motion.div>
            
            <motion.span
              className="whitespace-nowrap"
              animate={{
                scale: isActive ? 1.05 : 1,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
            >
              {tab.label}
            </motion.span>

            {isActive && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/30"
                transition={{
                  type: "spring",
                  bounce: 0.2,
                  duration: 0.6,
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
