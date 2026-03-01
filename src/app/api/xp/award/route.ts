export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { awardXP } from '@/lib/services/xp.service';
import { sendLevelUpNotification, sendXPMilestoneNotification } from '@/lib/notifications/helpers';

/**
 * POST /api/xp/award
 * Award XP to a user for completing an action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, idempotencyKey, metadata } = body;

    // Validate required fields
    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action' },
        { status: 400 }
      );
    }

    // Award XP
    const result = await awardXP({
      userId,
      action,
      idempotencyKey,
      metadata,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to award XP' },
        { status: 500 }
      );
    }

    // Trigger notifications asynchronously (don't block response)
    if (result.levelUp) {
      sendLevelUpNotification(
        userId,
        result.levelUp.previousLevel,
        result.levelUp.newLevel,
      ).catch((err) => console.error('[Notifications] Level up notification failed:', err));
    }

    // Check for XP milestones
    sendXPMilestoneNotification(userId, result.newTotalXP).catch((err) =>
      console.error('[Notifications] XP milestone notification failed:', err),
    );

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        xpAwarded: result.grant.finalXP,
        coinsEarned: result.grant.coinsEarned,
        newLevel: result.newLevel,
        newTotalXP: result.newTotalXP,
        levelUp: result.levelUp
          ? {
              oldLevel: result.levelUp.previousLevel,
              newLevel: result.levelUp.newLevel,
              coinsAwarded: result.levelUp.coinsAwarded,
            }
          : null,
        isDuplicate: result.isDuplicate,
        capped: result.capped,
        cooledDown: result.cooledDown,
      },
    });
  } catch (error) {
    console.error('[API] Award XP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
