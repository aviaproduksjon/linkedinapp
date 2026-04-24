import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function PostsPage() {
  const supabase = createClient();

  const [{ data: posts }, { data: categories }, { data: personas }] = await Promise.all([
    supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('categories').select('id, display_name, color'),
    supabase.from('personas').select('id, name'),
  ]);

  const categoryMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c]));
  const personaMap = Object.fromEntries((personas ?? []).map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Poster</h1>
          <p className="mt-1 text-sm text-slate-600">
            Utkast og planlagte poster. Full editor kommer i neste fase.
          </p>
        </div>
        <Link
          href="/hooks"
          className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          Ny post
        </Link>
      </header>

      {(!posts || posts.length === 0) && (
        <div className="rounded border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Ingen poster enda. Gå til{' '}
          <Link href="/hooks" className="underline">
            Knagger
          </Link>{' '}
          og klikk &quot;Generer forslag&quot; på en knagg.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {posts?.map((p) => {
          const category = categoryMap[p.primary_category_id];
          const persona = personaMap[p.persona_id];
          return (
            <article
              key={p.id}
              className="rounded border border-slate-200 bg-white p-4"
            >
              <header className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 ${statusColor(p.status)}`}>
                    {p.status}
                  </span>
                  {category && (
                    <span
                      className="rounded border px-1.5 py-0.5"
                      style={{ borderColor: category.color, color: category.color }}
                    >
                      {category.display_name}
                    </span>
                  )}
                  {persona && <span>{persona.name}</span>}
                  <span>{p.cta_mode}</span>
                  {typeof p.algorithm_score === 'number' && (
                    <span
                      className={
                        p.algorithm_score >= 0.7
                          ? 'text-emerald-700'
                          : p.algorithm_score >= 0.25
                            ? 'text-amber-700'
                            : 'text-red-700'
                      }
                      title="Algoritme-score"
                    >
                      {Math.round(p.algorithm_score * 100)}
                    </span>
                  )}
                </div>
                <time>{new Date(p.created_at).toLocaleString('nb-NO')}</time>
              </header>
              {category && (
                <div
                  className="mb-2 h-1 rounded"
                  style={{ backgroundColor: category.color }}
                />
              )}
              <p className="whitespace-pre-wrap text-sm text-slate-800">{p.body}</p>
              <footer className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>{p.body.length} tegn</span>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-slate-100 text-slate-700';
    case 'suggested':
      return 'bg-blue-100 text-blue-700';
    case 'approved':
      return 'bg-emerald-100 text-emerald-700';
    case 'scheduled':
      return 'bg-amber-100 text-amber-700';
    case 'published':
      return 'bg-violet-100 text-violet-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-500';
  }
}
