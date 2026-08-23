# SPEC-005 — Modos Calma e Clássico

**Status:** Pronto para implementação  
**Camada:** Domain  
**Refs:** PRD §6–7

## Objetivo

Dois perfis de gravidade, lock delay e taxa de relíquia.

## Regras

| Parâmetro | Calma | Clássico |
|---|---|---|
| Tick gravidade nível 1 | 1000 ms | 800 ms |
| Redução por nível | 40 ms | 60 ms |
| Tick mínimo | 400 ms | 120 ms |
| Lock delay | 800 ms | 500 ms |
| Ghost piece | sim | sim |
| Chance de relíquia por peça spawnada | 18% | 8% |
| Máx. relíquias simultâneas no tabuleiro | 3 | 2 |

- Modo escolhido em `StartGame({ mode: "calm" | "classic" })` e não muda no meio da partida.
- Asa de Tempo força o tick de Calma nível 1 enquanto durar, independente do modo.

## Cenários

### Calma mais lenta

- **Given** nova partida Calma nível 1  
- **When** pergunta intervalo de tick  
- **Then** 1000 ms

### Relíquia mais frequente em Calma

- **Given** RNG que retorna 0.10  
- **When** spawn em Calma  
- **Then** peça pode ser marcada relíquia; em Clássico com o mesmo 0.10, não (limiar 0.08)

## Fora de escopo

- Asas Juntas (P1)
