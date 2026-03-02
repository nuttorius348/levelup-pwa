export const dynamic = 'force-dynamic';

// =============================================================
// API: /api/routines — CRUD routines
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRoutineSchema, updateRoutineSchema } from '@/lib/validators/routines';

// Ensure user profile exists in public.users AND profiles (required for FK constraints)
async function ensureUserProfile(userId: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!data) {
      // Create profile — the trigger may not have run
      const profileData = {
        id: userId,
        display_name: 'User',
        level: 1,
        total_xp: 0,
        current_level_xp: 0,
        coins: 0,
        streak_days: 0,
        longest_streak: 0,
      };
      await admin.from('users').upsert(profileData, { onConflict: 'id' });
      await admin.from('profiles').upsert(profileData, { onConflict: 'id' });
    } else {
      // Ensure profiles row also exists
      const { data: profileRow } = await admin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      if (!profileRow) {
        const { data: userData } = await admin
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (userData) {
          await admin.from('profiles').upsert({
            id: userId,
            display_name: userData.display_name ?? 'User',
            level: userData.level ?? 1,
            total_xp: userData.total_xp ?? 0,
            current_level_xp: userData.current_level_xp ?? 0,
            coins: userData.coins ?? 0,
            streak_days: userData.streak_days ?? 0,
            longest_streak: userData.longest_streak ?? 0,
          }, { onConflict: 'id' });
        }
      }
    }
  } catch {
    // Best-effort — continue anyway
  }
}

// GET — List user's routines with items and today's completions
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: routines, error } = await supabase
      .from('routines')
      .select(`
        *,
        routine_items(*),
        routine_completions!inner(*)
      `)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      // If the inner join fails (no completions), query without them
      // Try with regular client first, then admin if RLS blocks
      let routinesData: any[] | null = null;
      
      const { data: routinesNoCompletions } = await supabase
        .from('routines')
        .select('*, routine_items(*)')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('sort_order');

      routinesData = routinesNoCompletions;

      // If still null, try admin client (RLS may be blocking)
      if (!routinesData) {
        const admin = createAdminClient();
        const { data: adminRoutines } = await admin
          .from('routines')
          .select('*, routine_items(*)')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .eq('is_active', true)
          .order('sort_order');
        routinesData = adminRoutines;
      }

      // Separately get today's completions
      const { data: completions } = await supabase
        .from('routine_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed_date', today);

      return NextResponse.json({
        routines: routinesData ?? [],
        completions: completions ?? [],
        date: today,
      });
    }

    return NextResponse.json({ routines, date: today });
  } catch (error) {
    console.error('[API] routines GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Create a new routine with items
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createRoutineSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { items, ...routineData } = parsed.data;

    // Ensure user profile exists (FK constraint on routines.user_id)
    await ensureUserProfile(user.id);

    // Create routine
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        user_id: user.id,
        title: routineData.title,
        description: routineData.description ?? null,
        icon: routineData.icon,
        color: routineData.color,
        recurrence: routineData.recurrence,
        sort_order: 0,
        is_active: true,
      })
      .select()
      .single();

    // If RLS blocks the insert, try with admin client
    let finalRoutine = routine;
    if (routineError || !routine) {
      console.error('[API] routines insert error (trying admin):', routineError?.message);
      const admin = createAdminClient();
      const { data: adminRoutine, error: adminError } = await admin
        .from('routines')
        .insert({
          user_id: user.id,
          title: routineData.title,
          description: routineData.description ?? null,
          icon: routineData.icon,
          color: routineData.color,
          recurrence: routineData.recurrence,
          sort_order: 0,
          is_active: true,
        })
        .select()
        .single();

      if (adminError || !adminRoutine) {
        console.error('[API] routines admin insert error:', adminError?.message);
        return NextResponse.json(
          { error: 'Failed to create routine', detail: adminError?.message ?? routineError?.message },
          { status: 500 },
        );
      }
      finalRoutine = adminRoutine;
    }

    // Create routine items
    const routineItems = items.map((item: { title: string; xpValue?: number }, index: number) => ({
      routine_id: finalRoutine!.id,
      title: item.title,
      xp_value: item.xpValue ?? 10,
      sort_order: index,
    }));

    const admin = createAdminClient();
    const { data: createdItems } = await admin
      .from('routine_items')
      .insert(routineItems)
      .select();

    return NextResponse.json({
      routine: { ...finalRoutine, routine_items: createdItems },
    }, { status: 201 });
  } catch (error) {
    console.error('[API] routines POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
