---
name: Unpaid expense invoices
version: 1.1.1
description: >-
  Version 1.1.1. Use when the user wants to find unpaid expense invoices in their
  inbox, list invoices received but not yet paid, check pending payments awaiting
  the bank statement, or refresh the Summary Unpaid Expense Invoices table.
  Searches Gmail inbox from the first day of last month, matches Debit rows on
  the current and previous month reconciliation sheets, uploads invoice PDFs to
  the month Expenses folder, and maintains Status (unpaid / pending) with a
  configurable working-day grace and a Paid checkbox workflow. Requires bank
  reconciliation to have been run for the months being read. Expense / inbox
  only — does not fill Unpaid Revenue Invoices. Also use for test mode / sample
  data / try with test data — run against skills/unpaid-invoices/test-data
  fixtures after bank-reconciliation test mode (fixed today 2024-11-25).
---
# Unpaid expense invoices

Find invoices **received** in Gmail that are not yet settled by a bank Debit on the current or previous month’s reconciliation workbook. Write (or hide) the Summary **Unpaid Expense Invoices** table. This skill depends on **bank reconciliation** having already been run — it does **not** import CSVs or create month sheets.

**Config (skill-local):**

| Key | Default | Meaning |
| --- | --- | --- |
| `grace_working_days` | `4` | Working days (Mon–Fri only; no holiday calendar) after the **email received** date during which an unmatched invoice is `pending` rather than `unpaid` |

Substitute `{grace_working_days}` everywhere below with that configured integer. If the operator later changes the default in this file, use the new value for Status rules and the Summary helper text.

Read [`config/profile.yaml`](../../config/profile.yaml) for `{google_account}`, `{company.name}`, `{drive.*}`, `{workspace.local_path}`. Load the Google Drive, Google Sheets, and Gmail connectors (and their skills) before Drive / Sheets / Gmail work. Never invent amounts, refs, or Drive links. Never send, reply to, or change any emails.

Do this Drive work under the same Accounts tree as bank reconciliation. If you must save a PDF or scratch file **locally**, write it under `{workspace.local_path}/`. Create that folder if needed.

## Test mode

Run **test mode** when the operator asks for unpaid invoices with **test mode**, **sample data**, or **try with test data** (or equivalent).

**Prerequisite:** bank reconciliation **test mode** already completed for November 2024 (`{YYYY}` = `2024`, `{YYYYMM}` = `202411`) so the Nov recon sheet and Debits exist. If it has not been run, stop and tell the operator to run bank-reconciliation test mode first.

In test mode the Drive / Sheets path is unchanged (read Nov sheet Debits; write Summary Unpaid Expense Invoices; upload PDFs to month `{drive.expenses_folder}`). Only **today**, **inbox search**, and (in phase 2) the **bank extract update** change:

| Live | Test mode |
| --- | --- |
| Real calendar today | Fixed **`2024-11-25`** — last transaction date on the bank-reconciliation test extract (when that extract was last done). Do **not** use the real calendar date |
| Gmail inbox on `{google_account}` | Parse local `.eml` files — **never** search or change Gmail. Unpaid fixture: `skills/unpaid-invoices/test-data/emails/*.eml`. Also parse `skills/bank-reconciliation/test-data/emails/*.eml` (not under `sent/`) so already-paid Nov vendors settle against existing Debits |
| Bank Debits from current + previous month sheets | Read Debits from the **November 2024** recon sheet from bank-reconciliation test mode (previous month Oct usually missing — note it; do not invent Oct data) |

**Derived windows with fixed today:** `email_after` = `2024-10-01`; current month = Nov 2024; grace last working days = 20, 21, 22, 25 Nov. Cobalt Mail EML dated **18 Nov** is outside grace → `unpaid` when unmatched.

**Invoice addressee:** expense fixtures use **Demo Company Ltd**. For addressee checks in test mode, treat that name as the expected company (do not flag a mismatch solely because it differs from `{company.name}`).

**Fixture paths** are repo-relative (`skills/unpaid-invoices/test-data/…` and the recon email pack above). They are committed sample data — not `{workspace.local_path}` disposable files. When extracting a PDF from an EML before Drive upload, stage under `{workspace.local_path}/`.

### Phase 1 — unpaid invoice

1. Set **today** = `2024-11-25`. Resolve months / sheets as in section 1 using that date (target = Nov `Y202411` sheet).
2. Skip live Gmail. Open each EML in `skills/unpaid-invoices/test-data/emails/` and each in `skills/bank-reconciliation/test-data/emails/` (not `sent/`). Extract Counterparty, Amount, Ref, received date, PDF as in section 3.
3. Read Nov Debits (section 4). Match and assign Status (sections 5–6). The four recon expense vendors settle against Nov Debits; **Cobalt Mail** (`CM-4418`, `$88.00`) has no Debit → **Status = `unpaid`**.
4. Upload Cobalt PDF to month `{drive.expenses_folder}` and fill Summary **Unpaid Expense Invoices** (sections 7–8). Hide the block only if zero rows (phase 1 has one row — show it).
5. Report (section 9), then read `skills/unpaid-invoices/test-data/expected-results.md` **Phase 1** and report pass/fail (including that Gmail was not used).

### Phase 2 — payment appears on updated extract

Run when the operator asks to continue test mode with the payment / updated statement (or after phase 1 when they say the payment extract is ready).

1. Copy `skills/unpaid-invoices/test-data/bank-statement-with-payment.csv` into the Nov `{drive.extracts_folder}` month folder (create folders if needed). Import or append so the Nov transactions tab gains the Cobalt Debit row (`2024-11-25`, `COBALT MAIL *SUB`, Debit `88.00`) consistently with bank-reconciliation CSV import rules (fill Date / Counterparty / Debit on the new row; leave Invoice blank on the bank row unless matching elsewhere). Do **not** rebuild the whole Nov sheet from scratch unless the operator asks.
2. Re-run unpaid match with the same fixed today and the same EML set as phase 1.
3. Cobalt now matches the new Debit → **drop** from Unpaid Expense Invoices; **delete** the entire unpaid block if zero rows remain.
4. Report, then check `skills/unpaid-invoices/test-data/expected-results.md` **Phase 2** pass/fail.

## Prerequisites

1. Quick start (or Customizable) is verified; profile is present.
2. At least one of **current calendar month** or **previous calendar month** reconciliation sheets exists on Drive (named from `{drive.sheet_title_pattern}`). If **neither** exists, **stop** and tell the operator to run bank reconciliation first. In **test mode**, that means the Nov 2024 sheet from bank-reconciliation test mode.
3. Scope is **expense / inbox only**. Do **not** search Sent, and do **not** fill or alter **Unpaid Revenue Invoices**.

## 1. Resolve months, sheets, and email window

- **Today** = the run date in the operator’s locale (calendar date). In **test mode**, today is fixed to **`2024-11-25`** (see Test mode).
- **Current month** = calendar month of today; **previous month** = the month before that (year rolls for January).
- **Email search start (`email_after`):** first calendar day of the **previous** month. Example: today 23 Nov → search mail after `YYYY/10/01` (Gmail `after:YYYY/M/D` with no leading zeros required). In **test mode**, `email_after` = `2024-10-01`.
- **Locate recon sheets** the same way as bank reconciliation:
  - Year folder `{drive.year_folder_pattern}` under `{drive.root_path}` / `{drive.root_path}/{drive.accounts_folder}` (use whichever layout the profile and existing Drive tree use — match live folders; do not invent a second Accounts segment if `root_path` is already `/Accounts`).
  - Month folder `{drive.month_folder_pattern}` (`{YYYYMM}` = that statement month).
  - File `{drive.sheet_title_pattern}` (`{company_name}` = `{company.name}`).
- Open **current** and **previous** month sheets when present. If only one exists, continue with that one and note the missing month in the final report.
- **Target workbook** for Summary writes and Expenses uploads: the **most recent available** month sheet (prefer current month when it exists).
- Ensure `{drive.expenses_folder}` exists **inside that spreadsheet’s month folder** (create once if missing).

## 2. Read existing Unpaid Expense rows (if any)

On the target workbook’s **Summary** tab, locate **Unpaid Expense Invoices** by **title / header text**, not fixed coordinates.

Expected headers (case-insensitive; close wording is fine): **Date | Counterparty | Amount | Ref | Invoice | Status | Paid | Date Paid | Note**.

If the block exists, read every data row under the headers into memory (all columns). Treat **Paid** as true when the cell is boolean `TRUE`, checkbox checked, or a clear truthy value. Preserve these for merge (section 6). If the block is absent, start with an empty existing set.

## 3. Search inbox for invoices

**In test mode**, follow the EML steps in **Test mode** instead of searching Gmail — do not use `{google_account}` Gmail.

On `{google_account}` (live mode), search **inbox only** (not Sent, not Trash) for messages on or after `email_after` that look like payable invoices:

- Subject / body cues: `invoice`, `tax invoice`; treat `receipt` as an invoice only when it is clearly a payable vendor bill.
- Prefer messages with PDF attachments.
- Optionally boost with sender addresses / domains from the target sheet’s **`Email matching`** tab when that tab has rows.

For each candidate message:

1. Prefer a **PDF attachment**. If the invoice is only in the body or behind a link, download or render under `{workspace.local_path}/` and note that in chat (and later in **Note** only if the operator would need to know).
2. Extract **Counterparty** (vendor), **Amount** (total due), **Ref** (invoice number when present), **received date** (message date), and invoice/document date when present (for the Date column and filename; fall back to received date).
3. When the addressee is checkable and is clearly not `{company.name}`, flag in chat; still list the row if it is clearly payable to the company.
4. **Never invent** Amount or Ref — leave Ref blank when unknown; skip the message if Amount cannot be determined.
5. Deduplicate by **Ref + Counterparty + Amount** (when Ref is blank, use Counterparty + Amount + received date). Keep one record per invoice.

## 4. Read bank Debits from both months

For each available recon sheet, resolve the transactions tab like bank reconciliation: start from `{drive.sheet_tab}`; if missing, find the tab with Date / Counterparty / Debit / Invoice (may be `Bank Transactions` or `Bank`). Locate the header row by **column names**.

Collect every row with **Debit > 0**: Date, Counterparty, Debit, Ref, Invoice (and Category when present).

Treat a row as a **bank fee** when Category or Counterparty matches `bank fee` or `service fee` (case-insensitive). Bank-fee Debits are **not** payment evidence for vendor invoices.

## 5. Match an invoice to a bank Debit

An inbox (or existing unpaid) invoice is **settled** when a non–bank-fee Debit matches:

- **Amount** equals Debit (allow only trivial rounding; if FX makes equality unclear, prefer Ref / Counterparty confirmation and note uncertainty in chat — do not force a weak match), and
- **Counterparty** loose match (contains / key words / `Counterparty-Match` / `Email matching` sender domain), and/or
- **Ref** equals the sheet **Ref** when both are present.

Settled invoices are **removed** from the unpaid table (do not keep them as `pending`).

## 6. Merge candidates and assign Status

Build the candidate set:

- All invoices found in section 3, **plus**
- Existing Summary rows (section 2) that are still relevant: still in the email window, or **Paid** is true (awaiting bank), even if older than the window.

Identity key: **Ref + Counterparty + Amount** (same dedupe rules as section 3). When merging an existing row with a Gmail hit, **preserve** operator fields: **Paid**, **Date Paid**, **Note**, and an existing **Invoice** Drive link.

**Status priority** (apply in order):

1. Bank match (section 5) → **drop** the row (settled). Count for the report.
2. Else if **Paid** is true → **Status = `pending`** (awaiting statement). If **Date Paid** is blank, set **Date Paid** to **today**. Do not clear a non-blank Date Paid or Note.
3. Else if the **email received** date is within the last `{grace_working_days}` **working days** (Mon–Fri only, counting backward from today) → **Status = `pending`**.
4. Else → **Status = `unpaid`**.

Allowed Status values on the sheet: `pending` and `unpaid` only (lowercase).

### Paid checkbox workflow (operator)

1. Operator sees an `unpaid` (or grace `pending`) row.
2. Operator pays the vendor, then ticks **Paid**.
3. Status becomes / stays **`pending`** until a matching Debit appears on a loaded recon sheet; then the skill drops the row on a later run.

**Date Paid when Paid is checked:**

- **Every skill run:** if Paid is true and Date Paid is blank → set Date Paid to today; force Status `pending`.
- **Click-time immediacy:** Google Sheets does not natively set an adjacent date on checkbox click. When first creating or showing the Unpaid Expense block on a workbook, try to install the bound Apps Script in [Appendix A](#appendix-a-paid-checkbox-onedit-script). If the connector cannot install Apps Script, paste the script once for the operator (Extensions → Apps Script) and rely on skill-run backfill until they install it. Prefer **not** clearing Date Paid when Paid is unchecked (leave for the operator).

Never overwrite a non-blank **Date Paid** or **Note** on re-runs unless the operator cleared them.

## 7. Ensure Expenses PDF and Invoice link

For every row that remains after section 6:

- If the row already has a valid **Invoice** hyperlink from a prior unpaid run, **reuse** it (do not re-upload).
- Else if a Bank Transactions Debit already has this invoice filed (same Ref / Counterparty / Amount) but the unpaid row is not yet settled by match rules, prefer that Drive file / link.
- Else upload the PDF to the target month `{drive.expenses_folder}` as `YYYYMMDD_Counterparty_Ref.pdf` (`YYYYMMDD` from invoice/document date, else email received date; `Ref` = invoice reference; no duplicates). Same naming as bank reconciliation expense matching.
- Set **Invoice** to a Sheets hyperlink whose **visible label is the saved filename** (not the raw URL), e.g. `=HYPERLINK("https://…", "YYYYMMDD_Counterparty_Ref.pdf")` or the connector equivalent. Format the Invoice column (or those cells) with **Clip** text overflow — not Wrap.

## 8. Write or hide the Summary block

Locate **Unpaid Expense Invoices** by header text. Do **not** restyle the table. Do **not** touch **Missing Expense Invoices**, **Missing Revenue Invoices**, **Expenses by Category**, or **Unpaid Revenue Invoices**.

**Helper text** (title row area; overwrite every run when the block is shown), using configured grace:

`Status = 'pending' when the invoice was only received {grace_working_days} working days ago`

(Also pending when **Paid** is checked awaiting bank — the helper focuses on the grace rule; the chat report explains Paid.)

### If there is at least one row to show

1. Keep or recreate the title, helper, and headers: **Date | Counterparty | Amount | Ref | Invoice | Status | Paid | Date Paid | Note**.
2. Place the block in a clear area of Summary without covering Expenses by Category or the Missing invoice blocks. Prefer the template’s existing location when still present.
3. **Insert sheet rows before writing data.** Count the rows to write (**N**). If fewer than **N** empty rows exist under the header before the next Summary content, **insert** enough rows so lower titles/tables shift down intact. **Never** overwrite another block’s title, headers, or data (same hard rule as bank reconciliation Summary).
4. Clear previous data rows under the headers, then write static rows for this run (not `FILTER` over Bank — source is Gmail + merge).
5. **Paid** cells must be checkboxes (boolean). Leave Paid unchecked (`FALSE`) for new rows unless preserved from an existing row.
6. Date / Date Paid as real dates; Amount as a number; Status as `unpaid` or `pending`.
7. Re-read Summary and confirm nothing below the unpaid block was corrupted by the write.

### If there are zero rows

**Delete the entire Unpaid Expense Invoices block** — title, helper, headers, and any data. Do **not** leave an empty titled table. (Same empty-block rule as Missing Expense Invoices in bank reconciliation.)

On a later run when rows appear again, recreate title + helper + headers + data without covering other Summary content.

Bank reconciliation owns Missing / Expenses-by-Category Summary updates; **this skill owns** Unpaid Expense Invoices (including removing it when empty).

## 9. Report (chat)

Include:

- Target sheet link and which month sheets were read; note any missing month.
- Email window (`email_after` → today) and `{grace_working_days}`.
- Counts: **settled** (dropped this run), **pending** (grace), **pending** (Paid awaiting bank), **unpaid**.
- Lists for unpaid vs pending: Date, Counterparty, Amount, Ref, Status, Paid, Date Paid.
- Month `{drive.expenses_folder}` link and that Invoice links use filename labels.
- Reminder: after paying a vendor, tick **Paid**; the row stays `pending` until the Debit appears on a recon sheet, then drops off on the next unpaid-invoices run.
- If Apps Script was not installed, one short note that Date Paid is backfilled on the next skill run when Paid is checked (or point them at Appendix A).

## Appendix A — Paid checkbox onEdit script

Bound script for the reconciliation Google Sheet (install once per spreadsheet when possible):

```javascript
/** When Paid (checkbox) becomes TRUE on Summary Unpaid Expense Invoices, set Date Paid = today and Status = pending. */
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== 'Summary') return;

  var headers = sheet.getRange(1, 1, Math.min(sheet.getLastRow(), 200), 12).getValues();
  var headerRow = -1;
  var paidCol = -1;
  var statusCol = -1;
  var datePaidCol = -1;
  for (var r = 0; r < headers.length; r++) {
    for (var c = 0; c < headers[r].length; c++) {
      var h = String(headers[r][c] || '').trim().toLowerCase();
      if (h === 'paid') {
        headerRow = r;
        paidCol = c;
      }
    }
    if (headerRow >= 0) {
      for (var c2 = 0; c2 < headers[headerRow].length; c2++) {
        var h2 = String(headers[headerRow][c2] || '').trim().toLowerCase();
        if (h2 === 'status') statusCol = c2;
        if (h2 === 'date paid') datePaidCol = c2;
      }
      break;
    }
  }
  if (headerRow < 0 || paidCol < 0) return;
  if (e.range.getRow() <= headerRow + 1) return;
  if (e.range.getColumn() !== paidCol + 1) return;

  var paid = e.range.getValue() === true || e.range.getValue() === 'TRUE';
  if (!paid) return;
  if (statusCol >= 0) {
    sheet.getRange(e.range.getRow(), statusCol + 1).setValue('pending');
  }
  if (datePaidCol >= 0) {
    var dp = sheet.getRange(e.range.getRow(), datePaidCol + 1);
    if (dp.getValue() === '' || dp.getValue() === null) {
      dp.setValue(new Date());
    }
  }
}
```

Tell the operator the script runs only after they authorize it the first time in that spreadsheet.
