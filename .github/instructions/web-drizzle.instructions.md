---
description: "Use when changing the web database layer, Drizzle schema, SQL migrations, drizzle.config.ts, or migration scripts. Covers schema-to-migration flow and build-time migration behavior."
applyTo:
  - "apps/web/src/db/**/*.ts"
  - "apps/web/drizzle/**/*.sql"
  - "apps/web/drizzle.config.ts"
  - "apps/web/scripts/**/*.ts"
---

# Web Drizzle

- Este escopo cobre [apps/web/src/db](apps/web/src/db), [apps/web/drizzle](apps/web/drizzle), [apps/web/drizzle.config.ts](apps/web/drizzle.config.ts) e [apps/web/scripts/migrate.ts](apps/web/scripts/migrate.ts).
- Use [apps/web/src/db/schema.ts](apps/web/src/db/schema.ts) como fonte de verdade do schema. Gere migracoes a partir dele; nao trate SQL em [apps/web/drizzle](apps/web/drizzle) como origem primaria.
- Para mudancas estruturais, atualize o schema e entao rode `bun run db:generate` dentro de `apps/web`. Revise o SQL gerado e mantenha schema e migracoes coerentes no mesmo diff.
- Se alterar queries, relacoes ou nomes de colunas/tabelas, confirme que o restante de [apps/web/src/db](apps/web/src/db) continua consistente com o schema atual.
- Tenha cuidado com o build do web: [apps/web/package.json](apps/web/package.json) executa `bun run db:migrate:prod` durante `bun build`, e [apps/web/scripts/migrate.ts](apps/web/scripts/migrate.ts) aplica migracoes quando `DATABASE_URL` estiver definido.
- Preserve a seguranca de execucao repetida do fluxo de migracao e nao introduza passos que dependam implicitamente de ambiente de producao.
- Validacoes relevantes: `bun run typecheck` em `apps/web`; quando houver mudanca estrutural, rode `bun run db:generate` no `apps/web` e confira o SQL/migration resultante antes de finalizar.