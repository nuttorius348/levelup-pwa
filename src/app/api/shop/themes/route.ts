// =============================================================
// GET /api/shop/themes — Get unlocked themes
// =============================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUnlockedThemes } from '@/lib/services/cosmetic.service';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const themes = await getUnlockedThemes(user.id);

    return NextResponse.json({ themes });
  } catch (error) {
    console.error('[API] /shop/themes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
      { status: 500 }
    );
  }
}
