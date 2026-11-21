# Generalise skills

Whenever you write or edit a skill, take operator-specific values from `config/profile.yaml` instead of writing them into the skill. Write each one as `{section.key}`, the same way `AGENTS.md` does. That covers the operator's name, company, Google account, Drive paths, sheet names, the local tutorial workspace (`{workspace.local_path}`), and any other name or value that belongs to one person or organisation.

Shared product URLs and the public skills repo identity live in [`config/product.yaml`](../config/product.yaml) (committed, not secrets). Use `{docs.*}` and `{github.*}` from that file — for example `{docs.github_account_setup}`, `{github.public_skills_repo_url}`, `{github.public_skills_repo_name}`. Do not hardcode Mintlify or public GitHub URLs into skills.

If a skill needs a **tenant** value the profile does not have yet, add the key to `config/profile.yaml`. Give that key a placeholder in `config/profile.example.yaml`. If the example file does not exist, create it, with every value scrubbed.

If a skill needs a **shared product** URL or constant, add it to `config/product.yaml` instead of `profile.yaml`.

When a skill needs a **local** path for disposable tutorial or reconciliation files, use `{workspace.local_path}` (see `rules/tutorial-workspace.md`). Do not hard-code folder names like `tmp/` or `downloads/` in the skill.

When `profile.yaml` / `product.yaml` are the wrong place for a value, you may add another file under `config/`. Reference that file the same way: point the skill at the config file and its keys, and do not paste the operator's own values into the skill.
