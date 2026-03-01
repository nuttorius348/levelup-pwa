export const dynamic = 'force-dynamic';

// =============================================================
// GET /api/shop/cosmetics — Get equipped cosmetics
// =============================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getEquippedCosmetics } from '@/lib/services/cosmetic.service';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cosmetics = await getEquippedCosmetics(user.id);

    return NextResponse.json({ cosmetics });
  } catch (error) {
    console.error('[API] /shop/cosmetics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipped cosmetics' },
      { status: 500 }
    );
  }
}
