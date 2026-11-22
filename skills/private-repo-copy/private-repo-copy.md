---
name: Private repo copy
version: 1.0.0
description: >-
  Version 1.0.0. Use when the operator wants Customizable mode: a private,
  standalone (not a fork) GitHub copy of the public skills repo under the same
  name, so skill edits are versioned and pushed there. Offers automatic setup via
  gh (repo + workflow scopes) or a manual docs path. See Customizable upgrade in
  AGENTS.md.
---
# Private copy of {github.public_skills_repo_name}

Read [`config/product.yaml`](../../config/product.yaml) for `{docs.*}` / `{github.*}` and [`config/profile.yaml`](../../config/profile.yaml) for `{workspace.local_path}` and repo fields. Do not invent URLs.

> **When to use:** the operator wants Customizable mode: their own private GitHub copy of `{github.public_skills_repo_owner}/{github.public_skills_repo_name}` under the same name (not a fork), so skill edits are versioned and pushed there. See the Customizable upgrade section of `AGENTS.md`.

Creates a private, standalone (not a fork) copy of `{github.public_skills_repo_url}` under the user's GitHub account, **keeping the same repo name** `{github.public_skills_repo_name}`, and points the local checkout at it so the repo's `rules/sync-to-repo.md` pushes go there.

Manual alternative (always offer it): `{docs.github_account_setup}` (older pages may name `agents-done-right-skills`; use `{github.public_skills_repo_owner}/{github.public_skills_repo_name}`).

## 0. Preconditions
- Quick start is done: a local checkout of the public repo exists with `config/profile.yaml` (see the repo's `AGENTS.md`). Find its path; if none, run Quick start first.
- The user has a GitHub account. If not, they create one themselves at github.com (free plan); point them to `{docs.github_account_setup}`.

## 1. Explain and ask about permissions (required gate)
Before anything else, tell the user plainly:
- Doing this automatically needs your computer signed in to GitHub via GitHub's device sign-in (`gh auth login`), granting the **`repo`** permission (create a private repo, push) and the **`workflow`** permission (the repo contains `.github/workflows/` files, which GitHub refuses to push without it).
- In Customizable mode, every later skill/rule change is committed and pushed to their private repo automatically.
- **If they do not want to grant these permissions, they can do the steps manually** by following the GitHub account setup documentation: `{docs.github_account_setup}`. (Manual route: fork, Settings > Danger Zone > Leave fork network, then Change visibility > Make private. Afterwards give the repo URL so the local checkout can be retargeted; pushing later still needs some GitHub credential on the box.)

Ask with a widget: automatic (grant permissions) vs. manual (send the doc link). If manual, send `{docs.github_account_setup}`, offer to retarget the checkout once they share their private repo URL, and stop.

## 2. Sign in (automatic route)
1. `gh auth status`. If already logged in with `repo` and `workflow` scopes as the right account, skip ahead.
2. Otherwise run in the background and read the code from the log:
   `BROWSER=false gh auth login --hostname github.com --git-protocol https --web --scopes repo,workflow > {workspace.local_path}/gh-login.log 2>&1 &`
   (If already logged in but missing a scope: `gh auth refresh -h github.com -s workflow`.)
3. Send the user the one-time code and the link `{github.device_login}`; ask them to approve while signed in to the intended account, and tell you when done.
4. Verify with `gh auth status` (account + scopes). Run `gh auth setup-git`.
5. Confirm the account with the user if there's any doubt about which one is signed in.

## 3. Check for a name clash
`gh repo view <login>/{github.public_skills_repo_name}`. If it already exists (e.g. an earlier fork), stop and tell the user: the same name can't be reused until that repo is deleted or renamed. Let them delete or rename it themselves (deleting needs the `delete_repo` permission; do not request it unless they ask you to delete it). If it exists and is already private and not a fork, ask whether to just use it.

## 4. Create the private repo and push
In the local checkout (working tree clean):
```
gh repo create <login>/{github.public_skills_repo_name} --private --description "Private copy of {github.public_skills_repo_owner}/{github.public_skills_repo_name}"
git push https://github.com/<login>/{github.public_skills_repo_name}.git main:main
```
If the push is rejected for workflow scope, go back to step 2.3 with `gh auth refresh -s workflow`.

## 5. Retarget remotes
```
git remote rename origin upstream
git remote add origin https://github.com/<login>/{github.public_skills_repo_name}.git
git fetch origin && git branch -u origin/main main
git remote set-url --push upstream no_push   # keep public repo fetch-only
```

## 6. Verify (required before setting Customizable)
- `gh repo view <login>/{github.public_skills_repo_name} --json visibility,isFork` shows `PRIVATE` and `isFork: false`.
- `git push --dry-run origin main` succeeds.
- `config/profile.yaml` and `{workspace.local_path}/` are still gitignored (`git status` doesn't list them).

## 7. Update profile
In `config/profile.yaml` (never commit it): set `repo.url` to `https://github.com/<login>/{github.public_skills_repo_name}` (this becomes `{repo.url}`), keep `repo.branch: main`, set `repo.setup: customizable`.

## 8. Report
Tell the user: repo link, that it's private and standalone, pushes to the public repo are blocked, and that skill edits will now be committed and pushed to their private repo automatically. If anything was too hard, it's fine to stay on Quick start and retry later.

## Rules
- Never delete, rename, or change visibility of a repo without the user's explicit yes for that specific action.
- Never push to the public upstream.
- Never commit `config/profile.yaml`.
- Never put the GitHub token in chat.
