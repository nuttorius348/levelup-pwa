export const dynamic = 'force-dynamic';

// =============================================================
// API: /api/shop/items — List shop items
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    let query = supabase
      .from('shop_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: items } = await query;

    // Get user's inventory to mark owned items
    const { data: inventory } = await supabase
      .from('user_inventory')
      .select('item_id, is_equipped')
      .eq('user_id', user.id);

    const ownedItemIds = new Set(inventory?.map((i: any) => i.item_id) ?? []);
    const equippedItemIds = new Set(
      inventory?.filter((i: any) => i.is_equipped).map((i: any) => i.item_id) ?? [],
    );

    // Get user's coin balance
    const { data: profile } = await supabase
      .from('users')
      .select('coins')
      .eq('id', user.id)
      .single();

    // Transform DB fields → UserInventoryItem format expected by frontend
    return NextResponse.json({
      items: (items ?? []).map((item: any) => ({
        id: item.id,
        slug: item.name?.toLowerCase().replace(/\s+/g, '-') ?? item.id,
        name: item.name ?? 'Item',
        description: item.description ?? '',
        category: item.category,
        icon: item.icon_url ?? '🎁',
        imageUrl: item.preview_url ?? undefined,
        costCoins: item.price_coins ?? 0,
        levelRequired: item.level_required ?? 1,
        rarity: (item.metadata as any)?.rarity ?? 'common',
        effects: (item.metadata as any)?.effects ?? undefined,
        owned: ownedItemIds.has(item.id),
        equipped: equippedItemIds.has(item.id),
      })),
      coins: profile?.coins ?? 0,
    });
  } catch (error) {
    console.error('[API] shop/items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
