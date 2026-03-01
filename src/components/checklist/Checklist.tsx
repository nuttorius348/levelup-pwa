'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChecklistTask, ChecklistStats } from '@/types/checklist';
import { TaskItem } from './TaskItem';
import { ProgressBar } from './ProgressBar';
import { StreakCounter } from './StreakCounter';
import { createClient } from '@/lib/supabase/client';

interface ChecklistProps {
  userId: string;
  onXPAwarded?: (xp: number, coins: number) => void;
}

export function Checklist({ userId, onXPAwarded }: ChecklistProps) {
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [stats, setStats] = useState<ChecklistStats>({
    totalTasks: 0,
    completedTasks: 0,
    progressPercent: 0,
    currentStreak: 0,
    isStreakActive: false,
    xpEarnedToday: 0,
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  // Load tasks and stats
  useEffect(() => {
    loadTasks();
    loadStats();
  }, [userId]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('checklist_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('streak_days, last_active_date')
        .eq('id', userId)
        .single();

      if (user) {
        const isActive = user.last_active_date === today;
        setStats((prev) => ({
          ...prev,
          currentStreak: user.streak_days || 0,
          isStreakActive: isActive,
        }));
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // Update stats when tasks change
  useEffect(() => {
    const completed = tasks.filter((t) => t.completed).length;
    const total = tasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    setStats((prev) => ({
      ...prev,
      totalTasks: total,
      completedTasks: completed,
      progressPercent: percent,
    }));
  }, [tasks]);

  const addTask = async () => {
    if (!newTaskTitle.trim() || isAddingTask) return;

    setIsAddingTask(true);
    setError(null);

    try {
      const maxOrder =
        tasks.length > 0 ? Math.max(...tasks.map((t) => t.order_index)) : -1;

      const { data, error } = await supabase
        .from('checklist_tasks')
        .insert({
          user_id: userId,
          title: newTaskTitle.trim(),
          date: today,
          order_index: maxOrder + 1,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setTasks((prev) => [...prev, data]);
      setNewTaskTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setIsAddingTask(false);
    }
  };

  const completeTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.completed) return;

    try {
      // Mark task as completed
      const { error: updateError } = await supabase
        .from('checklist_tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Award XP via API
      const response = await fetch('/api/xp/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'routine_task',
          idempotencyKey: `task_${taskId}`,
          metadata: { taskId, taskTitle: task.title },
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update UI
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, completed: true, completed_at: new Date().toISOString() }
              : t
          )
        );

        // Notify parent
        onXPAwarded?.(result.data.xpAwarded, result.data.coinsEarned);

        // Update streak if it's the first task today
        const isFirstTaskToday = tasks.filter((t) => t.completed).length === 0;
        if (isFirstTaskToday) {
          await fetch('/api/xp/update-streak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
          loadStats();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('checklist_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          Daily Tasks
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Complete tasks to earn XP and maintain your streak!
        </p>
      </motion.div>

      {/* Streak Counter */}
      <StreakCounter
        days={stats.currentStreak}
        isActive={stats.isStreakActive}
        multiplier={stats.currentStreak >= 7 ? 1.5 : 1.0}
      />

      {/* Progress Bar */}
      {tasks.length > 0 && (
        <ProgressBar
          completed={stats.completedTasks}
          total={stats.totalTasks}
        />
      )}

      {/* Add Task Input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a new task..."
          disabled={isAddingTask}
          className="
            flex-1 px-4 py-3 text-base rounded-xl border-2 border-gray-200
            dark:border-gray-700 dark:bg-gray-800 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            transition-all duration-200
            disabled:opacity-50
          "
        />
        <button
          onClick={addTask}
          disabled={!newTaskTitle.trim() || isAddingTask}
          className="
            px-6 py-3 bg-gradient-to-r from-green-500 to-green-600
            text-white font-semibold rounded-xl
            hover:from-green-600 hover:to-green-700
            active:scale-95 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          "
        >
          {isAddingTask ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>Add</span>
          )}
        </button>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={completeTask}
              onDelete={deleteTask}
            />
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 space-y-3"
          >
            <div className="text-6xl">📝</div>
            <p className="text-gray-500 dark:text-gray-400">
              No tasks yet. Add your first task to get started!
            </p>
          </motion.div>
        )}
      </div>

      {/* Daily Reset Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs text-gray-500 dark:text-gray-400"
      >
        Tasks reset daily at midnight
      </motion.div>
    </div>
  );
}
