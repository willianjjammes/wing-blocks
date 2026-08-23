# ADR-0004 — Power-ups por relíquia em linha

**Status:** Aceito  
**Data:** 2026-08-22  
**Decisores:** Wings Studios

## Contexto

Power-ups precisam ser visíveis e compreensíveis para crianças. Loot aleatório invisível gera frustração (“por que ganhei isso?”).

## Decisão

- Peça ou célula **Relíquia** (dourada) no tabuleiro.
- Ao **limpar uma linha que contém relíquia**, o poder **ativa imediatamente**.
- No máximo **um** poder ativo por vez.
- Modo Calma: maior chance de relíquia; Clássico: menor.
- Conjunto MVP: Asa de Tempo, Escudo Celeste, Halo, Rajada, Troca de Pluma.

Rajada no MVP é automática no lock da peça-relíquia (2×2). Playtest pode restringir a Calma ou exigir confirmação.

## Alternativas rejeitadas

- Coletar ícone solto no chão (mais estados, pior para criança).
- Poder aleatório no HUD sem origem no tabuleiro.

## Consequências

- Specs e testes devem tratar relíquia como célula especial, não só como efeito de UI.
