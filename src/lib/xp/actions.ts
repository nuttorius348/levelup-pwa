// =============================================================
// XP Actions — Typed action definitions for the XP system
// =============================================================

import type { XPActionType } from '@/types/xp';

/**
 * Action metadata for display and tracking purposes.
 */
export interface XPActionMeta {
  action: XPActionType;
  label: string;
  description: string;
  icon: string;
}

export const XP_ACTION_META: Record<XPActionType, XPActionMeta> = {
  routine_task: {
    action: 'routine_task',
    label: 'Routine Item',
    description: 'Completed a routine checklist item',
    icon: '✅',
  },
  routine_full: {
    action: 'routine_full',
    label: 'Full Routine',
    description: 'Completed all items in a routine',
    icon: '🏆',
  },
  workout_beginner: {
    action: 'workout_beginner',
    label: 'Beginner Workout',
    description: 'Logged a beginner workout',
    icon: '💪',
  },
  workout_intermediate: {
    action: 'workout_intermediate',
    label: 'Intermediate Workout',
    description: 'Logged an intermediate workout',
    icon: '🏋️',
  },
  workout_advanced: {
    action: 'workout_advanced',
    label: 'Advanced Workout',
    description: 'Logged an advanced workout',
    icon: '🔥',
  },
  workout_duration_bonus: {
    action: 'workout_duration_bonus',
    label: 'Duration Bonus',
    description: 'Bonus XP per minute of workout',
    icon: '⏱️',
  },
  stretch_complete: {
    action: 'stretch_complete',
    label: 'Stretch Session',
    description: 'Completed a stretch session',
    icon: '🧘',
  },
  stretch_morning_bonus: {
    action: 'stretch_morning_bonus',
    label: 'Morning Stretch',
    description: 'Stretched before 9 AM',
    icon: '🌅',
  },
  outfit_submit: {
    action: 'outfit_submit',
    label: 'Outfit Submitted',
    description: 'Submitted an outfit for AI rating',
    icon: '👔',
  },
  outfit_score_bonus: {
    action: 'outfit_score_bonus',
    label: 'Outfit Score Bonus',
    description: 'Bonus XP based on outfit score',
    icon: '✨',
  },
  outfit_improvement: {
    action: 'outfit_improvement',
    label: 'Outfit Improvement',
    description: 'Scored higher than previous rating',
    icon: '📈',
  },
  quote_generated: {
    action: 'quote_generated',
    label: 'Quote Generated',
    description: 'Generated a custom quote',
    icon: '💬',
  },
  quote_read: {
    action: 'quote_read',
    label: 'Quote Read',
    description: 'Read the daily quote',
    icon: '📖',
  },
  quote_morning_bonus: {
    action: 'quote_morning_bonus',
    label: 'Morning Quote',
    description: 'Read before 9 AM',
    icon: '🌅',
  },
  daily_login: {
    action: 'daily_login',
    label: 'Daily Login',
    description: 'Logged in today',
    icon: '📅',
  },
  calendar_event_done: {
    action: 'calendar_event_done',
    label: 'Calendar Event',
    description: 'Completed a calendar event',
    icon: '📆',
  },
  streak_milestone: {
    action: 'streak_milestone',
    label: 'Streak Milestone',
    description: 'Hit a streak milestone',
    icon: '🔥',
  },
  achievement_unlock: {
    action: 'achievement_unlock',
    label: 'Achievement',
    description: 'Unlocked an achievement',
    icon: '⭐',
  },
  level_up_bonus: {
    action: 'level_up_bonus',
    label: 'Level Up',
    description: 'Leveled up',
    icon: '⬆️',
  },
  admin_grant: {
    action: 'admin_grant',
    label: 'Admin Grant',
    description: 'XP granted by admin',
    icon: '🎁',
  },
  admin_deduct: {
    action: 'admin_deduct',
    label: 'Admin Deduct',
    description: 'XP deducted by admin',
    icon: '⚠️',
  },
};
