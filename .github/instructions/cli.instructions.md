---
description: "Use when changing the CLI package, parser/format support, or the self-hosted API flow in packages/cli. Covers CLI-specific boundaries, tRPC coupling, and local validation."
applyTo:
  - "packages/cli/src/**/*.ts"
  - "packages/cli/package.json"
  - "packages/cli/tsup.config.ts"
  - "packages/cli/README.md"
---

# CLI

- Trate [packages/cli](packages/cli) como superficie principal deste escopo. Preserve UX de terminal, compatibilidade de flags e o fluxo self-hosted antes de mudar defaults ou comportamento de comandos.
- Mudancas em [packages/cli/src/parsers](packages/cli/src/parsers), [packages/cli/src/presets](packages/cli/src/presets) e [packages/cli/src/commands](packages/cli/src/commands) devem manter compatibilidade de formatos; use [examples](examples) como fixtures de compatibilidade, nao como superficie principal de produto.
- Se alterar [packages/cli/src/utils/api.ts](packages/cli/src/utils/api.ts), confirme que o contrato continua coerente com [apps/web/src/trpc/routers/_app.ts](apps/web/src/trpc/routers/_app.ts), porque o CLI importa `AppRouter` diretamente do web.
- Prefira manter parsing e serializacao isolados por formato em vez de espalhar regra de compatibilidade pelo pacote inteiro.
- Validacoes relevantes: `bun run typecheck`, `bun test` e `bun run build` em `packages/cli`; quando houver mudanca de contrato compartilhado, rode `bun typecheck` na raiz.