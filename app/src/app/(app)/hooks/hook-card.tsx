'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Hook {
  id: string;
  source_id: string | null;
  idea_id: string | null;
  url: string | null;
  title: string | null;
  summary: string;
  category_ids: string[];
  relevance_score: number | null;
  status: 'new' | 'reviewed' | 'used' | 'archived';
  created_at: string;
}

interface Source {
  id: string;
  name: string;
  type: string;
}

interface Props {
  hook: Hook;
  categoryMap: Record<string, { display_name: string; color: string }>;
  sourceMap: Record<string, Source>;
}

export function HookCard({ hook, categoryMap, sourceMap }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(hook.summary);
  const [busy, setBusy] = useState<'save' | 'review' | 'archive' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const source = hook.source_id ? sourceMap[hook.source_id] : null;

  async function patch(body: Record<string, unknown>, kind: typeof busy) {
    setBusy(kind);
    setErr(null);
    try {
      const res = await fetch(`/api/hooks/${hook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Operation failed');
    } finally {
      setBusy(null);
    }
  }

  async function archive() {
    if (!confirm('Arkivere knaggen?')) return;
    setBusy('archive');
    setErr(null);
    try {
      const res = await fetch(`/api/hooks/${hook.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Archive failed');
    } finally {
      setBusy(null);
    }
  }

  const categories = hook.category_ids.flatMap((id) => {
    const c = categoryMap[id];
    return c ? [c] : [];
  });

  return (
    <article className="rounded border border-slate-200 bg-white p-4">
      <header className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 ${statusColor(hook.status)}`}>{hook.status}</span>
          {source && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5">
              {sourceLabel(source.type)} · {source.name}
            </span>
          )}
          {typeof hook.relevance_score === 'number' && (
            <span title="Relevance">{(hook.relevance_score * 100).toFixed(0)}%</span>
          )}
        </div>
        <time>{new Date(hook.created_at).toLocaleString('nb-NO')}</time>
      </header>

      {hook.title && (
        <div className="mb-1 text-sm font-semibold text-slate-900">{hook.title}</div>
      )}

      {editing ? (
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={Math.min(8, Math.max(3, summary.split('\n').length + 1))}
          className="w-full rounded border border-slate-300 p-2 text-sm"
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm text-slate-700">{hook.summary}</p>
      )}

      {(categories.length > 0 || hook.url) && (
        <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
          {categories.map((c, i) => (
            <span
              key={i}
              style={{ borderColor: c.color, color: c.color }}
              className="rounded border px-1.5 py-0.5"
            >
              {c.display_name}
            </span>
          ))}
          {hook.url && (
            <a
              href={hook.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-slate-400 hover:text-slate-700"
            >
              Kilde ↗
            </a>
          )}
        </div>
      )}

      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}

      <footer className="mt-3 flex flex-wrap gap-2 text-xs">
        {editing ? (
          <>
            <button
              onClick={() => patch({ summary }, 'save')}
              disabled={busy === 'save'}
              className="rounded bg-slate-900 px-2 py-1 text-white disabled:opacity-50"
            >
              {busy === 'save' ? 'Lagrer…' : 'Lagre'}
            </button>
            <button
              onClick={() => {
                setSummary(hook.summary);
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
            {hook.status === 'new' && (
              <button
                onClick={() => patch({ status: 'reviewed' }, 'review')}
                disabled={busy === 'review'}
                className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100 disabled:opacity-50"
              >
                {busy === 'review' ? 'Markerer…' : 'Marker som gjennomgått'}
              </button>
            )}
            {hook.status !== 'archived' && (
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

function statusColor(status: Hook['status']): string {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-700';
    case 'reviewed':
      return 'bg-emerald-100 text-emerald-700';
    case 'used':
      return 'bg-violet-100 text-violet-700';
    case 'archived':
      return 'bg-slate-100 text-slate-500';
  }
}

function sourceLabel(type: string): string {
  switch (type) {
    case 'manual':
      return 'Manuell';
    case 'idea_bank':
      return 'Ide';
    case 'rss':
      return 'RSS';
    case 'scrape':
      return 'Scrape';
    case 'report':
      return 'Rapport';
    case 'internal_avia':
      return 'Intern';
    default:
      return type;
  }
}
