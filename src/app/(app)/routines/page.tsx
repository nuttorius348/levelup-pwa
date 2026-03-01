'use client';

// =============================================================
// Routines Page — Daily routine checklist with create/complete
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '@/components/ui/BackButton';

interface RoutineItem {
  id: string;
  title: string;
  sort_order: number;
  xp_value: number;
}

interface Routine {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  recurrence: { type: string; days?: number[] };
  routine_items: RoutineItem[];
}

interface Completion {
  routine_item_id: string;
}

const ICONS = ['📋', '🌅', '💪', '📚', '🧘', '🎯', '💧', '🏃', '🧠', '🎨', '🛌', '🍎'];

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [xpPopup, setXpPopup] = useState<{ id: string; xp: number; bonus?: number } | null>(null);

  const fetchRoutines = useCallback(async () => {
    try {
      const res = await fetch('/api/routines');
      if (res.ok) {
        const data = await res.json();
        setRoutines(data.routines ?? []);
        setCompletions(data.completions ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutines(); }, [fetchRoutines]);

  const completeItem = async (routineId: string, itemId: string) => {
    setCompletingId(itemId);
    try {
      const res = await fetch('/api/routines/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routineId, routineItemId: itemId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCompletions(prev => [...prev, { routine_item_id: itemId }]);
        setXpPopup({ id: itemId, xp: data.xp?.finalXP ?? 10, bonus: data.fullRoutineBonus?.finalXP });
        setTimeout(() => setXpPopup(null), 2000);
      }
    } catch {
      // silent
    } finally {
      setCompletingId(null);
    }
  };

  const isCompleted = (itemId: string) => completions.some(c => c.routine_item_id === itemId);

  const getProgress = (routine: Routine) => {
    const total = routine.routine_items?.length ?? 0;
    const done = routine.routine_items?.filter(i => isCompleted(i.id)).length ?? 0;
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-white/5 animate-pulse" />
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackButton href="/dashboard" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            My Routines
          </h1>
          <p className="text-slate-400 text-sm mt-1">Complete tasks to earn XP</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-xl text-sm font-medium transition"
        >
          <span>+</span> New
        </button>
      </div>

      {/* Routines List */}
      {routines.length === 0 && !showCreate ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-medium">No routines yet</p>
          <p className="text-sm mt-1">Create your first routine to start earning XP!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            Create Routine
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {routines.map(routine => {
              const { done, total, pct } = getProgress(routine);
              return (
                <motion.div
                  key={routine.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  {/* Routine Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{routine.icon}</span>
                      <div>
                        <h3 className="font-semibold text-white">{routine.title}</h3>
                        <p className="text-xs text-slate-400">
                          {done}/{total} done
                          <span className="ml-2 text-slate-500">
                            {routine.recurrence?.type === 'daily' ? '(Daily)' :
                             routine.recurrence?.type === 'weekdays' ? '(Weekdays)' :
                             routine.recurrence?.type === 'weekends' ? '(Weekends)' :
                             routine.recurrence?.type === 'custom' && routine.recurrence?.days ?
                               `(${routine.recurrence.days.map((d: number) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')})` :
                             ''}
                          </span>
                        </p>
                      </div>
                    </div>
                    {pct === 100 && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">
                        Complete!
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mx-4 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: routine.color || '#4C6EF5' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Items */}
                  <div className="p-3 space-y-1">
                    {routine.routine_items
                      ?.sort((a, b) => a.sort_order - b.sort_order)
                      .map(item => {
                        const completed = isCompleted(item.id);
                        const completing = completingId === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            onClick={() => !completed && !completing && completeItem(routine.id, item.id)}
                            disabled={completed || completing}
                            className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition relative ${
                              completed
                                ? 'bg-white/[0.02] text-slate-500'
                                : 'bg-white/[0.04] hover:bg-white/[0.08] text-white'
                            }`}
                            whileTap={!completed ? { scale: 0.98 } : undefined}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                              completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-slate-600'
                            }`}>
                              {completed && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-white text-xs"
                                >&#10003;</motion.span>
                              )}
                              {completing && (
                                <div className="w-3 h-3 border-2 border-t-transparent border-violet-400 rounded-full animate-spin" />
                              )}
                            </div>
                            <span className={completed ? 'line-through' : ''}>
                              {item.title}
                            </span>
                            <span className="ml-auto text-xs text-slate-500">+{item.xp_value} XP</span>

                            {/* XP Popup */}
                            <AnimatePresence>
                              {xpPopup?.id === item.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 0 }}
                                  animate={{ opacity: 1, y: -20 }}
                                  exit={{ opacity: 0, y: -40 }}
                                  className="absolute right-2 -top-2 text-sm font-bold text-green-400"
                                >
                                  +{xpPopup.xp} XP
                                  {xpPopup.bonus && (
                                    <span className="text-amber-400 ml-1">+{xpPopup.bonus} bonus!</span>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Routine Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateRoutineModal
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); fetchRoutines(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================
// CreateRoutineModal
// =============================================================
function CreateRoutineModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📋');
  const [color, setColor] = useState('#4C6EF5');
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [items, setItems] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (day: number) => {
    setCustomDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  const addItem = () => setItems(prev => [...prev, '']);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, val: string) => setItems(prev => prev.map((v, i) => i === idx ? val : v));

  const handleSave = async () => {
    const validItems = items.filter(i => i.trim());
    if (!title.trim()) { setError('Title required'); return; }
    if (validItems.length === 0) { setError('Add at least one task'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          icon,
          color,
          recurrence: recurrenceType === 'custom'
            ? { type: 'custom', days: customDays }
            : { type: recurrenceType },
          items: validItems.map(t => ({ title: t.trim() })),
        }),
      });
      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 p-6 space-y-5 max-h-[80vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold text-white">New Routine</h2>

        {/* Title */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Morning Routine"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Icon</label>
          <div className="flex gap-2 flex-wrap">
            {ICONS.map(ic => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`text-xl p-1.5 rounded-lg transition ${icon === ic ? 'bg-violet-600/30 ring-2 ring-violet-500' : 'hover:bg-white/10'}`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Color</label>
          <div className="flex gap-2">
            {['#4C6EF5', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#06B6D4'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Recurrence */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Repeat</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'daily' as const, label: 'Every Day', icon: '📅' },
              { key: 'weekdays' as const, label: 'Weekdays', icon: '💼' },
              { key: 'weekends' as const, label: 'Weekends', icon: '🌴' },
              { key: 'custom' as const, label: 'Custom', icon: '⚙️' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setRecurrenceType(opt.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${
                  recurrenceType === opt.key
                    ? 'bg-violet-600/30 ring-1 ring-violet-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
          {recurrenceType === 'custom' && (
            <div className="flex gap-1.5 mt-2">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleDay(idx)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                    customDays.includes(idx)
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/5 text-slate-500 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Tasks</label>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={item}
                  onChange={e => updateItem(idx, e.target.value)}
                  placeholder={`Task ${idx + 1}`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="text-slate-500 hover:text-red-400 px-2 transition">
                    x
                  </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addItem} className="text-sm text-violet-400 hover:text-violet-300 mt-2 transition">
            + Add task
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 text-sm font-medium transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition"
          >
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
