'use client';

// =============================================================
// OutfitResults — Display AI rating + suggestions + XP
// =============================================================
//
// Features:
//  • Animated score reveal (1-10 scale)
//  • Color harmony & fit subscores
//  • Confidence indicator
//  • AI feedback paragraph
//  • Actionable improvement suggestions
//  • XP award with improvement bonus
//  • Previous best comparison
//  • Share / retry actions
// =============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OutfitRatingResult, AIProviderName } from '@/types/ai';

// ── Props ─────────────────────────────────────────────────────

interface OutfitResultsProps {
  rating: OutfitRatingResult;
  imageUrl?: string;
  xpEarned: number;
  previousBest?: number;
  provider: AIProviderName;
  fallbackUsed: boolean;
  latencyMs: number;
  onRetry: () => void;
  onDone: () => void;
}

// ── Score Circle ──────────────────────────────────────────────

function ScoreCircle({ score, size = 140 }: { score: number; size?: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 20;
    const increment = score / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [score]);

  const percentage = (score / 10) * 100;
  const circumference = 2 * Math.PI * (size / 2 - 8);
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on score
  const color =
    score >= 8 ? '#22c55e' : // green
    score >= 6 ? '#3b82f6' : // blue
    score >= 4 ? '#f59e0b' : // amber
                 '#ef4444';   // red

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={displayScore}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-bold"
          style={{ color }}
        >
          {displayScore}
        </motion.span>
        <span className="text-xs text-white/30">/ 10</span>
      </div>
    </div>
  );
}

// ── Subscore Bar ──────────────────────────────────────────────

function SubscoreBar({ label, score, icon, delay = 0 }: {
  label: string;
  score: number;
  icon: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/50 flex items-center gap-1">
          <span>{icon}</span>
          {label}
        </span>
        <span className="text-xs font-mono font-semibold text-white/70">{score}/10</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(score / 10) * 100}%` }}
          transition={{ delay: delay + 0.2, duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────

export default function OutfitResults({
  rating,
  imageUrl,
  xpEarned,
  previousBest,
  provider,
  fallbackUsed,
  latencyMs,
  onRetry,
  onDone,
}: OutfitResultsProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const isImprovement = previousBest && rating.overallScore > previousBest;
  const improvementDelta = previousBest ? rating.overallScore - previousBest : 0;

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-16">
      {/* Header: Score Circle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <div className="flex justify-center mb-3">
          <ScoreCircle score={rating.overallScore} />
        </div>
        <h2 className="text-xl font-bold mb-1">
          {rating.overallScore >= 8 && '🔥 Excellent Style!'}
          {rating.overallScore >= 6 && rating.overallScore < 8 && '👍 Solid Look'}
          {rating.overallScore >= 4 && rating.overallScore < 6 && '😊 Good Start'}
          {rating.overallScore < 4 && '💪 Room to Improve'}
        </h2>
        <p className="text-sm text-white/40">Perfect for {rating.occasionMatch}</p>

        {/* XP Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-violet-600/20 border border-violet-500/30"
        >
          <span className="text-xl">✨</span>
          <span className="font-semibold text-violet-300">+{xpEarned} XP</span>
        </motion.div>

        {/* Improvement indicator */}
        {isImprovement && (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs text-emerald-400 mt-2"
          >
            🎉 +{improvementDelta.toFixed(1)} improvement from your best!
          </motion.p>
        )}
      </motion.div>

      {/* Subscores */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-3"
          >
            <SubscoreBar label="Color Harmony" score={rating.colorHarmony} icon="🎨" delay={0} />
            <SubscoreBar label="Fit & Silhouette" score={rating.fitScore} icon="📏" delay={0.1} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Style Tags */}
      {showDetails && rating.styleTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2"
        >
          {rating.styleTags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60"
            >
              {tag}
            </span>
          ))}
        </motion.div>
      )}

      {/* AI Feedback */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.03] rounded-2xl p-4 border border-white/5"
        >
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
            AI Feedback
          </h3>
          <p className="text-sm text-white/70 leading-relaxed">{rating.feedback}</p>
        </motion.div>
      )}

      {/* Suggestions */}
      {showDetails && rating.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/[0.03] rounded-2xl p-4 border border-white/5"
        >
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">
            💡 Suggestions
          </h3>
          <ul className="space-y-2">
            {rating.suggestions.map((suggestion, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-start gap-2 text-sm text-white/60"
              >
                <span className="text-violet-400 mt-0.5">•</span>
                <span>{suggestion}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Confidence + Provider Info */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-between text-xs text-white/30"
        >
          <div className="flex items-center gap-2">
            <span>AI Confidence:</span>
            <span className="font-mono font-semibold">
              {(rating.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>
              {provider === 'openai' ? '🤖' : provider === 'anthropic' ? '🧠' : '✨'}
            </span>
            <span>{latencyMs}ms</span>
            {fallbackUsed && <span className="text-amber-400">⚠ Fallback</span>}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 border border-white/10 font-medium hover:bg-white/10 transition-colors min-h-[48px]"
        >
          Try Another Outfit
        </motion.button>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onDone}
          className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors min-h-[48px]"
        >
          Done
        </motion.button>
      </div>
    </div>
  );
}
