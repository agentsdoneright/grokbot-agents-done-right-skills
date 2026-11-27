---
name: Find Unpaid Invoices
version: 1.6.1
description: >-
  Version 1.6.1. Use when the user wants to Find Unpaid Invoices — find unpaid
  expense invoices in their inbox and unpaid revenue invoices in Sent, list
  invoices not yet settled by bank Debit/Credit on the current or previous month
  sheets, refresh Summary Unpaid Expense Invoices and Unpaid Revenue Invoices,
  or check pending payments awaiting the bank statement. Ensures Config (Today,
  Expense Invoice grace period, Revenue Invoice grace period). Expense Status:
  Status `paid` when checkbox true, else grace pending, else unpaid; ticking Paid
  clears Note. Revenue Status via Reminder Sent then grace pending then unpaid. Paid /
  Reminder Sent stamp Date Paid / Date Reminder Sent as static dates via Apps
  Script — never TODAY() formulas. Formats
  unpaid data as Arial 10 with white / none background and keeps one blank row
  between Unpaid Expense and Unpaid Revenue. Requires Import bank CSV and
  Categorise bank data (and usually Match invoices / Reconcile Bank Statement)
  for the months being read. Never deletes Summary table blocks when empty —
  keeps title/headers and clears data only. If
  `{workspace.local_path}/bookkeeping-test-session.yaml` is active, use that
  session’s today and fixture inbox/sent EMLs instead of Gmail.
---
# Find Unpaid Invoices

Find invoices **received** (expense / inbox) and **sent** (revenue / Sent) that are not yet settled by a matching bank Debit or Credit on the current or previous month’s reconciliation workbook. Write the Summary **Unpaid Expense Invoices** and **Unpaid Revenue Invoices** tables (keep each block even when empty). This skill depends on **Import** + **Categorise** having already been run for the months being read — it does **not** import CSVs or create month sheets.

**Config (skill-local):**

| Key | Default | Meaning |
| --- | --- | --- |
| `grace_working_days_expense` | `4` | Working days (Mon–Fri only; no holiday calendar) after the **email received** date for expense grace (`pending` Status / Note / chat) |
| `grace_working_days_revenue` | `10` | Working days after the **email sent** date for revenue grace (`pending` Status / Note / chat unless Reminder Sent) |

Substitute `{grace_working_days_expense}` / `{grace_working_days_revenue}` everywhere below with those configured integers. If the operator later changes the defaults in this file, use the new values for report classification and the spreadsheet **Config** tab.

**Spreadsheet Config tab** (target workbook):

| Cell | Label (column A) | Value (column B) |
| --- | --- | --- |
| `Config!B1` | Today | Run/session today (real date value with number format `d-mmm` e.g. 10-Nov, not a formula, when a test session fixes today; otherwise `=TODAY()` or the run date, still displayed `d-mmm`) |
| `Config!B2` | Expense Invoice grace period (working days) | `{grace_working_days_expense}` |
| `Config!B3` | Revenue Invoice grace period (working days) | `{grace_working_days_revenue}` |

On every unpaid run against the target workbook: ensure a sheet named **Config** exists with those labels; set `B1` / `B2` / `B3` from today and the grace defaults before writing Status formulas. If an older sheet still has label **Invoice grace period (working days)** on A2, rename it to **Expense Invoice grace period (working days)** and ensure A3/B3 exist.

Read [`config/profile.yaml`](../../config/profile.yaml) for `{google_account}`, `{company.name}`, `{drive.*}`, `{workspace.local_path}`. Load the Google Drive, Google Sheets, and Gmail connectors (and their skills) before Drive / Sheets / Gmail work — skip Gmail when a test session is active. Never invent amounts, refs, or Drive links. Never send, reply to, or change any emails.

Do this Drive work under the same Accounts tree as bank reconciliation. If you must save a PDF or scratch file **locally**, write it under `{workspace.local_path}/`. Create that folder if needed.

## Test session (optional)

At the start, check `{workspace.local_path}/bookkeeping-test-session.yaml`. If it exists and `active` is true:

- Use `today` from the session (fixture default `2024-11-25`) instead of the real calendar date.
- Derive `email_after` and current/previous months from that today.
- For inbox search, open each path/glob in `inbox_emls` — **never** search or change Gmail.
- For Sent / revenue search, open each path/glob in `sent_emls` — **never** search Gmail Sent.
- When `company_addressee_override` is set (e.g. **Demo Company Ltd**), use it for addressee checks instead of flagging a mismatch vs `{company.name}` alone.
- Do **not** import a payment CSV, append bank Debits/Credits, or otherwise change the transactions tab — Import / Categorise own Bank rows (after Test Phase 3, the operator re-runs those skills first).
- When extracting a PDF from an EML before Drive upload, stage under `{workspace.local_path}/`.
- Write that fixed today into `Config!B1` (static date, number format `d-mmm`) so Status grace formulas and Apps Script stamps match the fixture.

Session setup is owned by [`skills/bookkeeping-test/bookkeeping-test.md`](../bookkeeping-test/bookkeeping-test.md).

## Prerequisites

1. Quick start (or Customizable) is verified; profile is present.
2. At least one of **current calendar month** or **previous calendar month** reconciliation sheets exists on Drive (named from `{drive.sheet_title_pattern}`), with categorised Debit/Credit rows. If **neither** exists, **stop** and tell the operator to run Import bank CSV and Categorise bank data first. When a test session is active, that means the Nov 2024 sheet from those skills after Test Phase 1 (and after Phase 3 re-import when settling Cobalt / Northpeak).
3. Scope is **expense (inbox) and revenue (Sent)**. Fill both unpaid Summary blocks as described below.

## 0. Ensure checkbox date-stamp Apps Script (quiet unless broken)

Paid / Reminder Sent must stamp **Date Paid** / **Date Reminder Sent** as **static** dates on click (not `TODAY()` formulas). Agent source of truth — **all four** files under [`skills/bank-reconciliation/scripts/`](../bank-reconciliation/scripts/) (`summary-on-edit.gs`, `unpaid-checkbox-dates.gs`, `personal-expense-checkbox.gs`, `no-invoice-needed-checkbox.gs`). Maintainers: [`scripts/README.md`](../bank-reconciliation/scripts/README.md).

Drive copies of `{templates.reconciliation_sheet_id}` only mirror the template’s bound project. A project that only has `function myFunction() {}` is **broken** — replace it. Import **section 1b** should already have checked this; verify again here.

On every unpaid run against the target workbook (after it is a **native Google Sheet**):

1. Read those `.gs` files from the repo.
2. If the bound project already has working `onEdit` (dispatcher) + `handleUnpaidCheckboxEdit_` / `setDateDmmm_` / Paid and Reminder Sent behavior: **leave it**. Say **nothing** about scripts in chat. (Also expect `handlePersonalExpenseEdit_` and `handleNoInvoiceNeededEdit_`.)
3. If missing/outdated (no project, empty, only `myFunction`, or missing those functions): create or **replace** all four files via Apps Script API / `clasp` / editor write so they match the repo. Do this silently when you can. Expected unpaid behavior: Paid → Date Paid + clear Note + Status `paid`; Reminder Sent → Date Reminder Sent; stamps `d-mmm` from **`Config!B1`** when set, else sheet calendar today.
4. If install/update fails: rely on the **safety backstop** in section 8. In the operator report use **plain language only** (e.g. “If ticking Paid doesn’t fill in the date, tell me and I’ll help”). **Never** tell the operator to open Apps Script, paste a `.gs` file, or look under `skills/…`. Do not invent a `TODAY()` formula as a substitute.
5. Maintainers (not operator chat): after fixing a month sheet, also update the shared template at `{templates.reconciliation_sheet_url}` so the next first-month copy is not blank.

## 1. Resolve months, sheets, and email window

- **Today** = the run date in the operator’s locale (calendar date), unless a test session sets `today`.
- **Current month** = calendar month of today; **previous month** = the month before that (year rolls for January).
- **Email search start (`email_after`):** first calendar day of the **previous** month. Example: today 23 Nov → search mail after `YYYY/10/01` (Gmail `after:YYYY/M/D` with no leading zeros required). With session today `2024-11-25`, `email_after` = `2024-10-01`.
- **Locate recon sheets** the same way as bank reconciliation:
  - Year folder `{drive.year_folder_pattern}` under `{drive.root_path}` / `{drive.root_path}/{drive.accounts_folder}` (use whichever layout the profile and existing Drive tree use — match live folders; do not invent a second Accounts segment if `root_path` is already `/Accounts`).
  - Month folder `{drive.month_folder_pattern}` (`{YYYYMM}` = that statement month).
  - File `{drive.sheet_title_pattern}` (`{company_name}` = `{company.name}`).
- Open **current** and **previous** month sheets when present. If only one exists, continue with that one and note the missing month in the final report.
- **Target workbook** for Summary writes and Expenses / Revenue uploads: the **most recent available** month sheet (prefer current month when it exists).
- Ensure `{drive.expenses_folder}` and `{drive.revenue_folder}` exist **inside that spreadsheet’s month folder** (create once if missing).
- Ensure the target workbook has a **Config** tab and write today / expense grace / revenue grace into `Config!B1` / `B2` / `B3` (see Config table above) before Status formulas are written.
- Run **section 0** (ensure Apps Script) on the target workbook.

## 2. Read existing Unpaid Expense and Unpaid Revenue rows (if any)

On the target workbook’s **Summary** tab, locate each block by **title / header text**, not fixed coordinates.

**Unpaid Expense Invoices** expected headers: **Date | Counterparty | Amount | Ref | Invoice | Paid | Date Paid | Status | Note**.

**Unpaid Revenue Invoices** expected headers: **Date | Counterparty | Amount | Ref | Invoice | Reminder Sent | Date Reminder Sent | Status | Note**.

If a block exists, read every data row under the headers into memory (all columns). Treat **Paid** / **Reminder Sent** as true when the cell is boolean `TRUE`, checkbox checked, or a clear truthy value. Preserve these for merge (section 6). If a block is absent, start with an empty existing set for that side.

## 3. Search inbox for expense invoices

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

## 3b. Search Sent for revenue invoices

**If a test session is active**, open each EML from `sent_emls` instead of searching Gmail Sent.

**Otherwise (live):** on `{google_account}`, search **Sent** only for outbound invoices on or after `email_after`:

- Subject / body cues: `invoice`, `tax invoice`.
- Prefer messages with PDF attachments.
- Sender is typically `{company.name}` / billing for the company; the **Counterparty** is the **client** (To: / bill-to), not `{company.name}`.

For each candidate message:

1. Prefer a **PDF attachment**; stage under `{workspace.local_path}/` when extracting.
2. Extract **Counterparty** (client), **Amount**, **Ref**, **sent date** (message date), and invoice/document date when present (Date column / filename; fall back to sent date).
3. **Never invent** Amount or Ref — leave Ref blank when unknown; skip if Amount cannot be determined.
4. Deduplicate by **Ref + Counterparty + Amount** (same rules as expenses).

Recon sent fixtures that already match Credits on the statement will settle in section 5 and must **not** remain on Unpaid Revenue.

## 4. Read bank Debits and Credits from both months

For each available recon sheet, resolve the transactions tab like bank reconciliation: start from `{drive.sheet_tab}`; if missing, find the tab with Date / Counterparty / Debit / Credit / Invoice (may be `Bank Transactions` or `Bank`). Locate the header row by **column names**.

Collect every row with **Debit > 0**: Date, Counterparty, Debit, Ref, Invoice (and Category when present).

Collect every row with **Credit > 0**: Date, Counterparty, Credit, Ref, Invoice (and Category when present).

Treat a row as a **bank fee** when Category or Counterparty matches `bank fee` or `service fee` (case-insensitive). Bank-fee Debits are **not** payment evidence for vendor invoices.

## 5. Match invoices to bank rows

An inbox (or existing unpaid expense) invoice is **settled** when a non–bank-fee Debit matches:

- **Amount** equals Debit (allow only trivial rounding; if FX makes equality unclear, prefer Ref / Counterparty confirmation and note uncertainty in chat — do not force a weak match), and
- **Counterparty** loose match (contains / key words / `Counterparty-Match` / `Email matching` sender domain), and/or
- **Ref** equals the sheet **Ref** when both are present.

A sent (or existing unpaid revenue) invoice is **settled** when a Credit matches with the same amount / counterparty / Ref rules (Credit instead of Debit).

Settled invoices are **removed** from the corresponding unpaid table (do not keep them as `pending`).

## 6. Merge candidates and classify for the report

### Expenses

Build the expense candidate set:

- All invoices found in section 3, **plus**
- Existing Unpaid Expense Summary rows (section 2) that are still relevant: still in the email window, or **Paid** is true (awaiting bank), even if older than the window.

Identity key: **Ref + Counterparty + Amount**. When merging, **preserve** operator fields: **Paid** (checkbox), **Date Paid** (static date when present), **Note**, and an existing **Invoice** Drive link. Do **not** preserve static **Status** — Status is always rewritten as a formula in section 8. Do **not** overwrite a non-empty **Date Paid** with a formula.

**Expense grace Note text** (exact):

`Pending as invoice received less than {grace_working_days_expense} working days`

**Expense report classification** (apply in order):

1. Bank Debit match (section 5) → **drop** the row (settled).
2. Else if **Paid** is true → report as **`paid`** (awaiting bank Debit). Clear **Note** (no grace Note while Paid).
3. Else if the **email received** date is within the last `{grace_working_days_expense}` **working days** (Mon–Fri only, counting backward from today) → report as **pending** (grace) and set **Note** to the expense grace Note text.
4. Else → report as **unpaid**. Clear the grace Note text from **Note** if it was previously set for this row (leave other operator Notes alone).

**Expense sheet Status** is owned by formula (section 8): **`paid`** when the Paid checkbox is true; else `pending` when still inside Config expense grace; else `unpaid`.

### Revenue

Build the revenue candidate set:

- All invoices found in section 3b, **plus**
- Existing Unpaid Revenue Summary rows that are still relevant: still in the email window, or **Reminder Sent** is true, even if older than the window.

Preserve: **Reminder Sent**, **Date Reminder Sent** (static), **Note**, **Invoice** link. Do **not** preserve static **Status**.

**Revenue grace Note text** (exact):

`Pending as invoice sent less than {grace_working_days_revenue} working days`

**Revenue report classification** (apply in order):

1. Bank Credit match (section 5) → **drop** the row (settled).
2. Else if **Reminder Sent** is true → report as **Reminder Sent**.
3. Else if the **email sent** date is within the last `{grace_working_days_revenue}` **working days** → report as **pending** (grace) and set **Note** to the revenue grace Note text.
4. Else → report as **unpaid**. Clear the revenue grace Note text if it was previously set for this row.

**Revenue sheet Status** formula (section 8): Reminder Sent → `Reminder Sent`; else within Config revenue grace → `pending`; else `unpaid`.

### Paid / Reminder Sent checkbox workflow (operator)

**Expense — Paid**

1. During grace, Status already shows `pending` (and Note carries the grace text) even if Paid is unchecked. Outside grace with Paid unchecked, Status shows `unpaid`.
2. Operator pays the vendor, then ticks **Paid**.
3. Apps Script sets **Date Paid** (static from Config Today / sheet today) and **clears Note**. Status becomes **`paid`** via formula. The row stays until a matching Debit appears; then the skill drops the row on a later run.

**Revenue — Reminder Sent**

1. During grace, Status shows `pending`. Outside grace with Reminder Sent unchecked, Status shows `unpaid`.
2. Operator sends a reminder, then ticks **Reminder Sent**.
3. Apps Script sets **Date Reminder Sent** to `Config!B1` (static). Status becomes `Reminder Sent` via formula. The row stays until a matching Credit appears; then the skill drops the row on a later run.

Preserve operator **Note** on re-runs unless cleared, except: always set or clear the grace Note text per classification above.

## 7. Ensure Expenses / Revenue PDF and Invoice link

For every **expense** row that remains after section 6:

- If the row already has a valid **Invoice** hyperlink from a prior unpaid run, **reuse** it (do not re-upload).
- Else if a Bank Transactions Debit already has this invoice filed (same Ref / Counterparty / Amount) but the unpaid row is not yet settled by match rules, prefer that Drive file / link.
- Else upload the PDF to the target month `{drive.expenses_folder}` as `YYYYMMDD_Counterparty_Ref.pdf` (`YYYYMMDD` from invoice/document date, else email received date; `Ref` = invoice reference; no duplicates).
- Set **Invoice** to a Sheets hyperlink whose **visible label is the saved filename** (not the raw URL). Format Invoice with **Clip** text overflow — not Wrap.

For every **revenue** row that remains after section 6: same rules, but upload / reuse under `{drive.revenue_folder}` and prefer an existing Credit-row Invoice link when present.

## 8. Write the Summary blocks

**Keep blocks; clear data when empty** (same pattern as match-invoices Summary): **never delete** an unpaid block because it has no rows. Always **keep** the title and headers. If it has **at least one** row after section 6, fill the table. If it has **no** rows, **clear** data under the headers so only the titled empty table remains.

Locate blocks by header text. Do **not** redesign title/header colours. **Do** set unpaid **data** cells to **Arial 10 regular** (not bold) with **white / none** background after every write. Do **not** touch **Missing Expense Invoices**, **Missing Revenue Invoices**, or **Expenses by Category** ([`match-invoices.md`](../bank-reconciliation/match-invoices.md) owns those).

**Do not write helper / legend text** on unpaid title rows. Grace explanation belongs only in **Note** for grace rows. On each run, **clear** any leftover helper/legend cells on the title rows.

### Unpaid Expense Invoices — if at least one row

1. Keep or create title and headers: **Date | Counterparty | Amount | Ref | Invoice | Paid | Date Paid | Status | Note**.
2. **Insert sheet rows before writing data.** Count **N** expense rows. Under the Unpaid Expense header there must be room for **N** data rows **plus exactly one blank gap row** before **Unpaid Revenue Invoices**. Insert if needed. **Never** overwrite another block or the gap row.
3. Clear previous data rows under the headers, then write rows for this run.
4. **Paid** cells must be checkboxes (boolean). Leave Paid unchecked (`FALSE`) for new rows unless preserved.
5. **Date** as a real date with number format **`d-mmm`** (e.g. 10-Nov, same as Bank Transactions); **Amount** as a number. **Note:** when Paid is true, **clear Note**. Else grace-pending expense rows get the expense grace Note text; otherwise preserve operator Note / clear stale grace text.
6. **Date Paid:** write a **static date** with number format **`d-mmm`** when Paid is true and Date Paid is already set (preserve). When Paid is true and Date Paid is empty, write `Config!B1` (or run today) as a static date with **`d-mmm`** (**safety backstop**). When Paid is false, leave Date Paid blank. **Never** write `=IF(Paid,TODAY(),"")` or any Date Paid formula.
7. **Status** — formula only (locate columns by header). Paid wins over grace:

```text
Status: =IF(<PaidCell>,"paid",IF(NETWORKDAYS(<DateCell>,IF(OR(Config!$B$1="",Config!$B$1=0),TODAY(),Config!$B$1))-1<Config!$B$2,"pending","unpaid"))
```

`Config!$B$1` is the as-of Today when set (tests / fixed date); if blank or 0, grace uses `TODAY()`.

8. After writing, set every Unpaid Expense **data** cell to **Arial 10 regular**, background **white / none**. Re-read and confirm **exactly one blank row** before the Unpaid Revenue title.

### Unpaid Expense — zero rows

**Keep** title and headers; **clear** data and title-row helpers; keep **exactly one blank row** before Unpaid Revenue.

### Unpaid Revenue Invoices — if at least one row

1. Keep or create title and headers: **Date | Counterparty | Amount | Ref | Invoice | Reminder Sent | Date Reminder Sent | Status | Note**. Prefer the template location; create only if missing entirely. If an older sheet has revenue headers without Reminder Sent / Date Reminder Sent, insert those columns before Status (do not leave Status immediately after Invoice).
2. Insert sheet rows under the Unpaid Revenue header for **Nr** data rows as needed (no required block below; still do not spill into unrelated content).
3. Clear previous data; write this run’s rows.
4. **Reminder Sent** cells must be checkboxes. Unchecked for new rows unless preserved.
5. **Date** as a real date with number format **`d-mmm`**. **Date Reminder Sent:** static date with **`d-mmm`** when Reminder Sent is true (preserve existing; backstop with `Config!B1` / today if empty). Blank when Reminder Sent is false. **Never** a formula.
6. **Note:** revenue grace-pending rows get the revenue grace Note text; otherwise preserve / clear stale grace text.
7. **Status** — formula only:

```text
Status: =IF(<ReminderSentCell>,"Reminder Sent",IF(NETWORKDAYS(<DateCell>,IF(OR(Config!$B$1="",Config!$B$1=0),TODAY(),Config!$B$1))-1<Config!$B$3,"pending","unpaid"))
```

Example if Date is A, Reminder Sent is F, Status is H, row 40:  
`=IF(F40,"Reminder Sent",IF(NETWORKDAYS(A40,IF(OR(Config!$B$1="",Config!$B$1=0),TODAY(),Config!$B$1))-1<Config!$B$3,"pending","unpaid"))`

8. Arial 10 regular, white / none on data cells.

### Unpaid Revenue — zero rows

**Keep** title and headers; **clear** data under the headers. Do **not** delete the block.

Match invoices owns Missing / Expenses-by-Category Summary updates; **this skill owns** both unpaid blocks’ data (fill or clear under existing headers).

## 9. Report (chat)

Include:

- Target sheet link and which month sheets were read; note any missing month.
- Email window (`email_after` → today); expense grace `{grace_working_days_expense}` and revenue grace `{grace_working_days_revenue}`; confirm Config `B1`/`B2`/`B3` were set.
- Expense counts: **settled**, **pending** (grace), **`paid`** (checkbox, awaiting bank), **unpaid**.
- Revenue counts: **settled**, **pending** (grace), **Reminder Sent**, **unpaid**.
- Lists for unpaid vs pending / paid / Reminder Sent: Date, Counterparty, Amount, Ref, Paid or Reminder Sent, and sheet Status / date columns (formula results / static dates).
- In plain language: after paying a vendor, tick **Paid**; after chasing a client, tick **Reminder Sent**. Rows drop when the matching bank line appears and this skill is re-run. Do **not** mention Apps Script or `.gs` files when section 0 found them already correct (or you fixed them silently). Only if install failed: one plain line that dates may not auto-fill on tick and they can ask for help — no technical paths.
- Month `{drive.expenses_folder}` / `{drive.revenue_folder}` links and filename-labeled Invoice links.
- When a test session is active, confirm Gmail was not used and the transactions tab was not modified by this skill.
