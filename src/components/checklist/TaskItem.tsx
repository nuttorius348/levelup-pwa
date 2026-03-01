'use client';

import { useState } from 'react';
import { ChecklistTask } from '@/types/checklist';
import { motion } from 'framer-motion';

interface TaskItemProps {
  task: ChecklistTask;
  onComplete: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskItem({ task, onComplete, onDelete }: TaskItemProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleComplete = async () => {
    if (task.completed || isCompleting) return;
    
    setIsCompleting(true);
    try {
      await onComplete(task.id);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      <div
        className={`
          flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300
          ${
            task.completed
              ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700'
              : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
          }
          ${isCompleting ? 'scale-95 opacity-70' : 'scale-100'}
        `}
      >
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          disabled={task.completed || isCompleting}
          className={`
            flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-300
            flex items-center justify-center
            ${
              task.completed
                ? 'bg-green-500 border-green-500 scale-110'
                : 'border-gray-300 hover:border-green-400 active:scale-95 dark:border-gray-600'
            }
            ${isCompleting ? 'animate-pulse' : ''}
          `}
          aria-label={task.completed ? 'Completed' : 'Mark complete'}
        >
          {task.completed && (
            <motion.svg
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
          )}
        </button>

        {/* Task Title */}
        <div className="flex-1 min-w-0">
          <p
            className={`
              text-base font-medium transition-all duration-300
              ${
                task.completed
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-gray-100'
              }
            `}
          >
            {task.title}
          </p>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="
            flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 
            hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200
            active:scale-95
          "
          aria-label="Delete task"
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Completion XP Notification */}
      {task.completed && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
            +20 XP
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
