# AEO / GEO / AI-SEARCH AUDIT — Motoopen

Date: 2026-11-25. Scope: everything a crawler or answer engine (Google AI Overviews, ChatGPT Search,
Gemini, Bing Copilot, Perplexity) can fetch and quote. Structured data is audited **read-only**
(owner schema lock); nothing in JSON-LD was changed.

## 1. What was implemented
| Area | Implementation | Where |
|---|---|---|
| Answer-first content | "Trả lời nhanh" box: 1–2 sentences answering the title question directly, in the HTML at the top of the article | front matter `quick_answer`, `_layouts/post.html` |
| Citation-ready FAQ | 3–6 post-specific Q&A per post, plain text in server-rendered `<details>` (readable without JS) | front matter `qa`, `_includes/blog/faq.html` |
| Semantic HTML | `<article>`, `<header>`, `<time datetime>`, `<nav aria-label=Breadcrumb>`, `<aside>` for answer/notice, ordered TOC with real `#id` anchors | post layout |
| Entity consistency (NAP) | One source for name, address, phone, Zalo, hours, delivery areas: `_data/site.yml`. It feeds header, footer, CTA, contact block, llms.txt and the business JSON | `_data/site.yml` |
| Pricing consistency | Answers quote only the figures published on `banggia.html`, always as "tham khảo, chốt khi liên hệ". No deposit amounts are quoted (the published sources conflict, see §4) | content validator |
| Information gain | Break-even maths (monthly vs daily) from published prices; "what to ask" checklists; legal update notes citing Luật 36/2024/QH15 | posts, thủ tục |
| E-E-A-T signals | Author box, contact box, sourced legal notes, real NAP + map. **No** fabricated reviews, experiences or credentials were added | templates |
| AI crawler access | robots.txt groups: search/answer bots allowed (OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User, DuckAssistBot, Applebot, Bingbot, Googlebot); training bots listed separately (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, meta-externalagent), currently allowed, with a one-line opt-out | `robots.txt` |
| llms.txt | Brand summary, NAP, key pages and the 12 hubs with post counts | `/llms.txt` |
| llms-full.txt | Every post grouped by hub, each with its quick answer (or description) | `/llms-full.txt` |
| Business data JSON | Plain facts (NAP, services, reference prices with source URL, documents). It is **not** schema.org markup | `/du-lieu/motoopen-business.json` |
| No hidden AI-only content | Everything in llms/JSON is a summary of visible pages, with no cloaking | — |

llms.txt and llms-full.txt are a convention, not a confirmed ranking factor. They are cheap and honest
summaries, so they are worth having.

## 2. Crawler reachability — important limitation
The site is a GitHub Pages **project** site (`/chothuexemayhanoi/`). Crawlers read `robots.txt` (and by
convention `llms.txt`) only at the **host root** `https://motoopen.github.io/`, which is served by the
separate `motoopen.github.io` repository (not in this session's scope). Consequences:
- `/chothuexemayhanoi/robots.txt` and `/chothuexemayhanoi/llms.txt` document the intended policy. They
  only take effect if the root repo mirrors them or the site moves to a custom domain.
- Recommended owner actions: (a) add the AI-bot groups and a
  `Sitemap: https://motoopen.github.io/chothuexemayhanoi/sitemap.xml` line to the root repo's
  robots.txt; (b) submit the sitemap in Google Search Console and Bing Webmaster Tools; (c) consider a
  custom domain.

## 3. Structured data — READ-ONLY findings (not modified)
Baseline: 631 JSON-LD blocks on 330 pages (`qa/schema-baseline.json`). CI compares every build against it.
| # | Page | Finding | Risk | Action |
|---|---|---|---|---|
| S1 | `/` | LocalBusiness has `aggregateRating` 4.8/37 and 5 `review` items. These are self-serving reviews on a LocalBusiness and are not eligible for review rich results; the source of the rating count is unverified | Manual-action risk if the reviews are not genuine | OWNER_REVIEW: confirm the source (e.g. Google Maps reviews) or remove it yourself |
| S2 | `/`, `/faq.html` | FAQPage present. Since 2023 Google only shows FAQ rich results for government/health sites | None (harmless) | Keep |
| S3 | `/` | Organization `sameAs` lists 16 Facebook pages under other names (Công Tân, Phố Cổ, Cầu Giấy…) and a TripAdvisor listing "Cho Thue Xe May Cong Tan" | Entity ambiguity (one brand vs many shop names) | OWNER_REVIEW: keep only profiles that are really Motoopen |
| S4 | `/` | Logo/image hosted on third-party `i.postimg.cc` | Availability | OWNER_REVIEW: a local copy exists at `/assets/images/brand/` |
| S5 | posts | Article `author` is an Organization, `image` is a generic social image | Weak E-E-A-T | Optional, owner decision (schema lock) |
| S6 | all | All JSON-LD parses; Article + BreadcrumbList present on all 301 posts | — | — |
Post FAQs deliberately use the `qa` key, so no new FAQPage markup is generated (schema lock).

## 4. Data consistency issues found (OWNER_REVIEW — not changed, business facts)
1. **Deposit:** bảng giá lists Wave 2–3 tr, Vision 4–5 tr, Air Blade 3 tr, Click/Mio 2 tr. Thủ tục says
   "2–5 triệu" and puts Vision in the 2 tr group. The hero says "Cọc 1–5 triệu". Pick one and update the pages.
2. **50cc licence:** bảng giá ("Không cần bằng lái") and thủ tục ("không có A1 → 50cc hoặc xe điện")
   conflict with several posts saying petrol 50cc needs a suitable licence. This needs legal
   verification before the wording is unified.
3. **Licence classes:** thủ tục says "A1 hoặc A2 (xe trên 175cc)". This is outdated under Luật 36/2024/QH15
   (A1 ≤125 cm³, A >125 cm³ from 01/01/2025). A sourced note was added and the policy text kept.
4. **Hourly rental:** the post "thuê xe máy Hà Nội 2 giờ" says hourly prices are on the price page, but
   the price page has none.
5. **Air Blade vs Vision:** one post says Air Blade costs more than Vision, but published monthly prices
   are Air Blade 1.400k and Vision 1.800k–2.000k.
6. **Fleet:** some model posts (SH, Lead, Vespa, Exciter, Winner, Future, Sirius, Cub) discuss models
   that bảng giá does not list. Answers never claim Motoopen rents them.
7. **Other domains:** the footer links `chothuexemayhanoi.ceovanta.com`, and SERP shows
   `moto-open.gitbook.io/openmoto`. If these carry the same content, that is a duplicate-content risk.
   Confirm ownership and canonicalisation.

## 5. Next AEO steps (owner input needed)
- A dated, verified monthly price table ("cập nhật MM/YYYY") on the homepage, once prices are confirmed.
- A "Giá tháng gồm gì" table (helmets, raincoat, maintenance, swap bike, delivery). Needs real policy data.
- Google Business Profile: same NAP, categories, photos and real reviews. This is the biggest lever
  for "thuê xe máy gần đây".
