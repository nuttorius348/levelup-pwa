'use client';

import { useState } from 'react';
import { CalendarEventCategory, CreateEventInput, CALENDAR_CATEGORIES } from '@/types/calendar';
import { motion, AnimatePresence } from 'framer-motion';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: CreateEventInput) => Promise<void>;
  initialDate?: Date;
  initialHour?: number;
}

export function EventModal({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  initialHour = 9,
}: EventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateEventInput>(() => {
    const date = initialDate || new Date();
    const startTime = new Date(date);
    startTime.setHours(initialHour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(initialHour + 1, 0, 0, 0);

    return {
      title: '',
      description: '',
      category: 'other',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      all_day: false,
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'other',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        all_day: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStartTime = (time: string) => {
    const start = new Date(time);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    
    setFormData(prev => ({
      ...prev,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Add Event</h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="E.g., Team Meeting"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500 transition-all"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CALENDAR_CATEGORIES.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                        className={`
                          flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all
                          ${formData.category === cat.name
                            ? `${cat.bgColor} border-current ${cat.color} font-semibold scale-105`
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-sm">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="all-day"
                    checked={formData.all_day}
                    onChange={(e) => setFormData(prev => ({ ...prev, all_day: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="all-day" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    All-day event
                  </label>
                </div>

                {/* Time Inputs */}
                {!formData.all_day && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.start_time.slice(0, 16)}
                        onChange={(e) => updateStartTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.end_time.slice(0, 16)}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: new Date(e.target.value).toISOString() }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-green-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add notes or details..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-green-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.title.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Event'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
