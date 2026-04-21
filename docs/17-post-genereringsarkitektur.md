# Post-genereringsarkitektur (kjernemodul)

> Å skrive poster som faktisk fungerer er kjernen i denne appen. Alt annet støtter dette ene. Derfor fortjener denne flyten en egen, eksplisitt arkitektur med innspill fra alle agentene samlet. Dette dokumentet er hoveddokumentet for *hvordan* en post blir til. Alle andre generering-/tone-/filter-dokumenter er bidragsytere til dette.

---

## 1. Prinsipper (signert av alle agentene samlet)

1. **Formål styrer alt:** Hver post skal kunne forsvares mot ett mål — "gir dette varme B2B-leads mot norske markedsførere/markedssjefer?" Hvis svaret er uklart, regenereres eller avvises.
2. **Knagg før kreativ frihet:** Ingen post uten konkret, etterprøvbar kilde. Kilden kan være ekstern (nyhet, rapport) eller personlig (ide fra ide-banken). Kreativ frihet tas innenfor rammene av knaggen.
3. **Målgruppens språk, ikke vårt:** Posten må gjenkjenne målgruppens vokabular. Hvis posten høres ut som en konsulent i stedet for en markedssjef, er det en svakhet.
4. **Algoritme-forståelse tidlig, ikke bare sent:** Algoritmeinnsikt er kontekst inn i generator. Filtrering alene er for sent.
5. **Tonen er ufravikelig:** Deniz sin stemme er produktets største aktivum. Ingen optimalisering får lov å skade den.
6. **Variasjon, ikke formel:** Hvis postene ser like ut, mister de kraft. Arkitekturen håndhever strukturell variasjon mellom forslag.
7. **Alt er sporbart:** Hver post kan brytes ned — hvilken knagg, hvilken persona, hvilken USP, hvilken insight-versjon, hvilken prompt-versjon, hvilke modeller, hvem valgte, hva ble endret.

---

## 2. Bidrag fra hver agent — oppdelt ansvar

Hver agent eier en del av post-produksjonen. Grensene er skarpe for å unngå at agentene overkjører hverandre.

### Software-arkitekt (eier: rammeverket)
- Definere kontrakter (JSON inn/ut) mellom hvert ledd.
- Sørge for at hvert ledd er kjørbart isolert (testbarhet).
- Håndheve sporbarhet: alle avgjørelser lagres som Event.
- Kostnadskontroll: modellvalg per ledd (Opus/Sonnet/Haiku).

### LinkedIn-ekspert (eier: form og format)
- Velge format (tekst / bilde / karusell / dokument).
- Anbefale målformat: lengde (tegn), rytme (linjeskift), hook-type, CTA-mode.
- Kommentere plattform-egnethet før posten sendes videre.
- **Gir input tidlig** (før generator kjører) basert på kategori + knagg + insight-panelet.

### Norsk tekstforfatter / språkekspert (eier: språk og tone)
- Validere tone (hard_rules + guidance).
- Polsk setninger og rytme uten å endre budskap.
- Speile målgruppens språk (milde mønstre, ikke hele setninger — T1).
- Flagge AI-klisjéer, tankestreker, tunge åpninger.

### Markedsfører, B2B (eier: vinkling og verdi)
- Bekrefte at posten treffer en registrert pain point.
- Vurdere om USP-en posten knytter til er *konkret bevis*, ikke bare slagord.
- Vurdere lead-potensial: skaper posten samtale? Kan den føre til DM/kontakt?
- Foreslår vinkling som driver kommentarer (vs. kun likes).

### Algoritmefilter + tuner (eier: publiseringsrisiko)
- Score på 6 dimensjoner (hook, rytme, commentability, risiko, relevans, autentisitet).
- Tune ikke-invasivt mellom 0.25–0.70.
- Blokkere under 0.25.
- Re-validere tuning mot hard_rules.

### LLM-samarbeider (eier: prompt-engineering)
- Eie prompt-malene per kategori og per ledd.
- Versjonere prompter i repo, tagge hver generering med versjon.
- Lage "evals" som kan kjøres automatisk når prompter endres.

---

## 3. Fullstendig genereringsflyt

```
┌─────────────────────────────────────────────────────────────┐
│ 0. Trigger                                                  │
│    - Bruker velger kategori(er) + knagg, eller              │
│    - Systemet foreslår fra knagg-brønn, eller               │
│    - Kalender-slot trigger generering, eller                │
│    - Bruker trykker "Generer" på en ide i ide-banken        │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Kontekst-samling (Arkitekt + LinkedIn-ekspert)           │
│    - Primær + sekundære kategorier → guidance               │
│    - Aktive personas → hard_rules, guidance, snippets       │
│    - Knagger (1..n)                                         │
│    - Matchet pain point                                     │
│    - Matchede USP-er (bare hvis relevant)                   │
│    - Algoritme-innsikt-panel (aktiv versjon)                │
│    - Språkspeilings-chunks (2–5 fra vektor-DB)              │
│    - Format-anbefaling fra LinkedIn-ekspert                 │
│    - CTA-mode (none/soft/direct)                            │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Pre-generation review (LinkedIn-ekspert + Markedsfører)  │
│    Stop-sjekk FØR LLM-kallet:                               │
│    - Har vi en konkret knagg?                               │
│    - Treffer knaggen en pain point vi bygger mot?           │
│    - Er format valgt som passer kategori?                   │
│    - Er en USP koblet på hvis relevant?                     │
│    Ved nei: spør brukeren eller abort.                      │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Generator (Opus + LLM-samarbeider)                       │
│    - Strukturert JSON-kontrakt                              │
│    - N forslag per aktive persona (default 2 pr. persona)   │
│    - Eksplisitt krav om strukturell variasjon               │
│    - Eksplisitt forbud mot hard_rules-brudd                 │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Regel-validering (Tekstforfatter + programmatiske regler)│
│    - Regex: tankestreker, klisjé-åpninger                   │
│    - Lengde (tegn)                                          │
│    - Minst én knagg referert                                │
│    - Hard_rules per persona                                 │
│    Brudd → auto-regenerering én gang → hvis fortsatt brudd, │
│    flagg forslaget men vis begrunnet feilmelding.           │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Tekstforfatter-pass (Sonnet)                             │
│    - Polsk, stramme, skjerpe hook                           │
│    - Aldri endre budskap eller struktur                     │
│    - Notis om hva som ble endret                            │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Markedsfører-vurdering (Sonnet)                          │
│    - Pain point-treff score                                 │
│    - Lead-potensial (kommentarer?)                          │
│    - Fare for salgsaktig tone                               │
│    - Forslag til vinkling (ikke tekst-omskriving)           │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Algoritmefilter-score (Sonnet)                           │
│    - 6 dimensjoner, total score                             │
│    - Ser hele konteksten (F3)                               │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
    Score < 0.25                    0.25 ≤ Score < 0.70
         │                                   │
         ▼                                   ▼
    Blokker + regenerer           Tuner-pass (Sonnet/Haiku)
    (én gang)                     Ikke-invasiv justering
                                              │
                                              ▼
                                  Re-validering mot
                                  hard_rules → evt. rollback
                                              │
                                              ▼
                                    Re-score (post-tuning)
                 ┌─────────────────────────────┤
                 ▼                             ▼
             Score ≥ 0.70              Lagre tuner-diff
                 │                             │
                 └──────────────┬──────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Presentasjon til bruker                                  │
│    - Hvert forslag vises i LinkedIn-preview                 │
│    - Kategori-fargebånd (primær + sekundære)                │
│    - Algoritmefilter-score + markedsfører-innsikt           │
│    - Tuner-diff (hvis brukt) med mulighet for rollback      │
│    - Hvilken persona, hvilke knagger, hvilke USP-er         │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Brukeren velger, reviderer, godkjenner                   │
│    - Event: suggestion_chosen                               │
│    - Persona-vekter oppdateres                              │
│    - Inline-edit-diff lagres som læring                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Felles guidance for alle poster (agent-samlet)

Guidance som *alltid* gjelder, uavhengig av persona eller kategori. Dette er **appens baseline**, designet av alle agentene sammen:

### 4.1 Formål og mål (Markedsfører)
- Hver post skal kunne forsvares mot "skaper dette varme leads mot norske markedssjefer".
- Minst 80% av postene skal ha kommentar-invitert oppbygning (ikke bare like).
- Salgssignal fordeles: ~50% none, ~40% soft, ~10% direct CTA.

### 4.2 Struktur (LinkedIn-ekspert)
- **Hook i første 1–2 linjer.** LinkedIn skjuler alt etter "... se mer".
- **Lengde 1200–1800 tegn** som standard. Kort under 800 eller lang over 2200 kun når det virkelig virker.
- **Luftig formatering:** korte avsnitt, helst 1–3 linjer. Aldri murvegg.
- **Ingen eksterne lenker i første post** (de straffes). Lenke kan legges i første kommentar.
- **Maks 3 emojier**, og bare der de faktisk hjelper rytme eller struktur.

### 4.3 Tone (Tekstforfatter)
- Skriv som Deniz snakker: kort, rett, levende.
- Ingen tankestreker. Ingen klisjé-åpninger.
- Setninger kan starte midt i og avsluttes brått.
- "Vi" brukes med måte; "jeg" har ofte sterkere effekt i B2B.

### 4.4 Troverdighet (Markedsfører + Tekstforfatter)
- Hver påstand forankres i en knagg, en USP, eller en navngitt observasjon.
- Unngå "mange mener", "alle sier", "i disse tider" uten konkret referanse.
- Maks ett sitat (<15 ord) med kilde per post.

### 4.5 Leadgen-mekanikk (Markedsfører)
- Skap samtale: still spørsmål som *faktisk* kan besvares i kommentarfeltet.
- Invitér til DM ved spesifikk interesse, ikke som standard.
- Direct CTA (lenke) kun når posten eksplisitt handler om Avias tilbud.

### 4.6 Algoritme (LinkedIn-algoritmefilter)
- Første 2 linjer må tåle "cold read" uten kontekst.
- Posten bør tåle å stå alene i en feed full av støy.
- Overtagging (15+ hashtags, 10+ mentions) straffes — maks 3 hashtags, taggede personer kun når de faktisk er inne.

### 4.7 Teknisk (Arkitekt)
- Hver generering er idempotent: samme input + samme versjoner = samme output (innenfor rimelig LLM-variasjon).
- Alle prompter versjoneres i repo.
- Alle kall logges til `ai_usage` for kost-sporing.

### 4.8 Prompt-disiplin (LLM-samarbeider)
- Strukturert JSON inn, strukturert JSON ut.
- Hvert ledd har snever rolle — ikke la generator gjøre tuning eller omvendt.
- Eval-suite kjøres når prompter endres: 20 faste "canary posts" som må holde minimum score.

---

## 5. Per-kategori guidance-tillegg

Baseline over + kategoriens egne regler (fra `docs/05-kategorier.md`). Ved flere kategorier: primær dominerer, sekundære bidrar vinkler.

---

## 6. Sikkerhetsnett

Tre lag med sikkerhetsnett, hver med eget ansvar:

1. **Regel-validering** (steg 4): programmatisk. Fanger tankestreker, lengde, klisjé-regex.
2. **Algoritmefilter-score** (steg 7): modell-basert. Fanger "hører feil ut", svak hook, salgstone.
3. **Bruker-godkjenning** (steg 9): menneskelig. Siste og viktigste ledd.

Alle tre må passeres. Ingen post publiseres uten alle tre.

---

## 7. Evals og kvalitetsmåling

### 7.1 Canary-set
- 20 faste `{kategori, knagg, persona, mål}`-tilfeller.
- Kjøres ved hver prompt-endring.
- Må holde minimum score (0.70) på algoritmefilter + pass tekstforfatter-regler.

### 7.2 Produksjonsmetrikker
- Andel forslag som blir valgt uten redigering (mål: > 40%).
- Gjennomsnittlig algoritme-score post-tuning (mål: > 0.75).
- Antall hard_rule-brudd per 100 forslag (mål: < 5).

### 7.3 Læringssignaler som brukes
- Brukerens valg (steg 9).
- Inline-edits (diff = korreksjon-signal).
- Faktiske LinkedIn-metrikker (post-publish).

---

## 8. Hva denne arkitekturen håndhever

- **Ingen fri tekst mellom ledd.** Alt er JSON-kontrakt.
- **Ingen agent kan endre en annens output uten å være mandatert.** Tekstforfatter kan ikke endre budskap. Tuner kan ikke endre tone.
- **Rollback alltid mulig.** Hver transformasjon lagrer før/etter-state.
- **Modellvalg er eksplisitt.** Hvert ledd har definert modell i konfig.
- **Prompter er kode.** Versjonert, reviewable, testbart.

---

## 9. Nært relatert

- `docs/05-kategorier.md` — kategori-spesifikk guidance
- `docs/06-tone-og-personas.md` — persona-nivå regler
- `docs/07-generering.md` — input/output-kontrakter og avvisningsregler
- `docs/13-algoritmefilter-tuner.md` — detaljer om filter + tuner
- `docs/14-algoritme-innsikt-panel.md` — hvilken algoritmeforståelse som er aktiv
- `docs/15-selskapsprofil-og-usp.md` — fakta-grunnlaget
