'use client';

// =============================================================
// Workout Demo Page — Start & track a workout
// =============================================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutSessionView from '@/components/workout/WorkoutSession';
import ExerciseCard from '@/components/workout/ExerciseCard';
import OverloadTracker from '@/components/workout/OverloadTracker';
import {
  WorkoutService,
} from '@/lib/services/workout.service';
import {
  EXERCISE_LIBRARY,
  BENCH_PRESS,
  BARBELL_SQUAT,
  BARBELL_ROW,
  OVERHEAD_PRESS,
  DEADLIFT,
  PULL_UP,
  PUSH_UP,
  LUNGES,
  PLANK,
  BURPEES,
  getExercisesByMuscle,
  getExercisesByCategory,
  searchExercises,
} from '@/lib/constants/exercises';
import { DIFFICULTY_SCALING } from '@/types/workout';
import type {
  WorkoutSession,
  WorkoutXPBreakdown,
  PersonalRecord,
  Exercise,
} from '@/types/workout';
import type { WorkoutDifficulty } from '@/types/xp';

// ── Preset Workouts ───────────────────────────────────────────

const PRESET_WORKOUTS = [
  {
    title: 'Push Day',
    subtitle: 'Chest, Shoulders, Triceps',
    icon: '💪',
    exerciseIds: [BENCH_PRESS.id, OVERHEAD_PRESS.id, PUSH_UP.id],
    difficulty: 'intermediate' as WorkoutDifficulty,
  },
  {
    title: 'Pull Day',
    subtitle: 'Back, Biceps',
    icon: '🏋️',
    exerciseIds: [DEADLIFT.id, PULL_UP.id, BARBELL_ROW.id],
    difficulty: 'intermediate' as WorkoutDifficulty,
  },
  {
    title: 'Leg Day',
    subtitle: 'Quads, Hamstrings, Glutes',
    icon: '🦵',
    exerciseIds: [BARBELL_SQUAT.id, LUNGES.id],
    difficulty: 'intermediate' as WorkoutDifficulty,
  },
  {
    title: 'Full Body',
    subtitle: 'Total body workout',
    icon: '🔥',
    exerciseIds: [BARBELL_SQUAT.id, BENCH_PRESS.id, BARBELL_ROW.id, PLANK.id],
    difficulty: 'beginner' as WorkoutDifficulty,
  },
  {
    title: 'HIIT Blast',
    subtitle: '20 min high intensity',
    icon: '⚡',
    exerciseIds: [BURPEES.id, PUSH_UP.id, LUNGES.id, PLANK.id],
    difficulty: 'advanced' as WorkoutDifficulty,
  },
];

// ── Page States ───────────────────────────────────────────────

type PageState =
  | { view: 'home' }
  | { view: 'browse' }
  | { view: 'session'; session: WorkoutSession }
  | { view: 'results'; session: WorkoutSession; xp: WorkoutXPBreakdown; prs: PersonalRecord[] };

// ── Demo Page ─────────────────────────────────────────────────

export default function WorkoutPage() {
  const [state, setState] = useState<PageState>({ view: 'home' });
  const [searchQuery, setSearchQuery] = useState('');

  // ── Start a preset workout ──────────────────────────────────

  const startPreset = useCallback(
    (preset: typeof PRESET_WORKOUTS[0]) => {
      const scaling = DIFFICULTY_SCALING[preset.difficulty];
      const exercises = WorkoutService.buildExerciseList(
        preset.exerciseIds,
        preset.difficulty,
        scaling,
      );
      const session = WorkoutService.createSession({
        userId: 'demo-user',
        title: preset.title,
        difficulty: preset.difficulty,
        exercises,
      });
      setState({ view: 'session', session });
    },
    [],
  );

  // ── Render based on state ───────────────────────────────────

  if (state.view === 'session') {
    return (
      <WorkoutSessionView
        session={state.session}
        streakMultiplier={1.0}
        onSessionUpdate={session =>
          setState(prev =>
            prev.view === 'session' ? { ...prev, session } : prev,
          )
        }
        onComplete={result =>
          setState({
            view: 'results',
            session: result.session,
            xp: result.xpBreakdown,
            prs: result.personalRecords,
          })
        }
        onCancel={() => setState({ view: 'home' })}
      />
    );
  }

  if (state.view === 'results') {
    return (
      <Results
        session={state.session}
        xp={state.xp}
        prs={state.prs}
        onDone={() => setState({ view: 'home' })}
      />
    );
  }

  if (state.view === 'browse') {
    const filtered = searchQuery
      ? searchExercises(searchQuery)
      : EXERCISE_LIBRARY;

    return (
      <div className="min-h-screen bg-black px-4 pb-20 pt-12 text-white">
        {/* Back */}
        <button
          onClick={() => setState({ view: 'home' })}
          className="mb-4 text-sm text-indigo-400"
        >
          ← Back
        </button>

        <h1 className="mb-4 text-2xl font-bold">Exercise Library</h1>

        {/* Search */}
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="mb-4 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white outline-none ring-1 ring-zinc-800 focus:ring-indigo-500"
        />

        <p className="mb-3 text-xs text-zinc-500">
          {filtered.length} exercises
        </p>

        <div className="space-y-2">
          {filtered.map((ex, i) => (
            <ExerciseCard key={ex.id} exercise={ex} index={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Home View ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black px-4 pb-20 pt-12 text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Workout</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Choose a workout or build your own
        </p>
      </motion.div>

      {/* Quick Start Presets */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">
          Quick Start
        </h2>
        <div className="space-y-3">
          {PRESET_WORKOUTS.map((preset, i) => (
            <motion.button
              key={preset.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startPreset(preset)}
              className="flex w-full items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left active:bg-zinc-800"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-2xl">
                {preset.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{preset.title}</h3>
                <p className="text-xs text-zinc-400">{preset.subtitle}</p>
              </div>
              <div className="text-xs text-zinc-600">
                {preset.exerciseIds.length} exercises
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Browse */}
      <div className="mt-8">
        <button
          onClick={() => setState({ view: 'browse' })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 py-4 text-sm font-medium text-zinc-400 active:bg-zinc-900"
        >
          <span>📚</span> Browse Exercise Library ({EXERCISE_LIBRARY.length}{' '}
          exercises)
        </button>
      </div>
    </div>
  );
}

// ── Results Screen ────────────────────────────────────────────

function Results({
  session,
  xp,
  prs,
  onDone,
}: {
  session: WorkoutSession;
  xp: WorkoutXPBreakdown;
  prs: PersonalRecord[];
  onDone: () => void;
}) {
  const durationMin = Math.floor(session.totalDurationSeconds / 60);

  return (
    <div className="min-h-screen bg-black px-4 pb-20 pt-12 text-white">
      {/* Trophy */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/20 text-4xl"
      >
        🏆
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center text-2xl font-bold"
      >
        Workout Complete!
      </motion.h1>
      <p className="mt-1 text-center text-sm text-zinc-400">
        {session.title} • {durationMin} min
      </p>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 grid grid-cols-2 gap-3"
      >
        <StatCard label="Exercises" value={String(session.exercisesCompleted)} />
        <StatCard label="Total Sets" value={String(session.totalSets)} />
        <StatCard label="Total Reps" value={String(session.totalReps)} />
        <StatCard
          label="Volume"
          value={`${session.totalVolume.toLocaleString()} lbs`}
        />
        <StatCard
          label="Calories"
          value={`~${session.caloriesEstimated}`}
        />
        <StatCard label="Duration" value={`${durationMin} min`} />
      </motion.div>

      {/* XP Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4"
      >
        <h3 className="mb-3 text-sm font-bold text-indigo-300">
          XP Earned: +{xp.totalXP}
        </h3>
        <div className="space-y-1.5 text-xs">
          <XPRow label="Difficulty bonus" value={xp.baseDifficultyXP} />
          <XPRow label="Duration bonus" value={xp.durationBonusXP} />
          <XPRow label="Volume bonus" value={xp.volumeBonusXP} />
          <XPRow label="Completion bonus" value={xp.completionBonusXP} />
          {xp.personalRecordXP > 0 && (
            <XPRow label="PR bonus 🏆" value={xp.personalRecordXP} />
          )}
          {xp.streakMultiplier > 1 && (
            <div className="flex justify-between pt-1 border-t border-zinc-800">
              <span className="text-zinc-500">
                Streak ×{xp.streakMultiplier}
              </span>
              <span className="text-indigo-400 font-medium">
                = {xp.totalXP} XP
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Personal Records */}
      {prs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <h3 className="mb-2 text-sm font-bold text-yellow-400">
            🏆 New Personal Records!
          </h3>
          <div className="space-y-2">
            {prs.map((pr, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-yellow-500/10 px-4 py-2.5"
              >
                <div>
                  <span className="text-sm font-medium text-white">
                    {pr.exerciseName}
                  </span>
                  <span className="ml-2 text-xs text-zinc-400">
                    ({pr.type})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-yellow-400">
                    {pr.value}
                  </span>
                  <span className="ml-1 text-xs text-green-400">
                    +{pr.improvement}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Done button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileTap={{ scale: 0.95 }}
        onClick={onDone}
        className="mt-8 w-full rounded-xl bg-indigo-600 py-3.5 text-center text-base font-semibold text-white active:bg-indigo-700"
      >
        Done
      </motion.button>
    </div>
  );
}

// ── Small helper components ───────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 text-center">
      <p className="text-[10px] font-medium uppercase text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function XPRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-white">+{value}</span>
    </div>
  );
}
