'use client';

// =============================================================
// /quote — Daily Motivational Quote Page
// =============================================================
//
// Features:
//  • Today's AI-generated quote (cached, rotates daily)
//  • Auto-awards XP on first read
//  • Morning bonus (if read before 9 AM)
//  • Share button (iOS native share)
//  • Previous quotes history
//  • Total XP earned from quotes
//  • Widget integration instructions
// =============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '@/components/ui/BackButton';
import { QuoteCard } from '@/components/quote';
import type { QuoteTheme, QuoteTone } from '@/types/ai';

// ── Types ─────────────────────────────────────────────────────

interface DailyQuote {
  text: string;
  theme: QuoteTheme;
  tone: QuoteTone;
  attribution: string;
  tags: string[];
  followUp?: string;
}

// ── Component ─────────────────────────────────────────────────

export default function QuotePage() {
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [quoteDate, setQuoteDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [stats, setStats] = useState({ totalReads: 0, uniqueReaders: 0 });
  const [reflection, setReflection] = useState('');
  const [hasProven, setHasProven] = useState(false);
  const [provingRead, setProvingRead] = useState(false);
  const [readResult, setReadResult] = useState<{ xp: number; message?: string } | null>(null);

  // ── Fetch Today's Quote ───────────────────────────────────
  useEffect(() => {
    async function fetchQuote() {
      try {
        const response = await fetch('/api/ai/quote/today');
        if (!response.ok) {
          throw new Error('Failed to fetch quote');
        }

        const data = await response.json();
        setQuote(data.quote);
        setQuoteDate(data.date);
        setStats(data.stats);
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuote();
  }, []);

  // ── Handle XP Earned ──────────────────────────────────────
  const handleQuoteRead = (xp: number) => {
    setTotalXP((prev) => prev + xp);
  };

  // ── Widget Instructions ───────────────────────────────────
  const [showWidget, setShowWidget] = useState(false);

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="px-4 pt-safe-top pb-4">
        <div className="max-w-md mx-auto">
          <BackButton href="/dashboard" />
          <h1 className="text-2xl font-bold mb-1">Daily Quote</h1>
          <p className="text-sm text-white/40">
            Original motivational wisdom, every day
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-safe-bottom">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="text-5xl mb-4"
              >
                ✨
              </motion.div>
              <p className="text-white/40">Generating today's quote...</p>
            </motion.div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center"
            >
              <p className="text-4xl mb-3">⚠️</p>
              <p>{error}</p>
            </motion.div>
          )}

          {/* Quote */}
          {quote && !isLoading && (
            <motion.div
              key="quote"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <QuoteCard
                quote={quote}
                date={quoteDate}
                onRead={handleQuoteRead}
                autoMarkRead={false}
              />

              {/* Proof of Reading — Reflection */}
              {!hasProven ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="max-w-md mx-auto mt-6 p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3"
                >
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span>✍️</span>
                    <span>Prove You Read It</span>
                  </h3>
                  <p className="text-xs text-white/40">
                    Write a short reflection about what this quote means to you (min 15 characters) to earn XP.
                  </p>
                  <textarea
                    value={reflection}
                    onChange={e => setReflection(e.target.value)}
                    placeholder="What resonated with you about this quote?"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${reflection.length >= 15 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {reflection.length}/15 characters
                    </span>
                    <button
                      onClick={async () => {
                        if (reflection.trim().length < 15) return;
                        setProvingRead(true);
                        try {
                          const res = await fetch('/api/ai/quote/read', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ source: 'web', reflection: reflection.trim() }),
                          });
                          const data = await res.json();
                          setHasProven(true);
                          if (data.xp) {
                            setReadResult({ xp: data.xp.total ?? 0, message: data.message });
                            handleQuoteRead(data.xp.total ?? 0);
                          } else if (data.alreadyRead) {
                            setReadResult({ xp: 0, message: 'Already read today!' });
                          }
                        } catch {
                          // silent
                        } finally {
                          setProvingRead(false);
                        }
                      }}
                      disabled={reflection.trim().length < 15 || provingRead}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white text-sm font-medium transition"
                    >
                      {provingRead ? '...' : '✨ Mark as Read & Earn XP'}
                    </button>
                  </div>
                </motion.div>
              ) : readResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto mt-6 p-5 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 text-center"
                >
                  <div className="text-3xl mb-2">✅</div>
                  {readResult.xp > 0 ? (
                    <>
                      <p className="text-xl font-bold text-violet-400">+{readResult.xp} XP</p>
                      <p className="text-sm text-white/60 mt-1">{readResult.message}</p>
                    </>
                  ) : (
                    <p className="text-sm text-white/60">{readResult.message ?? 'Quote marked as read!'}</p>
                  )}
                </motion.div>
              )}

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="max-w-md mx-auto mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-violet-400">
                      {stats.totalReads}
                    </p>
                    <p className="text-xs text-white/40">Total Reads</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-violet-400">
                      {stats.uniqueReaders}
                    </p>
                    <p className="text-xs text-white/40">Readers Today</p>
                  </div>
                </div>
              </motion.div>

              {/* Widget Instructions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="max-w-md mx-auto mt-6"
              >
                <button
                  onClick={() => setShowWidget(!showWidget)}
                  className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/5 text-left flex items-center justify-between hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-semibold">Add iPhone Widget</p>
                      <p className="text-xs text-white/40">
                        Get quotes on your home screen
                      </p>
                    </div>
                  </div>
                  <span className="text-white/40">
                    {showWidget ? '▼' : '▶'}
                  </span>
                </button>

                <AnimatePresence>
                  {showWidget && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 mt-2 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-white/60 space-y-2">
                        <p className="font-semibold text-white/80 mb-3">
                          Setup Instructions:
                        </p>
                        <ol className="space-y-2 list-decimal list-inside">
                          <li>Long-press on your iPhone home screen</li>
                          <li>Tap the <strong>+</strong> button (top-left)</li>
                          <li>Search for "LevelUp"</li>
                          <li>Select the Daily Quote widget</li>
                          <li>Tap "Add Widget"</li>
                        </ol>
                        <div className="mt-4 p-3 rounded-lg bg-violet-600/10 border border-violet-500/20">
                          <p className="text-xs text-violet-300">
                            <strong>Widget API:</strong>{' '}
                            <code className="text-violet-400">
                              {typeof window !== 'undefined'
                                ? `${window.location.origin}/api/ai/quote/widget`
                                : '/api/ai/quote/widget'}
                            </code>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* How it Works */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="max-w-md mx-auto mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>💡</span>
                  <span>How Daily Quotes Work</span>
                </h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-white/80">New quote at midnight</strong> — AI generates
                      a fresh quote daily
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-white/80">+10 XP for reading</strong> — awarded once per day
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-white/80">+15 XP morning bonus</strong> — read before 9 AM
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-white/80">100% original</strong> — no copyrighted content
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-white/80">3 themes rotate</strong> — underdog, comeback, discipline
                    </span>
                  </li>
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
