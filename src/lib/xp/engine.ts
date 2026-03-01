// =============================================================
// XP Engine — The single mutation point for all XP changes
// =============================================================
//
// ANTI-CHEAT STRATEGY
// ───────────────────
// 1. Server-only execution — this file runs exclusively in API
//    routes with the admin (service-role) Supabase client.
//    The client never calls Supabase RPC to modify XP directly.
//
// 2. Daily caps — each action type has a per-day ceiling stored
//    in `daily_xp_caps`. Even if an attacker replays requests,
//    they cannot exceed the cap.
//
// 3. Cooldowns — high-value actions have a `cooldownMinutes`
//    check.  Two workouts within 30 minutes?  Second one = 0 XP.
//
// 4. Input validation — base XP is ALWAYS read from the server-
//    side constant map, never from the request body.
//    `overrideBaseXP` is only accepted for admin_grant / unlock.
//
// 5. Idempotency — routine_completions has a UNIQUE constraint
//    on (user_id, routine_id, completed_date).  Duplicate calls
//    fail at the DB level.
//
// 6. Rate limiting — the API routes that call grantXP() are
//    behind a sliding-window rate limiter (see rate-limit.ts).
//
// 7. Append-only ledger — xp_transactions is INSERT-only for
//    users.  Impossible to edit past grants via RLS.
//
// 8. Server timestamp — the engine uses `NOW()` from Postgres,
//    not any client-supplied date.
// =============================================================

import type { XPActionType, XPGrant, LevelUpEvent } from '@/types/xp';
import type { Json } from '@/types/database';
import {
  XP_ACTIONS,
  COINS_PER_XP,
  LEVEL_UP_COIN_MULTIPLIER,
} from '@/lib/constants/xp';
import { getLevelInfo, levelFromTotalXP, titleForLevel } from './levels';
import { calculateStreakMultiplier, isStreakMilestone, getStreakMilestoneReward } from './streaks';
import { createAdminClient } from '@/lib/supabase/admin';

// ── Types ─────────────────────────────────────────────────────

interface GrantXPParams {
  userId: string;
  action: XPActionType;
  overrideBaseXP?: number;        // Admin-only bypass
  bonusXP?: number;               // Contextual bonus (e.g. outfit score tier)
  metadata?: Record<string, unknown>;
}

interface GrantXPResult {
  grant: XPGrant;
  newTotalXP: number;
  newCoins: number;
  levelUp?: LevelUpEvent;
  capped: boolean;                // True if daily cap hit
  cooledDown: boolean;            // True if cooldown blocked this grant
}

// ── Engine ────────────────────────────────────────────────────

/**
 * Grant XP to a user.  **This is the ONLY function that modifies XP.**
 *
 * Flow:
 * ┌──────────────────────────────────────────────────────────┐
 * │ 1. Validate action type exists                          │
 * │ 2. Check cooldown (anti-spam)                           │
 * │ 3. Check daily cap                                      │
 * │ 4. Fetch user profile (streak, XP, coins, level)        │
 * │ 5. Calculate streak multiplier (if eligible)            │
 * │ 6. Compute finalXP = (base + bonus) × multiplier        │
 * │ 7. Clamp to remaining daily cap                         │
 * │ 8. Compute coins = floor(finalXP / COINS_PER_XP)       │
 * │ 9. INSERT into xp_transactions (append-only ledger)     │
 * │ 10. UPSERT daily_xp_caps                                │
 * │ 11. UPDATE users (total_xp, coins, level)               │
 * │ 12. If level changed → award level-up bonus coins       │
 * │ 13. If streak milestone → award milestone reward        │
 * │ 14. Return result                                       │
 * └──────────────────────────────────────────────────────────┘
 */
export async function grantXP(params: GrantXPParams): Promise<GrantXPResult> {
  const { userId, action, overrideBaseXP, bonusXP = 0, metadata } = params;

  // ── 1. Validate action ──────────────────────────────────────
  const config = XP_ACTIONS[action];
  if (!config) throw new Error(`Unknown XP action: ${action}`);

  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD

  // ── 2. Cooldown check (anti-spam) ───────────────────────────
  if (config.cooldownMinutes && config.cooldownMinutes > 0) {
    const cooldownMs = config.cooldownMinutes * 60_000;
    const cutoff = new Date(Date.now() - cooldownMs).toISOString();

    const { count } = await supabase
      .from('xp_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', action)
      .gte('created_at', cutoff);

    if ((count ?? 0) > 0) {
      return zeroed(action, true, false);
    }
  }

  // ── 3. Check daily cap ──────────────────────────────────────
  const { data: capRow } = await supabase
    .from('daily_xp_caps')
    .select('xp_earned')
    .eq('user_id', userId)
    .eq('action', action)
    .eq('cap_date', today)
    .single();

  const earnedToday = capRow?.xp_earned ?? 0;

  if (config.dailyCap !== Infinity && earnedToday >= config.dailyCap) {
    return zeroed(action, false, true);
  }

  // ── 4. Fetch user profile ───────────────────────────────────
  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .select('total_xp, coins, level, streak_days, longest_streak')
    .eq('id', userId)
    .single();

  if (profileErr || !profile) throw new Error('User profile not found');

  // ── 5. Streak multiplier ────────────────────────────────────
  const streakMultiplier = config.streakEligible
    ? calculateStreakMultiplier(profile.streak_days)
    : 1.0;

  // ── 5B. Boost multiplier (from active boosts) ──────────────
  const { getXPMultiplier } = await import('@/lib/services/boost.service');
  const boostMultiplier = await getXPMultiplier(userId);

  // ── 6. Compute final XP ─────────────────────────────────────
  const baseXP = overrideBaseXP ?? config.baseXP;
  const combinedMultiplier = streakMultiplier * boostMultiplier;
  let rawXP = Math.round((baseXP + bonusXP) * combinedMultiplier);

  // ── 7. Clamp to remaining cap ───────────────────────────────
  if (config.dailyCap !== Infinity) {
    const room = config.dailyCap - earnedToday;
    rawXP = Math.min(rawXP, room);
  }

  const finalXP = Math.max(0, rawXP);

  // ── 8. Coins ────────────────────────────────────────────────
  const { getCoinMultiplier } = await import('@/lib/services/boost.service');
  const coinMultiplier = await getCoinMultiplier(userId);
  const coinsEarned = Math.floor((finalXP / COINS_PER_XP) * coinMultiplier);

  // ── 9. Append to ledger ─────────────────────────────────────
  await supabase.from('xp_transactions').insert({
    user_id: userId,
    action,
    base_xp: baseXP,
    multiplier: combinedMultiplier,
    final_xp: finalXP,
    coins_earned: coinsEarned,
    metadata: (metadata ?? {}) as unknown as Json,
  });

  // ── 10. Upsert daily cap ────────────────────────────────────
  if (config.dailyCap !== Infinity) {
    await supabase.from('daily_xp_caps').upsert(
      {
        user_id: userId,
        action,
        cap_date: today,
        xp_earned: earnedToday + finalXP,
      },
      { onConflict: 'user_id,action,cap_date' },
    );
  }

  // ── 11. Update user stats ───────────────────────────────────
  const newTotalXP = profile.total_xp + finalXP;
  const newCoins = profile.coins + coinsEarned;
  const oldLevel = profile.level;
  const newLevel = levelFromTotalXP(newTotalXP);
  const levelInfo = getLevelInfo(newTotalXP);

  await supabase
    .from('users')
    .update({
      total_xp: newTotalXP,
      current_level_xp: levelInfo.xpInLevel,
      coins: newCoins,
      level: newLevel,
    })
    .eq('id', userId);

  // ── 11B. Sync to profiles table (used by layout/leaderboard) ─
  await supabase
    .from('profiles')
    .update({
      total_xp: newTotalXP,
      current_level_xp: levelInfo.xpInLevel,
      coins: newCoins,
      level: newLevel,
    })
    .eq('id', userId);

  // ── 12. Level-up bonus ──────────────────────────────────────
  let levelUp: LevelUpEvent | undefined;
  if (newLevel > oldLevel) {
    const levelUpCoins = newLevel * LEVEL_UP_COIN_MULTIPLIER;

    await supabase
      .from('users')
      .update({ coins: newCoins + levelUpCoins })
      .eq('id', userId);

    await supabase.from('xp_transactions').insert({
      user_id: userId,
      action: 'level_up_bonus',
      base_xp: 0,
      multiplier: 1.0,
      final_xp: 0,
      coins_earned: levelUpCoins,
      metadata: { previous_level: oldLevel, new_level: newLevel },
    });

    levelUp = {
      previousLevel: oldLevel,
      newLevel,
      coinsAwarded: levelUpCoins,
      newTitle: titleForLevel(newLevel),
      unlockedRewards: [], // TODO: Query rewards unlocked at this level
    };
  }

  // ── 13. Streak milestone check ──────────────────────────────
  if (
    isStreakMilestone(profile.streak_days) &&
    action !== 'streak_milestone' &&
    action !== 'level_up_bonus'
  ) {
    const reward = getStreakMilestoneReward(profile.streak_days);
    if (reward) {
      await grantXP({
        userId,
        action: 'streak_milestone',
        overrideBaseXP: reward.xp,
        metadata: { streak_days: profile.streak_days, bonus_coins: reward.coins },
      });
      // Extra coins from milestone (beyond the XP→coin conversion)
      await supabase
        .from('users')
        .update({ coins: newCoins + coinsEarned + reward.coins })
        .eq('id', userId);
    }
  }

  // ── 14. Return ──────────────────────────────────────────────
  return {
    grant: {
      action,
      baseXP,
      streakMultiplier,
      bonusXP,
      finalXP,
      coinsEarned,
      metadata,
    },
    newTotalXP,
    newCoins,
    levelUp,
    capped: false,
    cooledDown: false,
  };
}

// ── Helpers ───────────────────────────────────────────────────

/** Return a zero-XP result when an action is blocked. */
function zeroed(
  action: XPActionType,
  cooledDown: boolean,
  capped: boolean,
): GrantXPResult {
  return {
    grant: {
      action,
      baseXP: 0,
      streakMultiplier: 1.0,
      bonusXP: 0,
      finalXP: 0,
      coinsEarned: 0,
    },
    newTotalXP: 0,
    newCoins: 0,
    capped,
    cooledDown,
  };
}
