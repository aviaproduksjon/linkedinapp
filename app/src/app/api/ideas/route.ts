import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/** GET /api/ideas — list current user's ideas, newest first. */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ideas: data ?? [] });
}

const CreateIdeaBody = z.object({
  content: z.string().min(1).max(10_000),
  input_type: z.enum(['text', 'voice']).default('text'),
  raw_transcription: z.string().nullable().optional(),
  audio_url: z.string().nullable().optional(),
  audio_duration_seconds: z.number().int().nonnegative().nullable().optional(),
  tags: z.array(z.string()).default([]),
  created_via: z.string().default('keyboard'),
});

/** POST /api/ideas — create a new idea (text or voice). */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: z.infer<typeof CreateIdeaBody>;
  try {
    body = CreateIdeaBody.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: 'invalid body', details: String(err) }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('ideas')
    .insert({
      user_id: user.id,
      content: body.content,
      input_type: body.input_type,
      raw_transcription: body.raw_transcription ?? null,
      audio_url: body.audio_url ?? null,
      audio_duration_seconds: body.audio_duration_seconds ?? null,
      tags: body.tags,
      created_via: body.created_via,
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ idea: data }, { status: 201 });
}
