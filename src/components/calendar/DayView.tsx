'use client';

import { CalendarEvent } from '@/types/calendar';
import { getDayViewHours, formatHour, calculateEventPosition } from '@/lib/utils/calendar';
import { getCategoryConfig } from '@/types/calendar';
import { motion } from 'framer-motion';

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick?: (hour: number) => void;
}

export function DayView({
  date,
  events,
  onEventClick,
  onTimeSlotClick,
}: DayViewProps) {
  const hours = getDayViewHours();

  // Filter events for this specific day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.start_time);
    return (
      eventDate.getFullYear() === date.getFullYear() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getDate() === date.getDate()
    );
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Date Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white">
        <h3 className="text-lg font-bold">
          {date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </h3>
        <p className="text-sm opacity-90">
          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      {/* Time Grid */}
      <div className="relative h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {/* Hour Rows */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="h-[60px] border-b border-gray-200 dark:border-gray-700 flex"
            onClick={() => onTimeSlotClick?.(hour)}
          >
            {/* Time Label */}
            <div className="w-16 flex-shrink-0 p-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {formatHour(hour)}
            </div>
            
            {/* Time Slot */}
            <div className="flex-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" />
          </div>
        ))}

        {/* Events Overlay */}
        <div className="absolute inset-0 left-16 pointer-events-none">
          {dayEvents.map((event) => {
            const { top, height } = calculateEventPosition(
              event.start_time,
              event.end_time
            );
            const config = getCategoryConfig(event.category);

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute left-2 right-2 pointer-events-auto cursor-pointer"
                style={{
                  top: `${top}px`,
                  height: `${Math.max(height, 40)}px`,
                }}
                onClick={() => onEventClick(event)}
              >
                <div
                  className={`
                    h-full rounded-lg p-2 border-l-4 shadow-md
                    ${config.bgColor}
                    ${event.completed
                      ? 'opacity-60 line-through'
                      : 'opacity-100'
                    }
                    hover:shadow-lg transition-all duration-200
                  `}
                  style={{
                    borderLeftColor: config.color.replace('text-', '#').replace('600', '500'),
                  }}
                >
                  {/* Event Icon & Title */}
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${config.color}`}>
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(event.start_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                        {' - '}
                        {new Date(event.end_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </p>
                    </div>
                    {event.completed && (
                      <span className="text-green-500 text-lg">✓</span>
                    )}
                  </div>

                  {/* Description (if space allows) */}
                  {height > 80 && event.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {dayEvents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-400 dark:text-gray-500">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-sm">No events scheduled</p>
          </div>
        </div>
      )}
    </div>
  );
}
