'use client';

// =============================================================
// Account Settings — Profile, avatar, username, delete account
// =============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const AVATAR_OPTIONS = ['👤', '💪', '🧠', '🎯', '🔥', '⚡', '🏆', '🎨', '🦁', '🐺', '🦅', '🐉'];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-white/5 animate-pulse" />
        {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-bold">⚙️ Account Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your profile and account</p>
      </div>

      {/* Messages */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Avatar */}
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

      {/* Email (read only) */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-2">
        <label className="text-sm font-medium text-slate-300">Email</label>
        <p className="text-sm text-slate-400">{email}</p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-medium transition"
      >
        Sign Out
      </button>

      {/* Delete Account */}
      <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4 space-y-3">
        <h3 className="text-sm font-medium text-red-400">Danger Zone</h3>
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
