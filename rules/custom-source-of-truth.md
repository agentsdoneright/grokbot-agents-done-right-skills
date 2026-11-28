---
version: 1.0.0
---
# Custom source of truth and auto-save

Applies when `repo.setup` is `customizable`, or whenever writing under `custom/`.

## Source of truth

Operator-created and operator-extended **skills**, **rules**, and **routines** live only under [`custom/`](../custom/):

- `custom/skills/` — mirror stock paths when extending (e.g. `custom/skills/bank-reconciliation/match-invoices.md`)
- `custom/rules/` — same for rules
- `custom/routines/` — new or override routine instruction files

**Never** create or edit customizations under stock `skills/`, `rules/`, or `routines/`. At run time, load stock (if any) then custom; **custom always wins** on conflict.

## Auto-save new custom artifacts

Read `{custom.auto_save_new}` from `config/profile.yaml`. If the key is missing, treat it as **true**.

When the agent **creates a new** file under `custom/skills/`, `custom/rules/`, or `custom/routines/`:

1. If `{custom.auto_save_new}` is **true**: after the create is complete, **must** save to the private repo via [`sync-to-repo.md`](sync-to-repo.md) (suggest a short save message, confirm with the operator, then commit and push `custom/**`). Do not leave a brand-new custom artifact unsaved when this flag is true.
2. If **false**: still write under `custom/`; offer save later per sync-to-repo when the editing round looks done — do not force an immediate save.

Edits to an **existing** custom file follow the normal sync-to-repo “recommend when finished” flow unless the operator asks to save now.

## Config command

The operator may change the flag in plain language (e.g. “turn off auto-save for new custom skills” / “set custom.auto_save_new to false”). Update `config/profile.yaml` only. Confirm in one short line. **Never** commit `config/profile.yaml`.
