---
description: "Use when changing apps/web/src/trpc, router contracts, or tRPC client/server wiring in the web app. Covers AppRouter changes, server/client coherence, and CLI impact."
applyTo:
  - "apps/web/src/trpc/**/*.ts"
  - "apps/web/src/trpc/**/*.tsx"
---

# Web tRPC

- Trate [apps/web/src/trpc](apps/web/src/trpc) como contrato do produto web: prefira diffs pequenos e preserve nomes, inputs e outputs quando nao houver necessidade clara de quebra.
- Ao mudar [apps/web/src/trpc/routers/_app.ts](apps/web/src/trpc/routers/_app.ts), verifique o impacto em [packages/cli/src/utils/api.ts](packages/cli/src/utils/api.ts), porque o CLI importa `AppRouter` diretamente do web.
- Mantenha coerencia entre server e client: ajustes em procedures, transformers, tipos inferidos ou query keys devem ser refletidos nos callers de [apps/web/src/trpc/client.tsx](apps/web/src/trpc/client.tsx), [apps/web/src/trpc/server.ts](apps/web/src/trpc/server.ts) e routers afetados.
- Prefira evoluir contratos de forma aditiva. Se precisar remover ou renomear campos/procedures, atualize todos os consumidores no mesmo diff.
- Preserve validacoes e autorizacao perto da procedure. Nao mova regra de permissao para o caller se ela puder continuar no router.
- Validacoes relevantes: rode `bun typecheck` na raiz para cobrir `apps/*` e `packages/*`; quando o contrato afetar fluxos do CLI, valide tambem com `bun test` ou `bun run build` em `packages/cli`.