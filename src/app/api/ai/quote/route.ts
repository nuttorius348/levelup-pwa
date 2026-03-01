// =============================================================
// API: POST /api/ai/quote
// Generate an original, copyright-safe motivational quote
// =============================================================
//
// Themes:
//  • underdog-boxing       — grit, sweat, getting off the canvas
//  • comeback-narrative    — redemption arcs, second chances
//  • discipline-resilience — consistency, mental toughness
//
// All output is 100% original — no copyrighted dialogue,
// no real names, no recognisable fictional characters.
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AIService } from '@/lib/services/ai.service';
import { grantXP } from '@/lib/xp/engine';
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';
import type { QuoteTheme, QuoteTone } from '@/types/ai';
import { z } from 'zod';

const quoteRequestSchema = z.object({
  theme: z.enum(['underdog-boxing', 'comeback-narrative', 'discipline-resilience']).optional(),
  mood: z.string().max(100).optional(),
  tone: z.enum(['gritty', 'reflective', 'stoic', 'intense', 'calm', 'dramatic']).optional(),
  topic: z.string().max(200).optional(),
  situation: z.string().max(300).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = checkRateLimit(`ai:quote:${user.id}`, RATE_LIMITS.ai);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limited', retryAfterMs: rl.resetMs }, { status: 429 });
    }

    const body = await request.json();
    const parsed = quoteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    // Generate quote via unified AI service (handles routing + fallback)
    const result = await AIService.generateQuote({
      theme: parsed.data.theme as QuoteTheme | undefined,
      mood: parsed.data.mood,
      tone: parsed.data.tone as QuoteTone | undefined,
      topic: parsed.data.topic,
      situation: parsed.data.situation,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error ?? 'AI returned invalid format' },
        { status: 502 },
      );
    }

    const quote = result.data;

    // Save to DB
    await supabase.from('quotes').insert({
      user_id: user.id,
      quote_text: quote.quoteText,
      theme: quote.theme,
      tone: quote.tone,
      attribution: quote.attribution,
      tags: quote.tags,
      follow_up: quote.followUp,
      ai_provider: result.provider,
      fallback_used: result.fallbackUsed,
    });

    // Grant XP
    const xpResult = await grantXP({
      userId: user.id,
      action: 'quote_generated',
    });

    return NextResponse.json({
      quote,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed,
      latencyMs: result.latencyMs,
      xp: xpResult.grant,
    });
  } catch (error) {
    console.error('[API] quote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
