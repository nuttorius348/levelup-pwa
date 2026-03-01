export const dynamic = 'force-dynamic';

// =============================================================
// API: /api/workouts — List workouts & templates
// =============================================================

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get system templates + user's custom templates
    const { data: templates } = await supabase
      .from('workout_templates')
      .select('*')
      .or(`is_system.eq.true,created_by.eq.${user.id}`)
      .order('category');

    // Get user's recent logs
    const { data: logs } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ templates: templates ?? [], logs: logs ?? [] });
  } catch (error) {
    console.error('[API] workouts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
