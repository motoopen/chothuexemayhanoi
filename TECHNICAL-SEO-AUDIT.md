# TECHNICAL SEO AUDIT — motoopen.github.io/chothuexemayhanoi

Date: 2026-11-25. Build: Jekyll 3.10.0 (same major version as GitHub Pages). This audit covers 332 HTML
pages: 301 posts, 13 static pages, 16 category pages, the blog index and 404.
Tools: `scripts/check_site_links.py`, `scripts/check_blog_quality.py`, `scripts/schema_snapshot.py`,
`scripts/build_master_matrix.py`, Playwright, Lighthouse 12 (local, simulated mobile/desktop).

## 1. Results
| Check | Before | After | Status |
|---|---|---|---|
| Jekyll build | OK | OK | PASS |
| Broken internal links / fragments / assets (baseurl `/chothuexemayhanoi/`) | 0 | 0 (≈45 k refs) | PASS |
| Canonical = self, absolute, in sitemap | 331/331 | 331/331 | PASS |
| Exactly one H1 per page | 331/331 | 331/331 | PASS |
| Indexable (no stray noindex) | 331/331 | 331/331 | PASS |
| Image alt present | PASS | PASS | PASS |
| Post body links ≤ 8 (owner rule) | 1 post had 10 | 0 over | FIXED |
| ≤ 1 internal link per paragraph | PASS | PASS | PASS |
| Posts with no inbound link from another post's content | 170 | 0 | FIXED (hub box) |
| JSON-LD identical to baseline (schema lock) | — | 631/631 | PASS (read-only) |
| `<h3>` used for logo text in header (heading order) | every page | removed | FIXED |
| Skip link / `main#main` landmark on every page | partial | all | FIXED |
| Duplicate theme toggle visible on desktop homepage | yes | no | FIXED |

## 2. Performance (Lighthouse 12, local server without gzip, so real GitHub Pages is faster)
| Page | Form factor | Before perf / a11y | After perf / a11y | LCP | CLS |
|---|---|---|---|---|---|
| Home | mobile | 82 / 91 | 89 / 100 | 4.3 s → 3.0 s | 0 |
| Home | desktop | — | 99 / 100 | 0.7 s | 0.05 → 0 |
| Bảng giá | mobile | 86 / 91 | 95 / 100 | 4.1 s → 2.3 s | 0.09 → 0 |
| Thủ tục | mobile | — | 99 / 100 | 1.9 s | 0 |
| Liên hệ | mobile | — | 98 / 100 | 2.1 s | 0 |
| Post | mobile | — | 97 / 96 | 2.0 s | 0 |
| Post | desktop | — | 100 / 100 | 0.5 s | 0 |
| Category | mobile | — | 97 / 96 | 2.2 s | 0 |
The "before" runs had the cdnjs icon CSS blocked, so they are optimistic. Best Practices and SEO are 100 everywhere.

What changed:
- **Icons:** Font Awesome went from cdnjs (~100 KB CSS + ~150 KB fonts, render-blocking, cross-origin) to a
  self-hosted subset of ~17 KB (`assets/vendor/fontawesome/`). Fixed icon width prevents shifts.
- **Web font:** the Inter font (2 cross-origin requests) was removed in favour of a system font stack
  (SF Pro / Segoe UI / Roboto). All three cover Vietnamese.
- **Homepage:** removed the synchronous `page-fade.js`, which hid the page for 0.9 s.
- **Images:** vehicle photos are WebP 320/600 via `<picture>` + `srcset`, with JPEG fallback (about −55 % bytes)
  and real `width`/`height`.
- **CSS placement:** shared CSS moved into `<head>` and the fixed header's height is reserved up front,
  bringing CLS to 0.
- **Requests:** CDN fallback scripts dropped (−1 request per page); local favicon instead of a third-party JPEG.

Remaining (not done, tracked):
- The homepage HTML is ~138 KB (7.8 k words of pillar content plus a 1,500-node DOM). It is kept by design
  (no content cuts). Mobile LCP is 3.0 s locally without gzip.
- `home.css` (42 KB) and the per-page CSS (30–37 KB) still carry legacy duplicates. A full CSS
  consolidation is possible later, but risks visual regressions.
- The homepage logo is still loaded from `i.postimg.cc` (an earlier owner rule kept it). `assets/images/brand/`
  has a local 5 KB copy.

## 3. Crawl & index files
| File | State |
|---|---|
| `sitemap.xml` | Jekyll-rendered: 13 static pages, blog, 16 category pages, 301 posts (with `lastmod`) |
| `robots.txt` | Policy file with AI-crawler groups and the sitemap line. **Limitation:** a project site's robots.txt is not at the host root, so crawlers read `https://motoopen.github.io/robots.txt` from the separate root repo |
| `llms.txt`, `llms-full.txt`, `du-lieu/motoopen-business.json` | New, built from `_data` (see AEO-GEO-AUDIT.md) |
| `404.html` | Branded, with links to home, blog, bảng giá, danh mục and a call button |
| Internal reports (`*.csv`, audit `.md`, `qa/`) | Excluded in `_config.yml`, so they are not published |

## 4. Mobile, responsive, accessibility
- Viewports checked with Playwright: 360, 390, 768, 1024, 1366 px in light and dark. No horizontal scroll.
- Dark mode is applied before first paint (inline script in `header.html`), so there is no flash.
  `prefers-reduced-motion` is respected.
- WCAG AA contrast: the accent is now `#0066cc` on light backgrounds; Zalo buttons and price tags darkened.
- ARIA: invalid `role=listitem` on `<article>` removed; `role=table` wrappers around real tables became
  labelled scrollable regions; call buttons' accessible names now include their visible text.
- The table of contents is closed by default on mobile and opens on ≥1024 px. The FAQ uses native `<details>`.

## 5. CI gate (`.github/workflows/jekyll-branch-check.yml`)
Build, then article-matrix checks, link integrity, blog QA (adds ≤8 body links and 3–8 FAQ items
when present), **schema lock compare**, AI-file checks and generated-page checks. Local mirror:
`scripts/run_qa.sh`.

## 6. Known open items
1. Production could not be fetched from this session: `motoopen.github.io` is denied by the sandbox
   network policy. The deploy is verified through the GitHub PR checks and the Pages workflow instead.
2. Data-consistency items (deposit, 50cc licence, hourly prices, other domains) need the owner. See AEO-GEO-AUDIT.md §4.
3. One post's meta description contains the typo "hai mứ tư giờ". It is not fixed because the description
   feeds Article JSON-LD (schema lock). Owner decision.
