'use client';

// =============================================================
// ExerciseCard — Preview card for an exercise
// =============================================================
//
// Shows:
//  • Exercise name + muscle group badge
//  • Tutorial video thumbnail with play icon
//  • Equipment tags
//  • Difficulty indicator
//  • Set × Rep preview
//  • Compound/Isolation label
// =============================================================

import { motion } from 'framer-motion';
import type { Exercise, WorkoutExercise } from '@/types/workout';

// ── Difficulty colors ─────────────────────────────────────────

const DIFFICULTY_COLORS = {
  beginner: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Beginner' },
  intermediate: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Intermediate' },
  advanced: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Advanced' },
};

// ── Muscle group colors ───────────────────────────────────────

const MUSCLE_COLORS: Record<string, string> = {
  chest: 'bg-blue-500/20 text-blue-400',
  back: 'bg-purple-500/20 text-purple-400',
  shoulders: 'bg-orange-500/20 text-orange-400',
  biceps: 'bg-pink-500/20 text-pink-400',
  triceps: 'bg-rose-500/20 text-rose-400',
  forearms: 'bg-amber-500/20 text-amber-400',
  core: 'bg-cyan-500/20 text-cyan-400',
  quads: 'bg-emerald-500/20 text-emerald-400',
  hamstrings: 'bg-teal-500/20 text-teal-400',
  glutes: 'bg-fuchsia-500/20 text-fuchsia-400',
  calves: 'bg-lime-500/20 text-lime-400',
  full_body: 'bg-indigo-500/20 text-indigo-400',
  cardio: 'bg-red-500/20 text-red-400',
};

// ── Props ─────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: Exercise;
  workoutExercise?: WorkoutExercise; // If showing within a workout plan
  index?: number;
  isActive?: boolean;
  isCompleted?: boolean;
  onTap?: () => void;
  onVideoTap?: () => void;
  compact?: boolean;
}

// ── Component ─────────────────────────────────────────────────

export default function ExerciseCard({
  exercise,
  workoutExercise,
  index,
  isActive = false,
  isCompleted = false,
  onTap,
  onVideoTap,
  compact = false,
}: ExerciseCardProps) {
  const diff = DIFFICULTY_COLORS[exercise.difficulty];
  const muscleColor = MUSCLE_COLORS[exercise.primaryMuscle] ?? 'bg-zinc-700 text-zinc-300';

  const completedSets = workoutExercise
    ? workoutExercise.sets.filter(s => s.completed).length
    : 0;
  const totalSets = workoutExercise ? workoutExercise.sets.length : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index ?? 0) * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className={`relative overflow-hidden rounded-2xl border transition-colors ${
        isActive
          ? 'border-indigo-500/50 bg-indigo-950/30'
          : isCompleted
            ? 'border-green-500/30 bg-green-950/20'
            : 'border-zinc-800 bg-zinc-900/50'
      } ${onTap ? 'cursor-pointer active:bg-zinc-800/80' : ''} ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      {/* Completed check overlay */}
      {isCompleted && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
          <span className="text-xs text-white">✓</span>
        </div>
      )}

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeExercise"
          className="absolute left-0 top-0 h-full w-1 rounded-r bg-indigo-500"
        />
      )}

      <div className="flex items-start gap-3">
        {/* Index number */}
        {typeof index === 'number' && (
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
              isActive
                ? 'bg-indigo-500 text-white'
                : isCompleted
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {index + 1}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2">
            <h3
              className={`truncate font-semibold ${
                compact ? 'text-sm' : 'text-base'
              } ${isCompleted ? 'text-zinc-400' : 'text-white'}`}
            >
              {exercise.name}
            </h3>
            {exercise.isCompound && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Compound
              </span>
            )}
          </div>

          {/* Badges row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {/* Muscle group */}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${muscleColor}`}
            >
              {exercise.primaryMuscle.replace('_', ' ')}
            </span>

            {/* Difficulty */}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${diff.bg} ${diff.text}`}
            >
              {diff.label}
            </span>

            {/* Calories */}
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
              ~{exercise.caloriesPerMinute} cal/min
            </span>
          </div>

          {/* Equipment */}
          {!compact && exercise.equipment.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {exercise.equipment.map(eq => (
                <span
                  key={eq}
                  className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-500"
                >
                  {eq}
                </span>
              ))}
            </div>
          )}

          {/* Sets preview */}
          {workoutExercise && (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs text-zinc-400">
                {completedSets}/{totalSets} sets
              </span>

              {/* Mini progress bar */}
              <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: totalSets > 0
                      ? `${(completedSets / totalSets) * 100}%`
                      : '0%',
                  }}
                  className={`h-full rounded-full ${
                    completedSets === totalSets && totalSets > 0
                      ? 'bg-green-500'
                      : 'bg-indigo-500'
                  }`}
                />
              </div>

              {workoutExercise.sets[0] && (
                <span className="text-xs text-zinc-500">
                  {workoutExercise.sets[0].targetReps} reps
                </span>
              )}
            </div>
          )}

          {/* Video button */}
          {!compact && exercise.tutorialVideoUrl && (
            <button
              onClick={e => {
                e.stopPropagation();
                onVideoTap?.();
              }}
              className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-indigo-400 active:bg-zinc-700"
            >
              <span>▶</span>
              <span>Watch Tutorial</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary muscles (expanded view) */}
      {!compact && exercise.secondaryMuscles.length > 0 && (
        <div className="mt-2 pl-11">
          <span className="text-[10px] text-zinc-600">
            Also targets:{' '}
            {exercise.secondaryMuscles
              .map(m => m.replace('_', ' '))
              .join(', ')}
          </span>
        </div>
      )}
    </motion.div>
  );
}
