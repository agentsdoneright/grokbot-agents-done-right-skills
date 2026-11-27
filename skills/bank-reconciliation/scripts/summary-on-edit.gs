/**
 * Single simple-trigger entry for Summary checkbox edits.
 * Feature logic lives in unpaid / personal-expense / no-invoice-needed scripts —
 * do not add business logic here.
 */
function onEdit(e) {
  handleUnpaidCheckboxEdit_(e);
  handlePersonalExpenseEdit_(e);
  handleNoInvoiceNeededEdit_(e);
}
