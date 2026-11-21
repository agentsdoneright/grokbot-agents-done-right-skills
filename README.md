# GrokBot skills

Skills and rules for running Grok Bot with Google Drive / Sheets / Gmail bookkeeping workflows.

Public repo: https://github.com/agentsdoneright/grokbot-agents-done-right-skills

## Start here

Paste this into a new Grok Bot chat:

> Follow the public skills repo bootstrap: read `AGENTS.md` from `https://github.com/agentsdoneright/grokbot-agents-done-right-skills`, then lead me through Quick start setup. Do not invent profile values.

Per `AGENTS.md`, this repo is **not** standing bookkeeping identity for every chat. Skills and the company profile load only when you ask for Quick start or to run/customize a skill. The agent must **summarize** Quick start side effects (clone, profile write, `tutorial-workspace/`, Google Drive / Sheets / Gmail connector checks) and **wait for your explicit yes** before doing any of them. The profile is a local config file skills need later. Asking for company name / Drive root is fine before that yes; cloning, writing files, and probing Google are not.

If you feel unsure about running the bootstrap process, then you can simply ask your agent the following to verify what will happen:

> Advise me what will happen if you follow the public skills repo bootstrap: `AGENTS.md` from `https://github.com/agentsdoneright/grokbot-agents-done-right-skills`. DO NOT RUN the bootstrap. Only advise me what the side effects will be.

Later if you decide that you want to customize a skill for your own purposes, the agent can walk you through the optional **Customizable** upgrade (private GitHub copy) so changes are versioned and saved. Use the public repo name `grokbot-agents-done-right-skills` when cloning or forking (older Mintlify pages may still say `agents-done-right-skills`).

## Clean up the workspace

To remove the Quick start checkout and associated skills/rules from the Grok Bot workspace, paste:

> Delete the workspace `/workspace/grokbot-agents-done-right-skills` and all associated skills and rules
