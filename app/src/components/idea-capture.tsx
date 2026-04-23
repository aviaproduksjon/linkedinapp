'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'closed' | 'text' | 'voice';
type RecState = 'idle' | 'recording' | 'uploading';

/**
 * Global idea capture widget. Sits in the sidebar, also bound to:
 *   ⌘+I           — open text mode
 *   ⌘+Shift+I     — start voice recording
 */
export function IdeaCapture() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('closed');
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [err, setErr] = useState<string | null>(null);

  const [recState, setRecState] = useState<RecState>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const closeAll = useCallback(() => {
    setMode('closed');
    setText('');
    setErr(null);
    setStatus('idle');
  }, []);

  const startVoice = useCallback(async () => {
    setMode('voice');
    setErr(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErr('Mikrofon ikke tilgjengelig i denne nettleseren.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      });
      mr.start();
      mediaRecorderRef.current = mr;
      setRecState('recording');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Kunne ikke starte mikrofonen.');
      setMode('closed');
    }
  }, []);

  const stopVoice = useCallback(async () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    const stopped = new Promise<void>((resolve) => {
      mr.addEventListener('stop', () => resolve(), { once: true });
    });
    mr.stop();
    await stopped;
    streamRef.current?.getTracks().forEach((t) => t.stop());

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    streamRef.current = null;

    setRecState('uploading');
    const form = new FormData();
    form.append('audio', blob, `voice-${Date.now()}.webm`);
    try {
      const res = await fetch('/api/ideas/transcribe', { method: 'POST', body: form });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const detail = payload.details ? ` — ${payload.details}` : '';
        throw new Error(`${payload.error ?? `HTTP ${res.status}`}${detail}`);
      }
      router.refresh();
      closeAll();
      setRecState('idle');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Transkribering feilet.');
      setRecState('idle');
    }
  }, [closeAll, router]);

  const cancelVoice = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
    setRecState('idle');
    closeAll();
  }, [closeAll]);

  const saveText = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setStatus('saving');
    setErr(null);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, input_type: 'text', created_via: 'keyboard' }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
      closeAll();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Kunne ikke lagre.');
      setStatus('error');
    }
  }, [closeAll, router, text]);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'i' && e.shiftKey) {
        e.preventDefault();
        if (recState === 'idle') void startVoice();
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setMode((m) => (m === 'closed' ? 'text' : m));
      } else if (e.key === 'Escape' && mode !== 'closed') {
        e.preventDefault();
        if (recState === 'recording') cancelVoice();
        else closeAll();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelVoice, closeAll, mode, recState, startVoice]);

  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">Ide-bank</span>
        <span className="text-[10px] text-slate-400">⌘I · ⌘⇧I</span>
      </div>

      {mode === 'closed' && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setMode('text')}
            className="flex-1 rounded bg-slate-900 px-2 py-1.5 text-xs text-white hover:bg-slate-800"
          >
            Skriv
          </button>
          <button
            onClick={startVoice}
            className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-xs hover:bg-slate-100"
          >
            🎙️ Snakk
          </button>
        </div>
      )}

      {mode === 'text' && (
        <div className="mt-2">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Hva tenker du på?"
            rows={4}
            className="w-full rounded border border-slate-300 p-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void saveText();
              }
            }}
          />
          <div className="mt-1 flex gap-2">
            <button
              onClick={saveText}
              disabled={status === 'saving' || !text.trim()}
              className="flex-1 rounded bg-slate-900 px-2 py-1.5 text-xs text-white disabled:opacity-50"
            >
              {status === 'saving' ? 'Lagrer…' : 'Lagre (⌘↵)'}
            </button>
            <button
              onClick={closeAll}
              className="rounded border border-slate-300 px-2 py-1.5 text-xs"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {mode === 'voice' && (
        <div className="mt-2 flex flex-col gap-2">
          {recState === 'recording' && (
            <>
              <div className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">
                🔴 Tar opp… snakk fritt.
              </div>
              <button
                onClick={stopVoice}
                className="rounded bg-slate-900 px-2 py-1.5 text-xs text-white"
              >
                Stopp + transkriber
              </button>
              <button
                onClick={cancelVoice}
                className="rounded border border-slate-300 px-2 py-1.5 text-xs"
              >
                Avbryt
              </button>
            </>
          )}
          {recState === 'uploading' && (
            <div className="rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
              Transkriberer…
            </div>
          )}
        </div>
      )}

      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
    </div>
  );
}
