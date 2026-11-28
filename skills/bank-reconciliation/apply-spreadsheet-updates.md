---
name: Apply spreadsheet updates
version: 1.1.1
description: >-
  Version 1.1.1. Use when the user says they have updated the categories or
  spreadsheet, finished editing the reconciliation spreadsheet, wants to sync
  mappings, apply spreadsheet updates, or update mappings after manual sheet
  changes: read passive Missing Expense / Missing Revenue checkbox marks (No
  Invoice Needed → Bank Notes; Personal Expense → Bank Category Personal
  Expense plus the same Notes phrase, since personal never needs an invoice)
  without changing Categories Invoice Required; snapshot Bank Transactions and
  reference tabs; detect new or renamed categories and counterparties; clarify
  rename vs new one at a time; sync Categories / Counterparty-* / Email
  matching; then refresh Summary missing-invoice and Expenses by Category
  formulas and light-red highlights so Personal / no-invoice rows are not
  flagged. Does not import CSV or search email. Requires an existing month
  sheet (Import + Categorise at least once).
---
# Apply spreadsheet updates

Do this Drive work under `{drive.root_path}/{drive.accounts_folder}`. Use the Google Drive and Google Sheets connectors (load their skills first). Read [`config/profile.yaml`](../../config/profile.yaml).

**Triggers (examples):** “I have updated the categories”, “I have updated the spreadsheet”, “I’ve finished updating the spreadsheet”, “I’ve finished editing the sheet”, “Apply spreadsheet updates”, “Sync my mappings”, “Sync spreadsheet mappings”, “Update mappings after my edits”.

**Prerequisites:** a month reconciliation workbook already exists (Import bank CSV and Categorise bank data have run at least once). If no sheet is found, stop and tell the operator to import/categorise first.

**Not this skill:** full Import / Categorise fill / Match invoice search — use those skills for CSV paste, first categorisation, or attaching invoices.

**Canonical Bank Notes phrase for no invoice needed:** `No invoice needed (operator)` (match case-insensitively when detecting; write this exact string when appending).

## Test session (optional)

If `{workspace.local_path}/bookkeeping-test-session.yaml` exists and `active` is true, use that session’s `statement_year` / `statement_month` when locating the month sheet. Otherwise resolve the statement month from the operator (or the sheet they name).

## 1. Locate the sheet

- Open the month sheet named from `{drive.sheet_title_pattern}` under `{drive.root_path}/{drive.accounts_folder}/{drive.year_folder_pattern}/{drive.month_folder_pattern}/`.
- Resolve the transactions tab from `{drive.sheet_tab}` (often **`Bank Transactions`**; older sheets may be named `Bank`). Locate headers by name: Date | Counterparty | Category | Credit | Debit | … Invoice | Notes | Source.

## 2. Process Summary checkbox marks (before mapping sync / Summary refresh)

Missing Expense / Missing Revenue **No Invoice Needed** and **Personal Expense** checkboxes are **passive** — they do not run Apps Script. Apply them here, **before** rewriting Summary formulas (which would clear checkbox state).

### 2a. Read checked rows

On the **Summary** tab, locate **Missing Expense Invoices** and **Missing Revenue Invoices** by title/header text (not fixed coordinates). For each data row under those headers, read Date, Counterparty, Amount, Category (if present), **No Invoice Needed**, and (expense only) **Personal Expense**.

Treat a checkbox as checked when the cell is truthy (`TRUE`, `true`, `1`, or checked).

### 2b. No Invoice Needed → Bank Notes

For each checked **No Invoice Needed** row (expense or revenue):

1. Find the unique matching Bank row: same Date + Counterparty + Amount on **Debit** (expense table) or **Credit** (revenue table). If zero or multiple matches, **flag and skip** that Summary row (do not invent a match).
2. On the matched Bank **Notes** cell: if Notes already contains `No invoice needed (operator)` (case-insensitive), leave it. Otherwise append that phrase (if Notes already has text, separate with `; `).
3. Clear light-red missing-invoice highlight on that Bank row when you write the note (full reconciliation columns).
4. Do **not** change `Categories` or **Invoice Required** for this mark.

### 2c. Personal Expense → Bank Category (and no invoice needed)

Personal expenses **never require an invoice**. For each checked **Personal Expense** row on **Missing Expense Invoices** only:

1. Find the unique matching Bank **Debit** (Date + Counterparty + Amount). If zero or multiple matches, flag and skip.
2. Set that Bank row’s **Category** to **`Personal Expense`**.
3. Append the canonical Notes phrase `No invoice needed (operator)` if not already present (same append rules as §2b) — personal implies no invoice needed.
4. Clear light-red missing-invoice highlight on that Bank row.
5. Do **not** change Categories Invoice Required from this checkbox (operator owns that column). New `Personal Expense` category rows still get Invoice Required **FALSE** when added in §6 (seed default only).

If both checkboxes are checked on one expense row, apply §2c (category + note) once — do not duplicate the Notes phrase.

Count categories set to Personal Expense and notes written for the final report.

## 3. Snapshot (read into memory — do not write yet)

Read once **after** §2 Bank writes (so Personal Expense / Notes are reflected) and hold for this run (no durable snapshot file unless the operator asks):

| Source | Capture |
| --- | --- |
| Transactions tab | Data rows: Date, Counterparty, Category, Credit, Debit, Notes (and Invoice if useful for matching) |
| `Categories` | Category, Type, Invoice Required |
| `Counterparty-Category` | Counterparty → Category |
| `Counterparty-Match` | Counterparty ↔ Match |
| `Counterparties` | Counterparty names (+ contact columns for preserve-only) |
| `Email matching` | Counterparty keys (and rule columns for preserve-on-rename) |
| Summary Missing Expense / Missing Revenue | Category / Counterparty only where cells are **static values** — ignore or flag FILTER/QUERY spill cells (operator edits there may not stick) |

Build sets/maps: unique Bank categories; unique Bank counterparties; Bank Counterparty→Category; reference category names; reference counterparties.

**Source of truth for live transactions:** the transactions tab. If a Summary Missing row shows a different Category than the matched Bank Debit/Credit (same Date / Counterparty / Amount), **ask** whether to update the Bank row before syncing references. Do not silently overwrite Bank from Summary. (Exception: §2c already set Personal Expense on Bank when that checkbox was checked.)

## 4. Diff

Compare snapshot maps and list:

1. **New category candidates** — Category on Bank (or clarified Summary) not present on `Categories`.
2. **Possible category renames** — a reference Category no longer appears on any Bank row **and** a new spelling appeared (or one-for-one swap looks likely).
3. **Unused categories** — on `Categories` but not on Bank (report only; **do not delete** unless the operator explicitly asks).
4. **New counterparty candidates** — on Bank but missing from Counterparties / Counterparty-Match / Counterparty-Category.
5. **Possible counterparty renames** — same heuristic as categories.
6. **Mapping mismatches** — Bank Counterparty→Category differs from `Counterparty-Category`.

## 5. Clarify rename vs new (required when ambiguous)

For each ambiguous case, **one decision at a time** (prefer clickable choices / buttons; otherwise A / B). Do **not** guess.

- **Rename** `Old` → `New` — update reference tabs (and Bank / Email matching keys as needed) so the old spelling is replaced.
- **New** category or counterparty — add the new row; leave the old reference row alone.

Clear new names with no plausible old counterpart: treat as **New** without asking (still report them). Clear Bank vs Counterparty-Category mismatches where both names already exist: ask which Category should win for that Counterparty, then sync.

## 6. Apply sync

After clarifications:

### Categories

- **New:** append Category; set Type from Debit-only / Credit-only / blank-if-both (same rules as [`categorise-bank.md`](categorise-bank.md) section 3); set Invoice Required default **TRUE** for new rows, or **FALSE** for Personal / Personal expense / Personal Expense / bank-fee-like names. Do **not** overwrite Type or Invoice Required on existing unrelated rows.
- **Rename:** replace the Category string on `Categories`, `Counterparty-Category`, and any Bank rows still using the old spelling. Preserve Type and Invoice Required on that row.
- **Never** set or clear Invoice Required from Summary **No Invoice Needed** / **Personal Expense** checkboxes — that column is **always** updated manually by the operator (except the default for brand-new category rows above).

### Counterparties

- **New:** add to `Counterparties` (blank contacts), `Counterparty-Match` (Match = raw bank string when known; else leave Match for later), `Counterparty-Category` (Category from Bank).
- **Rename:** update Counterparty key on `Counterparties` (preserve Email / Phone / Registration / Address), `Counterparty-Match`, `Counterparty-Category`, and `Email matching` Counterparty column so rules stay linked. Update Bank Counterparty cells that still use the old spelling when this rename was confirmed.

### Counterparty-Category mismatches

After rename/new decisions, set `Counterparty-Category` to match Bank (or the operator’s chosen Category).

Skip duplicate keys. Never invent invoices, amounts, or contact fields.

## 7. Refresh Summary (same run)

After mappings are consistent, refresh Summary using the **keep blocks / formulas / one-blank-row / Arial 10 white data / light-red highlights** rules in [`match-invoices.md`](match-invoices.md) **section 4** (Summary-only path: Missing Expense, Missing Revenue, Expenses by Category). Honour **no-invoice-needed** exclusions from match-invoices (Categories.Invoice Required false + Personal / Personal Expense / bank-fee fallbacks + Bank Notes containing `No invoice needed (operator)`) and do **not** spill into checkbox columns (No Invoice Needed, Personal Expense). Re-ensure blank checkboxes on remaining candidate data rows. Do **not** invent unpaid rows (Find Unpaid Invoices owns those blocks).

Rows that received §2 notes or Personal Expense category (or any Bank row already categorised Personal*) must **not** appear in Missing Expense / Missing Revenue and must **not** stay light-red on Bank Transactions.

Do **not** re-run full email/Unfiled invoice matching in this skill unless the operator also asked to match invoices.

## 8. Report and stop

In plain language (no Apps Script / `.gs` talk):

- Sheet link and statement month.
- How many **No Invoice Needed** marks became Bank Notes; how many **Personal Expense** marks set Bank Category.
- What was **renamed**, what was **added**, mapping fixes, unused categories noted (not deleted).
- That Summary missing lists / highlights were refreshed (or what blocked refresh).
- Optional next steps: Match invoices (if they have files to attach), Find Unpaid Invoices.

## Operator tone

Keep questions short. Prefer everyday words (“category name”, “vendor name”) over tab jargon when talking to newcomers; tab names are fine when pointing at the sheet.
