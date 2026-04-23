import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const Body = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(300).nullable(),
  summary: z.string().min(1).max(1000),
  category_ids: z.array(z.string().uuid()).max(3).default([]),
  relevance_score: z.number().min(0).max(1).nullable().optional(),
  query: z.string().max(500).optional(),
});

/**
 * POST /api/hooks/save-candidate
 *
 * Persist a candidate surfaced by /api/hooks/discover. No re-fetching or
 * re-classification — the candidate already went through Sonnet, so we just
 * validate ids server-side (belt + suspenders on top of RLS) and insert.
 *
 * The Source row for web_search is found-or-created on the fly. The query
 * is stashed in fetch_config so we can see which search produced this hook.
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

  // Validate category ids against user's taxonomy.
  const { data: categories } = await supabase.from('categories').select('id');
  const validCategoryIds = new Set((categories ?? []).map((c) => c.id));
  const categoryIds = body.category_ids.filter((id) => validCategoryIds.has(id));

  // Find or create the web_search Source row for the user.
  let sourceId: string;
  {
    const { data: existing } = await supabase
      .from('sources')
      .select('id')
      .eq('type', 'web_search')
      .limit(1)
      .maybeSingle();
    if (existing) {
      sourceId = existing.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('sources')
        .insert({
          user_id: user.id,
          type: 'web_search',
          name: 'Web-søk',
          active: true,
          fetch_config: { last_query: body.query ?? null },
        })
        .select('id')
        .single();
      if (insertError || !inserted) {
        return NextResponse.json(
          { error: 'could not create web_search source', details: insertError?.message },
          { status: 500 },
        );
      }
      sourceId = inserted.id;
    }
  }

  // Guard against duplicate saves: if the user already has a hook with this URL, return it.
  const { data: duplicate } = await supabase
    .from('hooks')
    .select('*')
    .eq('url', body.url)
    .maybeSingle();
  if (duplicate) {
    return NextResponse.json({ hook: duplicate, duplicate: true });
  }

  const { data: hook, error: hookError } = await supabase
    .from('hooks')
    .insert({
      user_id: user.id,
      source_id: sourceId,
      url: body.url,
      title: body.title,
      summary: body.summary,
      category_ids: categoryIds,
      relevance_score: body.relevance_score ?? null,
      status: 'new',
    })
    .select()
    .single();

  if (hookError) {
    return NextResponse.json({ error: hookError.message }, { status: 500 });
  }

  return NextResponse.json({ hook, duplicate: false });
}

export const runtime = 'nodejs';
