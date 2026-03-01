'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent, CalendarViewMode, CreateEventInput } from '@/types/calendar';
import { MonthView } from './MonthView';
import { DayView } from './DayView';
import { EventModal } from './EventModal';
import { getMonthDays, getEventsForDay, getMonthName } from '@/lib/utils/calendar';
import { createClient } from '@/lib/supabase/client';

interface CalendarProps {
  userId: string;
  onEventComplete?: (event: CalendarEvent, xpAwarded: number) => void;
}

export function Calendar({ userId, onEventComplete }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [initialHour, setInitialHour] = useState(9);

  const supabase = createClient();

  // Load events
  useEffect(() => {
    loadEvents();
  }, [userId, currentDate]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startOfMonth.toISOString())
        .lte('start_time', endOfMonth.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents((data || []) as unknown as CalendarEvent[]);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (input: CreateEventInput) => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          ...input,
          completed: false,
          xp_awarded: false,
        })
        .select()
        .single();

      if (error) throw error;
      setEvents(prev => [...prev, data as unknown as CalendarEvent]);
    } catch (err) {
      console.error('Failed to create event:', err);
      throw err;
    }
  };

  const completeEvent = async (event: CalendarEvent) => {
    if (event.completed) return;

    try {
      // Mark complete
      const { error: updateError } = await supabase
        .from('calendar_events')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', event.id);

      if (updateError) throw updateError;

      // Award XP
      const response = await fetch('/api/xp/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'calendar_event_done',
          idempotencyKey: `calendar_${event.id}`,
          metadata: {
            eventId: event.id,
            eventTitle: event.title,
            category: event.category,
          },
        }),
      });

      const result = await response.json();

      // Update local state
      setEvents(prev =>
        prev.map(e =>
          e.id === event.id
            ? { ...e, completed: true, completed_at: new Date().toISOString(), xp_awarded: true }
            : e
        )
      );

      // Notify parent
      if (result.success) {
        onEventComplete?.(event, result.data.xpAwarded);
      }
    } catch (err) {
      console.error('Failed to complete event:', err);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleTimeSlotClick = (hour: number) => {
    setInitialHour(hour);
    setShowEventModal(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  // Get month days with events
  const monthDays = getMonthDays(currentDate.getFullYear(), currentDate.getMonth()).map(day => ({
    ...day,
    events: getEventsForDay(events, day.date),
  }));

  const dayEvents = getEventsForDay(events, selectedDate);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {events.length} event{events.length !== 1 ? 's' : ''} this month
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('month')}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition-all
              ${viewMode === 'month'
                ? 'bg-white dark:bg-gray-700 text-green-600 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm transition-all
              ${viewMode === 'day'
                ? 'bg-white dark:bg-gray-700 text-green-600 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            Day
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => {
            setCurrentDate(new Date());
            setSelectedDate(new Date());
          }}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
        >
          Today
        </button>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'month' ? (
            <motion.div
              key="month"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <MonthView
                days={monthDays}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onDateClick={(date) => setViewMode('day')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="day"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DayView
                date={selectedDate}
                events={dayEvents}
                onEventClick={handleEventClick}
                onTimeSlotClick={handleTimeSlotClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Add Event FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowEventModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:from-green-600 hover:to-green-700 transition-all z-30"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </motion.button>

      {/* Event Modal */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSubmit={createEvent}
        initialDate={selectedDate}
        initialHour={initialHour}
      />

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onComplete={completeEvent}
          onDelete={deleteEvent}
        />
      )}
    </div>
  );
}

// Event Detail Modal Component
function EventDetailModal({
  event,
  onClose,
  onComplete,
  onDelete,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onComplete: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}) {
  const { getCategoryConfig } = require('@/types/calendar');
  const config = getCategoryConfig(event.category);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-96 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
      >
        <div className={`${config.bgColor} px-6 py-8`}>
          <div className="flex items-start gap-4">
            <span className="text-5xl">{config.icon}</span>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${config.color}`}>{event.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {new Date(event.start_time).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {!event.all_day && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  {' - '}
                  {new Date(event.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
            {event.completed && (
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                ✓ Done
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {event.description && (
            <p className="text-gray-700 dark:text-gray-300">{event.description}</p>
          )}

          <div className="flex gap-3">
            {!event.completed && (
              <button
                onClick={() => {
                  onComplete(event);
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all"
              >
                Mark Complete
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Delete this event?')) {
                  onDelete(event.id);
                  onClose();
                }
              }}
              className="px-4 py-3 border-2 border-red-500 text-red-500 font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
