// =============================================================
// GET /api/shop/boosts — Get active boosts
// =============================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveBoosts } from '@/lib/services/boost.service';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const boosts = await getActiveBoosts(user.id);

    return NextResponse.json({ boosts });
  } catch (error) {
    console.error('[API] /shop/boosts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active boosts' },
      { status: 500 }
    );
  }
}
