// =============================================================
// Dashboard — Home page with daily overview
// =============================================================

import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getLevelInfo } from '@/lib/xp/levels';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const levelInfo = getLevelInfo(profile?.total_xp ?? 0);
  const today = new Date().toISOString().split('T')[0];

  // Get today's routine completions count
  const { count: completionsCount } = await supabase
    .from('routine_completions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('completed_date', today);

  // Get today's workout count
  const { count: workoutsCount } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('completed_at', `${today}T00:00:00Z`);

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Card */}
      <div className="glass p-6">
        <h1 className="text-2xl font-bold mb-1">
          Good {getTimeOfDay()}, {profile?.display_name ?? 'Champion'} 💪
        </h1>
        <p className="text-gray-400">
          Level {levelInfo.level} • {levelInfo.progressPercent}% to next level
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4 text-center">
          <div className="text-3xl font-bold text-brand-400">{completionsCount ?? 0}</div>
          <div className="text-sm text-gray-400">Tasks Done</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{workoutsCount ?? 0}</div>
          <div className="text-sm text-gray-400">Workouts</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-3xl font-bold text-orange-400">🔥 {profile?.streak_days ?? 0}</div>
          <div className="text-sm text-gray-400">Day Streak</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">🪙 {profile?.coins ?? 0}</div>
          <div className="text-sm text-gray-400">Coins</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/routines', icon: '✅', label: 'Check Routines', color: 'from-blue-500/20' },
            { href: '/workout', icon: '🏋️', label: 'Log Workout', color: 'from-green-500/20' },
            { href: '/stretch', icon: '🧘', label: 'Morning Stretch', color: 'from-purple-500/20' },
            { href: '/outfit', icon: '👔', label: 'Rate Outfit', color: 'from-pink-500/20' },
            { href: '/quote', icon: '💬', label: 'Get Motivated', color: 'from-orange-500/20' },
            { href: '/shop', icon: '🛍️', label: 'Shop', color: 'from-yellow-500/20' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`glass p-4 tap-scale bg-gradient-to-br ${action.color} to-transparent`}
            >
              <span className="text-2xl">{action.icon}</span>
              <div className="text-sm font-medium mt-1">{action.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
