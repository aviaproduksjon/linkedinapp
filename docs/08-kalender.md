# Kalender og optimale postetider

---

## 1. Rolle i plattformen

Kalenderen er hovedflaten. Alt skjer her:
- Se planlagte og publiserte poster.
- Dra og slipp utkast inn i tidsluker.
- Få forslag til optimal postetid per post.
- Se performance på publiserte poster (inline).
- Hoppe direkte til editor for revidering.

---

## 2. Visning

- **Uke** er standardvisning (LinkedIn-syklus er ukesbasert).
- **Måned** som alternativ.
- Hver post i kalenderen viser:
  - Titt-ikon for persona (farge/initial).
  - Kategori (liten etikett).
  - Status (utkast / planlagt / publisert / feilet).
  - Mini-metrikk hvis publisert (rekkevidde / engasjement).
- Dobbeltklikk åpner editor.

---

## 3. Forslag til postetid ("optimal slot")

### Utgangspunkt (hypoteser — må valideres med faktiske data over tid)
Norsk B2B-målgruppe (markedssjefer/markedsførere):
- **Tirsdag–torsdag, kl. 07:30–09:30** — morgenkaffe/pendler.
- **Tirsdag–torsdag, kl. 11:30–12:30** — lunsjpause.
- **Søndag kveld, 19:00–21:00** — "forberede uken"-modus.
- Unngå mandag morgen (støy) og fredag ettermiddag (lav lesing).

### Hvordan foreslå
- Systemet har en "slot-model" som vekter tidspunkter mot:
  - Historisk performance på *egne* publiserte poster (når vi har data).
  - Hypotesene over som prior.
  - Kollisjoner (ikke to poster samme dag for samme persona).
  - Kategori-hensyn (kategori 3 / hjelpe-markedssjefer fungerer best mandag formiddag? osv — må læres).
- Brukeren kan alltid overstyre.

### Adaptiv læring
- Etter hver publisering logges {time_of_day, day_of_week, category, persona, engagement}.
- Modellen (starter som en enkel vektet gjennomsnitts-modell, kan bli mer avansert senere) oppdateres.

---

## 4. Regler

- **Ett forslag om gangen per persona per dag** (med mindre brukeren eksplisitt overstyrer).
- **Minimum 3 timer mellom publiseringer** hvis flere personas.
- **Helligdager og ferier** flagges (norsk kalender).

---

## 5. Kollisjonshåndtering

- To poster i samme slot → varsling og forslag om nærmeste optimale alternativ.
- Planlagt post som ikke er godkjent → markeres tydelig.

---

## 6. Integrasjon med generering

- Fra kalenderen kan brukeren høyreklikke på en tom tidsluke → "Foreslå post for denne slotten" → generering starter med slot-konteksten (dag/tid/kategori) som ekstra input.
