// =============================================================
// Routine-Calendar Sync Service
// =============================================================
// Automatically creates calendar events from routine completions

import { createAdminClient } from '@/lib/supabase/admin';
import { CalendarEventCategory } from '@/types/calendar';

interface SyncRoutineToCalendarInput {
  userId: string;
  routineId: string;
  routineName: string;
  scheduledTime?: string; // ISO timestamp
  category?: CalendarEventCategory;
}

export class RoutineCalendarSync {
  /**
   * Create a calendar event from a routine
   */
  static async syncRoutineToCalendar(input: SyncRoutineToCalendarInput) {
    const { userId, routineId, routineName, scheduledTime, category = 'routine' } = input;
    const supabase = createAdminClient();

    try {
      // Default to tomorrow at 9 AM if no time specified
      const startTime = scheduledTime
        ? new Date(scheduledTime)
        : (() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            return tomorrow;
          })();

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      // Check for existing event
      const { data: existing } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('user_id', userId)
        .eq('routine_id', routineId)
        .eq('start_time', startTime.toISOString())
        .single();

      if (existing) {
        return { success: true, eventId: existing.id, created: false };
      }

      // Create calendar event
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: routineName,
          description: 'Scheduled routine',
          category,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          routine_id: routineId,
          all_day: false,
          completed: false,
          xp_awarded: false,
        })
        .select('id')
        .single();

      if (error) throw error;

      return { success: true, eventId: data.id, created: true };
    } catch (error) {
      console.error('[RoutineCalendarSync] Failed to sync:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Sync all incomplete routines to calendar for the week
   */
  static async syncWeeklyRoutines(userId: string) {
    const supabase = createAdminClient();

    try {
      // Get user's active routines
      const { data: routines, error: routinesError } = await supabase
        .from('routines')
        .select('id, title, icon')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (routinesError) throw routinesError;

      const results = [];
      
      // Create events for next 7 days
      for (const routine of routines || []) {
        for (let day = 1; day <= 7; day++) {
          const date = new Date();
          date.setDate(date.getDate() + day);
          date.setHours(9, 0, 0, 0);

          const result = await this.syncRoutineToCalendar({
            userId,
            routineId: routine.id,
            routineName: routine.title,
            scheduledTime: date.toISOString(),
            category: 'routine',
          });

          results.push(result);
        }
      }

      return {
        success: true,
        created: results.filter(r => r.created).length,
        total: results.length,
      };
    } catch (error) {
      console.error('[RoutineCalendarSync] Failed to sync weekly routines:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Auto-complete calendar event when routine is completed
   */
  static async completeRoutineEvent(userId: string, routineId: string) {
    const supabase = createAdminClient();

    try {
      const today = new Date().toISOString().split('T')[0];

      // Find today's calendar event for this routine
      const { data: event } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .eq('routine_id', routineId)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`)
        .eq('completed', false)
        .single();

      if (!event) {
        return { success: false, message: 'No matching event found' };
      }

      // Mark as completed
      const { error } = await supabase
        .from('calendar_events')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', event.id);

      if (error) throw error;

      return { success: true, eventId: event.id };
    } catch (error) {
      console.error('[RoutineCalendarSync] Failed to complete event:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Map routine category to calendar category
   */
  private static mapRoutineCategory(routineCategory?: string): CalendarEventCategory {
    const mapping: Record<string, CalendarEventCategory> = {
      workout: 'workout',
      fitness: 'workout',
      wellness: 'wellness',
      stretch: 'stretch',
      meditation: 'wellness',
      personal: 'personal',
    };

    return mapping[routineCategory?.toLowerCase() || ''] || 'routine';
  }
}

// Convenience exports
export const syncRoutineToCalendar = RoutineCalendarSync.syncRoutineToCalendar.bind(RoutineCalendarSync);
export const syncWeeklyRoutines = RoutineCalendarSync.syncWeeklyRoutines.bind(RoutineCalendarSync);
export const completeRoutineEvent = RoutineCalendarSync.completeRoutineEvent.bind(RoutineCalendarSync);
