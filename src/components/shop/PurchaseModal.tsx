'use client';

// =============================================================
// PurchaseModal — Confirmation dialog for shop purchases
// =============================================================

import { motion, AnimatePresence } from 'framer-motion';
import type { UserInventoryItem } from '@/types/shop';
import { RARITY_COLORS, RARITY_BG, RARITY_BORDER } from '@/types/economy';

interface PurchaseModalProps {
  item: UserInventoryItem | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPurchasing: boolean;
}

export default function PurchaseModal({
  item,
  isOpen,
  onConfirm,
  onCancel,
  isPurchasing,
}: PurchaseModalProps) {
  if (!item) return null;

  const rarityColor = RARITY_COLORS[item.rarity];
  const rarityBg = RARITY_BG[item.rarity];
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
            onClick={onCancel}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-md w-full pointer-events-auto"
            >
              <div className={`relative p-6 rounded-2xl border-2 ${rarityBorder} ${rarityBg} backdrop-blur-lg shadow-2xl`}>
                {/* Rarity Badge */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase ${rarityColor} bg-slate-950 border-2 ${rarityBorder}`}>
                  {item.rarity}
                </div>

                {/* Item Icon */}
                <div className="flex justify-center mb-4 mt-2">
                  <div className="text-7xl">{item.icon}</div>
                </div>

                {/* Item Details */}
                <h3 className="text-2xl font-bold text-white text-center mb-2">
                  {item.name}
                </h3>
                <p className="text-sm text-slate-300 text-center mb-6">
                  {item.description}
                </p>

                {/* Effects (if boost) */}
                {item.effects && (
                  <div className="mb-6 p-4 bg-slate-800/50 rounded-xl space-y-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase mb-2">
                      Effects
                    </div>
                    {item.effects.xpMultiplier && (
                      <div className="flex items-center gap-2 text-violet-300">
                        🚀 <span>{item.effects.xpMultiplier}× XP for {item.effects.durationMinutes ?? 60} minutes</span>
                      </div>
                    )}
                    {item.effects.coinMultiplier && (
                      <div className="flex items-center gap-2 text-yellow-300">
                        🪙 <span>{item.effects.coinMultiplier}× Coins for {item.effects.durationMinutes ?? 60} minutes</span>
                      </div>
                    )}
                    {item.effects.streakProtection && (
                      <div className="flex items-center gap-2 text-green-300">
                        🛡️ <span>Protects your streak for 7 days</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Level Requirement */}
                {item.levelRequired > 1 && (
                  <div className="flex items-center justify-center gap-2 mb-6 text-sm text-slate-400">
                    <span className="text-violet-400">⚡</span>
                    <span>Requires Level {item.levelRequired}</span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-center gap-2 mb-6 text-3xl font-bold">
                  <span className="text-yellow-400">🪙</span>
                  <span className="text-white">{item.costCoins}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    disabled={isPurchasing}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isPurchasing}
                    className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPurchasing ? 'Purchasing...' : 'Purchase'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
