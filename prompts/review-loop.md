---
description: Iterative review-revise loop with venue-native scoring, per-round meta-reviewer, score tracking, and experiment gap reporting.
args: <paper-path> --venue <venue> [options]
section: Research Workflows
topLevelCli: true
---

Run an iterative review-revise loop on: $@

---

# 0. Arguments

| Arg | Req | Default | Notes |
|-----|-----|---------|-------|
| `paper-path` | **yes** | — | Main `.tex` file |
| `--venue` | **yes** | — | See venue table below |
| `--rounds` | no | `5` | Max iterations (1–10) |
| `--reviewers` | no | `4` | Total = (N−1) regular + 1 meta-reviewer. Min 3. |
| `--focus` | no | — | Narrows reviewer attention (free text) |
| `--mode` | no | `review-revise` | `review-only` skips edits |
| `--autonomy` | no | `full` | `cautious` pauses before each MAJOR fix |

If `--venue` omitted, infer from LaTeX source or ask.

Display resolved config before starting, then create Ralph task from template (§9) and begin.

When calling `ralph_start`, set `maxIterations` to **the user's `--rounds` value + 1** (the +1 accounts for the final verification round). For example, `--rounds 3` → `maxIterations: 4`.

---

# 1. Venue Table — Limits & Scoring

| Keyword | Body | Refs | Scoring | Overall Scale | Sub-dimensions (scale) |
|---------|------|------|---------|---------------|------------------------|
| `emnlp` / `acl` / `eacl` | 8pp | ∞ | ARR | 1–5 (0.5 steps) | Soundness 1–5, Excitement 1–5, Confidence 1–5, Reproducibility 1–5 |
| `emnlp-short` / `acl-short` | 4pp | ∞ | ARR | 1–5 (0.5 steps) | Same as above |
| `iclr` | 9pp | ∞ | ICLR | 1–10 | Soundness 1–4, Presentation 1–4, Contribution 1–4, Confidence 1–5 |
| `icml` | 9pp | ∞ | ICML | 1–6 | Soundness 1–4, Presentation 1–4, Significance 1–4, Originality 1–4, Confidence 1–5 |
| `neurips` | 9pp | ∞ | NeurIPS | 1–6 | Quality 1–4, Clarity 1–4, Significance 1–4, Originality 1–4, Confidence 1–5 |
| `aaai` | 7+1ref pp | incl. | AAAI | −3 to +3 | Relevance, Significance, Soundness, Novelty, Eval Quality, Clarity; Confidence 1–5 |
| `workshop` | 4–8pp | varies | Generic | 1–6 | Soundness 1–4, Presentation 1–4, Significance 1–4, Confidence 1–5 |

---

# 2. Venue Scoring — Exact Labels

Reviewers MUST use the exact scale of the target venue. Never mix scales.

## ARR (ACL / EMNLP / EACL)

**Overall Assessment** (decisive): 5=Award, 4.5=Borderline Award, 4=Conference, 3.5=Borderline Conference, 3=Findings, 2.5=Borderline Findings, 2=Resubmit next cycle, 1.5=Resubmit after next, 1=Do not resubmit.
**Soundness**: 5=Excellent, 4=Strong, 3=Acceptable, 2=Poor, 1=Major Issues. (0.5 steps allowed.)
**Excitement**: 5=Highly Exciting, 4=Exciting, 3=Interesting, 2=Potentially Interesting, 1=Not Exciting.
**Thresholds**: Overall ≥4→Conference, ≥3→Findings, <3→Reject.

## ICLR

**Rating** (decisive, 1–10): 10=Top 5% seminal, 8=Clear accept, 6=Marginally above threshold, 5=Marginally below, 3=Clear reject, 1=Strong reject. Integers 1–10.
**Sub-dims** (1–4): 1=poor, 2=fair, 3=good, 4=excellent.
**Thresholds**: Avg ≥6.4→Accept, 5–6→Borderline, <5→Reject.

## ICML / NeurIPS

**Overall** (decisive, 1–6): 6=Strong Accept, 5=Accept, 4=Weak/Borderline Accept, 3=Weak/Borderline Reject, 2=Reject, 1=Strong Reject.
**Sub-dims** (1–4): 1=poor, 2=fair, 3=good, 4=excellent.
**Thresholds**: ≥5→Accept, 4→Borderline, ≤3→Reject.

## AAAI

**Overall** (decisive, −3 to +3): +3=Strong Accept, +2=Accept, +1=Weak Accept, 0=Borderline, −1=Weak Reject, −2=Reject, −3=Strong Reject.
**Thresholds**: ≥+1→Accept consideration, 0→Borderline, ≤−1→Reject.

---

# 3. Reviewer Setup

## Composition (every round)

- **(N−1) regular reviewers**: fresh context, distinct angles, venue-native scoring
- **1 meta-reviewer**: fresh context, reads paper + all individual reviews from current round

## Angle Pool

`stat` Statistical Rigor · `narr` Narrative Coherence · `comp` Completeness Audit · `meth` Methodology · `novel` Novelty Positioning · `read` Reader Experience · `repr` Reproducibility · `advr` Adversarial Venue Reviewer

## Rotation

- Round 1: maximize coverage; always include `advr`.
- Round N+1: keep 1–2 angles that found most issues, rotate rest, never repeat same combo.

## Venue Calibration (all reviewers, not just advr)

All reviewers must: (a) score on the venue's actual scale, (b) follow the venue's review form structure, (c) focus on what the venue values.

| Venue | Core concern | advr persona |
|-------|-------------|--------------|
| ARR | NLP contribution, evaluation soundness, Findings vs Conference distinction | "What is the NLP contribution? Would this be better as Findings?" |
| ICLR | Technical novelty, theoretical depth, ablation sufficiency | "Is there novelty beyond empirical improvement? Are ablations isolating the contribution?" |
| ICML | Soundness ≠ impact (assess separately), principled methodology, broad ML significance | "Is there principled methodology, not just 'it works'?" |
| NeurIPS | Quality + Clarity + Significance + Originality, broader impact, presentation | "Broader impact addressed? Quality clearly supported?" |
| AAAI | AI breadth, cross-disciplinary integration, rigorous methodology | "Clear practical or theoretical significance? Survives two-phase review?" |

---

# 4. Meta-Reviewer (every round)

Receives: paper + all individual reviews from current round + prior round files (if round > 1).

Task (distinct from regular reviewers):
1. Assess consistency/contradictions among individual reviews
2. Identify blind spots no individual reviewer caught
3. Give **holistic venue-native score** — the headline score for the round
4. Explicit **accept / borderline / reject** recommendation
5. If round > 1: assess whether prior concerns were adequately addressed

The meta-reviewer exercises independent judgment — does NOT simply average scores.

---

# 5. Per-Round Iteration

### REVIEW → SYNTHESIZE → REVISE → VERIFY → SCORE → DECIDE

**REVIEW**: Spawn (N−1) reviewers + 1 meta in parallel. Each returns findings tagged `FATAL`/`MAJOR`/`MINOR`/`OK` with file/line refs + venue-native scores. Save to `notes/review-round-{N}.md`.

**SYNTHESIZE**: Bucket findings:

| Bucket | Rule |
|--------|------|
| Fix now | FATAL + MAJOR + quick MINOR (<2 min) |
| Optional | MINOR needing thought |
| Defer | Style prefs, contradictions, already addressed |
| **Experiment needed** | Cannot fix by editing — add to Experiment Gap List (§7) |

Strategic decisions: if `full` autonomy + clearly beneficial → apply with note; if ambiguous → pause and ask. GPU experiments → background process + pause loop.

**REVISE**: Apply fixes. If number changed → grep all occurrences. If figure changed → regenerate.

**VERIFY**: Compile → page budget check → citation integrity → overfull hbox = 0 → spot-check 3 key numbers. Commit: `git add -A && git commit -m "Review-revise round {N}: {summary}"`.

**SCORE REPORT** (mandatory every round):

```
Round {N}: Meta={score} | R1={s1}, R2={s2}, R3={s3} | Avg={avg}
  FATAL={f} MAJOR={m} MINOR={n} | Trend: Overall {prev}→{curr} ({delta}), MAJOR {prev}→{curr}
  Experiment gaps: {count} new
```

**DECIDE**:
- FATAL > 0 → next iteration addresses these first
- MAJOR > 0 → continue (ralph_done)
- MAJOR = 0 first time → one verification round
- MAJOR = 0 twice consecutive → COMPLETE
- 3 consecutive MINOR-only → COMPLETE
- max_rounds reached → COMPLETE with remaining notes

---

# 6. Final Report (`notes/review-loop-final.md`)

### A. Score Trajectory
Table: Round × (each reviewer score + meta score + avg overall + FATAL/MAJOR/MINOR counts).

### B. Experiment Gap Report
Issues not resolvable by editing. Each entry:
- **What**: concrete experiment
- **Why**: which reviewer/round/severity
- **How**: estimated effort + resources
- **Impact**: where result goes in paper, which claim it strengthens

Prioritize: MAJOR-severity + multi-reviewer flags first. Split into Required vs Nice-to-have.

### C. Remaining MINORs
Unresolved items with deferral rationale.

### D. One-paragraph Summary
Paper state + acceptance estimate.

### E. Rebuttal Strategy Document

Produce a structured rebuttal plan for the actual review phase. The loop has already generated all raw material — reviewer concerns, severity, what was fixed, what remains. Transform this into an actionable rebuttal document.

**Empirical basis** (Jung et al., "What Drives Paper Acceptance?", ICLR 2026): Rebuttal is the decisive phase for borderline papers. Evidence-backed clarification is the most effective strategy; generic/vague defense and evasive stance are the least effective. Score increases after rebuttal correlate with 55.7% acceptance vs 7.8% for unchanged scores.

For each remaining concern (from rounds where the concern was raised but not fully resolved by editing):

```markdown
#### Concern: {one-line summary}
- **Source**: R{round}, {reviewer_id} ({angle}), severity: {MAJOR/MINOR}
- **Status**: {partially addressed / deferred / requires experiment result}
- **Recommended strategy**: {one of the strategies below}
- **Response skeleton**:
  > {2-4 sentence draft response, evidence-backed}
- **Supporting evidence**: {point to specific section, table, figure, or planned experiment}
```

**Strategy taxonomy** (from Kargaran et al., arXiv 2511.15462):

| Strategy | When to use | Effectiveness |
|----------|-------------|---------------|
| Evidence-backed clarification | Reviewer missed or misread existing content | ★★★ Most effective |
| New result reference | Experiment gap was filled during/after loop | ★★★ |
| Concede & scope | Concern is valid but bounded; acknowledge + clarify scope | ★★ |
| Bare acknowledgment | Reviewer is correct, fix was applied in revision | ★★ |
| Redirect to section | Answer exists but reviewer didn't find it | ★★ |

**Anti-patterns to flag** (warn the author if a response skeleton drifts toward these):
- ❌ Generic/vague defense: "We believe our approach is sound" without specific evidence
- ❌ Evasive stance: not directly addressing the concern
- ❌ Excessive length: optimal rebuttal depth is 2-3 exchanges, not exhaustive essays
- ❌ Arguing tone: combative language correlates with score decreases

**Structure the document as a ready-to-use rebuttal draft**, ordered by:
1. Concerns from the lowest-scoring reviewer first (highest risk of blocking acceptance)
2. MAJOR concerns before MINOR
3. Cross-reviewer concerns (raised by multiple reviewers) flagged as highest priority

---

# 7. Experiment Gap Tracking

Maintain running list throughout loop. Entry format:
```
[R{N}] [{reviewer}] [{MAJOR|MINOR}] {issue} → Experiment: {what}, Effort: {est}, Impact: {where}
```

- Quick (<10 min, no GPU): attempt within loop
- Medium (10–60 min): background process if feasible
- Long (GPU / >1h): gap list → final report

---

# 8. Constraints

- Stop after MAJOR=0 twice. Don't chase every MINOR.
- Preserve author voice. Don't homogenize style.
- Verify after every edit (compile + page budget + refs).
- Venue-native scoring is non-negotiable.
- Meta-reviewer independence: not bound by individual scores.
- Experiment gaps are first-class outputs, not afterthoughts.
- When reviewers disagree: apply evidence, don't average opinions.

---

# 9. Ralph Task Template

```markdown
# Review-Revise Loop: {paper_title}

## Config
- Paper: {paper_path}
- Venue: {venue} ({scoring}) — Overall scale: {scale}
- Rounds: up to {max_rounds}
- Reviewers: {N} ({N-1} regular + 1 meta)
- Autonomy: {autonomy}

## Goals
- MAJOR → 0, page budget OK, refs consistent, meta score ≥ acceptance threshold

## Convergence Log
| Round | Angles | FATAL | MAJOR | MINOR | Meta | Avg | Verdict |
|-------|--------|-------|-------|-------|------|-----|---------|

## Experiment Gap List

## Checklist
- [ ] Round 1–{max_rounds}
- [ ] Final verification round
- [ ] notes/review-loop-final.md (trajectory + gaps + summary)
- [ ] CHANGELOG + git push
```
