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
- **Repo updates:** the daily schedule is owned by a **Grok Bot routine** created at Quick start (see step D.10). Do **not** also nag on every chat open. If the operator asks to check for repo / source updates (or the routine fires), read and follow [`skills/repo-update-check/repo-update-check.md`](skills/repo-update-check/repo-update-check.md). Edit / Pause / Test / Delete routines via the Bot’s Routines UI or by asking the Bot — see [xAI Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations#create-a-routine).

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

In plain language, say you will help them set up bookkeeping helpers that work with their Google Drive and Sheets. Gmail is requested later only if they run a live skill that searches email (the sample demo does not need Gmail). Setup will:

1. Save a few preferences (their name, company, where files should live on Google Drive).
2. Download the shared skills pack into this workspace (if it is not already here).
3. Create a small local settings file and a scratch folder for temporary files.
4. Check that Google Drive and Sheets are connected (read-only checks).
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

Summarize again in one short paragraph what will happen next (download skills if needed, write the settings file, create the scratch folder, check Google Drive and Sheets access, create Accounts and Logs on Drive). Do **not** imply Gmail will be granted during setup. Then **wait** for a button choice:

- **Yes, set this up** (Recommended)
- **Not now**

If **Not now**: stop. Do not clone, write `config/profile.yaml`, create folders, or probe Google. They can paste the bootstrap prompt again later.

Do **not** treat the bootstrap paste alone as permission. Asking for name / company / defaults (A–B) may happen before this yes; mutating and connector-probe steps may not.

#### D. Do the setup (only after Yes)

Keep progress updates short and friendly (“Checking Google Drive…”, “Saving your settings…”). Behind the scenes:

1. Ensure the workspace is a checkout of `{github.public_skills_repo_url}` (clone if needed).
2. **Ensure Google connectors**: harmless reads against Drive and Sheets only. Do **not** probe Gmail during Quick start. If Drive or Sheets fail, say which one in plain language, tell them how to grant access, and do not mark verified until both work.
3. **Derive `google_account`** from the connected account; ask once only if needed.
4. **Derive `repo.url` / `repo.branch`** from git remote / branch (fallback `main`).
5. Set `repo.setup: quick_start`.
6. **Write defaults** for remaining fields from [`config/profile.example.yaml`](config/profile.example.yaml) (`drive.*` including `accounts_folder` / `logs_folder`, `logging.destination`, `workspace.local_path: agents-done-right`), applying the Drive folder and logging choice from step B.
7. Ensure `{workspace.local_path}/` exists. Ensure `{drive.root_path}/{drive.accounts_folder}` and `{drive.root_path}/{drive.logs_folder}` exist on Drive (create if missing).
8. Write `config/profile.yaml`.
9. **Verify Quick start**: public checkout; `origin`/`repo.url` is `{github.public_skills_repo_url}`; `rules/` and `skills/` present; Drive and Sheets succeed for `{google_account}`. Gmail is **not** required for verification. In plain language, say skill customizations are not saved to their own GitHub until they later choose **Customizable** (do not pitch Customizable as a setup-mode menu here).
10. **Repo update state + daily Grok routine** (only after verify succeeds):
    1. Ensure `{workspace.local_path}/` exists. Write `{workspace.local_path}/repo-update-state.yaml` from the **local** `CHANGELOG.md` fingerprint (hash and/or latest `## [x.y.z]` heading) and set `last_checked_at` to now so the first routine run does not false-positive.
    2. **Create a Grok Bot routine** on **this** Bot (xAI [Create a routine](https://docs.x.ai/grok-bot/skills-routines-and-automations#create-a-routine) — not a Cursor Automation or OS cron). Confirm with the operator first (buttons / short choices): owning Bot = this chat’s Bot; schedule default **every day at 9:00 AM** in the Bot Settings timezone (offer change if they want); expected result = changelog check + ask before upgrading the whole repo source; approval boundary = never pull/merge until they say Yes; if public CHANGELOG is unavailable, report failure (do not invent an update).
    3. Then create the routine in plain language, e.g.:

       > Every day at 9:00 AM, run the **Repo update check** skill for this workspace. Compare the public skills repo `CHANGELOG.md` to the last-seen fingerprint in `{workspace.local_path}/repo-update-state.yaml`. If there is no update, say the repo source is up to date (one short line) and stop. If there is an update, summarize the new CHANGELOG sections in this conversation and ask whether to upgrade the full source tree (skills, rules, docs, shared config — not `config/profile.yaml`) — do **not** pull or merge until the operator approves. If the source is unavailable, report the failure instead of inventing an update.

    4. If a routine with the same purpose already exists, **do not** create a duplicate — pause/edit that one instead. A new routine waits for its next scheduled time; offer **Test** once after creation when the UI supports it. Point them at Bot → Routines for Pause / Edit / Delete later.

#### E. Done + optional demo (buttons)

1. Show a **short, plain** summary (name, company, Drive folder, Google account) and confirm Quick start is ready. Mention briefly that a **daily routine** will check for **repo source** updates (upgrade only if they say yes).
2. **Ask once** whether they want a short **bookkeeping demonstration** with sample data (two guided steps; no live bank CSV; Gmail not used; creates a November 2024 practice spreadsheet on Drive). Buttons:

   - **Yes, show me the demo** (Recommended for first-time users)
   - **Skip for now**

   - If **Skip**: acknowledge briefly (use `{operator.first_name}` if known). Then list **what they can run next** in plain language — the two main live prompts (everyday month names; no skill file paths). Shape:

     **What you can run next** — just ask in chat, for example:

     - **Reconcile Bank Statement** (import CSV → categorise → match → find unpaid): `Run Reconcile Bank Statement` or `Reconcile my bank statement for November`
     - **After sheet edits** (Sync spreadsheet mappings): `I have updated the categories` or `I have updated the spreadsheet`

     Point them at [`skills/README.md`](skills/README.md) for sub-skills and other entry points. End with one short line: they can still try the sample demo later by asking to **show the bookkeeping demo**, or paste the two test prompts from the README when they want practice data. Then **stop** (do not nag).
   - If **Yes**: read and follow [`skills/bookkeeping-test/guided-demo.md`](skills/bookkeeping-test/guided-demo.md) immediately in the same chat.
   - If they already asked to run a skill next (and did not ask for the demo), run that skill instead of offering the demo.

The demo ask happens only at the end of a successful initiation, not on every later chat.

## Running a skill

When the operator asks to run a skill (e.g. bank reconciliation):

1. Confirm Quick start (or Customizable) is verified; if not, run Quick start initiation first.
2. Read `config/profile.yaml`, `config/product.yaml` when the skill needs `{docs.*}` / `{github.*}` / `{templates.*}`, and the matching file under `skills/`.
3. Keep obeying all of [`rules/`](rules/) (see **Rules (global)** above); load profile values the skill needs.
4. Use Drive / Sheets connectors for `{company.name}` as `{google_account}` as the skill requires. Use Gmail only when the skill needs **live** email search and no bookkeeping test session is active — before the first Gmail call, probe the connector; if it fails, explain how to grant access in plain language and **stop that email path** (do not invent matches). Keep `{operator.first_name}` posted at milestones during heavy work.

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
