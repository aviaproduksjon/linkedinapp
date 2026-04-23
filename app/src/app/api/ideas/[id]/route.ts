import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { TablesUpdate } from '@shared/db-types';

const PatchBody = z.object({
  content: z.string().min(1).max(10_000).optional(),
  status: z.enum(['new', 'refined', 'used', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
});

/** PATCH /api/ideas/[id] — edit an idea. */
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

  // Strip undefined properties so `exactOptionalPropertyTypes: true` is happy.
  const cleaned: TablesUpdate<'ideas'> = {};
  if (patch.content !== undefined) cleaned.content = patch.content;
  if (patch.status !== undefined) cleaned.status = patch.status;
  if (patch.tags !== undefined) cleaned.tags = patch.tags;

  const { data, error } = await supabase
    .from('ideas')
    .update(cleaned)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ idea: data });
}

/** DELETE /api/ideas/[id] — soft archive. */
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

  const { error } = await supabase
    .from('ideas')
    .update({ status: 'archived' })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
