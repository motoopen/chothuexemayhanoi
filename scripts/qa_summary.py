#!/usr/bin/env python3
"""Print campaign QA numbers from the repo + a built _site (used for QA-REPORT.md)."""
import csv, glob, re, sys, collections, yaml
site = sys.argv[1] if len(sys.argv) > 1 else "_site"
posts = sorted(glob.glob("_posts/*.md"))
qa_posts = qn = links_home = notice = 0
for f in posts:
    t = open(f, encoding="utf-8").read()
    fm = yaml.safe_load(re.match(r"---\n(.*?)\n---\n", t, re.S).group(1))
    body = t.split("\n---\n", 1)[1]
    if fm.get("quick_answer") and fm.get("qa"):
        qa_posts += 1; qn += len(fm["qa"])
    if "({{ '/' | relative_url }})" in body: links_home += 1
    if fm.get("blog_notice"): notice += 1
rows = list(csv.DictReader(open("MASTER-SEO-MATRIX.csv", encoding="utf-8-sig")))
by_type = collections.Counter(r["Loại trang"] for r in rows)
qa = collections.Counter(r["Kết quả QA"] for r in rows)
print(f"URLs in matrix: {len(rows)} {dict(by_type)}")
print(f"QA PASS {qa['PASS']} / FAIL {qa['FAIL']}")
print(f"posts with quick answer + FAQ: {qa_posts}/{len(posts)}; FAQ items: {qn}")
print(f"posts linking homepage pillar in body: {links_home}; posts with legal notice: {notice}")
