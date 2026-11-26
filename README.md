# GrokBot skills

Skills and rules for running Grok Bot with Google Drive / Sheets / Gmail bookkeeping workflows.

**Project version:** `1.0.0` (see `config/product.yaml` and `CHANGELOG.md`).

Public repo: https://github.com/agentsdoneright/grokbot-agents-done-right-skills

## Start here

> [!NOTE]
> If you feel unsure about running the following bootstrap process, ask your agent the following to verify what will happen (do not run bootstrap yet):
>

> Advise me what will happen if you follow the public skills repo bootstrap: `AGENTS.md` from `https://github.com/agentsdoneright/grokbot-agents-done-right-skills`. DO NOT RUN the bootstrap. Only advise me what the side effects will be.

If you are still unsure or uncertain about the effects of this tutorial, the safest approach is to use a **new Google account** (Drive, Sheets, and Gmail) dedicated to the tutorial, instead of your primary work or personal account. Optionally create a **new GitHub account** as well if you plan to customize skills (Customizable / private copy) so that work stays separate from your main GitHub identity.

## Bootstrap

Paste this into a new Grok Bot chat:

> Follow the public skills repo bootstrap: read `AGENTS.md` from `https://github.com/agentsdoneright/grokbot-agents-done-right-skills`, then lead me through Quick start setup. Do not invent profile values.

What happens next (the agent should explain this in plain language and use **buttons** for choices):

1. It asks your **company name** (and first name if needed).
2. It offers **recommended settings** in one click (Drive folder `/Agents Done Right`, a simple activity log, local scratch folder). You can change something only if you want to.
3. It asks **Yes, set this up** / **Not now** before doing anything lasting.
4. Only after **Yes**: it downloads the skills pack if needed, saves a small settings file, creates a scratch folder, checks Google Drive / Sheets / Gmail, and creates Accounts and Logs folders on Drive.
5. When setup is done, it offers an optional **sample bookkeeping demo** (buttons: show me / skip).

This repo is **not** standing bookkeeping identity for every chat — skills and your company settings load only when you ask for Quick start or to run/customize a skill. The bootstrap paste alone is **not** permission to change files or probe Google.

Later if you want to customize a skill, the agent can run the **Customizable** upgrade via the `private-repo-copy` skill: either **automatically** (if you grant GitHub `repo` + `workflow` permissions through `gh`) or **manually** using the GitHub account setup docs URL in `config/product.yaml` (`docs.github_account_setup`). That creates a private GitHub copy so changes are versioned and saved. Public repo identity also lives in `config/product.yaml` (`github.public_skills_repo_*`).

## Live bookkeeping prompts

After Quick start, paste one of these when you want a real month (not fixtures):

> Run Reconcile Bank Statement

> Run Find Unpaid Invoices

## Try with test data

After Quick start finishes, the agent **offers to guide** you through a short bookkeeping demonstration using these three prompts. You can also paste them yourself **in order** (each stages sample data then runs the matching live skills). Do not use your live inbox CSV for these.

> Run Reconcile Bank Statement Test

> Run Find Unpaid Invoices Test

> Run Update Bank Statement Test

After the first test, the guided demo can optionally walk you through downloading sample **missing** invoices (Staples, City Rides, Acme) from `skills/bank-reconciliation/test-data/manual-invoices/` on this repo and dropping them into chat to practice a manual attach.

Compare results to `skills/bookkeeping-test/expected-results.md`.

## Clean up the workspace

> [!WARNING]
> This permanently deletes the workspace checkout and all associated skills and rules. You will lose local copies of those files (including any unsaved customizations). Only use it if you intend to remove everything.

To remove the Quick start checkout and associated skills/rules from the Grok Bot workspace, paste:

> Delete the workspace `/workspace/grokbot-agents-done-right-skills` and all associated skills and rules
