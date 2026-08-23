# SPEC-001 — Tabuleiro e spawn

**Status:** Pronto para implementação  
**Camada:** Domain  
**Refs:** PRD §6, ADR-0005

## Objetivo

Definir dimensões do tabuleiro, células, as 7 peças Wings e o spawn no topo.

## Regras

- Largura: 10 colunas (x = 0..9).
- Altura visível: 20 linhas (y = 0 no topo visível … 19 na base).
- Buffer oculto: 2 linhas acima (y = -2, -1) só para spawn; não desenhadas no HUD principal.
- Célula vazia ou ocupada por `pieceId` + flag opcional `relic`.
- Spawn: peça nasce centrada no buffer, origin da matriz 4×4 alinhada para que o bloco “caia” nas colunas 3–6 quando possível.

### Formas (matriz 4×4, `#` = bloco, `.` = vazio) — rotação 0

**Pluma** (I):

```
....
####
....
....
```

**Escudo** (O):

```
....
.##.
.##.
....
```

**Asa** (T):

```
....
.###
..#.
....
```

**Halo** (S):

```
....
..##
.##.
....
```

**Lança** (Z):

```
....
.##.
..##
....
```

**Cruz** (J):

```
....
#...
###.
....
```

**Bloco** (L):

```
....
...#
.###
....
```

IDs de código: `plume` | `shield` | `wing` | `halo` | `lance` | `cross` | `block`.

## Cenários

### Spawn válido

- **Given** tabuleiro vazio  
- **When** spawna Pluma  
- **Then** a peça existe, não colide, jogo continua

### Spawn inválido (game over)

- **Given** as células de spawn estão ocupadas  
- **When** tenta spawn  
- **Then** estado `gameOver`, sem peça ativa

## Fora de escopo

- Rotação e wall kicks (SPEC-002)
- Relíquia (SPEC-004)
