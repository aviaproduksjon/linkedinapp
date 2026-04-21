# ADR 002 — Supabase (Postgres + Auth + Storage + pgvector)

**Dato:** 2026-04-20
**Status:** vedtatt

## Kontekst
Trenger DB, auth, filstorage og vektorindeks. Vil ikke integrere fire separate tjenester i MVP.

## Alternativer
- A. Supabase (alt samlet)
- B. Selv-hostet Postgres + Auth.js + S3 + Qdrant
- C. SQLite i MVP, migrere senere

## Valg
A — Supabase.

## Konsekvenser
- Auth via Supabase (magic link).
- pgvector for språkspeiling og semantisk søk.
- Storage for bilder/dokumenter/karusell-slides.
- Multi-user-scoping bygges inn fra dag én (A5).
- Kostnad: fri tier holder for MVP.
