// =============================================================
// Shop & Economy Types
// =============================================================

export type ShopCategory = 'avatar' | 'theme' | 'badge' | 'title' | 'boost';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  subcategory?: string;
  iconUrl?: string;
  previewUrl?: string;
  priceCoins: number;
  levelRequired: number;
  isLimited: boolean;
  stockRemaining?: number;
  metadata: Record<string, unknown>;
  isActive: boolean;
}

export interface PurchaseRequest {
  itemId: string;
}

export interface PurchaseResult {
  success: boolean;
  item: ShopItem;
  newCoinBalance: number;
  error?: string;
}

export interface UserInventoryItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ShopCategory;
  icon: string;
  imageUrl?: string;
  costCoins: number;
  levelRequired: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effects?: {
    xpMultiplier?: number;
    coinMultiplier?: number;
    durationMinutes?: number;
    streakProtection?: number;
  };
  owned: boolean;
  equipped: boolean;
  acquiredAt?: string;
}

export interface CosmeticItem {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
  rarity: string;
  effects?: Record<string, unknown>;
}

export type EquippedCosmetics = {
  badge: CosmeticItem | null;
  avatar: CosmeticItem | null;
  theme: CosmeticItem | null;
  title: CosmeticItem | null;
};
