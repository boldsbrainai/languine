# AGENTS.md

Instrucoes canonicas para agentes de IA neste repositorio.

## Escopo do monorepo

- `apps/web`: produto principal. App Next.js 16 com App Router, tRPC, Drizzle e workflows.
- `packages/cli`: CLI publicada como `languine`.
- `packages/sdk`: logica compartilhada.
- `packages/action`: GitHub Action.
- `examples/`: exemplos e fixtures para formatos e frameworks. Nao trate como superficie primaria de produto.

Use o [README.md](README.md), o [package.json](package.json) da raiz e os manifests de cada workspace como fonte de verdade para setup e scripts.

## Fluxo de trabalho esperado

- Use Bun como package manager. O repositorio declara `bun@1.1.42` na raiz.
- Rode comandos pela raiz quando a mudanca atingir produto ou varios workspaces; isso preserva o fluxo com Turbo.
- Prefira diffs minimos. Nao refatore exemplos ou workspaces adjacentes sem necessidade direta.
- Nao altere `examples/` a menos que a tarefa seja explicitamente sobre exemplos, compatibilidade de formatos ou documentacao deles.

## Comandos principais

Na raiz:

- `bun install`
- `bun dev`
- `bun build`
- `bun test`
- `bun lint`
- `bun typecheck`
- `bun format`
- `bun build:examples` quando a tarefa exigir validar tambem `examples/`

No `apps/web`:

- `bun dev`
- `bun build`
- `bun test`
- `bun typecheck`
- `bun run db:generate`
- `bun run db:migrate`
- `bun run db:push`
- `bun run db:studio`

Nos packages:

- `packages/cli`: `bun run build`, `bun run dev`, `bun test`
- `packages/sdk`: `bun run build`
- `packages/action`: normalmente validar com `bun run typecheck` e `bun run lint`

## Boundaries por area

- `apps/web/src/app`, `apps/web/src/components`, `apps/web/src/lib`: UI e comportamento do dashboard.
- `apps/web/src/trpc`: contratos e rotas entre frontend, CLI e backend. Mudancas aqui podem afetar `packages/cli`.
- `apps/web/src/db` e `apps/web/drizzle`: schema, queries e migracoes. Mantenha schema e migracoes coerentes.
- `packages/cli/src`: parsing de arquivos, comandos, integracao com o backend self-hosted.
- `packages/sdk/src`: utilitarios compartilhados; mantenha APIs pequenas e estaveis.
- `packages/action/src`: integracao GitHub Action; evite assumir comportamento do CLI sem verificar.
- `examples/**`: material de referencia e compatibilidade. Mude somente quando a tarefa pedir cobertura de exemplo.

## Convencoes do projeto

- Ferramentas: Bun + Turbo + Biome. Nao introduza Prettier ou ESLint paralelos.
- O produto web usa Next.js 16, tRPC e Drizzle. Siga os padroes existentes antes de criar novas abstractions.
- O root `build`, `test`, `lint` e `typecheck` filtram `apps/*` e `packages/*`; eles nao cobrem `examples/*` por padrao.
- Se precisar validar uma area especifica, prefira o menor comando que cubra a mudanca.

## Pitfalls uteis

- `apps/web` executa `db:migrate:prod` durante `bun build`; builds do web dependem de ambiente e banco configurados.
- Para mudancas de banco no web, atualize o schema e gere migracao a partir de `apps/web/src/db/schema.ts` com `bun run db:generate` em `apps/web`.
- `examples/` podem parecer workspaces normais, mas servem mais como fixtures de integracao. Evite "arrumar" exemplos em tarefas de produto.
- Mudancas em `apps/web/src/trpc` costumam ter impacto em `packages/cli`, porque o CLI consome o backend via tRPC.

## Referencias

- [README.md](README.md)
- [package.json](package.json)
- [apps/web/package.json](apps/web/package.json)
- [packages/cli/package.json](packages/cli/package.json)
- [packages/sdk/package.json](packages/sdk/package.json)
- [packages/action/package.json](packages/action/package.json)
