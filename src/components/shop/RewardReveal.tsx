'use client';

// =============================================================
// RewardReveal — Animated reward unlock with confetti
// =============================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserInventoryItem } from '@/types/shop';
import { RARITY_COLORS, RARITY_BORDER } from '@/types/economy';

interface RewardRevealProps {
  item: UserInventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  coinsSpent: number;
  newBalance: number;
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  delay: number;
}

const CONFETTI_COLORS = ['#fbbf24', '#a855f7', '#3b82f6', '#22c55e', '#ef4444', '#ec4899'];

export default function RewardReveal({
  item,
  isOpen,
  onClose,
  coinsSpent,
  newBalance,
}: RewardRevealProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      // Generate confetti particles
      const particles: Confetti[] = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          id: i,
          x: Math.random() * 100,
          y: -10,
          rotation: Math.random() * 360,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          delay: Math.random() * 0.5,
        });
      }
      setConfetti(particles);

      // Show content after brief delay
      setTimeout(() => setShowContent(true), 300);

      // Auto-close after 4 seconds
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      setConfetti([]);
    }
  }, [isOpen, item, onClose]);

  if (!item) return null;

  const rarityColor = RARITY_COLORS[item.rarity];
  const rarityBorder = RARITY_BORDER[item.rarity];

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
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50"
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
                  rotate: particle.rotation + 720,
                  opacity: 0,
                }}
                transition={{
                  duration: 3,
                  delay: particle.delay,
                  ease: 'easeIn',
                }}
                className="absolute w-3 h-3 rounded-sm"
                style={{ backgroundColor: particle.color }}
              />
            ))}
          </div>

          {/* Reward Reveal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: 180, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                  }}
                  className="max-w-md w-full pointer-events-auto"
                >
                  <div className={`relative p-8 rounded-2xl border-4 ${rarityBorder} bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl`}>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-transparent to-blue-500/20 rounded-2xl blur-xl" />

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Badge */}
                      <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center mb-4"
                      >
                        <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold uppercase ${rarityColor} bg-slate-950/80 border-2 ${rarityBorder}`}>
                          {item.rarity} • Unlocked!
                        </div>
                      </motion.div>

                      {/* Icon */}
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 150,
                          damping: 15,
                          delay: 0.3,
                        }}
                        className="flex justify-center mb-6"
                      >
                        <div className="text-9xl filter drop-shadow-2xl">
                          {item.icon}
                        </div>
                      </motion.div>

                      {/* Name */}
                      <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl font-bold text-white text-center mb-3"
                      >
                        {item.name}
                      </motion.h2>

                      {/* Description */}
                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-slate-300 text-center mb-6"
                      >
                        {item.description}
                      </motion.p>

                      {/* Cost & Balance */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center justify-center gap-6 text-sm"
                      >
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>Spent:</span>
                          <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                            🪙 {coinsSpent}
                          </span>
                        </div>
                        <div className="w-px h-4 bg-slate-600" />
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>Balance:</span>
                          <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                            🪙 {newBalance}
                          </span>
                        </div>
                      </motion.div>

                      {/* Tap to close hint */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="text-center mt-6 text-xs text-slate-500"
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
