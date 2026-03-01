'use client';

import { useState } from 'react';
import { Calendar } from '@/components/calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from '@/types/calendar';

export default function CalendarPage() {
  const [xpNotification, setXpNotification] = useState<{
    event: CalendarEvent;
    xp: number;
    timestamp: number;
  } | null>(null);

  const handleEventComplete = (event: CalendarEvent, xpAwarded: number) => {
    setXpNotification({
      event,
      xp: xpAwarded,
      timestamp: Date.now(),
    });

    setTimeout(() => setXpNotification(null), 4000);
  };

  // In production, get userId from auth session
  const userId = 'your-user-id'; // Replace with actual user ID

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* XP Notification */}
      <AnimatePresence>
        {xpNotification && (
          <motion.div
            key={xpNotification.timestamp}
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-green-400 blur-xl opacity-60 rounded-full" />
              
              {/* Card */}
              <div className="relative px-8 py-5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-4">
                  <motion.span
                    animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl"
                  >
                    🎉
                  </motion.span>
                  <div className="text-white">
                    <div className="text-2xl font-black">
                      +{xpNotification.xp} XP
                    </div>
                    <div className="text-sm opacity-90">
                      {xpNotification.event.title} completed!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              📅 Calendar
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Schedule events and earn XP
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Component */}
      <Calendar userId={userId} onEventComplete={handleEventComplete} />
    </div>
  );
}
