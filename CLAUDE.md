# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Fork topology — read before committing anything

This clone is a **fork of `getcompanion-ai/feynman`**, not a standalone repo. The branching model is load-bearing and determines where edits may land:

- `origin` → `git@github.com:peer0/feynman.git` (the user's fork; push target)
- `upstream` → `https://github.com/getcompanion-ai/feynman.git` (read-only)
- `main` — pristine mirror of `upstream/main`. **Never commit here directly.** Pulls are `--ff-only`.
- `my-tweaks` — long-lived branch carrying all local customizations. **All new work lands here** and gets rebased onto fresh `main` when upstream advances.

Practical consequences:

- Before suggesting `git commit`, confirm the current branch. If it's `main`, stop and switch to `my-tweaks`.
- Patches that fix genuine upstream bugs (e.g. the `dnf`/Linux fixes in `src/setup/preview.ts` and `src/system/executables.ts`) are still good PR candidates for upstream. Prefer to keep such patches isolated so they remain cherry-pickable.
- `personal/` is fork-specific scratch space that's tracked on `my-tweaks`. It does not exist upstream, so rebases can't produce conflicts there. Use it for notes, host-specific documentation, and anything else that should follow this fork but never be offered upstream.
- The canonical write-up of this machine's wiring (launcher shim, pandoc/Chrome user-local installs, the alphaXiv OAuth-over-SSH-tunnel dance) lives in `personal/my-setup.md`. **Read it before touching installer, browser-detection, or preview-pipeline code.** It documents real host constraints (headless Rocky 9 server) that upstream doesn't account for.

## Commands

Node **20.19.0+** is required. The repo pins this in `.nvmrc`, `package.json` engines, `website/package.json` engines, and a runtime guard in `scripts/check-node-version.mjs` — all four must move together on upgrades.

```bash
nvm use || nvm install        # sync to .nvmrc
npm install                   # root deps
npm test                      # tests: node --test on tests/*.test.ts (serial, tsx loader)
npm run typecheck             # tsc --noEmit
npm run build                 # tsc -p tsconfig.build.json → dist/
npm run dev                   # tsx src/index.ts (hot dev entry)
npm start                     # same as dev
npm run start:dist            # run built bundle via bin/feynman.js
```

Run a single test file:

```bash
node --import tsx --test tests/pi-runtime.test.ts
```

Note: `npm test` is pinned to `--test-concurrency=1` — tests touch shared filesystem state (`~/.feynman/`, bootstrap state) and will race if parallelized.

Website (separate workspace — only needed when editing `website/`):

```bash
cd website && npm install && npm run build
```

## How Feynman runs on this machine

There is **no global `feynman` on PATH from npm**. Instead, `~/.local/bin/feynman` is a hand-rolled bash wrapper that:

1. Pins CWD to `/home/jude/skills/feynman` before exec (so relative `outputs/`, `notes/`, etc. resolve consistently regardless of invocation directory).
2. Runs `node_modules/.bin/tsx src/index.ts` directly against the checked-out tree — **no build step**; edits to `src/` are reflected on next invocation.
3. Exports `PUPPETEER_EXECUTABLE_PATH` pointing at the user-local Chrome for Testing install under `~/.local/share/chrome-for-testing/...`.

Implications when iterating:

- You don't need `npm run build` for the CLI to pick up local edits — just save the file and re-run `feynman`. Build is only needed when testing the packed/published bundle via `npm run start:dist` or `bin/feynman.js`.
- If `feynman` launches but browser preview or PDF export breaks, check `PUPPETEER_EXECUTABLE_PATH` and `~/.local/bin/pandoc` before blaming code. See `personal/my-setup.md` §3 for the upgrade recipes.
- `~/.local/bin/xdg-open` is a custom shim that absorbs xdg-open calls and prints URLs to stderr instead of crashing on this headless server. Code that launches browsers must fall through to a manual-URL fallback path — do not assume a real xdg-open is present.

## Architecture — the big picture

Feynman is a **CLI shell around [Pi](https://github.com/badlogic/pi-mono)**, an external agent runtime. This repo does not implement the LLM loop, tool system, or subagent dispatch directly — it bootstraps Pi, syncs prompts/skills/subagents into Pi's agent directory, and forwards the user's request through `launchPiChat()`.

### Entry flow

```
bin/feynman.js         → node-version guard, loads patch-embedded-pi.mjs, then dist/index.js
src/index.ts           → ensureSupportedNodeVersion(), dynamic-imports ./cli.js
src/cli.ts             → parses argv, dispatches setup/doctor/model/alpha/packages/update/search,
                         otherwise calls launchPiChat() with the initial prompt
src/pi/launch.ts       → actually spawns the Pi REPL
```

The top-level subcommand set is enumerated in `metadata/commands.mjs` (`topLevelCommandNames`). Any command not in that set is treated as either a workflow name (routed as `/<name>`) or a free-form chat prompt (see `resolveInitialPrompt()` in `src/cli.ts:289`).

### The two prompt systems

This distinction matters for almost every content change:

1. **Workflow prompts** — `prompts/*.md`. These are top-level operations like `/deepresearch`, `/lit`, `/audit`. Each has YAML frontmatter parsed by `metadata/commands.mjs:parseFrontmatter`. Setting `topLevelCli: true` makes the prompt invokable as `feynman <name>` directly from the shell (see `resolveInitialPrompt`). New workflows usually live here.

2. **Skills** — `skills/<name>/SKILL.md` (plus optional support files in the same dir). These are reusable capabilities Pi loads on startup. Keep `SKILL.md` concise; put detailed rules in the corresponding `prompts/*.md` or focused reference files.

`package.json`'s `"pi"` field (`extensions`, `prompts`, `skills`) is how Pi discovers these directories when Feynman is installed as a Pi package.

### The bootstrap sync — a subtle footgun

On every launch, `src/cli.ts:main` calls `syncBundledAssets(appRoot, feynmanAgentDir)` from `src/bootstrap/sync.ts`. This copies three trees from the repo into `~/.feynman/agent/`:

- `.feynman/themes/` → `~/.feynman/agent/themes/`
- `.feynman/agents/` → `~/.feynman/agent/agents/` (the bundled Pi subagents)
- `skills/`          → `~/.feynman/agent/skills/`

The sync is **hash-based and conservative**: it tracks `lastAppliedSourceHash` / `lastAppliedTargetHash` in `~/.feynman/.state/bootstrap.json` and refuses to overwrite target files that were hand-edited after the last apply (they go into `result.skipped` instead of `result.updated`). The upshot:

- **Canonical edits must go in the repo**, not in `~/.feynman/agent/skills/...`. Editing the target directly will leave the edit in place but also mark that file "dirty," blocking all future updates from the repo for that path.
- If you need to reset state, either delete the specific target file (next launch will re-copy) or wipe `~/.feynman/.state/bootstrap.json`.
- Tests for this behavior live in `tests/bootstrap-sync.test.ts` — run them after touching `src/bootstrap/sync.ts`.

### Where the bundled subagents live

`.feynman/agents/*.md` is the source of truth for the four bundled Pi subagents (`researcher`, `reviewer`, `writer`, `verifier`). Per `AGENTS.md`, **do not restate subagent prompt text in `AGENTS.md`** — it's a repo-level contract for cross-agent conventions (output locations, provenance, delegation rules), not a prompt catalogue.

### Pi runtime patching

`src/pi/` contains Feynman-specific configuration and a small patch layer over Pi:

- `src/pi/runtime.ts`, `src/pi/launch.ts`, `src/pi/settings.ts` — settings normalization, launch plumbing, env wiring.
- `src/pi/web-access.ts` — Pi web-access config (Gemini / Perplexity).
- `scripts/patch-embedded-pi.mjs` — runs before `dist/index.js` loads and applies monkey patches to the embedded Pi copy. The tests under `tests/pi-*-patch.test.ts` lock in the expected patch behavior; if you change these patches, those tests are the regression fence.

### Config and state layout

`src/config/paths.ts` centralizes every `~/.feynman/` path. Respects `FEYNMAN_HOME` override for tests. Subdirectories: `agent/` (the Pi agent dir containing synced skills/agents/themes, plus `settings.json` and `auth.json`), `memory/`, `sessions/`, `.state/` (bootstrap hash ledger).

## Conventions to preserve

These come from `AGENTS.md` and `CONTRIBUTING.md` and apply when editing prompts, skills, or workflow code:

- Research outputs go in `outputs/`, paper drafts in `papers/`, session logs in `notes/`, plan artifacts in `outputs/.plans/`.
- Every workflow run derives a **short slug** (lowercase, hyphens, ≤5 words) and prefixes all artifacts with it: plan, intermediate research, draft, brief, verification, final, `.provenance.md` sidecar. Never use generic names like `research.md`.
- `/deepresearch` and `/lit` outputs require a `.provenance.md` sidecar recording source accounting and verification state.
- American English in all docs, comments, prompts, and UI copy.
- Don't add prompts/skills whose primary purpose is to market a third-party product; integrations need user-facing utility and neutral language.
- Version strings must stay synced across `.nvmrc`, `package.json`, `website/package.json`, and `scripts/check-node-version.mjs` when bumping Node support.
