# AGENTS.md — rules for anyone (human or AI) editing this repository

Site: https://motoopen.github.io/chothuexemayhanoi/ (Jekyll 3.10 on GitHub Pages, `baseurl: /chothuexemayhanoi`).
Business: Motoopen — thuê xe máy Hà Nội, 114 Nguyễn Văn Cừ, Long Biên · 0857 255 868 · 09:00–21:00.

## 1. Hard rules (owner instructions, highest priority first)
1. **Schema lock.** Never add, change, remove or regenerate any JSON-LD / structured data
   (LocalBusiness, Organization, WebSite, WebPage, Service, Article, FAQPage, BreadcrumbList,
   Review, AggregateRating, CollectionPage, ItemList). Schema is checked read-only:
   `python3 scripts/schema_snapshot.py compare _site qa/schema-baseline.json` must print
   `SCHEMA LOCK OK`. CI fails otherwise. Do not edit `_includes/blog/schema.html`,
   `_includes/blog/collection-schema.html`, `_includes/schema/static-page.html`,
   `_includes/home/schema.html`, and do not change post `title`, `description`, `date`,
   `last_modified_at`, `image`, `author`, `hub_parent`, `hub_category` (they feed Article /
   Breadcrumb JSON-LD), nor the order/membership of posts in category listings.
2. **Post FAQ = visible HTML only.** Use front matter `qa:` (list of `{q, a}`), rendered by
   `_includes/blog/faq.html`. Never use the `faq:` key: it would emit FAQPage JSON-LD.
3. Never delete posts, cut useful content or keywords, or shorten posts in bulk. Additive edits only.
4. Never change URLs/permalinks, or titles/meta descriptions that already perform.
5. Never change NAP, prices, deposits or business policy without owner verification.
   Single sources: `_data/site.yml` (NAP, CTA copy) and `banggia.html` (price table).
6. Never copy data from other brands (Nguyễn Tú / thuexemaynguyentu.com, Nguyễn Hà / rentbikehanoi.com).
7. No fabricated reviews, ratings, experiences, prices or business data. No artificial backlinks.
8. Free tools only. No paid APIs/services, no hosting upgrades.

## 2. Internal links
- Body (main content) of a post: max **8** internal links, max **1 per paragraph**.
- Static page main content: max 3 contextual links added per page.
- Natural, varied anchors; no exact-match stuffing; no links inside price notices, terms or warnings.
- Hierarchy: Homepage → Pillar (money pages) → SEO hub → Silo (category) → supporting posts.
  Hub data: `_data/seo_hubs.yml`; every post has `seo_hub:`. Monthly-rental pillar = homepage `/`.

## 3. Design system
- One override layer for every page: `assets/css/apple.css` (tokens, light/dark, components),
  linked from `_includes/header.html`. Change tokens there, not per page.
- Icons: self-hosted Font Awesome subset in `assets/vendor/fontawesome/` (~17 KB).
  After using a new `fa-*` icon, run `scripts/build_icon_subset.py` (see its docstring).
- System font stack (no web fonts). Dark mode = `body.dark` (set early in header.html).

## 4. QA gate (run before every commit)
```bash
scripts/run_qa.sh /tmp/site      # jekyll build + links + blog quality + schema lock + AI files
python3 scripts/build_master_matrix.py /tmp/site   # refresh MASTER/KEYWORD/INTERNAL-LINK CSVs
```
CI (`.github/workflows/jekyll-branch-check.yml`) runs the same checks on PRs to `main`.

## 5. Content batches
Work in batches of ~30 posts; after each batch: QA gate → commit → PR → merge → verify → update
`MASTER-SEO-MATRIX.csv` and `CHECKPOINT.md`.
