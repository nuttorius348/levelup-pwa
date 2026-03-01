// =============================================================
// Glass Card — Reusable frosted-glass card component
// =============================================================

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function GlassCard({ children, className = '', onClick, padding = 'md' }: GlassCardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`glass ${paddingMap[padding]} ${onClick ? 'tap-scale' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
