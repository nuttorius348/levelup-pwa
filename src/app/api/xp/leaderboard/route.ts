export const dynamic = 'force-dynamic';

// =============================================================
// API: GET /api/xp/leaderboard
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { paginationSchema } from '@/lib/validators/common';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const params = paginationSchema.parse({
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
    });

    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;

    const { data: leaderboard, count } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, level, total_xp', { count: 'exact' })
      .order('total_xp', { ascending: false })
      .range(from, to);

    // Get current user's rank
    const { data: userRank } = await supabase.rpc('get_user_rank', {
      p_user_id: user.id,
    });

    return NextResponse.json({
      leaderboard: (leaderboard ?? []).map((entry: any, index: number) => ({
        ...entry,
        rank: from + index + 1,
      })),
      totalCount: count,
      userRank: userRank ?? null,
      page: params.page,
      limit: params.limit,
    });
  } catch (error) {
    console.error('[API] leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
