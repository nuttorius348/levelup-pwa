export const dynamic = 'force-dynamic';

// =============================================================
// POST /api/shop/theme — Set the active theme
// GET  /api/shop/theme — Get current theme
// =============================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { setActiveTheme, getUnlockedThemes } from '@/lib/services/cosmetic.service';
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

    const { themeSlug } = await request.json();

    if (!themeSlug) {
      return NextResponse.json(
        { error: 'Missing themeSlug' },
        { status: 400 }
      );
    }

    const result = await setActiveTheme(user.id, themeSlug);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      theme: themeSlug,
      message: result.message,
    });
  } catch (error) {
    console.error('[API] POST /shop/theme error:', error);
    return NextResponse.json(
      { error: 'Failed to set theme' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('users')
      .select('theme')
      .eq('id', user.id)
      .single();

    const currentTheme = profile?.theme ?? 'default';

    return NextResponse.json({
      theme: currentTheme,
    });
  } catch (error) {
    console.error('[API] GET /shop/theme error:', error);
    return NextResponse.json(
      { error: 'Failed to get theme' },
      { status: 500 }
    );
  }
}
