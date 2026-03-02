'use client';

// =============================================================
// Tasks Page — Combined routine tasks + ad-hoc tasks
// XP only awarded when ALL tasks are complete ("Claim Daily XP")
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface RoutineItem {
  id: string;
  title: string;
  sort_order: number;
  xp_value: number;
}

interface Routine {
  id: string;
  title: string;
  icon: string;
  color: string;
  recurrence: { type: string; days?: number[] } | null;
  routine_items: RoutineItem[];
}

interface AdHocTask {
  id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
}

function isRoutineActiveToday(recurrence: { type: string; days?: number[] } | null): boolean {
  const day = new Date().getDay();
  if (!recurrence) return true;
  switch (recurrence.type) {
    case 'daily': return true;
    case 'weekdays': return day >= 1 && day <= 5;
    case 'weekends': return day === 0 || day === 6;
    case 'custom': return recurrence.days?.includes(day) ?? true;
    default: return true;
  }
}

export default function TasksPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [adHocTasks, setAdHocTasks] = useState<AdHocTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimResult, setClaimResult] = useState<{ xp: number; coins: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  // Load everything
  const loadData = useCallback(async () => {
    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch routines
      const routinesRes = await fetch('/api/routines');
      if (routinesRes.ok) {
        const data = await routinesRes.json();
        const allRoutines: Routine[] = data.routines ?? [];
        const activeToday = allRoutines.filter(r => isRoutineActiveToday(r.recurrence));
        setRoutines(activeToday);

        // Completions from API
        const completions: { routine_item_id: string }[] = data.completions ?? [];
        setCompletedIds(new Set(completions.map(c => c.routine_item_id)));
      }

      // Fetch ad-hoc tasks
      const { data: tasks } = await supabase
        .from('checklist_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('order_index');

      setAdHocTasks(tasks ?? []);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { loadData(); }, [loadData]);

  // Complete a routine item
  const completeRoutineItem = async (routineId: string, itemId: string) => {
    setCompletingId(itemId);
    try {
      const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'routine', routineId, routineItemId: itemId }),
      });
      if (res.ok) {
        setCompletedIds(prev => new Set([...prev, itemId]));
      }
    } catch {
      setError('Failed to complete task');
    } finally {
      setCompletingId(null);
    }
  };

  // Complete an ad-hoc task
  const completeAdHocTask = async (taskId: string) => {
    setCompletingId(taskId);
    try {
      const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'adhoc', taskId }),
      });
      if (res.ok) {
        setAdHocTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      }
    } catch {
      setError('Failed to complete task');
    } finally {
      setCompletingId(null);
    }
  };

  // Add ad-hoc task
  const addAdHocTask = async () => {
    if (!newTaskTitle.trim() || !userId) return;
    try {
      const maxOrder = adHocTasks.length > 0 ? Math.max(...adHocTasks.map(t => 0)) : 0;
      const { data, error: insertErr } = await supabase
        .from('checklist_tasks')
        .insert({
          user_id: userId,
          title: newTaskTitle.trim(),
          date: today,
          order_index: maxOrder + adHocTasks.length,
          completed: false,
        })
        .select()
        .single();

      if (!insertErr && data) {
        setAdHocTasks(prev => [...prev, data]);
        setNewTaskTitle('');
      }
    } catch {
      setError('Failed to add task');
    }
  };

  // Delete ad-hoc task
  const deleteAdHocTask = async (taskId: string) => {
    await supabase.from('checklist_tasks').delete().eq('id', taskId);
    setAdHocTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Claim daily XP
  const claimDailyXP = async () => {
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks/claim-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setClaimed(true);
        setClaimResult({ xp: data.xp, coins: data.coins });
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Failed to claim XP');
    } finally {
      setClaiming(false);
    }
  };

  // Calculate progress
  const allRoutineItems = routines.flatMap(r => r.routine_items ?? []);
  const routineDone = allRoutineItems.filter(i => completedIds.has(i.id)).length;
  const adHocDone = adHocTasks.filter(t => t.completed).length;
  const totalTasks = allRoutineItems.length + adHocTasks.length;
  const totalDone = routineDone + adHocDone;
  const progressPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const allComplete = totalTasks > 0 && totalDone === totalTasks;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-white/5 animate-pulse" />
        {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Today&apos;s Tasks
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{totalDone}/{totalTasks} tasks</span>
          <span className="text-sm text-slate-400">{progressPct}%</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {allComplete && !claimed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-emerald-400 text-sm mt-2 text-center font-medium"
          >
            🎉 All tasks complete! Claim your XP below
          </motion.p>
        )}
      </div>

      {/* XP Claim Result */}
      <AnimatePresence>
        {claimResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-6 text-center"
          >
            <div className="text-4xl mb-2">⭐</div>
            <p className="text-2xl font-black text-yellow-400">+{claimResult.xp} XP</p>
            <p className="text-sm text-yellow-300/70 mt-1">+{claimResult.coins} coins earned</p>
            <p className="text-xs text-slate-400 mt-2">Great work completing all your tasks!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Routine Tasks */}
      {routines.map(routine => {
        const items = (routine.routine_items ?? []).sort((a, b) => a.sort_order - b.sort_order);
        const routineComplete = items.every(i => completedIds.has(i.id));

        return (
          <div key={routine.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{routine.icon}</span>
              <h3 className="text-sm font-semibold text-white">{routine.title}</h3>
              {routineComplete && (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full ml-auto">Done</span>
              )}
            </div>
            {items.map(item => {
              const done = completedIds.has(item.id);
              const isCompleting = completingId === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => !done && !isCompleting && completeRoutineItem(routine.id, item.id)}
                  disabled={done || isCompleting}
                  whileTap={!done ? { scale: 0.98 } : undefined}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition ${
                    done
                      ? 'bg-white/[0.02] text-slate-500'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                    done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                  }`}>
                    {done && <span className="text-white text-xs">✓</span>}
                    {isCompleting && <div className="w-3 h-3 border-2 border-t-transparent border-emerald-400 rounded-full animate-spin" />}
                  </div>
                  <span className={done ? 'line-through' : ''}>{item.title}</span>
                </motion.button>
              );
            })}
          </div>
        );
      })}

      {/* Ad-Hoc Tasks */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span>📝</span> Extra Tasks
          <span className="text-xs text-slate-500 font-normal ml-1">
            ({adHocTasks.filter(t => t.completed).length}/{adHocTasks.length})
          </span>
        </h3>

        {adHocTasks.map(task => {
          const isCompleting = completingId === task.id;
          return (
            <motion.div
              key={task.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                task.completed
                  ? 'bg-white/[0.02] text-slate-500'
                  : 'bg-white/[0.04] text-white'
              }`}
            >
              <button
                onClick={() => !task.completed && !isCompleting && completeAdHocTask(task.id)}
                disabled={task.completed || isCompleting}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                  task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-emerald-400'
                }`}
              >
                {task.completed && <span className="text-white text-xs">✓</span>}
                {isCompleting && <div className="w-3 h-3 border-2 border-t-transparent border-emerald-400 rounded-full animate-spin" />}
              </button>
              <span className={`flex-1 ${task.completed ? 'line-through' : ''}`}>{task.title}</span>
              {!task.completed && (
                <button
                  onClick={() => deleteAdHocTask(task.id)}
                  className="text-slate-600 hover:text-red-400 text-xs px-1 transition"
                >
                  ✕
                </button>
              )}
            </motion.div>
          );
        })}

        {/* Add task input */}
        <div className="flex gap-2 mt-2">
          <input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addAdHocTask()}
            placeholder="Add extra task..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          <button
            onClick={addAdHocTask}
            disabled={!newTaskTitle.trim()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-xl text-sm font-medium transition"
          >
            Add
          </button>
        </div>
      </div>

      {/* Empty state */}
      {totalTasks === 0 && (
        <div className="text-center py-12 text-slate-500">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-medium">No tasks for today</p>
          <p className="text-sm mt-1">Create routines or add extra tasks above!</p>
        </div>
      )}

      {/* Claim XP Button */}
      {totalTasks > 0 && (
        <motion.button
          onClick={claimDailyXP}
          disabled={!allComplete || claimed || claiming}
          whileTap={allComplete && !claimed ? { scale: 0.97 } : undefined}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition ${
            allComplete && !claimed
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40'
              : claimed
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 text-slate-600 cursor-not-allowed'
          }`}
        >
          {claiming ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
              Claiming...
            </span>
          ) : claimed ? (
            '✅ XP Claimed!'
          ) : allComplete ? (
            '⭐ Claim Daily XP'
          ) : (
            `🔒 Complete all tasks to earn XP (${totalDone}/${totalTasks})`
          )}
        </motion.button>
      )}

      {/* Info */}
      <p className="text-center text-[10px] text-slate-600">
        XP is only awarded when all tasks are completed • Tasks reset daily
      </p>
    </div>
  );
}
