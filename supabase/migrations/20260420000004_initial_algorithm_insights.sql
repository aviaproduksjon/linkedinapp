-- =============================================================================
-- Initial Algorithm Insights (v1) — seeded per user.
-- =============================================================================
--
-- These are starting hypotheses for what works on LinkedIn for Norwegian B2B.
-- They WILL be wrong in places. The halfyearly research agent is expected to
-- update them. See docs/14-algoritme-innsikt-panel.md.
--
-- Seeded via the onboarding flow — this migration only defines the function.
-- =============================================================================

create or replace function public.seed_initial_insights(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Technical algorithm signals
  insert into public.algorithm_insights
    (user_id, version, section, bullets, sources, approved_by, next_review_due)
  values (
    p_user_id, 1, 'technical',
    array[
      'Poster mellom 1200–1800 tegn tenderer mot bedre rekkevidde enn korte.',
      'Kommentarer vekter 5–10x mer enn likes for videre distribusjon.',
      'Eksterne lenker i selve posten straffes i de første 1–2 timene. Legg lenken i første kommentar om nødvendig.',
      'Første 2 linjer (før "... se mer") avgjør om noen leser resten.',
      'Maks 3 hashtags. Over-tagging og over-mentioning reduserer rekkevidde.',
      'Rediger aldri posten i første time etter publisering.'
    ],
    array[]::text[],
    'system',
    (now() + interval '6 months')
  );

  -- B2B practice in Norway
  insert into public.algorithm_insights
    (user_id, version, section, bullets, sources, approved_by, next_review_due)
  values (
    p_user_id, 1, 'b2b_practice',
    array[
      'Personlige "jeg"-poster slår "vi"-poster for byrå- og konsulentpersoner.',
      'Case-deling med navngitt kunde slår anonyme case.',
      'Søndag kveld og tirsdag morgen er sterke tidspunkter for norsk B2B.',
      'Norsk marked er relativt lite. Overposting virker raskt støyende.',
      'Høyt engasjement fra bransjekolleger signaliserer relevans, men leads kommer oftere fra ikke-høyt-aktive lesere.'
    ],
    array[]::text[],
    'system',
    (now() + interval '6 months')
  );

  -- Cultural norms (marketing industry, Norway)
  insert into public.algorithm_insights
    (user_id, version, section, bullets, sources, approved_by, next_review_due)
  values (
    p_user_id, 1, 'cultural',
    array[
      'Selvironi og direkte språk slår polished PR.',
      'Fagautoritet uten selvhøytidelighet skaper kommentarer.',
      'Norsk marked er intolerant for corporate speak.',
      'Å ta en tydelig standpunkt gir mer engasjement enn balanse.',
      'Honest refleksjon over egne feil/lærdommer ranker høyt.'
    ],
    array[]::text[],
    'system',
    (now() + interval '6 months')
  );
end;
$$;

-- Extend the new-user trigger to also seed insights.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
begin
  insert into public.categories (user_id, slug, display_name, description, color, generation_guidance, sort_order)
  values
    (new.id, 'give-value',           'Gi verdi til andre',       'Løfte og skryte av andre: ansatte, partnere, kunder.', '#eab308', 'Warm, ekte, navngi person og konkret bidrag. Unngå hule skryteposter. Må ha navngitt person som knagg.', 1),
    (new.id, 'slik-tenker-vi',       'Slik tenker vi',           'Heve troen på det Avia leverer via kunnskapsdeling.',  '#1e3a8a', 'Tydelig mening, kunnskapsbasert, alltid forankret i prinsipp eller fakta. Aldri abstrakte slagord.', 2),
    (new.id, 'hjelpe-markedssjefer', 'Hjelpe markedssjefer',     'Nyhet + kort kommentar på hva det betyr for målgruppen.', '#16a34a', 'Hjelpsom, ikke belærende. Må ha tydelig kilde og en konkret "hva betyr dette for deg"-vinkling.', 3),
    (new.id, 'vise-suksess',         'Vise suksess',             'Signalisere, direkte eller indirekte, at det vi gjør fungerer.', '#7c3aed', 'Helst indirekte (sidebemerkning som signal). Krever konkret faktum. Unngå skrytetone.', 4);

  insert into public.pain_points (user_id, name, description, priority)
  values
    (new.id, 'Vekst uten budsjett',
     'Behovene vokser (mer innhold, flere kanaler, høyere tempo), men budsjettene står stille.', 1),
    (new.id, 'Færre ledd, raskere leveranser',
     'Markedssjefer ønsker å jobbe direkte med de som lager arbeidet og de kreative talentene, ikke gjennom flere lag.', 2),
    (new.id, 'Mindre støy, mer dybde',
     'Folk bryr seg ikke, og tilliten til reklame synker. Målgruppen vil ha dybde, ikke volum.', 3);

  insert into public.companies (user_id, name, legal_name, tagline, services, target_segments, scraped_urls)
  values (
    new.id, 'Avia', 'Avia Produksjon AS', null,
    array['Kreativ produksjon', 'Strategi', 'Kampanjer', 'Innhold'],
    array['Markedssjefer i Norge', 'Markedsførere'],
    array['https://aviaprod.no']
  )
  returning id into new_company_id;

  insert into public.personas (
    user_id, name, active, tone_of_voice, hard_rules, guidance, target_audience_notes
  )
  values (
    new.id, 'Deniz', true,
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
    'Markedssjefer og markedsførere i Norge. Personer som jobber med budsjett, effektdokumentasjon, intern salgsjobb mot ledelsen.'
  );

  insert into public.budget_settings (user_id, monthly_cap_cents)
  values (new.id, 50000);

  perform public.seed_initial_insights(new.id);

  return new;
end;
$$;
