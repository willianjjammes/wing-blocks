# SPEC-002 — Movimento, rotação e lock

**Status:** Pronto para implementação  
**Camada:** Domain + Application  
**Refs:** PRD §6

## Objetivo

Mover, girar (SRS-lite) e travar a peça ativa.

## Regras

- Movimento horizontal: ±1 coluna se todas as células destino estão livres e dentro de 0..9.
- Soft drop: +1 linha se livre; senão inicia lock.
- Hard drop: desce até a última linha válida e lock imediato.
- Rotação: 0, 90, 180, 270. Tentar posição + wall kicks básicos: (0,0), (-1,0), (1,0), (0,-1), (-1,-1), (1,-1). Primeiro kick válido ganha; senão rotação recusada.
- Escudo (O) não muda geometria ao girar (no-op visual, estado de rotação pode avançar).
- Lock: peça vira células estáticas; dispara limpeza (SPEC-003).
- Hold: troca peça ativa com hold; se hold vazio, puxa Next. Não pode Hold duas vezes seguidas na mesma peça (flag `holdUsedThisPiece`).

## Cenários

### Move bloqueado pela parede

- **Given** Pluma encostada em x=0  
- **When** move esquerda  
- **Then** posição inalterada

### Hard drop

- **Given** tabuleiro vazio, peça no spawn  
- **When** hard drop  
- **Then** peça locked na base, nova peça spawna (ou game over)

### Rotação com kick

- **Given** Asa junto à parede direita onde rotação crua colide  
- **When** gira  
- **Then** kick aplica e peça não atravessa parede

## Fora de escopo

- DAS/ARR de teclado (SPEC-007)
- Power-ups (SPEC-004)
