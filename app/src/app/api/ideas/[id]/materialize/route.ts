import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/ideas/[id]/materialize
 *
 * Turn an Idea into a Hook. Copies content + ai_summary into a new hook row
 * with source_type reaching the Idea via idea_id. The Idea stays in the bank
 * (status -> 'used') so the original formulation is preserved.
 *
 * See docs/18-ide-bank.md §4 — idea becomes a hook, rest of pipeline treats
 * it uniformly.
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
    .select('id, content, ai_summary, suggested_category_ids, used_in_post_ids')
    .eq('id', params.id)
    .single();
  if (ideaError || !idea) {
    return NextResponse.json({ error: 'idea not found' }, { status: 404 });
  }

  // Find or create a "idea_bank" Source row.
  let ideaBankSourceId: string;
  {
    const { data: existing } = await supabase
      .from('sources')
      .select('id')
      .eq('type', 'idea_bank')
      .limit(1)
      .maybeSingle();
    if (existing) {
      ideaBankSourceId = existing.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('sources')
        .insert({
          user_id: user.id,
          type: 'idea_bank',
          name: 'Ide-bank',
          active: true,
        })
        .select('id')
        .single();
      if (insertError || !inserted) {
        return NextResponse.json(
          { error: 'could not create idea_bank source', details: insertError?.message },
          { status: 500 },
        );
      }
      ideaBankSourceId = inserted.id;
    }
  }

  const summary = idea.ai_summary ?? idea.content.slice(0, 300);

  const { data: hook, error: hookError } = await supabase
    .from('hooks')
    .insert({
      user_id: user.id,
      source_id: ideaBankSourceId,
      idea_id: idea.id,
      url: null,
      title: null,
      summary,
      raw_content: idea.content,
      category_ids: idea.suggested_category_ids ?? [],
      status: 'new',
    })
    .select()
    .single();

  if (hookError) {
    return NextResponse.json({ error: hookError.message }, { status: 500 });
  }

  // Mark the idea as used.
  await supabase
    .from('ideas')
    .update({ status: 'used' })
    .eq('id', idea.id);

  return NextResponse.json({ hook });
}

export const runtime = 'nodejs';
