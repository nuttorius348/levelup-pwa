'use client';

// =============================================================
// Shop Page — Currency system, themes, boosts, cosmetics
// =============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ShopCategory, UserInventoryItem } from '@/types/shop';
import type { ActiveBoost } from '@/types/economy';
import { SHOP_CATEGORIES } from '@/lib/constants/shop';
import ShopItemCard from '@/components/shop/ShopItemCard';
import BoostTimer from '@/components/shop/BoostTimer';
import DailyLoginCalendar from '@/components/shop/DailyLoginCalendar';
import PurchaseModal from '@/components/shop/PurchaseModal';
import RewardReveal from '@/components/shop/RewardReveal';
import CoinBalance from '@/components/shop/CoinBalance';

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('boost');
  const [items, setItems] = useState<UserInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoost[]>([]);
  const [coinBalance, setCoinBalance] = useState(0);
  
  // Purchase flow state
  const [selectedItem, setSelectedItem] = useState<UserInventoryItem | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showRewardReveal, setShowRewardReveal] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<{
    item: UserInventoryItem;
    coinsSpent: number;
    newBalance: number;
  } | null>(null);

  useEffect(() => {
    fetchShopItems();
    fetchActiveBoosts();
    fetchCoinBalance();
  }, [activeCategory]);

  async function fetchCoinBalance() {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.profile?.coins) {
        setCoinBalance(data.profile.coins);
      }
    } catch (error) {
      console.error('Failed to fetch coin balance:', error);
    }
  }

  async function fetchShopItems() {
    setLoading(true);
    const res = await fetch(`/api/shop/items?category=${activeCategory}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  async function fetchActiveBoosts() {
    const res = await fetch('/api/shop/boosts');
    const data = await res.json();
    setActiveBoosts(data.boosts ?? []);
  }

  function handlePurchaseClick(item: UserInventoryItem) {
    setSelectedItem(item);
    setShowPurchaseModal(true);
  }

  async function handleConfirmPurchase() {
    if (!selectedItem) return;

    setIsPurchasing(true);

    const res = await fetch('/api/shop/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemSlug: selectedItem.slug }),
    });

    const data = await res.json();

    setIsPurchasing(false);

    if (data.success) {
      // Close modal
      setShowPurchaseModal(false);

      // Set purchase result
      setPurchaseResult({
        item: selectedItem,
        coinsSpent: selectedItem.costCoins,
        newBalance: data.newBalance ?? coinBalance - selectedItem.costCoins,
      });

      // Update balance
      setCoinBalance(data.newBalance ?? coinBalance - selectedItem.costCoins);

      // Show reward reveal
      setTimeout(() => {
        setShowRewardReveal(true);
      }, 200);

      // Refresh items
      setTimeout(() => {
        fetchShopItems();
        fetchActiveBoosts();
      }, 500);
    } else {
      alert(data.error || 'Purchase failed');
      setShowPurchaseModal(false);
    }
  }

  async function handleEquip(itemId: string) {
    const res = await fetch('/api/shop/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, action: 'equip' }),
    });

    const data = await res.json();

    if (data.success) {
      fetchShopItems();
    } else {
      alert(data.error || 'Equip failed');
    }
  }

  async function handleActivateBoost(itemId: string) {
    const res = await fetch('/api/shop/activate-boost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardId: itemId }),
    });

    const data = await res.json();

    if (data.success) {
      // Show success message with animation
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg';
      successMsg.textContent = data.message;
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        successMsg.style.transition = 'opacity 0.3s';
        successMsg.style.opacity = '0';
        setTimeout(() => successMsg.remove(), 300);
      }, 3000);

      fetchShopItems();
      fetchActiveBoosts();
    } else {
      alert(data.error || 'Activation failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-24">
      {/* Purchase Modal */}
      <PurchaseModal
        item={selectedItem}
        isOpen={showPurchaseModal}
        onConfirm={handleConfirmPurchase}
        onCancel={() => setShowPurchaseModal(false)}
        isPurchasing={isPurchasing}
      />

      {/* Reward Reveal */}
      <RewardReveal
        item={purchaseResult?.item ?? null}
        isOpen={showRewardReveal}
        onClose={() => {
          setShowRewardReveal(false);
          setPurchaseResult(null);
        }}
        coinsSpent={purchaseResult?.coinsSpent ?? 0}
        newBalance={purchaseResult?.newBalance ?? coinBalance}
      />

      {/* Header */}
      <div className="max-w-4xl mx-auto pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-violet-400"
          >
            Shop
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <CoinBalance balance={coinBalance} size="lg" />
          </motion.div>
        </div>

        {/* Active Boosts */}
        {activeBoosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-violet-950/30 border border-violet-500/30 rounded-xl"
          >
            <h3 className="text-sm font-semibold text-violet-300 mb-3">Active Boosts</h3>
            <div className="space-y-2">
              {activeBoosts.map((boost) => (
                <BoostTimer key={boost.id} boost={boost} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Daily Login Calendar */}
        {activeCategory === 'boost' && (
          <DailyLoginCalendar onClaim={() => {
            fetchShopItems();
            fetchCoinBalance();
          }} />
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {SHOP_CATEGORIES.map((cat, index) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {cat.icon} {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="wait">
              {items.map((item, index) => (
                <motion.div
                  key={item.slug}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ShopItemCard
                    item={item}
                    onPurchase={() => handlePurchaseClick(item)}
                    onEquip={item.owned && activeCategory !== 'boost' ? () => handleEquip(item.id) : undefined}
                    onActivate={item.owned && activeCategory === 'boost' ? () => handleActivateBoost(item.id) : undefined}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {items.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-slate-500"
          >
            No items available in this category
          </motion.div>
        )}
      </div>
    </div>
  );
}
