// =============================================================
// POST /api/shop/activate-boost — Activate a purchased boost
// =============================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { activateBoost } from '@/lib/services/boost.service';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rewardId } = await request.json();

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Missing rewardId' },
        { status: 400 }
      );
    }

    // Check ownership
    const admin = createAdminClient();
    const { data: ownership } = await admin
      .from('user_rewards')
      .select('id, rewards(category, effects)')
      .eq('user_id', user.id)
      .eq('reward_id', rewardId)
      .single();

    if (!ownership) {
      return NextResponse.json(
        { error: 'You do not own this item' },
        { status: 403 }
      );
    }

    const reward = (ownership.rewards as any);
    const category = reward?.category;
    const effects = reward?.effects;

    if (category !== 'boost') {
      return NextResponse.json(
        { error: 'This item is not a boost' },
        { status: 400 }
      );
    }

    if (!effects) {
      return NextResponse.json(
        { error: 'Boost has no effects defined' },
        { status: 400 }
      );
    }

    // Activate boost
    const activeBoost = await activateBoost(user.id, rewardId, effects);

    if (!activeBoost) {
      return NextResponse.json(
        { error: 'Failed to activate boost' },
        { status: 500 }
      );
    }

    // Mark item as consumed (delete from user_rewards)
    await admin
      .from('user_rewards')
      .delete()
      .eq('id', ownership.id);

    return NextResponse.json({
      success: true,
      boost: activeBoost,
      message: `Boost activated! ${activeBoost.multiplier}x for ${activeBoost.minutesRemaining} minutes.`,
    });
  } catch (error) {
    console.error('[API] /shop/activate-boost error:', error);
    return NextResponse.json(
      { error: 'Failed to activate boost' },
      { status: 500 }
    );
  }
}
