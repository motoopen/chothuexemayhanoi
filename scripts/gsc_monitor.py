#!/usr/bin/env python3
"""Search Console monitor for Motoopen (motoopen.github.io/chothuexemayhanoi).

Read-only. Needs no API key: it reads files you export from Google Search
Console (GSC) and flags what needs work:

  * keyword cannibalization (one query split across several of our URLs)
  * queries that land on a different URL than the one we assigned to them
  * striking-distance queries (average position 4-20)
  * CTR outliers, measured against this site's own CTR at the same positions
  * pages with impressions but 0 clicks
  * falling queries and pages (needs a comparison export or --previous)
  * sitemap URLs that got no impressions at all (inspect them in GSC)
  * duplicate search intents inside _seo/article-matrix-300.json (offline)

Inputs (use any combination):
  --export PATH      GSC "Performance > Export > Download CSV" (.zip or the
                     unzipped folder). Tables are recognised by their header,
                     English or Vietnamese UI: queries, pages, dates.
                     Export in "Compare" mode to get previous-period columns.
  --query-page CSV   Rows that carry BOTH a query and a page column (Search
                     Console API, Looker Studio, "Search Analytics for Sheets").
                     Cannibalization needs this file: the UI export never
                     pairs a query with its page.
  --previous PATH    An older export (.zip / folder / CSV) to compare against.
  --sitemap PATH|URL _site/sitemap.xml or the live sitemap URL.
  --matrix JSON      _seo/article-matrix-300.json (keyword -> intended URL).

Example:
  python3 scripts/gsc_monitor.py --export ~/Downloads/motoopen-perf.zip \
      --query-page ~/Downloads/query-page.csv \
      --sitemap https://motoopen.github.io/chothuexemayhanoi/sitemap.xml \
      --matrix _seo/article-matrix-300.json --out gsc-report.md

Every number in the report comes from the input files; nothing is estimated.
Low-traffic data is noisy: treat flags as review signals, not verdicts.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path
from urllib.parse import unquote, urlsplit

BASE = "https://motoopen.github.io/chothuexemayhanoi"

# Head terms owned by standalone pages. Exact (accent-insensitive) match only.
# Edit when a page's target changes; blog targets come from --matrix.
DEFAULT_TARGETS = {
    "/": ["thuê xe máy hà nội", "cho thuê xe máy hà nội", "thuê xe máy tháng hà nội", "motoopen"],
    "/banggia.html": ["bảng giá thuê xe máy hà nội", "giá thuê xe máy hà nội", "thuê xe máy hà nội giá bao nhiêu"],
    "/thutuc.html": ["thủ tục thuê xe máy hà nội", "thủ tục thuê xe máy"],
    "/lienhe.html": ["motoopen số điện thoại", "liên hệ motoopen"],
}

# Words that do not change intent when comparing keywords for duplicates.
INTENT_STOP = {"cho", "thue", "xe", "may", "ha", "noi", "o", "tai", "co", "khong", "can",
               "theo", "1", "mot", "va", "hay", "gi", "nao", "the", "nhu"}


# ---------------------------------------------------------------- helpers
def strip_accents(text: str) -> str:
    text = unicodedata.normalize("NFD", text.replace("đ", "d").replace("Đ", "D"))
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def norm_kw(text: str) -> str:
    return re.sub(r"\s+", " ", strip_accents(text.lower())).strip()


def intent_key(text: str) -> frozenset:
    words = re.findall(r"\w+", norm_kw(text).replace("tay ga", "ga"))
    return frozenset(w for w in words if w not in INTENT_STOP)


def norm_url(url: str, base: str = BASE) -> str:
    url = (url or "").strip()
    if not url:
        return ""
    if url.startswith("/"):
        url = base.rstrip("/") + url
    parts = urlsplit(url)
    path = unquote(parts.path) or "/"
    if path.endswith("/index.html"):
        path = path[: -len("index.html")]
    return f"https://{parts.netloc.lower()}{path}"


def to_int(raw: str) -> int:
    digits = re.sub(r"[^\d]", "", raw or "")
    return int(digits) if digits else 0


def to_float(raw: str) -> float | None:
    s = (raw or "").strip().replace("%", "").replace("\u00a0", "")
    if not s:
        return None
    if "," in s and "." not in s:
        s = s.replace(",", ".")
    s = s.replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None


def classify(header: str) -> str | None:
    h = norm_kw(header)
    if "click" in h or "nhap" in h:
        return "clicks"
    if "impression" in h or "hien thi" in h:
        return "impressions"
    if "ctr" in h:
        return "ctr"
    if "position" in h or "vi tri" in h:
        return "position"
    return None


def table_kind(header: str) -> str | None:
    h = norm_kw(header)
    if any(k in h for k in ("quer", "truy van", "cum tu", "tu khoa", "keyword")):
        return "query"
    if any(k in h for k in ("page", "trang", "url", "landing")):
        return "page"
    if h.startswith("date") or h.startswith("ngay"):
        return "date"
    return None


class Row(dict):
    """clicks, impressions, position (+ prev_*) for one key."""


def read_metric_table(rows: list[list[str]]):
    """GSC UI table: first column = dimension, then metric columns.
    In Compare mode each metric appears twice: current first, previous second."""
    header, body = rows[0], rows[1:]
    kind = table_kind(header[0])
    cols: dict[str, list[int]] = defaultdict(list)
    for i, h in enumerate(header[1:], start=1):
        m = classify(h)
        if m:
            cols[m].append(i)
    out: dict[str, Row] = {}
    for r in body:
        if not r or not r[0].strip():
            continue
        rec = Row()
        for metric, idxs in cols.items():
            for slot, idx in zip(("", "prev_"), idxs):
                val = r[idx] if idx < len(r) else ""
                rec[slot + metric] = to_int(val) if metric in ("clicks", "impressions") else to_float(val)
        out[r[0].strip()] = rec
    return kind, out


def read_csv_text(text: str) -> list[list[str]]:
    return [r for r in csv.reader(io.StringIO(text)) if r]


def load_export(path: Path) -> dict[str, dict[str, Row]]:
    """Return {'query': {...}, 'page': {...}, 'date': {...}} from zip, folder or one CSV."""
    texts = []
    if path.is_dir():
        texts = [p.read_text("utf-8-sig", errors="replace") for p in sorted(path.glob("*.csv"))]
    elif zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as z:
            texts = [z.read(n).decode("utf-8-sig", errors="replace") for n in z.namelist() if n.lower().endswith(".csv")]
    else:
        texts = [path.read_text("utf-8-sig", errors="replace")]
    tables: dict[str, dict[str, Row]] = {}
    for t in texts:
        rows = read_csv_text(t)
        if len(rows) < 2:
            continue
        kind, data = read_metric_table(rows)
        if kind and kind not in tables:
            tables[kind] = data
    return tables


def load_query_page(path: Path) -> list[dict]:
    rows = read_csv_text(path.read_text("utf-8-sig", errors="replace"))
    header = rows[0]
    qi = pi = None
    metric_idx: dict[str, int] = {}
    for i, h in enumerate(header):
        m = classify(h)  # metrics first: "Url Clicks" is a metric, not the page column
        if m:
            metric_idx.setdefault(m, i)
            continue
        k = table_kind(h)
        if k == "query" and qi is None:
            qi = i
        elif k == "page" and pi is None:
            pi = i
    if qi is None or pi is None or "impressions" not in metric_idx:
        sys.exit(f"{path}: need query, page and impressions columns; got {header}")
    agg: dict[tuple, dict] = defaultdict(lambda: {"clicks": 0, "impressions": 0, "pos_w": 0.0})
    for r in rows[1:]:
        if len(r) <= max(qi, pi):
            continue
        key = (r[qi].strip(), norm_url(r[pi]))
        imp = to_int(r[metric_idx["impressions"]])
        a = agg[key]
        a["clicks"] += to_int(r[metric_idx["clicks"]]) if "clicks" in metric_idx else 0
        a["impressions"] += imp
        pos = to_float(r[metric_idx["position"]]) if "position" in metric_idx else None
        if pos is not None:
            a["pos_w"] += pos * imp
    out = []
    for (q, p), a in agg.items():
        if a["impressions"] <= 0:
            continue
        out.append({"query": q, "page": p, "clicks": a["clicks"], "impressions": a["impressions"],
                    "position": round(a["pos_w"] / a["impressions"], 1) if a["pos_w"] else None})
    return out


def load_sitemap(src: str) -> list[str]:
    if re.match(r"https?://", src):
        with urllib.request.urlopen(src, timeout=30) as resp:
            data = resp.read()
    else:
        data = Path(src).read_bytes()
    root = ET.fromstring(data)
    return [norm_url(e.text) for e in root.iter() if e.tag.endswith("loc") and e.text]


def load_targets(matrix_path: str | None):
    """Exact keyword -> intended URL, intent key -> set of URLs, matrix rows."""
    targets: dict[str, str] = {}
    by_intent: dict[frozenset, set] = defaultdict(set)
    rows: list[dict] = []
    for url, kws in DEFAULT_TARGETS.items():
        for kw in kws:
            targets[norm_kw(kw)] = norm_url(url)
            by_intent[intent_key(kw)].add(norm_url(url))
    if matrix_path:
        data = json.loads(Path(matrix_path).read_text("utf-8"))
        for it in data.get("items", []):
            url = it.get("published_url")
            if not url or it.get("status") not in (None, "published"):
                continue
            rows.append(it)
            for kw in [it.get("primary_keyword", "")] + list(it.get("secondary_keywords") or []):
                if kw:
                    targets.setdefault(norm_kw(kw), norm_url(url))
                    by_intent[intent_key(kw)].add(norm_url(url))
    by_intent.pop(frozenset(), None)
    return targets, by_intent, rows


def ctr(c: int, i: int) -> float:
    return c / i if i else 0.0


def bucket(pos: float | None) -> str | None:
    if pos is None:
        return None
    for lo, hi, name in ((0, 3.5, "1-3"), (3.5, 6.5, "4-6"), (6.5, 10.5, "7-10"), (10.5, 20.5, "11-20")):
        if lo < pos <= hi:
            return name
    return None


def short(url: str) -> str:
    return url.replace(BASE, "") or "/"


def md_table(head: list[str], rows: list[list], limit: int) -> list[str]:
    if not rows:
        return ["_Không có mục nào._", ""]
    out = ["| " + " | ".join(head) + " |", "|" + "---|" * len(head)]
    for r in rows[:limit]:
        out.append("| " + " | ".join(str(x).replace("|", "/") for x in r) + " |")
    if len(rows) > limit:
        out.append(f"| … còn {len(rows) - limit} dòng | " + " | " * (len(head) - 1))
    return out + [""]


# ---------------------------------------------------------------- analyses
def analyse(args) -> tuple[list[str], dict]:
    export = load_export(Path(args.export)) if args.export else {}
    previous = load_export(Path(args.previous)) if args.previous else {}
    qp = load_query_page(Path(args.query_page)) if args.query_page else []
    targets, by_intent, matrix_rows = load_targets(args.matrix)
    queries = export.get("query", {})
    pages = export.get("page", {})
    for kind, prev in previous.items():  # merge an older export as prev_* columns
        cur = export.get(kind, {})
        for key, rec in prev.items():
            row = cur.setdefault(key, Row(clicks=0, impressions=0, position=None))
            row["prev_clicks"], row["prev_impressions"] = rec.get("clicks", 0), rec.get("impressions", 0)
            row["prev_position"] = rec.get("position")
    # Without a UI export, derive query and page totals from the query-page file.
    if qp and not queries:
        agg = defaultdict(lambda: Row(clicks=0, impressions=0, pos_w=0.0))
        for r in qp:
            a = agg[r["query"]]
            a["clicks"] += r["clicks"]; a["impressions"] += r["impressions"]
            a["pos_w"] += (r["position"] or 0) * r["impressions"]
        queries = {q: Row(clicks=a["clicks"], impressions=a["impressions"],
                          position=round(a["pos_w"] / a["impressions"], 1) if a["pos_w"] else None)
                   for q, a in agg.items()}
    if qp and not pages:
        agg = defaultdict(lambda: Row(clicks=0, impressions=0))
        for r in qp:
            agg[r["page"]]["clicks"] += r["clicks"]; agg[r["page"]]["impressions"] += r["impressions"]
        pages = dict(agg)
    pages = {norm_url(k): v for k, v in pages.items()}

    md = [f"# Báo cáo Search Console – Motoopen ({date.today().isoformat()})", "",
          "Nguồn: " + ", ".join(x for x in [args.export, args.query_page, args.previous, args.sitemap, args.matrix] if x),
          f"Ngưỡng: min_impr={args.min_impr}, vị trí striking={args.sd_min}-{args.sd_max}, "
          f"share cannibal={args.share:.0%}, CTR outlier < {args.ctr_ratio:.0%} CTR của chính site cùng vị trí.", ""]
    result: dict = {}

    # 1. Summary
    if queries:
        tc = sum(r.get("clicks", 0) for r in queries.values()); ti = sum(r.get("impressions", 0) for r in queries.values())
        md += ["## 1. Tổng quan (bảng truy vấn)", "",
               f"- Truy vấn: {len(queries)} · Click: {tc} · Hiển thị: {ti} · CTR: {ctr(tc, ti):.1%}",
               f"- Trang có hiển thị: {sum(1 for p in pages.values() if p.get('impressions', 0) > 0)}", "",
               "_GSC ẩn các truy vấn ẩn danh, nên tổng theo truy vấn thường thấp hơn tổng theo trang._", ""]

    # 2. Cannibalization (needs query+page)
    md += ["## 2. Keyword cannibalization (nhiều URL cùng nhận hiển thị cho 1 truy vấn)", ""]
    canni = []
    if qp:
        by_q = defaultdict(list)
        for r in qp:
            by_q[r["query"]].append(r)
        seen_sets = {}
        for q, rs in by_q.items():
            tot = sum(r["impressions"] for r in rs)
            if tot < args.min_impr:
                continue
            comp = [r for r in rs if r["impressions"] / tot >= args.share]
            if len(comp) < 2:
                continue
            comp.sort(key=lambda r: -r["impressions"])
            top20 = [r for r in comp if r["position"] and r["position"] <= 20]
            best = min((r["position"] for r in comp if r["position"]), default=None)
            sev = "cao" if len(top20) >= 2 and (best is None or best > 3) else "xem lại"
            key = frozenset(r["page"] for r in comp)
            item = {"query": q, "impressions": tot, "severity": sev,
                    "pages": [(short(r["page"]), r["impressions"], r["clicks"], r["position"]) for r in comp],
                    "intended": short(targets.get(norm_kw(q), "")) if targets.get(norm_kw(q)) else ""}
            if key in seen_sets:  # same page set: report once, count the rest
                seen_sets[key]["also"] += 1
                continue
            item["also"] = 0
            seen_sets[key] = item
            canni.append(item)
        canni.sort(key=lambda x: (x["severity"] != "cao", -x["impressions"]))
        md += md_table(["Truy vấn", "Hiển thị", "Mức", "URL (hiển thị/click/vị trí)", "URL dự kiến", "+truy vấn cùng nhóm URL"],
                       [[c["query"], c["impressions"], c["severity"],
                         "; ".join(f"{p} ({i}/{cl}/{pos})" for p, i, cl, pos in c["pages"]), c["intended"] or "–", c["also"]]
                        for c in canni], args.limit)
    else:
        md += ["_Cần --query-page (CSV có cả cột truy vấn và trang) để phát hiện cannibalization._", ""]
    result["cannibalization"] = canni

    # 3. Queries landing on an unintended URL
    md += ["## 3. Truy vấn đang vào sai URL so với kế hoạch (matrix / trang chính)", ""]
    wrong = []
    if qp:
        best_page = {}
        for r in qp:
            if r["query"] not in best_page or r["impressions"] > best_page[r["query"]]["impressions"]:
                best_page[r["query"]] = r
        for q, r in best_page.items():
            tgt = targets.get(norm_kw(q))
            if tgt:
                if r["page"] != tgt:
                    wrong.append([q, short(r["page"]), r["impressions"], r["position"], short(tgt), "khớp chính xác"])
                continue
            # No exact owner: fall back to the intent group. Several owners = planned overlap.
            owners = by_intent.get(intent_key(q), set())
            if owners and (r["page"] not in owners or len(owners) > 1):
                wrong.append([q, short(r["page"]), r["impressions"], r["position"],
                              ", ".join(sorted(short(u) for u in owners)),
                              f"cùng intent, {len(owners)} URL nhắm tới" if len(owners) > 1 else "cùng intent"])
        wrong.sort(key=lambda x: -x[2])
        md += md_table(["Truy vấn", "URL đang nhận nhiều hiển thị nhất", "Hiển thị", "Vị trí", "URL dự kiến", "Cách khớp"],
                       wrong, args.limit)
    else:
        md += ["_Cần --query-page._", ""]
    result["wrong_landing"] = wrong

    # 4. Striking distance
    md += [f"## 4. Striking distance (vị trí {args.sd_min}-{args.sd_max}, ≥{args.min_impr} hiển thị)", ""]
    sd = []
    src = qp if qp else [dict(query=q, page="", **r) for q, r in queries.items()]
    for r in src:
        pos = r.get("position")
        if pos and args.sd_min <= pos <= args.sd_max and r.get("impressions", 0) >= args.min_impr:
            sd.append([r["query"], short(r["page"]) if r.get("page") else "–", r["impressions"], r.get("clicks", 0),
                       f"{ctr(r.get('clicks', 0), r['impressions']):.1%}", pos])
    sd.sort(key=lambda x: (-x[2], x[5]))
    md += md_table(["Truy vấn", "URL", "Hiển thị", "Click", "CTR", "Vị trí"], sd, args.limit)
    result["striking_distance"] = sd

    # 5. CTR outliers vs the site's own CTR per position bucket
    md += ["## 5. CTR thấp bất thường (so với CTR của chính site ở cùng vị trí)", ""]
    pool = defaultdict(lambda: [0, 0])
    rows_for_ctr = [dict(query=q, **r) for q, r in queries.items()]
    for r in rows_for_ctr:
        b = bucket(r.get("position"))
        if b:
            pool[b][0] += r.get("clicks", 0); pool[b][1] += r.get("impressions", 0)
    ref = {b: ctr(c, i) for b, (c, i) in pool.items() if i >= args.min_bucket_impr}
    md.append("CTR tham chiếu: " + (", ".join(f"vị trí {b}: {v:.1%} ({pool[b][1]} hiển thị)" for b, v in sorted(ref.items()))
                                   or f"chưa đủ dữ liệu (mỗi nhóm vị trí cần ≥{args.min_bucket_impr} hiển thị)."))
    md.append("")
    low = []
    for r in rows_for_ctr:
        b = bucket(r.get("position"))
        if b in ref and r.get("impressions", 0) >= args.min_impr and ctr(r.get("clicks", 0), r["impressions"]) < args.ctr_ratio * ref[b]:
            low.append([r["query"], r["impressions"], r.get("clicks", 0), f"{ctr(r.get('clicks', 0), r['impressions']):.1%}",
                        f"{ref[b]:.1%}", r.get("position")])
    low.sort(key=lambda x: -x[1])
    md += md_table(["Truy vấn", "Hiển thị", "Click", "CTR", "CTR tham chiếu", "Vị trí"], low, args.limit)
    result["ctr_outliers"] = low

    # 6. Pages with impressions but 0 clicks
    md += [f"## 6. Trang có ≥{args.min_page_impr} hiển thị nhưng 0 click", ""]
    zero = sorted(([short(u), r.get("impressions", 0), r.get("position")] for u, r in pages.items()
                   if r.get("impressions", 0) >= args.min_page_impr and r.get("clicks", 0) == 0), key=lambda x: -x[1])
    md += md_table(["URL", "Hiển thị", "Vị trí TB"], zero, args.limit)
    result["zero_click_pages"] = zero

    # 7. Falling queries / pages
    md += ["## 7. Truy vấn / trang đang giảm (so với kỳ trước)", ""]
    falling = []
    for kind, table in (("truy vấn", queries), ("trang", pages)):
        for key, r in table.items():
            pc, pi = r.get("prev_clicks"), r.get("prev_impressions")
            if pi is None or pi < args.min_impr:
                continue
            ci, cc = r.get("impressions", 0), r.get("clicks", 0)
            if cc < (pc or 0) or ci <= pi * (1 - args.drop):
                pp, cp = r.get("prev_position"), r.get("position")
                falling.append([kind, short(key) if kind == "trang" else key, f"{pc}→{cc}", f"{pi}→{ci}",
                                f"{pp}→{cp}" if pp and cp else "–"])
    falling.sort(key=lambda x: -int(x[3].split("→")[0]))
    if not any(r.get("prev_impressions") is not None for t in (queries, pages) for r in t.values()):
        md += ["_Không có số liệu kỳ trước: xuất ở chế độ So sánh hoặc dùng --previous._", ""]
    else:
        md += md_table(["Loại", "Mục", "Click", "Hiển thị", "Vị trí"], falling, args.limit)
    result["falling"] = falling

    # 8. Sitemap URLs without impressions
    md += ["## 8. URL trong sitemap chưa có hiển thị nào", ""]
    missing = []
    if args.sitemap:
        locs = load_sitemap(args.sitemap)
        if pages:
            seen = {u for u, r in pages.items() if r.get("impressions", 0) > 0}
            missing = [short(u) for u in locs if u not in seen]
            groups = defaultdict(int)
            for u in missing:
                groups["blog/danh-muc" if "/blog/danh-muc/" in u else "blog post" if "/blog/" in u and u != "/blog/" else "trang chính"] += 1
            md += [f"- {len(missing)}/{len(locs)} URL chưa có hiển thị: " + ", ".join(f"{k}: {v}" for k, v in sorted(groups.items())),
                   "- Không có hiển thị ≠ chưa index. Kiểm tra bằng URL Inspection (ưu tiên trang chính trước).", ""]
            md += md_table(["URL"], [[u] for u in missing], args.limit)
        else:
            md += [f"_Sitemap có {len(locs)} URL; cần dữ liệu trang (--export hoặc --query-page) để so sánh._", ""]
    result["sitemap_without_impressions"] = missing

    # 9. Duplicate intents in the article matrix (offline)
    md += ["## 9. Trùng intent trong article matrix (không cần GSC)", ""]
    dup = []
    if matrix_rows:
        groups = defaultdict(list)
        for it in matrix_rows:
            k = intent_key(it.get("primary_keyword", ""))
            if k:
                groups[k].append(it)
        money = defaultdict(list)
        for url, kws in DEFAULT_TARGETS.items():
            for kw in kws:
                money[intent_key(kw)].append(url)
        for k, its in groups.items():
            owners = sorted(set(money.get(k, [])))
            if len(its) >= 2 or owners:
                dup.append([" + ".join(sorted(k)), len(its),
                            "; ".join(f"#{i['id']} {i['published_url']}" for i in its), ", ".join(owners) or "–"])
        dup.sort(key=lambda x: (-x[1], x[0]))
        md += ["Nhóm có cùng intent sau khi bỏ từ không đổi nghĩa (cho/thuê/xe/máy/Hà Nội/có/không/cần/theo/1…). "
               "Đây là tín hiệu để người viết xem lại, không phải kết luận: gộp bài trùng intent, giữ 1 URL mạnh.", ""]
        md += md_table(["Intent (token)", "Số bài", "Bài", "Trang chính trùng"], dup, max(args.limit, 60))
    else:
        md += ["_Thêm --matrix _seo/article-matrix-300.json để kiểm tra._", ""]
    result["matrix_duplicate_intents"] = dup
    return md, result


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--export"); ap.add_argument("--query-page"); ap.add_argument("--previous")
    ap.add_argument("--sitemap"); ap.add_argument("--matrix")
    ap.add_argument("--out"); ap.add_argument("--json")
    ap.add_argument("--min-impr", type=int, default=10, help="min impressions for a query/row to be judged")
    ap.add_argument("--min-page-impr", type=int, default=20, help="min impressions for the 0-click page list")
    ap.add_argument("--min-bucket-impr", type=int, default=200, help="impressions needed before a position bucket's CTR is used as reference")
    ap.add_argument("--sd-min", type=float, default=4); ap.add_argument("--sd-max", type=float, default=20)
    ap.add_argument("--share", type=float, default=0.10, help="min impression share for a URL to count in a cannibalized query")
    ap.add_argument("--ctr-ratio", type=float, default=0.5); ap.add_argument("--drop", type=float, default=0.5)
    ap.add_argument("--limit", type=int, default=40)
    args = ap.parse_args()
    if not any([args.export, args.query_page, args.matrix, args.sitemap]):
        ap.error("give at least one of --export, --query-page, --matrix, --sitemap")
    md, result = analyse(args)
    text = "\n".join(md) + "\n"
    if args.out:
        Path(args.out).write_text(text, "utf-8")
        print(f"Wrote {args.out}")
    else:
        sys.stdout.write(text)
    if args.json:
        Path(args.json).write_text(json.dumps(result, ensure_ascii=False, indent=2), "utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
