// =============================================================
// Workout Types
// =============================================================

export type WorkoutCategory = 'strength' | 'cardio' | 'flexibility' | 'hiit';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface WorkoutTemplate {
  id: string;
  title: string;
  description?: string;
  category: WorkoutCategory;
  difficulty: Difficulty;
  estimatedMinutes?: number;
  tutorialUrl?: string;
  thumbnailUrl?: string;
  exercises: ExerciseTemplate[];
  isSystem: boolean;
}

export interface ExerciseTemplate {
  name: string;
  sets: number;
  reps?: number;
  durationSeconds?: number;
  restSeconds: number;
  tutorialUrl?: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  templateId?: string;
  title: string;
  durationMinutes?: number;
  caloriesEstimated?: number;
  exercisesCompleted: ExerciseLog[];
  notes?: string;
  moodBefore?: number;
  moodAfter?: number;
  xpEarned: number;
  completedAt: string;
}

export interface ExerciseLog {
  name: string;
  setsCompleted: number;
  repsCompleted: number[];
  weightLbs: number[];
  notes?: string;
}

export interface LogWorkoutInput {
  templateId?: string;
  title: string;
  durationMinutes?: number;
  exercises: ExerciseLog[];
  notes?: string;
  moodBefore?: number;
  moodAfter?: number;
}
