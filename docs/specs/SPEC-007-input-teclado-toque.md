# SPEC-007 — Input teclado e toque

**Status:** Pronto para implementação  
**Camada:** Presentation (mapeia para application commands)  
**Refs:** PRD §9

## Objetivo

Mapear controles familiares sem lógica de tabuleiro na scene além de despachar comandos.

## Teclado

| Tecla | Comando |
|---|---|
| ← / → | `move(-1)` / `move(1)` |
| ↓ | `softDrop` (repeat com DAS) |
| Espaço | `hardDrop` |
| Z | `rotate(-1)` |
| X / ↑ | `rotate(1)` |
| C | `hold` |
| Esc / P | `pause` / `resume` |

- DAS: 170 ms delay, ARR: 50 ms (Calma pode usar ARR 80 ms na presentation).

## Toque

- Zona esquerda (~40%): tap = move na direção do lado relativo ao centro da zona, ou swipe horizontal = move.
- Zona direita (~40%): tap = rotate horário.
- Swipe down (qualquer zona de jogo, >40 px): hard drop.
- Botão Hold e Pause no HUD (≥ 48px).
- Não interceptar scroll da página fora do canvas.

## Cenários

### Pause

- **Given** partida rodando  
- **When** Esc  
- **Then** ticks de gravidade e poderes de tempo pausam; input de jogo ignorado até resume

### Toque não vaza para o domínio

- **Given** scene de jogo  
- **When** tap direita  
- **Then** apenas `rotate(1)` no use case; nenhum cálculo de colisão na scene

## Fora de escopo

- Gamepad (P1)
- Remapeamento de teclas (P1)
