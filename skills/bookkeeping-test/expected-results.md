# Bookkeeping test — expected results

Use after each **test bundle** (or after the live skills that follow a staged phase). Confirm Gmail was not searched or changed while a test session is active.

| Bundle | Checklist section |
| --- | --- |
| **Reconcile Bank Statement Test** | After Phase 1 **and** After Phase 2 (bundle stages both) |
| **Find Unpaid Invoices Test** | After Phase 2 (standalone only) |
| **Update Bank Statement Test** | After Phase 3 |

Fixed month: **November 2024** (`202411`). Fixed today for unpaid windows: **2024-11-25**.

---

## After Phase 1 live skills (Bank / Match portion of Reconcile Bank Statement Test)

Reconcile Bank Statement Test also stages Phase 2 and runs Find Unpaid — use **After Phase 2** for unpaid table checks after that same bundle.

### Import

- [ ] Year / Extracts / `Y202411` (or profile month pattern) folders exist under Accounts
- [ ] Fixture `bank-statement.csv` is in Extracts for `202411`
- [ ] Month reconciliation Google Sheet exists (from versioned template; lookup tabs from prior month when present)
- [ ] Raw CSV data pasted under raw headers; reconciliation Date/Counterparty/Category/Credit/Debit left blank by Import

### Categorise

- [ ] One Bank row per CSV row; dates display as d-mmm
- [ ] SUM(Credit) / SUM(Debit) match the CSV totals
- [ ] Every Bank row has a non-empty **Category**
- [ ] `Categories` (with Type), `Counterparty-Match`, `Counterparties`, `Counterparty-Category` seeded consistently with Bank

### Match invoices

- [ ] Four expense matches from recon inbox EMLs (Acme, Northwind, Brightline, Harbor) with **Source = `Email`**, Invoice hyperlinks (filename labels), PDFs under `{drive.expenses_folder}`
- [ ] Two revenue matches from sent EMLs (Riverstone, Pixelforge) with **Source = `Email`**, PDFs under `{drive.revenue_folder}`
- [ ] Unmatched expense Debits remain for Staples + City Rides (Invoice Required false / bank fee / Personal have no invoice requirement)
- [ ] Unmatched revenue Credit remains for Client Payment / Acme (no sent EML)
- [ ] Gmail was not used
- [ ] **Summary — Missing Expense Invoices** lists Staples + City Rides (formula-driven; Invoice Required false / bank fee / Personal excluded)
- [ ] **Summary — Missing Expense Invoices** has No Invoice Needed + Personal Expense checkbox columns (passive marks; formulas do not spill into them; applied only via Apply spreadsheet updates)
- [ ] **Summary — Missing Revenue Invoices** lists the unmatched credit (No Invoice Needed checkbox column present; passive; not spilled into)
- [ ] Exactly one blank row between each stacked Summary table (Missing Expense → Missing Revenue → Unpaid Expense → Unpaid Revenue); spills did not overwrite lower titles or consume gap rows
- [ ] Summary table **data** cells are Arial 10 regular (not bold / not title-sized) with white / none background (not header blue)
- [ ] Summary table blocks are **kept** even when empty (title + headers); empty unpaid shells left intact
- [ ] Matching Bank rows highlighted light red; Invoice Required false / bank fee / Personal not highlighted for missing invoices
- [ ] **Categories** includes Invoice Required (new categories default checked / true)
- [ ] **Expenses by Category** Totals are live `SUMIF`-style formulas; pie chart present/updated
- [ ] Operator handback lists remaining missing invoices and points to Summary

### After optional manual attach (guided demo Step 1b)

Operator downloaded the three PDFs from `skills/bank-reconciliation/test-data/manual-invoices/` on the public repo, dropped them into chat, and re-ran Match invoices (Manual path).

- [ ] Staples Debit matched with **Source = `Manual`**; Invoice filename-labeled under `{drive.expenses_folder}`
- [ ] City Rides Debit matched with **Source = `Manual`**; Invoice under Expenses
- [ ] Acme client Credit matched with **Source = `Manual`**; Invoice under `{drive.revenue_folder}` (DC-2404)
- [ ] **Summary — Missing Expense Invoices** no longer lists Staples or City Rides (clear data or empty under headers)
- [ ] **Summary — Missing Revenue Invoices** no longer lists the Acme client credit
- [ ] Light-red highlights cleared on those three Bank rows
- [ ] Gmail still unused; files were not taken from fixture inbox/sent EMLs

---

## After Phase 2 live skill (Find Unpaid — via Reconcile Bank Statement Test or Find Unpaid Invoices Test)

Session inbox includes recon expense EMLs **plus**:

- `skills/unpaid-invoices/test-data/emails/01-cobalt-mail.eml` (received 2024-11-18)
- `skills/unpaid-invoices/test-data/emails/02-lumen-analytics.eml` (received 2024-11-22)

Session sent includes recon revenue EMLs **plus**:

- `skills/unpaid-invoices/test-data/emails/sent/03-northpeak-dc-2403.eml` (sent 2024-11-08)

- [ ] Today treated as `2024-11-25`; `email_after` = `2024-10-01`; expense grace = 4 working days; revenue grace = 10 working days
- [ ] Config labels: **Expense Invoice grace period (working days)** / **Revenue Invoice grace period (working days)**; `B2=4`, `B3=10`
- [ ] Gmail was not used; transactions tab was **not** modified by unpaid skill
- [ ] Recon expense EMLs settle against existing Nov Debits (not listed as unpaid)
- [ ] Recon sent EMLs (Riverstone, Pixelforge) settle against existing Nov Credits (not listed as unpaid revenue)
- [ ] Cobalt Mail (`CM-4418`, `$88.00`) appears on **Unpaid Expense Invoices** as report **`unpaid`** (outside grace); sheet Status formula `unpaid`; Paid unchecked; no grace Note; **Date Paid** blank (not a `TODAY()` formula)
- [ ] Lumen Analytics (`LA-3301`, `$156.40`) appears as report **`pending`** (grace); **Note** = `Pending as invoice received less than 4 working days`; sheet Status formula `pending` (Config B2 grace); Paid unchecked
- [ ] Northpeak Systems (`DC-2403`, `$1250.00`) appears on **Unpaid Revenue Invoices** as report **`unpaid`** (outside 10 working-day revenue grace); sheet Status `unpaid`; Reminder Sent unchecked; Date Reminder Sent blank; Invoice link under month Revenue when uploaded
- [ ] Unpaid Expense / Unpaid Revenue blocks kept (title/headers); Invoice links filename-labeled
- [ ] Unpaid data cells Arial 10 regular with white / none background; exactly one blank row between last Unpaid Expense data row and Unpaid Revenue title
- [ ] Checkbox date-stamp Apps Script ensured (or failure reported with static-date backstop)

---

## After Phase 3 live skills (Update Bank Statement Test)

Extracts contain the payment CSV (includes Cobalt Mail debit `-88.00` and Northpeak Systems credit `1250.00` on 2024-11-25). Lumen has **no** matching Debit.

### Import + Categorise

- [ ] Payment CSV pasted; Bank rows include Cobalt Mail debit and Northpeak Systems credit after categorise
- [ ] Reference tabs updated for any new counterparty/category

### Match invoices

- [ ] Match ran after Categorise (before Find Unpaid Invoices)
- [ ] Cobalt Mail Debit matched to its invoice when present in the fixture inbox / Expenses; Invoice link set on the Bank row
- [ ] Northpeak Systems Credit matched to DC-2403 when present in sent fixtures / Revenue; Invoice link set on the Bank row when matched
- [ ] Staples + City Rides (and unmatched Acme credit) remain missing where still unmatched; Summary refreshed with one-blank-row gaps and Arial 10 white-background data

### Find Unpaid Invoices

- [ ] Cobalt invoice **settled** (dropped from Unpaid Expense Invoices) against the new Debit
- [ ] Northpeak invoice **settled** (dropped from Unpaid Revenue Invoices) against the new Credit
- [ ] Lumen Analytics (`LA-3301`, `$156.40`) **still pending** (grace, unmatched); Note still the expense grace text; sheet Status formula `pending` (Config B2 grace)
- [ ] Gmail not used; Find Unpaid Invoices did not invent Bank rows (Import/Categorise/Match added or updated them)
- [ ] Unpaid Expense block kept with the Lumen row still present; Unpaid Revenue block kept (empty shell or no Northpeak row); Arial 10 white-background data; one blank row before Unpaid Revenue
