// =============================================================
// Calendar Types
// =============================================================

export type CalendarEventCategory =
  | 'workout'
  | 'routine'
  | 'meeting'
  | 'personal'
  | 'wellness'
  | 'stretch'
  | 'other';

export type CalendarViewMode = 'month' | 'day';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: CalendarEventCategory;
  start_time: string; // ISO timestamp
  end_time: string;   // ISO timestamp
  completed: boolean;
  completed_at?: string;
  routine_id?: string; // Link to routine if synced
  all_day: boolean;
  color?: string;
  xp_awarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  category: CalendarEventCategory;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  routine_id?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  completed?: boolean;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface CategoryConfig {
  name: CalendarEventCategory;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const CALENDAR_CATEGORIES: CategoryConfig[] = [
  {
    name: 'workout',
    label: 'Workout',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: '💪',
  },
  {
    name: 'routine',
    label: 'Routine',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: '✅',
  },
  {
    name: 'meeting',
    label: 'Meeting',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: '📅',
  },
  {
    name: 'personal',
    label: 'Personal',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: '🎯',
  },
  {
    name: 'wellness',
    label: 'Wellness',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    icon: '🧘',
  },
  {
    name: 'stretch',
    label: 'Stretch',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: '🤸',
  },
  {
    name: 'other',
    label: 'Other',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    icon: '📌',
  },
];

export function getCategoryConfig(category: CalendarEventCategory): CategoryConfig {
  return CALENDAR_CATEGORIES.find(c => c.name === category) || CALENDAR_CATEGORIES[6]!;
}
