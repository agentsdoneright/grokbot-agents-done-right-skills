---
name: Find Unpaid Invoices Test
version: 1.0.0
description: >-
  Version 1.0.0. Use when the user wants Find Unpaid Invoices Test. Runs
  bookkeeping-test Phase 2 (add Cobalt Mail EML to the fixture inbox), then Find
  Unpaid Invoices. Requires Reconcile Bank Statement Test (or Phase 1) first.
---
# Find Unpaid Invoices Test

Orchestrator for the unpaid fixture segment.

## Prerequisite

Session file `{workspace.local_path}/bookkeeping-test-session.yaml` must be `active` with `phase` ≥ 1. If missing, **stop** and tell the operator to run **Reconcile Bank Statement Test** first.

## Steps

1. **Stage Phase 2** — follow [`bookkeeping-test.md`](bookkeeping-test.md) **Phase 2** (append Cobalt EML to `inbox_emls`). Continue without waiting for a separate unpaid prompt.
2. **Find Unpaid Invoices** — read and follow [`../unpaid-invoices/unpaid-invoices.md`](../unpaid-invoices/unpaid-invoices.md).
3. **Report** — point at [`expected-results.md`](expected-results.md) § After Phase 2. Suggest **Update Bank Statement Test** next.

Do not import CSVs or edit Bank Transactions in this skill.
