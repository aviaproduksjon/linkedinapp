# Datamodell

> **Status:** Utkast. Felter kan endres etter agent-gjennomgang. Alle IDer er UUID. Alle tidspunkter er UTC i DB, lokal tid i UI (Europe/Oslo).

---

## Persona
Representerer en "stemme" å generere innhold som. Brukeren kan ha flere.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| name | string | Synlig navn i sidebar |
| active | boolean | Avhuket i UI |
| tone_of_voice | text | Fri beskrivelse |
| hard_rules | text[] | Brudd → avvis + regenerer (T2-skillet) |
| guidance | text[] | Brudd → advarsel, vis posten, lær over tid |
| snippets | text[] | Eksempeltekster brukeren har skrevet selv |
| target_audience_notes | text | Hvem denne stemmen snakker til |
| preference_weights | jsonb | Læringsmodellens tilstand (se "Læring") |
| created_at / updated_at | timestamp | |

---

## Category
Innholdskategoriene. Mange-til-mange med Post via `post_categories`.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| slug | string | `give-value`, `slik-tenker-vi`, `hjelpe-markedssjefer`, `vise-suksess` |
| display_name | string | |
| description | text | |
| color | string | Hex-kode for visuell identitet |
| generation_guidance | text | Kategori-spesifikke instrukser til generator |
| sort_order | int | |

---

## Source (kilde-definisjon)
Definerer *hvor* vi henter knagger fra.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| type | enum | `rss`, `scrape`, `manual`, `internal_avia`, `report`, `idea_bank` |
| name | string | "Kampanje", "DN", "ANFO", "Ide-bank" etc |
| url | string | |
| fetch_config | jsonb | Selektorer, frekvens, filtre |
| active | boolean | |

---

## Idea (ide-bank)
Personlig idé, fanget via tekst eller stemme. Materialiseres til Hook ved generering. Se `docs/18-ide-bank.md`.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| content | text | Redigert tekst |
| raw_transcription | text | Original transkribering (stemme) |
| audio_url | string | Supabase Storage-sti |
| audio_duration_seconds | int | |
| input_type | enum | `text`, `voice` |
| ai_summary | text | 1-setning fra AI |
| suggested_categories | uuid[] | FK → Category |
| suggested_pain_points | uuid[] | FK → PainPoint |
| suggested_usps | uuid[] | FK → USP |
| tags | string[] | |
| status | enum | `new`, `refined`, `used`, `archived` |
| used_in_posts | uuid[] | FK → Post |
| created_via | string | `keyboard`, `voice`, `mobile_share`, `email` |
| created_at / updated_at | timestamp | |

---

## Hook (knagg)
En konkret bit innhold fra en kilde som *kan* bli grunnlaget for en post. Kan komme fra Source (RSS/scrape/report) eller fra Idea.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| source_id | uuid | FK → Source (null hvis fra ide) |
| idea_id | uuid | FK → Idea (null hvis fra ekstern kilde) |
| url | string | Originallenke (null for ideer) |
| title | string | |
| summary | text | Rensket oppsummering |
| raw_content | text | Rå tekst fra henting |
| published_at | timestamp | Originalpublisering |
| fetched_at | timestamp | |
| categories | uuid[] | Foreslåtte kategorier |
| relevance_score | float | Hvor relevant for målgruppen |
| used_in_posts | uuid[] | Hvilke poster har brukt denne |
| status | enum | `new`, `reviewed`, `used`, `archived` |

---

## Post
Livssyklusen til en LinkedIn-post.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| primary_category_id | uuid | FK — styrer fargekode og sortering |
| category_ids | uuid[] | FK (via `post_categories`) — alle kategorier posten tilhører (inkluderer primær) |
| persona_id | uuid | FK (valgte persona for *denne* posten) |
| hooks | uuid[] | FK → Hook (0..n knagger) |
| pain_point_id | uuid | FK (hvis relevant) |
| related_usp_ids | uuid[] | FK → USP (hvis relevant) |
| status | enum | `draft`, `suggested`, `approved`, `scheduled`, `published`, `failed`, `archived` |
| body | text | Den faktiske posten |
| body_history | jsonb[] | Revisjonshistorikk |
| cta_mode | enum | `none` \| `soft` \| `direct` |
| attachments | uuid[] | FK → Attachment (bilder, karusell, dokument) |
| algorithm_score | float | Siste score fra algoritmefilter |
| algorithm_notes | text | Filterets innspill |
| algorithm_insight_version | int | Hvilken versjon av panelet som gjaldt |
| tuner_diff | jsonb | Hvis tuneren endret: før/etter + endringer |
| scheduled_for | timestamp | |
| published_at | timestamp | |
| linkedin_urn | string | ID på LinkedIn etter publisering |
| created_at / updated_at | timestamp | |

---

## Attachment
Vedlegg på post (bilde, karusell-slide, dokument).

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| post_id | uuid | FK |
| type | enum | `image`, `carousel_slide`, `document` |
| order | int | Rekkefølge i karusell |
| url_or_placeholder | string | Lagringssti, eller "placeholder" i MVP |
| alt_text | text | |
| ai_suggested_description | text | AI-forslag til bildeinnhold |
| metadata | jsonb | Dimensjoner, filstørrelse etc |

---

## Suggestion
Forslagene som vises side om side under generering. Persistent for læring.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| generation_id | uuid | Samler forslag fra samme generering |
| persona_id | uuid | |
| body | text | |
| algorithm_score | float | |
| chosen | boolean | Valgt av bruker |
| chosen_at | timestamp | |
| generator_meta | jsonb | Hvilken modell, hvilke knagger, hvilken prompt-versjon |

---

## PostMetric
Per-post metrikker fra LinkedIn.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| post_id | uuid | FK |
| measured_at | timestamp | |
| impressions | int | |
| reactions | int | |
| comments | int | |
| shares | int | |
| clicks | int | |
| follower_delta | int | Nye følgere i perioden |

---

## Event (læring + audit)
Alt som kan trene modellen, og alt som må etterprøves.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| type | enum | `suggestion_chosen`, `post_edited`, `post_scheduled`, `post_published`, `metric_updated`, `persona_updated`, `hook_ingested`, ... |
| actor | string | `user`, `scheduler`, `agent:<name>` |
| ref_id | uuid | Peker på objektet hendelsen gjelder |
| payload | jsonb | |
| created_at | timestamp | |

---

## LanguageCorpus (språkspeiling)
Indeks over målgruppens språkbruk.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| source_url | string | |
| chunk | text | 1–3 setninger |
| embedding | vector | |
| topic_tags | string[] | |
| collected_at | timestamp | |

---

## Company
Avia sin selskapsprofil — én rad (foreløpig).

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| name | string | "Avia" |
| legal_name | string | "Avia Produksjon AS" |
| tagline | text | |
| services | text[] | |
| core_model | text | Modellen vi jobber etter |
| target_segments | text[] | |
| scraped_urls | string[] | Kilder for USP-scraping |

---

## USP
Forskjellspunkter knyttet til Avia, brukes som kontekst i generering.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| company_id | uuid | FK |
| name | string | Kort navn ("Færre ledd") |
| description | text | |
| proof | text | Case, tall, eksempler |
| related_pain_points | uuid[] | FK → PainPoint |
| status | enum | `suggested`, `active`, `archived` |
| source_url | string | Scraping-kilde |
| approved_by | string | |
| created_at / updated_at | ts | |

---

## PainPoint
Målgruppens smertepunkter.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| name | string | Kort navn |
| description | text | Full formulering |
| priority | int | |
| active | boolean | |

**Initielle rader:**
1. Behovene vokser, budsjettene står stille.
2. Færre ledd, raskere leveranser.
3. Mindre støy, mer dybde.

---

## AlgorithmInsight
Versjonert innhold til Algoritme-innsikt-panelet.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| version | int | |
| active_from | timestamp | |
| active_to | timestamp | null = gjeldende |
| section | enum | `technical`, `b2b_practice`, `cultural` |
| bullets | text[] | |
| sources | text[] | |
| approved_by | string | |

---

## AIUsage
Forbrukssporing per LLM-kall.

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| timestamp | ts | |
| model | string | |
| module | enum | `generator`, `tuner`, `filter`, `evaluator`, `research`, `usp_extractor`, `transcription`, `idea_postprocess` |
| input_tokens | int | |
| output_tokens | int | |
| cost_cents | int | |
| ref_type | string | |
| ref_id | uuid | |

---

## BudgetSetting
Budsjettregler.

| Felt | Type |
|---|---|
| monthly_cap_cents | int |
| warn_at_percent | int (default 80) |
| hard_stop_at_percent | int (default 100) |

---

## post_categories (join-tabell)
Mange-til-mange mellom Post og Category. En rad pr. (post, kategori).

| Felt | Type | Beskrivelse |
|---|---|---|
| post_id | uuid | FK |
| category_id | uuid | FK |
| is_primary | boolean | Nøyaktig én rad pr. post har `is_primary = true` |

Constraint: unique på (post_id, category_id); sjekk at ≤1 primær pr. post.

---

## Nøkkelrelasjoner

- **Post n..n Category**: en post kan tilhøre flere kategorier (via `post_categories`); primærkategori styrer fargekode.
- **Persona 1..n Suggestion**: trening bygges opp over tid.
- **Post n..n Hook**: en post kan bruke flere knagger.
- **Post 1..n PostMetric**: metrikker hentes flere ganger.
- **Hook n..n Category**: en knagg kan passe flere kategorier.
- **Idea 1..n Hook**: en ide kan materialiseres til én eller flere knagger (hvis gjenbrukt).
- **Hook 0..1 Idea**: hvert Hook kan være knyttet til en Idea (valgfritt).
- **Company 1..n USP**: selskapet eier USP-ene.
- **USP n..n PainPoint**: en USP kan svare på flere pain points.
- **Post 1..n Attachment**: vedlegg i gitt rekkefølge.
- **Post 1..1 AlgorithmInsight-version**: hvilken versjon gjaldt ved generering.

---

## Indekser (viktige)

- `hook.status` + `hook.relevance_score` (knagg-brønn rangering)
- `post.scheduled_for` (scheduler)
- `post.status` (kalenderfiltrering)
- `event.type` + `event.created_at` (analyse og læring)
- `language_corpus.embedding` (vektor-indeks)
