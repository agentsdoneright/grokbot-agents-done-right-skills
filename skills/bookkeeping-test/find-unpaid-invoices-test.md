---
name: Find Unpaid Invoices Test
version: 1.3.0
description: >-
  Version 1.3.0. Use when the user wants Find Unpaid Invoices Test. Runs
  bookkeeping-test Phase 2 (add Cobalt Mail unpaid + Lumen Analytics grace-pending
  inbox EMLs and Northpeak overdue revenue sent EML), then Find Unpaid Invoices.
  Requires Reconcile Bank Statement Test (or Phase 1) first.
---
# Find Unpaid Invoices Test

Orchestrator for the unpaid fixture segment.

## Prerequisite

Session file `{workspace.local_path}/bookkeeping-test-session.yaml` must be `active` with `phase` ≥ 1. If missing, **stop** and tell the operator to run **Reconcile Bank Statement Test** first.

## Steps

1. **Stage Phase 2** — follow [`bookkeeping-test.md`](bookkeeping-test.md) **Phase 2** (append Cobalt unpaid + Lumen grace-pending to `inbox_emls`, and Northpeak DC-2403 to `sent_emls`). Continue without waiting for a separate unpaid prompt.
2. **Find Unpaid Invoices** — read and follow [`../unpaid-invoices/unpaid-invoices.md`](../unpaid-invoices/unpaid-invoices.md).
3. **Report**:
   - Share the **target reconciliation spreadsheet link** (never invent a Drive URL).
   - Give 3–6 plain-language “look here” bullets aligned with [`expected-results.md`](expected-results.md) § After Phase 2 (e.g. Unpaid Expense: Cobalt = unpaid, Lumen = pending with grace Note; Unpaid Revenue: Northpeak = unpaid outside 10-day grace; Reminder Sent / Paid unchecked; Invoice links; Bank tab not modified by unpaid; Gmail unused).
   - Point at that checklist section for a fuller verify list.
   - Tell the operator the next paste is: `Run Update Bank Statement Test`.

Do not import CSVs or edit Bank Transactions in this skill.
