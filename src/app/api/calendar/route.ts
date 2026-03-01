// =============================================================
// API: GET /api/calendar — Get calendar events for a month
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { monthSchema } from '@/lib/validators/common';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const month = url.searchParams.get('month');

    const parsed = monthSchema.safeParse(month);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM.' }, { status: 400 });
    }

    // Calculate month range
    const startDate = `${parsed.data}-01T00:00:00Z`;
    const [year, monthNum] = parsed.data.split('-').map(Number);
    const endDate = new Date(year!, monthNum!, 1).toISOString();

    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .gte('start_at', startDate)
      .lt('start_at', endDate)
      .order('start_at');

    return NextResponse.json({ events: events ?? [], month: parsed.data });
  } catch (error) {
    console.error('[API] calendar error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Create a calendar event
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: user.id,
        ...body,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('[API] calendar POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
