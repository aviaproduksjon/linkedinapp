import 'server-only';
import { getAnthropic } from './anthropic';
import { env } from '@/lib/env';

/**
 * LinkedIn algorithm filter / scorer.
 *
 * Rates a post body on six dimensions for Norwegian B2B LinkedIn:
 *   - hook:          opening 2 lines' pull
 *   - rhythm:        readability, line-break rhythm
 *   - commentability: likelihood of prompting real comments (not just likes)
 *   - risk:          inverted — 1.0 = low risk of LinkedIn suppression
 *   - relevance:     fit for Norwegian marketing managers
 *   - authenticity:  sounds human, not AI
 *
 * Returns dimension scores + summary. See docs/13-algoritmefilter-tuner.md
 * §3 and docs/17-post-genereringsarkitektur.md step 7.
 */

import type Anthropic from '@anthropic-ai/sdk';

export interface FilterDimensions {
  hook: number;
  rhythm: number;
  commentability: number;
  risk: number;
  relevance: number;
  authenticity: number;
}

export interface FilterResult {
  total_score: number;
  dimensions: FilterDimensions;
  summary: string;
  strengths: string[];
  risks: string[];
  input_tokens: number;
  output_tokens: number;
}

export interface FilterContext {
  body: string;
  category_display_name: string;
  pain_point_name?: string | null;
  hook_source_types: string[];
  algorithm_insights: Array<{ section: string; bullets: string[] }>;
}

/** Average the six dimensions with authenticity and hook weighted a bit higher. */
function weightedTotal(d: FilterDimensions): number {
  const total =
    d.hook * 1.2 +
    d.rhythm * 1.0 +
    d.commentability * 1.1 +
    d.risk * 1.0 +
    d.relevance * 1.1 +
    d.authenticity * 1.2;
  const weight = 1.2 + 1.0 + 1.1 + 1.0 + 1.1 + 1.2;
  return Math.max(0, Math.min(1, total / weight));
}

export async function scorePost(ctx: FilterContext): Promise<FilterResult> {
  const anthropic = getAnthropic();
  const model = env.CLAUDE_MODEL_SONNET;

  const systemPrompt = `You are the LinkedIn algorithm scorer for Norwegian B2B marketing content. Score the provided post on six dimensions (0.0–1.0).

Dimensions:
- hook: Do the first two lines (before "… se mer") pull a reader in?
- rhythm: Paragraphs, line breaks, sentence flow. Avoid wall-of-text.
- commentability: Does it prompt real comments, not just thumbs-up reactions?
- risk: INVERTED. 1.0 = low risk of LinkedIn suppression. Deduct for external links, excess hashtags, over-tagging, aggressive CTAs, repost-style formatting, or anything the LinkedIn ranking system tends to penalise.
- relevance: Fit for Norwegian marketing managers (budget pressure, effect docs, internal selling, agency relations).
- authenticity: Sounds like a human wrote it. Penalise AI tells: "I en verden der…", hollow enthusiasm, listicle format, generic advice without stakes.

Weight authenticity and hook highest.

You MUST call the save_score tool. Do not reply in plain text.

Return notes.strengths and notes.risks as 0–3 short Norwegian bullets each.`;

  const hookTypesNote =
    ctx.hook_source_types.length > 0
      ? `Hook source types: ${ctx.hook_source_types.join(', ')}. ` +
        (ctx.hook_source_types.includes('idea_bank')
          ? 'This post is grounded in a personal idea from the user. Weight authenticity higher.'
          : '')
      : '';

  const userPrompt = `Post body:
"""
${ctx.body}
"""

Context:
- Primary category: ${ctx.category_display_name}
- Pain point: ${ctx.pain_point_name ?? '(none set)'}
- ${hookTypesNote}

Active algorithm insights:
${ctx.algorithm_insights
  .map((i) => `[${i.section}]\n${i.bullets.map((b) => `  - ${b}`).join('\n')}`)
  .join('\n')}`;

  const tools = [
    {
      name: 'save_score',
      description: 'Record the six-dimension score and notes for this post.',
      input_schema: {
        type: 'object',
        required: ['dimensions', 'summary'],
        properties: {
          dimensions: {
            type: 'object',
            required: ['hook', 'rhythm', 'commentability', 'risk', 'relevance', 'authenticity'],
            properties: {
              hook: { type: 'number', minimum: 0, maximum: 1 },
              rhythm: { type: 'number', minimum: 0, maximum: 1 },
              commentability: { type: 'number', minimum: 0, maximum: 1 },
              risk: { type: 'number', minimum: 0, maximum: 1 },
              relevance: { type: 'number', minimum: 0, maximum: 1 },
              authenticity: { type: 'number', minimum: 0, maximum: 1 },
            },
          },
          summary: { type: 'string' },
          strengths: { type: 'array', items: { type: 'string' }, maxItems: 3 },
          risks: { type: 'array', items: { type: 'string' }, maxItems: 3 },
        },
      },
    },
  ] as const;

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [...tools],
    tool_choice: { type: 'tool', name: 'save_score' },
  });

  const toolUse = msg.content.find(
    (b): b is Extract<(typeof msg.content)[number], { type: 'tool_use' }> =>
      b.type === 'tool_use' && b.name === 'save_score',
  );
  if (!toolUse) {
    throw new Error('filter: model did not call save_score');
  }
  const input = toolUse.input as {
    dimensions?: Partial<FilterDimensions>;
    summary?: unknown;
    strengths?: unknown;
    risks?: unknown;
  };

  const dims: FilterDimensions = {
    hook: clamp(input.dimensions?.hook),
    rhythm: clamp(input.dimensions?.rhythm),
    commentability: clamp(input.dimensions?.commentability),
    risk: clamp(input.dimensions?.risk),
    relevance: clamp(input.dimensions?.relevance),
    authenticity: clamp(input.dimensions?.authenticity),
  };

  return {
    total_score: weightedTotal(dims),
    dimensions: dims,
    summary: typeof input.summary === 'string' ? input.summary : '',
    strengths: asStringArray(input.strengths).slice(0, 3),
    risks: asStringArray(input.risks).slice(0, 3),
    input_tokens: msg.usage.input_tokens,
    output_tokens: msg.usage.output_tokens,
  };
  void ({} as Anthropic);
}

function clamp(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
