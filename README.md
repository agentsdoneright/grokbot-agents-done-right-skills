# GrokBot skills

Skills and rules for running Grok Bot with Google Drive / Sheets / Gmail bookkeeping workflows.

Public repo: https://github.com/agentsdoneright/grokbot-agents-done-right-skills

## Start here

Paste this into a new Grok Bot chat:

> Follow the public skills repo bootstrap: read `AGENTS.md` from `https://github.com/agentsdoneright/grokbot-agents-done-right-skills`, then lead me through Quick start setup. Do not invent profile values.

The agent will clone the public skills repo, create your profile, confirm Grok Bot can access your **Google Drive**, **Sheets**, and **Gmail**, and verify that everything is set up correctly. The profile is just a configuration file that the skill will need later on in order to run. Running this Quick start will not cause any skills to run or write external actions beyond those harmless connector checks. The agent will always ask for your permission. 

If you feel unsure about running the bootstrap process, then you can simply ask your agent the following to verify what will happen:

> Advise me what will happen if you follow the public skills repo bootstrap: `AGENTS.md` from `https://github.com/agentsdoneright/grokbot-agents-done-right-skills`. DO NOT RUN the bootstrap. Only advise me what the side effects will be.

Later if you decide that you want to customize a skill for your own purposes, the agent can walk you through the optional **Customizable** upgrade (private GitHub copy) so changes are versioned and saved.

## Clean up the workspace

To remove the Quick start checkout and associated skills/rules from the Grok Bot workspace, paste:

> Delete the workspace `/workspace/agrokbot-agents-done-right-skills` and all associated skills and rules
