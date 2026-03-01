/**
 * =============================================================
 * Advanced Checklist Integration Examples
 * =============================================================
 * 
 * This file demonstrates advanced usage patterns for the
 * Checklist component with custom features.
 */

'use client';

import { useState, useEffect } from 'react';
import { Checklist } from '@/components/checklist';
import { getUserStats } from '@/lib/services/xp.service';
import { motion, AnimatePresence } from 'framer-motion';

// ── Example 1: Full Dashboard with Stats ─────────────────────

export function ChecklistDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState({
    level: 1,
    totalXP: 0,
    coins: 0,
    streakDays: 0,
  });
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Load user stats
  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    const data = await getUserStats(userId);
    if (data) {
      setStats({
        level: data.level,
        totalXP: data.totalXP,
        coins: data.coins,
        streakDays: data.streak.currentStreak,
      });
    }
  };

  const handleXPAwarded = (xp: number, coins: number) => {
    // Update local stats optimistically
    setStats((prev) => ({
      ...prev,
      totalXP: prev.totalXP + xp,
      coins: prev.coins + coins,
    }));

    // Reload to check for level up
    setTimeout(loadStats, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Level */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-lg">
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {stats.level}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Level
            </div>
          </div>

          {/* Total XP */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-lg">
            <div className="text-3xl font-black text-green-600 dark:text-green-400">
              {stats.totalXP.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Total XP
            </div>
          </div>

          {/* Coins */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-lg">
            <div className="text-3xl font-black text-yellow-600 dark:text-yellow-400">
              {stats.coins.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Coins
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <Checklist userId={userId} onXPAwarded={handleXPAwarded} />
    </div>
  );
}

// ── Example 2: With Custom XP Notification ───────────────────

export function ChecklistWithNotification({ userId }: { userId: string }) {
  const [notification, setNotification] = useState<{
    xp: number;
    coins: number;
    timestamp: number;
  } | null>(null);

  const handleXPAwarded = (xp: number, coins: number) => {
    setNotification({
      xp,
      coins,
      timestamp: Date.now(),
    });

    // Clear after 4 seconds
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return (
    <div className="relative">
      {/* Floating XP Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.timestamp}
            initial={{ opacity: 0, y: -100, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-60 rounded-full" />
              
              {/* Main Card */}
              <div className="relative px-8 py-5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-4">
                  <motion.span
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 0.6,
                      ease: 'easeOut',
                    }}
                    className="text-4xl"
                  >
                    ⭐
                  </motion.span>
                  <div className="text-white">
                    <div className="text-2xl font-black">
                      +{notification.xp} XP
                    </div>
                    <div className="text-sm opacity-90">
                      +{notification.coins} coins earned!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Checklist userId={userId} onXPAwarded={handleXPAwarded} />
    </div>
  );
}

// ── Example 3: With Daily Goals ──────────────────────────────

export function ChecklistWithGoals({ userId }: { userId: string }) {
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const dailyGoal = 5;

  const handleXPAwarded = (xp: number, coins: number) => {
    setTasksCompleted((prev) => prev + 1);
  };

  const progressPercent = Math.min((tasksCompleted / dailyGoal) * 100, 100);
  const isGoalReached = tasksCompleted >= dailyGoal;

  return (
    <div className="space-y-6">
      {/* Daily Goal Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Daily Goal
          </h3>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {tasksCompleted} / {dailyGoal}
          </span>
        </div>

        {/* Progress Ring */}
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 56}
              initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
              animate={{
                strokeDashoffset:
                  2 * Math.PI * 56 * (1 - progressPercent / 100),
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-green-500"
              strokeLinecap="round"
            />
          </svg>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isGoalReached ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-4xl"
              >
                🎉
              </motion.span>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {Math.round(progressPercent)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {isGoalReached && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm font-semibold text-green-600 dark:text-green-400 mt-4"
          >
            Goal reached! Great work! 🌟
          </motion.p>
        )}
      </div>

      <Checklist userId={userId} onXPAwarded={handleXPAwarded} />
    </div>
  );
}

// ── Example 4: With Sound Effects ────────────────────────────

export function ChecklistWithSound({ userId }: { userId: string }) {
  const playSound = (type: 'complete' | 'levelup') => {
    // Use Web Audio API or HTML5 Audio
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Handle autoplay restrictions
      console.log('Sound playback failed');
    });
  };

  const handleXPAwarded = (xp: number, coins: number) => {
    playSound('complete');
    
    // Check for level up (you'd get this from the API response)
    // if (levelUp) playSound('levelup');
  };

  return <Checklist userId={userId} onXPAwarded={handleXPAwarded} />;
}

// ── Example 5: With Weekly Summary ───────────────────────────

export function ChecklistWithSummary({ userId }: { userId: string }) {
  const [weeklyStats, setWeeklyStats] = useState({
    tasksCompleted: 0,
    xpEarned: 0,
    daysActive: 0,
  });

  useEffect(() => {
    loadWeeklyStats();
  }, [userId]);

  const loadWeeklyStats = async () => {
    // Fetch from API
    const response = await fetch(`/api/checklist/weekly-stats?userId=${userId}`);
    const data = await response.json();
    setWeeklyStats(data);
  };

  const handleXPAwarded = (xp: number) => {
    setWeeklyStats((prev) => ({
      ...prev,
      xpEarned: prev.xpEarned + xp,
      tasksCompleted: prev.tasksCompleted + 1,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
        <h3 className="text-lg font-bold mb-4">This Week</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-3xl font-black">{weeklyStats.tasksCompleted}</div>
            <div className="text-xs opacity-90">Tasks</div>
          </div>
          <div>
            <div className="text-3xl font-black">{weeklyStats.xpEarned}</div>
            <div className="text-xs opacity-90">XP</div>
          </div>
          <div>
            <div className="text-3xl font-black">{weeklyStats.daysActive}</div>
            <div className="text-xs opacity-90">Days</div>
          </div>
        </div>
      </div>

      <Checklist userId={userId} onXPAwarded={handleXPAwarded} />
    </div>
  );
}

// ── Example 6: With Confetti on Completion ───────────────────

export function ChecklistWithConfetti({ userId }: { userId: string }) {
  const [showConfetti, setShowConfetti] = useState(false);

  const handleXPAwarded = (xp: number, coins: number) => {
    // Trigger confetti
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <div className="relative">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: '50vw',
                y: '50vh',
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: `${Math.random() * 100}vw`,
                y: `${100 + Math.random() * 20}vh`,
                opacity: 0,
                scale: 0,
                rotate: Math.random() * 720,
              }}
              transition={{
                duration: 2 + Math.random(),
                ease: 'easeOut',
              }}
              className={`absolute w-3 h-3 rounded-full`}
              style={{
                backgroundColor: [
                  '#FFD700',
                  '#FF6B6B',
                  '#4ECDC4',
                  '#45B7D1',
                  '#F7B731',
                ][Math.floor(Math.random() * 5)],
              }}
            />
          ))}
        </div>
      )}

      <Checklist userId={userId} onXPAwarded={handleXPAwarded} />
    </div>
  );
}
