'use client';

// =============================================================
// Workout Demo Page — Start & track a workout
// =============================================================

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
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
  | { view: 'custom'; selectedExercises: Exercise[] }
  | { view: 'session'; session: WorkoutSession }
  | { view: 'results'; session: WorkoutSession; xp: WorkoutXPBreakdown; prs: PersonalRecord[] }
  | { view: 'history' }
  | { view: 'exercise-detail'; exercise: Exercise };

// ── Demo Page ─────────────────────────────────────────────────

export default function WorkoutPage() {
  const [state, setState] = useState<PageState>({ view: 'home' });
  const [searchQuery, setSearchQuery] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState<WorkoutDifficulty>('intermediate');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('chest');
  const [customCategory, setCustomCategory] = useState<'strength' | 'cardio' | 'flexibility' | 'bodyweight'>('strength');
  const [userExercises, setUserExercises] = useState<Exercise[]>([]);

  // Create a custom exercise from user input
  const addCustomExercise = useCallback(() => {
    if (!customName.trim()) return;
    const id = `custom-${Date.now()}`;
    const newEx: Exercise = {
      id,
      name: customName.trim(),
      slug: customName.trim().toLowerCase().replace(/\s+/g, '-'),
      category: customCategory,
      primaryMuscle: customMuscle as any,
      secondaryMuscles: [],
      difficulty: 'intermediate',
      equipment: customCategory === 'bodyweight' ? ['bodyweight'] : ['dumbbell'],
      instructions: ['Perform the exercise with proper form.'],
      tips: ['Focus on controlled movements.'],
      caloriesPerMinute: 6,
      isCompound: false,
      aliases: [],
    } as any;
    setUserExercises(prev => [...prev, newEx]);
    setCustomName('');
    setShowAddCustom(false);

    // Auto-add to selected if in custom builder view  
    if (state.view === 'custom') {
      setState({ view: 'custom', selectedExercises: [...state.selectedExercises, newEx] });
    }
  }, [customName, customMuscle, customCategory, state]);

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

  // ── Start a custom workout ───────────────────────────────────

  const startCustom = useCallback(
    (exercises: Exercise[], difficulty: WorkoutDifficulty) => {
      const scaling = DIFFICULTY_SCALING[difficulty];
      
      // For custom exercises not in the library, build workout exercises manually
      const workoutExercises = exercises.map((ex, index) => {
        // Try the library first
        try {
          const built = WorkoutService.buildExerciseList([ex.id], difficulty, scaling);
          if (built.length > 0) return { ...built[0], orderIndex: index };
        } catch {
          // Not in library — build manually
        }

        // Manual build for custom exercises
        const [minSets, maxSets] = scaling.setsRange;
        const [minReps, maxReps] = scaling.repsRange;
        const numSets = Math.round((minSets + maxSets) / 2);
        const targetReps = Math.round((minReps + maxReps) / 2);
        const baseRest = ex.isCompound ? 120 : 90;
        const restSeconds = Math.round(baseRest * scaling.restMultiplier);

        return {
          id: `we-${Date.now()}-${index}`,
          exerciseId: ex.id,
          exercise: ex,
          orderIndex: index,
          sets: Array.from({ length: numSets }, (_, i) => ({
            id: `set-${Date.now()}-${index}-${i}`,
            setNumber: i + 1,
            type: 'working' as const,
            targetReps,
            restAfterSeconds: restSeconds,
            rpe: scaling.rpeSuggestion,
            completed: false,
            skipped: false,
          })),
          restBetweenSetsSeconds: restSeconds,
        };
      });

      const session = WorkoutService.createSession({
        userId: 'demo-user',
        title: 'Custom Workout',
        difficulty,
        exercises: workoutExercises as any,
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

  if (state.view === 'history') {
    return (
      <WorkoutHistory
        onBack={() => setState({ view: 'home' })}
        onViewExercise={(ex) => setState({ view: 'exercise-detail', exercise: ex })}
      />
    );
  }

  if (state.view === 'exercise-detail') {
    return (
      <ExerciseProgress
        exercise={state.exercise}
        onBack={() => setState({ view: 'history' })}
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

  // ── Custom Builder View ─────────────────────────────────────

  if (state.view === 'custom') {
    const { selectedExercises } = state;
    const allExercises = [...EXERCISE_LIBRARY, ...userExercises];
    const filtered = searchQuery
      ? allExercises.filter(ex =>
          ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ex.primaryMuscle?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allExercises;

    const toggleExercise = (ex: Exercise) => {
      const exists = selectedExercises.find(e => e.id === ex.id);
      const updated = exists
        ? selectedExercises.filter(e => e.id !== ex.id)
        : [...selectedExercises, ex];
      setState({ view: 'custom', selectedExercises: updated });
    };

    const isSelected = (id: string) => selectedExercises.some(e => e.id === id);

    return (
      <div className="min-h-screen bg-black px-4 pb-20 pt-12 text-white">
        <button
          onClick={() => setState({ view: 'home' })}
          className="mb-4 text-sm text-indigo-400"
        >
          &larr; Back
        </button>

        <h1 className="mb-1 text-2xl font-bold">Build Custom Workout</h1>
        <p className="mb-4 text-xs text-zinc-400">
          Tap exercises to add/remove ({selectedExercises.length} selected)
        </p>

        {/* Difficulty Selector */}
        <div className="mb-4 flex gap-2">
          {(['beginner', 'intermediate', 'advanced'] as WorkoutDifficulty[]).map(d => (
            <button
              key={d}
              onClick={() => setCustomDifficulty(d)}
              className={`flex-1 rounded-xl py-2 text-xs font-medium capitalize transition ${
                customDifficulty === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="mb-3 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white outline-none ring-1 ring-zinc-800 focus:ring-indigo-500"
        />

        {/* Add Your Own Exercise */}
        {!showAddCustom ? (
          <button
            onClick={() => setShowAddCustom(true)}
            className="mb-4 flex w-full items-center gap-2 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-950/20 px-4 py-3 text-sm text-indigo-400 hover:bg-indigo-950/40 transition"
          >
            <span>➕</span> Add Your Own Exercise
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 rounded-xl bg-zinc-900 border border-indigo-500/30 p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-white">New Exercise</h3>
            <input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Exercise name (e.g. Cable Flyes)"
              className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <div className="flex gap-2">
              <select
                value={customMuscle}
                onChange={e => setCustomMuscle(e.target.value)}
                className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="chest">Chest</option>
                <option value="back">Back</option>
                <option value="shoulders">Shoulders</option>
                <option value="biceps">Biceps</option>
                <option value="triceps">Triceps</option>
                <option value="quadriceps">Quads</option>
                <option value="hamstrings">Hamstrings</option>
                <option value="glutes">Glutes</option>
                <option value="calves">Calves</option>
                <option value="core">Core</option>
                <option value="forearms">Forearms</option>
                <option value="full-body">Full Body</option>
              </select>
              <select
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value as any)}
                className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="strength">Strength</option>
                <option value="bodyweight">Bodyweight</option>
                <option value="cardio">Cardio</option>
                <option value="flexibility">Flexibility</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddCustom(false)}
                className="flex-1 rounded-lg bg-zinc-800 py-2 text-sm text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={addCustomExercise}
                disabled={!customName.trim()}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}

        {/* Exercise List */}
        <div className="space-y-2 pb-24">
          {filtered.map(ex => (
            <motion.button
              key={ex.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleExercise(ex)}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                isSelected(ex.id)
                  ? 'bg-indigo-600/20 ring-1 ring-indigo-500'
                  : 'bg-zinc-900/60 ring-1 ring-zinc-800'
              }`}
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                isSelected(ex.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'
              }`}>
                {isSelected(ex.id) && <span className="text-white text-xs">&#10003;</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{ex.name}</h3>
                <p className="text-[10px] text-zinc-500 capitalize">
                  {(ex as any).primaryMuscles?.join(', ') ?? ex.primaryMuscle} &middot; {ex.category}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Start Button (fixed bottom) */}
        {selectedExercises.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startCustom(selectedExercises, customDifficulty)}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-center text-base font-semibold text-white active:bg-indigo-700"
            >
              Start Workout ({selectedExercises.length} exercises)
            </motion.button>
          </div>
        )}
      </div>
    );
  }

  // ── Home View ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black px-4 pb-20 pt-12 text-white">
      {/* Back + Header */}
      <Link href="/dashboard" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors mb-3">
        <span className="text-lg leading-none">‹</span>
        <span>Back</span>
      </Link>
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

      {/* Custom Workout */}
      <div className="mt-6">
        <button
          onClick={() => setState({ view: 'custom', selectedExercises: [] })}
          className="flex w-full items-center gap-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 text-left active:bg-indigo-950/40"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-2xl">
            🛠️
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Custom Workout</h3>
            <p className="text-xs text-zinc-400">Pick your own exercises</p>
          </div>
          <span className="text-indigo-400 text-sm">&rarr;</span>
        </button>
      </div>

      {/* Browse */}
      <div className="mt-4">
        <button
          onClick={() => setState({ view: 'browse' })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 py-4 text-sm font-medium text-zinc-400 active:bg-zinc-900"
        >
          <span>📚</span> Browse Exercise Library ({EXERCISE_LIBRARY.length}{' '}
          exercises)
        </button>
      </div>

      {/* Past Workouts / History */}
      <div className="mt-4">
        <button
          onClick={() => setState({ view: 'history' })}
          className="flex w-full items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-left active:bg-emerald-950/40"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/20 text-2xl">
            📊
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Past Workouts</h3>
            <p className="text-xs text-zinc-400">Review progress & track improvements</p>
          </div>
          <span className="text-emerald-400 text-sm">&rarr;</span>
        </button>
      </div>
    </div>
  );
}

// ── Workout History Screen ────────────────────────────────────

interface HistoryEntry {
  id: string;
  title: string;
  difficulty: string;
  durationMinutes: number;
  totalVolume: number;
  exerciseCount: number;
  xpEarned: number;
  completedAt: string;
}

function WorkoutHistory({
  onBack,
  onViewExercise,
}: {
  onBack: () => void;
  onViewExercise: (ex: Exercise) => void;
}) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'history' | 'exercises'>('history');

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const res = await fetch(`/api/workout/history?userId=${user.id}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history ?? []);
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-black px-4 pb-20 pt-12 text-white">
      <button onClick={onBack} className="mb-4 text-sm text-indigo-400">
        &larr; Back
      </button>
      <h1 className="mb-1 text-2xl font-bold">Workout History</h1>
      <p className="mb-4 text-xs text-zinc-400">Review past sessions and track improvements</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
            tab === 'history' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400'
          }`}
        >
          📅 Past Workouts
        </button>
        <button
          onClick={() => setTab('exercises')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
            tab === 'exercises' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400'
          }`}
        >
          💪 By Exercise
        </button>
      </div>

      {tab === 'history' && (
        <>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-zinc-900 animate-pulse" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <div className="text-5xl mb-3">🏋️</div>
              <p className="font-medium">No workouts yet</p>
              <p className="text-sm mt-1">Complete a workout to see it here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, i) => {
                const date = new Date(entry.completedAt);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{entry.title}</h3>
                      <span className="text-xs text-zinc-500">{dateStr} · {timeStr}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-zinc-400">
                      <span>⏱ {entry.durationMinutes} min</span>
                      <span>🏋️ {entry.exerciseCount} exercises</span>
                      {(entry.totalVolume ?? 0) > 0 && <span>📊 {(entry.totalVolume ?? 0).toLocaleString()} lbs</span>}
                      <span className="text-indigo-400 ml-auto">+{entry.xpEarned} XP</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'exercises' && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 mb-3">Tap an exercise to see your progress over time</p>
          {EXERCISE_LIBRARY.map(ex => (
            <motion.button
              key={ex.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onViewExercise(ex)}
              className="flex w-full items-center gap-3 rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 text-left hover:border-indigo-500/30 transition"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{ex.name}</h3>
                <p className="text-[10px] text-zinc-500 capitalize">{ex.primaryMuscle} · {ex.category}</p>
              </div>
              <span className="text-zinc-600 text-sm">→</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Exercise Progress Detail Screen ───────────────────────────

interface OverloadEntry {
  date: string;
  maxWeight: number;
  maxReps: number;
  totalSets: number;
  totalVolume: number;
}

function ExerciseProgress({
  exercise,
  onBack,
}: {
  exercise: Exercise;
  onBack: () => void;
}) {
  const [entries, setEntries] = useState<OverloadEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const res = await fetch(`/api/workout/overload?userId=${user.id}&exerciseId=${exercise.id}&limit=30`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.history ?? []);
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    load();
  }, [exercise.id]);

  // Calculate improvement stats
  const first = entries[entries.length - 1];
  const last = entries[0];
  const weightImproved = first && last ? (last.maxWeight ?? 0) - (first.maxWeight ?? 0) : 0;
  const repsImproved = first && last ? (last.maxReps ?? 0) - (first.maxReps ?? 0) : 0;
  const volumeImproved = first && last ? (last.totalVolume ?? 0) - (first.totalVolume ?? 0) : 0;

  return (
    <div className="min-h-screen bg-black px-4 pb-20 pt-12 text-white">
      <button onClick={onBack} className="mb-4 text-sm text-indigo-400">
        &larr; Back to History
      </button>

      <h1 className="mb-1 text-xl font-bold">{exercise.name}</h1>
      <p className="mb-4 text-xs text-zinc-400 capitalize">{exercise.primaryMuscle} · {exercise.category}</p>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-zinc-900 animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <div className="text-5xl mb-3">📊</div>
          <p className="font-medium">No data yet for {exercise.name}</p>
          <p className="text-sm mt-1">Complete a workout with this exercise to track progress!</p>
        </div>
      ) : (
        <>
          {/* Improvement Summary */}
          {entries.length >= 2 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 text-center">
                <p className="text-[10px] text-zinc-500 uppercase">Weight</p>
                <p className={`text-lg font-bold ${weightImproved > 0 ? 'text-green-400' : weightImproved < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                  {weightImproved > 0 ? '+' : ''}{weightImproved} lbs
                </p>
              </div>
              <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 text-center">
                <p className="text-[10px] text-zinc-500 uppercase">Reps</p>
                <p className={`text-lg font-bold ${repsImproved > 0 ? 'text-green-400' : repsImproved < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                  {repsImproved > 0 ? '+' : ''}{repsImproved}
                </p>
              </div>
              <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 text-center">
                <p className="text-[10px] text-zinc-500 uppercase">Volume</p>
                <p className={`text-lg font-bold ${volumeImproved > 0 ? 'text-green-400' : volumeImproved < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                  {volumeImproved > 0 ? '+' : ''}{(volumeImproved ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Progress Chart (simple bar visualization) */}
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">Session History</h3>
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const maxVol = Math.max(...entries.map(e => e.totalVolume ?? 0), 1);
              const pct = Math.round(((entry.totalVolume ?? 0) / maxVol) * 100);
              const date = new Date(entry.date);
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-zinc-500">{dateStr}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-zinc-400">{entry.maxWeight ?? 0} lbs × {entry.maxReps ?? 0} reps</span>
                      <span className="text-zinc-500">{entry.totalSets ?? 0} sets</span>
                    </div>
                  </div>
                  {/* Volume bar */}
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className={`h-full rounded-full ${
                        i === 0 ? 'bg-indigo-500' : 'bg-zinc-600'
                      }`}
                    />
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-[10px] text-zinc-500">{(entry.totalVolume ?? 0).toLocaleString()} lbs volume</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
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
          value={`${(session.totalVolume ?? 0).toLocaleString()} lbs`}
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
