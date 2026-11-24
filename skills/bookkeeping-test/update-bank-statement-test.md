---
name: Update Bank Statement Test
version: 1.1.0
description: >-
  Version 1.1.0. Use when the user wants Update Bank Statement Test. Runs
  bookkeeping-test Phase 3 (stage bank-statement-with-payment.csv into Extracts),
  then Import bank CSV, Categorise bank data, Match invoices, and Find Unpaid
  Invoices. Does not run Reconcile Bank Statement as a single wrapper. Requires
  Find Unpaid Invoices Test (or Phase 2) first.
---
# Update Bank Statement Test

Orchestrator for the payment-CSV segment (settle Cobalt against a new Debit; Lumen remains grace-pending).

## Prerequisite

Session file `{workspace.local_path}/bookkeeping-test-session.yaml` must be `active` with `phase` ≥ 2. If missing, **stop** and tell the operator to run **Find Unpaid Invoices Test** first.

## Steps

1. **Stage Phase 3** — follow [`bookkeeping-test.md`](bookkeeping-test.md) **Phase 3** (copy payment CSV into Extracts only; do not edit the sheet here).
2. **Import** — [`../bank-reconciliation/import-bank-csv.md`](../bank-reconciliation/import-bank-csv.md).
3. **Categorise** — [`../bank-reconciliation/categorise-bank.md`](../bank-reconciliation/categorise-bank.md).
4. **Match invoices** — [`../bank-reconciliation/match-invoices.md`](../bank-reconciliation/match-invoices.md) (attach invoices to Bank rows, including the new Cobalt Debit when matched; refresh Summary).
5. **Find Unpaid Invoices** — [`../unpaid-invoices/unpaid-invoices.md`](../unpaid-invoices/unpaid-invoices.md) (Cobalt should settle; Lumen stays grace-pending).
6. **Report** — point at [`expected-results.md`](expected-results.md) § After Phase 3.

Do **not** run [`reconcile-bank-statement.md`](../bank-reconciliation/reconcile-bank-statement.md) as a wrapper in this bundle — run Import, Categorise, and Match as separate steps above.
