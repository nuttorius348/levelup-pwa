'use client';

// =============================================================
// ShopItemCard — Card component for shop items
// =============================================================

import { motion } from 'framer-motion';
import type { UserInventoryItem } from '@/types/shop';
import { RARITY_COLORS, RARITY_BG, RARITY_BORDER } from '@/types/economy';

interface ShopItemCardProps {
  item: UserInventoryItem;
  onPurchase?: () => void;
  onEquip?: () => void;
  onActivate?: () => void;
}

export default function ShopItemCard({
  item,
  onPurchase,
  onEquip,
  onActivate,
}: ShopItemCardProps) {
  const rarityColor = RARITY_COLORS[item.rarity];
  const rarityBg = RARITY_BG[item.rarity];
  const rarityBorder = RARITY_BORDER[item.rarity];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative p-4 rounded-xl border-2 ${rarityBorder} ${rarityBg} backdrop-blur-sm overflow-hidden group cursor-pointer`}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <motion.div
          initial={{ x: '-100%' }}
          whileHover={{ x: '200%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
          style={{ width: '50%' }}
        />
      </div>

      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/0 via-violet-500/20 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />

      {/* Rarity Badge */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold uppercase ${rarityColor} backdrop-blur-sm`}
      >
        {item.rarity}
      </motion.div>

      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="text-5xl mb-3"
      >
        {item.icon}
      </motion.div>

      {/* Name & Description */}
      <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{item.description}</p>

      {/* Effects Badge (for boosts) */}
      {item.effects && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-3 space-y-1 p-2 bg-slate-900/50 rounded-lg"
        >
          {item.effects.xpMultiplier && (
            <div className="text-xs font-medium text-violet-300 flex items-center gap-1">
              <span>🚀</span>
              <span>{item.effects.xpMultiplier}× XP for {item.effects.durationMinutes ?? 60} min</span>
            </div>
          )}
          {item.effects.coinMultiplier && (
            <div className="text-xs font-medium text-yellow-300 flex items-center gap-1">
              <span>🪙</span>
              <span>{item.effects.coinMultiplier}× Coins for {item.effects.durationMinutes ?? 60} min</span>
            </div>
          )}
          {item.effects.streakProtection && (
            <div className="text-xs font-medium text-green-300 flex items-center gap-1">
              <span>🛡️</span>
              <span>Streak Shield (7 days or until used)</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Level Requirement */}
      {item.levelRequired > 1 && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
          <span className="text-violet-400">⚡</span>
          <span>Requires Level {item.levelRequired}</span>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-auto">
        {item.owned ? (
          <div className="space-y-2">
            {item.equipped && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center text-sm font-medium text-green-400 bg-green-950/30 border border-green-500/30 rounded-lg py-2"
              >
                ✓ Equipped
              </motion.div>
            )}
            {onEquip && !item.equipped && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onEquip}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-violet-500/25"
              >
                Equip
              </motion.button>
            )}
            {onActivate && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onActivate}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-green-500/25"
              >
                🚀 Activate
              </motion.button>
            )}
            {!onEquip && !onActivate && (
              <div className="text-center text-sm font-medium text-slate-500 py-2">
                Owned
              </div>
            )}
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPurchase}
            className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg group/btn"
          >
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="text-yellow-400 text-xl"
            >
              🪙
            </motion.span>
            <span className="group-hover/btn:text-yellow-400 transition-colors">
              {item.costCoins.toLocaleString()}
            </span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
