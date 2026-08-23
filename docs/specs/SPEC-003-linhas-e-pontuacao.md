# SPEC-003 — Limpeza de linhas e pontuação

**Status:** Pronto para implementação  
**Camada:** Domain  
**Refs:** PRD §6

## Objetivo

Detectar linhas cheias, compactar o tabuleiro, pontuar e subir de nível.

## Regras

- Linha cheia: 10 células ocupadas (relíquia conta como ocupada).
- Várias linhas no mesmo lock: todas removidas; blocos acima descem o número de buracos.
- Pontos (antes de multiplicador de nível): 1 linha = 100, 2 = 300, 3 = 500, 4 = 800 (**Asa Quádrupla**).
- Multiplicador: `score += base * level` (level começa em 1).
- Soft drop: +1 ponto por célula descida; hard drop: +2 por célula (opcional MVP: incluir).
- Nível: a cada 10 linhas acumuladas na partida, `level += 1`.
- Gravidade: intervalo de tick diminui com o nível (valores em SPEC-005).

## Cenários

### Uma linha

- **Given** linha 19 completa após lock  
- **When** resolve linhas  
- **Then** linha some, score += 100 * level, lines += 1

### Quatro linhas

- **Given** quatro linhas completas no mesmo lock  
- **When** resolve  
- **Then** score usa 800 * level, UI pode mostrar “Asa Quádrupla”

### Compactação

- **Given** linha do meio completa, linhas acima com blocos  
- **When** limpa  
- **Then** blocos acima descem exatamente uma linha, sem buraco fantasma

## Fora de escopo

- Recorde persistido (SPEC-006)
- Ativação de poder (SPEC-004) — mas limpar linha com relíquia **notifica** o motor de poderes
