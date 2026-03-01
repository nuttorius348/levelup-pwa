// =============================================================
// API: GET /api/ai/quote/widget
// iPhone widget-ready endpoint (simplified JSON)
// =============================================================
//
// Optimized for iOS WidgetKit consumption:
//  • No auth required (public)
//  • Minimal response size
//  • Fast CDN-cacheable
//  • Returns only essential fields
//
// Widget shows:
//  • Quote text
//  • Attribution
//  • Theme icon
//  • Today's date
//
// Widget deep-links to app to track read + award XP.
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AIService } from '@/lib/services/ai.service';
import type { QuoteTheme } from '@/types/ai';

// ── Theme icons for widget ────────────────────────────────────

const THEME_ICONS: Record<QuoteTheme, string> = {
  'underdog-boxing': '🥊',
  'comeback-narrative': '🔥',
  'discipline-resilience': '💪',
};

// ── Theme rotation ────────────────────────────────────────────

const THEMES: QuoteTheme[] = [
  'underdog-boxing',
  'comeback-narrative',
  'discipline-resilience',
];

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
    const today = new Date().toISOString().split('T')[0]!;

    // ── Check cache ──────────────────────────────────────────
    const { data: cached } = await supabase
      .from('daily_quotes')
      .select('quote_text, theme, attribution, tags')
      .eq('quote_date', today)
      .single();

    if (cached) {
      return NextResponse.json(
        {
          quote: cached.quote_text,
          attribution: cached.attribution,
          icon: THEME_ICONS[cached.theme as QuoteTheme] ?? '✨',
          theme: cached.theme,
          tags: cached.tags.slice(0, 3), // Max 3 tags for widget
          date: today,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        },
      );
    }

    // ── Generate fresh quote ─────────────────────────────────
    const theme = getThemeForDate(new Date());
    const result = await AIService.generateQuote({ theme });

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          quote: 'The journey of a thousand miles begins with a single step.',
          attribution: 'Ancient wisdom',
          icon: '✨',
          theme: 'discipline-resilience',
          tags: [],
          date: today,
        },
        { status: 200 }, // Return fallback quote instead of error
      );
    }

    // ── Save to cache ────────────────────────────────────────
    const adminSupabase = createAdminClient();
    await adminSupabase.from('daily_quotes').insert({
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
    });

    return NextResponse.json(
      {
        quote: result.data.quoteText,
        attribution: result.data.attribution,
        icon: THEME_ICONS[result.data.theme] ?? '✨',
        theme: result.data.theme,
        tags: result.data.tags.slice(0, 3),
        date: today,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    );
  } catch (error) {
    console.error('[API] /api/ai/quote/widget error:', error);
    
    // Return fallback quote on error (widgets should never show errors)
    return NextResponse.json({
      quote: 'Every champion was once a contender who refused to give up.',
      attribution: 'A fighter who kept swinging',
      icon: '🥊',
      theme: 'underdog-boxing',
      tags: ['perseverance', 'grit'],
      date: new Date().toISOString().split('T')[0],
    });
  }
}

// ── CORS for widgets ──────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
