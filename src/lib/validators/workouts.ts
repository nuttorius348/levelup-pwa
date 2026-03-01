// =============================================================
// Zod Validators — Workouts
// =============================================================

import { z } from 'zod';

export const exerciseLogSchema = z.object({
  name: z.string().min(1).max(200),
  setsCompleted: z.number().int().min(0).max(100),
  repsCompleted: z.array(z.number().int().min(0)),
  weightLbs: z.array(z.number().min(0)),
  notes: z.string().max(500).optional(),
});

export const logWorkoutSchema = z.object({
  templateId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  exercises: z.array(exerciseLogSchema).min(1).max(100),
  notes: z.string().max(2000).optional(),
  moodBefore: z.number().int().min(1).max(5).optional(),
  moodAfter: z.number().int().min(1).max(5).optional(),
});

export type LogWorkoutInput = z.infer<typeof logWorkoutSchema>;
