import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Composer } from './composer';

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: { hook?: string };
}) {
  const supabase = createClient();
  const hookId = searchParams.hook;

  const [{ data: hooks }, { data: personas }, { data: categories }] = await Promise.all([
    supabase
      .from('hooks')
      .select('id, title, summary, url, status, category_ids')
      .in('status', ['new', 'reviewed'])
      .order('relevance_score', { ascending: false, nullsFirst: false })
      .limit(40),
    supabase.from('personas').select('id, name, active').order('name'),
    supabase
      .from('categories')
      .select('id, slug, display_name, color, sort_order')
      .order('sort_order'),
  ]);

  if (!hooks || hooks.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Ny post</h1>
        <div className="mt-6 rounded border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Ingen klare knagger. Gå til{' '}
          <a href="/hooks" className="underline">
            Knagger
          </a>{' '}
          og lag en først.
        </div>
      </div>
    );
  }

  const initialHookId = hookId && hooks.some((h) => h.id === hookId) ? hookId : hooks[0]?.id;
  if (!initialHookId) {
    redirect('/hooks');
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Ny post</h1>
      <p className="mt-1 text-sm text-slate-600">
        Velg knagg og persona. Claude Opus lager 2 forslag per persona.
      </p>
      <Composer
        hooks={hooks}
        personas={personas ?? []}
        categories={categories ?? []}
        initialHookId={initialHookId}
      />
    </div>
  );
}
