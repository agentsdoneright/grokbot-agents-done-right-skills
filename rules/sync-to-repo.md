# Save rules, skills, and shared config

Read `repo.setup` from `config/profile.yaml` first.

## Quick start (`repo.setup: quick_start`)

Do **not** save changes to `{repo.url}` when the remote is the public skills repo or setup is still Quick start. Skill/rule/config customizations are not saved upstream in this mode.

If the operator is creating or editing a skill, follow the **Customizable upgrade** flow in `AGENTS.md` (suggest once, explain that Customizable keeps their edits safely saved on their own copy, run `skills/private-repo-copy/private-repo-copy.md` if they opt in — automatic via `gh` or manual via `{docs.github_account_setup}` from `config/product.yaml`). Allow decline or abandon. Do not save upstream until Customizable is verified.

## Customizable (`repo.setup: customizable`, verified)

Do **not** save automatically after every edit. When the operator has been creating or editing a skill, rule, or scrubbed shared config (`config/profile.example.yaml`, `config/product.yaml`, or other shared files under `config/`), **recommend** that they save once they believe they are finished with those changes.

Speak in plain language for a non-technical operator. Prefer “save” over git terms such as “commit”, “push”, “branch”, or “remote”.

### What to recommend

1. **Offer to save** — If they think the current round of changes is done, suggest saving so the updates are kept safely on their private copy. Do not nag repeatedly; one clear offer when the work looks complete is enough. If they say they are not done yet, continue editing and offer again later.

2. **Suggest a short save message** — Propose a clear, plain-language summary of what changed (what a future reader would need to know). Ask them to proceed with that message **or** to supply their own. Do not save until they confirm a message.

3. **Suggest a version number (skills)** — When the changes include a skill under `skills/` and the operator has **not** already updated that skill’s `version` (and matching `Version X.Y.Z.` in `description`), recommend a new semver bump (patch / minor / major as appropriate; see [`rules/generalise-skills.md`](generalise-skills.md)). Ask whether to apply it.
   - If they agree: update the skill’s `version` and the `Version X.Y.Z.` prefix in `description` **before** saving.
   - If they decline or already set the version themselves: leave their version as-is.
   - For rule-only or config-only changes with no skill edit, skip the skill version step. Follow [`rules/generalise-skills.md`](generalise-skills.md) for changelog / project version when a significant release is intended.

### After they confirm

Only after the operator agrees to save **and** confirms (or replaces) the message:

1. Apply any agreed skill version bump.
2. Commit the changes to `{repo.branch}` with the confirmed message.
3. Save them upstream to `{repo.url}`. If there is a merge conflict while saving upstream, resolve what you can and finish saving. If some conflicts are unclear, ask the operator.

**Never** stage or commit `config/profile.yaml` (tenant secrets; gitignored). Keep the operator’s live profile local only. Commit `config/profile.example.yaml` when its placeholders change — not the filled-in profile.
