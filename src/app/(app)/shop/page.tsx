'use client';

// =============================================================
// Shop Page — Browse & purchase cosmetics, boosts, themes
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '@/components/ui/BackButton';
import ShopItemCard from '@/components/shop/ShopItemCard';
import PurchaseModal from '@/components/shop/PurchaseModal';
import type { UserInventoryItem, ShopCategory } from '@/types/shop';

const CATEGORIES: { key: ShopCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '🛍️' },
  { key: 'theme', label: 'Themes', icon: '🎨' },
  { key: 'badge', label: 'Badges', icon: '🏅' },
  { key: 'title', label: 'Titles', icon: '👑' },
  { key: 'avatar', label: 'Avatars', icon: '😎' },
  { key: 'boost', label: 'Boosts', icon: '🚀' },
];

export default function ShopPage() {
  const [items, setItems] = useState<UserInventoryItem[]>([]);
  const [category, setCategory] = useState<ShopCategory | 'all'>('all');
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchaseItem, setPurchaseItem] = useState<UserInventoryItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/shop/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setCoins(data.coins ?? 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = category === 'all' ? items : items.filter(i => i.category === category);

  const handlePurchase = async () => {
    if (!purchaseItem) return;
    setIsPurchasing(true);
    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: purchaseItem.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setCoins(data.newCoinBalance ?? coins - purchaseItem.costCoins);
        await fetchItems();
      }
    } catch {
      // silent
    } finally {
      setIsPurchasing(false);
      setPurchaseItem(null);
    }
  };

  const handleEquip = async (item: UserInventoryItem) => {
    await fetch('/api/shop/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id }),
    });
    await fetchItems();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackButton href="/dashboard" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Shop
          </h1>
          <p className="text-slate-400 text-sm mt-1">Spend coins on themes, badges & boosts</p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
          <span>🪙</span>
          <span className="font-bold text-amber-400">{coins}</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              category === cat.key
                ? 'bg-violet-600 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-2">🏪</div>
          <p>No items available yet</p>
          <p className="text-xs mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <ShopItemCard
                  item={item}
                  onPurchase={() => setPurchaseItem(item)}
                  onEquip={() => handleEquip(item)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Purchase Modal */}
      <PurchaseModal
        item={purchaseItem}
        isOpen={!!purchaseItem}
        onConfirm={handlePurchase}
        onCancel={() => setPurchaseItem(null)}
        isPurchasing={isPurchasing}
      />
    </div>
  );
}
