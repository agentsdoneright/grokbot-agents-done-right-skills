---
version: 1.0.0
---
# Action recording

Record sanitized metadata about what the agent did while following this workspace’s `AGENTS.md`, skills, or rules (or a straight operator instruction in that context). This is an agent-written log, not platform Enterprise Action Recording.

Read `config/profile.yaml` for `{workspace.local_path}`, `{drive.*}`, `{logging.destination}`, and `{company.name}`.

## When to record

After each action: tool call, shell command, browser navigation, computer-use session summary, connector/MCP call, file transfer, guardrail refuse/allow, skill or rule read, subagent or cloud-agent handoff.

Apply for guided work in this workspace (Quick start, skill runs, rule application, Customizable setup), not only bank reconciliation.

## Guidance provenance (every event)

Include on every event:

- `guidance.kind`: `skill` | `rule` | `user_instruction` | `agents`
- `guidance.id`: repo-relative path (e.g. `skills/bank-reconciliation/monthly-reconciliation.md`, `rules/sync-to-repo.md`) or a short label for `AGENTS.md` / user instruction
- `guidance.version`: frontmatter `version` when present; `unversioned` if the file has no version; omit or `null` for pure `user_instruction`

When several skills/rules apply, use the primary one driving the action.

## Sanitization

**Allowed (metadata only):**

- Tool / connector: name and namespace, outcome, optional duration — **no arguments or payloads**
- Shell: secret-scrubbed command string, exit/outcome — strip tokens, passwords, API keys
- Browser: `scheme://host/path` plus page title — **strip query strings and credentials**
- Computer use: action count, screenshot count, duration — **no screenshots, clicks, or typed text**

**Never store:** tool arguments, file paths, message content, screenshots, clicks, typed text, credentials, or URLs with query/fragment secrets.

## Daily and monthly partitioning

Use the action’s calendar date in **UTC** to fill `{YYYY}`, `{YYYYMM}`, and `{YYYY-MM-DD}`.

Build year/month segments with `{drive.year_folder_pattern}` and `{drive.month_folder_pattern}` (same conventions as Accounts), e.g. `2026` then `Y202611`.

```text
…/Logs/
  2026/
    Y202611/
      2026-11-22.jsonl              # local
      2026-11-22_Action_Log         # Drive Sheet when enabled
```

## Local JSONL (always)

Path:

`{workspace.local_path}/action-logs/{drive.year_folder_pattern}/{drive.month_folder_pattern}/{YYYY-MM-DD}.jsonl`

Create year/month folders if missing. If today’s file does not exist, create it; otherwise append one JSON object per line. Never commit these files (they live under `{workspace.local_path}/`).

Example event:

```json
{
  "ts": "2026-11-22T16:00:00Z",
  "event": "connector_call",
  "outcome": "ok",
  "tool": { "namespace": "plugin-google-drive-google-drive", "name": "search" },
  "guidance": {
    "kind": "skill",
    "id": "skills/bank-reconciliation/monthly-reconciliation.md",
    "version": "1.1.1"
  }
}
```

Flatten the same fields when writing a Sheet row.

## Google Sheet — only when `{logging.destination}` is `disk_and_sheet`

If `{logging.destination}` is `disk`, write local JSONL only; do **not** create or update Drive Logs folders or Sheets.

If `disk_and_sheet`:

1. Ensure `{drive.root_path}/{drive.logs_folder}/{drive.year_folder_pattern}/{drive.month_folder_pattern}/` exists.
2. **One workbook per day.** Title: `{YYYY-MM-DD}_Action_Log` (or `{YYYY-MM-DD}_{company.name}_Action_Log`). Create on the first action of that UTC day; append later events that day to the same workbook. A new day → a new workbook (and a new month folder when the month changes).
3. Append one row per event. Header row (create if missing):

| ts | event | outcome | tool_namespace | tool_name | shell_scrubbed | browser_url | browser_title | computer_actions | computer_screenshots | computer_duration_ms | guidance_kind | guidance_id | guidance_version |

4. Same sanitization as local JSONL. You may batch Sheet appends at end of turn if connector latency requires it, but do not drop events.

## Self-logging

When the only write is appending to the action log, emit a minimal `log_append` event (outcome + guidance) without embedding the log payload (avoid recursion).
