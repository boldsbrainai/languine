# GEMINI.md

## Project Overview

**Languine** is a self-hosted, Vercel-native AI localization platform. It allows developers to automate the translation of their applications using AI models (like GPT-4 or Claude) through a CLI or GitHub Action, while hosting the management dashboard and AI orchestration on their own Vercel account.

### Main Technologies
- **Package Manager:** [Bun](https://bun.sh/)
- **Monorepo Orchestration:** [Turbo](https://turbo.build/)
- **Frontend/API:** [Next.js 16](https://nextjs.org/) (App Router, Node.js runtime)
- **Database:** Postgres with [Drizzle ORM](https://orm.drizzle.team/)
- **Background Jobs:** [Vercel Workflows](https://sdk.vercel.ai/docs/concepts/workflows)
- **AI Integration:** [Vercel AI Gateway](https://sdk.vercel.ai/docs/concepts/ai-gateway) + [AI SDK](https://sdk.vercel.ai/docs)
- **Code Quality:** [Biome](https://biomejs.dev/) (Formatting & Linting)
- **Testing:** Bun test

### Monorepo Structure
- `apps/web`: The main Next.js application, providing the dashboard and tRPC API.
- `packages/cli`: The `languine` CLI tool used by developers to manage translations.
- `packages/sdk`: Core logic shared between the CLI and GitHub Action.
- `packages/action`: The GitHub Action implementation.
- `examples/`: A collection of example configurations for various frameworks and formats (React, Vue, Android, iOS, etc.).

---

## Building and Running

### Prerequisites
- [Bun](https://bun.sh/) installed.
- A Postgres database (e.g., Neon) for the web application.

### Key Commands

#### Root Directory
- **Install Dependencies:** `bun install`
- **Development Mode:** `bun dev` (Runs all apps and packages in parallel)
- **Build All:** `bun build`
- **Run All Tests:** `bun test`
- **Format Code:** `bun format`
- **Lint Code:** `bun lint`
- **Typecheck:** `bun typecheck`

#### Web Application (`apps/web`)
- **Database Generate:** `bun run db:generate` (Generates Drizzle migrations)
- **Database Migrate:** `bun run db:migrate` (Applies migrations to the database)
- **Database Studio:** `bun run db:studio` (GUI for database management)

#### CLI (`packages/cli`)
- **Build CLI:** `bun run build`
- **Development Watch:** `bun run dev`

---

## Development Conventions

### Code Style & Linting
- This project uses **Biome** for both formatting and linting. Do not use Prettier or ESLint.
- Run `bun format` before committing to ensure consistent styling.

### Monorepo Workflow
- Always use `bun` commands from the root to leverage Turbo's caching and parallel execution.
- If you need to target a specific package, use the `--filter` flag: `bun test --filter @languine/web`.

### Database Changes
- All schema changes should be made in `apps/web/src/db/schema.ts`.
- After changing the schema, run `bun run db:generate` in `apps/web` to create a new migration.
- Use `bun run db:migrate` to apply changes locally.

### Communication
- The CLI communicates with the web application via **tRPC**.
- Shared types and API definitions are located in `apps/web/src/trpc`.

### Testing
- Use `bun test` for writing and running tests.
- For bug fixes, always include a reproduction test case.
