# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This repo is a Discord app, built on Cloudflare Workers.

- Discord Developer Docs: https://docs.discord.com/developers/intro
- Discord.js docs: https://discord.js.org/docs

To read these docs, or any other web page, use the `web-fetch` agent (via the Agent tool) rather than fetching pages directly. Put the full URLs and the specific question in the prompt. Ask for a summary, not the raw page.

## Commands

Package manager is pnpm (lockfile: `pnpm-lock.yaml`).

- `pnpm dev` / `pnpm start` — local dev server (`wrangler dev`), default http://localhost:8787
- `pnpm deploy` — deploy with `wrangler deploy`
- `pnpm test` — runs Vitest in watch mode; use `npx vitest run` for a single pass
- `npx vitest run test/index.spec.ts` — run one test file
- `npx vitest run -t "responds with Hello World"` — run tests matching a name
- `npx tsc --noEmit` — typecheck (there is no lint script)
- `pnpm cf-typegen` — regenerate `worker-configuration.d.ts` (`wrangler types`)

Run `pnpm cf-typegen` after changing bindings in `wrangler.jsonc`; the global `Env` type comes from that generated file. Don't hand-edit it.

## Architecture

This is a single Cloudflare Worker, currently a scaffold with no bindings configured.

- Entry point is `src/index.ts`, a default export with a `fetch` handler typed as `ExportedHandler<Env>`.
- `wrangler.jsonc` is the single source of config. It sets `main` to `src/index.ts`, observability on, and source map upload. Bindings (KV, D1, R2, Durable Objects, etc.) are commented out and must be added there.
- Tests run inside the Workers runtime, not Node. `vitest.config.mts` uses `@cloudflare/vitest-plugin`, which points at `wrangler.jsonc`, so test bindings match the real config. `test/index.spec.ts` shows two styles: calling `worker.fetch` directly with `createExecutionContext`/`waitOnExecutionContext`, and calling through `SELF.fetch`.
- TypeScript: the root `tsconfig.json` covers `src/` only and excludes `test/`. `test/tsconfig.json` extends it and adds the vitest plugin types.

## Cloudflare APIs

Read `AGENTS.md` for the Workers doc links and Local Explorer endpoints (`wrangler dev` exposes a debugging API for inspecting KV, D1, R2, and DO state). Retrieve current Cloudflare docs before writing code that uses Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, Workers AI, or the Agents SDK, since API details and limits change.

## Formatting

Tabs, LF line endings, and final newlines (`.editorconfig`). Prettier: print width 140, single quotes, semicolons, tabs (`.prettierrc`). Prettier is not installed as a dependency; match the style by hand.
