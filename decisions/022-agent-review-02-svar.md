# ADR 022 — Agent-review 02 (O1–O11) — besvart og vedtatt

**Dato:** 2026-04-20
**Status:** vedtatt

## Sammendrag
Alle oppfølgingsspørsmål fra `arkitekt-review-01.md` (O1–O11) er besvart. Nedenfor er hver beslutning oppsummert med direkte konsekvenser.

---

## O1 — Scheduler: BullMQ + Redis (svar A)
**Konsekvens:** Worker på Railway med BullMQ og Redis. Cron-lignende jobber kjøres her. Scheduler-modulen eier all tidsbasert orkestrering (RSS-henting, planlagt publisering-varsling, metrikkinnhenting, halvårlig research).

## O2 — Språk: engelsk i kode, norsk i strategi (svar A)
**Konsekvens:**
- Kode, kodekommentarer, migrasjoner, tekniske docs (README for dev, API-doc) → engelsk.
- Strategi- og forretningsdokumenter (prosjektgrunnlag, kategorier, tone of voice, pain points, agentdefinisjoner) → norsk.
- Memory-filer → norsk (de er strategi).
- ADR-er kan være enten — blir norske her fordi de dokumenterer beslutninger med forretnings-kontekst.

## O3 — DNS: Deniz eier avialab.no (svar A)
**Konsekvens:** Deniz kan sette opp CNAME til Vercel. Ingen ekstern avhengighet. Deploy-blokker fjernet.

## O4 — Modellfordeling (svar A)
**Konsekvens:**
- **Opus:** generator, evaluator.
- **Sonnet:** tuner, algoritmefilter, tekstforfatter-pass, markedsfører-vurdering, research, USP-ekstraktor.
- **Haiku:** klassifisering av knagger, relevans-scoring, deduplikering.
Lagres i konfig per modul — ikke hardkodet.

## O5 — Frekvens: 1–2/uke default, opptil 3–4 ved kampanjer (svar A)
**Konsekvens:**
- Kalender-modulen har "rhythm target" per persona. Default: 2 poster/uke.
- "Kampanjemodus" som midlertidig setter target høyere.
- Over-publisering varsler, blokkerer ikke.

## O6 — USP-kilder: nettside + søk + SoMe (svar A utvidet)
**Konsekvens:**
- USP-ekstraktoren henter fra:
  1. aviaprod.no (forside, tjenester, om, case).
  2. Web-søk om bedriften (pressesaker, intervjuer, omtaler).
  3. Offentlig SoMe-aktivitet (Avia Company Page, nøkkelpersoners profilaktivitet, visuelle plattformer som Vimeo/YouTube).
- Syntese på tvers: ekstraktoren vekter også hvordan utsiden omtaler Avia, ikke bare selvbilde.
- Kilde-referanse lagres per USP-forslag.
- Detaljer i `docs/15-selskapsprofil-og-usp.md` §3.2.

## O7 — Insight-panel: research-agent + Deniz-godkjenning + sist-oppdatert-dato (svar A utvidet)
**Konsekvens:**
- Research-agent lager utkast halvårlig.
- Deniz godkjenner eksplisitt (menneske i loop).
- **Panelet viser alltid "Sist oppdatert: dato"** øverst.
- `AlgorithmInsight` får `approved_at` og `next_review_due` felt.
- Varsling 7 dager før next_review_due.

## O8 — Tuner-grad: ikke-invasiv (svar A)
**Konsekvens:** Allerede dokumentert i `docs/13-algoritmefilter-tuner.md`. Ingen endring.

## O9 — Company Profile: global med persona-overstyring (svar A)
**Konsekvens:**
- `Company`-raden er global.
- `USP`-ene er globale og uforanderlige per persona.
- Persona kan overstyre enkelte felt som `target_audience_notes` og tone rundt omtalen — ikke faktaene.
- Detaljer i `docs/15-selskapsprofil-og-usp.md` §7.

## O10 — Evaluator-synlighet: per-post innsiktspanel (svar A)
**Konsekvens:**
- Hver publisert post har et innsiktspanel i editor/preview.
- Viser pre/post-tuning-score, persona-snitt-sammenligning, hva som ble oppdatert i preferansevekter.
- Ingen handlinger påkrevd — informativt (F4).
- Detaljer i `docs/09-evaluering-og-laering.md` §5.1.

## O11 — Hard_rules/guidance: skillet godtas + eksplisitt krav om sterk arkitektur for post-skriving (svar A utvidet)
**Konsekvens (stor):**
- Hard_rules og guidance-oppdelingen står som foreslått.
- Deniz har eksplisitt bedt om at **post-genereringen er kjernen** i appen, og at alle agentene (LinkedIn-ekspert, B2B-markedsfører, engineer, tekstforfatter, LLM-samarbeider) bidrar til felles guidance.
- **Ny kjernemodul: `docs/17-post-genereringsarkitektur.md`** — hoveddokumentet for hvordan en post blir til. Eier flyten ende-til-ende. Definerer agent-ansvar, flyt, felles guidance (4.1–4.8), sikkerhetsnett og evals.
- Dette er prosjektets *andre* viktigste dokument (etter prosjektgrunnlaget).

---

## Åpne spørsmål etter ADR 022
Ingen blokkerende. Fase 1 kan starte når:
- Avia har fått første utkast av selskapsprofilen (kan gjøres via scraping når modulen er bygd).
- DNS er satt opp (avhengig av at Fase 1-deployen nærmer seg).

## Konsekvens for plan.md
Fase 0 er ferdig. Fase 1 kan starte.
