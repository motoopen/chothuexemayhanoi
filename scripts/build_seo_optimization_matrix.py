#!/usr/bin/env python3
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
SOURCE_MATRIX = ROOT / "_seo" / "article-matrix-300.json"
EXTERNAL_DATA = ROOT / "_seo" / "external-seo-data.json"
SITE_ROOT = ROOT / "_site"
OUT_JSON = ROOT / "seo-optimization-matrix.json"
OUT_MD = ROOT / "seo-optimization-matrix.md"
SITE_BASE = "https://motoopen.github.io/chothuexemayhanoi"
BASEURL = "/chothuexemayhanoi"

GENERIC_TOKENS = {
    "thue", "xe", "may", "ha", "noi", "o", "cho", "va", "theo", "khi",
    "co", "can", "khong", "cach", "nen", "gi", "la", "de", "tu", "mot",
}

def strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value

def parse_front_matter(text: str):
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, text
    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        return {}, text
    fields = {}
    for line in lines[1:end]:
        if not line or line[0].isspace() or ":" not in line:
            continue
        key, value = line.split(":", 1)
        fields[key.strip()] = strip_quotes(value)
    return fields, "\n".join(lines[end + 1:]).strip()

def normalize_text(value: str) -> str:
    value = value.replace("đ", "d").replace("Đ", "D")
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()

def tokens(value: str, drop_generic: bool = False):
    result = set(normalize_text(value).split())
    if drop_generic:
        result -= GENERIC_TOKENS
    return result

def jaccard(a, b) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)

def keyword_similarity(a: str, b: str) -> float:
    full = jaccard(tokens(a), tokens(b))
    core_a, core_b = tokens(a, True), tokens(b, True)
    core = jaccard(core_a, core_b)
    if len(core_a & core_b) < 1:
        core = 0.0
    return round(max(full, core), 4)

def markdown_word_count(body: str) -> int:
    body = re.sub(r"\{\{.*?\}\}", " ", body, flags=re.S)
    body = re.sub(r"\[[^\]]+\]\([^)]+\)", " ", body)
    body = re.sub(r"https?://\S+", " ", body)
    return len(re.findall(r"[A-Za-zÀ-ỹ0-9]+", body))

def normalize_path(url: str):
    if not url:
        return None
    url = url.strip()
    if url.startswith("http://") or url.startswith("https://"):
        if not url.startswith(SITE_BASE):
            return None
        url = url[len(SITE_BASE):] or "/"
    if url.startswith(BASEURL):
        url = url[len(BASEURL):] or "/"
    url = url.split("#", 1)[0].split("?", 1)[0]
    if not url.startswith("/"):
        return None
    if url.endswith("index.html"):
        url = url[:-10]
    if url.endswith(".html"):
        return url
    if "." not in url.rsplit("/", 1)[-1] and not url.endswith("/"):
        url += "/"
    return url

LIQUID_LINK_RE = re.compile(r"\{\{\s*['\"](/[^'\"]+)['\"]\s*\|\s*relative_url\s*\}\}")
MARKDOWN_ROOT_LINK_RE = re.compile(r"\]\(\s*(/[^)\s]+)\s*\)")

def source_links(body: str):
    links = []
    for regex in (LIQUID_LINK_RE, MARKDOWN_ROOT_LINK_RE):
        for match in regex.finditer(body):
            path = normalize_path(match.group(1))
            if path:
                links.append(path)
    return links

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = 0
        self.title = ""
        self._in_title = False
        self.meta = {}
        self.canonical = None
        self.hrefs = []
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
        elif tag == "link":
            rel = data.get("rel", "")
            if rel == "canonical" or (isinstance(rel, str) and "canonical" in rel.split()):
                self.canonical = data.get("href")
        elif tag == "a":
            href = data.get("href")
            if href:
                self.hrefs.append(href)
        elif tag == "script" and data.get("type") == "application/ld+json":
            self._schema = True
            self._schema_buf = []

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._schema:
            raw = "".join(self._schema_buf).strip()
            if raw:
                try:
                    data = json.loads(raw)
                    if isinstance(data, dict) and data.get("@type"):
                        self.schemas.append(str(data["@type"]))
                except json.JSONDecodeError:
                    self.schemas.append("INVALID_JSON_LD")
            self._schema = False
            self._schema_buf = []

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._schema:
            self._schema_buf.append(data)

def page_url_from_file(path: Path):
    rel = path.relative_to(SITE_ROOT).as_posix()
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[:-10]
    return "/" + rel

def parse_page(path: Path):
    parser = PageParser()
    parser.feed(path.read_text("utf-8", errors="replace"))
    return parser

def best_gsc_matches(items, opportunities):
    matches = defaultdict(list)
    unmapped = []
    for opp in opportunities:
        query = opp.get("query") or ""
        best = None
        for row in items:
            score = keyword_similarity(query, row["primary_keyword"])
            if best is None or score > best[0]:
                best = (score, row["id"], row["url"])
        if best and best[0] >= 0.78:
            matches[best[1]].append({
                "query": query,
                "type": opp.get("type"),
                "observed_page": opp.get("page"),
                "current": opp.get("current"),
                "previous": opp.get("previous"),
                "changes": opp.get("changes"),
                "recommended_action": opp.get("recommended_action"),
                "match_score": best[0],
                "matched_article_url": best[2],
                "attribution_note": "Keyword-match candidate only; Search Console observed the page shown in observed_page.",
            })
        else:
            unmapped.append(opp)
    return matches, unmapped

def main():
    source = json.loads(SOURCE_MATRIX.read_text("utf-8"))
    external = json.loads(EXTERNAL_DATA.read_text("utf-8")) if EXTERNAL_DATA.exists() else {}
    source_items = source.get("items", [])
    if len(source_items) != 300:
        raise SystemExit(f"Expected 300 canonical matrix items, got {len(source_items)}")
    if not SITE_ROOT.exists():
        raise SystemExit("_site is missing; build Jekyll before generating the optimization matrix.")

    rows = []
    by_url = {}
    by_keyword = defaultdict(list)
    by_slug = defaultdict(list)

    for item in source_items:
        url = item.get("published_url") or item.get("existing_url") or f"/blog/{item['slug']}/"
        published_path = item.get("published_path")
        if published_path:
            post_path = ROOT / published_path
        else:
            url_slug = url.rstrip("/").split("/")[-1]
            matches = sorted((ROOT / "_posts").glob(f"*-{url_slug}.md"))
            if len(matches) != 1:
                raise SystemExit(
                    f"Could not resolve exactly one source post for matrix id {item['id']} "
                    f"from existing URL {url!r}; matches={len(matches)}"
                )
            post_path = matches[0]
            published_path = str(post_path.relative_to(ROOT))
        if not post_path.exists():
            raise SystemExit(f"Published source missing: {post_path.relative_to(ROOT)}")
        raw = post_path.read_text("utf-8")
        front, body = parse_front_matter(raw)
        render_slug = url.rstrip("/").split("/")[-1]
        row = {
            "id": item["id"],
            "url": url,
            "source_path": published_path,
            "slug": render_slug,
            "matrix_slug": item["slug"],
            "primary_keyword": item.get("primary_keyword", ""),
            "search_intent": item.get("intent"),
            "cluster": item.get("cluster"),
            "article_type": item.get("article_type"),
            "original_matrix_priority": item.get("priority"),
            "hub": {
                "parent_slug": front.get("hub_parent") or item.get("taxonomy", {}).get("parent_slug"),
                "parent_label": item.get("taxonomy", {}).get("parent_label"),
                "category_slug": front.get("hub_category") or item.get("taxonomy", {}).get("child_slug"),
                "category_label": item.get("taxonomy", {}).get("child_label"),
            },
            "title": front.get("title") or item.get("working_title", ""),
            "meta_description": front.get("description", ""),
            "word_count": markdown_word_count(body),
            "_body": body,
            "_front": front,
        }
        rows.append(row)
        by_url[url] = row
        by_keyword[normalize_text(row["primary_keyword"])].append(row["id"])
        by_slug[row["slug"]].append(row["id"])

    rendered = {}
    inbound = defaultdict(set)
    all_html = list(SITE_ROOT.rglob("*.html"))
    post_urls = set(by_url)

    for html_path in all_html:
        parsed = parse_page(html_path)
        source_url = page_url_from_file(html_path)
        for href in parsed.hrefs:
            target = normalize_path(href)
            if target in post_urls and target != source_url:
                inbound[target].add(source_url)

    for row in rows:
        page_path = SITE_ROOT / "blog" / row["slug"] / "index.html"
        if page_path.exists():
            p = parse_page(page_path)
            rendered[row["url"]] = {
                "exists": True,
                "h1_count": p.h1,
                "title": re.sub(r"\s+", " ", p.title).strip(),
                "og_title": re.sub(r"\s+", " ", p.meta.get("og:title", "")).strip(),
                "meta_description": p.meta.get("description", "").strip(),
                "canonical": p.canonical,
                "schema_types": sorted(set(p.schemas)),
            }
        else:
            rendered[row["url"]] = {"exists": False}

    pair_candidates = defaultdict(list)
    unique_pairs = []
    for i, left in enumerate(rows):
        for right in rows[i + 1:]:
            score = keyword_similarity(left["primary_keyword"], right["primary_keyword"])
            same_cluster = left["cluster"] == right["cluster"]
            same_category = left["hub"]["category_slug"] == right["hub"]["category_slug"]
            if score >= 0.74 and (same_cluster or same_category):
                pair = {
                    "left_id": left["id"],
                    "left_url": left["url"],
                    "left_keyword": left["primary_keyword"],
                    "right_id": right["id"],
                    "right_url": right["url"],
                    "right_keyword": right["primary_keyword"],
                    "score": score,
                    "same_cluster": same_cluster,
                    "same_category": same_category,
                    "classification": "high" if score >= 0.88 else "review",
                }
                unique_pairs.append(pair)
                pair_candidates[left["id"]].append(pair)
                pair_candidates[right["id"]].append(pair)

    gsc_opps = external.get("gsc", {}).get("opportunities", [])
    gsc_matches, gsc_unmapped = best_gsc_matches(rows, gsc_opps)

    for row in rows:
        render = rendered[row["url"]]
        source_out = source_links(row["_body"])
        source_blog_out = sorted(set(x for x in source_out if x.startswith("/blog/")))
        source_static_out = sorted(set(x for x in source_out if not x.startswith("/blog/")))
        schema_types = render.get("schema_types", [])
        expected_canonical = SITE_BASE + row["url"]
        issues = []
        content_gap = []
        meta_advisories = []

        exact_kw_dupes = by_keyword[normalize_text(row["primary_keyword"])]
        slug_dupes = by_slug[row["slug"]]

        if len(exact_kw_dupes) > 1:
            issues.append("duplicate_primary_keyword")
        if len(slug_dupes) > 1:
            issues.append("duplicate_slug_or_url")
        if not render.get("exists"):
            issues.append("rendered_page_missing")
        else:
            if render.get("h1_count") != 1:
                issues.append("invalid_h1_count")
            if render.get("canonical") != expected_canonical:
                issues.append("canonical_mismatch")
            for required in ("Article", "BreadcrumbList"):
                if required not in schema_types:
                    issues.append(f"missing_{required.lower()}_schema")

        title_len = len(row["title"])
        desc_len = len(row["meta_description"])
        if title_len < 30:
            meta_advisories.append(f"title_short:{title_len}")
        elif title_len > 75:
            meta_advisories.append(f"title_long:{title_len}")
        if desc_len < 70:
            meta_advisories.append(f"meta_description_short:{desc_len}")
        elif desc_len > 170:
            meta_advisories.append(f"meta_description_long:{desc_len}")

        if row["word_count"] < 650:
            content_gap.append(f"below_existing_factory_minimum:{row['word_count']}")
        primary_tokens = tokens(row["primary_keyword"], True)
        content_tokens = tokens(row["title"] + " " + row["_body"], True)
        if primary_tokens:
            coverage = len(primary_tokens & content_tokens) / len(primary_tokens)
        else:
            coverage = 1.0
        if coverage < 0.75:
            content_gap.append(f"primary_keyword_token_coverage:{coverage:.2f}")

        inbound_sources = sorted(inbound.get(row["url"], set()))
        orphan = len(inbound_sources) == 0

        candidates = sorted(
            pair_candidates.get(row["id"], []),
            key=lambda x: (-x["score"], x["left_id"], x["right_id"])
        )[:5]
        strong_overlap = any(x["score"] >= 0.88 for x in candidates)

        row_gsc = gsc_matches.get(row["id"], [])
        specific_gsc_mismatch = any(
            s.get("match_score", 0) >= 0.88
            and s.get("observed_page")
            and not s["observed_page"].rstrip("/").endswith(row["url"].rstrip("/"))
            for s in row_gsc
        )

        if "duplicate_slug_or_url" in issues:
            priority, action = "P0", "REDIRECT"
        elif "duplicate_primary_keyword" in issues:
            priority, action = "P0", "MERGE"
        elif issues:
            priority, action = "P0", "UPDATE"
        elif orphan:
            priority, action = "P1", "INTERNAL-LINK"
        elif strong_overlap:
            priority, action = "P1", "UPDATE"
        elif any(x.startswith("below_existing_factory_minimum") for x in content_gap):
            priority, action = "P1", "UPDATE"
        elif specific_gsc_mismatch:
            priority, action = "P1", "INTERNAL-LINK"
        elif content_gap:
            priority, action = "P1", "UPDATE"
        elif meta_advisories:
            priority, action = "P2", "META-ONLY"
        else:
            priority, action = "P2", "KEEP"

        reasons = []
        if issues:
            reasons.extend(issues)
        if orphan:
            reasons.append("no_rendered_inbound_internal_links")
        if strong_overlap:
            reasons.append("high_repo_keyword_overlap_candidate")
        if content_gap:
            reasons.extend(content_gap)
        if specific_gsc_mismatch:
            reasons.append("gsc_query_matches_article_but_currently_lands_elsewhere")
        if meta_advisories:
            reasons.extend(meta_advisories)
        if not reasons:
            reasons.append("technical_and_onpage_checks_pass")

        row.update({
            "internal_links": {
                "source_outbound_total": len(set(source_out)),
                "source_outbound_blog_count": len(source_blog_out),
                "source_outbound_blog": source_blog_out,
                "source_outbound_static": source_static_out,
                "rendered_inbound_count": len(inbound_sources),
                "rendered_inbound_sample": inbound_sources[:20],
                "orphan": orphan,
            },
            "title_meta": {
                "source_title_length": title_len,
                "source_meta_description_length": desc_len,
                "rendered_title": render.get("title"),
                "rendered_meta_description": render.get("meta_description"),
                "advisories": meta_advisories,
            },
            "schema": {
                "types": schema_types,
                "article": "Article" in schema_types,
                "breadcrumb": "BreadcrumbList" in schema_types,
            },
            "canonical": {
                "expected": expected_canonical,
                "rendered": render.get("canonical"),
                "ok": render.get("canonical") == expected_canonical,
            },
            "cannibalization": {
                "exact_primary_keyword_duplicate_ids": exact_kw_dupes if len(exact_kw_dupes) > 1 else [],
                "overlap_candidates": candidates,
                "risk": "high" if strong_overlap else ("review" if candidates else "none"),
                "note": "Repo overlap is a lexical heuristic, not proof that Google is cannibalizing the pages.",
            },
            "duplicate_intent": {
                "intent": row["search_intent"],
                "overlap_candidate_count": len(candidates),
                "note": "Sharing an intent label is not itself treated as duplication; keyword/topic overlap is required.",
            },
            "content_gap": content_gap,
            "gsc_signals": row_gsc,
            "external_metrics": {
                "ubersuggest_search_volume": None,
                "ubersuggest_ranking": None,
                "ubersuggest_traffic": None,
                "note": external.get("ubersuggest", {}).get("note"),
            },
            "optimization_priority": priority,
            "recommended_action": action,
            "reasons": reasons,
        })
        row.pop("_body", None)
        row.pop("_front", None)

    priority_counts = Counter(r["optimization_priority"] for r in rows)
    action_counts = Counter(r["recommended_action"] for r in rows)
    orphan_count = sum(1 for r in rows if r["internal_links"]["orphan"])
    p0 = [r for r in rows if r["optimization_priority"] == "P0"]
    unique_pairs.sort(key=lambda x: (-x["score"], x["left_id"], x["right_id"]))

    output = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "role": "seo_optimization_matrix",
        "target_site": external.get("target_site", SITE_BASE + "/"),
        "scope": {
            "canonical_articles": 300,
            "new_articles_created": 0,
            "urls_changed": 0,
            "articles_deleted": 0,
            "source_matrix": str(SOURCE_MATRIX.relative_to(ROOT)),
            "rendered_site_used": True,
        },
        "methodology": {
            "facts": [
                "Front matter, body links, taxonomy and canonical article metadata come from the repository.",
                "Rendered inbound links, H1, canonical, meta and JSON-LD schema are read from the current Jekyll build.",
                "Google Search Console signals come from the connected property snapshot in _seo/external-seo-data.json.",
            ],
            "heuristics": [
                "Cannibalization overlap candidates use normalized keyword token similarity inside the same cluster/category.",
                "A lexical overlap flag is a review signal, not proof of search cannibalization.",
                "GSC query-to-article matches are keyword-match candidates unless Search Console observed that article as the landing page.",
            ],
            "no_fabrication": True,
        },
        "external_data": external,
        "summary": {
            "priority_counts": dict(sorted(priority_counts.items())),
            "action_counts": dict(sorted(action_counts.items())),
            "orphan_count": orphan_count,
            "p0_count": len(p0),
            "overlap_pair_count": len(unique_pairs),
            "high_overlap_pair_count": sum(1 for x in unique_pairs if x["classification"] == "high"),
            "gsc_opportunity_count": len(gsc_opps),
            "gsc_unmapped_opportunity_count": len(gsc_unmapped),
            "ubersuggest_metrics_imported": False,
        },
        "gsc_unmapped_site_opportunities": gsc_unmapped,
        "top_overlap_pairs": unique_pairs[:100],
        "items": sorted(rows, key=lambda x: x["id"]),
    }

    OUT_JSON.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = []
    lines.append("# SEO Optimization Matrix — Motoopen 300 Articles")
    lines.append("")
    lines.append(f"Generated: {output['generated_at']}")
    lines.append("")
    lines.append("Scope: exactly 300 canonical published articles. No new article, URL change, deletion, merge, or redirect was executed by this audit.")
    lines.append("")
    lines.append("## Evidence policy")
    lines.append("")
    lines.append("- Repository data and the rendered Jekyll build are the source of truth for article metadata, internal links, canonical URLs and schema.")
    lines.append("- Google Search Console is connected for the exact GitHub Pages property. The stored snapshot covers 2026-09-06 to 2026-10-03, with the plugin's normal finalized-data delay.")
    lines.append("- Ubersuggest is authenticated on the free tier, but its real daily report quota was exhausted during this audit. No Ubersuggest volume/ranking/traffic values were invented; those fields stay null.")
    lines.append("- Cannibalization candidates are lexical review signals unless GSC explicitly reports competing pages.")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append("| Metric | Value |")
    lines.append("|---|---:|")
    lines.append(f"| Articles | {len(rows)} |")
    lines.append(f"| P0 | {priority_counts.get('P0', 0)} |")
    lines.append(f"| P1 | {priority_counts.get('P1', 0)} |")
    lines.append(f"| P2 | {priority_counts.get('P2', 0)} |")
    lines.append(f"| Orphan pages in rendered site | {orphan_count} |")
    lines.append(f"| Overlap pairs to review | {len(unique_pairs)} |")
    lines.append(f"| High-overlap pairs | {sum(1 for x in unique_pairs if x['classification'] == 'high')} |")
    lines.append(f"| GSC opportunities captured | {len(gsc_opps)} |")
    lines.append("")
    lines.append("### Recommended actions")
    lines.append("")
    lines.append("| Action | Count |")
    lines.append("|---|---:|")
    for action in ("KEEP", "META-ONLY", "INTERNAL-LINK", "UPDATE", "MERGE", "REDIRECT"):
        lines.append(f"| {action} | {action_counts.get(action, 0)} |")
    lines.append("")
    lines.append("## Live GSC signals")
    lines.append("")
    lines.append("| Type | Query | Observed page | Clicks | Impressions | CTR | Position |")
    lines.append("|---|---|---|---:|---:|---:|---:|")
    for opp in gsc_opps:
        cur = opp.get("current") or {}
        ctr = cur.get("ctr")
        ctr_text = f"{ctr * 100:.1f}%" if isinstance(ctr, (int, float)) else ""
        pos = cur.get("position")
        pos_text = f"{pos:.1f}" if isinstance(pos, (int, float)) else ""
        lines.append(
            f"| {opp.get('type','')} | {opp.get('query','')} | {opp.get('page','')} | "
            f"{cur.get('clicks','')} | {cur.get('impressions','')} | {ctr_text} | {pos_text} |"
        )
    lines.append("")
    lines.append("## Highest repo-overlap candidates")
    lines.append("")
    lines.append("These are review candidates, not automatic merge instructions.")
    lines.append("")
    lines.append("| Score | A | B | Classification |")
    lines.append("|---:|---|---|---|")
    for pair in unique_pairs[:30]:
        lines.append(
            f"| {pair['score']:.2f} | #{pair['left_id']} {pair['left_keyword']} | "
            f"#{pair['right_id']} {pair['right_keyword']} | {pair['classification']} |"
        )
    lines.append("")
    lines.append("## 300-article optimization map")
    lines.append("")
    lines.append("| ID | URL | Primary keyword | Intent | Hub/category | In | Out | Priority | Action | Main reason |")
    lines.append("|---:|---|---|---|---|---:|---:|---|---|---|")
    for row in sorted(rows, key=lambda x: x["id"]):
        hub = f"{row['hub'].get('parent_slug')}/{row['hub'].get('category_slug')}"
        reason = "; ".join(row["reasons"][:3]).replace("|", "/")
        lines.append(
            f"| {row['id']} | {row['url']} | {row['primary_keyword']} | {row['search_intent']} | "
            f"{hub} | {row['internal_links']['rendered_inbound_count']} | "
            f"{row['internal_links']['source_outbound_blog_count']} | {row['optimization_priority']} | "
            f"{row['recommended_action']} | {reason} |"
        )
    lines.append("")
    lines.append("## Action rules")
    lines.append("")
    lines.append("- P0: critical technical/indexing conflict such as duplicate URL/keyword, missing rendered page, canonical mismatch, invalid H1, or missing required Article/Breadcrumb schema.")
    lines.append("- P1: internal-link orphan, strong repo-overlap review candidate, a gap against the existing 650-word factory minimum, low keyword-token coverage, or a specific GSC query that matches an article but currently lands elsewhere.")
    lines.append("- P2: healthy article or metadata-only polish. KEEP means no current evidence justifies touching the article.")
    lines.append("- MERGE and REDIRECT are recommendations only. This audit does not execute them.")
    lines.append("")
    lines.append("## Content-gap interpretation")
    lines.append("")
    lines.append("Content gaps here are evidence-based structural gaps only: factory-minimum failure, weak primary-keyword token coverage, or a matched GSC query landing on another page. The audit does not invent topics, traffic, rankings or keyword volumes.")
    lines.append("")
    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({
        "articles": len(rows),
        "priority_counts": dict(priority_counts),
        "action_counts": dict(action_counts),
        "orphan_count": orphan_count,
        "overlap_pairs": len(unique_pairs),
        "high_overlap_pairs": sum(1 for x in unique_pairs if x["classification"] == "high"),
        "gsc_opportunities": len(gsc_opps),
        "gsc_unmapped": len(gsc_unmapped),
        "outputs": [str(OUT_JSON.relative_to(ROOT)), str(OUT_MD.relative_to(ROOT))],
    }, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
