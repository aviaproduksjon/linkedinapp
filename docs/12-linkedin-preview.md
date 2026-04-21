# LinkedIn-preview-komponent

> Hver post skal vises i et vindu som minner om en LinkedIn-post, for umiddelbart visuelt førsteinntrykk. Dette er en kjernekomponent i UI.

---

## 1. Hvorfor

Poster leses annerledes i en LinkedIn-feed enn i en tekst-editor. Linjeskift, hook, lengde, bilde/karusell-fremtoning — alt vurderes av øyet på 1–2 sekunder før brukeren bestemmer seg. Preview-komponenten lar Deniz (og algoritmefilteret) bedømme posten i sin faktiske visuelle kontekst før den publiseres.

## 2. Hvor i appen

- **Editor-visning:** Preview ved siden av (eller under) redigeringsfeltet.
- **Forslag side om side:** Hvert av de N forslagene har sin egen preview — ikke bare rå tekst.
- **Kalender:** Hover/klikk på en planlagt post åpner mini-preview.

## 3. Hva preview skal vise

- Avatar + navn + "subtitle" (jobbrolle).
- Tidsstempel (planlagt tid eller "Just now").
- Posttekst med LinkedIn sitt linjesplitting og "... se mer"-avkutting etter ~3 linjer.
- Vedlegg:
  - **Bilde:** enkelt bilde eller placeholder/mockup.
  - **Karusell:** flere slides som kan swipes.
  - **Dokument:** PDF-forhåndsvisning.
- Reaksjons- og kommentar-rad (uten tall — bare visuell anker).
- **Kategori-fargebånd** langs ytterkanten (primærkategori sterkest, sekundære som tynne striper), slik at Deniz ser kategori-tilhørighet umiddelbart uten å forlate preview-flaten.

## 4. MVP-tilnærming

- Kun **tekst-modus** er fullt funksjonell i MVP.
- **Bilde og karusell er rigget i data-modellen**, men UI viser mockup/placeholder i MVP-versjonen.
- Genereringslaget produserer:
  - Foreslått bildebeskrivelse (som alt-tekst + brukeren kan erstatte med eget bilde senere).
  - Foreslåtte carousel-slide-titler.
- Når LinkedIn-publisering automatiseres (v1), kan bilde/karusell-opplasting kobles på.

## 5. Datamodell-påvirkning

Nye/endrede felter på `Post`:
- `attachments: Attachment[]` (type: `image` | `document` | `carousel`).
- `attachment_suggestions: jsonb` — AI-forslag til bildebeskrivelse, slide-innhold etc.

Ny entitet `Attachment`:
- id, post_id, type, order, url_or_placeholder, alt_text, metadata.

## 6. Implementasjonsnotater

- Bruk LinkedIn sine faktiske typografiske regler (font-størrelser, linjehøyder) så langt det er praktisk — ingen kopiering av LinkedIn sitt design, bare tilsvarende utseende.
- Responsiv: mobil-preview og desktop-preview side om side er nice-to-have, ikke MVP.
- Mørk/lys modus speiles.

## 7. Tilgjengelighet

- Alt-tekst på bilder er obligatorisk felt.
- Tastaturnavigasjon i preview (tab, pil venstre/høyre for karusell).
