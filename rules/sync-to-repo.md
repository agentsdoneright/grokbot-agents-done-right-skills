# Commit and push rules, skills, and config

Read `repo.setup` from `config/profile.yaml` first.

## Quick start (`repo.setup: quick_start`)

Do **not** commit and push to `{repo.url}` when the remote is the public skills repo or setup is still Quick start. Skill/rule/config customizations are not saved upstream in this mode.

If the operator is creating or editing a skill, follow the **Customizable upgrade** flow in `AGENTS.md` (suggest once, explain versioning, run `skills/private-repo-copy/private-repo-copy.md` if they opt in — automatic via `gh` or manual via `{docs.github_account_setup}` from `config/product.yaml`). Allow decline or abandon. Do not push until Customizable is verified.

## Customizable (`repo.setup: customizable`, verified)

If you update or create a new rule or skill locally, or you change `config/profile.example.yaml`, `config/product.yaml`, or other **scrubbed shared** config under `config/`, you MUST:

1. Commit the changes to `{repo.branch}` with an appropriate comment detailing change
2. Push the changes to `{repo.url}`. If there is a merge conflict while attempting to push, merge the changes as best as you can and then push the merged changes. If there are some conflicts that you are unsure about the merge then ask me.

**Never** stage or commit `config/profile.yaml` (tenant secrets; gitignored). Keep the operator’s live profile local only. Commit `config/profile.example.yaml` when its placeholders change — not the filled-in profile.
