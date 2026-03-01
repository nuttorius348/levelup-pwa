export const dynamic = 'force-dynamic';

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

// ── Fallback quotes (used when AI providers are unavailable) ──

const FALLBACK_QUOTES = [
  { text: "The only workout you'll regret is the one you didn't do. Every rep is a vote for the person you're becoming.", theme: 'discipline-resilience', tone: 'gritty', attribution: 'LevelUp', tags: ['discipline', 'consistency'] },
  { text: "Champions aren't made in the ring. They're made at 5 AM when nobody is watching and every muscle screams to stay in bed.", theme: 'underdog-boxing', tone: 'intense', attribution: 'LevelUp', tags: ['grit', 'morning'] },
  { text: "Your comeback story is being written right now, in every small choice you make. The world doesn't see the grind — yet.", theme: 'comeback-narrative', tone: 'dramatic', attribution: 'LevelUp', tags: ['comeback', 'persistence'] },
  { text: "Discipline is choosing between what you want now and what you want most. The gap between who you are and who you want to be is closed by action.", theme: 'discipline-resilience', tone: 'stoic', attribution: 'LevelUp', tags: ['discipline', 'growth'] },
  { text: "You don't rise to the level of your goals. You fall to the level of your systems. Build the routine, trust the process.", theme: 'discipline-resilience', tone: 'reflective', attribution: 'LevelUp', tags: ['systems', 'routine'] },
  { text: "Every scar tells a story of survival. Every setback carries a lesson. You're not starting over — you're starting stronger.", theme: 'comeback-narrative', tone: 'dramatic', attribution: 'LevelUp', tags: ['resilience', 'strength'] },
  { text: "The ring doesn't care about your excuses. Neither does life. Lace up, show up, and throw punches until the bell rings.", theme: 'underdog-boxing', tone: 'gritty', attribution: 'LevelUp', tags: ['boxing', 'action'] },
  { text: "Rest is not retreat. Stillness is not stagnation. Even warriors sharpen their swords between battles.", theme: 'discipline-resilience', tone: 'calm', attribution: 'LevelUp', tags: ['rest', 'balance'] },
  { text: "They counted you out. Good. Underdogs don't need the crowd — they need one moment, one chance, one round to change everything.", theme: 'underdog-boxing', tone: 'intense', attribution: 'LevelUp', tags: ['underdog', 'opportunity'] },
  { text: "The bridge between your dream and your reality is called discipline. Walk it daily, even when it's dark.", theme: 'discipline-resilience', tone: 'reflective', attribution: 'LevelUp', tags: ['discipline', 'dreams'] },
  { text: "You've survived 100% of your worst days. That's not luck — that's steel forged in fire.", theme: 'comeback-narrative', tone: 'stoic', attribution: 'LevelUp', tags: ['survival', 'strength'] },
  { text: "Progress isn't always visible. Roots grow in darkness before the tree reaches the sun. Keep going.", theme: 'discipline-resilience', tone: 'calm', attribution: 'LevelUp', tags: ['patience', 'growth'] },
  { text: "The canvas talked trash. The ropes laughed. But when the underdog stands back up — the whole arena goes silent.", theme: 'underdog-boxing', tone: 'dramatic', attribution: 'LevelUp', tags: ['boxing', 'resilience'] },
  { text: "Your future self is watching you right now through memories. Make them proud of this chapter.", theme: 'comeback-narrative', tone: 'reflective', attribution: 'LevelUp', tags: ['motivation', 'future'] },
];

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
    let quoteData: { text: string; theme: string; tone: string; attribution: string; tags: string[]; followUp?: string };
    let provider = 'fallback';
    let fallbackUsed = false;
    let latencyMs = 0;

    try {
      const result = await AIService.generateQuote({ theme });

      if (result.success && result.data) {
        quoteData = {
          text: result.data.quoteText,
          theme: result.data.theme,
          tone: result.data.tone,
          attribution: result.data.attribution,
          tags: result.data.tags,
          followUp: result.data.followUp,
        };
        provider = result.provider ?? 'unknown';
        fallbackUsed = result.fallbackUsed ?? false;
        latencyMs = result.latencyMs ?? 0;
      } else {
        // AI failed — use fallback
        const dayIdx = new Date().getDate() % FALLBACK_QUOTES.length;
        const fb = FALLBACK_QUOTES[dayIdx];
        quoteData = fb;
        provider = 'fallback';
        fallbackUsed = true;
      }
    } catch {
      // AI completely unavailable — use fallback
      const dayIdx = new Date().getDate() % FALLBACK_QUOTES.length;
      const fb = FALLBACK_QUOTES[dayIdx];
      quoteData = fb;
      provider = 'fallback';
      fallbackUsed = true;
    }

    // ── Save to cache (using admin client to bypass RLS) ────
    try {
      const adminSupabase = createAdminClient();
      await adminSupabase
        .from('daily_quotes')
        .insert({
          quote_date: today,
          quote_text: quoteData.text,
          theme: quoteData.theme,
          tone: quoteData.tone,
          attribution: quoteData.attribution,
          tags: quoteData.tags,
          follow_up: quoteData.followUp ?? null,
          ai_provider: provider,
          fallback_used: fallbackUsed,
          generation_latency_ms: latencyMs,
        })
        .select()
        .single();
    } catch (saveErr) {
      console.error('[API] Failed to save daily quote:', saveErr);
    }

    return NextResponse.json({
      quote: {
        text: quoteData.text,
        theme: quoteData.theme,
        tone: quoteData.tone,
        attribution: quoteData.attribution,
        tags: quoteData.tags,
        followUp: quoteData.followUp,
      },
      date: today,
      stats: {
        totalReads: 0,
        uniqueReaders: 0,
      },
      cached: false,
      provider,
      latencyMs,
    });
  } catch (error) {
    console.error('[API] /api/ai/quote/today error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
