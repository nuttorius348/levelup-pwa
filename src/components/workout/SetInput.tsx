'use client';

// =============================================================
// SetInput — Input row for recording a single set
// =============================================================
//
// Inline row with weight, reps, RPE inputs + complete/skip.
// Optimized for one-hand iPhone use (large touch targets).
// =============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { WorkoutSet } from '@/types/workout';

interface SetInputProps {
  set: WorkoutSet;
  isActive: boolean;
  exerciseName: string;
  onComplete: (actualReps: number, actualWeight?: number, rpe?: number) => void;
  onSkip: () => void;
  showWeight?: boolean; // Hide for bodyweight exercises
}

export default function SetInput({
  set,
  isActive,
  exerciseName,
  onComplete,
  onSkip,
  showWeight = true,
}: SetInputProps) {
  const [reps, setReps] = useState(set.actualReps ?? set.targetReps);
  const [weight, setWeight] = useState(set.actualWeight ?? set.targetWeight ?? 0);
  const [rpe, setRpe] = useState(set.rpe ?? 7);

  const typeLabel = {
    working: '',
    warmup: '🔥 Warm-up',
    dropset: '⬇ Drop',
    superset: '⚡ Superset',
    failure: '💀 Failure',
    rest_pause: '⏸ Rest-Pause',
  }[set.type];

  if (set.completed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 rounded-xl bg-green-950/20 border border-green-900/30 px-4 py-3"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-sm text-white">
          ✓
        </div>
        <span className="text-sm font-medium text-green-400">
          Set {set.setNumber}
        </span>
        <span className="ml-auto text-sm text-zinc-400">
          {set.actualWeight ? `${set.actualWeight} lbs × ` : ''}
          {set.actualReps} reps
          {set.rpe ? ` @ RPE ${set.rpe}` : ''}
        </span>
      </motion.div>
    );
  }

  if (set.skipped) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-zinc-900/50 px-4 py-3 opacity-50">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-sm text-zinc-400">
          —
        </div>
        <span className="text-sm text-zinc-500">
          Set {set.setNumber} — Skipped
        </span>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-zinc-900/30 px-4 py-3 opacity-40">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-500">
          {set.setNumber}
        </div>
        <span className="text-sm text-zinc-500">
          {set.targetReps} reps{' '}
          {set.targetWeight ? `@ ${set.targetWeight} lbs` : ''}
        </span>
        {typeLabel && (
          <span className="ml-auto text-[10px] font-medium text-zinc-600">
            {typeLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-indigo-500/40 bg-indigo-950/20 p-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
            {set.setNumber}
          </div>
          <span className="text-sm font-medium text-white">
            {typeLabel || `Set ${set.setNumber}`}
          </span>
        </div>
        <span className="text-xs text-zinc-500">
          Target: {set.targetReps} reps
        </span>
      </div>

      {/* Input row */}
      <div className="flex items-end gap-3">
        {/* Weight */}
        {showWeight && (
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Weight (lbs)
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeight(Math.max(0, weight - 5))}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 text-lg font-bold text-zinc-300 active:bg-zinc-700"
              >
                −
              </button>
              <input
                type="number"
                inputMode="decimal"
                value={weight || ''}
                onChange={e => setWeight(Number(e.target.value))}
                className="h-11 w-16 rounded-lg bg-zinc-800 text-center text-lg font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
              <button
                onClick={() => setWeight(weight + 5)}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 text-lg font-bold text-zinc-300 active:bg-zinc-700"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Reps */}
        <div className={showWeight ? 'flex-1' : 'flex-1'}>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Reps
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setReps(Math.max(0, reps - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 text-lg font-bold text-zinc-300 active:bg-zinc-700"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={reps || ''}
              onChange={e => setReps(Number(e.target.value))}
              className="h-11 w-14 rounded-lg bg-zinc-800 text-center text-lg font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
            />
            <button
              onClick={() => setReps(reps + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 text-lg font-bold text-zinc-300 active:bg-zinc-700"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* RPE slider */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            RPE (Effort)
          </label>
          <span className="text-xs font-bold text-indigo-400">
            {rpe}/10
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={rpe}
          onChange={e => setRpe(Number(e.target.value))}
          className="mt-1 w-full accent-indigo-500"
        />
        <div className="flex justify-between text-[9px] text-zinc-600">
          <span>Easy</span>
          <span>Moderate</span>
          <span>Max Effort</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onComplete(reps, showWeight ? weight : undefined, rpe)}
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white active:bg-indigo-700"
        >
          Complete Set ✓
        </motion.button>
        <button
          onClick={onSkip}
          className="rounded-xl bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-400 active:bg-zinc-700"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );
}
