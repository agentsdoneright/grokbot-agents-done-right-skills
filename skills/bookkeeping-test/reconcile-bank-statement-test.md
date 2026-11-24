---
name: Reconcile Bank Statement Test
version: 1.1.0
description: >-
  Version 1.1.0. Use when the user wants Reconcile Bank Statement Test (sample /
  fixture bank reconcile). Runs bookkeeping-test Phase 1 (stage bank-statement.csv
  + recon inbox/sent EMLs), then Reconcile Bank Statement (Import → Categorise →
  Match invoices). Prefer this over running phase 1 and live skills separately.
---
# Reconcile Bank Statement Test

Orchestrator for the first test segment. Read profile; load Drive / Sheets / Gmail skills as the child steps require (Gmail unused while the session is active).

## Steps

1. **Stage Phase 1** — follow [`bookkeeping-test.md`](bookkeeping-test.md) **Phase 1** fully (folders, copy `skills/bank-reconciliation/test-data/bank-statement.csv`, write session file). Do not stop for the operator after staging; continue.
2. **Reconcile** — read and follow [`../bank-reconciliation/reconcile-bank-statement.md`](../bank-reconciliation/reconcile-bank-statement.md) (Import → Categorise → Match invoices). Child skills honour the active test session.
3. **Report** — after staging and after reconcile:
   - Share the **target reconciliation spreadsheet link** (never invent a Drive URL). If unavailable, tell the operator how to open it under Accounts / `2024` / `Y202411`.
   - Give 3–6 plain-language “look here” bullets aligned with [`expected-results.md`](expected-results.md) § After Phase 1 (e.g. Bank rows categorised; expense + revenue matches from fixtures; Summary Missing Expense/Revenue; Expenses by Category pie; empty Unpaid shells left intact; Gmail unused).
   - Point at that checklist section for a fuller verify list.
   - Tell the operator the next paste is: `Run Find Unpaid Invoices Test`.

Do not invent amounts or invoices. Do not advance to Phase 2 in this skill.
