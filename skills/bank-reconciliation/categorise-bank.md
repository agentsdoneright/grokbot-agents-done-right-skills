---
name: Categorise bank data
version: 1.0.0
description: >-
  Version 1.0.0. Use when the user wants to categorise bank transactions already
  imported into their Google Sheets reconciliation workbook: fill Date,
  Counterparty, Category, Credit, and Debit from the raw CSV columns, seed
  Categories (including Type) and Counterparty reference tabs, verify totals,
  and remapping after the operator edits names. Requires Import bank CSV first.
  Does not paste the CSV, match invoices, or update Summary — run Match invoices
  after categorising when invoice matching is needed.
---
# Categorise bank data

Do this Drive work under `{drive.root_path}/{drive.accounts_folder}`. Use the Google Drive and Google Sheets connectors (load the google-drive and google-sheets skills first).

If you must save a scratch file **locally**, write it under `{workspace.local_path}/`. Create that folder if needed.

**Prerequisite:** the month’s reconciliation sheet already has raw bank CSV data pasted (see [`import-bank-csv.md`](import-bank-csv.md)). If the raw CSV area is empty, stop and tell the operator to run Import first.

**Next skill (when matching invoices):** [`match-invoices.md`](match-invoices.md).

This skill does **not** update the Summary tab (Match invoices owns Summary).

## Test session (optional)

If `{workspace.local_path}/bookkeeping-test-session.yaml` exists and `active` is true, use that session’s `statement_year` / `statement_month` when locating the month sheet. Otherwise resolve the month from the operator or the most recent sheet they name.

## 1. Locate the sheet and layout

- Open the month sheet named from `{drive.sheet_title_pattern}` under `{drive.root_path}/{drive.accounts_folder}/{drive.year_folder_pattern}/{drive.month_folder_pattern}/`.
- Tabs used: the transactions tab, `Categories` (including **Type**), `Counterparty-Match`, `Counterparties`, `Counterparty-Category`, `Email matching`, and `Summary` (read-only here). Tab names can change, so check them each time.
- **Transactions tab.** Start from `{drive.sheet_tab}` (template name: **`Bank Transactions`**). If missing, find the tab with Date, Counterparty, Category, Credit, Debit, Invoice. Older sheets may be named `Bank`.
- Locate the **header row by column names**. Expected headers: Date | Counterparty | Category | Credit | Debit | VAT | Ref | Invoice | Notes | Source, then the raw CSV area to the right (typically K onward). Notes and Source may be swapped. If an older sheet has `Recipient / Payer`, treat it as Counterparty. Do **not** rename `Ref` to `Invoice`.
- Category spellings come from the `Categories` tab.
- Confirm raw CSV data rows exist under the raw headers before filling.

## 2. Fill the reconciliation columns, one row per CSV row

- **Date**: the transaction date as a real date, number format `d-mmm` (displays 5-Nov, no leading zero).
- **Counterparty**: take the raw name from Merchant, else Payee Name, else Payer Name, else Description. Look it up in `Counterparty-Match` (A = formatted `Counterparty`, B = `Match` raw bank name) with a loose match (contains or key words, since raw strings change monthly) and write the formatted name. If there's no match, write your best clean, properly cased name for the entity. For credit rows this is the **paying client** from the bank string, not `{company.name}`.
- **Category**: first look up the formatted counterparty in `Counterparty-Category` and use its category. With no match, pick from the `Categories` tab. If `Categories` and `Counterparty-Category` have no data rows yet (typical first month), invent a short consistent category for the Bank row — do not leave Category blank. Keep spellings consistent across rows and with earlier months when those tabs already have data.
- **Credit**: the absolute amount if money came in, else blank.
- **Debit**: the absolute amount if money went out, else blank.
- **VAT**, **Ref**, **Invoice**, **Notes**: leave blank during this fill pass; fill them when matching invoices ([`match-invoices.md`](match-invoices.md)). Do not invent VAT or Ref.
- **Source**: leave blank during this fill pass. Set only when matching invoices or when the operator uploads an invoice in chat (`Manual`). Allowed values: `Email`, `Manual`, `Drive`.
- Clear any leftover formulas or junk in reconciliation rows below the last data row (do not wipe the raw CSV area).

## 3. Seed reference tabs from the filled Bank rows

In the **same run**, after section 2 and before the verify report, seed (or extend) the reference tabs from the filled transactions rows and the raw bank string used for each row (Merchant / Payee Name / Payer Name / Description):

- **`Categories`**: unique Category values from the transactions tab; no duplicates; no blank categories. Also seed **Type** when the column exists (add a `Type` header if the template is older and the column is missing): use `Expense` for a category that appears only on Debit rows, and `Revenue` for a category that appears only on Credit rows. If a category appears on both, leave Type blank and flag it for the operator rather than guessing. Do **not** overwrite a Type the operator (or a previous month) already set. Allowed Type values are `Expense` and `Revenue` (match them case-insensitively later; `Debit` / `Credit` also count as expense / revenue if the operator used those words).
- **`Counterparty-Match`**: one row per unique formatted `Counterparty`, with `Match` = the raw bank string for that counterparty; no duplicates.
- **`Counterparties`**: unique formatted `Counterparty` values in column A (include credit counterparties / clients). Leave Email / Phone / Registration / Address blank until an invoice match supplies them.
- **`Counterparty-Category`**: one row per unique formatted name with the Category used on Bank for that name.

Skip writing a row when the same key already exists (month-2 copies already have mappings; only add genuinely new counterparties or categories).

## 4. Verify and report

- Read back the filled range: the row count should match the CSV, dates should display as d-mmm, and SUM(Credit) and SUM(Debit) should equal the CSV's total in and total out.
- Confirm the four reference tabs from section 3 have data rows consistent with Bank (not header-only after a first fill).
- Report the file link, the totals, the category counts, that the reference tabs were seeded or updated for new counterparties, and any guesses (new counterparties, unsure categories).
- Suggest running **Match invoices** ([`match-invoices.md`](match-invoices.md)) when the operator wants invoice matching / Summary.

## 5. After the user reviews

When the operator says they have finished editing Category or Counterparty names (or other manual sheet changes), re-read the transactions tab against the reference tabs and **update mappings so everything stays linked**:

- Sync `Counterparty-Match` (formatted name ↔ raw Match string) without duplicates.
- Sync unique formatted names into `Counterparties` (preserve existing Email / Phone / Registration / Address when only the name key is syncing).
- Sync `Counterparty-Category` and unique spellings into `Categories`. Preserve existing Type values; seed Type only for newly added categories (same rules as section 3).
- If a counterparty was renamed, update the matching `Counterparty` in `Email matching` so invoice rules still line up.

After remapping, if Summary / missing-invoice highlights need refresh, tell the operator to re-run Match invoices (or ask only for a Summary refresh via that skill).
