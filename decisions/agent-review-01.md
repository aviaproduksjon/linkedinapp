# Agent-gjennomgang 01 — åpne spørsmål før Fase 1

> Hver agent har lest `docs/00-prosjektgrunnlag.md` og `docs/01-arkitektur.md`. De stiller spørsmålene under, med svaralternativer og en anbefaling (✅). Svar i eget dokument (`decisions/agent-review-01-svar.md`) eller direkte til Deniz i samtale.

---

## 🏛️ Software-arkitekt

### A1. Rammeverk for UI + backend
- A. **Next.js (App Router) + TypeScript monolit** — én kodebase, full-stack, lett å deploye. ✅ **Anbefalt** — raskt til verdi, skalerer godt nok.
- B. Separat backend (FastAPI) + SvelteKit frontend — best hvis AI-tungt Python-arbeid.
- C. Remix + Node/Fastify — litt mer purisme, mindre "magi".

Svar: A

### A2. Database ved oppstart
- A. **Postgres via Supabase** (inkl. auth, storage, pgvector) ✅ **Anbefalt** — sparer integrasjonsarbeid.
- B. Selv-hostet Postgres (Docker lokalt, Fly/Railway i sky).
- C. SQLite for MVP, flytt til Postgres senere.

Svar: A

### A3. Kjøreplattform (produksjon)
- A. Vercel (frontend) + Supabase (DB/auth) + separat worker (Railway). ✅ **Anbefalt** for enkel start.
- B. Én tjeneste (Fly.io) — alt på samme plattform, enkel mental-modell.
- C. Selv-hostet (Docker + egen VPS) — mer arbeid, full kontroll.

Svar: A

### A4. Scheduler / jobbhåndtering
- A. **BullMQ + Redis** — industri-standard for Node, god observability. ✅ **Anbefalt** hvis vi går Node/Next.
- B. Temporal — kraftigere, mer overhead.
- C. Enkel cron i Supabase Edge Functions for MVP.

Avklaring: DU ANBEFALTE JO IKKE NODE I SPM A1??

### A5. Skal vi starte med multi-user-støtte innebygd?
- A. **Ja, bygg med user-scoping fra dag én, selv om bare Deniz bruker det.** ✅ **Anbefalt** — trivielt nå, dyrt senere.
- B. Nei, single-user — refaktorer hvis det blir aktuelt.

Svar: A

---

## 💬 LinkedIn-ekspert

### L1. Publisering i MVP
- A. **Halvmanuell: plattformen genererer og kopierer-klart, Deniz limer inn.** ✅ **Anbefalt for MVP** — raskt i gang, ingen API-godkjenning.
- B. Gå rett på LinkedIn API — 2–8 uker forsinkelse for godkjenning.
- C. Hybrid — halvmanuell nå, parallelt søke godkjenning for API.

Svar: A

### L2. Skal vi publisere som Deniz personlig eller Avia Company Page?
- A. Deniz personlig — sterkere "bygge personmerke" + enklere API-vei.
- B. Avia Company Page — sterkere merke, men lavere organisk rekkevidde.
- C. **Begge, med personlig som primærstemme og selektiv crossposting til Avia.** ✅ **Anbefalt** — gir rekkevidde + autensitet.

Svar: A

### L3. Post-formater vi skal støtte i MVP
- A. Bare tekst (1200–1800 tegn). ✅ **Anbefalt for MVP** — fokus, raskt.
- B. Tekst + enkelt bilde.
- C. Tekst + dokument/carousel (krever mer UI).

Svar: RIGGET FOR BÅDE TEKST, BILDE OG KARUSELL, MEN PÅ MVP KAN BILDE VISE MOCKUP / PLACEHOLDER. VIS POSTENE I ET VINDU SOM MINNER OM EN LINKEDIN POST FOR VISUELL FØRSTEINNTRYKK

### L4. Frekvens-mål for Deniz
- A. 2–3 ganger per uke. ✅ **Anbefalt** — bærekraftig kvalitet.
- B. 4–5 ganger per uke.
- C. Daglig — høy risiko for kvalitetsfall.

Svar: La b2b markedsfører være med i denne vurderingen. 1-2 per uke høres mer passende ut.

---

## ✍️ Norsk tekstforfatter / språkekspert

### T1. Hvor aggressivt skal speilingen være?
- A. **Milde mønstre (vokabular og rytme), aldri setningskopi.** ✅ **Anbefalt.**
- B. Sterk speiling: gjenbruk av formuleringer.
- C. Ingen speiling — bare persona-profilen.

Svar: A + B, men aldri hele setninger.

### T2. Håndtering av do/don't-regler ved brudd
- A. **Hard avvisning + automatisk regenerering én gang, så vis feilen hvis den varer.** ✅ **Anbefalt.**
- B. Myk advarsel, vis posten likevel.
- C. Hard avvisning uten regenerering (brukeren må trykke på nytt).

Svar: Ja, men det bør være skille på do/don´t regler, og guidence, så ikke for mye blir stoppet

### T3. Bokmål / nynorsk?
- A. **Bare bokmål i start.** ✅ **Anbefalt.**
- B. Støtt begge — per persona.

Svar: A

### T4. Håndtering av sitater fra kilder
- A. **Maks ett kort sitat (<15 ord) per post, med kildelenke.** ✅ **Anbefalt** — opphavsrett + troverdighet.
- B. Ingen direkte sitater — bare parafrasering.
- C. Lengre sitater tillatt.

Svar: A

---

## 📈 Markedsfører (B2B, leadgen)

### M1. Navn på Kategori 2 ("faglig overbevisning")
- A. **"Slik tenker vi"** — konkret, ærlig, lavt prestisjenivå. ✅ **Anbefalt.**
- B. "Avia-prinsippene" — sterkt merke, kan føles internt.
- C. "Fag og overbevisning" — nøyaktig, litt tungt.
- D. "Dette tror vi på" — varm, men vagt.

Svar: A

### M2. Pain points vi skal eksplisitt bygge mot fra start
- A. **"Vise effekt mot ledelsen"** + **"Få mer ut av marketingbudsjettet"** + **"Skille seg ut i støy"** — topp 3 som gjentas i bransjen. ✅ **Anbefalt** som startutvalg.
- B. Bredere utvalg (6–8 pain points) — mer fleksibelt, mer spredt.
- C. Kun 1 pain point i MVP — maksimal fokus.

Svar: Her er pain points vi spiller på: **"Behovene vokser (mer innhold, flere kanaler, høyere tempo), budsjettene står stille"** + **"Færre ledd, raskere leveranser. Jobb direkte med de som lager arbeidet / kreative talentene"** + **"Mindre støy, mer dybde. Folk bryr seg ikke, tilliten til reklame synker"** — topp 3 som gjentas i bransjen.

!!VURDER Å INKLUDERE BEDRIFTENS USP-er i INNSTILLINGER / PREFERANSER. GJERNE MED EN KNAPP MED MULIGHET FOR Å SCRAPE BEDRIFTENS NETTSIDE OG TILSTEDEVÆRELSE PÅ NETT FOR Å FORESLÅ USP-ER SOM SKILLER DE FRA ANDRE, OG KUNNE REDIGERE DET. TIL BRUK FOR Å SVARE PÅ PAIN POINTS PÅ RIKTIG MÅTE.

### M3. Leadgen-mekanikk i posten
- A. **"Soft CTA" (invitasjon til kommentar, DM ved interesse)** ✅ **Anbefalt for B2B på LinkedIn.**
- B. Direkte CTA med lenke (lavere rekkevidde, men mer måling).
- C. Ingen CTA — bygge merke først, salg senere.

Svar: A og C: Variere mellom ingen, soft og sjelden gang direkte CTA når det snakker mer direkte om tilbudet vårt.

### M4. Måling av leads
- A. **Manuell logg i MVP (Deniz noterer DM/kontakter per kampanje/post).** ✅ **Anbefalt** — realistisk i start.
- B. Bygge UTM-tracking (krever ekstern landingsside).
- C. CRM-integrasjon (for mye for MVP).

Svar: A

---

## 🛡️ LinkedIn-algoritmeekspert (filter)



### F1. Score-terskel for blokkering
- A. **0.5 ved start, justerbar.** ✅ **Anbefalt.**
- B. 0.6 — strengere, mer avviste forslag.
- C. Ingen blokkering — bare rådgivende score.

SVAR PÅ F1 og F2: BLOKKER KUN VED EN VELDIG LAV SCORE, MEN INKLUDER MINDRE JUSTERINGER I POSTER FOR Å OPTIMALISERE FOR ALGORITMER. SÅ LINKEDIN AKSPERT IKKE BARE ER ET FILTER, MEN JUSTERER I POSTENE UTEN Å RØRE FOR MYE.

NB! EN ALLTID-OPPDATERT ALGORITMEFORSTÅELSE BØR VÆRE INTEGRERT TIDLIGERE I PROSESSEN OGSÅ, SLIK AT ALLE POSTER SKRIVES MED UTGANGSPUNKT I DETTE. LEGG TIL ET LITE VINDU I APPEN SOM VISER EN UP-TO-DATE KORTFATTET LISTE OVER HVA LINKEDIN ALGORITMENE FAVORISERER, OG ETABLERT GODE PRAKSISER FOR B2B MARKETING PÅ LINKEDIN I NORGE.DENNE BØR OPPDATERES EN GANG PER HALVÅR, INKLUDERE TING SOM KULTURELLE NORMER RELEVANT FOR BRANSJEN TIL BRUKEREN, TEKNISK ALGORITME OG UTPRØVDE PRAKSISER. FINN EN GOD MÅTE Å INTEGRERE DENNE I PROSESSEN MED Å LAGE POSTER 

### F2. Hva skjer når alle N forslag er under terskel?
- A. **Regenerer én gang til, så vis beste med advarsel.** ✅ **Anbefalt.**
- B. Blokker helt, be brukeren justere knaggen.
- C. Vis alle — la brukeren velge på tross.


### F3. Skal algoritmefilteret også se knaggen + konteksten?
- A. **Ja, hele konteksten.** ✅ **Anbefalt** — bedre score.
- B. Bare den genererte teksten — mer isolert vurdering.

Svar: A

### F4. Hvordan håndtere post-publisering hvis den underpresterer kraftig?
- A. **Ingen auto-fjerning. Flagg for bruker, lær av det.** ✅ **Anbefalt.**
- B. Auto-arkivering etter 7 dager hvis < terskel.
- C. Gjør ingenting — evaluering er bare informasjon.

Svar: C

---

## 🤝 LLM-samarbeider (prompt-struktur)

### P1. Hvor modell-agnostisk skal generatoren være fra start?
- A. **Claude-først, men abstraksjonslag klart.** ✅ **Anbefalt** — praktisk nå, fleksibelt senere.
- B. Full multi-provider i MVP.
- C. Claude bare — ingen abstraksjon.

Svar: A

### P2. Prompt-versjonering
- A. **Versjoner prompter som kode (i repo), tag hver generering med versjon.** ✅ **Anbefalt.**
- B. Lagre prompter i DB, versjon der.
- C. Fri-tekst prompter per generering — ingen versjonering.

Svar: A

### P3. Fallback hvis modellen nekter å svare
- A. **En "cleanup"-retry med feilmelding som context.** ✅ **Anbefalt.**
- B. Fail fast med tydelig feilmelding til bruker.

Svar: A

---

## 🧭 Tverrgående spørsmål (Deniz må svare)

### D1. Hvem eier plattformen formelt?
- A. Deniz personlig (privat prosjekt, brukes i Avia-sammenheng).
- B. Avia AS (eier av IP, Deniz bruker det).
- C. Avklares senere — start nøytralt.
- *(Ingen anbefaling — dette er en forretningsbeslutning.)*

B: AVIA PRODUKSJON AS, skal deployes på linkedin.avialab.no

### D2. Språk i kodebasen
- A. **Engelsk i kode, norsk i planleggingsdokumenter.** ✅ **Anbefalt** — standard-praksis, lett å åpne for andre senere.
- B. Alt på norsk.
- C. Alt på engelsk (også planleggingsdokumenter).

Svar: C

### D3. Hvor åpen skal plattformen være?
- A. **Privat repo, privat prosjekt.** ✅ **Anbefalt for start.**
- B. Åpen kildekode fra start.
- C. Closed source, men med en dokumentasjons-nettside.

Svar: A

### D4. Budsjett for AI-bruk
- A. **Sett månedlig tak (f.eks. 500 kr/mnd for MVP), med telle-logikk i plattformen.** ✅ **Anbefalt.**
- B. Ingen tak — bruk det som trengs.
- C. Lavt tak (100 kr/mnd) — risiko for for lite bruk.

Svar: A, ha et lite panel som viser forbruk og estimert kostnad. 

---

## Oppsummering — beslutninger som MÅ tas før Fase 1

Minimum disse må besvares før kode skrives:
- A1, A2, A3 (tech stack og kjøreplattform)
- L1, L2 (LinkedIn-publiseringsvei og identitet)
- M1 (navn på Kategori 2 — brukerens valg)
- D1, D2 (eierskap, språk i kode)

De andre kan besvares i starten av Fase 1.
