// =============================================================
// Checklist Types
// =============================================================

export interface ChecklistTask {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  order_index: number;
  date: string; // YYYY-MM-DD for daily reset
}

export interface ChecklistStats {
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  currentStreak: number;
  isStreakActive: boolean;
  xpEarnedToday: number;
}

export interface CreateTaskInput {
  title: string;
}

export interface CompleteTaskResponse {
  success: boolean;
  xpAwarded: number;
  coinsEarned: number;
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    title: string;
  };
  error?: string;
}
