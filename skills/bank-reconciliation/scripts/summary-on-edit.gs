/**
 * Single simple-trigger entry for Summary checkbox edits.
 * Feature logic lives in unpaid-checkbox-dates.gs —
 * do not add business logic here.
 *
 * Missing Expense / Missing Revenue checkboxes (No Invoice Needed,
 * Personal Expense) are passive — Apply spreadsheet updates reads them.
 */
function onEdit(e) {
  handleUnpaidCheckboxEdit_(e);
}
