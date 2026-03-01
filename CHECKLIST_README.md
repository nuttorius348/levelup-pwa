# 📋 Daily Checklist Component

A production-ready, iPhone-first checklist component with XP gamification, streak tracking, and smooth animations.

## ✨ Features

- ✅ **Add/Complete Tasks** — Simple task management with smooth animations
- 🎯 **XP Integration** — Automatic XP awards (+20 XP per task)
- 🔥 **Streak Counter** — Visual streak tracking with multiplier badges
- 📊 **Progress Bar** — Real-time completion tracking with celebration on 100%
- 📱 **iPhone-First Design** — Optimized for mobile with touch-friendly controls
- 🌙 **Dark Mode** — Full dark mode support
- 🔄 **Daily Reset** — Tasks automatically reset at midnight
- 🎨 **Smooth Animations** — Framer Motion powered transitions
- 🔒 **Idempotency** — Prevents duplicate XP awards
- 💾 **Supabase Backend** — Real-time data persistence with RLS

## 📦 Installation

### 1. Install Dependencies

```bash
npm install framer-motion
# or
pnpm add framer-motion
```

### 2. Run Database Migration

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase/migrations/002_checklist_tasks.sql
```

The migration creates:
- `checklist_tasks` table
- Indexes for fast queries
- RLS policies for security
- Auto-cleanup function for old tasks

### 3. Add XP Action Type

The component uses the `routine_task` action type (already configured in your XP system):
- Base XP: **20 XP**  
- Cooldown: **None** (multiple tasks allowed)
- Daily Cap: **200 XP** (10 tasks max)

### 4. Update Constants (Optional)

To customize XP rewards, edit `src/lib/constants/xp.ts`:

```typescript
routine_task: {
  action: 'routine_task',
  baseXP: 20,          // ← Change base XP here
  cooldownMinutes: 0,   // No cooldown
  dailyCap: 200,        // Max 200 XP/day from tasks
  description: 'Complete a daily task',
},
```

## 🚀 Usage

### Basic Usage

```tsx
import { Checklist } from '@/components/checklist';

export default function MyPage() {
  const userId = 'user-id-from-auth';
  
  return <Checklist userId={userId} />;
}
```

### With XP Notifications

```tsx
'use client';

import { useState } from 'react';
import { Checklist } from '@/components/checklist';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChecklistPage() {
  const [notification, setNotification] = useState<{
    xp: number;
    coins: number;
  } | null>(null);

  const handleXPAwarded = (xp: number, coins: number) => {
    setNotification({ xp, coins });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div>
      {/* Floating XP Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="px-6 py-4 bg-yellow-400 text-white rounded-2xl shadow-2xl">
              +{notification.xp} XP · +{notification.coins} coins
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Checklist 
        userId="user-123" 
        onXPAwarded={handleXPAwarded} 
      />
    </div>
  );
}
```

### Integration with Auth

```tsx
import { createClient } from '@/lib/supabase/server';
import { Checklist } from '@/components/checklist';

export default async function ChecklistPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Please log in</div>;
  }

  return <Checklist userId={user.id} />;
}
```

## 🎨 Components

### `<Checklist />`
Main container component that manages state and API calls.

**Props:**
- `userId: string` — User ID from Supabase auth
- `onXPAwarded?: (xp: number, coins: number) => void` — Callback when XP is awarded

### `<TaskItem />`
Individual task row with checkbox, title, and delete button.

**Features:**
- ✅ Animated checkmark on completion
- 🎉 "+20 XP" notification on complete
- 🗑️ Delete button with confirmation
- 🎨 Green highlight when completed

### `<ProgressBar />`
Visual progress indicator with percentage.

**Features:**
- 📊 Animated progress fill
- ✨ Shine effect animation
- 🎉 Celebration emoji at 100%
- 🌈 Gradient green fill

### `<StreakCounter />`
Displays current streak with fire emoji and multiplier.

**Features:**
- 🔥 Animated fire icon for active streaks
- 💤 Sleep icon for inactive streaks
- ⚡ XP multiplier badge (e.g., "1.5× XP")
- 📈 Streak tier visualization

## 🔌 API Routes

### `POST /api/xp/award`
Awards XP for task completion.

**Request:**
```json
{
  "userId": "uuid",
  "action": "routine_task",
  "idempotencyKey": "task_abc123",
  "metadata": {
    "taskId": "abc123",
    "taskTitle": "Morning workout"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "xpAwarded": 20,
    "coinsEarned": 4,
    "newLevel": 5,
    "levelUp": null,
    "capped": false
  }
}
```

### `POST /api/xp/update-streak`
Updates user's daily streak counter.

**Request:**
```json
{
  "userId": "uuid"
}
```

## 🗄️ Database Schema

### `checklist_tasks` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users table |
| `title` | TEXT | Task title |
| `completed` | BOOLEAN | Completion status |
| `completed_at` | TIMESTAMPTZ | Completion timestamp |
| `date` | DATE | Task date (for daily reset) |
| `order_index` | INTEGER | Display order |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_checklist_tasks_user_date` — Fast queries by user + date
- `idx_checklist_tasks_completed` — Partial index for completed tasks

**RLS Policies:**
- Users can only access their own tasks
- All CRUD operations protected

## 🎯 XP Economy

### Task Completion Rewards

| Action | Base XP | Coins | Daily Cap |
|--------|---------|-------|-----------|
| Complete Task | 20 XP | 4 coins | 200 XP (10 tasks) |
| First Task of Day | Updates streak | — | — |

### Streak Multipliers

| Streak Days | Multiplier | Display |
|-------------|------------|---------|
| 1-2 days | 1.0× | 🔥 |
| 3-6 days | 1.2× | 🔥 |
| 7-13 days | 1.5× | 🔥 On Fire |
| 14+ days | 2.0× | 👑 Mythic |

### Daily Reset

Tasks automatically reset at midnight in the user's timezone. Old tasks (7+ days) are automatically cleaned up.

## 🎨 Styling

The component uses Tailwind CSS with:
- **Mobile-first** responsive design
- **Dark mode** support via `dark:` variants
- **Smooth transitions** on all interactions
- **Gradient backgrounds** for visual appeal
- **Touch-optimized** button sizes (44px+ height)

### Customization

Override styles using Tailwind classes:

```tsx
// Custom background
<div className="bg-purple-50 dark:bg-purple-900">
  <Checklist userId="user-123" />
</div>
```

## 🔒 Security

✅ **Row Level Security (RLS)** — Users can only access their own tasks  
✅ **Idempotency Keys** — Prevents duplicate XP awards  
✅ **Server-side Validation** — XP awards processed server-side only  
✅ **Cooldown Protection** — XP service handles rate limiting  
✅ **SQL Injection Protection** — Parameterized queries via Supabase

## 🐛 Troubleshooting

### Tasks not loading
1. Check RLS policies are enabled
2. Verify user is authenticated
3. Check browser console for errors

### XP not awarded
1. Verify API route exists at `/api/xp/award`
2. Check XP service is imported correctly
3. Look for errors in server logs

### Animations not working
1. Install `framer-motion`: `npm install framer-motion`
2. Check for CSS conflicts
3. Verify Tailwind CSS is configured

### Daily reset not working
The reset is automatic based on the `date` field. Tasks from previous dates are hidden automatically.

## 📱 Mobile Optimization

- **Touch targets:** All buttons are 44px+ (Apple HIG compliant)
- **Swipe gestures:** Smooth animations on scroll
- **Viewport fit:** Safe area insets respected
- **Font size:** Minimum 16px to prevent zoom on iOS
- **Pull-to-refresh:** Compatible with native gestures

## 🚀 Performance

- **Optimistic Updates:** UI updates before server confirmation
- **Debounced Saves:** Prevents excessive API calls
- **Lazy Loading:** Components load on demand
- **Memoization:** React.memo on child components
- **Index Queries:** Fast DB queries via proper indexing

## 📄 License

MIT License — Free to use in personal and commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ using Next.js 14, Tailwind CSS, Framer Motion, and Supabase**
