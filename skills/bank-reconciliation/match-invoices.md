---
name: Match invoices
version: 1.1.3
description: >-
  Version 1.1.3. Use when the user wants to match paid invoices to bank statement
  rows in their Google Sheets reconciliation workbook: Unfiled Drive folders
  first (Source=Drive), then email (Source=Email), then Manual chat uploads
  (Source=Manual) for expense Debits and revenue Credits. Fill the Summary tab
  with live formulas for Missing Expense Invoices, Missing Revenue Invoices, and
  Expenses by Category (SUMIF Totals against Bank Transactions); never delete a
  Summary table block when empty — keep title and headers, clear data only;
  insert sheet rows before spills; keep exactly one blank row between stacked
  Summary tables; format Summary data cells Arial 10 (not bold) with white /
  no fill background; highlight missing-invoice Bank rows in light red; exclude
  bank-fee and Personal / Personal expense Debits from missing invoices.
  Requires Import bank CSV and Categorise bank data first. If
  `{workspace.local_path}/bookkeeping-test-session.yaml` is active, use fixture
  inbox/sent EMLs from that session instead of Gmail.
---
# Match invoices to bank transactions

Do this Drive work under `{drive.root_path}/{drive.accounts_folder}`. Use the Google Drive, Google Sheets, and Gmail connectors (load their skills first). When a test session is active, do **not** search or change Gmail — use fixture EMLs from the session file.

If you must save a PDF or scratch file **locally**, write it under `{workspace.local_path}/`. Create that folder if needed.

**Prerequisites:** the month sheet has categorised Bank rows (Date, Counterparty, Category, Credit, Debit filled) — see [`import-bank-csv.md`](import-bank-csv.md) and [`categorise-bank.md`](categorise-bank.md). If Category / Debit columns are empty, stop and tell the operator to categorise first.

**No invoice needed (exclude from missing expense):** treat a Debit row as not needing an invoice when **Category** (trimmed, case-insensitive) is `Personal` or `Personal expense`, or when Category or Counterparty matches `bank fee` or `service fee`. Do **not** search email/Drive for those rows, do **not** list them as missing, do **not** light-red highlight them for missing invoices, and do **not** ask the operator for a file. (If an invoice already exists on the row, leave it.)

**Unpaid Summary data** (**Unpaid Expense Invoices** and **Unpaid Revenue Invoices**) is owned by **Find Unpaid Invoices** ([`skills/unpaid-invoices/unpaid-invoices.md`](../unpaid-invoices/unpaid-invoices.md)) — do not invent unpaid rows here.

## Test session (optional)

At the start, check `{workspace.local_path}/bookkeeping-test-session.yaml`. If it exists and `active` is true:

- Use `statement_year` / `statement_month` from the session when locating the month sheet.
- For expense email search, open each path/glob in `inbox_emls` (repo-relative). Never search Gmail inbox.
- For revenue email search, open each path/glob in `sent_emls`. Never search Gmail Sent.
- For Notes / addressee checks on expense invoices, treat `company_addressee_override` (default **Demo Company Ltd**) as the expected company when set; do not flag a mismatch solely because it differs from `{company.name}`.
- When extracting a PDF from an EML before Drive upload, stage under `{workspace.local_path}/`.
- Fixture paths are committed sample data — not disposable `{workspace.local_path}` files.

## 1. Locate the sheet and transactions tab

- Open the month sheet under `{drive.root_path}/{drive.accounts_folder}` for the statement month.
- Resolve the transactions tab from `{drive.sheet_tab}` (often **`Bank Transactions`**); locate headers by name: Date | Counterparty | Category | Credit | Debit | VAT | Ref | Invoice | Notes | Source.
- Read `Email matching`, `Counterparties`, and `Summary` before writing.

## 2. Match expense invoices (Debit rows)

**Source column** (set when a match is attached this run):

- `Drive` — invoice found in Unfiled expense invoices and moved into the month `{drive.expenses_folder}`
- `Email` — invoice found via Gmail / test-session EML
- `Manual` — operator uploaded the invoice into the agent chat

Search order per Debit row: **Unfiled → email → Manual (later, after the unmatched report)**.

Unfiled expense path: `{drive.root_path}/{drive.accounts_folder}/{drive.unfiled_folder}/{drive.unfiled_expense_invoices}`. Ensure that folder exists (create `{drive.unfiled_folder}` and the expense invoices subfolder if missing). Ensure a `{drive.expenses_folder}` subfolder exists inside the spreadsheet's folder (create once, then reuse).

For every transactions-tab row with a Debit:

1. **Check Unfiled first.** Search `{drive.root_path}/{drive.accounts_folder}/{drive.unfiled_folder}/{drive.unfiled_expense_invoices}` for a PDF that matches Date / Counterparty / Debit.
   - **When an Unfiled match is found:** **move** (do not copy) the file into the month `{drive.expenses_folder}`. Rename to `YYYYMMDD_Counterparty_Ref.pdf` if needed (`Ref` = invoice reference number, e.g. `20261115_Acme_INV78.pdf`); do not leave duplicates. Set **Invoice** as a filename-labeled hyperlink with **Clip** overflow (same rules as below). Fill **VAT** / **Ref** from the invoice when present. Write **Notes** only when something needs attention. Set **Source = `Drive`**. Update `Counterparties` contact fields from the invoice when present (same rules as email matches). Do **not** add or update `Email matching` solely because of a Drive match.
2. **Else check `Email matching`.** Read the tab's headers and rows. If the row's Counterparty is listed:
   - **Live:** search Gmail on `{google_account}` with that rule (sender, subject keywords, attachment hints, etc.), narrowed by the row's Date and Debit amount.
   - **Test session active:** match against `inbox_emls` fixtures instead of Gmail.
3. **Otherwise do a general search:**
   - **Live:** on `{google_account}` — counterparty name and raw merchant text, a date window of about two weeks before to a few days after the bank date, and the amount (also the original currency amount from the raw CSV columns for FX charges). Use Date, Counterparty and Debit as the key fields to confirm the match.
   - **Test session active:** match against `inbox_emls` as above.
4. **When an email match is found:**
   - Get the invoice: prefer a PDF attachment. If it's only in the body or behind a link, save the email as a PDF or download the linked PDF under `{workspace.local_path}/`, and say so in Notes.
   - Upload it to `{drive.expenses_folder}` inside the spreadsheet's folder. Name it `YYYYMMDD_Counterparty_Ref.pdf` (`Ref` = invoice reference number) and don't upload duplicates.
   - Put a link to the Drive file in the row's **Invoice** column: the **visible link text must be the saved filename**, not the raw URL. Use a Sheets hyperlink whose label is that filename. Format the **Invoice** column with **Clip** text overflow — do not Wrap.
   - Fill **VAT** with the tax amount from the invoice when present; leave blank if none.
   - Fill **Ref** with the invoice reference / invoice number when present; leave blank if none.
   - Set **Source = `Email`**.
   - Write Notes only when something needs attention (amount mismatch, multi-charge invoice, date far off, receipt instead of invoice, addressee not `{company.name}` — or not `company_addressee_override` when a test session sets it — or uncertain match).
   - **Update `Counterparties` contact fields** for this Counterparty from the invoice (Email, Phone, Registration, Address). Prefer finance / billing / accounts emails. If values **changed**, overwrite and **inform the operator** (old → new). Never invent contact fields.
   - Right away, if the counterparty wasn't already in `Email matching`, or the rule needed changing, add or update its row with the rule that worked, without duplicates.
5. Skip **no-invoice-needed** rows (Personal / Personal expense, bank fee / service fee — see top of this skill) unless an invoice is already linked. Do not search for or request invoices for those Debits.
6. Never send, reply to, or change any emails.
7. Before reporting, re-read `Email matching` and confirm every **email** expense match has its rule saved there (Drive matches do not require an Email matching row).
8. **Report (expenses):** the `{drive.expenses_folder}` folder link, the matches found (include **Source** counts: Drive / Email / Manual), any Notes written, Counterparties contact updates, and Debit rows still missing an invoice (Date, Counterparty, Debit) — **excluding** no-invoice-needed rows. When the operator uploads missing files, upload each to `{drive.expenses_folder}` with the same naming, put a filename-labeled hyperlink in Invoice (Clip overflow), fill VAT / Ref when known, set **Source = `Manual`**, and add a note if needed.

## 3. Match revenue invoices (Credit rows)

**Source** values are the same as expenses (`Drive` / `Email` / `Manual`). Search order per Credit row: **month Revenue folder (already filed) → Unfiled → email → Manual**.

Unfiled revenue path: `{drive.root_path}/{drive.accounts_folder}/{drive.unfiled_folder}/{drive.unfiled_revenue_invoices}`. Ensure that folder exists (create if missing).

For every transactions-tab row with a Credit:

1. Ensure a Drive subfolder named `{drive.revenue_folder}` exists inside the spreadsheet's folder (create once, then reuse).
2. **Check `{drive.revenue_folder}` first** for an existing PDF that matches Date / Counterparty / Credit (same `YYYYMMDD_Counterparty_Ref.pdf` naming when possible). If linking that already-filed file this run and **Source** is empty, leave **Source** blank (it was not matched from Unfiled this run).
3. **Else check Unfiled.** Search the Unfiled revenue path for a matching PDF. On match: **move** (do not copy) into the month `{drive.revenue_folder}`, rename if needed, set Invoice / VAT / Ref / Notes as for expenses, and set **Source = `Drive`**.
4. **Otherwise search email:**
   - **Live:** Gmail Sent on `{google_account}` for outbound invoices to that client (counterparty name, amount, date window of about two weeks before to a few days after the bank date).
   - **Test session active:** use `sent_emls` from the session file instead of Gmail Sent.
5. **When an email match is found:**
   - Prefer a PDF attachment; stage under `{workspace.local_path}/` if extracting from email.
   - Upload to `{drive.revenue_folder}` as `YYYYMMDD_Counterparty_Ref.pdf` (no duplicates).
   - Set **Invoice** as a filename-labeled hyperlink with Clip overflow.
   - Fill **VAT** and **Ref** from the outbound invoice when present.
   - Set **Source = `Email`**.
   - Update `Counterparties` Email / Phone / Registration / Address from the client's details when present; if values changed, overwrite and **inform the operator**. Prefer finance / billing emails. Never invent values.
   - Seed / keep the Counterparty on `Counterparties`, `Counterparty-Match`, and `Counterparty-Category` — the Counterparty is the **paying client**, not `{company.name}`.
6. Never send, reply to, or change any emails.
7. **Report (revenue):** the `{drive.revenue_folder}` folder link, credit matches found (include **Source** counts), Counterparties updates, and Credit rows still missing an invoice. When the operator uploads a missing invoice in chat, upload to `{drive.revenue_folder}`, set Invoice / VAT / Ref as known, and set **Source = `Manual`**.

Then fill the Summary tab (section 4).

## 4. Fill the Summary tab

Run this after invoice matching (sections 2–3) so the Invoice column is up to date — including **every re-run** after the operator supplies more invoices (section 5). If the operator later asks only to refresh Summary, re-read the current transactions tab and Categories Type values and apply the keep-blocks and formula rules below (including clearing or refilling Expenses by Category data when needed — never delete the table block).

**After new matches:** rows that now have an Invoice must **disappear** from Missing Expense / Missing Revenue (live `FILTER`/`QUERY` formulas do this automatically when Invoice is filled). Re-evaluate candidates; apply **Keep blocks; clear data when empty** below. Clear light-red highlights on newly matched bank rows.

### Keep blocks; clear data when empty (final Summary state)

**Standing rule for every Summary table this run touches:** **never delete** a table block (title, helper text if any, headers, or the Expenses by Category pie chart) because it has no data rows. Always **keep** the title and headers. If the table has **at least one** data row, fill it (formulas/data). If it has **no** data rows, **clear** data/formula rows under the headers so only the titled empty table remains. Do **not** remove the block and recreate it later — leave the shell in place for the next run.

Apply that independently to:

| Block | When empty |
| --- | --- |
| **Missing Expense Invoices** | Keep title + headers; clear data/formula rows under the headers |
| **Missing Revenue Invoices** | Keep title + headers; clear data/formula rows under the headers |
| **Expenses by Category** | Keep title + headers (and pie chart); clear category data rows under the headers |
| **Unpaid Expense Invoices** / **Unpaid Revenue Invoices** | **Filled only by** Find Unpaid Invoices (expense + revenue); this skill must **not** invent unpaid rows. If an unpaid block is present with **no data rows**, **leave it** — do **not** delete the empty shell. |

### Read the template layout first

The workbook template is expected to provide a **Summary** tab with table headers and formatting already in place. **Do not redesign those tables** (do not change title/header colours, column layout, or pie styling). **Do** normalize **data** cells to **Arial 10 regular** with a **white / none** background after every write (see below). At the start of this step, read the Summary tab (and any named ranges) and locate the areas by **header text** and named ranges, **not by fixed cell coordinates**.

Look for these titles and headers (case-insensitive; close wording is fine):

- **Missing Expense Invoices** — columns such as Date, Counterparty (or Description), Amount, and Note (or reason).
- **Missing Revenue Invoices** — the same kind of columns.
- **Expenses by Category** — columns such as Category, Total, and Percentage.
- **Unpaid Expense Invoices** / **Unpaid Revenue Invoices** — owned by Find Unpaid Invoices for **data** (both blocks); leave empty shells in place when that skill has not run yet.

If a named range exists for one of these (a name containing `MissingExpense`, `MissingRevenue`, or `ExpensesByCategory`, or similar), use it as the start of that table. If the Summary tab is missing, add a minimal tab named `Summary` with the expected block titles and headers — no decorative formatting. Prefer keeping the template’s empty titled tables rather than omitting them.

#### Unpaid invoice blocks (data owned by Find Unpaid Invoices)

When refreshing Summary in this skill:

- Do **not** fill Unpaid Expense or Unpaid Revenue from Bank Transactions or invent unpaid rows — Find Unpaid Invoices owns both.
- Do **not** restyle or overwrite unpaid blocks that already have data rows.
- Do **not** delete an unpaid block that has **no data rows** — leave the shell for the unpaid skill.

### Fill with live formulas

Write **formulas** (FILTER, QUERY, SUMIF, SUMIFS, ARRAYFORMULA, or equivalent) that read the transactions tab and `Categories`. Do **not** paste static snapshot totals or missing-invoice rows. Keep the template's number and date formats. For **Percentage**, use number format `0%`.

Find Date, Counterparty, Category, Credit, Debit, and Invoice by header name. Transaction data starts on the first row below that header row.

#### Summary data style — Arial 10, white background

After writing any Summary **data** rows (including spilled `FILTER`/`QUERY` output, rows created by sheet inserts, and Expenses by Category category rows), set those data cells to:

- **Font:** Arial, size **10**, **not bold**
- **Background:** **white** / none (clear fill) — **never** leave the light-blue header fill on data rows

Inserted sheet rows often inherit the header row’s blue background; always clear that fill on the data range after insert/write. Do **not** leave spill/paste inheritance from title styles (titles are often Arial 14 bold). Leave title and header-row styling as in the template. Apply this every Summary refresh.

#### Insert rows — never overwrite Summary content below

**Hard rule:** when any Summary table receives data (a spilling `FILTER`/`QUERY`, static rows, or growing category rows), **insert new sheet rows** so titles, headers, and tables below shift down. **Never** write or spill into cells that already hold another block’s title, headers, or data — and **never** consume the mandatory blank gap row between tables (see below).

Before writing a formula or rows that will occupy **N** data rows under a table’s header:

1. Count **N** (candidate rows, or known spill height for this run).
2. Look at what currently sits immediately under that header. If fewer than **N** empty rows exist **before** the required one-blank-row gap and the next Summary block title, **insert** enough blank rows so there are at least **N** empty rows for the data **plus** one empty gap row **plus** the next block intact.
3. Only then write the live formula or paste/fill the data rows.
4. Apply **Arial 10 regular** and **white / none** background fill to the data range (clear any inherited blue).
5. **Re-read** the Summary tab. Confirm exactly one blank row before each following block title. If any lower title is corrupted, truncated, sharing a cell with spilled data, or missing its gap, insert more rows and rewrite — treat overwrite as a failed step.

#### Missing invoice blocks (keep; fill or clear)

Evaluate which rows would appear before writing:

- **Missing expense candidates:** Debit > 0 and Invoice blank, **excluding no-invoice-needed rows** (Personal / Personal expense Category; bank fee / service fee Category or Counterparty).
- **Missing revenue candidates:** Credit > 0 and Invoice blank.

Then:

- **Always keep** the **Missing Expense Invoices** title and headers (create them only if the Summary tab is missing that block entirely).
- If there is **at least one** missing expense candidate: fill with live `FILTER`/`QUERY` (or equivalent) formulas for Date, Counterparty, Amount (Debit), and Note (for example `No invoice found`). Exclude no-invoice-needed rows from the formula (same Personal / bank-fee rules).
- If there are **no** missing expense candidates: **clear** any data or formula rows under the headers, but **keep** the title and headers.
- Same rules for **Missing Revenue Invoices** (Amount = Credit).
- On a later Summary refresh, refill or clear under the existing headers — do not delete and recreate the block. Keep the two missing-invoice blocks stacked with exactly one blank row between them (see below).

#### Exactly one blank row between stacked Summary tables

Keep **both** Missing Expense Invoices and Missing Revenue Invoices blocks (even when one or both have no data rows). Leave Unpaid Expense / Unpaid Revenue shells in place. In the vertical Summary stack, after the **last occupied row** of each table (last data row when filled, or the **header** row when empty) leave **exactly one** completely empty horizontal row, then the next block’s **title**.

Required gaps (in order):

1. After Missing Expense (last data or header) → one blank → Missing Revenue title  
2. After Missing Revenue (last data or header) → one blank → Unpaid Expense title  
3. After Unpaid Expense (last data or header) → one blank → Unpaid Revenue title  

Do **not** write data into the gap row. Do **not** leave a multi-row empty buffer — the gap must be **exactly one** blank row.

**Required order** (row inserts first):

1. Count missing-expense candidates **Ne** and missing-revenue candidates **Nr** (either may be 0).
2. **Before** writing the expense `FILTER`/`QUERY` (when **Ne** ≥ 1), insert sheet rows under the Missing Expense header so there is room for **Ne** spilled rows **and** one blank row **and** the full Missing Revenue (and lower) blocks without colliding.
3. When **Ne** ≥ 1, write the expense live formula and set data cells to **Arial 10 regular** with **white / none** fill; when **Ne** = 0, clear data under the expense headers. Re-read and confirm Missing Revenue title has exactly one blank above it.
4. **Before** writing the revenue formula (when **Nr** ≥ 1), ensure **Nr** empty rows exist under the Missing Revenue header **plus** one blank before Unpaid Expense; insert rows if needed.
5. When **Nr** ≥ 1, write the revenue live formula and set data cells to **Arial 10 regular** with **white / none** fill; when **Nr** = 0, clear data under the revenue headers. Re-read and confirm Unpaid Expense title still has exactly one blank above it.
6. On a later Summary refresh, repeat if candidate counts grew. When a block has zero rows, clear its data but keep title/headers and every one-blank-row gap in the stack.

#### Highlight missing-invoice rows on Bank Transactions

After the Summary missing-invoice blocks are filled (or cleared), sync row highlighting on the **transactions tab**:

- Highlight a bank row if and only if it is a **missing expense candidate** or **missing revenue candidate**. No-invoice-needed rows (Personal / Personal expense, bank fees) must **not** be highlighted for missing invoices.
- **Colour:** light red fill (`#FFCDD2` or Sheets light-red equivalent) on the **full reconciliation data columns** for that row (Date through Source/Notes — not the raw CSV columns).
- Prefer **conditional formatting** driven by blank Invoice plus Debit/Credit (excluding no-invoice-needed Categories/Counterparties). Otherwise apply/clear fill each run.
- Clear light-red highlighting from rows that now have an Invoice or that are no-invoice-needed.
- **Verify:** highlighted bank rows must match Summary Missing Expense / Missing Revenue data rows. When a block has no data rows, no bank rows should remain highlighted for that missing type.

#### Expenses by Category (formula-linked to Bank)

**Always keep** the **Expenses by Category** title, headers, and pie chart. If there are **no** expense-typed categories to list, **clear** category data rows under the headers but do **not** delete the table or the pie chart. If there is at least one expense-typed category, fill the block and update the pie as below.

- Include **only** categories whose **Type** on the `Categories` tab is an expense type (`Expense` / `expense` / `Debit`). Include bank-fee categories when typed as expense.
- **Total (required live formula):** every Total cell **must** be a spreadsheet formula referencing the transactions tab. **Pasting computed numbers is a failure.** Canonical pattern (adapt columns / Criteria cell / tab name):

```text
=SUMIF('Bank Transactions'!$C$3:$C,$F3,'Bank Transactions'!$E$3:$E)
```

- **Percentage:** formula over those Total cells (e.g. `=G3/SUM($G$3:$G$20)`), format `0%`.
- Sort larger totals first unless the template already specifies an order. Flag blank or mismatched Types in the report.
- Insert sheet rows under the Expenses by Category header before writing category data rows if needed.
- **Verify before reporting:** re-read every Total cell; replace any plain number with the SUMIF pattern.

Do not invent amounts. If a formula cannot resolve, stop and tell the operator what was missing.

### Pie chart (Expenses by Category)

Keep **one** embedded pie chart on the Summary tab titled **Expenses by Category** (create if missing; never delete solely because the category table has no data rows):

- Bind to **Category** and **Total** (not Percentage); include the header row (`headerCount` 1).
- Give the data range **spare rows** below the current last category (about 5–10).
- **Do not add a second chart on reruns** — update the existing chart’s data range in place.
- When creating a new chart, place it in empty space; do not cover table headers.
- When the table has **no data rows**, leave the pie bound to the empty table range.

**Connector limits:** no hide-columns tool; pie slice label format may not be configurable. Percentage column (`0%`) is the reliable integer display.

### Report (Summary)

Include: locations used; for **each** Summary block whether **filled** or left **empty** (headers only — never deleted); empty unpaid shells left intact; row **inserts** used; exactly one blank row between each stacked Summary table (Missing Expense → Missing Revenue → Unpaid Expense → Unpaid Revenue); Summary data cells Arial 10 regular with white / none background; Bank light-red highlights match Summary missing data rows; Expenses by Category Totals are `SUMIF`-style formulas when filled; missing expense/revenue rows; Type mismatches; pie created or updated in place.

## 5. Final step: hand back to the user

### Missing invoices (required when any remain)

If any missing expense or revenue invoice candidates remain after Summary:

1. **List them clearly** in the chat (Date, Counterparty, Debit or Credit), grouped as expenses vs revenue (no-invoice-needed Debits — Personal / Personal expense and bank fees — excluded from the expense list).
2. **Point to the Summary tab** — Missing Expense Invoices / Missing Revenue Invoices, and light-red highlights on Bank Transactions.
3. **How to supply the files** — drop PDFs into this chat, or upload to Unfiled expense / revenue folders under `{drive.root_path}/{drive.accounts_folder}/{drive.unfiled_folder}/`.
4. **Then re-run** on the same spreadsheet: match from Unfiled / chat (Source=`Drive` / `Manual`); **update Summary** (keep blocks; clear data when empty); clear highlights on matched rows; hand back again.

If there are **no** missing invoices, say so and skip the supply/re-run ask.

### Sheet edits

Tell the operator: they may update Category names, Category Type, or Counterparty names on the spreadsheet; when finished, run **Categorise bank data** remapping ([`categorise-bank.md`](categorise-bank.md) section 5), then re-run this skill (or ask for a Summary-only refresh) so formulas, one-blank-row gaps, Arial 10 white-background data, highlights, and pie stay correct.
