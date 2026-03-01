export const dynamic = 'force-dynamic';

// =============================================================
// POST /api/profile/delete — Delete user account
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
    if (body.confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Must confirm with "DELETE"' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Delete user data from all tables (order matters for FK constraints)
    const tables = [
      'routine_completions',
      'routine_items',
      'routines',
      'checklist_tasks',
      'xp_transactions',
      'daily_xp_caps',
      'quote_reads',
      'workout_logs',
      'personal_records',
      'stretch_sessions',
      'user_inventory',
      'active_boosts',
      'user_quests',
      'profiles',
      'users',
    ];

    for (const table of tables) {
      await (admin.from as any)(table).delete().eq('user_id', user.id).then(() => {});
    }

    // Also try deleting from tables where the column is just 'id'
    await admin.from('profiles').delete().eq('id', user.id);
    await admin.from('users').delete().eq('id', user.id);

    // Delete the auth user
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('[API] Failed to delete auth user:', deleteError.message);
    }

    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('[API] profile/delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
