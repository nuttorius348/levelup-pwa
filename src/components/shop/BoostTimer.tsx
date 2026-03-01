'use client';

// =============================================================
// BoostTimer — Display active boost with countdown
// =============================================================

import { useEffect, useState } from 'react';
import type { ActiveBoost } from '@/types/economy';

interface BoostTimerProps {
  boost: ActiveBoost;
}

export default function BoostTimer({ boost }: BoostTimerProps) {
  const [timeLeft, setTimeLeft] = useState(boost.minutesRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const expiresAt = new Date(boost.expiresAt).getTime();
      const now = Date.now();
      const minutesRemaining = Math.round((expiresAt - now) / 60000);

      if (minutesRemaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
      } else {
        setTimeLeft(minutesRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [boost.expiresAt]);

  const hours = Math.floor(timeLeft / 60);
  const minutes = timeLeft % 60;

  const icon = boost.boostType === 'xp_multiplier'
    ? '🚀'
    : boost.boostType === 'coin_multiplier'
    ? '🪙'
    : '🛡️';

  const label = boost.boostType === 'xp_multiplier'
    ? `${boost.multiplier}× XP`
    : boost.boostType === 'coin_multiplier'
    ? `${boost.multiplier}× Coins`
    : 'Streak Shield';

  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-sm font-semibold text-white">{label}</div>
          <div className="text-xs text-slate-400">
            {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} remaining
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-1000"
          style={{
            width: `${Math.max(0, Math.min(100, (timeLeft / boost.minutesRemaining) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}
