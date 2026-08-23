# ADR-0001 — Plataforma Web PWA, TypeScript, Phaser 3 e Vite

**Status:** Aceito  
**Data:** 2026-08-22  
**Decisores:** Wings Studios

## Contexto

Wing Blocks precisa ser fácil de desenvolver e manter por um estúdio familiar, jogável no celular e no computador sem passar por lojas no primeiro lançamento.

## Decisão

- Plataforma: **navegador + PWA**
- Linguagem: **TypeScript**
- Apresentação: **Phaser 3**
- Bundler: **Vite**
- Testes: **Vitest**
- UI de menus: **Phaser Scenes** (sem React no MVP)

## Alternativas consideradas

| Opção | Motivo da rejeição |
|---|---|
| Godot / GDScript | SDD e Clean Architecture são menos idiomáticos em TS para este time; dois mundos de tooling |
| Unity / C# | Pesado para puzzle 2D e para manutenção familiar |
| React + Canvas cru | Recriar loop, input, áudio e escala |
| Mobile nativo primeiro | Certificados, duas lojas; adiar até o core existir |

## Consequências

- Um link abre o jogo na família; Capacitor pode vir depois.
- O domínio permanece independente do Phaser (ADR-0002).
- PWA e service worker entram no polish do MVP, não no primeiro scaffold mínimo além do `manifest` quando houver ícones.
