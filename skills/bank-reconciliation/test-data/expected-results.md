# Bank reconciliation test mode — expected results

Use this checklist after a **test mode** run (statement month **November 2024** / `YYYYMM=202411`). Report pass/fail for each item.

## Setup

- [ ] Statement month is November 2024 (`2024` / `Y202411`), not “last month”
- [ ] Fixture CSV was copied to Drive Extracts for that month (not a live bank export)
- [ ] First-month sheet came from the skill `.xlsx` template (uploaded + converted), not a blank spreadsheet built from scratch
- [ ] Gmail was **not** searched or modified
- [ ] Invoice addressee checks used **Demo Company Ltd** (not flagged solely vs `{company.name}`)

## Reconciliation grid

Fixture CSV has **6** rows. Totals from signed `Amount` (negative = out):

| Direction | Total |
| --- | ---: |
| Credit (in) | 2500.00 |
| Debit (out) | 289.49 |

- [ ] Transactions tab has **6** data rows (one per CSV row)
- [ ] `SUM(Credit)` = **2500.00**
- [ ] `SUM(Debit)` = **289.49**
- [ ] Dates display as `d-mmm` (e.g. `5-Nov`)
- [ ] Every Bank row has a non-empty **Category** (exact spellings may vary)
- [ ] Imported raw CSV columns (typically H onward) are **hidden**; reconciliation columns A–G stay visible

## Reference tabs (seeded same run)

After filling Bank, the agent must seed these tabs in the **same run**. Do **not** require fixed category names — assert structure and consistency with Bank / the fixture merchants:

- [ ] `Categories` has data rows (not header-only); every Category used on Bank appears there
- [ ] `Counterparties` lists each distinct Bank `Recipient / Payer` (6 names; casing may vary, e.g. Acme Cloud)
- [ ] `Counterparty-Match` has a row per those names; `Match` loosely matches the fixture merchants: `ACME CLOUD *SUB`, `NORTHWIND SAAS`, `CLIENT PAYMENT ACME`, `BRIGHTLINE OPS`, `BANK SERVICE FEE`, `HARBOR TOOLS`
- [ ] `Counterparty-Category` maps each Counterparties name to the Category used on that Bank row

## Matched invoices (from `test-data/emails/`)

The four PDFs use **different layouts and field labels** on purpose (so matching is not template-identical):

| Vendor | Layout sketch | Customer label | Tax label | Total label |
| --- | --- | --- | --- | --- |
| Acme Cloud | US SaaS header band | Bill to | Sales tax | Amount due |
| Northwind SaaS | UK centred letterhead | Invoice to | VAT | Total incl. VAT |
| Brightline Ops | Left sidebar tax invoice | Sold to | GST | Balance payable |
| Harbor Tools | Monospace receipt | Sold / Ship to | Tax | Grand total |

Four Debits should get a PDF in `{drive.expenses_folder}` and an **Invoice** Drive link. Suggested formatted names (clean casing OK if close):

| Bank date | Recipient / Payer (approx) | Debit | EML `From` | Expenses filename |
| --- | --- | ---: | --- | --- |
| 2024-11-05 | Acme Cloud | 49.00 | `billing@acme-cloud.example` | `2024-11-05_Acme Cloud_49.00.pdf` (or equivalent counterparty spelling) |
| 2024-11-08 | Northwind SaaS | 120.00 | `invoices@northwind-saas.example` | `2024-11-08_Northwind SaaS_120.00.pdf` |
| 2024-11-12 | Brightline Ops | 75.50 | `accounts@brightline-ops.example` | `2024-11-12_Brightline Ops_75.50.pdf` |
| 2024-11-19 | Harbor Tools | 32.99 | `billing@harbor-tools.example` | `2024-11-19_Harbor Tools_32.99.pdf` |

- [ ] All four rows have non-empty **Invoice** hyperlinks to Drive PDFs
- [ ] Each **Invoice** cell’s visible label is the saved expenses **filename** (not the raw URL)
- [ ] **Invoice** column/cells use **Clip** text overflow (not Wrap)
- [ ] Transactions header for that column is **Invoice** (not `Ref`)
- [ ] PDFs came from EML attachments (not Gmail)
- [ ] Agent matched despite differing layouts / tax field names (VAT vs GST vs sales tax vs Tax)
- [ ] Each matched counterparty has an `Email matching` rule saved (sender / subject / attachment)

## Unmatched / skipped

- [ ] **Credit** row (Client Payment / 2500.00): no invoice required; **Invoice** blank
- [ ] **Bank service fee** Debit (12.00): skipped / still missing invoice; listed in unmatched report

## Report

- [ ] Operator report includes sheet link, credit/debit totals, that reference tabs were seeded, expenses folder link, four matches, fee as unmatched, and confirmation that Gmail was not used
