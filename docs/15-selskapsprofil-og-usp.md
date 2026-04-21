# Selskapsprofil og USP-register

> Forretningskonteksten som alle personas kan trekke på. Separert fra persona (stemme/stil) for ikke å blande ting som endrer seg i ulik takt.

---

## 1. Hva er forskjellen på Selskapsprofil og Persona?

| | Selskapsprofil | Persona |
|---|---|---|
| Innhold | Fakta om Avia: tjenester, USP-er, kunder, modell | Stemme, tone, stil, eksempler |
| Endringsfrekvens | Sjelden (kvartalsvis?) | Løpende (snippets legges til over tid) |
| Gjelder for | Alle personas | Bare seg selv |
| Brukes til | Forankre poster i faktisk forretning | Definere *hvordan* det skrives |

---

## 2. Struktur på selskapsprofilen

```
Selskap: Avia / Avia Produksjon AS
├── Tjenester (hovedtilbud)
├── USP-er (konkrete forskjellspunkter)
├── Kjerneverdier / modell
├── Målgrupper
├── Referansekunder (navn som kan nevnes offentlig)
├── Case-eksempler (korte, til bruk i poster)
└── Nøkkeltall (relevante og bekreftede)
```

---

## 3. USP-modulen

### 3.1 Hva er en USP her?
Ikke en slagordfrase, men et **forskjellspunkt med forklaring og bevis**. Eksempel-struktur:

```
USP: Færre ledd
Beskrivelse: Kunden jobber direkte med de som lager arbeidet, ikke gjennom tre lag mellom strategi og produksjon.
Bevis: [Case X leverte Y dager raskere enn standard-modellen].
Mot hvilken pain point: "Færre ledd, raskere leveranser..."
```

### 3.2 USP-innhenting — kombinert scraping + bransjesignaler (O6-svar)

Vi henter USP-kandidater fra flere kilder og **syntetiserer** dem. Dette gir rikere, mer kalibrerte forslag enn ren nettsidescraping.

**Kildesett:**

1. **Direkte bedriftsinnhold (primær):**
   - `aviaprod.no` — forside, tjeneste-sider, "om oss", case-sider.
   - Eventuelle sub-sider som omtaler modell, tilnærming, talent-tilgang.

2. **Søkeresultater om bedriften:**
   - Web-søk på "Avia Produksjon", "aviaprod", nøkkelpersoner — plukk opp hvordan andre omtaler Avia.
   - Pressesaker, intervjuer, omtaler.

3. **SoMe-aktivitet (offentlig):**
   - Avia sin Company Page på LinkedIn (offentlige poster).
   - Nøkkelpersoners offentlige profilaktivitet (med forsiktighet — bare offentlig, ikke scraping av private innhold).
   - Vurder Instagram/Vimeo/YouTube for visuell kontekst.

**Syntese-flyt:**

1. Deniz trykker "Foreslå USP-er".
2. Systemet henter paralelt fra alle tre kildesett.
3. AI-agenten (USP-ekstraktor, Sonnet):
   - Ekstraherer gjentakende formuleringer og temaer fra direkte innhold.
   - Kalibrerer mot *hvordan andre omtaler Avia* (kilde 2) — interessant når selvbildet og utsidens bilde avviker.
   - Leter etter signaler fra SoMe-aktivitet om hva som resonerer.
   - Klassifiserer mot kjente pain points.
   - Foreslår 5–10 strukturerte USP-utkast med kilde-referanser.
4. Deniz får dem i en redigerbar liste:
   - Godta som er.
   - Rediger tekst.
   - Legg til bevis/case.
   - Avvis.
5. Godkjente USP-er lagres i databasen.

**Viktige regler:**
- Scraping respekterer robots.txt også på egne domener.
- Cache + rate-limit på alle eksterne kall.
- Kilde-lenker lagres per USP-forslag — brukeren kan alltid se hvor det kom fra.
- LinkedIn-scraping følger plattformens retningslinjer (offentlig data + ingen overtredelse).

### 3.3 Generator-bruk
Når en post lages i kategori 3 (hjelpe markedssjefer) eller 2 (slik tenker vi), og pain point matcher en USP, får generatoren USP-en som **ekstra knagg**.

**Regel:** USP er *ikke* sentrum i posten. Posten handler om pain pointet og innsikten, USP-en er et diskret bevis på at Avia tar det alvorlig.

---

## 4. Datamodell

### `Company`
| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | |
| name | string | |
| legal_name | string | "Avia Produksjon AS" |
| tagline | text | |
| services | text[] | |
| core_model | text | Modellen Avia jobber etter |
| target_segments | text[] | |
| created_at / updated_at | ts | |

### `USP`
| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | |
| company_id | uuid | |
| name | string | Kort navn ("Færre ledd") |
| description | text | |
| proof | text | Case, tall, eksempler |
| related_pain_points | uuid[] | FK → PainPoint |
| status | enum | `suggested`, `active`, `archived` |
| source_url | string | Hvor USP-en ble scrapet fra |
| approved_by | string | |

### `PainPoint`
| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | |
| name | string | Kort navn |
| description | text | Full formulering |
| priority | int | |
| active | boolean | |

**Initielle pain points (fra M2):**
1. Behovene vokser, budsjettene står stille.
2. Færre ledd, raskere leveranser.
3. Mindre støy, mer dybde.

---

## 5. UI

- **Selskapsprofil** som eget valg i sidebar (under personas).
- **USP-liste** med status-indikatorer (foreslått / aktiv / arkivert).
- **"Foreslå USP-er"-knapp** trigger scraping-flyten.
- **Pain point-valg** er synlig under hver USP.

---

## 6. Hvem ser hva?

Generator får:
- Kategori-spesifikke instruksjoner.
- Persona-kontekst.
- Knagger (nyheter, rapporter, interne).
- **Selskapsprofil + relevante USP-er**, men **bare hvis** de er knyttet til samme pain point som posten svarer på.

Algoritmefilter får:
- Alt av det over (F3 = hele konteksten).
- Kan ikke legge til salgsaktige fraser, men kan flagge hvis en USP er løst frikoblet fra pain pointet.

---

## 7. Overstyring per persona (O9-svar)

Selskapsprofilen er **global** (én Avia-profil), men persona kan overstyre enkeltfelt når det gir mening:
- `target_audience_notes` kan variere (noen personas snakker til markedssjefer, andre til kreative ledere).
- Tonen rundt hvordan USP-er omtales.

USP-ene selv (navn, beskrivelse, bevis) er **globale og uforanderlige per persona** — vi vil ikke ha "to versjoner av samme sannhet".
