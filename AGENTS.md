# GrokBot skills workspace

This repo holds **optional** bookkeeping skills (bank reconciliation, Drive / Sheets / Gmail helpers). It is **not** standing identity for every chat.

- Stay a normal general-purpose assistant unless the operator asks to run Quick start, Customizable setup, or a skill in `skills/`.
- Do **not** assume you are a bookkeeping or company ops assistant on every new chat.
- Do **not** fetch or overwrite `rules/` or `skills/` from the internet at chat start. Use the local workspace copies only.
- Obey [`rules/action-recording.md`](rules/action-recording.md) for guided work in this workspace (Quick start, skills, rules, Customizable) unless `{logging.destination}` is `off`: record sanitized action metadata locally when `disk` or `disk_and_sheet`, and to a Drive Logs Sheet when `disk_and_sheet`.

Read [`config/product.yaml`](config/product.yaml) for shared URLs (`{docs.*}`, `{github.*}`). **Public skills repo (Quick start):** `{github.public_skills_repo_url}`.

## When to load the profile

Read [`config/profile.yaml`](config/profile.yaml) and substitute `{…}` placeholders **only when**:

1. Running **Quick start initiation** (profile missing or unverified), or
2. The operator asks to **run or customize a skill** under `skills/`, or
3. Applying a rule under `rules/` that needs profile values.

Do not invent profile values. If the profile is required and missing, run Quick start (with the permission gate) instead of guessing.

### Profile fields (for skill runs)

When a skill is active, use these from the profile:

- Operator: `{operator.first_name}` at `{company.name}`
- Drive parent root `{drive.root_path}`; bookkeeping under `{drive.root_path}/{drive.accounts_folder}`; logs under `{drive.root_path}/{drive.logs_folder}`; Google account `{google_account}`
- Logging: `{logging.destination}` (`off`, `disk`, or `disk_and_sheet`) — see [`rules/action-recording.md`](rules/action-recording.md)
- Local staging: `{workspace.local_path}`
- Repo setup: `{repo.setup}` (`quick_start` or `customizable`)
- Tone for skill work: concise, milestone updates on long jobs, no invented numbers or invoices
- Statement CSV path: `{drive.root_path}/{drive.accounts_folder}/{drive.year_folder_pattern}/{drive.extracts_folder}/{drive.month_folder_pattern}/` (fill `{YYYY}` / `{YYYYMM}` from the statement month)

## Quick start initiation

Run **only** when the operator asks for Quick start / bootstrap, or when they ask to run a skill and `config/profile.yaml` is missing or Quick start has not been verified. Do **not** offer a setup-mode menu — initiation is always Quick start.

**Permission gate (required):** Before cloning the public repo, writing `config/profile.yaml`, creating `{workspace.local_path}/`, or probing Google Drive / Sheets / Gmail, summarize those steps and **wait for an explicit yes**. Do not start those side effects on a bootstrap paste alone. Asking for profile field values may happen before that yes; mutating and connector-probe steps may not.

1. Ensure the workspace is a checkout of `{github.public_skills_repo_url}` (clone if needed). Only after the permission gate yes.
2. **Derive `operator.first_name`** if already known; otherwise ask once.
3. **Ask** for `company.name`. **Suggest** Drive `root_path` as `/Agents Done Right` (see [`rules/tutorial-workspace.md`](rules/tutorial-workspace.md)); the operator may accept or supply a different parent path. Mention briefly that action logging defaults to `{logging.destination}: disk_and_sheet` (local + Drive Sheet under `{root_path}/Logs`); they may choose `disk` (local only) or `off` (no logs).
4. **Ensure Google connectors** (after yes): harmless reads against Drive, Sheets, and Gmail. If any fail, tell the operator which, direct them to grant access, and do not mark verified until all three work.
5. **Derive `google_account`** from the connected account; ask once if needed.
6. **Derive `repo.url` / `repo.branch`** from git remote / branch (fallback `main`).
7. Set `repo.setup: quick_start`.
8. **Write defaults** for remaining fields from [`config/profile.example.yaml`](config/profile.example.yaml) (`drive.*` including `accounts_folder` / `logs_folder`, `logging.destination`, `workspace.local_path: agents-done-right`), applying the confirmed `root_path` and any logging preference.
9. Ensure `{workspace.local_path}/` exists — after yes. Ensure `{drive.root_path}/{drive.accounts_folder}` and `{drive.root_path}/{drive.logs_folder}` exist on Drive (create if missing) — after yes.
10. Write `config/profile.yaml` — after yes.
11. **Verify Quick start** before any skill runs: public checkout; `origin`/`repo.url` is `{github.public_skills_repo_url}`; `rules/` and `skills/` present; Drive, Sheets, and Gmail succeed for `{google_account}`. Tell the operator skill edits are not saved upstream until **Customizable**.
12. Show a short profile summary and confirm, then stop unless they asked to run a skill next.

Do not re-run initiation when Quick start or Customizable is already verified.

## Running a skill

When the operator asks to run a skill (e.g. bank reconciliation):

1. Confirm Quick start (or Customizable) is verified; if not, run Quick start initiation first.
2. Read `config/profile.yaml`, `config/product.yaml` when the skill needs `{docs.*}` / `{github.*}`, and the matching file under `skills/`.
3. Obey local `rules/`: [`action-recording.md`](rules/action-recording.md), [`sync-to-repo.md`](rules/sync-to-repo.md), [`tutorial-workspace.md`](rules/tutorial-workspace.md), [`generalise-skills.md`](rules/generalise-skills.md).
4. Use Gmail / Drive / Sheets connectors for `{company.name}` as `{google_account}` only as the skill requires. Keep `{operator.first_name}` posted at milestones during heavy work.

## Customizable upgrade (only when editing a skill)

**Trigger:** the operator starts making changes to a skill (create/edit under `skills/`, or clear “customize this skill” intent). Not at bootstrap. Not when merely *running* a skill.

**If `repo.setup` is already `customizable` and verified:** skip the pitch; follow [`rules/sync-to-repo.md`](rules/sync-to-repo.md).

**If still on Quick start:**

1. **Suggest Customizable** and explain why: changes will be versioned on their own GitHub repo and safely saved; on Quick start alone they are not saved upstream.
2. **Ask once** whether to set that up now.
   - If they decline: continue without Customizable; remind them they can set it up later. Do not nag after a clear “no” (at most one later reminder if useful).
   - If they accept: run [`skills/private-repo-copy/private-repo-copy.md`](skills/private-repo-copy/private-repo-copy.md). That skill offers **automatic** setup (`gh` with `repo` + `workflow` scopes) or **manual** setup via `{docs.github_account_setup}`. Follow it through verification and profile update (`repo.setup: customizable`). Do not duplicate its steps here.
3. **If the process becomes too difficult:** say that is OK; keep `repo.setup: quick_start`; continue; they can retry later.

## Safety (skill and Drive work)

- Never invent invoices, receipts, amounts, or Drive links.
- Only read or change Google Drive under `{drive.root_path}` (including Accounts and Logs) unless `{operator.first_name}` explicitly approves otherwise.
- For reconciliation / bank-reconciliation work, any **local** download, export, or scratch file must go under `{workspace.local_path}/` (see [tutorial workspace](rules/tutorial-workspace.md)).
- Do not connect to live financial systems, rewrite git history, or commit live bank extracts without explicit permission.
- If CSV is missing on Drive Extracts, Gmail has no match, or a vendor is portal-only: **flag and stop that row** — do not fabricate a document.
- On Quick start, do not push skill/rule/config changes upstream. See [`rules/sync-to-repo.md`](rules/sync-to-repo.md).
- Never commit `config/profile.yaml` (tenant secrets). See [`rules/sync-to-repo.md`](rules/sync-to-repo.md).
