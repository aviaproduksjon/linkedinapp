'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Usp {
  id: string;
  name: string;
  description: string;
  proof: string | null;
  related_pain_point_ids: string[];
  status: 'suggested' | 'active' | 'archived';
  source_url: string | null;
}

interface Props {
  title: string;
  usps: Usp[];
  painMap: Record<string, string>;
  kind: 'suggested' | 'active' | 'archived';
}

export function UspList({ title, usps, painMap, kind }: Props) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="flex flex-col gap-2">
        {usps.map((u) => (
          <UspCard key={u.id} usp={u} painMap={painMap} kind={kind} />
        ))}
      </div>
    </section>
  );
}

function UspCard({ usp, painMap, kind }: { usp: Usp; painMap: Record<string, string>; kind: Props['kind'] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(usp.name);
  const [description, setDescription] = useState(usp.description);
  const [proof, setProof] = useState(usp.proof ?? '');
  const [busy, setBusy] = useState<'save' | 'approve' | 'archive' | 'reject' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, kind: typeof busy) {
    setBusy(kind);
    setErr(null);
    try {
      const res = await fetch(`/api/usps/${usp.id}`, {
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

  async function reject() {
    if (!confirm(`Slette "${usp.name}"?`)) return;
    setBusy('reject');
    setErr(null);
    try {
      const res = await fetch(`/api/usps/${usp.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(null);
    }
  }

  const pains = usp.related_pain_point_ids
    .map((id) => painMap[id])
    .filter((x): x is string => Boolean(x));

  return (
    <article className="rounded border border-slate-200 bg-white p-4">
      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm font-medium"
            placeholder="Navn"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="rounded border border-slate-300 p-2 text-sm"
            placeholder="Beskrivelse"
          />
          <textarea
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            rows={2}
            className="rounded border border-slate-300 p-2 text-xs text-slate-600"
            placeholder="Bevis / case / tall"
          />
        </div>
      ) : (
        <>
          <div className="font-medium">{usp.name}</div>
          <p className="mt-1 text-sm text-slate-700">{usp.description}</p>
          {usp.proof && (
            <p className="mt-2 text-xs italic text-slate-500">Bevis: {usp.proof}</p>
          )}
        </>
      )}

      <div className="mt-2 flex flex-wrap gap-1 text-xs">
        {pains.map((p, i) => (
          <span key={i} className="rounded border border-slate-300 px-1.5 py-0.5 text-slate-600">
            {p}
          </span>
        ))}
        {usp.source_url && (
          <a
            href={usp.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-slate-400 hover:text-slate-700"
          >
            Kilde ↗
          </a>
        )}
      </div>

      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}

      <footer className="mt-3 flex flex-wrap gap-2 text-xs">
        {editing ? (
          <>
            <button
              onClick={() => patch({ name, description, proof: proof.trim() || null }, 'save')}
              disabled={busy === 'save'}
              className="rounded bg-slate-900 px-2 py-1 text-white disabled:opacity-50"
            >
              {busy === 'save' ? 'Lagrer…' : 'Lagre'}
            </button>
            <button
              onClick={() => {
                setName(usp.name);
                setDescription(usp.description);
                setProof(usp.proof ?? '');
                setEditing(false);
              }}
              className="rounded border border-slate-300 px-2 py-1"
            >
              Avbryt
            </button>
          </>
        ) : (
          <>
            {kind === 'suggested' && (
              <>
                <button
                  onClick={() => patch({ status: 'active' }, 'approve')}
                  disabled={busy === 'approve'}
                  className="rounded bg-emerald-700 px-2 py-1 text-white disabled:opacity-50"
                >
                  {busy === 'approve' ? 'Godkjenner…' : 'Godkjenn'}
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded border border-slate-300 px-2 py-1"
                >
                  Rediger
                </button>
                <button
                  onClick={reject}
                  disabled={busy === 'reject'}
                  className="ml-auto rounded border border-slate-300 px-2 py-1 text-slate-500 hover:bg-red-50 hover:text-red-700"
                >
                  Avvis
                </button>
              </>
            )}
            {kind === 'active' && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded border border-slate-300 px-2 py-1"
                >
                  Rediger
                </button>
                <button
                  onClick={() => patch({ status: 'archived' }, 'archive')}
                  disabled={busy === 'archive'}
                  className="ml-auto rounded border border-slate-300 px-2 py-1 text-slate-500 hover:bg-slate-100"
                >
                  Arkiver
                </button>
              </>
            )}
            {kind === 'archived' && (
              <button
                onClick={() => patch({ status: 'active' }, 'approve')}
                disabled={busy === 'approve'}
                className="rounded border border-slate-300 px-2 py-1"
              >
                Reaktiver
              </button>
            )}
          </>
        )}
      </footer>
    </article>
  );
}
