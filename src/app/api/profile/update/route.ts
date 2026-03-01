export const dynamic = 'force-dynamic';

// =============================================================
// POST /api/profile/update — Update user profile
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, username, avatarUrl } = body;

    const admin = createAdminClient();
    const updates: Record<string, unknown> = {};

    if (displayName !== undefined) {
      updates.display_name = displayName.trim().slice(0, 50);
    }
    if (username !== undefined) {
      const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
      if (clean.length < 3) {
        return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
      }
      // Check uniqueness
      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .neq('id', user.id)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
      updates.username = clean;
    }
    if (avatarUrl !== undefined) {
      updates.avatar_url = avatarUrl;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update both tables
    await admin.from('profiles').update(updates).eq('id', user.id);
    await admin.from('users').update(updates).eq('id', user.id);

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error('[API] profile/update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
