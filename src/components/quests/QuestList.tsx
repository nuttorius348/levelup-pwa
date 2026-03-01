'use client';

import { useEffect, useState } from 'react';
import { UserQuest } from '@/lib/quests/quest.service';
import { QuestCard } from './QuestCard';
import { motion, AnimatePresence } from 'framer-motion';
import RewardReveal from '@/components/shop/RewardReveal';
import { useSound } from '@/hooks/useSound';

interface QuestReward {
  xp: number;
  coins: number;
  levelUp?: {
    previousLevel: number;
    newLevel: number;
    coinsAwarded: number;
    newTitle?: string;
    unlockedRewards?: any[];
  };
}

export function QuestList() {
  const [quests, setQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [lastReward, setLastReward] = useState<QuestReward | null>(null);
  const { play } = useSound();

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const response = await fetch('/api/quests', {
        headers: {
          'x-user-id': 'temp-user-id', // TODO: Replace with actual user ID from auth
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuests(data.quests);
      }
    } catch (error) {
      console.error('Failed to load quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimQuest = async (questId: string) => {
    try {
      const response = await fetch('/api/quests/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'temp-user-id', // TODO: Replace with actual user ID from auth
        },
        body: JSON.stringify({ questId }),
      });

      if (response.ok) {
        const data = await response.json();

        // Play quest complete sound
        play('quest_complete');

        // Show reward reveal
        setLastReward(data);
        setShowReward(true);

        // Reload quests
        await loadQuests();
      }
    } catch (error) {
      console.error('Failed to claim quest:', error);
      play('error');
    }
  };

  const activeQuests = quests.filter((q) => !q.claimed);
  const completedQuests = activeQuests.filter((q) => q.completed);
  const inProgressQuests = activeQuests.filter((q) => !q.completed);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (quests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">No Active Quests</h3>
        <p className="text-slate-400">Check back tomorrow for new quests!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Quest stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center"
          >
            <div className="text-3xl font-bold text-violet-300">{activeQuests.length}</div>
            <div className="text-sm text-slate-400 mt-1">Active</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center"
          >
            <div className="text-3xl font-bold text-green-300">{completedQuests.length}</div>
            <div className="text-sm text-slate-400 mt-1">Completed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center"
          >
            <div className="text-3xl font-bold text-blue-300">{inProgressQuests.length}</div>
            <div className="text-sm text-slate-400 mt-1">In Progress</div>
          </motion.div>
        </div>

        {/* Completed quests (claimable) */}
        {completedQuests.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-3 flex items-center gap-2">
              <span>✨</span>
              <span>Ready to Claim</span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {completedQuests.map((quest, index) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <QuestCard quest={quest} onClaim={handleClaimQuest} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* In-progress quests */}
        {inProgressQuests.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-3 flex items-center gap-2">
              <span>🎯</span>
              <span>In Progress</span>
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {inProgressQuests.map((quest, index) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <QuestCard quest={quest} onClaim={handleClaimQuest} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Reward reveal modal */}
      {showReward && lastReward && (
        <RewardReveal
          isOpen={showReward}
          onClose={() => setShowReward(false)}
          coinsSpent={0}
          newBalance={0}
          item={{
            id: 'quest-reward',
            slug: 'quest-reward',
            name: 'Quest Completed!',
            description: `+${lastReward.xp} XP, +${lastReward.coins} coins`,
            category: 'badge',
            rarity: 'rare',
            costCoins: 0,
            levelRequired: 0,
            icon: '🎉',
            owned: true,
            equipped: false,
          }}
        />
      )}
    </>
  );
}
