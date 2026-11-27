---
name: Reconcile Bank Statement Test
version: 1.3.0
description: >-
  Version 1.3.0. Use when the user wants Reconcile Bank Statement Test (sample /
  fixture bank reconcile). Runs bookkeeping-test Phase 1 (bank-statement.csv +
  recon inbox/sent EMLs), then Phase 2 (Cobalt / Lumen unpaid inbox + Northpeak
  sent), then Reconcile Bank Statement (Import → Categorise → Match → Find
  Unpaid Invoices). Prefer this over running phases and live skills separately.
---
# Reconcile Bank Statement Test

Orchestrator for the first test segment (includes unpaid fixtures). Read profile; load Drive / Sheets / Gmail skills as the child steps require (Gmail unused while the session is active).

## Steps

1. **Stage Phase 1** — follow [`bookkeeping-test.md`](bookkeeping-test.md) **Phase 1** fully (folders, copy `skills/bank-reconciliation/test-data/bank-statement.csv`, write session file). Do not stop for the operator after staging; continue.
2. **Stage Phase 2** — follow [`bookkeeping-test.md`](bookkeeping-test.md) **Phase 2** fully (append Cobalt unpaid + Lumen grace-pending to `inbox_emls`, and Northpeak DC-2403 to `sent_emls`). Continue without waiting for a separate unpaid prompt.
3. **Reconcile** — read and follow [`../bank-reconciliation/reconcile-bank-statement.md`](../bank-reconciliation/reconcile-bank-statement.md) (Import → Categorise → Match invoices → Find Unpaid Invoices). Child skills honour the active test session.
4. **Report** — after staging and after reconcile:
   - Share the **target reconciliation spreadsheet link** (never invent a Drive URL). If unavailable, tell the operator how to open it under Accounts / `2024` / `Y202411`.
   - Give plain-language “look here” bullets aligned with [`expected-results.md`](expected-results.md) § After Phase 1 **and** § After Phase 2 (e.g. Bank rows categorised; expense + revenue matches from fixtures; Summary Missing Expense/Revenue for Staples, City Rides, and Acme client payment; Expenses by Category pie; **Unpaid Expense**: Cobalt unpaid + Lumen pending; **Unpaid Revenue**: Northpeak unpaid; Gmail unused).
   - Note that the three missing invoice rows are intentional (no fixture email). Sample PDFs for a **manual chat attach** live under `skills/bank-reconciliation/test-data/manual-invoices/` on the public repo; the guided demo coaches download links after this step.
   - Point at those checklist sections for a fuller verify list.
   - If this run is **not** inside the guided demo, tell the operator the next paste is: `Run Update Bank Statement Test` (or continue the demo’s optional manual-attach step first).

Do not invent amounts or invoices. Do **not** auto-match the manual-invoices PDFs (they are not in `inbox_emls` / `sent_emls`).
