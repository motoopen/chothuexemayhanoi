#!/usr/bin/env python3
"""Owner SEO rules for the built site. Usage: python3 scripts/check_seo_rules.py [_site]

Fails (exit 1) when:
  1. a <p> or <li> in a blog post or standalone page has more than ONE internal link
     (nearest <p>/<li> counts as the paragraph; links inside header, nav, footer, aside,
     breadcrumbs, related posts and other site-wide components are ignored, and so are
     same-page "#..." jumps);
  2. a non-home page contains another business's contact data (0942467674 / "Nguyen Tu");
  3. a JSON-LD block does not parse;
  4. a page has more than one <h1>;
  5. two standalone pages (or a standalone page and the homepage) share the same H1 text.
The homepage is frozen (owner rule): it is only read for rule 3 and as the reference for rule 5.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
BASE = "https://motoopen.github.io/chothuexemayhanoi/"
PREFIX = "/chothuexemayhanoi"
FOREIGN = re.compile(r"0942[\s.]?467[\s.]?674|Nguyen\s+Tu\b", re.I)
SKIP_TAGS = {"header", "nav", "footer", "aside"}
SKIP_CLASS = re.compile(r"breadcrumb|blog-related|related-posts|drawer|bottom-appbar|topbar|menu|toc-|footer|blog-component")
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
CLOSES_P = {"address", "article", "aside", "blockquote", "div", "dl", "fieldset", "footer", "form", "h1", "h2",
            "h3", "h4", "h5", "h6", "header", "hr", "main", "nav", "ol", "p", "pre", "section", "table", "ul", "li"}


class Page(HTMLParser):
    def __init__(self, url: str):
        super().__init__(convert_charrefs=True)
        self.url = url
        self.stack: list[list] = []  # [tag, skip, links, text]
        self.h1: list[str] = []
        self._h1 = None
        self.jsonld: list[str] = []
        self._ld = None
        self.violations: list[tuple[int, str]] = []

    def _skipping(self) -> bool:
        return any(item[1] for item in self.stack)

    def _pop_to(self, tag: str):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                for item in reversed(self.stack[i:]):
                    self._close(item)
                del self.stack[i:]
                return

    def _close(self, item):
        tag, skip, links, text = item
        if tag in ("p", "li") and len(links) > 1 and not skip and not self._skipping():
            snippet = re.sub(r"\s+", " ", "".join(text)).strip()[:90]
            self.violations.append((len(links), f"<{tag}> {len(links)} internal links: {', '.join(links)} | {snippet}"))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "script" and (a.get("type") or "").lower() == "application/ld+json":
            self._ld = []
        if tag == "h1":
            self._h1 = []
        if tag in VOID:
            return
        if self.stack and self.stack[-1][0] == "p" and tag in CLOSES_P:
            self._close(self.stack.pop())
        if tag == "li":
            # an open <li> at the same level is closed by a new <li>
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i][0] in ("ul", "ol"):
                    break
                if self.stack[i][0] == "li":
                    self._pop_to("li")
                    break
        skip = tag in SKIP_TAGS or bool(SKIP_CLASS.search(a.get("class") or "")) or (a.get("id") or "") in {"drawer", "topbar"}
        self.stack.append([tag, skip, [], []])
        if tag == "a" and a.get("href"):
            href = a["href"].strip()
            if href.startswith(("#", "mailto:", "tel:", "javascript:", "sms:")):
                return
            target = urlparse(urljoin(self.url, href))
            if target.netloc == "motoopen.github.io" and (target.path == PREFIX or target.path.startswith(PREFIX + "/")) \
                    or (href.startswith("/") and not href.startswith("//")):
                for item in reversed(self.stack[:-1]):
                    if item[0] in ("p", "li"):
                        item[2].append(href)
                        break

    def handle_endtag(self, tag):
        if tag == "script" and self._ld is not None:
            self.jsonld.append("".join(self._ld))
            self._ld = None
        if tag == "h1" and self._h1 is not None:
            self.h1.append(re.sub(r"\s+", " ", "".join(self._h1)).strip())
            self._h1 = None
        if tag in VOID:
            return
        self._pop_to(tag)

    def handle_data(self, data):
        if self._ld is not None:
            self._ld.append(data)
        if self._h1 is not None:
            self._h1.append(data)
        for item in self.stack:
            if item[0] in ("p", "li"):
                item[3].append(data)

    def close(self):
        super().close()
        while self.stack:
            self._close(self.stack.pop())


def url_of(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return BASE
    return BASE + (rel[:-10] if rel.endswith("/index.html") else rel)


def norm(s: str) -> str:
    return unicodedata.normalize("NFC", s).casefold().strip()


def main() -> int:
    errors: list[str] = []
    standalone_h1: dict[str, list[str]] = {}
    files = sorted(ROOT.rglob("*.html"))
    for path in files:
        rel = path.relative_to(ROOT).as_posix()
        text = path.read_text("utf-8", errors="replace")
        is_home = rel == "index.html"
        is_post = rel.startswith("blog/") and '<meta property="og:type" content="article">' in text
        is_standalone = "/" not in rel and rel not in ("index.html", "404.html")
        page = Page(url_of(path))
        page.feed(text)
        page.close()

        for raw in page.jsonld:
            try:
                json.loads(raw)
            except json.JSONDecodeError as exc:
                errors.append(f"{rel}: JSON-LD does not parse ({exc})")
        if is_home:
            for h in page.h1:
                standalone_h1.setdefault(norm(h), []).append("index.html (homepage)")
            continue
        m = FOREIGN.search(text)
        if m:
            errors.append(f"{rel}: contains another business's data {m.group(0)!r}")
        if len(page.h1) > 1:
            errors.append(f"{rel}: {len(page.h1)} H1 elements: {page.h1}")
        if is_standalone:
            for h in page.h1:
                standalone_h1.setdefault(norm(h), []).append(rel)
        if is_post or is_standalone:
            for _, msg in page.violations:
                errors.append(f"{rel}: {msg}")

    for h1, pages in sorted(standalone_h1.items()):
        if len(pages) > 1:
            errors.append(f"duplicate H1 {h1!r} on: {', '.join(pages)}")

    print(f"SEO rules: {len(files)} HTML pages checked.")
    if errors:
        print(f"FAILED: {len(errors)} issue(s).")
        for e in errors:
            print(" -", e)
        return 1
    print("PASS: 1 internal link per paragraph, no foreign NAP, JSON-LD parses, one H1, unique standalone H1s.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
