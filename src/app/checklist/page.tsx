// Example page demonstrating the Checklist component
'use client';

import { useState } from 'react';
import { Checklist } from '@/components/checklist';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChecklistPage() {
  const [xpNotification, setXpNotification] = useState<{
    xp: number;
    coins: number;
  } | null>(null);

  const handleXPAwarded = (xp: number, coins: number) => {
    setXpNotification({ xp, coins });
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setXpNotification(null);
    }, 3000);
  };

  // In production, get userId from auth session
  const userId = 'your-user-id'; // Replace with actual user ID

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* XP Award Notification */}
      <AnimatePresence>
        {xpNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="px-6 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⭐</span>
                <div>
                  <p className="font-black text-lg">
                    +{xpNotification.xp} XP
                  </p>
                  <p className="text-sm opacity-90">
                    +{xpNotification.coins} coins
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <Checklist userId={userId} onXPAwarded={handleXPAwarded} />
    </div>
  );
}
