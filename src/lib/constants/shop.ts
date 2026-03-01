// =============================================================
// Shop Catalog — Categories, items, and pricing strategy
// =============================================================
//
// PRICING PHILOSOPHY
// ──────────────────
// • Cheapest item (25 coins) is earnable after Day 1
// • Mid-range items (100–500 coins) require 1–3 weeks of play
// • Premium items (1,000–5,000 coins) require 1–3 months
// • Legendary items (10,000+) are for dedicated 6-month+ players
// • Limited editions create FOMO and seasonal engagement
// • Boosts feel powerful but are temporary (coin sinks)
//
// COIN INCOME REFERENCE (per day, ~320 XP → 64 coins)
// ┌──────────────┬──────────────┬───────────────┐
// │ Timeframe    │ Coins earned │ Can afford     │
// ├──────────────┼──────────────┼───────────────┤
// │ Day 1        │     ~64      │ Common badge   │
// │ Week 1       │    ~450      │ Budget theme   │
// │ Month 1      │  ~1,920      │ Epic avatar    │
// │ Month 3      │  ~5,760      │ Legendary title│
// │ Month 6      │ ~11,500      │ Anything       │
// └──────────────┴──────────────┴───────────────┘
// (Plus level-up coin bonuses and streak milestones!)
// =============================================================

export const SHOP_CATEGORIES = [
  { id: 'badge',  label: 'Badges',  icon: '🏅', description: 'Display badges on your profile' },
  { id: 'avatar', label: 'Avatars', icon: '👤', description: 'Profile frames and effects' },
  { id: 'theme',  label: 'Themes',  icon: '🎨', description: 'App color themes' },
  { id: 'title',  label: 'Titles',  icon: '📛', description: 'Custom profile titles' },
  { id: 'boost',  label: 'Boosts',  icon: '⚡', description: 'Temporary XP multipliers' },
] as const;

export type ShopCategoryId = (typeof SHOP_CATEGORIES)[number]['id'];

// ── Full Item Catalog ─────────────────────────────────────────

export interface ShopItemDef {
  slug: string;
  name: string;
  description: string;
  category: ShopCategoryId;
  icon: string;
  costCoins: number;
  levelRequired: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isLimited: boolean;
  effects?: Record<string, unknown>;
}

export const SHOP_ITEMS: ShopItemDef[] = [
  // ── BADGES (cheap, collectible, entry-level) ────────────────
  { slug: 'badge-first-step',   name: 'First Step',      description: 'Started the journey',         category: 'badge', icon: '🐣', costCoins: 25,    levelRequired: 1,  rarity: 'common',    isLimited: false },
  { slug: 'badge-early-bird',   name: 'Early Bird',      description: 'Stretch before 9 AM pro',     category: 'badge', icon: '🌅', costCoins: 50,    levelRequired: 3,  rarity: 'common',    isLimited: false },
  { slug: 'badge-iron-will',    name: 'Iron Will',       description: 'Logged 10 workouts',          category: 'badge', icon: '🏋️', costCoins: 100,   levelRequired: 5,  rarity: 'common',    isLimited: false },
  { slug: 'badge-streak-7',     name: 'Week Warrior',    description: '7-day streak survivor',       category: 'badge', icon: '🔥', costCoins: 150,   levelRequired: 5,  rarity: 'rare',      isLimited: false },
  { slug: 'badge-fashionista',  name: 'Fashionista',     description: 'Scored 8+ on an outfit',      category: 'badge', icon: '👗', costCoins: 200,   levelRequired: 10, rarity: 'rare',      isLimited: false },
  { slug: 'badge-centurion',    name: 'Centurion',       description: '100-day streak achieved',     category: 'badge', icon: '👑', costCoins: 2000,  levelRequired: 30, rarity: 'legendary', isLimited: false },

  // ── AVATARS (mid-range, visual identity) ────────────────────
  { slug: 'avatar-flame-ring',  name: 'Flame Ring',      description: 'Fiery profile border',        category: 'avatar', icon: '🔥', costCoins: 200,  levelRequired: 5,  rarity: 'common',    isLimited: false },
  { slug: 'avatar-neon-glow',   name: 'Neon Glow',       description: 'Glowing neon outline',        category: 'avatar', icon: '💜', costCoins: 500,  levelRequired: 15, rarity: 'rare',      isLimited: false },
  { slug: 'avatar-gold-frame',  name: 'Gold Frame',      description: 'Prestige gold border',        category: 'avatar', icon: '✨', costCoins: 1500, levelRequired: 30, rarity: 'epic',      isLimited: false },
  { slug: 'avatar-diamond',     name: 'Diamond Frame',   description: 'Top-tier crystalline frame',  category: 'avatar', icon: '💎', costCoins: 5000, levelRequired: 50, rarity: 'legendary', isLimited: false },
  { slug: 'avatar-hologram',    name: 'Hologram',        description: 'Animated holographic avatar', category: 'avatar', icon: '🌈', costCoins: 8000, levelRequired: 75, rarity: 'legendary', isLimited: true },

  // ── THEMES (change the whole app vibe) ──────────────────────
  { slug: 'theme-midnight',     name: 'Midnight',        description: 'Deep blue-black tones',       category: 'theme', icon: '🌑', costCoins: 300,  levelRequired: 5,  rarity: 'common',    isLimited: false },
  { slug: 'theme-forest',       name: 'Forest',          description: 'Rich green nature theme',     category: 'theme', icon: '🌲', costCoins: 300,  levelRequired: 5,  rarity: 'common',    isLimited: false },
  { slug: 'theme-sunset',       name: 'Sunset',          description: 'Warm orange-pink gradient',   category: 'theme', icon: '🌅', costCoins: 500,  levelRequired: 10, rarity: 'rare',      isLimited: false },
  { slug: 'theme-cyberpunk',    name: 'Cyberpunk',       description: 'Neon purple + electric blue', category: 'theme', icon: '🌆', costCoins: 1000, levelRequired: 20, rarity: 'epic',      isLimited: false },
  { slug: 'theme-aurora',       name: 'Aurora',          description: 'Northern lights shimmer',     category: 'theme', icon: '🌌', costCoins: 3000, levelRequired: 40, rarity: 'legendary', isLimited: false },

  // ── TITLES (flex on the leaderboard) ────────────────────────
  { slug: 'title-grinder',      name: '"The Grinder"',   description: 'Show off your hustle',        category: 'title', icon: '⚙️', costCoins: 100,  levelRequired: 5,  rarity: 'common',    isLimited: false },
  { slug: 'title-beast-mode',   name: '"Beast Mode"',    description: 'Gym culture title',           category: 'title', icon: '🦁', costCoins: 300,  levelRequired: 15, rarity: 'rare',      isLimited: false },
  { slug: 'title-drip-lord',    name: '"Drip Lord"',     description: 'Fashion game strong',         category: 'title', icon: '💧', costCoins: 500,  levelRequired: 20, rarity: 'rare',      isLimited: false },
  { slug: 'title-zen-master',   name: '"Zen Master"',    description: 'Stretch & calm excellence',   category: 'title', icon: '🧘', costCoins: 500,  levelRequired: 20, rarity: 'rare',      isLimited: false },
  { slug: 'title-legend',       name: '"Living Legend"',  description: 'For level 100 achievers',    category: 'title', icon: '🏆', costCoins: 10000,levelRequired: 100, rarity: 'legendary', isLimited: false },

  // ── BOOSTS (temporary, coin sinks, keep economy flowing) ────
  { slug: 'boost-xp-1h',       name: 'XP Surge (1hr)',   description: '1.5× XP for 1 hour',         category: 'boost', icon: '⚡', costCoins: 150,  levelRequired: 5,  rarity: 'common',    isLimited: false, effects: { xpMultiplier: 1.5, durationMinutes: 60 } },
  { slug: 'boost-xp-24h',      name: 'XP Blitz (24hr)',  description: '1.25× XP for 24 hours',      category: 'boost', icon: '🔋', costCoins: 400,  levelRequired: 10, rarity: 'rare',      isLimited: false, effects: { xpMultiplier: 1.25, durationMinutes: 1440 } },
  { slug: 'boost-coin-1h',     name: 'Gold Rush (1hr)',  description: '2× coins for 1 hour',         category: 'boost', icon: '🪙', costCoins: 200,  levelRequired: 10, rarity: 'common',    isLimited: false, effects: { coinMultiplier: 2.0, durationMinutes: 60 } },
  { slug: 'boost-streak-shield',name: 'Streak Shield',   description: 'Protect streak for 1 miss',   category: 'boost', icon: '🛡️', costCoins: 750,  levelRequired: 15, rarity: 'epic',      isLimited: false, effects: { streakProtection: 1 } },
  { slug: 'boost-double-xp-w',  name: 'Double XP Weekend', description: '2× XP for 48 hours',       category: 'boost', icon: '🎆', costCoins: 2000, levelRequired: 25, rarity: 'epic',      isLimited: true,  effects: { xpMultiplier: 2.0, durationMinutes: 2880 } },
];
