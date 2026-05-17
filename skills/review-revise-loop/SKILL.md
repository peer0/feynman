---
name: review-revise-loop
description: Iterative review-revise loop for paper finalization. Spawns 3-5 parallel adversarial reviewers with rotating angles, synthesizes findings, applies fixes, and verifies — repeating until no MAJOR issues remain. Use when the user asks for a review loop, iterative paper polishing, submission-ready check, or review-revise cycle.
---

# Review-Revise Loop

Run the `/review-loop` workflow. Read the prompt template at `../prompts/review-loop.md` for the full procedure.

Agents used: `reviewer` (×3–5 parallel per round), `researcher` (optional, round 1 only)

Iteration engine: Ralph loop (`ralph_start` / `ralph_done`)

## Quick Reference

### Invocation
```
/review-loop <paper-path> --venue <venue> [--rounds <max>] [--reviewers <n>]
```

### Defaults
- `--venue`: inferred from paper content if possible, else ask
- `--rounds`: 5
- `--reviewers`: 3 (range: 3–5)

### Stopping Criteria
1. No FATAL or MAJOR issues found → one final verification round → COMPLETE
2. 3 consecutive MINOR-only rounds → COMPLETE
3. Max rounds reached → COMPLETE with note

### Output
- `notes/review-round-{N}.md` — per-round reviewer findings
- `notes/revision-plan-{N}.md` — per-round fix plan (if MAJORs found)
- CHANGELOG.md updated per round
- Git commit per round
