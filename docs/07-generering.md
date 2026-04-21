# Genereringsflyt

---

## 1. Prinsipper

1. **Knagg først.** Ingen generering uten konkret kilde.
2. **Alltid N forslag.** 2 per aktive persona.
3. **Algoritmefilter som siste ledd.** Ingen forslag vises uten å ha passert.
4. **Strukturerte kontrakter.** JSON inn, JSON ut. Ingen fri tekst mellom ledd.
5. **Loggbar.** Hvert forslag kan spores tilbake til eksakt modellvalg, prompt-versjon, knagger og persona-tilstand.

## 1.1 Knagg-typer som aksepteres

- Ekstern: RSS, scraping, rapporter (ANFO, Nielsen), interne Avia-kilder.
- **Personlig: Ide fra ide-banken (tekst eller stemme-transkribert).**
- Manuell: bruker limer inn lenke eller notat.
- Kombinasjon: flere knagger sammen (f.eks. en ide + en fersk rapport).

Ideer fra ide-banken vektes med ekstra tyngde på **autentisitet** i algoritmefilteret, og generatoren bevarer Deniz sin formulering som stilsignal — ikke bare tematikk. Se `docs/18-ide-bank.md`.

---

## 2. Input til generering

```jsonc
{
  "primary_category_id": "...",
  "category_ids": ["...", "..."],
  "hooks": [
    { "id": "...", "title": "...", "summary": "...", "source_type": "rss | idea_bank | report | ...", "url": "...", "idea_content": "(kun hvis source_type=idea_bank)" }
  ],
  "personas_active": ["persona-id-1", "persona-id-2"],
  "user_notes": "Valgfri ekstra kontekst fra bruker",
  "language_mirrors": [
    { "chunk": "...", "topic_tags": ["..."] }
  ],
  "company_profile": { "usps": [ /* relevante USP-er for pain point */ ] },
  "pain_point": "...",
  "algorithm_insights": { /* snitt av relevante punkter fra panelet */ },
  "cta_mode": "none" | "soft" | "direct",
  "requested_count_per_persona": 2
}
```

### Flerkategori-generering
- Brukeren (eller systemet) kan velge 1–3 kategorier pr. post. Én er primær.
- Generatoren vektes mot primærkategoriens `generation_guidance`, men innlemmer vinkler fra de andre.
- **Eksempel:** primær `slik-tenker-vi` + sekundær `vise-suksess` → posten handler om Avias modell og bruker et indirekte suksess-signal som åpner.

### CTA-mode
- `none` — ingen CTA (~50% av postene).
- `soft` — invitasjon til kommentar/DM (~40%).
- `direct` — eksplisitt CTA med lenke (~10%), kun når posten omtaler Avias tilbud direkte.

Systemet foreslår `cta_mode` basert på kategori + knagg + historikk. Brukeren kan overstyre.

---

## 3. Genererings-steg (orkestrering)

### Steg A — Forberedelse
- Valider at minst 1 knagg finnes.
- Valider at minst 1 persona er aktiv.
- Hent persona-kontekst (snippets, do/don't, preferanse-vekter).
- Hent 2–5 språkspeilings-chunks via semantisk søk i LanguageCorpus (topic = kategori + knagg-tags).
- Plukk prompt-mal basert på kategori + persona.

### Steg B — Generator
- Kall LLM med strukturert JSON-kontrakt.
- Be om N forslag, med eksplisitt krav om strukturell variasjon mellom forslagene.
- Ingen forslag over LinkedIn sin maksgrense (3000 tegn, men målstyre mot 1200–1800 for optimal rekkevidde).

### Steg C — Intern kvalitetssjekk
- Regex/regler: avvis forslag som inneholder tankestreker (—, –).
- Regex/regler: avvis forslag som starter med kjente AI-klisjé-fraser (liste vedlikeholdes).
- Avvis forslag som er for korte/lange.
- Avvis hvis don't-regler er brutt.
- Hvis avvist → regenerer én gang til, med feedback til modellen.

### Steg D — Tekstforfatter-agent (valgfritt fordypningsledd)
- Polsk, kutt fett, skjerp åpning.
- Ikke omskriv budskapet — bare stramme.

### Steg E — Algoritmefilter + tuner (siste ledd, se `13-algoritmefilter-tuner.md`)
- LinkedIn-algoritmeekspert-agent scorer hvert forslag på 6 dimensjoner.
- Hvis score ≥ 0.70 → send til bruker som er.
- Hvis 0.25 ≤ score < 0.70 → tuner kjører (ikke-invasive justeringer) → re-score.
- Hvis score < 0.25 → blokker + regenerer.
- Tuner-endringer re-valideres mot hard_rules. Ved brudd: rollback.
- Algoritme-innsikt-panel brukes som referansepunkt i alle scores.

### Steg F — Presenter
- Vis alle N forslag side om side med score og kommentarer.
- Bruker velger, reviderer, godkjenner.
- Valget logges → Event (`suggestion_chosen`) → Persona-trening.

---

## 4. Output

```jsonc
{
  "generation_id": "...",
  "suggestions": [
    {
      "id": "...",
      "persona_id": "...",
      "body": "...",
      "algorithm_score": 0.82,
      "algorithm_notes": "Sterk åpning, svak CTA. Siste linje kan kuttes.",
      "regenerated": false,
      "prompt_version": "2025-04-20.v3",
      "model": "claude-opus-4-6"
    }
  ]
}
```

---

## 5. Revidering

- Bruker kan redigere forslaget direkte i editor.
- Alternativt be om "revider denne" → gå tilbake til Steg D/E med gjeldende tekst som input.
- Alle revisjoner lagres i `post.body_history`.

---

## 6. Avvisningsregler (hard_rules)

Forslaget blir **ikke vist** hvis:
- Det inneholder tankestreker.
- Det starter med en AI-klisjé.
- Det bryter en persona sin hard_rule.
- Det ikke refererer til noen av de oppgitte knaggene.
- Algoritmescore < 0.25 (svært lav).

Forslaget vises med **advarsel** (ikke blokkert) hvis:
- Det bryter en guidance-regel.
- Algoritmescore mellom 0.25–0.70 etter tuning.
