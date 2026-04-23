import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropic } from '@/lib/ai/anthropic';
import { logAiUsage } from '@/lib/ai/usage';
import { env } from '@/lib/env';

/**
 * POST /api/ideas/[id]/postprocess
 *
 * Produce a short AI summary and suggest which categories / pain points / USPs
 * this idea relates to. The user reviews and accepts before it becomes a hook.
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

  // Load the taxonomies we'll match against.
  const [{ data: categories }, { data: painPoints }, { data: usps }] = await Promise.all([
    supabase.from('categories').select('id, slug, display_name, description'),
    supabase.from('pain_points').select('id, name, description'),
    supabase.from('usps').select('id, name, description').eq('status', 'active'),
  ]);

  const schema = {
    type: 'object',
    required: ['summary', 'category_ids', 'pain_point_ids', 'usp_ids', 'tags'],
    properties: {
      summary: { type: 'string', description: 'One Norwegian sentence that captures the idea.' },
      category_ids: { type: 'array', items: { type: 'string' } },
      pain_point_ids: { type: 'array', items: { type: 'string' } },
      usp_ids: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' } },
    },
  } as const;

  const systemPrompt = `You classify short Norwegian notes jotted down by Deniz, head of growth at Avia Produksjon AS. Avia targets Norwegian marketing managers. Your job is to:
1. Write a single Norwegian summary sentence (max 20 words).
2. Select category_ids that fit. Return 0–2. Empty array if none fit.
3. Select pain_point_ids the note addresses. Return 0–2.
4. Select usp_ids the note relates to. Return 0–2.
5. Propose 0–5 short kebab-case tags in Norwegian.
Return ONLY JSON matching the schema. No prose, no code fences.`;

  const userPrompt = `Idea:
"""
${idea.content}
"""

Categories (id, slug, name, description):
${(categories ?? []).map((c) => `- ${c.id} | ${c.slug} | ${c.display_name} | ${c.description ?? ''}`).join('\n') || '(none)'}

Pain points (id, name, description):
${(painPoints ?? []).map((p) => `- ${p.id} | ${p.name} | ${p.description}`).join('\n') || '(none)'}

USPs (id, name, description):
${(usps ?? []).map((u) => `- ${u.id} | ${u.name} | ${u.description}`).join('\n') || '(none)'}

Return JSON matching: ${JSON.stringify(schema)}`;

  const anthropic = getAnthropic();
  const model = env.CLAUDE_MODEL_HAIKU;
  const msg = await anthropic.messages.create({
    model,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
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

  // Extract the JSON text.
  const textBlock = msg.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return NextResponse.json({ error: 'no text in model response' }, { status: 502 });
  }

  let parsed: {
    summary: string;
    category_ids: string[];
    pain_point_ids: string[];
    usp_ids: string[];
    tags: string[];
  };
  try {
    parsed = JSON.parse(textBlock.text.trim());
  } catch {
    return NextResponse.json({ error: 'model returned non-JSON', raw: textBlock.text }, { status: 502 });
  }

  const validCategoryIds = new Set((categories ?? []).map((c) => c.id));
  const validPainPointIds = new Set((painPoints ?? []).map((p) => p.id));
  const validUspIds = new Set((usps ?? []).map((u) => u.id));

  const update = {
    ai_summary: parsed.summary ?? null,
    suggested_category_ids: (parsed.category_ids ?? []).filter((id) => validCategoryIds.has(id)),
    suggested_pain_point_ids: (parsed.pain_point_ids ?? []).filter((id) => validPainPointIds.has(id)),
    suggested_usp_ids: (parsed.usp_ids ?? []).filter((id) => validUspIds.has(id)),
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
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
