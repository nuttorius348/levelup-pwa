// =============================================================
// Boost Service — Activate, query, and consume power-ups
// =============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import type { ActiveBoost, BoostType, BoostEffects } from '@/types/economy';

// ── Activate a boost (after purchase) ─────────────────────────

export async function activateBoost(
  userId: string,
  rewardId: string,
  effects: BoostEffects,
): Promise<ActiveBoost | null> {
  const admin = createAdminClient();

  // Determine boost type and params
  let boostType: BoostType;
  let multiplier = 1.0;
  let durationMinutes = 60; // default 1 hour

  if (effects.xpMultiplier && effects.xpMultiplier > 1) {
    boostType = 'xp_multiplier';
    multiplier = effects.xpMultiplier;
    durationMinutes = effects.durationMinutes ?? 60;
  } else if (effects.coinMultiplier && effects.coinMultiplier > 1) {
    boostType = 'coin_multiplier';
    multiplier = effects.coinMultiplier;
    durationMinutes = effects.durationMinutes ?? 60;
  } else if (effects.streakProtection) {
    boostType = 'streak_shield';
    multiplier = 1.0;
    // Streak shields last 7 days or until consumed
    durationMinutes = 7 * 24 * 60;
  } else {
    console.warn('[Boost] Unknown boost effects:', effects);
    return null;
  }

  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from('active_boosts')
    .insert({
      user_id: userId,
      reward_id: rewardId,
      boost_type: boostType,
      multiplier,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error('[Boost] Activation failed:', error);
    return null;
  }

  return mapBoostRow(data);
}

// ── Get all active boosts for a user ─────────────────────────

export async function getActiveBoosts(userId: string): Promise<ActiveBoost[]> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data } = await admin
    .from('active_boosts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_consumed', false)
    .gt('expires_at', now)
    .order('expires_at', { ascending: true });

  return (data ?? []).map(mapBoostRow);
}

// ── Get XP multiplier (highest active) ───────────────────────

export async function getXPMultiplier(userId: string): Promise<number> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data } = await admin
    .from('active_boosts')
    .select('multiplier')
    .eq('user_id', userId)
    .eq('boost_type', 'xp_multiplier')
    .eq('is_consumed', false)
    .gt('expires_at', now)
    .order('multiplier', { ascending: false })
    .limit(1)
    .single();

  return data?.multiplier ?? 1.0;
}

// ── Get coin multiplier (highest active) ─────────────────────

export async function getCoinMultiplier(userId: string): Promise<number> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data } = await admin
    .from('active_boosts')
    .select('multiplier')
    .eq('user_id', userId)
    .eq('boost_type', 'coin_multiplier')
    .eq('is_consumed', false)
    .gt('expires_at', now)
    .order('multiplier', { ascending: false })
    .limit(1)
    .single();

  return data?.multiplier ?? 1.0;
}

// ── Check & consume streak shield ────────────────────────────

export async function consumeStreakShield(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Find oldest active shield
  const { data: shield } = await admin
    .from('active_boosts')
    .select('id')
    .eq('user_id', userId)
    .eq('boost_type', 'streak_shield')
    .eq('is_consumed', false)
    .gt('expires_at', now)
    .order('activated_at', { ascending: true })
    .limit(1)
    .single();

  if (!shield) return false;

  const { error } = await admin
    .from('active_boosts')
    .update({ is_consumed: true })
    .eq('id', shield.id);

  return !error;
}

export async function hasStreakShield(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data } = await admin
    .from('active_boosts')
    .select('id')
    .eq('user_id', userId)
    .eq('boost_type', 'streak_shield')
    .eq('is_consumed', false)
    .gt('expires_at', now)
    .limit(1)
    .single();

  return !!data;
}

// ── Helpers ───────────────────────────────────────────────────

function mapBoostRow(row: any): ActiveBoost {
  const expiresAt = new Date(row.expires_at).getTime();
  const now = Date.now();
  const minutesRemaining = Math.round((expiresAt - now) / 60000);

  return {
    id: row.id,
    userId: row.user_id,
    rewardId: row.reward_id,
    boostType: row.boost_type,
    multiplier: parseFloat(row.multiplier),
    activatedAt: row.activated_at,
    expiresAt: row.expires_at,
    isConsumed: row.is_consumed,
    minutesRemaining,
  };
}
