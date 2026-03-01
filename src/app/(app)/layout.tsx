// =============================================================
// App Layout — Authenticated shell with bottom nav + XP bar
// =============================================================

import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { xpForNextLevel, levelFromTotalXP } from '@/lib/xp/levels';

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

  // Fetch profile for XP bar
  const { data: profile } = await supabase
    .from('profiles')
    .select('level, total_xp, current_level_xp, coins, streak_days, display_name, avatar_url')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col pb-safe-bottom">
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
            <Link href="/settings" className="text-sm hover:opacity-80 transition">🔔</Link>
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
      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav sticky bottom-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-around py-2">
          <NavItem href="/dashboard" icon="🏠" label="Home" />
          <NavItem href="/routines" icon="✅" label="Routines" />
          <NavItem href="/workout" icon="💪" label="Workout" />
          <NavItem href="/stretch" icon="🧘" label="Stretch" />
          <NavItem href="/outfit" icon="👔" label="Outfit" />
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
