# Economy System — LevelUp PWA

## Overview

Complete gamified economy system with:
- **Currency**: Coins earned from XP (1 coin per 5 XP)
- **Shop**: 26 items across 5 categories (badges, avatars, themes, titles, boosts)
- **Power-ups**: Temporary XP/coin multipliers, streak shields
- **Cosmetics**: Unlockable themes, profile decorations
- **Retention Hooks**: Daily login calendar (7-day cycle), comeback bonuses

---

## Architecture

### Database Tables (Migration 007)

#### `active_boosts`
Tracks activated power-ups with expiry timers.

```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- reward_id (UUID, FK → rewards)
- boost_type: 'xp_multiplier' | 'coin_multiplier' | 'streak_shield'
- multiplier: NUMERIC(4,2)
- activated_at, expires_at: TIMESTAMPTZ
- is_consumed: BOOLEAN (for one-shot shields)
```

**Indexes**:
- `(user_id, expires_at)` WHERE is_consumed = false
- `(user_id, boost_type, expires_at)`

#### `login_calendar`
7-day reward cycle with escalating coin bonuses.

```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- login_date: DATE (UNIQUE per user)
- day_in_cycle: 1-7
- cycle_number: INTEGER (increments every 7 days)
- coins_awarded: INTEGER
- bonus_item_slug: TEXT (Day 7 bonus)
- claimed: BOOLEAN
```

**Reward Cycle**:
- Day 1: 10 coins
- Day 2: 15 coins
- Day 3: 20 coins
- Day 4: 30 coins
- Day 5: 40 coins
- Day 6: 50 coins
- Day 7: 100 coins + mystery bonus item (rotates per cycle)

#### `comeback_bonuses`
Win-back rewards for returning users.

```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- days_absent: INTEGER
- coins_awarded: INTEGER
- xp_awarded: INTEGER
- boost_hours: INTEGER (free XP boost duration)
- claimed_at: TIMESTAMPTZ
```

**Tiers**:
- 3+ days: 50 coins, 25 XP
- 5+ days: 100 coins, 50 XP, 1hr boost
- 7+ days: 200 coins, 100 XP, 2hr boost
- 14+ days: 500 coins, 250 XP, 4hr boost

---

## Shop Catalog

**26 items** across 5 categories, priced 25-10,000 coins:

### Badges (6 items)
Common-legendary cosmetic achievements.
- First Step (🐣, 25 coins, level 1, common)
- Early Bird (🌅, 50 coins, level 3, common)
- Iron Will (🏋️, 100 coins, level 5, common)
- Week Warrior (🔥, 150 coins, level 5, rare)
- Fashionista (👗, 200 coins, level 10, rare)
- Centurion (👑, 2000 coins, level 30, legendary)

### Avatars (5 items)
Profile border decorations.
- Flame Ring (🔥, 200 coins, level 5, common)
- Neon Glow (💜, 500 coins, level 15, rare)
- Gold Frame (✨, 1500 coins, level 30, epic)
- Diamond Frame (💎, 5000 coins, level 50, legendary)
- Hologram (🌈, 8000 coins, level 75, legendary)

### Themes (5 items, + 1 free default)
Full UI color schemes.
- **Default** (violet, free)
- Midnight (🌑, blue, 300 coins, level 5, common)
- Forest (🌲, green, 300 coins, level 5, common)
- Sunset (🌅, orange, 500 coins, level 10, rare)
- Cyberpunk (🌆, neon purple, 1000 coins, level 20, epic)
- Aurora (🌌, teal, 3000 coins, level 40, legendary)

Each theme has 15 color properties (see `src/lib/constants/themes.ts`).

### Titles (5 items)
Display titles on profile.
- "The Grinder" (⚙️, 100 coins, level 5, common)
- "Beast Mode" (🦁, 300 coins, level 15, rare)
- "Drip Lord" (💧, 500 coins, level 20, rare)
- "Zen Master" (🧘, 500 coins, level 20, rare)
- "Living Legend" (🏆, 10,000 coins, level 100, legendary)

### Boosts (5 items)
Consumable power-ups.
- XP Surge (⚡, 1.5× XP for 1hr, 150 coins, level 5, common)
- XP Blitz (🔋, 1.25× XP for 24hr, 400 coins, level 10, rare)
- Gold Rush (🪙, 2× coins for 1hr, 200 coins, level 10, common)
- Streak Shield (🛡️, protect streak for 1 miss, 750 coins, level 15, epic)
- Double XP Weekend (🎆, 2× XP for 48hr, 2000 coins, level 25, epic, limited)

---

## Service Layer

### `boost.service.ts`
- `activateBoost(userId, rewardId, effects)` — Creates active_boosts row, calculates expiry
- `getActiveBoosts(userId)` — Returns all active non-expired boosts with minutesRemaining
- `getXPMultiplier(userId)` — Returns highest active XP multiplier (called by XP engine)
- `getCoinMultiplier(userId)` — Returns highest active coin multiplier
- `consumeStreakShield(userId)` — Marks oldest shield as consumed
- `hasStreakShield(userId)` — Checks if user has active shield

### `retention.service.ts`
- `getLoginCalendar(userId)` — Returns 7-day cycle state with streak count
- `claimDailyLogin(userId)` — Awards coins + optional Day 7 bonus item
- `recordLogin(userId)` — Logs today's login (call on app load)
- `checkComebackBonus(userId)` — Checks if user qualifies for comeback reward
- `claimComebackBonus(userId)` — Awards coins, XP, and optional boost

### `cosmetic.service.ts`
- `equipItem(userId, itemId)` — Equips item, unequips others in same category
- `unequipItem(userId, itemId)` — Unequips item
- `getEquippedCosmetics(userId)` — Returns equipped loadout (badge, avatar, theme, title)
- `setActiveTheme(userId, themeSlug)` — Updates users.theme column
- `getUnlockedThemes(userId)` — Returns array of theme slugs

---

## API Routes

All routes require authentication (`createServerClient()`).

### `/api/shop/items` (GET)
Query params: `?category=boost` (optional)
Returns: Array of `UserInventoryItem` with `owned` and `equipped` flags

### `/api/shop/purchase` (POST)
Body: `{ itemSlug: string }`
Validates: level requirement, coin balance, stock (limited editions)
Returns: `{ success, message, newBalance, item }`

### `/api/shop/equip` (POST)
Body: `{ itemId: string, action: 'equip' | 'unequip' }`
Updates: `user_rewards.is_equipped`

### `/api/shop/activate-boost` (POST)
Body: `{ rewardId: string }`
Creates: `active_boosts` row, deletes from `user_rewards` (consumable)
Returns: `{ success, boost, message }`

### `/api/shop/theme` (POST/GET)
POST body: `{ themeSlug: string }`
GET returns: `{ theme: string }`

### `/api/shop/themes` (GET)
Returns: `{ themes: string[] }` (unlocked theme slugs, includes 'default')

### `/api/shop/daily-login` (GET/POST)
GET returns: `{ state: LoginCalendarState }`
POST claims today's reward, returns: `{ success, coins, bonusItem, message }`

### `/api/shop/cosmetics` (GET)
Returns: `{ cosmetics: EquippedCosmetics }`

### `/api/shop/boosts` (GET)
Returns: `{ boosts: ActiveBoost[] }`

### `/api/shop/comeback` (GET/POST)
GET checks eligibility: `{ available, bonus }`
POST claims: `{ success, bonus, message }`

---

## UI Components

### `src/app/shop/page.tsx`
Main shop page with:
- Category tabs (5 categories)
- Item grid (responsive 1-2 columns)
- Active boost timer display
- Daily login calendar (when category=boost)
- Coin balance header

### `src/components/shop/ShopItemCard.tsx`
Displays:
- Icon (text emoji)
- Name, description
- Rarity border + badge (common/rare/epic/legendary)
- Effects (for boosts: multiplier + duration)
- Level requirement
- Purchase button (coin cost) OR equip/activate button if owned

### `src/components/shop/BoostTimer.tsx`
Real-time countdown with:
- Icon + label (e.g., "2× XP")
- Time remaining (hours + minutes)
- Progress bar (visual decay)

### `src/components/shop/DailyLoginCalendar.tsx`
7-day reward grid:
- Visual cycle (Day 1-7 with coin amounts)
- Claimed checkmarks
- Claim button (visible if not claimed today)
- Next reward preview
- Streak counter

### `src/components/providers/ThemeProvider.tsx`
React context provider:
- Reads from localStorage first (instant paint)
- Syncs with server on mount (`/api/shop/theme`, `/api/shop/themes`)
- `setTheme(slug)` persists to localStorage + POST to server
- Injects CSS variables (`--color-bg`, `--color-accent`, etc.) via inline style
- Exposes: `{ theme, themeSlug, setTheme, unlockedThemes }`

---

## XP Engine Integration

**XP Multiplier** (in `grantXP()` function):
```typescript
// Step 5B: Fetch active boost multiplier
const boostMultiplier = await getXPMultiplier(userId);
const combinedMultiplier = streakMultiplier * boostMultiplier;
let rawXP = (baseXP + bonusXP) * combinedMultiplier;
```

**Coin Multiplier**:
```typescript
// Step 8: Apply coin boost when converting XP to coins
const coinMultiplier = await getCoinMultiplier(userId);
const coinsEarned = floor((finalXP / COINS_PER_XP) * coinMultiplier);
```

Boosts stack multiplicatively: 1.5× streak + 2× boost = 3× total.

---

## Retention Mechanics

### Daily Login (7-day cycle)
**Goal**: Drive daily habit formation

**Flow**:
1. User opens app → `recordLogin(userId)` called
2. Shop page displays calendar with current cycle position
3. User taps "Claim" → awards coins, marks as claimed
4. Day 7 grants 100 coins + bonus item (rotates: XP boost, coin boost, streak shield)
5. After Day 7, cycle resets to Day 1

**Streak behavior**:
- Miss 1 day → streak breaks, cycle resets to Day 1
- Consecutive days → progress through cycle
- Visual feedback: 🔥 streak counter, checkmarks on claimed days

### Comeback Bonus
**Goal**: Re-engage lapsed users

**Flow**:
1. User returns after 3+ days absence
2. On app load, check `checkComebackBonus(userId)`
3. If eligible, show modal: "Welcome back! Here's a gift."
4. Award coins, XP, and optional free boost
5. Record in `comeback_bonuses` table (prevent double-claim)

**Tiers scale with absence** (caps at 14 days to prevent exploitation).

### Psychological Hooks
- **Loss aversion**: Streak shields protect investment
- **Escalating commitment**: Day 7 bonus incentivizes completing full cycle
- **Sunk cost**: Users who buy boosts are more likely to return to use them
- **Visual progress**: Rarity tiers (common→legendary) create aspirational goals
- **Social proof**: Titles + badges signal status
- **Novelty**: Theme variety keeps UI fresh

---

## Coin Economy

**Income**:
- Base XP actions: ~64 coins/day (320 XP ÷ 5)
- Level-up bonus: 25× new level (e.g., level 10 → 250 coins)
- Streak milestones: 25-10,000 coins (3d-365d streaks)
- Daily login: 10-100 coins/day (cycle-dependent)
- Comeback bonuses: 50-500 coins

**Sink**:
- Cosmetics: 25-10,000 coins (one-time purchases)
- Boosts: 150-2,000 coins (consumable, repeatable)

**Balance**:
- Early game (levels 1-10): Focus on common items (25-300 coins)
- Mid game (levels 10-30): Save for rare/epic themes (500-1500 coins)
- Late game (levels 30+): Grind for legendary items (3000-10,000 coins)

**Monetization potential** (future):
- Premium themes (e.g., seasonal events)
- Coin packs (IAP)
- Ad-based coin bonuses

---

## Theme System

**Default Theme** (free, violet):
- Accent: `#7c3aed` (violet-600)
- BG: `#0a0a0a` (near-black)
- Text: `#e2e8f0` (slate-200)

**All themes** define 15 color properties:
- `bg`, `bgSecondary`, `bgTertiary`
- `accent`, `accentHover`, `accentMuted`
- `text`, `textSecondary`, `textMuted`
- `border`
- `success`, `warning`, `error`
- `xpBar`, `xpBarEnd` (gradient colors)

**Theme application**:
1. User switches theme → `setTheme(slug)` called
2. Persists to localStorage (`levelup-theme`)
3. Persists to server (`users.theme` column)
4. `ThemeProvider` injects CSS vars into `:root`
5. All components read `var(--color-accent)` etc.

**No theme flash**: localStorage read happens before first paint.

---

## Files Created (This Turn)

### Migrations
- `supabase/migrations/007_economy_v2.sql` — Tables, functions, seed data

### Types
- `src/types/economy.ts` — BoostType, ActiveBoost, LoginCalendarState, ComebackBonus, ThemeDefinition, EquippedCosmetics, RetentionEvent

### Constants
- `src/lib/constants/themes.ts` — 6 theme definitions with full color systems

### Services
- `src/lib/services/boost.service.ts` — Activate/query power-ups
- `src/lib/services/retention.service.ts` — Daily login, comeback logic
- `src/lib/services/cosmetic.service.ts` — Equip/unequip, theme switching

### API Routes
- `src/app/api/shop/equip/route.ts`
- `src/app/api/shop/activate-boost/route.ts`
- `src/app/api/shop/theme/route.ts`
- `src/app/api/shop/themes/route.ts`
- `src/app/api/shop/daily-login/route.ts`
- `src/app/api/shop/cosmetics/route.ts`
- `src/app/api/shop/boosts/route.ts`
- `src/app/api/shop/comeback/route.ts`

### UI Components
- `src/app/shop/page.tsx` — Main shop page
- `src/components/shop/ShopItemCard.tsx` — Item display card
- `src/components/shop/BoostTimer.tsx` — Active boost countdown
- `src/components/shop/DailyLoginCalendar.tsx` — 7-day reward grid
- `src/components/providers/ThemeProvider.tsx` — Theme context + CSS vars

### XP Engine Integration
- Modified `src/lib/xp/engine.ts` to fetch and apply boost multipliers

### Layout Integration
- Modified `src/app/layout.tsx` to wrap with `ThemeProvider`

---

## Next Steps (Future Work)

1. **Run migration** on Supabase database:
   ```sql
   -- Execute supabase/migrations/007_economy_v2.sql
   ```

2. **Test shop flow**:
   - Navigate to `/shop`
   - Purchase items across all categories
   - Equip/unequip cosmetics
   - Activate boosts
   - Claim daily login rewards

3. **Add streak shield logic** to streak decay system (morning cron job)

4. **Wire comeback bonus check** into app load lifecycle (e.g., dashboard `useEffect`)

5. **Add visual polish**:
   - Shimmer effect on shop cards (already in CSS)
   - Confetti animation on purchases
   - Theme transition animations

6. **Analytics events**:
   - Track purchase conversions per item
   - Daily login claim rate
   - Comeback bonus redemption rate
   - Boost activation frequency

7. **Monetization layer**:
   - Premium currency (gems)
   - IAP coin packs
   - Seasonal/event-exclusive items

8. **Social features**:
   - Leaderboards with equipped cosmetics
   - Gift items to friends
   - Referral bonus coins

---

## Troubleshooting

**Boost not applying?**
- Check `active_boosts` table for expired/consumed rows
- Verify `getXPMultiplier()` is called in `grantXP()`
- Confirm boost activation deletes from `user_rewards` (consumable)

**Theme not changing?**
- Check localStorage: `levelup-theme`, `levelup-unlocked-themes`
- Verify `users.theme` column updated
- Inspect CSS vars in DevTools → `:root` element
- Clear browser cache (service worker may cache old CSS)

**Daily login not resetting?**
- Check `login_calendar.login_date` matches `CURRENT_DATE` in UTC
- Verify `claimed` flag is false for today
- Ensure `day_in_cycle` increments correctly (1-7)

**Coin balance not updating?**
- Check `xp_transactions.coins_earned` column
- Verify `users.coins` updated via `increment_coins()` RPC
- Confirm boost multiplier applied via `getCoinMultiplier()`

---

## Performance Notes

- **Boost queries**: Indexed on `(user_id, expires_at)` for fast lookups
- **Login calendar**: Indexed on `(user_id, login_date DESC)` for streak calculation
- **Theme CSS vars**: Injected via inline style (no FOUC, no extra network request)
- **Shop items**: Seeded with `ON CONFLICT DO NOTHING` (idempotent, safe to re-run)

**Database function caching**:
- `get_active_boost_multiplier()`: STABLE (can cache within transaction)
- `get_equipped_cosmetics()`: STABLE (read-only)

**API route optimization**:
- `getActiveBoosts()` filters expired boosts server-side
- `getUnlockedThemes()` always includes 'default' (no DB query for free theme)

---

## Security

**RLS Policies**:
- All tables: User can only read/write their own rows
- `active_boosts`: Self insert/read (admin can delete via service)
- `login_calendar`: Self read/insert/update
- `comeback_bonuses`: Self read (insert via service only)

**Input Validation**:
- Purchase route checks level requirement, coin balance, stock
- Equip route verifies ownership before updating `is_equipped`
- Boost activation validates category = 'boost' before creating active_boosts row

**Anti-Exploit**:
- Cooldowns prevent spam (enforced in `grantXP()`)
- Daily caps limit XP farming
- Comeback bonus claims recorded (prevents double-claim)
- Consumable boosts deleted from inventory after activation

---

End of Economy System Documentation.
