import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@shared/db-types';

/**
 * POST /api/suggestions/[id]/choose
 *
 * Marks a suggestion as chosen, creates a Post row as a draft with the chosen
 * body, flips used hooks' status to 'used', inserts post_categories rows
 * (primary + secondaries), logs an Event, and returns the new post.
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

  // Load suggestion + its sibling suggestions from the same generation.
  const { data: suggestion, error: suggestionError } = await supabase
    .from('suggestions')
    .select('*')
    .eq('id', params.id)
    .single();
  if (suggestionError || !suggestion) {
    return NextResponse.json({ error: 'suggestion not found' }, { status: 404 });
  }

  const meta = (suggestion.generator_meta ?? {}) as {
    hook_ids?: string[];
    primary_category_id?: string;
    secondary_category_ids?: string[];
    cta_mode?: 'none' | 'soft' | 'direct';
  };
  if (!meta.primary_category_id) {
    return NextResponse.json(
      { error: 'suggestion missing generator_meta.primary_category_id' },
      { status: 500 },
    );
  }

  const hookIds = Array.isArray(meta.hook_ids) ? meta.hook_ids : [];

  // Create the Post row.
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      primary_category_id: meta.primary_category_id,
      persona_id: suggestion.persona_id,
      hook_ids: hookIds,
      status: 'draft',
      body: suggestion.body,
      cta_mode: meta.cta_mode ?? 'none',
    })
    .select()
    .single();
  if (postError || !post) {
    return NextResponse.json({ error: postError?.message ?? 'insert failed' }, { status: 500 });
  }

  // Insert post_categories rows.
  const secondaryIds = (meta.secondary_category_ids ?? []).filter(
    (id) => id !== meta.primary_category_id,
  );
  const categoryRows = [
    { post_id: post.id, category_id: meta.primary_category_id, is_primary: true },
    ...secondaryIds.map((id) => ({ post_id: post.id, category_id: id, is_primary: false })),
  ];
  await supabase.from('post_categories').insert(categoryRows);

  // Mark the suggestion and its siblings.
  await supabase
    .from('suggestions')
    .update({ chosen: true, chosen_at: new Date().toISOString() })
    .eq('id', suggestion.id);

  // Flip hooks to 'used'.
  if (hookIds.length > 0) {
    await supabase.from('hooks').update({ status: 'used' }).in('id', hookIds);
  }

  // Log a learning event.
  await supabase.from('events').insert({
    user_id: user.id,
    type: 'suggestion_chosen',
    actor: 'user',
    ref_type: 'suggestion',
    ref_id: suggestion.id,
    payload: {
      generation_id: suggestion.generation_id,
      persona_id: suggestion.persona_id,
      post_id: post.id,
      hook_ids: hookIds,
    } satisfies Record<string, Json>,
  });

  return NextResponse.json({ post });
}

export const runtime = 'nodejs';
