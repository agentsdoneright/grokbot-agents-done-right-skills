# Reconciliation Apps Script

Two files in the bound project (separation of concerns). Google allows **one** `onEdit` — only the dispatcher defines it.

| File | Role |
| --- | --- |
| [`summary-on-edit.gs`](summary-on-edit.gs) | Thin `onEdit` — calls unpaid handler only |
| [`unpaid-checkbox-dates.gs`](unpaid-checkbox-dates.gs) | Paid / Reminder Sent date stamps + Status formulas (`handleUnpaidCheckboxEdit_`) |

**Missing Expense / Missing Revenue** checkboxes (**No Invoice Needed**, **Personal Expense**) are **passive** — they store operator marks only. [`apply-spreadsheet-updates.md`](../apply-spreadsheet-updates.md) applies Bank Notes / Personal Expense category when the operator says they have updated the spreadsheet. Do **not** re-add Apps Script handlers for those columns.

**Missing-invoice Bank highlights** are **agent-applied cell fills** (Match invoices / Apply spreadsheet updates) — **not** conditional formatting and **not** Apps Script. Do **not** add blank-Invoice light-red CF rules on Bank Transactions in the shared template; Match / Apply also strip any such rules on month sheets.

## Why a copy can look blank

Drive `copy_file` of the shared Google Sheet template copies the **bound Apps Script project as it exists on the template**. If the template only has an empty stub (`function myFunction() {}`), every new month workbook will get that stub too.

## Keep the shared template current

Every **new** month workbook is a Drive copy of the Sheet in the version-named folder for `{templates.reconciliation_sheet_version}` (`{templates.reconciliation_version_folder_id}`). After changing any `.gs` in this folder:

1. Open the template Sheet for that version (`{templates.reconciliation_sheet_url}` from [`config/product.yaml`](../../../config/product.yaml) — it must live inside the version folder).
2. **Extensions → Apps Script**.
3. Ensure **both** files exist with the repo contents (create/replace as needed). **Remove** any leftover `personal-expense-checkbox` / `no-invoice-needed-checkbox` files from older templates. Remove a lone empty `myFunction` stub if present.
4. Save. Confirm the function dropdown lists `onEdit`, `debugPaidClick`, and `debugReminderSentClick`.

New sheet layout → create a new version-named Drive folder, put the updated template Sheet there, and update `{templates.reconciliation_sheet_version}`, `{templates.reconciliation_version_folder_id}`, and the Sheet id/url in `config/product.yaml`.

## Fix an already-copied month sheet

Same paste of both files into that workbook’s bound project (and delete obsolete personal/no-invoice script files), then Save.
