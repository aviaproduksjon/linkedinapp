# Algoritme-innsikt-panel

> Alltid-oppdatert, kortfattet oversikt over hva som fungerer på LinkedIn for norsk B2B-marked nå. Vises som fast panel i UI og brukes også som kontekst inn i generatoren. Oppdateres halvårlig.

---

## 1. Hvorfor

LinkedIn-algoritmen endrer seg. Det samme gjør hva som "funker" kulturelt i norsk markedsbransje. Hvis vi bare har algoritmeforståelse som filter på slutten, skriver vi posten blind av og så filtrerer. Bedre: **forstå først, skriv smart, filtrer til slutt.**

---

## 2. Hva panelet inneholder

Tre seksjoner, hver 3–7 korte punkter:

### A. Teknisk algoritmestatus
Hva LinkedIn-feeden favoriserer akkurat nå.
- *Eksempel:* "Lang tekst (~1200 tegn) outperformer kort (~300)."
- *Eksempel:* "Kommentarer veier 5–10x mer enn likes for videre distribusjon."
- *Eksempel:* "Eksterne lenker straffes i første 2 timer."

### B. B2B-praksis i Norge
Konkrete mønstre observert blant gode norske B2B-stemmer.
- *Eksempel:* "Personlige 'jeg'-poster slår 'vi'-poster for konsulent-/byrå-personer."
- *Eksempel:* "Case-deling uten kundenavn taper mot navngitte case."
- *Eksempel:* "Uke 15–20 og uke 34–40 har høyest oppmerksomhet."

### C. Kulturelle normer (markedsbransje, Norge)
- *Eksempel:* "Selvironi og direkte språk slår polished PR."
- *Eksempel:* "Fagautoritet uten selvhøytidelighet skaper kommentarer."
- *Eksempel:* "Norsk marked er intolerant for corporate speak."

---

## 3. Hvor brukes panelet

### I UI (synlig)
- Et fast panel, typisk i sidebar eller som "slide-out". Ett klikk unna.
- Hver seksjon kan klappes inn/ut.
- **Alltid synlig "sist oppdatert"-dato** øverst i panelet (O7-svar). Brukes til å bygge tillit til at innsikten er aktiv, og for å trigge halvårlig research når det nærmer seg.
- Når tuneren eller algoritmefilteret gir feedback på en post, kan UI markere **hvilke punkter i panelet** som er grunnlaget for feedbacken.

### I generering (skjult)
- Generator-promptet får relevante utdrag fra panelet som kontekst.
- Algoritmefilteret bruker det samme som referansepunkt.
- Dette er forskjellen på "skriv så godt du kan, vi filtrerer etterpå" og "skriv med utgangspunkt i hva som faktisk fungerer".

---

## 4. Oppdateringsflyt

- **Frekvens:** Hver 6. måned (eller ved større LinkedIn-endringer).
- **Flyt:**
  1. Research-agent samler signaler (bransjeartikler, benchmark-studier, egne data).
  2. Genererer utkast til oppdatert panel.
  3. Deniz godkjenner eller reviderer.
  4. Endringen lagres som versjon — ingen sletting av gamle versjoner.
- **Varsling:** Deniz får påminnelse 7 dager før det er tid for oppdatering.

## 5. Datamodell

Ny entitet `AlgorithmInsight`:

| Felt | Type |
|---|---|
| id | uuid |
| version | int |
| active_from | timestamp |
| active_to | timestamp (null = gjeldende) |
| section | enum (`technical`, `b2b_practice`, `cultural`) |
| bullets | text[] |
| sources | text[] (lenker eller referanser) |
| approved_by | string |
| approved_at | timestamp (vises som "sist oppdatert" i UI) |
| next_review_due | timestamp (auto-beregnes: approved_at + 6 mnd) |

## 6. Sporbarhet

Hver post logger hvilken `AlgorithmInsight`-versjon som var aktiv under generering. Dette lar oss senere svare "hvilke antakelser ble brukt?" og evaluere om antakelsene holdt.

## 7. Risikoer

- **For generelt:** Panelet må være skarpt. Hvis det blir en liste med selvfølgeligheter ("lag bra innhold!"), har det null verdi.
- **Overfitting:** Hvis panelet er for spesifikt, låser det generatoren. Derfor: maks 5–7 punkter per seksjon, hver skal være testbar.
- **Stagnasjon:** 6 mnd er mye på LinkedIn. Vi åpner for "hotfix-oppdatering" hvis vi observerer en tydelig endring.
