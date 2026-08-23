# ADR-0002 — Clean Architecture: domínio sem Phaser

**Status:** Aceito  
**Data:** 2026-08-22  
**Decisores:** Wings Studios

## Contexto

Regras de tabuleiro, lock, linhas e power-ups precisam ser testáveis e estáveis. Motores de jogo tendem a misturar input, tempo e regras nas scenes.

## Decisão

Dependências apontam **para dentro**:

1. `src/domain` — entidades, value objects, regras puras (sem Phaser, DOM, `localStorage`)
2. `src/application` — casos de uso e ports (interfaces)
3. `src/infrastructure` — adapters (`localStorage`, áudio Phaser)
4. `src/presentation` — scenes, sprites, HUD

Um tick de gravidade é caso de uso; Phaser só consome um snapshot (`BoardViewState`).

Testes de domínio importam **somente** `src/domain` (e helpers de teste).

## Consequências

- Trocar Phaser no futuro não reescreve as regras.
- Custo: adapters e DTOs de view.
- Proibido: `import "phaser"` em `domain` ou `application`.
