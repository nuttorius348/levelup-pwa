export const dynamic = 'force-dynamic';

// =============================================================
// API: POST /api/shop/purchase — Buy an item with coins
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { purchaseItemSchema } from '@/lib/validators/shop';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = purchaseItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get the item
    const { data: item } = await admin
      .from('shop_items')
      .select('*')
      .eq('id', parsed.data.itemId)
      .eq('is_active', true)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Get user profile
    const { data: profile } = await admin
      .from('profiles')
      .select('coins, level')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check level requirement
    if (profile.level < item.level_required) {
      return NextResponse.json({
        error: `Requires level ${item.level_required}. You are level ${profile.level}.`,
      }, { status: 403 });
    }

    // Check balance
    if (profile.coins < item.price_coins) {
      return NextResponse.json({
        error: `Not enough coins. Need ${item.price_coins}, have ${profile.coins}.`,
      }, { status: 403 });
    }

    // Check stock
    if (item.is_limited && item.stock_remaining !== null && item.stock_remaining <= 0) {
      return NextResponse.json({ error: 'Item out of stock' }, { status: 409 });
    }

    // Check if already owned
    const { data: existing } = await admin
      .from('user_inventory')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', item.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Item already owned' }, { status: 409 });
    }

    // Execute purchase (use admin to bypass RLS)
    const newBalance = profile.coins - item.price_coins;

    // Deduct coins from both tables
    await admin.from('profiles').update({ coins: newBalance }).eq('id', user.id);
    await admin.from('users').update({ coins: newBalance }).eq('id', user.id);

    // Record purchase
    await admin.from('user_purchases').insert({
      user_id: user.id,
      item_id: item.id,
      price_paid: item.price_coins,
    });

    // Add to inventory
    await admin.from('user_inventory').insert({
      user_id: user.id,
      item_id: item.id,
    });

    // Decrement stock if limited
    if (item.is_limited && item.stock_remaining !== null) {
      await admin
        .from('shop_items')
        .update({ stock_remaining: item.stock_remaining - 1 })
        .eq('id', item.id);
    }

    return NextResponse.json({
      success: true,
      item: { id: item.id, name: item.name, category: item.category },
      newCoinBalance: newBalance,
    });
  } catch (error) {
    console.error('[API] shop/purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
