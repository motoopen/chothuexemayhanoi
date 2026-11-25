# CHECKPOINT — SEO Master Autopilot 2026

| # | Date | Checkpoint | Git ref | QA |
|---|------|-----------|---------|----|
| 0 | 2026-11-25 | Pre-campaign backup (no changes) | tag `checkpoint-pre-seo-autopilot-2026-11-25` (`baafc1b`) | baseline build 332 pages, links PASS, blog QA PASS, 631 JSON-LD blocks snapshotted |
| 1 | 2026-11-25 | Batch 1 — design system (apple.css), self-hosted icon subset, post layout (quick answer, TOC, FAQ accordion, monthly CTA, SEO hub box), 12 SEO hubs (`seo_hub` on 301 posts), robots/llms/llms-full/business JSON, CI schema lock | branch `claude/dreamy-fermi-5dc8r6` | local QA PASS · schema lock OK (631/631) |
| 2 | 2026-11-25 | Static pages: "Cẩm nang" box (≤3 links) on 9 pages, contact page local service-area block | branch | QA PASS |
| 3 | 2026-11-25 | Performance/a11y: WebP vehicles, CSS in head, CLS 0, AA contrast, page-fade removed | branch | QA PASS · Lighthouse a11y 100 (home, pricing) |
| 4 | 2026-11-25 | Content batches B01–B07 (165 posts): quick answer + 3–6 visible FAQ + 1 contextual link; homepage pillar now linked from 83 post bodies (was 6) | branch | QA PASS · schema lock OK |
| 5 | 2026-11-25 | PR #22 merged into main (`1ea03c0`); Pages deploy #1265 success | main | CI #75 PASS |
| 6 | 2026-11-25 | Batches B08–B13 → 301/301 posts optimized (1,418 FAQ items); legal/safety notices (16 posts); factual body fixes; silo→pillar box on categories; QA-REPORT | PR #23 merged into main (`daa1314`) | CI #76 (PR) + #77 (main) PASS · Pages deploy #1266 success · schema lock 631/631 |

## Restore
```bash
git checkout checkpoint-pre-seo-autopilot-2026-11-25 -- .   # restore all files to the pre-campaign state
```
