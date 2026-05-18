---
name: review-revise-loop
description: Iterative review-revise loop for paper finalization. Spawns parallel adversarial reviewers with rotating angles plus a meta-reviewer every round, synthesizes findings, applies fixes, and verifies — repeating until convergence or max rounds. Venue-aware scoring with real conference scales. Use when the user asks for a review loop, iterative paper polishing, submission-ready check, or review-revise cycle.
---

# Review-Revise Loop

Run the `/review-loop` workflow. Read the prompt template at `../prompts/review-loop.md` for the full procedure.

## Arguments

| Arg | Required | Default | Example |
|-----|----------|---------|---------|
| `<paper-path>` | **yes** | — | `papers/latex/main.tex` |
| `--venue` | **yes** | — | `emnlp`, `acl`, `iclr`, `neurips`, `icml`, `aaai`, `eacl`, `workshop` |
| `--rounds` | no | `5` | `3` (max 10) |
| `--reviewers` | no | `4` | `5` (total count including 1 meta-reviewer) |
| `--focus` | no | — | `"calibration claim"` — narrows reviewer attention |
| `--mode` | no | `review-revise` | `review-only` — no file edits |
| `--autonomy` | no | `full` | `cautious` — pause before each MAJOR fix |

## Quick Examples

```bash
# Standard: 4 total (3 reviewers + 1 meta), EMNLP venue, auto-fix
/review-loop papers/latex/main.tex --venue emnlp

# Thorough: 5 total (4 reviewers + 1 meta), ICLR venue, focused
/review-loop paper/main.tex --venue iclr --reviewers 5 --focus "ablation completeness"

# Assessment only: no edits
/review-loop paper/main.tex --venue aaai --mode review-only
```

## How It Works

1. **REVIEW**: (N−1) parallel `reviewer` subagents + 1 `meta-reviewer` (fresh context, rotated angles)
2. **SYNTHESIZE**: findings → FATAL / MAJOR / MINOR / OK, with venue-specific scores
3. **REVISE**: apply fixes (auto or with approval)
4. **VERIFY**: compile + page budget + cite integrity + git commit
5. **SCORE REPORT**: per-round score card with venue-native scales and trend tracking
6. **REPEAT** until convergence or max rounds
7. **FINAL REPORT**: remaining experiment recommendations if paper edits alone are insufficient

## Key Design Decisions

- **Meta-reviewer every round** — not just the final round. The meta-reviewer reads all individual reviews and provides a holistic assessment, catch blind spots, and gives the venue-native acceptance signal.
- **Venue-native scoring** — ARR uses 1–5 (0.5 steps), ICLR uses 1–10, ICML/NeurIPS use 1–6, AAAI uses −3 to +3. Reviewers score on the actual scale of the target venue.
- **Score tracking** — each round produces a score card showing individual + meta-reviewer scores and the trend across rounds.
- **Experiment gap report** — when issues cannot be fixed by editing alone (e.g., missing ablations, additional baselines, case studies), these are collected and reported as an actionable experiment plan at loop end.

Agents used: `reviewer` (×(N−1) per round), `meta-reviewer` (×1 per round)

Iteration engine: Ralph loop (`ralph_start` / `ralph_done`)

Full protocol: `prompts/review-loop.md`
