import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const isWindows = process.platform === "win32";
const isDarwin = process.platform === "darwin";
const programFiles = process.env.PROGRAMFILES ?? "C:\\Program Files";
const localAppData = process.env.LOCALAPPDATA ?? "";

export const PANDOC_FALLBACK_PATHS = isWindows
	? [`${programFiles}\\Pandoc\\pandoc.exe`]
	: isDarwin
		? ["/opt/homebrew/bin/pandoc", "/usr/local/bin/pandoc"]
		: ["/usr/local/bin/pandoc", "/usr/bin/pandoc"];

export const BREW_FALLBACK_PATHS = isWindows
	? []
	: ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"];

export const BROWSER_FALLBACK_PATHS = isWindows
	? [
			`${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
			`${programFiles} (x86)\\Google\\Chrome\\Application\\chrome.exe`,
			`${localAppData}\\Google\\Chrome\\Application\\chrome.exe`,
			`${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
			`${programFiles}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
		]
	: isDarwin
		? [
				"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
				"/Applications/Chromium.app/Contents/MacOS/Chromium",
				"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
				"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
			]
		: [
				// Distro packages (apt, dnf, yum, pacman, zypper).
				"/usr/bin/google-chrome",
				"/usr/bin/google-chrome-stable",
				"/usr/bin/chromium",
				"/usr/bin/chromium-browser",
				"/usr/bin/brave-browser",
				"/usr/bin/microsoft-edge",
				// Snap.
				"/snap/bin/chromium",
				"/snap/bin/google-chrome",
				// Flatpak.
				"/var/lib/flatpak/exports/bin/com.google.Chrome",
				"/var/lib/flatpak/exports/bin/org.chromium.Chromium",
			];

export const MERMAID_FALLBACK_PATHS = isWindows
	? []
	: ["/opt/homebrew/bin/mmdc", "/usr/local/bin/mmdc"];

export function resolveExecutable(name: string, fallbackPaths: string[] = []): string | undefined {
	for (const candidate of fallbackPaths) {
		if (existsSync(candidate)) {
			return candidate;
		}
	}

	const isWindows = process.platform === "win32";
	const result = isWindows
		? spawnSync("cmd", ["/c", `where ${name}`], {
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			})
		: spawnSync("sh", ["-lc", `command -v ${name}`], {
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			});

	if (result.status === 0) {
		const resolved = result.stdout.trim().split(/\r?\n/)[0];
		if (resolved) {
			return resolved;
		}
	}

	return undefined;
}
