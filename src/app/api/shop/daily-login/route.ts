// =============================================================
// POST /api/shop/daily-login â€” Claim daily login reward
// GET  /api/shop/daily-login â€” Get login calendar state
// =============================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  getLoginCalendar,
  claimDailyLogin,
} from '@/lib/services/retention.service';

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const state = await getLoginCalendar(user.id);

    return NextResponse.json({ state });
  } catch (error) {
    console.error('[API] GET /shop/daily-login error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch login calendar' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await claimDailyLogin(user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      coins: result.coins,
      bonusItem: result.bonusItem,
      message: result.message,
    });
  } catch (error) {
    console.error('[API] POST /shop/daily-login error:', error);
    return NextResponse.json(
      { error: 'Failed to claim daily login' },
      { status: 500 }
    );
  }
}
