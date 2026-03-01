// =============================================================
// Stretch System Types
// =============================================================
//
// Guided stretch routines with:
//  • Time-based holds (not rep-based)
//  • Beginner → Intermediate → Advanced progression
//  • Visual/audio cue structure
//  • Morning bonus XP integration
//  • Tutorial media per pose
// =============================================================

import type { WorkoutDifficulty } from './xp';

// ── Core Enums ────────────────────────────────────────────────

export type StretchCategory =
  | 'full_body'
  | 'upper_body'
  | 'lower_body'
  | 'back_relief'
  | 'hip_opener'
  | 'morning'
  | 'post_workout'
  | 'desk_break'
  | 'sleep';

export type StretchDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type StretchPhase =
  | 'warmup'       // Active movement to warm tissues
  | 'hold'         // Static hold — the main event
  | 'dynamic'      // Controlled movement through range
  | 'breathing'    // Focused breathwork between poses
  | 'cooldown';    // Gentle wind-down

export type BodyRegion =
  | 'neck'
  | 'shoulders'
  | 'chest'
  | 'upper_back'
  | 'lower_back'
  | 'core'
  | 'hips'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'ankles'
  | 'wrists'
  | 'full_body';

export type StretchSessionStatus =
  | 'idle'
  | 'active'
  | 'paused'
  | 'transitioning'   // Between poses
  | 'completed'
  | 'cancelled';

// ── Stretch Pose ──────────────────────────────────────────────

export interface StretchPose {
  id: string;
  name: string;
  slug: string;
  phase: StretchPhase;
  primaryRegion: BodyRegion;
  secondaryRegions: BodyRegion[];
  difficulty: StretchDifficulty;

  // Timing
  holdSeconds: number;            // Base hold time
  transitionSeconds: number;      // Time to get into position (visual cue)
  sidesCount: 1 | 2;             // 1 = bilateral, 2 = do each side

  // Instructions
  instructions: string[];         // Step-by-step
  breathingCue: string;           // e.g., "Inhale deeply, exhale into the stretch"
  depthCue: string;               // e.g., "Stretch until mild tension, not pain"
  modifications: {
    easier: string;
    harder: string;
  };

  // Media
  tutorialVideoUrl?: string;
  thumbnailUrl?: string;
  animationUrl?: string;          // Lottie/GIF for form guide

  // Safety
  contraindications: string[];    // When to skip this pose
  commonMistakes: string[];
}

// ── Stretch Routine ───────────────────────────────────────────

export interface StretchRoutine {
  id: string;
  title: string;
  subtitle: string;
  category: StretchCategory;
  difficulty: StretchDifficulty;
  estimatedMinutes: number;
  poses: StretchRoutinePose[];
  description: string;
  benefits: string[];
  icon: string;
  thumbnailUrl?: string;
  isDefault: boolean;             // Built-in vs user-created
  timesCompleted: number;
}

export interface StretchRoutinePose {
  poseId: string;
  pose: StretchPose;              // Hydrated
  orderIndex: number;
  holdSeconds: number;            // Override per-routine (progression)
  transitionSeconds: number;
  notes?: string;
}

// ── Active Stretch Session ────────────────────────────────────

export interface StretchSession {
  id: string;
  userId: string;
  routineId: string;
  routineTitle: string;
  difficulty: StretchDifficulty;
  status: StretchSessionStatus;
  poses: StretchRoutinePose[];

  // Timing
  startedAt: string;
  pausedAt?: string;
  completedAt?: string;
  totalDurationSeconds: number;

  // Current state
  currentPoseIndex: number;
  currentSide: 1 | 2;            // Which side we're on
  holdTimeRemaining: number;      // Seconds left in current hold
  isTransitioning: boolean;       // Between poses

  // Progress
  posesCompleted: number;
  posesSkipped: number;
  totalHoldTime: number;          // Actual time held (excl. transitions)

  // XP
  xpBreakdown: StretchXPBreakdown;
}

// ── XP Calculation ────────────────────────────────────────────

export interface StretchXPBreakdown {
  baseXP: number;                 // 20 XP base
  morningBonusXP: number;         // +15 if before 9 AM
  completionBonusXP: number;      // +10 for finishing every pose
  durationBonusXP: number;        // +1 per minute over 5 min (cap 15)
  difficultyBonusXP: number;      // 0 / +5 / +10 by difficulty
  streakMultiplier: number;
  totalXP: number;
  coinsEarned: number;
}

// ── Difficulty Progression ────────────────────────────────────

export interface StretchProgression {
  difficulty: StretchDifficulty;
  holdMultiplier: number;         // 1.0× / 1.5× / 2.0× on base hold
  transitionSeconds: number;      // More time for beginners
  breathingPauses: boolean;       // Insert breathing breaks
  modificationsShown: boolean;    // Show easier/harder variants
  voiceGuidance: boolean;         // Text-to-speech cues
}

export const STRETCH_PROGRESSION: Record<StretchDifficulty, StretchProgression> = {
  beginner: {
    difficulty: 'beginner',
    holdMultiplier: 1.0,
    transitionSeconds: 8,
    breathingPauses: true,
    modificationsShown: true,
    voiceGuidance: true,
  },
  intermediate: {
    difficulty: 'intermediate',
    holdMultiplier: 1.5,
    transitionSeconds: 5,
    breathingPauses: false,
    modificationsShown: false,
    voiceGuidance: true,
  },
  advanced: {
    difficulty: 'advanced',
    holdMultiplier: 2.0,
    transitionSeconds: 3,
    breathingPauses: false,
    modificationsShown: false,
    voiceGuidance: false,
  },
};

// ── XP Scaling by Difficulty ──────────────────────────────────

export const STRETCH_XP_SCALING: Record<StretchDifficulty, number> = {
  beginner: 0,
  intermediate: 5,
  advanced: 10,
};

// ── Stretch History ───────────────────────────────────────────

export interface StretchHistoryEntry {
  id: string;
  routineTitle: string;
  category: StretchCategory;
  difficulty: StretchDifficulty;
  durationMinutes: number;
  posesCompleted: number;
  totalHoldTime: number;
  xpEarned: number;
  isMorning: boolean;
  completedAt: string;
}

// ── Flexibility Stats ─────────────────────────────────────────

export interface FlexibilityStats {
  totalSessions: number;
  totalMinutes: number;
  totalHoldTime: number;
  averageDuration: number;
  morningSessions: number;
  currentWeekSessions: number;
  weeklyGoal: number;            // Target sessions per week
  favoriteCategory: StretchCategory | null;
  bodyRegionCoverage: Record<BodyRegion, number>;
  longestHold: { pose: string; seconds: number };
}

// ── Tutorial Media ────────────────────────────────────────────

export interface StretchTutorialMedia {
  poseId: string;
  poseName: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;               // "0:45"
  source: 'youtube' | 'custom';
  formCheckpoints: string[];      // Key form cues to watch for
}
