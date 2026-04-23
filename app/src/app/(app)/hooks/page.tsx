import { createClient } from '@/lib/supabase/server';
import { HookAddFromUrl } from './add-from-url';
import { HookCard } from './hook-card';
import { HookDiscover } from './discover';

type Filter = 'all' | 'new' | 'reviewed' | 'used' | 'archived';

export default async function HooksPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter = (searchParams.filter as Filter | undefined) ?? 'all';
  const supabase = createClient();

  let query = supabase
    .from('hooks')
    .select('*')
    .order('status', { ascending: true })
    .order('relevance_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(200);

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const [
    { data: hooks, error },
    { data: categories },
    { data: sources },
    { data: painPoints },
  ] = await Promise.all([
    query,
    supabase.from('categories').select('id, display_name, color'),
    supabase.from('sources').select('id, name, type'),
    supabase.from('pain_points').select('id, name'),
  ]);

  const categoryMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c]));
  const sourceMap = Object.fromEntries((sources ?? []).map((s) => [s.id, s]));
  const painMap = Object.fromEntries((painPoints ?? []).map((p) => [p.id, p.name]));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Knagger</h1>
        <p className="mt-1 text-sm text-slate-600">
          Fakta og observasjoner som senere blir grunnlaget for poster. Lim inn en lenke, eller
          materialiser en ide fra ide-banken.
        </p>
      </header>

      <HookAddFromUrl />
      <HookDiscover categoryMap={categoryMap} painMap={painMap} />

      <nav className="mt-6 mb-3 flex gap-1 text-xs">
        {(['all', 'new', 'reviewed', 'used', 'archived'] as const).map((f) => (
          <a
            key={f}
            href={`/hooks${f === 'all' ? '' : `?filter=${f}`}`}
            className={`rounded px-3 py-1.5 ${
              filter === f
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {f === 'all' ? 'Alle' : f === 'new' ? 'Nye' : f === 'reviewed' ? 'Gjennomg\u00e5tt' : f === 'used' ? 'Brukt' : 'Arkivert'}
          </a>
        ))}
      </nav>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Kunne ikke hente knagger: {error.message}
        </div>
      )}

      {hooks && hooks.length === 0 && (
        <div className="rounded border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Ingen knagger enda. Lim inn en URL over, eller gå til{' '}
          <a href="/ideas" className="underline">
            ide-banken
          </a>{' '}
          og materialiser en ide.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {hooks?.map((h) => (
          <HookCard
            key={h.id}
            hook={h}
            categoryMap={categoryMap}
            sourceMap={sourceMap}
          />
        ))}
      </div>
    </div>
  );
}
