---
name: Find Unpaid Invoices
version: 1.5.4
description: >-
  Version 1.5.4. Use when the user wants to Find Unpaid Invoices — find unpaid
  expense invoices in their inbox, list invoices received but not yet paid, check
  pending payments awaiting the bank statement, or refresh the Summary Unpaid
  Expense Invoices table. Searches Gmail inbox from the first day of last month,
  matches Debit rows on the current and previous month reconciliation sheets,
  uploads invoice PDFs to the month Expenses folder, and maintains a Paid
  checkbox with Status and Date Paid as live formulas (`pending`/`unpaid` from
  Config grace working days or Paid; Date Paid via `TODAY()`). Ensures a Config
  tab (Today, grace working days). Grace also classifies pending in the chat
  report and writes a Note (`Pending as invoice received less than
  {grace_working_days} working days`). Formats Unpaid Expense data as Arial 10
  with white / none background and keeps one blank row before Unpaid Revenue.
  Requires Import bank CSV and Categorise bank data (and usually Match invoices /
  Reconcile Bank Statement) for the months being read. Expense / inbox only —
  does not fill Unpaid Revenue Invoices. Never deletes Summary table blocks when
  empty — keeps title/headers and clears data only. If
  `{workspace.local_path}/bookkeeping-test-session.yaml` is active, use that
  session’s today and fixture inbox EMLs instead of Gmail.
---
# Find Unpaid Invoices

Find invoices **received** in Gmail (or a test-session fixture inbox) that are not yet settled by a bank Debit on the current or previous month’s reconciliation workbook. Write the Summary **Unpaid Expense Invoices** table (keep the block even when empty). This skill depends on **Import** + **Categorise** having already been run for the months being read — it does **not** import CSVs or create month sheets.

**Config (skill-local):**

| Key | Default | Meaning |
| --- | --- | --- |
| `grace_working_days` | `4` | Working days (Mon–Fri only; no holiday calendar) after the **email received** date during which an unmatched invoice is classified `pending` in the chat report, shows `pending` via the Status formula (Config grace), and gets Note `Pending as invoice received less than {grace_working_days} working days` |

Substitute `{grace_working_days}` everywhere below with that configured integer. If the operator later changes the default in this file, use the new value for report classification and the spreadsheet **Config** tab.

**Spreadsheet Config tab** (target workbook):

| Cell | Label (column A) | Value (column B) |
| --- | --- | --- |
| `Config!B1` | Today | Run/session today (real date value, not a formula, when a test session fixes today; otherwise `=TODAY()` or the run date) |
| `Config!B2` | Invoice grace period (working days) | `{grace_working_days}` |

On every unpaid run against the target workbook: ensure a sheet named **Config** exists with those labels; set `B1` and `B2` from today and `{grace_working_days}` before writing Status formulas.

Read [`config/profile.yaml`](../../config/profile.yaml) for `{google_account}`, `{company.name}`, `{drive.*}`, `{workspace.local_path}`. Load the Google Drive, Google Sheets, and Gmail connectors (and their skills) before Drive / Sheets / Gmail work — skip Gmail when a test session is active. Never invent amounts, refs, or Drive links. Never send, reply to, or change any emails.

Do this Drive work under the same Accounts tree as bank reconciliation. If you must save a PDF or scratch file **locally**, write it under `{workspace.local_path}/`. Create that folder if needed.

## Test session (optional)

At the start, check `{workspace.local_path}/bookkeeping-test-session.yaml`. If it exists and `active` is true:

- Use `today` from the session (fixture default `2024-11-25`) instead of the real calendar date.
- Derive `email_after` and current/previous months from that today.
- For inbox search, open each path/glob in `inbox_emls` — **never** search or change Gmail.
- When `company_addressee_override` is set (e.g. **Demo Company Ltd**), use it for addressee checks instead of flagging a mismatch vs `{company.name}` alone.
- Do **not** import a payment CSV, append bank Debits, or otherwise change the transactions tab — Import / Categorise own Bank rows (after Test Phase 3, the operator re-runs those skills first).
- When extracting a PDF from an EML before Drive upload, stage under `{workspace.local_path}/`.
- Write that fixed today into `Config!B1` (static date) so Status grace formulas match the fixture.

Session setup is owned by [`skills/bookkeeping-test/bookkeeping-test.md`](../bookkeeping-test/bookkeeping-test.md).

## Prerequisites

1. Quick start (or Customizable) is verified; profile is present.
2. At least one of **current calendar month** or **previous calendar month** reconciliation sheets exists on Drive (named from `{drive.sheet_title_pattern}`), with categorised Debit rows. If **neither** exists, **stop** and tell the operator to run Import bank CSV and Categorise bank data first. When a test session is active, that means the Nov 2024 sheet from those skills after Test Phase 1 (and after Phase 3 re-import when settling Cobalt).
3. Scope is **expense / inbox only**. Do **not** search Sent, and do **not** fill or alter **Unpaid Revenue Invoices**.

## 1. Resolve months, sheets, and email window

- **Today** = the run date in the operator’s locale (calendar date), unless a test session sets `today`.
- **Current month** = calendar month of today; **previous month** = the month before that (year rolls for January).
- **Email search start (`email_after`):** first calendar day of the **previous** month. Example: today 23 Nov → search mail after `YYYY/10/01` (Gmail `after:YYYY/M/D` with no leading zeros required). With session today `2024-11-25`, `email_after` = `2024-10-01`.
- **Locate recon sheets** the same way as bank reconciliation:
  - Year folder `{drive.year_folder_pattern}` under `{drive.root_path}` / `{drive.root_path}/{drive.accounts_folder}` (use whichever layout the profile and existing Drive tree use — match live folders; do not invent a second Accounts segment if `root_path` is already `/Accounts`).
  - Month folder `{drive.month_folder_pattern}` (`{YYYYMM}` = that statement month).
  - File `{drive.sheet_title_pattern}` (`{company_name}` = `{company.name}`).
- Open **current** and **previous** month sheets when present. If only one exists, continue with that one and note the missing month in the final report.
- **Target workbook** for Summary writes and Expenses uploads: the **most recent available** month sheet (prefer current month when it exists).
- Ensure `{drive.expenses_folder}` exists **inside that spreadsheet’s month folder** (create once if missing).
- Ensure the target workbook has a **Config** tab and write today / `{grace_working_days}` into `Config!B1` / `Config!B2` (see Config table above) before Status formulas are written.

## 2. Read existing Unpaid Expense rows (if any)

On the target workbook’s **Summary** tab, locate **Unpaid Expense Invoices** by **title / header text**, not fixed coordinates.

Expected headers (case-insensitive; close wording is fine): **Date | Counterparty | Amount | Ref | Invoice | Paid | Date Paid | Status | Note**.

If the block exists, read every data row under the headers into memory (all columns). Treat **Paid** as true when the cell is boolean `TRUE`, checkbox checked, or a clear truthy value. Preserve these for merge (section 6). If the block is absent, start with an empty existing set.

## 3. Search inbox for invoices

**If a test session is active**, open each EML from `inbox_emls` instead of searching Gmail — do not use `{google_account}` Gmail.

**Otherwise (live):** on `{google_account}`, search **inbox only** (not Sent, not Trash) for messages on or after `email_after` that look like payable invoices:

- Subject / body cues: `invoice`, `tax invoice`; treat `receipt` as an invoice only when it is clearly a payable vendor bill.
- Prefer messages with PDF attachments.
- Optionally boost with sender addresses / domains from the target sheet’s `Email matching` tab when that tab has rows.

For each candidate message:

1. Prefer a **PDF attachment**. If the invoice is only in the body or behind a link, download or render under `{workspace.local_path}/` and note that in chat (and later in **Note** only if the operator would need to know).
2. Extract **Counterparty** (vendor), **Amount** (total due), **Ref** (invoice number when present), **received date** (message date), and invoice/document date when present (for the Date column and filename; fall back to received date).
3. When the addressee is checkable and is clearly not `{company.name}` (or not `company_addressee_override` when a test session sets it), flag in chat; still list the row if it is clearly payable to the company.
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

## 6. Merge candidates and classify for the report

Build the candidate set:

- All invoices found in section 3, **plus**
- Existing Summary rows (section 2) that are still relevant: still in the email window, or **Paid** is true (awaiting bank), even if older than the window.

Identity key: **Ref + Counterparty + Amount** (same dedupe rules as section 3). When merging an existing row with a Gmail (or fixture) hit, **preserve** operator fields: **Paid** (checkbox state), **Note**, and an existing **Invoice** Drive link. Do **not** preserve static **Status** or **Date Paid** values — those columns are always rewritten as formulas in section 8.

**Grace Note text** (exact, with configured grace):

`Pending as invoice received less than {grace_working_days} working days`

**Report classification** (apply in order; used for chat counts/lists, not pasted into the Status cell):

1. Bank match (section 5) → **drop** the row (settled). Count for the report.
2. Else if **Paid** is true → report as **pending** (awaiting statement). Do **not** set the grace Note for Paid-awaiting-bank alone.
3. Else if the **email received** date is within the last `{grace_working_days}` **working days** (Mon–Fri only, counting backward from today) → report as **pending** (grace) and set **Note** to the grace Note text above (section 8).
4. Else → report as **unpaid**. Clear the grace Note text from **Note** if it was previously set for this row (leave other operator Notes alone).

**Sheet Status / Date Paid** are owned by formulas (section 8). Status is `pending` when the invoice Date is still inside the Config grace window **or** when Paid is checked; otherwise `unpaid`. Grace pending is also reflected in **Note** and the chat report.

### Paid checkbox workflow (operator)

1. Operator sees a row. During grace, Status already shows `pending` (and Note carries the grace text) even if Paid is unchecked. Outside grace with Paid unchecked, Status shows `unpaid`.
2. Operator pays the vendor, then ticks **Paid**.
3. Sheet **Status** stays or becomes `pending` and **Date Paid** shows `TODAY()` via formulas immediately. The row stays until a matching Debit appears on a loaded recon sheet; then the skill drops the row on a later run.

No Apps Script. Do not paste static Status or Date Paid. Preserve operator **Note** on re-runs unless the operator cleared it, except: always set or clear the grace Note text per classification above (overwrite Note when writing the grace message; if Note only contained the old helper-style Status grace message, replace it with the grace Note text).

## 7. Ensure Expenses PDF and Invoice link

For every row that remains after section 6:

- If the row already has a valid **Invoice** hyperlink from a prior unpaid run, **reuse** it (do not re-upload).
- Else if a Bank Transactions Debit already has this invoice filed (same Ref / Counterparty / Amount) but the unpaid row is not yet settled by match rules, prefer that Drive file / link.
- Else upload the PDF to the target month `{drive.expenses_folder}` as `YYYYMMDD_Counterparty_Ref.pdf` (`YYYYMMDD` from invoice/document date, else email received date; `Ref` = invoice reference; no duplicates). Same naming as match-invoices expense matching.
- Set **Invoice** to a Sheets hyperlink whose **visible label is the saved filename** (not the raw URL), e.g. `=HYPERLINK("https://…", "YYYYMMDD_Counterparty_Ref.pdf")` or the connector equivalent. Format the Invoice column (or those cells) with **Clip** text overflow — not Wrap.

## 8. Write the Summary block

**Keep blocks; clear data when empty** (same pattern as match-invoices Summary): **never delete** the **Unpaid Expense Invoices** block because it has no rows. Always **keep** the title and headers. If it has **at least one** row after section 6, fill the table. If it has **no** rows, **clear** data under the headers so only the titled empty table remains. Do **not** remove the block and recreate it later.

Locate **Unpaid Expense Invoices** by header text. Do **not** redesign the table (titles/headers/layout). **Do** set Unpaid Expense **data** cells to **Arial 10 regular** (not bold) with **white / none** background fill after every write — clear any blue fill inherited when sheet rows are inserted under the header. Do **not** touch **Missing Expense Invoices**, **Missing Revenue Invoices**, or **Expenses by Category** ([`match-invoices.md`](../bank-reconciliation/match-invoices.md) owns those). **Unpaid Revenue Invoices** is out of scope for data in this skill version — if that block is present, **leave it** (including when it has no data rows); do not fill revenue unpaid rows here and do not delete the empty shell.

**Do not write helper / legend text** on the Unpaid Expense title row (or anywhere in the block). No `Sheet Status = …` line, and no `Status = 'pending' when the invoice was only received … working days ago` line. Grace explanation belongs only in **Note** for grace rows. On each run, **clear** any leftover helper/legend cells on the title row (cells to the right of the title that look like Status/Date Paid documentation).

### If there is at least one Unpaid Expense row to show

1. Keep or create the title and headers: **Date | Counterparty | Amount | Ref | Invoice | Paid | Date Paid | Status | Note**. Prefer the template’s existing location; create the block only if it is missing entirely.
2. Place the block in a clear area of Summary without covering Expenses by Category or the Missing invoice blocks. Prefer the template’s existing location when still present.
3. **Insert sheet rows before writing data.** Count the rows to write (**N**). Under the Unpaid Expense header there must be room for **N** data rows **plus exactly one blank gap row** before the next Summary block title (usually **Unpaid Revenue Invoices**). If fewer empty rows exist, **insert** enough so lower titles/tables shift down intact. **Never** overwrite another block’s title, headers, or data, and **never** write into the gap row (same hard rule as match-invoices Summary).
4. Clear previous data rows under the headers, then write rows for this run (not `FILTER` over Bank — source is inbox + merge).
5. **Paid** cells must be checkboxes (boolean). Leave Paid unchecked (`FALSE`) for new rows unless preserved from an existing row.
6. **Date** as a real date; **Amount** as a number. **Note:** for grace-pending rows (section 6 step 3), write exactly `Pending as invoice received less than {grace_working_days} working days`. For other rows, preserve an existing operator Note; clear Note if it only held the grace message and the row is no longer grace-pending. After writing values (and formulas below), set every Unpaid Expense **data** cell in those rows to **Arial**, **size 10**, **not bold**, background **white / none** (clear inherited header blue fill; do not inherit title/header bold).
7. **Status** and **Date Paid** — write **formulas** (locate Date / Paid / Status / Date Paid by header; adapt column letters). Never paste static `pending` / `unpaid` or a static date into those columns. For each data row:

```text
Status:    =IF(NETWORKDAYS(<DateCell>,Config!$B$1)-1<Config!$B$2,"pending",IF(<PaidCell>,"pending","unpaid"))
Date Paid: =IF(<PaidCell>,TODAY(),"")
```

Example if Date is column A, Paid is column F, Status is column H, Date Paid is column G, and the row is 35: Status `=IF(NETWORKDAYS(A35,Config!$B$1)-1<Config!$B$2,"pending",IF(F35,"pending","unpaid"))`, Date Paid `=IF(F35,TODAY(),"")`.

`NETWORKDAYS` counts Mon–Fri only (no holiday calendar). Subtract `1` so the comparison is working-day **age** (`today − date`), matching calendar-style `today − date < grace`. `TODAY()` on Date Paid recalculates while Paid is true (shows the current calendar day, not a frozen stamp). That is expected.

8. On re-runs, rewrite the same Status / Date Paid formula pattern for every kept row (do not leave stale static values). Re-apply **Arial 10 regular** and **white / none** fill on data rows. Re-read Summary and confirm: nothing below the unpaid block was corrupted, and **exactly one blank row** remains between the last Unpaid Expense data row and the Unpaid Revenue title (or the next Summary title).

### If there are zero Unpaid Expense rows

**Keep** the Unpaid Expense Invoices title and headers. **Clear** any data rows under the headers and any leftover title-row helper/legend. Keep **exactly one blank row** between the Unpaid Expense header and the Unpaid Revenue title. Do **not** delete the block.

Match invoices owns Missing / Expenses-by-Category Summary updates; **this skill owns** Unpaid Expense Invoices data (fill or clear under existing headers). Leave Unpaid Revenue shells untouched.

## 9. Report (chat)

Include:

- Target sheet link and which month sheets were read; note any missing month.
- Email window (`email_after` → today) and `{grace_working_days}`; confirm Config `B1`/`B2` were set.
- Counts: **settled** (dropped this run), **pending** (grace), **pending** (Paid awaiting bank), **unpaid** — using report classification from section 6.
- Lists for unpaid vs pending: Date, Counterparty, Amount, Ref, Paid, and sheet Status / Date Paid (formula results).
- That **Status** uses Config grace via `NETWORKDAYS` then Paid (`IF(NETWORKDAYS(Date,Config!$B$1)-1<Config!$B$2,"pending",IF(Paid,"pending","unpaid"))`) and **Date Paid** is `IF(Paid,TODAY(),"")`; no Apps Script.
- Month `{drive.expenses_folder}` link and that Invoice links use filename labels.
- Reminder: after paying a vendor, tick **Paid**; sheet Status is `pending` and Date Paid shows today via formulas until the Debit appears on a recon sheet, then the row drops off on the next unpaid-invoices run. During grace, Status may already show `pending` before Paid is ticked.
- When a test session is active, confirm Gmail was not used and the transactions tab was not modified by this skill.
