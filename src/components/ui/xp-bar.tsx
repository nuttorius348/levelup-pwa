// =============================================================
// XP Progress Bar — Animated level progress display
// =============================================================

'use client';

interface XPBarProps {
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  level: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function XPBar({
  currentXP,
  xpForCurrentLevel,
  xpForNextLevel,
  level,
  showLabel = true,
  size = 'md',
}: XPBarProps) {
  const progress = xpForNextLevel - xpForCurrentLevel === 0
    ? 100
    : Math.min(100, ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs">
          <span className="font-medium text-xp-gold">Lv. {level}</span>
          <span className="text-gray-400">
            {(currentXP - xpForCurrentLevel).toLocaleString()} / {(xpForNextLevel - xpForCurrentLevel).toLocaleString()} XP
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-800 rounded-full overflow-hidden ${sizeMap[size]}`}>
        <div
          className={`${sizeMap[size]} bg-gradient-to-r from-xp-gold to-yellow-300 rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
