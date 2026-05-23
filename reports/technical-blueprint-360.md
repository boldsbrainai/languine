## Technical Blueprint 360º

### Escopo analisado
A análise foi construída a partir da estrutura real do monorepo, dos manifests e dos arquivos de configuração e runtime mais centrais, com evidência em arquivos como [package.json](../package.json), [README.md](../README.md), [apps/web/package.json](../apps/web/package.json), [apps/web/src/db/schema.ts](../apps/web/src/db/schema.ts), [apps/web/src/trpc/routers/_app.ts](../apps/web/src/trpc/routers/_app.ts) e [action.yml](../action.yml).

## Fase 1: Topografia de Stack e Infraestrutura

### Core Stack

| Área | Evidência | Leitura forense |
| --- | --- | --- |
| Linguagem principal | [package.json](../package.json), [apps/web/package.json](../apps/web/package.json), [packages/cli/package.json](../packages/cli/package.json) | Monorepo TypeScript end-to-end. |
| Frontend | [apps/web/package.json](../apps/web/package.json), [apps/web/src/app/layout.tsx](../apps/web/src/app/layout.tsx), [apps/web/src/app/page.tsx](../apps/web/src/app/page.tsx) | Next.js 16 com App Router, React 19 e Server Components no produto web. |
| Backend HTTP | [apps/web/src/app/api/trpc/[trpc]/route.ts](../apps/web/src/app/api/trpc/%5Btrpc%5D/route.ts), [apps/web/src/app/api/translate/route.ts](../apps/web/src/app/api/translate/route.ts) | O backend está embutido no mesmo app Next.js, expondo tRPC e rotas HTTP nativas do App Router. |
| Orquestração assíncrona | [apps/web/next.config.ts](../apps/web/next.config.ts), [apps/web/src/workflows/translate.ts](../apps/web/src/workflows/translate.ts), [apps/web/src/workflows/translate-locale.ts](../apps/web/src/workflows/translate-locale.ts) | Arquitetura com jobs assíncronos via runtime workflow. |
| Banco de dados | [apps/web/src/db/index.ts](../apps/web/src/db/index.ts), [apps/web/scripts/migrate.ts](../apps/web/scripts/migrate.ts) | PostgreSQL como persistência primária, com suporte dual a Neon serverless e Postgres genérico. |
| IA | [apps/web/src/lib/ai.ts](../apps/web/src/lib/ai.ts), [apps/web/src/workflows/utils/translate.ts](../apps/web/src/workflows/utils/translate.ts) | Tradução via AI SDK 6 com provider OpenAI-compatible apontando para endpoint compatível com Ollama. |
| Consumidores externos | [packages/cli/package.json](../packages/cli/package.json), [packages/sdk/src/index.ts](../packages/sdk/src/index.ts), [packages/action/package.json](../packages/action/package.json) | Três superfícies de consumo: CLI, SDK HTTP simples e GitHub Action. |

### Infraestrutura e Containerização

| Tema | Evidência | Leitura forense |
| --- | --- | --- |
| Deploy principal | [README.md](../README.md), [apps/web/next.config.ts](../apps/web/next.config.ts) | Estratégia principal de deploy é Vercel, com apps/web como root deployável. |
| Containerização | [packages/action/Dockerfile](../packages/action/Dockerfile), [action.yml](../action.yml) | Docker existe apenas para o GitHub Action. O web app não é containerizado no repositório. |
| Banco provisionado | [README.md](../README.md), [apps/web/drizzle.config.ts](../apps/web/drizzle.config.ts) | Fluxo documentado favorece Neon/Postgres via Vercel Marketplace, mas o código aceita qualquer DATABASE_URL Postgres. |
| Runtime Node | [apps/web/src/app/page.tsx](../apps/web/src/app/page.tsx), [apps/web/src/app/api/translate/route.ts](../apps/web/src/app/api/translate/route.ts) | Rotas críticas forçam runtime Node.js. |
| CI/CD interna | [.github/workflows/release-cli.yml](../.github/workflows/release-cli.yml) | Existe workflow de release, mas ele está totalmente comentado, então a automação interna de release está desativada no estado atual. |
| CI/CD para consumidores | [README.md](../README.md), [action.yml](../action.yml), [packages/action/src/services/translation.ts](../packages/action/src/services/translation.ts) | O repositório publica um Action para ser usado em pipelines downstream. |

### Gerenciamento de pacotes, build e qualidade

| Tema | Evidência | Leitura forense |
| --- | --- | --- |
| Package manager | [package.json](../package.json) | Bun é o package manager oficial do monorepo. |
| Monorepo build | [package.json](../package.json) | Turbo coordena build, lint, test e typecheck entre workspaces. |
| Formatação e lint | [package.json](../package.json), [packages/cli/package.json](../packages/cli/package.json), [packages/action/package.json](../packages/action/package.json) | Biome é o padrão de formatação e lint. |
| Build web | [apps/web/package.json](../apps/web/package.json) | O build do web roda migração antes do next build, acoplando schema e deploy. |
| Bundle de packages | [packages/cli/package.json](../packages/cli/package.json), [packages/sdk/package.json](../packages/sdk/package.json) | CLI e SDK são empacotados com tsup. |
| TypeScript policy | [apps/web/next.config.ts](../apps/web/next.config.ts) | O app web ignora erros de TypeScript no build do Next.js. Isso é um sinal arquitetural relevante, não só um detalhe de config. |

## Fase 2: Padrões Arquiteturais e Topologia

### Padrão global

O repositório é um monolito modular orientado a produto, com três extensões operacionais:

- Aplicação web principal em [apps/web](../apps/web)
- Interface de automação para consumo local em [packages/cli](../packages/cli)
- Interface de automação para CI em [packages/action](../packages/action)
- SDK leve para integração programática em [packages/sdk](../packages/sdk)

Não há microserviços independentes no workspace. Também não há um MAS clássico. O elemento mais próximo de arquitetura orientada a eventos está nos workflows assíncronos, onde jobs são iniciados, processam múltiplos idiomas em paralelo e expõem progresso via stream em [apps/web/src/app/api/jobs/[runId]/stream/route.ts](../apps/web/src/app/api/jobs/%5BrunId%5D/stream/route.ts).

### Mapeamento de diretórios e boundaries

| Diretório | Responsabilidade |
| --- | --- |
| [apps/web/src/app](../apps/web/src/app) | Superfície HTTP e UI do produto. Contém páginas App Router e endpoints HTTP. |
| [apps/web/src/components](../apps/web/src/components) | Primitivos de apresentação e blocos de interface. |
| [apps/web/src/db](../apps/web/src/db) | Schema, bootstrap do Drizzle e queries do domínio. |
| [apps/web/src/lib](../apps/web/src/lib) | Serviços transversais como autenticação, provider de IA e helpers utilitários. |
| [apps/web/src/trpc](../apps/web/src/trpc) | Contratos internos, routers, contexto e autorização procedural. |
| [apps/web/src/workflows](../apps/web/src/workflows) | Orquestração assíncrona de tradução, chunking, prompts e persistência. |
| [packages/cli/src](../packages/cli/src) | Cliente operacional que lê arquivos locais, calcula diffs, dispara jobs e escreve arquivos traduzidos. |
| [packages/sdk/src](../packages/sdk/src) | Cliente HTTP mínimo para uso embutido por terceiros. |
| [packages/action/src](../packages/action/src) | Camada de automação GitHub, incluindo integração com Octokit e git. |
| [examples](../examples) | Fixtures e exemplos de formatos suportados, não a superfície primária do produto. |

### Fluxo de controle

#### Fluxo browser para dados
1. O usuário abre a UI em [apps/web/src/app/page.tsx](../apps/web/src/app/page.tsx) ou [apps/web/src/app/cli/token/page.tsx](../apps/web/src/app/cli/token/page.tsx).
2. Componentes client-side usam o provider em [apps/web/src/trpc/client.tsx](../apps/web/src/trpc/client.tsx).
3. A chamada vai para o handler fetch-based em [apps/web/src/app/api/trpc/[trpc]/route.ts](../apps/web/src/app/api/trpc/%5Btrpc%5D/route.ts).
4. O contexto tRPC é montado em [apps/web/src/trpc/init.ts](../apps/web/src/trpc/init.ts), classificando o caller como api-key, owner ou nulo.
5. O router composto em [apps/web/src/trpc/routers/_app.ts](../apps/web/src/trpc/routers/_app.ts) despacha para project, translate ou jobs.
6. A procedure chama queries Drizzle em [apps/web/src/db/queries/project.ts](../apps/web/src/db/queries/project.ts) ou [apps/web/src/db/queries/translate.ts](../apps/web/src/db/queries/translate.ts).
7. O banco é acessado por [apps/web/src/db/index.ts](../apps/web/src/db/index.ts).
8. A resposta volta serializada com superjson e é cacheada por React Query em [apps/web/src/trpc/query-client.ts](../apps/web/src/trpc/query-client.ts).

#### Fluxo CLI para tradução assíncrona
1. A CLI autentica em [packages/cli/src/commands/auth/login.ts](../packages/cli/src/commands/auth/login.ts), abrindo a página de token e validando a chave contra project.list.
2. O comando de tradução em [packages/cli/src/commands/translate.ts](../packages/cli/src/commands/translate.ts) lê os arquivos locais, calcula diffs e chama jobs.startJob.
3. A mutation jobs.startJob em [apps/web/src/trpc/routers/jobs.ts](../apps/web/src/trpc/routers/jobs.ts) inicia o workflow translateProject.
4. O workflow principal em [apps/web/src/workflows/translate.ts](../apps/web/src/workflows/translate.ts) paraleliza por locale.
5. Cada locale é processado por [apps/web/src/workflows/translate-locale.ts](../apps/web/src/workflows/translate-locale.ts), que chama o LLM, persiste traduções e emite progresso.
6. A CLI se inscreve no stream SSE exposto por [apps/web/src/app/api/jobs/[runId]/stream/route.ts](../apps/web/src/app/api/jobs/%5BrunId%5D/stream/route.ts).
7. Quando o stream fecha, a CLI materializa os arquivos de destino no disco local.

## Fase 3: Modelagem de Dados e Persistência

### ORM e query builders

| Ferramenta | Evidência | Papel |
| --- | --- | --- |
| Drizzle ORM | [apps/web/package.json](../apps/web/package.json), [apps/web/src/db/schema.ts](../apps/web/src/db/schema.ts) | ORM principal do web app. |
| drizzle-kit | [apps/web/package.json](../apps/web/package.json), [apps/web/drizzle.config.ts](../apps/web/drizzle.config.ts) | Geração e aplicação de migrações. |
| SQL raw em pontos cirúrgicos | [apps/web/src/db/queries/translate.ts](../apps/web/src/db/queries/translate.ts) | Busca textual e upsert com sql inline. |
| pg | [apps/web/package.json](../apps/web/package.json), [apps/web/src/db/index.ts](../apps/web/src/db/index.ts) | Driver de Postgres convencional. |
| @neondatabase/serverless | [apps/web/package.json](../apps/web/package.json), [apps/web/src/db/index.ts](../apps/web/src/db/index.ts) | Driver Neon serverless quando o host contém neon.tech. |

### Schemas e entidades centrais

| Entidade | Evidência | Responsabilidade |
| --- | --- | --- |
| Project | [apps/web/src/db/schema.ts](../apps/web/src/db/schema.ts) | Unidade principal de configuração de tradução. Guarda nome, slug e políticas linguísticas. |
| Translation | [apps/web/src/db/schema.ts](../apps/web/src/db/schema.ts) | Armazena cada tradução por projeto, chave, idioma alvo e metadados de origem. |

### Atributos de domínio relevantes

#### Project
A tabela projects vai além de CRUD simples. Ela codifica políticas semânticas de tradução:

- translationMemory
- qualityChecks
- contextDetection
- lengthControl
- inclusiveLanguage
- formality
- toneOfVoice
- brandName
- brandVoice
- emotiveIntent
- idioms
- terminology
- domainExpertise

Essa modelagem em [apps/web/src/db/schema.ts](../apps/web/src/db/schema.ts) mostra que o domínio não é apenas “arquivo traduzido”; ele tenta capturar preferência editorial e governança linguística.

#### Translation
A tabela translations em [apps/web/src/db/schema.ts](../apps/web/src/db/schema.ts) guarda:

- sourceFormat
- sourceFile
- sourceType
- sourceLanguage
- targetLanguage
- translationKey
- sourceText
- translatedText
- context
- branch
- commit
- commitLink
- sourceProvider
- commitMessage
- overridden

Isso dá rastreabilidade de CI, branch e override manual.

### Gerenciamento de estado

| Camada | Mecanismo | Evidência |
| --- | --- | --- |
| Frontend | Server Components para leitura inicial + React Query para cache no client | [apps/web/src/app/page.tsx](../apps/web/src/app/page.tsx), [apps/web/src/trpc/query-client.ts](../apps/web/src/trpc/query-client.ts) |
| Estado local de UI | useState pontual em componentes pequenos | [apps/web/src/components/ui/code-block.tsx](../apps/web/src/components/ui/code-block.tsx) |
| Backend síncrono | Estado persistente no banco | [apps/web/src/db/queries/project.ts](../apps/web/src/db/queries/project.ts), [apps/web/src/db/queries/translate.ts](../apps/web/src/db/queries/translate.ts) |
| Backend assíncrono | Estado efêmero e progresso em workflow stream | [apps/web/src/workflows/translate.ts](../apps/web/src/workflows/translate.ts), [apps/web/src/app/api/jobs/[runId]/stream/route.ts](../apps/web/src/app/api/jobs/%5BrunId%5D/stream/route.ts) |
| CLI | Sessão persistida localmente e lock/diff por arquivo | [packages/cli/src/commands/auth/login.ts](../packages/cli/src/commands/auth/login.ts), [packages/cli/src/commands/translate.ts](../packages/cli/src/commands/translate.ts) |

## Fase 4: Hub de Integrações e Superfície de API

### APIs e Gateways

#### Páginas web
| Superfície | Evidência | Papel |
| --- | --- | --- |
| Home | [apps/web/src/app/page.tsx](../apps/web/src/app/page.tsx) | Dashboard inicial, health/status e onboarding. |
| Token admin | [apps/web/src/app/cli/token/page.tsx](../apps/web/src/app/cli/token/page.tsx) | Exposição controlada do token operacional usado por CLI e CI. |

#### HTTP APIs
| Rota | Evidência | Papel |
| --- | --- | --- |
| /api/trpc | [apps/web/src/app/api/trpc/[trpc]/route.ts](../apps/web/src/app/api/trpc/%5Btrpc%5D/route.ts) | Gateway RPC principal do sistema. |
| /api/translate | [apps/web/src/app/api/translate/route.ts](../apps/web/src/app/api/translate/route.ts) | Tradução síncrona simples de um texto ou documento. |
| /api/jobs/[runId]/stream | [apps/web/src/app/api/jobs/[runId]/stream/route.ts](../apps/web/src/app/api/jobs/%5BrunId%5D/stream/route.ts) | Stream SSE de progresso de jobs assíncronos. |

#### Procedures tRPC
| Router | Procedures principais | Evidência |
| --- | --- | --- |
| project | list, getBySlug, create, update, updateSettings, delete | [apps/web/src/trpc/routers/project.ts](../apps/web/src/trpc/routers/project.ts) |
| translate | getTranslationsBySlug, getProjectLocales, getTranslationsByKey, updateTranslations, deleteKeys, getOverriddenTranslations, deleteTranslations | [apps/web/src/trpc/routers/translate.ts](../apps/web/src/trpc/routers/translate.ts) |
| jobs | startJob, startTransformJob | [apps/web/src/trpc/routers/jobs.ts](../apps/web/src/trpc/routers/jobs.ts) |

### Third-Party APIs

| Integração | Evidência | Papel real no sistema |
| --- | --- | --- |
| Vercel runtime | [apps/web/package.json](../apps/web/package.json), [apps/web/src/app/api/translate/route.ts](../apps/web/src/app/api/translate/route.ts), [apps/web/next.config.ts](../apps/web/next.config.ts) | Hospedagem e primitives de runtime. |
| workflow SDK | [apps/web/package.json](../apps/web/package.json), [apps/web/src/workflows/translate.ts](../apps/web/src/workflows/translate.ts) | Orquestração durável e paralela dos jobs. |
| Ollama-compatible endpoint | [apps/web/src/lib/ai.ts](../apps/web/src/lib/ai.ts), [apps/web/src/workflows/utils/translate.ts](../apps/web/src/workflows/utils/translate.ts) | Inferência LLM para tradução. |
| Neon | [apps/web/src/db/index.ts](../apps/web/src/db/index.ts), [apps/web/scripts/migrate.ts](../apps/web/scripts/migrate.ts) | Postgres serverless quando a connection string aponta para Neon. |
| PostgreSQL genérico | [apps/web/src/db/index.ts](../apps/web/src/db/index.ts), [apps/web/scripts/migrate.ts](../apps/web/scripts/migrate.ts) | Persistência padrão fora do cenário Neon. |
| GitHub REST API | [packages/action/src/platforms/github.ts](../packages/action/src/platforms/github.ts) | Criar, fechar e comentar em pull requests via Octokit. |
| Git remoto | [packages/action/src/platforms/github.ts](../packages/action/src/platforms/github.ts) | Push, branch e rebase em workflows automáticos. |
| Browser opener | [packages/cli/src/commands/auth/login.ts](../packages/cli/src/commands/auth/login.ts) | A CLI abre a página de token via aplicativo padrão do sistema operacional. |

Não há evidência, no conjunto analisado, de gateways de pagamento, telemetria analítica, Web3, blockchain, mapas, clima ou observabilidade externa dedicada.

### Autenticação/Autorização

| Mecanismo | Evidência | Leitura forense |
| --- | --- | --- |
| API key compartilhada | [apps/web/src/lib/auth.ts](../apps/web/src/lib/auth.ts), [packages/sdk/src/index.ts](../packages/sdk/src/index.ts), [packages/cli/src/utils/api.ts](../packages/cli/src/utils/api.ts) | O sistema é single-tenant e usa LANGUINE_API_KEY como credencial operacional comum. |
| Owner token | [apps/web/src/lib/auth.ts](../apps/web/src/lib/auth.ts), [apps/web/src/app/cli/token/page.tsx](../apps/web/src/app/cli/token/page.tsx) | Rotas owner-only aceitam bearer token ou header dedicado. |
| Contexto tRPC | [apps/web/src/trpc/init.ts](../apps/web/src/trpc/init.ts) | O caller é classificado como api-key, owner ou null. |
| Controle por projeto | [apps/web/src/trpc/permissions/project.ts](../apps/web/src/trpc/permissions/project.ts) | Middleware só valida existência do projeto; não existe RBAC multi-tenant fino. |
| Bypass local | [apps/web/src/lib/auth.ts](../apps/web/src/lib/auth.ts) | Em desenvolvimento local, owner access é permissivo por host localhost. |

Conclusão de segurança: há autenticação por segredo compartilhado, mas não há JWT, OAuth, sessão de usuário, RBAC granular nem modelo multi-tenant forte.

## Fase 5: UI/UX e Design System Engine

### Bibliotecas de Componentes

| Camada | Evidência | Leitura forense |
| --- | --- | --- |
| Tailwind CSS v4 | [apps/web/package.json](../apps/web/package.json), [apps/web/src/app/globals.css](../apps/web/src/app/globals.css) | Tailwind é a base de styling. |
| Primitivos estilo shadcn | [apps/web/src/components/ui/card.tsx](../apps/web/src/components/ui/card.tsx), [apps/web/src/components/ui/code-block.tsx](../apps/web/src/components/ui/code-block.tsx) | Componentes seguem o padrão utilitário e minimalista típico de shadcn, embora não exista prova de scaffold oficial. |
| Radix UI | [apps/web/package.json](../apps/web/package.json) | Uso de primitives Radix para composição de UI. |
| Lucide | [apps/web/package.json](../apps/web/package.json), [apps/web/src/components/ui/code-block.tsx](../apps/web/src/components/ui/code-block.tsx) | Ícones lineares e utilitários. |
| Geist fonts | [apps/web/src/app/layout.tsx](../apps/web/src/app/layout.tsx) | Tipografia carregada com next/font. |
| React Hook Form | [apps/web/package.json](../apps/web/package.json) | Stack preparada para formulários, embora a amostra lida mostre pouco uso direto. |
| next-themes | [apps/web/package.json](../apps/web/package.json) | Dependência instalada, mas o layout atual força dark mode diretamente. |

### Filosofia de Design

A evidência aponta para um painel operacional minimalista e dark-first:

- O html raiz já nasce com classe dark em [apps/web/src/app/layout.tsx](../apps/web/src/app/layout.tsx)
- O arquivo [apps/web/src/app/globals.css](../apps/web/src/app/globals.css) fixa color-scheme dark e tokens escuros
- A UI prioriza leitura operacional, snippets copiáveis e checklist de ambiente em [apps/web/src/app/page.tsx](../apps/web/src/app/page.tsx)
- O componente [apps/web/src/components/ui/code-block.tsx](../apps/web/src/components/ui/code-block.tsx) reforça a natureza de control plane orientado a desenvolvedor

Não há evidência de:

- mobile-first elaborado
- dashboard de alta densidade analítica
- telemetria visual
- design system corporativo extenso
- tema claro funcional na superfície principal

A filosofia real é: painel de bootstrap e operação para desenvolvedor, não produto visualmente sofisticado.

## Avaliação de Débito Técnico / Riscos Arquiteturais

### Riscos principais

| Risco | Evidência | Impacto potencial |
| --- | --- | --- |
| Build aceita erros de TypeScript | [apps/web/next.config.ts](../apps/web/next.config.ts) | Regressões podem chegar ao deploy sem bloqueio do compilador do framework. |
| Migração acoplada ao build | [apps/web/package.json](../apps/web/package.json), [apps/web/scripts/migrate.ts](../apps/web/scripts/migrate.ts) | Deploy e schema change ficam fortemente acoplados; falha de banco derruba build. |
| Segurança single-secret | [apps/web/src/lib/auth.ts](../apps/web/src/lib/auth.ts) | Um único segredo governa CLI, SDK e Action. Não há isolamento por usuário, projeto ou escopo. |
| Autorização por existência, não por posse | [apps/web/src/trpc/permissions/project.ts](../apps/web/src/trpc/permissions/project.ts) | Em modelo multi-tenant futuro, a camada atual não impediria acesso cruzado entre projetos. |
| Bypass local de owner | [apps/web/src/lib/auth.ts](../apps/web/src/lib/auth.ts) | Conveniente para DX, mas perigoso se ambientes locais forem expostos ou tunelados sem cuidado. |
| Documentação mais opinativa que o runtime real | [README.md](../README.md), [apps/web/src/db/index.ts](../apps/web/src/db/index.ts) | O código já suporta Postgres genérico, mas a documentação continua fortemente centrada em Vercel + Neon, o que mascara alternativas operacionais. |
| Release pipeline interna desativada | [.github/workflows/release-cli.yml](../.github/workflows/release-cli.yml) | O processo de release existe como esqueleto, mas está comentado; isso sugere governança de release incompleta ou manual. |
| Tema e dependências de UI parcialmente desalinhados | [apps/web/package.json](../apps/web/package.json), [apps/web/src/app/layout.tsx](../apps/web/src/app/layout.tsx) | Há dependências como next-themes, mas a UI atual força dark mode; isso indica superfície de design em transição ou dependência sobrando. |

### Leitura arquitetural final

O repositório está bem posicionado como plataforma única de localização self-hosted para times técnicos: um monolito web com backend embutido, workflows assíncronos, persistência relacional e três canais de consumo externos. A arquitetura é simples e eficiente para o estágio atual, mas ainda carrega decisões de conveniência que viram risco em escala: segredo compartilhado único, autorização sem tenancy real, build tolerante a erro de tipos e acoplamento forte entre deploy e migração.
