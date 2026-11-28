# GrokBot skills

Skills and rules for running Grok Bot with Google Drive / Sheets / Gmail bookkeeping workflows.

**Project version:** `1.0.0` (see `config/product.yaml` and `CHANGELOG.md`).

Public repo: https://github.com/agentsdoneright/grokbot-agents-done-right-skills

## License

Operational use (running and customizing these skills for your own
bookkeeping / agent workflows) is allowed under the
[AccessLogic OU Source License](LICENSE). Educational institutes,
educators, and influencers may **not** reuse this material for courses,
training, workshops, or promotions without prior written permission from
AccessLogic OU. Authorized educational/promotional use must name this
project, link [https://agentsdoneright.com](https://agentsdoneright.com),
and state that the material came from this project.

## Start here

> [!NOTE]
> If you feel unsure about running the following bootstrap process, ask your agent the following to verify what will happen (do not run bootstrap yet):

> Advise me what will happen if you follow the public skills repo bootstrap: `AGENTS.md` from `https://github.com/agentsdoneright/grokbot-agents-done-right-skills`. DO NOT RUN the bootstrap. Only advise me what the side effects will be.

If you are still unsure or uncertain about the effects of this tutorial, the safest approach is to use a **new Google account** (Drive and Sheets for setup; Gmail only later if you run live invoice/email skills — the sample demo does not need Gmail) dedicated to the tutorial, instead of your primary work or personal account. Optionally create a **new GitHub account** as well if you plan to customize skills (Customizable / private copy) so that work stays separate from your main GitHub identity.

## Bootstrap

Paste this into a new Grok Bot chat:

> Follow the public skills repo bootstrap: read `AGENTS.md` from `https://github.com/agentsdoneright/grokbot-agents-done-right-skills`, then lead me through Quick start setup. Do not invent profile values.

What happens next (the agent should explain this in plain language and use **buttons** for choices):

1. It asks your **company name** (and first name if needed).
2. It offers **recommended settings** in one click (Drive folder `/Agents Done Right`, a simple activity log, local scratch folder). You can change something only if you want to.
3. It asks **Yes, set this up** / **Not now** before doing anything lasting.
4. Only after **Yes**: it downloads the skills pack if needed, saves a small settings file, creates a scratch folder, checks Google Drive / Sheets, and creates Accounts and Logs folders on Drive. Gmail is requested later only if you run a live skill that searches email.
5. When setup is done, it offers an optional **sample bookkeeping demo** (buttons: show me / skip). If you **skip**, the agent lists the two main live prompts (below) and points you at [`skills/README.md`](skills/README.md) for the full skill list.

Later if you want to customize a skill, the agent can run the **Customizable** upgrade. That creates a private GitHub copy and a `custom/` folder for your overrides (stock skills stay shared). New custom skills, rules, and routines are saved automatically unless you turn that off. 

## Live bookkeeping prompts

After Quick start (including when you skip the sample demo), ask in chat — two main entry points:

**Reconcile** (Import → Categorise → Match → Find Unpaid):

> Run Reconcile Bank Statement

> Reconcile my bank statement for November

**After manual sheet edits** (Apply spreadsheet updates):

> I have updated the categories

> I have updated the spreadsheet

Full skill list (including sub-skills) → [`skills/README.md`](skills/README.md). Standing rules → [`rules/README.md`](rules/README.md).

## Try with test data

After Quick start finishes, the agent **offers to guide** you through a short bookkeeping demonstration using these **two** prompts. You can also paste them yourself **in order** (each stages sample data then runs the matching live skills). Do not use your live inbox CSV for these. Reconcile Bank Statement Test includes Find Unpaid Invoices (and the unpaid sample emails).

> Run Reconcile Bank Statement Test

> Run Update Bank Statement Test

After the first test, the guided demo can optionally walk you through downloading sample **missing** invoices (Staples, City Rides, Acme) from `skills/bank-reconciliation/test-data/manual-invoices/` on this repo and dropping them into chat to practice a manual attach.

Compare results to `skills/bookkeeping-test/expected-results.md`.

## Clean up the workspace

> [!WARNING]
> This permanently deletes the workspace checkout and all associated skills and rules. You will lose local copies of those files (including any unsaved customizations). Only use it if you intend to remove everything.

To remove the Quick start checkout and associated skills/rules from the Grok Bot workspace, paste:

> Delete the workspace `/workspace/grokbot-agents-done-right-skills` and all associated skills, rules and routines.
