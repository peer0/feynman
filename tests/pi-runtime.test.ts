import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { applyFeynmanPackageManagerEnv, buildPiArgs, buildPiEnv, resolvePiPaths, toNodeImportSpecifier } from "../src/pi/runtime.js";

test("buildPiArgs includes configured runtime paths and prompt", () => {
	const args = buildPiArgs({
		appRoot: "/repo/feynman",
		workingDir: "/workspace",
		sessionDir: "/sessions",
		feynmanAgentDir: "/home/.feynman/agent",
		mode: "rpc",
		initialPrompt: "hello",
		explicitModelSpec: "openai:gpt-5.4",
		thinkingLevel: "medium",
	});

	assert.deepEqual(args, [
		"--session-dir",
		"/sessions",
		"--extension",
		"/repo/feynman/extensions/research-tools.ts",
		"--prompt-template",
		"/repo/feynman/prompts",
		"--mode",
		"rpc",
		"--model",
		"openai:gpt-5.4",
		"--thinking",
		"medium",
		"hello",
	]);
});

test("buildPiEnv wires Feynman paths into the Pi environment", () => {
	const previousUppercasePrefix = process.env.NPM_CONFIG_PREFIX;
	const previousLowercasePrefix = process.env.npm_config_prefix;
	process.env.NPM_CONFIG_PREFIX = "/tmp/global-prefix";
	process.env.npm_config_prefix = "/tmp/global-prefix-lower";

	const env = buildPiEnv({
		appRoot: "/repo/feynman",
		workingDir: "/workspace",
		sessionDir: "/sessions",
		feynmanAgentDir: "/home/.feynman/agent",
		feynmanVersion: "0.1.5",
	});

	try {
		assert.equal(env.FEYNMAN_SESSION_DIR, "/sessions");
		assert.equal(env.FEYNMAN_BIN_PATH, "/repo/feynman/bin/feynman.js");
		assert.equal(env.FEYNMAN_MEMORY_DIR, "/home/.feynman/memory");
		assert.equal(env.FEYNMAN_NPM_PREFIX, "/home/.feynman/npm-global");
		assert.equal(env.NPM_CONFIG_PREFIX, "/home/.feynman/npm-global");
		assert.equal(env.npm_config_prefix, "/home/.feynman/npm-global");
		assert.equal(env.PI_CODING_AGENT_DIR, "/home/.feynman/agent");
		assert.ok(
			env.PATH?.startsWith(
				"/repo/feynman/node_modules/.bin:/repo/feynman/.feynman/npm/node_modules/.bin:/home/.feynman/npm-global/bin:",
			),
		);
	} finally {
		if (previousUppercasePrefix === undefined) {
			delete process.env.NPM_CONFIG_PREFIX;
		} else {
			process.env.NPM_CONFIG_PREFIX = previousUppercasePrefix;
		}
		if (previousLowercasePrefix === undefined) {
			delete process.env.npm_config_prefix;
		} else {
			process.env.npm_config_prefix = previousLowercasePrefix;
		}
	}
});

test("applyFeynmanPackageManagerEnv pins npm globals to the Feynman prefix", () => {
	const previousFeynmanPrefix = process.env.FEYNMAN_NPM_PREFIX;
	const previousUppercasePrefix = process.env.NPM_CONFIG_PREFIX;
	const previousLowercasePrefix = process.env.npm_config_prefix;

	try {
		const prefix = applyFeynmanPackageManagerEnv("/home/.feynman/agent");

		assert.equal(prefix, "/home/.feynman/npm-global");
		assert.equal(process.env.FEYNMAN_NPM_PREFIX, "/home/.feynman/npm-global");
		assert.equal(process.env.NPM_CONFIG_PREFIX, "/home/.feynman/npm-global");
		assert.equal(process.env.npm_config_prefix, "/home/.feynman/npm-global");
	} finally {
		if (previousFeynmanPrefix === undefined) {
			delete process.env.FEYNMAN_NPM_PREFIX;
		} else {
			process.env.FEYNMAN_NPM_PREFIX = previousFeynmanPrefix;
		}
		if (previousUppercasePrefix === undefined) {
			delete process.env.NPM_CONFIG_PREFIX;
		} else {
			process.env.NPM_CONFIG_PREFIX = previousUppercasePrefix;
		}
		if (previousLowercasePrefix === undefined) {
			delete process.env.npm_config_prefix;
		} else {
			process.env.npm_config_prefix = previousLowercasePrefix;
		}
	}
});

test("resolvePiPaths includes the Promise.withResolvers polyfill path", () => {
	const paths = resolvePiPaths("/repo/feynman");

	assert.equal(paths.promisePolyfillPath, "/repo/feynman/dist/system/promise-polyfill.js");
});

test("toNodeImportSpecifier converts absolute preload paths to file URLs", () => {
	assert.equal(
		toNodeImportSpecifier("/repo/feynman/dist/system/promise-polyfill.js"),
		pathToFileURL("/repo/feynman/dist/system/promise-polyfill.js").href,
	);
	assert.equal(toNodeImportSpecifier("tsx"), "tsx");
});

// ---------- Three-file system-prompt concat tests ----------

function makeTempAppRoot(): string {
	const tmp = mkdtempSync(join(tmpdir(), "feynman-test-"));
	// buildPiArgs references these paths, so they must exist on disk
	mkdirSync(join(tmp, ".feynman"), { recursive: true });
	mkdirSync(join(tmp, "extensions"), { recursive: true });
	writeFileSync(join(tmp, "extensions", "research-tools.ts"), "");
	mkdirSync(join(tmp, "prompts"), { recursive: true });
	return tmp;
}

test("buildPiArgs concatenates SYSTEM + PERSONA + FOCUS in order with separator", () => {
	const tmp = makeTempAppRoot();
	try {
		writeFileSync(join(tmp, ".feynman", "SYSTEM.md"), "system-block");
		writeFileSync(join(tmp, ".feynman", "PERSONA.md"), "persona-block");
		writeFileSync(join(tmp, ".feynman", "FOCUS.md"), "focus-block");

		const args = buildPiArgs({
			appRoot: tmp,
			workingDir: "/workspace",
			sessionDir: "/sessions",
			feynmanAgentDir: "/home/.feynman/agent",
			initialPrompt: "hello",
		});

		const idx = args.indexOf("--system-prompt");
		assert.ok(idx !== -1, "expected --system-prompt in args");
		const prompt = args[idx + 1];
		assert.equal(
			prompt,
			"system-block\n\n---\n\npersona-block\n\n---\n\nfocus-block",
		);
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
});

test("buildPiArgs with only SYSTEM.md is backwards compatible", () => {
	const tmp = makeTempAppRoot();
	try {
		writeFileSync(join(tmp, ".feynman", "SYSTEM.md"), "system-only");

		const args = buildPiArgs({
			appRoot: tmp,
			workingDir: "/workspace",
			sessionDir: "/sessions",
			feynmanAgentDir: "/home/.feynman/agent",
			initialPrompt: "hello",
		});

		const idx = args.indexOf("--system-prompt");
		assert.ok(idx !== -1, "expected --system-prompt in args");
		const prompt = args[idx + 1];
		assert.equal(prompt, "system-only");
		assert.ok(!prompt.includes("persona"), "should not contain persona content");
		assert.ok(!prompt.includes("focus"), "should not contain focus content");
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
});

test("buildPiArgs with SYSTEM + PERSONA separates parts with --- separator", () => {
	const tmp = makeTempAppRoot();
	try {
		writeFileSync(join(tmp, ".feynman", "SYSTEM.md"), "AAA");
		writeFileSync(join(tmp, ".feynman", "PERSONA.md"), "BBB");

		const args = buildPiArgs({
			appRoot: tmp,
			workingDir: "/workspace",
			sessionDir: "/sessions",
			feynmanAgentDir: "/home/.feynman/agent",
			initialPrompt: "hello",
		});

		const idx = args.indexOf("--system-prompt");
		assert.ok(idx !== -1, "expected --system-prompt in args");
		const prompt = args[idx + 1];
		const parts = prompt.split("\n\n---\n\n");
		assert.equal(parts.length, 2, "expected exactly two parts separated by ---");
		assert.equal(parts[0], "AAA");
		assert.equal(parts[1], "BBB");
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
});
