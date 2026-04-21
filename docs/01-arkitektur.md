# Arkitektur — Deniz LinkedIn Hub

> **Status:** Utkast til gjennomgang. Alle valg er foreløpig markert med anbefaling + alternativer. Endelig stack besluttes først etter agent-gjennomgang og brukergodkjenning.

---

## 1. Designprinsipper

1. **Monorepo, modulært.** Klar separasjon mellom presentasjon, domenelogikk, integrasjoner og AI-lag.
2. **AI som tjeneste, ikke som magi.** All AI-generering går gjennom et tydelig, testbart lag med inn/ut-kontrakter.
3. **Knagg-først.** Ingen post lages uten en registrert "knagg" (kilde/input) — arkitekturen skal håndheve dette.
4. **Event-logg for læring.** Hver bruker-interaksjon som kan trene modellen lagres som hendelse.
5. **Én person, men bygg som team-klar.** Auth, multi-user og rollestyring bygges inn selv om det er én bruker nå.
6. **Lokalt først, sky når nødvendig.** Start enkelt — skaler ved behov.

---

## 2. Lagdelt arkitektur (høyt nivå)

```
┌─────────────────────────────────────────────────────────────┐
│  UI-lag (Single-page app)                                   │
│  - Sidebar (innstillinger, personas)                        │
│  - Kalender (plan + publisert + evaluering)                 │
│  - Post-editor (forslag, revidering, godkjenning)           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│  Applikasjons-API (domenelogikk)                            │
│  - Personas   - Poster   - Kalender   - Evaluering          │
│  - Kilder/knagger        - Læringsløkke                     │
└─────────────────────────────────────────────────────────────┘
        │                │                │               │
┌───────────────┐  ┌───────────┐  ┌────────────┐  ┌──────────┐
│ AI/LLM-lag    │  │ Integra-  │  │ Persistens │  │ Jobber/  │
│ - Generator   │  │ sjoner    │  │ - DB       │  │ scheduler│
│ - Evaluator   │  │ - LinkedIn│  │ - Vektor   │  │ - Cron   │
│ - Filter      │  │ - RSS     │  │ - Filer    │  │ - Køer   │
│ - Speiling    │  │ - Scraping│  │            │  │          │
└───────────────┘  └───────────┘  └────────────┘  └──────────┘
```

---

## 3. Moduloversikt

### 3.1 UI-lag
- **Rammeverk (vedtatt A1):** **Next.js (App Router) + React + TypeScript + Tailwind**.
- **Kalender-komponent:** FullCalendar eller egen lettvektsløsning (minimalistisk design krever trolig egen).
- **State:** React Query for server-state, Zustand for lokal UI-state.
- **Kjernekomponenter:**
  - Sidebar (personas, selskapsprofil, USP-er, innstillinger, forbrukspanel).
  - Kalender.
  - Post-editor med forslag side om side.
  - **LinkedIn-preview** per forslag (se `docs/12`).
  - **Algoritme-innsikt-panel** (se `docs/14`).

### 3.2 Backend / API
- **Vedtatt A1:** Next.js-monolitt med route handlers. Tunge/langvarige jobber kjøres på Railway-worker.
- **Auth:** Supabase Auth (vedtatt A2) — passordløs magic link. Multi-user-scoping fra dag én (A5).
- **Domenemoduler:**
  - `personas/` — CRUD, hard_rules, guidance, snippets, treningsdata.
  - `company/` — Avia sin selskapsprofil + USP-register + pain points (se `docs/15`).
  - `ideas/` — ide-bank med tekst + stemmeopptak + transkribering (se `docs/18`).
  - `posts/` — livssyklus (utkast → forslag → godkjent → planlagt → publisert → evaluert).
  - `sources/` — knagger fra RSS, scraping, manuelle inputs, interne Avia-kilder, USP-scraping, ide-bank.
  - `calendar/` — tidsluker, anbefalinger, konflikter.
  - `evaluation/` — metrikker, læring, feedback-loop.
  - `algorithm_insights/` — alltid-oppdatert LinkedIn-kunnskap (se `docs/14`).
  - `ai_usage/` — forbrukssporing og budsjett (se `docs/16`).
  - `transcription/` — lydopptak → tekst via Whisper.
  - `agents/` — orkestrering av agent-kjede under generering og review (inkl. tuner-steg).

### 3.3 AI/LLM-lag
En klar separasjon mellom:
- **Generator** (Opus) — lager forslag (alltid N forslag per persona).
- **Reviser** (Sonnet) — forbedrer etter brukerfeedback.
- **Algoritmefilter + tuner** (Sonnet/Haiku) — scoring + ikke-invasiv justering før publisering.
- **Speilingsmodul** — henter ut målgruppens faktiske språk fra scrapet/indeksert materiale.
- **Evaluator** (Opus/Sonnet) — analyserer performance etter publisering og oppdaterer persona-vekter (uten å handle på posten — F4).
- **Research** (Sonnet) — halvårlig oppdatering av Algoritme-innsikt-panel.
- **USP-ekstraktor** (Sonnet) — foreslår USP-er fra scraping av avia.no/avialab.no.

**Kontrakter:** Alle kall er strukturert JSON inn/ut. Ingen fri tekst uten grunn.
**Modellvalg:** Claude-først (P1). Modellfordeling etter kost/kvalitet. Hvert kall logges til `ai_usage` for forbruksmåling.

### 3.4 Integrasjoner
- **LinkedIn API** for publisering og henting av metrikker. *Merk: LinkedIn begrenser API-tilgang — se åpne spørsmål, dette er et kritisk tidlig valg.*
- **RSS + HTML-henting** for kampanje.com, Kreativt Forum, DN, ANFO, Nielsen.
- **Scraping-lag** for språkspeiling (kampanje.com og lignende) — respekterer robots.txt.
- **Interne Avia-kilder:** avia.no (arbeider), evt. API/RSS for SoMe-feeden deres.

### 3.5 Persistens
- **Hoveddatabase (vedtatt A2):** PostgreSQL via **Supabase** (inkl. Auth, Storage, pgvector).
- **Vektor-DB:** pgvector i Supabase.
- **Filer/vedlegg:** Supabase Storage.

### 3.6 Jobber og scheduler
- **Kjøremiljø (vedtatt A3):** Railway-worker (siden Vercel ikke egner seg for long-running).
- **Scheduler (foreslått A4 = BullMQ + Redis — venter på endelig bekreftelse, se `agent-review-02.md` O1).**
- **Jobber:**
  - Henting av nyheter/rapporter (RSS, scraping).
  - Planlagt publisering (halvmanuell notifikasjon i MVP).
  - Henting av postmetrikker (manuelt i MVP, automatisk senere).
  - Nattlig indeksering av språk-korpus.
  - Halvårlig research for Algoritme-innsikt-panel.
  - USP-scraping på forespørsel.

---

## 4. Datastrømmer (hovedflyter)

### Flyt A — Generer post
1. Bruker velger kategori + evt. knagg (eller lar systemet foreslå).
2. Huker av 1 eller 2 personas.
3. API kaller AI-laget: generator → N forslag per persona.
4. Algoritmefilteret gir score + innspill per forslag.
5. Forslag vises side om side i editoren.
6. Bruker velger best, reviderer, godkjenner.
7. Valg logges → personas treningsdata oppdateres.

### Flyt B — Planlegg i kalender
1. Godkjent post dras inn i kalender, eller systemet foreslår tidsluke.
2. Kalender validerer mot optimal-tid-modellen (norsk marked, målgruppe).
3. Publiseringsjobb opprettes.

### Flyt C — Publisering + evaluering
1. Scheduler trigger publisering via LinkedIn API.
2. Poll for metrikker etter 1t, 6t, 24t, 7d.
3. Metrikker → evaluator → personas preferansemodell oppdateres.

### Flyt D — Knagg-innhenting
1. Scheduler henter RSS + scraper kilder.
2. Dedupliserer, klassifiserer relevans mot kategorier.
3. Viser i "knagg-brønn" i UI — klar til å trigge generering.

### Flyt E — Språkspeiling
1. Scheduler scraper bransjesider for målgruppens språkbruk.
2. Renser, chunker, embedder → vektor-DB.
3. Generator slår opp relevante snutter som tone-kontekst før generering.

---

## 5. Modulgrenser og kontrakter

Hver domenemodul eksponerer et tydelig API (typed, dokumentert). Ingen modul kan lese eller mutere en annen modul sine tabeller direkte. AI-laget vet ingenting om UI. UI kjenner ikke til AI-leverandørene. Dette er ufravikelig.

---

## 6. Observability og trygghet

- **Logging:** Strukturert (JSON), per forespørsel, per AI-kall.
- **Audit-logg** for alt som publiseres eller kan påvirke Deniz sitt offentlige nærvær.
- **Kill switch:** Én bryter som stanser all automatisk publisering.
- **Dry-run-modus:** Alle publiseringsveier skal kunne kjøres uten faktisk å poste.

---

## 7. Git og arbeidsflyt (anbefaling)

Se `docs/10-git-og-arbeidsflyt.md`.

---

## 8. Åpne arkitekturvalg

Samlet i `docs/11-apne-sporsmal.md` og `decisions/agent-review-02.md`.

## 9. Deploy

- **Domene:** `linkedin.avialab.no` (vedtatt D1).
- **DNS:** CNAME til Vercel — eierskap må bekreftes (se agent-review-02 O3).
- **Miljøer:** `dev` (lokalt), `staging` (Vercel preview), `prod` (Vercel + Supabase prod).
