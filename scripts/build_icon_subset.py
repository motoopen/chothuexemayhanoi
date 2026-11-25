#!/usr/bin/env python3
"""Rebuild the self-hosted Font Awesome subset (assets/vendor/fontawesome/).

Needs: `npm pack @fortawesome/fontawesome-free@6.5.2` extracted to ./package and
`pip install fonttools brotli`. Scans the repo for fa-* class names, keeps only
those glyphs, and writes icons.css + three woff2 subsets (~17 KB total instead of
~250 KB from the CDN). Run it after adding a new icon class anywhere on the site.
Usage: python3 scripts/build_icon_subset.py /path/to/package
"""
import os, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PKG = Path(sys.argv[1] if len(sys.argv) > 1 else "package")
OUT = ROOT / "assets/vendor/fontawesome"
EXTRA = "plus minus list-ul chevron-right xmark wallet check comments arrow-up bars file-contract sack-dollar users".split()
BRANDS = {"facebook-f", "instagram", "pinterest-p", "tiktok", "youtube"}

used = set(EXTRA)
for p in ROOT.rglob("*"):
    if p.is_file() and p.suffix in {".html", ".js", ".json", ".yml", ".md"} and "_archive" not in p.parts and "_site" not in p.parts and "vendor" not in p.parts:
        used |= set(re.findall(r"fa-([a-z0-9-]+)", p.read_text(encoding="utf-8", errors="ignore")))
css = (PKG / "css/all.css").read_text()
rules = {}
for n in sorted(used):
    m = re.search(r"\.fa-" + re.escape(n) + r":{1,2}before\s*\{\s*content:\s*\"\\([0-9a-f]+)\"", css)
    if m:
        rules[n] = m.group(1)
solid = sorted({c for n, c in rules.items() if n not in BRANDS})
brand = sorted({c for n, c in rules.items() if n in BRANDS})
def sub(font, cps, out):
    subprocess.run(["pyftsubset", str(PKG / f"webfonts/{font}.ttf"), "--unicodes=" + ",".join("U+" + c for c in cps),
                    "--flavor=woff2", "--output-file=" + str(OUT / out), "--no-hinting", "--desubroutinize"], check=True)
OUT.mkdir(parents=True, exist_ok=True)
sub("fa-solid-900", solid, "fa-solid-900-subset.woff2")
sub("fa-regular-400", solid, "fa-regular-400-subset.woff2")
sub("fa-brands-400", brand, "fa-brands-400-subset.woff2")
head = (OUT / "icons.css").read_text().split(".fa-fw{text-align:center;width:1.25em}")[0] + ".fa-fw{text-align:center;width:1.25em}\n"
(OUT / "icons.css").write_text(head + "".join(f'.fa-{n}::before{{content:"\\{c}"}}' for n, c in sorted(rules.items())) + "\n")
print(f"{len(rules)} icons -> {OUT}")
