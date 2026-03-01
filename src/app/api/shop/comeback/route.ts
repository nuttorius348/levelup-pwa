// =============================================================
// GET /api/shop/comeback â€” Check & claim comeback bonus
// =============================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  checkComebackBonus,
  claimComebackBonus,
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

    const bonus = await checkComebackBonus(user.id);

    if (!bonus) {
      return NextResponse.json({ available: false, bonus: null });
    }

    return NextResponse.json({ available: true, bonus });
  } catch (error) {
    console.error('[API] GET /shop/comeback error:', error);
    return NextResponse.json(
      { error: 'Failed to check comeback bonus' },
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

    const bonus = await claimComebackBonus(user.id);

    if (!bonus) {
      return NextResponse.json(
        { error: 'No comeback bonus available' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      bonus,
      message: bonus.message,
    });
  } catch (error) {
    console.error('[API] POST /shop/comeback error:', error);
    return NextResponse.json(
      { error: 'Failed to claim comeback bonus' },
      { status: 500 }
    );
  }
}
