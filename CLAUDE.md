# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This repo is a Discord app, built on Cloudflare Workers.

- Discord Developer Docs: https://docs.discord.com/developers/intro
- Discord.js docs: https://discord.js.org/docs

To read these docs, or any other web page, use the `web-fetch` agent (via the Agent tool) rather than fetching pages directly. Put the full URLs and the specific question in the prompt. Ask for a summary, not the raw page.

## Commands

Package manager is pnpm (lockfile: `pnpm-lock.yaml`).

- `pnpm dev` / `pnpm start` — runs `scripts/dev-with-tunnel.mjs`, which starts the named cloudflared tunnel and `wrangler dev` together (local server at http://localhost:8787). Ctrl+C stops both.
- `pnpm dev:local` — `wrangler dev` alone, without the tunnel
- `pnpm deploy` — deploy with `wrangler deploy`
- `pnpm test` — runs Vitest in watch mode; use `npx vitest run` for a single pass
- `npx vitest run test/index.spec.ts` — run one test file
- `npx vitest run -t "responds with Hello World"` — run tests matching a name
- `npx tsc --noEmit` — typecheck (there is no lint script)
- `pnpm cf-typegen` — regenerate `worker-configuration.d.ts` (`wrangler types`)
- `pnpm register` — register the slash commands as global commands (`scripts/register-commands.ts`); reads `DISCORD_APPLICATION_ID` and `DISCORD_TOKEN` from `.dev.vars`. Global changes can take up to an hour to appear.
- `pnpm register:guild` — register the commands for one server (`scripts/register-guild-commands.ts`); also reads `DISCORD_GUILD_ID` from `.dev.vars`. Updates immediately, so use it while developing.

Run `pnpm cf-typegen` after changing bindings in `wrangler.jsonc`; the global `Env` type comes from that generated file. Don't hand-edit it.

## Tunnel (cloudflared)

The dev server is exposed publicly through a named Cloudflare Tunnel called `smolder` (ID `014e6246-7c56-46dd-b216-bc652f8e3017`), routing `smolder.danonienko.dev` to `http://localhost:8787`.

- Binary: `C:\Program Files (x86)\cloudflared\cloudflared.exe`, on the user PATH.
- Config: `C:\Users\Daniel\.cloudflared\config.yml` (ingress rules), with credentials and `cert.pem` in the same folder. Never commit or print those files.
- `pnpm dev` runs `cloudflared tunnel run smolder` alongside `wrangler dev`. The tunnel name can be overridden with the `CLOUDFLARED_TUNNEL` env var.
- The tunnel is not installed as a Windows service, so it only runs while `pnpm dev` is running. Use `cloudflared tunnel ingress validate` to check the config after editing it.

## Architecture

This is a single Cloudflare Worker, currently a scaffold with no bindings configured.

- Entry point is `src/index.ts`, a default export with a `fetch` handler typed as `ExportedHandler<Env>`. It verifies signatures, answers PING, and passes application command interactions (type 2) to `dispatch`.
- Slash commands live in `src/commands/`, one module per command exporting an `ICommand` object (see `src/commands/types.ts`). `src/commands/index.ts` is the registry: to add a command, create its module and add it to `commandList`. Commands receive `{ env, ctx }` per request; don't read `env` at module scope.
- `wrangler.jsonc` is the single source of config. It sets `main` to `src/index.ts`, observability on, and source map upload. Bindings (KV, D1, R2, Durable Objects, etc.) are commented out and must be added there.
- Tests run inside the Workers runtime, not Node. `vitest.config.mts` uses `@cloudflare/vitest-plugin`, which points at `wrangler.jsonc`, so test bindings match the real config. `test/index.spec.ts` shows two styles: calling `worker.fetch` directly with `createExecutionContext`/`waitOnExecutionContext`, and calling through `SELF.fetch`.
- TypeScript: the root `tsconfig.json` covers `src/` only and excludes `test/`. `test/tsconfig.json` extends it and adds the vitest plugin types.

## Cloudflare APIs

Read `AGENTS.md` for the Workers doc links and Local Explorer endpoints (`wrangler dev` exposes a debugging API for inspecting KV, D1, R2, and DO state). Retrieve current Cloudflare docs before writing code that uses Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, Workers AI, or the Agents SDK, since API details and limits change.

## Formatting

Tabs, LF line endings, and final newlines (`.editorconfig`). Prettier: print width 140, single quotes, semicolons, tabs (`.prettierrc`). Prettier is not installed as a dependency; match the style by hand.
