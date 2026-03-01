// =============================================================
// Workout Engine Service — Session management, XP, overload
// =============================================================
//
// Core responsibilities:
//  • Create & manage workout sessions
//  • Track sets, reps, weight in real-time
//  • Calculate XP with full breakdown
//  • Detect personal records
//  • Generate progressive overload suggestions
//  • Persist to Supabase
// =============================================================

import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  WorkoutXPBreakdown,
  WorkoutTemplate,
  ProgressiveOverloadRecord,
  PersonalRecord,
  OverloadSuggestion,
  WorkoutStats,
  WorkoutHistoryEntry,
  DifficultyScaling,
  WorkoutStatus,
  SetType,
  DIFFICULTY_SCALING,
} from '@/types/workout';
import type { WorkoutDifficulty, XPActionType } from '@/types/xp';
import { WORKOUT_XP_BY_DIFFICULTY } from '@/lib/constants/xp';
import { getExerciseById } from '@/lib/constants/exercises';
import { createAdminClient } from '@/lib/supabase/admin';

// ── Constants ─────────────────────────────────────────────────

const VOLUME_BONUS_THRESHOLD = 10000;  // lbs total volume for bonus
const VOLUME_BONUS_XP = 15;
const COMPLETION_BONUS_XP = 20;        // Finish all exercises
const PR_BONUS_XP = 25;               // Per personal record
const DURATION_XP_PER_MINUTE = 1;
const DURATION_XP_CAP = 60;
const CALORIES_PER_MINUTE_DEFAULT = 5;

// ── Helper: Generate IDs ──────────────────────────────────────

function generateId(prefix: string = 'ws'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ── Helper: Epley 1RM formula ─────────────────────────────────

export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  // Epley formula: 1RM = weight × (1 + reps / 30)
  return Math.round(weight * (1 + reps / 30));
}

// ══════════════════════════════════════════════════════════════
// WORKOUT SERVICE
// ══════════════════════════════════════════════════════════════

export class WorkoutService {

  // ────────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ────────────────────────────────────────────────────────────

  /**
   * Create a new workout session from a template or exercise list.
   */
  static createSession(params: {
    userId: string;
    title: string;
    difficulty: WorkoutDifficulty;
    exercises: WorkoutExercise[];
    templateId?: string;
  }): WorkoutSession {
    const { userId, title, difficulty, exercises, templateId } = params;

    return {
      id: generateId('ws'),
      userId,
      templateId,
      title,
      difficulty,
      status: 'idle',
      exercises,

      // Timing
      startedAt: '',
      totalDurationSeconds: 0,
      activeDurationSeconds: 0,
      totalRestSeconds: 0,

      // Current state
      currentExerciseIndex: 0,
      currentSetIndex: 0,

      // Results
      totalVolume: 0,
      totalReps: 0,
      totalSets: 0,
      caloriesEstimated: 0,
      exercisesCompleted: 0,

      // XP
      xpBreakdown: {
        baseDifficultyXP: 0,
        durationBonusXP: 0,
        volumeBonusXP: 0,
        completionBonusXP: 0,
        personalRecordXP: 0,
        streakMultiplier: 1.0,
        totalXP: 0,
        coinsEarned: 0,
      },
    };
  }

  /**
   * Create workout exercises from an array of exercise IDs with default sets.
   */
  static buildExerciseList(
    exerciseIds: string[],
    difficulty: WorkoutDifficulty,
    scaling: DifficultyScaling,
  ): WorkoutExercise[] {
    return exerciseIds.map((exId, index) => {
      const exercise = getExerciseById(exId);
      if (!exercise) throw new Error(`Exercise not found: ${exId}`);

      const [minSets, maxSets] = scaling.setsRange;
      const [minReps, maxReps] = scaling.repsRange;
      const numSets = Math.round((minSets + maxSets) / 2);
      const targetReps = Math.round((minReps + maxReps) / 2);

      const baseRest = exercise.isCompound ? 120 : 90;
      const restSeconds = Math.round(baseRest * scaling.restMultiplier);

      const sets: WorkoutSet[] = Array.from({ length: numSets }, (_, i) => ({
        id: generateId('set'),
        setNumber: i + 1,
        type: 'working' as SetType,
        targetReps,
        restAfterSeconds: restSeconds,
        rpe: scaling.rpeSuggestion,
        completed: false,
        skipped: false,
      }));

      return {
        id: generateId('we'),
        exerciseId: exId,
        exercise,
        orderIndex: index,
        sets,
        restBetweenSetsSeconds: restSeconds,
      };
    });
  }

  /**
   * Start a workout session.
   */
  static startSession(session: WorkoutSession): WorkoutSession {
    return {
      ...session,
      status: 'active',
      startedAt: new Date().toISOString(),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
    };
  }

  /**
   * Pause the session.
   */
  static pauseSession(session: WorkoutSession): WorkoutSession {
    return {
      ...session,
      status: 'paused',
      pausedAt: new Date().toISOString(),
    };
  }

  /**
   * Resume a paused session.
   */
  static resumeSession(session: WorkoutSession): WorkoutSession {
    // Calculate paused duration and add to rest time
    let additionalRest = 0;
    if (session.pausedAt) {
      additionalRest = Math.floor(
        (Date.now() - new Date(session.pausedAt).getTime()) / 1000,
      );
    }

    return {
      ...session,
      status: 'active',
      pausedAt: undefined,
      totalRestSeconds: session.totalRestSeconds + additionalRest,
    };
  }

  /**
   * Cancel a session (no XP awarded).
   */
  static cancelSession(session: WorkoutSession): WorkoutSession {
    return {
      ...session,
      status: 'cancelled',
      completedAt: new Date().toISOString(),
    };
  }

  // ────────────────────────────────────────────────────────────
  // SET TRACKING
  // ────────────────────────────────────────────────────────────

  /**
   * Record a completed set with actual reps and weight.
   */
  static completeSet(
    session: WorkoutSession,
    exerciseIndex: number,
    setIndex: number,
    actualReps: number,
    actualWeight?: number,
    rpe?: number,
    notes?: string,
  ): WorkoutSession {
    const exercises = [...session.exercises];
    const exercise = { ...exercises[exerciseIndex] };
    const sets = [...exercise.sets];
    const set = { ...sets[setIndex] };

    set.actualReps = actualReps;
    set.actualWeight = actualWeight;
    set.rpe = rpe ?? set.rpe;
    set.notes = notes;
    set.completed = true;
    set.skipped = false;

    sets[setIndex] = set;
    exercise.sets = sets;
    exercises[exerciseIndex] = exercise;

    // Recalculate session totals
    const { totalVolume, totalReps, totalSets } =
      WorkoutService.calculateTotals(exercises);

    // Check if all sets for current exercise are done
    const allSetsDone = exercise.sets.every(s => s.completed || s.skipped);
    let exercisesCompleted = session.exercisesCompleted;
    if (allSetsDone) exercisesCompleted++;

    // Auto-advance to next set or exercise
    let nextExerciseIndex = exerciseIndex;
    let nextSetIndex = setIndex + 1;

    if (nextSetIndex >= exercise.sets.length) {
      // Move to next exercise
      nextExerciseIndex = exerciseIndex + 1;
      nextSetIndex = 0;
    }

    return {
      ...session,
      exercises,
      totalVolume,
      totalReps,
      totalSets,
      exercisesCompleted,
      currentExerciseIndex: Math.min(nextExerciseIndex, exercises.length - 1),
      currentSetIndex: nextSetIndex,
      status: 'resting', // Trigger rest timer
      restTimerEndAt: new Date(
        Date.now() + set.restAfterSeconds * 1000,
      ).toISOString(),
    };
  }

  /**
   * Skip a set.
   */
  static skipSet(
    session: WorkoutSession,
    exerciseIndex: number,
    setIndex: number,
  ): WorkoutSession {
    const exercises = [...session.exercises];
    const exercise = { ...exercises[exerciseIndex] };
    const sets = [...exercise.sets];
    sets[setIndex] = { ...sets[setIndex], skipped: true, completed: false };
    exercise.sets = sets;
    exercises[exerciseIndex] = exercise;

    // Auto-advance
    let nextExerciseIndex = exerciseIndex;
    let nextSetIndex = setIndex + 1;

    if (nextSetIndex >= exercise.sets.length) {
      nextExerciseIndex = exerciseIndex + 1;
      nextSetIndex = 0;
    }

    const allSetsDone = exercise.sets.every(s => s.completed || s.skipped);
    let exercisesCompleted = session.exercisesCompleted;
    if (allSetsDone) exercisesCompleted++;

    return {
      ...session,
      exercises,
      exercisesCompleted,
      currentExerciseIndex: Math.min(nextExerciseIndex, exercises.length - 1),
      currentSetIndex: nextSetIndex,
      status: 'active',
    };
  }

  /**
   * Add an extra set to an exercise (e.g., user wants to do more).
   */
  static addSet(
    session: WorkoutSession,
    exerciseIndex: number,
    type: SetType = 'working',
  ): WorkoutSession {
    const exercises = [...session.exercises];
    const exercise = { ...exercises[exerciseIndex] };
    const lastSet = exercise.sets[exercise.sets.length - 1];

    const newSet: WorkoutSet = {
      id: generateId('set'),
      setNumber: exercise.sets.length + 1,
      type,
      targetReps: lastSet?.targetReps ?? 10,
      restAfterSeconds: lastSet?.restAfterSeconds ?? 90,
      completed: false,
      skipped: false,
    };

    exercise.sets = [...exercise.sets, newSet];
    exercises[exerciseIndex] = exercise;

    return { ...session, exercises };
  }

  // ────────────────────────────────────────────────────────────
  // SESSION COMPLETION
  // ────────────────────────────────────────────────────────────

  /**
   * Complete a workout session — calculates XP, detects PRs.
   */
  static async completeSession(
    session: WorkoutSession,
    moodAfter?: number,
    streakMultiplier: number = 1.0,
  ): Promise<{
    session: WorkoutSession;
    xpBreakdown: WorkoutXPBreakdown;
    personalRecords: PersonalRecord[];
  }> {
    const now = new Date();
    const startedAt = new Date(session.startedAt);
    const totalSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    const durationMinutes = Math.floor(totalSeconds / 60);

    // Calculate calories
    const avgCalPerMin =
      session.exercises.reduce(
        (sum, ex) => sum + (ex.exercise.caloriesPerMinute || CALORIES_PER_MINUTE_DEFAULT),
        0,
      ) / Math.max(session.exercises.length, 1);
    const caloriesEstimated = Math.round(avgCalPerMin * durationMinutes);

    // Calculate totals
    const { totalVolume, totalReps, totalSets } =
      WorkoutService.calculateTotals(session.exercises);

    // XP Breakdown
    const xpBreakdown = WorkoutService.calculateXP(
      session.difficulty,
      durationMinutes,
      totalVolume,
      session.exercises,
      streakMultiplier,
    );

    // Personal records
    const personalRecords = await WorkoutService.detectPersonalRecords(
      session.userId,
      session.exercises,
      session.id,
    );

    // Add PR bonus
    if (personalRecords.length > 0) {
      xpBreakdown.personalRecordXP = personalRecords.length * PR_BONUS_XP;
      xpBreakdown.totalXP += xpBreakdown.personalRecordXP;
    }

    // Apply streak multiplier to total
    const preStreakXP = xpBreakdown.totalXP;
    xpBreakdown.totalXP = Math.round(preStreakXP * streakMultiplier);
    xpBreakdown.coinsEarned = Math.floor(xpBreakdown.totalXP / 5);

    const completedSession: WorkoutSession = {
      ...session,
      status: 'completed',
      completedAt: now.toISOString(),
      totalDurationSeconds: totalSeconds,
      activeDurationSeconds: totalSeconds - session.totalRestSeconds,
      totalVolume,
      totalReps,
      totalSets,
      caloriesEstimated,
      moodAfter,
      xpBreakdown,
      exercisesCompleted: session.exercises.filter(ex =>
        ex.sets.some(s => s.completed),
      ).length,
    };

    return {
      session: completedSession,
      xpBreakdown,
      personalRecords,
    };
  }

  // ────────────────────────────────────────────────────────────
  // XP CALCULATION
  // ────────────────────────────────────────────────────────────

  /**
   * Calculate full XP breakdown for a workout.
   */
  static calculateXP(
    difficulty: WorkoutDifficulty,
    durationMinutes: number,
    totalVolume: number,
    exercises: WorkoutExercise[],
    streakMultiplier: number = 1.0,
  ): WorkoutXPBreakdown {
    // 1. Base difficulty XP
    const baseDifficultyXP = WORKOUT_XP_BY_DIFFICULTY[difficulty].baseXP;

    // 2. Duration bonus (1 XP/min, cap 60)
    const durationBonusXP = Math.min(
      durationMinutes * DURATION_XP_PER_MINUTE,
      DURATION_XP_CAP,
    );

    // 3. Volume bonus (bonus XP if over threshold)
    const volumeBonusXP = totalVolume >= VOLUME_BONUS_THRESHOLD
      ? VOLUME_BONUS_XP
      : 0;

    // 4. Completion bonus (all sets of all exercises done)
    const allCompleted = exercises.every(ex =>
      ex.sets.every(s => s.completed || s.type === 'warmup'),
    );
    const completionBonusXP = allCompleted ? COMPLETION_BONUS_XP : 0;

    // PR bonus is added later after detection
    const personalRecordXP = 0;

    const subtotal = baseDifficultyXP + durationBonusXP + volumeBonusXP + completionBonusXP;

    return {
      baseDifficultyXP,
      durationBonusXP,
      volumeBonusXP,
      completionBonusXP,
      personalRecordXP,
      streakMultiplier,
      totalXP: subtotal, // Streak multiplier applied after PR detection
      coinsEarned: Math.floor(subtotal / 5),
    };
  }

  // ────────────────────────────────────────────────────────────
  // PERSONAL RECORDS
  // ────────────────────────────────────────────────────────────

  /**
   * Detect personal records from completed exercises.
   */
  static async detectPersonalRecords(
    userId: string,
    exercises: WorkoutExercise[],
    workoutLogId: string,
  ): Promise<PersonalRecord[]> {
    const supabase = createAdminClient();
    const records: PersonalRecord[] = [];

    for (const exercise of exercises) {
      const completedSets = exercise.sets.filter(s => s.completed && s.actualWeight);

      if (completedSets.length === 0) continue;

      // Find best set in this workout
      const bestWeight = Math.max(...completedSets.map(s => s.actualWeight ?? 0));
      const bestReps = completedSets.reduce(
        (max, s) => Math.max(max, s.actualReps ?? 0),
        0,
      );
      const bestVolume = completedSets.reduce(
        (max, s) => Math.max(max, (s.actualWeight ?? 0) * (s.actualReps ?? 0)),
        0,
      );

      // Best estimated 1RM from any set
      const best1RM = completedSets.reduce((max, s) => {
        const e1rm = estimateOneRepMax(s.actualWeight ?? 0, s.actualReps ?? 0);
        return Math.max(max, e1rm);
      }, 0);

      // Fetch previous records from DB
      const { data: prevRecords } = await supabase
        .from('workout_personal_records')
        .select('type, value')
        .eq('user_id', userId)
        .eq('exercise_id', exercise.exerciseId);

      const prevMap = new Map<string, number>();
      prevRecords?.forEach(r => prevMap.set(r.type, r.value));

      // Check each record type
      const checks: Array<{ type: PersonalRecord['type']; value: number }> = [
        { type: 'weight', value: bestWeight },
        { type: 'reps', value: bestReps },
        { type: 'volume', value: bestVolume },
        { type: '1rm', value: best1RM },
      ];

      for (const check of checks) {
        const previous = prevMap.get(check.type) ?? 0;
        if (check.value > previous && check.value > 0) {
          records.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exercise.name,
            type: check.type,
            value: check.value,
            previousValue: previous,
            improvement: check.value - previous,
            date: new Date().toISOString(),
            workoutLogId,
          });
        }
      }
    }

    return records;
  }

  /**
   * Save personal records to the database.
   */
  static async savePersonalRecords(
    userId: string,
    records: PersonalRecord[],
  ): Promise<void> {
    const supabase = createAdminClient();

    for (const record of records) {
      await supabase
        .from('workout_personal_records')
        .upsert(
          {
            user_id: userId,
            exercise_id: record.exerciseId,
            type: record.type,
            value: record.value,
            achieved_at: record.date,
            workout_log_id: record.workoutLogId,
          },
          { onConflict: 'user_id,exercise_id,type' },
        );
    }
  }

  // ────────────────────────────────────────────────────────────
  // PROGRESSIVE OVERLOAD
  // ────────────────────────────────────────────────────────────

  /**
   * Get progressive overload history for an exercise.
   */
  static async getOverloadHistory(
    userId: string,
    exerciseId: string,
    limit: number = 20,
  ): Promise<ProgressiveOverloadRecord[]> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('workout_overload_history')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      exerciseId: row.exercise_id,
      date: row.date,
      bestWeight: row.best_weight,
      bestReps: row.best_reps,
      bestVolume: row.best_volume,
      totalVolume: row.total_volume,
      estimated1RM: row.estimated_1rm,
      sets: row.sets,
      difficulty: row.difficulty,
    }));
  }

  /**
   * Record overload data for an exercise from the current session.
   */
  static async recordOverload(
    userId: string,
    exercise: WorkoutExercise,
    difficulty: WorkoutDifficulty,
  ): Promise<void> {
    const supabase = createAdminClient();
    const completedSets = exercise.sets.filter(s => s.completed);

    if (completedSets.length === 0) return;

    const bestWeight = Math.max(...completedSets.map(s => s.actualWeight ?? 0));
    const bestReps = Math.max(...completedSets.map(s => s.actualReps ?? 0));
    const bestVolume = Math.max(
      ...completedSets.map(s => (s.actualWeight ?? 0) * (s.actualReps ?? 0)),
    );
    const totalVolume = completedSets.reduce(
      (sum, s) => sum + (s.actualWeight ?? 0) * (s.actualReps ?? 0),
      0,
    );
    const estimated1RM = completedSets.reduce(
      (max, s) => Math.max(max, estimateOneRepMax(s.actualWeight ?? 0, s.actualReps ?? 0)),
      0,
    );

    await supabase.from('workout_overload_history').insert({
      user_id: userId,
      exercise_id: exercise.exerciseId,
      date: new Date().toISOString().split('T')[0],
      best_weight: bestWeight,
      best_reps: bestReps,
      best_volume: bestVolume,
      total_volume: totalVolume,
      estimated_1rm: estimated1RM,
      sets: completedSets.length,
      difficulty,
    });
  }

  /**
   * Generate overload suggestions for next workout.
   */
  static async getOverloadSuggestions(
    userId: string,
    exerciseIds: string[],
  ): Promise<OverloadSuggestion[]> {
    const suggestions: OverloadSuggestion[] = [];

    for (const exerciseId of exerciseIds) {
      const history = await WorkoutService.getOverloadHistory(userId, exerciseId, 5);

      if (history.length < 2) {
        // Not enough data — maintain current
        continue;
      }

      const latest = history[0];
      const previous = history[1];

      // Determine strategy based on recent progression
      const weightProgressing = latest.bestWeight > previous.bestWeight;
      const repsProgressing = latest.bestReps > previous.bestReps;
      const volumeProgressing = latest.totalVolume > previous.totalVolume;

      let strategy: OverloadSuggestion['strategy'] = 'weight';
      let suggestedWeight = latest.bestWeight;
      let suggestedReps = latest.bestReps;
      let suggestedSets = latest.sets;
      let reasoning = '';

      if (!weightProgressing && !repsProgressing) {
        // Stalled — suggest more reps first, then weight
        if (latest.bestReps < 12) {
          strategy = 'reps';
          suggestedReps = latest.bestReps + 1;
          reasoning = `You hit ${latest.bestReps} reps last time. Try for ${suggestedReps} at the same weight before increasing load.`;
        } else {
          strategy = 'weight';
          suggestedWeight = Math.round(latest.bestWeight * 1.05); // 5% increase
          suggestedReps = Math.max(latest.bestReps - 2, 6);
          reasoning = `You're hitting 12+ reps. Time to increase weight by ~5% and drop reps to ${suggestedReps}.`;
        }
      } else if (weightProgressing) {
        // Keep pushing weight
        strategy = 'weight';
        suggestedWeight = Math.round(latest.bestWeight * 1.025); // 2.5% increase
        reasoning = `Great progress on weight! Try ${suggestedWeight} lbs next time.`;
      } else if (repsProgressing && !volumeProgressing) {
        // Reps going up but volume flat — add a set
        strategy = 'sets';
        suggestedSets = latest.sets + 1;
        reasoning = `Reps are improving. Add an extra set (${suggestedSets} total) to boost volume.`;
      } else {
        // Good overall progression — small weight bump
        strategy = 'weight';
        suggestedWeight = Math.round(latest.bestWeight * 1.025);
        reasoning = `Solid progress across the board. Bump weight slightly to ${suggestedWeight} lbs.`;
      }

      suggestions.push({
        exerciseId,
        strategy,
        currentWeight: latest.bestWeight,
        suggestedWeight,
        currentReps: latest.bestReps,
        suggestedReps,
        currentSets: latest.sets,
        suggestedSets,
        reasoning,
      });
    }

    return suggestions;
  }

  // ────────────────────────────────────────────────────────────
  // PERSISTENCE — Supabase CRUD
  // ────────────────────────────────────────────────────────────

  /**
   * Save a completed workout to the database.
   */
  static async saveWorkoutLog(session: WorkoutSession): Promise<string | null> {
    const supabase = createAdminClient();

    try {
      const durationMinutes = Math.floor(session.totalDurationSeconds / 60);

      const { data, error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: session.userId,
          workout_id: session.templateId ?? null,
          title: session.title ?? 'Workout',
          duration_minutes: durationMinutes,
          calories_estimated: session.caloriesEstimated,
          exercises_completed: session.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            name: ex.exercise.name,
            sets: ex.sets.map(s => ({
              setNumber: s.setNumber,
              type: s.type,
              targetReps: s.targetReps,
              actualReps: s.actualReps,
              targetWeight: s.targetWeight,
              actualWeight: s.actualWeight,
              rpe: s.rpe,
              completed: s.completed,
              skipped: s.skipped,
            })),
          })),
          mood_before: session.moodBefore,
          mood_after: session.moodAfter,
          xp_earned: session.xpBreakdown.totalXP,
          streak_multiplier: session.xpBreakdown.streakMultiplier,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id ?? null;
    } catch (error) {
      console.error('[WorkoutService] Failed to save workout log:', error);
      return null;
    }
  }

  /**
   * Save a workout template.
   */
  static async saveTemplate(template: WorkoutTemplate): Promise<string | null> {
    const supabase = createAdminClient();

    try {
      const { data, error } = await supabase
        .from('workouts')
        .upsert({
          id: template.id,
          user_id: template.userId,
          title: template.title,
          description: template.description,
          category: template.category,
          difficulty: template.difficulty,
          estimated_minutes: template.estimatedMinutes,
          tutorial_url: template.tutorialVideoUrl,
          thumbnail_url: template.thumbnailUrl,
          is_template: true,
          exercises: template.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            orderIndex: ex.orderIndex,
            sets: ex.sets.length,
            targetReps: ex.sets[0]?.targetReps,
            restSeconds: ex.restBetweenSetsSeconds,
          })),
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id ?? null;
    } catch (error) {
      console.error('[WorkoutService] Failed to save template:', error);
      return null;
    }
  }

  /**
   * Get workout history for a user.
   */
  static async getHistory(
    userId: string,
    limit: number = 30,
  ): Promise<WorkoutHistoryEntry[]> {
    const supabase = createAdminClient();

    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select(`
          id,
          duration_minutes,
          calories_estimated,
          exercises_completed,
          mood_before,
          mood_after,
          xp_earned,
          created_at,
          workouts (title, difficulty)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.workouts?.title ?? 'Quick Workout',
        difficulty: row.workouts?.difficulty ?? 'intermediate',
        durationMinutes: row.duration_minutes,
        totalVolume: calculateVolumeFromLog(row.exercises_completed),
        exerciseCount: Array.isArray(row.exercises_completed)
          ? row.exercises_completed.length
          : 0,
        xpEarned: row.xp_earned ?? 0,
        completedAt: row.created_at,
        moodBefore: row.mood_before,
        moodAfter: row.mood_after,
      }));
    } catch (error) {
      console.error('[WorkoutService] Failed to fetch history:', error);
      return [];
    }
  }

  /**
   * Get aggregate workout stats for a user.
   */
  static async getStats(userId: string): Promise<WorkoutStats | null> {
    const supabase = createAdminClient();

    try {
      const { data: logs, error } = await supabase
        .from('workout_logs')
        .select('duration_minutes, calories_estimated, exercises_completed, xp_earned, created_at')
        .eq('user_id', userId);

      if (error || !logs || logs.length === 0) return null;

      const totalWorkouts = logs.length;
      const totalDurationMinutes = logs.reduce(
        (sum, l) => sum + (l.duration_minutes ?? 0),
        0,
      );
      const totalCalories = logs.reduce(
        (sum, l) => sum + (l.calories_estimated ?? 0),
        0,
      );
      const totalVolume = logs.reduce(
        (sum, l) => sum + calculateVolumeFromLog(l.exercises_completed),
        0,
      );
      const averageDuration = Math.round(totalDurationMinutes / totalWorkouts);

      // Weekly frequency (last 4 weeks)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const recentCount = logs.filter(
        l => new Date(l.created_at) > fourWeeksAgo,
      ).length;
      const weeklyFrequency = Math.round((recentCount / 4) * 10) / 10;

      // Current week workouts
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const currentWeekWorkouts = logs.filter(
        l => new Date(l.created_at) > weekStart,
      ).length;

      // Muscle group distribution
      const muscleGroupDistribution: Record<string, number> = {};
      for (const log of logs) {
        if (Array.isArray(log.exercises_completed)) {
          for (const ex of log.exercises_completed as Array<{ exerciseId: string }>) {
            if (!ex) continue;
            const exerciseData = getExerciseById(ex.exerciseId);
            if (exerciseData) {
              muscleGroupDistribution[exerciseData.primaryMuscle] =
                (muscleGroupDistribution[exerciseData.primaryMuscle] ?? 0) + 1;
            }
          }
        }
      }

      return {
        totalWorkouts,
        totalDurationMinutes,
        totalVolume,
        totalCalories,
        averageDuration,
        favoriteExercise: 'N/A', // Would need exercise frequency analysis
        strongestLift: { exercise: 'N/A', weight: 0, reps: 0 },
        weeklyFrequency,
        currentWeekWorkouts,
        muscleGroupDistribution: muscleGroupDistribution as any,
      };
    } catch (error) {
      console.error('[WorkoutService] Failed to fetch stats:', error);
      return null;
    }
  }

  // ────────────────────────────────────────────────────────────
  // UTILITY
  // ────────────────────────────────────────────────────────────

  /**
   * Calculate total volume, reps, and sets from exercises.
   */
  static calculateTotals(exercises: WorkoutExercise[]): {
    totalVolume: number;
    totalReps: number;
    totalSets: number;
  } {
    let totalVolume = 0;
    let totalReps = 0;
    let totalSets = 0;

    for (const ex of exercises) {
      for (const set of ex.sets) {
        if (set.completed) {
          totalSets++;
          const reps = set.actualReps ?? 0;
          const weight = set.actualWeight ?? 0;
          totalReps += reps;
          totalVolume += reps * weight;
        }
      }
    }

    return { totalVolume, totalReps, totalSets };
  }

  /**
   * Get the XP action type for a difficulty level.
   */
  static getXPAction(difficulty: WorkoutDifficulty): XPActionType {
    return WORKOUT_XP_BY_DIFFICULTY[difficulty].action;
  }

  /**
   * Elapsed seconds since session started (accounting for pauses).
   */
  static getElapsedSeconds(session: WorkoutSession): number {
    if (!session.startedAt) return 0;

    const start = new Date(session.startedAt).getTime();
    const now = session.pausedAt
      ? new Date(session.pausedAt).getTime()
      : Date.now();

    return Math.floor((now - start) / 1000) - session.totalRestSeconds;
  }
}

// ── Helper: Calculate volume from JSONB log ───────────────────

function calculateVolumeFromLog(exercisesCompleted: any): number {
  if (!Array.isArray(exercisesCompleted)) return 0;

  let volume = 0;
  for (const ex of exercisesCompleted) {
    if (Array.isArray(ex.sets)) {
      for (const set of ex.sets) {
        if (set.completed) {
          volume += (set.actualWeight ?? 0) * (set.actualReps ?? 0);
        }
      }
    }
  }
  return volume;
}

// ── Convenience Exports ───────────────────────────────────────

export const createSession = WorkoutService.createSession;
export const startSession = WorkoutService.startSession;
export const pauseSession = WorkoutService.pauseSession;
export const resumeSession = WorkoutService.resumeSession;
export const cancelSession = WorkoutService.cancelSession;
export const addSet = WorkoutService.addSet;
export const completeSet = WorkoutService.completeSet;
export const skipSet = WorkoutService.skipSet;
export const completeSession = WorkoutService.completeSession;
export const calculateXP = WorkoutService.calculateXP;
export const getOverloadSuggestions = WorkoutService.getOverloadSuggestions;
export const saveWorkoutLog = WorkoutService.saveWorkoutLog;
export const getWorkoutHistory = WorkoutService.getHistory;
export const getWorkoutStats = WorkoutService.getStats;
