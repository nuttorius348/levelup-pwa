// =============================================================
// AI Adapter — Anthropic Claude
// =============================================================

import Anthropic from '@anthropic-ai/sdk';
import type { AIProviderInterface } from './provider';
import type { AIOptions, AITextResponse, AIImageResponse } from '@/types/ai';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

export class ClaudeAdapter implements AIProviderInterface {
  readonly name = 'anthropic' as const;
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }

  async generateText(prompt: string, opts?: AIOptions): Promise<AITextResponse> {
    const start = Date.now();
    const model = opts?.model ?? DEFAULT_MODEL;

    const response = await this.client.messages.create({
      model,
      max_tokens: opts?.maxTokens ?? 1024,
      ...(opts?.systemPrompt ? { system: opts.systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((block: any): block is { type: 'text'; text: string } => block.type === 'text')
      .map((block: { type: 'text'; text: string }) => block.text)
      .join('');

    const latencyMs = Date.now() - start;

    return {
      text,
      provider: 'anthropic',
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs,
    };
  }

  async analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    opts?: AIOptions,
  ): Promise<AIImageResponse> {
    const start = Date.now();
    const model = opts?.model ?? DEFAULT_MODEL;

    const response = await this.client.messages.create({
      model,
      max_tokens: opts?.maxTokens ?? 2048,
      ...(opts?.systemPrompt ? { system: opts.systemPrompt } : {}),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const text = response.content
      .filter((block: any): block is { type: 'text'; text: string } => block.type === 'text')
      .map((block: { type: 'text'; text: string }) => block.text)
      .join('');

    const latencyMs = Date.now() - start;

    return {
      text,
      provider: 'anthropic',
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs,
    };
  }

  async *streamText(prompt: string, opts?: AIOptions): AsyncIterable<string> {
    const model = opts?.model ?? DEFAULT_MODEL;

    const stream = this.client.messages.stream({
      model,
      max_tokens: opts?.maxTokens ?? 1024,
      ...(opts?.systemPrompt ? { system: opts.systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}
