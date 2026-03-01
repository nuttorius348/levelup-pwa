'use client';

// =============================================================
// Leaderboard Page — Compete against others
// =============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface LeaderboardEntry {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);

        const res = await fetch('/api/xp/leaderboard?page=1&limit=50');
        if (res.ok) {
          const data = await res.json();
          setEntries(data.leaderboard ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-white/5 animate-pulse" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
        <p className="text-slate-400 text-sm mt-1">Compete for the top spot</p>
      </div>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="flex items-end justify-center gap-3 pt-4">
          {/* 2nd place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-2xl mb-1 ring-2 ring-slate-400">
              {entries[1]?.avatar_url ? (
                <img src={entries[1].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : '👤'}
            </div>
            <p className="text-xs font-medium truncate max-w-[80px]">{entries[1]?.display_name ?? 'User'}</p>
            <p className="text-[10px] text-slate-400">Lv {entries[1]?.level ?? 1}</p>
            <div className="mt-1 bg-slate-600/50 rounded-t-lg w-20 h-16 flex items-center justify-center">
              <span className="text-2xl">🥈</span>
            </div>
          </motion.div>

          {/* 1st place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-yellow-600/30 flex items-center justify-center text-2xl mb-1 ring-2 ring-yellow-400">
              {entries[0]?.avatar_url ? (
                <img src={entries[0].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : '👤'}
            </div>
            <p className="text-xs font-bold truncate max-w-[80px]">{entries[0]?.display_name ?? 'User'}</p>
            <p className="text-[10px] text-yellow-400">Lv {entries[0]?.level ?? 1}</p>
            <div className="mt-1 bg-yellow-600/30 rounded-t-lg w-20 h-24 flex items-center justify-center">
              <span className="text-3xl">🥇</span>
            </div>
          </motion.div>

          {/* 3rd place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-orange-800/30 flex items-center justify-center text-2xl mb-1 ring-2 ring-orange-600">
              {entries[2]?.avatar_url ? (
                <img src={entries[2].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : '👤'}
            </div>
            <p className="text-xs font-medium truncate max-w-[80px]">{entries[2]?.display_name ?? 'User'}</p>
            <p className="text-[10px] text-slate-400">Lv {entries[2]?.level ?? 1}</p>
            <div className="mt-1 bg-orange-800/30 rounded-t-lg w-20 h-12 flex items-center justify-center">
              <span className="text-2xl">🥉</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full List */}
      <div className="space-y-2">
        {entries.map((entry, idx) => {
          const isCurrentUser = entry.id === currentUserId;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
                isCurrentUser
                  ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20'
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center shrink-0">
                <span className={`text-sm font-bold ${entry.rank <= 3 ? 'text-lg' : 'text-slate-500'}`}>
                  {getRankEmoji(entry.rank)}
                </span>
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg shrink-0">
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : '👤'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-indigo-300' : 'text-white'}`}>
                  {entry.display_name ?? entry.username ?? 'Anonymous'}
                  {isCurrentUser && <span className="text-[10px] text-indigo-400 ml-1">(you)</span>}
                </p>
                <p className="text-[10px] text-slate-500">
                  @{entry.username ?? 'user'}
                </p>
              </div>

              {/* Stats */}
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-white">Lv {entry.level ?? 1}</p>
                <p className="text-[10px] text-slate-400">{(entry.total_xp ?? 0).toLocaleString()} XP</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-3">🏆</div>
          <p className="font-medium">No competitors yet</p>
          <p className="text-sm mt-1">Be the first to earn XP and claim the top spot!</p>
        </div>
      )}
    </div>
  );
}
