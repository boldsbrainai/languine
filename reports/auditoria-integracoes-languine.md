# Auditoria Forense de Integrações Externas do Languine

## Premissa e reancoragem de escopo

O módulo nomeado pelo pedido original, "Construção do Dossiê", não existe neste workspace. Para evitar inferência sem lastro, esta auditoria foi reancorada para a superfície real do repositório Languine, cobrindo apenas integrações externas comprovadas em código, manifesto público e testes.

Fontes principais usadas nesta análise:

- README raiz
- packages/cli/README.md
- action.yml
- apps/web/src/lib/ai.ts
- apps/web/src/workflows/utils/translate.ts
- apps/web/src/db/index.ts
- apps/web/scripts/migrate.ts
- apps/web/src/app/api/translate/route.ts
- apps/web/src/workflows/translate-locale.ts
- apps/web/next.config.ts
- packages/action/src/platforms/github.ts
- apps/web/src/lib/__tests__/ai.test.ts
- apps/web/src/app/api/translate/__tests__/route.test.ts

## Fase 1. Mapeamento 360 das integrações com APIs e serviços de terceiros

| Integração externa | Método e endpoint | Origem exata | Autenticação | Observação forense |
| --- | --- | --- | --- | --- |
| Ollama via provider OpenAI-compatible | Endpoint efetivo abstraído pelo SDK. Base configurada em `OLLAMA_BASE_URL`, default `http://127.0.0.1:11434/v1`. O modelo é obtido por `chatModel(slug)` e consumido por `generateObject(...)`. Na prática, o provider resolve chamadas sobre a base OpenAI-compatible do Ollama. | `apps/web/src/lib/ai.ts` e `apps/web/src/workflows/utils/translate.ts` | `OLLAMA_API_KEY`, injetada no provider. O header exato é abstraído pelo SDK. | Integração real e central do motor de tradução. A evidência de produção está em `getModel()` e no uso por `translateKeys` e `translateDocument`. |
| Neon Serverless via `@neondatabase/serverless` | Endpoint HTTP não é montado manualmente no repositório. Ele é derivado do `DATABASE_URL` quando o hostname contém `neon.tech`; o SDK `neon(url)` resolve o transporte SQL-over-HTTP internamente. | `apps/web/src/db/index.ts` e `apps/web/scripts/migrate.ts` | Credenciais embutidas em `DATABASE_URL`. | Integração real de banco quando o deploy usa Neon. Há distinção explícita entre Neon e Postgres comum. |
| PostgreSQL genérico via `pg` | Protocolo PostgreSQL sobre `DATABASE_URL` para pool e migração. Não é HTTP; o destino é o host/porta definidos na connection string. | `apps/web/src/db/index.ts` e `apps/web/scripts/migrate.ts` | Usuário e senha embutidos em `DATABASE_URL`. | Integração real, hoje suportada em produção e local. Esta superfície não depende de Neon. |
| Vercel Functions `waitUntil` | Sem endpoint HTTP explícito no código. Chamada por SDK/runtime: `waitUntil(createTranslations(...))`. | `apps/web/src/app/api/translate/route.ts` | Implícita ao runtime da plataforma; não há token manual no código. | Integração real com runtime terceiro para persistência assíncrona após a resposta HTTP do endpoint interno. |
| Vercel Workflows / runtime `workflow` | Sem endpoint externo explícito no código. A integração é feita por `withWorkflow(nextConfig)`, `getWritable()` e `getRun(runId).getReadable(...)`. | `apps/web/next.config.ts`, `apps/web/src/workflows/translate-locale.ts` e `apps/web/src/app/api/jobs/[runId]/stream/route.ts` | Implícita ao runtime da plataforma; não há token manual no código. | Integração real para orquestração assíncrona, emissão de progresso e leitura de eventos. |
| GitHub REST API via Octokit | `GET /repos/{owner}/{repo}/pulls?head={owner}:{branch}&state=open`; `POST /repos/{owner}/{repo}/pulls`; `PATCH /repos/{owner}/{repo}/pulls/{pull_number}`; `POST /repos/{owner}/{repo}/issues/{issue_number}/comments` | `packages/action/src/platforms/github.ts` | `GITHUB_TOKEN` passado ao `Octokit({ auth })` | Integração real do GitHub Action para listar, criar, fechar PRs e comentar em PR anterior. |
| GitHub git remote | `git fetch origin {baseBranch}`; `git push -u origin {branch}`; `git push -f origin {branch}`; `git reset --hard origin/{baseBranch}` via binário git | `packages/action/src/platforms/github.ts` | Credenciais herdadas do ambiente GitHub Actions / remote configurado | Não é REST, mas é integração externa concreta com a infraestrutura GitHub do repositório alvo. |

## Fase 2. Matriz de convergência entre código, documentação e stubs

### 2.1 Convergente

| Item | Evidência no código | Evidência documental | Veredito |
| --- | --- | --- | --- |
| Ollama como runtime de IA | `apps/web/src/lib/ai.ts` configura provider OpenAI-compatible com `OLLAMA_BASE_URL`, `OLLAMA_API_KEY` e `AI_MODEL`; `apps/web/src/workflows/utils/translate.ts` usa esse modelo em `generateObject(...)` | README raiz e `packages/cli/README.md` descrevem self-hosted com Ollama | Convergente |
| GitHub Action abrindo PRs no GitHub | `packages/action/src/platforms/github.ts` usa Octokit e comandos git; `packages/action/src/services/translation.ts` executa a CLI com credenciais do deployment | `action.yml` documenta inputs, propósito e uso do Action | Convergente |
| Vercel Workflows/runtime como mecanismo assíncrono | `withWorkflow(nextConfig)`, `getWritable`, `getRun(...).getReadable(...)`, `waitUntil(...)` | README raiz ainda descreve deploy em Vercel e mostra Workflows na arquitetura | Convergente |
| Neon como opção de banco gerenciado | `isNeonDatabaseUrl(...)` direciona para `@neondatabase/serverless` | README raiz menciona Neon/Postgres na arquitetura e no setup | Convergente |

### 2.2 Divergente por omissão

| Item | Evidência no código | Lacuna encontrada | Impacto |
| --- | --- | --- | --- |
| PostgreSQL genérico além de Neon | `apps/web/src/db/index.ts` e `apps/web/scripts/migrate.ts` suportam explicitamente `pg` para qualquer `DATABASE_URL` não-Neon | A documentação principal ainda enfatiza Neon/Vercel Marketplace como caminho dominante e não explicita o suporte operacional a Postgres comum | Operadores podem assumir, incorretamente, que o produto depende de Neon para funcionar |
| Autorização administrativa local do dashboard | A superfície atual usa `LANGUINE_ADMIN_TOKEN` em `apps/web/src/lib/auth.ts` e em `/cli/token` | `packages/cli/README.md` ainda fala em Vercel Deployment Protection como mecanismo de proteção do dashboard | Pode induzir leitura errada sobre a fronteira real de autenticação na versão local/self-hosted atual |
| Runtime Vercel detalhado | O código usa dois pontos distintos de integração: `@vercel/functions` e `workflow` | A documentação descreve a plataforma em alto nível, mas não separa claramente `waitUntil` e Workflows como dependências de runtime distintas | A equipe pode subestimar acoplamento operacional com o runtime Vercel |

### 2.3 Hardcoded, mocks e stubs

| Item | Local | Tipo | Achado |
| --- | --- | --- | --- |
| Provider Ollama/OpenAI-compatible mockado | `apps/web/src/lib/__tests__/ai.test.ts` | Mock de integração externa | O teste intercepta `@ai-sdk/openai-compatible` e substitui a criação do provider por um objeto fake com `chatModel`, sem tráfego real para Ollama |
| Runtime Vercel mockado no endpoint de tradução | `apps/web/src/app/api/translate/__tests__/route.test.ts` | Mock de runtime terceiro | `@vercel/functions` é mockado e `waitUntil` é substituído por uma implementação local inofensiva |
| Persistência e tradução mockadas no endpoint de tradução | `apps/web/src/app/api/translate/__tests__/route.test.ts` | Stubs internos usados para isolar integrações | `@/db/queries/translate`, `@/workflows/utils/translate` e `@/db` são substituídos por doubles locais; o teste não toca banco, workflow nem LLM real |
| URLs legadas em testes de CLI | `packages/cli/src/commands/auth/__tests__/login.test.ts` | Hardcoded de exemplo | Os exemplos continuam usando domínios `*.vercel.app`, mas aqui funcionam apenas como dados estáticos de teste, não como integração ativa |

## Síntese executiva

1. As integrações externas reais e materialmente relevantes deste repositório são: Ollama/OpenAI-compatible, banco relacional via Neon ou Postgres comum, runtime Vercel (`@vercel/functions` e `workflow`) e GitHub via Octokit + git remote.
2. Não há evidência, no código auditado, de gateways ocultos adicionais, provedores de logging externos ou micro-serviços SaaS paralelos além desses blocos.
3. O maior ponto de divergência atual não é uma API clandestina, e sim documentação parcialmente atrasada: o código já suporta Postgres genérico e autenticação administrativa própria, enquanto parte da documentação ainda descreve o fluxo antigo centrado em Vercel/Deployment Protection.
4. Os mocks relevantes estão concentrados em testes unitários bem localizados e não mascaram uma integração externa adicional; eles apenas isolam Ollama, Vercel runtime e persistência para teste rápido.

## Conclusão

Com base apenas em evidência verificável no repositório, não existe o módulo pedido originalmente, nem uma malha oculta de integrações terceiras fora da superfície acima. O estado atual é de convergência funcional com quatro pilares externos reais, algumas omissões documentais e mocks explícitos e localizados em testes.
