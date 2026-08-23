# SPEC-004 — Power-ups

**Status:** Implementado  
**Camada:** Domain  
**Refs:** PRD §7, ADR-0004

## Objetivo

Relíquias no tabuleiro e os 6 poderes, com feedback visual/sonoro e fairness (um ativo).

## Regras

- Célula `relic: true` pode aparecer em peça spawnada segundo taxa do modo (SPEC-005).
- Ao limpar qualquer linha que contenha relíquia, escolhe-se um poder (RNG injetável) e **ativa imediatamente**, cancelando poder anterior se houver (ou rejeita novo se política for “não substitui” — MVP: **substitui** o ativo).
- HUD mostra ícone + tempo restante se aplicável.
- A primeira partida abre uma ajuda com o funcionamento de cada poder; o botão `AJUDA` permite reabri-la.
- A peça-relíquia pulsa em dourado intenso, exibe um aviso de entrada e toca um som próprio.
- Cada ativação produz um evento persistente no snapshot, inclusive para poderes instantâneos, permitindo animação e som distintos.

### Poderes

| Id | Nome | Efeito |
|---|---|---|
| `timeWing` | Asa de Tempo | 8s de gravidade = tick do modo Calma nível 1 |
| `skyShield` | Escudo Celeste | O próximo spawn inválido é ignorado uma vez (peça descartada / re-roll Next); depois o escudo some |
| `halo` | Halo | Remove a linha visível mais baixa que tenha ≥1 bloco e &lt;10 blocos; compacta |
| `gust` | Rajada | Limpa 2×2 no min(x,y) da peça recém-travada. **Sorteio aleatório só no modo Calma** (Sprint 5 / playtest família). Clássico ainda pode receber Rajada via teste/`applyPower`. |
| `plumeSwap` | Troca de Pluma | Se Hold existe, troca ativa ↔ hold **sem** setar `holdUsedThisPiece`. Se Hold vazio, substitui peça ativa por Next[0] e recua a fila |
| `royalStrike` | Golpe Real | Remove automaticamente a linha ou coluna visível com mais blocos. Empates favorecem a linha; linha removida compacta e coluna deixa espaço vazio |

- Relógio de `timeWing` é tempo de jogo (pausa não conta).

## Cenários

### Halo desentope

- **Given** linha 19 com 6 blocos, resto vazio abaixo  
- **When** Halo ativa  
- **Then** linha 19 some, blocos acima descem

### Escudo salva uma vez

- **Given** Escudo ativo e spawn colidiria  
- **When** spawn  
- **Then** não é game over; escudo consome; tenta spawn da próxima peça da fila

### Um poder por vez

- **Given** Asa de Tempo ativa  
- **When** nova relíquia limpa linha  
- **Then** o novo poder substitui a Asa

## Fora de escopo

- Confirmação manual da Rajada
- Poderes P1+
