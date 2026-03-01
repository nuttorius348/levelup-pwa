'use client';

import { QuestList } from '@/components/quests/QuestList';
import BackButton from '@/components/ui/BackButton';

export default function QuestsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <BackButton href="/dashboard" />
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 mb-2">
            Daily Quests
          </h1>
          <p className="text-slate-400">
            Complete quests to earn bonus XP and coins. New quests available daily!
          </p>
        </div>

        {/* Quest list */}
        <QuestList />
      </div>
    </div>
  );
}
