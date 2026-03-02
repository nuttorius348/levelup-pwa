'use client';

// =============================================================
// WorkoutSession — Active workout tracking screen
// =============================================================
//
// Full-screen workout experience with:
//  • Current exercise header with tutorial access
//  • Set-by-set input tracking
//  • Auto-advancing rest timer overlay
//  • Progress bar across all exercises
//  • Session timer
//  • Finish workout with XP breakdown
// =============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  WorkoutSession as WorkoutSessionType,
  WorkoutXPBreakdown,
  PersonalRecord,
} from '@/types/workout';
import {
  WorkoutService,
  completeSet,
  skipSet,
  startSession,
  pauseSession,
  resumeSession,
  cancelSession,
  addSet,
} from '@/lib/services/workout.service';
import ExerciseCard from './ExerciseCard';
import SetInput from './SetInput';
import RestTimer from './RestTimer';

// ── Props ─────────────────────────────────────────────────────

interface WorkoutSessionProps {
  session: WorkoutSessionType;
  streakMultiplier?: number;
  onSessionUpdate: (session: WorkoutSessionType) => void;
  onComplete: (result: {
    session: WorkoutSessionType;
    xpBreakdown: WorkoutXPBreakdown;
    personalRecords: PersonalRecord[];
  }) => void;
  onCancel: () => void;
}

// ── Format elapsed time ───────────────────────────────────────

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Component ─────────────────────────────────────────────────

export default function WorkoutSessionView({
  session: initialSession,
  streakMultiplier = 1.0,
  onSessionUpdate,
  onComplete,
  onCancel,
}: WorkoutSessionProps) {
  const [session, setSession] = useState(initialSession);
  const [elapsed, setElapsed] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showTutorial, setShowTutorial] = useState<string | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [moodBefore, setMoodBefore] = useState<number | undefined>();
  const [moodAfter, setMoodAfter] = useState<number | undefined>();
  const [isFinishing, setIsFinishing] = useState(false);

  // ── Elapsed timer ───────────────────────────────────────────

  useEffect(() => {
    if (session.status !== 'active' && session.status !== 'resting') return;

    const interval = setInterval(() => {
      setElapsed(WorkoutService.getElapsedSeconds(session));
    }, 1000);

    return () => clearInterval(interval);
  }, [session.status, session.startedAt, session.totalRestSeconds]);

  // ── Start session on mount if idle ──────────────────────────

  useEffect(() => {
    if (session.status === 'idle') {
      const started = startSession(session);
      setSession(started);
      onSessionUpdate(started);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Show rest timer when entering resting state ─────────────

  useEffect(() => {
    if (session.status === 'resting') {
      setShowRestTimer(true);
    }
  }, [session.status]);

  // ── Derived state ───────────────────────────────────────────

  const currentExercise = session.exercises[session.currentExerciseIndex];
  const totalExercises = session.exercises.length;

  const overallProgress = useMemo(() => {
    const totalSets = session.exercises.reduce(
      (sum, ex) => sum + ex.sets.length,
      0,
    );
    const doneSets = session.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter(s => s.completed || s.skipped).length,
      0,
    );
    return totalSets > 0 ? doneSets / totalSets : 0;
  }, [session.exercises]);

  const isLastExercise =
    session.currentExerciseIndex === totalExercises - 1;
  const isBodyweight =
    currentExercise?.exercise.equipment.includes('bodyweight') ?? false;

  // ── Handlers ────────────────────────────────────────────────

  const handleCompleteSet = useCallback(
    (reps: number, weight?: number, rpe?: number) => {
      const updated = completeSet(
        session,
        session.currentExerciseIndex,
        session.currentSetIndex,
        reps,
        weight,
        rpe,
      );
      setSession(updated);
      onSessionUpdate(updated);
    },
    [session, onSessionUpdate],
  );

  const handleSkipSet = useCallback(() => {
    const updated = skipSet(
      session,
      session.currentExerciseIndex,
      session.currentSetIndex,
    );
    setSession(updated);
    onSessionUpdate(updated);
  }, [session, onSessionUpdate]);

  const handleRestComplete = useCallback(() => {
    setShowRestTimer(false);
    setSession(prev => ({ ...prev, status: 'active' }));
  }, []);

  const handleRestSkip = useCallback(() => {
    setShowRestTimer(false);
    setSession(prev => ({ ...prev, status: 'active' }));
  }, []);

  const handlePause = useCallback(() => {
    const updated = pauseSession(session);
    setSession(updated);
    onSessionUpdate(updated);
  }, [session, onSessionUpdate]);

  const handleResume = useCallback(() => {
    const updated = resumeSession(session);
    setSession(updated);
    onSessionUpdate(updated);
  }, [session, onSessionUpdate]);

  const handleAddSet = useCallback(() => {
    const updated = addSet(session, session.currentExerciseIndex);
    setSession(updated);
    onSessionUpdate(updated);
  }, [session, onSessionUpdate]);

  const handleFinish = useCallback(async () => {
    setIsFinishing(true);
    try {
      const result = await WorkoutService.completeSession(
        session,
        moodAfter,
        streakMultiplier,
      );
      onComplete(result);
    } catch (error) {
      console.error('Failed to complete workout:', error);
      setIsFinishing(false);
    }
  }, [session, moodAfter, streakMultiplier, onComplete]);

  const handleCancel = useCallback(() => {
    const cancelled = cancelSession(session);
    setSession(cancelled);
    onCancel();
  }, [session, onCancel]);

  // ── Rest timer props ────────────────────────────────────────

  const restTimerExercise = currentExercise?.exercise.name ?? '';
  const restTimerNextSet = session.currentSetIndex + 1;
  const restSeconds = currentExercise?.restBetweenSetsSeconds ?? 90;

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* ── Top Status Bar ──────────────────────────────────── */}
      <div className="safe-area-top sticky top-0 z-30 border-b border-zinc-800 bg-black/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Cancel button */}
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="text-sm font-medium text-red-400"
          >
            End
          </button>

          {/* Timer */}
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                session.status === 'active'
                  ? 'animate-pulse bg-green-500'
                  : session.status === 'paused'
                    ? 'bg-yellow-500'
                    : 'bg-zinc-500'
              }`}
            />
            <span className="font-mono text-lg font-bold tabular-nums text-white">
              {formatElapsed(elapsed)}
            </span>
          </div>

          {/* Pause / Resume */}
          <button
            onClick={session.status === 'paused' ? handleResume : handlePause}
            className="text-sm font-medium text-indigo-400"
          >
            {session.status === 'paused' ? 'Resume' : 'Pause'}
          </button>
        </div>

        {/* Overall progress bar */}
        <div className="h-1 bg-zinc-900">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress * 100}%` }}
            className="h-full bg-indigo-500"
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* ── Exercise Navigation ─────────────────────────────── */}
      <div className="sticky top-[60px] z-20 border-b border-zinc-800/50 bg-black/80 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500">
            Exercise {session.currentExerciseIndex + 1} of {totalExercises}
          </span>
          <span className="text-xs text-zinc-600">
            {(session.totalVolume ?? 0).toLocaleString()} lbs volume
          </span>
        </div>

        {/* Exercise pill navigation */}
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {session.exercises.map((ex, i) => {
            const done = ex.sets.every(s => s.completed || s.skipped);
            const active = i === session.currentExerciseIndex;
            return (
              <button
                key={ex.id}
                onClick={() =>
                  setSession(prev => ({
                    ...prev,
                    currentExerciseIndex: i,
                    currentSetIndex: 0,
                  }))
                }
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : done
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {ex.exercise.name.split(' ').slice(0, 2).join(' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
        {currentExercise && (
          <div>
            {/* Exercise header card */}
            <ExerciseCard
              exercise={currentExercise.exercise}
              workoutExercise={currentExercise}
              isActive
              onVideoTap={() =>
                setShowTutorial(
                  currentExercise.exercise.tutorialVideoUrl ?? null,
                )
              }
            />

            {/* Sets list */}
            <div className="mt-4 space-y-2">
              {currentExercise.sets.map((set, setIdx) => (
                <SetInput
                  key={set.id}
                  set={set}
                  isActive={setIdx === session.currentSetIndex}
                  exerciseName={currentExercise.exercise.name}
                  showWeight={!isBodyweight}
                  onComplete={(reps, weight, rpe) => {
                    const updated = completeSet(
                      session,
                      session.currentExerciseIndex,
                      setIdx,
                      reps,
                      weight,
                      rpe,
                    );
                    setSession(updated);
                    onSessionUpdate(updated);
                  }}
                  onSkip={() => {
                    const updated = skipSet(
                      session,
                      session.currentExerciseIndex,
                      setIdx,
                    );
                    setSession(updated);
                    onSessionUpdate(updated);
                  }}
                />
              ))}
            </div>

            {/* Add set button */}
            <button
              onClick={handleAddSet}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm font-medium text-zinc-500 active:bg-zinc-900"
            >
              <span>+</span> Add Set
            </button>

            {/* Tips */}
            {currentExercise.exercise.tips.length > 0 && (
              <div className="mt-4 rounded-xl bg-zinc-900/50 p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Pro Tips
                </p>
                {currentExercise.exercise.tips.map((tip, i) => (
                  <p key={i} className="text-xs text-zinc-400 leading-relaxed">
                    • {tip}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All exercises overview (collapsible) */}
        <div className="mt-6">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-600">
            All Exercises
          </h4>
          <div className="space-y-2">
            {session.exercises.map((ex, i) => {
              if (i === session.currentExerciseIndex) return null;
              const done = ex.sets.every(s => s.completed || s.skipped);
              return (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex.exercise}
                  workoutExercise={ex}
                  index={i}
                  isCompleted={done}
                  compact
                  onTap={() =>
                    setSession(prev => ({
                      ...prev,
                      currentExerciseIndex: i,
                      currentSetIndex: 0,
                    }))
                  }
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Action Bar ───────────────────────────────── */}
      <div className="safe-area-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-black/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Stats summary */}
          <div className="flex flex-1 gap-4 text-xs">
            <div>
              <span className="text-zinc-500">Sets</span>
              <p className="font-bold text-white">{session.totalSets}</p>
            </div>
            <div>
              <span className="text-zinc-500">Reps</span>
              <p className="font-bold text-white">{session.totalReps}</p>
            </div>
            <div>
              <span className="text-zinc-500">Volume</span>
              <p className="font-bold text-white">
                {(session.totalVolume ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Finish button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFinishConfirm(true)}
            className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white active:bg-green-700"
          >
            Finish
          </motion.button>
        </div>
      </div>

      {/* ── Rest Timer Overlay ──────────────────────────────── */}
      {showRestTimer && (
        <RestTimer
          totalSeconds={restSeconds}
          exerciseName={restTimerExercise}
          nextSetNumber={restTimerNextSet}
          onComplete={handleRestComplete}
          onSkip={handleRestSkip}
        />
      )}

      {/* ── Tutorial Video Modal ────────────────────────────── */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowTutorial(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-2xl bg-zinc-900"
            >
              <div className="aspect-video bg-zinc-800">
                <iframe
                  src={showTutorial.replace('watch?v=', 'embed/')}
                  className="h-full w-full"
                  allowFullScreen
                  title="Exercise Tutorial"
                />
              </div>
              <button
                onClick={() => setShowTutorial(null)}
                className="w-full py-3 text-center text-sm font-medium text-zinc-400"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Finish Confirmation Modal ───────────────────────── */}
      <AnimatePresence>
        {showFinishConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4"
            onClick={() => setShowFinishConfirm(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-2xl bg-zinc-900"
            >
              <div className="p-6">
                <h3 className="mb-2 text-lg font-bold text-white">
                  End Workout?
                </h3>
                <p className="mb-4 text-sm text-zinc-400">
                  {Math.round(overallProgress * 100)}% completed •{' '}
                  {formatElapsed(elapsed)} elapsed
                </p>

                {/* Mood after */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-zinc-500">
                    How are you feeling?
                  </p>
                  <div className="flex gap-2">
                    {[
                      { val: 1, emoji: '😫' },
                      { val: 2, emoji: '😐' },
                      { val: 3, emoji: '🙂' },
                      { val: 4, emoji: '😊' },
                      { val: 5, emoji: '🔥' },
                    ].map(m => (
                      <button
                        key={m.val}
                        onClick={() => setMoodAfter(m.val)}
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-xl ${
                          moodAfter === m.val
                            ? 'bg-indigo-500 ring-2 ring-indigo-400'
                            : 'bg-zinc-800'
                        }`}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleFinish}
                    disabled={isFinishing}
                    className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white active:bg-green-700 disabled:opacity-50"
                  >
                    {isFinishing ? 'Saving...' : 'Save & Finish'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full rounded-xl bg-red-600/20 py-3 text-sm font-semibold text-red-400 active:bg-red-600/30"
                  >
                    Discard Workout
                  </button>
                  <button
                    onClick={() => setShowFinishConfirm(false)}
                    className="w-full py-3 text-sm font-medium text-zinc-400"
                  >
                    Keep Going
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
