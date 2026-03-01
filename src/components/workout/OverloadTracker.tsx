'use client';

// =============================================================
// OverloadTracker — Progress visualization + suggestions
// =============================================================
//
// Shows:
//  • Estimated 1RM trend chart
//  • Volume progression line
//  • Personal record badges
//  • Next session overload suggestions
//  • Strength level indicator
// =============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  ProgressiveOverloadRecord,
  PersonalRecord,
  OverloadSuggestion,
} from '@/types/workout';
import { estimateOneRepMax } from '@/lib/services/workout.service';

// ── Props ─────────────────────────────────────────────────────

interface OverloadTrackerProps {
  exerciseId: string;
  exerciseName: string;
  history: ProgressiveOverloadRecord[];
  personalRecords?: PersonalRecord[];
  suggestion?: OverloadSuggestion;
  compact?: boolean;
}

// ── Mini Sparkline ────────────────────────────────────────────

function Sparkline({
  data,
  color = '#818cf8',
  height = 40,
  width = 200,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  if (data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-xs text-zinc-600"
      >
        Need 2+ sessions
      </div>
    );
  }

  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  const padding = 4;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  // Trend direction
  const isUp = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx={
            padding +
            ((data.length - 1) / (data.length - 1)) * (width - padding * 2)
          }
          cy={
            height -
            padding -
            ((data[data.length - 1] - minVal) / range) *
              (height - padding * 2)
          }
          r={3}
          fill={isUp ? '#22c55e' : '#ef4444'}
        />
      )}
    </svg>
  );
}

// ── Strategy Icon ─────────────────────────────────────────────

const STRATEGY_ICONS: Record<string, string> = {
  weight: '⬆️',
  reps: '🔄',
  sets: '➕',
  tempo: '⏱️',
  rest: '⏩',
  volume: '📐',
};

// ── Component ─────────────────────────────────────────────────

export default function OverloadTracker({
  exerciseId,
  exerciseName,
  history,
  personalRecords = [],
  suggestion,
  compact = false,
}: OverloadTrackerProps) {
  const [activeTab, setActiveTab] = useState<'1rm' | 'volume' | 'weight'>(
    '1rm',
  );

  // ── Prepare chart data ──────────────────────────────────────

  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const chartData = {
    '1rm': sortedHistory.map(r => r.estimated1RM),
    volume: sortedHistory.map(r => r.totalVolume),
    weight: sortedHistory.map(r => r.bestWeight),
  };

  const latestRecord = sortedHistory[sortedHistory.length - 1];
  const previousRecord =
    sortedHistory.length >= 2 ? sortedHistory[sortedHistory.length - 2] : null;

  // ── Trend calculation ───────────────────────────────────────

  const trend1RM =
    latestRecord && previousRecord
      ? latestRecord.estimated1RM - previousRecord.estimated1RM
      : 0;
  const trendVolume =
    latestRecord && previousRecord
      ? latestRecord.totalVolume - previousRecord.totalVolume
      : 0;

  // ── Recent PRs for this exercise ────────────────────────────

  const exercisePRs = personalRecords.filter(
    pr => pr.exerciseId === exerciseId,
  );

  if (compact) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">{exerciseName}</h4>
          {latestRecord && (
            <span className="text-xs text-zinc-400">
              Est. 1RM: {latestRecord.estimated1RM} lbs
            </span>
          )}
        </div>
        <div className="mt-2">
          <Sparkline
            data={chartData['1rm']}
            width={280}
            height={32}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">{exerciseName}</h3>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-zinc-500">{sortedHistory.length} sessions</span>
        </div>
      </div>

      {/* Stat pills */}
      {latestRecord && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-zinc-800/60 p-2.5 text-center">
            <p className="text-[10px] font-medium uppercase text-zinc-500">
              Est. 1RM
            </p>
            <p className="mt-0.5 text-lg font-bold text-white">
              {latestRecord.estimated1RM}
            </p>
            {trend1RM !== 0 && (
              <p
                className={`text-[10px] font-medium ${
                  trend1RM > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {trend1RM > 0 ? '+' : ''}{trend1RM} lbs
              </p>
            )}
          </div>
          <div className="rounded-xl bg-zinc-800/60 p-2.5 text-center">
            <p className="text-[10px] font-medium uppercase text-zinc-500">
              Best Weight
            </p>
            <p className="mt-0.5 text-lg font-bold text-white">
              {latestRecord.bestWeight}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-800/60 p-2.5 text-center">
            <p className="text-[10px] font-medium uppercase text-zinc-500">
              Volume
            </p>
            <p className="mt-0.5 text-lg font-bold text-white">
              {latestRecord.totalVolume.toLocaleString()}
            </p>
            {trendVolume !== 0 && (
              <p
                className={`text-[10px] font-medium ${
                  trendVolume > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {trendVolume > 0 ? '+' : ''}{trendVolume.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Chart tabs */}
      <div className="mt-4 flex gap-1 rounded-lg bg-zinc-800/40 p-0.5">
        {(['1rm', 'volume', 'weight'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            {tab === '1rm' ? 'Est 1RM' : tab === 'volume' ? 'Volume' : 'Weight'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-3 flex justify-center">
        <Sparkline
          data={chartData[activeTab]}
          width={300}
          height={60}
          color={
            activeTab === '1rm'
              ? '#818cf8'
              : activeTab === 'volume'
                ? '#34d399'
                : '#f59e0b'
          }
        />
      </div>

      {/* Personal Records */}
      {exercisePRs.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-600">
            Personal Records
          </h4>
          <div className="flex flex-wrap gap-2">
            {exercisePRs.map((pr, i) => (
              <motion.div
                key={`${pr.type}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1"
              >
                <span className="text-sm">🏆</span>
                <span className="text-xs font-medium text-yellow-400">
                  {pr.type === '1rm'
                    ? `1RM: ${pr.value} lbs`
                    : pr.type === 'weight'
                      ? `Max: ${pr.value} lbs`
                      : pr.type === 'reps'
                        ? `Reps: ${pr.value}`
                        : `Vol: ${pr.value.toLocaleString()}`}
                </span>
                {pr.improvement > 0 && (
                  <span className="text-[10px] text-green-400">
                    +{pr.improvement}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Overload Suggestion */}
      {suggestion && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {STRATEGY_ICONS[suggestion.strategy] ?? '💡'}
            </span>
            <h4 className="text-sm font-bold text-indigo-300">
              Next Session: {suggestion.strategy.charAt(0).toUpperCase() +
                suggestion.strategy.slice(1)}{' '}
              Overload
            </h4>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            {suggestion.reasoning}
          </p>
          <div className="mt-2 flex gap-4 text-xs">
            {suggestion.suggestedWeight !== suggestion.currentWeight && (
              <div>
                <span className="text-zinc-500">Weight: </span>
                <span className="text-zinc-400">
                  {suggestion.currentWeight} →{' '}
                </span>
                <span className="font-bold text-indigo-400">
                  {suggestion.suggestedWeight} lbs
                </span>
              </div>
            )}
            {suggestion.suggestedReps !== suggestion.currentReps && (
              <div>
                <span className="text-zinc-500">Reps: </span>
                <span className="text-zinc-400">
                  {suggestion.currentReps} →{' '}
                </span>
                <span className="font-bold text-indigo-400">
                  {suggestion.suggestedReps}
                </span>
              </div>
            )}
            {suggestion.suggestedSets !== suggestion.currentSets && (
              <div>
                <span className="text-zinc-500">Sets: </span>
                <span className="text-zinc-400">
                  {suggestion.currentSets} →{' '}
                </span>
                <span className="font-bold text-indigo-400">
                  {suggestion.suggestedSets}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
