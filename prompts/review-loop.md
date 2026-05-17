---
description: Iterative review-revise loop with parallel adversarial reviewers, convergence-driven stopping, and per-round verification.
args: <paper-path> --venue <venue> [options]
section: Research Workflows
topLevelCli: true
---

Run an iterative review-revise loop on: $@

---

# Protocol

## 0. Setup — Argument Parsing

Parse the invocation string. Display the resolved config to the user before starting.

### Arguments

| Argument | Required | Format | Default | Description |
|----------|----------|--------|---------|-------------|
| `paper-path` | **yes** | file path | — | Path to the main LaTeX file (e.g., `papers/latex/main.tex`). Must exist. |
| `--venue` | **yes** | keyword | — | Target venue. Determines page limit, adversarial persona, and reviewer expectations. |
| `--rounds` | no | integer 1–10 | `5` | Maximum review-revise iterations. Loop may stop earlier via convergence. |
| `--reviewers` | no | integer 3–5 | `3` | Number of parallel reviewers per round. ≥4 always includes `advr` (adversarial venue reviewer). |
| `--focus` | no | free text | — | Optional focus area for reviewers (e.g., `"calibration claim strength"`, `"related work completeness"`). Appended to every reviewer's prompt. |
| `--mode` | no | keyword | `review-revise` | `review-revise`: full loop with fixes. `review-only`: review without modifying files. |
| `--autonomy` | no | keyword | `full` | `full`: auto-apply all fixes, pause only on strategic decisions. `cautious`: pause before every MAJOR fix for user approval. |

### Venue Keywords & Page Limits

| Keyword | Full Name | Body Limit | Refs | Appendix | Adversarial Persona |
|---------|-----------|-----------|------|----------|---------------------|
| `emnlp` | EMNLP (long) | 8pp | unlimited | unlimited | NLP contribution focus |
| `emnlp-short` | EMNLP (short) | 4pp | unlimited | 1pp | Conciseness + impact |
| `acl` | ACL (long) | 8pp | unlimited | unlimited | Same as EMNLP |
| `acl-short` | ACL (short) | 4pp | unlimited | 1pp | Same as EMNLP short |
| `iclr` | ICLR | 9pp | unlimited | unlimited | Technical novelty + theory |
| `neurips` | NeurIPS | 9pp | unlimited | unlimited | Broad ML + theory |
| `aaai` | AAAI | 8pp (7+1 refs) | **included** | separate suppl. | AI breadth + rigor |
| `eacl` | EACL (long) | 8pp | unlimited | unlimited | European NLP + multilingual |
| `workshop` | Workshop paper | 4–8pp (varies) | varies | varies | Core idea soundness |

If `--venue` is omitted, check the LaTeX source for venue clues (e.g., `\usepackage{acl}`, title comments). If ambiguous, ask the user.

### Resolved Config Display

Before starting the loop, display:

```
┌─ Review-Revise Loop ─────────────────────┐
│ Paper:     papers/latex/main.tex          │
│ Venue:     EMNLP (long) — 8pp body limit  │
│ Rounds:    up to 5                        │
│ Reviewers: 3 per round                   │
│ Mode:      review-revise                  │
│ Autonomy:  full                           │
│ Focus:     (none)                         │
└───────────────────────────────────────────┘
Starting Round 1...
```

Derive a slug from the paper title for file naming.

Create the Ralph task file at `.ralph/review-loop.md` with the template at the bottom of this document, then start the Ralph loop.

## 1. Each Iteration: REVIEW

Spawn `num_reviewers` parallel `reviewer` subagents, each with:
- **Fresh context** (not forked)
- A distinct angle from the rotation schedule
- The paper path to read directly
- Previous round summary (to avoid re-raising fixed issues)
- Venue-specific persona guidance

Each reviewer reads the paper independently and returns findings tagged:
`FATAL` / `MAJOR` / `MINOR` / `OK` with file/line references.

Save combined findings to `notes/review-round-{N}.md`.

## 2. Each Iteration: SYNTHESIZE

Merge all reviewer findings into three buckets:

| Bucket | Rule | Action |
|--------|------|--------|
| **Fix now** | All FATAL + all MAJOR + MINOR that take <2 min | Apply this iteration |
| **Optional** | MINOR that require thought | Apply if space/time allows |
| **Defer/ignore** | Subjective style preferences, contradictions between reviewers, or issues already addressed | Note reason and skip |

If a fix requires a **strategic decision** (contribution reorder, framing change, new experiment):
- If autonomy is `full` and the decision is clearly beneficial: apply with explicit note
- If the decision is ambiguous or risky: pause the Ralph loop and ask the user

If a fix requires a **GPU experiment**:
- Start it as a background process (`process` tool with `alertOnSuccess`)
- Pause the Ralph loop
- Resume when the experiment completes

## 3. Each Iteration: REVISE

Apply all "fix now" items. For each fix:
- Edit the LaTeX source
- If a number changed: grep the entire paper for all occurrences
- If a figure changed: regenerate and verify DPI ≥ 300

## 4. Each Iteration: VERIFY

After all fixes:

```bash
# Compile
tectonic main.tex  # (or latexmk/pdflatex)

# Page budget
python3 -c "import fitz; doc=fitz.open('main.pdf'); ..."
# Body must end by page limit (8 for ACL/EMNLP, 9 for ICLR, etc.)

# Citation integrity
# All \cite keys must exist in .bib, and vice versa

# Overfull hbox: must be 0

# Spot-check: 3 key numbers from body against appendix/data
```

Commit: `git add -A && git commit -m "Review-revise round {N}: {summary}"`

## 5. Each Iteration: DECIDE

Count remaining FATAL + MAJOR from this round.

- **FATAL > 0**: Next iteration must address these first.
- **MAJOR > 0**: Continue loop (ralph_done).
- **MAJOR = 0, first time**: Run one more "verification round" with fresh reviewers to confirm.
- **MAJOR = 0, second consecutive time**: COMPLETE.
- **3 consecutive MINOR-only rounds**: COMPLETE.
- **max_rounds reached**: COMPLETE with note about remaining MINORs.

## 6. Final Round: META-REVIEWER

In the last round (when MAJOR = 0), add a **meta-reviewer** alongside the regular reviewers:

The meta-reviewer receives:
- The paper
- ALL previous round review files (`notes/review-round-*.md`)
- The revision log

Their task is NOT a fresh line-by-line review. Instead:
- Assess whether reviewer concerns were adequately addressed
- Identify blind spots all reviewers missed
- Give a holistic accept/reject recommendation with confidence
- Flag any remaining concerns that could surprise a real reviewer

The meta-reviewer uses a **forked context** (not fresh) to access the full conversation history.

---

# Reviewer Angle Pool

| ID | Name | Focus |
|----|------|-------|
| `stat` | Statistical Rigor | Claims-evidence alignment, test assumptions, effect sizes, data consistency |
| `narr` | Narrative Coherence | Section contradictions, framing consistency, contribution clarity, abstract-body-conclusion alignment |
| `comp` | Completeness Audit | Refs, figures, page budget, bib rendering, appendix integrity, reproducibility details |
| `meth` | Methodology | Design validity, confounds, baselines, controls, ablation sufficiency |
| `novel` | Novelty Positioning | Prior work overlap, delta clarity, missing citations, community awareness |
| `read` | Reader Experience | Clarity, flow, jargon density, figure informativeness, takeaway strength |
| `repr` | Reproducibility | Code availability, hyperparameters, hardware specs, seed reporting, data access |
| `advr` | Adversarial Venue Reviewer | Simulates the toughest reviewer at the target venue (see venue personas below) |

## Rotation Schedule

Round 1: Pick 3–5 angles that maximize coverage for this paper's state.
Round N+1:
- **Keep** 1–2 angles that found the most issues in round N (continuity).
- **Rotate** the rest to new angles from the pool (coverage).
- **Never repeat** the exact same triple/quad in consecutive rounds.

When `num_reviewers` ≥ 4, include `advr` from round 1.

## Venue-Specific Adversarial Persona

The `advr` reviewer adopts a venue-specific persona:

### EMNLP / ACL
> "What is the NLP contribution? Analysis-only papers need exceptional insight or a transferable methodology. Is the evaluation design sound? Does the paper advance understanding of language, not just model behavior?"

### ICLR
> "What is the technical novelty? Is there theoretical depth or just empirical observation? Are ablations sufficient to isolate the contribution? Does this advance representation learning or understanding of learning dynamics?"

### NeurIPS
> "Is the contribution broad enough for the ML community? Is there a principled methodology, not just an empirical finding? Scalability? Theoretical grounding? Broader impact?"

### AAAI
> "Is this AI research with clear practical or theoretical significance? Does it integrate knowledge from relevant sub-fields? Is the experimental methodology rigorous by AI standards? Are the claims appropriately scoped?"

### EACL
> "Is this relevant to the European NLP community? Multilingual considerations? Underrepresented languages? Does the methodology or finding generalize beyond English?"

### Workshop
> "Is this a well-scoped contribution suitable for workshop-level discussion? Is the core idea sound even if incomplete? Does it open interesting directions?"

---

# Page Limits by Venue

| Venue | Body limit | References | Appendix |
|-------|-----------|-----------|---------|
| ACL/EMNLP (long) | 8 pages | unlimited | unlimited |
| ACL/EMNLP (short) | 4 pages | unlimited | 1 page |
| ICLR | 9 pages | unlimited | unlimited |
| NeurIPS | 9 pages | unlimited | unlimited |
| AAAI | 8 pages (7+1 refs) | included in limit | supplementary separate |
| EACL (long) | 8 pages | unlimited | unlimited |
| Workshop | typically 4–8 | varies | varies |

---

# Ralph Task Template

```markdown
# Review-Revise Loop: {paper_title}

## Config
- Paper: {paper_path}
- Venue: {venue}
- Max rounds: {max_rounds}
- Reviewers per round: {num_reviewers}
- Autonomy: full (pause on strategic decisions only)

## Goals
- All MAJOR issues → 0
- Page budget compliant
- All cite/ref/figure consistent
- Meta-reviewer gives accept recommendation

## Convergence Log

| Round | Angles | FATAL | MAJOR | MINOR | Fixed | Remaining |
|-------|--------|-------|-------|-------|-------|-----------|

## Checklist
- [ ] Round 1
- [ ] Round 2 (if needed)
- [ ] Round 3 (if needed)
- [ ] Final verification + meta-reviewer
- [ ] CHANGELOG updated
- [ ] Git push

## Round Details
(Populated during loop execution)
```

---

# Key Constraints

- **Do not over-polish.** After MAJOR = 0, stop. Chasing every MINOR leads to diminishing returns and risks introducing new issues.
- **Preserve the author's voice.** Reviewers suggest; the loop applies fixes that improve substance. Do not homogenize writing style.
- **Verify after every edit.** A fix that breaks page budget or introduces a stale reference is worse than no fix.
- **Respect the deadline.** If max_rounds is reached, deliver the best current state rather than blocking on perfection.
- **When reviewers disagree, apply evidence.** If Reviewer A says "cut this paragraph" and Reviewer B says "expand it," check: does the paragraph support a contribution? If yes, keep; if not, cut. Don't average opinions.

---

# Usage Examples

## Minimal (required args only)
```
/review-loop papers/latex/main.tex --venue emnlp
```
Runs 3 reviewers, up to 5 rounds, full autonomy, review-revise mode.

## Full specification
```
/review-loop papers/latex/main.tex --venue iclr --rounds 4 --reviewers 5 --focus "theoretical contribution clarity"
```
5 reviewers (including adversarial ICLR reviewer), max 4 rounds, focused on theory.

## Review-only (no edits)
```
/review-loop paper/main.tex --venue aaai --mode review-only --reviewers 4
```
Produces review reports without modifying any files. Useful for pre-submission assessment.

## Cautious mode (approve each fix)
```
/review-loop papers/latex/main.tex --venue emnlp --autonomy cautious
```
Pauses before applying each MAJOR fix. User approves or rejects via numbered menu.
