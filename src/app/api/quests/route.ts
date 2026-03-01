export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserQuests, checkAndAssignQuests } from '@/lib/quests/quest.service';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user needs new quests
    await checkAndAssignQuests(userId);

    // Get active quests
    const quests = await getUserQuests(userId);

    return NextResponse.json({ quests });
  } catch (error) {
    console.error('Failed to fetch quests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    );
  }
}
