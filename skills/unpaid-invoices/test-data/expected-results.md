# Unpaid expense invoices test mode — expected results

Use this checklist after unpaid-invoices **test mode**. Prerequisite: bank reconciliation **test mode** already completed for statement month **November 2024** (`YYYYMM=202411`).

**Fixed today:** `2024-11-25` (last date on the recon bank extract). Do not use the real calendar date.

**Email window:** after `2024-10-01`.

**Grace:** `{grace_working_days}` = 4 → last working days on/before today are 20, 21, 22, 25 Nov. Cobalt Mail EML dated **18 Nov** is outside grace → `unpaid` when unmatched.

Report pass/fail for each item. Never search or modify Gmail.

---

## Phase 1 — unpaid Cobalt Mail

Inbox fixtures used:

- `skills/unpaid-invoices/test-data/emails/*.eml` (Cobalt Mail)
- `skills/bank-reconciliation/test-data/emails/*.eml` (not under `sent/`)

Bank Debits: November 2024 recon sheet only (Oct sheet usually missing — note that; do not invent Oct data).

### Setup

- [ ] Today is fixed to **2024-11-25**
- [ ] Gmail was **not** searched or modified
- [ ] Expense addressee checks used **Demo Company Ltd** (not flagged solely vs `{company.name}`)
- [ ] Nov recon sheet from bank-reconciliation test mode was the Debit source

### Settled (matched to Nov Debits — omit from Unpaid table)

| Vendor (approx) | Amount | Ref (approx) | EML source |
| --- | ---: | --- | --- |
| Acme Cloud | 49.00 | INV-AC-1042 | recon `01-acme-cloud.eml` |
| Northwind SaaS | 120.00 | NW-8891 | recon `02-northwind-saas.eml` |
| Brightline Ops | 75.50 | BL-2207 | recon `03-brightline-ops.eml` |
| Harbor Tools | 32.99 | HT-5510 | recon `04-harbor-tools.eml` |

- [ ] All four counted as **settled** / omitted from Unpaid Expense Invoices
- [ ] Staples / City Rides / bank fee have **no** unpaid-inbox EML in this pack — they do not appear as unpaid-inbox rows solely because of missing Bank Invoice links

### Unpaid Expense Invoices (Summary)

Cobalt Mail PDF layout (distinct from recon expense fixtures): teal top band, `INVOICE`, Bill to, line items, Sales tax, Amount due.

| Date | Counterparty | Amount | Ref | Status | Paid | Date Paid | EML `From` | Expenses filename (approx) |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| 2024-11-18 | Cobalt Mail | 88.00 | CM-4418 | `unpaid` | unchecked / FALSE | blank | `billing@cobalt-mail.example` | `20241118_Cobalt Mail_CM-4418.pdf` |

- [ ] **Unpaid Expense Invoices** block is **present** (recreated if it was deleted as an empty shell after recon) — show when data
- [ ] Helper text reflects configured grace (default: received `{grace_working_days}` working days ago)
- [ ] Exactly **one** data row: Cobalt Mail as above
- [ ] **Invoice** hyperlink to Drive PDF under month `{drive.expenses_folder}`; visible label = filename; Clip overflow
- [ ] PDF came from unpaid `01-cobalt-mail.eml` (not Gmail)
- [ ] **Status** = `unpaid` (outside grace; no matching Debit)
- [ ] **Paid** unchecked; **Date Paid** blank; **Note** blank unless attention needed
- [ ] Empty **Unpaid Revenue Invoices** shell deleted if present; no revenue unpaid rows filled by this skill

### Report (phase 1)

- [ ] Counts include settled (four recon vendors) and unpaid (Cobalt); pending grace = 0 for this pack
- [ ] Operator told to tick **Paid** after paying; row stays pending until Debit appears
- [ ] Pass/fail against this phase 1 checklist reported

---

## Phase 2 — payment appears on updated extract

1. Copy `skills/unpaid-invoices/test-data/bank-statement-with-payment.csv` into the Nov `{drive.extracts_folder}` month folder (or append the Cobalt CSV row onto the Nov transactions tab per recon import rules).
2. Ensure the Nov sheet has a **Debit 88.00** for Cobalt Mail / `COBALT MAIL *SUB` (Date 25-Nov or as imported).
3. Re-run unpaid-invoices test mode (same fixed today and EML set).

CSV adds one row to the original Nov extract:

`2024-11-25,COBALT MAIL *SUB,-88.00,COBALT MAIL INV CM-4418`

### Expected

- [ ] Cobalt Debit present on the Nov recon sheet
- [ ] Cobalt inbox invoice **settled** (matched to that Debit)
- [ ] **Unpaid Expense Invoices** block **deleted entirely** (zero rows — hide-when-empty)
- [ ] Report counts Cobalt as settled this run
- [ ] Gmail still unused
- [ ] Pass/fail against this phase 2 checklist reported
