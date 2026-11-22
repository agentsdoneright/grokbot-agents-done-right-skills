# Bank reconciliation test mode — expected results

Use this checklist after a **test mode** run (statement month **November 2024** / `YYYYMM=202411`). Report pass/fail for each item.

## Setup

- [ ] Statement month is November 2024 (`2024` / `Y202411`), not “last month”
- [ ] Fixture CSV was copied to Drive Extracts for that month (not a live bank export)
- [ ] First-month sheet came from the skill `.xlsx` template (uploaded + converted), not a blank spreadsheet built from scratch
- [ ] Gmail was **not** searched or modified
- [ ] Expense invoice addressee checks used **Demo Company Ltd** (not flagged solely vs `{company.name}`)

## Reconciliation grid

Fixture CSV has **10** rows. Totals from signed `Amount` (negative = out):

| Direction | Total |
| --- | ---: |
| Credit (in) | 5250.00 |
| Debit (out) | 372.44 |

- [ ] Transactions tab has **10** data rows (one per CSV row)
- [ ] `SUM(Credit)` = **5250.00**
- [ ] `SUM(Debit)` = **372.44**
- [ ] Dates display as `d-mmm` (e.g. `5-Nov`)
- [ ] Every Bank row has a non-empty **Category** (exact spellings may vary)
- [ ] Bank header uses **Counterparty** (not `Recipient / Payer`)
- [ ] Imported raw CSV columns (typically K onward) are **hidden**; reconciliation columns A–J stay visible

## Reference tabs (seeded same run)

After filling Bank, the agent must seed these tabs in the **same run**. Do **not** require fixed category names — assert structure and consistency with Bank / the fixture merchants:

- [ ] `Categories` has data rows (not header-only); every Category used on Bank appears there
- [ ] `Counterparties` lists each distinct Bank `Counterparty` (**10** names; casing may vary). Includes credit clients (e.g. Riverstone Consulting, Pixelforge Studio) as well as expense vendors
- [ ] `Counterparty-Match` has a row per those names; `Match` loosely matches the fixture merchants: `ACME CLOUD *SUB`, `NORTHWIND SAAS`, `CLIENT PAYMENT ACME`, `BRIGHTLINE OPS`, `BANK SERVICE FEE`, `HARBOR TOOLS`, `RIVERSTONE CONSULTING PAYMENT`, `STAPLES OFFICE SUPPLY`, `PIXELFORGE STUDIO WIRE`, `CITY RIDES *TRIP`
- [ ] `Counterparty-Category` maps each Counterparties name to the Category used on that Bank row

## Matched expense invoices (from `test-data/emails/*.eml`)

The four expense PDFs use **different layouts and field labels** on purpose (so matching is not template-identical):

| Vendor | Layout sketch | Customer label | Tax label | Total label |
| --- | --- | --- | --- | --- |
| Acme Cloud | US SaaS header band | Bill to | Sales tax | Amount due |
| Northwind SaaS | UK centred letterhead | Invoice to | VAT | Total incl. VAT |
| Brightline Ops | Left sidebar tax invoice | Sold to | GST | Balance payable |
| Harbor Tools | Monospace receipt | Sold / Ship to | Tax | Grand total |

Four Debits should get a PDF in `{drive.expenses_folder}` and an **Invoice** Drive link. Fill **VAT** / **Ref** from the invoice when present. Suggested formatted names (clean casing OK if close):

| Bank date | Counterparty (approx) | Debit | Ref (approx) | VAT (approx) | EML `From` | Expenses filename |
| --- | --- | ---: | --- | ---: | --- | --- |
| 2024-11-05 | Acme Cloud | 49.00 | INV-AC-1042 | 3.63 | `billing@acme-cloud.example` | `2024-11-05_Acme Cloud_49.00.pdf` (or equivalent) |
| 2024-11-08 | Northwind SaaS | 120.00 | NW-8891 | 20.00 | `invoices@northwind-saas.example` | `2024-11-08_Northwind SaaS_120.00.pdf` |
| 2024-11-12 | Brightline Ops | 75.50 | BL-2207 | (from invoice if stated) | `accounts@brightline-ops.example` | `2024-11-12_Brightline Ops_75.50.pdf` |
| 2024-11-19 | Harbor Tools | 32.99 | HT-5510 | (from invoice if stated) | `billing@harbor-tools.example` | `2024-11-19_Harbor Tools_32.99.pdf` |

- [ ] All four rows have non-empty **Invoice** hyperlinks to Drive PDFs under `{drive.expenses_folder}`
- [ ] Each **Invoice** cell’s visible label is the saved expenses **filename** (not the raw URL)
- [ ] **Invoice** column/cells use **Clip** text overflow (not Wrap)
- [ ] **Source** = `Email` on all four matched expense rows (EML fixtures; Unfiled left empty in the default run)
- [ ] **Ref** filled with invoice numbers where the fixture provides them
- [ ] **VAT** filled with tax amounts where the fixture provides them (leave blank only if the invoice has no tax line)
- [ ] PDFs came from expense EML attachments (not Gmail)
- [ ] Agent matched despite differing layouts / tax field names (VAT vs GST vs sales tax vs Tax)
- [ ] Each matched expense counterparty has an `Email matching` rule saved (sender / subject / attachment)
- [ ] `Counterparties` Email (and Phone / Registration / Address when present on the invoice) populated for matched expense vendors; agent reports if it updated changed values

## Matched revenue invoices (from `test-data/emails/sent/*.eml`)

Two Credits should get a PDF in `{drive.revenue_folder}` and an **Invoice** Drive link. Outbound fixtures are from **Demo Company Ltd** and use the **same** tax-invoice layout and field labels (unlike the varied expense fixtures): left navy accent, `TAX INVOICE`, `BILL TO`, line-item table, `VAT`, `Amount due`.

| Bank date | Counterparty (approx) | Credit | Ref | VAT | Sent EML | Revenue filename |
| --- | --- | ---: | --- | ---: | --- | --- |
| 2024-11-20 | Riverstone Consulting | 1800.00 | DC-2401 | 0.00 | `01-riverstone-dc-2401.eml` | `2024-11-20_Riverstone Consulting_1800.00.pdf` (or equivalent spelling) |
| 2024-11-22 | Pixelforge Studio | 950.00 | DC-2402 | 64.17 | `02-pixelforge-dc-2402.eml` | `2024-11-22_Pixelforge Studio_950.00.pdf` |

- [ ] Both revenue rows have **Invoice** hyperlinks to PDFs under `{drive.revenue_folder}` (not Expenses)
- [ ] **Source** = `Email` on both matched revenue rows
- [ ] **Ref** / **VAT** filled from the outbound invoices
- [ ] PDFs came from `emails/sent/` EML attachments (not Gmail Sent)
- [ ] Paying clients appear on `Counterparties` (seeded); contact fields updated from invoice Bill To when available (`ap@riverstone-consulting.example`, `finance@pixelforge.example`, phones, registration, addresses)
- [ ] Agent reports if Counterparties contact values were updated

## Unmatched / skipped

- [ ] **Credit** row (Client Payment / Acme / 2500.00): no revenue fixture; **Invoice** blank; **Source** blank; listed among unmatched credits
- [ ] **Bank service fee** Debit (12.00): skipped / still missing invoice; **Source** blank
- [ ] **Staples** Debit (64.20): no EML; still missing invoice; **Source** blank
- [ ] **City Rides** Debit (18.75): no EML; still missing invoice; **Source** blank
- [ ] Unmatched Debits listed in the report (Date, Counterparty, Debit) for fee + Staples + City Rides

## Report

- [ ] Operator report includes sheet link, credit/debit totals, that reference tabs were seeded, `{drive.expenses_folder}` and `{drive.revenue_folder}` folder links, four expense matches, two revenue matches (Source=`Email` for those matches), unmatched debits/credits as above, any Counterparties contact updates, and confirmation that Gmail was not used
