# Manual sample invoices (chat drop)

These PDFs match bank rows that stay **missing** after Phase 1 email matching (they are **not** in the fixture inbox/sent EMLs).

Use them in the guided demo after **Reconcile Bank Statement Test**: download → drop into the agent chat → ask the agent to match the attached invoices (`Source = Manual`).

Each file uses a **different layout and field set** on purpose (retail tax invoice, trip receipt, professional outbound invoice) so matching has to read amount / counterparty / ref / date from varied documents.

| File | Bank row | Amount | Layout |
| --- | --- | --- | --- |
| `20241121_Staples_ST-4821.pdf` | Staples Office Supply (2024-11-21) | $64.20 | Retail tax invoice — SKU line items, PO, sales tax |
| `20241125_City_Rides_CR-7721.pdf` | City Rides (2024-11-25) | $18.75 | Trip receipt — trip ID, fare breakdown, merchant descriptor |
| `20241110_Acme_DC-2404.pdf` | Client Payment Acme (2024-11-10) | $2,500.00 | Demo Ltd outbound — services table, wire remittance notes |

Public download (raw):

`https://github.com/agentsdoneright/grokbot-agents-done-right-skills/raw/main/skills/bank-reconciliation/test-data/manual-invoices/<filename>`
