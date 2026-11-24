# Bookkeeping test — expected results

Use after each **test bundle** (or after the live skills that follow a staged phase). Confirm Gmail was not searched or changed while a test session is active.

| Bundle | Checklist section |
| --- | --- |
| **Reconcile Bank Statement Test** | After Phase 1 |
| **Find Unpaid Invoices Test** | After Phase 2 |
| **Update Bank Statement Test** | After Phase 3 |

Fixed month: **November 2024** (`202411`). Fixed today for unpaid windows: **2024-11-25**.

---

## After Phase 1 live skills (Reconcile Bank Statement Test)

### Import

- [ ] Year / Extracts / `Y202411` (or profile month pattern) folders exist under Accounts
- [ ] Fixture `bank-statement.csv` is in Extracts for `202411`
- [ ] Month reconciliation Google Sheet exists (from template or prior-month copy)
- [ ] Raw CSV data pasted under raw headers; reconciliation Date/Counterparty/Category/Credit/Debit left blank by Import

### Categorise

- [ ] One Bank row per CSV row; dates display as d-mmm
- [ ] SUM(Credit) / SUM(Debit) match the CSV totals
- [ ] Every Bank row has a non-empty **Category**
- [ ] `Categories` (with Type), `Counterparty-Match`, `Counterparties`, `Counterparty-Category` seeded consistently with Bank

### Match invoices

- [ ] Four expense matches from recon inbox EMLs (Acme, Northwind, Brightline, Harbor) with **Source = `Email`**, Invoice hyperlinks (filename labels), PDFs under `{drive.expenses_folder}`
- [ ] Two revenue matches from sent EMLs (Riverstone, Pixelforge) with **Source = `Email`**, PDFs under `{drive.revenue_folder}`
- [ ] Unmatched expense Debits remain for Staples + City Rides (and bank fee has no invoice requirement)
- [ ] Unmatched revenue Credit remains for Client Payment / Acme (no sent EML)
- [ ] Gmail was not used
- [ ] **Summary — Missing Expense Invoices** lists Staples + City Rides (formula-driven; bank fee excluded)
- [ ] **Summary — Missing Revenue Invoices** lists the unmatched credit
- [ ] Exactly one blank row between the two missing-invoice blocks; spills did not overwrite lower titles
- [ ] Summary table blocks are **kept** even when empty (title + headers); empty unpaid shells left intact
- [ ] Matching Bank rows highlighted light red; bank fee not highlighted for missing invoices
- [ ] **Expenses by Category** Totals are live `SUMIF`-style formulas; pie chart present/updated
- [ ] Operator handback lists remaining missing invoices and points to Summary

---

## After Phase 2 live skill (Find Unpaid Invoices Test)

Session inbox includes recon expense EMLs **plus** `skills/unpaid-invoices/test-data/emails/01-cobalt-mail.eml`.

- [ ] Today treated as `2024-11-25`; `email_after` = `2024-10-01`
- [ ] Gmail was not used; transactions tab was **not** modified by unpaid skill
- [ ] Recon expense EMLs settle against existing Nov Debits (not listed as unpaid)
- [ ] Cobalt Mail (`CM-4418`, `$88.00`) appears on **Unpaid Expense Invoices** with Status `unpaid` (outside grace)
- [ ] Unpaid Expense block kept (title/headers); Invoice link filename-labeled under month Expenses when uploaded
- [ ] Unpaid Revenue block left untouched

---

## After Phase 3 live skills (Update Bank Statement Test)

Extracts contain the payment CSV (includes Cobalt Mail debit `-88.00` on 2024-11-25).

### Import + Categorise

- [ ] Payment CSV pasted; Bank rows include Cobalt Mail debit after categorise
- [ ] Reference tabs updated for any new counterparty/category

### Find Unpaid Invoices

- [ ] Cobalt invoice **settled** (dropped from Unpaid Expense Invoices) against the new Debit
- [ ] Gmail not used; Find Unpaid Invoices did not invent Bank rows (Import/Categorise added them)
- [ ] Unpaid Expense block kept; data cleared under headers if no remaining unpaid/pending rows
