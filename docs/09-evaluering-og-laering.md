# Evaluering og læring

---

## 1. Prinsipp

Plattformen er et lukket læringssystem. Hver bruker-handling og hver post-metrikk går inn i en treningsløkke som gradvis gjør forslagene mer "Deniz" — uten at vi driver faktisk finetuning i starten.

---

## 2. To kilder til læring

### 2.1 Valg mellom forslag
- Når brukeren velger ett av N forslag → tydelig preferansesignal.
- Hvert valg logges med hele konteksten: persona, kategori, knagger, alle forslag, det valgte, prompt-versjon.
- Over tid gir dette rangerte preferansedata per persona.

### 2.2 Faktisk post-performance
- Etter publisering hentes metrikker ved 1t, 6t, 24t, 7d.
- Metrikker (impressions, reactions, comments, shares, clicks, follower_delta) vektes inn i en performance-score.
- Kommentarer og reaksjoner fra *målgruppen* (markedsførere/markedssjefer) vektes høyere enn fra andre. Krever anrikning — se åpne spørsmål.

---

## 3. Hvordan trener dette personaen?

### I fase 1–3 (før finetuning)
- Preferansevekter lagres som JSON per persona.
- Vektene styrer:
  - Hvilke strukturer (hook-typer, lengder, CTA-typer) som brukes oftere.
  - Hvilke snippets som løftes i stiltransfer-laget.
  - Hvilke kategorier personaen oftere velges til.
- Effekten skjer via **prompt-konstruksjon** — ikke modelloppdatering.

### I fase 6+ (valgfritt)
- Hvis datamengden er nok, vurder finetuning av en mindre modell på utvalgte best-ytende poster. Lavpris, høy kontroll.

---

## 4. Metrikker som brukes i plattformen

### Per post
- Impressions
- Reactions (like, celebrate, support, love, insightful, funny)
- Comments (antall + lengde + kvalitet)
- Shares
- Clicks (hvis lenke)
- Follower delta
- Målgruppe-ratio (andel av reaksjoner fra markedsfolk)

### Per persona
- Snitt per post på alle metrikker
- Vinnrate i A/B (når to personas genererer mot hverandre)
- Valgte vs. ikke-valgte forslag

### Per kategori
- Snitt-performance
- Beste dag/tid
- Beste knagg-type

---

## 5. Evaluator-komponenten

En egen tjeneste i AI-laget som:
- Leser nye metrikker fra DB.
- Produserer en "post-obduksjon" (hva funket, hva ikke).
- Oppdaterer preferansevekter.
- Flagger avvik (uvanlig dårlig / god performance) for brukeren.

### 5.1 Synlighet i UI (O10-svar)
- Hver publisert post har et lite **"Innsikt"-panel** direkte i preview/editor.
- Viser:
  - Algoritme-score (både pre- og post-tuning hvis relevant).
  - Kort oppsummering: "Hva evaluator lærte av denne posten".
  - Sammenligning mot personas snitt.
  - Hvilke aspekter ble oppdatert i preferansevekter.
- **Ingen handlinger påkrevd** — dette er informativ (F4).
- Kan lukkes/åpnes. Brukeren styrer synligheten selv.

---

## 6. Kvalitetssignaler fra brukeren

I tillegg til valg mellom forslag, samles:
- **Inline-redigeringer.** Hva blir endret i forslaget før godkjenning? (diff-analyse over tid viser systematiske svakheter)
- **"Avvis og regenerer"** — kraftig negativt signal.
- **Rask godkjenning uten redigering** — sterkt positivt signal.
- **Stjerner eller tommelen opp** på publiserte poster (valgfritt UI-element).

---

## 7. Personvern og etikk

- Treningsdata er lokale for brukeren.
- Hvis multi-user senere: streng per-user-isolering.
- Posten er alltid brukerens valg — ingen auto-publisering uten godkjenning.
