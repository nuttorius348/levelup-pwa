export const dynamic = 'force-dynamic';

// =============================================================
// API: POST /api/ai/outfit-rate
// Analyze an outfit image using the Unified AI Service
// =============================================================
//
// • Accepts multipart/form-data with "image" file
// • Validates type (JPEG/PNG/WebP) + size (≤5 MB)
// • Routes through AIService.rateOutfit() (GPT-4o → Gemini fallback)
// • Returns structured rating with 1–10 score, suggestions,
//   and confidence value
// • Awards XP via outfit_rated action
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AIService } from '@/lib/services/ai.service';
import { grantXP } from '@/lib/xp/engine';
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

// ── Fallback outfit rating when AI is unavailable ────────────
function generateFallbackRating(occasion?: string | null, style?: string | null) {
  const scores = [3.5, 4.0, 4.5, 5.0, 5.5];
  const idx = new Date().getSeconds() % scores.length;
  const score = scores[idx]!;

  const styleTags = ['basic', 'casual', 'everyday', 'unremarkable'];
  const suggestions = [
    'Consider adding a statement accessory like a quality watch or minimal bracelet to show intentionality.',
    'Try layering with a structured jacket or open button-down to add visual depth and dimension.',
    'Swap generic sneakers for clean leather shoes or chunky fashion sneakers in a coordinating color.',
    'Experiment with color — a single bold accent piece can transform an otherwise forgettable outfit.',
    'Make sure everything fits properly — even basic clothes look 10x better when tailored to your body.',
  ];
  const feedback = occasion
    ? `For ${occasion}, this outfit needs significant work. The overall look reads as hastily thrown together rather than intentionally styled. While the basic foundation is there, it lacks the polish, coordination, and distinctive details that would make it appropriate for the occasion. Focus on fit, color coordination, and adding at least one statement piece.`
    : 'This outfit reads as a default — the kind of thing you grab when you are not thinking about what to wear. The pieces are functional but lack intention, coordination, or any standout styling choices. There is no color story, no interesting textures, and no accessories to elevate the look. It is forgettable, which in fashion terms means it is underperforming.';

  return {
    overallScore: score,
    styleTags,
    colorHarmony: Math.max(score - 1, 1),
    fitScore: score,
    occasionMatch: occasion ?? 'running errands',
    feedback,
    suggestions,
    confidence: 0.4,
  };
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate Limit ───────────────────────────────────────
    const rl = checkRateLimit(`ai:outfit:${user.id}`, RATE_LIMITS.ai);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limited', retryAfterMs: rl.resetMs },
        { status: 429 },
      );
    }

    // ── Parse & Validate Image ───────────────────────────
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const occasion = formData.get('occasion') as string | null;
    const style = formData.get('style') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Use JPEG, PNG, or WebP.' },
        { status: 400 },
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Maximum 5 MB.' },
        { status: 400 },
      );
    }

    // ── Convert to base64 ────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    // ── Call Unified AI Service ──────────────────────────
    let rating: any;
    let resultProvider = 'fallback';
    let resultModel = 'fallback';
    let resultFallbackUsed = true;
    let resultLatencyMs = 0;

    try {
      const result = await AIService.rateOutfit(base64, file.type, {
        occasion: occasion ?? undefined,
        style: style ?? undefined,
      });

      if (result.success && result.data) {
        rating = result.data;
        resultProvider = result.provider ?? 'unknown';
        resultModel = result.model ?? 'unknown';
        resultFallbackUsed = result.fallbackUsed ?? false;
        resultLatencyMs = result.latencyMs ?? 0;
      } else {
        // AI failed — use fun fallback rating
        rating = generateFallbackRating(occasion, style);
      }
    } catch {
      // AI completely unavailable — use fallback
      rating = generateFallbackRating(occasion, style);
    }

    // ── Upload image to Supabase Storage ─────────────────
    const fileName = `${user.id}/${Date.now()}.${file.type.split('/')[1]}`;
    const { data: uploadData } = await supabase.storage
      .from('outfits')
      .upload(fileName, buffer, { contentType: file.type });

    const imageUrl = uploadData?.path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/outfits/${uploadData.path}`
      : '';

    // ── Save rating to DB ────────────────────────────────
    try {
      await supabase.from('outfit_ratings').insert({
        user_id: user.id,
        image_url: imageUrl,
        overall_score: rating.overallScore,
        style_tags: rating.styleTags,
        color_harmony: rating.colorHarmony,
        fit_score: rating.fitScore,
        occasion_match: rating.occasionMatch,
        ai_feedback: rating.feedback,
        ai_suggestions: rating.suggestions,
        ai_provider: resultProvider,
        xp_earned: 0,
      });
    } catch {
      // DB save is non-critical, continue
    }

    // ── Grant XP ─────────────────────────────────────────
    let xpResult: any = { grant: null, levelUp: null };
    try {
      xpResult = await grantXP({
        userId: user.id,
        action: 'outfit_submit',
        metadata: {
          score: rating.overallScore,
          confidence: rating.confidence,
          provider: resultProvider,
          fallbackUsed: resultFallbackUsed,
        },
      });
    } catch {
      // XP grant is non-critical
    }

    // ── Response ─────────────────────────────────────────
    return NextResponse.json({
      rating,
      imageUrl,
      provider: resultProvider,
      model: resultModel,
      fallbackUsed: resultFallbackUsed,
      latencyMs: resultLatencyMs,
      xp: xpResult.grant ?? null,
      levelUp: xpResult.levelUp ?? null,
    });
  } catch (error) {
    console.error('[API] outfit-rate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
