#!/usr/bin/env python3
"""Build the SEO master matrices from the repository sources and a built _site.

Outputs (repo root):
  MASTER-SEO-MATRIX.csv   one row per public URL (posts, static pages, categories, blog)
  KEYWORD-MATRIX.csv      keyword -> target URL map with cannibalization flags
  INTERNAL-LINK-MAP.csv   every contextual (in-content) internal link + hub-box links

Read-only with respect to the site: it never edits content or structured data.
Usage: python3 scripts/build_master_matrix.py _site
"""
from __future__ import annotations

import csv
import html
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
SITE = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
BASE = "https://motoopen.github.io/chothuexemayhanoi"

LIQUID_LINK = re.compile(r"\[([^\]]+)\]\(\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}(#[^)]*)?\)")
LD_RE = re.compile(r"<script[^>]*application/ld\+json[^>]*>(.*?)</script>", re.S | re.I)

STATIC_PAGES = {
    "/": ("homepage", "thuê xe máy tháng hà nội", "thuê xe máy theo tháng tại hà nội; cho thuê xe máy tháng giá rẻ; giá thuê xe máy 1 tháng; thuê xe máy dài hạn; thuê xe máy hà nội; thuê xe máy gần đây", "commercial-local", "P1", "pillar", "thue-xe-thang"),
    "/banggia.html": ("page", "bảng giá thuê xe máy hà nội", "giá thuê xe máy hà nội; giá thuê xe máy theo ngày tuần tháng; tiền cọc thuê xe máy", "commercial", "P1", "pillar", "gia-coc"),
    "/dichvu.html": ("page", "dịch vụ thuê xe máy hà nội", "gói thuê ngày tuần tháng; thuê xe máy dài hạn; thuê xe máy đi làm", "commercial", "P1", "pillar", "di-lam-dai-han"),
    "/loaixe.html": ("page", "các loại xe cho thuê hà nội", "thuê xe số; thuê xe tay ga; thuê xe 50cc; thuê xe điện", "commercial", "P1", "pillar", "xe-tay-ga"),
    "/thutuc.html": ("page", "thủ tục thuê xe máy hà nội", "giấy tờ thuê xe máy; đặt cọc thuê xe; hợp đồng thuê xe", "commercial-informational", "P1", "pillar", "thu-tuc-hop-dong"),
    "/huongdan.html": ("page", "hướng dẫn thuê xe máy hà nội", "quy trình thuê xe; nhận xe trả xe", "informational", "P2", "pillar", "kinh-nghiem"),
    "/kinhnghiem.html": ("page", "kinh nghiệm thuê xe máy hà nội", "kinh nghiệm đi xe máy hà nội; lịch trình", "informational", "P2", "pillar", "hanh-trinh"),
    "/faq.html": ("page", "câu hỏi thường gặp thuê xe máy hà nội", "faq thuê xe máy tháng; cọc; giấy tờ", "informational", "P2", "support", "thue-xe-thang"),
    "/lienhe.html": ("page", "liên hệ thuê xe máy hà nội", "địa chỉ thuê xe máy long biên; thuê xe máy gần đây; số điện thoại thuê xe", "navigational-local", "P1", "pillar", "khu-vuc"),
    "/gioithieu.html": ("page", "giới thiệu motoopen", "motoopen là ai; dịch vụ thuê xe máy long biên", "navigational", "P3", "trust", ""),
    "/mangxahoi.html": ("page", "mạng xã hội motoopen", "facebook motoopen; zalo motoopen", "navigational", "P3", "trust", ""),
    "/chinhsachbaomat.html": ("page", "chính sách bảo mật motoopen", "", "navigational", "P4", "legal", ""),
    "/dieukhoansudung.html": ("page", "điều khoản sử dụng motoopen", "", "navigational", "P4", "legal", ""),
    "/blog/": ("blog", "blog thuê xe máy hà nội", "kinh nghiệm thuê xe máy; cẩm nang thuê xe", "informational", "P2", "hub", ""),
}


def read_post(path: Path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n(.*)", text, re.S)
    return yaml.safe_load(m.group(1)), m.group(2)


def built_file(url: str) -> Path:
    rel = url.lstrip("/")
    if not rel or rel.endswith("/"):
        return SITE / rel / "index.html"
    return SITE / rel


def page_facts(url: str):
    f = built_file(url)
    if not f.exists():
        return {"exists": False}
    h = f.read_text(encoding="utf-8", errors="replace")
    canon = re.search(r'<link rel="canonical" href="([^"]+)"', h)
    robots = re.search(r'<meta name="robots" content="([^"]+)"', h)
    title = re.search(r"<title>(.*?)</title>", h, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', h)
    types = []
    for raw in LD_RE.findall(h):
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            types.append("INVALID")
            continue
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, dict):
                t = node.get("@type")
                if isinstance(t, str) and t not in ("ListItem", "Question", "Answer", "PostalAddress", "GeoCoordinates", "ImageObject", "Place", "Offer", "Person", "Rating", "Thing"):
                    types.append(t)
                stack.extend(node.values())
            elif isinstance(node, list):
                stack.extend(node)
    h1 = len(re.findall(r"<h1[\s>]", h))
    imgs = re.findall(r"<img\b[^>]*>", h)
    no_alt = sum(1 for i in imgs if not re.search(r'\salt="[^"]+"', i))
    faq_items = len(re.findall(r'class="faq-item', h))
    return {
        "exists": True,
        "canonical": canon.group(1) if canon else "",
        "robots": robots.group(1) if robots else "index,follow (default)",
        "title": html.unescape(title.group(1).strip()) if title else "",
        "desc": html.unescape(desc.group(1)) if desc else "",
        "schema": "; ".join(sorted(set(types))),
        "h1": h1,
        "img_no_alt": no_alt,
        "faq_visible": faq_items,
    }


def norm_kw(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").lower().strip())


def main():
    hubs = yaml.safe_load((ROOT / "_data/seo_hubs.yml").read_text(encoding="utf-8"))
    hub_by_key = {h["key"]: h for h in hubs["hubs"]}
    taxonomy = json.loads((ROOT / "_data/taxonomy.json").read_text(encoding="utf-8"))
    matrix = json.loads((ROOT / "_seo/article-matrix-300.json").read_text(encoding="utf-8"))
    by_slug = {it["slug"]: it for it in matrix["items"]}

    rows, links, kw_rows = [], [], []
    inbound = Counter()
    posts = []
    for path in sorted((ROOT / "_posts").glob("*.md")):
        fm, body = read_post(path)
        slug = re.sub(r"^\d{4}-\d\d-\d\d-|\.md$", "", path.name)
        url = f"/blog/{slug}/"
        posts.append((path, fm, body, slug, url))
        for para_no, para in enumerate(re.split(r"\n\s*\n", body), 1):
            for anchor, target, frag in LIQUID_LINK.findall(para):
                links.append((url, target, anchor, "content", para_no))
                inbound[target] += 1
        # template links actually rendered in the built page (hub box + related posts)
        built = built_file(url)
        if built.exists():
            h = built.read_text(encoding="utf-8", errors="replace")
            for cls, placement in (("hub-box", "hub-box"), ("blog-related", "related-posts")):
                m = re.search(r'<section class="blog-component ' + cls + r'[^"]*".*?</section>', h, re.S)
                if not m:
                    continue
                for href, anchor in re.findall(r'<a[^>]+href="/chothuexemayhanoi(/[^"#]*)"[^>]*>(.*?)</a>', m.group(0), re.S):
                    anchor = re.sub(r"<[^>]+>", " ", anchor)
                    anchor = html.unescape(re.sub(r"\s+", " ", anchor)).strip()
                    links.append((url, href, anchor, placement, 0))
                    if placement == "hub-box":
                        inbound[href] += 1

    # cannibalization: identical or near-identical primary keyword sets
    kw_owner = defaultdict(list)
    for path, fm, body, slug, url in posts:
        kw = norm_kw(fm.get("primary_keyword") or fm["title"])
        kw_owner[kw].append(url)
    for url, meta in STATIC_PAGES.items():
        kw_owner[norm_kw(meta[1])].append(url)

    def tokens(s):
        stop = {"hà", "nội", "thuê", "xe", "máy", "ở", "tại", "và", "cho", "khi", "có"}
        return {t for t in re.findall(r"\w+", s.lower()) if t not in stop}

    pillar_kw = tokens("thuê xe máy tháng hà nội theo tháng dài hạn 1 tháng")
    cannibal = {}
    for path, fm, body, slug, url in posts:
        kw = norm_kw(fm.get("primary_keyword") or "")
        t = tokens(kw)
        if kw and t and t <= pillar_kw and ("tháng" in kw or "dài hạn" in kw) and not any(x in kw for x in ("50cc", "điện", "ngày hay")):
            cannibal[url] = "Soft overlap with homepage pillar (thuê xe máy tháng); resolved: post kept as supporting angle (checklist/so sánh) + contextual link to pillar; no URL/title change"
        if len(kw_owner.get(kw, [])) > 1:
            cannibal[url] = "Duplicate primary keyword with " + ", ".join(u for u in kw_owner[kw] if u != url)

    for path, fm, body, slug, url in posts:
        facts = page_facts(url)
        item = by_slug.get(slug, {})
        hub = hub_by_key.get(fm.get("seo_hub"), {})
        content_links = sum(1 for l in links if l[0] == url and l[3] == "content")
        multi_para = sum(1 for c in Counter(l[4] for l in links if l[0] == url and l[3] == "content").values() if c > 1)
        faq_n = len(fm.get("qa") or [])
        issues = []
        if not facts.get("exists"):
            issues.append("not built")
        if facts.get("canonical") and facts["canonical"] != BASE + url:
            issues.append("canonical mismatch")
        if facts.get("h1", 1) != 1:
            issues.append(f"h1={facts.get('h1')}")
        if content_links > 8:
            issues.append(f"{content_links} content links (>8)")
        if multi_para:
            issues.append(f"{multi_para} paragraphs with >1 link")
        if not fm.get("description"):
            issues.append("no front-matter description (meta from excerpt)")
        if inbound[url] == 0:
            issues.append("no inbound link from post body or hub box")
        if url in cannibal:
            issues.append("cannibalization: " + cannibal[url])
        qa_ok = facts.get("exists") and facts.get("canonical") == BASE + url and facts.get("h1") == 1 and content_links <= 8 and not multi_para
        status = "optimized" if faq_n and fm.get("quick_answer") else "baseline"
        rows.append({
            "URL": BASE + url,
            "Loại trang": "post",
            "Tiêu đề": fm["title"],
            "Từ khóa chính": fm.get("primary_keyword", ""),
            "Từ khóa phụ": "; ".join(item.get("secondary_keywords") or []),
            "Search intent": item.get("intent", ""),
            "Hub": hub.get("label", ""),
            "Silo": f"{fm.get('hub_parent')}/{fm.get('hub_category')}",
            "Internal link (content out / inbound)": f"{content_links} / {inbound[url]}",
            "FAQ": faq_n,
            "Schema (read-only)": facts.get("schema", ""),
            "Canonical": facts.get("canonical", ""),
            "Indexability": facts.get("robots", ""),
            "Mức ưu tiên": "P1" if fm.get("seo_hub") in ("thue-xe-thang", "di-lam-dai-han", "sinh-vien", "gia-coc") else item.get("priority", "P3"),
            "Lỗi": " | ".join(issues),
            "Trạng thái": status,
            "Kết quả QA": "PASS" if qa_ok else "FAIL",
        })
        kw_rows.append({
            "Keyword": fm.get("primary_keyword") or fm["title"],
            "Target URL": BASE + url,
            "Role": "supporting",
            "Hub": hub.get("label", ""),
            "Pillar URL": BASE + hub.get("pillar_url", "/"),
            "Intent": item.get("intent", ""),
            "Secondary / semantic": "; ".join(item.get("secondary_keywords") or []),
            "Signal source": "; ".join(item.get("source_signal") or []),
            "Cannibalization": cannibal.get(url, ""),
        })

    for url, meta in STATIC_PAGES.items():
        facts = page_facts(url)
        hub = hub_by_key.get(meta[6], {})
        issues = []
        if facts.get("canonical") and facts["canonical"] != BASE + url:
            issues.append("canonical mismatch")
        if facts.get("h1", 1) != 1:
            issues.append(f"h1={facts.get('h1')}")
        rows.append({
            "URL": BASE + url,
            "Loại trang": meta[0],
            "Tiêu đề": facts.get("title", ""),
            "Từ khóa chính": meta[1],
            "Từ khóa phụ": meta[2],
            "Search intent": meta[3],
            "Hub": hub.get("label", "") if meta[5] != "pillar" else f"PILLAR: {hub.get('label', '')}",
            "Silo": meta[5],
            "Internal link (content out / inbound)": f"- / {inbound[url]}",
            "FAQ": facts.get("faq_visible", 0),
            "Schema (read-only)": facts.get("schema", ""),
            "Canonical": facts.get("canonical", ""),
            "Indexability": facts.get("robots", ""),
            "Mức ưu tiên": meta[4],
            "Lỗi": " | ".join(issues),
            "Trạng thái": "reviewed",
            "Kết quả QA": "PASS" if facts.get("exists") and facts.get("canonical") == BASE + url and facts.get("h1") == 1 else "FAIL",
        })
        if meta[1]:
            kw_rows.append({
                "Keyword": meta[1], "Target URL": BASE + url, "Role": meta[5], "Hub": hub.get("label", ""),
                "Pillar URL": BASE + url, "Intent": meta[3], "Secondary / semantic": meta[2],
                "Signal source": "GSC 2026-09/10" if url == "/" else "site architecture", "Cannibalization": "",
            })

    cat_urls = ["/blog/danh-muc/"] + [p["url"] for p in taxonomy["parents"]] + [c["url"] for p in taxonomy["parents"] for c in p["children"]]
    for url in cat_urls:
        facts = page_facts(url)
        n_posts = len(re.findall(r'class="blog-item"', built_file(url).read_text(encoding="utf-8"))) if facts.get("exists") else 0
        rows.append({
            "URL": BASE + url, "Loại trang": "category", "Tiêu đề": facts.get("title", ""),
            "Từ khóa chính": "", "Từ khóa phụ": "", "Search intent": "informational-navigational",
            "Hub": "", "Silo": "SEO hub" if url.count("/") <= 4 else "silo",
            "Internal link (content out / inbound)": f"{n_posts} listed / {inbound[url]}",
            "FAQ": 0, "Schema (read-only)": facts.get("schema", ""), "Canonical": facts.get("canonical", ""),
            "Indexability": facts.get("robots", ""), "Mức ưu tiên": "P2", "Lỗi": "" if facts.get("h1") == 1 else f"h1={facts.get('h1')}",
            "Trạng thái": "reviewed",
            "Kết quả QA": "PASS" if facts.get("exists") and facts.get("canonical") == BASE + url and facts.get("h1") == 1 else "FAIL",
        })

    with open(ROOT / "MASTER-SEO-MATRIX.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    with open(ROOT / "KEYWORD-MATRIX.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=list(kw_rows[0].keys()))
        w.writeheader()
        w.writerows(kw_rows)
    with open(ROOT / "INTERNAL-LINK-MAP.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow(["Source URL", "Target URL", "Anchor", "Placement", "Paragraph #"])
        for s, t, a, p, n in links:
            w.writerow([BASE + s, BASE + t, a, p, n])

    qa = Counter(r["Kết quả QA"] for r in rows)
    print(f"matrix: {len(rows)} URLs ({qa['PASS']} PASS / {qa['FAIL']} FAIL); {len(kw_rows)} keywords; {len(links)} links; {len(cannibal)} cannibalization flags")


if __name__ == "__main__":
    main()
