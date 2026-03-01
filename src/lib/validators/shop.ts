// =============================================================
// Zod Validators — Shop
// =============================================================

import { z } from 'zod';

export const purchaseItemSchema = z.object({
  itemId: z.string().uuid(),
});

export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
