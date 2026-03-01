// =============================================================
// API: GET /api/ai/quote/today
// Returns today's daily motivational quote (cached)
// =============================================================
//
// Flow:
//  1. Check if today's quote exists in daily_quotes table
//  2. If yes → return cached quote
//  3. If no → generate new quote via AIService
//  4. Save to daily_quotes
//  5. Return fresh quote
//
// PUBLIC endpoint (no auth) — widgets can access this.
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AIService } from '@/lib/services/ai.service';
import type { QuoteTheme } from '@/types/ai';

// ── Rotate theme across days ──────────────────────────────────

const THEMES: QuoteTheme[] = [
  'underdog-boxing',
  'comeback-narrative',
  'discipline-resilience',
];

/** Pick a theme pseudo-randomly based on date (cycles every 3 days) */
function getThemeForDate(date: Date): QuoteTheme {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return THEMES[dayOfYear % THEMES.length]!;
}

// ── Route Handler ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD

    // ── Check cache first ────────────────────────────────────
    const { data: cached } = await supabase
      .from('daily_quotes')
      .select('*')
      .eq('quote_date', today)
      .single();

    if (cached) {
      return NextResponse.json({
        quote: {
          text: cached.quote_text,
          theme: cached.theme,
          tone: cached.tone,
          attribution: cached.attribution,
          tags: cached.tags,
          followUp: cached.follow_up,
        },
        date: cached.quote_date,
        stats: {
          totalReads: cached.total_reads,
          uniqueReaders: cached.unique_readers,
        },
        cached: true,
      });
    }

    // ── Generate fresh quote ─────────────────────────────────
    const theme = getThemeForDate(new Date());
    const result = await AIService.generateQuote({ theme });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: 'Failed to generate daily quote', details: result.error },
        { status: 502 },
      );
    }

    // ── Save to cache (using admin client to bypass RLS) ────
    const adminSupabase = createAdminClient();
    const { data: saved, error: saveError } = await adminSupabase
      .from('daily_quotes')
      .insert({
        quote_date: today,
        quote_text: result.data.quoteText,
        theme: result.data.theme,
        tone: result.data.tone,
        attribution: result.data.attribution,
        tags: result.data.tags,
        follow_up: result.data.followUp,
        ai_provider: result.provider,
        fallback_used: result.fallbackUsed,
        generation_latency_ms: result.latencyMs,
      })
      .select()
      .single();

    if (saveError) {
      console.error('[API] Failed to save daily quote:', saveError);
      // Still return the quote even if save failed
    }

    return NextResponse.json({
      quote: {
        text: result.data.quoteText,
        theme: result.data.theme,
        tone: result.data.tone,
        attribution: result.data.attribution,
        tags: result.data.tags,
        followUp: result.data.followUp,
      },
      date: today,
      stats: {
        totalReads: 0,
        uniqueReaders: 0,
      },
      cached: false,
      provider: result.provider,
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    console.error('[API] /api/ai/quote/today error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
