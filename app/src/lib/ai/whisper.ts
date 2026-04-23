import 'server-only';
import { env } from '@/lib/env';

export interface TranscribeResult {
  text: string;
  /** Duration in seconds reported by Whisper (approximate). */
  duration: number;
}

/**
 * Transcribe a short audio clip via OpenAI Whisper.
 *
 * We bypass the official SDK to keep the dependency footprint small — Whisper
 * is a simple multipart form POST.
 */
export async function transcribeAudio(audio: Blob, filename: string): Promise<TranscribeResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const form = new FormData();
  form.append('file', audio, filename);
  form.append('model', 'whisper-1');
  form.append('language', 'no');
  form.append('response_format', 'verbose_json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Whisper error ${res.status}: ${msg}`);
  }

  const json = (await res.json()) as { text: string; duration?: number };
  return {
    text: json.text,
    duration: Math.round(json.duration ?? 0),
  };
}
