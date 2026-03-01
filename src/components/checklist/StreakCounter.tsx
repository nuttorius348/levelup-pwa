'use client';

import { motion } from 'framer-motion';

interface StreakCounterProps {
  days: number;
  isActive: boolean;
  multiplier: number;
  className?: string;
}

export function StreakCounter({
  days,
  isActive,
  multiplier,
  className = '',
}: StreakCounterProps) {
  return (
    <div className={`${className}`}>
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={`
          relative px-5 py-4 rounded-2xl border-2 overflow-hidden
          ${
            isActive
              ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300 dark:from-orange-900/20 dark:to-red-900/20 dark:border-orange-700'
              : 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700'
          }
        `}
      >
        {/* Fire Animation Background */}
        {isActive && days > 0 && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 bg-gradient-to-t from-orange-200/50 to-transparent dark:from-orange-500/20"
          />
        )}

        <div className="relative flex items-center gap-4">
          {/* Flame Icon */}
          <div className="flex-shrink-0">
            {isActive && days > 0 ? (
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-4xl"
              >
                🔥
              </motion.div>
            ) : (
              <div className="text-4xl opacity-50">💤</div>
            )}
          </div>

          {/* Streak Info */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <motion.span
                key={days}
                initial={{ scale: 1.3, color: '#f97316' }}
                animate={{ scale: 1, color: 'currentColor' }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="text-3xl font-black text-gray-900 dark:text-white"
              >
                {days}
              </motion.span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                day{days !== 1 ? 's' : ''} streak
              </span>
            </div>

            {/* Multiplier Badge */}
            {isActive && multiplier > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full"
              >
                <span>⚡</span>
                <span>{multiplier}× XP</span>
              </motion.div>
            )}

            {/* Inactive Message */}
            {!isActive && days > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Complete a task to continue your streak!
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
