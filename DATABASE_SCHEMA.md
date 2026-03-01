# Database Schema Documentation

## Overview
Complete PostgreSQL schema for LevelUp gamified productivity PWA with 11 core tables, comprehensive indexes, foreign keys, and RLS policies.

---

## Core Tables

### 1. **users** (Profiles)
Primary user account table with gamification stats.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, FK → auth.users | User identifier |
| username | TEXT | UNIQUE | Unique username |
| display_name | TEXT | | Display name |
| avatar_url | TEXT | | Profile avatar URL |
| level | INTEGER | DEFAULT 1 | Current level |
| total_xp | BIGINT | DEFAULT 0 | Lifetime XP earned |
| current_level_xp | BIGINT | DEFAULT 0 | XP within current level |
| coins | BIGINT | DEFAULT 0 | In-app currency |
| streak_days | INTEGER | DEFAULT 0 | Current streak |
| longest_streak | INTEGER | DEFAULT 0 | Best streak record |
| last_active_date | DATE | | Last activity date |
| timezone | TEXT | DEFAULT 'America/New_York' | User timezone |
| theme | TEXT | DEFAULT 'default' | UI theme |
| notifications_enabled | BOOLEAN | DEFAULT false | Push notifications |
| onboarding_completed | BOOLEAN | DEFAULT false | Onboarding status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Account creation |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_users_username` (username)
- `idx_users_level` (level)
- `idx_users_total_xp` (total_xp DESC)
- `idx_users_last_active` (last_active_date)

**Triggers:**
- Auto-create on auth signup
- Auto-update `updated_at`

---

### 2. **routines**
User-defined daily/recurring routines.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Routine ID |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | Routine owner |
| title | TEXT | NOT NULL | Routine name |
| description | TEXT | | Routine description |
| icon | TEXT | DEFAULT '📋' | Display icon |
| color | TEXT | DEFAULT '#4C6EF5' | UI color |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| is_active | BOOLEAN | DEFAULT true | Active status |
| recurrence | JSONB | DEFAULT '{"type": "daily"}' | Recurrence rule |
| xp_reward | INTEGER | DEFAULT 50 | XP on completion |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Created date |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |
| deleted_at | TIMESTAMPTZ | | Soft delete |

**Indexes:**
- `idx_routines_user` (user_id) WHERE deleted_at IS NULL
- `idx_routines_active` (is_active, user_id)

---

### 3. **routine_completions**
Tracks daily routine completion with XP.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Completion ID |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User who completed |
| routine_id | UUID | FK → routines(id) ON DELETE CASCADE | Completed routine |
| completed_date | DATE | DEFAULT CURRENT_DATE | Date completed |
| xp_earned | INTEGER | DEFAULT 0 | XP awarded |
| streak_multiplier | NUMERIC(4,2) | DEFAULT 1.0 | Streak bonus |
| metadata | JSONB | DEFAULT '{}' | Extra context |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Completion timestamp |

**Constraints:**
- UNIQUE(user_id, routine_id, completed_date)

**Indexes:**
- `idx_routine_completions_user_date` (user_id, completed_date DESC)
- `idx_routine_completions_routine` (routine_id, completed_date DESC)

---

### 4. **workouts**
Workout templates (user-created or system).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Workout ID |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | Creator |
| title | TEXT | NOT NULL | Workout name |
| description | TEXT | | Description |
| category | TEXT | CHECK IN (...) | strength, cardio, flexibility, etc. |
| difficulty | TEXT | CHECK IN (...) | beginner, intermediate, advanced |
| estimated_minutes | INTEGER | | Estimated duration |
| tutorial_url | TEXT | | Video tutorial link |
| thumbnail_url | TEXT | | Preview image |
| exercises | JSONB | DEFAULT '[]' | Exercise definitions |
| is_template | BOOLEAN | DEFAULT true | Template vs instance |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Created date |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_workouts_user` (user_id)
- `idx_workouts_category` (category)
- `idx_workouts_difficulty` (difficulty)

---

### 5. **workout_logs**
Completed workout sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Log ID |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User |
| workout_id | UUID | FK → workouts(id) ON DELETE SET NULL | Template reference |
| title | TEXT | NOT NULL | Session name |
| duration_minutes | INTEGER | | Actual duration |
| calories_estimated | INTEGER | | Calories burned |
| exercises_completed | JSONB | DEFAULT '[]' | Exercise results |
| notes | TEXT | | User notes |
| mood_before | INTEGER | CHECK 1-5 | Mood before |
| mood_after | INTEGER | CHECK 1-5 | Mood after |
| xp_earned | INTEGER | DEFAULT 0 | XP awarded |
| streak_multiplier | NUMERIC(4,2) | DEFAULT 1.0 | Streak bonus |
| completed_at | TIMESTAMPTZ | DEFAULT NOW() | Completion time |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Log created |

**Indexes:**
- `idx_workout_logs_user_date` (user_id, completed_at DESC)
- `idx_workout_logs_workout` (workout_id)

---

### 6. **stretch_sessions**
Morning stretch completions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Session ID |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User |
| title | TEXT | NOT NULL | Session name |
| duration_minutes | INTEGER | NOT NULL | Duration |
| difficulty | TEXT | CHECK IN (...) | Difficulty level |
| body_focus | TEXT[] | | Target areas |
| steps_completed | INTEGER | DEFAULT 0 | Steps done |
| total_steps | INTEGER | DEFAULT 0 | Total steps |
| xp_earned | INTEGER | DEFAULT 0 | XP awarded |
| completed_at | TIMESTAMPTZ | DEFAULT NOW() | Completion time |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Log created |

**Indexes:**
- `idx_stretch_sessions_user_date` (user_id, completed_at DESC)

---

### 7. **outfit_ratings**
AI outfit analysis results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Rating ID |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User |
| image_url | TEXT | NOT NULL | Outfit image |
| ai_provider | TEXT | NOT NULL | AI provider used |
| rating_score | INTEGER | CHECK 1-10 | Overall score |
| feedback_text | TEXT | | AI feedback |
| suggestions | TEXT[] | | Improvement tips |
| style_tags | TEXT[] | | Style categories |
| xp_earned | INTEGER | DEFAULT 0 | XP awarded |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Rating time |

**Indexes:**
- `idx_outfit_ratings_user_date` (user_id, created_at DESC)
- `idx_outfit_ratings_score` (rating_score)

---

### 8. **xp_transactions**
Append-only XP ledger.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Transaction ID |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User |
| action | xp_action_type | ENUM | Action type |
| base_xp | INTEGER | NOT NULL | Base XP amount |
| multiplier | NUMERIC(4,2) | DEFAULT 1.0 | Streak/other multiplier |
| final_xp | INTEGER | NOT NULL | Actual XP granted |
| coins_earned | INTEGER | DEFAULT 0 | Coins awarded |
| source_id | UUID | | Source entity ID |
| metadata | JSONB | DEFAULT '{}' | Extra context |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Transaction time |

**Action Types ENUM:**
- `routine_complete`
- `workout_logged`
- `stretch_complete`
- `outfit_rated`
- `quote_generated`
- `daily_login`
- `streak_bonus`
- `achievement_unlock`
- `level_up_bonus`
- `admin_grant`
- `admin_deduct`

**Indexes:**
- `idx_xp_transactions_user_date` (user_id, created_at DESC)
- `idx_xp_transactions_action` (action)
- `idx_xp_transactions_source` (source_id) WHERE source_id IS NOT NULL

---

### 9. **levels**
Pre-computed level thresholds (1-100).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| level | INTEGER | PRIMARY KEY | Level number |
| xp_required | BIGINT | NOT NULL | Cumulative XP |
| xp_to_next | BIGINT | | XP to next level |
| title | TEXT | | Level title |
| icon | TEXT | | Level icon |
| coin_reward | INTEGER | DEFAULT 0 | Level-up coin bonus |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Created |

**Pre-populated:** Levels 1-100 using formula `FLOOR(level^1.5 * 100)`

---

### 10. **rewards**
Shop items catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Item ID |
| name | TEXT | NOT NULL | Item name |
| description | TEXT | | Description |
| category | TEXT | CHECK IN (...) | avatar, theme, badge, title, boost, special |
| icon | TEXT | | Display icon |
| image_url | TEXT | | Preview image |
| cost_coins | INTEGER | NOT NULL | Coin price |
| cost_level | INTEGER | DEFAULT 1 | Level requirement |
| is_limited_edition | BOOLEAN | DEFAULT false | Limited item |
| stock_remaining | INTEGER | | Remaining stock (NULL = unlimited) |
| rarity | TEXT | CHECK IN (...) | common, rare, epic, legendary |
| effects | JSONB | DEFAULT '{}' | Item effects |
| is_active | BOOLEAN | DEFAULT true | Available for purchase |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Created |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes:**
- `idx_rewards_category` (category, is_active)
- `idx_rewards_cost` (cost_coins)
- `idx_rewards_rarity` (rarity)

**Related Table: user_rewards**
- Tracks purchases: user_id, reward_id, is_equipped, purchased_at

---

### 11. **calendar_events**
Unified calendar with events from all sources.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Event ID |
| user_id | UUID | FK → users(id) ON DELETE CASCADE | Event owner |
| title | TEXT | NOT NULL | Event name |
| description | TEXT | | Event details |
| event_type | TEXT | CHECK IN (...) | routine, workout, stretch, custom, reminder |
| source_id | UUID | | Links to source entity |
| start_at | TIMESTAMPTZ | NOT NULL | Start time |
| end_at | TIMESTAMPTZ | | End time |
| all_day | BOOLEAN | DEFAULT false | All-day event |
| recurrence_rule | TEXT | | iCal RRULE |
| color | TEXT | | Display color |
| reminder_minutes | INTEGER[] | | Reminder offsets |
| is_completed | BOOLEAN | DEFAULT false | Completion status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Created |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Updated |
| deleted_at | TIMESTAMPTZ | | Soft delete |

**Indexes:**
- `idx_calendar_user_range` (user_id, start_at, end_at) WHERE deleted_at IS NULL
- `idx_calendar_type` (event_type)
- `idx_calendar_source` (source_id) WHERE source_id IS NOT NULL

---

## Row Level Security (RLS)

All tables have RLS enabled with the following patterns:

### Public Read
- `users` - All profiles visible
- `levels` - All level data visible
- `rewards` - Active items visible

### Self-Only CRUD
- `routines` - Users manage their own
- `routine_completions` - Users log their own
- `workouts` - Users manage their own
- `workout_logs` - Users log their own
- `stretch_sessions` - Users log their own
- `outfit_ratings` - Users rate their own
- `user_rewards` - Users manage their inventory
- `calendar_events` - Users manage their events

### Read-Only (Server Writes)
- `xp_transactions` - Users read their own, server inserts via service role

---

## Helper Functions

### `xp_for_level(target_level INTEGER) → BIGINT`
Calculates XP required for a level using formula: `FLOOR(level^1.5 * 100)`

### `get_user_rank(p_user_id UUID) → INTEGER`
Returns user's global leaderboard rank by total_xp.

---

## Triggers

### Auto-Create User Profile
On `auth.users` INSERT → creates corresponding `users` row

### Auto-Update Timestamps
On UPDATE → sets `updated_at = NOW()` for:
- users
- routines
- workouts
- rewards
- calendar_events

---

## Performance Considerations

- **33 indexes** total across all tables
- Composite indexes on frequent query patterns (user_id + date)
- Partial indexes with WHERE clauses for filtered queries
- Covering indexes for leaderboard queries
- JSONB columns for flexible metadata (exercises, effects, metadata)

---

## XP Economy Flow

```
Action Performed
    ↓
Server validates via API route
    ↓
Insert into xp_transactions (ledger)
    ↓
Update users.total_xp, users.coins
    ↓
Check level threshold → update users.level
    ↓
Check achievements → unlock if met
    ↓
Return updated stats to client
```

---

## Foreign Key Cascade Rules

| Parent Table | Child Table | On Delete |
|--------------|-------------|-----------|
| users | All user data | CASCADE (delete all) |
| routines | routine_completions | CASCADE |
| workouts | workout_logs | SET NULL (keep log) |
| rewards | user_rewards | CASCADE |

---

## Data Types Used

- **UUID** - All primary keys, user IDs
- **TEXT** - Strings (no length limits)
- **INTEGER** - Counts, scores, durations
- **BIGINT** - XP, coins (large numbers)
- **NUMERIC(4,2)** - Multipliers (e.g., 1.50)
- **BOOLEAN** - Flags
- **TIMESTAMPTZ** - All timestamps (timezone-aware)
- **DATE** - Dates without time
- **JSONB** - Flexible structured data
- **TEXT[]** - String arrays
- **INTEGER[]** - Integer arrays
- **ENUM** - Constrained text values

---

## Migration Instructions

1. Create Supabase project
2. Run migration file: `001_initial_schema.sql`
3. Verify tables created: `SELECT * FROM pg_tables WHERE schemaname = 'public';`
4. Verify RLS policies: `SELECT * FROM pg_policies;`
5. Test level data populated: `SELECT COUNT(*) FROM levels;` (should be 100)

---

**Schema Version:** 1.0  
**Last Updated:** February 21, 2026  
**Total Tables:** 11 core + 2 junction tables  
**Total Indexes:** 33  
**Total RLS Policies:** 35+
