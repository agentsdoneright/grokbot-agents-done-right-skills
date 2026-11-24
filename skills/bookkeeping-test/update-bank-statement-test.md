---
name: Update Bank Statement Test
version: 1.0.0
description: >-
  Version 1.0.0. Use when the user wants Update Bank Statement Test. Runs
  bookkeeping-test Phase 3 (stage bank-statement-with-payment.csv into Extracts),
  then Import bank CSV, Categorise bank data, and Find Unpaid Invoices. Does not
  run Match invoices or Reconcile Bank Statement. Requires Find Unpaid Invoices
  Test (or Phase 2) first.
---
# Update Bank Statement Test

Orchestrator for the payment-CSV segment (settle Cobalt against a new Debit).

## Prerequisite

Session file `{workspace.local_path}/bookkeeping-test-session.yaml` must be `active` with `phase` ≥ 2. If missing, **stop** and tell the operator to run **Find Unpaid Invoices Test** first.

## Steps

1. **Stage Phase 3** — follow [`bookkeeping-test.md`](bookkeeping-test.md) **Phase 3** (copy payment CSV into Extracts only; do not edit the sheet here).
2. **Import** — [`../bank-reconciliation/import-bank-csv.md`](../bank-reconciliation/import-bank-csv.md).
3. **Categorise** — [`../bank-reconciliation/categorise-bank.md`](../bank-reconciliation/categorise-bank.md).
4. **Find Unpaid Invoices** — [`../unpaid-invoices/unpaid-invoices.md`](../unpaid-invoices/unpaid-invoices.md) (Cobalt should settle).
5. **Report** — point at [`expected-results.md`](expected-results.md) § After Phase 3.

Do **not** run Match invoices or [`reconcile-bank-statement.md`](../bank-reconciliation/reconcile-bank-statement.md) in this bundle.
