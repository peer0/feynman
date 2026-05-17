---
name: review-revise-loop
description: Iterative review-revise loop for paper finalization. Spawns 3-5 parallel adversarial reviewers with rotating angles, synthesizes findings, applies fixes, and verifies — repeating until no MAJOR issues remain. Use when the user asks for a review loop, iterative paper polishing, submission-ready check, or review-revise cycle.
---

# Review-Revise Loop

Run the `/review-loop` workflow. Read the prompt template at `../prompts/review-loop.md` for the full procedure.

## Arguments

| Arg | Required | Default | Example |
|-----|----------|---------|---------|
| `<paper-path>` | **yes** | — | `papers/latex/main.tex` |
| `--venue` | **yes** | — | `emnlp`, `acl`, `iclr`, `neurips`, `aaai`, `eacl`, `workshop` |
| `--rounds` | no | `5` | `3` (max 10) |
| `--reviewers` | no | `3` | `4` or `5` (≥4 includes adversarial venue reviewer) |
| `--focus` | no | — | `"calibration claim"` — narrows reviewer attention |
| `--mode` | no | `review-revise` | `review-only` — no file edits |
| `--autonomy` | no | `full` | `cautious` — pause before each MAJOR fix |

## Quick Examples

```bash
# Standard: 3 reviewers, EMNLP, auto-fix
/review-loop papers/latex/main.tex --venue emnlp

# Thorough: 5 reviewers, ICLR, focused
/review-loop paper/main.tex --venue iclr --reviewers 5 --focus "ablation completeness"

# Assessment only: no edits
/review-loop paper/main.tex --venue aaai --mode review-only
```

## How It Works

1. **REVIEW**: 3–5 parallel `reviewer` subagents (fresh context, rotated angles)
2. **SYNTHESIZE**: findings → FATAL / MAJOR / MINOR / OK
3. **REVISE**: apply fixes (auto or with approval)
4. **VERIFY**: compile + page budget + cite integrity + git commit
5. **REPEAT** until MAJOR = 0, then one final round with **meta-reviewer**

Agents used: `reviewer` (×3–5 per round), `researcher` (optional round 1)

Iteration engine: Ralph loop (`ralph_start` / `ralph_done`)

Full protocol: `prompts/review-loop.md`
