'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CircularXPBarProps {
  currentXP: number;
  requiredXP: number;
  level: number;
  size?: number;
  strokeWidth?: number;
  showLevel?: boolean;
  animated?: boolean;
}

export function CircularXPBar({
  currentXP,
  requiredXP,
  level,
  size = 120,
  strokeWidth = 8,
  showLevel = true,
  animated = true,
}: CircularXPBarProps) {
  const [progress, setProgress] = useState(0);
  const percentage = Math.min((currentXP / requiredXP) * 100, 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setProgress(percentage), 100);
      return () => clearTimeout(timer);
    } else {
      setProgress(percentage);
    }
  }, [percentage, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Outer glow */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="xp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-slate-700/30"
          fill="none"
        />

        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="url(#xp-gradient)"
          fill="none"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: animated ? 1 : 0,
            ease: 'easeInOut',
          }}
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showLevel && (
          <motion.div
            className="text-3xl font-bold text-violet-300"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {level}
          </motion.div>
        )}
        <motion.div
          className="text-xs text-slate-400 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {Math.floor(percentage)}%
        </motion.div>
      </div>
    </div>
  );
}

interface LinearXPBarProps {
  currentXP: number;
  requiredXP: number;
  level: number;
  showStats?: boolean;
  animated?: boolean;
  className?: string;
}

export function LinearXPBar({
  currentXP,
  requiredXP,
  level,
  showStats = true,
  animated = true,
  className = '',
}: LinearXPBarProps) {
  const [progress, setProgress] = useState(0);
  const percentage = Math.min((currentXP / requiredXP) * 100, 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setProgress(percentage), 100);
      return () => clearTimeout(timer);
    } else {
      setProgress(percentage);
    }
  }, [percentage, animated]);

  return (
    <div className={`w-full ${className}`}>
      {/* Stats header */}
      {showStats && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-violet-300">Level {level}</span>
            <span className="text-xs text-slate-400">
              {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
            </span>
          </div>
          <span className="text-xs font-medium text-violet-400">
            {Math.floor(percentage)}%
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="relative h-4 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50">
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-pink-500/20 blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: progress > 0 ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: animated ? 1 : 0,
            ease: 'easeOut',
          }}
        />

        {/* Shimmer effect */}
        {progress > 0 && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'easeInOut',
            }}
            style={{ width: '50%' }}
          />
        )}

        {/* Inner highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full" />
      </div>
    </div>
  );
}
