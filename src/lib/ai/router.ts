// =============================================================
// AI Router — Task-based provider selection with fallback
// =============================================================

import type { AIProviderInterface } from './provider';
import type { AIOptions, AITextResponse, AIImageResponse, AIProviderName, AITaskType, TaskProviderMapping } from '@/types/ai';
import { OpenAIAdapter } from './openai';
import { ClaudeAdapter } from './claude';
import { GeminiAdapter } from './gemini';

/**
 * Task → Provider routing configuration.
 * Defines which AI provider handles each task type, with fallbacks.
 */
const TASK_ROUTING: TaskProviderMapping[] = [
  {
    task: 'outfit-rating',
    primary: 'openai',
    fallback: 'google',
    model: 'gpt-4o',
    fallbackModel: 'gemini-1.5-pro',
  },
  {
    task: 'motivational-quote',
    primary: 'anthropic',
    fallback: 'openai',
    model: 'claude-sonnet-4-20250514',
    fallbackModel: 'gpt-4o-mini',
  },
  {
    task: 'workout-coach',
    primary: 'openai',
    fallback: 'anthropic',
    model: 'gpt-4o',
    fallbackModel: 'claude-sonnet-4-20250514',
  },
];

/**
 * Singleton registry of AI provider instances.
 */
class AIRouter {
  private providers: Map<AIProviderName, AIProviderInterface> = new Map();
  private taskMap: Map<AITaskType, TaskProviderMapping> = new Map();

  constructor() {
    // Lazily register providers
    this.providers.set('openai', new OpenAIAdapter());
    this.providers.set('anthropic', new ClaudeAdapter());
    this.providers.set('google', new GeminiAdapter());

    // Build task lookup
    for (const mapping of TASK_ROUTING) {
      this.taskMap.set(mapping.task, mapping);
    }
  }

  /**
   * Get the provider instance for a given task.
   */
  private getProvider(name: AIProviderName): AIProviderInterface {
    const provider = this.providers.get(name);
    if (!provider) throw new Error(`AI provider "${name}" not registered`);
    return provider;
  }

  /**
   * Get routing config for a task.
   */
  private getTaskConfig(task: AITaskType): TaskProviderMapping {
    const config = this.taskMap.get(task);
    if (!config) throw new Error(`No routing config for task "${task}"`);
    return config;
  }

  /**
   * Generate text for a specific task, with automatic fallback.
   */
  async generateText(task: AITaskType, prompt: string, opts?: AIOptions): Promise<AITextResponse> {
    const config = this.getTaskConfig(task);

    try {
      const provider = this.getProvider(config.primary);
      return await provider.generateText(prompt, { ...opts, model: config.model });
    } catch (primaryError) {
      console.error(`[AI Router] Primary provider ${config.primary} failed for ${task}:`, primaryError);

      try {
        const fallback = this.getProvider(config.fallback);
        return await fallback.generateText(prompt, { ...opts, model: config.fallbackModel });
      } catch (fallbackError) {
        console.error(`[AI Router] Fallback provider ${config.fallback} also failed for ${task}:`, fallbackError);
        throw new Error(`All AI providers failed for task "${task}"`);
      }
    }
  }

  /**
   * Analyze an image for a specific task, with automatic fallback.
   */
  async analyzeImage(
    task: AITaskType,
    imageBase64: string,
    mimeType: string,
    prompt: string,
    opts?: AIOptions,
  ): Promise<AIImageResponse> {
    const config = this.getTaskConfig(task);

    try {
      const provider = this.getProvider(config.primary);
      return await provider.analyzeImage(imageBase64, mimeType, prompt, { ...opts, model: config.model });
    } catch (primaryError) {
      console.error(`[AI Router] Primary vision provider ${config.primary} failed for ${task}:`, primaryError);

      try {
        const fallback = this.getProvider(config.fallback);
        return await fallback.analyzeImage(imageBase64, mimeType, prompt, { ...opts, model: config.fallbackModel });
      } catch (fallbackError) {
        console.error(`[AI Router] Fallback vision provider ${config.fallback} also failed for ${task}:`, fallbackError);
        throw new Error(`All AI vision providers failed for task "${task}"`);
      }
    }
  }

  /**
   * Stream text from the primary provider for a task (no fallback for streams).
   */
  async *streamText(task: AITaskType, prompt: string, opts?: AIOptions): AsyncIterable<string> {
    const config = this.getTaskConfig(task);
    const provider = this.getProvider(config.primary);
    yield* provider.streamText(prompt, { ...opts, model: config.model });
  }

  /**
   * Directly access a specific provider (bypass task routing).
   */
  provider(name: AIProviderName): AIProviderInterface {
    return this.getProvider(name);
  }
}

// Export singleton
export const aiRouter = new AIRouter();
