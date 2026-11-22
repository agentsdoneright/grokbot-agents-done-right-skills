---
version: 1.0.0
---
# Tutorial local workspace

Resolve `{workspace.local_path}` from `config/profile.yaml` (default `agents-done-right` at the repo root). Create that directory if it is missing.

For work related to the reconciliation tutorial or the bank-reconciliation skill, any **local workspace save** — download, export, scratch file, temp CSV, PDF pending Drive upload, screenshot, or debug dump — must be written under `{workspace.local_path}/` (subfolders allowed).

**Action logs** (when `{logging.destination}` is not `off`) live under `{workspace.local_path}/action-logs/` (daily JSONL in monthly folders). Those paths are gitignored and must not be committed. See [`rules/action-recording.md`](action-recording.md).

Do **not** scatter those temps in the repo root, under `skills/`, under `docs/`, or only in a system temp path without also keeping a copy under `{workspace.local_path}/`.

## Drive layout under `{drive.root_path}`

Bookkeeping and logs are siblings under the parent Drive root:

- **Accounts root:** `{drive.root_path}/{drive.accounts_folder}` (e.g. `/Agents Done Right/Accounts`)
- **Logs folder:** `{drive.root_path}/{drive.logs_folder}` (e.g. `/Agents Done Right/Logs`)

Google Drive / Sheets / Gmail destinations for reconciliation use the Accounts root and the other `drive.*` keys. Action-recording Sheets (when `{logging.destination}` is `disk_and_sheet`) use the Logs tree. After a local staging file is uploaded or no longer needed for the step, leave it under `{workspace.local_path}/` until the operator deletes that folder to clean up.

### Bootstrap Drive root

During Quick start, **suggest** `{drive.root_path}` as `/Agents Done Right`. The operator may accept that suggestion or supply a different parent path before the profile is written. After confirmation, ensure `{drive.root_path}/{drive.accounts_folder}` and `{drive.root_path}/{drive.logs_folder}` exist (create if missing).

Tracked repo edits the operator asked for (`docs/`, `skills/`, `rules/`, `config/profile.example.yaml`, and similar) are not tutorial staging files and do not belong in `{workspace.local_path}/`.
