import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pull a quick overview of counts.
  const [{ count: ideasCount }, { count: activeUspCount }, { count: postsCount }] =
    await Promise.all([
      supabase.from('ideas').select('*', { count: 'exact', head: true }),
      supabase
        .from('usps')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
    ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Velkommen</h1>
      <p className="mt-1 text-sm text-slate-600">
        Innlogget som {user?.email}. Fase 2 er i gang — ide-banken er aktiv.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Ideer" value={ideasCount ?? 0} href="/ideas" />
        <StatCard label="Aktive USP-er" value={activeUspCount ?? 0} href="/company" />
        <StatCard label="Poster" value={postsCount ?? 0} />
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition hover:border-slate-400">
      {inner}
    </Link>
  ) : (
    inner
  );
}
