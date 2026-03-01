'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import BackButton from '@/components/ui/BackButton';
import StretchSession from '@/components/stretch/StretchSession';

export default function StretchPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-slate-400">Loading stretches...</div>
      </div>
    );
  }

  return (
    <div>
      <BackButton href="/dashboard" />
      <StretchSession userId={userId} />
    </div>
  );
}
