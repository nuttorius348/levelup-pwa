'use client';

import { CalendarDay } from '@/types/calendar';
import { getEventsForDay } from '@/lib/utils/calendar';
import { getCategoryConfig } from '@/types/calendar';
import { motion } from 'framer-motion';

interface MonthViewProps {
  days: CalendarDay[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onDateClick?: (date: Date) => void;
}

export function MonthView({
  days,
  selectedDate,
  onDateSelect,
  onDateClick,
}: MonthViewProps) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDateClick = (day: CalendarDay) => {
    onDateSelect(day.date);
    onDateClick?.(day.date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isSelected =
            day.date.toDateString() === selectedDate.toDateString();
          const hasEvents = day.events.length > 0;
          const completedEvents = day.events.filter(e => e.completed).length;

          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDateClick(day)}
              className={`
                relative aspect-square rounded-lg p-1 transition-all duration-200
                ${!day.isCurrentMonth ? 'opacity-30' : 'opacity-100'}
                ${isSelected
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg scale-105'
                  : day.isToday
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold ring-2 ring-blue-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                }
              `}
            >
              {/* Day Number */}
              <div className="text-sm font-semibold">
                {day.date.getDate()}
              </div>

              {/* Event Indicators */}
              {hasEvents && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {day.events.slice(0, 3).map((event, i) => {
                    const config = getCategoryConfig(event.category);
                    return (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          event.completed
                            ? 'bg-green-500'
                            : isSelected
                            ? 'bg-white'
                            : config.color.replace('text-', 'bg-')
                        }`}
                      />
                    );
                  })}
                  {day.events.length > 3 && (
                    <div className={`w-1 h-1 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-gray-400'
                    }`} />
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span>Has Events</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
