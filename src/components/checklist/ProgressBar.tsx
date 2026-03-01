'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  completed: number;
  total: number;
  className?: string;
}

export function ProgressBar({ completed, total, className = '' }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {completed} of {total} complete
        </span>
        <span className="font-bold text-green-600 dark:text-green-400">
          {percent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
        />
        
        {/* Shine Effect */}
        {percent > 0 && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
            className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        )}
      </div>

      {/* Celebration on 100% */}
      {percent === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-2"
        >
          <span className="text-2xl">🎉</span>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            All tasks complete!
          </p>
        </motion.div>
      )}
    </div>
  );
}
