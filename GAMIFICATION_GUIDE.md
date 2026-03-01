# Gamification Features Implementation Guide

## Overview
This document explains the newly implemented gamification features and how to integrate them into your LevelUp app.

---

## 🎨 Features Implemented

### 1. XP Popup Notifications
**File:** `src/components/gamification/XPPopup.tsx`

Floating notifications that appear when users gain XP.

**Usage:**
```tsx
import { XPPopup, XPPopupEvent } from '@/components/gamification/XPPopup';

const [xpEvents, setXpEvents] = useState<XPPopupEvent[]>([]);

// When user gains XP
const handleXPGain = (amount: number, label: string) => {
  const newEvent: XPPopupEvent = {
    id: crypto.randomUUID(),
    amount,
    label,
    color: 'text-violet-400', // optional
    icon: '⚡', // optional
  };
  setXpEvents([...xpEvents, newEvent]);
};

// In your component
<XPPopup 
  events={xpEvents}
  onComplete={(id) => {
    setXpEvents(xpEvents.filter(e => e.id !== id));
  }}
/>
```

**Animation Details:**
- 2-second lifecycle
- Floats upward 120px
- Fades in → scale pop → float → fade out
- Icon wiggles on entrance
- Multiple events stack with offset positioning

---

### 2. Level-Up Celebration Modal
**File:** `src/components/gamification/LevelUpModal.tsx`

Epic celebration when user levels up with 80 confetti particles.

**Usage:**
```tsx
import { LevelUpModal } from '@/components/gamification/LevelUpModal';

const [showLevelUp, setShowLevelUp] = useState(false);
const [levelUpData, setLevelUpData] = useState(null);

// When level-up occurs (from grantXP response)
if (xpResult.levelUp) {
  setLevelUpData(xpResult.levelUp);
  setShowLevelUp(true);
}

// In your component
<LevelUpModal
  isOpen={showLevelUp}
  onClose={() => setShowLevelUp(false)}
  previousLevel={levelUpData.previousLevel}
  newLevel={levelUpData.newLevel}
  coinsAwarded={levelUpData.coinsAwarded}
  newTitle={levelUpData.newTitle}
  unlockedRewards={levelUpData.unlockedRewards}
/>
```

**Features:**
- 80 confetti particles with 8 vibrant colors
- Pulsing glow on new level number
- Animated level transition (old → arrow → new)
- Displays coin rewards and unlocked items
- Auto-closes after 5 seconds
- Tap-to-dismiss

---

### 3. Sound System
**Files:** 
- `src/lib/sounds/manager.ts` - Sound manager with generated tones
- `src/hooks/useSound.ts` - React hook for sound effects

**Available Sound Effects:**
- `xp_gain` - Quick ascending chirp
- `level_up` - Triumphant chord progression
- `coin_gain` - Coin clink
- `purchase` - Cash register ding
- `boost_activate` - Power-up sound
- `quest_complete` - Victory fanfare
- `streak_milestone` - Ascending arpeggio
- `achievement_unlock` - Epic unlock
- `button_click` - Quick click
- `error` - Error buzz

**Usage:**
```tsx
import { useSound } from '@/hooks/useSound';

function MyComponent() {
  const { play, enabled, volume, toggle, setVolume } = useSound();

  const handleAction = () => {
    play('xp_gain'); // Play sound effect
  };

  return (
    <>
      <button onClick={handleAction}>Gain XP</button>
      <button onClick={toggle}>
        {enabled ? '🔊' : '🔇'}
      </button>
    </>
  );
}
```

**Features:**
- No audio files needed (uses Web Audio API oscillators)
- Persistent settings in localStorage
- Master volume control
- Enable/disable toggle
- Works on iOS Safari (after user interaction)

---

### 4. Enhanced XP Progress Bars
**File:** `src/components/gamification/XPProgressBar.tsx`

Two variants: Circular and Linear progress bars.

**CircularXPBar Usage:**
```tsx
import { CircularXPBar } from '@/components/gamification/XPProgressBar';

<CircularXPBar
  currentXP={750}
  requiredXP={1000}
  level={5}
  size={120}
  strokeWidth={8}
  showLevel={true}
  animated={true}
/>
```

**LinearXPBar Usage:**
```tsx
import { LinearXPBar } from '@/components/gamification/XPProgressBar';

<LinearXPBar
  currentXP={750}
  requiredXP={1000}
  level={5}
  showStats={true}
  animated={true}
/>
```

**Features:**
- SVG gradient fills
- Glow effects
- Shimmer animation on progress
- Smooth animated transitions
- Percentage display

---

### 5. Daily Quest System
**Files:**
- `supabase/migrations/008_daily_quests.sql` - Database schema
- `src/lib/quests/quest.service.ts` - Quest logic service
- `src/app/api/quests/route.ts` - GET active quests
- `src/app/api/quests/claim/route.ts` - POST claim rewards
- `src/components/quests/QuestCard.tsx` - Individual quest card
- `src/components/quests/QuestList.tsx` - Quest list with stats
- `src/app/quests/page.tsx` - Quests page

**Database Tables:**
- `quest_templates` - Reusable quest definitions
- `user_quests` - User-specific quest progress

**Quest Types:**
- `daily_workouts` - Complete X workouts
- `daily_stretches` - Complete X stretches
- `daily_xp` - Earn X XP
- `weekly_streak` - Maintain login streak
- `outfit_ratings` - Rate X outfits
- `daily_login` - Log in daily

**Difficulty Tiers:**
- Easy (green) - Small rewards, simple tasks
- Normal (blue) - Medium rewards, moderate effort
- Hard (orange) - High rewards, challenging goals
- Epic (purple) - Massive rewards, weekly quests

**Quest Assignment:**
- Automatically assigns 3 daily quests (1 easy, 1 normal, 1 hard)
- Quests expire at end of day
- New quests assigned when none active

**API Usage:**
```tsx
// Get active quests
const response = await fetch('/api/quests', {
  headers: { 'x-user-id': userId }
});
const { quests } = await response.json();

// Claim quest reward
const response = await fetch('/api/quests/claim', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-user-id': userId 
  },
  body: JSON.stringify({ questId })
});
const { reward, levelUp } = await response.json();
```

**Progress Tracking:**
Use the `incrementQuestProgress` function to track quest completion:

```tsx
import { incrementQuestProgress } from '@/lib/quests/quest.service';

// After workout completion
await incrementQuestProgress(userId, 'daily_workouts', 1);

// After XP gain
await incrementQuestProgress(userId, 'daily_xp', xpAmount);

// After outfit rating
await incrementQuestProgress(userId, 'outfit_ratings', 1);
```

---

## 🔧 Integration Guide

### Step 1: Run Database Migration
```bash
# Apply quest system migration
supabase db push
```

### Step 2: Wire XP Popups into XP Grant Flow

Update your XP granting logic (e.g., in workout completion):

```tsx
'use client';

import { useState } from 'react';
import { XPPopup, XPPopupEvent } from '@/components/gamification/XPPopup';
import { useSound } from '@/hooks/useSound';

export default function WorkoutPage() {
  const [xpEvents, setXpEvents] = useState<XPPopupEvent[]>([]);
  const { play } = useSound();

  const handleWorkoutComplete = async () => {
    const response = await fetch('/api/xp/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-id',
        amount: 100,
        source: 'workout_completion',
      }),
    });

    const result = await response.json();

    // Show XP popup
    const xpEvent: XPPopupEvent = {
      id: crypto.randomUUID(),
      amount: result.granted,
      label: 'Workout Complete!',
    };
    setXpEvents([...xpEvents, xpEvent]);

    // Play sound
    play('xp_gain');

    // Update quest progress
    await incrementQuestProgress('user-id', 'daily_workouts', 1);
    await incrementQuestProgress('user-id', 'daily_xp', result.granted);
  };

  return (
    <>
      {/* Your workout UI */}
      <XPPopup 
        events={xpEvents} 
        onComplete={(id) => setXpEvents(xpEvents.filter(e => e.id !== id))}
      />
    </>
  );
}
```

### Step 3: Wire Level-Up Modal

Add to your dashboard layout:

```tsx
'use client';

import { LevelUpModal } from '@/components/gamification/LevelUpModal';
import { useSound } from '@/hooks/useSound';
import { useState, useEffect } from 'react';

export default function DashboardLayout({ children }) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const { play } = useSound();

  // Listen for level-up events (you can use a global event system)
  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      setLevelUpData(event.detail);
      setShowLevelUp(true);
      play('level_up');
    };

    window.addEventListener('levelup' as any, handleLevelUp);
    return () => window.removeEventListener('levelup' as any, handleLevelUp);
  }, []);

  return (
    <>
      {children}
      {showLevelUp && levelUpData && (
        <LevelUpModal
          isOpen={showLevelUp}
          onClose={() => setShowLevelUp(false)}
          {...levelUpData}
        />
      )}
    </>
  );
}
```

### Step 4: Add Progress Bar to Header

```tsx
import { LinearXPBar } from '@/components/gamification/XPProgressBar';

export function DashboardHeader({ user }) {
  return (
    <header>
      <LinearXPBar
        currentXP={user.current_level_xp}
        requiredXP={user.next_level_xp}
        level={user.level}
      />
    </header>
  );
}
```

### Step 5: Add Sound Settings

Create a settings page with sound controls:

```tsx
import { useSound } from '@/hooks/useSound';

export function SoundSettings() {
  const { enabled, volume, toggle, setVolume } = useSound();

  return (
    <div>
      <label>
        <input type="checkbox" checked={enabled} onChange={toggle} />
        Enable Sound Effects
      </label>
      <label>
        Volume: {Math.round(volume * 100)}%
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
        />
      </label>
    </div>
  );
}
```

---

## 🎯 Quest System Integration

### Tracking Quest Progress

Integrate quest tracking into your existing features:

**Workouts:**
```tsx
// In workout completion handler
await incrementQuestProgress(userId, 'daily_workouts', 1);
```

**Stretches:**
```tsx
// In stretch completion handler
await incrementQuestProgress(userId, 'daily_stretches', 1);
```

**XP Gains:**
```tsx
// After granting XP
await incrementQuestProgress(userId, 'daily_xp', xpAmount);
```

**Outfit Ratings:**
```tsx
// After rating outfit
await incrementQuestProgress(userId, 'outfit_ratings', 1);
```

---

## 📱 Navigation Update

Add quests to your navigation:

```tsx
// In navigation component
<Link href="/quests" className="nav-item">
  <span>🎯</span>
  <span>Quests</span>
  {activeQuestCount > 0 && (
    <span className="badge">{activeQuestCount}</span>
  )}
</Link>
```

---

## 🎉 Complete User Flow Example

Here's a complete example of the full gamification flow:

```tsx
'use client';

import { useState } from 'react';
import { XPPopup, XPPopupEvent } from '@/components/gamification/XPPopup';
import { LevelUpModal } from '@/components/gamification/LevelUpModal';
import { LinearXPBar } from '@/components/gamification/XPProgressBar';
import { useSound } from '@/hooks/useSound';
import { incrementQuestProgress } from '@/lib/quests/quest.service';

export default function WorkoutPage() {
  const [xpEvents, setXpEvents] = useState<XPPopupEvent[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [user, setUser] = useState({ level: 5, current_level_xp: 750, next_level_xp: 1000 });
  const { play } = useSound();

  const completeWorkout = async () => {
    play('button_click');

    // Grant XP
    const xpResponse = await fetch('/api/xp/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-id',
        amount: 100,
        source: 'workout_completion',
      }),
    });

    const xpResult = await xpResponse.json();

    // Show XP popup
    const event: XPPopupEvent = {
      id: crypto.randomUUID(),
      amount: xpResult.granted,
      label: 'Workout Complete!',
    };
    setXpEvents([...xpEvents, event]);
    play('xp_gain');

    // Update quest progress
    await incrementQuestProgress('user-id', 'daily_workouts', 1);
    await incrementQuestProgress('user-id', 'daily_xp', xpResult.granted);

    // Check for level-up
    if (xpResult.levelUp) {
      setLevelUpData(xpResult.levelUp);
      setShowLevelUp(true);
      play('level_up');
    }

    // Update user state
    setUser(xpResult.user);
  };

  return (
    <div>
      {/* Progress bar */}
      <LinearXPBar
        currentXP={user.current_level_xp}
        requiredXP={user.next_level_xp}
        level={user.level}
      />

      {/* Workout UI */}
      <button onClick={completeWorkout}>
        Complete Workout
      </button>

      {/* XP Popups */}
      <XPPopup
        events={xpEvents}
        onComplete={(id) => setXpEvents(xpEvents.filter(e => e.id !== id))}
      />

      {/* Level-up modal */}
      {showLevelUp && levelUpData && (
        <LevelUpModal
          isOpen={showLevelUp}
          onClose={() => setShowLevelUp(false)}
          {...levelUpData}
        />
      )}
    </div>
  );
}
```

---

## 🚀 Testing Checklist

- [ ] XP popup appears when gaining XP
- [ ] Sounds play on XP gain, level-up, quest completion
- [ ] Level-up modal shows with confetti when leveling up
- [ ] Progress bar updates smoothly
- [ ] Quests appear on /quests page
- [ ] Quest progress updates when completing actions
- [ ] Quest rewards can be claimed
- [ ] Quest completion triggers sound and reward reveal
- [ ] Sound settings persist in localStorage
- [ ] All animations are smooth and performant

---

## 🎨 Customization

### Adjusting Colors
All components use Tailwind CSS classes. Modify colors in components:
- XP Popup: `text-violet-400`, `border-violet-500`
- Level-up: Gradient from `violet-900` to `blue-900`
- Progress bars: Gradient from `violet-500` to `pink-500`
- Quest difficulties: See `difficultyColors` object in QuestCard.tsx

### Sound Customization
Modify `SOUND_EFFECTS` in `src/lib/sounds/manager.ts`:
```tsx
xp_gain: { volume: 0.3, playbackRate: 1.2 },
```

### Quest Template Customization
Add new quest types in migration 008:
```sql
INSERT INTO quest_templates (name, description, quest_type, target_count, xp_reward, coin_reward, icon, difficulty)
VALUES ('Custom Quest', 'Description', 'custom_type', 10, 200, 50, '🎯', 'normal');
```

---

## 📝 Notes

- Sound system uses Web Audio API (no files needed)
- All animations use Framer Motion for performance
- Quest system runs database functions for atomic updates
- XP popups stack vertically with stagger animation
- Level-up modal auto-dismisses after 5 seconds
- Quest rewards automatically grant XP and coins

