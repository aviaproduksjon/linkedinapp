import { createClient } from '@/lib/supabase/server';
import { UspList } from './usp-list';
import { ExtractButton } from './extract-button';

export default async function CompanyPage() {
  const supabase = createClient();

  const [{ data: company }, { data: usps }, { data: painPoints }] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, legal_name, tagline, services, target_segments, scraped_urls')
      .maybeSingle(),
    supabase.from('usps').select('*').order('status').order('created_at', { ascending: false }),
    supabase.from('pain_points').select('id, name'),
  ]);

  const painMap = Object.fromEntries((painPoints ?? []).map((p) => [p.id, p.name]));
  const uspList = usps ?? [];
  const suggested = uspList.filter((u) => u.status === 'suggested');
  const active = uspList.filter((u) => u.status === 'active');
  const archived = uspList.filter((u) => u.status === 'archived');

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Selskapsprofil</h1>
        <p className="mt-1 text-sm text-slate-600">
          USP-er er forankringen for troverdige poster. Hent forslag fra nettsidene dine og
          godkjenn dem én og én.
        </p>
      </header>

      {company && (
        <section className="mb-6 rounded border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Selskap</div>
          <div className="mt-1 text-lg font-semibold">
            {company.name}
            {company.legal_name && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({company.legal_name})
              </span>
            )}
          </div>
          {company.tagline && <p className="mt-1 text-sm text-slate-600">{company.tagline}</p>}
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600">
            <dt className="font-medium text-slate-500">Tjenester</dt>
            <dd>{company.services?.join(', ') || '—'}</dd>
            <dt className="font-medium text-slate-500">Målgrupper</dt>
            <dd>{company.target_segments?.join(', ') || '—'}</dd>
            <dt className="font-medium text-slate-500">Scraping-kilder</dt>
            <dd>{company.scraped_urls?.join(', ') || '—'}</dd>
          </dl>
        </section>
      )}

      <section className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">USP-er</h2>
          <ExtractButton disabled={!company} />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Henter tekst fra nettsidene i selskapsprofilen, analyserer med Claude Sonnet, og
          foreslår USP-er du kan godkjenne eller avvise.
        </p>
      </section>

      {suggested.length > 0 && (
        <UspList
          title="Foreslått — venter på godkjenning"
          usps={suggested}
          painMap={painMap}
          kind="suggested"
        />
      )}

      {active.length > 0 && (
        <UspList title="Aktive USP-er" usps={active} painMap={painMap} kind="active" />
      )}

      {archived.length > 0 && (
        <UspList title="Arkivert" usps={archived} painMap={painMap} kind="archived" />
      )}

      {uspList.length === 0 && (
        <div className="rounded border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Ingen USP-er ennå. Klikk <strong>Foreslå USP-er</strong> for å hente utkast fra
          nettsiden.
        </div>
      )}
    </div>
  );
}
