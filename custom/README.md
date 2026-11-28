# Custom overlays

Operator customizations for **Customizable** mode live here. Stock `skills/`, `rules/`, and `routines/` stay untouched so public source updates can merge cleanly.

| Folder | Use |
| --- | --- |
| `skills/` | New skills, or extensions of stock skills |
| `rules/` | New rules, or extensions of stock rules |
| `routines/` | New or override Grok Bot routine instruction files |

## Path mirror

To extend a stock file, use the **same relative path** under this tree:

- Stock: `skills/bank-reconciliation/match-invoices.md`
- Custom: `custom/skills/bank-reconciliation/match-invoices.md`

Brand-new artifacts need no stock twin — place them only under the matching `custom/` subfolder.

## Merge (custom wins)

When running or obeying a skill, rule, or routine:

1. Load the stock file if it exists.
2. Load the mirrored `custom/` file if it exists and apply it **on top** — custom instructions win on conflict.
3. If only custom exists, use custom alone.

Never copy custom content back into stock trees.

## Auto-save

When `{custom.auto_save_new}` is true (default), creating a **new** file under `custom/skills/`, `custom/rules/`, or `custom/routines/` must be saved to the private repo (see `rules/custom-source-of-truth.md` and `rules/sync-to-repo.md`).
