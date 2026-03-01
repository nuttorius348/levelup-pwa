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

    return NextResponse.json({
      items: (items ?? []).map((item: any) => ({
        ...item,
        owned: ownedItemIds.has(item.id),
        equipped: equippedItemIds.has(item.id),
      })),
    });
  } catch (error) {
    console.error('[API] shop/items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
