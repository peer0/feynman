# My feynman setup

Personal notes for how this clone is wired on this machine. Lives on the
`my-tweaks` branch so it follows my customizations, not upstream.

## Repo wiring

This is a fork of `getcompanion-ai/feynman`. Remotes:

- `origin` → `git@github.com:peer0/feynman.git` (my fork, SSH, push target)
- `upstream` → `https://github.com/getcompanion-ai/feynman.git` (read-only)

Branches:

- `main` — pristine mirror of `upstream/main`. Never commit here directly.
- `my-tweaks` — long-lived branch for my customizations (this file lives here).

### Pulling upstream updates

```bash
git checkout main
git fetch upstream
git merge --ff-only upstream/main
git push origin main
git checkout my-tweaks
git rebase main
git push --force-with-lease
```

`--ff-only` guarantees `main` stays pristine; if it ever fails, something
was committed to `main` by mistake.

## Global `feynman` command

A wrapper script at `~/.local/bin/feynman` exposes `feynman` on PATH. It
runs `tsx src/index.ts` from this repo directly, so it always reflects
whatever branch is currently checked out — no build step needed.

Key properties:

- Pins CWD to `/home/jude/skills/feynman` before exec, so feynman's
  relative paths (`outputs/`, `notes/`, etc.) resolve consistently
  regardless of where I invoked `feynman` from.
- Uses the project-local `node_modules/.bin/tsx` via absolute path, so
  it doesn't depend on PATH lookup or a global tsx install.
- Hard-fails with a clear message if `node_modules` is missing.

The wrapper lives outside the repo (intentionally — it's machine-local
configuration, not part of the feynman source tree). To re-create it on
another machine, see the contents of `~/.local/bin/feynman`.

## Verification

`feynman doctor` invoked from `/tmp` (to stress-test CWD pinning):

```
working dir: /home/jude/skills/feynman   ← CWD pinning works
session dir: /home/jude/.feynman/sessions
models available: 23
default model: anthropic/claude-opus-4-6
default model valid: yes
pi runtime: ok
```

The `working dir` line is the key signal: even though `feynman` was
invoked from `/tmp`, it reported the project root as its CWD, confirming
the wrapper's `cd` directive is taking effect.

Items `feynman doctor` flagged as missing (unrelated to the PATH/fork
wiring — address via `feynman setup` when needed):

- alphaXiv auth
- pandoc
- browser preview runtime

## The `personal/` directory

This directory is fork-specific scratch space for content I want *tracked*
on `my-tweaks` (unlike `notes/`, `outputs/`, etc., which upstream
gitignores as local working areas). Upstream has no `personal/` dir, so
rebasing `my-tweaks` onto fresh `main` can never produce conflicts here.
