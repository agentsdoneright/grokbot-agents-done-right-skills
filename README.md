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

Per `AGENTS.md`, this repo is **not** standing bookkeeping identity for every chat. Skills and the company profile load only when you ask for Quick start or to run/customize a skill. The agent must **summarize** Quick start side effects (clone, profile write, `tutorial-workspace/`, Google Drive / Sheets / Gmail connector checks) and **wait for your explicit yes** before doing any of them. The profile is a local config file skills need later. Asking for company name / Drive root is fine before that yes; cloning, writing files, and probing Google are not.


Later if you decide that you want to customize a skill for your own purposes, the agent can run the **Customizable** upgrade via the `private-repo-copy` skill: either **automatically** (if you grant GitHub `repo` + `workflow` permissions through `gh`) or **manually** using the GitHub account setup docs URL in `config/product.yaml` (`docs.github_account_setup`). That creates a private GitHub copy so changes are versioned and saved. Public repo identity also lives in `config/product.yaml` (`github.public_skills_repo_*`).

## Clean up the workspace

To remove the Quick start checkout and associated skills/rules from the Grok Bot workspace, paste:

> Delete the workspace `/workspace/grokbot-agents-done-right-skills` and all associated skills and rules
