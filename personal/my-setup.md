# My feynman setup

Personal notes for how this clone is wired on this machine. Lives on the
`my-tweaks` branch so it follows my customizations, not upstream.

## Repo wiring

This is a fork of `getcompanion-ai/feynman`. Remotes:

- `origin` → `git@github.com:peer0/feynman.git` (my fork, SSH, push target)
- `upstream` → `https://github.com/getcompanion-ai/feynman.git` (read-only)

Branches:

- `main` — pristine mirror of `upstream/main`. Never commit here directly.
- `my-tweaks` — long-lived branch for my customizations (this file lives here).

### Pulling upstream updates

```bash
git checkout main
git fetch upstream
git merge --ff-only upstream/main
git push origin main
git checkout my-tweaks
git rebase main
git push --force-with-lease
```

`--ff-only` guarantees `main` stays pristine; if it ever fails, something
was committed to `main` by mistake.

## Fork-level customizations on `my-tweaks`

Beyond documentation, `my-tweaks` carries real source-level patches to
improve feynman's Linux support. See `git log main..my-tweaks` for the
authoritative list. Current patches:

- **`src/setup/preview.ts`** — adds a `dnf` branch alongside the existing
  `apt-get` branch in `setupPreviewDependencies()`. Lets `feynman setup`
  auto-install pandoc on Rocky/Fedora/RHEL hosts (previously Debian-only).
- **`src/system/executables.ts`** — splits the non-Windows fallback-path
  lists into separate macOS and Linux branches. The old "else" branch
  contained only macOS `.app` paths, so auto-detection silently failed for
  every Linux install. Linux now lists distro package paths for
  google-chrome / chromium / brave / edge, plus Snap and Flatpak exports,
  plus `/usr/local/bin/pandoc` and `/usr/bin/pandoc`.

Both patches are good-faith upstream candidates — they fix real bugs in
upstream feynman and should eventually be offered back to
`getcompanion-ai/feynman` as a PR when I'm ready to spend the review
round-trip.

## Machine-local infrastructure (outside the repo)

Three scripts / installs live under `~/.local/` on this machine. They are
intentionally **not** tracked by git (they're machine-specific, and
hardcoding paths to my home directory into the repo would break the fork
for anyone else). This section documents how to reproduce them.

### 1. `~/.local/bin/feynman` — global launcher

A bash wrapper that exposes `feynman` on PATH:

- Runs `tsx src/index.ts` against this repo directly. No build step —
  always reflects the currently checked-out branch.
- Pins CWD to `/home/jude/skills/feynman` before exec, so feynman's
  relative paths (`outputs/`, `notes/`, etc.) resolve consistently
  regardless of where the command was invoked from.
- Uses the project-local `node_modules/.bin/tsx` via absolute path, so it
  doesn't depend on PATH lookup or a global tsx install.
- Exports `PUPPETEER_EXECUTABLE_PATH` pointing to the user-local Chrome
  for Testing install (see section 3 below).
- Hard-fails with a clear message if `node_modules/.bin/tsx` is missing.
- Warns (non-fatally) if `PUPPETEER_EXECUTABLE_PATH` points to a missing
  binary — fail-fast beats fail-silent for browser detection.

### 2. `~/.local/bin/xdg-open` — headless browser shim

Rocky Linux 9 on this server is headless (no DISPLAY, no browser, not even
`lynx`). The real `/usr/bin/xdg-open` exits non-zero when it can't find a
browser, which crashes any program that launches it via synchronous spawn
without a try/catch. Specifically, `@companion-ai/alpha-hub`'s OAuth login
flow (`node_modules/@companion-ai/alpha-hub/src/lib/auth.js`, the
`openBrowser` helper) crashes here and never reaches the line that prints
the manual-fallback URL.

The shim at `~/.local/bin/xdg-open` sits earlier in PATH than
`/usr/bin/xdg-open`, absorbs the call, prints the URL to stderr with a
clear prefix, and exits 0. Callers fall through to their manual-fallback
code path and print the URL themselves, which I can then open on my
workstation's browser.

To verify the shim is picked up in preference to the real xdg-open:

```bash
which -a xdg-open
# should list ~/.local/bin/xdg-open first
```

### 3. User-local pandoc and Chrome for Testing

Installed without sudo to respect shared-server conventions. Every file
lives under `/home/jude/.local/`.

**Pandoc 3.9.0.2** (155 MB):

```bash
cd /tmp
curl -fsSL -o pandoc.tar.gz \
  https://github.com/jgm/pandoc/releases/download/3.9.0.2/pandoc-3.9.0.2-linux-amd64.tar.gz
tar -xzf pandoc.tar.gz -C ~/.local/share/
ln -sf ~/.local/share/pandoc-3.9.0.2/bin/pandoc ~/.local/bin/pandoc
rm pandoc.tar.gz
```

The symlink approach (rather than copying the binary) keeps pandoc's
`share/pandoc/` data directory findable relative to the binary — pandoc
walks up from `$0/../share/pandoc/` at runtime to load its data files.

**Chrome for Testing 147.0.7727.56** (370 MB):

```bash
mkdir -p ~/.local/share/chrome-for-testing
npx --yes @puppeteer/browsers install chrome@stable \
  --path ~/.local/share/chrome-for-testing
```

`@puppeteer/browsers` is the official Puppeteer team's browser installer.
It resolves "latest stable", downloads the matching Chrome for Testing
build, and writes a manifest alongside the binary. The final binary path is
printed to stdout on success and looks like:

```
~/.local/share/chrome-for-testing/chrome/linux-<version>/chrome-linux64/chrome
```

That path must be exported as `PUPPETEER_EXECUTABLE_PATH` from the
`~/.local/bin/feynman` wrapper (see next section).

### System libraries chrome depends on

Chrome for Testing is a standalone binary, but it dynamically links against
a cluster of system shared libraries. On this server they are already
present system-wide (probably installed by the base Rocky image or another
package's transitive deps). If any of these are missing on a future
machine, `chrome --headless --version` will fail with an `ldd`-style error
and I'll need to either install the libs system-wide or ship a conda
environment with them.

Required libs (verify with `ldconfig -p | grep <name>`):

```
libnss3.so        libgbm.so.1          libasound.so.2
libX11.so.6       libdrm.so.2          libxkbcommon.so.0
libatk-1.0.so.0   libatk-bridge-2.0.so.0  libcups.so.2
libpango-1.0.so.0
```

## The alphaXiv OAuth dance (first-time only)

alphaXiv uses OAuth with a loopback redirect (`http://127.0.0.1:9876/callback`),
designed for CLI tools where the browser and the listener share a machine.
On this headless server the browser lives on my workstation instead, so I
have to bridge the two via SSH local port forwarding.

Steps (one-time, token is cached to `~/.ahub/auth.json` after success):

1. On my workstation, open a second SSH session with the tunnel:
   ```bash
   ssh -L 9876:localhost:9876 jude@172.30.1.90
   ```
2. In that session, run `feynman setup`.
3. The xdg-open shim (section 2) lets the login flow print its manual
   fallback URL instead of crashing. Copy the `https://clerk.alphaxiv.org/...`
   URL from the terminal.
4. Paste it into the browser on the workstation. Authorize alphaXiv.
5. alphaXiv redirects to `http://127.0.0.1:9876/callback?code=...` — the
   workstation's loopback port 9876 is tunneled via SSH to the server's
   port 9876, where alpha-hub's listener is waiting.
6. Terminal shows `alphaXiv login complete`. The second SSH session can be
   closed; subsequent feynman runs read the cached token directly.

Understanding `ssh -L`: the first `9876` is the port to listen on locally;
`localhost:9876` is where to forward the traffic *as seen from the server's
perspective*, which in this case is the server's own loopback.

## Verification

Full `feynman doctor` after all installs:

```
working dir: /home/jude/skills/feynman                  ← CWD pinning
alphaXiv auth: ok                                       ← OAuth cached
authenticated providers: 1
pandoc: /home/jude/.local/bin/pandoc                    ← user-local
browser preview runtime: /home/jude/.local/share/chrome-for-testing/...
pi runtime: ok
```

The `working dir` line confirms CWD pinning works. Stress-tested by
running `cd /tmp && feynman doctor` — output still shows the project root
as the working directory.

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

## Known issues and maintenance notes

**The Chrome for Testing version is pinned in the wrapper.** The
`PUPPETEER_EXECUTABLE_PATH` export in `~/.local/bin/feynman` contains a
literal version string (e.g., `linux-147.0.7727.56`). When Chrome is
eventually updated via `npx @puppeteer/browsers install chrome@stable`, a
new versioned directory will appear beside the old one, and the wrapper's
hardcoded path will either become stale (if the old dir is removed) or
point to an old version (if both coexist). Remediation options:

1. **Re-run the install and manually update the wrapper's path.** Low
   effort, high control, makes upgrades explicit. Current approach.
2. **Replace the hardcoded path with a glob resolver** that picks the
   newest `chrome/linux-*/chrome-linux64/chrome`. Auto-updating but hides
   version drift.
3. **Pin the install to a specific version** via
   `@puppeteer/browsers install chrome@<version>`, and bump the version
   consciously. Most reproducible.

**pandoc version updates:** same pattern. The version is in the directory
name (`~/.local/share/pandoc-3.9.0.2`), and the symlink in `~/.local/bin/`
is the single source of truth. To upgrade: download the new tarball,
extract to `~/.local/share/pandoc-<new-version>/`, re-point the symlink,
optionally remove the old directory. The script at the top of section 3 is
reusable with a different version tag.

**Tailscale repo GPG issue:** the `/etc/yum.repos.d/tailscale-stable.repo`
file on this server has a broken GPG signing key, so `dnf` commands print
noisy errors about metadata download. Worked around by passing
`--disablerepo=tailscale-stable` to one-off dnf invocations; real fix is
to re-import the signing key:

```bash
sudo rpm --import https://pkgs.tailscale.com/stable/rhel/9/repo.gpg
sudo dnf makecache --repo=tailscale-stable
```

## The `personal/` directory

This directory is fork-specific scratch space for content I want *tracked*
on `my-tweaks` (unlike `notes/`, `outputs/`, etc., which upstream
gitignores as local working areas). Upstream has no `personal/` dir, so
rebasing `my-tweaks` onto fresh `main` can never produce conflicts here.
