'use client';

// =============================================================
// XPPopup — Floating XP notification with animation
// =============================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface XPPopupEvent {
  id: string;
  amount: number;
  label?: string;
  color?: string;
  icon?: string;
}

interface XPPopupProps {
  events: XPPopupEvent[];
  onComplete?: (id: string) => void;
}

export default function XPPopup({ events, onComplete }: XPPopupProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {events.map((event, index) => (
          <PopupItem
            key={event.id}
            event={event}
            index={index}
            onComplete={() => onComplete?.(event.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function PopupItem({
  event,
  index,
  onComplete,
}: {
  event: XPPopupEvent;
  index: number;
  onComplete: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const color = event.color ?? 'text-violet-400';
  const icon = event.icon ?? '⚡';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0.8],
        y: [20, -60, -80, -100],
      }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{
        duration: 2,
        times: [0, 0.2, 0.5, 1],
        ease: 'easeOut',
      }}
      className="absolute"
      style={{
        top: `${50 + index * 10}%`,
        left: `${50 + (index % 2 === 0 ? 5 : -5)}%`,
      }}
    >
      <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-lg px-6 py-3 rounded-full border-2 border-violet-500/50 shadow-2xl">
        <motion.span
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 0.5, repeat: 1 }}
          className="text-2xl"
        >
          {icon}
        </motion.span>
        <div className="flex items-baseline gap-2">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className={`text-2xl font-bold ${color}`}
          >
            +{event.amount}
          </motion.span>
          <span className="text-sm text-slate-400 font-medium">XP</span>
        </div>
        {event.label && (
          <span className="text-xs text-slate-500 ml-2">{event.label}</span>
        )}
      </div>
    </motion.div>
  );
}
