import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/ai/whisper';
import { logAiUsage } from '@/lib/ai/usage';

/**
 * POST /api/ideas/transcribe — accept an audio blob, transcribe it,
 * store the audio in Supabase Storage, and create an Idea row with both
 * the raw transcription and the editable content.
 *
 * Audio is uploaded directly here (no BullMQ queue in MVP). We keep the
 * queue plumbing ready for when clips get longer or volumes rise.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('audio');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'audio blob required' }, { status: 400 });
  }
  const filename = (formData.get('filename') as string | null) ?? `voice-${Date.now()}.webm`;

  let transcription;
  try {
    transcription = await transcribeAudio(file, filename);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error('[transcribe] Whisper call failed:', details);
    return NextResponse.json(
      { error: 'transcription failed', details },
      { status: 502 },
    );
  }

  // Rough token counts for usage logging — Whisper bills per audio-minute but
  // we track duration in "input_tokens" to share the ai_usage schema.
  await logAiUsage({
    userId: user.id,
    model: 'whisper-1',
    module: 'transcription',
    input_tokens: Math.max(1, Math.ceil(transcription.duration / 60)),
    output_tokens: 0,
    ref_type: 'idea',
  });

  // Upload audio to Supabase Storage (user-scoped path).
  const ext = filename.split('.').pop() ?? 'webm';
  const objectPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('audio')
    .upload(objectPath, file, {
      contentType: file.type || 'audio/webm',
      upsert: false,
    });

  const audioUrl = uploadError ? null : objectPath;
  if (uploadError) {
    // Don't fail the whole request — the transcription is still useful.
    // eslint-disable-next-line no-console
    console.error('[audio-upload] failed:', uploadError.message);
  }

  const { data: idea, error: insertError } = await supabase
    .from('ideas')
    .insert({
      user_id: user.id,
      content: transcription.text,
      raw_transcription: transcription.text,
      audio_url: audioUrl,
      audio_duration_seconds: transcription.duration,
      input_type: 'voice',
      created_via: 'voice',
      status: 'new',
      tags: [],
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ idea }, { status: 201 });
}

export const runtime = 'nodejs';
export const maxDuration = 60;
