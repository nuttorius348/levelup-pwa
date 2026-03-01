// =============================================================
// Unified AI Service — Single entry point for all AI tasks
// =============================================================
//
// Wraps the low-level AI router with:
//  • Standardized response envelope (AIServiceResponse<T>)
//  • Automatic JSON parsing + validation
//  • Retry + fallback awareness tracking
//  • Outfit rating with confidence score
//  • Token/cost metering
//  • Structured error handling
//
// Usage:
//   const result = await AIService.rateOutfit(base64, 'image/jpeg', { occasion: 'work' });
//   if (result.success) {
//     console.log(result.data.overallScore);   // 8
//     console.log(result.data.confidence);      // 0.92
//     console.log(result.data.suggestions);     // ["swap the…"]
//   }
// =============================================================

import { aiRouter } from '@/lib/ai/router';
import {
  buildOutfitRatingPrompt,
  OUTFIT_RATING_SYSTEM_PROMPT,
} from '@/lib/ai/prompts/outfit-rating';
import {
  buildQuotePromptPair,
} from '@/lib/ai/prompts/motivational-quote';
import type {
  AIProviderName,
  AIOptions,
  AITextResponse,
  AIServiceResponse,
  OutfitRatingResult,
  MotivationalQuote,
  QuoteTheme,
  QuoteTone,
} from '@/types/ai';

// ── Helpers ───────────────────────────────────────────────────

/**
 * Safely parse JSON from an AI response, stripping markdown fences
 * that models sometimes wrap around JSON.
 */
function safeParseJSON<T>(text: string): { data: T | null; error: string | null } {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .trim();
  }

  try {
    return { data: JSON.parse(cleaned) as T, error: null };
  } catch (e) {
    return { data: null, error: `JSON parse failed: ${(e as Error).message}` };
  }
}

/**
 * Clamp a number to a range.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate and normalise an outfit rating, clamping scores
 * and filling any missing fields with safe defaults.
 */
function normaliseOutfitRating(raw: Record<string, unknown>): OutfitRatingResult {
  return {
    overallScore: clamp(Number(raw.overallScore) || 5, 1, 10),
    styleTags: Array.isArray(raw.styleTags)
      ? (raw.styleTags as string[]).slice(0, 8)
      : [],
    colorHarmony: clamp(Number(raw.colorHarmony) || 5, 1, 10),
    fitScore: clamp(Number(raw.fitScore) || 5, 1, 10),
    occasionMatch: typeof raw.occasionMatch === 'string' ? raw.occasionMatch : 'casual',
    feedback: typeof raw.feedback === 'string' ? raw.feedback : 'No feedback available.',
    suggestions: Array.isArray(raw.suggestions)
      ? (raw.suggestions as string[]).slice(0, 6)
      : [],
    confidence: clamp(Number(raw.confidence) || 0.5, 0, 1),
  };
}

/** Valid quote themes for validation */
const VALID_THEMES: QuoteTheme[] = ['underdog-boxing', 'comeback-narrative', 'discipline-resilience'];
/** Valid quote tones for validation */
const VALID_TONES: QuoteTone[] = ['gritty', 'reflective', 'stoic', 'intense', 'calm', 'dramatic'];

/**
 * Validate and normalise a motivational quote, ensuring all fields
 * are present and theme/tone are valid enum values.
 */
function normaliseQuote(raw: Record<string, unknown>, requestedTheme: QuoteTheme): MotivationalQuote {
  const theme = VALID_THEMES.includes(raw.theme as QuoteTheme)
    ? (raw.theme as QuoteTheme)
    : requestedTheme;

  const tone = VALID_TONES.includes(raw.tone as QuoteTone)
    ? (raw.tone as QuoteTone)
    : 'intense';

  return {
    quoteText: typeof raw.quoteText === 'string' ? raw.quoteText : '',
    theme,
    tone,
    attribution: typeof raw.attribution === 'string' ? raw.attribution : 'An unnamed fighter',
    tags: Array.isArray(raw.tags)
      ? (raw.tags as string[]).filter((t) => typeof t === 'string').slice(0, 6)
      : [],
    followUp: typeof raw.followUp === 'string' ? raw.followUp : '',
  };
}

/**
 * Build a successful service response from raw AI output + parsed data.
 */
function buildResponse<T>(
  data: T,
  raw: AITextResponse,
  fallbackUsed: boolean,
): AIServiceResponse<T> {
  return {
    success: true,
    data,
    raw: raw.text,
    provider: raw.provider,
    model: raw.model,
    inputTokens: raw.inputTokens,
    outputTokens: raw.outputTokens,
    latencyMs: raw.latencyMs,
    fallbackUsed,
  };
}

/**
 * Build an error service response.
 */
function buildErrorResponse<T>(error: string, provider?: AIProviderName): AIServiceResponse<T> {
  return {
    success: false,
    data: null,
    raw: '',
    provider: provider ?? 'openai',
    model: '',
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: 0,
    fallbackUsed: false,
    error,
  };
}

// ══════════════════════════════════════════════════════════════
// UNIFIED AI SERVICE
// ══════════════════════════════════════════════════════════════

export class AIService {
  // ────────────────────────────────────────────────────────────
  // OUTFIT RATING (Vision — image analysis)
  // ────────────────────────────────────────────────────────────

  /**
   * Rate an outfit image 1–10 with improvement suggestions and
   * confidence score.
   *
   * Flow:
   *  1. Send image to primary provider (GPT-4o) via router
   *  2. If primary fails → router auto-falls-back to Gemini 1.5 Pro
   *  3. Parse JSON response → validate → clamp scores
   *  4. Return standardized AIServiceResponse<OutfitRatingResult>
   *
   * @param imageBase64 - Raw base64-encoded image bytes
   * @param mimeType    - "image/jpeg" | "image/png" | "image/webp"
   * @param context     - Optional occasion / style / previous score
   */
  static async rateOutfit(
    imageBase64: string,
    mimeType: string,
    context?: {
      occasion?: string;
      style?: string;
      previousScore?: number;
    },
  ): Promise<AIServiceResponse<OutfitRatingResult>> {
    const prompt = buildOutfitRatingPrompt(context);

    try {
      const raw = await aiRouter.analyzeImage(
        'outfit-rating',
        imageBase64,
        mimeType,
        prompt,
        {
          systemPrompt: OUTFIT_RATING_SYSTEM_PROMPT,
          temperature: 0.3,
          responseFormat: 'json',
        },
      );

      // Detect if fallback was used by checking the provider against
      // the expected primary (openai for outfit-rating).
      const fallbackUsed = raw.provider !== 'openai';

      const { data, error } = safeParseJSON<Record<string, unknown>>(raw.text);
      if (error || !data) {
        return buildErrorResponse<OutfitRatingResult>(
          error ?? 'AI returned empty response',
          raw.provider,
        );
      }

      const normalised = normaliseOutfitRating(data);
      return buildResponse(normalised, raw, fallbackUsed);
    } catch (err) {
      console.error('[AIService.rateOutfit] All providers failed:', err);
      return buildErrorResponse<OutfitRatingResult>(
        err instanceof Error ? err.message : 'All AI providers failed',
      );
    }
  }

  // ────────────────────────────────────────────────────────────
  // MOTIVATIONAL QUOTE (Original, copyright-safe)
  // ────────────────────────────────────────────────────────────

  /**
   * Generate an original motivational quote in a specific narrative
   * archetype. All output is copyright-safe — no movie lines, no
   * real names, no copyrighted characters.
   *
   * Themes:
   *  • `underdog-boxing`        — grit, sweat, getting off the canvas
   *  • `comeback-narrative`     — redemption arcs, second chances
   *  • `discipline-resilience`  — consistency, mental toughness
   *
   * @param context.theme     - Narrative archetype (default: underdog-boxing)
   * @param context.mood      - User's emotional state
   * @param context.tone      - Preferred delivery style
   * @param context.topic     - Specific focus like "failure", "training"
   * @param context.situation - Personal context
   */
  static async generateQuote(
    context?: {
      theme?: QuoteTheme;
      mood?: string;
      tone?: QuoteTone;
      topic?: string;
      situation?: string;
    },
  ): Promise<AIServiceResponse<MotivationalQuote>> {
    const { systemPrompt, userPrompt, theme } = buildQuotePromptPair(context);

    try {
      const raw = await aiRouter.generateText(
        'motivational-quote',
        userPrompt,
        {
          systemPrompt,
          temperature: 0.9,
          responseFormat: 'json',
        },
      );

      const fallbackUsed = raw.provider !== 'anthropic';

      const { data, error } = safeParseJSON<Record<string, unknown>>(raw.text);
      if (error || !data) {
        return buildErrorResponse<MotivationalQuote>(
          error ?? 'AI returned empty response',
          raw.provider,
        );
      }

      // Validate the quote is non-empty
      if (!data.quoteText || typeof data.quoteText !== 'string' || data.quoteText.length < 10) {
        return buildErrorResponse<MotivationalQuote>(
          'AI returned an empty or too-short quote',
          raw.provider,
        );
      }

      const normalised = normaliseQuote(data, theme);
      return buildResponse(normalised, raw, fallbackUsed);
    } catch (err) {
      console.error('[AIService.generateQuote] All providers failed:', err);
      return buildErrorResponse<MotivationalQuote>(
        err instanceof Error ? err.message : 'All AI providers failed',
      );
    }
  }

  // ────────────────────────────────────────────────────────────
  // GENERIC TEXT GENERATION
  // ────────────────────────────────────────────────────────────

  /**
   * Send a text prompt to the best provider for a given task.
   * Router handles primary → fallback automatically.
   */
  static async generateText(
    task: 'motivational-quote' | 'workout-coach',
    prompt: string,
    opts?: AIOptions,
  ): Promise<AIServiceResponse<string>> {
    try {
      const raw = await aiRouter.generateText(task, prompt, opts);
      const expectedPrimary = task === 'motivational-quote' ? 'anthropic' : 'openai';
      const fallbackUsed = raw.provider !== expectedPrimary;

      return buildResponse(raw.text, raw, fallbackUsed);
    } catch (err) {
      console.error(`[AIService.generateText] Task "${task}" failed:`, err);
      return buildErrorResponse<string>(
        err instanceof Error ? err.message : 'All AI providers failed',
      );
    }
  }

  /**
   * Generate text and parse as JSON.
   */
  static async generateJSON<T>(
    task: 'motivational-quote' | 'workout-coach',
    prompt: string,
    opts?: AIOptions,
  ): Promise<AIServiceResponse<T>> {
    try {
      const raw = await aiRouter.generateText(task, prompt, {
        ...opts,
        responseFormat: 'json',
      });

      const expectedPrimary = task === 'motivational-quote' ? 'anthropic' : 'openai';
      const fallbackUsed = raw.provider !== expectedPrimary;

      const { data, error } = safeParseJSON<T>(raw.text);
      if (error || !data) {
        return buildErrorResponse<T>(error ?? 'AI returned empty JSON', raw.provider);
      }

      return buildResponse(data, raw, fallbackUsed);
    } catch (err) {
      console.error(`[AIService.generateJSON] Task "${task}" failed:`, err);
      return buildErrorResponse<T>(
        err instanceof Error ? err.message : 'All AI providers failed',
      );
    }
  }

  // ────────────────────────────────────────────────────────────
  // DIRECT PROVIDER ACCESS
  // ────────────────────────────────────────────────────────────

  /**
   * Send a prompt directly to a specific provider, bypassing the router.
   * No fallback — useful for A/B testing or provider-specific features.
   */
  static async sendToProvider(
    provider: AIProviderName,
    prompt: string,
    opts?: AIOptions,
  ): Promise<AIServiceResponse<string>> {
    try {
      const adapter = aiRouter.provider(provider);
      const raw = await adapter.generateText(prompt, opts);

      return buildResponse(raw.text, raw, false);
    } catch (err) {
      console.error(`[AIService.sendToProvider] ${provider} failed:`, err);
      return buildErrorResponse<string>(
        err instanceof Error ? err.message : `Provider ${provider} failed`,
        provider,
      );
    }
  }

  /**
   * Send an image directly to a specific provider for analysis.
   */
  static async sendImageToProvider(
    provider: AIProviderName,
    imageBase64: string,
    mimeType: string,
    prompt: string,
    opts?: AIOptions,
  ): Promise<AIServiceResponse<string>> {
    try {
      const adapter = aiRouter.provider(provider);
      const raw = await adapter.analyzeImage(imageBase64, mimeType, prompt, opts);

      return buildResponse(raw.text, raw, false);
    } catch (err) {
      console.error(`[AIService.sendImageToProvider] ${provider} failed:`, err);
      return buildErrorResponse<string>(
        err instanceof Error ? err.message : `Provider ${provider} failed`,
        provider,
      );
    }
  }

  // ────────────────────────────────────────────────────────────
  // STREAMING
  // ────────────────────────────────────────────────────────────

  /**
   * Stream text from the primary provider for a task.
   * Streaming does not support automatic fallback.
   */
  static streamText(
    task: 'motivational-quote' | 'workout-coach',
    prompt: string,
    opts?: AIOptions,
  ): AsyncIterable<string> {
    return aiRouter.streamText(task, prompt, opts);
  }

  // ────────────────────────────────────────────────────────────
  // MULTI-PROVIDER (Ensemble / Consensus)
  // ────────────────────────────────────────────────────────────

  /**
   * Send the same prompt to ALL providers and return all results.
   * Useful for comparing outputs or building consensus scores.
   *
   * Failures are collected, not thrown — returns partial results.
   */
  static async multiProviderQuery(
    prompt: string,
    opts?: AIOptions,
  ): Promise<{
    results: AIServiceResponse<string>[];
    successCount: number;
    failureCount: number;
  }> {
    const providers: AIProviderName[] = ['openai', 'anthropic', 'google'];

    const settled = await Promise.allSettled(
      providers.map((p) => AIService.sendToProvider(p, prompt, opts)),
    );

    const results: AIServiceResponse<string>[] = settled.map((s, i) =>
      s.status === 'fulfilled'
        ? s.value
        : buildErrorResponse<string>(
            s.reason instanceof Error ? s.reason.message : 'Provider failed',
            providers[i],
          ),
    );

    return {
      results,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    };
  }
}
