#!/usr/bin/env bun
/**
 * Automated release script for wooly.
 *
 * Bumps version in package.json, syncs lockfile, generates a CHANGELOG
 * entry from conventional commits since the last tag, verifies no stale
 * version strings remain in source, commits, tags, pushes, and creates
 * a GitHub release.
 *
 * Usage:
 *   bun run release              # patch bump (Z+1, default)
 *   bun run release -- minor     # minor bump (Y+1)
 *   bun run release -- major     # major bump (X+1)
 *   bun run release -- 1.0.0     # explicit version
 *   bun run release -- --dry-run # preview, no side effects
 *
 * Non-interactive — runs end-to-end without prompts.
 *
 * Env:
 *   Requires `gh` CLI authenticated for the GitHub release step.
 *   Optional: `rg` (ripgrep) for the stale-version scan; falls back to grep.
 *
 * Adapted from ../pew/scripts/release.ts.
 */

import { spawn } from "node:child_process";
import { resolve as pathResolve } from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = pathResolve(import.meta.dirname as string, "..");
const PACKAGE_JSON = pathResolve(PROJECT_ROOT, "package.json");
const CHANGELOG_MD = pathResolve(PROJECT_ROOT, "CHANGELOG.md");

/**
 * Files that carry the project version string. The Sidebar version chip
 * imports it from package.json via src/lib/version.ts, so package.json is
 * the single source of truth — no parallel constants to keep in sync.
 *
 * worker/package.json has its own independent version (Cloudflare Worker
 * lifecycle decoupled from the site) and is intentionally NOT bumped here.
 */
const VERSION_TARGETS = [{ path: "package.json", pattern: "json-version" as const }];

const BUMP_TYPES = ["patch", "minor", "major"] as const;
type BumpType = (typeof BUMP_TYPES)[number];

interface Commit {
  hash: string;
  subject: string;
}

interface ChangelogSections {
  added: string[];
  changed: string[];
  fixed: string[];
  removed: string[];
}

const COMMIT_TYPE_MAP: Record<string, keyof ChangelogSections> = {
  feat: "added",
  fix: "fixed",
  refactor: "changed",
  chore: "changed",
  docs: "changed",
  test: "changed",
  perf: "changed",
  style: "changed",
  ci: "changed",
  build: "changed",
};

const REMOVED_KEYWORDS = /\b(remove|delete|drop)\b/i;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const CONVENTIONAL_RE = /^(\w+)(?:\(.+?\))?!?:\s*(.+)$/;

// ---------------------------------------------------------------------------
// Shell helpers
// ---------------------------------------------------------------------------

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

function run(
  cmd: string,
  args: string[],
  opts?: { cwd?: string; inherit?: boolean },
): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts?.cwd ?? PROJECT_ROOT,
      stdio: opts?.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    if (!opts?.inherit) {
      child.stdout?.on("data", (d: Buffer) => {
        stdout += d.toString();
      });
      child.stderr?.on("data", (d: Buffer) => {
        stderr += d.toString();
      });
    }
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function runOrDie(
  cmd: string,
  args: string[],
  errorMsg: string,
): Promise<string> {
  const r = await run(cmd, args);
  if (r.code !== 0) {
    console.error(`❌ ${errorMsg}`);
    if (r.stderr.trim()) console.error(r.stderr.trim());
    process.exit(1);
  }
  return r.stdout.trim();
}

// ---------------------------------------------------------------------------
// Version helpers
// ---------------------------------------------------------------------------

function parseSemver(version: string): [number, number, number] {
  if (!SEMVER_RE.test(version)) {
    console.error(`❌ Invalid semver: "${version}"`);
    process.exit(1);
  }
  return version.split(".").map(Number) as [number, number, number];
}

function compareSemver(a: string, b: string): number {
  const [a0, a1, a2] = parseSemver(a);
  const [b0, b1, b2] = parseSemver(b);
  if (a0 !== b0) return a0 - b0;
  if (a1 !== b1) return a1 - b1;
  return a2 - b2;
}

function bumpVersion(current: string, bumpArg: string): string {
  if (SEMVER_RE.test(bumpArg)) {
    if (compareSemver(bumpArg, current) <= 0) {
      console.error(
        `❌ Explicit version ${bumpArg} must be greater than current ${current}`,
      );
      process.exit(1);
    }
    return bumpArg;
  }
  if (!BUMP_TYPES.includes(bumpArg as BumpType)) {
    console.error(`❌ Invalid bump type: "${bumpArg}"`);
    console.error("   Use: patch | minor | major | x.y.z");
    process.exit(1);
  }
  const [major, minor, patch] = parseSemver(current);
  switch (bumpArg as BumpType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

function readCurrentVersion(): string {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf-8"));
  return pkg.version;
}

function updateVersionInFile(
  target: (typeof VERSION_TARGETS)[number],
  oldVersion: string,
  newVersion: string,
): boolean {
  const abs = pathResolve(PROJECT_ROOT, target.path);
  const content = readFileSync(abs, "utf-8");
  if (target.pattern === "json-version") {
    const pattern = `"version": "${oldVersion}"`;
    const replacement = `"version": "${newVersion}"`;
    if (!content.includes(pattern)) {
      console.error(`  ✗ ${target.path} — pattern not found: ${pattern}`);
      return false;
    }
    writeFileSync(abs, content.replace(pattern, replacement), "utf-8");
    console.log(`  ✓ ${target.path}`);
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

async function getLastTag(): Promise<string | undefined> {
  const r = await run("git", ["describe", "--tags", "--abbrev=0"]);
  if (r.code !== 0) return undefined;
  return r.stdout.trim();
}

async function getCommitsSinceTag(tag: string | undefined): Promise<Commit[]> {
  const range = tag ? `${tag}..HEAD` : "HEAD";
  const stdout = await runOrDie(
    "git",
    ["log", range, "--format=%H|||%s"],
    "Failed to read git log",
  );
  if (!stdout) return [];
  return stdout
    .split("\n")
    .filter((line) => line.includes("|||"))
    .map((line) => {
      const sepIdx = line.indexOf("|||");
      return {
        hash: line.slice(0, sepIdx),
        subject: line.slice(sepIdx + 3),
      };
    })
    .filter(
      (c) =>
        !c.subject.startsWith("chore: bump version to ") &&
        !c.subject.startsWith("chore(release):"),
    );
}

// ---------------------------------------------------------------------------
// CHANGELOG
// ---------------------------------------------------------------------------

function classifyCommits(commits: Commit[]): ChangelogSections {
  const sections: ChangelogSections = {
    added: [],
    changed: [],
    fixed: [],
    removed: [],
  };
  for (const commit of commits) {
    const { subject } = commit;
    if (subject.startsWith("Merge ")) continue;
    let description: string;
    let section: keyof ChangelogSections;
    const match = CONVENTIONAL_RE.exec(subject);
    if (match) {
      const type = (match[1] as string).toLowerCase();
      description = capitalizeFirst((match[2] as string).trim());
      section = COMMIT_TYPE_MAP[type] ?? "changed";
    } else {
      description = capitalizeFirst(subject.trim());
      section = "changed";
    }
    if (REMOVED_KEYWORDS.test(subject) && section === "changed") {
      section = "removed";
    }
    if (!sections[section].includes(description)) {
      sections[section].push(description);
    }
  }
  return sections;
}

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Format matches the existing wooly CHANGELOG.md style:
 *   ## [0.0.5] - YYYY-MM-DD
 *   ### Added
 *   - ...
 */
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatChangelogSection(
  version: string,
  sections: ChangelogSections,
): string {
  const lines: string[] = [`## [${version}] - ${todayISO()}`];
  const order: [keyof ChangelogSections, string][] = [
    ["added", "Added"],
    ["changed", "Changed"],
    ["fixed", "Fixed"],
    ["removed", "Removed"],
  ];
  for (const [key, heading] of order) {
    const items = sections[key];
    if (items.length > 0) {
      lines.push("");
      lines.push(`### ${heading}`);
      for (const item of items) {
        lines.push(`- ${item}`);
      }
    }
  }
  return lines.join("\n");
}

function updateChangelog(newSection: string): void {
  if (!existsSync(CHANGELOG_MD)) {
    const header = [
      "# Changelog",
      "",
      "All notable changes to this project will be documented in this file.",
      "",
      "Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).",
      "Version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).",
      "",
    ].join("\n");
    writeFileSync(CHANGELOG_MD, header + "\n" + newSection + "\n");
    return;
  }
  const content = readFileSync(CHANGELOG_MD, "utf-8");
  // Find the first H2 heading that starts with "## [" — the version block marker.
  const versionMarkerRe = /^## \[/m;
  const match = versionMarkerRe.exec(content);
  let updated: string;
  if (!match) {
    updated = content.trimEnd() + "\n\n" + newSection + "\n";
  } else {
    updated =
      content.slice(0, match.index) + newSection + "\n\n" + content.slice(match.index);
  }
  writeFileSync(CHANGELOG_MD, updated);
}

// ---------------------------------------------------------------------------
// Stale-version scan (rg preferred, grep fallback)
// ---------------------------------------------------------------------------

async function scanStaleVersion(currentVersion: string): Promise<string> {
  const escaped = currentVersion.replace(/\./g, "\\.");
  const versionPattern = `["']${escaped}["']|\\b${escaped}\\b`;

  const rgCheck = await run("which", ["rg"]);
  if (rgCheck.code === 0) {
    const r = await run("rg", [
      versionPattern,
      "--glob",
      "*.ts",
      "--glob",
      "*.tsx",
      "--glob",
      "!node_modules/**",
      "--glob",
      "!scripts/release.ts",
      "--glob",
      "!**/*.test.ts",
      "--glob",
      "!**/*.test.tsx",
      "--glob",
      "!docs/**",
    ]);
    return r.code === 0 ? r.stdout.trim() : "";
  }
  // Fallback: grep across src/ only.
  const r = await run("grep", [
    "-rE",
    "--include=*.ts",
    "--include=*.tsx",
    "--exclude-dir=node_modules",
    "--exclude=*.test.ts",
    "--exclude=*.test.tsx",
    versionPattern,
    "src/",
  ]);
  return r.code === 0 ? r.stdout.trim() : "";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2).filter((a) => a !== "--");
  const isDryRun = rawArgs.includes("--dry-run");
  const bumpArg = rawArgs.find((a) => a !== "--dry-run") ?? "patch";

  if (isDryRun) console.log("🏜️  Dry-run mode — no changes will be made\n");

  // --- Phase 0: Preflight ---
  console.log("📋 Preflight checks...\n");

  const status = await runOrDie(
    "git",
    ["status", "--porcelain"],
    "Failed to check git status",
  );
  if (status) {
    console.error("❌ Working tree is not clean. Commit or stash changes first.");
    console.error(status);
    process.exit(1);
  }

  const branch = await runOrDie(
    "git",
    ["symbolic-ref", "--short", "HEAD"],
    "Detached HEAD — checkout a branch first",
  );

  const ghResult = await run("gh", ["auth", "status"]);
  const ghAuthed = ghResult.code === 0;
  if (!ghAuthed) {
    console.log("⚠️  gh CLI not authenticated — will skip GitHub release");
  }

  const currentVersion = readCurrentVersion();
  const newVersion = bumpVersion(currentVersion, bumpArg);
  const lastTag = await getLastTag();

  console.log("📦 wooly release");
  console.log(`   Current version: ${currentVersion}`);
  console.log(`   New version:     ${newVersion}`);
  console.log(`   Bump type:       ${bumpArg}`);
  console.log(`   Branch:          ${branch}`);
  console.log(`   Last tag:        ${lastTag ?? "(none)"}`);
  console.log("");

  // --- Phase 1: Version bump ---
  console.log(`📝 Phase 1: Updating version in ${VERSION_TARGETS.length} files...\n`);

  if (isDryRun) {
    for (const t of VERSION_TARGETS) console.log(`     • ${t.path} (${t.pattern})`);
    console.log("   [dry-run] Would run bun install to sync lockfile");
  } else {
    let failures = 0;
    for (const target of VERSION_TARGETS) {
      const ok = updateVersionInFile(target, currentVersion, newVersion);
      if (!ok) failures++;
    }
    if (failures > 0) {
      console.error(
        `\n❌ Failed to update ${failures}/${VERSION_TARGETS.length} files. Aborting.`,
      );
      console.error("   Run `git checkout .` to revert partial changes.");
      process.exit(1);
    }
    console.log(
      `\n   ✅ All ${VERSION_TARGETS.length} files updated: ${currentVersion} → ${newVersion}`,
    );

    console.log("   🔄 Running bun install to sync lockfile...");
    const installResult = await run("bun", ["install"], { inherit: true });
    if (installResult.code !== 0) {
      console.error("❌ bun install failed");
      process.exit(1);
    }
    console.log("   ✅ Lockfile synced");
  }
  console.log("");

  // --- Phase 2: CHANGELOG ---
  console.log("📝 Phase 2: Generating CHANGELOG...\n");
  const commits = await getCommitsSinceTag(lastTag);
  if (commits.length === 0) {
    console.log("   ⚠️  No commits since last tag — CHANGELOG section will be empty");
  }
  const sections = classifyCommits(commits);
  const changelogSection = formatChangelogSection(newVersion, sections);

  console.log("   --- Generated CHANGELOG section ---");
  console.log(changelogSection);
  console.log("   --- End ---\n");

  if (isDryRun) {
    console.log("   [dry-run] Would prepend above section to CHANGELOG.md");
  } else {
    updateChangelog(changelogSection);
    console.log("   ✅ CHANGELOG.md updated");
  }
  console.log("");

  // --- Phase 3: Stale version scan ---
  console.log("🔍 Phase 3: Checking for stale version strings...\n");
  const stale = await scanStaleVersion(currentVersion);
  if (stale) {
    console.error(`❌ Found stale version "${currentVersion}" in source files:`);
    console.error(stale);
    if (!isDryRun) {
      console.error("   Aborting. Update these files before releasing.");
      process.exit(1);
    } else {
      console.log("   [dry-run] Would abort here in a real run");
    }
  } else {
    console.log("   ✅ No stale version strings found");
  }
  console.log("");

  // --- Phase 4: Commit ---
  console.log("💾 Phase 4: Committing...\n");
  const filesToStage = [
    ...VERSION_TARGETS.map((t) => t.path),
    "bun.lock",
    "CHANGELOG.md",
  ];

  if (isDryRun) {
    console.log(`   [dry-run] Would commit: chore(release): v${newVersion}`);
    console.log(`   [dry-run] Files: ${filesToStage.join(", ")}`);
  } else {
    await runOrDie("git", ["add", ...filesToStage], "Failed to stage files");
    const commitResult = await run("git", [
      "commit",
      "-m",
      `chore(release): v${newVersion}`,
    ]);
    if (commitResult.code !== 0) {
      console.error("❌ Commit failed (pre-commit hooks?)");
      if (commitResult.stderr.trim()) console.error(commitResult.stderr.trim());
      console.error("   Fix the issues and retry.");
      process.exit(1);
    }
    console.log(`   ✅ Committed: chore(release): v${newVersion}`);
  }
  console.log("");

  // --- Phase 5: Push + Tag + Release ---
  // Non-interactive: no confirmation prompt.
  console.log("🚀 Phase 5: Push, tag & release\n");

  if (isDryRun) {
    console.log("   [dry-run] Would: git push, git tag, git push --tags");
    if (ghAuthed) console.log(`   [dry-run] Would: gh release create v${newVersion}`);
    console.log(`\n✅ Dry run complete for v${newVersion}`);
    process.exit(0);
  }

  console.log("   🔄 Pushing...");
  const pushResult = await run("git", ["push"], { inherit: true });
  if (pushResult.code !== 0) {
    console.error("❌ git push failed");
    console.error("   Recovery commands:");
    console.error("     git push");
    console.error(`     git tag -a v${newVersion} -m "v${newVersion}"`);
    console.error("     git push --tags");
    console.error(
      `     gh release create v${newVersion} --title "v${newVersion}" --notes "..."`,
    );
    process.exit(1);
  }
  console.log("   ✅ Pushed");

  console.log(`   🔄 Creating tag v${newVersion}...`);
  const tagResult = await run("git", [
    "tag",
    "-a",
    `v${newVersion}`,
    "-m",
    `v${newVersion}`,
  ]);
  if (tagResult.code !== 0) {
    console.error(`❌ Failed to create tag v${newVersion}`);
    if (tagResult.stderr.includes("already exists")) {
      console.error(`   Tag already exists. Delete with: git tag -d v${newVersion}`);
    }
    process.exit(1);
  }

  console.log("   🔄 Pushing tag...");
  const pushTagResult = await run("git", ["push", "origin", `v${newVersion}`], {
    inherit: true,
  });
  if (pushTagResult.code !== 0) {
    console.error("❌ git push tag failed");
    console.error(`   Recovery: git push origin v${newVersion}`);
    process.exit(1);
  }
  console.log(`   ✅ Tag v${newVersion} pushed`);

  if (ghAuthed) {
    console.log(`   🔄 Creating GitHub release v${newVersion}...`);
    const releaseResult = await run("gh", [
      "release",
      "create",
      `v${newVersion}`,
      "--title",
      `v${newVersion}`,
      "--notes",
      changelogSection,
    ]);
    if (releaseResult.code !== 0) {
      console.error("⚠️  GitHub release creation failed (tag is pushed)");
      console.error(
        `   Create manually: gh release create v${newVersion} --title "v${newVersion}"`,
      );
    } else {
      const releaseUrl = releaseResult.stdout.trim();
      console.log("   ✅ GitHub release created");
      if (releaseUrl) console.log(`   🔗 ${releaseUrl}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Released v${newVersion}`);
  console.log(`   📋 Commit:  chore(release): v${newVersion}`);
  console.log(`   🏷️  Tag:     v${newVersion}`);
  console.log("=".repeat(50));
}

main().catch((err: unknown) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
