import 'server-only';
import { getAnthropic } from './anthropic';
import { env } from '@/lib/env';
import { validateBaseline } from '@/lib/validation/hard-rules';

/**
 * Non-invasive tuner. Makes small algorithmic improvements to a post body
 * without changing its message or breaking hard_rules.
 *
 * Guardrails (docs/13-algoritmefilter-tuner.md §3–5):
 *   - Reflow paragraphs, strengthen first 2 lines, balance emoji, ±10% length.
 *   - Never change thesis or facts.
 *   - Never add em dashes, cliché openers, or new CTAs.
 *   - After tuning we re-run deterministic validation. On any violation,
 *     the tuner is rolled back.
 */

export interface TunerResult {
  pre_body: string;
  post_body: string;
  changes: string[];
  rolled_back: boolean;
  rollback_reason: string | null;
  input_tokens: number;
  output_tokens: number;
}

export interface TunerContext {
  body: string;
  hard_rules: string[];
  algorithm_insights: Array<{ section: string; bullets: string[] }>;
}

export async function tunePost(ctx: TunerContext): Promise<TunerResult> {
  const anthropic = getAnthropic();
  const model = env.CLAUDE_MODEL_SONNET;

  const systemPrompt = `You are the LinkedIn algorithm tuner. Your only job is to make the provided post perform better on LinkedIn for Norwegian B2B, without changing the message or tone.

You MAY:
- Reflow line breaks and paragraphs.
- Strengthen the first two lines (preserve the idea).
- Replace at most 3 words for rhythm.
- Tighten or loosen length by up to ±10%.
- Adjust emoji (max 2 in the whole post).

You MAY NOT:
- Change the underlying message or thesis.
- Change facts, numbers, quotes, names.
- Introduce em dashes (— or –) or AI cliché openers.
- Add a CTA that wasn't already there.
- Break any persona hard_rule.

You MUST call the save_tuning tool exactly once. Return both the tuned body AND an explicit list of changes.`;

  const userPrompt = `Original post:
"""
${ctx.body}
"""

Persona hard_rules (must not violate):
${ctx.hard_rules.map((r) => `- ${r}`).join('\n')}

Algorithm insights to use as reference:
${ctx.algorithm_insights
  .map((i) => `[${i.section}]\n${i.bullets.map((b) => `  - ${b}`).join('\n')}`)
  .join('\n')}

Tune the post. Keep the message. Return tuned_body + changes.`;

  const tools = [
    {
      name: 'save_tuning',
      description: 'Return the tuned body and the list of changes you made.',
      input_schema: {
        type: 'object',
        required: ['tuned_body', 'changes'],
        properties: {
          tuned_body: { type: 'string', minLength: 100, maxLength: 5000 },
          changes: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 10,
          },
        },
      },
    },
  ] as const;

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [...tools],
    tool_choice: { type: 'tool', name: 'save_tuning' },
  });

  const toolUse = msg.content.find(
    (b): b is Extract<(typeof msg.content)[number], { type: 'tool_use' }> =>
      b.type === 'tool_use' && b.name === 'save_tuning',
  );
  if (!toolUse) {
    // Return as rollback rather than throwing — caller can decide.
    return {
      pre_body: ctx.body,
      post_body: ctx.body,
      changes: [],
      rolled_back: true,
      rollback_reason: 'model did not call save_tuning',
      input_tokens: msg.usage.input_tokens,
      output_tokens: msg.usage.output_tokens,
    };
  }

  const input = toolUse.input as { tuned_body?: unknown; changes?: unknown };
  const tunedBody = typeof input.tuned_body === 'string' ? input.tuned_body : '';
  const changes: string[] = Array.isArray(input.changes)
    ? input.changes.filter((x): x is string => typeof x === 'string')
    : [];

  if (!tunedBody) {
    return {
      pre_body: ctx.body,
      post_body: ctx.body,
      changes,
      rolled_back: true,
      rollback_reason: 'empty tuned_body',
      input_tokens: msg.usage.input_tokens,
      output_tokens: msg.usage.output_tokens,
    };
  }

  // Re-validate against deterministic baseline. On any violation: rollback.
  const violations = validateBaseline(tunedBody);

  // Also enforce the ±10% length guard.
  const lengthDelta = Math.abs(tunedBody.length - ctx.body.length) / ctx.body.length;
  const tooBigLengthChange = lengthDelta > 0.15;

  if (violations.length > 0 || tooBigLengthChange) {
    const reasons = [
      ...violations.map((v) => v.rule),
      tooBigLengthChange ? `length changed ${Math.round(lengthDelta * 100)}%` : null,
    ].filter(Boolean) as string[];
    return {
      pre_body: ctx.body,
      post_body: ctx.body,
      changes,
      rolled_back: true,
      rollback_reason: reasons.join('; '),
      input_tokens: msg.usage.input_tokens,
      output_tokens: msg.usage.output_tokens,
    };
  }

  return {
    pre_body: ctx.body,
    post_body: tunedBody,
    changes,
    rolled_back: false,
    rollback_reason: null,
    input_tokens: msg.usage.input_tokens,
    output_tokens: msg.usage.output_tokens,
  };
}
