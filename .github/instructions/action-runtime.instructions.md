---
description: "Use when changing the GitHub Action runtime in packages/action, including the Docker action entrypoint and runtime wiring. Covers runtime constraints, action.yml alignment, and local validation."
applyTo:
  - "packages/action/src/**/*.ts"
  - "packages/action/package.json"
  - "packages/action/Dockerfile"
---

# Action Runtime

- Este escopo cobre [packages/action/src](packages/action/src) e [packages/action/Dockerfile](packages/action/Dockerfile). Trate o runtime da action como execucao nao interativa e orientada a CI.
- Mantenha o comportamento alinhado com [action.yml](action.yml): nomes de env, expectativas de entrada e fluxo de execucao do runtime devem continuar coerentes no mesmo diff.
- Respeite os limites do container atual: o Dockerfile copia apenas arquivos de [packages/action](packages/action), instala dependencias desse pacote e executa [packages/action/src/index.ts](packages/action/src/index.ts). Nao introduza dependencia implícita de workspaces, root lockfile ou arquivos fora desse contexto.
- Ao mudar o fluxo em [packages/action/src/index.ts](packages/action/src/index.ts), preserve o comportamento de erro explicito e a compatibilidade com checkout de repositorio e working directory fornecidos pelo GitHub Actions.
- Validacoes relevantes: `bun run typecheck` e `bun run lint` em `packages/action`; quando houver mudanca de runtime, revise tambem o build path e o `ENTRYPOINT` em [packages/action/Dockerfile](packages/action/Dockerfile).