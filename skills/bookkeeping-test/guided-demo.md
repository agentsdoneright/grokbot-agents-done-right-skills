---
name: Bookkeeping Guided Demo
version: 1.1.0
description: >-
  Version 1.1.0. Use when Quick start just finished and the operator agrees to a
  bookkeeping demonstration, or when they ask to be guided through the sample
  bookkeeping test flow. Walks them through Reconcile Bank Statement Test
  (optional manual missing-invoice attach), Find Unpaid Invoices Test, and
  Update Bank Statement Test one paste at a time with newcomer-friendly
  spreadsheet explanations and the live sheet link after each run. Does not
  auto-run all three phases in one go.
---
# Bookkeeping Guided Demo

Coach a **new** Grok Bot operator through the three sample bookkeeping test bundles **in order**. Read [`config/profile.yaml`](../../config/profile.yaml) and [`config/product.yaml`](../../config/product.yaml) when you need Drive paths, company name, or `{github.public_skills_repo_url}`. Ground observations in [`expected-results.md`](expected-results.md) — paraphrase for newcomers; do not dump the raw checklist.

**Do not** invent amounts, invoices, or Drive links. **Do not** run a test bundle until the operator sends that prompt (or a clear equivalent). Between steps, give the exact paste text in a copyable block and **wait**. Prefer clickable choices / buttons when the platform supports them.

## When this skill starts

Assume Quick start is already verified (see [`AGENTS.md`](../../AGENTS.md)). If it is not, stop and run Quick start initiation first.

Open with a short welcome: this demo uses fixed **November 2024** sample data and local fixture emails (Gmail is not searched or changed). They will paste three commands, one after another; after each run you will explain what appeared on the spreadsheet and give them a link to open it. After the first reconcile, they can optionally practice attaching invoices that were never in email.

## Step 1 — Reconcile Bank Statement Test

1. Tell the operator to paste exactly:

```text
Run Reconcile Bank Statement Test
```

2. **Wait** until they send that prompt (or clear equivalent). Then read and follow [`reconcile-bank-statement-test.md`](reconcile-bank-statement-test.md).
3. After that skill’s report, add a newcomer-friendly recap:
   - Share the **reconciliation spreadsheet link** from the run (never invent one). If missing, tell them to open Drive under `{drive.root_path}` / Accounts / `2024` / `Y202411` and open the month reconciliation sheet.
   - Explain in plain language: a Nov 2024 workbook was created or filled; the **Bank** tab has categorised sample transactions; fixture expense and revenue invoices were matched from sample emails; **Summary** still lists **Missing Expense Invoices** (**Staples**, **City Rides**) and **Missing Revenue Invoices** (**Acme** client payment) on purpose; **Expenses by Category** has totals and a pie chart; empty **Unpaid Expense / Unpaid Revenue** shells are waiting for a later step.
   - Point at [`expected-results.md`](expected-results.md) § After Phase 1 if they want a fuller checklist.

## Step 1b — Optional: attach missing invoices from GitHub (Recommended)

Before Step 2, coach this practice path (invoices that “weren’t in email”):

1. Explain in plain language: in real life, some invoices never arrive by email — you download or scan the PDF and drop it into this chat so the agent can attach it to the bank row (`Source = Manual`).
2. Give these **public download links** (build from `{github.public_skills_repo_url}`; do not invent Drive URLs):

   - Staples ($64.20): `{github.public_skills_repo_url}/raw/main/skills/bank-reconciliation/test-data/manual-invoices/20241121_Staples_ST-4821.pdf`
   - City Rides ($18.75): `{github.public_skills_repo_url}/raw/main/skills/bank-reconciliation/test-data/manual-invoices/20241125_City_Rides_CR-7721.pdf`
   - Acme client revenue ($2,500.00): `{github.public_skills_repo_url}/raw/main/skills/bank-reconciliation/test-data/manual-invoices/20241110_Acme_DC-2404.pdf`

   Canonical folder notes: [`../bank-reconciliation/test-data/manual-invoices/README.md`](../bank-reconciliation/test-data/manual-invoices/README.md).

3. Present **buttons** (recommended first):

   - **Yes, I’ll attach the sample invoices** (Recommended)
   - **Skip and continue**

4. If **Skip**: acknowledge; go to Step 2.
5. If **Yes**:
   - Tell them to download the three PDFs from the links above, then **drop all three into this chat**.
   - Ask them to paste (or confirm): `Match the invoices I just attached`
   - **Wait** for the files + that prompt (or clear equivalent).
   - Then follow [`../bank-reconciliation/match-invoices.md`](../bank-reconciliation/match-invoices.md) for the Manual path: upload to month Expenses / Revenue as appropriate, set **Source = `Manual`**, filename-labeled Invoice links, refresh Summary (Missing lists clear for those rows; clear light-red highlights).
   - Confirm in plain language that Staples, City Rides, and Acme are no longer on the Missing lists. Point at [`expected-results.md`](expected-results.md) § After optional manual attach if useful.
6. Then invite them to continue to Step 2.

## Step 2 — Find Unpaid Invoices Test

1. Tell the operator to paste exactly:

```text
Run Find Unpaid Invoices Test
```

2. **Wait**, then read and follow [`find-unpaid-invoices-test.md`](find-unpaid-invoices-test.md).
3. After the report, recap for a newcomer:
   - Share the **same spreadsheet link** again (from this run).
   - On **Summary → Unpaid Expense Invoices**: **Cobalt Mail** should show as **unpaid** (outside the expense grace window); **Lumen Analytics** as **pending** with Note about receiving the invoice within the grace working days; **Paid** unchecked for both.
   - On **Summary → Unpaid Revenue Invoices**: **Northpeak Systems** (`DC-2403`) should show as **unpaid** (outside the 10 working-day revenue grace); **Reminder Sent** unchecked.
   - Invoice PDFs were filed under the month **Expenses** / **Revenue** folders; the unpaid skill did **not** change Bank rows; Gmail was not used.
   - Point at [`expected-results.md`](expected-results.md) § After Phase 2 if useful.
4. Give the next paste when they are ready.

## Step 3 — Update Bank Statement Test

1. Tell the operator to paste exactly:

```text
Run Update Bank Statement Test
```

2. **Wait**, then read and follow [`update-bank-statement-test.md`](update-bank-statement-test.md).
3. After the report, recap for a newcomer:
   - Share the spreadsheet link again.
   - A sample payment CSV was imported: **Cobalt Mail** now has a matching Debit, so Cobalt **drops off** Unpaid Expense Invoices; **Northpeak Systems** has a matching Credit, so it **drops off** Unpaid Revenue Invoices; **Lumen Analytics** stays **pending** (still no matching bank payment); Summary / missing lists refreshed where needed.
   - Point at [`expected-results.md`](expected-results.md) § After Phase 3 if useful.

## Finale

When Step 3 is done:

1. Congratulate them — the sample bookkeeping flow is complete.
2. For a **real** month: deactivate or delete `{workspace.local_path}/bookkeeping-test-session.yaml`, then paste `Run Reconcile Bank Statement` or `Run Find Unpaid Invoices` (see the README live prompts).
3. **Optional cleanup:** it is fine to **delete the `2024` Drive folder** created by this demo (under the Accounts tree / `{drive.root_path}` layout from Quick start). That removes the sample year data only; it is not required.
4. Stop unless they ask for something else. Do not nag them to start a live month.
