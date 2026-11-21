#!/usr/bin/env python3
"""Validate (and optionally fix) docs links in docs/**/*.mdx."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

_SCRIPTS_DIR = Path(__file__).resolve().parent
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

import fetch_docs_nav as nav  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = REPO_ROOT / "docs"
CACHE_PATH = DOCS_DIR / ".cache" / "docs.json"
TITLES_CACHE_PATH = DOCS_DIR / ".cache" / "titles.json"
LOCK_PATH = DOCS_DIR / "docs-nav.lock.json"
FETCH_SCRIPT = REPO_ROOT / "scripts" / "fetch_docs_nav.py"

FENCE = re.compile(r"^\s{0,3}(`{3,}|~{3,})")
# Markdown links: root-relative or relative (not http/mailto/#-only).
MD_LINK = re.compile(r"\[([^\]]+)\]\(\s*<?([^)\s>]+)>?")
MD_REF = re.compile(r"^\s{0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?", re.MULTILINE)
ATTR_HREF = re.compile(
    r"""\b(?:href|src|img|logo)=\{?\s*(["'`])([^"'`]+)\1""",
    re.IGNORECASE,
)
FRONTMATTER_TITLE = re.compile(
    r'(?m)^title:\s*(?:"([^"]*)"|\'([^\']*)\'|(\S+))\s*$'
)


@dataclass
class FoundLink:
    file: Path
    line: int
    href: str
    text: str | None
    kind: str  # "md" | "attr" | "ref"


@dataclass
class Issue:
    link: FoundLink
    resolved: str
    kind: str  # "broken_path" | "wrong_title"
    detail: str
    suggested_href: str | None = None
    suggested_title: str | None = None


def load_json(path: Path) -> dict:
    if not path.is_file():
        raise SystemExit(f"Missing file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_path(href: str) -> str:
    parts = urlsplit(href)
    path = parts.path or "/"
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    if not path.startswith("/"):
        path = "/" + path
    return path


def is_internal_href(href: str) -> bool:
    if not href or href.startswith("#"):
        return False
    lower = href.casefold()
    if lower.startswith(("http://", "https://", "mailto:", "tel:")):
        return False
    return True


def collect_nav_pages(node, out: set[str]) -> None:
    if isinstance(node, str):
        out.add(normalize_path("/" + node.lstrip("/")))
        return
    if isinstance(node, dict):
        if "pages" in node:
            collect_nav_pages(node["pages"], out)
        for key, value in node.items():
            if key == "pages":
                continue
            if key in ("groups", "tabs", "anchors", "products", "dropdowns"):
                collect_nav_pages(value, out)
            elif isinstance(value, (list, dict)):
                if isinstance(value, dict) and (
                    "pages" in value or "group" in value or "tab" in value
                ):
                    collect_nav_pages(value, out)
        return
    if isinstance(node, list):
        for item in node:
            collect_nav_pages(item, out)


def build_valid_paths(docs: dict) -> tuple[set[str], dict[str, str]]:
    pages: set[str] = set()
    navigation = docs.get("navigation") or {}
    collect_nav_pages(navigation, pages)

    redirects: dict[str, str] = {}
    for entry in docs.get("redirects") or []:
        source = normalize_path(entry.get("source", ""))
        dest = entry.get("destination", "")
        if not source or not dest:
            continue
        if dest.startswith("http://") or dest.startswith("https://"):
            redirects[source] = dest
        else:
            redirects[source] = normalize_path(dest)
    return pages, redirects


def resolve_with_redirects(
    path: str, pages: set[str], redirects: dict[str, str]
) -> tuple[bool, str]:
    if path in pages:
        return True, path
    if path in redirects:
        dest = redirects[path]
        if dest.startswith("http://") or dest.startswith("https://"):
            return True, dest
        if dest in pages:
            return True, dest
        return False, f"redirect {path} → {dest} (destination not in navigation)"
    return False, f"not in navigation or redirects: {path}"


def aggregate_page_path(mdx_file: Path, prefix: str) -> str:
    """Aggregate URL path for a local docs/*.mdx file (no leading slash)."""
    rel = mdx_file.relative_to(DOCS_DIR).with_suffix("")
    return f"{prefix.strip('/')}/{rel.as_posix()}"


def resolve_href(href: str, mdx_file: Path, prefix: str) -> str:
    """Resolve an internal href to an aggregate site path (/…)."""
    raw = href.strip()
    if raw.startswith("/"):
        path = normalize_path(raw)
        prefix_slash = f"/{prefix.strip('/')}/"
        if path == f"/{prefix.strip('/')}" or path.startswith(prefix_slash):
            return path
        # Same-source root-relative: /foo → /skills/foo
        return normalize_path(f"/{prefix.strip('/')}/{path.lstrip('/')}")

    # Relative to the aggregate page directory (multirepo does not rewrite these).
    page = aggregate_page_path(mdx_file, prefix)
    joined = os.path.normpath(str(Path(page).parent / raw))
    if joined == ".":
        joined = ""
    return normalize_path("/" + joined.replace("\\", "/"))


def relative_href_to(aggregate_target: str, mdx_file: Path, prefix: str) -> str:
    """Child-facing relative href from this MDX page to an aggregate path."""
    page = aggregate_page_path(mdx_file, prefix)
    start_dir = str(Path(page).parent)
    target = normalize_path(aggregate_target).lstrip("/")
    rel = os.path.relpath(target, start_dir).replace("\\", "/")
    if not rel.startswith("."):
        rel = "./" + rel
    return rel


def parse_frontmatter_title(text: str) -> str | None:
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end < 0:
        return None
    block = text[3:end]
    match = FRONTMATTER_TITLE.search(block)
    if not match:
        return None
    return next(g for g in match.groups() if g is not None)


def load_page_source(
    aggregate_path: str,
    prefix: str,
    lock: dict,
    source_cache: dict[str, str | None],
) -> str | None:
    path = normalize_path(aggregate_path)
    if path in source_cache:
        return source_cache[path]

    rel = path.lstrip("/")
    prefix = prefix.strip("/")
    body: str | None = None

    if rel.startswith(prefix + "/"):
        local = DOCS_DIR / f"{rel[len(prefix) + 1 :]}.mdx"
        if local.is_file():
            body = local.read_text(encoding="utf-8")
    if body is None:
        remote = f"{rel}.mdx"
        try:
            body = nav.fetch_file(lock["repo"], remote, lock["sha"]).decode("utf-8")
        except SystemExit:
            body = None

    source_cache[path] = body
    return body


def title_for_path(
    aggregate_path: str,
    prefix: str,
    lock: dict,
    source_cache: dict[str, str | None],
    titles: dict[str, str],
) -> str | None:
    path = normalize_path(aggregate_path)
    if path in titles:
        return titles[path]
    body = load_page_source(path, prefix, lock, source_cache)
    if not body:
        return None
    title = parse_frontmatter_title(body)
    if title:
        titles[path] = title
    return title


def build_title_index(
    pages: set[str],
    prefix: str,
    lock: dict,
) -> tuple[dict[str, str], set[str], dict[str, str | None]]:
    """Return (titles, pages_with_source, source_cache).

    Nav can list phantom paths (e.g. skills/github-account-setup with no MDX).
    Only pages whose source loads count as real.
    """
    titles: dict[str, str] = {}
    source_cache: dict[str, str | None] = {}
    real_pages: set[str] = set()
    for page in sorted(pages):
        body = load_page_source(page, prefix, lock, source_cache)
        if body is None:
            continue
        real_pages.add(page)
        title = parse_frontmatter_title(body)
        if title:
            titles[page] = title

    TITLES_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    TITLES_CACHE_PATH.write_text(json.dumps(titles, indent=2) + "\n", encoding="utf-8")
    return titles, real_pages, source_cache


def titles_by_label(titles: dict[str, str]) -> dict[str, list[str]]:
    by_label: dict[str, list[str]] = {}
    for path, title in titles.items():
        by_label.setdefault(title.casefold(), []).append(path)
    return by_label


def suggest_path_fix(
    link: FoundLink,
    prefix: str,
    pages: set[str],
    by_label: dict[str, list[str]],
) -> str | None:
    """Return a relative href that resolves on the aggregate site, or None."""
    slug = normalize_path(link.href).rsplit("/", 1)[-1]
    slug_hits = [p for p in pages if p.rsplit("/", 1)[-1] == slug]
    if len(slug_hits) == 1:
        return relative_href_to(slug_hits[0], link.file, prefix)

    if link.text:
        hits = by_label.get(link.text.casefold(), [])
        if len(hits) == 1:
            return relative_href_to(hits[0], link.file, prefix)
    return None


def iter_mdx_files() -> list[Path]:
    return sorted(p for p in DOCS_DIR.rglob("*.mdx") if ".cache" not in p.parts)


def outside_fences(lines: list[str]) -> list[tuple[int, str]]:
    fence: str | None = None
    out: list[tuple[int, str]] = []
    for i, line in enumerate(lines, start=1):
        marker = FENCE.match(line)
        if fence:
            if (
                marker
                and marker.group(1)[0] == fence[0]
                and len(marker.group(1)) >= len(fence)
            ):
                fence = None
            continue
        if marker:
            fence = marker.group(1)
            continue
        out.append((i, line))
    return out


def extract_links(path: Path) -> list[FoundLink]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    found: list[FoundLink] = []
    seen: set[tuple[int, str, str | None]] = set()

    def add(line_no: int, href: str, text_label: str | None, kind: str) -> None:
        if not is_internal_href(href):
            return
        key = (line_no, href, text_label)
        if key in seen:
            return
        seen.add(key)
        found.append(
            FoundLink(file=path, line=line_no, href=href, text=text_label, kind=kind)
        )

    for line_no, line in outside_fences(lines):
        for match in MD_LINK.finditer(line):
            add(line_no, match.group(2), match.group(1), "md")
        for match in ATTR_HREF.finditer(line):
            add(line_no, match.group(2), None, "attr")
        for match in MD_REF.finditer(line):
            add(line_no, match.group(1), None, "ref")

    return found


def ensure_cache(fetch: bool, refresh_lock: bool) -> None:
    if refresh_lock:
        subprocess.run(
            [sys.executable, str(FETCH_SCRIPT), "--refresh-lock"],
            check=True,
        )
        return
    if fetch or not CACHE_PATH.is_file():
        subprocess.run([sys.executable, str(FETCH_SCRIPT)], check=True)


def apply_fixes(issues: list[Issue]) -> list[str]:
    by_file: dict[Path, list[Issue]] = {}
    for issue in issues:
        if not issue.suggested_href and not issue.suggested_title:
            continue
        by_file.setdefault(issue.link.file, []).append(issue)

    changes: list[str] = []
    for path, file_issues in by_file.items():
        original = path.read_text(encoding="utf-8")
        text = original
        for issue in sorted(file_issues, key=lambda i: i.link.line, reverse=True):
            link = issue.link
            if link.kind != "md":
                if issue.suggested_href and link.href != issue.suggested_href:
                    if link.href in text:
                        text = text.replace(link.href, issue.suggested_href, 1)
                        changes.append(
                            f"{path.relative_to(REPO_ROOT)}:{link.line}: "
                            f"href {link.href} → {issue.suggested_href}"
                        )
                continue

            old_text = link.text or ""
            old_href = link.href
            new_text = issue.suggested_title if issue.suggested_title else old_text
            new_href = issue.suggested_href if issue.suggested_href else old_href
            if old_text == new_text and old_href == new_href:
                continue

            old_md = f"[{old_text}]({old_href})"
            new_md = f"[{new_text}]({new_href})"
            if old_md in text:
                text = text.replace(old_md, new_md, 1)
            else:
                pattern = re.compile(
                    re.escape(f"[{old_text}]")
                    + r"\(\s*<?"
                    + re.escape(old_href)
                    + r">?\s*\)"
                )
                text, n = pattern.subn(new_md, text, count=1)
                if n == 0:
                    changes.append(
                        f"{path.relative_to(REPO_ROOT)}:{link.line}: "
                        f"could not apply fix for {old_md}"
                    )
                    continue

            parts = []
            if old_href != new_href:
                parts.append(f"href {old_href} → {new_href}")
            if old_text != new_text:
                parts.append(f'title "{old_text}" → "{new_text}"')
            changes.append(
                f"{path.relative_to(REPO_ROOT)}:{link.line}: " + "; ".join(parts)
            )

        if text != original:
            path.write_text(text, encoding="utf-8")

    return changes


def collect_issues(
    prefix: str,
    pages: set[str],
    real_pages: set[str],
    redirects: dict[str, str],
    titles: dict[str, str],
    by_label: dict[str, list[str]],
    lock: dict,
    source_cache: dict[str, str | None],
) -> tuple[list[Issue], int]:
    issues: list[Issue] = []
    checked = 0

    for mdx in iter_mdx_files():
        for link in extract_links(mdx):
            checked += 1
            resolved = resolve_href(link.href, link.file, prefix)
            ok, detail = resolve_with_redirects(resolved, pages, redirects)
            canonical = detail if (ok and detail.startswith("/")) else resolved

            # Phantom nav entries (listed but no MDX) are not real targets.
            if ok and canonical.startswith("/") and canonical not in real_pages:
                ok = False
                detail = f"nav lists {canonical} but page source was not found"

            # Root-relative links to non-skills pages must be relative hrefs.
            if ok and link.href.startswith("/"):
                prefix_slash = f"/{prefix.strip('/')}/"
                if not (
                    canonical == f"/{prefix.strip('/')}"
                    or canonical.startswith(prefix_slash)
                ):
                    issues.append(
                        Issue(
                            link=link,
                            resolved=canonical,
                            kind="broken_path",
                            detail=(
                                "root-relative link to a non-skills page; "
                                "use a relative href so multirepo does not rewrite it"
                            ),
                            suggested_href=relative_href_to(
                                canonical, link.file, prefix
                            ),
                        )
                    )
                    continue

            if not ok:
                suggested = suggest_path_fix(link, prefix, real_pages, by_label)
                issues.append(
                    Issue(
                        link=link,
                        resolved=resolved,
                        kind="broken_path",
                        detail=detail,
                        suggested_href=suggested,
                    )
                )
                continue

            if link.kind != "md" or not link.text:
                continue
            title = titles.get(canonical) or title_for_path(
                canonical, prefix, lock, source_cache, titles
            )
            if not title:
                continue
            if link.text != title:
                issues.append(
                    Issue(
                        link=link,
                        resolved=canonical,
                        kind="wrong_title",
                        detail=f'title is "{title}", link text is "{link.text}"',
                        suggested_title=title,
                    )
                )

    return issues, checked


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--fetch",
        action="store_true",
        help="Refresh docs/.cache/docs.json from the lock before checking",
    )
    parser.add_argument(
        "--refresh-lock",
        action="store_true",
        help="Bump lock sha to docs default-branch HEAD, fetch, then check",
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Rewrite MDX link paths/titles when a unique fix is known",
    )
    args = parser.parse_args(argv)

    ensure_cache(fetch=args.fetch, refresh_lock=args.refresh_lock)

    docs = load_json(CACHE_PATH)
    lock = load_json(LOCK_PATH)
    prefix = lock.get("destination_prefix") or "skills"

    pages, redirects = build_valid_paths(docs)
    if not pages:
        raise SystemExit("No navigation pages found in cached docs.json")

    # Prefer lock from fetch module for repo/sha used when loading remote MDX.
    lock = nav.load_lock()
    prefix = lock.get("destination_prefix") or prefix

    titles, real_pages, source_cache = build_title_index(pages, prefix, lock)
    by_label = titles_by_label(titles)

    issues, checked = collect_issues(
        prefix,
        pages,
        real_pages,
        redirects,
        titles,
        by_label,
        lock,
        source_cache,
    )

    if args.fix and issues:
        changes = apply_fixes(issues)
        for row in changes:
            print(f"fixed: {row}")
        issues, checked = collect_issues(
            prefix,
            pages,
            real_pages,
            redirects,
            titles,
            by_label,
            lock,
            source_cache,
        )

    remaining_broken = [i for i in issues if i.kind == "broken_path"]
    remaining_titles = [i for i in issues if i.kind == "wrong_title"]

    if remaining_broken or remaining_titles:
        if remaining_broken:
            print(
                f"Broken docs links: {len(remaining_broken)} (checked {checked})"
            )
            for issue in remaining_broken:
                rel = issue.link.file.relative_to(REPO_ROOT)
                hint = (
                    f"; suggest {issue.suggested_href}"
                    if issue.suggested_href
                    else ""
                )
                print(
                    f"  {rel}:{issue.link.line}: {issue.link.href} → "
                    f"{issue.resolved} ({issue.detail}{hint})"
                )
        if remaining_titles:
            print(
                f"Wrong link titles: {len(remaining_titles)} (checked {checked})"
            )
            for issue in remaining_titles:
                rel = issue.link.file.relative_to(REPO_ROOT)
                print(
                    f"  {rel}:{issue.link.line}: [{issue.link.text}]"
                    f"({issue.link.href}) — {issue.detail}"
                )
        return 1

    print(f"OK: {checked} link(s) in {len(iter_mdx_files())} mdx file(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
