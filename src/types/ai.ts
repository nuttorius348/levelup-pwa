// =============================================================
// AI Types — Unified multi-provider AI service
// =============================================================
//
// Covers:
//  • Provider adapters (OpenAI / Claude / Gemini)
//  • Task-based routing with fallback
//  • Standardized text & image responses
//  • Outfit rating with confidence score
//  • Token usage + cost tracking
// =============================================================

// ── Provider & Task Enums ─────────────────────────────────────

export type AIProviderName = 'openai' | 'anthropic' | 'google';

export type AITaskType =
  | 'outfit-rating'
  | 'motivational-quote'
  | 'workout-coach';

/** Alias for backwards compat (older imports use `AITask`) */
export type AITask = AITaskType;

// ── Request Options ───────────────────────────────────────────

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
  responseFormat?: 'text' | 'json';
}

// ── Standardized Responses ────────────────────────────────────

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

/**
 * Standard text response returned by every adapter & the router.
 * All providers map their native responses to this shape.
 */
export interface AITextResponse {
  text: string;
  provider: AIProviderName;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

/**
 * Image analysis response — extends text with optional structured data.
 */
export interface AIImageResponse extends AITextResponse {
  structured?: OutfitRatingResult;
}

// ── Task Routing ──────────────────────────────────────────────

export interface TaskProviderMapping {
  task: AITaskType;
  primary: AIProviderName;
  fallback: AIProviderName;
  model: string;
  fallbackModel: string;
}

/** Legacy alias kept for older imports */
export interface AITaskConfig {
  task: AITaskType;
  primaryProvider: AIProviderName;
  fallbackProvider: AIProviderName;
  defaultModel: Record<AIProviderName, string>;
  defaultOptions: AIOptions;
}

// ── Outfit Rating ─────────────────────────────────────────────

export interface OutfitRatingResult {
  /** Overall outfit score from 1-10 */
  overallScore: number;
  /** Style descriptor tags (e.g. "casual", "streetwear") */
  styleTags: string[];
  /** Color harmony score 1-10 */
  colorHarmony: number;
  /** Fit score 1-10 */
  fitScore: number;
  /** Best-matching occasion for the outfit */
  occasionMatch: string;
  /** 2-3 sentence constructive feedback */
  feedback: string;
  /** 3-5 specific actionable improvement suggestions */
  suggestions: string[];
  /** AI confidence in the rating 0.0-1.0 */
  confidence: number;
}

// ── Motivational Quote ────────────────────────────────────────

/** Narrative archetype for motivational quote generation */
export type QuoteTheme =
  | 'underdog-boxing'
  | 'comeback-narrative'
  | 'discipline-resilience';

/** Delivery style / voice of the quote */
export type QuoteTone =
  | 'gritty'
  | 'reflective'
  | 'stoic'
  | 'intense'
  | 'calm'
  | 'dramatic';

/**
 * Structured motivational quote — 100% original, copyright-safe.
 *
 * The `attribution` is always a generic fictional archetype
 * (e.g. "A boxer before the final bell"), never a real name or
 * copyrighted character.
 */
export interface MotivationalQuote {
  /** The original motivational quote text (1-3 sentences) */
  quoteText: string;
  /** Which narrative archetype was used */
  theme: QuoteTheme;
  /** Delivery tone / voice */
  tone: QuoteTone;
  /** Fictional archetype attribution (NOT a real/copyrighted name) */
  attribution: string;
  /** 3-5 thematic tags (e.g. "perseverance", "grit") */
  tags: string[];
  /** Brief 1-sentence motivational follow-up or call-to-action */
  followUp: string;
}

// ── Unified Service Response ──────────────────────────────────

export interface AIServiceResponse<T = unknown> {
  success: boolean;
  data: T | null;
  raw: string;
  provider: AIProviderName;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  fallbackUsed: boolean;
  error?: string;
}
