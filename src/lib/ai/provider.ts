// =============================================================
// AI Provider — Abstract interface
// =============================================================

import type { AIOptions, AITextResponse, AIImageResponse, AIProviderName } from '@/types/ai';

/**
 * Abstract AI provider. Each adapter (OpenAI, Claude, Gemini) implements this.
 */
export interface AIProviderInterface {
  readonly name: AIProviderName;

  /**
   * Generate a text completion.
   */
  generateText(prompt: string, opts?: AIOptions): Promise<AITextResponse>;

  /**
   * Analyze an image with a text prompt (vision).
   */
  analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    opts?: AIOptions,
  ): Promise<AIImageResponse>;

  /**
   * Stream a text completion. Yields text chunks.
   */
  streamText(prompt: string, opts?: AIOptions): AsyncIterable<string>;
}

/**
 * Cost per 1K tokens (approximate, for tracking)
 */
export const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o':             { input: 0.0025,  output: 0.01 },
  'gpt-4o-mini':        { input: 0.00015, output: 0.0006 },
  'claude-3-5-sonnet':  { input: 0.003,   output: 0.015 },
  'claude-3-haiku':     { input: 0.00025, output: 0.00125 },
  'gemini-1.5-pro':     { input: 0.00125, output: 0.005 },
  'gemini-1.5-flash':   { input: 0.000075,output: 0.0003 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = TOKEN_COSTS[model] ?? { input: 0.001, output: 0.002 };
  return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
}
