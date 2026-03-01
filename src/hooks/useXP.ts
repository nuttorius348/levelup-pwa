// =============================================================
// useXP Hook — Client-side XP state management
// =============================================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import { getLevelInfo } from '@/lib/xp/levels';
import type { LevelInfo } from '@/types/xp';

interface XPState {
  totalXP: number;
  coins: number;
  levelInfo: LevelInfo;
  isLoading: boolean;
}

export function useXP(initialXP: number = 0, initialCoins: number = 0) {
  const [state, setState] = useState<XPState>({
    totalXP: initialXP,
    coins: initialCoins,
    levelInfo: getLevelInfo(initialXP),
    isLoading: false,
  });

  // Update level info when XP changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      levelInfo: getLevelInfo(prev.totalXP),
    }));
  }, [state.totalXP]);

  const grantXP = useCallback(async (action: string, metadata?: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch('/api/xp/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, metadata }),
      });

      if (!res.ok) throw new Error('XP grant failed');

      const data = await res.json();
      setState({
        totalXP: data.newTotalXP,
        coins: data.newCoins,
        levelInfo: getLevelInfo(data.newTotalXP),
        isLoading: false,
      });

      return data;
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/xp/leaderboard?limit=1');
      if (!res.ok) return;
      // Leaderboard returns current user stats
    } catch {
      // Silently fail
    }
  }, []);

  return {
    ...state,
    grantXP,
    refresh,
  };
}
