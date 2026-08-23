# Wing Blocks

Puzzle de blocos em queda da **Wings Studios**. Documento de produto: [docs/prd/PRD-wing-blocks-v0.1.md](docs/prd/PRD-wing-blocks-v0.1.md).

## Stack

TypeScript, Vite, Phaser 3, Vitest. Regras em `src/domain` (sem Phaser). Decisões em `docs/adr/`. Specs em `docs/specs/`.

## Comandos

```bash
npm install
npm start
npm test
```

`npm start` inicia o servidor local e abre o jogo no navegador. No macOS, também é possível dar duplo clique em `Abrir Wing Blocks.command`.

> O `index.html` da raiz é a entrada do Vite e não funciona por duplo clique (`file://`). Use um dos métodos acima; a própria página mostra este diagnóstico caso seja aberta diretamente.

Sprints: [docs/sprints/plano-sprints-mvp.md](docs/sprints/plano-sprints-mvp.md). Playtest família: [docs/sprints/sprint-5-playtest.md](docs/sprints/sprint-5-playtest.md).
