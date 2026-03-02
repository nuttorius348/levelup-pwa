'use client';

// =============================================================
// Profile & Settings — Profile overview + account settings
// =============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const AVATAR_OPTIONS = ['👤', '💪', '🧠', '🎯', '🔥', '⚡', '🏆', '🎨', '🦁', '🐺', '🦅', '🐉'];

interface ProfileData {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  current_level_xp: number;
  coins: number;
  streak_days: number;
  longest_streak: number;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('👤');
  const [avatarMode, setAvatarMode] = useState<'emoji' | 'url'>('emoji');
  const [email, setEmail] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');

      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        const p = data.profile;
        setProfile(p);
        setDisplayName(p?.display_name ?? '');
        setUsername(p?.username ?? '');
        if (p?.avatar_url) {
          if (AVATAR_OPTIONS.includes(p.avatar_url)) {
            setSelectedEmoji(p.avatar_url);
            setAvatarMode('emoji');
          } else {
            setAvatarUrl(p.avatar_url);
            setAvatarMode('url');
          }
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const avatar = avatarMode === 'emoji' ? selectedEmoji : avatarUrl;
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          username: username.trim() || undefined,
          avatarUrl: avatar || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated!' });
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.profile);
        }
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Failed to update' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    try {
      const res = await fetch('/api/profile/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });
      if (res.ok) {
        await supabase.auth.signOut();
        router.push('/login');
      } else {
        setMessage({ type: 'error', text: 'Failed to delete account' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setDeleting(false);
    }
  };

  const avatarDisplay = avatarMode === 'emoji' ? selectedEmoji : (profile?.avatar_url || '👤');
  const isEmojiAvatar = AVATAR_OPTIONS.includes(avatarDisplay);

  if (loading) {
    return (
      <div className="space-y-4 max-w-md mx-auto">
        <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />
        {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-md mx-auto">

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PROFILE CARD                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-pink-600/10" />
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />

        <div className="relative p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-indigo-500/50 mx-auto mb-3 flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/20">
            {isEmojiAvatar ? (
              avatarDisplay
            ) : profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              '👤'
            )}
          </div>

          <h1 className="text-xl font-bold text-white">{profile?.display_name ?? 'User'}</h1>
          {profile?.username && (
            <p className="text-sm text-indigo-300">@{profile.username}</p>
          )}

          {/* XP Bar */}
          <div className="mt-4 mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-indigo-300 font-medium">Level {profile?.level ?? 1}</span>
              <span className="text-slate-400">{(profile?.total_xp ?? 0).toLocaleString()} total XP</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((profile?.current_level_xp ?? 0) / Math.max(1, getXpForNextLevel(profile?.level ?? 1))) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-white">{profile?.level ?? 1}</div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">Level</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-amber-400">🪙 {(profile?.coins ?? 0).toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">Coins</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <div className="text-lg font-bold text-orange-400">🔥 {profile?.streak_days ?? 0}</div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">Streak</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
            <span>Best Streak: {profile?.longest_streak ?? 0} days</span>
            <span>•</span>
            <span>{email}</span>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ACCOUNT SETTINGS                                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>⚙️</span> Account Settings
        </h2>
        <p className="text-xs text-slate-400">Update your profile information</p>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Picker */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
        <label className="text-sm font-medium text-slate-300">Avatar</label>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setAvatarMode('emoji')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              avatarMode === 'emoji' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'
            }`}
          >
            Emoji
          </button>
          <button
            onClick={() => setAvatarMode('url')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              avatarMode === 'url' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'
            }`}
          >
            Image URL
          </button>
        </div>

        {avatarMode === 'emoji' ? (
          <div className="flex gap-2 flex-wrap">
            {AVATAR_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(emoji)}
                className={`text-2xl p-2 rounded-xl transition ${
                  selectedEmoji === emoji
                    ? 'bg-indigo-600/30 ring-2 ring-indigo-500'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <input
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        )}
      </div>

      {/* Display Name */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-2">
        <label className="text-sm font-medium text-slate-300">Display Name</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Your display name"
          maxLength={50}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Username */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-2">
        <label className="text-sm font-medium text-slate-300">Username</label>
        <div className="flex items-center gap-1">
          <span className="text-slate-500 text-sm">@</span>
          <input
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="username"
            maxLength={30}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <p className="text-[10px] text-slate-500">Letters, numbers, and underscores only. Min 3 characters.</p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* QUICK ACTIONS                                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="space-y-1 pt-2">
        <h2 className="text-lg font-bold text-white">Quick Actions</h2>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-medium transition flex items-center justify-center gap-2"
      >
        <span>🚪</span> Sign Out
      </button>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DANGER ZONE                                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4 space-y-3">
        <h3 className="text-sm font-medium text-red-400">⚠️ Danger Zone</h3>
        <p className="text-xs text-slate-400">
          Permanently delete your account and all data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 text-sm font-medium transition"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-300">Type &quot;DELETE&quot; to confirm:</p>
            <input
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-red-300 placeholder-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                className="flex-1 py-2 rounded-xl bg-white/5 text-slate-400 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteText !== 'DELETE' || deleting}
                className="flex-1 py-2 rounded-xl bg-red-600 disabled:opacity-30 text-white text-sm font-medium transition"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper: approximate XP needed for next level (matches level.ts formula)
function getXpForNextLevel(level: number): number {
  const current = Math.floor(100 * Math.pow(level, 1.5));
  const next = Math.floor(100 * Math.pow(level + 1, 1.5));
  return next - current;
}
