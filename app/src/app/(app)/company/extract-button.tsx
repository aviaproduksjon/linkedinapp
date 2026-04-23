'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ExtractButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch('/api/usps/extract', { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = payload.details ? ` — ${JSON.stringify(payload.details)}` : '';
        throw new Error(`${payload.error ?? `HTTP ${res.status}`}${detail}`);
      }
      const count = Array.isArray(payload.usps) ? payload.usps.length : 0;
      const pageCount = Array.isArray(payload.pages_fetched) ? payload.pages_fetched.length : 0;
      setInfo(`${count} USP-utkast fra ${pageCount} side${pageCount === 1 ? '' : 'r'}.`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ukjent feil');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={run}
        disabled={disabled || busy}
        className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {busy ? 'Henter…' : 'Foreslå USP-er'}
      </button>
      {info && <span className="text-xs text-emerald-700">{info}</span>}
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}
