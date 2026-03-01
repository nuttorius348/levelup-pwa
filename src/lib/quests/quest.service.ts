import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface QuestTemplate {
  id: string;
  name: string;
  description: string;
  quest_type: QuestType;
  target_count: number;
  xp_reward: number;
  coin_reward: number;
  icon: string;
  reset_frequency: 'daily' | 'weekly' | 'monthly';
  difficulty: 'easy' | 'normal' | 'hard' | 'epic';
  is_active: boolean;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_template_id: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  assigned_at: string;
  completed_at?: string;
  claimed_at?: string;
  expires_at: string;
  template?: QuestTemplate;
}

export type QuestType =
  | 'daily_workouts'
  | 'daily_stretches'
  | 'daily_xp'
  | 'weekly_streak'
  | 'outfit_ratings'
  | 'daily_login';

export interface QuestReward {
  xp: number;
  coins: number;
}

/**
 * Get active quests for a user
 */
export async function getUserQuests(userId: string): Promise<UserQuest[]> {
  const { data, error } = await supabase
    .from('user_quests')
    .select(`
      *,
      template:quest_templates(*)
    `)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('assigned_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch user quests:', error);
    return [];
  }

  return data as unknown as UserQuest[];
}

/**
 * Assign daily quests to a user
 */
export async function assignDailyQuests(userId: string): Promise<void> {
  const { error } = await supabase.rpc('assign_daily_quests', {
    target_user_id: userId,
  });

  if (error) {
    console.error('Failed to assign daily quests:', error);
    throw error;
  }
}

/**
 * Increment quest progress for a specific quest type
 */
export async function incrementQuestProgress(
  userId: string,
  questType: QuestType,
  amount: number = 1
): Promise<void> {
  const { error } = await supabase.rpc('increment_quest_progress', {
    target_user_id: userId,
    target_quest_type: questType,
    increment_amount: amount,
  });

  if (error) {
    console.error('Failed to increment quest progress:', error);
    throw error;
  }
}

/**
 * Claim completed quest rewards
 */
export async function claimQuestReward(
  userId: string,
  questId: string
): Promise<QuestReward | null> {
  // Get quest details
  const { data: quest, error: questError } = await supabase
    .from('user_quests')
    .select(`
      *,
      template:quest_templates(*)
    `)
    .eq('id', questId)
    .eq('user_id', userId)
    .single();

  if (questError || !quest) {
    console.error('Quest not found:', questError);
    return null;
  }

  if (!quest.completed) {
    throw new Error('Quest not completed yet');
  }

  if (quest.claimed) {
    throw new Error('Quest rewards already claimed');
  }

  const template = quest.template as unknown as QuestTemplate;

  // Mark as claimed
  const { error: claimError } = await supabase
    .from('user_quests')
    .update({
      claimed: true,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', questId);

  if (claimError) {
    console.error('Failed to claim quest:', claimError);
    throw claimError;
  }

  return {
    xp: template.xp_reward,
    coins: template.coin_reward,
  };
}

/**
 * Check if user needs new quests assigned
 */
export async function checkAndAssignQuests(userId: string): Promise<boolean> {
  const { data: activeQuests, error } = await supabase
    .from('user_quests')
    .select('id')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to check active quests:', error);
    return false;
  }

  // If no active quests, assign new ones
  if (!activeQuests || activeQuests.length === 0) {
    await assignDailyQuests(userId);
    return true;
  }

  return false;
}

/**
 * Get quest completion stats
 */
export async function getQuestStats(userId: string) {
  const { data, error } = await supabase
    .from('user_quests')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch quest stats:', error);
    return {
      total: 0,
      completed: 0,
      claimed: 0,
      active: 0,
    };
  }

  const now = new Date();
  return {
    total: data.length,
    completed: data.filter((q: any) => q.completed).length,
    claimed: data.filter((q: any) => q.claimed).length,
    active: data.filter((q: any) => new Date(q.expires_at) > now && !q.claimed).length,
  };
}
