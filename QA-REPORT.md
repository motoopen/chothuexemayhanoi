# QA REPORT — SEO Master Autopilot 2026 (Motoopen)

Date: 2026-11-25 · Branch `claude/dreamy-fermi-5dc8r6` · Checkpoint tag `checkpoint-pre-seo-autopilot-2026-11-25`
PRs: motoopen/chothuexemayhanoi#22 (merged as `1ea03c0`, Pages deploy #1265 success) and motoopen/chothuexemayhanoi#23 (merged as `daa1314`, main CI #77 PASS, Pages deploy #1266 success).

## 1. Scope and counts
| Item | Count |
|---|---|
| URLs inventoried (MASTER-SEO-MATRIX.csv) | **331** = 301 posts + 13 static pages (incl. homepage) + 1 blog index + 16 category pages |
| URLs passing matrix QA (canonical self, 1 H1, indexable, ≤8 body links, ≤1 link/paragraph) | **331 / 331 PASS** |
| Posts edited | **301 / 301** (quick answer + visible FAQ; 288 with one added contextual link paragraph; max 8 body links) |
| Visible FAQ items written (unique, post-specific) | **1,418** (3–6 per post) |
| Static pages edited | 13 / 13 (shared design layer, self-hosted icons, head CSS). Content additions on 10: guide box on 9, local block on contact, legal note on thủ tục |
| Category pages edited | 16 / 16 (shared design, silo → pillar box on child categories mapped to a hub) |
| Posts whose body links to the monthly pillar (homepage) | **116** (was 6) |
| Posts with no inbound link from another post's content | **0** (was 170) |
| Original post-body lines changed | 53 of 4,585 (typo/accuracy fixes, 2 surplus links unlinked; text kept). **0** front-matter lines changed (title, description, date intact) |
| Post body words | 221,503 → 231,774 (+10,271), plus quick answers and FAQs |

## 2. Gate results (local mirror `scripts/run_qa.sh` = CI)
| Gate | Result |
|---|---|
| Jekyll 3.10 build | PASS (332 HTML pages) |
| Internal links / fragments / assets / baseurl | PASS (≈45 k refs, 0 broken) |
| Blog QA (301 articles: title, H1, meta, canonical, sitemap, alt, Article+Breadcrumb, ≤1 link/paragraph, ≤8 body links, FAQ 3–8 HTML only) | PASS |
| **Schema lock**: JSON-LD identical to baseline | **PASS: 631/631 blocks on 330 pages unchanged** (checked before and after every batch, and in GitHub CI) |
| AI files (llms.txt, llms-full.txt ≥301 posts, business JSON valid, robots sitemap line) | PASS |
| CI "Verify generated public pages" | PASS |
| GitHub Actions "Jekyll Build Check": PR runs #70–#74 and main run #75 | all success |
| Responsive (Playwright): 20 page types × 5 widths (360/390/768/1024/1366) × light/dark = 200 views | 0 horizontal overflow, 0 JS errors |
| Lighthouse 12 (local, no gzip) | Home mobile 89 (was 82) / desktop 99; Bảng giá 95; Thủ tục 99; Liên hệ 98; Post 97 (desktop 100); Category 97. Accessibility 96–100, Best Practices 100, SEO 100, CLS 0 |

## 3. Content safety checks (`scripts/apply_content_batch.py`)
Every batch was validated before it was applied. A batch is rejected for any of the following:
- a non-additive diff;
- links or markdown inside FAQs;
- numbers not found in the owner-published price table or in the post itself;
- any deposit amount;
- a duplicate question anywhere on the site;
- more than 8 body links.

Results: 13 batches, 301 posts applied, 1 question reworded after a duplicate was caught, 0 posts rejected in the end.
FAQ uses the `qa` key, so no FAQPage JSON-LD is generated.

## 4. Deploy and production
- PR #22 was merged into `main` (`1ea03c0`). The `pages build and deployment` run #1265 succeeded (built with the GitHub Pages Jekyll image, then deployed).
- **Production could not be inspected directly from this session.** `motoopen.github.io` and the Actions artifact storage are both denied by the sandbox network policy (HTTP 403 at the proxy). Production correctness is therefore verified indirectly:
  - the same commit passed the CI gate on GitHub's own Pages Jekyll build (links, blog QA, schema lock, generated-page checks);
  - the Pages deploy job reports success.
  To verify live, allow `motoopen.github.io` in the environment's network settings, then open the homepage, `/banggia.html`, one post, `/llms.txt` and `/sitemap.xml`.

## 5. Open issues (need owner input or access, not fixable autonomously)
1. Deposit figures conflict between bảng giá, thủ tục and the hero (AEO-GEO-AUDIT §4.1).
2. The 50cc licence wording conflicts between bảng giá/thủ tục and several posts; needs legal check (§4.2).
3. Homepage LocalBusiness `aggregateRating`/`review` in JSON-LD: self-serving and unverified source. Reported read-only, not changed (schema lock).
4. Organization `sameAs` points to 16 differently named Facebook pages and a TripAdvisor listing under another name. Entity ambiguity.
5. Hourly-rental mentions in posts, but no hourly price on bảng giá. Fleet posts discuss models not on bảng giá (SH, Lead, Vespa, Exciter…).
6. Pages and posts promise things outside the verified facts: "hỗ trợ 24/7" (intro post, loại xe), free maintenance/rescue/swap and "giao nhanh 20–40'" (hướng dẫn page). Owner to confirm or remove.
7. Body text with doubtful facts left as is (not verifiable here): several area posts' street lists, some electric-bike range figures that differ between posts.
8. Typo "hai mứ tư giờ" inside one post's meta description. Kept, because it feeds Article JSON-LD (schema lock).
9. robots.txt and llms.txt only take effect at the host root (`motoopen.github.io` repo); submit the sitemap in GSC/Bing.
10. Live production check is blocked by the network policy (see §4).
