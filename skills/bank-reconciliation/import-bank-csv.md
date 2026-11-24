---
name: Import bank CSV
version: 1.0.0
description: >-
  Version 1.0.0. Use when the user wants to import or paste the latest bank
  statement CSV into their Google Sheets reconciliation workbook: prepare the
  month Drive folders, create or copy the month sheet from the prior month or
  the scrubbed `.xlsx` template, and paste the CSV into the raw import columns
  only. Does not fill Date, Counterparty, Category, Credit, Debit, or Invoice
  columns — run Categorise bank data next (or the one-shot Reconcile Bank
  Statement wrapper). If `{workspace.local_path}/bookkeeping-test-session.yaml`
  is active, use that session’s statement month and the CSV already staged in
  Extracts.
---
# Import bank CSV

Do this Drive work under `{drive.root_path}/{drive.accounts_folder}`. Use the Google Drive and Google Sheets connectors (load the google-drive and google-sheets skills first).

If you must save a CSV or other file **locally** before uploading to Drive (or as a scratch copy), write it under `{workspace.local_path}/` (see `rules/tutorial-workspace.md`). Create that folder if needed. Do not leave tutorial temps in the repo root or under `skills/`.

**First-month workbook template (committed, scrubbed):** `skills/bank-reconciliation/Y[date]_[company]_Reconciliation.xlsx`. Upload a copy of that file for the initial month only; never edit the repo file in place, and never leave a filled private copy under `skills/`.

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
- **Starting sheet.** Look for the previous month's reconciliation sheet in that month's folder (`{drive.month_folder_pattern}` under its own `{drive.year_folder_pattern}`). For January, the previous month's folder is in the previous year's folder.
  - **If a previous month's sheet exists:** copy it into this month's folder, named from `{drive.sheet_title_pattern}` (fill `{YYYYMM}` with the statement month and `{company_name}` with `{company.name}`). Use it because it has the latest mappings in `Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Email matching` and `Categories`. On the copy only, clear the previous month's transaction data and the raw CSV area on the `{drive.sheet_tab}` tab, and keep that tab's header row and the reference tabs intact. Never modify the previous month's sheet. If the copy is still an `.xlsx`, convert it to a native Google Sheet so the Sheets tools can edit it.
  - **If this month's sheet already exists** (re-import, e.g. after Test Phase 3 staged a new CSV): open it; clear the raw CSV data area (and any prior reconciliation column data that would be stale relative to a full CSV replace) on the transactions tab before pasting the new CSV; keep headers and reference tabs. Do not create a second sheet for the same month unless the operator asks.
  - **If no previous month's sheet exists (initial run):** upload a **copy** of the scrubbed template `skills/bank-reconciliation/Y[date]_[company]_Reconciliation.xlsx` into this month's folder under `{drive.root_path}/{drive.accounts_folder}/{drive.year_folder_pattern}/{drive.month_folder_pattern}/`. Rename the Drive file to `{drive.sheet_title_pattern}` (fill `{YYYYMM}` with the statement month and `{company_name}` with `{company.name}`). Convert that `.xlsx` to a **native Google Sheet** so the Sheets tools can edit it. Do **not** modify the repo template file.
    - The template already has the required tabs, header rows, and layout (no sample/private data): the transactions tab named `{drive.sheet_tab}` (template / profile default: `Bank Transactions`), `Counterparties`, `Categories` (including a **Type** column), `Counterparty-Match`, `Counterparty-Category`, `Email matching`, and `Summary` (headers and table formatting for Missing Expense Invoices, Missing Revenue Invoices, and Expenses by Category). Do not change the template's formatting, and do not edit the repo `.xlsx` in place. The operator may update that template separately.
    - If a copy of an older template is missing the `Summary` tab or the Categories `Type` column, add a minimal unstyled tab or column with the expected headers so later skills can run. Do not invent decorative formatting.
    - On the transactions tab, the raw CSV header row is already present to the right of the reconciliation columns (typically K–N: `Date` | `Merchant` | `Amount` | `Description`). When importing (section 3), write CSV **data** under those headers on the first empty row beneath them; do not duplicate that header row unless the layout differs.

## 2. Inspect the layout before writing

- Tabs used: the transactions tab, `Categories`, `Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Email matching`, and `Summary`. Tab names can change, so check them each time.
- **Transactions tab.** Start from `{drive.sheet_tab}` in the profile (current template name: **`Bank Transactions`**). If that exact tab name is not present, find the tab that holds the reconciliation columns (Date, Counterparty, Category, Credit, Debit, Invoice, and the other headers below). Older sheets may still be named `Bank`. Use the tab you find for the rest of the run; do not rename it unless the operator asks.
- Read the transactions tab and **locate the header row by column names**, not by assuming it is row 1 (a title row may sit above it). Expected headers: Date | Counterparty | Category | Credit | Debit | VAT | Ref | Invoice | Notes | Source, then the raw CSV area to the right (typically K onward). Notes and Source may be swapped; still key off the header text. If an older sheet still has `Recipient / Payer`, treat that column as Counterparty (rename the header when practical). Do **not** rename `Ref` to `Invoice` — `Ref` is the invoice reference number; `Invoice` holds the Drive file link.
- For this skill, you only need the raw CSV paste area and enough of the layout to avoid writing into the wrong columns.

## 3. Paste the CSV only

- Paste the CSV into the tab starting at the first empty column to the right of the reconciliation columns (column K after the ten headers above; adjust if the layout changed). If the header row already has raw CSV headers there (as in the skill template), keep them and write data on the first empty row beneath. Otherwise put headers in the header row and data on the next row. Write numbers as numbers and dates as real dates.
- **Do not** fill Date, Counterparty, Category, Credit, Debit, VAT, Ref, Invoice, Notes, or Source in this skill. Leave those for [`categorise-bank.md`](categorise-bank.md) and [`match-invoices.md`](match-invoices.md).
- Clear any leftover raw-CSV junk in rows below the last imported data row.

## 4. Report and stop

- Report the sheet link, the Extracts CSV used, and the imported row count.
- Confirm reconciliation columns were left untouched.
- Tell the operator to run **Categorise bank data** next ([`categorise-bank.md`](categorise-bank.md)).
