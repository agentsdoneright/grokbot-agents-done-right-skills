---
version: 1.2.0
---
# Action recording

Record sanitized metadata about what the agent did while following this workspace’s `AGENTS.md`, skills, or rules (or a straight operator instruction in that context). This is an agent-written log, not platform Enterprise Action Recording.

This rule and its sheet template live under `rules/action-recording/`.

Read `config/profile.yaml` for `{workspace.local_path}`, `{drive.*}`, `{logging.destination}`, and `{company.name}`.

## Destination (`{logging.destination}`)

| Value | Behavior |
| --- | --- |
| `off` | Do not write action logs (no local JSONL, no Drive Sheet) |
| `disk` | Local JSONL only |
| `disk_and_sheet` | Local JSONL and a daily Google Sheet under Logs |

If `{logging.destination}` is missing, treat it as `disk_and_sheet` (same as `config/profile.example.yaml`). If it is `off`, skip the rest of this rule.

## When to record

After each action: tool call, shell command, browser navigation, computer-use session summary, connector/MCP call, file transfer, guardrail refuse/allow, skill or rule read, subagent or cloud-agent handoff.

Apply for guided work in this workspace (Quick start, skill runs, rule application, Customizable setup), not only bank reconciliation — **except** when destination is `off`.

## Guidance provenance (every event)

Include on every event:

- `guidance.kind`: `skill` | `rule` | `user_instruction` | `agents`
- `guidance.id`: repo-relative path (e.g. `skills/bank-reconciliation/monthly-reconciliation.md`, `rules/action-recording/action-recording.md`) or a short label for `AGENTS.md` / user instruction
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
      2026-11-22_Action_Log         # Drive Sheet from template when enabled
```

## Local JSONL — when destination is `disk` or `disk_and_sheet`

Path:

`{workspace.local_path}/action-logs/{drive.year_folder_pattern}/{drive.month_folder_pattern}/{YYYY-MM-DD}.jsonl`

Create year/month folders if missing. If today’s file does not exist, create it; otherwise append one JSON object per line. Never commit these files — they are gitignored (`**/action-logs/` and `{workspace.local_path}/`).

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
    "version": "1.2.0"
  }
}
```

Map the same fields into the Sheet columns from the template (see below).

## Google Sheet — only when `{logging.destination}` is `disk_and_sheet`

If `{logging.destination}` is `disk`, write local JSONL only; do **not** create or update Drive Logs folders or Sheets.

**Committed template (scrubbed formatting):** `rules/action-recording/Action_Log.xlsx`. Use it so daily log workbooks keep the intended layout and formatting. Never edit the repo template in place, and never leave a filled private copy under `rules/`.

If `disk_and_sheet`:

1. Ensure `{drive.root_path}/{drive.logs_folder}/{drive.year_folder_pattern}/{drive.month_folder_pattern}/` exists.
2. **One workbook per day.** On the first action of that UTC day:
   - Upload a **copy** of `rules/action-recording/Action_Log.xlsx` into that month’s Logs folder.
   - Rename the Drive file to `{YYYY-MM-DD}_Action_Log` (or `{YYYY-MM-DD}_{company.name}_Action_Log`).
   - Convert that `.xlsx` to a **native Google Sheet** so Sheets tools can edit it.
   - Keep the template’s header row and formatting; do not create a blank sheet from scratch.
3. Later events the same day: append rows to that day’s Sheet. A new day → a new workbook from a fresh template copy (and a new month folder when the month changes).
4. Append one data row per event under the existing headers (do not duplicate the header row). Columns match the template:

| ts | event | outcome | tool_namespace | tool_name | shell_scrubbed | browser_url | browser_title | computer_actions | computer_screenshots | computer_duration_ms | guidance_kind | guidance_id | guidance_version |

5. Same sanitization as local JSONL. You may batch Sheet appends at end of turn if connector latency requires it, but do not drop events.

## Self-logging

When the only write is appending to the action log, emit a minimal `log_append` event (outcome + guidance) without embedding the log payload (avoid recursion).
