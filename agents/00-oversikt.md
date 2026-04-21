# Agent-oversikt

Agentene er **roller** — ikke nødvendigvis separate prosesser i starten. Hver rolle er en tydelig lens vi bruker når vi vurderer planen, arkitekturen og (senere) kode og poster.

| # | Agent | Hovedrolle | Når den kjøres |
|---|---|---|---|
| 1 | Software-arkitekt | Helhet, solid bunn, grenser mellom moduler | Alltid ved arkitekturendring |
| 2 | LinkedIn-ekspert | Plattformens praksis, formater, beste rytme | Ved generering og planendringer som påvirker post-format |
| 3 | Norsk tekstforfatter / språkekspert | Tone, rytme, språkspeiling | Ved generering og tone-endringer |
| 4 | Markedsfører | Pain points, leadgen-mekanikk | Ved kategorivalg, kampanjelogikk |
| 5 | LinkedIn-algoritmeekspert (filter) | **Siste ledd** — vurder alt som skal ut | Alltid siste sjekk før visning til bruker og før publisering |
| 6 | LLM-samarbeider | Jobber med (2) om optimal promptstruktur | Ved endringer i generator-prompter |

---

## Felles regler

1. Hver agent svarer alltid med **spørsmål + svaralternativer**, og markerer det anbefalte alternativet.
2. Ingen agent foreslår noe utenfor sin kompetanse.
3. Alle agentene leser først `docs/00-prosjektgrunnlag.md`. Deretter ser de om deres siste innspill fortsatt gjelder.
4. Algoritmefilteret (5) har vetorett: hvis en post eller endring ikke kommer gjennom, blir den ikke publisert / merget.
5. Ingen agent hallusinerer. Hvis fakta mangler, skal agenten spørre, ikke fylle inn.
