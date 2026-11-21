# Tutorial local workspace

Resolve `{workspace.local_path}` from `config/profile.yaml` (default `tutorial-workspace` at the repo root). Create that directory if it is missing.

For work related to the reconciliation tutorial or the bank-reconciliation skill, any **local workspace save** — download, export, scratch file, temp CSV, PDF pending Drive upload, screenshot, or debug dump — must be written under `{workspace.local_path}/` (subfolders allowed).

Do **not** scatter those temps in the repo root, under `skills/`, under `docs/`, or only in a system temp path without also keeping a copy under `{workspace.local_path}/`.

Google Drive / Sheets / Gmail destinations still use `{drive.root_path}` and the other `drive.*` keys. After a local staging file is uploaded or no longer needed for the step, leave it under `{workspace.local_path}/` until the operator deletes that folder to clean up.

Tracked repo edits the operator asked for (`docs/`, `skills/`, `rules/`, `config/profile.example.yaml`, and similar) are not tutorial staging files and do not belong in `{workspace.local_path}/`.
