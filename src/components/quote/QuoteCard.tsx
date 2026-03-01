'use client';

// =============================================================
// QuoteCard — Daily motivational quote with share + XP
// =============================================================
//
// Features:
//  • Animated quote reveal
//  • Theme-based styling (boxing / comeback / discipline)
//  • Share button (iOS native share sheet + fallback)
//  • Read tracking (awards XP on first view)
//  • Morning bonus indicator (if read before 9 AM)
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuoteTheme, QuoteTone } from '@/types/ai';

// ── Props ─────────────────────────────────────────────────────

interface QuoteCardProps {
  quote: {
    text: string;
    theme: QuoteTheme;
    tone: QuoteTone;
    attribution: string;
    tags: string[];
    followUp?: string;
  };
  date: string;
  onRead?: (xp: number) => void;
  autoMarkRead?: boolean;
}

// ── Theme Styling ─────────────────────────────────────────────

const THEME_STYLES: Record<QuoteTheme, {
  gradient: string;
  icon: string;
  accentColor: string;
}> = {
  'underdog-boxing': {
    gradient: 'from-orange-500/20 to-red-500/20',
    icon: '🥊',
    accentColor: 'text-orange-400',
  },
  'comeback-narrative': {
    gradient: 'from-purple-500/20 to-pink-500/20',
    icon: '🔥',
    accentColor: 'text-purple-400',
  },
  'discipline-resilience': {
    gradient: 'from-blue-500/20 to-cyan-500/20',
    icon: '💪',
    accentColor: 'text-blue-400',
  },
};

// ── Component ─────────────────────────────────────────────────

export default function QuoteCard({
  quote,
  date,
  onRead,
  autoMarkRead = true,
}: QuoteCardProps) {
  const [hasRead, setHasRead] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isMorning, setIsMorning] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showXPAnimation, setShowXPAnimation] = useState(false);

  const themeStyle = THEME_STYLES[quote.theme] ?? THEME_STYLES['underdog-boxing'];

  // ── Mark as read (auto or manual) ────────────────────────
  const markAsRead = useCallback(async () => {
    if (hasRead) return;

    try {
      const response = await fetch('/api/ai/quote/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'web' }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to mark quote as read:', error);
        return;
      }

      const data = await response.json();

      if (data.alreadyRead) {
        setHasRead(true);
        setXpEarned(data.xp.total);
        return;
      }

      // Award XP
      setXpEarned(data.xp.total);
      setHasRead(true);
      setIsMorning(data.xp.morningBonus > 0);
      setShowXPAnimation(true);

      setTimeout(() => setShowXPAnimation(false), 3000);

      if (onRead) onRead(data.xp.total);
    } catch (error) {
      console.error('Error marking quote as read:', error);
    }
  }, [hasRead, onRead]);

  // Auto-mark as read on mount (if enabled)
  useEffect(() => {
    if (autoMarkRead) {
      markAsRead();
    }
  }, [autoMarkRead, markAsRead]);

  // ── Share ────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    setIsSharing(true);

    const shareText = `"${quote.text}"\n\n— ${quote.attribution}\n\nvia LevelUp Daily Quotes`;
    const shareUrl = `${window.location.origin}/quote/${date}`;

    try {
      // Try native share (iOS / Android)
      if (navigator.share) {
        await navigator.share({
          title: 'Daily Motivational Quote',
          text: shareText,
          url: shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        alert('Quote copied to clipboard!');
      }
    } catch (error) {
      // User cancelled share or clipboard failed
      console.log('Share cancelled or failed:', error);
    } finally {
      setIsSharing(false);
    }
  }, [quote, date]);

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* XP Animation */}
      <AnimatePresence>
        {showXPAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute -top-12 left-0 right-0 flex justify-center z-10"
          >
            <div className="px-4 py-2 rounded-full bg-violet-600/90 text-white font-semibold text-sm shadow-lg flex items-center gap-2">
              <span>✨</span>
              <span>+{xpEarned} XP</span>
              {isMorning && <span className="text-xs">🌅 Morning bonus!</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-3xl p-6 bg-gradient-to-br ${themeStyle.gradient} border border-white/10 backdrop-blur-sm`}
      >
        {/* Theme Icon */}
        <div className="absolute top-4 left-4 text-4xl opacity-20">
          {themeStyle.icon}
        </div>

        {/* Quote Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <blockquote className="text-xl font-serif leading-relaxed text-white mb-4">
            "{quote.text}"
          </blockquote>

          <p className={`text-sm font-medium ${themeStyle.accentColor}`}>
            — {quote.attribution}
          </p>

          {/* Tags */}
          {quote.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {quote.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-full bg-white/10 text-white/60 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Follow-up */}
          {quote.followUp && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-sm text-white/70 italic border-l-2 border-white/20 pl-3"
            >
              {quote.followUp}
            </motion.p>
          )}
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {/* Share Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 py-3 rounded-xl bg-white/10 text-white/80 border border-white/20 font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          >
            <span>📤</span>
            <span>{isSharing ? 'Sharing...' : 'Share'}</span>
          </motion.button>

          {/* Mark Read (if not auto) */}
          {!autoMarkRead && !hasRead && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={markAsRead}
              className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>✨</span>
              <span>Mark Read</span>
            </motion.button>
          )}

          {/* Read Status */}
          {hasRead && (
            <div className="flex-1 py-3 rounded-xl bg-white/5 text-white/40 border border-white/10 font-medium flex items-center justify-center gap-2 text-sm">
              <span>✓</span>
              <span>Read (+{xpEarned} XP)</span>
            </div>
          )}
        </div>

        {/* Date */}
        <p className="text-xs text-white/30 text-center mt-4">
          {new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </motion.div>
    </div>
  );
}
