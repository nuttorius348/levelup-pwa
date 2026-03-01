'use client';

// =============================================================
// LevelUpModal — Epic level-up celebration with confetti
// =============================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousLevel: number;
  newLevel: number;
  coinsAwarded: number;
  newTitle?: string;
  unlockedRewards?: string[];
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  delay: number;
  size: number;
}

const CONFETTI_COLORS = [
  '#fbbf24', // yellow
  '#a855f7', // purple
  '#3b82f6', // blue
  '#22c55e', // green
  '#ef4444', // red
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
];

export default function LevelUpModal({
  isOpen,
  onClose,
  previousLevel,
  newLevel,
  coinsAwarded,
  newTitle,
  unlockedRewards = [],
}: LevelUpModalProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Generate confetti
      const particles: Confetti[] = [];
      for (let i = 0; i < 80; i++) {
        particles.push({
          id: i,
          x: Math.random() * 100,
          y: -10,
          rotation: Math.random() * 360,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          delay: Math.random() * 0.6,
          size: Math.random() * 8 + 4,
        });
      }
      setConfetti(particles);

      // Show content after delay
      setTimeout(() => setShowContent(true), 400);

      // Auto-close after 5 seconds
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      setConfetti([]);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50"
          />

          {/* Confetti */}
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
            {confetti.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{
                  x: `${particle.x}vw`,
                  y: -20,
                  rotate: particle.rotation,
                  opacity: 1,
                }}
                animate={{
                  y: '110vh',
                  rotate: particle.rotation + 1080,
                  opacity: [1, 1, 0.5, 0],
                }}
                transition={{
                  duration: 3.5,
                  delay: particle.delay,
                  ease: 'easeIn',
                }}
                className="absolute rounded-full"
                style={{
                  backgroundColor: particle.color,
                  width: particle.size,
                  height: particle.size,
                }}
              />
            ))}
          </div>

          {/* Level Up Content */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: 180, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 150,
                    damping: 20,
                  }}
                  className="max-w-lg w-full pointer-events-auto"
                >
                  <div className="relative p-8 rounded-3xl bg-gradient-to-br from-violet-900 via-purple-900 to-blue-900 shadow-2xl border-4 border-yellow-400/50 overflow-hidden">
                    {/* Glow Effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-violet-500/20 rounded-3xl blur-2xl" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-400/30 rounded-full blur-3xl" />

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Badge */}
                      <motion.div
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center mb-4"
                      >
                        <div className="inline-block px-6 py-2 rounded-full text-sm font-bold uppercase bg-yellow-400 text-slate-900">
                          🎉 Level Up!
                        </div>
                      </motion.div>

                      {/* Level Display */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          damping: 15,
                          delay: 0.3,
                        }}
                        className="flex items-center justify-center gap-4 mb-6"
                      >
                        <div className="text-6xl font-black text-yellow-400/50">
                          {previousLevel}
                        </div>
                        <motion.div
                          animate={{ x: [0, 10, 0] }}
                          transition={{ duration: 0.6, repeat: 2 }}
                          className="text-4xl"
                        >
                          →
                        </motion.div>
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            textShadow: [
                              '0 0 20px rgba(251, 191, 36, 0.5)',
                              '0 0 40px rgba(251, 191, 36, 0.8)',
                              '0 0 20px rgba(251, 191, 36, 0.5)',
                            ],
                          }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-8xl font-black text-yellow-400"
                        >
                          {newLevel}
                        </motion.div>
                      </motion.div>

                      {/* New Title */}
                      {newTitle && (
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-center mb-6"
                        >
                          <div className="text-sm text-violet-300 mb-1">New Title Unlocked</div>
                          <div className="text-2xl font-bold text-white">{newTitle}</div>
                        </motion.div>
                      )}

                      {/* Rewards */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-center mb-6 space-y-3"
                      >
                        {/* Coin Reward */}
                        <div className="flex items-center justify-center gap-2 text-xl">
                          <span className="text-yellow-400">🪙</span>
                          <span className="font-bold text-white">+{coinsAwarded}</span>
                          <span className="text-slate-300">coins</span>
                        </div>

                        {/* Unlocked Items */}
                        {unlockedRewards.length > 0 && (
                          <div className="p-4 bg-slate-900/50 rounded-xl backdrop-blur-sm">
                            <div className="text-sm text-violet-300 mb-2">Rewards Unlocked</div>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {unlockedRewards.map((reward, i) => (
                                <motion.div
                                  key={reward}
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ delay: 0.7 + i * 0.1, type: 'spring' }}
                                  className="px-3 py-1 bg-violet-600/50 rounded-full text-sm font-medium text-white"
                                >
                                  {reward}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>

                      {/* Tap to Close */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="text-center text-xs text-slate-400"
                      >
                        Tap anywhere to continue
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
