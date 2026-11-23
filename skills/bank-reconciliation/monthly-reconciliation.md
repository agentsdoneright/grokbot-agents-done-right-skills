---
name: Bank reconciliation
version: 1.7.3
description: >-
  Version 1.7.3. Use when the user wants to reconcile a month's bank transactions
  (e.g. a bank CSV export) in their Google Sheets reconciliation workbook: on the
  first month upload the skill's scrubbed `.xlsx` template and convert it to a
  Google Sheet, copy last month's sheet thereafter, import the CSV, fill date,
  counterparty, category, credit and debit columns, and seed Categories /
  Counterparty reference tabs from those rows (including Categories Type).
  Match invoices from Unfiled Drive folders first (Source=Drive), then email
  (Source=Email), then Manual chat uploads (Source=Manual). Fill the Summary
  tab with live formulas for Missing Expense Invoices, Missing Revenue
  Invoices, and Expenses by Category (required SUMIF Totals against Bank
  Transactions Debits by Category + Type so the pie chart updates when
  categories change); delete every Summary table with no data rows and recreate
  it when data returns; when both missing-invoice blocks are kept, leave exactly
  one blank row between them; before any Summary table spill or data write,
  insert sheet rows so content below is never overwritten; highlight Bank
  Transactions rows that match those missing-invoice lists in light red. At the
  end, list remaining missing invoices, point to Summary, ask the operator to
  drop files in chat or Unfiled Expense/Revenue folders, then re-run matching on
  the same sheet. Also use for test mode / sample data / try with test data —
  run against skills/bank-reconciliation/test-data fixtures instead of a live
  bank CSV download and Gmail.
---
# Monthly bank reconciliation in Google Sheets

Do this Drive work under `{drive.root_path}/{drive.accounts_folder}`. Find the reconciliation sheet and the bank CSV on Drive as described below. Use the Google Drive and Google Sheets connectors (load the google-drive and google-sheets skills first).

If you must save a CSV, PDF, or other file **locally** before uploading to Drive (or as a scratch copy), write it under `{workspace.local_path}/` (see `rules/tutorial-workspace.md`). Create that folder if needed. Do not leave tutorial temps in the repo root or under `skills/`.

**First-month workbook template (committed, scrubbed):** `skills/bank-reconciliation/Y[date]_[company]_Reconciliation.xlsx`. Upload a copy of that file for the initial month only; never edit the repo file in place, and never leave a filled private copy under `skills/`.

## Test mode

Run **test mode** when the operator asks to reconcile with **test mode**, **sample data**, or **try with test data** (or equivalent).

In test mode the Sheets / Drive path is unchanged (month folders, template or copied sheet, import, fill columns, seed reference tabs, Expenses / Revenue uploads, Invoice links, Unfiled folders may be created but stay empty unless fixtures are added). Only the **CSV source** and **invoice search** change:

| Live | Test mode |
| --- | --- |
| Bank CSV from Drive `{drive.extracts_folder}` | Copy `skills/bank-reconciliation/test-data/bank-statement.csv` into that Extracts month folder, then import as usual |
| Gmail inbox / Sent on `{google_account}` | Parse local `.eml` files — **never** search or change Gmail. Expense (Debit) fixtures: `skills/bank-reconciliation/test-data/emails/*.eml`. Revenue (Credit) fixtures: `skills/bank-reconciliation/test-data/emails/sent/*.eml` |

**Fixed statement month:** November 2024 (`{YYYY}` = `2024`, `{YYYYMM}` = `202411`). Do not use “last month.”

**Fixture paths** are repo-relative under the skill folder (`skills/bank-reconciliation/test-data/…`). They are committed sample data, not disposable staging — do not treat them as `{workspace.local_path}` files. When you extract a PDF from an EML before Drive upload, stage the extract under `{workspace.local_path}/`.

**Invoice addressee:** expense fixtures use **Demo Company Ltd** as the buyer. For Notes / addressee checks on expense invoices in test mode, treat that name as the expected company (do not flag a mismatch solely because it differs from `{company.name}`). Outbound revenue fixtures are **from** Demo Company Ltd to clients. Sheet titles still use `{company.name}` from the profile.

**Test-mode steps:**

1. Set the statement month to `202411` / year `2024`.
2. Ensure year, extracts, and month folders exist under `{drive.root_path}/{drive.accounts_folder}` as in section 1.
3. Copy `skills/bank-reconciliation/test-data/bank-statement.csv` into `{drive.root_path}/{drive.accounts_folder}/{drive.year_folder_pattern}/{drive.extracts_folder}/{drive.month_folder_pattern}/` (create folders if needed). Then continue sections 1–6 as usual (CSV is already on Drive) — fill the transactions tab, seed reference tabs including Categories Type (section 5), then verify before invoice matching.
4. For expense invoice matching (section 8): check Unfiled expense invoices first (usually empty in the default fixture run). Then open each `skills/bank-reconciliation/test-data/emails/*.eml` (not under `sent/`). Match each Debit row using `From`, subject, amount, and date (confirmation fields: Date, Counterparty, Debit). Prefer the PDF attachment; extract under `{workspace.local_path}/`, upload to `{drive.expenses_folder}`, set Invoice / VAT / Ref, set **Source = `Email`**, update Counterparties contact fields and `Email matching` as in section 8. Skip bank-fee rows unless an invoice clearly exists. Fixture pack includes unmatched debits with no EML — leave those unmatched (Source blank).
5. For revenue invoice matching (section 9): check the month `{drive.revenue_folder}` and Unfiled revenue invoices first (usually empty). Then open each `skills/bank-reconciliation/test-data/emails/sent/*.eml`. Match Credit rows (Date, Counterparty, Credit); upload to `{drive.revenue_folder}`; set Invoice / VAT / Ref; set **Source = `Email`**.
6. Fill the Summary tab (section 10): **show when data / delete when empty** for Missing Expense, Missing Revenue, Expenses by Category (and pie), and empty unpaid shells; when both missing-invoice blocks are kept, exactly one blank row between them; **insert sheet rows** before spills so lower titles are never overwritten; light-red highlight on matching Bank Transactions rows.
7. After the run, read `skills/bank-reconciliation/test-data/expected-results.md` and report pass/fail against that checklist (including that Gmail was not used, and the Summary tables and pie chart).

## 1. Prepare the month's folder and sheet
- **Year and month folders.** The year folder is `{drive.year_folder_pattern}` under `{drive.root_path}/{drive.accounts_folder}` (`{YYYY}` is the year of the month being reconciled). If that year folder does not exist, create it, and create its `{drive.extracts_folder}` subfolder. Then create the month folder `{drive.month_folder_pattern}` inside the year folder if it does not exist (`{YYYYMM}` is the statement month).
- **CSV.** Look first for the bank CSV in `{drive.root_path}/{drive.accounts_folder}/{drive.year_folder_pattern}/{drive.extracts_folder}/{drive.month_folder_pattern}/`. If it is not there, ask the user for it. When the user provides it, save it into that Drive folder, creating the folder if needed, before importing. If you stage the file locally first, put it under `{workspace.local_path}/` then upload to Drive. In **test mode**, use the fixture copy step in **Test mode** instead of asking for a live export.
- **Starting sheet.** Look for the previous month's reconciliation sheet in that month's folder (`{drive.month_folder_pattern}` under its own `{drive.year_folder_pattern}`). For January, the previous month's folder is in the previous year's folder.
  - **If a previous month's sheet exists:** copy it into this month's folder, named from `{drive.sheet_title_pattern}` (fill `{YYYYMM}` with the statement month and `{company_name}` with `{company.name}`). Use it because it has the latest mappings in `Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Email matching` and `Categories`. On the copy only, clear the previous month's transaction data and the raw CSV area on the `{drive.sheet_tab}` tab, and keep that tab's header row and the reference tabs intact. Never modify the previous month's sheet. If the copy is still an `.xlsx`, convert it to a native Google Sheet so the Sheets tools can edit it.
  - **If no previous month's sheet exists (initial run):** upload a **copy** of the scrubbed template `skills/bank-reconciliation/Y[date]_[company]_Reconciliation.xlsx` into this month's folder under `{drive.root_path}/{drive.accounts_folder}/{drive.year_folder_pattern}/{drive.month_folder_pattern}/`. Rename the Drive file to `{drive.sheet_title_pattern}` (fill `{YYYYMM}` with the statement month and `{company_name}` with `{company.name}`). Convert that `.xlsx` to a **native Google Sheet** so the Sheets tools can edit it. Do **not** modify the repo template file.
    - The template already has the required tabs, header rows, and layout (no sample/private data): the transactions tab named `{drive.sheet_tab}` (template / profile default: `Bank Transactions`), `Counterparties`, `Categories` (including a **Type** column), `Counterparty-Match`, `Counterparty-Category`, `Email matching`, and `Summary` (headers and table formatting for Missing Expense Invoices, Missing Revenue Invoices, and Expenses by Category). Do not change the template's formatting, and do not edit the repo `.xlsx` in place. The operator may update that template separately.
    - If a copy of an older template is missing the `Summary` tab or the Categories `Type` column, add a minimal unstyled tab or column with the expected headers from section 10 so later steps can run. Do not invent decorative formatting.
    - On the transactions tab, the raw CSV header row is already present to the right of the reconciliation columns (typically K–N: `Date` | `Merchant` | `Amount` | `Description`). When importing (section 3), write CSV **data** under those headers on the first empty row beneath them; do not duplicate that header row unless the layout differs.

## 2. Inspect the layout before writing
- Tabs used: the transactions tab, `Categories` (the category list, including **Type**), `Counterparty-Match` (raw-to-formatted names), `Counterparties` (unique formatted names plus contact fields), `Counterparty-Category` (name to category), `Email matching` (how to find each counterparty's invoice emails), and `Summary`. Tab names can change, so check them each time.
- **Transactions tab.** Start from `{drive.sheet_tab}` in the profile (current template name: **`Bank Transactions`**). If that exact tab name is not present, find the tab that holds the reconciliation columns (Date, Counterparty, Category, Credit, Debit, Invoice, and the other headers below). Older sheets may still be named `Bank`. Use the tab you find for the rest of the run; do not rename it unless the operator asks. In later sections, “the transactions tab” means this resolved tab, even when the text still mentions `{drive.sheet_tab}`.
- Read the transactions tab and **locate the header row by column names**, not by assuming it is row 1 (a title row may sit above it). The user edits the layout, so locate columns by header name each time. Expected headers: Date | Counterparty | Category | Credit | Debit | VAT | Ref | Invoice | Notes | Source, then the raw CSV area to the right (typically K onward). Notes and Source may be swapped; still key off the header text. If an older sheet still has `Recipient / Payer`, treat that column as Counterparty (rename the header when practical). Do **not** rename `Ref` to `Invoice` — `Ref` is the invoice reference number; `Invoice` holds the Drive file link.
- Also read `Categories` (note the Type column if present) and `Summary` (section 10) so you know the current layout before writing.
- Category spellings come from the `Categories` tab (the category list).

## 3. Import the CSV
- Paste the CSV into the tab starting at the first empty column to the right of the reconciliation columns (column K after the ten headers above; adjust if the layout changed). If the header row already has raw CSV headers there (as in the skill template), keep them and write data on the first empty row beneath. Otherwise put headers in the header row and data on the next row. Write numbers as numbers and dates as real dates. You may still read the raw CSV columns (typically K onward) when filling Counterparty, amounts, or matching invoices.

## 4. Fill the reconciliation columns, one row per CSV row
- **Date**: the transaction date as a real date, number format `d-mmm` (displays 5-Nov, no leading zero).
- **Counterparty**: take the raw name from Merchant, else Payee Name, else Payer Name, else Description. Look it up in `Counterparty-Match` (A = formatted `Counterparty`, B = `Match` raw bank name) with a loose match (contains or key words, since raw strings change monthly) and write the formatted name. If there's no match, write your best clean, properly cased name for the entity. For credit rows this is the **paying client** from the bank string, not `{company.name}`.
- **Category**: first look up the formatted counterparty in `Counterparty-Category` and use its category. With no match, pick from the `Categories` tab. If `Categories` and `Counterparty-Category` have no data rows yet (typical first month), invent a short consistent category for the Bank row — do not leave Category blank. Keep spellings consistent across rows and with earlier months when those tabs already have data.
- **Credit**: the absolute amount if money came in, else blank.
- **Debit**: the absolute amount if money went out, else blank.
- **VAT**, **Ref**, **Invoice**, **Notes**: leave blank during this fill pass; fill them when matching invoices (sections 8–9). Do not invent VAT or Ref.
- **Source**: leave blank during this fill pass. Set only when matching invoices (sections 8–9) or when the operator uploads an invoice in chat (`Manual`). Allowed values: `Email`, `Manual`, `Drive`.
- Clear any leftover formulas or junk in rows below the last data row.

## 5. Seed reference tabs from the filled Bank rows
In the **same run**, after section 4 and before the verify report, seed (or extend) the reference tabs from the filled `{drive.sheet_tab}` rows and the raw bank string used for each row (Merchant / Payee Name / Payer Name / Description):

- **`Categories`**: unique Category values from the transactions tab; no duplicates; no blank categories. Also seed **Type** when the column exists (add a `Type` header if the template is older and the column is missing): use `Expense` for a category that appears only on Debit rows, and `Revenue` for a category that appears only on Credit rows. If a category appears on both, leave Type blank and flag it for the operator rather than guessing. Do **not** overwrite a Type the operator (or a previous month) already set. Allowed Type values are `Expense` and `Revenue` (match them case-insensitively later; `Debit` / `Credit` also count as expense / revenue if the operator used those words).
- **`Counterparty-Match`**: one row per unique formatted `Counterparty`, with `Match` = the raw bank string for that counterparty; no duplicates.
- **`Counterparties`**: unique formatted `Counterparty` values in column A (include credit counterparties / clients). Leave Email / Phone / Registration / Address blank until an invoice match supplies them (section 8–9).
- **`Counterparty-Category`**: one row per unique formatted name with the Category used on Bank for that name.

Skip writing a row when the same key already exists (month-2 copies already have mappings; only add genuinely new counterparties or categories).

## 6. Verify and report
- Read back the filled range: the row count should match the CSV, dates should display as d-mmm, and SUM(Credit) and SUM(Debit) should equal the CSV's total in and total out.
- Confirm the four reference tabs from section 5 have data rows consistent with Bank (not header-only after a first fill).
- Report the file link, the totals, the category counts, that the reference tabs were seeded or updated for new counterparties, and any guesses (new counterparties, unsure categories).

## 7. After the user reviews
When the operator says they have finished editing Category or Counterparty names (or other manual sheet changes), re-read `{drive.sheet_tab}` against the reference tabs and **update mappings so everything stays linked**:

- Sync `Counterparty-Match` (formatted name ↔ raw Match string) without duplicates.
- Sync unique formatted names into `Counterparties` (preserve existing Email / Phone / Registration / Address when only the name key is syncing).
- Sync `Counterparty-Category` and unique spellings into `Categories`. Preserve existing Type values; seed Type only for newly added categories (same rules as section 5).
- If a counterparty was renamed, update the matching `Counterparty` in `Email matching` so invoice rules still line up.

## 8. Match expense invoices (Debit rows)
Run when the user asks to match invoices (or as the last step of a reconciliation if they want it). **In test mode, follow the EML steps in Test mode instead of searching Gmail** — do not use `{google_account}` Gmail for matching.

**Source column** (set when a match is attached this run):
- `Drive` — invoice found in Unfiled expense invoices and moved into the month `{drive.expenses_folder}`
- `Email` — invoice found via Gmail / test EML
- `Manual` — operator uploaded the invoice into the agent chat

Search order per Debit row: **Unfiled → email → Manual (later, after the unmatched report)**.

Unfiled expense path: `{drive.root_path}/{drive.accounts_folder}/{drive.unfiled_folder}/{drive.unfiled_expense_invoices}`. Ensure that folder exists (create `{drive.unfiled_folder}` and the expense invoices subfolder if missing). Ensure a `{drive.expenses_folder}` subfolder exists inside the spreadsheet's folder (create once, then reuse).

For every `{drive.sheet_tab}` row with a Debit:

1. **Check Unfiled first.** Search `{drive.root_path}/{drive.accounts_folder}/{drive.unfiled_folder}/{drive.unfiled_expense_invoices}` for a PDF that matches Date / Counterparty / Debit.
   - **When an Unfiled match is found:** **move** (do not copy) the file into the month `{drive.expenses_folder}`. Rename to `YYYYMMDD_Counterparty_Ref.pdf` if needed (`Ref` = invoice reference number, e.g. `20261115_Acme_INV78.pdf`); do not leave duplicates. Set **Invoice** as a filename-labeled hyperlink with **Clip** overflow (same rules as below). Fill **VAT** / **Ref** from the invoice when present. Write **Notes** only when something needs attention. Set **Source = `Drive`**. Update `Counterparties` contact fields from the invoice when present (same rules as email matches). Do **not** add or update `Email matching` solely because of a Drive match.
2. **Else check `Email matching`.** (Live mode only for Gmail.) Read the tab's headers and rows. If the row's Counterparty is listed, search Gmail on `{google_account}` with that rule (sender, subject keywords, attachment hints, etc.), narrowed by the row's Date and Debit amount. In **test mode**, use the EML fixtures instead of Gmail.
3. **Otherwise do a general search** on `{google_account}` (live mode): the counterparty name and raw merchant text, a date window of about two weeks before to a few days after the bank date, and the amount (also the original currency amount from the raw CSV columns for FX charges, e.g. USD or GBP). Use Date, Counterparty and Debit as the key fields to confirm the match. In **test mode**, match against expense EMLs as in Test mode.
4. **When an email match is found:**
   - Get the invoice: prefer a PDF attachment. If it's only in the body or behind a link, save the email as a PDF or download the linked PDF under `{workspace.local_path}/`, and say so in Notes.
   - Upload it to `{drive.expenses_folder}` inside the spreadsheet's folder. Name it `YYYYMMDD_Counterparty_Ref.pdf` (`Ref` = invoice reference number, e.g. `20261115_Acme_INV78.pdf`) and don't upload duplicates.
   - Put a link to the Drive file in the row's **Invoice** column: the **visible link text must be the saved filename** (e.g. `20241105_Acme Cloud_INV-AC-1042.pdf`), not the raw URL. Use a Sheets hyperlink whose label is that filename (for example `=HYPERLINK("https://…", "YYYYMMDD_Counterparty_Ref.pdf")`, or the connector equivalent). Format the **Invoice** column (or those cells) with **Clip** text overflow — do not Wrap — so long labels stay readable in a narrow column.
   - Fill **VAT** with the tax amount extracted from the invoice when present; leave blank if the invoice has no tax line.
   - Fill **Ref** with the invoice reference / invoice number when present; leave blank if none.
   - Set **Source = `Email`**.
   - Write Notes only when something needs the user's attention, such as an amount mismatch (FX or VAT), an invoice that covers several charges, a date far off, a receipt instead of an invoice, an invoice addressed to someone other than `{company.name}` (in **test mode**, use **Demo Company Ltd** as the expected addressee), or an uncertain match.
   - **Update `Counterparties` contact fields** for this Counterparty from the invoice (Email, Phone, Registration, Address). If multiple emails appear, prefer the one that matches finance / billing / accounts. If the counterparty row already exists and any of those values **changed**, overwrite them on the current month's sheet and **inform the operator** what was updated (old → new). Never invent contact fields.
   - Right away, as part of the same match (not batched for the end), if the counterparty wasn't already in `Email matching`, or the rule needed changing to find it, add or update its row with the rule that worked (sender address or domain, subject pattern, whether the invoice is an attachment or a link, and any quirks), following the tab's columns and without duplicates.
5. Skip bank-fee rows (service fees etc) unless an invoice clearly exists.
6. Never send, reply to, or change any emails.
7. Before reporting, re-read `Email matching` and confirm every **email** expense match has its rule saved there (Drive matches do not require an Email matching row).
8. **Report (expenses):** the `{drive.expenses_folder}` folder link, the matches found (include **Source** counts: Drive / Email / Manual), any Notes written, Counterparties contact updates told to the operator, and a clear list of Debit rows still missing an invoice (Date, Counterparty, Debit), so the user can upload those files manually. When they do, upload each one to `{drive.expenses_folder}` with the same naming, put a filename-labeled hyperlink in Invoice (Clip overflow), fill VAT / Ref when known, set **Source = `Manual`**, and add a note if needed.

## 9. Match revenue invoices (Credit rows)
Match outbound invoices the company sent (clients paying for work). Run with section 8 when invoice matching is requested.

**Source** values are the same as expenses (`Drive` / `Email` / `Manual`). Search order per Credit row: **month Revenue folder (already filed) → Unfiled → email → Manual**.

Unfiled revenue path: `{drive.root_path}/{drive.accounts_folder}/{drive.unfiled_folder}/{drive.unfiled_revenue_invoices}`. Ensure that folder exists (create if missing).

For every `{drive.sheet_tab}` row with a Credit:

1. Ensure a Drive subfolder named `{drive.revenue_folder}` exists inside the spreadsheet's folder (create once, then reuse).
2. **Check `{drive.revenue_folder}` first** for an existing PDF that matches Date / Counterparty / Credit (same `YYYYMMDD_Counterparty_Ref.pdf` naming when possible). If linking that already-filed file this run and **Source** is empty, leave **Source** blank (it was not matched from Unfiled this run).
3. **Else check Unfiled.** Search `{drive.root_path}/{drive.accounts_folder}/{drive.unfiled_folder}/{drive.unfiled_revenue_invoices}` for a matching PDF. On match: **move** (do not copy) into the month `{drive.revenue_folder}`, rename to `YYYYMMDD_Counterparty_Ref.pdf` if needed (`Ref` = invoice reference number), set Invoice / VAT / Ref / Notes as for expenses, and set **Source = `Drive`**.
4. **Otherwise search Gmail Sent** on `{google_account}` for outbound invoices to that client (counterparty name, amount, date window of about two weeks before to a few days after the bank date). In **test mode**, use `skills/bank-reconciliation/test-data/emails/sent/*.eml` instead of Gmail Sent.
5. **When an email match is found:**
   - Prefer a PDF attachment; stage under `{workspace.local_path}/` if extracting from email.
   - Upload to `{drive.revenue_folder}` as `YYYYMMDD_Counterparty_Ref.pdf` (`Ref` = invoice reference number, e.g. `20261115_Acme_INV78.pdf`; no duplicates).
   - Set **Invoice** as a filename-labeled hyperlink with Clip overflow (same rules as expenses).
   - Fill **VAT** and **Ref** from the outbound invoice when present.
   - Set **Source = `Email`**.
   - Update `Counterparties` Email / Phone / Registration / Address from the client's details on the invoice when present; if values changed, overwrite and **inform the operator**. Prefer finance / billing emails when several are listed. Never invent values.
   - Seed / keep the Counterparty on `Counterparties`, `Counterparty-Match`, and `Counterparty-Category` like any other bank row (section 5) — the Counterparty is the **paying client**, not `{company.name}`.
6. Never send, reply to, or change any emails.
7. **Report (revenue):** the `{drive.revenue_folder}` folder link, credit matches found (include **Source** counts), Counterparties updates, and Credit rows still missing an invoice (Date, Counterparty, Credit). When the operator uploads a missing invoice in chat, upload to `{drive.revenue_folder}` with the same naming, set Invoice / VAT / Ref as known, and set **Source = `Manual`**.

Then fill the Summary tab (section 10). In **test mode**, after Summary, also report pass/fail against `skills/bank-reconciliation/test-data/expected-results.md`.

## 10. Fill the Summary tab

Run this after invoice matching (sections 8–9) so the Invoice column is up to date — including **every re-run** after the operator supplies more invoices (section 11). If the operator later asks only to refresh Summary, re-read the current transactions tab and Categories Type values and apply the show/hide and formula rules below (including recreating or deleting Expenses by Category when needed).

**After new matches:** rows that now have an Invoice must **disappear** from Missing Expense / Missing Revenue (live `FILTER`/`QUERY` formulas do this automatically when Invoice is filled). Re-evaluate candidates; apply **Show when data / delete when empty** below. Clear light-red highlights on newly matched bank rows.

### Show when data / delete when empty (final Summary state)

**Standing rule for every Summary table this run touches:** if the table has **no data rows** for this run, **delete** its entire block (title, helper text if any, headers, formulas/data, and for Expenses by Category also the **Expenses by Category** pie chart). Do **not** leave an empty titled table. If it has **at least one** data row, **keep or recreate** the full block (title + headers + formulas/data) and fill it. On a later run when data returns for a deleted block, **recreate** it; when data goes to zero, **delete** it again.

Apply that independently to:

| Block | “Has data” means |
| --- | --- |
| **Missing Expense Invoices** | ≥1 missing expense candidate (section below) |
| **Missing Revenue Invoices** | ≥1 missing revenue candidate |
| **Expenses by Category** | ≥1 expense-typed category to show (with live Total formulas) |
| **Unpaid Expense Invoices** / **Unpaid Revenue Invoices** | ≥1 unpaid/pending row — **filled only by** the unpaid-invoices skill; this recon skill must **not** invent unpaid rows. If an unpaid block is present with **no data rows** (typical after a fresh template upload), **delete** that empty block so the final Summary has no empty unpaid shell. Never recreate an empty unpaid table from reconciliation. |

### Read the template layout first

The workbook template is expected to provide a **Summary** tab with table headers and formatting already in place. **Do not restyle or redesign those tables.** At the start of this step, read the Summary tab (and any named ranges) and locate the areas by **header text** and named ranges, **not by fixed cell coordinates** — operators often move these blocks.

Look for these titles and headers (case-insensitive; close wording is fine):

- **Missing Expense Invoices** — columns such as Date, Counterparty (or Description), Amount, and Note (or reason).
- **Missing Revenue Invoices** — the same kind of columns.
- **Expenses by Category** — columns such as Category, Total, and Percentage.
- **Unpaid Expense Invoices** / **Unpaid Revenue Invoices** — owned by the unpaid-invoices skill for **data**; see show/hide table above for empty shells.

If a named range exists for one of these (a name containing `MissingExpense`, `MissingRevenue`, or `ExpensesByCategory`, or similar), use it as the start of that table. If the Summary tab is missing, add a minimal tab named `Summary` — no decorative formatting (the operator maintains formats in the `.xlsx` template). Only add a block’s title and headers when that block **has data** to show (or will immediately get formulas that produce rows); do not leave empty titled shells.

#### Unpaid invoice blocks (data owned by unpaid-invoices)

**Unpaid Expense Invoices** and **Unpaid Revenue Invoices** data are owned by [`skills/unpaid-invoices/unpaid-invoices.md`](../unpaid-invoices/unpaid-invoices.md) (expense unpaid skill today; revenue later). When refreshing Summary in this bank-reconciliation skill:

- Do **not** fill unpaid blocks from Bank Transactions or invent unpaid rows.
- Do **not** restyle or overwrite unpaid blocks that already have data rows (leave them for the unpaid skill).
- **Do** delete an unpaid block that has **no data rows** (empty title/headers only), so the recon run’s final Summary has no empty tables. The unpaid skill recreates the block when it has invoices to list.

### Fill with live formulas

Write **formulas** (FILTER, QUERY, SUMIF, SUMIFS, ARRAYFORMULA, or equivalent) that read the transactions tab and `Categories`, so values stay current when Bank Category / Debit / Credit / Invoice or Type data changes. Do **not** paste static snapshot totals or missing-invoice rows. Keep the template's number and date formats on those cells. For **Percentage**, use number format `0%` (integer percent display; leave the underlying share unchanged).

Use the transactions tab resolved in section 2 (often named **`Bank Transactions`**). Find Date, Counterparty, Category, Credit, Debit, and Invoice by header name. Transaction data starts on the first row below that header row.

#### Insert rows — never overwrite Summary content below

**Hard rule:** when any Summary table receives data (a spilling `FILTER`/`QUERY`, static rows, or growing category rows), **insert new sheet rows** so titles, headers, and tables below shift down. **Never** write or spill into cells that already hold another block’s title, headers, or data (for example Missing Expense must not paint over **Missing Revenue Invoices**, and Missing Revenue must not paint over **Unpaid Expense Invoices** / other content below).

Before writing a formula or rows that will occupy **N** data rows under a table’s header:

1. Count **N** (candidate rows, or known spill height for this run).
2. Look at what currently sits immediately under that header (or under the single formula cell). If fewer than **N** empty rows exist before the next Summary block title/header, **insert** enough blank rows there (Sheets “insert rows”) so there are at least **N** empty rows for the data **plus** the required gap to the next block (see one-blank-row rule below).
3. Only then write the live formula or paste/fill the data rows.
4. **Re-read** the Summary tab. If any lower title is corrupted, truncated, or sharing a cell with spilled data, insert more rows and rewrite — treat overwrite as a failed step.

Do **not** rely on “there might be room in the template.” Template gaps are often only one data row deep; two missing expenses will overwrite the next heading unless you insert rows first.

#### Missing invoice blocks (keep, remove, or recreate)

Evaluate which rows would appear before writing:

- **Missing expense candidates:** Debit > 0 and Invoice blank, **excluding bank-fee rows**. Treat a row as a bank fee when Category or Counterparty matches `bank fee` or `service fee` (case-insensitive). Bank fees do not require an invoice (see section 8).
- **Missing revenue candidates:** Credit > 0 and Invoice blank.

Then:

- If there is **at least one** missing expense candidate: keep or recreate the **Missing Expense Invoices** title and table; fill with live `FILTER`/`QUERY` (or equivalent) formulas for Date, Counterparty, Amount (Debit), and Note (for example `No invoice found`). You may mention excluded bank-fee rows in the report; do not list them as missing invoices.
- If there are **no** missing expense candidates: **delete** the **Missing Expense Invoices** title and its **entire** table (headers and any data or formula rows). Do **not** leave an empty titled table.
- Same rules for **Missing Revenue Invoices** (Amount = Credit): keep/fill with formulas when candidates exist; **delete** title and whole table when there are none.
- On a later Summary refresh, if a previously deleted block is needed again: recreate the title and headers (Date, Counterparty, Amount, Note) in a clear area of Summary **without covering Expenses by Category**, then fill with live formulas. Do not invent decorative formatting. If the other missing-invoice block is also present, stack them with exactly one blank row between the tables (see below).

#### One blank row between the two missing-invoice tables

When **both** Missing Expense Invoices and Missing Revenue Invoices blocks are kept, stack them vertically with **exactly one blank row** between them: after the last occupied row of the expense table (the last spilled data row, or the header row if the formula has not yet produced visible rows) leave one empty row, then the Missing Revenue Invoices title.

**Required order** (row inserts first — see **Insert rows** above):

1. Count missing-expense candidates **Ne** and missing-revenue candidates **Nr**.
2. **Before** writing the expense `FILTER`/`QUERY`, insert sheet rows under the Missing Expense header so there is room for **Ne** spilled rows **and** one blank row **and** the full Missing Revenue block (title + header + room for **Nr** rows) without colliding with anything below (including Unpaid blocks if present). Prefer inserting rows so existing lower titles shift down intact — do not delete and retype a title that would have been overwritten.
3. Write the expense live formula; re-read and confirm the revenue title (and anything further down) is still intact on its own row with exactly one blank above it (or adjust with insert/delete until the gap is 1).
4. **Before** writing the revenue formula, ensure **Nr** empty rows exist under the Missing Revenue header; insert rows if needed so the revenue spill cannot overwrite Unpaid / other content below.
5. Write the revenue live formula; re-read again. No title may share a cell with spilled data.
6. On a later Summary refresh, repeat: if candidate counts grew, **insert rows** again before rewriting formulas. If a block is removed because it has zero rows, this one-blank-row rule does not apply (do not leave a stranded gap or an empty titled table).

Do **not** leave a large multi-row empty buffer between blocks after the lists settle — the gap between the last expense data row and the Missing Revenue title must be **exactly one** blank row. Use inserts sized to **Ne** / **Nr**, not an arbitrary tall spacer.

#### Highlight missing-invoice rows on Bank Transactions

After the Summary missing-invoice blocks are filled (or removed), sync row highlighting on the **transactions tab** so it matches those lists exactly:

- **Same membership as Summary:** highlight a bank row if and only if it is a **missing expense candidate** or **missing revenue candidate** (same rules as above). Bank-fee rows excluded from Missing Expense Invoices must **not** be highlighted for missing invoices. Rows that appear on Summary Missing Expense or Missing Revenue tables must be highlighted; rows that do not must not stay highlighted for this reason.
- **Colour:** light red fill on the **full reconciliation data columns** for that row (Date through Source/Notes — the ten reconciliation columns, not the raw CSV import columns to the right). Use a pale red such as `#FFCDD2` (or the Sheets theme light-red equivalent). Do not invent other colours.
- Prefer **conditional formatting** on the transactions tab driven by blank Invoice plus Debit/Credit (and excluding bank fees), so the highlight stays aligned when Invoice is filled later. If the connector cannot set conditional formatting, apply/clear the light-red fill on the matching rows for this run, then on a later Summary refresh clear fill from rows that are no longer missing and apply it to any newly missing rows.
- Clear light-red missing-invoice highlighting from rows that now have an Invoice (or that are bank fees). Do not strip unrelated formatting the operator added.
- **Verify:** the set of highlighted bank rows (Date, Counterparty, Debit or Credit) must match the rows shown in the Summary Missing Expense and Missing Revenue tables (when those blocks exist). If a Summary block was deleted because it is empty, no bank rows should remain highlighted for that missing type.

#### Expenses by Category (formula-linked to Bank)

Same show/hide rule: if there are **no** expense-typed categories to list, **delete** the entire **Expenses by Category** title and table **and** any **Expenses by Category** pie chart. If there is at least one expense-typed category, keep or recreate the block and pie as below.

Build this table so changing a bank row’s **Category** or **Debit** updates Totals, Percentages, and the pie chart without rewriting Summary by hand:

- Include **only** categories whose **Type** on the `Categories` tab is an expense type. Match Type case-insensitively: `Expense`, `expense`, and `Debit` count as expense; `Revenue`, `revenue`, and `Credit` count as revenue. Include bank-fee categories when they are typed as expense — they are real expenses.
- **Category** labels: expense-typed categories from `Categories` (preferably via formulas so new Categories rows can appear when the range allows).
- **Total (required live formula):** every Total cell **must** be a spreadsheet formula that references the resolved transactions tab (template name **`Bank Transactions`**). **Pasting computed numbers is a failure of this step** — replace any static Total with a formula before finishing.
  - After locating Category and Debit by header on the transactions tab, use this canonical pattern (adapt column letters and the Criteria cell to the Summary layout; use the real tab name from section 2 if it is not `Bank Transactions`):

```text
=SUMIF('Bank Transactions'!$C$3:$C,$F3,'Bank Transactions'!$E$3:$E)
```

  - Meaning: sum **Debit** where **Category** equals this row’s Category label. Open-ended ranges (or spare rows past the last bank row) so new transactions are included without editing the formula. `SUMIFS` / `QUERY` that do the same cross-sheet Debit sum are acceptable; a plain number is not.
- **Percentage:** must also be a formula over those Total cells (e.g. `=G3/SUM($G$3:$G$20)`), format `0%`.
- Sort larger totals first unless the template already specifies an order. If a debit Category has a blank Type, or a Type that is neither expense nor revenue, omit it from this table and tell the operator. If a category typed revenue has debit amounts (or the reverse), follow Type for this table and flag the mismatch in the report.
- Insert sheet rows under the Expenses by Category header before writing category data rows if needed so nothing below is overwritten.
- **Verify before reporting:** re-read every Expenses by Category **Total** cell. Confirm each value is a formula (starts with `=` and references the transactions tab). If any Total is a plain number, replace it with the SUMIF pattern above, then re-check.

Do not invent amounts. If a formula cannot resolve (tab or column missing), stop and tell the operator what was missing.

### Pie chart (Expenses by Category)

Only when the **Expenses by Category** table is kept (has data):

Create or update **one** embedded pie chart on the Summary tab titled **Expenses by Category**:

- Bind the chart to the Expenses by Category **Category** and **Total** columns (not Percentage). Include the header row in the chart range (`headerCount` 1, or equivalent).
- Give the data range **spare rows** below the current last category (about 5–10 extra rows, or a modest window under the table) so newly seeded expense categories appear without a manual range edit. Empty trailing rows should not become extra slices (Sheets typically ignores blanks).
- Because Totals are live formulas over Bank Debits by Category, a category change on the transactions tab updates the pie without inserting a new chart.
- **Do not add a second chart on reruns.** If a chart with that title (or an existing pie already bound to this table) is present, update its data range in place instead of inserting another.
- When creating a new chart, place it in empty space on Summary; do not cover the table headers.

When the Expenses by Category **table is deleted** because it has no data, **delete** the pie chart too. Recreate the chart only when the table is recreated with data.

**Connector limits** (do not fail the step because of these): the Google Sheets connector has no hide-columns tool, and no setting for pie slice label format (for example forcing integer percents on the slices). The Percentage column (`0%`) is the reliable integer display. The pie may show slice percentages by default; that is enough.

### Report (Summary)

Include: the locations you used (title cells, ranges, or named ranges); for **each** Summary block whether it was **kept**, **removed** (no data), or **recreated** (data returned); that empty unpaid shells were removed if present; that Summary row **inserts** were used so no lower title/header was overwritten by spills; when both missing-invoice blocks are kept, that there is exactly one blank row between the last expense-table row and the Missing Revenue Invoices title (re-checked after any spilling formula); that Bank Transactions light-red highlights match those Summary missing rows; that Expenses by Category Totals are `SUMIF`-style formulas against the transactions tab (**confirmed** on re-read, or **corrected** from static numbers) when that block is kept; the expense-category totals and integer percentages when kept; the missing expense and revenue rows (if any); any Type mismatches or blank Types; and whether the pie chart was created, updated, or removed with an empty category table.

## 11. Final step: hand back to the user

### Missing invoices (required when any remain)

If any missing expense or revenue invoice candidates remain after Summary (section 10):

1. **List them clearly** in the chat (Date, Counterparty, Debit or Credit), grouped as expenses vs revenue. Use the same membership as the Summary Missing Expense / Missing Revenue tables (bank fees excluded from the expense list).
2. **Point to the Summary tab** — tell the operator these lists are also on **Summary** under **Missing Expense Invoices** and **Missing Revenue Invoices**, and that matching Bank Transactions rows are highlighted in light red.
3. **How to supply the files** — instruct the operator to either:
   - **Drop / upload the invoice PDFs into this chat**, or
   - Upload them into the Unfiled folders: expenses → `{drive.root_path}/{drive.accounts_folder}/{drive.unfiled_folder}/{drive.unfiled_expense_invoices}`; revenue → `{drive.root_path}/{drive.accounts_folder}/{drive.unfiled_folder}/{drive.unfiled_revenue_invoices}`.
4. **Then re-run** — ask them to tell you when the files are in chat or Unfiled. When they have (or when they paste/upload invoices in chat), **continue on the same spreadsheet**:
   - Match from Unfiled and/or chat uploads (sections 8–9: Unfiled → move into month Expenses/Revenue, Source=`Drive`; chat uploads → Source=`Manual`); update Invoice / VAT / Ref on the transactions tab.
   - **Update Summary (section 10) required:** missing-invoice tables must drop every newly matched row; apply **show when data / delete when empty** for all Summary blocks this skill manages; clear light-red highlights on matched rows; keep remaining missing rows listed and highlighted; refresh or remove Expenses by Category / pie as section 10 requires.
   - Hand back again (list any invoices still missing, or confirm none remain). Do **not** rebuild the month sheet from scratch unless the operator asks.

If there are **no** missing invoices, say so and skip the supply/re-run ask.

### Sheet edits

Also tell the operator: they may update Category names, Category Type, or Counterparty names directly on the spreadsheet; when they are finished, they should let you know so you can verify everything and correctly relink the reference tabs (`Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Categories`, and `Email matching` if names changed) and refresh the Summary formulas, the one-blank-row gap between missing-invoice tables, missing-invoice highlights, and pie chart if needed — see sections 7 and 10.
