# Arkitekt-review 01 — etter agent-svar

> Gjennomgang av svarene i `agent-review-01.md` sett fra software-arkitekt + LinkedIn-algoritmefilter som siste ledd. Målet er å fange risikoer, avklare uklarheter, og peke på det som må på plass før Fase 1.

---

## 1. Vedtatte beslutninger (klare til ADR)

| ID | Beslutning | ADR |
|---|---|---|
| A1 | Next.js (App Router) + TypeScript monolit | `001` |
| A2 | Postgres via Supabase (inkl. auth, pgvector) | `002` |
| A3 | Vercel (frontend) + Supabase (DB/auth) + Railway (worker) | `003` |
| A5 | Multi-user-scoping fra dag én | `004` |
| L1 | Halvmanuell publisering i MVP | `005` |
| L2 | Deniz personlig som publiseringsidentitet i MVP | `006` |
| T1 | Speiling: vokabular + rytme + fragmenter — aldri hele setninger | `007` |
| T3 | Bokmål only i start | `008` |
| T4 | Maks ett kort sitat (<15 ord) per post, med kilde | `009` |
| M1 | Navn på Kategori 2: "Slik tenker vi" | `010` |
| M3 | CTA varierer: ingen / soft / sjelden direkte | `011` |
| M4 | Manuell lead-logg i MVP | `012` |
| F3 | Algoritmefilteret ser hele konteksten | `013` |
| F4 | Ingen auto-fjerning — evaluering er informasjon | `014` |
| P1 | Claude-først med abstraksjonslag | `015` |
| P2 | Prompter versjoneres som kode i repo | `016` |
| P3 | Cleanup-retry hvis modellen nekter | `017` |
| D1 | Avia Produksjon AS eier. Deploy: `linkedin.avialab.no` | `018` |
| D3 | Privat repo, privat prosjekt | `019` |
| D4 | Månedlig tak + forbrukspanel i UI | `020` |

---

## 2. Svar som endrer arkitekturen materielt (må oppdateres i docs)

### 2.1 L3 — rigg for tekst + bilde + karusell, med LinkedIn-preview i UI
**Arkitektpåvirkning:** Middels.
- Data-modell: `post.body` er ikke nok. Trenger `post.attachments` (type: image / document / carousel) med ordnet rekkefølge.
- UI: ny kjernekomponent `<LinkedInPostPreview/>` som viser tekst + evt. bilder/karusell som LinkedIn gjør det.
- MVP-kompromiss: bilder og karusell-slides kan være placeholders (mockup) før LinkedIn-publisering er automatisert. Genereringslaget produserer plassholdere + alt-tekst-forslag.
- **Ny leveranse i Fase 4 (UI):** LinkedIn-preview-komponent. Beskrives i `docs/12-linkedin-preview.md`.

### 2.2 M2 — nye pain points + USP-modul
**Arkitektpåvirkning:** Høy.
- Gamle pain points erstattes av Deniz sine tre:
  1. *Behovene vokser, budsjettene står stille.*
  2. *Færre ledd, raskere leveranser. Jobb direkte med kreative talenter.*
  3. *Mindre støy, mer dybde. Tilliten til reklame synker.*
- **Ny modul: Company Profile + USP-register.** Dette er forretningskontekst som alle personas kan trekke på. Skiller seg fra persona (som er stemme/stil).
- **USP-scraping-flyt:** Bruker trykker "Foreslå USP-er fra nettsiden vår" → systemet scraper og henter ut → foreslår en strukturert liste → Deniz redigerer og godkjenner.
- Generator får USP-kontekst når den skal svare på en pain point, slik at svaret har en konkret, Avia-spesifikk forankring.

### 2.3 F1/F2 — algoritmefilteret utvides fra "filter" til "filter + tuner"
**Arkitektpåvirkning:** Høy. Dette er den største endringen.
- Før: filter blokkerer hvis score < terskel.
- Nå: filter foreslår/utfører **små, ikke-invasive justeringer** for å optimalisere for algoritmen, uten å endre budskap eller tone.
- Blokkering kun ved svært lav score (f.eks. 0.25). Mellom 0.25 og terskel → tuner kjører.
- **Risiko (må håndteres):** Tuneren kan reintrodusere AI-klisjéer eller tankestreker vi eksplisitt avviser. Derfor:
  - Tuneren arver don't-reglene fra aktiv persona og fra tekstforfatter-agenten.
  - Etter tuning skjer en **re-valideringskjøring** mot don't-regler før posten vises.
  - Diff mellom pre- og post-tuning lagres — Deniz kan se og rulle tilbake.
- Dette speiles i `agents/05-algoritmefilter.md` og beskrives i `docs/13-algoritmefilter-tuner.md`.

### 2.4 F1 vedlegg — Algoritme-innsikt-panel alltid synlig
**Arkitektpåvirkning:** Høy.
- **Ny modul:** `algorithm_insights`. Liten komponent i UI som viser:
  - Tekniske algoritmesignaler (hva LinkedIn favoriserer nå).
  - Etablerte praksiser for B2B marketing på LinkedIn i Norge.
  - Kulturelle normer relevant for markedsbransjen.
- Oppdateres **halvårlig** via et styrt researchflow (agent + menneskelig godkjenning).
- Brukes TO steder i flyten:
  - **Tidlig:** som kontekst inn i generatoren (ikke bare som siste ledd).
  - **UI:** synlig panel, alltid åpent eller ett-klikks-tilgjengelig.
- Beskrives i `docs/14-algoritme-innsikt-panel.md`.

### 2.5 T2 — skille do/don't-regler fra "guidance"
**Arkitektpåvirkning:** Lav-medium.
- To nye felter per persona:
  - `hard_rules` (tidligere `dont_rules`): brudd → avvisning og regenerering.
  - `guidance` (tidligere løse "do"-felt): brudd → advarsel, vis posten likevel, flagg for læring.
- Reduserer risiko for over-filtrering.
- Oppdateres i `docs/06-tone-og-personas.md` og `docs/03-datamodell.md`.

### 2.6 M3 — CTA varierer bevisst
**Arkitektpåvirkning:** Lav.
- Generatoren trenger en `cta_mode`-parameter: `none` / `soft` / `direct`.
- Fordelingsanbefaling: ~50% none, ~40% soft, ~10% direct. Læres over tid.
- Direct CTA brukes bare når posten eksplisitt handler om Avias tilbud.
- Oppdateres i `docs/07-generering.md`.

### 2.7 D4 — forbrukspanel i UI
**Arkitektpåvirkning:** Lav.
- Nytt modul: `ai_usage_tracker` som logger tokens per kall, estimerer kostnad.
- Liten komponent i sidebar viser månedlig forbruk og tak.
- Varsling når 80% og 100% av tak er nådd.

---

## 3. Potensielle problemer og svakheter — identifisert av arkitekten

### 3.1 Konflikt mellom A4 (ingen svar) og A1 (Next.js = Node)
Brukeren skrev: *"Du anbefalte jo ikke Node i spm A1??"*

**Arkitektens avklaring:** Dette er en forvirring vi må lukke. **Next.js kjører på Node.js.** De er ikke konkurrenter — Next.js er et rammeverk *på toppen av* Node. Når vi har valgt Next.js, har vi også implisitt valgt Node som runtime. BullMQ (Node-økosystem) er dermed konsistent.

**Forslag:** La A4 stå som A (BullMQ + Redis), men ta en kort oppfølging med Deniz. Se oppfølgingsspørsmålet i `decisions/agent-review-02.md`.

### 3.2 L4 — frekvens: brukeren ønsker B2B-markedsfører-vurdering
Deniz ba om at markedsfører-agenten veier inn, og heller foreslår 1–2/uke.

**Markedsfører-agentens vurdering:**
- 1–2 kvalitetsposter per uke slår 4–5 middels poster 10 av 10 ganger for B2B-leadgen i Norge.
- Norsk markedsbransje er liten — overposting virker støyende.
- **Anbefaling: 1–2 per uke som default, kan variere i "kampanjer" (f.eks. ved nye Avia-arbeider).**

**Arkitektvedtak:** Settes som default i kalender-modulen. Brukeren kan overstyre.

### 3.3 D2 — språk i kode (svar: C = alt på engelsk, inkl. docs)
**Dette er i konflikt med at all planlegging hittil er skrevet på norsk, og Deniz skriver selv på norsk.**

**Arkitekten flagger:**
- Alternativ 1: Oversette alle eksisterende planleggingsdokumenter til engelsk nå. Stort arbeid, men konsistent.
- Alternativ 2: Tolke D2=C som "**fra nå av**, nye docs og kode på engelsk" mens eksisterende planleggingsdokumenter forblir norske.
- Alternativ 3: Bryte opp D2: "kode og teknisk dokumentasjon på engelsk; strategi-/forretningsdokumenter på norsk".

**Anbefaling fra arkitekt og tekstforfatter-agent samlet:** Alternativ 3. Norsk er en del av produktets forankring. Koden skal være engelsk for å være samarbeidsklar.

**Dette må avklares eksplisitt** — se oppfølgingsspørsmål.

### 3.4 F4 — "gjør ingenting" ved underpresterende post
**Arkitektflagg:** Brukeren valgte C (gjør ingenting, evaluering er bare informasjon). Dette er greit — men evaluator-komponenten må fortsatt kjøre. Den skal ikke auto-handle, men den skal **oppdatere personaens preferansevekter** basert på performance, ellers mister vi læringseffekten.

**Vedtak:** Evaluator logger og oppdaterer trenings-tilstand uten å endre post eller arkivere. Ingen UI-varsling om underpresterende post med mindre brukeren aktivt ber om det.

### 3.5 Deploy-mål `linkedin.avialab.no`
**Arkitektflagg:**
- Krever DNS-konfig (CNAME / A-record) under `avialab.no`-domenet. Hvem eier det? Hvem kan sette opp DNS?
- Vercel støtter custom domain enkelt.
- Bør stå klart før Fase 1 avslutter (nødvendig for staging/prod-deploy).

**Oppfølging:** Ta med i Fase 1 infra-oppgaver.

### 3.6 Scraping av Avia sin egen nettside (USP-flyt)
**Arkitektflagg:**
- Gå gjennom hva som faktisk ligger offentlig på avia.no / avialab.no.
- Respekter robots.txt også på eget domene (for konsistens).
- Vurder om vi heller bør ha et **strukturert "company profile"-skjema** der Avia selv legger inn USP-er — og bruke scraping bare for *forslag*, ikke som sannhet.

**Anbefaling:** Scrape → AI foreslår → menneske godkjenner → lagres strukturert. Aldri generer poster direkte fra scraped rå tekst.

### 3.7 Kostnadskontroll er undervurdert
Algoritmefilter + tuner + generator = minst 3 LLM-kall per forslag. Med 2 personas × 2 forslag × 3 kall = 12 LLM-kall per generering.

**Arkitektflagg:**
- 500 kr/mnd er realistisk for MVP med 1–2 poster/uke, men ikke hvis Deniz genererer mye eksperimenter.
- **Anbefaling:** Sonnet/Haiku for tuner og filter. Opus kun for generator og evaluator. Logg per-kall-kost.

### 3.8 Prompt-versjonering vs. treningsdata
**Arkitektflagg:** Når prompt-versjon endres, gjelder eldre treningsdata fortsatt? 

**Vedtak:** Hvert `Suggestion` / `Event` har prompt-versjon. Evaluator vekter nyere data høyere, og kan segmentere læring per prompt-versjon hvis det blir relevant.

---

## 4. Nye dokumenter som skal skrives

| Dok | Formål |
|---|---|
| `docs/12-linkedin-preview.md` | UI-komponent for preview av post |
| `docs/13-algoritmefilter-tuner.md` | Utvidet rolle: filter + tuner |
| `docs/14-algoritme-innsikt-panel.md` | Alltid-oppdatert kunnskapspanel |
| `docs/15-selskapsprofil-og-usp.md` | Company profile + USP-register |
| `docs/16-forbrukspanel.md` | AI-forbruksmåling |

---

## 5. Dokumenter som må oppdateres

| Dok | Endring |
|---|---|
| `docs/03-datamodell.md` | Company, USP, AlgorithmInsight, Attachment, CTAMode, hard_rules vs guidance |
| `docs/05-kategorier.md` | Erstatte pain points med Deniz sine tre |
| `docs/06-tone-og-personas.md` | Skille hard_rules fra guidance |
| `docs/07-generering.md` | cta_mode-parameter, tuner-steg, innsikt som kontekst |
| `docs/01-arkitektur.md` | USP-modul, innsikts-panel, tuner, forbrukspanel |
| `docs/02-plan.md` | Fase 1-forberedelser: DNS, budsjett, Avia-profil, domeneeierskap |
| `docs/11-apne-sporsmal.md` | Status oppdatert |
| `agents/05-algoritmefilter.md` | Tuner-rolle, re-validering |
| `agents/04-markedsforer.md` | Nye pain points og frekvensanbefaling |

---

## 6. Gjenstående avklaringer (se `agent-review-02.md`)

1. A4 — bekreft BullMQ (Next.js = Node)
2. D2 — språk-skille: full engelsk, eller "engelsk kode + norsk forretningsdokumenter"?
3. Hvem eier DNS på `avialab.no`?
4. Budsjett-fordeling per modell (Opus vs Sonnet vs Haiku) — anbefaling klar, trenger bekreftelse.

---

## 7. Oppsummert arkitektur-score

**Klarhet:** 8/10 — de fleste beslutninger er tatt, få uklarheter igjen.
**Risiko:** Medium — tuner-rollen er den største nye risikoen. Må bygges konservativt med diff-sporing og re-validering.
**Klar for Fase 1:** Nesten. Trenger D2-avklaring, DNS-eierskap, og at nye docs (12–16) er skrevet og gjennomlest.
