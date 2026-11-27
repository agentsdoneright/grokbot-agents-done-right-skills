---
name: Update Bank Statement Test
version: 1.3.0
description: >-
  Version 1.3.0. Use when the user wants Update Bank Statement Test. Runs
  bookkeeping-test Phase 3 (stage bank-statement-with-payment.csv into Extracts),
  then Import bank CSV, Categorise bank data, Match invoices, and Find Unpaid
  Invoices. Does not run Reconcile Bank Statement as a single wrapper. Requires
  Reconcile Bank Statement Test (or Phase 2) first.
---
# Update Bank Statement Test

Orchestrator for the payment-CSV segment (settle Cobalt Debit + Northpeak Credit; Lumen remains grace-pending).

## Prerequisite

Session file `{workspace.local_path}/bookkeeping-test-session.yaml` must be `active` with `phase` ≥ 2. If missing, **stop** and tell the operator to run **Reconcile Bank Statement Test** (or Phase 2) first.

## Steps

1. **Stage Phase 3** — follow [`bookkeeping-test.md`](bookkeeping-test.md) **Phase 3** (copy payment CSV into Extracts only; do not edit the sheet here).
2. **Import** — [`../bank-reconciliation/import-bank-csv.md`](../bank-reconciliation/import-bank-csv.md).
3. **Categorise** — [`../bank-reconciliation/categorise-bank.md`](../bank-reconciliation/categorise-bank.md).
4. **Match invoices** — [`../bank-reconciliation/match-invoices.md`](../bank-reconciliation/match-invoices.md) (attach invoices to Bank rows, including the new Cobalt Debit and Northpeak Credit when matched; refresh Summary).
5. **Find Unpaid Invoices** — [`../unpaid-invoices/unpaid-invoices.md`](../unpaid-invoices/unpaid-invoices.md) (Cobalt and Northpeak should settle; Lumen stays grace-pending).
6. **Report**:
   - Share the **target reconciliation spreadsheet link** (never invent a Drive URL).
   - Give 3–6 plain-language “look here” bullets aligned with [`expected-results.md`](expected-results.md) § After Phase 3 (e.g. Cobalt Debit + Northpeak Credit imported and matched; Cobalt dropped from Unpaid Expense; Northpeak dropped from Unpaid Revenue; Lumen still pending with grace Note; Summary refreshed; Gmail unused).
   - Point at that checklist section for a fuller verify list.
   - Say **demo complete** for this sample path (no further test paste required). If the operator is mid–guided demo, the guided-demo skill owns finale cleanup messaging.

Do **not** run [`reconcile-bank-statement.md`](../bank-reconciliation/reconcile-bank-statement.md) as a wrapper in this bundle — run Import, Categorise, and Match as separate steps above.
