# Changelog

All notable changes to this skills bundle are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Project version lives in `config/product.yaml`. Each skill has its own `version`
in frontmatter (and the same value at the start of its `description`).

## [Unreleased]

### Custom overlays (Customizable)

- Workspace `custom/{skills,rules,routines}/` is the source of truth for
  operator-created and extended skills, rules, and routines (mirrored paths;
  custom wins over stock). Stock trees stay untouched.
- Profile `custom.auto_save_new` (default true): new files under `custom/` must
  be saved to the private repo. Operator can change the flag in plain language.
- New rule: `rules/custom-source-of-truth.md`. Private repo copy (1.1.0)
  creates `custom/` after verify. Sync-to-repo (1.1.0) and repo-update-check
  (1.1.0) protect/save `custom/`.

### Apply spreadsheet updates (1.1.1)

- Renamed **Sync spreadsheet mappings** → **Apply spreadsheet updates**
  (`apply-spreadsheet-updates.md`).
- Missing Expense / Missing Revenue checkboxes are passive. On apply: **No
  Invoice Needed** → Bank Notes `No invoice needed (operator)`; **Personal
  Expense** → Bank Category `Personal Expense` **and** the same Notes phrase
  (personal never needs an invoice). Does **not** auto-update Categories
  Invoice Required.
- Removed `personal-expense-checkbox.gs` and `no-invoice-needed-checkbox.gs`;
  bound project is `summary-on-edit.gs` + `unpaid-checkbox-dates.gs` only.

### Match invoices (1.2.1)

- Personal / Personal Expense Bank rows are **always** no-invoice-needed: never
  list as missing, never light-red highlight, even if Categories.Invoice
  Required is still true. Also honour Notes phrase and bank-fee fallbacks.

### Import bank CSV (1.2.1) / Find Unpaid Invoices (1.6.2) / Categorise (1.0.2)

- Script install/ensure steps updated for the two-file Apps Script set.

### Repo update check (1.0.0)

- New skill: fetch public `CHANGELOG.md`, ask before upgrading the whole repo
  source tree, and ask how to merge customized skills. Quick start creates a
  daily Grok Bot routine that runs this skill.

## [1.0.0] - 2026-11-22

Initial versioned release of the public skills bundle.

### Bank reconciliation (1.0.0)

- Initial versioned skill: monthly Google Sheets bank reconciliation, Drive /
  Gmail invoice matching, and test-mode fixtures.

### Private repo copy (1.0.0)

- Initial versioned skill: Customizable upgrade to a private standalone GitHub
  copy of the public skills repo (automatic via `gh` or manual docs path).
