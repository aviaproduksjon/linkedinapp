import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { IdeaCard } from './idea-card';

type Filter = 'all' | 'new' | 'refined' | 'used' | 'archived';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'new', label: 'Nye' },
  { key: 'refined', label: 'Foredlet' },
  { key: 'used', label: 'Brukt' },
  { key: 'archived', label: 'Arkivert' },
];

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter = (searchParams.filter as Filter | undefined) ?? 'all';
  const supabase = createClient();

  let query = supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: ideas, error } = await query;

  // Resolve related taxonomy for nicer labels on cards.
  const [{ data: categories }, { data: painPoints }] = await Promise.all([
    supabase.from('categories').select('id, display_name, color'),
    supabase.from('pain_points').select('id, name'),
  ]);

  const categoryMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c]));
  const painMap = Object.fromEntries((painPoints ?? []).map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Ide-bank</h1>
        <p className="mt-1 text-sm text-slate-600">
          Fang ideer når de kommer. De blir senere knagger i post-generering.
        </p>
      </header>

      <nav className="mb-4 flex gap-1 text-xs">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/ideas${f.key === 'all' ? '' : `?filter=${f.key}`}`}
            className={`rounded px-3 py-1.5 ${
              filter === f.key
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Kunne ikke hente ideer: {error.message}
        </div>
      )}

      {ideas && ideas.length === 0 && (
        <div className="rounded border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Ingen ideer ennå. Trykk <kbd className="rounded bg-slate-100 px-1 py-0.5">⌘I</kbd> for å
          skrive, eller <kbd className="rounded bg-slate-100 px-1 py-0.5">⌘⇧I</kbd> for å snakke.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {ideas?.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            categoryMap={categoryMap}
            painMap={painMap}
          />
        ))}
      </div>
    </div>
  );
}
