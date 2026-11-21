#!/usr/bin/env python3
"""Fetch the locked aggregate docs.json into docs/.cache/docs.json."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from shutil import which

REPO_ROOT = Path(__file__).resolve().parents[1]
LOCK_PATH = REPO_ROOT / "docs" / "docs-nav.lock.json"
CACHE_DIR = REPO_ROOT / "docs" / ".cache"
CACHE_PATH = CACHE_DIR / "docs.json"


def load_lock() -> dict:
    if not LOCK_PATH.is_file():
        raise SystemExit(f"Lockfile not found: {LOCK_PATH}")
    data = json.loads(LOCK_PATH.read_text(encoding="utf-8"))
    for key in ("repo", "sha", "path"):
        if not data.get(key):
            raise SystemExit(f"Lockfile missing required field: {key}")
    return data


def write_lock(data: dict) -> None:
    LOCK_PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def github_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github.raw",
        "User-Agent": "agents-done-right-skills-fetch-docs-nav",
    }
    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def http_get(url: str, headers: dict[str, str] | None = None) -> bytes:
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.read()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code} fetching {url}: {body[:500]}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"Network error fetching {url}: {exc}") from exc


def gh_available() -> bool:
    return which("gh") is not None


def gh_api(endpoint: str, *, raw: bool = False) -> bytes:
    """Call `gh api` so private repos use the logged-in GitHub CLI credentials."""
    cmd = ["gh", "api", endpoint]
    if raw:
        cmd.extend(["-H", "Accept: application/vnd.github.raw"])
    try:
        proc = subprocess.run(cmd, check=True, capture_output=True)
    except FileNotFoundError as exc:
        raise SystemExit("gh CLI not found; install GitHub CLI or set GH_TOKEN") from exc
    except subprocess.CalledProcessError as exc:
        err = (exc.stderr or b"").decode("utf-8", errors="replace")
        raise SystemExit(f"gh api {endpoint} failed: {err[:500]}") from exc
    return proc.stdout


def default_branch_sha(repo: str) -> str:
    """Resolve default-branch HEAD commit SHA for repo (owner/name)."""
    if gh_available():
        meta = json.loads(gh_api(f"repos/{repo}"))
        branch = meta.get("default_branch") or "main"
        commit = json.loads(gh_api(f"repos/{repo}/commits/{branch}"))
    else:
        meta = json.loads(http_get(f"https://api.github.com/repos/{repo}", github_headers()).decode("utf-8"))
        branch = meta.get("default_branch") or "main"
        commit = json.loads(
            http_get(
                f"https://api.github.com/repos/{repo}/commits/{branch}",
                github_headers(),
            ).decode("utf-8")
        )
    sha = commit.get("sha")
    if not sha:
        raise SystemExit(f"Could not resolve HEAD sha for {repo}@{branch}")
    return sha


def fetch_file(repo: str, path: str, sha: str) -> bytes:
    endpoint = f"repos/{repo}/contents/{path}?ref={sha}"
    if gh_available():
        return gh_api(endpoint, raw=True)

    # Contents API (GH_TOKEN / GITHUB_TOKEN for private repos); Accept raw returns body.
    api_url = f"https://api.github.com/{endpoint}"
    headers = github_headers()
    try:
        return http_get(api_url, headers)
    except SystemExit as api_exc:
        raw_url = f"https://raw.githubusercontent.com/{repo}/{sha}/{path}"
        raw_headers = {"User-Agent": headers["User-Agent"]}
        try:
            return http_get(raw_url, raw_headers)
        except SystemExit:
            raise api_exc from None


def refresh_lock() -> dict:
    lock = load_lock()
    new_sha = default_branch_sha(lock["repo"])
    lock["sha"] = new_sha
    write_lock(lock)
    print(f"Updated lock sha → {new_sha}")
    return lock


def fetch(lock: dict | None = None) -> Path:
    lock = lock or load_lock()
    content = fetch_file(lock["repo"], lock["path"], lock["sha"])
    try:
        parsed = json.loads(content.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Fetched content is not valid JSON: {exc}") from exc
    if "navigation" not in parsed:
        raise SystemExit("Fetched docs.json has no top-level 'navigation' key")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(parsed, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {CACHE_PATH} from {lock['repo']}@{lock['sha'][:12]}:{lock['path']}")
    return CACHE_PATH


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--refresh-lock",
        action="store_true",
        help="Set lock sha to docs repo default-branch HEAD, then fetch",
    )
    args = parser.parse_args(argv)

    lock = refresh_lock() if args.refresh_lock else load_lock()
    fetch(lock)
    return 0


if __name__ == "__main__":
    sys.exit(main())
