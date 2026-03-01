'use client';

// =============================================================
// DailyLoginCalendar — 7-day login reward cycle
// =============================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LoginCalendarState } from '@/types/economy';

interface DailyLoginCalendarProps {
  onClaim?: () => void;
}

export default function DailyLoginCalendar({ onClaim }: DailyLoginCalendarProps) {
  const [state, setState] = useState<LoginCalendarState | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchCalendar();
  }, []);

  async function fetchCalendar() {
    const res = await fetch('/api/shop/daily-login');
    const data = await res.json();
    setState(data.state);
  }

  async function handleClaim() {
    setClaiming(true);

    const res = await fetch('/api/shop/daily-login', {
      method: 'POST',
    });

    const data = await res.json();

    if (data.success) {
      alert(data.message);
      fetchCalendar();
      onClaim?.();
    } else {
      alert(data.error || 'Failed to claim');
    }

    setClaiming(false);
  }

  if (!state) {
    return (
      <div className="mb-6 p-4 bg-gradient-to-br from-violet-950/40 to-blue-950/40 border border-violet-500/30 rounded-xl">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-gradient-to-br from-violet-950/40 to-blue-950/40 border border-violet-500/30 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Daily Login Rewards</h3>
          <p className="text-sm text-slate-400">
            {state.streak > 0 ? `🔥 ${state.streak} day streak` : 'Start your streak today!'}
          </p>
        </div>

        {!state.todayClaimed && (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="px-5 py-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {claiming ? 'Claiming...' : 'Claim'}
          </button>
        )}
      </div>

      {/* 7-day Grid */}
      <div className="grid grid-cols-7 gap-2">
        {state.rewards.map((reward) => (
          <motion.div
            key={reward.dayInCycle}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className={`
              relative p-3 rounded-lg text-center transition-all
              ${reward.isToday ? 'bg-violet-600 ring-2 ring-violet-400' : 'bg-slate-800'}
              ${reward.claimed ? 'opacity-60' : ''}
            `}
          >
            {/* Icon */}
            <div className="text-2xl mb-1">{reward.icon}</div>

            {/* Day Label */}
            <div className="text-xs font-semibold text-slate-300 mb-1">
              Day {reward.dayInCycle}
            </div>

            {/* Coins */}
            <div className="text-sm font-bold text-yellow-400">
              🪙 {reward.coins}
            </div>

            {/* Bonus label for Day 7 */}
            {reward.bonusDescription && (
              <div className="text-xs text-green-400 mt-1">
                {reward.bonusDescription}
              </div>
            )}

            {/* Claimed checkmark */}
            {reward.claimed && (
              <div className="absolute top-1 right-1 text-green-400 text-xs">
                ✓
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Next Reward Preview */}
      {state.nextReward && !state.todayClaimed && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-center">
          <div className="text-sm text-slate-400">
            Today's reward: <span className="font-bold text-yellow-400">🪙 {state.nextReward.coins}</span>
          </div>
        </div>
      )}

      {state.todayClaimed && (
        <div className="mt-4 p-3 bg-green-950/30 border border-green-500/30 rounded-lg text-center text-sm text-green-400">
          ✓ Already claimed today! Come back tomorrow.
        </div>
      )}
    </div>
  );
}
