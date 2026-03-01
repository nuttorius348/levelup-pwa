// =============================================================
// Routine Types
// =============================================================

export interface Routine {
  id: string;
  userId: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  recurrence: RoutineRecurrence;
  items: RoutineItem[];
  createdAt: string;
}

export interface RoutineItem {
  id: string;
  routineId: string;
  title: string;
  sortOrder: number;
  xpValue: number;
  isCompleted?: boolean;  // Client-side, for today
}

export interface RoutineRecurrence {
  type: 'daily' | 'weekdays' | 'weekends' | 'custom';
  days?: number[];  // 0=Sun, 1=Mon, etc.
}

export interface RoutineCompletion {
  id: string;
  routineId: string;
  routineItemId: string;
  completedDate: string;
  xpEarned: number;
}

export interface RoutineWithProgress extends Routine {
  completedCount: number;
  totalCount: number;
  progressPercent: number;
}

export interface CreateRoutineInput {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  recurrence?: RoutineRecurrence;
  items: { title: string; xpValue?: number }[];
}
