---
name: Bank reconciliation
description: >-
  Use when the user wants to reconcile a month's bank transactions (e.g. a bank
  CSV export) in their Google Sheets reconciliation workbook: on the first month
  upload the skill's scrubbed `.xlsx` template and convert it to a Google Sheet,
  copy last month's sheet thereafter, import the CSV, fill date, counterparty,
  category, credit and debit columns, and seed Categories / Counterparty
  reference tabs from those rows. Also use for test mode / sample data / try
  with test data — run against skills/bank-reconciliation/test-data fixtures
  instead of a live bank CSV download and Gmail.
---
# Monthly bank reconciliation in Google Sheets

Do this Drive work under `{drive.root_path}`. Find the reconciliation sheet and the bank CSV on Drive as described below. Use the Google Drive and Google Sheets connectors (load the google-drive and google-sheets skills first).

If you must save a CSV, PDF, or other file **locally** before uploading to Drive (or as a scratch copy), write it under `{workspace.local_path}/` (see `rules/tutorial-workspace.md`). Create that folder if needed. Do not leave tutorial temps in the repo root or under `skills/`.

**First-month workbook template (committed, scrubbed):** `skills/bank-reconciliation/Y[date]_[company]_Reconciliation.xlsx`. Upload a copy of that file for the initial month only; never edit the repo file in place, and never leave a filled private copy under `skills/`.

## Test mode

Run **test mode** when the operator asks to reconcile with **test mode**, **sample data**, or **try with test data** (or equivalent).

In test mode the Sheets / Drive path is unchanged (month folders, template or copied sheet, import, fill columns, seed reference tabs, expenses upload, Invoice links). Only the **CSV source** and **invoice search** change:

| Live | Test mode |
| --- | --- |
| Bank CSV from Drive `{drive.extracts_folder}` | Copy `skills/bank-reconciliation/test-data/bank-statement.csv` into that Extracts month folder, then import as usual |
| Gmail on `{google_account}` | Parse local `.eml` files under `skills/bank-reconciliation/test-data/emails/` — **never** search or change Gmail |

**Fixed statement month:** November 2024 (`{YYYY}` = `2024`, `{YYYYMM}` = `202411`). Do not use “last month.”

**Fixture paths** are repo-relative under the skill folder (`skills/bank-reconciliation/test-data/…`). They are committed sample data, not disposable staging — do not treat them as `{workspace.local_path}` files. When you extract a PDF from an EML before Drive upload, stage the extract under `{workspace.local_path}/`.

**Invoice addressee:** fixtures use **Demo Company Ltd**. For Note / addressee checks in test mode, treat that name as the expected company (do not flag a mismatch solely because it differs from `{company.name}`). Sheet titles still use `{company.name}` from the profile.

**Test-mode steps:**

1. Set the statement month to `202411` / year `2024`.
2. Ensure year, extracts, and month folders exist under `{drive.root_path}` as in section 1.
3. Copy `skills/bank-reconciliation/test-data/bank-statement.csv` into `{drive.root_path}/{drive.year_folder_pattern}/{drive.extracts_folder}/{drive.month_folder_pattern}/` (create folders if needed). Then continue sections 1–6 as usual (CSV is already on Drive) — fill Bank, seed reference tabs (section 5), then verify before invoice matching.
4. For invoice matching (section 8), instead of Gmail: open each `skills/bank-reconciliation/test-data/emails/*.eml`. Match each Debit row using `From`, subject, amount, and date (same confirmation fields as live: Date, Recipient / Payer, Debit). Prefer the PDF attachment in the multipart message; extract it under `{workspace.local_path}/`, then upload to `{drive.expenses_folder}` with the usual `YYYY-MM-DD_Counterparty_Amount.pdf` naming, set Invoice as a filename-labeled hyperlink with Clip overflow (see section 8), update `Email matching`, and skip bank-fee rows unless an invoice clearly exists. The fixture pack includes one bank-fee debit with no EML — leave it unmatched.
5. After the run, read `skills/bank-reconciliation/test-data/expected-results.md` and report pass/fail against that checklist (including that Gmail was not used).

## 1. Prepare the month's folder and sheet
- **Year and month folders.** The year folder is `{drive.year_folder_pattern}` under `{drive.root_path}` (`{YYYY}` is the year of the month being reconciled). If that year folder does not exist, create it, and create its `{drive.extracts_folder}` subfolder. Then create the month folder `{drive.month_folder_pattern}` inside the year folder if it does not exist (`{YYYYMM}` is the statement month).
- **CSV.** Look first for the bank CSV in `{drive.root_path}/{drive.year_folder_pattern}/{drive.extracts_folder}/{drive.month_folder_pattern}/`. If it is not there, ask the user for it. When the user provides it, save it into that Drive folder, creating the folder if needed, before importing. If you stage the file locally first, put it under `{workspace.local_path}/` then upload to Drive. In **test mode**, use the fixture copy step in **Test mode** instead of asking for a live export.
- **Starting sheet.** Look for the previous month's reconciliation sheet in that month's folder (`{drive.month_folder_pattern}` under its own `{drive.year_folder_pattern}`). For January, the previous month's folder is in the previous year's folder.
  - **If a previous month's sheet exists:** copy it into this month's folder, named from `{drive.sheet_title_pattern}` (fill `{YYYYMM}` with the statement month and `{company_name}` with `{company.name}`). Use it because it has the latest mappings in `Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Email matching` and `Categories`. On the copy only, clear the previous month's transaction data and the raw CSV area on the `{drive.sheet_tab}` tab, and keep that tab's header row and the reference tabs intact. Never modify the previous month's sheet. If the copy is still an `.xlsx`, convert it to a native Google Sheet so the Sheets tools can edit it.
  - **If no previous month's sheet exists (initial run):** upload a **copy** of the scrubbed template `skills/bank-reconciliation/Y[date]_[company]_Reconciliation.xlsx` into this month's folder under `{drive.root_path}/{drive.year_folder_pattern}/{drive.month_folder_pattern}/`. Rename the Drive file to `{drive.sheet_title_pattern}` (fill `{YYYYMM}` with the statement month and `{company_name}` with `{company.name}`). Convert that `.xlsx` to a **native Google Sheet** so the Sheets tools can edit it. Do **not** create a blank spreadsheet from scratch, and do **not** modify the repo template file.
    - The template already has the required tabs and header rows (no sample/private data): `{drive.sheet_tab}` (`Bank`), `Counterparties`, `Categories`, `Counterparty-Match`, `Counterparty-Category`, `Email matching`. Keep the template's tab visibility (Bank / Counterparties / Categories visible; the other three hidden) unless the operator asks otherwise.
    - On `Bank`, the raw CSV header row is already present in columns H–K (`Date` | `Merchant` | `Amount` | `Description`). When importing (section 3), write CSV **data** under those headers starting at row 2; do not duplicate the H–K header row unless the layout differs.

## 2. Inspect the layout before writing
- Tabs used: the transactions tab `{drive.sheet_tab}`, `Categories` (the category list), `Counterparty-Match` (raw-to-formatted names), `Counterparties` (unique formatted names), `Counterparty-Category` (name to category), `Email matching` (how to find each counterparty's invoice emails). Tab names can change, so check them each time.
- Read the main transactions tab (`{drive.sheet_tab}`) headers in row 1. The user edits the layout, so locate columns by header name each time. Expected layout: Date | Recipient / Payer | Category | Credit | Debit | Invoice | Note, then the raw CSV area to the right. If an older sheet still has a `Ref` header, rename it to `Invoice` before writing links.
- Category spellings come from the `Categories` tab (the category list).

## 3. Import the CSV
- Paste the CSV into the tab starting at the first empty column to the right of the reconciliation columns (column H after the seven headers above; adjust if the layout changed). If row 1 already has raw CSV headers there (as in the skill template), keep them and write data from row 2. Otherwise put headers in row 1 and data from row 2. Write numbers as numbers and dates as real dates.
- After the import is written, **hide every imported raw CSV column** (typically H onward through the last CSV column used). Keep the seven reconciliation columns visible. You may still read the hidden columns when filling Recipient / Payer, amounts, or matching invoices — do not unhide them unless the operator asks.

## 4. Fill the reconciliation columns, one row per CSV row
- **Date**: the transaction date as a real date, number format `d-mmm` (displays 5-Nov, no leading zero).
- **Recipient / Payer**: take the raw name from Merchant, else Payee Name, else Payer Name, else Description. Look it up in `Counterparty-Match` (A = formatted `Recipient / Payer`, B = `Match` raw bank name) with a loose match (contains or key words, since raw strings change monthly) and write the formatted name. If there's no match, write your best clean, properly cased name for the entity.
- **Category**: first look up the formatted counterparty in `Counterparty-Category` and use its category. With no match, pick from the `Categories` tab. If `Categories` and `Counterparty-Category` have no data rows yet (typical first month), invent a short consistent category for the Bank row — do not leave Category blank. Keep spellings consistent across rows and with earlier months when those tabs already have data.
- **Credit**: the absolute amount if money came in, else blank.
- **Debit**: the absolute amount if money went out, else blank.
- Clear any leftover formulas or junk in rows below the last data row.

## 5. Seed reference tabs from the filled Bank rows
In the **same run**, after section 4 and before the verify report, seed (or extend) the reference tabs from the filled `{drive.sheet_tab}` rows and the raw bank string used for each row (Merchant / Payee Name / Payer Name / Description):

- **`Categories`**: unique Category values from Bank; no duplicates; no blank categories.
- **`Counterparty-Match`**: one row per unique formatted `Recipient / Payer`, with `Match` = the raw bank string for that counterparty; no duplicates.
- **`Counterparties`**: unique formatted `Recipient / Payer` values in column A.
- **`Counterparty-Category`**: one row per unique formatted name with the Category used on Bank for that name.

Skip writing a row when the same key already exists (month-2 copies already have mappings; only add genuinely new counterparties or categories). Do **not** unhide the reference tabs unless the operator asks.

## 6. Verify and report
- Read back the filled range: the row count should match the CSV, dates should display as d-mmm, and SUM(Credit) and SUM(Debit) should equal the CSV's total in and total out.
- Confirm the four reference tabs from section 5 have data rows consistent with Bank (not header-only after a first fill).
- Report the file link, the totals, the category counts, that the reference tabs were seeded or updated for new counterparties, and any guesses (new counterparties, unsure categories).

## 7. After the user reviews
When the operator says they have finished editing Category or Counterparty names (or other manual sheet changes), re-read `{drive.sheet_tab}` against the reference tabs and **update mappings so everything stays linked**:

- Sync `Counterparty-Match` (formatted name ↔ raw Match string) without duplicates.
- Sync unique formatted names into `Counterparties`.
- Sync `Counterparty-Category` and unique spellings into `Categories`.
- If a counterparty was renamed, update the matching `Recipient / Payer` in `Email matching` so invoice rules still line up.

## 8. Match invoices from email
Run when the user asks to match invoices (or as the last step of a reconciliation if they want it). **In test mode, follow the EML steps in Test mode instead of searching Gmail** — do not use `{google_account}` Gmail for matching.

For every `{drive.sheet_tab}` row with a Debit (live mode only for steps 1–2):
1. **Check `Email matching` first.** Read the tab's headers and rows. If the row's Recipient / Payer is listed, search Gmail on `{google_account}` with that rule (sender, subject keywords, attachment hints, etc.), narrowed by the row's Date and Debit amount.
2. **Otherwise do a general search** on `{google_account}`: the counterparty name and raw merchant text, a date window of about two weeks before to a few days after the bank date, and the amount (also the original currency amount from the raw CSV columns for FX charges, e.g. USD or GBP). Use Date, Recipient / Payer and Debit as the key fields to confirm the match.
3. **When a match is found:**
   - Get the invoice: prefer a PDF attachment. If it's only in the body or behind a link, save the email as a PDF or download the linked PDF under `{workspace.local_path}/`, and say so in the Note.
   - Upload it to Google Drive in a subfolder named `{drive.expenses_folder}` inside the spreadsheet's folder (create it once, then reuse it). Name it `YYYY-MM-DD_Counterparty_Amount.pdf` and don't upload duplicates.
   - Put a link to the Drive file in the row's **Invoice** column: the **visible link text must be the saved filename** (e.g. `2024-11-05_Acme Cloud_49.00.pdf`), not the raw URL. Use a Sheets hyperlink whose label is that filename (for example `=HYPERLINK("https://…", "YYYY-MM-DD_Counterparty_Amount.pdf")`, or the connector equivalent). Format the **Invoice** column (or those cells) with **Clip** text overflow — do not Wrap — so long labels stay readable in a narrow column.
   - Write a Note only when something needs the user's attention, such as an amount mismatch (FX or VAT), an invoice that covers several charges, a date far off, a receipt instead of an invoice, an invoice addressed to someone other than `{company.name}` (in **test mode**, use **Demo Company Ltd** as the expected addressee), or an uncertain match.
   - Right away, as part of the same match (not batched for the end), if the counterparty wasn't already in `Email matching`, or the rule needed changing to find it, add or update its row with the rule that worked (sender address or domain, subject pattern, whether the invoice is an attachment or a link, and any quirks), following the tab's columns and without duplicates.
4. Skip bank-fee rows (service fees etc) unless an invoice clearly exists.
5. Never send, reply to, or change any emails.
6. Before reporting, re-read `Email matching` and confirm every match found has its rule saved there.
7. **Report:** the `{drive.expenses_folder}` folder link, the matches found, any notes written, and a clear list of rows still missing an invoice (Date, Recipient / Payer, Debit), so the user can upload those files manually. When they do, upload each one to `{drive.expenses_folder}` with the same naming, put a filename-labeled hyperlink in Invoice (Clip overflow), and add a note if needed. In **test mode**, also report pass/fail against `skills/bank-reconciliation/test-data/expected-results.md`.

## 9. Final step: hand back to the user
End every run by telling the user: they may update Category names or Counterparty names directly on the spreadsheet; when they are finished, they should let you know so you can verify everything and correctly relink the reference tabs (`Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Categories`, and `Email matching` if names changed) — see section 7.
