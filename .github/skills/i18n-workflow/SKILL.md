---
name: i18n-workflow
description: "Use quando trabalhar em tarefas recorrentes de i18n neste monorepo: validar examples, revisar arquivos de locale, checar impacto entre CLI, SDK e web, revisar parsing de formatos, confirmar impacto em backend/web, e verificar se documentacao ou fixtures de compatibilidade precisam acompanhar a mudanca. Triggers: 'revisar locales', 'validar examples', 'checar impacto de i18n', 'esse formato afeta a CLI?', 'mudanca no parser afeta web?', 'preciso revisar compatibilidade entre formatos'."
---

# i18n Workflow

Use esta skill para mudancas e revisoes recorrentes de internacionalizacao no repositorio Languine, principalmente quando a tarefa cruza formatos, parsing, validacao de locales ou comportamento entre produtos.

## O que ela cobre

- `packages/cli/src`: parsing, leitura e escrita de formatos, fluxos self-hosted e impactos em comandos do usuario.
- `packages/sdk/src`: utilitarios compartilhados e contratos reutilizados por outras superficies.
- `apps/web/src`: dashboard, backend web, tRPC e fluxos que exibem, validam ou processam dados de i18n.
- `examples/**`: fixtures de compatibilidade e cobertura de formatos; nao trate como produto principal e nao faca refactors oportunistas ali.

## Quando usar

Use quando a tarefa parecer com uma destas:

- "validar se um formato novo ou ajustado quebra examples existentes"
- "revisar arquivos de locale e checar impacto no parser"
- "entender se uma mudanca na CLI tambem afeta SDK ou web"
- "confirmar se exemplos e documentacao ainda representam o comportamento suportado"

## Workflow recomendado

1. Localize a superficie primaria da mudanca e a superficie de impacto mais proxima: CLI para parsing e formatos, SDK para logica compartilhada, web para backend/UI.
2. Confirme impactos cruzados antes de editar amplo demais: mudancas em parsing ou contratos podem refletir em `packages/cli`, `packages/sdk` e `apps/web/src/trpc` ou fluxos web.
3. Trate `examples/**` como validacao de compatibilidade. Revise se continuam coerentes com o comportamento esperado, mas evite tratá-los como fonte principal de arquitetura.
4. Rode a menor validacao que cubra a mudanca. A partir da raiz, prefira `bun test`, `bun typecheck`, `bun lint` ou `bun build`. Use `bun build:examples` quando a tarefa exigir validar tambem os fixtures em `examples/**`.
5. Se a mudanca tocar formatos, parsing ou contratos, verifique tambem README ou exemplos relevantes para evitar drift entre implementacao e uso documentado.

## Checks praticos

- Parser/formato mudou: inspecione `packages/cli/src`, confirme se `packages/sdk/src` reutiliza a mesma logica e valide fixtures em `examples/**`.
- Contrato/backend mudou: revise `apps/web/src/trpc` e superficies web relacionadas para garantir coerencia com a CLI.
- Locale ou estrutura de mensagens mudou: cheque arquivos de exemplo afetados e qualquer documentacao de uso que dependa do formato.
- Mudanca aparentemente local: confirme que nao existe acoplamento implícito entre CLI, SDK e web antes de concluir.

## Guardrails do repo

- Use Bun e scripts reais do workspace; evite inventar comandos ou ferramentas.
- Prefira diffs minimos e nao altere `examples/**` sem necessidade direta de compatibilidade ou documentacao.
- Quando houver duvida, valide primeiro a superficie dona do comportamento e depois a superficie consumidora mais proxima.