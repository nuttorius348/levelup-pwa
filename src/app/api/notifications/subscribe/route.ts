export const dynamic = 'force-dynamic';

// =============================================================
// API: POST /api/notifications/subscribe — Save push subscription
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Upsert subscription (endpoint is unique)
    await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint: parsed.data.endpoint,
        keys_p256dh: parsed.data.keys.p256dh,
        keys_auth: parsed.data.keys.auth,
        user_agent: request.headers.get('user-agent') ?? null,
        is_active: true,
      },
      { onConflict: 'endpoint' },
    );

    // Enable notifications on profile
    await supabase
      .from('profiles')
      .update({ notifications_enabled: true })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] notifications/subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
