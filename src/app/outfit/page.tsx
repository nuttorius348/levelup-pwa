'use client';

// =============================================================
// /outfit — AI Outfit Rating Demo Page
// =============================================================
//
// Features:
//  • Upload outfit photo
//  • Select AI provider (GPT / Claude / Gemini)
//  • Get 1-10 rating with suggestions
//  • Track improvement over time
//  • Award XP with improvement bonuses
//  • History of past ratings
// =============================================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OutfitUpload, OutfitResults } from '@/components/outfit';
import type { OutfitRatingResult, AIProviderName } from '@/types/ai';

// ── Mock user for demo (real app would use auth) ─────────────

const DEMO_USER_ID = 'demo_user_001';

// ── Types ─────────────────────────────────────────────────────

interface RatingHistory {
  rating: OutfitRatingResult;
  imageUrl: string;
  timestamp: string;
  xpEarned: number;
  provider: AIProviderName;
}

// ── Component ─────────────────────────────────────────────────

export default function OutfitPage() {
  const [phase, setPhase] = useState<'upload' | 'loading' | 'results' | 'history'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results state
  const [currentRating, setCurrentRating] = useState<OutfitRatingResult | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [currentXP, setCurrentXP] = useState(0);
  const [currentProvider, setCurrentProvider] = useState<AIProviderName>('openai');
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);

  // History state (persisted in localStorage for demo)
  const [history, setHistory] = useState<RatingHistory[]>([]);
  const [bestScore, setBestScore] = useState<number | undefined>();

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('outfit_history');
      if (stored) {
        const parsed = JSON.parse(stored) as RatingHistory[];
        setHistory(parsed);
        const best = Math.max(...parsed.map(r => r.rating.overallScore), 0);
        setBestScore(best > 0 ? best : undefined);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to history
  const saveToHistory = useCallback((
    rating: OutfitRatingResult,
    imageUrl: string,
    xpEarned: number,
    provider: AIProviderName,
  ) => {
    const entry: RatingHistory = {
      rating,
      imageUrl,
      timestamp: new Date().toISOString(),
      xpEarned,
      provider,
    };

    const updated = [entry, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    localStorage.setItem('outfit_history', JSON.stringify(updated));

    // Update best score
    const newBest = Math.max(...updated.map(r => r.rating.overallScore));
    setBestScore(newBest);
  }, [history]);

  // ── Handle Upload & Submit ────────────────────────────────

  const handleSubmit = useCallback(async (
    file: File,
    provider: AIProviderName,
    context?: { occasion?: string; style?: string },
  ) => {
    setIsLoading(true);
    setError(null);
    setPhase('loading');
    setCurrentProvider(provider);

    try {
      // Build form data
      const formData = new FormData();
      formData.append('image', file);
      if (context?.occasion) formData.append('occasion', context.occasion);
      if (context?.style) formData.append('style', context.style);

      // For demo purposes, we'll also send the provider preference
      // (real API would respect this via a query param or header)
      const start = Date.now();

      const response = await fetch('/api/ai/outfit-rate', {
        method: 'POST',
        body: formData,
      });

      const latency = Date.now() - start;
      setLatencyMs(latency);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rate outfit');
      }

      const data = await response.json();

      // Extract results
      const rating: OutfitRatingResult = data.rating;
      const imageUrl = data.imageUrl || '';
      const xpGrant = data.xp;
      const actualProvider = data.provider as AIProviderName;
      const usedFallback = data.fallbackUsed || false;

      // Calculate XP (base + improvement bonus)
      let totalXP = xpGrant?.finalXP || 50;

      // Add improvement bonus if this beats previous best
      if (bestScore && rating.overallScore > bestScore) {
        const improvementBonus = Math.round((rating.overallScore - bestScore) * 10);
        totalXP += improvementBonus;
      }

      // Set state
      setCurrentRating(rating);
      setCurrentImageUrl(imageUrl);
      setCurrentXP(totalXP);
      setCurrentProvider(actualProvider);
      setFallbackUsed(usedFallback);

      // Save to history
      saveToHistory(rating, imageUrl, totalXP, actualProvider);

      // Show results
      setPhase('results');
    } catch (err) {
      console.error('Outfit rating error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('upload');
    } finally {
      setIsLoading(false);
    }
  }, [bestScore, saveToHistory]);

  // ── Handlers ──────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    setPhase('upload');
    setCurrentRating(null);
    setCurrentImageUrl('');
    setError(null);
  }, []);

  const handleDone = useCallback(() => {
    setPhase('upload');
    setCurrentRating(null);
    setCurrentImageUrl('');
  }, []);

  const handleViewHistory = useCallback(() => {
    setPhase('history');
  }, []);

  const handleBackFromHistory = useCallback(() => {
    setPhase('upload');
  }, []);

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="px-4 pt-safe-top pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">AI Outfit Rater</h1>
            {history.length > 0 && phase !== 'history' && (
              <button
                onClick={handleViewHistory}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                <span>📜</span>
                <span>History ({history.length})</span>
              </button>
            )}
          </div>
          <p className="text-sm text-white/40">
            Upload your outfit and get AI feedback
          </p>
          {bestScore && (
            <p className="text-xs text-white/30 mt-1">
              Your best: <span className="text-violet-400 font-semibold">{bestScore}/10</span>
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-safe-bottom">
        <AnimatePresence mode="wait">
          {/* Upload Phase */}
          {phase === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <OutfitUpload
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md mx-auto mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Loading Phase */}
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-6xl mb-4"
              >
                {currentProvider === 'openai' ? '🤖' :
                 currentProvider === 'anthropic' ? '🧠' : '✨'}
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">Analyzing your outfit...</h3>
              <p className="text-sm text-white/40">
                {currentProvider === 'openai' && 'GPT-4o is reviewing your style'}
                {currentProvider === 'anthropic' && 'Claude is analyzing your look'}
                {currentProvider === 'google' && 'Gemini is rating your outfit'}
              </p>
            </motion.div>
          )}

          {/* Results Phase */}
          {phase === 'results' && currentRating && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <OutfitResults
                rating={currentRating}
                imageUrl={currentImageUrl}
                xpEarned={currentXP}
                previousBest={bestScore}
                provider={currentProvider}
                fallbackUsed={fallbackUsed}
                latencyMs={latencyMs}
                onRetry={handleRetry}
                onDone={handleDone}
              />
            </motion.div>
          )}

          {/* History Phase */}
          {phase === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              <button
                onClick={handleBackFromHistory}
                className="mb-4 text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                <span>←</span>
                <span>Back</span>
              </button>

              <h2 className="text-xl font-bold mb-4">Rating History</h2>

              <div className="space-y-3">
                {history.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/[0.03] rounded-xl p-4 border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-violet-400">
                        {entry.rating.overallScore}/10
                      </span>
                      <span className="text-xs text-white/30">
                        +{entry.xpEarned} XP
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mb-2">
                      {entry.rating.occasionMatch} • {new Date(entry.timestamp).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {entry.rating.styleTags.slice(0, 3).map((tag, j) => (
                        <span
                          key={j}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {history.length === 0 && (
                  <div className="text-center py-12 text-white/20">
                    <p className="text-3xl mb-2">👔</p>
                    <p>No ratings yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
