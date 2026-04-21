# Deniz LinkedIn Hub

Plattform for planlegging, generering, publisering og evaluering av LinkedIn-poster — alt fra samme flate, med færrest mulig klikk.

**Status:** Fase 0 ferdig. Klar for Fase 1.

---

## 📖 For grundig gjennomlesing
**[PLANLEGGING-SAMLET.md](PLANLEGGING-SAMLET.md)** — konsolidert versjon av hele planen i ett dokument.

---

## Start her

1. **[Prosjektgrunnlag](docs/00-prosjektgrunnlag.md)** — hvorfor vi bygger dette, hva som er ikke-forhandlingsbart. Dette er prosjektets minne.
2. **[Arkitektur](docs/01-arkitektur.md)** — overordnet teknisk design.
3. **[Plan og faser](docs/02-plan.md)** — roadmap.
4. **[Agent-gjennomgang 01](decisions/agent-review-01.md)** — åpne spørsmål du (Deniz) må svare på.

---

## Dokumenter

### Plan og arkitektur
- [00 Prosjektgrunnlag](docs/00-prosjektgrunnlag.md)
- [01 Arkitektur](docs/01-arkitektur.md)
- [02 Plan og faser](docs/02-plan.md)
- [03 Datamodell](docs/03-datamodell.md)
- [04 Integrasjoner](docs/04-integrasjoner.md)

### Innhold og tone
- [05 Kategorier](docs/05-kategorier.md) — 4 kategorier, mange-til-mange
- [06 Tone of voice og personas](docs/06-tone-og-personas.md) — hard_rules vs guidance
- [07 Genereringsflyt](docs/07-generering.md)
- [08 Kalender og postetider](docs/08-kalender.md)
- [09 Evaluering og læring](docs/09-evaluering-og-laering.md)

### Moduler
- [12 LinkedIn-preview](docs/12-linkedin-preview.md)
- [13 Algoritmefilter + tuner](docs/13-algoritmefilter-tuner.md)
- [14 Algoritme-innsikt-panel](docs/14-algoritme-innsikt-panel.md)
- [15 Selskapsprofil og USP](docs/15-selskapsprofil-og-usp.md)
- [16 Forbrukspanel](docs/16-forbrukspanel.md)
- **[17 Post-genereringsarkitektur (kjernemodul)](docs/17-post-genereringsarkitektur.md)** ⭐
- [18 Ide-bank (tekst + stemme)](docs/18-ide-bank.md)

### Prosess
- [10 Git og arbeidsflyt](docs/10-git-og-arbeidsflyt.md)
- [11 Åpne spørsmål og status](docs/11-apne-sporsmal.md)

### Agenter
- [Oversikt](agents/00-oversikt.md)
- [Software-arkitekt](agents/01-software-arkitekt.md)
- [LinkedIn-ekspert](agents/02-linkedin-ekspert.md)
- [Tekstforfatter](agents/03-tekstforfatter.md)
- [Markedsfører](agents/04-markedsforer.md)
- [Algoritmefilter + tuner](agents/05-algoritmefilter.md)

### Beslutninger
- [Agent-gjennomgang 01 — besvart](decisions/agent-review-01.md)
- [Arkitekt-review 01](decisions/arkitekt-review-01.md)
- [Agent-gjennomgang 02 — besvart](decisions/agent-review-02.md)
- [ADR 001 — Next.js](decisions/001-next-js-monolit.md)
- [ADR 002 — Supabase](decisions/002-supabase-postgres.md)
- [ADR 003 — Vercel + Railway](decisions/003-vercel-railway-deploy.md)
- [ADR 010 — "Slik tenker vi"](decisions/010-kategori-2-slik-tenker-vi.md)
- [ADR 021 — Kategori 4 + mange-til-mange](decisions/021-ny-kategori-vise-suksess-og-mange-til-mange.md)
- [ADR 022 — Agent-review 02 besvart (O1–O11)](decisions/022-agent-review-02-svar.md)
- [ADR 023 — Ide-bank](decisions/023-ide-bank.md)

---

## Status

✅ **Fase 0 (planlegging + arkitektur) er ferdig.** Alle åpne spørsmål besvart (O1–O11 + originale A/L/T/M/F/P/D). Nøkkelbeslutninger loggført som ADR-er.

**Kjernemoduler på plass i dokumentasjonen:**
- Post-genereringsarkitektur som eget hoveddokument (docs/17) — alle agenter samles om skriving.
- Algoritmefilter utvidet til filter + tuner.
- LinkedIn-preview som kjerne-UI.
- Algoritme-innsikt-panel med sist-oppdatert-dato.
- Selskapsprofil + USP med multi-kilde-scraping.
- Per-post evaluator-innsikt.
- Forbrukspanel.

**Klar for Fase 1 (grunnmur)** ved din endelige godkjenning. Jeg anbefaler at du:
1. Leser gjennom [docs/17-post-genereringsarkitektur.md](docs/17-post-genereringsarkitektur.md) nøye — det er det viktigste dokumentet nå.
2. Bekrefter at du vil starte Fase 1.

Fase 1-leveranser: repo, Supabase-oppsett, domenemoduler, deploy-pipeline, prompt-repo-struktur. Se [docs/02-plan.md](docs/02-plan.md).
