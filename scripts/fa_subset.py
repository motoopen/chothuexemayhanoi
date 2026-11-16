#!/usr/bin/env python3
"""Regenerate the self-hosted Font Awesome subset in assets/vendor/fontawesome/.

The non-home pages and the blog layout load
/chothuexemayhanoi/assets/vendor/fontawesome/fa-subset.css instead of the full
Font Awesome CSS (about 315 KB) from a CDN. The subset only contains the icons
the site uses. scripts/check_fa_subset.py fails CI when a page uses an icon that
is missing here; then run this script.

Usage (needs: pip install fonttools brotli):
  python3 scripts/fa_subset.py --scan _site            # add every icon used in the built site
  python3 scripts/fa_subset.py --add solid:truck --add regular:clock
  python3 scripts/fa_subset.py --fa-dir /path/to/fontawesome-free-6.5.2-web

The icon list is kept in scripts/fa_codepoints.json ({"solid": [[name, codepoint], ...],
"regular": [...], "brands": [...]}). Without --fa-dir the Font Awesome Free 6.5.2
CSS and webfonts are downloaded from cdnjs into a temporary folder.

Licence: Font Awesome Free (Icons CC BY 4.0, Fonts SIL OFL 1.1, Code MIT). The
licence header is kept at the top of fa-subset.css.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "vendor" / "fontawesome"
LIST = Path(__file__).resolve().parent / "fa_codepoints.json"
CDN = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2"
FONTS = {
    "solid": ("fa-solid-900.woff2", "Font Awesome 6 Free", 900),
    "regular": ("fa-regular-400.woff2", "Font Awesome 6 Free", 400),
    "brands": ("fa-brands-400.woff2", "Font Awesome 6 Brands", 400),
}
STYLE_CLASSES = {"fa-solid": "solid", "fas": "solid", "fa-regular": "regular", "far": "regular",
                 "fa-brands": "brands", "fab": "brands"}
NON_ICON = {"fa-solid", "fa-regular", "fa-brands", "fas", "far", "fab", "fa-fw", "fa-css",
            "fa-css-fallback", "fa-classic", "fa-sharp"}


def fetch_sources(fa_dir: Path | None) -> tuple[str, Path]:
    if fa_dir:
        css_path = next((p for p in (fa_dir / "css" / "all.min.css", fa_dir / "all.min.css") if p.exists()), None)
        if not css_path:
            sys.exit(f"all.min.css not found in {fa_dir}")
        font_dir = fa_dir / "webfonts" if (fa_dir / "webfonts").exists() else fa_dir
        return css_path.read_text("utf-8"), font_dir
    tmp = Path(tempfile.mkdtemp(prefix="fa-src-"))
    for rel in ["css/all.min.css"] + [f"webfonts/{f}" for f, _, _ in FONTS.values()]:
        target = tmp / Path(rel).name
        with urllib.request.urlopen(f"{CDN}/{rel}", timeout=60) as resp:
            target.write_bytes(resp.read())
    return (tmp / "all.min.css").read_text("utf-8"), tmp


def codepoint(css: str, name: str) -> str | None:
    m = re.search(r"\.fa-" + re.escape(name) + r":before(?:,[^{]*)?\{content:\"\\([0-9a-f]+)\"", css)
    if not m:
        m = re.search(r"[,}]\s*\.fa-" + re.escape(name) + r":before[^{]*\{content:\"\\([0-9a-f]+)\"", css)
    return m.group(1) if m else None


def scan(site: Path) -> dict[str, set[str]]:
    """Collect (style, icon) pairs from built HTML, JS and JSON data."""
    found: dict[str, set[str]] = {k: set() for k in FONTS}
    files = [p for ext in ("*.html", "*.js", "*.json") for p in site.rglob(ext)]
    class_re = re.compile(r"""(?:class(?:Name)?\s*[=:]\s*|['"])\s*((?:[\w-]+\s+)*fa-(?:solid|regular|brands)\b[^'"<>]*)""")
    for f in files:
        text = f.read_text("utf-8", errors="ignore")
        for m in class_re.finditer(text):
            tokens = m.group(1).split()
            styles = {STYLE_CLASSES[t] for t in tokens if t in STYLE_CLASSES}
            icons = [t[3:] for t in tokens if t.startswith("fa-") and t not in NON_ICON]
            for style in styles:
                found[style].update(icons)
    return found


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--fa-dir", type=Path, help="local Font Awesome Free 6.5.2 web folder")
    ap.add_argument("--scan", type=Path, action="append", default=[], help="folder to scan for used icons (e.g. _site)")
    ap.add_argument("--add", action="append", default=[], help="style:name, e.g. solid:truck")
    args = ap.parse_args()

    try:
        from fontTools import subset  # noqa: F401
    except ImportError:
        sys.exit("pip install fonttools brotli")

    current = json.loads(LIST.read_text("utf-8")) if LIST.exists() else {}
    wanted: dict[str, set[str]] = {k: {n for n, _ in current.get(k, [])} for k in FONTS}
    for folder in args.scan:
        for style, names in scan(folder).items():
            wanted[style] |= names
    for item in args.add:
        style, _, name = item.partition(":")
        if style not in FONTS or not name:
            sys.exit(f"bad --add {item!r}")
        wanted[style].add(name)

    css, font_dir = fetch_sources(args.fa_dir)
    table: dict[str, list[list[str]]] = {}
    missing = []
    for style in FONTS:
        rows = []
        for name in sorted(wanted[style]):
            cp = codepoint(css, name)
            if cp:
                rows.append([name, cp])
            else:
                missing.append(f"{style}:{name}")
        table[style] = rows
    if missing:
        print("Unknown Font Awesome 6.5.2 icon names:", ", ".join(missing))
        return 1

    from fontTools import subset
    OUT.mkdir(parents=True, exist_ok=True)
    for style, (font_file, _, _) in FONTS.items():
        unicodes = ",".join("U+" + cp for _, cp in table[style]) or "U+0020"
        out = OUT / font_file.replace(".woff2", "-subset.woff2")
        subset.main([str(font_dir / font_file), f"--unicodes={unicodes}", "--flavor=woff2",
                     "--layout-features=*", "--no-hinting", f"--output-file={out}"])

    rules = {}
    for style in FONTS:
        for name, cp in table[style]:
            rules[name] = cp
    lines = [
        "/* Font Awesome Free 6.5.2 subset - icons used on Motoopen. License: https://fontawesome.com/license/free (Icons CC BY 4.0, Fonts SIL OFL 1.1, Code MIT). Regenerate with scripts/fa_subset.py */",
        ".fa-solid,.fa-regular,.fa-brands,.fas,.far,.fab{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;display:var(--fa-display,inline-block);font-style:normal;font-variant:normal;line-height:1;text-rendering:auto}",
        '.fa-solid,.fas{font-family:"Font Awesome 6 Free";font-weight:900}.fa-regular,.far{font-family:"Font Awesome 6 Free";font-weight:400}.fa-brands,.fab{font-family:"Font Awesome 6 Brands";font-weight:400}',
        ".fa-fw{text-align:center;width:1.25em}",
    ]
    for style, (font_file, family, weight) in FONTS.items():
        sub = font_file.replace(".woff2", "-subset.woff2")
        lines.append(f'@font-face{{font-family:"{family}";font-style:normal;font-weight:{weight};font-display:block;src:url({sub}) format("woff2")}}')
    lines.append("".join(f'.fa-{n}:before{{content:"\\{cp}"}}' for n, cp in sorted(rules.items())))
    (OUT / "fa-subset.css").write_text("\n".join(lines) + "\n", "utf-8")
    LIST.write_text(json.dumps(table, indent=1) + "\n", "utf-8")
    print("Subset written:", {k: len(v) for k, v in table.items()}, "->", OUT.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
