# ADR 003 — Vercel + Supabase + Railway som kjøreplattform

**Dato:** 2026-04-20
**Status:** vedtatt (DNS-eierskap venter — se arkitekt-review-01 §3.5)

## Kontekst
Trenger frontend, DB og en worker for jobbhåndtering.

## Alternativer
- A. Vercel + Supabase + Railway
- B. Fly.io (alt samlet)
- C. Selv-hostet VPS

## Valg
A — Vercel (Next.js-app), Supabase (DB/auth/storage/pgvector), Railway (worker med BullMQ/Redis).

## Konsekvenser
- Deploy-mål: `linkedin.avialab.no`.
- CNAME må settes opp — eierskap bekreftes i agent-review-02 O3.
- Miljøer: `dev` (lokalt), `staging` (Vercel preview), `prod`.
