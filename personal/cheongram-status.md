# 청람 Project Status

**Living document.** Update when project phase changes or when significant
decisions are made. Kept deliberately thin — authoritative detail lives in
the design doc and plan files referenced below.

**Current phase**: Option A — observation period (started 2026-04-13)
**Current branch**: `my-tweaks`
**Last updated**: 2026-04-13

---

## How to pick up in a new Claude Code session

If you are a fresh Claude Code session landing in this repo, read these in
order before doing anything related to 청람:

1. **`CLAUDE.md`** — repo-level architecture, fork topology, commands, the
   bootstrap sync trap, two-prompt-system layout. Read first.
2. **`personal/my-setup.md`** — this machine's wiring: `~/.local/bin/feynman`
   wrapper with auto-rebuild, `cheongram` symlink, xdg-open shim,
   Chrome/pandoc user-local installs, alphaXiv OAuth flow.
3. **This file (`personal/cheongram-status.md`)** — project phase, deferred
   decisions, open questions. Read before proposing new work.
4. **`personal/designs/2026-04-10-cheongram-personality.md`** — the full
   10-section design doc. Read when you need the *why* behind any rule in
   PERSONA.md or FOCUS.md, or when the user wants to revise the design.
5. **`personal/plans/2026-04-13-cheongram-personality.md`** — the 7-task
   TDD implementation plan. Read if you need to understand *how* the
   current state was built or to replicate the approach.

Claude memory files auto-load and capture user-global preferences
(language policy, anti-sycophancy, research profile, fork workflow).

---

## What exists now

### Repo artifacts (all committed on `my-tweaks`)

| Category | File | Role |
|---|---|---|
| Identity | `.feynman/PERSONA.md` | 9-section 청람 personality (identity, language, lab metaphor, disagreement, paper reading, cross-discipline, values, default workflow, seed discovery) |
| Focus | `.feynman/FOCUS.md` | 6-month variable: current research focus, possible drifts, active seeds, projects, meta-rules |
| Runtime | `src/pi/runtime.ts` | `buildPiArgs()` concatenates `SYSTEM.md + PERSONA.md + FOCUS.md` with `\n\n---\n\n` separator before passing to Pi as `--system-prompt` |
| Runtime tests | `tests/pi-runtime.test.ts` | Three tests covering all-three-files, SYSTEM-only backwards compat, separator verification |
| Subagents | `.feynman/agents/{researcher,reviewer,writer,verifier}.md` | Lab-peer preamble added after YAML frontmatter; upstream bodies preserved |
| Docs | `personal/my-setup.md` | Machine wiring incl. cheongram symlink and auto-rebuild |
| Design | `personal/designs/2026-04-10-cheongram-personality.md` | Full design spec |
| Plan | `personal/plans/2026-04-13-cheongram-personality.md` | 7-task TDD plan (all tasks completed) |

### Machine-local artifacts (not in repo — see `my-setup.md`)

| Path | Role |
|---|---|
| `~/.local/bin/feynman` | Wrapper with auto-rebuild of `better-sqlite3` on Node ABI change |
| `~/.local/bin/cheongram` | Symlink to `~/.local/bin/feynman` |
| `~/.feynman/.state/last-known-node-abi` | Cache: most recently built-against Node `process.versions.modules` |

### Commit history on `my-tweaks` (for reference)

The 청람 customization added ~10 commits on top of upstream. Run
`git log main..my-tweaks --oneline` to see the current list — SHAs shift
when rebasing onto new `main`, so do not cite SHAs in this document.

---

## Current phase: Option A — observation period

On 2026-04-13 the user decided to **use 청람 as-is for several days** rather
than immediately adding new skills. Rationale: build evidence for which new
workflow commands are actually missing, instead of speculatively constructing
six at once.

During this phase:
- The user is running `cheongram` for real research tasks.
- The inherited Feynman workflows (`/deepresearch`, `/lit`, `/autoresearch`,
  `/audit`, `/replicate`, `/review`, `/compare`, `/draft`, `/watch`, etc.)
  are being filtered through 청람's personality layer.
- Any friction or missing capability should be noted by the user (not by
  Claude) and brought back in a subsequent session.

**Do not proactively build new workflows during this phase.** Wait for the
user to return with observations. Premature skill construction defeats the
point of choosing Option A.

---

## Deferred decisions (candidates for next phase)

When the user returns with observations, these six 청람-specific additions
were flagged during the 2026-04-13 session as plausible gap-fillers. Treat
this list as a **menu of candidates**, not a todo list. Only implement
the ones that match actual observed friction.

| Candidate | What it would do | Gap in current state |
|---|---|---|
| `/formal-audit` | Translate paper claims into formal specification; identify provable properties | `/audit` is paper-vs-code, no formal-methods lens |
| `/interp-experiment` | Minimum viable interpretability setup (SAE, probe, attention analysis) | General experiment workflows exist but nothing interp-specific |
| `/crystallize` | Explicit command surfacing PERSONA.md §Default workflow | Currently only default behavior, no explicit invocation |
| `/bridge` | Side-by-side mapping of ML claim ↔ formal methods theorem for the same question | Cross-discipline rule is in PERSONA.md but has no structured pipeline |
| `/seed-review` | Periodic review of FOCUS.md active seeds — still valid, reshape, or drop | FOCUS.md edited only manually; no structured review |
| `/neuro-symbolic-scan` | Cross-cutting methodology-based literature scan | `/lit` is topical; methodology-as-lens is not supported |

Evidence-based implementation rule: when the user says *"I wanted to do X
and had to cobble it together from [workflow A] + manual steps"*, that is
the signal to build a workflow for X.

---

## Open questions / things to watch during Option A

Observations to surface in the next session:

1. **Anti-sycophancy over-correction (Design §8.1 risk #2):** Does 청람 ever
   feel unnecessarily abrasive or manufacture disagreement? If yes, Section
   4 of PERSONA.md may need tone retuning.
2. **Prompt length (Design §8.1 risk #1):** Do early-section rules
   (identity, language) get followed reliably, or does 청람 ever slip —
   e.g. respond in English by default, or use English-only tone? Slippage
   suggests attention dilution across the long prompt.
3. **Korean phrasing naturalness (Design §8.1 risk #3):** Do the hardcoded
   disagreement templates (*"선생님, 그 전제에는 근거가 부족한 것 같습니다"*)
   feel natural when they actually fire, or do they feel stilted?
4. **Cross-discipline activation:** Does Section 6 fire spontaneously for
   ML × formal-methods questions (as in the smoke-test Test 2)? Or does it
   require explicit prompting?
5. **Contribution-first paper reading (Section 5):** When the user asks
   *"이 논문 뭐야"*, does 청람 produce the 5-axis breakdown or regress to
   abstract paraphrase?
6. **Seed discovery (Section 8 addendum):** Does 청람 actually propose new
   seeds during project work, or does it only respond to user-brought
   seeds?

These are behaviors the user can only evaluate in real use — not through
smoke tests. Expect some retuning after Option A.

---

## When to update this file

- Current phase changes (Option A → new skill construction, or back to design revision).
- A deferred candidate is implemented (move it from the Deferred Decisions table to What Exists).
- A new risk or open question is discovered during usage.
- A behavior rule in PERSONA.md is retuned (note what was changed and why).

Keep updates terse. This file is an index over the authoritative docs, not
a log of every thought.
