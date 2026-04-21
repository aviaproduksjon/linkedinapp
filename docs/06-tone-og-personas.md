# Tone of voice og personas

---

## 1. Deniz sin grunn-tone of voice

### Hva tonen skal være
- Kortfattet, rett frem, smart.
- Levende og tilgjengelig.
- Ærlig. Ikke redd for å si det jeg mener, så lenge det kommer fra noe jeg tror på.
- Mer talespråk enn skriftspråk. Skriv som jeg snakker.
- Setninger kan starte midt i. Avsluttes brått. Ikke alltid fullstendige.
- Kunnskapsbasert. Vis hva vi kan.
- "Keep it stupid simple."

### Hva tonen ikke skal være
- **Ingen tankestreker.** Aldri.
- Ingen tunge, lange åpninger som får folk til å falle av.
- Ikke pretensiøs.
- Ikke glatt eller formelt skriftspråk.
- Ikke komplekse formuleringer der enkle fungerer.
- Ingen AI-klisjeer ("I dagens raskt skiftende markedslandskap...", "I en verden der..." osv).

### Språkspeiling
- Når tema/fag diskuteres, skal tonen speile målgruppens (markedssjefer/markedsførere i Norge) faktiske språk.
- Mekanisme: søk + scraping av kampanje.com og lignende, samt LinkedIn-innlegg i samme bransje.
- Språkspeiling er **kontekst** til generatoren — ikke kopiering.

---

## 2. Persona-systemet

### Hvorfor flere personas?
- Teste ulike stemmer uten å miste Deniz sin grunnstemme.
- Sammenligne forslag side om side for å lære hva som fungerer.
- Gi rom for at Avia-stemme og Deniz-stemme kan være to ulike ting.

### Hvordan velges persona?
- I sidebar har brukeren en liste over personas.
- Hver persona har en avkrysningsboks.
- Reglene for generering:
  - 1 persona avhuket → **2 forslag** genereres (begge fra samme persona, med ulik vinkling).
  - 2 personas avhuket → **4 forslag** genereres (2 per persona).
  - Maksimalt 2 personas avhuket om gangen (dette bør bekreftes i agent-gjennomgangen).

### Per-persona-innstillinger
- Navn
- Kort beskrivelse ("Hvem er dette?")
- Tone of voice (fri tekst)
- **Hard_rules** (T2-svar): brudd → avvisning og automatisk regenerering én gang. Eksempel: "Ingen tankestreker". Brukes sparsomt, bare det som absolutt ikke skal slippe ut.
- **Guidance**: brudd → advarsel, vis posten likevel, flagg for læring. Dette er alt annet. Brukes mye. Eksempel: "Foretrekk setninger som starter midt i."
- Snippets (Deniz sin eksempeltekst — bevist å fungere best)
- Målgruppe-notater ("Hvem snakker denne til?")
- Preferanse-vekter (lært over tid, ikke fri tekst — dette er modellens trenings-tilstand)
- Kategorier personaen er "god på" (lært over tid)

### Treningsmekanisme
- Hver gang brukeren velger et forslag, loggføres det.
- Valg over tid bygger opp:
  - Hvilke strukturer fungerer (hook → poeng → CTA? spørsmål → innsikt? osv).
  - Hvilke kategorier personaen er sterkest i.
  - Hvilke typer knagger som gir best resultat.
- Faktisk post-performance (rekkevidde, engasjement) vekter treningen.
- **Snippets** er høyt vektet eksempeltekst som generatoren bruker som stiltransfer-kilde.

---

## 3. Standard-persona ved oppstart

**Navn:** Deniz

**Beskrivelse:** Hovedstemmen. Grunn-tone of voice (se punkt 1).

**Hard_rules (brudd → avvis og regenerer)**
- Ingen tankestreker (—, –).
- Ingen AI-klisjé-åpninger ("I en verden der...", "I dagens...", "I det moderne markedet...").
- Minst én knagg må være referert (eksplisitt eller implisitt).

**Guidance (brudd → advarsel, lær over tid)**
- Skriv som jeg snakker.
- Kort, rett frem.
- Si det jeg mener.
- Start midt i når det fungerer.
- Legg inn innsikt, ikke bare observasjon.
- Ikke pretensiøs, ikke tunge åpninger.
- Ikke generelle skryteposter uten konkret grunnlag.

**Snippets:** Legges inn av brukeren etter hvert.

---

## 4. Eksempel-persona som alternativ til test

**Navn:** Avia-stemme (foreløpig)

**Beskrivelse:** Mer "vi" enn "jeg". Mer faglig autoritet, mindre personlig. Brukes til kategori 2.

---

## 5. Regler for generatoren

1. Generatoren får persona-kontekst som strukturert JSON (ikke fri prompt).
2. Snippets vektes høyest som stiltransfer.
3. Don't-regler er harde constraints — posten avvises og genereres på nytt hvis brutt.
4. Generatoren får 2–5 språkspeilings-chunks som inspirasjon (ikke sitat).
5. Hvert forslag skal være tydelig annerledes strukturelt fra det andre — ikke to varianter av samme tanke.
