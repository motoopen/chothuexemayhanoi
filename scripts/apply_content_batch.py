#!/usr/bin/env python3
"""Validate and apply an additive content batch (quick answer + visible FAQ + one link paragraph).

Input JSON shape (one batch):
  {"batch": "B01", "posts": [{"file": "_posts/x.md", "quick_answer": "...",
     "qa": [{"q": "...", "a": "..."}], "link_paragraph": {"text": "...", "insert_before": "## ..."} | null}]}

Guarantees (a post failing any check is skipped and reported, never half-applied):
- additive only: every original body line is still present after the edit;
- front matter gains `quick_answer` and `qa` only (never `faq`, which would emit FAQPage JSON-LD);
- no links/markdown/URLs in quick answer or FAQ; 3-8 FAQ items; no duplicate questions site-wide;
- numbers must come from the business facts sheet or already appear in the post body;
- link paragraph: exactly one internal link to an allowed, not-yet-linked target, body total <= 8.

Usage: python3 scripts/apply_content_batch.py batch.json [--dry-run]
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINK = re.compile(r"\[([^\]]+)\]\(\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}\)")
ALLOWED_TARGETS = {"/", "/banggia.html", "/thutuc.html", "/loaixe.html", "/huongdan.html", "/kinhnghiem.html", "/lienhe.html", "/dichvu.html", "/faq.html"}
FACT_NUMBERS = {"114", "0857", "255", "868", "0857 255 868", "09:00", "21:00", "1.200k", "1.000k", "1.400k", "1.800k",
                "2.000k", "150k", "200k", "20k", "50k", "1–2", "1-2", "50cc", "50", "A1", "24", "30", "7"}
BAD_TEXT = re.compile(r"(\]\(|https?://|www\.|\{\{|\*\*|__|<a\s|#)")


def norm(s: str) -> str:
    s = unicodedata.normalize("NFC", s.lower())
    return re.sub(r"[^\w]+", " ", s).strip()


def split_post(text: str):
    m = re.match(r"---\n(.*?)\n---\n(.*)", text, re.S)
    if not m:
        raise ValueError("no front matter")
    return m.group(1), m.group(2)


def numbers_in(s: str):
    return re.findall(r"\d[\d.,:]*\s?(?:k|K|triệu|cc|km|%)?", s)


def check_numbers(text: str, body: str) -> list[str]:
    bad = []
    for tok in numbers_in(text):
        t = tok.strip()
        core = re.match(r"\d[\d.,:]*", t).group(0).rstrip(".,:")
        if t in FACT_NUMBERS or core in FACT_NUMBERS or core in body or t in body:
            continue
        try:
            if float(core.replace(".", "").replace(",", ".")) <= 10:
                continue
        except ValueError:
            pass
        bad.append(t)
    return bad


def existing_questions(skip_files: set[str]) -> dict[str, str]:
    seen = {}
    for p in sorted((ROOT / "_posts").glob("*.md")):
        rel = p.relative_to(ROOT).as_posix()
        if rel in skip_files:
            continue
        fm, _ = split_post(p.read_text(encoding="utf-8"))
        for q in re.findall(r'^\s*- q: "(.*)"$', fm, re.M):
            seen[norm(json.loads('"' + q + '"'))] = rel
    return seen


def validate(item: dict, seen_q: dict) -> tuple[list[str], str | None]:
    errs = []
    path = ROOT / item.get("file", "")
    if not path.is_file():
        return [f"missing file {item.get('file')}"], None
    text = path.read_text(encoding="utf-8")
    fm, body = split_post(text)
    if re.search(r"^(qa|quick_answer|faq):", fm, re.M):
        errs.append("post already has qa/quick_answer/faq")
    qa_text = (item.get("quick_answer") or "").strip()
    words = len(qa_text.split())
    if not 15 <= words <= 95:
        errs.append(f"quick_answer length {words} words")
    if BAD_TEXT.search(qa_text):
        errs.append("quick_answer contains link/markdown")
    bad = check_numbers(qa_text, body)
    if bad:
        errs.append(f"quick_answer unverified numbers {bad}")
    qa = item.get("qa") or []
    if not 3 <= len(qa) <= 8:
        errs.append(f"qa count {len(qa)}")
    local = set()
    for i, pair in enumerate(qa):
        q, a = (pair.get("q") or "").strip(), (pair.get("a") or "").strip()
        if not q.endswith("?"):
            errs.append(f"q{i+1} not a question")
        aw = len(a.split())
        if not 8 <= aw <= 95:
            errs.append(f"a{i+1} length {aw}")
        if BAD_TEXT.search(q) or BAD_TEXT.search(a):
            errs.append(f"qa{i+1} contains link/markdown")
        bad = check_numbers(q + " " + a, body)
        if bad:
            errs.append(f"qa{i+1} unverified numbers {bad}")
        k = norm(q)
        if k in local or k in seen_q:
            errs.append(f"duplicate question: {q} (also in {seen_q.get(k, 'this post')})")
        local.add(k)
    lp = item.get("link_paragraph")
    new_body = body
    if lp:
        t = (lp.get("text") or "").strip()
        links = LINK.findall(t)
        current = LINK.findall(body)
        targets = {u for _, u in current}
        if len(links) != 1 or t.count("](") != 1:
            errs.append("link_paragraph must contain exactly one link")
        elif links[0][1] not in ALLOWED_TARGETS:
            errs.append(f"link target not allowed {links[0][1]}")
        elif links[0][1] in targets:
            errs.append(f"link target already linked {links[0][1]}")
        if len(current) + 1 > 8:
            errs.append("body would exceed 8 internal links")
        bad = check_numbers(LINK.sub(r"\1", t), body)
        if bad:
            errs.append(f"link_paragraph unverified numbers {bad}")
        anchor = lp.get("insert_before") or "END"
        if anchor == "END":
            new_body = body.rstrip("\n") + "\n\n" + t + "\n"
        else:
            lines = body.split("\n")
            idx = [i for i, line in enumerate(lines) if line.strip() == anchor.strip()]
            if len(idx) != 1:
                errs.append(f"insert_before heading not found exactly once: {anchor}")
            else:
                i = idx[0]
                lines[i:i] = [t, ""]
                new_body = "\n".join(lines)
        # additive guarantee
        old_lines = [ln for ln in body.split("\n") if ln.strip()]
        if any(ln not in new_body for ln in old_lines):
            errs.append("edit is not additive")
    if errs:
        return errs, None

    def ystr(s: str) -> str:
        return json.dumps(s, ensure_ascii=False)

    add = ["quick_answer: " + ystr(qa_text), "qa:"]
    for pair in qa:
        add.append('  - q: ' + ystr(pair["q"].strip()))
        add.append('    a: ' + ystr(pair["a"].strip()))
    new_text = "---\n" + fm.rstrip("\n") + "\n" + "\n".join(add) + "\n---\n" + new_body
    for pair in qa:
        seen_q[norm(pair["q"])] = item["file"]
    return [], new_text


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    batch = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    dry = "--dry-run" in argv
    files = {p.get("file") for p in batch["posts"]}
    seen_q = existing_questions(files)
    ok, failed = 0, []
    for item in batch["posts"]:
        errs, new_text = validate(item, seen_q)
        if errs:
            failed.append((item.get("file"), errs))
            continue
        ok += 1
        if not dry:
            (ROOT / item["file"]).write_text(new_text, encoding="utf-8")
    print(f"{batch.get('batch')}: {ok} applied{' (dry run)' if dry else ''}, {len(failed)} rejected")
    for f, errs in failed:
        print(f"  REJECT {f}: " + "; ".join(errs))
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
