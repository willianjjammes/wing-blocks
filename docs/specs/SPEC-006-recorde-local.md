# SPEC-006 — Persistência de recorde

**Status:** Pronto para implementação  
**Camada:** Application port + Infrastructure  
**Refs:** ADR-0003

## Objetivo

Guardar o melhor score local por modo.

## Regras

- Port: `ScoreRepository { getBest(mode): number; saveIfBest(mode, score): Promise<number> }`
- Adapter MVP: `localStorage` chave `wing-blocks:best:${mode}`
- No game over, `saveIfBest`; HUD mostra best da sessão + persistido.
- Se `localStorage` falhar, recorde só em memória (não quebra a partida).

## Cenários

### Novo recorde

- **Given** best clássico = 1000  
- **When** game over com 1500  
- **Then** storage = 1500, retorno 1500

### Não ultrapassa

- **Given** best = 2000  
- **When** game over 500  
- **Then** storage permanece 2000

## Fora de escopo

- Sync entre devices
- Leaderboard
