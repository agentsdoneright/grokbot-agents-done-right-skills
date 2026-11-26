# GrokBot skills workspace

This repo holds **optional** bookkeeping skills (bank reconciliation, Drive / Sheets / Gmail helpers). It is **not** standing identity for every chat.

## Rules (global — every agent, every chat)

**All agents must follow every file under [`rules/`](rules/).** These are standing requirements for this workspace, not optional and not limited to skill runs. Read and obey them whenever this `AGENTS.md` applies:

- [`rules/action-recording/action-recording.md`](rules/action-recording/action-recording.md) — while a skill under `skills/` is active, record sanitized action metadata unless `{logging.destination}` is `off` (`disk` = local JSONL; `disk_and_sheet` = local + Drive Logs Sheet from `rules/action-recording/Action_Log.xlsx`). Does **not** apply to ordinary chat or Quick start alone.
- [`rules/sync-to-repo.md`](rules/sync-to-repo.md) — when and how to save skill/rule/config changes
- [`rules/tutorial-workspace.md`](rules/tutorial-workspace.md) — local staging under `{workspace.local_path}/` and Drive Accounts/Logs layout
- [`rules/generalise-skills.md`](rules/generalise-skills.md) — keep tenant values in profile/product config; version skills and rules

If a new file appears under `rules/` (including rule subfolders), follow it too. **Exception:** action-recording applies only during `skills/` runs (see that rule) — do not log every chat just because this workspace has rules.

## Standing behavior

- Stay a normal general-purpose assistant unless the operator asks to run Quick start, Customizable setup, or a skill in `skills/`.
- Do **not** assume you are a bookkeeping or company ops assistant on every new chat.
- Do **not** fetch or overwrite `rules/` or `skills/` from the internet at chat start. Use the local workspace copies only.

Read [`config/product.yaml`](config/product.yaml) for shared URLs (`{docs.*}`, `{github.*}`, `{templates.*}`). **Public skills repo (Quick start):** `{github.public_skills_repo_url}`.

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
- Logging: `{logging.destination}` (`off`, `disk`, or `disk_and_sheet`) — see [`rules/action-recording/action-recording.md`](rules/action-recording/action-recording.md)
- Local staging: `{workspace.local_path}`
- Repo setup: `{repo.setup}` (`quick_start` or `customizable`)
- Tone for skill work: concise, milestone updates on long jobs, no invented numbers or invoices
- Statement CSV path: `{drive.root_path}/{drive.accounts_folder}/{drive.year_folder_pattern}/{drive.extracts_folder}/{drive.month_folder_pattern}/` (fill `{YYYY}` / `{YYYYMM}` from the statement month)

## Quick start initiation

Run **only** when the operator asks for Quick start / bootstrap, or when they ask to run a skill and `config/profile.yaml` is missing or Quick start has not been verified. Do **not** offer a setup-mode menu — initiation is always Quick start. Do not re-run when Quick start or Customizable is already verified.

### How to talk to a new operator

The operator may be **completely new to agents**. For this whole initiation:

- Use short, plain sentences. Prefer everyday words over technical ones (say “your Google Drive folder”, not “root_path”; say “a small settings file”, not “profile YAML”).
- Explain **what is about to happen and why** before each choice. Never dump a numbered checklist of side effects without a plain-language summary first.
- **One decision at a time.** Prefer **clickable choices / buttons** (platform choice UI or AskQuestion when available). If buttons are unavailable, show the same options as a short A / B list and wait for a clear reply.
- Put the **recommended default first** and label it clearly (e.g. “Recommended”). Make accepting defaults the easy path — most operators should finish with two or three clicks plus their company name.
- Do **not** ask them to type paths, logging modes, or folder names unless they explicitly choose “Change something”.
- Do **not** start cloning, writing files, creating folders, or checking Google access until they click the permission **Yes** button (step D).

### Button workflow (follow in order)

#### A. Welcome (no side effects)

In plain language, say you will help them set up bookkeeping helpers that work with their Google Drive, Sheets, and Gmail. Setup will:

1. Save a few preferences (their name, company, where files should live on Google Drive).
2. Download the shared skills pack into this workspace (if it is not already here).
3. Create a small local settings file and a scratch folder for temporary files.
4. Check that Google Drive, Sheets, and Gmail are connected (read-only checks).
5. Create two folders on their Google Drive for Accounts and Logs (under the Drive folder they accept).

Then collect the only free-text you need before defaults:

1. **Company name** — ask once in plain language (“What is your company called?”). Required.
2. **First name** — derive if already known; otherwise ask once (“What first name should I use when I update you?”).

Do **not** ask for Drive path or logging yet.

#### B. Recommended settings (one button decision)

Show the defaults as a simple package (not raw config keys):

| What | Recommended default | Plain meaning |
| --- | --- | --- |
| Google Drive folder | `/Agents Done Right` | A folder on their Drive where Accounts and Logs will live |
| Activity log | Keep a simple log (local + a Sheet under Logs) | Only while running bookkeeping skills — not every chat; can turn off later |
| Scratch folder | `agents-done-right` | Temporary files on this computer; safe to delete later |

Present **buttons** (recommended first):

- **Use recommended settings** (Recommended)
- **Change something**

If they choose **Change something**, ask **one** follow-up with buttons where possible:

- Drive folder: **Keep `/Agents Done Right`** / **I’ll type a different folder**
- Activity log: **Keep a simple log (Recommended)** / **Log on this computer only** / **No activity log**

Then continue. Do not open a long form.

#### C. Permission gate (required — buttons)

Summarize again in one short paragraph what will happen next (download skills if needed, write the settings file, create the scratch folder, check Google access, create Accounts and Logs on Drive). Then **wait** for a button choice:

- **Yes, set this up** (Recommended)
- **Not now**

If **Not now**: stop. Do not clone, write `config/profile.yaml`, create folders, or probe Google. They can paste the bootstrap prompt again later.

Do **not** treat the bootstrap paste alone as permission. Asking for name / company / defaults (A–B) may happen before this yes; mutating and connector-probe steps may not.

#### D. Do the setup (only after Yes)

Keep progress updates short and friendly (“Checking Google Drive…”, “Saving your settings…”). Behind the scenes:

1. Ensure the workspace is a checkout of `{github.public_skills_repo_url}` (clone if needed).
2. **Ensure Google connectors**: harmless reads against Drive, Sheets, and Gmail. If any fail, say which one in plain language, tell them how to grant access, and do not mark verified until all three work.
3. **Derive `google_account`** from the connected account; ask once only if needed.
4. **Derive `repo.url` / `repo.branch`** from git remote / branch (fallback `main`).
5. Set `repo.setup: quick_start`.
6. **Write defaults** for remaining fields from [`config/profile.example.yaml`](config/profile.example.yaml) (`drive.*` including `accounts_folder` / `logs_folder`, `logging.destination`, `workspace.local_path: agents-done-right`), applying the Drive folder and logging choice from step B.
7. Ensure `{workspace.local_path}/` exists. Ensure `{drive.root_path}/{drive.accounts_folder}` and `{drive.root_path}/{drive.logs_folder}` exist on Drive (create if missing).
8. Write `config/profile.yaml`.
9. **Verify Quick start**: public checkout; `origin`/`repo.url` is `{github.public_skills_repo_url}`; `rules/` and `skills/` present; Drive, Sheets, and Gmail succeed for `{google_account}`. In plain language, say skill customizations are not saved to their own GitHub until they later choose **Customizable** (do not pitch Customizable as a setup-mode menu here).

#### E. Done + optional demo (buttons)

1. Show a **short, plain** summary (name, company, Drive folder, Google account) and confirm Quick start is ready.
2. **Ask once** whether they want a short **bookkeeping demonstration** with sample data (three guided steps; no live bank CSV; Gmail not used; creates a November 2024 practice spreadsheet on Drive). Buttons:

   - **Yes, show me the demo** (Recommended for first-time users)
   - **Skip for now**

   - If **Skip**: acknowledge briefly (use `{operator.first_name}` if known). Then list **what they can run next** in plain language — live skills with one example phrase each (everyday month names; no skill file paths). Shape:

     **What you can run next** — just ask in chat, for example:

     - **Reconcile Bank Statement** (import CSV → categorise → match invoices): `Reconcile my bank statement for November`
     - **Find Unpaid Invoices** (unpaid expense + revenue tables on Summary): `Find my unpaid invoices`
     - **Import bank CSV** only: `Import my bank statement CSV for November`
     - **Categorise bank data** only: `Categorise this month’s bank transactions`
     - **Match invoices** only: `Match invoices on my November reconciliation`

     End with one short line: they can still try the sample demo later by asking to **show the bookkeeping demo**, or paste the three test prompts from the README when they want practice data. Then **stop** (do not nag).
   - If **Yes**: read and follow [`skills/bookkeeping-test/guided-demo.md`](skills/bookkeeping-test/guided-demo.md) immediately in the same chat.
   - If they already asked to run a skill next (and did not ask for the demo), run that skill instead of offering the demo.

The demo ask happens only at the end of a successful initiation, not on every later chat.

## Running a skill

When the operator asks to run a skill (e.g. bank reconciliation):

1. Confirm Quick start (or Customizable) is verified; if not, run Quick start initiation first.
2. Read `config/profile.yaml`, `config/product.yaml` when the skill needs `{docs.*}` / `{github.*}` / `{templates.*}`, and the matching file under `skills/`.
3. Keep obeying all of [`rules/`](rules/) (see **Rules (global)** above); load profile values the skill needs.
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
