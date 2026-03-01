// =============================================================
// AI Prompt — Motivational Quote (Original, Copyright-Safe)
// =============================================================
//
// Three narrative archetypes:
//   1. Underdog Boxing  — grit, sweat, getting off the canvas
//   2. Comeback Narrative — redemption arcs, second chances
//   3. Discipline & Resilience — consistency, mental toughness
//
// SAFETY RULES (enforced in every system prompt):
//  • NEVER reproduce dialogue from any film, book, speech, or song
//  • NEVER name real people, characters, or copyrighted works
//  • All output must be 100% original content
//  • Attribution must be a fictional archetype, NEVER a real name
// =============================================================

import type { QuoteTheme, QuoteTone } from '@/types/ai';

// ── Copyright Safety Preamble (shared) ────────────────────────

const COPYRIGHT_GUARD = `
CRITICAL RULES — you MUST follow all of these:
1. Every quote you produce must be 100% original. Do NOT reproduce, paraphrase,
   or closely imitate any line from a movie, book, song, speech, or TV show.
2. Do NOT reference any real person, fictional character, or copyrighted work
   by name — not in the quote, not in the attribution.
3. The "attribution" field must be a generic fictional archetype description
   (e.g. "A boxer before the final bell", "A coach at halftime").
   NEVER use a real or recognisable fictional name.
4. If you are unsure whether a phrase is original, rephrase it entirely.
5. Avoid well-known clichés like "eye of the tiger", "float like a butterfly",
   "it's not how hard you hit", "what doesn't kill you", etc.`.trim();

// ── Theme-Specific System Prompts ─────────────────────────────

const SYSTEM_PROMPTS: Record<QuoteTheme, string> = {
  'underdog-boxing': `You are an original motivational writer channelling the raw energy of boxing underdogs.
Imagine a fighter who was counted out — bloodied, exhausted, one round from losing —
who finds something deep inside and keeps swinging.

Write in a visceral, first-person or second-person voice.
Use concrete boxing imagery: the canvas, the bell, bruised knuckles, the corner stool,
the roar of the crowd, the taste of blood, heavy bags at dawn.
But create ENTIRELY NEW phrases — as if you are the unnamed fighter speaking from the heart.

${COPYRIGHT_GUARD}

Always respond in valid JSON format.`,

  'comeback-narrative': `You are an original motivational writer channelling comeback and redemption narratives.
Imagine someone who lost everything — career, respect, belief in themselves —
and clawed their way back through sheer will. They fell so far that people stopped watching.
Then they rebuilt, brick by brick, in silence.

Write in an introspective, cinematic voice that moves between vulnerability and steel.
Use imagery of empty arenas, early mornings alone, doors closing and opening,
scars as proof of survival, the quiet before the crowd returns.

${COPYRIGHT_GUARD}

Always respond in valid JSON format.`,

  'discipline-resilience': `You are an original motivational writer channelling pure discipline and resilience.
Imagine a person who does not rely on motivation — they rely on structure, routine,
and an unbreakable commitment to showing up. Rain or shine, tired or energised,
they do the work. Not because it feels good, but because they promised themselves.

Write in a calm, authoritative voice — like a mentor who has been through the fire
and speaks plainly. Use imagery of alarm clocks before dawn, empty gyms,
journals filled with tallies, callused hands, quiet consistency.

${COPYRIGHT_GUARD}

Always respond in valid JSON format.`,
};

// ── JSON Output Schema (shared across all themes) ─────────────

const JSON_SCHEMA = `
Respond in this exact JSON format:
{
  "quoteText": "<the original motivational quote, 1-3 sentences, punchy and memorable>",
  "theme": "<underdog-boxing | comeback-narrative | discipline-resilience>",
  "tone": "<gritty | reflective | stoic | intense | calm | dramatic>",
  "attribution": "<a fictional archetype description, e.g. 'A heavyweight before the 12th round'>",
  "tags": ["<3-5 thematic tags like 'perseverance', 'grit', 'self-belief'>"],
  "followUp": "<a brief 1-sentence motivational expansion or call-to-action>"
}`.trim();

// ── Public Exports ────────────────────────────────────────────

/**
 * Returns the system prompt for a given quote theme.
 * Falls back to `underdog-boxing` if the theme is unrecognised.
 */
export function getQuoteSystemPrompt(theme: QuoteTheme): string {
  return SYSTEM_PROMPTS[theme] ?? SYSTEM_PROMPTS['underdog-boxing'];
}

/**
 * Build the user-facing prompt for a motivational quote request.
 *
 * @param context.theme    - Which narrative archetype to use
 * @param context.mood     - User's current emotional state (optional)
 * @param context.tone     - Preferred delivery style (optional)
 * @param context.topic    - Specific focus like "failure", "training" (optional)
 * @param context.situation - Personal context like "lost my job" (optional)
 */
export function buildMotivationalQuotePrompt(context?: {
  theme?: QuoteTheme;
  mood?: string;
  tone?: QuoteTone;
  topic?: string;
  situation?: string;
}): string {
  const theme = context?.theme ?? 'underdog-boxing';

  const lines: string[] = [
    `Generate one powerful, ORIGINAL motivational quote in the "${theme}" style.`,
  ];

  if (context?.mood) {
    lines.push(`The reader's current mood: ${context.mood}`);
  }
  if (context?.tone) {
    lines.push(`Preferred delivery tone: ${context.tone}`);
  }
  if (context?.topic) {
    lines.push(`Topic or focus area: ${context.topic}`);
  }
  if (context?.situation) {
    lines.push(`Personal context: ${context.situation}`);
  }

  lines.push('');
  lines.push(JSON_SCHEMA);
  lines.push('');
  lines.push('Remember: the quote MUST be 100% original. No movie lines. No real names. No clichés.');

  return lines.join('\n');
}

// ── Convenience: generate prompt + system prompt pair ─────────

export interface QuotePromptPair {
  systemPrompt: string;
  userPrompt: string;
  theme: QuoteTheme;
}

/**
 * Returns both the system and user prompts, ready to send to a provider.
 *
 * Usage:
 * ```ts
 * const { systemPrompt, userPrompt, theme } = buildQuotePromptPair({
 *   theme: 'comeback-narrative',
 *   mood: 'exhausted',
 *   topic: 'failure',
 * });
 * const res = await aiRouter.generateText('motivational-quote', userPrompt, { systemPrompt });
 * ```
 */
export function buildQuotePromptPair(context?: {
  theme?: QuoteTheme;
  mood?: string;
  tone?: QuoteTone;
  topic?: string;
  situation?: string;
}): QuotePromptPair {
  const theme: QuoteTheme = context?.theme ?? 'underdog-boxing';
  return {
    systemPrompt: getQuoteSystemPrompt(theme),
    userPrompt: buildMotivationalQuotePrompt(context),
    theme,
  };
}
