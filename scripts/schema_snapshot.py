#!/usr/bin/env python3
"""READ-ONLY schema guard.

Extracts every JSON-LD block (and any microdata/RDFa attributes) from each HTML
page of a built Jekyll site and either writes a snapshot or compares the build
against a stored snapshot.

Schema lock rule (owner instruction, highest priority): existing structured data
must not be added, changed, removed or regenerated. This script never edits
schema; it only records and compares it.

Usage:
  python3 scripts/schema_snapshot.py snapshot _site qa/schema-baseline.json
  python3 scripts/schema_snapshot.py compare  _site qa/schema-baseline.json
  python3 scripts/schema_snapshot.py validate _site      # read-only error report
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

LD_RE = re.compile(
    r"<script[^>]*type=[\"']application/ld\+json[\"'][^>]*>(.*?)</script>",
    re.S | re.I,
)
MICRO_RE = re.compile(r"\s(itemscope|itemtype|itemprop|vocab|typeof|property=\"schema:)[=\s>\"']", re.I)


def page_key(root: Path, path: Path) -> str:
    rel = path.relative_to(root).as_posix()
    if rel.endswith("index.html"):
        rel = rel[: -len("index.html")]
    return "/" + rel


def extract(html: str):
    blocks = []
    for raw in LD_RE.findall(html):
        raw_stripped = raw.strip()
        try:
            data = json.loads(raw_stripped)
            canonical = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            ok = True
        except json.JSONDecodeError as exc:  # report, never fix
            canonical = "INVALID_JSON: " + str(exc)
            ok = False
        blocks.append(
            {
                "raw_sha256": hashlib.sha256(raw_stripped.encode("utf-8")).hexdigest(),
                "semantic_sha256": hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
                "valid_json": ok,
                "types": types_of(json.loads(raw_stripped)) if ok else [],
            }
        )
    micro = len(MICRO_RE.findall(html))
    return blocks, micro


def types_of(node, acc=None):
    acc = [] if acc is None else acc
    if isinstance(node, dict):
        t = node.get("@type")
        if isinstance(t, str):
            acc.append(t)
        elif isinstance(t, list):
            acc.extend(str(x) for x in t)
        for v in node.values():
            types_of(v, acc)
    elif isinstance(node, list):
        for v in node:
            types_of(v, acc)
    return acc


def build_snapshot(root: Path):
    snap = {}
    for path in sorted(root.rglob("*.html")):
        blocks, micro = extract(path.read_text(encoding="utf-8", errors="replace"))
        if blocks or micro:
            snap[page_key(root, path)] = {"jsonld": blocks, "microdata_attrs": micro}
    return snap


def cmd_snapshot(root: Path, out: Path):
    snap = build_snapshot(root)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"pages": snap}, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    total = sum(len(v["jsonld"]) for v in snap.values())
    print(f"snapshot: {len(snap)} pages, {total} JSON-LD blocks -> {out}")


def cmd_compare(root: Path, baseline: Path) -> int:
    base = json.loads(baseline.read_text(encoding="utf-8"))["pages"]
    cur = build_snapshot(root)
    problems = []
    raw_only = []
    for key in sorted(set(base) | set(cur)):
        b, c = base.get(key), cur.get(key)
        if b is None:
            problems.append(f"ADDED schema on {key}: {[x['types'] for x in c['jsonld']]}")
            continue
        if c is None:
            problems.append(f"REMOVED all schema on {key}")
            continue
        bs = [x["semantic_sha256"] for x in b["jsonld"]]
        cs = [x["semantic_sha256"] for x in c["jsonld"]]
        if bs != cs:
            problems.append(f"CHANGED schema on {key}: base={len(bs)} blocks, now={len(cs)} blocks")
        elif [x["raw_sha256"] for x in b["jsonld"]] != [x["raw_sha256"] for x in c["jsonld"]]:
            raw_only.append(key)
        if b["microdata_attrs"] != c["microdata_attrs"]:
            problems.append(f"CHANGED microdata attribute count on {key}")
    total = sum(len(v["jsonld"]) for v in cur.values())
    print(f"compare: {len(cur)} pages / {total} JSON-LD blocks checked against {baseline}")
    if raw_only:
        print(f"note: {len(raw_only)} pages differ only in JSON-LD whitespace (semantically identical)")
    if problems:
        print("SCHEMA LOCK VIOLATION:")
        for p in problems[:200]:
            print("  - " + p)
        return 1
    print("SCHEMA LOCK OK: structured data identical to baseline")
    return 0


def cmd_validate(root: Path) -> int:
    """Read-only report of schema issues. Never edits anything."""
    issues = []
    for path in sorted(root.rglob("*.html")):
        html = path.read_text(encoding="utf-8", errors="replace")
        key = page_key(root, path)
        for raw in LD_RE.findall(html):
            try:
                data = json.loads(raw)
            except json.JSONDecodeError as exc:
                issues.append((key, f"invalid JSON-LD: {exc}"))
                continue
            text = json.dumps(data, ensure_ascii=False)
            if '"AggregateRating"' in text or '"Review"' in text:
                issues.append((key, "self-serving Review/AggregateRating on LocalBusiness (not eligible for review rich results; verify source)"))
            if '"FAQPage"' in text:
                issues.append((key, "FAQPage present (FAQ rich results are limited to government/health sites since 2023)"))
    seen = set()
    for key, msg in issues:
        if (key, msg) in seen:
            continue
        seen.add((key, msg))
        print(f"{key}\t{msg}")
    print(f"validate: {len(seen)} read-only findings")
    return 0


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 2
    mode, root = argv[1], Path(argv[2])
    if mode == "snapshot":
        cmd_snapshot(root, Path(argv[3]))
        return 0
    if mode == "compare":
        return cmd_compare(root, Path(argv[3]))
    if mode == "validate":
        return cmd_validate(root)
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
