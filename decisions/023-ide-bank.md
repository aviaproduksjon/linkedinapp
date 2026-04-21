# ADR 023 — Ide-bank som førsteklasses knagg-kilde

**Dato:** 2026-04-20
**Status:** vedtatt

## Kontekst
Deniz ønsker et sted å samle ideer til poster — både skriftlige notater og stemmeopptak med transkribering. Disse ideene skal kunne brukes som knagger i genereringsflyten sammen med eksterne kilder.

## Valg

### 1. Ny domenemodul: `ideas/`
- Egen tabell `Idea` for fangst, transkribering og organisering.
- Ved generering materialiseres en ide til `Hook` — resten av arkitekturen bryr seg ikke om at knaggen kommer fra en ide.

### 2. Inngangspunkter
- Tekst (tastatur + `⌘+I` globalt).
- Stemmeopptak (`⌘+⇧+I`), transkribert via OpenAI Whisper API.
- Asynkron transkribering (bruker venter ikke).
- Fremtidige kanaler (mobil-share, e-post, Slack) er skisset, ikke MVP.

### 3. AI-post-prosessering av ideer
- Haiku-nivå: sammendrag (1 setning) + foreslåtte kategorier + pain points + USP-er + tags.
- Lagres som del av `Idea`, ikke som side-effekt.
- Logges til `AIUsage` med `module = idea_postprocess`.

### 4. Transkribering
- Primær: OpenAI Whisper API.
- Logges til `AIUsage` med `module = transcription`.
- Lyd beholdes i Supabase Storage; kan slettes av bruker.

### 5. Integrasjon i genereringsflyten
- `Source`-enum utvides med `idea_bank`.
- `Hook` får valgfri `idea_id` FK.
- Generator vekter Deniz sin formulering som stilsignal når knaggen er en ide.
- Algoritmefilter vekter autentisitet-dimensjonen sterkere for ide-baserte poster.

### 6. UI
- Egen seksjon i sidebar ("Ide-bank").
- Floating capture-knapp alltid tilgjengelig.
- Ide-kort med "Generer post" + "Kombiner med knagg" + avspilling hvis stemme.
- Fra kalender: "Generer fra ide" på tom slot.

## Alternativer vurdert og forkastet
- **Bare et notatfelt i eksisterende sidebar:** For lavt prioritert — ideer er for viktige å behandle som ettertanke.
- **Eget parallelt genereringsflyt for ideer:** Bryter arkitekturens rene kontrakter. Å materialisere ideer til Hooks holder generatoren ren.
- **Full mobil-app i MVP:** For mye scope. Starter med web, åpner for mobil i senere fase.

## Konsekvenser
- Datamodell utvidet: ny `Idea`-tabell, `Hook.idea_id`, `Source.type` enum, `AIUsage.module` enum.
- Integrasjonslag utvidet: ny `TranscriptionProvider`-interface.
- Ny modul i arkitekturen: `ideas/` + `transcription/`.
- Fase 2-leveranser får ide-bank som egen bolk.
- Forbrukspanel teller transkribering som egen modul-kolonne.
- Personvern/RLS: ideer er strengt per-bruker.
