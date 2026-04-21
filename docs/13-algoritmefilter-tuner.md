# Algoritmefilter + tuner (utvidet rolle)

> Tidligere ren filter-rolle. Nå også en **forsiktig tuner** som justerer mindre ting for å optimalisere for algoritmen — uten å endre budskap, tone eller bryte noen av personas hard_rules.

---

## 1. Hvorfor utvidet rolle

Ren filter-rolle blokkerer eller slipper gjennom. Det er sløsing å kaste ut en god post som mangler 5% finpuss på hook eller rytme. En tuner kan hente inn de 5% — hvis vi er svært disiplinerte med hva den får gjøre.

---

## 2. Flyt med tuner

```
Generator
  │
  ▼
Tekstforfatter-agent (språkpuss, ikke budskap)
  │
  ▼
Algoritme-score (pre-tuning)
  │
  ├── Score ≥ 0.7         → Send til bruker uten tuning
  ├── 0.25 ≤ Score < 0.7  → Tuner kjører → re-score → send til bruker
  └── Score < 0.25        → Blokker + regenerer
```

---

## 3. Hva tuneren FÅR gjøre

- Justere linjeskift og avsnittsinndeling.
- Bytte ut enkeltord for rytme (aldri mer enn 3 ord per post).
- Omrokere de første 2 linjene for sterkere hook (uten å endre mening).
- Legge til/fjerne emoji i balansert mengde (maks 1–2 i hele posten).
- Stramme eller løsne lengde ±10%.

## 4. Hva tuneren IKKE får gjøre

- Endre budskap eller tese.
- Endre innhold i referanser/fakta.
- Innføre AI-klisjéer eller tungt åpningsspråk.
- Bryte persona sine hard_rules (tankestreker, pretensiøs tone, osv).
- Legge til direkte CTA som ikke allerede var der.

## 5. Re-validering etter tuning

Etter tuner-steget kjøres en strict-sjekk:
- Tankestreker? → automatisk rollback.
- Lengde utenfor ±10%? → rollback.
- Hard_rule-brudd? → rollback.

Hvis rollback utløses, vises pre-tuning-versjonen med en note om at tuneren ble avvist.

## 6. Sporbarhet

Hver tuning lagres som:
```
{
  "suggestion_id": "...",
  "pre_tuning_body": "...",
  "post_tuning_body": "...",
  "tuner_changes": ["reflow_paragraphs", "shortened_hook"],
  "pre_score": 0.55,
  "post_score": 0.72,
  "accepted": true | false
}
```

Deniz kan alltid se og rulle tilbake per post.

## 7. Modellvalg

- Tuneren bør bruke en **raskere, billigere modell** (Sonnet/Haiku) med snever instruks.
- Dette holder kostnaden nede og gir forutsigbar oppførsel.

## 8. Terskler (justerbare)

- Blokker-grense: **0.25**
- Tuner-trigger: **0.25–0.70**
- "Godt nok"-grense: **0.70**
- Ideal: **0.85+**

Alle terskler lagres i DB, ikke hardkodet.

## 9. Hva algoritmefilteret fortsatt gjør som før

- Scoring på alle 6 dimensjoner (hook, rytme, commentability, risiko, relevans, autentisitet).
- Kort begrunnet feedback.
- Vetorett ved kritisk lav score.
