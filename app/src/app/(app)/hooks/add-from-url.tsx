'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HookAddFromUrl() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/hooks/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, user_note: note.trim() || undefined }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = payload.details ? ` — ${payload.details}` : '';
        throw new Error(`${payload.error ?? `HTTP ${res.status}`}${detail}`);
      }
      setUrl('');
      setNote('');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ukjent feil');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold">Lim inn en URL</div>
      <p className="mt-1 text-xs text-slate-500">
        Claude henter siden, oppsummerer, og klassifiserer mot kategorier og pain points.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://kampanje.com/..."
          type="url"
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Valgfri notat: hva fanget oppmerksomheten din her?"
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={submit}
            disabled={busy || !url.trim()}
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? 'Henter og analyserer…' : 'Legg til knagg'}
          </button>
          {err && <span className="text-xs text-red-600">{err}</span>}
        </div>
      </div>
    </section>
  );
}
