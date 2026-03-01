'use client';

// =============================================================
// /stretch — Guided Stretch Demo Page
// =============================================================
//
// Full stretch experience:
//  • Routine browser with daily challenge
//  • Guided timer with breathing cues
//  • XP completion screen
//  • Progression tier display
//  • Stats overview
// =============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StretchSession } from '@/components/stretch';
import { StretchService } from '@/lib/services/stretch.service';
import { STRETCH_ROUTINE_LIBRARY } from '@/lib/constants/stretches';
import type { StretchDifficulty } from '@/types/stretch';

// ── Mock user for demo ────────────────────────────────────────

const DEMO_USER_ID = 'demo_user_001';
const DEMO_STREAK_MULTIPLIER = 1.2; // Simulated 7-day streak

export default function StretchPage() {
  const [tab, setTab] = useState<'stretch' | 'stats'>('stretch');
  const [userDifficulty] = useState<StretchDifficulty>('beginner');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Tab bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-lg border-t border-white/5 pb-safe-bottom">
        <div className="flex items-center justify-center gap-1 max-w-md mx-auto px-4 py-2">
          {[
            { id: 'stretch' as const, label: 'Stretch', icon: '🧘' },
            { id: 'stats' as const, label: 'Stats', icon: '📊' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all min-h-[56px] justify-center
                ${tab === t.id ? 'text-violet-400' : 'text-white/30'}
              `}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'stretch' && (
          <motion.div key="stretch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StretchSession
              userId={DEMO_USER_ID}
              streakMultiplier={DEMO_STREAK_MULTIPLIER}
              userDifficulty={userDifficulty}
            />
          </motion.div>
        )}

        {tab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pt-safe-top pb-32"
          >
            <h1 className="text-2xl font-bold mt-4 mb-6">Stretch Stats</h1>

            {/* Progression Card */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Progression</h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-medium">
                  {userDifficulty}
                </span>
              </div>

              {/* Progression requirements */}
              <div className="space-y-3">
                <ProgressItem
                  label="Intermediate Unlock"
                  requirement="10 sessions + 5 day streak"
                  current={0}
                  target={10}
                  unlocked={false}
                />
                <ProgressItem
                  label="Advanced Unlock"
                  requirement="30 sessions + 14 day streak"
                  current={0}
                  target={30}
                  unlocked={false}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard icon="🧘" label="Total Sessions" value="0" />
              <StatCard icon="⏱" label="Total Minutes" value="0" />
              <StatCard icon="☀️" label="Morning Sessions" value="0" />
              <StatCard icon="🔥" label="Current Streak" value="0 days" />
            </div>

            {/* Routine library overview */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-5">
              <h2 className="font-semibold mb-3">Routine Library</h2>
              <div className="space-y-2">
                {STRETCH_ROUTINE_LIBRARY.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <span className="text-lg">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-white/30">{r.estimatedMinutes} min • {r.difficulty}</p>
                    </div>
                    <span className="text-xs text-white/20">{r.poses.length} poses</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function ProgressItem({
  label,
  requirement,
  current,
  target,
  unlocked,
}: {
  label: string;
  requirement: string;
  current: number;
  target: number;
  unlocked: boolean;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-white/60">{label}</span>
        {unlocked ? (
          <span className="text-xs text-emerald-400">✓ Unlocked</span>
        ) : (
          <span className="text-xs text-white/30">{current}/{target}</span>
        )}
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${unlocked ? 'bg-emerald-400' : 'bg-violet-500'}`}
          style={{ width: `${unlocked ? 100 : pct}%` }}
        />
      </div>
      <p className="text-[10px] text-white/20 mt-0.5">{requirement}</p>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4 text-center">
      <span className="text-xl">{icon}</span>
      <p className="text-lg font-bold mt-1">{value}</p>
      <p className="text-[10px] text-white/30 uppercase tracking-wide">{label}</p>
    </div>
  );
}
