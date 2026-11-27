# Reconciliation Apps Script

Four files in the bound project (separation of concerns). Google allows **one** `onEdit` — only the dispatcher defines it.

| File | Role |
| --- | --- |
| [`summary-on-edit.gs`](summary-on-edit.gs) | Thin `onEdit` — calls all handlers |
| [`unpaid-checkbox-dates.gs`](unpaid-checkbox-dates.gs) | Paid / Reminder Sent date stamps + Status formulas (`handleUnpaidCheckboxEdit_`) |
| [`personal-expense-checkbox.gs`](personal-expense-checkbox.gs) | Missing Expense **Personal Expense** → Bank Category `Personal` + Categories Invoice Required false |
| [`no-invoice-needed-checkbox.gs`](no-invoice-needed-checkbox.gs) | Missing Revenue **No Invoice Needed** → Categories Invoice Required false for that Credit’s Category |

## Why a copy can look blank

Drive `copy_file` of the shared Google Sheet template copies the **bound Apps Script project as it exists on the template**. If the template only has an empty stub (`function myFunction() {}`), every new month workbook will get that stub too.

## Keep the shared template current

After changing any `.gs` in this folder:

1. Open `{templates.reconciliation_sheet_url}` from [`config/product.yaml`](../../../config/product.yaml).
2. **Extensions → Apps Script**.
3. Ensure **all four** files exist with the repo contents (create/replace as needed). Remove a lone empty `myFunction` stub if present.
4. Save. Confirm the function dropdown lists `onEdit`, `debugPaidClick`, `debugReminderSentClick`, `debugPersonalExpenseClick`, and `debugNoInvoiceNeededClick`.

## Fix an already-copied month sheet

Same paste of all four files into that workbook’s bound project, then Save.
