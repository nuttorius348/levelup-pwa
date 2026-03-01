// =============================================================
// Cosmetic Service — Equip/unequip avatar, badges, themes
// =============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import type { EquippedCosmetics, ShopCategory } from '@/types/shop';

// ── Equip an item (unequips others in same category) ────────

export async function equipItem(
  userId: string,
  itemId: string,
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient();

  // Check if user owns the item
  const { data: ownership, error: ownershipError } = await admin
    .from('user_rewards')
    .select('id, is_equipped, rewards(category)')
    .eq('user_id', userId)
    .eq('reward_id', itemId)
    .single();

  if (ownershipError || !ownership) {
    return { success: false, message: 'You do not own this item' };
  }

  const category = (ownership.rewards as any)?.category;

  if (!category) {
    return { success: false, message: 'Invalid item category' };
  }

  // Unequip all other items in the same category
  await admin
    .from('user_rewards')
    .update({ is_equipped: false })
    .eq('user_id', userId)
    .eq('rewards.category', category)
    .neq('reward_id', itemId);

  // Equip the target item
  const { error: equipError } = await admin
    .from('user_rewards')
    .update({ is_equipped: true })
    .eq('id', ownership.id);

  if (equipError) {
    console.error('[Cosmetic] Equip failed:', equipError);
    return { success: false, message: 'Failed to equip item' };
  }

  return { success: true, message: 'Item equipped!' };
}

// ── Unequip an item ──────────────────────────────────────────

export async function unequipItem(
  userId: string,
  itemId: string,
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient();

  const { data: ownership } = await admin
    .from('user_rewards')
    .select('id')
    .eq('user_id', userId)
    .eq('reward_id', itemId)
    .single();

  if (!ownership) {
    return { success: false, message: 'You do not own this item' };
  }

  const { error } = await admin
    .from('user_rewards')
    .update({ is_equipped: false })
    .eq('id', ownership.id);

  if (error) {
    console.error('[Cosmetic] Unequip failed:', error);
    return { success: false, message: 'Failed to unequip item' };
  }

  return { success: true, message: 'Item unequipped!' };
}

// ── Get equipped cosmetics (badge, avatar, theme, title) ────

export async function getEquippedCosmetics(userId: string): Promise<EquippedCosmetics> {
  const admin = createAdminClient();

  const { data: equipped } = await admin
    .from('user_rewards')
    .select(`
      rewards (
        id,
        name,
        category,
        icon,
        image_url,
        rarity,
        effects
      )
    `)
    .eq('user_id', userId)
    .eq('is_equipped', true);

  const cosmetics: EquippedCosmetics = {
    badge: null,
    avatar: null,
    theme: null,
    title: null,
  };

  equipped?.forEach((item) => {
    const reward = (item.rewards as any);
    if (!reward) return;

    const category = reward.category as ShopCategory;

    if (category === 'badge' || category === 'avatar' || category === 'theme' || category === 'title') {
      cosmetics[category] = {
        id: reward.id,
        name: reward.name,
        icon: reward.icon,
        imageUrl: reward.image_url,
        rarity: reward.rarity,
        effects: reward.effects,
      };
    }
  });

  return cosmetics;
}

// ── Set active theme ─────────────────────────────────────────

export async function setActiveTheme(
  userId: string,
  themeSlug: string,
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient();

  // Check if user owns the theme (or theme is 'default' which is free)
  if (themeSlug !== 'default') {
    const { data: themeItem } = await admin
      .from('rewards')
      .select('id')
      .eq('name', themeSlug)
      .eq('category', 'theme')
      .single();

    if (!themeItem) {
      return { success: false, message: 'Theme not found' };
    }

    const { data: ownership } = await admin
      .from('user_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('reward_id', themeItem.id)
      .single();

    if (!ownership) {
      return { success: false, message: 'You do not own this theme' };
    }
  }

  // Update user's active theme in profiles table
  const { error } = await admin
    .from('users')
    .update({ theme: themeSlug })
    .eq('id', userId);

  if (error) {
    console.error('[Cosmetic] Set theme failed:', error);
    return { success: false, message: 'Failed to set theme' };
  }

  return { success: true, message: 'Theme activated!' };
}

// ── Get unlocked themes ──────────────────────────────────────

export async function getUnlockedThemes(userId: string): Promise<string[]> {
  const admin = createAdminClient();

  const { data: themes } = await admin
    .from('user_rewards')
    .select('rewards(name)')
    .eq('user_id', userId)
    .eq('rewards.category', 'theme');

  const unlocked = themes?.map((t) => (t.rewards as any)?.name).filter(Boolean) || [];

  // Always include default theme
  if (!unlocked.includes('default')) {
    unlocked.unshift('default');
  }

  return unlocked;
}
