# Forbrukspanel (AI-kostnad)

> Lite, alltid-synlig panel som viser månedlig forbruk og estimert kostnad for AI-kall. Helt eksplisitt kontroll over pengebruk.

---

## 1. Hva panelet viser

- **Denne måneden:** totalt brukt (tokens) + estimert kost i kr.
- **Budsjetttak:** prosent brukt (progress bar).
- **Per-modell-fordeling:** Opus / Sonnet / Haiku med hver sine tall.
- **Per-modul:** Generator / Tuner / Filter / Evaluator.
- **Varsling:** gul ved 80%, rød ved 100%.

## 2. Hvor i UI

Nederst i venstre sidebar, lite og diskret. Klikk åpner en større detaljvisning.

## 3. Budsjett-håndtering

- Sett månedlig tak i innstillinger (default: 500 kr/mnd).
- Ved 80%: varsel i UI.
- Ved 100%: generering nekter nye forslag, bare revidering av eksisterende er tillatt. (Krever eksplisitt override for å fortsette.)

## 4. Datamodell

### `AIUsage`
| Felt | Type | Beskrivelse |
|---|---|---|
| id | uuid | |
| timestamp | ts | |
| model | string | `claude-opus-4-6`, `claude-sonnet-4-6`, osv |
| module | enum | `generator`, `tuner`, `filter`, `evaluator`, `research` |
| input_tokens | int | |
| output_tokens | int | |
| cost_cents | int | Estimert kost i øre (unngå float) |
| ref_type | string | `suggestion`, `post`, `insight`, ... |
| ref_id | uuid | |

### `BudgetSetting`
| Felt | Type |
|---|---|
| monthly_cap_cents | int |
| warn_at_percent | int (default 80) |
| hard_stop_at_percent | int (default 100) |

## 5. Beregning

Kostnadsestimater hardkodes per modell (oppdateres i konfig). Kostnad = (input × input_pris) + (output × output_pris). Kr-beløp = øre / 100.

## 6. Observability

- Alle AI-kall logges med module + tokens + model.
- Rapport-endepunkt: månedlig CSV-eksport.
- Integrert med `Event`-tabellen for å kunne krysskjøre kostnad med effekt.

## 7. Risikohåndtering

- **Rate-limit:** Maks N kall per minutt per modul, for å unngå runaway-kostnad ved feil.
- **Circuit-breaker:** Hvis en enkelt generering forbruker uvanlig mye, stopp og varsle.
- **Tørr-kjøring:** Alle AI-kall kan slås av med én flagg for dev/test.
