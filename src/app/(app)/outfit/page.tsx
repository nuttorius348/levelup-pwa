'use client';

import { useState, useCallback } from 'react';
import BackButton from '@/components/ui/BackButton';
import OutfitUpload from '@/components/outfit/OutfitUpload';
import OutfitResults from '@/components/outfit/OutfitResults';
import type { OutfitRatingResult, AIProviderName } from '@/types/ai';

interface RatingState {
  rating: OutfitRatingResult;
  imageUrl: string;
  xpEarned: number;
  provider: AIProviderName;
  fallbackUsed: boolean;
  latencyMs: number;
}

export default function OutfitPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RatingState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (file: File, provider: AIProviderName, context?: { occasion?: string; style?: string }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('provider', provider);
      if (context?.occasion) formData.append('occasion', context.occasion);
      if (context?.style) formData.append('style', context.style);

      const response = await fetch('/api/ai/outfit-rate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to rate outfit');
      }

      const data = await response.json();
      setResult({
        rating: data.rating,
        imageUrl: URL.createObjectURL(file),
        xpEarned: data.xpEarned ?? 0,
        provider: data.provider ?? provider,
        fallbackUsed: data.fallbackUsed ?? false,
        latencyMs: data.latencyMs ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" />
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
          Outfit Rater
        </h1>
        <p className="text-slate-400 text-sm mt-1">Upload a photo and get AI fashion feedback</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          {error}
          <button onClick={handleRetry} className="ml-2 underline">Try again</button>
        </div>
      )}

      {!result ? (
        <OutfitUpload onSubmit={handleSubmit} isLoading={isLoading} />
      ) : (
        <OutfitResults
          rating={result.rating}
          imageUrl={result.imageUrl}
          xpEarned={result.xpEarned}
          provider={result.provider}
          fallbackUsed={result.fallbackUsed}
          latencyMs={result.latencyMs}
          onRetry={handleRetry}
          onDone={handleRetry}
        />
      )}
    </div>
  );
}
