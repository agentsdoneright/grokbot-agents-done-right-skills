---
version: 1.1.0
---
# Save rules, skills, and shared config

Read `repo.setup` and `{custom.auto_save_new}` from `config/profile.yaml` first. Missing `custom.auto_save_new` → treat as **true**.

## Quick start (`repo.setup: quick_start`)

Do **not** save changes to `{repo.url}` when the remote is the public skills repo or setup is still Quick start. Skill/rule/config customizations are not saved upstream in this mode.

If the operator is creating or editing a skill, follow the **Customizable upgrade** flow in `AGENTS.md` (suggest once, explain that Customizable keeps their edits safely saved under `custom/` on their own copy, run `skills/private-repo-copy/private-repo-copy.md` if they opt in — automatic via `gh` or manual via `{docs.github_account_setup}` from `config/product.yaml`). Allow decline or abandon. Do not save upstream until Customizable is verified.

## Customizable (`repo.setup: customizable`, verified)

**Edit targets:** create and edit under [`custom/`](../custom/) only (`custom/skills/`, `custom/rules/`, `custom/routines/`). Do **not** modify stock `skills/`, `rules/`, or `routines/` for operator customizations. See [`custom-source-of-truth.md`](custom-source-of-truth.md).

Speak in plain language for a non-technical operator. Prefer “save” over git terms such as “commit”, “push”, “branch”, or “remote”.

### When a NEW custom artifact was just created

If the agent just created a **new** file under `custom/skills/`, `custom/rules/`, or `custom/routines/` and `{custom.auto_save_new}` is true: **must** run the save flow below as soon as the create is complete (still confirm the save message). Do not leave that new artifact unsaved.

If `{custom.auto_save_new}` is false: write under `custom/` and fall through to the recommend-when-done flow.

### Recommend when finished (edits / rounds)

Do **not** save automatically after every small edit. When the operator has been creating or editing under `custom/`, or scrubbed shared config (`config/profile.example.yaml`, `config/product.yaml`, or other shared files under `config/`), **recommend** that they save once they believe they are finished with those changes — unless the auto-save-new path above already required an immediate save.

### What to recommend

1. **Offer to save** — If they think the current round of changes is done (or auto-save-new requires it), suggest saving so the updates are kept safely on their private copy. Do not nag repeatedly; one clear offer when the work looks complete is enough. If they say they are not done yet and auto-save-new does not apply, continue editing and offer again later.

2. **Suggest a short save message** — Propose a clear, plain-language summary of what changed (what a future reader would need to know). Ask them to proceed with that message **or** to supply their own. Do not save until they confirm a message.

3. **Suggest a version number (skills)** — When the changes include a skill under `custom/skills/` (or rarely stock `skills/` if a maintainer edit) and the operator has **not** already updated that skill’s `version` (and matching `Version X.Y.Z.` in `description`), recommend a new semver bump (patch / minor / major as appropriate; see [`rules/generalise-skills.md`](generalise-skills.md)). Ask whether to apply it.
   - If they agree: update the skill’s `version` and the `Version X.Y.Z.` prefix in `description` **before** saving.
   - If they decline or already set the version themselves: leave their version as-is.
   - For rule-only, routine-only, or config-only changes with no skill edit, skip the skill version step. Follow [`rules/generalise-skills.md`](generalise-skills.md) for changelog / project version when a significant release is intended.

### After they confirm

Only after the operator agrees to save **and** confirms (or replaces) the message:

1. Apply any agreed skill version bump.
2. Commit the changes to `{repo.branch}` with the confirmed message — typically `custom/**` (and scrubbed shared config if that changed). Do not stage stock skill/rule trees for operator customizations.
3. Save them upstream to `{repo.url}`. If there is a merge conflict while saving upstream, resolve what you can and finish saving. If some conflicts are unclear, ask the operator.

**Never** stage or commit `config/profile.yaml` (tenant secrets; gitignored). Keep the operator’s live profile local only. Commit `config/profile.example.yaml` when its placeholders change — not the filled-in profile.
