---
name: Bank reconciliation
description: >-
  Use when the user wants to reconcile a month's bank transactions (e.g. a bank
  CSV export) in their Google Sheets reconciliation workbook: create a blank
  Google Sheet on the first month (tabs + headers only), copy last month's sheet
  thereafter, import the CSV, and fill date, counterparty, category, credit and
  debit columns.
---
# Monthly bank reconciliation in Google Sheets

Do this Drive work under `{drive.root_path}`. Find the reconciliation sheet and the bank CSV on Drive as described below. Use the Google Drive and Google Sheets connectors (load the google-drive and google-sheets skills first).

If you must save a CSV, PDF, or other file **locally** before uploading to Drive (or as a scratch copy), write it under `{workspace.local_path}/` (see `rules/tutorial-workspace.md`). Create that folder if needed. Do not leave tutorial temps in the repo root or under `skills/`.

Never use or upload a local `.xlsx` template from this repo. There is no spreadsheet binary in the skill folder.

## 1. Prepare the month's folder and sheet
- **Year and month folders.** The year folder is `{drive.year_folder_pattern}` under `{drive.root_path}` (`{YYYY}` is the year of the month being reconciled). If that year folder does not exist, create it, and create its `{drive.extracts_folder}` subfolder. Then create the month folder `{drive.month_folder_pattern}` inside the year folder if it does not exist (`{YYYYMM}` is the statement month).
- **CSV.** Look first for the bank CSV in `{drive.root_path}/{drive.year_folder_pattern}/{drive.extracts_folder}/{drive.month_folder_pattern}/`. If it is not there, ask the user for it. When the user provides it, save it into that Drive folder, creating the folder if needed, before importing. If you stage the file locally first, put it under `{workspace.local_path}/` then upload to Drive.
- **Starting sheet.** Look for the previous month's reconciliation sheet in that month's folder (`{drive.month_folder_pattern}` under its own `{drive.year_folder_pattern}`). For January, the previous month's folder is in the previous year's folder.
  - **If a previous month's sheet exists:** copy it into this month's folder, named from `{drive.sheet_title_pattern}` (fill `{YYYYMM}` with the statement month and `{company_name}` with `{company.name}`). Use it because it has the latest mappings in `Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Email matching` and `Categories`. On the copy only, clear the previous month's transaction data and the raw CSV area on the `{drive.sheet_tab}` tab, and keep that tab's header row and the reference tabs intact. Never modify the previous month's sheet. If the copy is still an `.xlsx`, convert it to a native Google Sheet so the Sheets tools can edit it.
  - **If no previous month's sheet exists (initial run):** create a **new blank native Google Spreadsheet** (do not upload any local file). Title it from `{drive.sheet_title_pattern}`. Create these tabs in order with **header row only** (no sample or private data rows):
    - `{drive.sheet_tab}` (`Bank`): `Date` | `Recipient / Payer` | `Category` | `Credit` | `Debit` | `Ref` | `Note`
    - `Categories`: `Category`
    - `Counterparty-Match`: `Recipient / Payer` | `Match`
    - `Counterparties`: `Recipient / Payer`
    - `Counterparty-Category`: `Recipient / Payer` | `Category`
    - `Email matching`: `Recipient / Payer` | `Sender` | `Subject keywords` | `Invoice source` | `Notes`
    Then **hide every tab except** `{drive.sheet_tab}` (`Bank`). Use the Sheets connector's sheet-property / update path if available; if hiding is impossible with the available tools, stop and ask the operator to hide those tabs once before continuing. Finally move (or ensure) the spreadsheet lives in this month's folder under `{drive.root_path}/{drive.year_folder_pattern}/{drive.month_folder_pattern}/`.

## 2. Inspect the layout before writing
- Tabs used: the transactions tab `{drive.sheet_tab}`, `Categories` (the category list), `Counterparty-Match` (raw-to-formatted names), `Counterparties` (unique formatted names), `Counterparty-Category` (name to category), `Email matching` (how to find each counterparty's invoice emails). Tab names can change, so check them each time.
- Read the main transactions tab (`{drive.sheet_tab}`) headers in row 1. The user edits the layout, so locate columns by header name each time. Expected layout: Date | Recipient / Payer | Category | Credit | Debit | Ref | Note, then the raw CSV area to the right.
- Category spellings come from the `Categories` tab (the category list).

## 3. Import the CSV
- Paste the CSV into the tab starting at the first empty column to the right of the reconciliation columns (column H after the seven headers above; adjust if the layout changed). Headers go in row 1 and data starts in row 2. Write numbers as numbers and dates as real dates.

## 4. Fill the reconciliation columns, one row per CSV row
- **Date**: the transaction date as a real date, number format `d-mmm` (displays 5-Nov, no leading zero).
- **Recipient / Payer**: take the raw name from Merchant, else Payee Name, else Payer Name, else Description. Look it up in `Counterparty-Match` (A = formatted `Recipient / Payer`, B = `Match` raw bank name) with a loose match (contains or key words, since raw strings change monthly) and write the formatted name. If there's no match, write your best clean, properly cased name for the entity.
- **Category**: first look up the formatted counterparty in `Counterparty-Category` and use its category. With no match, pick from the `Categories` tab. Keep them consistent with earlier months.
- **Credit**: the absolute amount if money came in, else blank.
- **Debit**: the absolute amount if money went out, else blank.
- Clear any leftover formulas or junk in rows below the last data row.

## 5. Verify and report
- Read back the filled range: the row count should match the CSV, dates should display as d-mmm, and SUM(Credit) and SUM(Debit) should equal the CSV's total in and total out.
- Report the file link, the totals, the category counts, and any guesses (new counterparties not in `Counterparty-Match`, unsure categories).

## 6. After the user reviews
- If the user renames counterparties, add or update their mappings (formatted name to raw Match string) in the `Counterparty-Match` tab, without duplicates, so the next month picks them up, and add any new name to the `Counterparties` tab (a unique list of formatted names in column A).
- Likewise add any new counterparty and its agreed category to `Counterparty-Category`.

## 7. Match invoices from email
Run when the user asks to match invoices (or as the last step of a reconciliation if they want it). For every `{drive.sheet_tab}` row with a Debit:
1. **Check `Email matching` first.** Read the tab's headers and rows. If the row's Recipient / Payer is listed, search Gmail on `{google_account}` with that rule (sender, subject keywords, attachment hints, etc.), narrowed by the row's Date and Debit amount.
2. **Otherwise do a general search** on `{google_account}`: the counterparty name and raw merchant text, a date window of about two weeks before to a few days after the bank date, and the amount (also the original currency amount from the raw CSV columns for FX charges, e.g. USD or GBP). Use Date, Recipient / Payer and Debit as the key fields to confirm the match.
3. **When a match is found:**
   - Get the invoice: prefer a PDF attachment. If it's only in the body or behind a link, save the email as a PDF or download the linked PDF under `{workspace.local_path}/`, and say so in the Note.
   - Upload it to Google Drive in a subfolder named `{drive.expenses_folder}` inside the spreadsheet's folder (create it once, then reuse it). Name it `YYYY-MM-DD_Counterparty_Amount.pdf` and don't upload duplicates.
   - Put a link to the Drive file in the row's Ref column.
   - Write a Note only when something needs the user's attention, such as an amount mismatch (FX or VAT), an invoice that covers several charges, a date far off, a receipt instead of an invoice, an invoice addressed to someone other than `{company.name}`, or an uncertain match.
   - Right away, as part of the same match (not batched for the end), if the counterparty wasn't already in `Email matching`, or the rule needed changing to find it, add or update its row with the rule that worked (sender address or domain, subject pattern, whether the invoice is an attachment or a link, and any quirks), following the tab's columns and without duplicates.
4. Skip bank-fee rows (service fees etc) unless an invoice clearly exists.
5. Never send, reply to, or change any emails.
6. Before reporting, re-read `Email matching` and confirm every match found has its rule saved there.
7. **Report:** the `{drive.expenses_folder}` folder link, the matches found, any notes written, and a clear list of rows still missing an invoice (Date, Recipient / Payer, Debit), so the user can upload those files manually. When they do, upload each one to `{drive.expenses_folder}` with the same naming, link it in Ref, and add a note if needed.

## 8. Final step: hand back to the user
End every run by telling the user: once they've finished making their own manual changes to the spreadsheet (renamed counterparties, changed categories, uploaded invoices, etc.), they should let you know, so you can check the `{drive.sheet_tab}` tab against the reference tabs (`Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Email matching`, `Categories`) and update them to match (see section 6).
