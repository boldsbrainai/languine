---
description: "Use when changing action.yml, the public GitHub Action manifest. Covers manifest/runtime coherence, public inputs, and drift prevention."
applyTo:
  - "action.yml"
---

# GitHub Action Manifest

- Trate [action.yml](action.yml) como contrato publico. Mantenha nomes, defaults e descricoes de inputs estaveis, a menos que a mudanca seja intencionalmente breaking.
- Mantenha `runs.using`, `runs.image` e o mapeamento de env coerentes com [packages/action/Dockerfile](packages/action/Dockerfile) e [packages/action/src/index.ts](packages/action/src/index.ts). Se o runtime passar a exigir novos inputs, envs ou outputs, atualize tudo no mesmo diff.
- Evite drift com a implementacao e com a documentacao quando aplicavel, especialmente para `api-key`, `base-url`, `project-id`, `cli-version`, `create-pull-request`, `commit-message`, `pr-title` e `working-directory`.
- Se algum dia a action deixar de ser Docker-based ou passar a expor `main`/outputs, trate isso como mudanca de contrato publico e mantenha o manifesto coerente com [packages/action](packages/action) no mesmo diff.
- Validacoes relevantes: revise [action.yml](action.yml) junto com [packages/action/Dockerfile](packages/action/Dockerfile) e rode `bun run typecheck` em `packages/action` quando a mudanca de manifesto afetar o runtime.