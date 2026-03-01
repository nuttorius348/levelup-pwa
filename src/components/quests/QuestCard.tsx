'use client';

import { motion } from 'framer-motion';
import { UserQuest } from '@/lib/quests/quest.service';
import { useState } from 'react';

interface QuestCardProps {
  quest: UserQuest;
  onClaim: (questId: string) => Promise<void>;
}

const difficultyColors = {
  easy: 'from-green-500 to-emerald-500',
  normal: 'from-blue-500 to-cyan-500',
  hard: 'from-orange-500 to-red-500',
  epic: 'from-purple-500 to-pink-500',
};

const difficultyBorders = {
  easy: 'border-green-500/30',
  normal: 'border-blue-500/30',
  hard: 'border-orange-500/30',
  epic: 'border-purple-500/30',
};

const difficultyGlows = {
  easy: 'shadow-green-500/20',
  normal: 'shadow-blue-500/20',
  hard: 'shadow-orange-500/20',
  epic: 'shadow-purple-500/20',
};

export function QuestCard({ quest, onClaim }: QuestCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const template = quest.template;

  if (!template) return null;

  const progress = Math.min((quest.progress / quest.target) * 100, 100);
  const isCompleted = quest.completed;
  const isClaimed = quest.claimed;

  const handleClaim = async () => {
    if (!isCompleted || isClaimed || isClaiming) return;

    setIsClaiming(true);
    try {
      await onClaim(quest.id);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden
        bg-slate-800/50 backdrop-blur-sm
        border-2 ${difficultyBorders[template.difficulty]}
        rounded-xl p-4
        ${isCompleted && !isClaimed ? `shadow-xl ${difficultyGlows[template.difficulty]}` : 'shadow-lg'}
        transition-all duration-300
        ${isClaimed ? 'opacity-50' : ''}
      `}
    >
      {/* Difficulty badge */}
      <div className="absolute top-2 right-2">
        <div
          className={`
            px-2 py-1 rounded-full text-xs font-semibold
            bg-gradient-to-r ${difficultyColors[template.difficulty]}
            text-white
          `}
        >
          {template.difficulty.toUpperCase()}
        </div>
      </div>

      {/* Icon */}
      <div className="text-4xl mb-3">{template.icon}</div>

      {/* Quest info */}
      <h3 className="text-lg font-bold text-slate-100 mb-1 pr-20">
        {template.name}
      </h3>
      <p className="text-sm text-slate-400 mb-4">{template.description}</p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs font-semibold text-violet-300">
            {quest.progress} / {quest.target}
          </span>
        </div>
        <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${difficultyColors[template.difficulty]} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {isCompleted && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              style={{ width: '50%' }}
            />
          )}
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-sm">⚡</span>
            <span className="text-sm font-semibold text-violet-300">
              +{template.xp_reward}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">🪙</span>
            <span className="text-sm font-semibold text-yellow-300">
              +{template.coin_reward}
            </span>
          </div>
        </div>

        {/* Claim button */}
        {isCompleted && !isClaimed && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClaim}
            disabled={isClaiming}
            className={`
              px-4 py-2 rounded-lg
              bg-gradient-to-r ${difficultyColors[template.difficulty]}
              text-white font-semibold text-sm
              shadow-lg hover:shadow-xl
              transition-shadow
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isClaiming ? 'Claiming...' : 'Claim'}
          </motion.button>
        )}

        {isClaimed && (
          <div className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-400 text-sm font-semibold">
            Claimed ✓
          </div>
        )}
      </div>

      {/* Completion pulse effect */}
      {isCompleted && !isClaimed && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${difficultyColors[template.difficulty]} opacity-10 pointer-events-none`}
          animate={{
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      )}
    </motion.div>
  );
}
