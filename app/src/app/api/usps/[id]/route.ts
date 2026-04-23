import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { TablesUpdate } from '@shared/db-types';

const PatchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().min(1).max(500).optional(),
  proof: z.string().max(500).nullable().optional(),
  related_pain_point_ids: z.array(z.string().uuid()).max(3).optional(),
  status: z.enum(['suggested', 'active', 'archived']).optional(),
});

/** PATCH /api/usps/[id] — edit or promote/demote a USP. */
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

  // Strip undefined properties to satisfy exactOptionalPropertyTypes.
  const cleaned: TablesUpdate<'usps'> = {};
  if (patch.name !== undefined) cleaned.name = patch.name;
  if (patch.description !== undefined) cleaned.description = patch.description;
  if (patch.proof !== undefined) cleaned.proof = patch.proof;
  if (patch.related_pain_point_ids !== undefined) {
    cleaned.related_pain_point_ids = patch.related_pain_point_ids;
  }
  if (patch.status !== undefined) {
    cleaned.status = patch.status;
    if (patch.status === 'active') {
      cleaned.approved_by = user.email ?? user.id;
    }
  }

  const { data, error } = await supabase
    .from('usps')
    .update(cleaned)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ usp: data });
}

/** DELETE /api/usps/[id] — hard-delete (for suggested USPs the user rejects). */
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

  const { error } = await supabase.from('usps').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
