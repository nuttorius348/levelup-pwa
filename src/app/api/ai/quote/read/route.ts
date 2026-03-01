export const dynamic = 'force-dynamic';

// =============================================================
// API: POST /api/ai/quote/read
// Mark daily quote as read and award XP
// =============================================================
//
// Flow:
//  1. Authenticate user
//  2. Check if already read today (UNIQUE constraint)
//  3. Detect if it's a morning read (before 9 AM)
//  4. Grant base XP + morning bonus (if applicable)
//  5. Insert into quote_reads (triggers daily_quotes counter)
//  6. Return XP grant details
//
// PREVENTS DUPLICATE XP via UNIQUE(user_id, quote_date) in DB.
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { grantXP } from '@/lib/xp/engine';
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit (prevent spam)
    const rl = checkRateLimit(`quote:read:${user.id}`, RATE_LIMITS.ai);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limited', retryAfterMs: rl.resetMs },
        { status: 429 },
      );
    }

    const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD
    const body = await request.json();
    const source = body.source ?? 'web'; // 'web' | 'widget' | 'share'

    // ── Check if already read today ──────────────────────────
    const { data: existing } = await supabase
      .from('quote_reads')
      .select('id, xp_earned, morning_bonus_earned')
      .eq('user_id', user.id)
      .eq('quote_date', today)
      .single();

    if (existing) {
      return NextResponse.json({
        alreadyRead: true,
        xp: {
          baseXP: existing.xp_earned,
          morningBonus: existing.morning_bonus_earned,
          total: existing.xp_earned + existing.morning_bonus_earned,
        },
        message: 'You already read today\'s quote',
      });
    }

    // ── Detect morning read (before 9 AM in user's timezone) ─
    const now = new Date();
    const hour = now.getUTCHours(); // Simplified — real app should use user's timezone
    const isMorning = hour < 9;

    // ── Grant XP ─────────────────────────────────────────────
    const baseGrant = await grantXP({
      userId: user.id,
      action: 'quote_read',
      metadata: { source, date: today },
    });

    let morningGrant = null;
    if (isMorning) {
      morningGrant = await grantXP({
        userId: user.id,
        action: 'quote_morning_bonus',
        metadata: { source, date: today },
      });
    }

    // ── Record read in DB ────────────────────────────────────
    // This will trigger daily_quotes read counter increment
    const { error: insertError } = await supabase
      .from('quote_reads')
      .insert({
        user_id: user.id,
        quote_date: today,
        xp_earned: baseGrant.grant.finalXP,
        morning_bonus_earned: morningGrant?.grant.finalXP ?? 0,
        source,
      });

    if (insertError) {
      // If insert fails due to UNIQUE constraint, it means another
      // request beat us (race condition). Return already-read.
      if (insertError.code === '23505') {
        return NextResponse.json({
          alreadyRead: true,
          message: 'Quote already marked as read',
        });
      }
      throw insertError;
    }

    return NextResponse.json({
      alreadyRead: false,
      xp: {
        baseXP: baseGrant.grant.finalXP,
        morningBonus: morningGrant?.grant.finalXP ?? 0,
        total: baseGrant.grant.finalXP + (morningGrant?.grant.finalXP ?? 0),
        streakMultiplier: baseGrant.grant.streakMultiplier,
      },
      message: isMorning
        ? '🌅 Good morning! Morning bonus earned'
        : '✨ Quote read! XP earned',
      levelUp: baseGrant.levelUp ?? morningGrant?.levelUp,
    });
  } catch (error) {
    console.error('[API] /api/ai/quote/read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
