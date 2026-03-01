'use client';

/**
 * =============================================================
 * Unified Productivity Dashboard
 * =============================================================
 * 
 * Combines Checklist + Calendar + XP Stats in one view.
 * Perfect for mobile-first iPhone PWA.
 */

import { useState, useEffect } from 'react';
import { Checklist } from '@/components/checklist';
import { Calendar } from '@/components/calendar';
import { CalendarEvent } from '@/types/calendar';
import { getUserStats } from '@/lib/services/xp.service';
import { motion, AnimatePresence } from 'framer-motion';

type TabView = 'today' | 'week' | 'calendar';

interface DashboardProps {
  userId: string;
}

export default function ProductivityDashboard({ userId }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabView>('today');
  const [stats, setStats] = useState({
    level: 1,
    levelTitle: 'Novice',
    totalXP: 0,
    currentLevelXP: 0,
    nextLevelXP: 100,
    progressPercent: 0,
    coins: 0,
    streakDays: 0,
    streakMultiplier: 1.0,
  });
  const [xpAnimation, setXpAnimation] = useState<{
    amount: number;
    source: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    const data = await getUserStats(userId);
    if (data) {
      setStats({
        level: data.level,
        levelTitle: data.levelInfo.title,
        totalXP: data.totalXP,
        currentLevelXP: data.levelInfo.xpInLevel,
        nextLevelXP: data.levelInfo.xpCeiling,
        progressPercent: data.levelInfo.progressPercent,
        coins: data.coins,
        streakDays: data.streak.currentStreak,
        streakMultiplier: data.streak.tier.multiplier,
      });
    }
  };

  const handleXPAwarded = (xp: number, coins: number, source: string) => {
    // Show XP animation
    setXpAnimation({
      amount: xp,
      source,
      timestamp: Date.now(),
    });

    // Update stats optimistically
    setStats(prev => ({
      ...prev,
      totalXP: prev.totalXP + xp,
      coins: prev.coins + coins,
    }));

    // Reload for accurate level calculation
    setTimeout(loadStats, 1000);

    // Clear animation
    setTimeout(() => setXpAnimation(null), 3000);
  };

  const handleChecklistXP = (xp: number, coins: number) => {
    handleXPAwarded(xp, coins, 'Task Completed');
  };

  const handleCalendarXP = (event: CalendarEvent, xp: number) => {
    handleXPAwarded(xp, Math.floor(xp / 5), event.title);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* XP Toast Notification */}
      <AnimatePresence>
        {xpAnimation && (
          <motion.div
            key={xpAnimation.timestamp}
            initial={{ opacity: 0, y: -100, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-60 rounded-full" />
              
              {/* Main Card */}
              <div className="relative px-8 py-5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-4">
                  <motion.span
                    animate={{
                      scale: [1, 1.3, 1],
                      rotate: [0, 360],
                    }}
                    transition={{ duration: 0.6 }}
                    className="text-5xl"
                  >
                    ⭐
                  </motion.span>
                  <div className="text-white">
                    <div className="text-3xl font-black">
                      +{xpAnimation.amount} XP
                    </div>
                    <div className="text-sm opacity-90 font-semibold">
                      {xpAnimation.source}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Stats */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          {/* Level & XP Bar */}
          <div className="flex items-center gap-4 mb-4">
            {/* Level Badge */}
            <div className="flex-shrink-0">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 28}
                    initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                    animate={{
                      strokeDashoffset: 2 * Math.PI * 28 * (1 - stats.progressPercent / 100),
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="text-gradient-to-r from-green-500 to-emerald-600"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                      {stats.level}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <h2 className="text-lg font-black text-gray-900 dark:text-white truncate">
                  {stats.levelTitle}
                </h2>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Level {stats.level}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-bold">{stats.currentLevelXP.toLocaleString()} XP</span>
                <span>/</span>
                <span>{stats.nextLevelXP.toLocaleString()} XP</span>
                <span className="ml-auto font-bold text-green-600 dark:text-green-400">
                  {stats.progressPercent}%
                </span>
              </div>
              {/* Progress Bar */}
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                />
              </div>
            </div>

            {/* Coins */}
            <div className="flex-shrink-0 text-right">
              <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
                {stats.coins.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                💰 Coins
              </div>
            </div>
          </div>

          {/* Streak & Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl p-3 text-center border-2 border-orange-200 dark:border-orange-800">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {stats.streakDays}
              </div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Day Streak
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-3 text-center border-2 border-purple-200 dark:border-purple-800">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {stats.streakMultiplier}×
              </div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                XP Boost
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl p-3 text-center border-2 border-blue-200 dark:border-blue-800">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {stats.totalXP.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Total XP
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('today')}
              className={`
                flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                ${activeTab === 'today'
                  ? 'bg-white dark:bg-gray-700 text-green-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('week')}
              className={`
                flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                ${activeTab === 'week'
                  ? 'bg-white dark:bg-gray-700 text-green-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              This Week
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`
                flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                ${activeTab === 'calendar'
                  ? 'bg-white dark:bg-gray-700 text-green-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Checklist userId={userId} onXPAwarded={handleChecklistXP} />
            </motion.div>
          )}

          {activeTab === 'week' && (
            <motion.div
              key="week"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <WeeklyOverview userId={userId} />
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Calendar userId={userId} onEventComplete={handleCalendarXP} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Weekly Overview Component
function WeeklyOverview({ userId }: { userId: string }) {
  const [weekData, setWeekData] = useState({
    tasksCompleted: 0,
    eventsCompleted: 0,
    totalXP: 0,
    daysActive: 0,
  });

  useEffect(() => {
    loadWeeklyData();
  }, [userId]);

  const loadWeeklyData = async () => {
    // This would fetch from your API
    // For now, showing placeholder
    setWeekData({
      tasksCompleted: 28,
      eventsCompleted: 12,
      totalXP: 840,
      daysActive: 6,
    });
  };

  return (
    <div className="space-y-6">
      {/* Weekly Summary Card */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-3xl p-8 text-white shadow-2xl">
        <h2 className="text-2xl font-black mb-6">This Week's Progress</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-5xl font-black">{weekData.tasksCompleted}</div>
            <div className="text-sm opacity-90 font-semibold mt-1">Tasks Completed</div>
          </div>
          <div>
            <div className="text-5xl font-black">{weekData.eventsCompleted}</div>
            <div className="text-sm opacity-90 font-semibold mt-1">Events Done</div>
          </div>
          <div>
            <div className="text-5xl font-black">{weekData.totalXP}</div>
            <div className="text-sm opacity-90 font-semibold mt-1">XP Earned</div>
          </div>
          <div>
            <div className="text-5xl font-black">{weekData.daysActive}</div>
            <div className="text-sm opacity-90 font-semibold mt-1">Days Active</div>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
          Crushing It!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You're on track to hit your weekly goal. Keep up the amazing work!
        </p>
      </div>
    </div>
  );
}
