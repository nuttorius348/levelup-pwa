'use client';

// =============================================================
// StretchSession — Routine browser + active session wrapper
// =============================================================
//
// Features:
//  • Browse routines by category/difficulty
//  • Daily challenge banner
//  • Session start → guided timer → completion flow
//  • Progression unlock indicators
//  • Routine detail preview before starting
// =============================================================

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  StretchSession as StretchSessionType,
  StretchRoutine,
  StretchDifficulty,
  StretchCategory,
} from '@/types/stretch';
import {
  STRETCH_ROUTINE_LIBRARY,
  getRoutinesByDifficulty,
  getRoutinesByCategory,
} from '@/lib/constants/stretches';
import { STRETCH_PROGRESSION } from '@/types/stretch';
import { StretchService } from '@/lib/services/stretch.service';
import StretchTimer from './StretchTimer';
import StretchComplete from './StretchComplete';

// ── Props ─────────────────────────────────────────────────────

interface StretchSessionProps {
  userId: string;
  streakMultiplier?: number;
  userDifficulty?: StretchDifficulty;
}

// ── Category Config ───────────────────────────────────────────

const CATEGORY_ICONS: Record<StretchCategory, string> = {
  full_body: '🧘',
  upper_body: '💪',
  lower_body: '🦵',
  back_relief: '🔙',
  hip_opener: '🦋',
  morning: '🌅',
  post_workout: '❄️',
  desk_break: '💻',
  sleep: '🌙',
};

const DIFFICULTY_COLORS: Record<StretchDifficulty, string> = {
  beginner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  advanced: 'text-red-400 bg-red-400/10 border-red-400/20',
};

// ── Routine Card ──────────────────────────────────────────────

function RoutineCard({
  routine,
  onSelect,
  locked = false,
}: {
  routine: StretchRoutine;
  onSelect: () => void;
  locked?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: locked ? 1 : 0.97 }}
      onClick={locked ? undefined : onSelect}
      className={`
        w-full text-left rounded-2xl p-4 transition-all min-h-[100px]
        ${locked
          ? 'bg-white/[0.02] border border-white/5 opacity-50 cursor-not-allowed'
          : 'bg-white/[0.04] border border-white/10 active:bg-white/[0.08]'}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{routine.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white truncate">{routine.title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${DIFFICULTY_COLORS[routine.difficulty]}`}>
              {routine.difficulty}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5">{routine.subtitle}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
            <span>⏱ ~{routine.estimatedMinutes} min</span>
            <span>•</span>
            <span>{routine.poses.length} poses</span>
          </div>
          {locked && (
            <p className="text-xs text-red-400/60 mt-1">🔒 Unlock with more sessions</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ── Routine Detail Sheet ──────────────────────────────────────

function RoutineDetail({
  routine,
  onStart,
  onClose,
}: {
  routine: StretchRoutine;
  onStart: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#141414] rounded-t-3xl p-6 pb-safe-bottom max-h-[80vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{routine.icon}</span>
          <div>
            <h2 className="text-xl font-bold">{routine.title}</h2>
            <p className="text-sm text-white/40">{routine.subtitle}</p>
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex gap-2 mb-4">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${DIFFICULTY_COLORS[routine.difficulty]}`}>
            {routine.difficulty}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
            ⏱ {routine.estimatedMinutes} min
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
            {routine.poses.length} poses
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-white/50 mb-4">{routine.description}</p>

        {/* Benefits */}
        <div className="space-y-1 mb-4">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wide">Benefits</p>
          {routine.benefits.map((b, i) => (
            <p key={i} className="text-sm text-white/50">✓ {b}</p>
          ))}
        </div>

        {/* Pose list preview */}
        <div className="space-y-1 mb-6">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-2">Poses</p>
          {routine.poses.map((rp, i) => (
            <div
              key={rp.poseId}
              className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
            >
              <span className="text-xs text-white/20 w-5 text-right">{i + 1}</span>
              <span className="text-sm text-white/70 flex-1">{rp.pose.name}</span>
              <span className="text-xs text-white/30">
                {rp.holdSeconds}s {rp.pose.sidesCount === 2 ? '×2' : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Start button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full py-4 rounded-2xl bg-violet-600 text-white font-semibold text-lg active:bg-violet-700 transition-colors min-h-[56px]"
        >
          Start Routine
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Main StretchSession Component ─────────────────────────────

export default function StretchSession({
  userId,
  streakMultiplier = 1.0,
  userDifficulty = 'beginner',
}: StretchSessionProps) {
  const [phase, setPhase] = useState<'browse' | 'active' | 'complete'>('browse');
  const [selectedRoutine, setSelectedRoutine] = useState<StretchRoutine | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [activeSession, setActiveSession] = useState<StretchSessionType | null>(null);
  const [completedSession, setCompletedSession] = useState<StretchSessionType | null>(null);
  const [filter, setFilter] = useState<'all' | StretchDifficulty>('all');

  // ── Daily Challenge ───────────────────────────────────────

  const dailyChallenge = useMemo(() => StretchService.getDailyChallenge(), []);

  // ── Filtered Routines ─────────────────────────────────────

  const filteredRoutines = useMemo(() => {
    if (filter === 'all') return STRETCH_ROUTINE_LIBRARY;
    return getRoutinesByDifficulty(filter);
  }, [filter]);

  // ── Lock check for advanced routines ──────────────────────

  const isLocked = useCallback(
    (routine: StretchRoutine) => {
      if (routine.difficulty === 'beginner') return false;
      if (routine.difficulty === 'intermediate' && userDifficulty !== 'beginner') return false;
      if (routine.difficulty === 'advanced' && userDifficulty === 'advanced') return false;
      // Lock if user hasn't reached this difficulty
      if (routine.difficulty === 'intermediate' && userDifficulty === 'beginner') return true;
      if (routine.difficulty === 'advanced' && userDifficulty !== 'advanced') return true;
      return false;
    },
    [userDifficulty],
  );

  // ── Handlers ──────────────────────────────────────────────

  const handleSelectRoutine = useCallback((routine: StretchRoutine) => {
    setSelectedRoutine(routine);
    setShowDetail(true);
  }, []);

  const handleStartRoutine = useCallback(() => {
    if (!selectedRoutine) return;

    const session = StretchService.createSession(userId, selectedRoutine.id);
    setActiveSession(session);
    setShowDetail(false);
    setPhase('active');
  }, [selectedRoutine, userId]);

  const handleSessionUpdate = useCallback((updated: StretchSessionType) => {
    setActiveSession(updated);
  }, []);

  const handleSessionComplete = useCallback((completed: StretchSessionType) => {
    // Apply streak multiplier and recalculate XP
    const withStreak: StretchSessionType = {
      ...completed,
      xpBreakdown: {
        ...completed.xpBreakdown,
        streakMultiplier,
        totalXP: Math.round(
          (completed.xpBreakdown.baseXP +
            completed.xpBreakdown.morningBonusXP +
            completed.xpBreakdown.completionBonusXP +
            completed.xpBreakdown.durationBonusXP +
            completed.xpBreakdown.difficultyBonusXP) *
          streakMultiplier,
        ),
      },
    };

    setCompletedSession(withStreak);
    setPhase('complete');
  }, [streakMultiplier]);

  const handleCancel = useCallback(() => {
    setActiveSession(null);
    setPhase('browse');
  }, []);

  const handleReturnToBrowse = useCallback(() => {
    setActiveSession(null);
    setCompletedSession(null);
    setPhase('browse');
  }, []);

  // ── Active Session View ───────────────────────────────────

  if (phase === 'active' && activeSession) {
    return (
      <StretchTimer
        session={activeSession}
        onSessionUpdate={handleSessionUpdate}
        onComplete={handleSessionComplete}
        onCancel={handleCancel}
      />
    );
  }

  // ── Completion View ───────────────────────────────────────

  if (phase === 'complete' && completedSession) {
    return (
      <StretchComplete
        session={completedSession}
        onDone={handleReturnToBrowse}
      />
    );
  }

  // ── Browse Routines View ──────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-safe-bottom">
      {/* Header */}
      <div className="px-4 pt-safe-top pb-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Guided Stretches</h1>
          <p className="text-sm text-white/40 mt-1">Time-based routines with breathing cues</p>
        </div>

        {/* Daily Challenge Banner */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelectRoutine(dailyChallenge.routine)}
          className="w-full bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/20 rounded-2xl p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{dailyChallenge.routine.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide">
                  Daily Challenge
                </span>
                <span className="text-xs text-violet-300/50 bg-violet-500/10 px-2 py-0.5 rounded-full">
                  +{dailyChallenge.bonusXP} XP
                </span>
              </div>
              <p className="text-sm font-medium mt-0.5">{dailyChallenge.routine.title}</p>
              <p className="text-xs text-white/30">{dailyChallenge.routine.estimatedMinutes} min • {dailyChallenge.routine.poses.length} poses</p>
            </div>
            <span className="text-white/20 text-lg">→</span>
          </div>
        </motion.button>

        {/* Difficulty Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((f) => (
            <motion.button
              key={f}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap min-h-[40px] transition-all
                ${filter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-white/40 active:bg-white/10'}
              `}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Routine List */}
      <div className="px-4 space-y-3 pb-8">
        {filteredRoutines.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            onSelect={() => handleSelectRoutine(routine)}
            locked={isLocked(routine)}
          />
        ))}

        {filteredRoutines.length === 0 && (
          <div className="text-center py-12 text-white/20">
            <p className="text-3xl mb-2">🧘</p>
            <p>No routines for this filter</p>
          </div>
        )}
      </div>

      {/* Routine Detail Sheet */}
      <AnimatePresence>
        {showDetail && selectedRoutine && (
          <RoutineDetail
            routine={selectedRoutine}
            onStart={handleStartRoutine}
            onClose={() => setShowDetail(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
