// =============================================================
// Retention Service — Daily login, comeback bonuses, hooks
// =============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import type {
  LoginCalendarState,
  DailyLoginReward,
  ComebackBonus,
} from '@/types/economy';

// ── 7-day login reward cycle ─────────────────────────────────
//
// Day 1:  10 coins
// Day 2:  15 coins
// Day 3:  20 coins
// Day 4:  30 coins
// Day 5:  40 coins
// Day 6:  50 coins
// Day 7: 100 coins + bonus item
//
const DAILY_REWARDS: Omit<DailyLoginReward, 'isToday' | 'claimed'>[] = [
  { dayInCycle: 1, coins: 10,  bonusDescription: null, icon: '🟢' },
  { dayInCycle: 2, coins: 15,  bonusDescription: null, icon: '🔵' },
  { dayInCycle: 3, coins: 20,  bonusDescription: null, icon: '🟣' },
  { dayInCycle: 4, coins: 30,  bonusDescription: null, icon: '🟠' },
  { dayInCycle: 5, coins: 40,  bonusDescription: null, icon: '🔴' },
  { dayInCycle: 6, coins: 50,  bonusDescription: null, icon: '💎' },
  { dayInCycle: 7, coins: 100, bonusDescription: '+ Mystery Reward!', icon: '🎁' },
];

// Day-7 bonus item slugs that rotate per cycle
const CYCLE_BONUS_ITEMS = [
  'xp-boost-1hr',       // cycle 1
  'coin-boost-1hr',     // cycle 2
  'streak-shield-24hr', // cycle 3
  'xp-boost-1hr',       // cycle 4+
];

// ── Comeback bonus tiers ─────────────────────────────────────
//
// Scaled by days absent, caps at 14 days
//
const COMEBACK_TIERS = [
  { minAbsent: 3,  coins: 50,   xp: 25,  boostHours: 0, message: 'Welcome back! Here\'s a small gift.' },
  { minAbsent: 5,  coins: 100,  xp: 50,  boostHours: 1, message: 'We missed you! Take this boost.' },
  { minAbsent: 7,  coins: 200,  xp: 100, boostHours: 2, message: 'Great to see you! Enjoy the bonus XP.' },
  { minAbsent: 14, coins: 500,  xp: 250, boostHours: 4, message: 'Welcome back, champion! Here\'s a big care package.' },
];

// ── Get login calendar state ─────────────────────────────────

export async function getLoginCalendar(userId: string): Promise<LoginCalendarState> {
  const admin = createAdminClient();

  // Fetch recent login entries (up to 14 for display)
  const { data: entries } = await admin
    .from('login_calendar')
    .select('*')
    .eq('user_id', userId)
    .order('login_date', { ascending: false })
    .limit(14);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries?.find(e => e.login_date === today);
  const lastEntry = entries?.[0];

  // Calculate current position in 7-day cycle
  let currentDay = 1;
  let currentCycle = 1;

  if (lastEntry) {
    if (lastEntry.login_date === today) {
      currentDay = lastEntry.day_in_cycle;
      currentCycle = lastEntry.cycle_number;
    } else {
      // Check if yesterday was logged — continue cycle
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastEntry.login_date === yesterdayStr) {
        // Continue cycle
        currentDay = (lastEntry.day_in_cycle % 7) + 1;
        currentCycle = currentDay === 1
          ? lastEntry.cycle_number + 1
          : lastEntry.cycle_number;
      } else {
        // Streak broken — reset to day 1 of next cycle
        currentDay = 1;
        currentCycle = (lastEntry.cycle_number ?? 0) + 1;
      }
    }
  }

  // Calculate consecutive login streak
  let streak = 0;
  if (entries && entries.length > 0) {
    const checkDate = new Date(today);
    for (const entry of [...entries].sort((a, b) =>
      b.login_date.localeCompare(a.login_date)
    )) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (entry.login_date === dateStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Build reward array for display
  const rewards: DailyLoginReward[] = DAILY_REWARDS.map(r => ({
    ...r,
    isToday: r.dayInCycle === currentDay,
    claimed: todayEntry?.claimed && r.dayInCycle === currentDay
      ? true
      : entries?.some(
          e => e.day_in_cycle === r.dayInCycle &&
               e.cycle_number === currentCycle &&
               e.claimed
        ) ?? false,
  }));

  const nextReward = todayEntry?.claimed
    ? DAILY_REWARDS[(currentDay % 7)] ?? DAILY_REWARDS[0] // next day's reward
    : DAILY_REWARDS[currentDay - 1]; // today's reward

  return {
    currentDay,
    currentCycle,
    streak,
    rewards,
    todayClaimed: !!todayEntry?.claimed,
    nextReward: nextReward
      ? { ...nextReward, isToday: !todayEntry?.claimed, claimed: false }
      : null,
  };
}

// ── Claim daily login reward ─────────────────────────────────

export async function claimDailyLogin(userId: string): Promise<{
  success: boolean;
  coins: number;
  bonusItem: string | null;
  message: string;
}> {
  const admin = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Check if already claimed
  const { data: existing } = await admin
    .from('login_calendar')
    .select('id, claimed')
    .eq('user_id', userId)
    .eq('login_date', today)
    .single();

  if (existing?.claimed) {
    return { success: false, coins: 0, bonusItem: null, message: 'Already claimed today!' };
  }

  // Get calendar state to determine day/cycle
  const state = await getLoginCalendar(userId);
  const dayReward = DAILY_REWARDS[state.currentDay - 1];
  const coins = dayReward.coins;
  const bonusSlug = state.currentDay === 7
    ? CYCLE_BONUS_ITEMS[((state.currentCycle - 1) % CYCLE_BONUS_ITEMS.length)]
    : null;

  if (existing) {
    // Record exists but not claimed — mark as claimed
    await admin
      .from('login_calendar')
      .update({
        claimed: true,
        coins_awarded: coins,
        bonus_item_slug: bonusSlug,
      })
      .eq('id', existing.id);
  } else {
    // Insert new record
    await admin.from('login_calendar').insert({
      user_id: userId,
      login_date: today,
      day_in_cycle: state.currentDay,
      cycle_number: state.currentCycle,
      coins_awarded: coins,
      bonus_item_slug: bonusSlug,
      claimed: true,
    });
  }

  // Grant coins
  await admin.rpc('increment_coins', { user_id_input: userId, amount: coins });

  // If day 7 bonus, grant the bonus item
  if (bonusSlug) {
    const { data: reward } = await admin
      .from('rewards')
      .select('id')
      .eq('name', bonusSlug)
      .single();

    if (reward) {
      await admin.from('user_rewards').insert({
        user_id: userId,
        reward_id: reward.id,
      }).select().single();
    }
  }

  return {
    success: true,
    coins,
    bonusItem: bonusSlug,
    message: state.currentDay === 7
      ? `🎁 Day 7 bonus! +${coins} coins and a bonus item!`
      : `Day ${state.currentDay}: +${coins} coins!`,
  };
}

// ── Record daily login (call on app load) ────────────────────

export async function recordLogin(userId: string): Promise<void> {
  const admin = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Check if login already recorded today
  const { data: existing } = await admin
    .from('login_calendar')
    .select('id')
    .eq('user_id', userId)
    .eq('login_date', today)
    .single();

  if (existing) return; // Already recorded

  // Get state to determine cycle position
  const state = await getLoginCalendar(userId);

  await admin.from('login_calendar').insert({
    user_id: userId,
    login_date: today,
    day_in_cycle: state.currentDay,
    cycle_number: state.currentCycle,
    coins_awarded: 0,
    bonus_item_slug: null,
    claimed: false,
  });
}

// ── Check for comeback bonus ─────────────────────────────────

export async function checkComebackBonus(userId: string): Promise<ComebackBonus | null> {
  const admin = createAdminClient();

  // Find last login before today
  const today = new Date().toISOString().split('T')[0];
  const { data: lastLogin } = await admin
    .from('login_calendar')
    .select('login_date')
    .eq('user_id', userId)
    .lt('login_date', today)
    .order('login_date', { ascending: false })
    .limit(1)
    .single();

  if (!lastLogin) return null;

  // Calculate days absent
  const lastDate = new Date(lastLogin.login_date);
  const todayDate = new Date(today);
  const daysAbsent = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysAbsent < 3) return null; // Need 3+ days absent

  // Check if already claimed a comeback bonus for this absence
  const { data: existingBonus } = await admin
    .from('comeback_bonuses')
    .select('id')
    .eq('user_id', userId)
    .gte('claimed_at', today)
    .single();

  if (existingBonus) return null; // Already claimed

  // Find matching tier (pick highest qualifying)
  const tier = [...COMEBACK_TIERS]
    .reverse()
    .find(t => daysAbsent >= t.minAbsent);

  if (!tier) return null;

  return {
    daysAbsent,
    coinsAwarded: tier.coins,
    xpAwarded: tier.xp,
    boostHours: tier.boostHours,
    message: tier.message,
  };
}

// ── Claim comeback bonus ─────────────────────────────────────

export async function claimComebackBonus(userId: string): Promise<ComebackBonus | null> {
  const bonus = await checkComebackBonus(userId);
  if (!bonus) return null;

  const admin = createAdminClient();

  // Record the bonus claim
  const { error } = await admin.from('comeback_bonuses').insert({
    user_id: userId,
    days_absent: bonus.daysAbsent,
    coins_awarded: bonus.coinsAwarded,
    xp_awarded: bonus.xpAwarded,
    boost_hours: bonus.boostHours,
  });

  if (error) {
    console.error('[Retention] Comeback bonus claim failed:', error);
    return null;
  }

  // Grant coins
  if (bonus.coinsAwarded > 0) {
    await admin.rpc('increment_coins', { user_id_input: userId, amount: bonus.coinsAwarded });
  }

  // Grant XP
  if (bonus.xpAwarded > 0) {
    await admin.rpc('award_xp', { user_id_input: userId, amount: bonus.xpAwarded });
  }

  // Activate XP boost if included
  if (bonus.boostHours > 0) {
    const expiresAt = new Date(
      Date.now() + bonus.boostHours * 60 * 60 * 1000
    ).toISOString();

    await admin.from('active_boosts').insert({
      user_id: userId,
      reward_id: null,
      boost_type: 'xp_multiplier',
      multiplier: 1.5,
      expires_at: expiresAt,
    });
  }

  return bonus;
}
