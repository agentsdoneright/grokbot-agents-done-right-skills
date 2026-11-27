---
name: Import bank CSV
version: 1.2.0
description: >-
  Version 1.2.0. Use when the user wants to import or paste the latest bank
  statement CSV into their Google Sheets reconciliation workbook: prepare the
  month Drive folders, create each new month sheet by Drive-copying the
  version-matched shared template (`{templates.reconciliation_sheet_version}` /
  `{templates.reconciliation_version_folder_id}`), overlay lookup tabs from the
  prior month when present, ensure the Summary checkbox Apps Script files match
  the repo `.gs` set, and paste the CSV into the raw import columns only. Does
  not fill Date, Counterparty, Category, Credit, Debit, or Invoice columns —
  run Categorise bank data next (or the one-shot Reconcile Bank Statement
  wrapper). If `{workspace.local_path}/bookkeeping-test-session.yaml` is active,
  use that session’s statement month and the CSV already staged in Extracts.
---
# Import bank CSV

Do this Drive work under `{drive.root_path}/{drive.accounts_folder}`. Use the Google Drive and Google Sheets connectors (load the google-drive and google-sheets skills first). Read [`config/product.yaml`](../../config/product.yaml) for `{templates.*}` (and `{docs.*}` / `{github.*}` when needed).

If you must save a CSV or other file **locally** before uploading to Drive (or as a scratch copy), write it under `{workspace.local_path}/` (see `rules/tutorial-workspace.md`). Create that folder if needed. Do not leave tutorial temps in the repo root or under `skills/`.

**New-month workbook template:** every new month uses the shared Google Sheet for `{templates.reconciliation_sheet_version}` from Drive folder `{templates.reconciliation_version_folder_id}` (Sheet pin `{templates.reconciliation_sheet_id}` / `{templates.reconciliation_sheet_url}` in `config/product.yaml`). **Drive `copy_file`** that Sheet into the month folder and rename to `{drive.sheet_title_pattern}`; then copy lookup-tab **data** from the previous month when it exists. Never edit the source template; only the month copy. Do **not** copy the entire previous month workbook.

**Checkbox date stamps (agent-only):** after creating or opening this month’s native sheet, follow **section 1b**. Do **not** mention Apps Script, `.gs` files, or paste instructions to the operator when the script is already present and working.

**Next skill:** after a successful import, tell the operator to run [`categorise-bank.md`](categorise-bank.md). For Import → Categorise → Match in one go, use [`reconcile-bank-statement.md`](reconcile-bank-statement.md).

## Test session (optional)

At the start of the run, check for `{workspace.local_path}/bookkeeping-test-session.yaml`. If it exists and `active` is true:

- Use `statement_year` / `statement_month` from the session (fixture default: `2024` / `202411`) instead of guessing “last month.”
- Prefer the bank CSV already staged in that month’s Extracts folder by [`skills/bookkeeping-test/bookkeeping-test.md`](../bookkeeping-test/bookkeeping-test.md). Do not invent another CSV or re-copy fixtures yourself.
- Sheet titles still use `{company.name}` from the profile.

If no active session file, resolve the statement month from the operator (or last calendar month) as usual.

## 1. Prepare the month's folder and sheet

- **Year and month folders.** The year folder is `{drive.year_folder_pattern}` under `{drive.root_path}/{drive.accounts_folder}` (`{YYYY}` is the year of the month being reconciled). If that year folder does not exist, create it, and create its `{drive.extracts_folder}` subfolder. Then create the month folder `{drive.month_folder_pattern}` inside the year folder if it does not exist (`{YYYYMM}` is the statement month).
- **CSV.** Look first for the bank CSV in `{drive.root_path}/{drive.accounts_folder}/{drive.year_folder_pattern}/{drive.extracts_folder}/{drive.month_folder_pattern}/`. If it is not there, ask the user for it. When the user provides it, save it into that Drive folder, creating the folder if needed, before importing. If you stage the file locally first, put it under `{workspace.local_path}/` then upload to Drive. When a test session is active and a CSV is already in that Extracts folder, use it.
- **Starting sheet.**
  - **If this month's sheet already exists** (re-import, e.g. after Test Phase 3 staged a new CSV): open it; clear the raw CSV data area (and any prior reconciliation column data that would be stale relative to a full CSV replace) on the transactions tab before pasting the new CSV; keep headers and reference tabs. Do not create a second sheet for the same month unless the operator asks. Then run **section 1b**.
  - **If this month's sheet does not exist (new month):** create it from the **versioned template**, then overlay lookups from the prior month when present. Never copy the whole previous workbook.
    1. Read `{templates.reconciliation_sheet_version}` from `config/product.yaml` (e.g. `1.0.0`).
    2. Open Drive folder `{templates.reconciliation_version_folder_id}`. Confirm the folder’s **name equals** that version string. If the folder is missing, inaccessible, or named differently → **stop**. Tell the operator in plain language that this skills pack needs template version `{templates.reconciliation_sheet_version}`, how to open/request access to that folder, and to retry Import. Do not invent a blank workbook or use a different version folder.
    3. Resolve the template Google Sheet inside that folder: prefer `{templates.reconciliation_sheet_id}` when that file is in the folder; otherwise list the folder and pick the native Google Spreadsheet. If none → **stop** (same plain-language access / missing-template guidance). Do **not** edit the source template.
    4. Drive **`copy_file`** that Sheet into this month's folder under `{drive.root_path}/{drive.accounts_folder}/{drive.year_folder_pattern}/{drive.month_folder_pattern}/`. Set the copy’s name to `{drive.sheet_title_pattern}` (fill `{YYYYMM}` with the statement month and `{company_name}` with `{company.name}`). The template is already a **native Google Sheet** — do **not** upload or convert an `.xlsx`.
       - If `copy_file` fails (permission, not found, or access denied): **stop**. Tell the operator to open `{templates.reconciliation_sheet_url}`, ensure they can view the file (request access if needed), then retry Import.
    5. **Lookup tabs from previous month (when present).** Look for the previous month's reconciliation sheet in that month's folder (`{drive.month_folder_pattern}` under its own `{drive.year_folder_pattern}`). For January, the previous month's folder is in the previous year's folder.
       - **If a previous month's sheet exists:** copy **data rows only** (keep the new template’s header row and layout) from these tabs into the new workbook: `Categories` (including Type, Invoice Required), `Counterparties`, `Counterparty-Match`, `Counterparty-Category`, and `Email matching`. Do **not** copy Bank / transactions data, raw CSV, Summary data, unpaid tables, or Config from last month. Never modify the previous month's sheet.
       - **If no previous month's sheet:** leave the template’s empty/default lookup tabs as copied.
    6. The template already has the required tabs, header rows, and layout: the transactions tab named `{drive.sheet_tab}` (template / profile default: `Bank Transactions`), `Counterparties`, `Categories` (including a **Type** column), `Counterparty-Match`, `Counterparty-Category`, `Email matching`, `Config`, and `Summary` (including unpaid tables). Do not change the template's formatting on the source file.
    7. If the new copy is somehow missing the `Summary` tab or the Categories `Type` column, add a minimal unstyled tab or column with the expected headers so later skills can run. Do not invent decorative formatting.
    8. On the transactions tab, the raw CSV header row is already present to the right of the reconciliation columns (typically K–N: `Date` | `Merchant` | `Amount` | `Description`). When importing (section 3), write CSV **data** under those headers on the first empty row beneath them; do not duplicate that header row unless the layout differs.
    9. After the month sheet exists, run **section 1b**.

## 1b. Ensure Summary checkbox Apps Script (quiet unless broken)

Bound Apps Script may be wrong after a Drive copy if the shared template only had an empty stub. Agent source of truth — **all four** files under [`scripts/`](scripts/) (maintainers: [`scripts/README.md`](scripts/README.md)):

- [`summary-on-edit.gs`](scripts/summary-on-edit.gs) — sole `onEdit` dispatcher
- [`unpaid-checkbox-dates.gs`](scripts/unpaid-checkbox-dates.gs) — Paid / Reminder Sent
- [`personal-expense-checkbox.gs`](scripts/personal-expense-checkbox.gs) — Personal Expense → Category `Personal`
- [`no-invoice-needed-checkbox.gs`](scripts/no-invoice-needed-checkbox.gs) — Missing Expense / Revenue No Invoice Needed → Categories Invoice Required false

1. Read those `.gs` files from the repo.
2. Check the month workbook’s bound project (Extensions → Apps Script, or Apps Script API / `clasp` if available).
3. If it already has working `onEdit` that calls all three handlers, plus `handleUnpaidCheckboxEdit_` / `handlePersonalExpenseEdit_` / `handleNoInvoiceNeededEdit_` / `setDateDmmm_`: **leave it**. Say **nothing** about scripts in chat.
4. If missing, empty, only `myFunction`, or lacking those functions: create/replace the four files from the repo and Save. Do this silently when you can; do not narrate file paths to the operator.
5. If you cannot install or fix it: continue Import anyway. In the operator-facing report use **plain language only** — e.g. “If ticking Paid doesn’t fill in the date automatically, tell me and I’ll help.” **Never** tell the operator to open Apps Script, paste a `.gs` file, or look under `skills/…`. Find Unpaid Invoices also checks this (section 0).

## 2. Inspect the layout before writing

- Tabs used: the transactions tab, `Categories`, `Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Email matching`, and `Summary`. Tab names can change, so check them each time.
- **Transactions tab.** Start from `{drive.sheet_tab}` in the profile (current template name: **`Bank Transactions`**). If that exact tab name is not present, find the tab that holds the reconciliation columns (Date, Counterparty, Category, Credit, Debit, Invoice, and the other headers below). Older sheets may still be named `Bank`. Use the tab you find for the rest of the run; do not rename it unless the operator asks.
- Read the transactions tab and **locate the header row by column names**, not by assuming it is row 1 (a title row may sit above it). Expected headers: Date | Counterparty | Category | Credit | Debit | VAT | Ref | Invoice | Notes | Source, then the raw CSV area to the right (typically K onward). Notes and Source may be swapped; still key off the header text. If an older sheet still has `Recipient / Payer`, treat that column as Counterparty (rename the header when practical). Do **not** rename `Ref` to `Invoice` — `Ref` is the invoice reference number; `Invoice` holds the Drive file link.
- For this skill, you only need the raw CSV paste area and enough of the layout to avoid writing into the wrong columns.

## 3. Paste the CSV only

- Paste the CSV into the tab starting at the first empty column to the right of the reconciliation columns (column K after the ten headers above; adjust if the layout changed). If the header row already has raw CSV headers there (as in the skill template), keep them and write data on the first empty row beneath. Otherwise put headers in the header row and data on the next row. Write numbers as numbers and dates as real dates with number format **`d-mmm`** (e.g. 10-Nov).
- **Do not** fill Date, Counterparty, Category, Credit, Debit, VAT, Ref, Invoice, Notes, or Source in this skill. Leave those for [`categorise-bank.md`](categorise-bank.md) and [`match-invoices.md`](match-invoices.md).
- Clear any leftover raw-CSV junk in rows below the last imported data row.

## 4. Report and stop

- Report the sheet link, the Extracts CSV used, and the imported row count.
- Confirm reconciliation columns were left untouched.
- **Do not** mention Apps Script, checkbox scripts, or `.gs` files when section 1b found them already correct (or you fixed them silently). Only if install failed: one plain-language line that Paid dates may not auto-fill and they can ask for help — no technical paths.
- Tell the operator to run **Categorise bank data** next ([`categorise-bank.md`](categorise-bank.md)).
