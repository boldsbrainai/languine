---
description: "Use when changing apps/web/src/workflows or related async job orchestration in the web app. Covers tRPC/database integration, side effects, retries, and local validation."
applyTo: "apps/web/src/workflows/**/*.ts"
---

# Web Workflows

- Trate [apps/web/src/workflows](apps/web/src/workflows) como camada de orquestracao: mantenha a separacao entre entrada de tRPC, persistencia em banco e execucao assíncrona clara.
- Preserve as diretivas de runtime do workflow (`"use workflow"`) e dos steps (`"use step"`) onde elas delimitam execucao, stream e side effects.
- Quando mudar inputs ou outputs de workflow, atualize no mesmo diff os callers em [apps/web/src/trpc](apps/web/src/trpc), em especial [apps/web/src/trpc/routers/jobs.ts](apps/web/src/trpc/routers/jobs.ts), e qualquer acesso em [apps/web/src/db](apps/web/src/db) dependente desse contrato.
- Preserve idempotencia e efeitos esperados quando o fluxo puder ser reexecutado, retomado ou rodar em paralelo. Evite duplicar escrita em banco, emissao de eventos ou fechamento prematuro de recursos.
- Se um workflow emitir progresso ou usar stream, preserve o contrato de eventos e o fechamento explicito do stream; nao remova writes esperados nem deixe o stream aberto ao final do fluxo.
- Se um workflow acionar jobs assíncronos, progresso ou agregacao de resultados, mantenha efeitos colaterais explicitos e previsiveis; prefira compor etapas pequenas em vez de espalhar regra entre router e workflow.
- Nao esconda falhas importantes. Propague erro com contexto suficiente para o caller decidir retry, exibicao ou compensacao.
- Validacoes relevantes: `bun run typecheck` em `apps/web`; se a mudanca alterar a superficie chamada por routers ou jobs, valide tambem `bun typecheck` na raiz e execute os testes existentes com `bun test` onde houver cobertura util.