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

In test mode the Sheets / Drive path is unchanged (month folders, template or copied sheet, import, fill columns, seed reference tabs, Expenses / Revenue uploads, Invoice links). Only the **CSV source** and **invoice search** change:

| Live | Test mode |
| --- | --- |
| Bank CSV from Drive `{drive.extracts_folder}` | Copy `skills/bank-reconciliation/test-data/bank-statement.csv` into that Extracts month folder, then import as usual |
| Gmail inbox / Sent on `{google_account}` | Parse local `.eml` files — **never** search or change Gmail. Expense (Debit) fixtures: `skills/bank-reconciliation/test-data/emails/*.eml`. Revenue (Credit) fixtures: `skills/bank-reconciliation/test-data/emails/sent/*.eml` |

**Fixed statement month:** November 2024 (`{YYYY}` = `2024`, `{YYYYMM}` = `202411`). Do not use “last month.”

**Fixture paths** are repo-relative under the skill folder (`skills/bank-reconciliation/test-data/…`). They are committed sample data, not disposable staging — do not treat them as `{workspace.local_path}` files. When you extract a PDF from an EML before Drive upload, stage the extract under `{workspace.local_path}/`.

**Invoice addressee:** expense fixtures use **Demo Company Ltd** as the buyer. For Notes / addressee checks on expense invoices in test mode, treat that name as the expected company (do not flag a mismatch solely because it differs from `{company.name}`). Outbound revenue fixtures are **from** Demo Company Ltd to clients. Sheet titles still use `{company.name}` from the profile.

**Test-mode steps:**

1. Set the statement month to `202411` / year `2024`.
2. Ensure year, extracts, and month folders exist under `{drive.root_path}` as in section 1.
3. Copy `skills/bank-reconciliation/test-data/bank-statement.csv` into `{drive.root_path}/{drive.year_folder_pattern}/{drive.extracts_folder}/{drive.month_folder_pattern}/` (create folders if needed). Then continue sections 1–6 as usual (CSV is already on Drive) — fill Bank, seed reference tabs (section 5), then verify before invoice matching.
4. For expense invoice matching (section 8): open each `skills/bank-reconciliation/test-data/emails/*.eml` (not under `sent/`). Match each Debit row using `From`, subject, amount, and date (confirmation fields: Date, Counterparty, Debit). Prefer the PDF attachment; extract under `{workspace.local_path}/`, upload to `{drive.expenses_folder}`, set Invoice / VAT / Ref, update Counterparties contact fields and `Email matching` as in section 8. Skip bank-fee rows unless an invoice clearly exists. Fixture pack includes unmatched debits with no EML — leave those unmatched.
5. For revenue invoice matching (section 9): open each `skills/bank-reconciliation/test-data/emails/sent/*.eml`. Match Credit rows (Date, Counterparty, Credit); upload to `{drive.revenue_folder}`; set Invoice / VAT / Ref. Also check the Drive Revenue folder for an existing file before relying only on the EML.
6. After the run, read `skills/bank-reconciliation/test-data/expected-results.md` and report pass/fail against that checklist (including that Gmail was not used).

## 1. Prepare the month's folder and sheet
- **Year and month folders.** The year folder is `{drive.year_folder_pattern}` under `{drive.root_path}` (`{YYYY}` is the year of the month being reconciled). If that year folder does not exist, create it, and create its `{drive.extracts_folder}` subfolder. Then create the month folder `{drive.month_folder_pattern}` inside the year folder if it does not exist (`{YYYYMM}` is the statement month).
- **CSV.** Look first for the bank CSV in `{drive.root_path}/{drive.year_folder_pattern}/{drive.extracts_folder}/{drive.month_folder_pattern}/`. If it is not there, ask the user for it. When the user provides it, save it into that Drive folder, creating the folder if needed, before importing. If you stage the file locally first, put it under `{workspace.local_path}/` then upload to Drive. In **test mode**, use the fixture copy step in **Test mode** instead of asking for a live export.
- **Starting sheet.** Look for the previous month's reconciliation sheet in that month's folder (`{drive.month_folder_pattern}` under its own `{drive.year_folder_pattern}`). For January, the previous month's folder is in the previous year's folder.
  - **If a previous month's sheet exists:** copy it into this month's folder, named from `{drive.sheet_title_pattern}` (fill `{YYYYMM}` with the statement month and `{company_name}` with `{company.name}`). Use it because it has the latest mappings in `Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Email matching` and `Categories`. On the copy only, clear the previous month's transaction data and the raw CSV area on the `{drive.sheet_tab}` tab, and keep that tab's header row and the reference tabs intact. Never modify the previous month's sheet. If the copy is still an `.xlsx`, convert it to a native Google Sheet so the Sheets tools can edit it.
  - **If no previous month's sheet exists (initial run):** upload a **copy** of the scrubbed template `skills/bank-reconciliation/Y[date]_[company]_Reconciliation.xlsx` into this month's folder under `{drive.root_path}/{drive.year_folder_pattern}/{drive.month_folder_pattern}/`. Rename the Drive file to `{drive.sheet_title_pattern}` (fill `{YYYYMM}` with the statement month and `{company_name}` with `{company.name}`). Convert that `.xlsx` to a **native Google Sheet** so the Sheets tools can edit it. Do **not** create a blank spreadsheet from scratch, and do **not** modify the repo template file.
    - The template already has the required tabs and header rows (no sample/private data): `{drive.sheet_tab}` (`Bank`), `Counterparties`, `Categories`, `Counterparty-Match`, `Counterparty-Category`, `Email matching`. Keep the template's tab visibility (Bank / Counterparties / Categories visible; the other three hidden) unless the operator asks otherwise.
    - On `Bank`, the raw CSV header row is already present in columns K–N (`Date` | `Merchant` | `Amount` | `Description`). When importing (section 3), write CSV **data** under those headers starting at row 2; do not duplicate the K–N header row unless the layout differs.

## 2. Inspect the layout before writing
- Tabs used: the transactions tab `{drive.sheet_tab}`, `Categories` (the category list), `Counterparty-Match` (raw-to-formatted names), `Counterparties` (unique formatted names plus contact fields), `Counterparty-Category` (name to category), `Email matching` (how to find each counterparty's invoice emails). Tab names can change, so check them each time.
- Read the main transactions tab (`{drive.sheet_tab}`) headers in row 1. The user edits the layout, so locate columns by header name each time. Expected layout: Date | Counterparty | Category | Credit | Debit | VAT | Ref | Invoice | Notes | Source, then the raw CSV area to the right (typically K onward). If an older sheet still has `Recipient / Payer`, treat that column as Counterparty (rename the header when practical). Do **not** rename `Ref` to `Invoice` — `Ref` is the invoice reference number; `Invoice` holds the Drive file link.
- Category spellings come from the `Categories` tab (the category list).

## 3. Import the CSV
- Paste the CSV into the tab starting at the first empty column to the right of the reconciliation columns (column K after the ten headers above; adjust if the layout changed). If row 1 already has raw CSV headers there (as in the skill template), keep them and write data from row 2. Otherwise put headers in row 1 and data from row 2. Write numbers as numbers and dates as real dates.
- After the import is written, **hide every imported raw CSV column** (typically K onward through the last CSV column used). Keep the ten reconciliation columns (A–J) visible. You may still read the hidden columns when filling Counterparty, amounts, or matching invoices — do not unhide them unless the operator asks.

## 4. Fill the reconciliation columns, one row per CSV row
- **Date**: the transaction date as a real date, number format `d-mmm` (displays 5-Nov, no leading zero).
- **Counterparty**: take the raw name from Merchant, else Payee Name, else Payer Name, else Description. Look it up in `Counterparty-Match` (A = formatted `Counterparty`, B = `Match` raw bank name) with a loose match (contains or key words, since raw strings change monthly) and write the formatted name. If there's no match, write your best clean, properly cased name for the entity. For credit rows this is the **paying client** from the bank string, not `{company.name}`.
- **Category**: first look up the formatted counterparty in `Counterparty-Category` and use its category. With no match, pick from the `Categories` tab. If `Categories` and `Counterparty-Category` have no data rows yet (typical first month), invent a short consistent category for the Bank row — do not leave Category blank. Keep spellings consistent across rows and with earlier months when those tabs already have data.
- **Credit**: the absolute amount if money came in, else blank.
- **Debit**: the absolute amount if money went out, else blank.
- **VAT**, **Ref**, **Invoice**, **Notes**: leave blank during this fill pass; fill them when matching invoices (sections 8–9). Do not invent VAT or Ref.
- **Source**: leave as-is / blank unless the operator already uses it; do not require filling it.
- Clear any leftover formulas or junk in rows below the last data row.

## 5. Seed reference tabs from the filled Bank rows
In the **same run**, after section 4 and before the verify report, seed (or extend) the reference tabs from the filled `{drive.sheet_tab}` rows and the raw bank string used for each row (Merchant / Payee Name / Payer Name / Description):

- **`Categories`**: unique Category values from Bank; no duplicates; no blank categories.
- **`Counterparty-Match`**: one row per unique formatted `Counterparty`, with `Match` = the raw bank string for that counterparty; no duplicates.
- **`Counterparties`**: unique formatted `Counterparty` values in column A (include credit counterparties / clients). Leave Email / Phone / Registration / Address blank until an invoice match supplies them (section 8–9).
- **`Counterparty-Category`**: one row per unique formatted name with the Category used on Bank for that name.

Skip writing a row when the same key already exists (month-2 copies already have mappings; only add genuinely new counterparties or categories). Do **not** unhide the reference tabs unless the operator asks.

## 6. Verify and report
- Read back the filled range: the row count should match the CSV, dates should display as d-mmm, and SUM(Credit) and SUM(Debit) should equal the CSV's total in and total out.
- Confirm the four reference tabs from section 5 have data rows consistent with Bank (not header-only after a first fill).
- Report the file link, the totals, the category counts, that the reference tabs were seeded or updated for new counterparties, and any guesses (new counterparties, unsure categories).

## 7. After the user reviews
When the operator says they have finished editing Category or Counterparty names (or other manual sheet changes), re-read `{drive.sheet_tab}` against the reference tabs and **update mappings so everything stays linked**:

- Sync `Counterparty-Match` (formatted name ↔ raw Match string) without duplicates.
- Sync unique formatted names into `Counterparties` (preserve existing Email / Phone / Registration / Address when only the name key is syncing).
- Sync `Counterparty-Category` and unique spellings into `Categories`.
- If a counterparty was renamed, update the matching `Counterparty` in `Email matching` so invoice rules still line up.

## 8. Match expense invoices (Debit rows)
Run when the user asks to match invoices (or as the last step of a reconciliation if they want it). **In test mode, follow the EML steps in Test mode instead of searching Gmail** — do not use `{google_account}` Gmail for matching.

For every `{drive.sheet_tab}` row with a Debit (live mode only for steps 1–2):
1. **Check `Email matching` first.** Read the tab's headers and rows. If the row's Counterparty is listed, search Gmail on `{google_account}` with that rule (sender, subject keywords, attachment hints, etc.), narrowed by the row's Date and Debit amount.
2. **Otherwise do a general search** on `{google_account}`: the counterparty name and raw merchant text, a date window of about two weeks before to a few days after the bank date, and the amount (also the original currency amount from the raw CSV columns for FX charges, e.g. USD or GBP). Use Date, Counterparty and Debit as the key fields to confirm the match.
3. **When a match is found:**
   - Get the invoice: prefer a PDF attachment. If it's only in the body or behind a link, save the email as a PDF or download the linked PDF under `{workspace.local_path}/`, and say so in Notes.
   - Upload it to Google Drive in a subfolder named `{drive.expenses_folder}` inside the spreadsheet's folder (create it once, then reuse it). Name it `YYYY-MM-DD_Counterparty_Amount.pdf` and don't upload duplicates.
   - Put a link to the Drive file in the row's **Invoice** column: the **visible link text must be the saved filename** (e.g. `2024-11-05_Acme Cloud_49.00.pdf`), not the raw URL. Use a Sheets hyperlink whose label is that filename (for example `=HYPERLINK("https://…", "YYYY-MM-DD_Counterparty_Amount.pdf")`, or the connector equivalent). Format the **Invoice** column (or those cells) with **Clip** text overflow — do not Wrap — so long labels stay readable in a narrow column.
   - Fill **VAT** with the tax amount extracted from the invoice when present; leave blank if the invoice has no tax line.
   - Fill **Ref** with the invoice reference / invoice number when present; leave blank if none.
   - Write Notes only when something needs the user's attention, such as an amount mismatch (FX or VAT), an invoice that covers several charges, a date far off, a receipt instead of an invoice, an invoice addressed to someone other than `{company.name}` (in **test mode**, use **Demo Company Ltd** as the expected addressee), or an uncertain match.
   - **Update `Counterparties` contact fields** for this Counterparty from the invoice (Email, Phone, Registration, Address). If multiple emails appear, prefer the one that matches finance / billing / accounts. If the counterparty row already exists and any of those values **changed**, overwrite them on the current month's sheet and **inform the operator** what was updated (old → new). Never invent contact fields.
   - Right away, as part of the same match (not batched for the end), if the counterparty wasn't already in `Email matching`, or the rule needed changing to find it, add or update its row with the rule that worked (sender address or domain, subject pattern, whether the invoice is an attachment or a link, and any quirks), following the tab's columns and without duplicates.
4. Skip bank-fee rows (service fees etc) unless an invoice clearly exists.
5. Never send, reply to, or change any emails.
6. Before reporting, re-read `Email matching` and confirm every expense match found has its rule saved there.
7. **Report (expenses):** the `{drive.expenses_folder}` folder link, the matches found, any Notes written, Counterparties contact updates told to the operator, and a clear list of Debit rows still missing an invoice (Date, Counterparty, Debit), so the user can upload those files manually. When they do, upload each one to `{drive.expenses_folder}` with the same naming, put a filename-labeled hyperlink in Invoice (Clip overflow), fill VAT / Ref when known, and add a note if needed.

## 9. Match revenue invoices (Credit rows)
Match outbound invoices the company sent (clients paying for work). Run with section 8 when invoice matching is requested.

For every `{drive.sheet_tab}` row with a Credit:

1. Ensure a Drive subfolder named `{drive.revenue_folder}` exists inside the spreadsheet's folder (create once, then reuse).
2. **Check `{drive.revenue_folder}` first** for an existing PDF that matches Date / Counterparty / Credit (same `YYYY-MM-DD_Counterparty_Amount.pdf` naming when possible).
3. **Otherwise search Gmail Sent** on `{google_account}` for outbound invoices to that client (counterparty name, amount, date window of about two weeks before to a few days after the bank date). In **test mode**, use `skills/bank-reconciliation/test-data/emails/sent/*.eml` instead of Gmail Sent.
4. **When a match is found:**
   - Prefer a PDF attachment; stage under `{workspace.local_path}/` if extracting from email.
   - Upload to `{drive.revenue_folder}` as `YYYY-MM-DD_Counterparty_Amount.pdf` (no duplicates).
   - Set **Invoice** as a filename-labeled hyperlink with Clip overflow (same rules as expenses).
   - Fill **VAT** and **Ref** from the outbound invoice when present.
   - Update `Counterparties` Email / Phone / Registration / Address from the client's details on the invoice when present; if values changed, overwrite and **inform the operator**. Prefer finance / billing emails when several are listed. Never invent values.
   - Seed / keep the Counterparty on `Counterparties`, `Counterparty-Match`, and `Counterparty-Category` like any other bank row (section 5) — the Counterparty is the **paying client**, not `{company.name}`.
5. Never send, reply to, or change any emails.
6. **Report (revenue):** the `{drive.revenue_folder}` folder link, credit matches found, Counterparties updates, and Credit rows still missing an invoice (Date, Counterparty, Credit).

In **test mode**, after expenses and revenue matching, also report pass/fail against `skills/bank-reconciliation/test-data/expected-results.md`.

## 10. Final step: hand back to the user
End every run by telling the user: they may update Category names or Counterparty names directly on the spreadsheet; when they are finished, they should let you know so you can verify everything and correctly relink the reference tabs (`Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Categories`, and `Email matching` if names changed) — see section 7.
