# Reconciliation Apps Script

Source of truth: [`unpaid-checkbox-dates.gs`](unpaid-checkbox-dates.gs).

## Why a copy can look blank

Drive `copy_file` of the shared Google Sheet template copies the **bound Apps Script project as it exists on the template**. If the template only has an empty stub (`function myFunction() {}` in `unpaid-checkbox-dates.gs`), every new month workbook will get that stub too.

## Keep the shared template current

After changing the `.gs` in this repo:

1. Open `{templates.reconciliation_sheet_url}` from [`config/product.yaml`](../../../config/product.yaml).
2. **Extensions → Apps Script**.
3. Replace the contents of `unpaid-checkbox-dates.gs` (or `Code.gs`) with the full file from this folder.
4. Save. Confirm the function dropdown lists `onEdit`, `debugPaidClick`, and `debugReminderSentClick` (not only `myFunction`).

## Fix an already-copied month sheet

Same paste into that workbook’s bound project, then Save. Ticking Paid / Reminder Sent (or Debug `debugPaidClick` / `debugReminderSentClick`) should stamp dates as `d-mmm`.
