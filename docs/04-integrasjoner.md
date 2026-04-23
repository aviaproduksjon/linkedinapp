# Integrasjoner

> **Prinsipp:** Hver integrasjon er bak et adapter-grensesnitt. Domenet bryr seg ikke om hvem som henter eller publiserer.

---

## 1. LinkedIn API

### Publisering
- **LinkedIn har strenge begrensninger på API-tilgang** — spesielt for personlige kontoer. Dette er et kritisk tidlig valg (se åpne spørsmål).
- Tre mulige veier:
  1. **LinkedIn Marketing Developer Platform** — offisiell, krever godkjenning, passer for Company Pages.
  2. **Personlig konto via OAuth** — begrenset scope, kan poste via "share on LinkedIn"-flows.
  3. **Halvmanuell** — plattformen genererer + kopierer-klart, brukeren limer inn i LinkedIn. Fullt lovlig, raskere å bygge, men bryter "alt på én plattform".
- Anbefaling: Start halvmanuell for MVP (raskere verdi), sikt mot offisiell integrasjon for v1.

### Metrikker
- Company Pages har bedre analytics-API enn personlige kontoer.
- Alternativ: manuell inntasting av rekkevidde/engasjement per post i starten.

---

## 2. Nyhetskilder (knagger)

### Bransjenyheter
- **kampanje.com** — RSS (`/feed/`), alternativt scraping. Primærkilde for bransje.
- **Kreativt Forum** — sjekk RSS-støtte, ellers scraping.

### Næringsliv
- **DN (Dagens Næringsliv)** — RSS tilgjengelig, men betalingsmur på mange saker. Vurder å abonnere og bruke lovlige API-er via Atekst/Retriever.

### Internasjonale bransjenyheter (vurder)
- Marketing Week, AdAge, Campaign (UK) — for kontekst, men prioriter norsk.

---

## 3. Rapport-kilder

- **ANFO** — rapporter publiseres på anfo.no. Hente nyoppståtte PDF-er + parse.
- **Nielsen** — offentlige insights-publikasjoner.
- **SSB** — relevante markedsdata.
- **Mediebyråforeningen** — medieinvesteringstall.

**Teknisk:** PDF-parsing (pdf-parse / pdfminer) + sammendrag via LLM før lagring som knagg.

---

## 4. Interne Avia-kilder

- **avia.no** — scrape "arbeider"/case-seksjonen for nye publiseringer.
- **Avia sin LinkedIn-side** — via LinkedIn Company API (hvis godkjent).
- **Interne notater** — manuell input via UI ("legg til intern knagg").

---

## 5. Språkspeiling (scraping for tone)

- Scrape bransjespråk fra kampanje.com, Kreativt Forum, relevante LinkedIn-innlegg i norsk markedsbransje.
- **Regler:**
  - Respekter `robots.txt`.
  - Cache + rate-limit.
  - Ingen re-publisering av opphavsrettsbeskyttet innhold — bare ekstraksjon av språkmønstre til intern bruk.
  - Skriv aldri tilbake originalsitat i genererte poster (max 1 kort sitat med kilde).

---

## 6. AI-leverandører

- **Primær:** Anthropic Claude (Opus 4.6 / Sonnet 4.6 / Haiku 4.5) via API.
- **Sekundær/backup:** OpenAI / eventuelt lokal modell for speiling/embedding.
- **Embedding:** OpenAI `text-embedding-3-large` eller Voyage / lokal (`nomic-embed-text`).
- **Transkribering:** OpenAI Whisper API (primær) — god norsk-støtte. Alternativer: Deepgram, AssemblyAI, lokal Whisper.
- Abstraksjonslag: `LLMProvider`- og `TranscriptionProvider`-interfaces gjør det trivielt å bytte.

---

## 7. E-post / varsling (valgfritt)

- Magisk lenke for auth (Resend / Postmark).
- Varsling til brukeren ved feilet publisering eller uvanlige metrikker.

---

## 8. Lagring og sky

- **Lokal utvikling:** Docker Compose (Postgres + pgvector).
- **Staging/prod:** Fly.io / Railway / Vercel + Supabase — alle er gode kandidater.

---

## 9. Samlet integrasjonsmatrise

| Integrasjon | Type | Kritikalitet | Alternativ hvis blokkert |
|---|---|---|---|
| LinkedIn publisering | API / manuell | Kritisk | Halvmanuell kopier-til-utklipp |
| LinkedIn metrikker | API / manuell | Høy | Manuell inntasting |
| Kampanje RSS | RSS | Høy | Scraping |
| Kreativt Forum | RSS/scrape | Medium | Manuell knagg |
| DN | RSS/betalt API | Medium | Manuell |
| ANFO / Nielsen rapporter | Scraping + PDF | Medium | Manuell opplasting |
| Avia.no | Scraping | Medium | Manuell |
| LLM (Claude) | API | Kritisk | OpenAI fallback |
| Embedding | API / lokal | Høy | Lokal modell |
| Transkribering (Whisper) | API | Høy (ide-bank) | Lokal Whisper / Deepgram |
| Web-søk (Anthropic `web_search`) | API | Høy (hook-discovery) | Brave Search / Tavily / Serper |

### Web-søk via Anthropic

For brukerstyrt knagg-oppdagelse (`/api/hooks/discover`) brukes Anthropic sin innebygde `web_search`-tool i Sonnet. Flyten:
1. Bruker beskriver et tema fritt.
2. Sonnet kjører `web_search` (opp til 4 kall) med norsk bransje-allowlist prioritert — kampanje.com, kreativtforum.no, dn.no, anfo.no, nielsen.com m.fl.
3. Sonnet velger 3–6 kandidater og kaller vår custom `propose_candidates`-tool med strukturert output.
4. UI viser kandidatene. Bruker trykker "Lagre som knagg" → `POST /api/hooks/save-candidate` skriver direkte inn i `hooks`-tabellen uten re-fetch.

Kostnad: ~$10/1000 web-søk-kall + normale Sonnet-tokens. Logges som `module=research` i `ai_usage`.
