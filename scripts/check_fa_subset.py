#!/usr/bin/env python3
"""Fail if a page that loads the self-hosted Font Awesome subset uses an icon the subset lacks.

Usage: python3 scripts/check_fa_subset.py [_site]

Checks every built HTML page that links fa-subset.css, plus all built JS under
assets/js (icons injected at runtime), for "fa-solid|fa-regular|fa-brands fa-NAME"
pairs. Each pair must be listed for that style in scripts/fa_codepoints.json and
have a CSS rule in assets/vendor/fontawesome/fa-subset.css. When this fails,
regenerate the subset: python3 scripts/fa_subset.py --scan _site
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SITE = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
STYLE_CLASSES = {"fa-solid": "solid", "fas": "solid", "fa-regular": "regular", "far": "regular",
                 "fa-brands": "brands", "fab": "brands"}
NON_ICON = {"fa-solid", "fa-regular", "fa-brands", "fas", "far", "fab", "fa-fw", "fa-css",
            "fa-css-fallback", "fa-classic", "fa-sharp"}
CLASS_RE = re.compile(r"""(?:class(?:Name)?\s*[=:]\s*|['"])\s*((?:[\w-]+\s+)*fa-(?:solid|regular|brands)\b[^'"<>]*)""")


def pairs(text: str):
    for m in CLASS_RE.finditer(text):
        tokens = m.group(1).split()
        styles = {STYLE_CLASSES[t] for t in tokens if t in STYLE_CLASSES}
        for t in tokens:
            if t.startswith("fa-") and t not in NON_ICON:
                for style in styles:
                    yield style, t[3:]


def main() -> int:
    table = json.loads((REPO / "scripts" / "fa_codepoints.json").read_text("utf-8"))
    have = {(style, name) for style, rows in table.items() for name, _ in rows}
    css = (REPO / "assets" / "vendor" / "fontawesome" / "fa-subset.css").read_text("utf-8")
    css_names = set(re.findall(r"\.fa-([a-z0-9-]+):before", css))
    errors = []
    for style, name in sorted(have):
        if name not in css_names:
            errors.append(f"fa-subset.css has no rule for fa-{name} (listed in fa_codepoints.json)")

    files = [p for p in SITE.rglob("*.html") if "fa-subset.css" in p.read_text("utf-8", errors="ignore")]
    pages = len(files)
    files += list((SITE / "assets" / "js").rglob("*.js"))
    used: dict[tuple[str, str], Path] = {}
    for f in files:
        for pair in pairs(f.read_text("utf-8", errors="ignore")):
            used.setdefault(pair, f)
    for (style, name), f in sorted(used.items()):
        if (style, name) not in have:
            errors.append(f"missing icon fa-{style} fa-{name} (first seen in {f.relative_to(SITE)})")

    print(f"FA subset: {pages} pages load fa-subset.css; {len(used)} icon/style pairs used.")
    if errors:
        print(f"FAILED: {len(errors)} problem(s). Regenerate with: python3 scripts/fa_subset.py --scan _site")
        for e in errors:
            print(" -", e)
        return 1
    print("PASS: every icon used with the subset is present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
