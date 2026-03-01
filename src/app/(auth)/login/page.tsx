'use client';

// =============================================================
// Login Page — Email/Password Auth with Supabase
// =============================================================

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/callback`,
          },
        });
        if (signUpError) throw signUpError;

        // Auto sign-in after signup
        const { error: autoSignIn } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!autoSignIn) {
          // Create profile
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('profiles').upsert({
              id: user.id,
              username: email.split('@')[0],
              display_name: email.split('@')[0],
            });
          }
          router.push('/dashboard');
          router.refresh();
          return;
        }

        setMessage('Account created! Check your email to confirm, then sign in.');
        setIsSignUp(false);
        setPassword('');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        // Ensure profile exists
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (!profile) {
            await supabase.from('profiles').insert({
              id: user.id,
              username: email.split('@')[0],
              display_name: email.split('@')[0],
            });
          }
        }

        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 text-center">
      {/* Logo */}
      <div className="space-y-2">
        <div className="text-6xl mb-2">⚡</div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          LevelUp
        </h1>
        <p className="text-slate-400 text-sm">
          Level up your life, one habit at a time.
        </p>
      </div>

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4 backdrop-blur-xl">
          <h2 className="text-lg font-semibold">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          {/* Email */}
          <div className="text-left">
            <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition"
            />
          </div>

          {/* Password */}
          <div className="text-left">
            <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder={isSignUp ? 'Min 6 characters' : '••••••••'}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Success message */}
          {message && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? (isSignUp ? 'Creating account...' : 'Signing in...')
              : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </div>
      </form>

      {/* Toggle */}
      <p className="text-sm text-slate-500">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setMessage(null);
          }}
          className="text-violet-400 hover:text-violet-300 font-medium transition"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}
