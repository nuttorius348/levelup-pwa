// =============================================================
// App Layout — Authenticated shell with bottom nav + XP bar
// =============================================================

import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { xpForNextLevel, levelFromTotalXP } from '@/lib/xp/levels';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const admin = createAdminClient();

  // Ensure users row exists (required for ALL XP operations)
  let { data: profile } = await supabase
    .from('users')
    .select('level, total_xp, current_level_xp, coins, streak_days, display_name, avatar_url, last_active_date')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // First-time user — create both users and profiles rows
    const newProfile = {
      id: user.id,
      display_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
      email: user.email ?? '',
      avatar_url: user.user_metadata?.avatar_url ?? '👤',
      level: 1,
      total_xp: 0,
      current_level_xp: 0,
      coins: 0,
      streak_days: 0,
      longest_streak: 0,
      last_active_date: new Date().toISOString().split('T')[0],
    };
    await admin.from('users').upsert(newProfile, { onConflict: 'id' });
    await admin.from('profiles').upsert(newProfile, { onConflict: 'id' });

    // Refetch
    const { data: freshProfile } = await supabase
      .from('users')
      .select('level, total_xp, current_level_xp, coins, streak_days, display_name, avatar_url, last_active_date')
      .eq('id', user.id)
      .single();
    profile = freshProfile;
  }

  // Grant daily_login XP + update streak (idempotent — capped at 1/day)
  // Only do this once per day (check last_active_date)
  const today = new Date().toISOString().split('T')[0];
  if (profile && profile.last_active_date !== today) {
    try {
      // Import lazily to avoid circular deps in layout
      const { grantXP } = await import('@/lib/xp/engine');
      const { updateStreak } = await import('@/lib/services/xp.service');

      await updateStreak(user.id);
      await grantXP({ userId: user.id, action: 'daily_login', metadata: { source: 'app_visit' } });

      // Refetch profile after grants
      const { data: updated } = await supabase
        .from('users')
        .select('level, total_xp, current_level_xp, coins, streak_days, display_name, avatar_url, last_active_date')
        .eq('id', user.id)
        .single();
      if (updated) profile = updated;
    } catch (e) {
      console.error('[Layout] Daily init error:', e);
      // Non-critical — continue rendering
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top XP Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 pt-safe-top">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-brand-600 text-white px-2 py-0.5 rounded-full">
              LV {profile?.level ?? 1}
            </span>
            <span className="text-xs text-slate-400">{profile?.display_name}</span>
          </div>
          <div className="flex items-center gap-3">
            {(profile?.streak_days ?? 0) > 0 && (
              <span className="text-xs">🔥 {profile?.streak_days}</span>
            )}
            <span className="text-xs text-coin font-semibold">🪙 {profile?.coins ?? 0}</span>
            <Link href="/profile/settings" className="text-sm hover:opacity-80 transition">⚙️</Link>
          </div>
        </div>
        {/* XP Progress Bar */}
        <div className="px-4 pb-2">
          <div className="xp-bar">
            <div
              className="xp-bar-fill"
              style={{ width: `${Math.min(100, ((profile?.current_level_xp ?? 0) / Math.max(1, xpForNextLevel(profile?.level ?? 1))) * 100)}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 pb-36 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation — fixed so it never moves on scroll */}
      <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-around py-2">
          <NavItem href="/dashboard" icon="🏠" label="Home" />
          <NavItem href="/tasks" icon="📝" label="Tasks" />
          <NavItem href="/routines" icon="✅" label="Routines" />
          <NavItem href="/workout" icon="💪" label="Workout" />
          <NavItem href="/leaderboard" icon="🏆" label="Ranks" />
          <NavItem href="/shop" icon="🛍️" label="Shop" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-white transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
