'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Idea {
  id: string;
  content: string;
  raw_transcription: string | null;
  ai_summary: string | null;
  input_type: 'text' | 'voice';
  status: 'new' | 'refined' | 'used' | 'archived';
  tags: string[];
  suggested_category_ids: string[];
  suggested_pain_point_ids: string[];
  audio_duration_seconds: number | null;
  created_at: string;
}

interface Props {
  idea: Idea;
  categoryMap: Record<string, { display_name: string; color: string }>;
  painMap: Record<string, { name: string }>;
}

export function IdeaCard({ idea, categoryMap, painMap }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(idea.content);
  const [busy, setBusy] = useState<'save' | 'postprocess' | 'archive' | 'materialize' | null>(
    null,
  );
  const [err, setErr] = useState<string | null>(null);

  async function saveContent() {
    setBusy('save');
    setErr(null);
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lagring feilet');
    } finally {
      setBusy(null);
    }
  }

  async function postprocess() {
    setBusy('postprocess');
    setErr(null);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/postprocess`, { method: 'POST' });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        throw new Error(p.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Analyse feilet');
    } finally {
      setBusy(null);
    }
  }

  async function materialize() {
    setBusy('materialize');
    setErr(null);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/materialize`, { method: 'POST' });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        throw new Error(p.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
      router.push('/hooks');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Kunne ikke materialisere');
    } finally {
      setBusy(null);
    }
  }

  async function archive() {
    if (!confirm('Arkivere ideen?')) return;
    setBusy('archive');
    setErr(null);
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Arkivering feilet');
    } finally {
      setBusy(null);
    }
  }

  const suggestedCategories = idea.suggested_category_ids.flatMap((id) => {
    const c = categoryMap[id];
    return c ? [c] : [];
  });
  const suggestedPains = idea.suggested_pain_point_ids.flatMap((id) => {
    const p = painMap[id];
    return p ? [p] : [];
  });

  return (
    <article className="rounded border border-slate-200 bg-white p-4">
      <header className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 ${statusColor(idea.status)}`}>{idea.status}</span>
          <span>{idea.input_type === 'voice' ? '🎙️ Stemme' : '⌨️ Tekst'}</span>
          {idea.audio_duration_seconds != null && idea.audio_duration_seconds > 0 && (
            <span>{idea.audio_duration_seconds}s</span>
          )}
        </div>
        <time>{new Date(idea.created_at).toLocaleString('nb-NO')}</time>
      </header>

      {idea.ai_summary && (
        <p className="mb-2 text-sm font-medium text-slate-900">{idea.ai_summary}</p>
      )}

      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={Math.min(10, Math.max(3, content.split('\n').length + 1))}
          className="w-full rounded border border-slate-300 p-2 text-sm"
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm text-slate-700">{idea.content}</p>
      )}

      {(suggestedCategories.length > 0 || suggestedPains.length > 0 || idea.tags.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {suggestedCategories.map((c, i) => (
            <span
              key={i}
              style={{ borderColor: c.color, color: c.color }}
              className="rounded border px-1.5 py-0.5"
            >
              {c.display_name}
            </span>
          ))}
          {suggestedPains.map((p, i) => (
            <span
              key={i}
              className="rounded border border-slate-300 px-1.5 py-0.5 text-slate-600"
            >
              {p.name}
            </span>
          ))}
          {idea.tags.map((t, i) => (
            <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
              #{t}
            </span>
          ))}
        </div>
      )}

      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}

      <footer className="mt-3 flex flex-wrap gap-2 text-xs">
        {editing ? (
          <>
            <button
              onClick={saveContent}
              disabled={busy === 'save'}
              className="rounded bg-slate-900 px-2 py-1 text-white disabled:opacity-50"
            >
              {busy === 'save' ? 'Lagrer…' : 'Lagre'}
            </button>
            <button
              onClick={() => {
                setContent(idea.content);
                setEditing(false);
              }}
              className="rounded border border-slate-300 px-2 py-1"
            >
              Avbryt
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
            >
              Rediger
            </button>
            {idea.status !== 'refined' && idea.status !== 'used' && (
              <button
                onClick={postprocess}
                disabled={busy === 'postprocess'}
                className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100 disabled:opacity-50"
              >
                {busy === 'postprocess' ? 'Analyserer…' : 'Foreslå kategorier'}
              </button>
            )}
            {idea.status !== 'used' && idea.status !== 'archived' && (
              <button
                onClick={materialize}
                disabled={busy === 'materialize'}
                className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100 disabled:opacity-50"
              >
                {busy === 'materialize' ? 'Lager knagg…' : 'Bruk som knagg →'}
              </button>
            )}
            {idea.status !== 'archived' && (
              <button
                onClick={archive}
                disabled={busy === 'archive'}
                className="ml-auto rounded border border-slate-300 px-2 py-1 text-slate-500 hover:bg-red-50 hover:text-red-700"
              >
                Arkiver
              </button>
            )}
          </>
        )}
      </footer>
    </article>
  );
}

function statusColor(status: Idea['status']): string {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-700';
    case 'refined':
      return 'bg-emerald-100 text-emerald-700';
    case 'used':
      return 'bg-violet-100 text-violet-700';
    case 'archived':
      return 'bg-slate-100 text-slate-500';
  }
}
