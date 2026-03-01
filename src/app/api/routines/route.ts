export const dynamic = 'force-dynamic';

// =============================================================
// API: /api/routines — CRUD routines
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createRoutineSchema, updateRoutineSchema } from '@/lib/validators/routines';

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
      const { data: routinesNoCompletions } = await supabase
        .from('routines')
        .select('*, routine_items(*)')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('sort_order');

      // Separately get today's completions
      const { data: completions } = await supabase
        .from('routine_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed_date', today);

      return NextResponse.json({
        routines: routinesNoCompletions ?? [],
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

    if (routineError || !routine) {
      return NextResponse.json({ error: 'Failed to create routine' }, { status: 500 });
    }

    // Create routine items
    const routineItems = items.map((item: { title: string; xpValue?: number }, index: number) => ({
      routine_id: routine.id,
      title: item.title,
      xp_value: item.xpValue ?? 10,
      sort_order: index,
    }));

    const { data: createdItems } = await supabase
      .from('routine_items')
      .insert(routineItems)
      .select();

    return NextResponse.json({
      routine: { ...routine, routine_items: createdItems },
    }, { status: 201 });
  } catch (error) {
    console.error('[API] routines POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
