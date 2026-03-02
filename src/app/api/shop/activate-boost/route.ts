export const dynamic = 'force-dynamic';

// =============================================================
// POST /api/shop/activate-boost — Activate a purchased boost
// =============================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing itemId' },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Check ownership in user_inventory
    const { data: inventoryItem } = await admin
      .from('user_inventory')
      .select('id, item_id')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single();

    if (!inventoryItem) {
      return NextResponse.json(
        { error: 'You do not own this item' },
        { status: 403 },
      );
    }

    // Get the shop item details
    const { data: shopItem } = await admin
      .from('shop_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (!shopItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 },
      );
    }

    if (shopItem.category !== 'boost') {
      return NextResponse.json(
        { error: 'This item is not a boost' },
        { status: 400 },
      );
    }

    const metadata = shopItem.metadata as any;
    const xpMultiplier = metadata?.xpMultiplier ?? 1.0;
    const coinMultiplier = metadata?.coinMultiplier ?? 1.0;
    const durationMinutes = metadata?.durationMinutes ?? 60;

    // Activate the boost by inserting into active_boosts
    const expiresAt = new Date(Date.now() + durationMinutes * 60_000).toISOString();

    const { data: boost, error: boostError } = await admin
      .from('active_boosts')
      .insert({
        user_id: user.id,
        boost_type: xpMultiplier > 1 ? 'xp' : coinMultiplier > 1 ? 'coin' : 'combo',
        multiplier: Math.max(xpMultiplier, coinMultiplier),
        expires_at: expiresAt,
        source_item_id: itemId,
      })
      .select()
      .single();

    if (boostError) {
      console.error('[API] activate-boost insert error:', boostError);
      return NextResponse.json(
        { error: 'Failed to activate boost' },
        { status: 500 },
      );
    }

    // Remove the item from inventory (consumed)
    await admin
      .from('user_inventory')
      .delete()
      .eq('id', inventoryItem.id);

    const labelParts: string[] = [];
    if (xpMultiplier > 1) labelParts.push(`${xpMultiplier}x XP`);
    if (coinMultiplier > 1) labelParts.push(`${coinMultiplier}x Coins`);

    return NextResponse.json({
      success: true,
      boost: {
        id: boost?.id,
        multiplier: Math.max(xpMultiplier, coinMultiplier),
        minutesRemaining: durationMinutes,
        expiresAt,
      },
      message: `Boost activated! ${labelParts.join(' + ')} for ${durationMinutes} minutes.`,
    });
  } catch (error) {
    console.error('[API] /shop/activate-boost error:', error);
    return NextResponse.json(
      { error: 'Failed to activate boost' },
      { status: 500 },
    );
  }
}
