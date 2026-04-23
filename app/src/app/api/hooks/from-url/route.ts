import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAnthropic } from '@/lib/ai/anthropic';
import { logAiUsage } from '@/lib/ai/usage';
import { env } from '@/lib/env';
import { extractReadableText, fetchPage, FetchError } from '@/lib/http/fetch-page';

const Body = z.object({
  url: z.string().url(),
  user_note: z.string().max(500).optional(),
});

/**
 * POST /api/hooks/from-url
 *
 * Fetch a URL, extract readable text, classify it against the user's
 * categories and pain points via Claude Haiku (tool-use), and insert a
 * Hook row.
 *
 * This is the "lim inn en lenke"-shortcut from docs/04-integrasjoner.md.
 * No scheduled fetchers needed — just manual paste.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: 'invalid body', details: String(err) }, { status: 400 });
  }

  // Ensure we have a "manual" Source row for the user — hooks reference one.
  let manualSourceId: string;
  {
    const { data: existing } = await supabase
      .from('sources')
      .select('id')
      .eq('type', 'manual')
      .limit(1)
      .maybeSingle();
    if (existing) {
      manualSourceId = existing.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('sources')
        .insert({
          user_id: user.id,
          type: 'manual',
          name: 'Manuell URL',
          active: true,
        })
        .select('id')
        .single();
      if (insertError || !inserted) {
        return NextResponse.json(
          { error: 'could not create manual source', details: insertError?.message },
          { status: 500 },
        );
      }
      manualSourceId = inserted.id;
    }
  }

  let page;
  try {
    page = await fetchPage(body.url);
  } catch (err) {
    const details =
      err instanceof FetchError ? err.message : err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'could not fetch url', details },
      { status: 502 },
    );
  }

  const text = extractReadableText(page.html).slice(0, 10_000);
  const title = extractTitle(page.html);

  const [{ data: categories }, { data: painPoints }] = await Promise.all([
    supabase.from('categories').select('id, slug, display_name, description'),
    supabase.from('pain_points').select('id, name, description'),
  ]);

  const validCategoryIds = new Set((categories ?? []).map((c) => c.id));
  const validPainIds = new Set((painPoints ?? []).map((p) => p.id));

  const anthropic = getAnthropic();
  const model = env.CLAUDE_MODEL_HAIKU;

  const systemPrompt = `You classify a news/report page for Deniz at Avia Produksjon AS. Target audience is Norwegian marketing managers. You MUST call the classify_hook tool exactly once.

For relevance_score (0.0–1.0): how relevant is this content for writing LinkedIn posts to our audience? 1.0 = directly relevant insight; 0.5 = tangential; below 0.3 = skip.

Keep the summary short (max 40 Norwegian words), factual, and pointed. The summary becomes the hook that future post generation anchors to — it must capture the "what" and "so what", not marketing language.`;

  const userPrompt = `URL: ${body.url}
Title: ${title ?? '(unknown)'}
User note: ${body.user_note ?? '(none)'}

Categories (pick 0–2 ids from this list only):
${(categories ?? []).map((c) => `- ${c.id} | ${c.slug} | ${c.display_name} | ${c.description ?? ''}`).join('\n') || '(none)'}

Pain points (pick 0–2 ids from this list only):
${(painPoints ?? []).map((p) => `- ${p.id} | ${p.name} | ${p.description}`).join('\n') || '(none)'}

Page text:
"""
${text}
"""`;

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [
      {
        name: 'classify_hook',
        description: 'Record a short summary and classification of the given page.',
        input_schema: {
          type: 'object',
          required: ['summary', 'relevance_score', 'category_ids', 'pain_point_ids'],
          properties: {
            summary: { type: 'string', description: 'Norwegian, max 40 words, factual.' },
            relevance_score: { type: 'number', minimum: 0, maximum: 1 },
            category_ids: { type: 'array', items: { type: 'string' }, maxItems: 2 },
            pain_point_ids: { type: 'array', items: { type: 'string' }, maxItems: 2 },
            title: { type: 'string', description: 'Cleaned-up title if the scraped one is noisy.' },
          },
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'classify_hook' },
  });

  await logAiUsage({
    userId: user.id,
    model,
    module: 'classifier',
    input_tokens: msg.usage.input_tokens,
    output_tokens: msg.usage.output_tokens,
    ref_type: 'hook',
  });

  const toolUse = msg.content.find(
    (b): b is Extract<(typeof msg.content)[number], { type: 'tool_use' }> => b.type === 'tool_use',
  );
  if (!toolUse) {
    return NextResponse.json({ error: 'model did not call classify_hook' }, { status: 502 });
  }

  const input = toolUse.input as {
    summary?: unknown;
    relevance_score?: unknown;
    category_ids?: unknown;
    pain_point_ids?: unknown;
    title?: unknown;
  };

  const asString = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const asNumber = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

  const summary = asString(input.summary);
  if (!summary) {
    return NextResponse.json({ error: 'model returned empty summary' }, { status: 502 });
  }

  const categoryIds = asStringArray(input.category_ids).filter((id) => validCategoryIds.has(id));
  const painIds = asStringArray(input.pain_point_ids).filter((id) => validPainIds.has(id));
  const relevance = asNumber(input.relevance_score);
  const cleanedTitle = asString(input.title) || title || null;

  const { data: hook, error: insertError } = await supabase
    .from('hooks')
    .insert({
      user_id: user.id,
      source_id: manualSourceId,
      url: page.finalUrl,
      title: cleanedTitle,
      summary,
      raw_content: text.slice(0, 5_000),
      category_ids: categoryIds,
      relevance_score: relevance,
      status: 'new',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    hook,
    matched_pain_point_ids: painIds,
  });
}

function extractTitle(html: string): string | null {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (og) return og.trim();
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return title?.trim() ?? null;
}

export const runtime = 'nodejs';
export const maxDuration = 60;
