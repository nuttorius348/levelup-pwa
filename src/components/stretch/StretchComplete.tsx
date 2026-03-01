'use client';

// =============================================================
// StretchComplete — Animated post-session results screen
// =============================================================
//
// Features:
//  • XP breakdown with staggered reveal
//  • Streak multiplier display
//  • Morning bonus highlight
//  • Session stats summary
//  • Progression unlock progress bar
//  • Share / return actions
// =============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StretchSession, StretchXPBreakdown } from '@/types/stretch';
import { StretchService } from '@/lib/services/stretch.service';

// ── Props ─────────────────────────────────────────────────────

interface StretchCompleteProps {
  session: StretchSession;
  onDone: () => void;
}

// ── XP Line Item ──────────────────────────────────────────────

function XPLine({
  label,
  value,
  icon,
  color = 'text-white/60',
  delay = 0,
}: {
  label: string;
  value: number;
  icon: string;
  color?: string;
  delay?: number;
}) {
  if (value <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center justify-between py-2"
    >
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className={`text-sm ${color}`}>{label}</span>
      </div>
      <span className="text-sm font-mono font-semibold text-violet-300">+{value} XP</span>
    </motion.div>
  );
}

// ── Stat Badge ────────────────────────────────────────────────

function StatBadge({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center gap-1 bg-white/5 rounded-xl p-3 min-w-[80px]"
    >
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[10px] text-white/30 uppercase tracking-wide">{label}</span>
    </motion.div>
  );
}

// ── StretchComplete Component ─────────────────────────────────

export default function StretchComplete({ session, onDone }: StretchCompleteProps) {
  const [showXP, setShowXP] = useState(false);
  const xp = session.xpBreakdown;

  // Delay XP reveal for dramatic effect
  useEffect(() => {
    const timer = setTimeout(() => setShowXP(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const durationMin = Math.round(session.totalDurationSeconds / 60);
  const isMorning = xp.morningBonusXP > 0;
  const allPosesCompleted = session.posesSkipped === 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-4 pt-safe-top pb-safe-bottom">
      {/* ── Celebration Header ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="text-center mt-8 mb-6"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-6xl mb-3"
        >
          {isMorning ? '🌅' : '🧘'}
        </motion.div>
        <h1 className="text-2xl font-bold">
          {allPosesCompleted ? 'Perfect Session!' : 'Session Complete!'}
        </h1>
        <p className="text-sm text-white/40 mt-1">{session.routineTitle}</p>
        {isMorning && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-amber-400 mt-2"
          >
            ☀️ Morning Stretch Bonus!
          </motion.p>
        )}
      </motion.div>

      {/* ── Total XP (Hero number) ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-6"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', damping: 10 }}
          className="text-5xl font-bold font-mono text-violet-400"
        >
          +{xp.totalXP}
        </motion.span>
        <p className="text-xs text-white/30 mt-1">experience points</p>

        {xp.coinsEarned > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-sm text-amber-400 mt-2"
          >
            🪙 +{xp.coinsEarned} coins
          </motion.p>
        )}
      </motion.div>

      {/* ── Session Stats ──────────────────────────────────── */}
      <div className="flex gap-3 justify-center mb-6">
        <StatBadge label="Duration" value={`${durationMin}m`} delay={0.4} />
        <StatBadge label="Poses" value={`${session.posesCompleted}`} delay={0.5} />
        <StatBadge label="Hold Time" value={`${Math.round(session.totalHoldTime / 60)}m`} delay={0.6} />
      </div>

      {/* ── XP Breakdown ───────────────────────────────────── */}
      <AnimatePresence>
        {showXP && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-sm bg-white/[0.03] rounded-2xl p-4 border border-white/5 mb-6"
          >
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-2">
              XP Breakdown
            </p>
            <div className="divide-y divide-white/5">
              <XPLine label="Base XP" value={xp.baseXP} icon="⚡" delay={0.6} />
              <XPLine label="Morning Bonus" value={xp.morningBonusXP} icon="☀️" color="text-amber-400" delay={0.7} />
              <XPLine label="All Poses Completed" value={xp.completionBonusXP} icon="✅" color="text-emerald-400" delay={0.8} />
              <XPLine label="Duration Bonus" value={xp.durationBonusXP} icon="⏱" delay={0.9} />
              <XPLine label="Difficulty Bonus" value={xp.difficultyBonusXP} icon="🔥" color="text-orange-400" delay={1.0} />
            </div>

            {/* Streak multiplier */}
            {xp.streakMultiplier > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>🔥</span>
                  <span className="text-sm text-orange-400 font-medium">
                    Streak ×{xp.streakMultiplier.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-white/30">applied to total</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Skipped poses note ─────────────────────────────── */}
      {session.posesSkipped > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-xs text-white/20 mb-4"
        >
          {session.posesSkipped} pose{session.posesSkipped > 1 ? 's' : ''} skipped — complete all for +{10} bonus XP next time!
        </motion.p>
      )}

      {/* ── Done Button ────────────────────────────────────── */}
      <div className="w-full max-w-sm mt-auto pb-4 space-y-3">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          whileTap={{ scale: 0.97 }}
          onClick={onDone}
          className="w-full py-4 rounded-2xl bg-violet-600 text-white font-semibold text-lg active:bg-violet-700 transition-colors min-h-[56px]"
        >
          Done
        </motion.button>
      </div>
    </div>
  );
}
