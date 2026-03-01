// =============================================================
// Workout System Types
// =============================================================
//
// Comprehensive type system for exercises, sets, reps, rest
// timers, difficulty scaling, progressive overload, and
// tutorial video integration.
// =============================================================

import { WorkoutDifficulty } from './xp';

// ── Core Enums ────────────────────────────────────────────────

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'full_body'
  | 'cardio';

export type ExerciseCategory =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'hiit'
  | 'plyometric'
  | 'bodyweight'
  | 'olympic'
  | 'machine';

export type SetType =
  | 'working'      // Standard working set
  | 'warmup'       // Warm-up set (doesn't count for XP)
  | 'dropset'      // Reduced weight continuation
  | 'superset'     // Paired with another exercise
  | 'failure'      // To muscular failure
  | 'rest_pause';  // Brief rest then continue

export type WorkoutStatus =
  | 'idle'
  | 'active'
  | 'paused'
  | 'resting'
  | 'completed'
  | 'cancelled';

export type OverloadStrategy =
  | 'weight'       // Add weight each session
  | 'reps'         // Add reps each session
  | 'sets'         // Add sets each session
  | 'tempo'        // Slow eccentric
  | 'rest'         // Reduce rest periods
  | 'volume';      // Total tonnage increase

// ── Exercise Definition ───────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  category: ExerciseCategory;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  difficulty: WorkoutDifficulty;
  equipment: string[];             // ['barbell', 'bench'] or ['bodyweight']
  instructions: string[];          // Step-by-step
  tips: string[];                  // Pro tips
  tutorialVideoUrl?: string;       // YouTube/Vimeo URL
  tutorialThumbnail?: string;      // Video thumbnail
  animationUrl?: string;           // GIF/Lottie animation
  caloriesPerMinute: number;       // Estimated burn rate
  isCompound: boolean;             // Multi-joint movement
  aliases: string[];               // Alternative names for search
}

// ── Set Definition ────────────────────────────────────────────

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  targetReps: number;
  actualReps?: number;             // Filled during workout
  targetWeight?: number;           // In lbs/kg
  actualWeight?: number;           // Filled during workout
  targetDurationSeconds?: number;  // For timed exercises (planks, etc.)
  actualDurationSeconds?: number;
  restAfterSeconds: number;        // Rest period after set
  rpe?: number;                    // Rate of perceived exertion (1-10)
  completed: boolean;
  skipped: boolean;
  notes?: string;
}

// ── Exercise in a Workout Plan ────────────────────────────────

export interface WorkoutExercise {
  id: string;
  exerciseId: string;              // References Exercise.id
  exercise: Exercise;              // Hydrated exercise data
  orderIndex: number;
  sets: WorkoutSet[];
  supersetPairId?: string;         // If paired with another exercise
  notes?: string;
  restBetweenSetsSeconds: number;  // Default rest for this exercise
}

// ── Workout Template ──────────────────────────────────────────

export interface WorkoutTemplate {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: ExerciseCategory;
  difficulty: WorkoutDifficulty;
  estimatedMinutes: number;
  exercises: WorkoutExercise[];
  targetMuscles: MuscleGroup[];
  tutorialVideoUrl?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  timesCompleted: number;
  createdAt: string;
  updatedAt: string;
}

// ── Active Workout Session ────────────────────────────────────

export interface WorkoutSession {
  id: string;
  userId: string;
  templateId?: string;
  title: string;
  difficulty: WorkoutDifficulty;
  status: WorkoutStatus;
  exercises: WorkoutExercise[];

  // Timing
  startedAt: string;
  pausedAt?: string;
  completedAt?: string;
  totalDurationSeconds: number;
  activeDurationSeconds: number;   // Excludes rest time
  totalRestSeconds: number;

  // Current state
  currentExerciseIndex: number;
  currentSetIndex: number;
  restTimerEndAt?: string;         // When current rest ends

  // Results
  totalVolume: number;             // Total weight × reps
  totalReps: number;
  totalSets: number;
  caloriesEstimated: number;
  exercisesCompleted: number;

  // Mood tracking
  moodBefore?: number;             // 1-5
  moodAfter?: number;

  // XP breakdown
  xpBreakdown: WorkoutXPBreakdown;
}

// ── XP Calculation ────────────────────────────────────────────

export interface WorkoutXPBreakdown {
  baseDifficultyXP: number;        // 25/50/100 by difficulty
  durationBonusXP: number;         // 1 XP per minute (cap 60)
  volumeBonusXP: number;           // Bonus for high volume
  completionBonusXP: number;       // Bonus for finishing all sets
  personalRecordXP: number;        // PR bonus
  streakMultiplier: number;
  totalXP: number;
  coinsEarned: number;
}

// ── Progressive Overload ──────────────────────────────────────

export interface ProgressiveOverloadRecord {
  id: string;
  userId: string;
  exerciseId: string;
  date: string;
  bestWeight: number;
  bestReps: number;
  bestVolume: number;              // weight × reps for best set
  totalVolume: number;             // All sets combined
  estimated1RM: number;            // Epley formula
  sets: number;
  difficulty: WorkoutDifficulty;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | 'volume' | '1rm';
  value: number;
  previousValue: number;
  improvement: number;
  date: string;
  workoutLogId: string;
}

export interface OverloadSuggestion {
  exerciseId: string;
  strategy: OverloadStrategy;
  currentWeight: number;
  suggestedWeight: number;
  currentReps: number;
  suggestedReps: number;
  currentSets: number;
  suggestedSets: number;
  reasoning: string;
}

// ── Rest Timer ────────────────────────────────────────────────

export interface RestTimerState {
  isActive: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  exerciseName: string;
  nextSetNumber: number;
  autoStarted: boolean;
}

// ── Workout History & Stats ───────────────────────────────────

export interface WorkoutStats {
  totalWorkouts: number;
  totalDurationMinutes: number;
  totalVolume: number;
  totalCalories: number;
  averageDuration: number;
  favoriteExercise: string;
  strongestLift: { exercise: string; weight: number; reps: number };
  weeklyFrequency: number;
  currentWeekWorkouts: number;
  muscleGroupDistribution: Record<MuscleGroup, number>;
}

export interface WorkoutHistoryEntry {
  id: string;
  title: string;
  difficulty: WorkoutDifficulty;
  durationMinutes: number;
  totalVolume: number;
  exerciseCount: number;
  xpEarned: number;
  completedAt: string;
  moodBefore?: number;
  moodAfter?: number;
}

// ── Video Tutorial ────────────────────────────────────────────

export interface TutorialVideo {
  url: string;
  thumbnail: string;
  title: string;
  duration: string;              // "2:30"
  source: 'youtube' | 'custom';
  exerciseId: string;
}

// ── Difficulty Scaling Config ─────────────────────────────────

export interface DifficultyScaling {
  difficulty: WorkoutDifficulty;
  restMultiplier: number;         // 1.5× for beginner, 1.0× for advanced
  weightSuggestionPercent: number; // % of estimated 1RM
  repsRange: [number, number];    // [8, 12] for intermediate
  setsRange: [number, number];    // [3, 4] for intermediate
  rpeSuggestion: number;          // Target RPE
}

export const DIFFICULTY_SCALING: Record<WorkoutDifficulty, DifficultyScaling> = {
  beginner: {
    difficulty: 'beginner',
    restMultiplier: 1.5,
    weightSuggestionPercent: 50,
    repsRange: [10, 15],
    setsRange: [2, 3],
    rpeSuggestion: 6,
  },
  intermediate: {
    difficulty: 'intermediate',
    restMultiplier: 1.0,
    weightSuggestionPercent: 70,
    repsRange: [8, 12],
    setsRange: [3, 4],
    rpeSuggestion: 7,
  },
  advanced: {
    difficulty: 'advanced',
    restMultiplier: 0.8,
    weightSuggestionPercent: 85,
    repsRange: [4, 8],
    setsRange: [4, 6],
    rpeSuggestion: 9,
  },
};
