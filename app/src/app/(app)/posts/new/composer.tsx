'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Hook {
  id: string;
  title: string | null;
  summary: string;
  url: string | null;
  category_ids: string[];
}
interface Persona {
  id: string;
  name: string;
  active: boolean;
}
interface Category {
  id: string;
  slug: string;
  display_name: string;
  color: string;
  sort_order: number;
}

interface Suggestion {
  id: string;
  persona_id: string;
  body: string;
  generation_id: string;
  algorithm_score: number | null;
  algorithm_notes: string | null;
  tuner_diff: {
    rolled_back?: boolean;
    rollback_reason?: string | null;
    changes?: string[];
    pre_body?: string;
    post_body?: string;
  } | null;
}

interface Props {
  hooks: Hook[];
  personas: Persona[];
  categories: Category[];
  initialHookId: string;
}

type Cta = 'none' | 'soft' | 'direct';

export function Composer({ hooks, personas, categories, initialHookId }: Props) {
  const router = useRouter();

  const [selectedHookIds, setSelectedHookIds] = useState<string[]>([initialHookId]);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(() => {
    const defaults = personas.filter((p) => p.active).map((p) => p.id);
    return defaults.length > 0 ? defaults : personas[0] ? [personas[0].id] : [];
  });
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string>(() => {
    const firstHook = hooks.find((h) => h.id === initialHookId);
    const fromHook = firstHook?.category_ids[0];
    return fromHook ?? categories[0]?.id ?? '';
  });
  const [secondaryIds, setSecondaryIds] = useState<string[]>([]);
  const [cta, setCta] = useState<Cta>('soft');
  const [userNotes, setUserNotes] = useState('');

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [choosing, setChoosing] = useState<string | null>(null);

  const personaById = useMemo(
    () => Object.fromEntries(personas.map((p) => [p.id, p])),
    [personas],
  );

  function toggle(list: string[], value: string, setter: (v: string[]) => void, max?: number) {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
      return;
    }
    if (max && list.length >= max) return;
    setter([...list, value]);
  }

  async function generate() {
    if (selectedHookIds.length === 0 || selectedPersonaIds.length === 0 || !primaryCategoryId) {
      setErr('Velg minst én knagg, én persona og primærkategori.');
      return;
    }
    setBusy(true);
    setErr(null);
    setInfo(null);
    setSuggestions([]);
    try {
      const res = await fetch('/api/posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook_ids: selectedHookIds,
          persona_ids: selectedPersonaIds,
          primary_category_id: primaryCategoryId,
          secondary_category_ids: secondaryIds,
          cta_mode: cta,
          user_notes: userNotes.trim() || undefined,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = payload.details ? ` — ${JSON.stringify(payload.details)}` : '';
        throw new Error(`${payload.error ?? `HTTP ${res.status}`}${detail}`);
      }
      setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : []);
      if (payload.rejected_count) {
        setInfo(`${payload.rejected_count} forslag ble avvist av regelsjekker. Viser resten.`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Generering feilet');
    } finally {
      setBusy(false);
    }
  }

  async function choose(suggestion: Suggestion) {
    setChoosing(suggestion.id);
    setErr(null);
    try {
      const res = await fetch(`/api/suggestions/${suggestion.id}/choose`, { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      router.push('/posts');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Kunne ikke lagre valg');
    } finally {
      setChoosing(null);
    }
  }

  const primaryCategory = categories.find((c) => c.id === primaryCategoryId);

  return (
    <div className="mt-6 flex flex-col gap-5">
      <section className="rounded border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Knagg(er)</div>
        <p className="mt-1 text-xs text-slate-500">Velg 1–3. Den første du velger er hovedknagg.</p>
        <div className="mt-2 flex flex-col gap-1">
          {hooks.map((h) => {
            const selected = selectedHookIds.includes(h.id);
            return (
              <label
                key={h.id}
                className={`flex cursor-pointer items-start gap-2 rounded border p-2 text-sm ${
                  selected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(selectedHookIds, h.id, setSelectedHookIds, 3)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium">{h.title ?? 'Uten tittel'}</div>
                  <div className="text-slate-600">{h.summary}</div>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Persona</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {personas.map((p) => {
            const selected = selectedPersonaIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(selectedPersonaIds, p.id, setSelectedPersonaIds, 2)}
                className={`rounded border px-3 py-1.5 text-sm ${
                  selected
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 hover:bg-slate-100'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold">Primærkategori</div>
          <select
            value={primaryCategoryId}
            onChange={(e) => setPrimaryCategoryId(e.target.value)}
            className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
          {primaryCategory && (
            <div
              className="mt-2 h-1 rounded"
              style={{ backgroundColor: primaryCategory.color }}
            />
          )}
        </div>

        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold">CTA-modus</div>
          <div className="mt-2 flex gap-2">
            {(['none', 'soft', 'direct'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setCta(m)}
                className={`flex-1 rounded border px-2 py-1.5 text-sm ${
                  cta === m
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 hover:bg-slate-100'
                }`}
              >
                {m === 'none' ? 'Ingen' : m === 'soft' ? 'Myk' : 'Direkte'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Sekundære kategorier (valgfritt)</div>
          <span className="text-xs text-slate-500">Maks 2</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories
            .filter((c) => c.id !== primaryCategoryId)
            .map((c) => {
              const selected = secondaryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(secondaryIds, c.id, setSecondaryIds, 2)}
                  className={`rounded border px-3 py-1 text-xs ${
                    selected
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 hover:bg-slate-100'
                  }`}
                  style={selected ? undefined : { color: c.color, borderColor: c.color }}
                >
                  {c.display_name}
                </button>
              );
            })}
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <label htmlFor="notes" className="text-sm font-semibold">
          Ekstra kontekst (valgfritt)
        </label>
        <textarea
          id="notes"
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          rows={2}
          placeholder="F.eks. vinkling du tenker på, eller hva du vil unngå."
          className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={generate}
          disabled={busy}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? 'Genererer…' : 'Generer forslag'}
        </button>
        {err && <span className="text-sm text-red-600">{err}</span>}
        {info && <span className="text-sm text-amber-700">{info}</span>}
      </div>

      {suggestions.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="text-sm font-semibold">
            {suggestions.length} forslag — velg det sterkeste
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                personaName={personaById[s.persona_id]?.name ?? s.persona_id.slice(0, 8)}
                primaryCategory={primaryCategory}
                choosing={choosing === s.id}
                onChoose={() => choose(s)}
              />
            ))}
          </div>
          <div>
            <button
              onClick={generate}
              disabled={busy}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50"
            >
              Regenerer
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  personaName,
  primaryCategory,
  choosing,
  onChoose,
}: {
  suggestion: Suggestion;
  personaName: string;
  primaryCategory: Category | undefined;
  choosing: boolean;
  onChoose: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const score = suggestion.algorithm_score;
  const scorePercent = score !== null ? Math.round(score * 100) : null;
  const scoreColor =
    score === null
      ? 'text-slate-400'
      : score >= 0.7
        ? 'text-emerald-700'
        : score >= 0.25
          ? 'text-amber-700'
          : 'text-red-700';
  const wasTuned = suggestion.tuner_diff && suggestion.tuner_diff.rolled_back === false;

  return (
    <article className="flex flex-col rounded border border-slate-200 bg-white p-4">
      <header className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>{personaName}</span>
        <div className="flex items-center gap-2">
          {primaryCategory && (
            <span
              className="rounded border px-1.5 py-0.5"
              style={{ borderColor: primaryCategory.color, color: primaryCategory.color }}
            >
              {primaryCategory.display_name}
            </span>
          )}
          {scorePercent !== null && (
            <span className={`font-medium ${scoreColor}`}>{scorePercent}</span>
          )}
        </div>
      </header>
      {primaryCategory && (
        <div className="mb-2 h-1 rounded" style={{ backgroundColor: primaryCategory.color }} />
      )}
      <p className="flex-1 whitespace-pre-wrap text-sm text-slate-800">{suggestion.body}</p>

      {wasTuned && (
        <p className="mt-2 text-xs italic text-slate-500">
          ↻ Tuner justerte ({suggestion.tuner_diff?.changes?.length ?? 0} endring
          {suggestion.tuner_diff?.changes?.length === 1 ? '' : 'er'})
        </p>
      )}

      {suggestion.algorithm_notes && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700"
          >
            {showDetails ? 'Skjul detaljer' : 'Vis algoritme-innsikt'}
          </button>
          {showDetails && (
            <div className="mt-1 whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-600">
              {suggestion.algorithm_notes}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">{suggestion.body.length} tegn</span>
        <button
          onClick={onChoose}
          disabled={choosing}
          className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {choosing ? 'Lagrer…' : 'Velg dette'}
        </button>
      </div>
    </article>
  );
}
