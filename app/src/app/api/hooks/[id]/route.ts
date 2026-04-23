import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { TablesUpdate } from '@shared/db-types';

const PatchBody = z.object({
  summary: z.string().min(1).max(1000).optional(),
  title: z.string().max(300).nullable().optional(),
  status: z.enum(['new', 'reviewed', 'used', 'archived']).optional(),
  category_ids: z.array(z.string().uuid()).max(3).optional(),
  relevance_score: z.number().min(0).max(1).nullable().optional(),
});

/** PATCH /api/hooks/[id] — edit or change status. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let patch: z.infer<typeof PatchBody>;
  try {
    patch = PatchBody.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: 'invalid body', details: String(err) }, { status: 400 });
  }

  const cleaned: TablesUpdate<'hooks'> = {};
  if (patch.summary !== undefined) cleaned.summary = patch.summary;
  if (patch.title !== undefined) cleaned.title = patch.title;
  if (patch.status !== undefined) cleaned.status = patch.status;
  if (patch.category_ids !== undefined) cleaned.category_ids = patch.category_ids;
  if (patch.relevance_score !== undefined) cleaned.relevance_score = patch.relevance_score;

  const { data, error } = await supabase
    .from('hooks')
    .update(cleaned)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ hook: data });
}

/** DELETE /api/hooks/[id] — soft archive. */
export async function DELETE(
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

  const { error } = await supabase.from('hooks').update({ status: 'archived' }).eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
