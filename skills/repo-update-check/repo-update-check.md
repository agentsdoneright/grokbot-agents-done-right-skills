---
name: Repo update check
version: 1.1.0
description: >-
  Version 1.1.0. Use when the daily Grok routine for public repo updates fires,
  or when the operator asks to check for repo / source updates or upgrade the
  public skills pack checkout. Fetches the public repo CHANGELOG.md, compares a
  fingerprint to `{workspace.local_path}/repo-update-state.yaml`, asks before
  upgrading the whole tracked source tree (skills, rules, AGENTS.md, docs,
  shared config, scripts — not `config/profile.yaml` or operator `custom/`),
  and when skills are customized asks whether to merge those paths. Does not
  invent changelog entries or upgrades.
---
# Repo update check

Read [`config/profile.yaml`](../../config/profile.yaml) for `{workspace.local_path}` and `{repo.setup}` / `{repo.url}` / `{repo.branch}`. Read [`config/product.yaml`](../../config/product.yaml) for `{github.public_skills_repo_url}`, `{github.public_skills_repo_owner}`, `{github.public_skills_repo_name}`.

**Triggers:** the **daily Grok routine** created at Quick start; or the operator asks to “check for repo updates”, “check for source updates”, “upgrade the skills pack”, or similar.

**What an upgrade updates:** the **whole public source tree** in this checkout — `skills/`, `rules/`, `AGENTS.md`, `README.md`, `CHANGELOG.md`, `docs/`, committed `config/` (e.g. `product.yaml`, `profile.example.yaml`), Apps Script under skills, and other tracked files from the public repo. **Never** overwrite or commit `config/profile.yaml`. **Never** delete or overwrite operator content under `custom/` (skills, rules, routines overlays) — treat `custom/` as operator-owned.

**Approval boundary:** do **not** pull, merge, reset, or overwrite source files until the operator explicitly chooses **Yes, upgrade** (and any merge choices below). Never invent updates.

**Missing source:** if the public CHANGELOG cannot be fetched (network, 404, rate limit), report the failure in plain language and **stop** — do not use a stale guess that an update exists.

## State file

Path: `{workspace.local_path}/repo-update-state.yaml` (create the folder if needed). Schema:

```yaml
last_seen_changelog_fingerprint: "<hash-or-latest-version-heading>"
last_seen_changelog_heading: "## [x.y.z] - YYYY-MM-DD"   # optional human hint
last_checked_at: "YYYY-MM-DDTHH:MM:SSZ"                 # optional
```

Fingerprint = a stable hash of the full public `CHANGELOG.md` body **or** the first `## [x.y.z]` heading line (prefer hashing the full file when practical; always store the latest heading for summaries).

Quick start initializes this from the **local** `CHANGELOG.md` so the first routine run does not false-positive. If an older `skills-update-state.yaml` exists, migrate its fields into `repo-update-state.yaml` and prefer the new path going forward.

## 1. Fetch public CHANGELOG

1. Fetch raw `CHANGELOG.md` from the public skills repo default branch, e.g.  
   `https://raw.githubusercontent.com/{github.public_skills_repo_owner}/{github.public_skills_repo_name}/main/CHANGELOG.md`  
   (try `master` only if `main` fails). Prefer `{github.public_skills_repo_url}` to derive owner/name; do not hardcode a different repo.
2. Compute fingerprint + latest `## […]` heading.
3. Load the state file (if missing, treat fingerprint as empty and proceed as “newer”).

## 2. Compare

- **Same fingerprint as `last_seen_changelog_fingerprint`:** say one short line that the repo source is up to date; set `last_checked_at`; stop.
- **Different / newer:** continue to section 3. Summarize **new** CHANGELOG sections above the previously seen heading (or the new top section if the old heading is gone) in plain language — short bullets, not the whole file.

## 3. Ask to upgrade (required)

Buttons (recommended first):

- **Yes, upgrade** (Recommended when they want the latest)
- **Not now**

If **Not now:** leave `last_seen_changelog_fingerprint` unchanged; optionally set `last_checked_at`; stop (the next routine run will offer again while the public changelog still differs).

If **Yes, upgrade:** continue.

## 4. Detect customized skills

Prefer **`custom/skills/`**: any non-empty overlay under `custom/skills/` (beyond `.gitkeep`) counts as customized for that skill path. Also treat a skill as **customized** when its directory under stock `skills/` (legacy in-place edits) differs from the same paths on the **public** repo default branch.

How to compare stock paths (prefer in order):

1. Ensure a git remote pointing at `{github.public_skills_repo_url}` exists (name it `public` or `upstream` if missing); `git fetch` that remote; `git diff public/main...HEAD -- skills/<dir>` (or the remote’s default branch).
2. Or download / compare public tree for that path via GitHub when git fetch is unavailable.

Ignore `config/profile.yaml`. Do not treat “only behind public with no local edits” as customized — customized means local skill content is **not identical** to public **and** is not simply an older clean checkout of the same public files (if the whole tree is clean and only behind, and `custom/skills/` has no overlays, there are **no** customized skills; a fast-forward/pull is enough).

List customized skills by **skill name** (frontmatter `name` or folder name) for the operator. When merging, leave `custom/` untouched unless the operator explicitly asks to change an overlay.

## 5. Apply upgrade

### No customized skills

- **`repo.setup: quick_start`:** `git pull` (or equivalent) on `{repo.branch}` from the public origin so the **full** tracked source tree updates. Never overwrite `config/profile.yaml`.
- **`repo.setup: customizable`:** fetch public; merge public default branch into the private checkout for the full source tree. Resolve what you can; if unclear conflicts remain, ask. Never overwrite `config/profile.yaml` or operator `custom/` content. Do not push to the private remote unless the operator later asks to save (see [`rules/sync-to-repo.md`](../../rules/sync-to-repo.md)).

### Has customized skills

List them. Buttons:

- **Merge all** — bring public updates into every customized skill path, preserving local edits where possible; on conflict, stop and ask for that skill. Still update the rest of the source tree from public.
- **Ask per skill** — for each customized skill, ask Merge / Keep mine (skip that path) / Cancel upgrade. Still update non-skipped paths and the rest of the tree.
- **Skip customized (update everything else)** — update the rest of the source tree from public (`rules/`, docs, shared config, non-customized skills, etc.); leave customized stock skill directories and all of `custom/` untouched.
- **Cancel upgrade** — stop; leave fingerprint unchanged.

After merges, briefly confirm what was updated vs left alone.

## 6. Finish

On successful upgrade (including skip-customized partial update):

1. Set `last_seen_changelog_fingerprint` (and heading) from the **now-local** or freshly fetched public CHANGELOG that matches the tree you applied.
2. Set `last_checked_at`.
3. Tell the operator in plain language that the **repo source** was updated (and which customized skills were merged or skipped).

If upgrade failed partway: report what succeeded and what did not; do not claim the fingerprint is current unless the changelog-aligned files were applied.
