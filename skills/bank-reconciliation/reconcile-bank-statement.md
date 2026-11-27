---
name: Reconcile Bank Statement
version: 1.1.0
description: >-
  Version 1.1.0. Use when the user wants to reconcile a bank statement in one go
  (Reconcile Bank Statement, monthly reconcile, full bank reconciliation): run
  Import bank CSV, then Categorise bank data, then Match invoices, then Find
  Unpaid Invoices on the same month sheet. Does not stage test fixtures — for
  sample data use Reconcile Bank Statement Test. If a bookkeeping test session
  is already active, the child skills honour it. Find Unpaid Invoices alone
  remains available for unpaid-only reruns.
---
# Reconcile Bank Statement

Thin wrapper: run these skills **in order** on the same statement month. Read each skill file and follow it fully before starting the next.

1. [`import-bank-csv.md`](import-bank-csv.md) — folders, sheet, paste CSV only  
2. [`categorise-bank.md`](categorise-bank.md) — Date / Counterparty / Category / Credit / Debit + reference tabs  
3. [`match-invoices.md`](match-invoices.md) — expense/revenue matching + Summary + handback  
4. [`../unpaid-invoices/unpaid-invoices.md`](../unpaid-invoices/unpaid-invoices.md) — Unpaid Expense / Unpaid Revenue Summary tables  

Post a short milestone in chat after each step (sheet link, row counts / matches as that skill requires). Do not invent amounts or invoices.

**Operator tone:** keep the final handback non-technical. Do **not** mention Apps Script, `.gs` files, or paste-into-Extensions instructions when Import section 1b found the checkbox script already present (or fixed it silently). Include unpaid counts / unpaid table highlights from step 4 in the final summary.

If `{workspace.local_path}/bookkeeping-test-session.yaml` is already `active`, leave it for the child skills; do not rewrite phases here.
