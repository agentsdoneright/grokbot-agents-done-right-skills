# Sync rules and skills at the start of every chat

At the start of every new chat, before doing any other work:

1. Read `config/profile.yaml` (see `AGENTS.md`). Use `repo.url` and `repo.branch` from that file.
2. Read the latest files in `rules/` and `skills/` on that branch of that repo and follow them.
3. If a skill there differs from the bot's local copy, update the local copy to match.

Do not hardcode a GitHub owner or repo name — always take them from the profile.
