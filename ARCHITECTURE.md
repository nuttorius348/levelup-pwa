# 🏗️ LevelUp — Gamified Productivity PWA Architecture

## Overview

**LevelUp** is a gamified iPhone PWA that combines daily routines, fitness, style, and motivation into a single XP-driven experience. Users earn XP for completing tasks, level up, earn in-app currency, and unlock rewards.

---

## 1. Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no layout chrome)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts     # Supabase OAuth callback
│   ├── (app)/                    # Authenticated app shell
│   │   ├── layout.tsx            # Bottom nav, XP bar, notifications
│   │   ├── dashboard/page.tsx    # Home / daily overview
│   │   ├── routines/
│   │   │   ├── page.tsx          # Routine checklist
│   │   │   └── [id]/page.tsx     # Single routine detail
│   │   ├── calendar/
│   │   │   └── page.tsx          # Calendar view
│   │   ├── workouts/
│   │   │   ├── page.tsx          # Workout list
│   │   │   ├── [id]/page.tsx     # Workout detail + tutorial
│   │   │   └── log/page.tsx      # Workout logger
│   │   ├── stretch/
│   │   │   └── page.tsx          # Morning stretch tutorials
│   │   ├── outfit/
│   │   │   └── page.tsx          # Outfit rater (AI image)
│   │   ├── quotes/
│   │   │   └── page.tsx          # Motivational quotes
│   │   ├── shop/
│   │   │   ├── page.tsx          # In-app shop
│   │   │   └── [itemId]/page.tsx # Shop item detail
│   │   ├── profile/
│   │   │   ├── page.tsx          # Profile + stats + level
│   │   │   └── settings/page.tsx # User settings
│   │   └── leaderboard/
│   │       └── page.tsx          # Social leaderboard
│   ├── api/                      # API routes
│   │   ├── ai/
│   │   │   ├── outfit-rate/route.ts
│   │   │   ├── quote/route.ts
│   │   │   └── coach/route.ts    # AI coaching endpoint
│   │   ├── xp/
│   │   │   ├── grant/route.ts
│   │   │   └── leaderboard/route.ts
│   │   ├── shop/
│   │   │   ├── items/route.ts
│   │   │   └── purchase/route.ts
│   │   ├── routines/
│   │   │   ├── route.ts          # CRUD routines
│   │   │   └── complete/route.ts
│   │   ├── workouts/
│   │   │   ├── route.ts
│   │   │   └── log/route.ts
│   │   ├── calendar/
│   │   │   └── route.ts
│   │   ├── notifications/
│   │   │   ├── subscribe/route.ts
│   │   │   └── send/route.ts
│   │   ├── upload/
│   │   │   └── route.ts          # Image upload (outfit)
│   │   └── cron/
│   │       ├── daily-reset/route.ts
│   │       └── streak-check/route.ts
│   ├── manifest.ts               # PWA manifest (dynamic)
│   ├── sw.ts                     # Service worker entry
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Tailwind base
│   └── not-found.tsx
├── components/
│   ├── ui/                       # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Toast.tsx
│   │   └── Skeleton.tsx
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   ├── XPBar.tsx
│   │   ├── Header.tsx
│   │   └── InstallPrompt.tsx     # PWA install banner
│   ├── features/
│   │   ├── routines/
│   │   │   ├── RoutineList.tsx
│   │   │   ├── RoutineItem.tsx
│   │   │   └── RoutineForm.tsx
│   │   ├── workouts/
│   │   │   ├── WorkoutCard.tsx
│   │   │   ├── WorkoutLogger.tsx
│   │   │   ├── ExerciseTimer.tsx
│   │   │   └── TutorialPlayer.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarGrid.tsx
│   │   │   └── DayDetail.tsx
│   │   ├── outfit/
│   │   │   ├── OutfitUploader.tsx
│   │   │   └── RatingDisplay.tsx
│   │   ├── stretch/
│   │   │   ├── StretchRoutine.tsx
│   │   │   └── StretchTimer.tsx
│   │   ├── quotes/
│   │   │   └── QuoteCard.tsx
│   │   ├── shop/
│   │   │   ├── ShopGrid.tsx
│   │   │   ├── ShopItem.tsx
│   │   │   └── PurchaseModal.tsx
│   │   ├── gamification/
│   │   │   ├── LevelUpModal.tsx
│   │   │   ├── XPPopup.tsx
│   │   │   ├── StreakFire.tsx
│   │   │   ├── AchievementUnlock.tsx
│   │   │   └── DailyReward.tsx
│   │   └── profile/
│   │       ├── StatsGrid.tsx
│   │       ├── AchievementList.tsx
│   │       └── LevelBadge.tsx
│   └── providers/
│       ├── SupabaseProvider.tsx
│       ├── XPProvider.tsx         # Global XP state
│       ├── ThemeProvider.tsx
│       └── NotificationProvider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (RSC/route)
│   │   ├── admin.ts              # Service-role client
│   │   └── middleware.ts         # Auth session refresh
│   ├── ai/
│   │   ├── provider.ts           # Abstract AI provider interface
│   │   ├── openai.ts             # OpenAI adapter
│   │   ├── claude.ts             # Claude adapter
│   │   ├── gemini.ts             # Gemini adapter
│   │   ├── router.ts             # Task → provider routing
│   │   └── prompts/
│   │       ├── outfit-rating.ts
│   │       ├── motivational-quote.ts
│   │       └── workout-coach.ts
│   ├── xp/
│   │   ├── engine.ts             # Core XP calculation
│   │   ├── levels.ts             # Level thresholds & rewards
│   │   ├── actions.ts            # XP action definitions
│   │   └── streaks.ts            # Streak multiplier logic
│   ├── notifications/
│   │   ├── web-push.ts           # Web Push API wrapper
│   │   └── scheduler.ts          # Notification scheduling
│   ├── shop/
│   │   ├── items.ts              # Shop catalog
│   │   └── transactions.ts       # Purchase logic
│   ├── validators/
│   │   ├── routines.ts           # Zod schemas
│   │   ├── workouts.ts
│   │   ├── shop.ts
│   │   └── common.ts
│   ├── utils/
│   │   ├── dates.ts
│   │   ├── format.ts
│   │   └── rate-limit.ts
│   └── constants/
│       ├── xp.ts                 # XP values, level caps
│       ├── shop.ts               # Item categories
│       └── achievements.ts       # Achievement definitions
├── hooks/
│   ├── useXP.ts
│   ├── useLevel.ts
│   ├── useRoutines.ts
│   ├── useWorkouts.ts
│   ├── useNotifications.ts
│   ├── useInstallPrompt.ts
│   └── useAI.ts
├── types/
│   ├── database.ts               # Generated Supabase types
│   ├── xp.ts
│   ├── ai.ts
│   ├── shop.ts
│   ├── routines.ts
│   ├── workouts.ts
│   └── index.ts
├── middleware.ts                  # Next.js middleware (auth gate)
└── public/
    ├── icons/                    # PWA icons (192, 512, maskable)
    ├── sw.js                     # Compiled service worker
    └── screenshots/              # PWA install screenshots
```

---

## 2. Database Schema

See `supabase/migrations/001_initial_schema.sql` for full SQL.

### Core Tables
- **profiles** — user profile, level, XP, coins, streak
- **routines** / **routine_completions** — daily checklists
- **workouts** / **workout_logs** / **workout_exercises** — fitness tracking
- **calendar_events** — unified calendar
- **outfit_ratings** — AI outfit analysis results
- **quotes** — generated motivational quotes
- **shop_items** / **user_purchases** / **user_inventory** — economy
- **xp_ledger** — immutable XP audit trail
- **achievements** / **user_achievements** — achievement system
- **push_subscriptions** — Web Push endpoints
- **stretch_sessions** — morning stretch tracking

### Key Design Decisions
- **XP ledger is append-only** — never mutate, only insert. Profile XP is a materialized aggregate.
- **RLS everywhere** — every table has row-level security. Users can only read/write their own data.
- **Soft deletes** — `deleted_at` timestamp instead of hard deletes.
- **UTC timestamps** — all server-side timestamps in UTC; client converts for display.

---

## 3. XP Economy

### Actions & Values
| Action | Base XP | Streak Multiplier | Daily Cap |
|---|---|---|---|
| Complete routine item | 10 | ×1.0 – ×2.0 | 200 |
| Complete full routine | 50 (bonus) | ×1.0 – ×2.0 | 100 |
| Log workout | 30 | ×1.0 – ×2.0 | 150 |
| Complete stretch session | 20 | ×1.0 – ×2.0 | 60 |
| Rate outfit | 15 | — | 30 |
| Generate quote | 5 | — | 25 |
| Daily login | 25 | ×1.0 – ×3.0 | 25 |
| 7-day streak bonus | 100 | — | 100 |
| Achievement unlock | varies | — | — |

### Level Curve
```
XP_required(level) = floor(100 × level^1.5)
```
Level 1→2: 100 XP | Level 10→11: 3,162 XP | Level 50→51: 35,355 XP

### Streak Multiplier
```
multiplier = min(1 + (streak_days × 0.1), 2.0)   // caps at 2×
login_multiplier = min(1 + (streak_days × 0.1), 3.0) // caps at 3× for login
```

### Currency (Coins)
- Earn 1 coin per 10 XP gained
- Level-up bonus: `level × 10` coins
- Coins spent in shop on cosmetics, themes, avatar items

---

## 4. API Routes

### Authentication
- `POST /api/auth/callback` — Supabase OAuth callback
- Supabase handles signup/login/magic-link directly

### Routines
- `GET    /api/routines` — list user routines
- `POST   /api/routines` — create routine
- `PATCH  /api/routines/:id` — update routine
- `DELETE /api/routines/:id` — soft delete
- `POST   /api/routines/complete` — mark item complete → triggers XP

### Workouts
- `GET    /api/workouts` — list workouts
- `POST   /api/workouts/log` — log workout session → triggers XP

### Calendar
- `GET    /api/calendar?month=YYYY-MM` — events for month
- `POST   /api/calendar` — create event

### AI
- `POST   /api/ai/outfit-rate` — upload image → AI rating
- `POST   /api/ai/quote` — generate motivational quote
- `POST   /api/ai/coach` — AI workout/routine coaching

### XP
- `POST   /api/xp/grant` — internal: grant XP (server-validated)
- `GET    /api/xp/leaderboard` — top users

### Shop
- `GET    /api/shop/items` — list shop items
- `POST   /api/shop/purchase` — buy item with coins

### Notifications
- `POST   /api/notifications/subscribe` — save push subscription
- `POST   /api/notifications/send` — trigger push (admin/cron)

### Cron (Vercel Cron / Supabase Edge Functions)
- `POST   /api/cron/daily-reset` — reset daily caps, check streaks
- `POST   /api/cron/streak-check` — break streaks for inactive users

---

## 5. AI Abstraction Layer

```
               ┌─────────────┐
   API Route → │  AI Router   │ → selects provider based on task
               └──────┬──────┘
          ┌───────────┼───────────┐
          ▼           ▼           ▼
     ┌─────────┐ ┌─────────┐ ┌─────────┐
     │ OpenAI  │ │ Claude  │ │ Gemini  │
     │ Adapter │ │ Adapter │ │ Adapter │
     └─────────┘ └─────────┘ └─────────┘
```

### Provider Interface
All adapters implement `AIProvider`:
```ts
interface AIProvider {
  generateText(prompt: string, opts?: AIOptions): Promise<AITextResponse>
  analyzeImage(image: Buffer, prompt: string, opts?: AIOptions): Promise<AIImageResponse>
  streamText(prompt: string, opts?: AIOptions): AsyncIterable<string>
}
```

### Task Routing
| Task | Primary Provider | Fallback |
|---|---|---|
| Outfit rating (image) | GPT-4o (vision) | Gemini Pro Vision |
| Motivational quotes | Claude | GPT-4o |
| Workout coaching | GPT-4o | Claude |

### Resilience
- Automatic fallback on provider failure (circuit breaker)
- Response caching (quotes cached 1hr, outfit ratings cached per image hash)
- Rate limiting per user per endpoint
- Cost tracking per request (logged to `ai_usage` table)

---

## 6. Security

### Authentication & Authorization
- Supabase Auth with RLS on every table
- Next.js middleware validates session on every `/(app)` route
- API routes verify JWT via `supabase.auth.getUser()`
- CSRF protection via `SameSite=Lax` cookies

### API Security
- Zod validation on ALL inputs (body, params, query)
- Rate limiting: sliding window per user (Redis or in-memory)
- API routes return minimal error info in production
- Cron endpoints protected by `CRON_SECRET` header

### Data Security
- Image uploads: validated MIME type, max 5MB, stored in Supabase Storage with signed URLs
- AI prompts: no user PII sent to AI providers — only anonymized content
- Environment variables: all secrets in `.env.local`, never bundled client-side
- `NEXT_PUBLIC_` prefix only for truly public values (Supabase anon key, app URL)

### PWA Security
- Service worker scope locked to `/`
- CSP headers block inline scripts, restrict origins
- HTTPS enforced (required for service workers and push)

---

## 7. PWA Configuration

### manifest.ts (Dynamic Web Manifest)
- `display: "standalone"` for native feel
- `theme_color` / `background_color` match app theme
- Icons: 192×192, 512×512, maskable variants
- `screenshots` for iOS install UX
- `shortcuts` for quick actions (Log Workout, Check Routines)

### Service Worker Strategy
- **Precache**: app shell, critical CSS, fonts
- **Runtime cache**: API responses (stale-while-revalidate)
- **Offline**: show cached dashboard + queue actions for sync
- **Background sync**: replay failed XP grants, workout logs when back online

### iOS Web Push (Safari 16.4+)
- Uses standard Push API + Notification API
- Requires user to "Add to Home Screen" first
- Push subscription stored in `push_subscriptions` table
- VAPID keys for authentication

### Widgets
- iOS widgets via Shortcuts + Web Clips (limited)
- Alternative: provide Lock Screen widget data via API endpoint that returns widget-formatted JSON
- Future: leverage WidgetKit if Apple opens PWA widget support

---

## Infrastructure

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel      │────▶│   Supabase    │────▶│  Supabase     │
│  (Next.js)    │     │  (Auth + DB)  │     │  Storage      │
│               │     │  (Realtime)   │     │  (Images)     │
└───────┬──────┘     └──────────────┘     └──────────────┘
        │
        ├──────▶ OpenAI API
        ├──────▶ Anthropic API
        └──────▶ Google AI API
```

- **Hosting**: Vercel (Edge + Serverless)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage (outfit images)
- **Auth**: Supabase Auth (email/password + Apple Sign-In)
- **Push**: Web Push via VAPID (self-hosted or Supabase Edge Function)
- **Cron**: Vercel Cron Jobs
