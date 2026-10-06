#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Motoopen Article Factory Lite.

Mistral writes Markdown drafts to _factory/incoming/<matrix-id>.md.
Drafts are not public. This tool validates selected drafts, promotes PASS
items to _posts/, updates the canonical matrix, and leaves failed drafts
in incoming for repair.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import sys
from collections import Counter
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
MATRIX = ROOT / "_seo" / "article-matrix-300.json"
INCOMING = ROOT / "_factory" / "incoming"
REPORT = ROOT / "_factory" / "last-run.json"
POSTS = ROOT / "_posts"
MAX_QUEUE = 10
DEFAULT_QUEUE = 6
MIN_WORDS = 650
PRIORITY = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
PLACEHOLDERS = ("lorem ipsum", "todo:", "tbd:", "[insert", "[chèn", "viết sau", "nội dung đang cập nhật", "placeholder")
FOREIGN_SCRIPT = re.compile(r"[\u4e00-\u9fff\u3040-\u30ff\u0400-\u04ff]")
H1_RE = re.compile(r"(?m)^#\s+")
H2_RE = re.compile(r"(?m)^##\s+")
URL_RE = re.compile(r"https?://[^\s)>\"']+")
RELATIVE_URL_RE = re.compile(r"\|\s*relative_url\s*\}\}")
LIQUID_LINK_START_RE = re.compile(r"\]\(\{\{")
VALID_LIQUID_LINK_RE = re.compile(r"\]\(\{\{\s*['\"][^'\"]+['\"]\s*\|\s*relative_url\s*\}\}\)")


def now_local():
    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))


def iso_now():
    return now_local().isoformat(timespec="seconds")


def load_matrix():
    return json.loads(MATRIX.read_text(encoding="utf-8"))


def save_matrix(doc):
    counts = Counter(str(x.get("status", "planned")).lower() for x in doc["items"])
    doc["status_counts"] = dict(sorted(counts.items()))
    doc["updated_at"] = iso_now()
    MATRIX.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def row_map(doc):
    return {int(x["id"]): x for x in doc["items"]}


def incoming_files():
    INCOMING.mkdir(parents=True, exist_ok=True)
    return sorted(p for p in INCOMING.glob("*.md") if p.is_file())


def parse_frontmatter(path):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("draft must start with YAML front matter (---)")
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration as exc:
        raise ValueError("front matter closing --- missing") from exc
    fields = {}
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        fields[key.strip()] = value
    body = "\n".join(lines[end + 1:]).strip() + "\n"
    return fields, body


def plain_text(markdown):
    text = re.sub(r"```.*?```", " ", markdown, flags=re.S)
    text = re.sub(r"`[^`]*`", " ", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[#>*_~|=-]+", " ", text)
    return " ".join(text.split())


def word_count(markdown):
    return len(re.findall(r"[A-Za-zÀ-ỹ0-9]+", plain_text(markdown)))


def body_hash(markdown):
    return hashlib.sha256(plain_text(markdown).lower().encode("utf-8")).hexdigest()


def existing_hashes():
    hashes = set()
    if not POSTS.exists():
        return hashes
    for path in POSTS.glob("*.md"):
        try:
            _, body = parse_frontmatter(path)
        except Exception:
            body = path.read_text(encoding="utf-8", errors="replace")
        hashes.add(body_hash(body))
    return hashes


def source_required(row):
    flags = " ".join(row.get("validation_required") or []).lower()
    return "vietnam-law" in flags or "traffic-law" in flags or "manufacturer-policy" in flags


def validate_draft(path, row, seen_hashes):
    errors, warnings = [], []
    try:
        fields, body = parse_frontmatter(path)
    except Exception as exc:
        return {"ok": False, "errors": [str(exc)], "warnings": [], "word_count": 0}
    try:
        matrix_id = int(fields.get("matrix_id", ""))
    except ValueError:
        matrix_id = -1
    if matrix_id != int(row["id"]):
        errors.append(f"matrix_id {matrix_id!r} must equal {row['id']}")
    desc = fields.get("description", "").strip()
    if not (60 <= len(desc) <= 180):
        errors.append(f"description length {len(desc)} must be 60..180 characters")
    wc = word_count(body)
    if wc < MIN_WORDS:
        errors.append(f"thin draft: {wc} words < {MIN_WORDS}")
    if H1_RE.search(body):
        errors.append("body must not contain H1; post layout supplies H1")
    h2_count = len(H2_RE.findall(body))
    if h2_count < 2:
        errors.append(f"body needs at least 2 H2 sections; found {h2_count}")
    low = body.lower()
    bad = [p for p in PLACEHOLDERS if p in low]
    if bad:
        errors.append("placeholder text found: " + ", ".join(bad))
    if FOREIGN_SCRIPT.search(body):
        errors.append("foreign-script corruption detected")
    digest = body_hash(body)
    if digest in seen_hashes:
        errors.append("duplicate normalized body already exists")
    if not RELATIVE_URL_RE.search(body):
        errors.append("add at least one internal Jekyll link using | relative_url")
    if body.count("{{") != body.count("}}"):
        errors.append("unbalanced Liquid delimiters: every {{ must have a matching }}")
    liquid_link_starts = len(LIQUID_LINK_START_RE.findall(body))
    valid_liquid_links = len(VALID_LIQUID_LINK_RE.findall(body))
    if liquid_link_starts != valid_liquid_links:
        errors.append(
            f"malformed internal Liquid link: {liquid_link_starts} link starts but "
            f"{valid_liquid_links} valid ]({{{{ 'path' | relative_url }}}}) links"
        )
    if source_required(row):
        has_sources_heading = bool(re.search(r"(?im)^##+\s+.*ngu[oồ]n", body))
        if not has_sources_heading or not URL_RE.search(body):
            errors.append("legal/manufacturer topic requires a Nguồn section with at least one URL")
    primary = str(row.get("primary_keyword", "")).lower()
    title = str(row.get("working_title", "")).lower()
    if primary and primary not in title:
        warnings.append("matrix title does not contain exact primary keyword")
    return {"ok": not errors, "errors": errors, "warnings": warnings, "word_count": wc,
            "description": desc, "body": body, "hash": digest}


def yaml_string(value):
    return json.dumps(value, ensure_ascii=False)


def final_post(row, description, body, published):
    fm = [
        "---", "layout: post", f"title: {yaml_string(str(row['working_title']))}",
        f"date: {published.strftime('%Y-%m-%d %H:%M:%S %z')}",
        f"description: {yaml_string(description)}", 'author: "Motoopen"',
        f"matrix_id: {int(row['id'])}", f"primary_keyword: {yaml_string(str(row['primary_keyword']))}",
        f"hub_parent: {row['taxonomy']['parent_slug']}", f"hub_category: {row['taxonomy']['child_slug']}",
        "---", "",
    ]
    return "\n".join(fm) + body.strip() + "\n"


def planned_rows(doc):
    rows = [x for x in doc["items"] if str(x.get("status", "")).lower() == "planned"]
    return sorted(rows, key=lambda x: (PRIORITY.get(str(x.get("priority")), 9), int(x["id"])))


def cmd_next(limit):
    pending = incoming_files()
    if pending:
        print(json.dumps({"ok": False, "reason": "repair incoming drafts before new work",
                          "incoming": [str(p.relative_to(ROOT)) for p in pending]}, ensure_ascii=False, indent=2))
        return 2
    doc = load_matrix()
    queue = []
    for row in planned_rows(doc)[:max(1, min(limit, MAX_QUEUE))]:
        queue.append({"id": row["id"], "incoming_path": f"_factory/incoming/{int(row['id']):03d}.md",
                      "priority": row.get("priority"), "primary_keyword": row.get("primary_keyword"),
                      "title": row.get("working_title"), "unique_angle": row.get("unique_angle"),
                      "must_cover": row.get("must_cover"), "internal_links_to": row.get("internal_links_to"),
                      "validation_required": row.get("validation_required"), "taxonomy": row.get("taxonomy")})
    print(json.dumps({"ok": True, "count": len(queue), "queue": queue}, ensure_ascii=False, indent=2))
    return 0


def cmd_status():
    doc = load_matrix()
    counts = Counter(str(x.get("status", "planned")).lower() for x in doc["items"])
    pending = incoming_files()
    print(json.dumps({"article_count": len(doc["items"]), "status_counts": dict(sorted(counts.items())),
                      "incoming_count": len(pending), "incoming": [str(p.relative_to(ROOT)) for p in pending],
                      "complete": counts.get("planned", 0) == 0 and not pending}, ensure_ascii=False, indent=2))
    return 0


def resolve_row(path, rows):
    try:
        aid = int(path.stem)
    except ValueError:
        return None, f"{path.name}: filename must be numeric matrix id, e.g. 003.md"
    row = rows.get(aid)
    if row is None:
        return None, f"{path.name}: matrix id {aid} does not exist"
    return row, None


def cmd_check(paths):
    doc, hashes = load_matrix(), existing_hashes()
    rows, failures, reports = row_map(doc), 0, []
    for raw in paths:
        path = (ROOT / raw).resolve() if not pathlib.Path(raw).is_absolute() else pathlib.Path(raw)
        row, err = resolve_row(path, rows)
        if err:
            reports.append({"path": raw, "ok": False, "errors": [err]}); failures += 1; continue
        rep = validate_draft(path, row, hashes)
        reports.append({"path": raw, "id": row["id"], "ok": rep["ok"], "errors": rep["errors"],
                        "warnings": rep["warnings"], "word_count": rep["word_count"]})
        if rep["ok"]: hashes.add(rep["hash"])
        else: failures += 1
    print(json.dumps({"checked": len(reports), "failures": failures, "results": reports}, ensure_ascii=False, indent=2))
    return 1 if failures else 0


def cmd_publish(paths_file):
    started, doc = iso_now(), load_matrix()
    rows = row_map(doc)
    INCOMING.mkdir(parents=True, exist_ok=True); POSTS.mkdir(parents=True, exist_ok=True)
    selected = []
    for line in pathlib.Path(paths_file).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line: continue
        path = ROOT / line
        if path.is_file() and path.parent.resolve() == INCOMING.resolve() and path.suffix == ".md": selected.append(path)
    selected = list(dict.fromkeys(selected))
    if not selected:
        REPORT.write_text(json.dumps({"schema_version": 1, "started_at": started, "finished_at": iso_now(),
                                      "published": [], "recoverable": [], "fatal": None,
                                      "note": "no live incoming drafts selected"}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return 0
    if len(selected) > MAX_QUEUE:
        msg = f"queue has {len(selected)} drafts; max is {MAX_QUEUE}"
        REPORT.write_text(json.dumps({"schema_version": 1, "started_at": started, "finished_at": iso_now(),
                                      "published": [], "recoverable": [], "fatal": msg}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(msg, file=sys.stderr); return 1
    hashes, published, recoverable, pub_time = existing_hashes(), [], [], now_local()
    for path in selected:
        rel = str(path.relative_to(ROOT)); row, err = resolve_row(path, rows)
        if err: recoverable.append({"path": rel, "id": None, "errors": [err]}); continue
        if str(row.get("status", "")).lower() == "published":
            recoverable.append({"path": rel, "id": row["id"], "errors": ["matrix row already published"]}); continue
        rep = validate_draft(path, row, hashes)
        if not rep["ok"]:
            recoverable.append({"path": rel, "id": row["id"], "errors": rep["errors"],
                                "warnings": rep["warnings"], "word_count": rep["word_count"]}); continue
        final_path = POSTS / f"{pub_time.strftime('%Y-%m-%d')}-{row['slug']}.md"
        if final_path.exists():
            recoverable.append({"path": rel, "id": row["id"], "errors": [f"publish target exists: {final_path.relative_to(ROOT)}"]}); continue
        final_path.write_text(final_post(row, rep["description"], rep["body"], pub_time), encoding="utf-8")
        row["status"] = "published"; row["published_at"] = pub_time.isoformat(timespec="seconds")
        row["published_path"] = str(final_path.relative_to(ROOT)); row["published_url"] = f"/blog/{row['slug']}/"
        path.unlink(); hashes.add(rep["hash"])
        published.append({"id": row["id"], "source": rel, "post": str(final_path.relative_to(ROOT)),
                          "url": row["published_url"], "word_count": rep["word_count"], "warnings": rep["warnings"]})
    save_matrix(doc)
    report = {"schema_version": 1, "started_at": started, "finished_at": iso_now(), "selected_count": len(selected),
              "published_total": len(published), "published": published, "recoverable_total": len(recoverable),
              "recoverable": recoverable, "fatal": None, "status_counts": doc.get("status_counts", {})}
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2)); return 0


def main():
    parser = argparse.ArgumentParser(); sub = parser.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("next"); p.add_argument("--limit", type=int, default=DEFAULT_QUEUE)
    sub.add_parser("status")
    p = sub.add_parser("check"); p.add_argument("paths", nargs="+")
    p = sub.add_parser("publish"); p.add_argument("--paths-file", required=True)
    args = parser.parse_args()
    if args.cmd == "next": return cmd_next(args.limit)
    if args.cmd == "status": return cmd_status()
    if args.cmd == "check": return cmd_check(args.paths)
    if args.cmd == "publish": return cmd_publish(args.paths_file)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
