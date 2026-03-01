// =============================================================
// API: POST /api/notifications/preferences — Save per-user prefs
// API: GET  /api/notifications/preferences — Load prefs
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const preferencesSchema = z.object({
  streakReminder: z.boolean().optional(),
  dailyQuote: z.boolean().optional(),
  dailyReminder: z.boolean().optional(),
  workoutReminder: z.boolean().optional(),
  levelUp: z.boolean().optional(),
});

// ── GET — Load preferences ────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_preferences, notifications_enabled')
      .eq('id', user.id)
      .single();

    const defaults = {
      streakReminder: true,
      dailyQuote: true,
      dailyReminder: true,
      workoutReminder: true,
      levelUp: true,
    };

    return NextResponse.json({
      enabled: profile?.notifications_enabled ?? false,
      preferences: {
        ...defaults,
        ...(profile?.notification_preferences as Record<string, boolean> | null),
      },
    });
  } catch (error) {
    console.error('[API] notifications/preferences GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — Save preferences ──────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid preferences' }, { status: 400 });
    }

    // Merge with existing preferences
    const { data: existing } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();

    const merged = {
      ...(existing?.notification_preferences as Record<string, boolean> | null),
      ...parsed.data,
    };

    await supabase
      .from('profiles')
      .update({ notification_preferences: merged })
      .eq('id', user.id);

    return NextResponse.json({ success: true, preferences: merged });
  } catch (error) {
    console.error('[API] notifications/preferences POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
