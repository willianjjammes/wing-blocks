# ADR-0003 — Sem backend no MVP

**Status:** Aceito  
**Data:** 2026-08-22  
**Decisores:** Wings Studios

## Contexto

O MVP é solo, recorde local, sessão familiar no mesmo aparelho. Backend exigiria auth, hospedagem e operação.

## Decisão

- Sem API, contas, ranking online ou multiplayer em rede no MVP.
- Recorde: `localStorage` via port `ScoreRepository` na application e adapter em infrastructure.

## Consequências

- Recorde não sincroniza entre aparelhos (aceitável no MVP).
- Ranking e contas ficam explicitamente fora de escopo até um ADR posterior.
