# 청람 (Cheongram) Personality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layer a disciple-framed Korean-language research personality (청람) onto the user's Feynman fork via three-file concat at runtime, plus minimal subagent preambles.

**Architecture:** Three Markdown files (`.feynman/SYSTEM.md` unchanged, `.feynman/PERSONA.md` new, `.feynman/FOCUS.md` new) are read and concatenated in `src/pi/runtime.ts`'s `buildPiArgs()` before being passed as a single `--system-prompt` to Pi. Four subagent files (`.feynman/agents/*.md`) receive 3-line lab-metaphor preambles inserted after their YAML frontmatter.

**Tech Stack:** TypeScript (Node 20.19+), `node:test` + `node:assert/strict`, `tsx` loader, Pi agent runtime.

**Spec:** `personal/designs/2026-04-10-cheongram-personality.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `.feynman/PERSONA.md` | 청람 identity, language policy, lab metaphor, disagreement protocol, paper reading, cross-discipline, values, default workflow |
| Create | `.feynman/FOCUS.md` | 6-month variable focus areas, active seeds, meta-rules |
| Modify | `src/pi/runtime.ts:36-48` | Add `personaPath` and `focusPath` to `resolvePiPaths()` |
| Modify | `src/pi/runtime.ts:82-84` | Concat SYSTEM + PERSONA + FOCUS in `buildPiArgs()` |
| Modify | `tests/pi-runtime.test.ts` | Add test for three-file concat logic |
| Modify | `.feynman/agents/researcher.md` | Add lab-metaphor preamble after frontmatter |
| Modify | `.feynman/agents/reviewer.md` | Add lab-metaphor preamble after frontmatter |
| Modify | `.feynman/agents/writer.md` | Add lab-metaphor preamble + English artifact note after frontmatter |
| Modify | `.feynman/agents/verifier.md` | Add lab-metaphor preamble after frontmatter |
| No change | `.feynman/SYSTEM.md` | Upstream research rules preserved verbatim |
| No change | `prompts/*.md` | Workflow prompts unchanged |

---

### Task 1: Create `.feynman/PERSONA.md`

**Files:**
- Create: `.feynman/PERSONA.md`

- [ ] **Step 1: Create the PERSONA.md file**

Copy the full PERSONA.md content verbatim from the design spec `personal/designs/2026-04-10-cheongram-personality.md` §4. The content starts with `# 청람 (Cheongram / 靑藍)` and ends with `교환되는 것은 **한 번의 iteration 크기** 이지 rigor 가 아닙니다.`

The content is ~20 KB of Korean-language Markdown. It must be copied exactly — any truncation or summarization breaks the personality spec.

```bash
# Verify the file exists and is non-trivial
wc -l .feynman/PERSONA.md
# Expected: ~580 lines (approximate)
```

- [ ] **Step 2: Verify PERSONA.md is well-formed Markdown**

```bash
# Quick structural check: count the top-level sections
grep -c '^## ' .feynman/PERSONA.md
```

Expected: 8 sections (언어 정책, 연구실 구조, Disagreement protocol, Contribution-first paper reading, Cross-discipline rule, Values, Default workflow, plus the opening 청출어람 subsections under the `#` heading).

- [ ] **Step 3: Commit**

```bash
git add .feynman/PERSONA.md
git commit -m "feat: add 청람 (Cheongram) personality spec

Three-layer personality system: SYSTEM.md (upstream) + PERSONA.md (identity,
language, rules) + FOCUS.md (variable research focus). This commit adds the
stable personality layer."
```

---

### Task 2: Create `.feynman/FOCUS.md`

**Files:**
- Create: `.feynman/FOCUS.md`

- [ ] **Step 1: Create the FOCUS.md file**

Copy the full FOCUS.md content verbatim from the design spec `personal/designs/2026-04-10-cheongram-personality.md` §5. The content starts with `# FOCUS.md — 청람의 현재 연구 포커스` and ends with `해당 세션에서 재언급 금지.`

```bash
# Verify
wc -l .feynman/FOCUS.md
# Expected: ~55 lines (approximate)
```

- [ ] **Step 2: Verify the date fields are correct**

```bash
grep 'Last updated' .feynman/FOCUS.md
grep 'Next review' .feynman/FOCUS.md
```

Expected:
```
**Last updated**: 2026-04-10
**Next review suggested**: 2026-10-10
```

- [ ] **Step 3: Commit**

```bash
git add .feynman/FOCUS.md
git commit -m "feat: add 청람 FOCUS.md for 6-month research focus tracking

Variable layer of the three-layer personality system. Contains current
research keywords (neuro-symbolic AI, AI safety, verification, LLM
reasoning/interpretability), possible drifts, and active seed slots."
```

---

### Task 3: Write failing test for three-file concat in `buildPiArgs`

**Files:**
- Modify: `tests/pi-runtime.test.ts`

- [ ] **Step 1: Write the failing test**

Add the following test at the end of `tests/pi-runtime.test.ts`:

```typescript
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("buildPiArgs concatenates SYSTEM.md + PERSONA.md + FOCUS.md into --system-prompt", () => {
	const tempRoot = mkdtempSync(join(tmpdir(), "feynman-persona-test-"));
	const feynmanDir = join(tempRoot, ".feynman");
	mkdirSync(feynmanDir, { recursive: true });
	// Create required dirs/files so buildPiArgs doesn't skip --system-prompt
	mkdirSync(join(tempRoot, "extensions"), { recursive: true });
	writeFileSync(join(tempRoot, "extensions", "research-tools.ts"), "", "utf8");
	mkdirSync(join(tempRoot, "prompts"), { recursive: true });

	writeFileSync(join(feynmanDir, "SYSTEM.md"), "SYSTEM-CONTENT", "utf8");
	writeFileSync(join(feynmanDir, "PERSONA.md"), "PERSONA-CONTENT", "utf8");
	writeFileSync(join(feynmanDir, "FOCUS.md"), "FOCUS-CONTENT", "utf8");

	try {
		const args = buildPiArgs({
			appRoot: tempRoot,
			workingDir: "/workspace",
			sessionDir: "/sessions",
			feynmanAgentDir: "/home/.feynman/agent",
		});

		const promptIdx = args.indexOf("--system-prompt");
		assert.ok(promptIdx !== -1, "expected --system-prompt in args");
		const promptValue = args[promptIdx + 1];

		assert.ok(promptValue.includes("SYSTEM-CONTENT"), "should contain SYSTEM.md content");
		assert.ok(promptValue.includes("PERSONA-CONTENT"), "should contain PERSONA.md content");
		assert.ok(promptValue.includes("FOCUS-CONTENT"), "should contain FOCUS.md content");

		// Verify order: SYSTEM before PERSONA before FOCUS
		const sysIdx = promptValue.indexOf("SYSTEM-CONTENT");
		const personaIdx = promptValue.indexOf("PERSONA-CONTENT");
		const focusIdx = promptValue.indexOf("FOCUS-CONTENT");
		assert.ok(sysIdx < personaIdx, "SYSTEM should come before PERSONA");
		assert.ok(personaIdx < focusIdx, "PERSONA should come before FOCUS");
	} finally {
		rmSync(tempRoot, { recursive: true, force: true });
	}
});

test("buildPiArgs works with only SYSTEM.md (no PERSONA/FOCUS)", () => {
	const tempRoot = mkdtempSync(join(tmpdir(), "feynman-persona-test-"));
	const feynmanDir = join(tempRoot, ".feynman");
	mkdirSync(feynmanDir, { recursive: true });
	mkdirSync(join(tempRoot, "extensions"), { recursive: true });
	writeFileSync(join(tempRoot, "extensions", "research-tools.ts"), "", "utf8");
	mkdirSync(join(tempRoot, "prompts"), { recursive: true });

	writeFileSync(join(feynmanDir, "SYSTEM.md"), "SYSTEM-ONLY", "utf8");

	try {
		const args = buildPiArgs({
			appRoot: tempRoot,
			workingDir: "/workspace",
			sessionDir: "/sessions",
			feynmanAgentDir: "/home/.feynman/agent",
		});

		const promptIdx = args.indexOf("--system-prompt");
		assert.ok(promptIdx !== -1, "expected --system-prompt in args");
		const promptValue = args[promptIdx + 1];

		assert.equal(promptValue, "SYSTEM-ONLY");
		assert.ok(!promptValue.includes("PERSONA"), "should not contain PERSONA when file absent");
		assert.ok(!promptValue.includes("FOCUS"), "should not contain FOCUS when file absent");
	} finally {
		rmSync(tempRoot, { recursive: true, force: true });
	}
});

test("buildPiArgs uses separator between concat parts", () => {
	const tempRoot = mkdtempSync(join(tmpdir(), "feynman-persona-test-"));
	const feynmanDir = join(tempRoot, ".feynman");
	mkdirSync(feynmanDir, { recursive: true });
	mkdirSync(join(tempRoot, "extensions"), { recursive: true });
	writeFileSync(join(tempRoot, "extensions", "research-tools.ts"), "", "utf8");
	mkdirSync(join(tempRoot, "prompts"), { recursive: true });

	writeFileSync(join(feynmanDir, "SYSTEM.md"), "SYS", "utf8");
	writeFileSync(join(feynmanDir, "PERSONA.md"), "PER", "utf8");

	try {
		const args = buildPiArgs({
			appRoot: tempRoot,
			workingDir: "/workspace",
			sessionDir: "/sessions",
			feynmanAgentDir: "/home/.feynman/agent",
		});

		const promptIdx = args.indexOf("--system-prompt");
		const promptValue = args[promptIdx + 1];

		// Parts should be separated, not jammed together
		assert.ok(!promptValue.includes("SYSPER"), "parts should not run together without separator");
		assert.ok(promptValue.includes("\n\n---\n\n"), "should use --- separator between parts");
	} finally {
		rmSync(tempRoot, { recursive: true, force: true });
	}
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --import tsx --test tests/pi-runtime.test.ts
```

Expected: The three new tests fail. The first test fails because `buildPiArgs` currently only reads `SYSTEM.md` and ignores `PERSONA.md` / `FOCUS.md`. The existing tests should still pass.

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/pi-runtime.test.ts
git commit -m "test: add failing tests for PERSONA.md + FOCUS.md concat in buildPiArgs

Three new tests:
1. All three files present → concatenated in order with separator
2. Only SYSTEM.md present → backwards compatible, no PERSONA/FOCUS content
3. Two files → separator exists between parts, not jammed together"
```

---

### Task 4: Implement three-file concat in `src/pi/runtime.ts`

**Files:**
- Modify: `src/pi/runtime.ts:36-48` (add paths to `resolvePiPaths`)
- Modify: `src/pi/runtime.ts:82-84` (concat logic in `buildPiArgs`)

- [ ] **Step 1: Add `personaPath` and `focusPath` to `resolvePiPaths`**

In `src/pi/runtime.ts`, modify the `resolvePiPaths` function to add two new paths after `systemPromptPath`:

```typescript
export function resolvePiPaths(appRoot: string) {
	return {
		piPackageRoot: resolve(appRoot, "node_modules", "@mariozechner", "pi-coding-agent"),
		piCliPath: resolve(appRoot, "node_modules", "@mariozechner", "pi-coding-agent", "dist", "cli.js"),
		promisePolyfillPath: resolve(appRoot, "dist", "system", "promise-polyfill.js"),
		promisePolyfillSourcePath: resolve(appRoot, "src", "system", "promise-polyfill.ts"),
		tsxLoaderPath: resolve(appRoot, "node_modules", "tsx", "dist", "loader.mjs"),
		researchToolsPath: resolve(appRoot, "extensions", "research-tools.ts"),
		promptTemplatePath: resolve(appRoot, "prompts"),
		systemPromptPath: resolve(appRoot, ".feynman", "SYSTEM.md"),
		personaPath: resolve(appRoot, ".feynman", "PERSONA.md"),
		focusPath: resolve(appRoot, ".feynman", "FOCUS.md"),
		piWorkspaceNodeModulesPath: resolve(appRoot, ".feynman", "npm", "node_modules"),
		nodeModulesBinPath: resolve(appRoot, "node_modules", ".bin"),
	};
}
```

- [ ] **Step 2: Replace the single-file read with three-file concat in `buildPiArgs`**

Replace lines 82-84 of `src/pi/runtime.ts`:

```typescript
	if (existsSync(paths.systemPromptPath)) {
		args.push("--system-prompt", readFileSync(paths.systemPromptPath, "utf8"));
	}
```

With:

```typescript
	const systemPromptParts: string[] = [];
	if (existsSync(paths.systemPromptPath)) {
		systemPromptParts.push(readFileSync(paths.systemPromptPath, "utf8"));
	}
	if (existsSync(paths.personaPath)) {
		systemPromptParts.push(readFileSync(paths.personaPath, "utf8"));
	}
	if (existsSync(paths.focusPath)) {
		systemPromptParts.push(readFileSync(paths.focusPath, "utf8"));
	}
	if (systemPromptParts.length > 0) {
		args.push("--system-prompt", systemPromptParts.join("\n\n---\n\n"));
	}
```

- [ ] **Step 3: Run all tests**

```bash
node --import tsx --test tests/pi-runtime.test.ts
```

Expected: All tests pass, including the three new ones from Task 3 AND the existing `buildPiArgs` test (which uses a non-existent path, so `existsSync` returns false for all three files → no `--system-prompt` arg → existing assertion still holds).

- [ ] **Step 4: Run full test suite and typecheck**

```bash
npm test && npm run typecheck
```

Expected: All pass with zero failures.

- [ ] **Step 5: Commit**

```bash
git add src/pi/runtime.ts
git commit -m "feat: concat SYSTEM.md + PERSONA.md + FOCUS.md into system prompt

Modify resolvePiPaths() to expose personaPath and focusPath, and modify
buildPiArgs() to read all three files (if they exist) and join with a
--- separator before passing to Pi as --system-prompt. Backwards
compatible: if only SYSTEM.md exists, behavior is unchanged."
```

---

### Task 5: Add lab-metaphor preamble to subagent files

**Files:**
- Modify: `.feynman/agents/researcher.md`
- Modify: `.feynman/agents/reviewer.md`
- Modify: `.feynman/agents/writer.md`
- Modify: `.feynman/agents/verifier.md`

- [ ] **Step 1: Add preamble to `researcher.md`**

Insert after the `---` frontmatter closing line (line 8) and before the existing body (`You are Feynman's evidence-gathering subagent.`), replacing that opening line:

```markdown
당신은 **청람** (Cheongram / 靑藍) 의 연구실 동료입니다. 지도교수는 Joonghyuk Hahn (`peer0`) 입니다. 당신의 역할은 researcher — 연구실의 증거 수집을 담당합니다. 청람과 다른 동료들은 당신의 peer 이며, hierarchy 가 아니라 peer feedback loop 에서 협업합니다.

You are the lab's evidence-gathering agent.
```

The existing `You are Feynman's evidence-gathering subagent.` line is replaced by the two lines above.

- [ ] **Step 2: Add preamble to `reviewer.md`**

Insert after the `---` frontmatter closing line, replacing `You are Feynman's AI research reviewer.`:

```markdown
당신은 **청람** (Cheongram / 靑藍) 의 연구실 동료입니다. 지도교수는 Joonghyuk Hahn (`peer0`) 입니다. 당신의 역할은 reviewer — 연구실의 pressure-test 를 담당합니다. 청람과 다른 동료들은 당신의 peer 이며, hierarchy 가 아니라 peer feedback loop 에서 협업합니다.

You are the lab's AI research reviewer.
```

- [ ] **Step 3: Add preamble to `writer.md`**

Insert after the `---` frontmatter closing line, replacing `You are Feynman's writing subagent.`:

```markdown
당신은 **청람** (Cheongram / 靑藍) 의 연구실 동료입니다. 지도교수는 Joonghyuk Hahn (`peer0`) 입니다. 당신의 역할은 writer — 연구실의 문서화를 담당합니다. 청람과 다른 동료들은 당신의 peer 이며, hierarchy 가 아니라 peer feedback loop 에서 협업합니다. Writer 의 output artifact 는 영어로 작성합니다 — 이는 conversation Korean / artifact English policy 에 따릅니다.

You are the lab's writing agent.
```

- [ ] **Step 4: Add preamble to `verifier.md`**

Insert after the `---` frontmatter closing line, replacing `You are Feynman's verifier agent.`:

```markdown
당신은 **청람** (Cheongram / 靑藍) 의 연구실 동료입니다. 지도교수는 Joonghyuk Hahn (`peer0`) 입니다. 당신의 역할은 verifier — 연구실의 인용·사실 확인을 담당합니다. 청람과 다른 동료들은 당신의 peer 이며, hierarchy 가 아니라 peer feedback loop 에서 협업합니다.

You are the lab's verifier agent.
```

- [ ] **Step 5: Verify frontmatter is intact for all four files**

```bash
for f in .feynman/agents/*.md; do
  echo "=== $f ==="
  head -12 "$f"
  echo
done
```

Expected: Each file starts with `---`, contains the YAML keys (`name`, `description`, `thinking`, etc.), closes with `---`, and is followed by the Korean preamble + English role line.

- [ ] **Step 6: Commit**

```bash
git add .feynman/agents/researcher.md .feynman/agents/reviewer.md .feynman/agents/writer.md .feynman/agents/verifier.md
git commit -m "feat: add lab-metaphor preamble to all four subagent prompts

Each subagent is now identified as a peer in 청람's research lab under
지도교수 Joonghyuk Hahn. The writer preamble additionally notes the
English artifact-language policy. Existing subagent body content is
preserved — only the opening identification line is replaced."
```

---

### Task 6: Interactive verification — identity and language check

**Files:** None modified. This is a manual smoke test.

- [ ] **Step 1: Launch Feynman and test identity**

```bash
feynman --prompt "너는 누구야?"
```

Expected: The agent self-identifies as **청람** (not Feynman) in Korean (경어체), mentioning the 제자/지도교수 relationship.

- [ ] **Step 2: Test English fallback**

```bash
feynman --prompt "attention mechanism에 대한 robustness를 간단히 설명해줘"
```

Expected: Response in Korean with `attention mechanism` and `robustness` kept in English. Should not translate `robustness` to 강건성 or 견고성 without disambiguation.

- [ ] **Step 3: Test anti-sycophancy trigger**

```bash
feynman --prompt "나는 LLM이 formal verification을 완전히 대체할 수 있다고 생각해. 어때?"
```

Expected: 청람 pushes back on this claim — LLM cannot provide formal guarantees in the mathematical sense. Should surface the ML vs formal methods terminology distinction for "verification."

- [ ] **Step 4: Document results**

If any test produces unexpected behavior, note the specific failure and which PERSONA.md section may need retuning. This is expected — first-pass calibration rarely needs zero adjustment.

---

### Task 7: Update `personal/my-setup.md` and commit all

**Files:**
- Modify: `personal/my-setup.md`

- [ ] **Step 1: Add a section to `personal/my-setup.md` documenting the personality layer**

Add the following at the end of the file, before the `## Known issues` section:

```markdown
## 청람 (Cheongram) personality layer

Three-file personality system layered on top of Feynman:

- `.feynman/SYSTEM.md` — upstream research rules (unchanged)
- `.feynman/PERSONA.md` — 청람 identity, language policy (Korean default +
  English fallback), lab metaphor, anti-sycophancy rules, contribution-first
  paper reading, cross-discipline rules (ML × SE), values
- `.feynman/FOCUS.md` — 6-month variable: research focus keywords, possible
  drifts, active seeds. Hand-edit this file when focus shifts.

`src/pi/runtime.ts` concatenates all three files (with `\n\n---\n\n`
separator) before passing to Pi as `--system-prompt`. If PERSONA.md or
FOCUS.md are absent, behavior degrades gracefully to upstream-only.

The four subagent files (`.feynman/agents/*.md`) have Korean preambles
identifying them as 청람's lab peers.

Design spec: `personal/designs/2026-04-10-cheongram-personality.md`
```

- [ ] **Step 2: Commit**

```bash
git add personal/my-setup.md
git commit -m "personal: document 청람 personality layer in my-setup.md"
```

---

## Self-Review Checklist

| Spec requirement | Task |
|---|---|
| Create PERSONA.md with 9 sections | Task 1 |
| Create FOCUS.md with initial content | Task 2 |
| Modify runtime.ts for three-file concat | Task 4 |
| Test the concat logic (TDD) | Tasks 3 → 4 |
| Subagent preambles (4 files) | Task 5 |
| Identity smoke test | Task 6 |
| Documentation update | Task 7 |
| No change to SYSTEM.md | Verified — no task touches it |
| No change to prompts/*.md | Verified — no task touches them |
| No /crystallize command created | Verified — deferred per spec |

**Placeholder scan:** No TBD/TODO/FIXME in any task. All code blocks are complete.

**Type consistency:** `resolvePiPaths()` returns `personaPath` and `focusPath` in Task 4 Step 1 — these names are used consistently in the `buildPiArgs()` replacement in Task 4 Step 2 and in the test assertions in Task 3.
