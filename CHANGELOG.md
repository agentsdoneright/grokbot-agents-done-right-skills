# Changelog

All notable changes to this skills bundle are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Project version lives in `config/product.yaml`. Each skill has its own `version`
in frontmatter (and the same value at the start of its `description`).

## [Unreleased]

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
