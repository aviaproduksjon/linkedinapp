-- =============================================================================
-- Onboarding: seed core data for every new user on signup.
-- =============================================================================
--
-- When a user signs up, we insert the four core categories, the three initial
-- pain points, the Deniz persona with hard_rules + guidance, and the company
-- row for Avia Produksjon AS.
--
-- This function is wired to auth.users via a trigger in this migration.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
begin
  -- Categories (four core, per-user copy).
  insert into public.categories (user_id, slug, display_name, description, color, generation_guidance, sort_order)
  values
    (new.id, 'give-value',           'Gi verdi til andre',       'Løfte og skryte av andre: ansatte, partnere, kunder.', '#eab308', 'Warm, ekte, navngi person og konkret bidrag. Unngå hule skryteposter. Må ha navngitt person som knagg.', 1),
    (new.id, 'slik-tenker-vi',       'Slik tenker vi',           'Heve troen på det Avia leverer via kunnskapsdeling.',  '#1e3a8a', 'Tydelig mening, kunnskapsbasert, alltid forankret i prinsipp eller fakta. Aldri abstrakte slagord.', 2),
    (new.id, 'hjelpe-markedssjefer', 'Hjelpe markedssjefer',     'Nyhet + kort kommentar på hva det betyr for målgruppen.', '#16a34a', 'Hjelpsom, ikke belærende. Må ha tydelig kilde og en konkret "hva betyr dette for deg"-vinkling.', 3),
    (new.id, 'vise-suksess',         'Vise suksess',             'Signalisere, direkte eller indirekte, at det vi gjør fungerer.', '#7c3aed', 'Helst indirekte (sidebemerkning som signal). Krever konkret faktum. Unngå skrytetone.', 4);

  -- Pain points (three initial).
  insert into public.pain_points (user_id, name, description, priority)
  values
    (new.id, 'Vekst uten budsjett',
     'Behovene vokser (mer innhold, flere kanaler, høyere tempo), men budsjettene står stille.', 1),
    (new.id, 'Færre ledd, raskere leveranser',
     'Markedssjefer ønsker å jobbe direkte med de som lager arbeidet og de kreative talentene, ikke gjennom flere lag.', 2),
    (new.id, 'Mindre støy, mer dybde',
     'Folk bryr seg ikke, og tilliten til reklame synker. Målgruppen vil ha dybde, ikke volum.', 3);

  -- Company (Avia Produksjon AS).
  insert into public.companies (user_id, name, legal_name, tagline, services, core_model, target_segments, scraped_urls)
  values (
    new.id,
    'Avia',
    'Avia Produksjon AS',
    null,
    array['Kreativ produksjon', 'Strategi', 'Kampanjer', 'Innhold'],
    null,
    array['Markedssjefer i Norge', 'Markedsførere'],
    array['https://aviaprod.no']
  )
  returning id into new_company_id;

  -- Deniz persona with initial hard_rules + guidance (see docs/06-tone-og-personas.md).
  insert into public.personas (
    user_id, name, active, tone_of_voice, hard_rules, guidance, snippets, target_audience_notes
  )
  values (
    new.id,
    'Deniz',
    true,
    'Kortfattet, rett frem, smart, levende, tilgjengelig. Talespråk. "Keep it stupid simple". Kunnskapsbasert.',
    array[
      'Ingen tankestreker (— eller –).',
      'Ingen AI-klisjé-åpninger som "I en verden der...", "I dagens...", "I det moderne markedet...".',
      'Minst én knagg må være referert (eksplisitt eller implisitt).'
    ],
    array[
      'Skriv som jeg snakker.',
      'Kort, rett frem.',
      'Si det jeg mener.',
      'Start midt i setninger når det fungerer.',
      'Legg inn innsikt, ikke bare observasjon.',
      'Ikke pretensiøs, ikke tunge åpninger.',
      'Ikke generelle skryteposter uten konkret grunnlag.',
      'Foretrekk korte avsnitt.'
    ],
    array[]::text[],
    'Markedssjefer og markedsførere i Norge. Personer som jobber med budsjett, effektdokumentasjon, intern salgsjobb mot ledelsen.'
  );

  -- Budget settings with default cap.
  insert into public.budget_settings (user_id, monthly_cap_cents)
  values (new.id, 50000);

  return new;
end;
$$;

-- Trigger: run on every new user.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
