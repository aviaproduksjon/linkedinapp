import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { getAnthropic } from '@/lib/ai/anthropic';
import { logAiUsage } from '@/lib/ai/usage';
import { env } from '@/lib/env';

/**
 * POST /api/hooks/discover
 *
 * Topic-driven hook discovery. The user describes what they're looking for
 * (a pain point, a news beat, a rough idea). Claude Sonnet runs web_search
 * — prioritising a Norwegian B2B allow-list first, then broadening — and
 * then calls a propose_candidates tool with 3–6 structured candidates.
 *
 * No rows are written here. The user reviews the candidates and saves the
 * ones they want via POST /api/hooks/save-candidate.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const Body = z.object({
    query: z.string().min(3).max(500),
    limit: z.number().int().min(2).max(8).default(5),
  });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: 'invalid body', details: String(err) }, { status: 400 });
  }

  const [{ data: categories }, { data: painPoints }] = await Promise.all([
    supabase.from('categories').select('id, slug, display_name, description'),
    supabase.from('pain_points').select('id, name, description'),
  ]);

  const validCategoryIds = new Set((categories ?? []).map((c) => c.id));
  const validPainIds = new Set((painPoints ?? []).map((p) => p.id));

  const anthropic = getAnthropic();
  const model = env.CLAUDE_MODEL_SONNET;

  // Priority sources to search first. Claude's web_search tool will still
  // broaden globally if these don't yield enough quality results.
  const PRIORITY_DOMAINS = [
    'kampanje.com',
    'kreativtforum.no',
    'dn.no',
    'anfo.no',
    'nielsen.com',
    'mediebyraaene.no',
    'marketingweek.com',
    'adage.com',
  ];

  const systemPrompt = `You are Deniz's research assistant. Deniz works at Avia Produksjon AS in Oslo. Avia writes LinkedIn posts for an audience of Norwegian marketing managers.

Given a topical query (possibly rough prose or a list of keywords), your job is to:
1. Use the web_search tool to find 3–6 strong candidate articles, reports or studies that could anchor a future post.
2. Prefer these Norwegian industry sources first: ${PRIORITY_DOMAINS.slice(0, 6).join(', ')}. If fewer than 3 strong hits appear, broaden globally.
3. Skip pure SEO spam, listicles without data, company blogs that are thinly disguised ads, and anything paywalled without a useful excerpt.
4. After searching, call the propose_candidates tool exactly once with your selected candidates.

For each candidate include:
- url: the exact URL
- title: article title
- summary: 1–2 Norwegian sentences capturing the factual core (the "what" and "so what"). Max 40 words.
- why_relevant: one Norwegian sentence on why this matters for Norwegian marketing managers.
- category_ids: 0–2 ids from the provided list.
- pain_point_ids: 0–2 ids from the provided list.
- relevance_score: 0.0–1.0.

Never reply in plain text. If you can't find anything useful, still call propose_candidates with an empty array.`;

  const userPrompt = `Query:
"""
${body.query}
"""

Return up to ${body.limit} candidates.

Available categories (pick ids from this list only):
${(categories ?? [])
  .map((c) => `- ${c.id} | ${c.slug} | ${c.display_name} | ${c.description ?? ''}`)
  .join('\n') || '(none)'}

Available pain points (pick ids from this list only):
${(painPoints ?? []).map((p) => `- ${p.id} | ${p.name} | ${p.description}`).join('\n') || '(none)'}`;

  let msg: Anthropic.Messages.Message;
  try {
    // Cast to any for the call because the SDK types lag behind
    // web_search_20250305. We assert Message on the result.
    const request = {
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      tools: [
        // Anthropic's server-side web search tool.
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 4,
        },
        // Our custom output tool.
        {
          name: 'propose_candidates',
          description: 'Return the final list of candidate hooks for the user to review.',
          input_schema: {
            type: 'object',
            required: ['candidates'],
            properties: {
              candidates: {
                type: 'array',
                maxItems: 8,
                items: {
                  type: 'object',
                  required: ['url', 'title', 'summary'],
                  properties: {
                    url: { type: 'string' },
                    title: { type: 'string' },
                    summary: { type: 'string' },
                    why_relevant: { type: 'string' },
                    category_ids: { type: 'array', items: { type: 'string' }, maxItems: 2 },
                    pain_point_ids: { type: 'array', items: { type: 'string' }, maxItems: 2 },
                    relevance_score: { type: 'number', minimum: 0, maximum: 1 },
                  },
                },
              },
            },
          },
        },
      ],
      tool_choice: { type: 'auto' },
    };
    // Cast the whole `messages` sub-client via unknown so the call preserves
    // its `this` binding — extracting `.create` as a standalone reference
    // breaks the SDK's internal `this._client` lookup.
    const messages = anthropic.messages as unknown as {
      create: (body: unknown) => Promise<Anthropic.Messages.Message>;
    };
    msg = await messages.create(request);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'search failed', details },
      { status: 502 },
    );
  }

  await logAiUsage({
    userId: user.id,
    model,
    module: 'research',
    input_tokens: msg.usage.input_tokens,
    output_tokens: msg.usage.output_tokens,
    ref_type: 'hook_discovery',
  });

  const toolUse = msg.content.find(
    (b): b is Extract<(typeof msg.content)[number], { type: 'tool_use' }> =>
      b.type === 'tool_use' && b.name === 'propose_candidates',
  );
  if (!toolUse) {
    return NextResponse.json(
      {
        error: 'model did not call propose_candidates',
        stop_reason: msg.stop_reason,
      },
      { status: 502 },
    );
  }

  const input = toolUse.input as {
    candidates?: Array<{
      url?: unknown;
      title?: unknown;
      summary?: unknown;
      why_relevant?: unknown;
      category_ids?: unknown;
      pain_point_ids?: unknown;
      relevance_score?: unknown;
    }>;
  };

  const asString = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const asNumber = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

  const candidates = (input.candidates ?? [])
    .map((c) => {
      const url = asString(c.url);
      let safeUrl: string | null = null;
      try {
        if (url) {
          const parsed = new URL(url);
          if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            safeUrl = parsed.toString();
          }
        }
      } catch {
        safeUrl = null;
      }
      return {
        url: safeUrl,
        title: asString(c.title).slice(0, 300),
        summary: asString(c.summary).slice(0, 500),
        why_relevant: asString(c.why_relevant).slice(0, 300),
        category_ids: asStringArray(c.category_ids).filter((id) => validCategoryIds.has(id)),
        pain_point_ids: asStringArray(c.pain_point_ids).filter((id) => validPainIds.has(id)),
        relevance_score: asNumber(c.relevance_score),
      };
    })
    .filter((c) => c.url && c.title && c.summary)
    .slice(0, body.limit);

  return NextResponse.json({ query: body.query, candidates });
}

export const runtime = 'nodejs';
export const maxDuration = 90;
