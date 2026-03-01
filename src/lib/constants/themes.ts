// =============================================================
// Theme Definitions — All unlockable app themes
// =============================================================
//
// The "default" theme is always free and available.
// Other themes must be purchased from the shop.
// Theme slugs match the effects.themeSlug in the rewards table.
// =============================================================

import type { ThemeDefinition } from '@/types/economy';

// ── Theme Catalog ─────────────────────────────────────────────

export const THEMES: Record<string, ThemeDefinition> = {
  default: {
    slug: 'default',
    name: 'Default',
    icon: '🌙',
    description: 'Classic dark theme with violet accents',
    rarity: 'free',
    colors: {
      bg: '#0a0a0a',
      bgSecondary: '#0f172a',
      bgTertiary: '#1e293b',
      accent: '#7c3aed',
      accentHover: '#6d28d9',
      accentMuted: 'rgba(124, 58, 237, 0.2)',
      text: '#f8fafc',
      textSecondary: 'rgba(248, 250, 252, 0.7)',
      textMuted: 'rgba(248, 250, 252, 0.4)',
      border: 'rgba(255, 255, 255, 0.05)',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      xpBar: '#7c3aed',
      xpBarEnd: '#a855f7',
    },
  },

  midnight: {
    slug: 'midnight',
    name: 'Midnight',
    icon: '🌑',
    description: 'Deep blue-black tones',
    rarity: 'common',
    colors: {
      bg: '#030712',
      bgSecondary: '#0c1222',
      bgTertiary: '#111d35',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentMuted: 'rgba(59, 130, 246, 0.2)',
      text: '#e2e8f0',
      textSecondary: 'rgba(226, 232, 240, 0.7)',
      textMuted: 'rgba(226, 232, 240, 0.4)',
      border: 'rgba(59, 130, 246, 0.08)',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      xpBar: '#3b82f6',
      xpBarEnd: '#60a5fa',
    },
  },

  forest: {
    slug: 'forest',
    name: 'Forest',
    icon: '🌲',
    description: 'Rich green nature theme',
    rarity: 'common',
    colors: {
      bg: '#071209',
      bgSecondary: '#0d1f12',
      bgTertiary: '#162b1a',
      accent: '#22c55e',
      accentHover: '#16a34a',
      accentMuted: 'rgba(34, 197, 94, 0.2)',
      text: '#ecfdf5',
      textSecondary: 'rgba(236, 253, 245, 0.7)',
      textMuted: 'rgba(236, 253, 245, 0.4)',
      border: 'rgba(34, 197, 94, 0.08)',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      xpBar: '#22c55e',
      xpBarEnd: '#4ade80',
    },
  },

  sunset: {
    slug: 'sunset',
    name: 'Sunset',
    icon: '🌅',
    description: 'Warm orange-pink gradient',
    rarity: 'rare',
    colors: {
      bg: '#120808',
      bgSecondary: '#1c0f0f',
      bgTertiary: '#2a1515',
      accent: '#f97316',
      accentHover: '#ea580c',
      accentMuted: 'rgba(249, 115, 22, 0.2)',
      text: '#fff7ed',
      textSecondary: 'rgba(255, 247, 237, 0.7)',
      textMuted: 'rgba(255, 247, 237, 0.4)',
      border: 'rgba(249, 115, 22, 0.08)',
      success: '#34d399',
      warning: '#fde68a',
      error: '#fca5a5',
      xpBar: '#f97316',
      xpBarEnd: '#fb923c',
    },
  },

  cyberpunk: {
    slug: 'cyberpunk',
    name: 'Cyberpunk',
    icon: '🌆',
    description: 'Neon purple + electric blue',
    rarity: 'epic',
    colors: {
      bg: '#0a0515',
      bgSecondary: '#120a22',
      bgTertiary: '#1a0f33',
      accent: '#e879f9',
      accentHover: '#d946ef',
      accentMuted: 'rgba(232, 121, 249, 0.2)',
      text: '#faf5ff',
      textSecondary: 'rgba(250, 245, 255, 0.7)',
      textMuted: 'rgba(250, 245, 255, 0.4)',
      border: 'rgba(232, 121, 249, 0.1)',
      success: '#2dd4bf',
      warning: '#fbbf24',
      error: '#fb7185',
      xpBar: '#e879f9',
      xpBarEnd: '#06b6d4',
    },
  },

  aurora: {
    slug: 'aurora',
    name: 'Aurora',
    icon: '🌌',
    description: 'Northern lights shimmer',
    rarity: 'legendary',
    colors: {
      bg: '#030a10',
      bgSecondary: '#081520',
      bgTertiary: '#0f2030',
      accent: '#2dd4bf',
      accentHover: '#14b8a6',
      accentMuted: 'rgba(45, 212, 191, 0.2)',
      text: '#f0fdfa',
      textSecondary: 'rgba(240, 253, 250, 0.7)',
      textMuted: 'rgba(240, 253, 250, 0.4)',
      border: 'rgba(45, 212, 191, 0.08)',
      success: '#34d399',
      warning: '#fde68a',
      error: '#fca5a5',
      xpBar: '#2dd4bf',
      xpBarEnd: '#a78bfa',
    },
  },
};

// ── Helpers ───────────────────────────────────────────────────

export function getTheme(slug: string): ThemeDefinition {
  return THEMES[slug] ?? THEMES.default;
}

export function getAllThemes(): ThemeDefinition[] {
  return Object.values(THEMES);
}

export function getThemeSlugs(): string[] {
  return Object.keys(THEMES);
}

/**
 * Generate CSS custom properties from a theme definition.
 * These are applied to :root or a theme provider wrapper.
 */
export function themeToCSSVariables(theme: ThemeDefinition): Record<string, string> {
  return {
    '--color-bg': theme.colors.bg,
    '--color-bg-secondary': theme.colors.bgSecondary,
    '--color-bg-tertiary': theme.colors.bgTertiary,
    '--color-accent': theme.colors.accent,
    '--color-accent-hover': theme.colors.accentHover,
    '--color-accent-muted': theme.colors.accentMuted,
    '--color-text': theme.colors.text,
    '--color-text-secondary': theme.colors.textSecondary,
    '--color-text-muted': theme.colors.textMuted,
    '--color-border': theme.colors.border,
    '--color-success': theme.colors.success,
    '--color-warning': theme.colors.warning,
    '--color-error': theme.colors.error,
    '--color-xp-bar': theme.colors.xpBar,
    '--color-xp-bar-end': theme.colors.xpBarEnd,
  };
}
