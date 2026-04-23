'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Candidate {
  url: string;
  title: string;
  summary: string;
  why_relevant: string;
  category_ids: string[];
  pain_point_ids: string[];
  relevance_score: number | null;
}

interface Props {
  categoryMap: Record<string, { display_name: string; color: string }>;
  painMap: Record<string, string>;
}

type Status = 'idle' | 'searching' | 'done';

export function HookDiscover({ categoryMap, painMap }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [hiddenIndexes, setHiddenIndexes] = useState<Set<number>>(new Set());
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  async function search() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setStatus('searching');
    setErr(null);
    setCandidates([]);
    setHiddenIndexes(new Set());
    try {
      const res = await fetch('/api/hooks/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, limit: 5 }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = payload.details ? ` — ${payload.details}` : '';
        throw new Error(`${payload.error ?? `HTTP ${res.status}`}${detail}`);
      }
      setCandidates(Array.isArray(payload.candidates) ? payload.candidates : []);
      setStatus('done');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'S\u00f8k feilet');
      setStatus('idle');
    }
  }

  async function save(index: number, c: Candidate) {
    setSavingIndex(index);
    setErr(null);
    try {
      const res = await fetch('/api/hooks/save-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: c.url,
          title: c.title,
          summary: c.summary,
          category_ids: c.category_ids,
          relevance_score: c.relevance_score,
          query: query.trim(),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      dismiss(index);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lagring feilet');
    } finally {
      setSavingIndex(null);
    }
  }

  function dismiss(index: number) {
    setHiddenIndexes((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }

  const visibleCandidates = candidates
    .map((c, i) => ({ c, i }))
    .filter(({ i }) => !hiddenIndexes.has(i));

  return (
    <section className="mt-4 rounded border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold">S\u00f8k etter knagger</div>
      <p className="mt-1 text-xs text-slate-500">
        Skriv et tema eller en l\u00f8s tanke. Claude s\u00f8ker p\u00e5 norske bransjekilder f\u00f8rst og
        utvider globalt ved behov.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="F.eks. 'nye data p\u00e5 hvor markedsbudsjett blir brent' eller 'budsjettkutt 2026'"
          rows={2}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void search();
            }
          }}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={search}
            disabled={status === 'searching' || !query.trim()}
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {status === 'searching' ? 'S\u00f8ker…' : 'S\u00f8k'}
          </button>
          {err && <span className="text-xs text-red-600">{err}</span>}
        </div>
      </div>

      {status === 'done' && candidates.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          Fant ingen sterke kandidater for dette s\u00f8ket. Pr\u00f8v andre ord eller bredere formulering.
        </p>
      )}

      {visibleCandidates.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="text-xs font-medium text-slate-500">
            {visibleCandidates.length} kandidat
            {visibleCandidates.length === 1 ? '' : 'er'}
          </div>
          {visibleCandidates.map(({ c, i }) => (
            <CandidateCard
              key={`${c.url}-${i}`}
              candidate={c}
              saving={savingIndex === i}
              onSave={() => save(i, c)}
              onDismiss={() => dismiss(i)}
              categoryMap={categoryMap}
              painMap={painMap}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CandidateCard({
  candidate,
  saving,
  onSave,
  onDismiss,
  categoryMap,
  painMap,
}: {
  candidate: Candidate;
  saving: boolean;
  onSave: () => void;
  onDismiss: () => void;
  categoryMap: Record<string, { display_name: string; color: string }>;
  painMap: Record<string, string>;
}) {
  const categories = candidate.category_ids.flatMap((id) => {
    const c = categoryMap[id];
    return c ? [c] : [];
  });
  const pains = candidate.pain_point_ids
    .map((id) => painMap[id])
    .filter((x): x is string => Boolean(x));

  return (
    <article className="rounded border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <a
          href={candidate.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-slate-900 hover:underline"
        >
          {candidate.title}
        </a>
        {typeof candidate.relevance_score === 'number' && (
          <span className="text-xs text-slate-500">
            {(candidate.relevance_score * 100).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-700">{candidate.summary}</p>
      {candidate.why_relevant && (
        <p className="mt-1 text-xs italic text-slate-500">Hvorfor: {candidate.why_relevant}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
        {categories.map((c, i) => (
          <span
            key={`c-${i}`}
            style={{ borderColor: c.color, color: c.color }}
            className="rounded border px-1.5 py-0.5"
          >
            {c.display_name}
          </span>
        ))}
        {pains.map((p, i) => (
          <span
            key={`p-${i}`}
            className="rounded border border-slate-300 px-1.5 py-0.5 text-slate-600"
          >
            {p}
          </span>
        ))}
        <span className="ml-auto truncate text-slate-400">{new URL(candidate.url).hostname}</span>
      </div>
      <div className="mt-3 flex gap-2 text-xs">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded bg-slate-900 px-2 py-1 text-white disabled:opacity-50"
        >
          {saving ? 'Lagrer…' : 'Lagre som knagg'}
        </button>
        <button
          onClick={onDismiss}
          disabled={saving}
          className="rounded border border-slate-300 px-2 py-1"
        >
          Forkast
        </button>
      </div>
    </article>
  );
}
