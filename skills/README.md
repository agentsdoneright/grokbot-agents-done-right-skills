# Skills catalog

Ask these in chat after Quick start. Main entry points are also listed in the root [`README.md`](../README.md).

## Main skills

- **[Reconcile Bank Statement](bank-reconciliation/reconcile-bank-statement.md)** — one-shot Import → Categorise → Match → Find Unpaid. Example: `Reconcile my bank statement for November` or `Run Reconcile Bank Statement`.
- **[Apply spreadsheet updates](bank-reconciliation/apply-spreadsheet-updates.md)** — after you edit Categories / counterparties or tick Summary No Invoice Needed / Personal Expense. Example: `I have updated the categories` or `I have updated the spreadsheet`.

## Sub-skills of Reconcile

The wrapper runs these in order. You can also ask for any one alone:

- **[Import bank CSV](bank-reconciliation/import-bank-csv.md)** — folders, month sheet, paste CSV. Example: `Import my bank statement CSV for November`.
- **[Categorise bank data](bank-reconciliation/categorise-bank.md)** — Date / Counterparty / Category / Credit / Debit + reference tabs. Example: `Categorise this month’s bank transactions`.
- **[Match invoices](bank-reconciliation/match-invoices.md)** — match expense/revenue invoices + Summary missing tables. Example: `Match invoices on my November reconciliation`.
- **[Find Unpaid Invoices](unpaid-invoices/unpaid-invoices.md)** — unpaid expense/revenue Summary refresh. Example: `Find my unpaid invoices`.

## Test / demo

- **[Bookkeeping Guided Demo](bookkeeping-test/guided-demo.md)** — coach through the two sample prompts after Quick start.
- **[Reconcile Bank Statement Test](bookkeeping-test/reconcile-bank-statement-test.md)** — stage fixtures then run full Reconcile (includes unpaid sample emails).
- **[Update Bank Statement Test](bookkeeping-test/update-bank-statement-test.md)** — stage payment CSV then import → categorise → match → find unpaid. Run after Reconcile Test.
- **[Find Unpaid Invoices Test](bookkeeping-test/find-unpaid-invoices-test.md)** — optional standalone unpaid fixture + Find Unpaid (default demo path uses Reconcile Test instead).

Expected outcomes: [`bookkeeping-test/expected-results.md`](bookkeeping-test/expected-results.md).

## Setup

- **[Repo update check](repo-update-check/repo-update-check.md)** — compare public `CHANGELOG.md`, ask before upgrading the **whole** repo source (skills, rules, docs, shared config), merge ask for customized skills. Quick start creates a **daily Grok Bot routine** that runs this skill ([Create a routine](https://docs.x.ai/grok-bot/skills-routines-and-automations#create-a-routine)). You can also ask: `Check for repo updates`.
- **[Private repo copy](private-repo-copy/private-repo-copy.md)** — Customizable upgrade: private GitHub copy; overrides live under [`custom/`](../custom/) (auto-save new custom skills/rules/routines when that setting is on).
