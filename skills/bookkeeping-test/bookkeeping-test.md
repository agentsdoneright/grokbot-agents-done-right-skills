---
name: Bookkeeping test
version: 1.0.0
description: >-
  Version 1.0.0. Use when the user wants to run bookkeeping skills with sample /
  test data, try fixtures, or advance a bookkeeping test phase. Stages Drive CSV
  fixtures and writes `{workspace.local_path}/bookkeeping-test-session.yaml` so
  Import, Categorise, Match invoices, and Unpaid invoices use a fixed Nov 2024
  month and local EML “inbox” instead of live Gmail. Does not itself import,
  categorise, match, or fill unpaid tables — only sets up data, then tells the
  operator which live skill to run next. Phases: (1) stage bank-statement.csv +
  recon inbox/sent EMLs; (2) add Cobalt Mail EML to inbox; (3) stage
  bank-statement-with-payment.csv into Extracts only.
---
# Bookkeeping test (phased setup)

This skill **only stages fixtures** and maintains a test session file. It does **not** run Import, Categorise, Match invoices, or Unpaid invoices.

Read [`config/profile.yaml`](../../config/profile.yaml) for `{drive.*}`, `{workspace.local_path}`, `{company.name}`. Load Google Drive when staging CSVs. Ensure `{workspace.local_path}/` exists before writing the session file.

**Expected results checklist:** [`expected-results.md`](expected-results.md) — point the operator (or compare after live-skill runs) at the section for the phase just completed. Live skills do not auto-run pass/fail.

## Session file

Path: `{workspace.local_path}/bookkeeping-test-session.yaml`

Live skills ([`import-bank-csv.md`](../bank-reconciliation/import-bank-csv.md), [`categorise-bank.md`](../bank-reconciliation/categorise-bank.md), [`match-invoices.md`](../bank-reconciliation/match-invoices.md), [`unpaid-invoices.md`](../unpaid-invoices/unpaid-invoices.md)) read this file when `active: true`.

Write or update it on every phase. Example after Phase 1:

```yaml
active: true
phase: 1
today: "2024-11-25"
statement_month: "202411"
statement_year: "2024"
company_addressee_override: "Demo Company Ltd"
inbox_emls:
  - skills/bank-reconciliation/test-data/emails/*.eml
sent_emls:
  - skills/bank-reconciliation/test-data/emails/sent/*.eml
payment_csv_staged: false
```

- `inbox_emls` / `sent_emls`: repo-relative globs or paths. Expand globs when listing files; do not include `sent/` under inbox.
- Fixture paths are committed sample data — not disposable `{workspace.local_path}` copies (except the session yaml itself).
- To end testing, set `active: false` (or delete the file) when the operator asks to leave test mode.

## Which phase to run

- Operator says **phase 1** / start test / sample data / try with test data → **Phase 1**.
- Operator says **phase 2** → **Phase 2** (require existing session with `phase` ≥ 1).
- Operator says **phase 3** → **Phase 3** (require existing session with `phase` ≥ 2).
- If unclear, ask which phase (1, 2, or 3).

## Shared Drive layout (all phases)

Under `{drive.root_path}/{drive.accounts_folder}`:

- Year folder `{drive.year_folder_pattern}` with `{YYYY}` = `2024`
- Extracts folder `{drive.extracts_folder}` inside the year folder
- Month folder `{drive.month_folder_pattern}` with `{YYYYMM}` = `202411` (for the sheet; Import creates/copies the sheet)

Create year / extracts / month folders if missing when staging CSVs. Do **not** create or edit the Google Sheet in this skill (Import owns that).

Extracts destination for CSVs:

`{drive.root_path}/{drive.accounts_folder}/{drive.year_folder_pattern}/{drive.extracts_folder}/{drive.month_folder_pattern}/`

Prefer a single active bank CSV name in that folder (e.g. `bank-statement.csv`). When replacing for Phase 3, overwrite that file’s contents with the payment fixture (or replace the file) so Import picks up the payment extract without ambiguity.

## Phase 1 — Initial statement + recon inbox

1. Ensure Drive year / Extracts / `202411` month folders exist.
2. Copy `skills/bank-reconciliation/test-data/bank-statement.csv` into the Extracts month folder (overwrite any prior test CSV in that folder).
3. Write the session file with `phase: 1`, `today: "2024-11-25"`, statement `2024`/`202411`, `company_addressee_override: "Demo Company Ltd"`, inbox = `skills/bank-reconciliation/test-data/emails/*.eml` (not under `sent/`), sent = `skills/bank-reconciliation/test-data/emails/sent/*.eml`, `payment_csv_staged: false`.
4. **Stop.** Do not import, categorise, or match.

**Tell the operator to run, in order:**

1. **Import bank CSV**
2. **Categorise bank data**
3. **Match invoices**

Then return here for **Phase 2**. Point them at [`expected-results.md`](expected-results.md) § After Phase 1 live skills.

## Phase 2 — Add unpaid Cobalt invoice to inbox

1. Require session `active: true` and `phase` ≥ 1. If missing, stop and tell the operator to run Phase 1 first.
2. Update the session file: set `phase: 2`. Keep existing inbox/sent entries. **Append** (do not remove recon EMLs):

   - `skills/unpaid-invoices/test-data/emails/01-cobalt-mail.eml`

   Prefer listing explicit paths after expansion so Cobalt is clearly included, e.g. each recon `*.eml` path plus the Cobalt path.
3. Do **not** stage a new CSV. Do **not** edit the Google Sheet or Gmail.
4. **Stop.**

**Tell the operator to run: Unpaid expense invoices.** Then return for **Phase 3**. Point at [`expected-results.md`](expected-results.md) § After Phase 2 live skill.

## Phase 3 — Stage payment bank CSV

1. Require session `active: true` and `phase` ≥ 2. If missing, stop and tell the operator to run Phase 2 first.
2. Copy **only** `skills/unpaid-invoices/test-data/bank-statement-with-payment.csv` into the Extracts month folder, replacing the active bank CSV Import will read (overwrite `bank-statement.csv` contents or replace the file so Import uses the payment extract).
3. Update the session file: set `phase: 3`, `payment_csv_staged: true`. Keep inbox/sent as after Phase 2 (include Cobalt).
4. Do **not** edit the Google Sheet. Do **not** import, categorise, or run unpaid here.
5. **Stop.**

**Tell the operator to run, in order:**

1. **Import bank CSV** (re-paste the payment CSV)
2. **Categorise bank data** (new Cobalt debit row)
3. **Unpaid expense invoices** (should settle Cobalt)

Point at [`expected-results.md`](expected-results.md) § After Phase 3 live skills.

## Report (every phase)

Include: phase number; session file path; what was staged (CSV path on Drive and/or inbox EML list); confirmation that live skills were **not** executed; the exact next live skill(s) to run.
