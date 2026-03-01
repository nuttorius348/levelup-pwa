// =============================================================
// Zod Validators — Routines
// =============================================================

import { z } from 'zod';

export const routineRecurrenceSchema = z.object({
  type: z.enum(['daily', 'weekdays', 'weekends', 'custom']),
  days: z.array(z.number().int().min(0).max(6)).optional(),
});

export const createRoutineItemSchema = z.object({
  title: z.string().min(1).max(200),
  xpValue: z.number().int().min(1).max(100).default(10),
});

export const createRoutineSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  icon: z.string().max(10).default('📋'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#4C6EF5'),
  recurrence: routineRecurrenceSchema.default({ type: 'daily' }),
  items: z.array(createRoutineItemSchema).min(1).max(50),
});

export const updateRoutineSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  recurrence: routineRecurrenceSchema.optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const completeRoutineItemSchema = z.object({
  routineId: z.string().uuid(),
  routineItemId: z.string().uuid(),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
export type CompleteRoutineItemInput = z.infer<typeof completeRoutineItemSchema>;
