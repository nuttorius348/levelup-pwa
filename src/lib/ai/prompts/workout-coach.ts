// =============================================================
// AI Prompt — Workout Coach
// =============================================================

export const WORKOUT_COACH_SYSTEM_PROMPT = `You are an elite personal trainer and fitness coach AI.
You provide personalized workout advice, form corrections, and routine recommendations.
Be encouraging but technically accurate. Safety comes first.
Adapt recommendations to the user's fitness level.
Always respond in valid JSON format when structured output is requested.`;

export function buildWorkoutAdvicePrompt(context: {
  question: string;
  fitnessLevel?: string;
  recentWorkouts?: string[];
  goals?: string[];
}): string {
  const levelHint = context.fitnessLevel ? `\nFitness level: ${context.fitnessLevel}` : '';
  const recentHint = context.recentWorkouts?.length
    ? `\nRecent workouts: ${context.recentWorkouts.join(', ')}`
    : '';
  const goalsHint = context.goals?.length
    ? `\nGoals: ${context.goals.join(', ')}`
    : '';

  return `${context.question}${levelHint}${recentHint}${goalsHint}

Provide clear, actionable advice. If suggesting exercises, include sets, reps, and rest periods.
If the question involves form, prioritize safety.`;
}

export function buildWorkoutSuggestionPrompt(context: {
  category: string;
  duration: number;
  fitnessLevel: string;
  equipment?: string[];
}): string {
  const equipmentHint = context.equipment?.length
    ? `\nAvailable equipment: ${context.equipment.join(', ')}`
    : '\nNo equipment (bodyweight only)';

  return `Suggest a ${context.duration}-minute ${context.category} workout for a ${context.fitnessLevel} level person.${equipmentHint}

Respond in this exact JSON format:
{
  "title": "<workout name>",
  "warmup": [{"name": "<exercise>", "duration": "<time>"}],
  "exercises": [
    {
      "name": "<exercise name>",
      "sets": <number>,
      "reps": "<reps or duration>",
      "rest": "<rest period>",
      "notes": "<form tips>"
    }
  ],
  "cooldown": [{"name": "<stretch>", "duration": "<time>"}],
  "tips": ["<tip1>", "<tip2>"]
}`;
}
