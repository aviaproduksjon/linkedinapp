# Innholdskategorier

> Fire hovedkategorier. En post kan tilhøre flere kategorier samtidig (mange-til-mange). Én av dem markeres som **primærkategori** og styrer fargekode + sortering. De andre vises som tags. Dette reflekterer at god LinkedIn-tekst sjelden er rent én ting.

---

## Kategori 1 — "Gi verdi til andre"

**Slug:** `give-value`

**Kjerne:** Løfte og skryte av andre. Handlingen å *gi* står sentralt.

**Undertemaer**
- Skryte av ansatte (nye, eksisterende, prestasjoner)
- Løfte frem samarbeidspartnere
- Skryte av kundeforhold / kundeprestasjoner
- Fremheve praktikanter / nye bidragsytere
- Takke bransjefolk for inspirasjon/samarbeid

**Typiske knagger**
- Intern Avia-nyhet om ny ansatt / praktikant
- Kundecase som er publisert
- Bransjesamarbeid eller felles prosjekt

**Tonetips**
- Varm, ekte, ikke glatt.
- Navngi person(er) og det konkrete de bidro med.
- Unngå "generiske skryteposter" som føles hule.

**Regler for generering**
- Må ha en navngitt person/partner/kunde som knagg.
- Aldri generere uten faktisk grunnlag.

---

## Kategori 2 — "Slik tenker vi"

**Slug:** `slik-tenker-vi`

**Kjerne:** Heve troen på det Avia leverer. Modellen vi jobber etter, det vi tror på. Salg, men via kunnskapsdeling.

**Navn valgt:** "Slik tenker vi" (M1 svar). Konkret, ærlig, lavt prestisjenivå.

**Undertemaer**
- Avias arbeidsmodell og hvorfor den gir effekt
- Metodiske prinsipper (f.eks. hvordan vi tenker kreativ strategi, effekt, merkevare)
- Observasjoner fra bransjen som bekrefter/utfordrer vår tilnærming
- Konkrete eksempler fra vårt arbeid som illustrerer prinsipper

**Typiske knagger**
- En rapport som bekrefter/utfordrer Avias modell
- Et eget arbeid som eksemplifiserer modellen
- En bransjedebatt der Avia har et tydelig standpunkt

**Tonetips**
- Tydelig mening, ikke nøytral.
- Kunnskapsbasert — alltid vis hvor vi vet det fra.
- Aldri "salg uten fag". Hvis det ikke er en innsikt, er det ikke en post.

**Regler for generering**
- Må være knyttet til et konkret prinsipp eller et eksternt/intern faktum.
- Ingen abstrakte slagord uten innhold.

---

## Kategori 4 — "Vise suksess"

**Slug:** `vise-suksess`

**Kjerne:** Signalisere, direkte eller indirekte, at det vi gjør fungerer. Uten å bli skryteaktig.

**To subtyper:**

### 4a. Direkte suksess
Lansering, milepæl, tall, anerkjennelse.
- *"I dag lanserte vi X for Y."*
- *"X millioner visninger på filmen vi lagde for Z."*
- *"Vant kategori X på Y."*

### 4b. Indirekte suksess (sterkere signal)
Suksess gjennom en sidebemerkning som blir hovedpoenget ved å ikke være det.
- *"Jeg får daglig henvendelser fra markedsførere som er nysgjerrige på vår AI-hybrid-modell. Det har fått meg til å tenke på..."*
- *"Siden oppstart har vi sagt nei til omtrent halvparten av prosjektene vi blir spurt om. Her er hvorfor..."*

**Typiske knagger**
- Intern lansering / milepæl.
- Nylig anerkjennelse (kåring, vunnet pitch, osv).
- Resultater fra publiserte arbeider (tall, effektmåling).
- Observerte signaler (henvendelser, "mange spør meg om...").

**Tonetips**
- Subtilt. Jo mer indirekte, jo sterkere.
- Aldri som ene-kategori — kombineres oftest med én av de andre (f.eks. 4 + 2: "Slik tenker vi" + indirekte suksess).
- Unngå "vi er best"-fraser. Heller: "dette skjedde, noe å lære av".

**Regler for generering**
- Må ha et konkret faktum/hendelse som knagg — aldri fri fabulering om suksess.
- Hvis posten bruker kategori 4, krever algoritmefilteret ekstra sjekk for "salgstone" og skrytefølelse.
- Indirekte suksess vektes høyere i forslagsgenereringen enn direkte, fordi det ofte fungerer bedre for målgruppen.

---

## Kategori 3 — "Hjelpe markedsførere og markedssjefer"

**Slug:** `hjelpe-markedssjefer`

**Kjerne:** Dele nyheter og innsikt, med kort kommentar på hvorfor det er relevant for målgruppens pain points.

**Undertemaer**
- Nyhet + "hva betyr dette for deg som markedssjef"
- Rapportfunn + praktisk implikasjon
- Observasjon av en trend + konkret råd
- Advarsel om en fallgruve

**Typiske knagger**
- DN-artikkel som påvirker markedsbudsjetter
- ANFO/Nielsen-rapport med ny innsikt
- Kampanje-sak om endring i mediebildet

**Tonetips**
- Vær hjelpsom, ikke belærende.
- Si det rett frem: "Dette betyr X for dere."
- Kort — hver setning skal bære vekt.

**Regler for generering**
- Må alltid referere kilden tydelig.
- Må alltid ha en konkret "hva betyr dette for deg"-vinkling.
- Ikke dele nyheter uten kommentar — da blir det støy.

---

## Pain points vi bygger mot

Tre hovedsmerter vi eksplisitt adresserer (M2-svar):

1. **Behovene vokser, budsjettene står stille.** Mer innhold, flere kanaler, høyere tempo — men pengene følger ikke med.
2. **Færre ledd, raskere leveranser.** Jobb direkte med de som lager arbeidet / de kreative talentene.
3. **Mindre støy, mer dybde.** Folk bryr seg ikke lenger. Tilliten til reklame synker.

Disse er lagret som strukturerte `PainPoint`-entiteter og knyttes opp mot Avia sine USP-er (se `docs/15-selskapsprofil-og-usp.md`).

---

## Flerkategori-modell

En post kan tilhøre flere kategorier samtidig. Dette speiler virkeligheten: en god post om Avias modell kan også være et indirekte suksess-signal og samtidig hjelpe markedssjefer.

**Datamodell:**
- `Post.primary_category_id` — styrer fargekode og sortering.
- `Post.categories[]` — alle kategorier posten berører (inkluderer `primary_category_id`).

**UI-konsekvens:**
- Fargekode per kategori (én per kategori, definert på `Category`-entiteten).
- Posten vises med **primærkategoriens farge** som hovedelement.
- Tilleggs-kategorier vises som små tags eller et subtilt "fargebånd".

**Ved generering:**
- Brukeren kan velge 1–3 kategorier når posten skapes.
- Hvis flere er valgt, marker én som primær (eller la systemet foreslå).
- Generatoren får alle kategorienes genererings-guidance som sammensatt kontekst — vektet mot primærkategorien.

---

## Farger (forslag, kan endres)

| Kategori | Farge |
|---|---|
| 1 Gi verdi til andre | Varm gul |
| 2 Slik tenker vi | Dyp blå |
| 3 Hjelpe markedssjefer | Grønn |
| 4 Vise suksess | Lilla |

---

## Tverrgående regler

1. Hver kategori har én eller flere obligatoriske knagger.
2. Generatoren skal avvise posten hvis knagg mangler.
3. Algoritmefilteret skal vite hvilke kategorier posten er i, og vurdere deretter.
4. Kategoriene kan utvides, men aldri utvannes.
5. Kategori 2, 3 og 4 skal, når relevant, trekke på en matchende USP fra selskapsprofilen.
6. CTA-stil varierer per post (M3): `none` / `soft` / `direct`.
7. Ved flere kategorier: primærkategoriens regler dominerer, tilleggs-kategorier bidrar med vinkler.
8. Kategori 4 kan ikke være primær hvis posten ikke har et konkret suksess-faktum — da er den bare et tag.
