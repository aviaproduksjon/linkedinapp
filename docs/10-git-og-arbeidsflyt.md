# Git og arbeidsflyt

---

## 1. Anbefaling

**Ja, sett opp Git fra dag én.** Det er billig, gir historikk på *alle* beslutninger, og låser opp:
- Trygg eksperimentering (branches).
- Review-flyt (PR-agenter kan kjøres lokalt eller i CI).
- Rullbar historikk hvis noe går galt.
- Delbar med eventuell samarbeidspartner senere.

---

## 2. Struktur

- **Monorepo** i dette katalogtreet.
- Hovedbranch: `main`.
- Alle endringer (inkludert planleggingsdokumenter) går via branches:
  - `docs/<tema>` for planleggingsendringer.
  - `feat/<modul>` for fremtidig kode.
  - `fix/<kort>` for fremtidige feil.

---

## 3. Anbefalte Git-"agenter" / automasjon

Du spurte om git-agenter kan gjøre dette topp-nivå. Her er hvilke som gir størst effekt, sortert etter verdi:

### Høy verdi

1. **Commit-agent** — genererer commit-meldinger basert på diff, i prosjektets stil. Claude Code har dette innebygd. Anbefaling: **ja, bruk fra start**.
2. **PR-review-agent** — går gjennom hver PR og kommenterer i rolle som hver av plannings-agentene (arkitekt, LinkedIn-ekspert, algoritmefilter). Dette speiler hovedarkitekturen vår inn i kode-reviewen. **Anbefaling: ja, bygg inn etter Fase 1.**
3. **Decision-logger** — hver gang en åpen avklaring besvares, skrives en ADR (Architecture Decision Record) i `decisions/`. **Anbefaling: ja, manuelt fra start, automatiser senere.**

### Medium verdi
4. **Test-runner-agent** — kjører test + lint og kommenterer resultatet i PR. Vent til Fase 1 når vi har kode.
5. **Dokumentasjons-synkroniserings-agent** — sjekker at `01-arkitektur.md` og kode er i synk. Vent til Fase 2+.

### Lav verdi i starten
6. **Dependency-update-agent** — senere.
7. **Security-scan-agent** — senere.

---

## 4. Branch-regler (fra start)

- `main` er alltid i deploybar tilstand.
- Alle PR-er må:
  - Ha en ADR hvis de endrer arkitektur.
  - Gå innom `00-prosjektgrunnlag.md` — sikter vi fortsatt mot riktig mål?
  - Passere algoritmefilter-agentens sjekk hvis de påvirker post-generering.
- Squash merge som default (rent historikk).

---

## 5. Commit-stil

- Format: `<type>: <kort>` (conventional commits).
- Typer: `docs`, `feat`, `fix`, `chore`, `refactor`, `test`, `adr`.
- Meldinger på norsk er OK for planleggingsdokumenter, engelsk for kode — valget loggføres når det tas.

---

## 6. Decisions-mappen (ADR)

Hver ikke-triviell beslutning får en egen fil:

```
decisions/
  001-velger-next-js-for-frontend.md
  002-pg-vector-for-embedding.md
  ...
```

Mal (kort):

```markdown
# Beslutning N — <kort tittel>
Dato: YYYY-MM-DD
Status: vedtatt | under vurdering | avvist

## Kontekst
Hva utløste behovet for valget?

## Alternativer
1. A — fordeler / ulemper
2. B — fordeler / ulemper

## Valg
A, fordi ...

## Konsekvenser
Hva låser dette, hva åpner det?
```

---

## 7. Hva trengs ikke (nå)

- Ingen CI/CD før Fase 1.
- Ingen branch-protection-regler før vi har kode.
- Ingen tagging / release-flyt før v1.

---

## 8. Oppsummert anbefaling

**Ja** — init Git nå, slik at selv disse planleggingsdokumentene får historikk.
**Ja** — bruk commit-agent og ADR-logg fra start.
**Vent** med PR-review-agent til det faktisk er kode.
