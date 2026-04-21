# ADR 021 — Kategori 4 "Vise suksess" + mange-til-mange kategorimodell

**Dato:** 2026-04-20
**Status:** vedtatt

## Kontekst
Under arkitekt-review fanget Deniz opp en kategori som manglet — poster som signaliserer suksess (direkte eller indirekte) uten å bli skryteaktige. Samtidig ble det klart at poster ofte naturlig passer i flere kategorier.

## Valg

### 1. Ny kategori: "Vise suksess" (`vise-suksess`)
Med to subtyper:
- Direkte suksess (lansering, milepæl, tall)
- Indirekte suksess (sidebemerkning som signal — sterkest)

### 2. Mange-til-mange mellom Post og Category
- `Post.primary_category_id` styrer fargekode og sortering.
- `Post.categories[]` (via `post_categories`-tabell) inneholder alle kategorier posten berører.
- Maks 3 kategorier pr. post.

### 3. UI
- Primærkategori = hovedfarge / fargebånd i preview.
- Sekundære = små tags eller tynne striper.

## Alternativer vurdert og forkastet
- Én-til-mange (streng): for rigid, speiler ikke hvordan poster faktisk oppfører seg.
- Kun tags uten primær: mister visuell klarhet i kalender og oversikt.

## Konsekvenser
- Generatoren får flere `category_ids` + én `primary_category_id` som input.
- Algoritmefilteret vekter mot primær, men ser på alle.
- Datamodell og generering oppdatert (docs/03, 05, 07, 12).
- Initielle farger foreslått — kan justeres når UI tar form.
