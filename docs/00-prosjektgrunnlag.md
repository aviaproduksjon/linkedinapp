# Prosjektgrunnlag — Deniz LinkedIn Hub

> **Formål med dette dokumentet:** Dette er prosjektets "minne". All videre planlegging, arkitektur og utvikling skal alltid innom dette dokumentet for å sikre at vi sikter mot riktig mål. Oppdateres bare med bevisste, loggførte endringer (se `decisions/`).

---

## 1. Overordnet mål

Bygge en plattform for **Deniz** (Avia) som lar én person planlegge, generere, revidere, publisere og evaluere LinkedIn-poster fra samme sted — med færrest mulig klikk.

**Forretningsmål:** Generere innkommende, varme leads via LinkedIn.
**Målgruppe:** Markedsførere og markedssjefer i Norge.
**Kjerneverdi:** Poster som treffer målgruppens pain points, speiler deres språk, og aldri føles generiske eller AI-generiske.

---

## 2. Ikke-forhandlingsbare prinsipper

1. **Null hallusinering.** Alt AI-generert innhold skal være forankret i konkrete "knagger" (kilder) — aldri fri fabulering.
2. **Solid arkitektur fra bunnen.** Ingen snarveier. Skalerbart, testbart, modulært.
3. **Kunnskapsbasert, ikke generisk.** Hvis en post ikke har et konkret grunnlag, skal den ikke lages.
4. **Helhet før flik.** Ingen utvikling starter før plan og arkitektur er godkjent.
5. **Algoritmefilter som siste ledd.** En LinkedIn-algoritmeekspert-agent gjennomgår alle poster og plattformendringer som siste sjekk.
6. **Minnet styrer kursen.** Dette dokumentet + arkitekturen er referansepunktet ved hver endring.

---

## 3. UI-prinsipp

- **Én side, minimalistisk.** Alt synlig, minst mulig navigasjon.
- **Venstre sidebar:** Personlige innstillinger (kan åpnes/lukkes). Inneholder tone of voice, temaer, kategorier, personas, andre preferanser.
- **Hovedområdet:** En enkel, ren kalender hvor innhold planlegges, genereres, revideres, publiseres og evalueres.
- **Alt i én plattform.** Generering, revidering, publisering, evaluering og læring skjer på samme flate.

---

## 4. Innholdskategorier (initielle)

### Kategori 1 — Gi verdi til andre
Løfte frem ansatte, samarbeidspartnere, kundeforhold. Alt som handler om å gi til og skryte av andre.

### Kategori 2 — Faglig overbevisning (arbeidstittel)
Heve troen på det Avia leverer: modellen vi jobber etter, det vi tror på. En form for salg, men via kunnskapsdeling. **Navnet på denne kategorien må raffineres** — se åpne spørsmål.

### Kategori 3 — Hjelpe markedsførere og markedssjefer
Dele aktuelle nyheter med kort, relevant kommentar knyttet til deres pain points.

---

## 5. Innholdskilder ("knagger")

Dette er inputene som gir grunnlag for poster. **Postene skal ikke handle om selve knaggen — knaggen er grunnlaget for å gjøre posten relevant.**

### Eksterne kilder
- **Bransjenyheter:** kampanje.com, Kreativt Forum.
- **Næringslivsnyheter:** DN, andre kilder som påvirker markedssjefer.
- **Rapporter:** ANFO, Nielsen og andre troverdige kilder innen kommunikasjon, markedsføring og effekt.

### Interne kilder (Avia)
- Nye arbeider postet på Avia sine SoMe eller nettside.
- Endringer i Avia: nye ansatte, nye praktikanter, generelt nytt.
- Avia sin nettside — arbeider ligger der først, derfra hentes info og detaljer.

---

## 6. Personas (tone-of-voice-profiler)

Brukeren kan opprette og bruke **flere ulike personas** i innstillinger. Hver persona har sine egne preferanser, tone of voice, snippets av eksempeltekst, osv.

### Genereringsregel
- Hvis **1 persona** er avhuket → plattformen lager alltid **2 forslag**.
- Hvis **2 personas** er avhuket → plattformen lager alltid **4 forslag** (2 per persona).
- Brukeren velger hvilket forslag som er best. Valget trener opp den aktuelle personas preferanser.

### Deniz sin grunn-tone of voice
- Kortfattet, rett frem, smart, men levende og tilgjengelig.
- **Ingen tankestreker.**
- Unngå komplekse formuleringer og tunge starter.
- Ikke pretensiøs.
- Ærlig, ikke redd for å si det jeg mener — så lenge det kommer fra noe jeg tror på.
- "Keep it stupid simple" i kommunikasjon. Samtidig kunnskapsbasert.
- Mer talespråk enn skriftspråk. Setninger kan starte midt i, avsluttes brått, være ufullstendige.
- Skriv som jeg snakker.
- **Speil målgruppens eget språk** når tema/fag diskuteres — via søk og scraping av kampanje.com og lignende bransjesider.

---

## 7. Kalender + optimale postetider

Kalenderen skal **foreslå** klokkeslett og dager som er optimale for norsk marked og målgruppen (markedssjefer/markedsførere). Boost-effekt er mål. Brukeren kan overstyre.

---

## 8. Læringsløkke

- Valg mellom forslag → trener personaens preferansemodell.
- Postens faktiske performance (rekkevidde, engasjement, kommentarer) → trener modellen videre.
- Treningsdata lagres som del av plattformens komplette system.

---

## 9. Agent-økosystem for planlegging og kvalitetssikring

Planleggingen drives av et sett spesialiserte agenter. Alle stiller spørsmål med **svaralternativer**, og markerer det anbefalte alternativet, slik at brukeren enkelt kan ta beslutninger.

1. **Software-arkitekt** — helhet fra start, solid bunn.
2. **LinkedIn-ekspert** — plattformens beste praksis, formater, crosspost-regler.
3. **Norsk tekstforfatter / språkekspert** — tone of voice, speiling av målgruppens språk.
4. **Markedsfører** — generell markedsføringskompetanse, pain points, leadgen.
5. **LinkedIn-algoritmeekspert (siste ledd / filter)** — gjennomgår ALLE poster og plattformendringer som siste sjekk, vurderer, reviderer, gir innspill.
6. **LLM-agent** — samarbeider med LinkedIn-eksperten om optimal struktur og oppbygning for troverdighet + leadgen.

Agentene beskrives i detalj i `agents/`.

---

## 10. Hva som IKKE skal gjøres nå

- Ingen koding.
- Ingen plattformutvikling.
- Ingen valg av tech stack før arkitekturen er godkjent.
- Ingen integrasjonsarbeid.

**Kun:** Planlegging, arkitektur, agentdefinisjoner, og avklaringsspørsmål.
