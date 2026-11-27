# Standing rules

Agents follow these via [`AGENTS.md`](../AGENTS.md) during skill and rule work. This folder is otherwise out of scope unless you explicitly ask an agent to open or change a file here.

- **[Action recording](action-recording/action-recording.md)** — while a skill under `skills/` is active, record sanitized action metadata unless `{logging.destination}` is `off` (local JSONL and optionally a Drive Logs Sheet).
- **[Sync to repo](sync-to-repo.md)** — when and how to save skill, rule, and shared config changes (Quick start vs Customizable).
- **[Tutorial workspace](tutorial-workspace.md)** — local scratch under `{workspace.local_path}/` and Drive Accounts / Logs layout under `{drive.root_path}`.
- **[Generalise skills](generalise-skills.md)** — keep tenant values in profile/product config; version skills and rules instead of hardcoding operator-specific data.
