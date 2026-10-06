#!/usr/bin/env python3
from __future__ import annotations
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
import re
import sys

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
BASE = "https://motoopen.github.io/chothuexemayhanoi/"
PREFIX = "/chothuexemayhanoi/"
PROJECT_RAW = "raw.githubusercontent.com/motoopen/chothuexemayhanoi/refs/heads/main/"

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if data.get("id"):
            self.ids.add(data["id"])
        for attr in ("href", "src", "action", "poster"):
            if data.get(attr):
                self.refs.append((tag, attr, data[attr]))
        if data.get("srcset"):
            for part in data["srcset"].split(","):
                part = part.strip()
                if part:
                    self.refs.append((tag, "srcset", part.split()[0]))

def page_url(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return BASE
    if rel.endswith("/index.html"):
        return BASE + rel[:-10]
    return BASE + rel

def artifact_path(url_path: str) -> Path | None:
    if url_path == "/chothuexemayhanoi":
        rel = ""
    elif url_path.startswith(PREFIX):
        rel = url_path[len(PREFIX):]
    else:
        return None
    rel = unquote(rel)
    if not rel or rel.endswith("/"):
        return ROOT / rel / "index.html"
    return ROOT / rel

def fail(msg: str, errors: list[str]):
    errors.append(msg)

def main() -> int:
    errors = []
    html_files = list(ROOT.rglob("*.html"))
    parsers = {}

    for path in html_files:
        parser = Parser()
        parser.feed(path.read_text("utf-8", errors="replace"))
        parsers[path] = parser

    checked = 0
    for path, parser in parsers.items():
        source_url = page_url(path)
        text = path.read_text("utf-8", errors="replace")
        if PROJECT_RAW in text:
            fail(f"{path.relative_to(ROOT)} still references branch-raw project assets", errors)

        for tag, attr, raw in parser.refs:
            raw = raw.strip()
            if not raw or raw.startswith(("mailto:", "tel:", "javascript:", "data:", "blob:")):
                continue
            if raw.startswith("#"):
                fragment = raw[1:]
                if fragment and fragment not in parser.ids:
                    fail(f"{path.relative_to(ROOT)} -> missing fragment {raw}", errors)
                continue

            absolute = urljoin(source_url, raw)
            parsed = urlparse(absolute)
            if parsed.netloc != "motoopen.github.io":
                continue
            if not (parsed.path == "/chothuexemayhanoi" or parsed.path.startswith(PREFIX)):
                continue

            checked += 1
            target = artifact_path(parsed.path)
            if target is None or not target.exists():
                fail(f"{path.relative_to(ROOT)} -> 404 candidate {raw} => {parsed.path}", errors)
                continue

            if parsed.fragment and target.suffix.lower() == ".html":
                target_parser = parsers.get(target)
                if target_parser and parsed.fragment not in target_parser.ids:
                    fail(f"{path.relative_to(ROOT)} -> missing target fragment {raw}", errors)

    css_url = re.compile(r"url\(([^)]+)\)")
    for path in ROOT.rglob("*.css"):
        text = path.read_text("utf-8", errors="replace")
        if PROJECT_RAW in text:
            fail(f"{path.relative_to(ROOT)} still references branch-raw project assets", errors)
        source_url = BASE + path.relative_to(ROOT).as_posix()
        for match in css_url.finditer(text):
            raw = match.group(1).strip().strip("'\"")
            if not raw or raw.startswith(("data:", "http://", "https://", "#")):
                continue
            parsed = urlparse(urljoin(source_url, raw))
            if parsed.netloc == "motoopen.github.io" and parsed.path.startswith(PREFIX):
                checked += 1
                target = artifact_path(parsed.path)
                if target is None or not target.exists():
                    fail(f"{path.relative_to(ROOT)} -> missing CSS asset {raw}", errors)

    path_literal = re.compile(r"['\"](/chothuexemayhanoi/[^'\"\s]*)['\"]")
    for suffix in ("*.js", "*.json", "*.xml"):
        for path in ROOT.rglob(suffix):
            text = path.read_text("utf-8", errors="replace")
            if PROJECT_RAW in text:
                fail(f"{path.relative_to(ROOT)} still references branch-raw project assets", errors)
            for match in path_literal.finditer(text):
                raw = match.group(1)
                parsed = urlparse(raw)
                target = artifact_path(parsed.path)
                if target is not None:
                    checked += 1
                    if not target.exists():
                        fail(f"{path.relative_to(ROOT)} -> missing runtime path {raw}", errors)

    print(f"Link integrity: {len(html_files)} HTML pages, {checked} internal refs checked.")
    if errors:
        print(f"FAILED: {len(errors)} broken internal refs/assets.")
        for err in errors:
            print(" -", err)
        return 1
    print("PASS: no broken internal links, fragments, CSS assets, or runtime paths.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
