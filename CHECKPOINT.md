# CHECKPOINT — SEO Master Autopilot 2026

| # | Date | Checkpoint | Git ref | QA |
|---|------|-----------|---------|----|
| 0 | 2026-11-25 | Pre-campaign backup (no changes) | tag `checkpoint-pre-seo-autopilot-2026-11-25` (`baafc1b`) | baseline build 332 pages, links PASS, blog QA PASS, 631 JSON-LD blocks snapshotted |
| 1 | 2026-11-25 | Batch 1 — design system (apple.css), self-hosted icon subset, post layout (quick answer, TOC, FAQ accordion, monthly CTA, SEO hub box), 12 SEO hubs (`seo_hub` on 301 posts), robots/llms/llms-full/business JSON, CI schema lock | branch `claude/dreamy-fermi-5dc8r6` | local QA PASS · schema lock OK (631/631) |

## Restore
```bash
git checkout checkpoint-pre-seo-autopilot-2026-11-25 -- .   # restore all files to the pre-campaign state
```
