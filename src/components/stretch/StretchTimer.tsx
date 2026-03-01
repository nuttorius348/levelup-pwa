'use client';

// =============================================================
// StretchTimer — Guided pose hold timer with breathing cues
// =============================================================
//
// Features:
//  • Circular countdown ring for pose holds
//  • Breathing animation (inhale/exhale pulse)
//  • Side indicator (left/right) for bilateral poses
//  • Transition phase overlay between poses
//  • Haptic feedback on completion
//  • Skip & pause controls
// =============================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StretchSession, StretchRoutinePose } from '@/types/stretch';
import { StretchService } from '@/lib/services/stretch.service';

// ── Props ─────────────────────────────────────────────────────

interface StretchTimerProps {
  session: StretchSession;
  onSessionUpdate: (session: StretchSession) => void;
  onComplete: (session: StretchSession) => void;
  onCancel: () => void;
}

// ── Circular Progress Ring ────────────────────────────────────

function PoseRing({
  progress,
  breathingProgress,
  size = 240,
  strokeWidth = 10,
}: {
  progress: number;       // 0→1 hold progress
  breathingProgress: number; // 0→1 breathing cycle
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  // Inner breathing ring (subtle pulse)
  const breathRadius = radius - 20;
  const breathCircumference = 2 * Math.PI * breathRadius;
  const breathOffset = breathCircumference * (1 - breathingProgress);

  return (
    <svg width={size} height={size} className="transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />

      {/* Hold progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#stretchGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />

      {/* Breathing pulse ring (inner) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={breathRadius}
        fill="none"
        stroke="rgba(167, 139, 250, 0.2)"
        strokeWidth={3}
        strokeDasharray={breathCircumference}
        strokeDashoffset={breathOffset}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />

      <defs>
        <linearGradient id="stretchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />  {/* violet-400 */}
          <stop offset="100%" stopColor="#8b5cf6" /> {/* violet-500 */}
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Side Badge ────────────────────────────────────────────────

function SideBadge({ side, totalSides }: { side: 1 | 2; totalSides: 1 | 2 }) {
  if (totalSides === 1) return null;

  return (
    <motion.div
      key={side}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30"
    >
      <span className="text-xs font-semibold text-violet-300">
        {side === 1 ? '← Left Side' : 'Right Side →'}
      </span>
    </motion.div>
  );
}

// ── Breathing Indicator ───────────────────────────────────────

function BreathingGuide({ phase }: { phase: 'inhale' | 'exhale' }) {
  return (
    <motion.div
      key={phase}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 text-sm text-white/50"
    >
      <motion.div
        animate={{
          scale: phase === 'inhale' ? [1, 1.3] : [1.3, 1],
        }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        className="w-3 h-3 rounded-full bg-violet-400/40"
      />
      <span>{phase === 'inhale' ? 'Breathe in…' : 'Breathe out…'}</span>
    </motion.div>
  );
}

// ── StretchTimer Component ────────────────────────────────────

export default function StretchTimer({
  session: initialSession,
  onSessionUpdate,
  onComplete,
  onCancel,
}: StretchTimerProps) {
  const [session, setSession] = useState(initialSession);
  const [elapsed, setElapsed] = useState(0);       // Seconds since hold started
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStarted = useRef(false);

  const currentPose = useMemo(() => StretchService.getCurrentPose(session), [session]);
  const nextPose = useMemo(() => StretchService.getNextPose(session), [session]);
  const progress = useMemo(() => StretchService.getProgress(session), [session]);
  const timeRemaining = useMemo(() => StretchService.getTimeRemaining(session), [session]);

  // ── Auto-start session ────────────────────────────────────

  useEffect(() => {
    if (!hasStarted.current && session.status === 'idle') {
      const started = StretchService.startSession(session);
      setSession(started);
      onSessionUpdate(started);
      hasStarted.current = true;
    }
  }, [session, onSessionUpdate]);

  // ── Countdown Interval ────────────────────────────────────

  useEffect(() => {
    if (session.status !== 'active' || isPaused || session.isTransitioning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);

      setSession(prev => {
        const { session: updated, holdComplete } = StretchService.tick(prev);

        if (holdComplete) {
          // Haptic feedback
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }

          // Advance to next side/pose
          const next = StretchService.advancePose(updated);
          if (next === null) {
            // All poses done
            const completed = StretchService.completeSession(updated);
            onComplete(completed);
            return completed;
          }

          setElapsed(0);
          onSessionUpdate(next);
          return next;
        }

        return updated;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session.status, isPaused, session.isTransitioning, onSessionUpdate, onComplete]);

  // ── Handlers ──────────────────────────────────────────────

  const handleBeginPose = useCallback(() => {
    const updated = StretchService.beginPose(session);
    setElapsed(0);
    setSession(updated);
    onSessionUpdate(updated);
  }, [session, onSessionUpdate]);

  const handlePause = useCallback(() => {
    const paused = StretchService.pauseSession(session);
    setIsPaused(true);
    setSession(paused);
    onSessionUpdate(paused);
  }, [session, onSessionUpdate]);

  const handleResume = useCallback(() => {
    const resumed = StretchService.resumeSession(session);
    setIsPaused(false);
    setSession(resumed);
    onSessionUpdate(resumed);
  }, [session, onSessionUpdate]);

  const handleSkip = useCallback(() => {
    const next = StretchService.skipPose(session);
    if (next === null) {
      const completed = StretchService.completeSession(session);
      onComplete(completed);
      return;
    }
    setElapsed(0);
    setSession(next);
    onSessionUpdate(next);
  }, [session, onSessionUpdate, onComplete]);

  const handleCancel = useCallback(() => {
    const cancelled = StretchService.cancelSession(session);
    setSession(cancelled);
    onCancel();
  }, [session, onCancel]);

  // ── Breathing phase ───────────────────────────────────────

  const breathPhase = StretchService.getBreathingPhase(elapsed);
  const breathProgress = StretchService.getBreathingProgress(elapsed);

  // ── Pose hold progress ────────────────────────────────────

  const holdProgress = currentPose
    ? 1 - (session.holdTimeRemaining / currentPose.holdSeconds)
    : 0;

  // ── Render ────────────────────────────────────────────────

  if (!currentPose) return null;

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0a0a0a] text-white px-4 pb-safe-bottom pt-safe-top">
      {/* ── Header: Progress Bar + Routine Title ─────────── */}
      <div className="w-full max-w-md pt-4 space-y-3">
        {/* Top bar with cancel + time remaining */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="text-sm text-white/40 hover:text-white/70 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center"
          >
            ✕ End
          </button>
          <span className="text-xs font-mono text-white/30">
            {StretchService.formatTime(timeRemaining)} left
          </span>
        </div>

        {/* Overall progress bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Pose counter */}
        <div className="text-center">
          <span className="text-xs text-white/40">
            {session.currentPoseIndex + 1} / {session.poses.length} poses
          </span>
        </div>
      </div>

      {/* ── Transition Overlay ───────────────────────────── */}
      <AnimatePresence mode="wait">
        {session.isTransitioning && (
          <motion.div
            key="transition"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-md"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl"
            >
              {session.currentPoseIndex === 0 ? '🧘' : '➡️'}
            </motion.div>

            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-white/60">Next Up</p>
              <h2 className="text-2xl font-bold">{currentPose.pose.name}</h2>
              <SideBadge side={session.currentSide} totalSides={currentPose.pose.sidesCount} />
            </div>

            {/* Instructions preview */}
            <div className="w-full bg-white/5 rounded-2xl p-4 space-y-2">
              {currentPose.pose.instructions.slice(0, 2).map((step, i) => (
                <p key={i} className="text-sm text-white/50">
                  {i + 1}. {step}
                </p>
              ))}
            </div>

            {/* Depth cue */}
            <p className="text-sm text-violet-300/60 italic text-center px-4">
              "{currentPose.pose.depthCue}"
            </p>

            {/* Begin button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleBeginPose}
              className="w-full max-w-xs py-4 rounded-2xl bg-violet-600 text-white font-semibold text-lg active:bg-violet-700 transition-colors min-h-[56px]"
            >
              Begin — {currentPose.holdSeconds}s hold
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active Hold View ─────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!session.isTransitioning && session.status === 'active' && (
          <motion.div
            key="hold"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 w-full max-w-md"
          >
            {/* Pose name + side */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">{currentPose.pose.name}</h2>
              <SideBadge side={session.currentSide} totalSides={currentPose.pose.sidesCount} />
            </div>

            {/* Timer ring */}
            <div className="relative flex items-center justify-center">
              <PoseRing
                progress={holdProgress}
                breathingProgress={breathProgress}
              />
              {/* Centered time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={session.holdTimeRemaining}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-5xl font-mono font-bold tabular-nums"
                >
                  {session.holdTimeRemaining}
                </motion.span>
                <span className="text-xs text-white/30 mt-1">seconds</span>
              </div>
            </div>

            {/* Breathing guide */}
            <AnimatePresence mode="wait">
              <BreathingGuide phase={breathPhase} />
            </AnimatePresence>

            {/* Breathing cue from pose */}
            <p className="text-xs text-white/30 text-center px-6 max-w-xs">
              {currentPose.pose.breathingCue}
            </p>

            {/* Next pose preview */}
            {nextPose && (
              <div className="w-full bg-white/5 rounded-xl p-3 flex items-center gap-3">
                <span className="text-xs text-white/30">Next:</span>
                <span className="text-sm text-white/60 font-medium">{nextPose.pose.name}</span>
                <span className="text-xs text-white/20 ml-auto">{nextPose.holdSeconds}s</span>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4 w-full max-w-xs">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSkip}
                className="flex-1 py-3 rounded-xl bg-white/5 text-white/40 text-sm font-medium active:bg-white/10 transition-colors min-h-[48px]"
              >
                Skip
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={isPaused ? handleResume : handlePause}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm font-medium active:bg-white/20 transition-colors min-h-[48px]"
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Paused Overlay ───────────────────────────────── */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 gap-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center space-y-4"
            >
              <p className="text-4xl">⏸</p>
              <h3 className="text-xl font-bold">Paused</h3>
              <p className="text-sm text-white/40">{currentPose.pose.name}</p>

              {/* Show modifications while paused */}
              <div className="bg-white/5 rounded-2xl p-4 mx-4 space-y-3 text-left max-w-xs">
                <div>
                  <p className="text-xs text-green-400 font-semibold mb-1">Easier</p>
                  <p className="text-sm text-white/60">{currentPose.pose.modifications.easier}</p>
                </div>
                <div>
                  <p className="text-xs text-orange-400 font-semibold mb-1">Harder</p>
                  <p className="text-sm text-white/60">{currentPose.pose.modifications.harder}</p>
                </div>
              </div>
            </motion.div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleResume}
                className="px-8 py-4 rounded-2xl bg-violet-600 text-white font-semibold min-h-[56px]"
              >
                ▶ Resume
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="px-6 py-4 rounded-2xl bg-white/10 text-white/60 font-medium min-h-[56px]"
              >
                End
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
