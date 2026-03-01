export const dynamic = 'force-dynamic';

// =============================================================
// POST /api/shop/equip — Equip or unequip a cosmetic item
// =============================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { equipItem, unequipItem } from '@/lib/services/cosmetic.service';

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
        { status: 400 }
      );
    }

    if (action !== 'equip' && action !== 'unequip') {
      return NextResponse.json(
        { error: 'Invalid action. Use "equip" or "unequip"' },
        { status: 400 }
      );
    }

    const result =
      action === 'equip'
        ? await equipItem(user.id, itemId)
        : await unequipItem(user.id, itemId);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('[API] /shop/equip error:', error);
    return NextResponse.json(
      { error: 'Failed to equip item' },
      { status: 500 }
    );
  }
}
