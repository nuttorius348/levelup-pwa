export const dynamic = 'force-dynamic';

// =============================================================
// POST /api/shop/equip — Equip or unequip a cosmetic item
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

    const { itemId, action } = await request.json();

    if (!itemId || !action) {
      return NextResponse.json(
        { error: 'Missing itemId or action' },
        { status: 400 },
      );
    }

    if (action !== 'equip' && action !== 'unequip') {
      return NextResponse.json(
        { error: 'Invalid action. Use "equip" or "unequip"' },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Check if user owns the item in user_inventory
    const { data: inventoryItem } = await admin
      .from('user_inventory')
      .select('id, item_id, is_equipped')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single();

    if (!inventoryItem) {
      return NextResponse.json(
        { error: 'You do not own this item' },
        { status: 403 },
      );
    }

    // Get the item category so we can unequip same-category items
    const { data: shopItem } = await admin
      .from('shop_items')
      .select('category')
      .eq('id', itemId)
      .single();

    if (action === 'equip') {
      // Unequip all items in the same category first
      if (shopItem?.category) {
        const { data: sameCategoryItems } = await admin
          .from('shop_items')
          .select('id')
          .eq('category', shopItem.category);

        if (sameCategoryItems && sameCategoryItems.length > 0) {
          const sameCategoryIds = sameCategoryItems.map((i: any) => i.id);
          await admin
            .from('user_inventory')
            .update({ is_equipped: false })
            .eq('user_id', user.id)
            .in('item_id', sameCategoryIds);
        }
      }

      // Equip the target item
      await admin
        .from('user_inventory')
        .update({ is_equipped: true })
        .eq('id', inventoryItem.id);
    } else {
      // Unequip
      await admin
        .from('user_inventory')
        .update({ is_equipped: false })
        .eq('id', inventoryItem.id);
    }

    return NextResponse.json({
      success: true,
      message: action === 'equip' ? 'Item equipped!' : 'Item unequipped!',
    });
  } catch (error) {
    console.error('[API] /shop/equip error:', error);
    return NextResponse.json(
      { error: 'Failed to equip item' },
      { status: 500 },
    );
  }
}
