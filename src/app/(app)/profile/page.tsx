// =============================================================
// Profile Page — User stats, level, achievements
// =============================================================

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getLevelInfo } from '@/lib/xp/levels';

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const levelInfo = getLevelInfo(profile?.total_xp ?? 0);

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <div className="glass p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-600 mx-auto mb-3 flex items-center justify-center text-3xl">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            '👤'
          )}
        </div>
        <h1 className="text-xl font-bold">{profile?.display_name ?? 'User'}</h1>
        <p className="text-gray-400">@{profile?.username ?? 'unnamed'}</p>
        <div className="mt-3 flex items-center justify-center gap-4 text-sm">
          <span>Level {levelInfo.level}</span>
          <span>•</span>
          <span>{profile?.total_xp?.toLocaleString()} XP</span>
          <span>•</span>
          <span>🪙 {profile?.coins?.toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-3 text-center">
          <div className="text-2xl font-bold">{profile?.streak_days ?? 0}</div>
          <div className="text-xs text-gray-400">Current Streak</div>
        </div>
        <div className="glass p-3 text-center">
          <div className="text-2xl font-bold">{profile?.longest_streak ?? 0}</div>
          <div className="text-xs text-gray-400">Best Streak</div>
        </div>
        <div className="glass p-3 text-center">
          <div className="text-2xl font-bold">{levelInfo.progressPercent}%</div>
          <div className="text-xs text-gray-400">To Next Lv</div>
        </div>
      </div>

      {/* Settings link */}
      <a href="/settings" className="glass p-4 flex items-center justify-between tap-scale">
        <span>⚙️ Settings</span>
        <span className="text-gray-500">→</span>
      </a>
    </div>
  );
}
