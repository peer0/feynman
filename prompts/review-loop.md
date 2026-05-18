---
description: Iterative review-revise loop with venue-native scoring, per-round meta-reviewer, score tracking, and experiment gap reporting.
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
| `--venue` | **yes** | keyword | — | Target venue. Determines page limit, scoring system, reviewer personas. |
| `--rounds` | no | integer 1–10 | `5` | Maximum review-revise iterations. Loop may stop earlier via convergence. |
| `--reviewers` | no | integer 3–6 | `4` | **Total** reviewers per round **including 1 meta-reviewer**. So `--reviewers 5` means 4 regular reviewers + 1 meta-reviewer. Minimum 3 (= 2 + meta). |
| `--focus` | no | free text | — | Optional focus area for reviewers (e.g., `"calibration claim strength"`). Appended to every reviewer's prompt. |
| `--mode` | no | keyword | `review-revise` | `review-revise`: full loop with fixes. `review-only`: review without modifying files. |
| `--autonomy` | no | keyword | `full` | `full`: auto-apply all fixes, pause only on strategic decisions. `cautious`: pause before every MAJOR fix for user approval. |

### Venue Keywords, Page Limits & Scoring Systems

| Keyword | Full Name | Body | Refs | Appendix | Scoring System |
|---------|-----------|------|------|----------|----------------|
| `emnlp` | EMNLP (long) | 8pp | ∞ | ∞ | ARR |
| `emnlp-short` | EMNLP (short) | 4pp | ∞ | 1pp | ARR |
| `acl` | ACL (long) | 8pp | ∞ | ∞ | ARR |
| `acl-short` | ACL (short) | 4pp | ∞ | 1pp | ARR |
| `eacl` | EACL (long) | 8pp | ∞ | ∞ | ARR |
| `iclr` | ICLR | 9pp | ∞ | ∞ | ICLR |
| `icml` | ICML | 9pp | ∞ | ∞ | ICML |
| `neurips` | NeurIPS | 9pp | ∞ | ∞ | NeurIPS |
| `aaai` | AAAI | 8pp (7+1 refs) | incl. | suppl. | AAAI |
| `workshop` | Workshop | 4–8pp | varies | varies | Generic-6 |

If `--venue` is omitted, check the LaTeX source for venue clues (e.g., `\usepackage{acl}`, title comments). If ambiguous, ask the user.

---

## Venue Scoring Systems — Exact Scales

Each reviewer and the meta-reviewer MUST use the **exact scoring scale** of the target venue. Do NOT invent scales. The scales below are sourced from official 2025–2026 review forms.

### ARR Scoring (ACL / EMNLP / EACL)

All dimensions use a **1–5 scale with 0.5 increments** (1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5).

**Soundness** (1–5, 0.5 steps):
- 5 = Excellent: One of the most thorough studies I have seen, given its type.
- 4 = Strong: Sufficient support for all claims. Some extra experiments nice but not essential.
- 3 = Acceptable: Sufficient support for main claims. Some minor points may need extra support.
- 2 = Poor: Some main claims not sufficiently supported. Major technical/methodological problems.
- 1 = Major Issues: Not yet sufficiently thorough to warrant publication.

**Excitement** (1–5, 0.5 steps):
- 5 = Highly Exciting: Would recommend to others / attend its presentation.
- 4 = Exciting: Would mention to others / make effort to attend.
- 3 = Interesting: Might mention some points / attend if there's time.
- 2 = Potentially Interesting: Doesn't resonate with me but might with others.
- 1 = Not Exciting: Doesn't resonate with me or others in *ACL community.

**Overall Assessment** (1–5, 0.5 steps) — **THE decisive score**:
- 5 = Consider for Award (top 2.5%)
- 4.5 = Borderline Award
- 4 = Conference: Should be accepted to *ACL conference.
- 3.5 = Borderline Conference
- 3 = Findings: Should be accepted to Findings of ACL.
- 2.5 = Borderline Findings
- 2 = Resubmit next cycle: Needs substantial revisions completable by next ARR cycle.
- 1.5 = Resubmit after next cycle: Needs substantial revisions not completable by next cycle.
- 1 = Do not resubmit: Must be fully redone or not relevant to *ACL.

**Confidence** (1–5, integer):
- 5 = Positive evaluation is correct. Read very carefully, familiar with related work.
- 4 = Quite sure. Checked important points carefully.
- 3 = Pretty sure, but may have missed something.
- 2 = Willing to defend, but fairly likely missed details.
- 1 = Not my area or paper very hard to understand.

**Reproducibility** (1–5, integer):
- 5 = Could easily reproduce.
- 4 = Could mostly reproduce with minor variation.
- 3 = Could reproduce with some difficulty.
- 2 = Would be hard pressed to reproduce.
- 1 = Would not be able to reproduce.

**ARR decision thresholds** (approximate):
- Overall ≥ 4.0 → Conference (main track accept)
- Overall ≥ 3.0 → Findings
- Overall < 3.0 → Reject / Resubmit

### ICLR Scoring

**Sub-dimensions** (1–4 scale each):
- Soundness: 1=poor, 2=fair, 3=good, 4=excellent
- Presentation: 1=poor, 2=fair, 3=good, 4=excellent
- Contribution: 1=poor, 2=fair, 3=good, 4=excellent

**Rating** (1–10) — **THE decisive score**:
- 10 = Top 5% of accepted papers. Seminal, groundbreaking paper.
- 8 = Top 15-25% of accepted papers. Clear accept with important contribution.
- 6 = Marginally above the acceptance threshold.
- 5 = Marginally below the acceptance threshold.
- 3 = Clear reject. Significant weaknesses outweigh strengths.
- 1 = Strong reject. Trivially flawed or not relevant.
(Intermediate values 2, 4, 7, 9 can be used.)

**Confidence** (1–5): Same scale as ARR.

**ICLR decision thresholds** (approximate from ICLR 2026 data):
- Average rating ≥ 6.4 → Accept (mean of accepted papers)
- Average rating 5–6 → Borderline
- Average rating < 5 → Reject

### ICML Scoring

**Sub-dimensions** (1–4 scale each):
- Soundness: 1=poor, 2=fair, 3=good, 4=excellent
- Presentation: 1=poor, 2=fair, 3=good, 4=excellent
- Significance: 1=poor, 2=fair, 3=good, 4=excellent
- Originality: 1=poor, 2=fair, 3=good, 4=excellent

**Overall Recommendation** (1–6) — **THE decisive score**:
- 6 = Strong Accept: Technically flawless, exceptional impact, strong evaluation.
- 5 = Accept: Technically solid, high impact on at least one sub-area.
- 4 = Weak Accept: Technically solid, advances a sub-area, but some weaknesses limit impact.
- 3 = Weak Reject: Clear merits but weaknesses outweigh. Needs revisions.
- 2 = Reject: Technical flaws, weak evaluation, inadequate reproducibility.
- 1 = Strong Reject: Well-known results or unaddressed issues.

**Confidence** (1–5): Same scale as ARR.

**ICML decision thresholds** (approximate):
- Overall ≥ 5 → Accept
- Overall = 4 → Borderline accept
- Overall = 3 → Borderline reject
- Overall ≤ 2 → Reject

### NeurIPS Scoring

**Sub-dimensions** (1–4 scale each):
- Quality: 1=poor, 2=fair, 3=good, 4=excellent
- Clarity: 1=poor, 2=fair, 3=good, 4=excellent
- Significance: 1=poor, 2=fair, 3=good, 4=excellent
- Originality: 1=poor, 2=fair, 3=good, 4=excellent

**Overall** (1–6) — **THE decisive score**:
- 6 = Strong Accept: Technically flawless, groundbreaking impact.
- 5 = Accept: Technically solid, high impact.
- 4 = Borderline accept: Reasons to accept outweigh reasons to reject.
- 3 = Borderline reject: Reasons to reject outweigh reasons to accept.
- 2 = Reject: Technical flaws, weak evaluation.
- 1 = Strong Reject: Well-known results or fundamental issues.

**Confidence** (1–5): Same scale as ARR.

**NeurIPS decision thresholds** (approximate):
- Overall ≥ 5 → Accept
- Overall = 4 → Borderline accept
- Overall = 3 → Borderline reject
- Overall ≤ 2 → Reject

### AAAI Scoring

**Overall Evaluation** (−3 to +3) — **THE decisive score**:
- +3 = Strong Accept: Technically flawless, groundbreaking impact. Top 5%.
- +2 = Accept: Strong contribution with clear significance.
- +1 = Weak Accept: Merits outweigh concerns.
-  0 = Borderline: Could go either way.
- −1 = Weak Reject: Concerns outweigh merits.
- −2 = Reject: Significant technical/evaluation issues.
- −3 = Strong Reject: Fundamental flaws.

**Sub-dimensions** (typically assessed qualitatively; if scoring, use 1–10):
Relevance, Significance, Technical Soundness, Novelty, Quality of Evaluation, Clarity.

**Confidence** (1–5): Same scale as others.

**AAAI decision thresholds** (approximate):
- Overall ≥ +1 → Accept consideration
- Overall = 0 → Borderline
- Overall ≤ −1 → Reject consideration

### Generic-6 Scoring (Workshops)

Use a simple 1–6 scale matching ICML/NeurIPS conventions:
- 6 = Strong Accept, 5 = Accept, 4 = Weak Accept, 3 = Weak Reject, 2 = Reject, 1 = Strong Reject
- Sub-dimensions: Soundness (1–4), Presentation (1–4), Significance (1–4)
- Confidence (1–5)

---

## Resolved Config Display

Before starting the loop, display:

```
┌─ Review-Revise Loop ────────────────────────────────┐
│ Paper:      papers/latex/main.tex                    │
│ Venue:      EMNLP (long) — 8pp body, ARR scoring    │
│ Scoring:    Overall Assessment 1–5, Soundness 1–5,   │
│             Excitement 1–5                           │
│ Rounds:     up to 5                                  │
│ Reviewers:  4 total (3 reviewers + 1 meta-reviewer)  │
│ Mode:       review-revise                            │
│ Autonomy:   full                                     │
│ Focus:      (none)                                   │
└──────────────────────────────────────────────────────┘
Starting Round 1...
```

Derive a slug from the paper title for file naming.

Create the Ralph task file at `.ralph/review-loop.md` with the template at the bottom of this document, then start the Ralph loop.

---

## 1. Each Iteration: REVIEW

### Regular Reviewers (N−1 agents)

Spawn `num_reviewers - 1` parallel `reviewer` subagents, each with:
- **Fresh context** (not forked)
- A distinct angle from the rotation schedule
- The paper path to read directly
- Previous round summary (to avoid re-raising fixed issues)
- **Venue-specific scoring instructions** — explicitly include the scoring scale in the prompt
- **Venue-specific persona guidance** — see Venue-Specific Reviewer Personas below

Each reviewer reads the paper independently and returns:
1. Findings tagged: `FATAL` / `MAJOR` / `MINOR` / `OK` with file/line references
2. **Venue-native scores** — all dimensions using the exact scale for the target venue
3. Strengths, weaknesses, and questions (following the venue's review form structure)

### Meta-Reviewer (1 agent, every round)

Spawn 1 `reviewer` subagent as meta-reviewer with:
- **Fresh context** (not forked)
- The paper path to read
- ALL individual reviewer outputs from the current round
- Previous round review files (if round > 1)
- **Explicit meta-reviewer instructions** (see below)

**Meta-reviewer task** (distinct from regular reviewers):
1. Read the paper independently
2. Read all individual reviews from this round
3. Assess whether reviewer concerns are consistent, contradictory, or complementary
4. Identify blind spots that NO individual reviewer caught
5. Give a **holistic venue-native score** — this is the headline score for the round
6. Provide an explicit **accept / borderline / reject** recommendation
7. Flag any remaining concerns that could surprise a real reviewer
8. If round > 1: assess whether prior-round concerns were adequately addressed

The meta-reviewer does NOT simply average individual scores. They exercise independent judgment informed by (but not bound by) the individual reviews.

Save combined findings to `notes/review-round-{N}.md`.

---

## 2. Each Iteration: SYNTHESIZE

Merge all reviewer findings into three buckets:

| Bucket | Rule | Action |
|--------|------|--------|
| **Fix now** | All FATAL + all MAJOR + MINOR that take <2 min | Apply this iteration |
| **Optional** | MINOR that require thought | Apply if space/time allows |
| **Defer/ignore** | Subjective style preferences, contradictions between reviewers, or issues already addressed | Note reason and skip |
| **Experiment needed** | Issues that **cannot be fixed by editing alone** — missing ablations, baselines, case studies, additional figures, new analyses | Add to **Experiment Gap List** |

If a fix requires a **strategic decision** (contribution reorder, framing change, new experiment):
- If autonomy is `full` and the decision is clearly beneficial: apply with explicit note
- If the decision is ambiguous or risky: pause the Ralph loop and ask the user

If a fix requires a **GPU experiment**:
- Start it as a background process (`process` tool with `alertOnSuccess`)
- Pause the Ralph loop
- Resume when the experiment completes

---

## 3. Each Iteration: REVISE

Apply all "fix now" items. For each fix:
- Edit the LaTeX source
- If a number changed: grep the entire paper for all occurrences
- If a figure changed: regenerate and verify DPI ≥ 300

---

## 4. Each Iteration: VERIFY

After all fixes:

```bash
# Compile
tectonic main.tex  # (or latexmk/pdflatex)

# Page budget
python3 -c "import fitz; doc=fitz.open('main.pdf'); ..."
# Body must end by page limit (8 for ACL/EMNLP, 9 for ICLR/ICML/NeurIPS, etc.)

# Citation integrity
# All \cite keys must exist in .bib, and vice versa

# Overfull hbox: must be 0

# Spot-check: 3 key numbers from body against appendix/data
```

Commit: `git add -A && git commit -m "Review-revise round {N}: {summary}"`

---

## 5. Each Iteration: SCORE REPORT

After verify, produce a **per-round score card**. This is mandatory every round.

### Score Card Format (example for ARR/EMNLP)

```
┌─ Round 2 Score Card ──────────────────────────────────────────────┐
│                                                                    │
│  Reviewer        Soundness  Excitement  Overall   Confidence       │
│  ─────────────   ─────────  ──────────  ───────   ──────────       │
│  R1 (stat)         3.5        3.0        3.0        4              │
│  R2 (novel)        4.0        3.5        3.5        3              │
│  R3 (advr)         3.0        2.5        2.5        4              │
│  ─────────────   ─────────  ──────────  ───────   ──────────       │
│  Avg (reviewers)   3.5        3.0        3.0                       │
│  Meta-reviewer     3.5        3.0        3.0        4              │
│                                                                    │
│  Meta verdict:  Borderline Findings (3.0)                          │
│  Issues:  FATAL 0 │ MAJOR 3 │ MINOR 5                             │
│                                                                    │
│  Trend:  R1 → R2                                                   │
│  Overall:  2.5 → 3.0 (+0.5)                                       │
│  MAJOR:    7 → 3 (−4)                                              │
│                                                                    │
│  Experiment gaps: 1 new (missing cross-lingual ablation)           │
└────────────────────────────────────────────────────────────────────┘
```

Adapt the dimensions and scale to the actual venue (e.g., ICLR shows Soundness/Presentation/Contribution/Rating).

Append the score card to `notes/review-round-{N}.md`.

---

## 6. Each Iteration: DECIDE

Count remaining FATAL + MAJOR from this round.

- **FATAL > 0**: Next iteration must address these first.
- **MAJOR > 0**: Continue loop (ralph_done).
- **MAJOR = 0, first time**: Run one more "verification round" to confirm.
- **MAJOR = 0, second consecutive time**: COMPLETE.
- **3 consecutive MINOR-only rounds**: COMPLETE.
- **max_rounds reached**: COMPLETE with note about remaining MINORs.

---

## 7. Loop End: FINAL REPORT

When the loop completes, produce a **Final Report** saved to `notes/review-loop-final.md`:

### Part A: Score Trajectory

Full trend table across all rounds:

```markdown
## Score Trajectory

| Round | R1 | R2 | R3 | Meta | Avg Overall | FATAL | MAJOR | MINOR |
|-------|----|----|----|----- |-------------|-------|-------|-------|
| 1     | 2.5| 3.0| 2.0| 2.5  | 2.5         | 1     | 7     | 4     |
| 2     | 3.0| 3.5| 2.5| 3.0  | 3.0         | 0     | 3     | 5     |
| 3     | 3.5| 3.5| 3.0| 3.5  | 3.3         | 0     | 0     | 3     |

Final meta-reviewer verdict: Borderline Conference (3.5)
Estimated acceptance probability: ~50%
```

### Part B: Experiment Gap Report

If there are issues that **cannot be resolved by paper edits alone**, list them as an actionable plan:

```markdown
## Experiment Gap Report

### Required Experiments (would address MAJOR reviewer concerns)

1. **Cross-lingual ablation** (Reviewer R3, Round 1)
   - What: Run the pipeline on 3+ non-English languages (e.g., DE, ZH, JA)
   - Why: "English-only evaluation limits generalizability claims" — addresses §5 contribution scope
   - How: Reuse existing pipeline with multilingual BERT embeddings; ~2h GPU time
   - Impact on paper: New Table in §5 or Appendix; strengthens universality claim

2. **Baseline comparison with [X]** (Meta-reviewer, Round 2)
   - What: Implement and run [X] baseline on our benchmark
   - Why: "Missing comparison with the most natural baseline" — critical for positioning
   - How: [X] code available at [repo]; adapt to our data format; ~1h
   - Impact on paper: Row in Table 2; clarifies delta over prior work

### Nice-to-have Experiments (would address MINOR concerns)

3. **Case study: failure mode analysis** (Reviewer R1, Round 2)
   - What: Identify and analyze 3–5 failure cases with qualitative discussion
   - Why: "Paper lacks error analysis" — adds depth to evaluation
   - How: Manual inspection of worst-performing examples; ~30min
   - Impact on paper: New subsection in §5 or Appendix figure

### Figures / Visualizations Needed

4. **Convergence plot** (Reviewer R2, Round 1)
   - What: Training loss / metric over epochs
   - Why: "No evidence of training stability"
   - How: Log already exists; just needs plotting
   - Impact on paper: Figure in Appendix
```

Each entry must specify:
- **What** to do (concrete experiment description)
- **Why** it matters (which reviewer concern, which round)
- **How** to do it (estimated effort, resources needed)
- **Impact on paper** (where the result goes, which claim it strengthens)

### Part C: Remaining MINORs

List any unresolved MINOR issues with rationale for deferral.

### Part D: Summary

One-paragraph summary suitable for the user to quickly assess the state of the paper.

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

Round 1: Pick N−1 angles that maximize coverage for this paper's state. Always include `advr` (venue-specific adversarial).
Round N+1:
- **Keep** 1–2 angles that found the most issues in round N (continuity).
- **Rotate** the rest to new angles from the pool (coverage).
- **Never repeat** the exact same combination in consecutive rounds.
- **Always keep `advr`** — the adversarial venue reviewer is present every round.

---

# Venue-Specific Reviewer Personas

**ALL reviewers** (not just `advr`) must be calibrated to the target venue. This means:

1. **Scoring on the venue's actual scale** — an EMNLP reviewer scores Overall Assessment on 1–5 with 0.5 steps, not on 1–10.
2. **Caring about what the venue cares about** — see venue-specific emphasis below.
3. **Writing in the venue's review style** — ARR reviews have structured sections (Summary, Strengths, Weaknesses, Questions); ICLR reviews are more free-form with emphasis on contribution clarity.

## ARR Venues (EMNLP / ACL / EACL)

**What ARR reviewers care about**:
- **NLP contribution**: Is there a clear contribution to computational linguistics / NLP? Pure ML methodology papers without language connection are penalized.
- **Soundness of evaluation**: Appropriate datasets, metrics, statistical tests, error analysis.
- **Reproducibility**: Are experimental details sufficient? Will code/data be released?
- **Findings vs Conference distinction**: Reviewers must judge if the paper is Conference-caliber (novel + impactful) or Findings-caliber (sound + reproducible but less novel/impactful).
- **Responsible NLP**: Limitations section, ethical considerations, dual use.

**Review form structure to follow**: Paper Summary → Summary of Strengths → Summary of Weaknesses → Scores (Soundness, Excitement, Overall Assessment, Confidence, Reproducibility) → Limitations & Societal Impact → Ethical Concerns.

**Adversarial persona (advr)**:
> "What is the NLP contribution? Analysis-only papers need exceptional insight or a transferable methodology. Is the evaluation design sound for the NLP community? Does the paper advance understanding of language, not just model behavior? Would this be better as a Findings paper?"

## ICLR

**What ICLR reviewers care about**:
- **Technical novelty**: Is there a new idea, not just an incremental improvement?
- **Theoretical depth or principled methodology**: Beyond "it works better."
- **Ablation sufficiency**: Isolating the contribution from confounds.
- **Representation learning / learning dynamics**: Core ICLR topics.
- **Reproducibility**: Clear experimental setup, but less emphasis on code release than ARR.

**Review form structure to follow**: Summary → Strengths and Weaknesses → Soundness (1–4) → Presentation (1–4) → Contribution (1–4) → Rating (1–10) → Confidence (1–5) → Questions.

**Adversarial persona (advr)**:
> "What is the technical novelty? Is there theoretical depth or just empirical observation? Are ablations sufficient to isolate the contribution? Does this advance representation learning or understanding of learning dynamics? Is the contribution significant enough for a 1-10 rating above 6?"

## ICML

**What ICML reviewers care about**:
- **Soundness distinct from impact**: A paper can be technically sound but incremental (and vice versa). Assess separately.
- **Principled methodology**: Not just "it works." Why does it work?
- **Broad ML significance**: Does this matter beyond one sub-area?
- **Originality broadly defined**: Novel combinations, new insights on existing methods, removing restrictive assumptions — all count.

**Review form structure to follow**: Summary → Strengths and Weaknesses (touching soundness, presentation, significance, originality) → Soundness (1–4) → Presentation (1–4) → Significance (1–4) → Originality (1–4) → Overall Recommendation (1–6) → Confidence (1–5) → Questions → Limitations.

**Adversarial persona (advr)**:
> "Is the contribution broad enough for the ML community? Is there principled methodology, not just empirical finding? Scalability? Theoretical grounding? Is soundness clearly distinct from significance in the evaluation?"

## NeurIPS

**What NeurIPS reviewers care about**:
- **Quality, Clarity, Significance, Originality** as four explicit dimensions.
- **Broader impact**: NeurIPS has an explicit broader impact expectation.
- **Originality broadly defined**: Novel insights on existing methods count equally.
- **Presentation quality**: NeurIPS reviewers tend to weight clarity heavily.

**Review form structure to follow**: Summary → Strengths and Weaknesses (touching Quality, Clarity, Significance, Originality) → Quality (1–4) → Clarity (1–4) → Significance (1–4) → Originality (1–4) → Overall (1–6) → Confidence (1–5) → Limitations.

**Adversarial persona (advr)**:
> "Is the contribution broad enough for the ML community? Is there a principled methodology? Scalability? Theoretical grounding? Broader impact adequately addressed? Is quality clearly supported and presentation at NeurIPS standard?"

## AAAI

**What AAAI reviewers care about**:
- **AI breadth**: AAAI covers all of AI, not just ML. Cross-disciplinary integration valued.
- **Practical and theoretical significance**: Both matter.
- **Rigorous experimental methodology**: AAAI reviewers tend to scrutinize baselines and metrics.
- **Two-phase process awareness**: Phase 1 rejects papers with clearly negative reviews; Phase 2 includes rebuttal. Simulated reviews should reflect Phase 2 caliber.

**Review form structure to follow**: Story clarity → Technical approach → Related work → Evaluations → Strengths (fixable / unfixable weaknesses) → Overall (−3 to +3) → Confidence.

**Adversarial persona (advr)**:
> "Is this AI research with clear practical or theoretical significance? Does it integrate knowledge from relevant sub-fields? Is the experimental methodology rigorous? Are claims scoped appropriately? Would this survive AAAI's two-phase review?"

## Workshop

**Adversarial persona (advr)**:
> "Is this a well-scoped contribution suitable for workshop-level discussion? Is the core idea sound even if incomplete? Does it open interesting directions?"

---

# Experiment Gap Tracking

Throughout the loop, maintain an **Experiment Gap List** — a running list of issues that cannot be resolved by paper editing alone.

### When to add entries:
- A reviewer says "missing ablation/baseline/analysis"
- A reviewer questions a claim that needs new empirical evidence
- A reviewer requests a figure, visualization, or case study that doesn't exist yet
- The meta-reviewer identifies a gap that would significantly strengthen the paper

### Entry format:
```
- [ROUND N] [REVIEWER ID] [SEVERITY: MAJOR/MINOR]
  Issue: <what the reviewer said>
  Experiment: <what experiment would address this>
  Estimated effort: <time + resources>
  Paper impact: <where the result would go>
```

### During the loop:
- If an experiment is quick (<10 min, no GPU): attempt it within the loop, run it, add results to paper.
- If an experiment is medium (10–60 min, no GPU): start as background process if feasible.
- If an experiment requires GPU or >1h: add to the gap list for the final report.

### At loop end:
- All entries are compiled into the **Experiment Gap Report** (Part B of Final Report).
- Entries are prioritized: MAJOR-severity experiments that multiple reviewers flagged come first.

---

# Page Limits by Venue

| Venue | Body limit | References | Appendix |
|-------|-----------|-----------|---------|
| ACL/EMNLP (long) | 8 pages | unlimited | unlimited |
| ACL/EMNLP (short) | 4 pages | unlimited | 1 page |
| ICLR | 9 pages | unlimited | unlimited |
| ICML | 9 pages | unlimited | unlimited |
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
- Venue: {venue} ({scoring_system} scoring)
- Max rounds: {max_rounds}
- Reviewers per round: {num_reviewers} ({num_reviewers - 1} regular + 1 meta)
- Autonomy: {autonomy}

## Goals
- All MAJOR issues → 0
- Page budget compliant
- All cite/ref/figure consistent
- Meta-reviewer score at or above venue acceptance threshold
- Experiment gap report complete

## Scoring System
{venue_scoring_summary}

## Convergence Log

| Round | Angles | FATAL | MAJOR | MINOR | Meta Score | Avg Score | Verdict |
|-------|--------|-------|-------|-------|------------|-----------|---------|

## Experiment Gap List
(Populated during loop)

## Checklist
- [ ] Round 1
- [ ] Round 2 (if needed)
- [ ] Round 3 (if needed)
- [ ] Final verification round
- [ ] Score trajectory report
- [ ] Experiment gap report
- [ ] Final report written to notes/review-loop-final.md
- [ ] CHANGELOG updated
- [ ] Git push

## Round Details
(Populated during loop execution)
```

---

# Key Constraints

- **Do not over-polish.** After MAJOR = 0 for two consecutive rounds, stop. Chasing every MINOR leads to diminishing returns and risks introducing new issues.
- **Preserve the author's voice.** Reviewers suggest; the loop applies fixes that improve substance. Do not homogenize writing style.
- **Verify after every edit.** A fix that breaks page budget or introduces a stale reference is worse than no fix.
- **Respect the deadline.** If max_rounds is reached, deliver the best current state with the experiment gap report rather than blocking on perfection.
- **When reviewers disagree, apply evidence.** If Reviewer A says "cut this paragraph" and Reviewer B says "expand it," check: does the paragraph support a contribution? If yes, keep; if not, cut. Don't average opinions.
- **Venue-native scoring is non-negotiable.** An EMNLP reviewer must score on 1–5. An ICLR reviewer must score on 1–10. Never mix scales.
- **Meta-reviewer independence.** The meta-reviewer's score is informed by but not bound by individual reviewer scores. If all reviewers give 3.5 but the meta-reviewer sees a blind spot, they can go lower. If reviewers focus on minor issues, the meta-reviewer can score higher.
- **Experiment gaps are first-class outputs.** A review loop that identifies needed experiments but doesn't surface them clearly has failed half its job. The experiment gap report is as important as the score trajectory.

---

# Usage Examples

## Minimal (required args only)
```
/review-loop papers/latex/main.tex --venue emnlp
```
Runs 4 total (3 reviewers + 1 meta), up to 5 rounds, full autonomy, ARR scoring on 1–5.

## Full specification
```
/review-loop papers/latex/main.tex --venue iclr --rounds 4 --reviewers 5 --focus "theoretical contribution clarity"
```
5 total (4 reviewers + 1 meta), max 4 rounds, ICLR scoring on 1–10, focused on theory.

## Review-only (no edits)
```
/review-loop paper/main.tex --venue aaai --mode review-only --reviewers 4
```
Produces review reports with AAAI −3 to +3 scoring without modifying files. Includes experiment gap report.

## Cautious mode (approve each fix)
```
/review-loop papers/latex/main.tex --venue emnlp --autonomy cautious
```
Pauses before applying each MAJOR fix. User approves or rejects via numbered menu.
