# Plandokument — Faseinndelt roadmap

> **Regel:** Ingen fase starter før forrige er godkjent. Dette dokumentet er hoved-roadmap og oppdateres underveis.

---

## Fase 0 — Planlegging og arkitektur (NÅ)

**Mål:** Alle åpne spørsmål er besvart. Arkitektur godkjent. Personas og tone of voice dokumentert. Ingen kode skrevet.

### Leveranser
- [x] Mappestruktur opprettet
- [x] Prosjektgrunnlag (`00-prosjektgrunnlag.md`)
- [x] Arkitektur (`01-arkitektur.md`) — oppdatert med svar
- [x] Datamodell (`03-datamodell.md`) — oppdatert med USP, Company, PainPoint, AlgorithmInsight, Attachment, AIUsage
- [x] Integrasjoner (`04-integrasjoner.md`)
- [x] Kategorier (`05-kategorier.md`) — oppdatert med "Slik tenker vi" og pain points
- [x] Tone of voice + persona-system (`06-tone-og-personas.md`) — hard_rules vs guidance
- [x] Genereringsflyt (`07-generering.md`) — cta_mode, tuner, insights
- [x] Kalender og optimale tider (`08-kalender.md`)
- [x] Evaluering og læring (`09-evaluering-og-laering.md`)
- [x] Git/arbeidsflyt (`10-git-og-arbeidsflyt.md`)
- [x] Åpne spørsmål (`11-apne-sporsmal.md`)
- [x] LinkedIn-preview-komponent (`12-linkedin-preview.md`)
- [x] Algoritmefilter + tuner (`13-algoritmefilter-tuner.md`)
- [x] Algoritme-innsikt-panel (`14-algoritme-innsikt-panel.md`)
- [x] Selskapsprofil + USP (`15-selskapsprofil-og-usp.md`)
- [x] Forbrukspanel (`16-forbrukspanel.md`)
- [x] Agentdefinisjoner (`agents/*`)
- [x] Agent-gjennomgang 01 (`decisions/agent-review-01.md`) — besvart
- [x] Arkitekt-review 01 (`decisions/arkitekt-review-01.md`)
- [x] Agent-gjennomgang 02 (`decisions/agent-review-02.md`) — venter på svar
- [ ] ADR-er for vedtatte beslutninger
- [ ] DNS/domene-eierskap bekreftet (`linkedin.avialab.no`)
- [ ] Avia-selskapsprofil første utkast (Deniz + USP-scraping-forslag)

### Eksittkriterier Fase 0
- ✅ Alle åpne spørsmål i `agent-review-02.md` er besvart.
- ✅ DNS-eierskap bekreftet (Deniz eier avialab.no).
- ⏳ Selskapsprofil med 3 godkjente USP-er lages i Fase 2 (USP-scraping).
- ⏳ Brukers endelige godkjenning av arkitekturen.

**Status:** Fase 0 ferdig på arkitekt-siden. Klar for Fase 1 ved brukergodkjenning.

---

## Fase 1 — Grunnmur (ingen UI-flate ennå) — I GANG

**Mål:** Repo, database, auth, domenemoduler (personas, company, categories) fungerer ende-til-ende.

### Leveranser (status)
- [x] Repo initialisert (Git + .gitignore + Prettier + EditorConfig + pnpm workspace).
- [x] Next.js app-scaffold (`app/`) med strict TS, Tailwind, typed env, Supabase SSR auth + login-form + magic link callback + sign-out + /api/health.
- [x] BullMQ worker-scaffold (`worker/`) med pino-logger, typed env, Redis-connection og placeholder-worker.
- [x] Shared-pakke (`shared/`) med domenekonstanter, Zod-skjemaer for Generation/Suggestion og prompt-loader-utilities.
- [x] Supabase-prosjektkonfig (`supabase/config.toml`) med auth, storage buckets (audio, attachments) og magic-link-template.
- [x] Database-skjema (full arkitektur): 18 tabeller + enums + pgvector + indekser.
- [x] RLS-policies for multi-user (A5) på alle tabeller + storage buckets.
- [x] Seed via auth-trigger: kategorier × 4, pain points × 3, Avia company, Deniz-persona med hard_rules + guidance, budget_settings, initial algorithm_insights (v1) for alle 3 seksjoner.
- [x] Prompt-repo (`prompts/`) med versjonerings-skjema + utkast til generator@v1, tuner@v1, filter@v1 + canary-case + eval-runner-skjelett.
- [x] CI (GitHub Actions): typecheck + lint + eval-struktur-validering + migrasjon-sanity.
- [x] Deploy-konfig: `vercel.json` (app) + `railway.toml` (worker).
- [x] `.env.example` med alle miljøvariabler dokumentert.
- [x] `README-dev.md` med full setup-flyt (installasjon, Supabase local, dev-kommandoer, deploy).
- [ ] Første faktiske deploy (krever Deniz å opprette Vercel/Railway/Supabase-prosjekter og sette DNS).
- [ ] Første USP-forslag — tas i Fase 2 via scraping-modulen.

---

## Fase 2 — Knagg-innhenting

**Mål:** Systemet henter, dedupliserer, og viser "knagger" fra valgte kilder.

### Leveranser
- RSS-henter for kampanje.com, Kreativt Forum, DN.
- Scraper for rapport-kilder (ANFO, Nielsen) — respekterer robots.txt.
- Manuell "lim inn lenke" som knagg.
- Interne Avia-kilder koblet på.
- Kategori-klassifisering (mot de tre kategoriene).

---

## Fase 3 — AI-generering (generator + algoritmefilter)

**Mål:** Fra en knagg kan systemet produsere N forslag per persona, scoret av algoritmefilteret.

### Leveranser
- Generator-API med strenge input/output-kontrakter.
- Personas preferansemodell (start med prompt-baserte, ikke finetuning).
- Algoritmefilter som siste ledd, med begrunnet score og innspill.
- Språkspeiling (retrieval fra vektor-DB).
- Dry-run: ingen poster publiseres.

---

## Fase 4 — UI (single page)

**Mål:** Alt på én side, færrest mulig klikk. Sidebar + kalender + editor.

### Leveranser
- Sidebar med personas og innstillinger.
- Kalender som hovedflate.
- Editor med side-om-side forslag.
- Mørk/lys modus.

---

## Fase 5 — Publisering + evaluering

**Mål:** Planlegg → publiser → mål → lær.

### Leveranser
- LinkedIn API-integrasjon (publisering).
- Scheduler for publisering.
- Metrikkinnhenting.
- Evaluator som oppdaterer personas preferanser ut fra valg + faktisk performance.
- Kill switch og audit-logg.

---

## Fase 6 — Optimalisering

**Mål:** Finpuss, speedtester, kostnadskontroll, evt. finetuning av personas.

---

## Prinsipper for faseovergang

1. Hver fase starter med en kort "fase-kickoff" hvor agentene stiller oppfølgingsspørsmål.
2. Hver fase slutter med en demo + retro. Lærdommer logges i `decisions/`.
3. Scope-endringer krever oppdatering av både `01-arkitektur.md` og dette dokumentet.
