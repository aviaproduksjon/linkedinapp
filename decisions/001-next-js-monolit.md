# ADR 001 — Next.js monolitt som app-rammeverk

**Dato:** 2026-04-20
**Status:** vedtatt

## Kontekst
Trenger både frontend og backend i én sammenhengende single-page-app. Deniz er én utvikler, vi vil ha raskt fra plan til verdi.

## Alternativer
- A. Next.js (App Router) + TypeScript monolitt
- B. FastAPI + SvelteKit (separat)
- C. Remix + Node/Fastify

## Valg
A — Next.js (App Router) + TypeScript.

## Konsekvenser
- Node-økosystemet er valgt implisitt.
- API-route handlers for backend-logikk.
- Tunge/langvarige jobber (scheduler, LLM-kall som kan ta tid) flyttes til separat worker.
- Lett å deploye på Vercel.
