import { NextRequest, NextResponse } from 'next/server';
import { claimQuestReward } from '@/lib/quests/quest.service';
import { grantXP } from '@/lib/xp/engine';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { questId } = await request.json();

    if (!questId) {
      return NextResponse.json(
        { error: 'Quest ID required' },
        { status: 400 }
      );
    }

    // Claim the quest rewards
    const reward = await claimQuestReward(userId, questId);

    if (!reward) {
      return NextResponse.json(
        { error: 'Failed to claim quest' },
        { status: 400 }
      );
    }

    // Grant XP (which also handles coins)
    const xpResult = await grantXP({
      userId,
      action: 'admin_grant',
      overrideBaseXP: reward.xp,
      metadata: { source: 'quest_completion', questId },
    });

    // Add bonus coins from quest
    if (reward.coins > 0) {
      const supabase = await createServerSupabaseClient();
      const { data: user } = await supabase
        .from('users')
        .select('coins')
        .eq('id', userId)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({ coins: user.coins + reward.coins })
          .eq('id', userId);
      }
    }

    return NextResponse.json({
      success: true,
      reward: {
        xp: reward.xp,
        coins: reward.coins,
      },
      levelUp: xpResult.levelUp,
    });
  } catch (error: any) {
    console.error('Failed to claim quest:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to claim quest' },
      { status: 500 }
    );
  }
}
