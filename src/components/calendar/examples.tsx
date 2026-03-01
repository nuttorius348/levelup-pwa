/**
 * =============================================================
 * Advanced Calendar Integration Examples
 * =============================================================
 * 
 * Production-ready patterns for calendar features.
 */

'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/calendar';
import { CalendarEvent, CalendarEventCategory, CategoryConfig, CALENDAR_CATEGORIES } from '@/types/calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

// ── Example 1: Calendar with Weekly Summary ──────────────────

export function CalendarWithWeeklySummary({ userId }: { userId: string }) {
  const [weeklyStats, setWeeklyStats] = useState({
    eventsCompleted: 0,
    totalEvents: 0,
    xpEarned: 0,
    streak: 0,
  });

  useEffect(() => {
    loadWeeklyStats();
  }, [userId]);

  const loadWeeklyStats = async () => {
    const supabase = createClient();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', weekAgo.toISOString());

    const completed = events?.filter(e => e.completed).length || 0;
    const total = events?.length || 0;

    setWeeklyStats({
      eventsCompleted: completed,
      totalEvents: total,
      xpEarned: completed * 30,
      streak: calculateStreak((events || []) as unknown as CalendarEvent[]),
    });
  };

  const calculateStreak = (events: CalendarEvent[]) => {
    const completedDates = new Set(
      events
        .filter(e => e.completed)
        .map(e => new Date(e.start_time).toDateString())
    );
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      if (!completedDates.has(date.toDateString())) break;
      streak++;
    }
    
    return streak;
  };

  const handleEventComplete = () => {
    loadWeeklyStats(); // Refresh stats
  };

  return (
    <div className="space-y-6">
      {/* Weekly Summary Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
        <h3 className="text-lg font-bold mb-4">This Week</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-3xl font-black">{weeklyStats.eventsCompleted}</div>
            <div className="text-xs opacity-90">Completed</div>
          </div>
          <div>
            <div className="text-3xl font-black">{weeklyStats.totalEvents}</div>
            <div className="text-xs opacity-90">Total</div>
          </div>
          <div>
            <div className="text-3xl font-black">{weeklyStats.xpEarned}</div>
            <div className="text-xs opacity-90">XP</div>
          </div>
          <div>
            <div className="text-3xl font-black">{weeklyStats.streak}</div>
            <div className="text-xs opacity-90">Day Streak</div>
          </div>
        </div>
      </div>

      <Calendar userId={userId} onEventComplete={handleEventComplete} />
    </div>
  );
}

// ── Example 2: Auto-Sync Routines to Calendar ────────────────

export function CalendarWithRoutineSync({ userId }: { userId: string }) {
  const [routines, setRoutines] = useState<Array<{ id: string; name: string }>>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadRoutines();
  }, [userId]);

  const loadRoutines = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('routines')
      .select('id, title')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    setRoutines((data || []).map(r => ({ id: r.id, name: r.title })));
  };

  const syncRoutineToCalendar = async (routineId: string, routineName: string) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          routineId,
          routineName,
          mode: 'single',
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`✓ Routine synced to calendar!`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllRoutines = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mode: 'weekly',
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`✓ Created ${result.created} events for next 7 days!`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Routine Sync Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Sync Routines
          </h3>
          <button
            onClick={syncAllRoutines}
            disabled={isSyncing}
            className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : 'Sync All (7 days)'}
          </button>
        </div>
        
        <div className="space-y-2">
          {routines.map(routine => (
            <div
              key={routine.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {routine.name}
              </span>
              <button
                onClick={() => syncRoutineToCalendar(routine.id, routine.name)}
                disabled={isSyncing}
                className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Add to Calendar
              </button>
            </div>
          ))}
        </div>
      </div>

      <Calendar userId={userId} />
    </div>
  );
}

// ── Example 3: Calendar with Category Filter ─────────────────

export function CalendarWithCategoryFilter({ userId }: { userId: string }) {
  const [selectedCategories, setSelectedCategories] = useState<Set<CalendarEventCategory>>(
    new Set(['workout', 'routine', 'meeting', 'personal', 'wellness', 'stretch', 'other'])
  );

  const toggleCategory = (category: CalendarEventCategory) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
          Filter by Category
        </h3>
        <div className="flex flex-wrap gap-2">
          {CALENDAR_CATEGORIES.map((cat: CategoryConfig) => (
            <button
              key={cat.name}
              onClick={() => toggleCategory(cat.name)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all
                ${selectedCategories.has(cat.name)
                  ? `${cat.bgColor} ${cat.color} border-2 border-current`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-2 border-transparent'
                }
              `}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              {selectedCategories.has(cat.name) && <span>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar with filter applied (you'd pass filter to Calendar component) */}
      <Calendar userId={userId} />
    </div>
  );
}

// ── Example 4: Upcoming Events List ──────────────────────────

export function CalendarWithUpcomingEvents({ userId }: { userId: string }) {
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    loadUpcomingEvents();
  }, [userId]);

  const loadUpcomingEvents = async () => {
    const supabase = createClient();
    const now = new Date().toISOString();
    
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', now)
      .eq('completed', false)
      .order('start_time', { ascending: true })
      .limit(5);
    
    setUpcomingEvents((data || []) as unknown as CalendarEvent[]);
  };

  const { getCategoryConfig } = require('@/types/calendar');

  return (
    <div className="space-y-6">
      {/* Upcoming Events Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Next Up
        </h3>
        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No upcoming events</p>
          ) : (
            upcomingEvents.map(event => {
              const config = getCategoryConfig(event.category);
              const startTime = new Date(event.start_time);
              const isToday = startTime.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${config.bgColor}`}
                >
                  <span className="text-2xl">{config.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${config.color}`}>
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {isToday ? 'Today' : startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' at '}
                      {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Calendar userId={userId} onEventComplete={loadUpcomingEvents} />
    </div>
  );
}

// ── Example 5: Calendar with Productivity Score ──────────────

export function CalendarWithProductivityScore({ userId }: { userId: string }) {
  const [score, setScore] = useState(0);

  useEffect(() => {
    calculateProductivityScore();
  }, [userId]);

  const calculateProductivityScore = async () => {
    const supabase = createClient();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', weekAgo.toISOString());

    const total = events?.length || 0;
    const completed = events?.filter(e => e.completed).length || 0;
    
    // Score: 0-100 based on completion rate + volume
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const volumeBonus = Math.min(completed * 2, 20); // Max 20 bonus
    const finalScore = Math.min(Math.round(completionRate * 0.8 + volumeBonus), 100);
    
    setScore(finalScore);
  };

  const getScoreColor = () => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-cyan-600';
    if (score >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getScoreLabel = () => {
    if (score >= 80) return '🔥 On Fire!';
    if (score >= 60) return '💪 Strong';
    if (score >= 40) return '📈 Building';
    return '🌱 Getting Started';
  };

  return (
    <div className="space-y-6">
      {/* Productivity Score Card */}
      <div className={`bg-gradient-to-r ${getScoreColor()} rounded-2xl p-6 text-white shadow-xl`}>
        <h3 className="text-sm font-semibold opacity-90 mb-2">
          Productivity Score
        </h3>
        <div className="flex items-end gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-6xl font-black"
          >
            {score}
          </motion.div>
          <div className="pb-2">
            <div className="text-2xl font-bold">{getScoreLabel()}</div>
            <div className="text-sm opacity-90">Keep up the great work!</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-white rounded-full"
          />
        </div>
      </div>

      <Calendar userId={userId} onEventComplete={calculateProductivityScore} />
    </div>
  );
}

// ── Example 6: Calendar with Time Blocking ───────────────────

export function CalendarWithTimeBlocking({ userId }: { userId: string }) {
  const [focusHours, setFocusHours] = useState({ start: 9, end: 17 });

  const createFocusBlock = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(focusHours.start, 0, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setHours(focusHours.end, 0, 0, 0);

    const supabase = createClient();
    await supabase.from('calendar_events').insert({
      user_id: userId,
      title: '🎯 Focus Time',
      description: 'Deep work block - no meetings',
      category: 'personal',
      start_time: tomorrow.toISOString(),
      end_time: endTime.toISOString(),
      all_day: false,
      completed: false,
      xp_awarded: false,
    });

    alert('✓ Focus block created!');
  };

  return (
    <div className="space-y-6">
      {/* Time Blocking Panel */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-bold mb-4">⏰ Time Blocking</h3>
        <p className="text-sm opacity-90 mb-4">
          Schedule focused work sessions
        </p>
        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs font-semibold block mb-1">Start</label>
            <input
              type="number"
              min="0"
              max="23"
              value={focusHours.start}
              onChange={e => setFocusHours(prev => ({ ...prev, start: parseInt(e.target.value) }))}
              className="w-20 px-3 py-2 rounded-lg bg-white/20 text-white font-bold text-center"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">End</label>
            <input
              type="number"
              min="0"
              max="23"
              value={focusHours.end}
              onChange={e => setFocusHours(prev => ({ ...prev, end: parseInt(e.target.value) }))}
              className="w-20 px-3 py-2 rounded-lg bg-white/20 text-white font-bold text-center"
            />
          </div>
          <button
            onClick={createFocusBlock}
            className="ml-auto px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
          >
            Create Block
          </button>
        </div>
      </div>

      <Calendar userId={userId} />
    </div>
  );
}
