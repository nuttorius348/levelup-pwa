// =============================================================
// AI Adapter — Google Gemini
// =============================================================

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import type { AIProviderInterface } from './provider';
import type { AIOptions, AITextResponse, AIImageResponse } from '@/types/ai';

const DEFAULT_MODEL = 'gemini-1.5-pro';

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export class GeminiAdapter implements AIProviderInterface {
  readonly name = 'google' as const;
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  }

  async generateText(prompt: string, opts?: AIOptions): Promise<AITextResponse> {
    const start = Date.now();
    const modelName = opts?.model ?? DEFAULT_MODEL;
    const model = this.client.getGenerativeModel({
      model: modelName,
      safetySettings: SAFETY_SETTINGS,
      ...(opts?.systemPrompt ? { systemInstruction: opts.systemPrompt } : {}),
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts?.temperature ?? 0.7,
        maxOutputTokens: opts?.maxTokens ?? 1024,
      },
    });

    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata;
    const latencyMs = Date.now() - start;

    return {
      text,
      provider: 'google',
      model: modelName,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
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
    const modelName = opts?.model ?? DEFAULT_MODEL;
    const model = this.client.getGenerativeModel({
      model: modelName,
      safetySettings: SAFETY_SETTINGS,
      ...(opts?.systemPrompt ? { systemInstruction: opts.systemPrompt } : {}),
    });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: opts?.temperature ?? 0.3,
        maxOutputTokens: opts?.maxTokens ?? 2048,
      },
    });

    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata;
    const latencyMs = Date.now() - start;

    return {
      text,
      provider: 'google',
      model: modelName,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      latencyMs,
    };
  }

  async *streamText(prompt: string, opts?: AIOptions): AsyncIterable<string> {
    const modelName = opts?.model ?? DEFAULT_MODEL;
    const model = this.client.getGenerativeModel({
      model: modelName,
      safetySettings: SAFETY_SETTINGS,
      ...(opts?.systemPrompt ? { systemInstruction: opts.systemPrompt } : {}),
    });

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts?.temperature ?? 0.7,
        maxOutputTokens: opts?.maxTokens ?? 1024,
      },
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }
}
