/**
 * Single simple-trigger entry for Summary checkbox edits.
 * Feature logic lives in unpaid-checkbox-dates.gs and personal-expense-checkbox.gs —
 * do not add business logic here.
 */
function onEdit(e) {
  handleUnpaidCheckboxEdit_(e);
  handlePersonalExpenseEdit_(e);
}
