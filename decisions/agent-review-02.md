# Agent-gjennomgang 02 — oppfølging etter arkitekt-review

> Små, tydelige avklaringer etter at vi gikk gjennom svarene dine. Hvert spørsmål har svaralternativer og anbefaling (✅).

---

### O1. A4-avklaring — scheduler / jobbhåndtering
Du spurte "du anbefalte jo ikke Node i A1?". Kort oppklaring: **Next.js kjører på Node.js** — det ene velger det andre. Så BullMQ-anbefalingen er konsistent med A1.

- A. **BullMQ + Redis** på Railway-workeren. ✅ **Anbefalt** — passer perfekt med stacken vi har valgt.
- B. Supabase Edge Functions + pg_cron for MVP, BullMQ senere hvis volumet øker. Enklere, mindre infra.
- C. Temporal — overkill for nå.

**Svar: A**

---

### O2. D2-avklaring — språk i dokumenter
Du valgte C (alt på engelsk, inkl. planlegging). Men all planlegging er hittil på norsk, og du skriver selv på norsk. Vi må avklare scope:

- A. **Engelsk i kode og teknisk dokumentasjon; norsk i strategi-/forretningsdokumenter (prosjektgrunnlag, kategorier, tone of voice, pain points).** ✅ **Anbefalt.**
- B. Oversett ALT til engelsk, også eksisterende docs. Stort arbeid, men konsistent.
- C. Bare nye docs på engelsk, eksisterende forblir norske.
- D. Alt norsk, inkludert kode og kodekommentarer.

**Svar: A**

---

### O3. Domene og DNS — `linkedin.avialab.no`
- A. **Jeg eier `avialab.no` og kan sette opp CNAME til Vercel når det er klart.** ✅ **Anbefalt flyt.**
- B. Noen annen i Avia eier det — må avklares.
- C. Avialab.no er ikke registrert ennå / må kjøpes.

**Svar: A**

---

### O4. Modellfordeling for kostnad
Generator + tuner + algoritmefilter i én generering betyr 3–6 LLM-kall per forslag. For å holde kostnaden under 500 kr/mnd uten å ofre kvalitet:

- A. **Opus for generator og evaluator. Sonnet for tuner og algoritmefilter. Haiku for klassifisering av knagger og relevans-scoring.** ✅ **Anbefalt.**
- B. Opus for alt — høyere kost, høyere kvalitet.
- C. Sonnet for alt — balansert, billigst.

**Svar: A**

---

### O5. Frekvens og rytme
B2B-markedsfører-agenten anbefaler **1–2 poster per uke** som default, med mulighet for "kampanje-uker" (3–4) når Avia lanserer nye arbeider.

- A. **1–2 per uke default, opp til 3–4 ved kampanjer.** ✅ **Anbefalt.**
- B. Fast 2 per uke.
- C. Helt fleksibelt, ingen default-rytme.

**Svar: A**

---

### O6. USP-kilder (for forslag)
Hvor skal USP-scraperen hente fra?

- A. **aviaprod.no(forsider + tjeneste sider + "om"-sider + case-sider).** ✅ **Anbefalt start.**
- B. Bare avia.no.
- C. Inkluder også utvalgte LinkedIn-poster fra Avia-sidene.

**Svar: A med mindre endringer + KOMBINER SCRAPING MED SØKERESULTATER PÅ BEDRIFT, INKL SOME AKTIVITET**

---

### O7. Algoritme-innsikt-panel — oppdateringsflyt
Panelet skal oppdateres halvårlig. Hvordan?

- A. **En research-agent genererer utkast hvert halvår, Deniz godkjenner før det går live.** ✅ **Anbefalt** — menneske i loop.
- B. Manuell oppdatering av Deniz, ingen agent.
- C. Auto-oppdatering uten godkjenning.

**Svar: A VIS DATO SISTE OPPDATERT**

---

### O8. Algoritmefilter-tuner — grad av justering
Når tuneren justerer en post for algoritmen, hvor mye får den endre?

- A. **Kun "ikke-invasiv" tuning: linjeskift, emoji-rytme, hook-styrking i første 2 linjer. Aldri endre budskap eller sentensstruktur utover det.** ✅ **Anbefalt.**
- B. Moderat: kan flytte setninger og legge til/fjerne opptil 10% av innholdet.
- C. Ingen tuning — bare blokkere.

**Svar: A**

---

### O9. Company Profile (USP og fakta)
Er selskapsprofilen **global** (én Avia-profil for alle personas) eller **per persona** (hver persona har sin egen)?

- A. **Global Avia-profil, men persona kan overstyre enkeltfelt (f.eks. "hvem snakker jeg til" kan variere).** ✅ **Anbefalt.**
- B. Per persona — mer fleksibelt, mer arbeid.
- C. Kun global, ingen overstyring.

**Svar: A**

---

### O10. Evaluator-synlighet
F4 sa "gjør ingenting" ved underpresterende post. Skal evaluator-innsikter være synlige for brukeren?

- A. **Ja — lite "innsikt"-panel per post som viser hva evaluator lærte, men ingen handlinger kreves.** ✅ **Anbefalt.**
- B. Skjult — evaluator jobber i bakgrunnen, brukeren ser bare bedre forslag over tid.
- C. Bare tilgjengelig via admin-side.

**Svar: A**

---

### O11. Hard_rules vs guidance per persona
Eksempel for Deniz sin grunnstemme:

**Hard_rules (brudd → avvis + regenerer):**
- Ingen tankestreker (—, –).
- Ingen AI-klisjé-åpninger ("I en verden der...", "I dagens...").
- Må referere til minst én knagg.

**Guidance (brudd → advarsel, vis posten):**
- Foretrekk setninger som starter midt i.
- Foretrekk talespråk over skriftspråk.
- Foretrekk korte avsnitt.

- A. **Godta dette skillet som utgangspunkt. Kan utvides over tid.** ✅ **Anbefalt.**
- B. Flytt noe fra guidance til hard_rules.
- C. Flytt noe fra hard_rules til guidance.

**Svar: A MEN MANGLER GENERELLE GUIDENCE BASERT PÅ EN HELHETLIG VURDERING AV MÅLET FOR DENNE APPEN, INKL INNSPILL FRA LINKEDIN EKSPERT, B2B MARKETER, ENGENEER, TEKSTFORFATTER OG LLM EKSPERT. SKRIVE POSTER ER JO KJERNEN TIL APPEN, BYGG OPP STERK ARKITEKTUR FOR DETTE
**

---

## Etter at O1–O11 er besvart

...er vi klare for Fase 1. ADR-er skrives, nye docs (12–16) opprettes, og grunnmuren kan begynne.
