# Deniz LinkedIn Hub — samlet planleggingsdokument

> **Om dette dokumentet:** Dette er en konsolidert gjennomgang av hele planen etter agent-review-01, arkitekt-review-01, agent-review-02, og integrering av ide-bank (ADR 023). Ment for grundig gjennomlesing. De opprinnelige, oppdelte dokumentene i `docs/` og `agents/` er fortsatt sannhetskilde — dette er et sammendrag for lesbarhet.
>
> Dato: 2026-04-20. Status: Fase 0 ferdig, klar for Fase 1.

---

## Innhold
1. [Overordnet mål og prinsipper](#1-overordnet-mål-og-prinsipper)
2. [Arkitektur (høyt nivå)](#2-arkitektur-høyt-nivå)
3. [Moduler](#3-moduler)
4. [Datamodell](#4-datamodell)
5. [Kategorier og innhold](#5-kategorier-og-innhold)
6. [Tone of voice + personas](#6-tone-of-voice--personas)
7. [Ide-bank](#7-ide-bank)
8. [Post-genereringsarkitektur](#8-post-genereringsarkitektur)
9. [Algoritmefilter + tuner](#9-algoritmefilter--tuner)
10. [Algoritme-innsikt-panel](#10-algoritme-innsikt-panel)
11. [Selskapsprofil og USP](#11-selskapsprofil-og-usp)
12. [Kalender](#12-kalender)
13. [Evaluering og læring](#13-evaluering-og-læring)
14. [Forbrukspanel](#14-forbrukspanel)
15. [Agent-økosystem](#15-agent-økosystem)
16. [Integrasjoner](#16-integrasjoner)
17. [Git og arbeidsflyt](#17-git-og-arbeidsflyt)
18. [Faseinndelt plan](#18-faseinndelt-plan)
19. [Vedtatte beslutninger (ADR-liste)](#19-vedtatte-beslutninger-adr-liste)

---

## 1. Overordnet mål og prinsipper

**Formål:** Plattform for Deniz (Avia Produksjon AS) til å planlegge, generere, revidere, publisere og evaluere LinkedIn-poster — alt på samme flate, med færrest mulig klikk.

**Forretningsmål:** Varme innkommende B2B-leads via LinkedIn.
**Målgruppe:** Markedsførere og markedssjefer i Norge.
**Eier:** Avia Produksjon AS. Deploy: `linkedin.avialab.no`.

### Ikke-forhandlingsbare prinsipper
1. **Null hallusinering.** Alt AI-innhold er forankret i en konkret knagg.
2. **Solid arkitektur fra bunnen.**
3. **Kunnskapsbasert, ikke generisk.**
4. **Plan før kode.**
5. **Algoritmefilter + tuner som siste ledd (med vetorett).**
6. **Prosjektminnet styrer kursen.**

### UI-prinsipp
- Én side, minimalistisk, færrest klikk.
- Venstre sidebar: personas, selskapsprofil, USP-er, ide-bank, innstillinger, forbrukspanel.
- Hovedområde: kalender + post-editor med LinkedIn-preview.
- Alltid tilgjengelig: algoritme-innsikt-panel + hurtig-capture til ide-bank.

---

## 2. Arkitektur (høyt nivå)

```
┌────────────────────────────────────────────────────────────┐
│ UI (Next.js + React + TypeScript + Tailwind, deployet på   │
│     Vercel)                                                │
│  - Sidebar, kalender, post-editor, LinkedIn-preview,       │
│    ide-bank-capture, algoritme-innsikt-panel, forbruks-    │
│    panel, innsikt-per-post                                 │
└────────────────────────────────────────────────────────────┘
                            │
┌────────────────────────────────────────────────────────────┐
│ Applikasjons-API (Next.js route handlers)                  │
│  - personas / company / ideas / posts / sources / calendar │
│  - evaluation / algorithm_insights / ai_usage /            │
│    transcription / agents                                  │
└────────────────────────────────────────────────────────────┘
        │            │              │              │
┌──────────────┐ ┌─────────┐ ┌────────────┐ ┌──────────────┐
│ AI/LLM-lag   │ │ Integra-│ │ Persistens │ │ Worker /     │
│ Opus / Sonnet│ │ sjoner  │ │ Supabase   │ │ scheduler    │
│ / Haiku /    │ │ LinkedIn│ │ (Postgres+ │ │ Railway      │
│ Whisper      │ │ RSS     │ │  pgvector+ │ │ BullMQ+Redis │
│              │ │ Scraping│ │  Storage+  │ │              │
│              │ │ Whisper │ │  Auth+RLS) │ │              │
└──────────────┘ └─────────┘ └────────────┘ └──────────────┘
```

### Tech-stack (vedtatt)
- **Next.js + TypeScript** (ADR 001)
- **Supabase** — Postgres + Auth + Storage + pgvector (ADR 002)
- **Vercel + Railway + Supabase** som kjøremiljø (ADR 003)
- **BullMQ + Redis** som scheduler (O1/ADR 022)
- **Claude-først:** Opus (generator, evaluator), Sonnet (tuner, filter, tekstforfatter, markedsfører, research, USP-ekstraktor), Haiku (klassifisering, ide-post-prosessering). OpenAI Whisper for transkribering.

### Språk
- **Kode og teknisk dokumentasjon:** engelsk (O2).
- **Strategi- og forretningsdokumenter:** norsk bokmål.

---

## 3. Moduler

| Modul | Formål |
|---|---|
| `personas/` | Flere stemmer, hard_rules + guidance + snippets |
| `company/` | Selskapsprofil, USP, pain points |
| `ideas/` | Ide-bank med tekst + stemme + transkribering |
| `sources/` | Knagger fra RSS, scraping, rapporter, internt, ide-bank |
| `posts/` | Livssyklus for post |
| `calendar/` | Tidsluker, foreslåtte postetider |
| `evaluation/` | Metrikker, læring, per-post innsikt |
| `algorithm_insights/` | Halvårsoppdatert LinkedIn-kunnskap |
| `ai_usage/` | Forbrukssporing og budsjett |
| `transcription/` | Whisper-integrasjon |
| `agents/` | Orkestrering av agent-kjede |

---

## 4. Datamodell (hovedentiteter)

- **Persona** — navn, tone, hard_rules, guidance, snippets, preferanse-vekter.
- **Category** — 4 kategorier med fargekode og generation_guidance.
- **PainPoint** — 3 initielle pain points.
- **Company** — Avia Produksjon AS, tjenester, modell, kilder.
- **USP** — forskjellspunkter med beskrivelse, bevis, kobling til pain points.
- **Source** — kilde-definisjon, type: `rss | scrape | manual | internal_avia | report | idea_bank`.
- **Idea** — fra ide-banken: content, raw_transcription, audio_url, ai_summary, suggested-kategorier/pain-points/USPer, status.
- **Hook (knagg)** — konkret innhold som *kan* bli grunnlag for en post. Kan ha `source_id` eller `idea_id`.
- **Post** — primary_category + category_ids (mange-til-mange), persona, hooks, cta_mode, attachments, algorithm-score, tuner-diff, status-livssyklus.
- **Attachment** — bilde/karusell-slide/dokument per post.
- **Suggestion** — N forslag per generering, lagret for læring.
- **post_categories** — join-tabell (post ↔ category, med is_primary-flagg).
- **PostMetric** — LinkedIn-metrikker per post over tid.
- **AlgorithmInsight** — versjonert panel-innhold med approved_at + next_review_due.
- **Event** — alt som trenes på eller må etterprøves.
- **LanguageCorpus** — indeks for språkspeiling (embedding + text).
- **AIUsage** — per LLM/Whisper-kall: modell, modul, tokens, kost.
- **BudgetSetting** — månedlig tak, varsling-terskler.

Mange-til-mange og læringsrelasjoner:
- Post ↔ Category (via `post_categories`, én primær)
- Persona ↔ Suggestion (læring over tid)
- Post ↔ Hook (en post kan bruke flere knagger)
- USP ↔ PainPoint (en USP kan svare på flere pain points)
- Idea → Hook (materialisering ved generering)

---

## 5. Kategorier og innhold

Fire kategorier, med mange-til-mange (én primær + evt. sekundære tags). Fargekode per kategori.

### 1. Gi verdi til andre (`give-value`) — varm gul
Løfte frem ansatte, partnere, kunder. Varm, ekte. Må ha navngitt person/partner/kunde som knagg.

### 2. Slik tenker vi (`slik-tenker-vi`) — dyp blå
Avias modell via kunnskapsdeling. Salg via fag, ikke slagord. Må være knyttet til konkret prinsipp eller fakta.

### 3. Hjelpe markedssjefer (`hjelpe-markedssjefer`) — grønn
Nyhet/rapport + "hva betyr dette for deg". Må alltid ha kilde + konkret vinkling.

### 4. Vise suksess (`vise-suksess`) — lilla
Direkte (lansering, milepæl, tall) eller indirekte (sidebemerkning som signal — sterkest). Ikke ene-kategori; kombineres oftest. Krever konkret fakta eller input fra bruker.

### Pain points (M2-svar)
1. Behovene vokser, budsjettene står stille.
2. Færre ledd, raskere leveranser.
3. Mindre støy, mer dybde.

### CTA-fordeling
- ~50% `none`, ~40% `soft`, ~10% `direct` (kun ved direkte tilbud-omtale).

---

## 6. Tone of voice + personas

### Grunn-tone (Deniz)
Kortfattet, rett frem, smart, levende. Talespråk > skriftspråk. "Keep it stupid simple."

### Hard_rules (brudd → avvis + regenerer)
- Ingen tankestreker (—, –).
- Ingen AI-klisjé-åpninger.
- Minst én knagg referert.

### Guidance (brudd → advarsel, lær over tid)
- Skriv som jeg snakker.
- Kort, rett frem.
- Start midt i når det fungerer.
- Ikke pretensiøs, ikke tunge åpninger.

### Personas
- Flere personas støttes (avkrysningsbokser i sidebar).
- 1 aktiv → 2 forslag. 2 aktive → 4 forslag (2 per persona).
- Per persona: tone_of_voice (tekst), hard_rules, guidance, snippets, target_audience_notes, preferanse-vekter.

### Speiling
Milde mønstre — vokabular, rytme, fragmenter. Aldri hele setninger (T1-svar utvidet).

---

## 7. Ide-bank

**Dokument:** [docs/18-ide-bank.md](docs/18-ide-bank.md). ADR 023.

### Formål
Fange ideer i øyeblikket og bruke dem som knagger i genereringsflyten.

### Inngangspunkter
- Tekst: raskt felt, `⌘+I` global shortcut.
- Stemme: `⌘+⇧+I` starter opptak, Whisper transkriberer asynkront.
- Fremtid: mobil-share, e-post, Slack.

### Flyt
1. Rå input → lagres som `Idea`.
2. Async post-prosessering (Haiku): sammendrag, kategori-/pain-point-/USP-forslag, tags.
3. Vises som ide-kort i sidebar.
4. "Generer post"-knapp → går inn i standard genereringsflyt med ideen som knagg.
5. Etter bruk: status = `used`.

### Tekniske valg
- **Transkribering:** OpenAI Whisper API.
- **Lagring:** Supabase Storage for lyd.
- **Personvern:** RLS på alle tabeller. Lyd kan slettes.
- **Integrasjon:** Ideer materialiseres til `Hook` — resten av arkitekturen er uendret.

### Spesielle regler i generering
- Generatoren vekter Deniz sin formulering som stilsignal (ikke bare tema).
- Algoritmefilter vekter autentisitet-dimensjonen høyere.
- Ide-baserte poster bevarer den opprinnelige tanken konkret.

---

## 8. Post-genereringsarkitektur

**Dokument:** [docs/17-post-genereringsarkitektur.md](docs/17-post-genereringsarkitektur.md). Kjernemodulen.

### 9-stegs flyt

```
0. Trigger (kategori+knagg, kalender-slot, eller ide-bank)
1. Kontekst-samling (persona, knagger, USP, innsikt, språkspeiling)
2. Pre-generation review (knagg + pain point + format på plass)
3. Generator (Opus, N forslag per persona, strukturell variasjon)
4. Regel-validering (hard_rules, regex, lengde)
5. Tekstforfatter-pass (Sonnet, polsk uten å endre budskap)
6. Markedsfører-vurdering (Sonnet, pain-point-treff, leadgen)
7. Algoritmefilter-score (Sonnet, 6 dimensjoner)
   → score < 0.25: blokker + regenerer
   → 0.25–0.70: tuner + re-validering
   → ≥ 0.70: direkte til bruker
8. Presentasjon (LinkedIn-preview, fargebånd, score, tuner-diff)
9. Bruker velger, reviderer, godkjenner → trening
```

### Agent-ansvar
- **Arkitekt:** rammeverket, kontrakter, sporbarhet, kostnadskontroll.
- **LinkedIn-ekspert:** format, lengde, hook-type, CTA-mode.
- **Tekstforfatter:** språk, tone, speiling.
- **B2B-markedsfører:** vinkling, pain-point-treff, leadgen.
- **Algoritmefilter + tuner:** publiseringsrisiko.
- **LLM-samarbeider:** prompt-maler, versjonering, evals.

### Felles guidance (signert av alle agentene sammen)
Se `docs/17` §4. Dekker formål, struktur, tone, troverdighet, leadgen, algoritme, teknisk, prompt-disiplin.

### Sikkerhetsnett
Tre lag: programmatisk regelvalidering + modellbasert filter + brukergodkjenning.

---

## 9. Algoritmefilter + tuner

**Dokument:** [docs/13-algoritmefilter-tuner.md](docs/13-algoritmefilter-tuner.md).

### Score-terskler
- **< 0.25:** blokker + regenerer.
- **0.25–0.70:** tuner kjører.
- **≥ 0.70:** direkte til bruker.

### Tuner-regler
- **Får gjøre:** linjeskift, stramme/løsne ±10%, bytte ut ≤3 ord for rytme, justere emoji, styrke første 2 linjer.
- **Får IKKE:** endre budskap, innføre AI-klisjéer/tankestreker, legge til ny CTA, bryte hard_rules.
- **Re-validering:** brudd → automatisk rollback.
- **Diff lagres:** før/etter, endringer, score-delta.

### Scoringsdimensjoner
Hook, rytme, commentability, risiko (invers), relevans, autentisitet.
*Ide-baserte poster vekter autentisitet høyere.*

---

## 10. Algoritme-innsikt-panel

**Dokument:** [docs/14-algoritme-innsikt-panel.md](docs/14-algoritme-innsikt-panel.md).

Alltid-synlig UI-panel + kontekst inn i generator. Tre seksjoner:
- **Teknisk algoritmestatus**
- **B2B-praksis i Norge**
- **Kulturelle normer (markedsbransje)**

### Oppdatering
- Halvårlig research-agent lager utkast → Deniz godkjenner (menneske i loop).
- "Sist oppdatert: dato" vises alltid øverst.
- `next_review_due`-varsel 7 dager før.
- Versjonert — gamle versjoner bevares.

### Bruk i generering
- Relevante utdrag sendes som kontekst til generator (ikke bare siste ledd).
- Gjør at postene skrives *med utgangspunkt i* hva som faktisk fungerer.

---

## 11. Selskapsprofil og USP

**Dokument:** [docs/15-selskapsprofil-og-usp.md](docs/15-selskapsprofil-og-usp.md).

### Selskapsprofil (global)
- Én rad for Avia Produksjon AS.
- Felt: name, legal_name, tagline, services, core_model, target_segments, scraped_urls.
- Persona kan overstyre enkelte felt som `target_audience_notes` og tone rundt omtale — ikke faktaene.

### USP-register
- Hver USP: navn, beskrivelse, **bevis** (case/tall/eksempler), kobling til pain points, status.
- Status: `suggested`, `active`, `archived`.
- Kilde-lenke lagres.

### USP-innhenting (O6-svar utvidet)
- **Flere kilder kombineres:**
  1. aviaprod.no (forside, tjenester, om, case).
  2. Web-søk om bedriften (pressesaker, intervjuer, omtaler).
  3. Offentlig SoMe-aktivitet (Avia Company Page + nøkkelpersoners offentlige profilaktivitet + Vimeo/YouTube).
- Syntese via USP-ekstraktor (Sonnet): sammenligner selvbilde og utsidens bilde.
- Deniz godkjenner hver USP.

### Bruk i generering
- Generator får matchede USP-er som ekstra knagg når pain point passer.
- USP er aldri sentrum — den er et diskret bevis.

---

## 12. Kalender

**Dokument:** [docs/08-kalender.md](docs/08-kalender.md).

- Ukevisning default, månedsvisning alternativ.
- Per-post: persona-farge, kategori-fargebånd, status, inline mini-metrikk.
- Foreslår optimale tidsluker for norsk B2B-marked (tir–tor 07:30–09:30 / 11:30–12:30 / søndag kveld).
- Adaptiv læring: egne metrikker over tid overskriver prior.
- **Frekvens (O5):** 1–2 poster/uke default, 3–4 ved kampanjeuker.
- Kollisjons-håndtering + helligdags-flagging.
- Høyreklikk på slot → "Generer post for denne slotten" eller "Generer fra ide".

---

## 13. Evaluering og læring

**Dokument:** [docs/09-evaluering-og-laering.md](docs/09-evaluering-og-laering.md).

### To læringskilder
- **Valg mellom forslag** → sterk preferansesignal.
- **Faktisk post-performance** → vektet performance-score.

### Per-post innsiktspanel (O10)
- Synlig direkte i editor/preview etter publisering.
- Viser score (pre/post-tuning), sammenligning mot persona-snitt, hva som ble oppdatert i preferansevekter.
- Ingen handlinger påkrevd — informativt.

### Evaluator-agent
- Async-jobb: leser metrikker → oppdaterer preferansevekter → flagger avvik.
- Oppdaterer ikke posten (F4 = "gjør ingenting").

### Kvalitetssignaler fra bruker
- Inline-edits (diff-analyse).
- "Avvis og regenerer" (negativt).
- Rask godkjenning uten redigering (positivt).

---

## 14. Forbrukspanel

**Dokument:** [docs/16-forbrukspanel.md](docs/16-forbrukspanel.md).

- Liten panel nederst i sidebar.
- Viser: månedstotal, prosent av tak, per-modell, per-modul.
- Modul-kolonner: `generator`, `tuner`, `filter`, `evaluator`, `research`, `usp_extractor`, `transcription`, `idea_postprocess`.
- Varsling ved 80% og 100% av tak.
- Ved 100%: nye genereringer blokkeres uten override.

---

## 15. Agent-økosystem

6 roller (ikke nødvendigvis separate prosesser):

1. **Software-arkitekt** — helhet, grenser.
2. **LinkedIn-ekspert** — format, plattform-praksis.
3. **Tekstforfatter (norsk)** — språk, tone, speiling.
4. **B2B-markedsfører** — pain points, leadgen, verdi.
5. **Algoritmefilter + tuner** — vetorett, ikke-invasiv optimalisering.
6. **LLM-samarbeider** — prompt-maler og evals.

Alle svarer alltid med strukturerte spørsmål + svaralternativer + anbefaling.

---

## 16. Integrasjoner

**Dokument:** [docs/04-integrasjoner.md](docs/04-integrasjoner.md).

| Integrasjon | Type | Status i MVP |
|---|---|---|
| LinkedIn publisering | API / manuell | Halvmanuell (L1) |
| LinkedIn metrikker | Manuell | Manuell logg |
| Kampanje RSS | RSS | Støttet |
| Kreativt Forum | RSS/scrape | Støttet |
| DN | RSS | Støttet (delvis betalingsmur) |
| ANFO / Nielsen | Scraping + PDF | Støttet (manuell upload som fallback) |
| aviaprod.no | Scraping | USP-kildesett |
| Web-søk | API | USP-syntese |
| Offentlig SoMe | API / scraping | USP-kilde |
| LLM (Claude) | API | Kritisk |
| Embedding | API | Høy (språkspeiling) |
| Whisper (transkribering) | API | Høy (ide-bank) |

---

## 17. Git og arbeidsflyt

**Dokument:** [docs/10-git-og-arbeidsflyt.md](docs/10-git-og-arbeidsflyt.md).

- Privat repo (D3).
- ADR-er i `decisions/`.
- Commit-agent + PR-review-agent fra Fase 1.
- Test- og doc-sync-agenter fra Fase 2+.
- Branch-regler: `main` alltid deploybar, feature-branches med ADR ved arkitektur-endringer.

---

## 18. Faseinndelt plan

**Dokument:** [docs/02-plan.md](docs/02-plan.md).

### Fase 0 — Planlegging og arkitektur ✅
Alt ferdig. Alle åpne spørsmål besvart. ADR-er skrevet. 18 docs + 6 agentdefinisjoner.

### Fase 1 — Grunnmur
- Repo, Supabase, auth, basisskjema.
- Deploy-pipeline (Vercel + Railway + Supabase).
- Prompt-repo-struktur med versjonering + canary-evals.

### Fase 2 — Kilder og ide-bank
- RSS + scraping + rapport-parsing.
- **Ide-bank (tekst + Whisper-transkribering).**
- Kategori-klassifisering.
- USP-scraping med multi-kilde syntese.

### Fase 3 — AI-generering
- Generator (Opus) med strukturerte kontrakter.
- Tekstforfatter, markedsfører, algoritmefilter + tuner.
- Algoritme-innsikt-panel (initielt utkast).
- Dry-run: ingenting publiseres.

### Fase 4 — UI
- Sidebar, kalender, editor, LinkedIn-preview, innsikt-paneler.
- Ide-bank-UI (ide-kort, hurtig-capture, `⌘+I`/`⌘+⇧+I`).
- Forbrukspanel.

### Fase 5 — Publisering + evaluering
- LinkedIn API (når godkjent) eller halvmanuell i MVP.
- Scheduler for publisering.
- Metrikkinnhenting + evaluator.
- Per-post innsiktspanel.

### Fase 6 — Optimalisering
- Finpuss, kostnadskontroll, evt. finetuning av personas.

---

## 19. Vedtatte beslutninger (ADR-liste)

| ID | Tema |
|---|---|
| 001 | Next.js monolitt |
| 002 | Supabase (Postgres + Auth + Storage + pgvector) |
| 003 | Vercel + Railway + Supabase som kjøremiljø |
| 010 | Kategori 2-navn: "Slik tenker vi" |
| 021 | Kategori 4 "Vise suksess" + mange-til-mange kategori-modell |
| 022 | Agent-review 02 (O1–O11) besvart |
| 023 | Ide-bank som førsteklasses knagg-kilde |

Ytterligere ADR-er skrives etter hvert som Fase 1 begynner og flere valg konkretiseres (auth-scopes, RLS-policies, prompt-versjonering).

---

## Klargjøring til Fase 1

**Alt på plass:**
- Tech-stack valgt.
- Kjernemoduler beskrevet.
- Tone, personas, kategorier, pain points, USP-modell på plass.
- Ide-bank integrert i arkitekturen.
- Post-genereringsarkitektur som eget hoveddokument.
- Algoritmefilter utvidet til filter + tuner.
- Kostnadskontroll og budsjett definert.
- Alle åpne spørsmål besvart.

**Gjenstår (ikke-blokkerende for Fase 1-start):**
- DNS CNAME settes opp når deploy nærmer seg.
- USP-scraping kjøres i Fase 2 (kan ikke gjøres før modulen er bygd).
- Initielle hard_rules + guidance per persona legges inn når admin-UI er klart.

**Klar for godkjenning.** Si fra hvis du vil justere noe før Fase 1 starter.
