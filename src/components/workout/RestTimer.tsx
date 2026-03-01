'use client';

// =============================================================
// RestTimer — Circular countdown timer between sets
// =============================================================
//
// Features:
//  • Animated circular progress ring (SVG)
//  • Auto-starts when rest begins
//  • Haptic feedback on completion
//  • +15s / -15s adjust buttons
//  • Skip rest option
//  • Shows next set info
// =============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RestTimerState } from '@/types/workout';

interface RestTimerProps {
  totalSeconds: number;
  exerciseName: string;
  nextSetNumber: number;
  autoStart?: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onAdjust?: (newTotal: number) => void;
}

// ── Circular Progress Ring ────────────────────────────────────

function CircularProgress({
  progress,
  size = 200,
  strokeWidth = 8,
}: {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      className="transform -rotate-90"
      viewBox={`0 0 ${size} ${size}`}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#timerGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" /> {/* indigo-400 */}
          <stop offset="100%" stopColor="#6366f1" /> {/* indigo-500 */}
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Format Time ───────────────────────────────────────────────

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ── RestTimer Component ───────────────────────────────────────

export default function RestTimer({
  totalSeconds: initialTotal,
  exerciseName,
  nextSetNumber,
  autoStart = true,
  onComplete,
  onSkip,
  onAdjust,
}: RestTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialTotal);
  const [remaining, setRemaining] = useState(initialTotal);
  const [isActive, setIsActive] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // ── Countdown Logic ─────────────────────────────────────────

  useEffect(() => {
    if (!isActive || isComplete) return;

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setIsComplete(true);
          setIsActive(false);

          // Haptic feedback
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }

          if (!completedRef.current) {
            completedRef.current = true;
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isComplete, onComplete]);

  // ── Adjust Timer ────────────────────────────────────────────

  const adjustTime = useCallback(
    (delta: number) => {
      const newTotal = Math.max(5, totalSeconds + delta);
      const newRemaining = Math.max(0, remaining + delta);
      setTotalSeconds(newTotal);
      setRemaining(newRemaining);
      onAdjust?.(newTotal);
    },
    [totalSeconds, remaining, onAdjust],
  );

  // ── Progress ────────────────────────────────────────────────

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const isLow = remaining <= 5 && remaining > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
      >
        {/* Header info */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 text-sm font-medium text-zinc-400"
        >
          REST BETWEEN SETS
        </motion.p>
        <p className="mb-8 text-base font-medium text-zinc-300">
          Next: <span className="text-indigo-400">{exerciseName}</span> — Set{' '}
          {nextSetNumber}
        </p>

        {/* Circular Timer */}
        <div className="relative mb-8">
          <CircularProgress progress={progress} size={220} strokeWidth={10} />

          {/* Time display in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              animate={isLow ? { scale: [1, 1.15, 1] } : {}}
              transition={isLow ? { repeat: Infinity, duration: 0.6 } : {}}
              className={`text-5xl font-bold tabular-nums ${
                isLow ? 'text-red-400' : isComplete ? 'text-green-400' : 'text-white'
              }`}
            >
              {isComplete ? '✓' : formatTime(remaining)}
            </motion.span>

            {!isComplete && (
              <span className="mt-1 text-xs text-zinc-500">
                of {formatTime(totalSeconds)}
              </span>
            )}
          </div>
        </div>

        {/* Adjust buttons */}
        {!isComplete && (
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => adjustTime(-15)}
              className="flex h-11 w-20 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300 active:bg-zinc-700"
              aria-label="Subtract 15 seconds"
            >
              −15s
            </button>

            <button
              onClick={() => setIsActive(!isActive)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-xl active:bg-indigo-700"
              aria-label={isActive ? 'Pause' : 'Resume'}
            >
              {isActive ? '⏸' : '▶'}
            </button>

            <button
              onClick={() => adjustTime(15)}
              className="flex h-11 w-20 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300 active:bg-zinc-700"
              aria-label="Add 15 seconds"
            >
              +15s
            </button>
          </div>
        )}

        {/* Skip / Continue button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isComplete ? onComplete : onSkip}
          className={`mt-2 w-64 rounded-xl py-3.5 text-center text-base font-semibold ${
            isComplete
              ? 'bg-green-600 text-white active:bg-green-700'
              : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
          }`}
        >
          {isComplete ? 'Start Next Set →' : 'Skip Rest'}
        </motion.button>

        {/* Progress dots for remaining sets could go here */}
      </motion.div>
    </AnimatePresence>
  );
}
