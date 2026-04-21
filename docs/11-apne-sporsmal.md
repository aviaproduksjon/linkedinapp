# Åpne spørsmål (samlet)

> Alle åpne spørsmål fra agent-gjennomgangen + spørsmål som dukker opp underveis. Hver rad skal ende med en beslutning (link til ADR i `decisions/`).

---

## Status etter svar fra agent-review-01

| ID | Svar | Status | ADR |
|---|---|---|---|
| A1 | Next.js monolitt | ✅ Vedtatt | 001 |
| A2 | Supabase (Postgres + pgvector) | ✅ Vedtatt | 002 |
| A3 | Vercel + Supabase + Railway | ✅ Vedtatt | 003 |
| A4 | BullMQ + Redis (trenger bekreftelse — O1) | 🟡 Venter | — |
| A5 | Multi-user fra start | ✅ Vedtatt | 004 |
| L1 | Halvmanuell MVP | ✅ Vedtatt | 005 |
| L2 | Deniz personlig først | ✅ Vedtatt | 006 |
| L3 | Rigget for tekst/bilde/karusell, placeholder i MVP, LinkedIn-preview | ✅ Vedtatt | doc 12 |
| L4 | Frekvens-anbefaling (1-2/uke) venter bekreftelse — O5 | 🟡 Venter | — |
| T1 | Vokabular + rytme + fragmenter, aldri hele setninger | ✅ Vedtatt | 007 |
| T2 | Hard_rules vs guidance — nytt skille | ✅ Vedtatt | doc 6 |
| T3 | Bokmål only | ✅ Vedtatt | 008 |
| T4 | Ett sitat (<15 ord) med kilde | ✅ Vedtatt | 009 |
| M1 | "Slik tenker vi" | ✅ Vedtatt | 010 |
| M2 | Egne pain points + USP-modul | ✅ Vedtatt | doc 15 |
| M3 | Varierende CTA (none/soft/direct) | ✅ Vedtatt | 011 |
| M4 | Manuell lead-logg | ✅ Vedtatt | 012 |
| F1+F2 | Algoritmefilter blir også tuner | ✅ Vedtatt | doc 13 |
| F3 | Hele konteksten | ✅ Vedtatt | 013 |
| F4 | Gjør ingenting (kun informativt) | ✅ Vedtatt | 014 |
| P1 | Claude-først med abstraksjon | ✅ Vedtatt | 015 |
| P2 | Prompter versjonert i kode | ✅ Vedtatt | 016 |
| P3 | Cleanup-retry | ✅ Vedtatt | 017 |
| D1 | Avia Produksjon AS + `linkedin.avialab.no` | ✅ Vedtatt | 018 |
| D2 | Alt engelsk (trenger scope-avklaring — O2) | 🟡 Venter | — |
| D3 | Privat repo | ✅ Vedtatt | 019 |
| D4 | Månedlig tak + forbrukspanel | ✅ Vedtatt | 020 |

**Nye spørsmål fra arkitekt-review (O1–O11):** ✅ Alle besvart. Se `decisions/agent-review-02.md` og `decisions/022-agent-review-02-svar.md`.

| ID | Svar | Konsekvens |
|---|---|---|
| O1 | BullMQ + Redis | ADR 022, Railway-worker |
| O2 | Engelsk kode, norsk strategi | ADR 022 |
| O3 | Deniz eier avialab.no | Deploy-blokker fjernet |
| O4 | Opus/Sonnet/Haiku fordelt | Konfig per modul |
| O5 | 1–2/uke + kampanje-modus | Kalender-modulen |
| O6 | Nettside + søk + SoMe | docs/15 §3.2 |
| O7 | Research-agent + sist-oppdatert-dato | docs/14, datamodell |
| O8 | Ikke-invasiv tuner | docs/13 |
| O9 | Global profil, persona-overstyring på tone | docs/15 §7 |
| O10 | Per-post innsiktspanel | docs/09 §5.1 |
| O11 | Hard_rules/guidance godtas + ny kjernemodul | docs/17 (nytt!) |

---

## Nye beslutninger under arbeidet

| ID | Beslutning | ADR |
|---|---|---|
| 021 | Ny kategori "Vise suksess" + mange-til-mange kategori-modell | 021 |

---

## Før Fase 1 starter

✅ Alle åpne spørsmål er besvart. Fase 1 kan starte.

Gjenstående praktisk:
- Sette opp DNS CNAME når deploy-pipeline er klar (ikke-blokker for kodestart).
- Første utkast av Avia-selskapsprofilen kan tas via USP-scraping når modulen er bygd.
- Legge inn initielle hard_rules/guidance per persona basert på O11-svaret.
