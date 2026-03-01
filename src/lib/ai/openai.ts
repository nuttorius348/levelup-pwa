// =============================================================
// AI Adapter — OpenAI (GPT-4o, GPT-4o-mini)
// =============================================================

import OpenAI from 'openai';
import type { AIProviderInterface } from './provider';
import type { AIOptions, AITextResponse, AIImageResponse } from '@/types/ai';
import { estimateCost } from './provider';

const DEFAULT_MODEL = 'gpt-4o';

export class OpenAIAdapter implements AIProviderInterface {
  readonly name = 'openai' as const;
  private _client: OpenAI | null = null;

  private get client(): OpenAI {
    if (!this._client) {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY is not set');
      this._client = new OpenAI({ apiKey: key });
    }
    return this._client;
  }

  async generateText(prompt: string, opts?: AIOptions): Promise<AITextResponse> {
    const start = Date.now();
    const model = opts?.model ?? DEFAULT_MODEL;

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        ...(opts?.systemPrompt ? [{ role: 'system' as const, content: opts.systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 1024,
    });

    const message = response.choices[0]?.message?.content ?? '';
    const usage = response.usage;
    const latencyMs = Date.now() - start;

    return {
      text: message,
      provider: 'openai',
      model,
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
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

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        ...(opts?.systemPrompt ? [{ role: 'system' as const, content: opts.systemPrompt }] : []),
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: prompt },
            {
              type: 'image_url' as const,
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high' as const,
              },
            },
          ],
        },
      ],
      temperature: opts?.temperature ?? 0.3,
      max_tokens: opts?.maxTokens ?? 2048,
    });

    const message = response.choices[0]?.message?.content ?? '';
    const usage = response.usage;
    const latencyMs = Date.now() - start;

    return {
      text: message,
      provider: 'openai',
      model,
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      latencyMs,
    };
  }

  async *streamText(prompt: string, opts?: AIOptions): AsyncIterable<string> {
    const model = opts?.model ?? DEFAULT_MODEL;

    const stream = await this.client.chat.completions.create({
      model,
      messages: [
        ...(opts?.systemPrompt ? [{ role: 'system' as const, content: opts.systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
