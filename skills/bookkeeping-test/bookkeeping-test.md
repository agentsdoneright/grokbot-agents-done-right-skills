---
name: Bookkeeping test
version: 1.1.0
description: >-
  Version 1.1.0. Use when the user wants to stage bookkeeping test fixtures only
  (phase 1 / 2 / 3), or debug sample data setup. Preferred operator entry points
  are the bundles: Reconcile Bank Statement Test, Find Unpaid Invoices Test, and
  Update Bank Statement Test. This skill stages Drive CSVs and writes
  `{workspace.local_path}/bookkeeping-test-session.yaml` so Import, Categorise,
  Match invoices, and Find Unpaid Invoices use Nov 2024 and local EML inboxes.
  Does not itself import, categorise, match, or find unpaid — only sets up data
  unless a bundle skill continues after staging.
---
# Bookkeeping test (phased setup)

**Preferred:** run the orchestrator skills instead of this file alone. After Quick start, [`guided-demo.md`](guided-demo.md) coaches the three bundles one paste at a time.

| Bundle | Stages | Then runs |
| --- | --- | --- |
| [`reconcile-bank-statement-test.md`](reconcile-bank-statement-test.md) | Phase 1 | Reconcile Bank Statement |
| [`find-unpaid-invoices-test.md`](find-unpaid-invoices-test.md) | Phase 2 | Find Unpaid Invoices |
| [`update-bank-statement-test.md`](update-bank-statement-test.md) | Phase 3 | Import → Categorise → Match invoices → Find Unpaid Invoices |

This skill **only stages fixtures** and maintains a test session file. When invoked alone, it does **not** run Import, Categorise, Match invoices, or Find Unpaid Invoices — it stops after staging and tells the operator the next step (or the matching bundle).

Read [`config/profile.yaml`](../../config/profile.yaml) for `{drive.*}`, `{workspace.local_path}`, `{company.name}`. Load Google Drive when staging CSVs. Ensure `{workspace.local_path}/` exists before writing the session file.

**Expected results checklist:** [`expected-results.md`](expected-results.md).

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

- Operator says **phase 1** only / stage fixtures only → **Phase 1** (prefer **Reconcile Bank Statement Test** for the full first segment).
- Operator says **phase 2** → **Phase 2** (require existing session with `phase` ≥ 1; prefer **Find Unpaid Invoices Test**).
- Operator says **phase 3** → **Phase 3** (require existing session with `phase` ≥ 2; prefer **Update Bank Statement Test**).
- “Try with sample / test data” without a phase → suggest **Reconcile Bank Statement Test**.
- If unclear, ask which phase (1, 2, or 3) or which bundle.

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
4. When this skill runs **alone**: **Stop.** Do not import, categorise, or match. Tell the operator to run **Reconcile Bank Statement** (or **Reconcile Bank Statement Test** if they have not staged yet — already done) / Import → Categorise → Match, then **Find Unpaid Invoices Test**. Point at [`expected-results.md`](expected-results.md) § After Phase 1.

When called from **Reconcile Bank Statement Test**, return after step 3 so the bundle can continue.

## Phase 2 — Add unpaid Cobalt + grace-pending Lumen invoices to inbox

1. Require session `active: true` and `phase` ≥ 1. If missing, stop and tell the operator to run **Reconcile Bank Statement Test** (or Phase 1) first.
2. Update the session file: set `phase: 2`. Keep existing inbox/sent entries. **Append** (do not remove recon EMLs):

   - `skills/unpaid-invoices/test-data/emails/01-cobalt-mail.eml` (outside grace → unpaid)
   - `skills/unpaid-invoices/test-data/emails/02-lumen-analytics.eml` (within 4 working-day grace → pending)

   Prefer listing explicit paths after expansion so both are clearly included, e.g. each recon `*.eml` path plus Cobalt and Lumen.
3. Do **not** stage a new CSV. Do **not** edit the Google Sheet or Gmail.
4. When this skill runs **alone**: **Stop.** Tell the operator to run **Find Unpaid Invoices**. Point at [`expected-results.md`](expected-results.md) § After Phase 2.

When called from **Find Unpaid Invoices Test**, return after step 3 so the bundle can continue.

## Phase 3 — Stage payment bank CSV

1. Require session `active: true` and `phase` ≥ 2. If missing, stop and tell the operator to run **Find Unpaid Invoices Test** (or Phase 2) first.
2. Copy **only** `skills/unpaid-invoices/test-data/bank-statement-with-payment.csv` into the Extracts month folder, replacing the active bank CSV Import will read (overwrite `bank-statement.csv` contents or replace the file so Import uses the payment extract).
3. Update the session file: set `phase: 3`, `payment_csv_staged: true`. Keep inbox/sent as after Phase 2 (include Cobalt and Lumen).
4. Do **not** edit the Google Sheet. Do **not** import, categorise, match, or run Find Unpaid Invoices here.
5. When this skill runs **alone**: **Stop.** Tell the operator to run **Import → Categorise → Match invoices → Find Unpaid Invoices** (or **Update Bank Statement Test**). Point at [`expected-results.md`](expected-results.md) § After Phase 3.

When called from **Update Bank Statement Test**, return after step 3 so the bundle can continue.

## Report (every phase)

Include: phase number; session file path; what was staged (CSV path on Drive and/or inbox EML list); whether live skills were left for a bundle or for the operator; the exact next skill(s) or bundle to run.
