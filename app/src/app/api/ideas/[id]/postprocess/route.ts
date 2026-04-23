import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropic } from '@/lib/ai/anthropic';
import { logAiUsage } from '@/lib/ai/usage';
import { env } from '@/lib/env';

/**
 * POST /api/ideas/[id]/postprocess
 *
 * Uses Anthropic tool-use to force structured output: the model is given a
 * single "save_classification" tool and must call it. No free-form text,
 * no JSON-inside-markdown to parse.
 *
 * Phase 2. See docs/18-ide-bank.md §3.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('id, content')
    .eq('id', params.id)
    .single();
  if (ideaError || !idea) {
    return NextResponse.json({ error: 'idea not found' }, { status: 404 });
  }

  const [{ data: categories }, { data: painPoints }, { data: usps }] = await Promise.all([
    supabase.from('categories').select('id, slug, display_name, description'),
    supabase.from('pain_points').select('id, name, description'),
    supabase.from('usps').select('id, name, description').eq('status', 'active'),
  ]);

  const validCategoryIds = new Set((categories ?? []).map((c) => c.id));
  const validPainPointIds = new Set((painPoints ?? []).map((p) => p.id));
  const validUspIds = new Set((usps ?? []).map((u) => u.id));

  const systemPrompt = `You classify short Norwegian notes written by Deniz, head of growth at Avia Produksjon AS. Avia targets Norwegian marketing managers. You MUST call the save_classification tool exactly once. Never reply in plain text.

Rules:
- summary: one Norwegian sentence, max 20 words, capturing the core idea.
- category_ids: 0–2 ids from the provided list. Pick the ones that fit best. Empty array if none fit.
- pain_point_ids: 0–2 ids from the provided list.
- usp_ids: 0–2 ids from the provided list (may be empty if no USPs are provided).
- tags: 0–5 short kebab-case Norwegian tags.
Only return ids that appear verbatim in the provided lists.`;

  const userPrompt = `Idea:
"""
${idea.content}
"""

Available categories (pick ids from this list only):
${(categories ?? []).map((c) => `- ${c.id} | ${c.slug} | ${c.display_name} | ${c.description ?? ''}`).join('\n') || '(none)'}

Available pain points (pick ids from this list only):
${(painPoints ?? []).map((p) => `- ${p.id} | ${p.name} | ${p.description}`).join('\n') || '(none)'}

Available USPs (pick ids from this list only):
${(usps ?? []).map((u) => `- ${u.id} | ${u.name} | ${u.description}`).join('\n') || '(none)'}`;

  const anthropic = getAnthropic();
  const model = env.CLAUDE_MODEL_HAIKU;

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [
      {
        name: 'save_classification',
        description: 'Save the summary, suggested category/pain-point/USP ids and tags for this idea.',
        input_schema: {
          type: 'object',
          required: ['summary', 'category_ids', 'pain_point_ids', 'usp_ids', 'tags'],
          properties: {
            summary: { type: 'string', description: 'One Norwegian sentence, max 20 words.' },
            category_ids: { type: 'array', items: { type: 'string' }, maxItems: 2 },
            pain_point_ids: { type: 'array', items: { type: 'string' }, maxItems: 2 },
            usp_ids: { type: 'array', items: { type: 'string' }, maxItems: 2 },
            tags: { type: 'array', items: { type: 'string' }, maxItems: 5 },
          },
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'save_classification' },
  });

  // Log usage regardless of parse result.
  await logAiUsage({
    userId: user.id,
    model,
    module: 'idea_postprocess',
    input_tokens: msg.usage.input_tokens,
    output_tokens: msg.usage.output_tokens,
    ref_type: 'idea',
    ref_id: idea.id,
  });

  // Find the tool_use block.
  const toolUse = msg.content.find(
    (b): b is Extract<(typeof msg.content)[number], { type: 'tool_use' }> => b.type === 'tool_use',
  );
  if (!toolUse) {
    return NextResponse.json(
      {
        error: 'model did not call the save_classification tool',
        raw: msg.content.map((b) => (b.type === 'text' ? b.text : `[${b.type}]`)).join('\n'),
      },
      { status: 502 },
    );
  }

  const input = toolUse.input as {
    summary?: unknown;
    category_ids?: unknown;
    pain_point_ids?: unknown;
    usp_ids?: unknown;
    tags?: unknown;
  };

  const summary = typeof input.summary === 'string' ? input.summary : null;
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

  const update = {
    ai_summary: summary,
    suggested_category_ids: asStringArray(input.category_ids).filter((id) =>
      validCategoryIds.has(id),
    ),
    suggested_pain_point_ids: asStringArray(input.pain_point_ids).filter((id) =>
      validPainPointIds.has(id),
    ),
    suggested_usp_ids: asStringArray(input.usp_ids).filter((id) => validUspIds.has(id)),
    tags: asStringArray(input.tags).slice(0, 10),
    status: 'refined' as const,
  };

  const { data: updated, error: updateError } = await supabase
    .from('ideas')
    .update(update)
    .eq('id', idea.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ idea: updated });
}

export const runtime = 'nodejs';
export const maxDuration = 30;
