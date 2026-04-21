# Ide-bank

> En personlig samling av ideer som kan bli knagger for poster. Støtter både skriftlig input og stemmeopptak med transkribering. Fletter inn som en førsteklasses kilde sammen med nyheter, rapporter og USP-er.

---

## 1. Hvorfor

De beste LinkedIn-postene kommer ofte fra observasjoner i hverdagen — et tilbakemelding i et kundemøte, en refleksjon etter et foredrag, en vag idé på pendlerturen. Disse ideene forsvinner hvis de ikke fanges i øyeblikket. Ide-banken er det lavterskel-inngangspunktet som gjør at ingen ide går tapt.

**Målet:** Fange ideer raskt, strukturere dem over tid, og flette dem inn som knagger i genereringsflyten.

---

## 2. Inngangspunkter

### 2.1 Skriftlig (tekst)
- Raskt tekstfelt tilgjengelig fra sidebar og kalender.
- Keyboard shortcut (f.eks. `⌘+I`) åpner modal uansett hvor i appen du er.
- Støtter markdown for lister og uthevet tekst.

### 2.2 Stemmeopptak med transkribering
- Ett klikk: start opptak. Ett klikk: stopp.
- Transkribering skjer asynkront (brukeren slipper å vente).
- Transkribert tekst vises redigerbar.
- Originalt lydfil beholdes i Supabase Storage — kan spilles av senere.

### 2.3 Eksterne innganger (fremtidig utvidelse, ikke MVP)
- Del fra iOS/Android-app direkte til ide-banken.
- Send til dedikert e-postadresse.
- Slack/Discord-slash-kommando.

---

## 3. Ide-livssyklus

```
[Rå input]
  ├─ skriftlig → lagres umiddelbart
  └─ stemme → opptak → transkribering → lagres med lydvedlegg
         │
         ▼
[Ide-post-prosessering (async)]
  - Kategorisering (hvilken kategori kan denne bli til?)
  - Pain point-matching
  - USP-matching hvis relevant
  - Kort AI-sammendrag (1 setning)
  - Tag-forslag
         │
         ▼
[Lagret i ide-bank]
  Status: new | refined | used | archived
         │
         ▼
[Kan brukes som knagg i generering]
  - Vises i "knagg-brønnen" sammen med nyheter/rapporter
  - Brukeren kan trykke "Generer post fra denne" direkte
  - Kan kombineres med andre knagger (f.eks. ide + rapport)
```

---

## 4. Integrering med genereringsflyten

Ide-banken fletter inn som **en type kilde** i eksisterende arkitektur — ikke et parallelt system.

### Hvordan det kobler seg på

- **`Source`-entiteten** får en ny type: `idea_bank` (ved siden av `rss`, `scrape`, `manual`, `internal_avia`, `report`).
- **`Hook`-entiteten** brukes som før. En ide blir en knagg med `source_type: idea_bank`.
- Når Deniz trykker "Generer" på en ide, sendes den inn i **standard genereringsflyt** som beskrevet i `docs/17-post-genereringsarkitektur.md` — ingen egen parallell flyt.

### Forskjeller fra andre kilder

Ideer er **personlige** og har typisk *allerede* en vinkling bakt inn — det er ikke et rå faktum som skal tolkes, det er en halvferdig tanke. Generatoren må vite dette:

- **Høyere vekting av brukerens ord:** Ide-knaggen er semantisk ladet — generator skal bruke *Deniz sin formulering* som stilsignal, ikke bare tema.
- **Lavere "tolkningsrom":** Hvis Deniz skrev "kunder sier X fungerer", skal posten ikke miste den konkrete observasjonen.
- **Kombineres ofte med nyheter:** En ide om et tema + en fersk rapport om samme tema = veldig sterk post.

---

## 5. Datamodell

### Ny entitet: `Idea`
*Merk: Implementeres teknisk som en spesialisering av `Hook` eller som egen tabell + materialisert som Hook. Se anbefaling under.*

| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | PK |
| content | text | Den redigerte, strukturerte teksten |
| raw_transcription | text | Original transkribering (hvis stemme), uredigert |
| audio_url | string | Lagring i Supabase Storage (null hvis skriftlig) |
| audio_duration_seconds | int | |
| input_type | enum | `text`, `voice` |
| ai_summary | text | 1-setnings sammendrag generert av AI |
| suggested_categories | uuid[] | FK → Category |
| suggested_pain_points | uuid[] | FK → PainPoint |
| suggested_usps | uuid[] | FK → USP |
| tags | string[] | Brukerens + AI-foreslåtte |
| status | enum | `new`, `refined`, `used`, `archived` |
| used_in_posts | uuid[] | FK → Post |
| created_at / updated_at | timestamp | |
| created_via | string | `keyboard`, `voice`, `mobile_share`, `email` (for fremtiden) |

### Anbefaling for implementering
**Opprett `Idea` som egen tabell**, men ved generering **materialiseres den til en `Hook`** — slik at resten av arkitekturen ikke trenger å behandle ideer spesielt. Dette holder separasjonen ren:
- Ide-banken bryr seg om fangst, transkribering, organisering.
- Generering bryr seg om knagger.
- Koblingen skjer via en `idea_to_hook()`-funksjon.

---

## 6. Transkriberings-lag

### Valg av tjeneste (anbefaling)
- **Primær:** Whisper via OpenAI API (god norsk, rask, rimelig).
- **Alternativ:** Whisper lokalt (privat, men tregere, krever egen infra).
- **Alternativ:** Deepgram / AssemblyAI (også god norsk-støtte).

**Anbefaling for MVP:** OpenAI Whisper API.

### Flyt
1. Bruker starter opptak → lydfil bygges i nettleseren.
2. Bruker stopper → opplasting til Supabase Storage.
3. Worker plukker opp (BullMQ-jobb) → sender til Whisper-API.
4. Transkribering returneres → lagres på `Idea.raw_transcription` og `content`.
5. AI-post-prosessering (Haiku): sammendrag, kategori-/pain-point-/USP-match, tag-forslag.
6. UI oppdateres reaktivt (Supabase realtime).

### Regler
- Bruker kan redigere transkriberingen uten å miste originalen.
- Lyd kan slettes etter transkribering hvis ønsket.
- Ingen lyddata sendes til eksterne uten at Deniz startet opptaket.
- Språk: bokmål som default, men Whisper håndterer det uansett.

---

## 7. UI

### 7.1 Sidebar
- **"Ide-bank"** som eget valg under Personas og Selskapsprofil.
- Liste over ideer med filter: ny / brukt / arkivert.
- Søkefelt (semantisk søk med embedding, valgfritt utvidelse).

### 7.2 Hurtig-capture
- **Floating button** nederst i sidebar med mikrofon-ikon.
- `⌘+I` åpner tekstmodal.
- `⌘+⇧+I` starter stemmeopptak direkte.

### 7.3 Ide-kort
Hver ide vises som et kort med:
- AI-sammendraget øverst.
- Full tekst (klikkbar for å utvide).
- Tags + foreslåtte kategorier.
- "Spill av"-knapp hvis stemme-basert.
- **"Generer post"-knapp** → går rett inn i genereringsflyten med ideen som knagg.
- "Kombiner med knagg..."-valg → åpner en knagg-velger for å legge til en rapport/nyhet.

### 7.4 Ide i generering
- Når en ide brukes som knagg, vises den tydelig i editor-konteksten.
- Etter bruk: status settes til `used`, `used_in_posts` oppdateres.

---

## 8. Integrering med andre moduler

### Med kalender
- Fra en tom tidsluke i kalender: "Generer fra ide" → velg fra listen.

### Med algoritmefilter + tuner
- Algoritmefilteret vet at knaggen er en personlig ide — vekter "autentisitet"-dimensjonen sterkere.

### Med evaluator
- Hvis en post lagt fra en ide gjør det bra, flagges ideens struktur som læring.
- Over tid: hvilke **typer ideer** blir til best poster?

### Med forbrukspanel
- Transkribering teller inn i AI-forbruk (Whisper-kall logges til `AIUsage` med module=`transcription`).

---

## 9. Datamodell-påvirkning på andre entiteter

### `AIUsage.module` enum utvides
- Legger til `transcription`.

### `Hook` får mulighet til å peke tilbake på `Idea`
- Valgfri `idea_id` FK.
- `source_type` kan være `idea_bank`.

### `Post.hooks[]` kan fortsatt inneholde en blanding av rene knagger og ide-baserte knagger — ingen spesialbehandling i Post-modellen.

---

## 10. Sikkerhet og personvern

- Lydopptak er personlig data. Lagres bare for Deniz sin konto med RLS (row-level security) i Supabase.
- Slett-funksjon: ideer og tilhørende lyd kan slettes fullstendig.
- Whisper-API-kall bruker Anthropic/OpenAI sine standard retningslinjer — data brukes ikke til trening.
- Dry-run-modus: transkribering kan slås av globalt i dev/test.

---

## 11. MVP vs. utvidelser

### MVP (Fase 2–3)
- Tekst-input.
- Stemmeopptak + transkribering (Whisper API).
- AI-sammendrag + kategori-forslag.
- "Generer post fra denne"-flyt.
- Bruk som knagg alene eller kombinert.

### Senere utvidelser
- Mobil-app / dele-target.
- E-post-innboks-integrering.
- Slack-slash-kommando.
- Semantisk søk over ide-banken.
- "Relaterte ideer"-forslag ved generering.
- Auto-flytting til "brukt" når en post basert på ideen publiseres.
