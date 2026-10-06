# SEO Hub 300 — Motoopen

## Canonical matrix

**Use `article-matrix-300.json` as the writing source of truth.**

- Exactly 300 rows.
- One row = one distinct article.
- Keyword variants with the same intent are stored as `secondary_keywords`, not separate posts.
- Two already-published preview posts are marked `published` and must not be generated again.
- `article-matrix-300.csv` is the compact human-readable view.
- `seo-hub-300.json` is the earlier **keyword inventory** only; do not feed it directly to a writer as a 300-post queue.

## New required clusters

The canonical matrix includes dedicated article families for:
- thuê xe máy 50cc
- thuê xe Cub 50cc
- thuê xe ga / tay ga 50cc
- thuê xe điện / xe máy điện
- thuê xe máy điện VinFast
- thuê xe điện / xe máy điện không cần bằng lái

Legal and licence-related rows are explicitly marked for current-law verification before publication.

## Evidence rules

- GSC numbers are copied only from real Search Console signals for the live property.
- Keyword Tool suggestions are real Google autocomplete signals for Vietnam / Vietnamese.
- Missing volume, trend, competition, difficulty or CPC stay `null`; never invent them.
- User-requested keywords are tagged `UserSeed:2026-10-06`.
- Editorial angles without measured keyword data carry no fabricated metrics.

## Cannibalization rule

Before writing any row, compare its `cannibalization_guard`, `primary_keyword`, and `secondary_keywords` against already published posts. If two rows answer the same intent, merge them into one stronger article.

## Business/legal verification

Before publication, respect every row's `validation_required`. Prices, deposits, delivery promises, support hours, inventory and model availability must be current. Licence, 50cc, age, insurance and traffic-law statements require current Vietnamese legal verification.

## Taxonomy

Every matrix row now includes a taxonomy object and front matter:
- `hub_parent`
- `hub_category`

The source of truth for category labels, icons, URLs and cluster mapping is `_data/taxonomy.json`.

Writers must copy the matrix row's `front_matter` values into every new Markdown post. This makes the post appear automatically in the correct parent/child category page.
