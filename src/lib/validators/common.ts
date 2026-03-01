// =============================================================
// Zod Validators — Common schemas
// =============================================================

import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

/**
 * Generic API error response
 */
export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

export type APIError = z.infer<typeof apiErrorSchema>;
