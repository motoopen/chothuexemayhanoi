#!/usr/bin/env python3
from __future__ import annotations
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
SITEMAP = (ROOT / "sitemap.xml").read_text("utf-8", errors="replace")
BASE = "https://motoopen.github.io/chothuexemayhanoi"

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = 0
        self.title = ""
        self._in_title = False
        self.meta = {}
        self.canonical = None
        self.images = []
        self.schemas = []
        self._schema = False
        self._schema_buf = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "h1":
            self.h1 += 1
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            key = data.get("name") or data.get("property")
            if key:
                self.meta[key] = data.get("content", "")
        elif tag == "link" and data.get("rel") == "canonical":
            self.canonical = data.get("href")
        elif tag == "img":
            self.images.append(data)
        elif tag == "script" and data.get("type") == "application/ld+json":
            self._schema = True
            self._schema_buf = []

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._schema:
            self.schemas.append("".join(self._schema_buf))
            self._schema = False
            self._schema_buf = []

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._schema:
            self._schema_buf.append(data)

def main() -> int:
    errors = []
    articles = []
    for path in ROOT.glob("blog/**/index.html"):
        text = path.read_text("utf-8", errors="replace")
        if '<meta property="og:type" content="article">' not in text:
            continue
        p = AuditParser()
        p.feed(text)
        articles.append((path, p))

    if not articles:
        errors.append("No generated blog articles found.")

    for path, p in articles:
        rel = path.relative_to(ROOT).as_posix()
        if p.h1 != 1:
            errors.append(f"{rel}: expected exactly one H1, found {p.h1}")
        title = re.sub(r"\s+", " ", p.title).strip()
        source_title = re.sub(r"\s+", " ", p.meta.get("og:title", "")).strip() or title
        if not title:
            errors.append(f"{rel}: missing title")
        elif len(source_title) > 90:
            errors.append(f"{rel}: source title is unexpectedly long ({len(source_title)} chars)")
        desc = p.meta.get("description", "").strip()
        if not desc:
            errors.append(f"{rel}: missing meta description")
        if not p.canonical or not p.canonical.startswith(BASE + "/blog/"):
            errors.append(f"{rel}: invalid canonical {p.canonical!r}")
        elif f"<loc>{p.canonical}</loc>" not in SITEMAP:
            errors.append(f"{rel}: canonical missing from sitemap")
        for img in p.images:
            if not img.get("alt", "").strip():
                errors.append(f"{rel}: image missing alt: {img.get('src','')}")
        types = set()
        for raw in p.schemas:
            try:
                data = json.loads(raw)
            except json.JSONDecodeError as exc:
                errors.append(f"{rel}: invalid JSON-LD: {exc}")
                continue
            if isinstance(data, dict) and data.get("@type"):
                types.add(data["@type"])
        for required in ("Article", "BreadcrumbList"):
            if required not in types:
                errors.append(f"{rel}: missing {required} schema")
        if "blog-component" not in path.read_text("utf-8", errors="replace"):
            errors.append(f"{rel}: shared post components not rendered")

    print(f"Blog QA: {len(articles)} generated articles checked.")
    if errors:
        print(f"FAILED: {len(errors)} blog QA issue(s).")
        for err in errors:
            print(" -", err)
        return 1
    print("PASS: blog titles, H1, meta, canonical, sitemap, image alt, schema and shared components.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
