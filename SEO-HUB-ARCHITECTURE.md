# SEO HUB ARCHITECTURE — Motoopen (thuê xe máy Hà Nội)

Updated: 2026-11-25 · Source of truth: `_data/seo_hubs.yml` (hubs), `_data/taxonomy.json` (categories),
`_data/page_guides.yml` (static-page guide boxes). Every post carries `seo_hub:` in front matter.

## 1. Main target URL for "thuê xe máy tháng Hà Nội"
**Homepage `/`** is the main target for the monthly-rental keyword group (thuê xe máy tháng Hà Nội,
thuê xe máy theo tháng tại Hà Nội, cho thuê xe máy tháng giá rẻ, giá thuê xe máy 1 tháng, thuê xe máy
dài hạn). Reasons: its title/H1 already target "Thuê Xe Máy Tháng Hà Nội", it holds the monthly price
table, monthly-vs-daily comparison and the largest FAQ, and Search Console (09–10/2026) shows it
ranking for "thuê xe máy 1 tháng" (avg. position 5.5). No new competing page was created.

## 2. Hierarchy
```
Homepage (/) ── pillar for monthly rental
 ├─ Pillar (money) pages: /banggia.html · /dichvu.html · /loaixe.html · /thutuc.html · /lienhe.html
 │                        /huongdan.html · /kinhnghiem.html · /faq.html
 ├─ SEO hubs = 5 parent categories   /blog/danh-muc/<parent>/
 │    └─ Silos = 10 child categories  /blog/danh-muc/<parent>/<child>/
 │         └─ 301 supporting posts    /blog/<slug>/
 └─ /blog/ (all posts) · /blog/danh-muc/ (category index)
```

## 3. The 12 topic hubs (flexible by real search intent)
| Hub | key | Posts | Pillar URL | Silo (category) |
|---|---|---|---|---|
| Thuê xe máy theo tháng | `thue-xe-thang` | 13 | `/` | `/blog/danh-muc/thue-xe/gia-thoi-gian/` |
| Giá thuê xe & tiền đặt cọc | `gia-coc` | 29 | `/banggia.html` | `/blog/danh-muc/thue-xe/gia-thoi-gian/` |
| Thuê xe đi làm, công tác & ở dài hạn | `di-lam-dai-han` | 5 | `/` | `/blog/danh-muc/thue-xe/bat-dau-thue/` |
| Thuê xe cho sinh viên | `sinh-vien` | 4 | `/` | `/blog/danh-muc/thue-xe/bat-dau-thue/` |
| Thuê xe số | `xe-so` | 12 | `/loaixe.html` | `/blog/danh-muc/loai-xe/cac-loai-xe/` |
| Thuê xe tay ga | `xe-tay-ga` | 23 | `/loaixe.html` | `/blog/danh-muc/loai-xe/cac-loai-xe/` |
| Thuê xe 50cc | `xe-50cc` | 39 | `/loaixe.html` | `/blog/danh-muc/loai-xe/xe-50cc/` |
| Thuê xe điện | `xe-dien` | 44 | `/loaixe.html` | `/blog/danh-muc/loai-xe/xe-dien/` |
| Thuê xe theo khu vực Hà Nội | `khu-vuc` | 50 | `/lienhe.html` | `/blog/danh-muc/khu-vuc/ha-noi-theo-khu-vuc/` |
| Thủ tục & hợp đồng | `thu-tuc-hop-dong` | 18 | `/thutuc.html` | `/blog/danh-muc/huong-dan/thu-tuc-phap-ly/` |
| Hướng dẫn sử dụng & kinh nghiệm thuê | `kinh-nghiem` | 36 | `/huongdan.html` | `/blog/danh-muc/huong-dan/an-toan-su-co/` |
| Lịch trình & hành trình bằng xe máy | `hanh-trinh` | 28 | `/kinhnghiem.html` | `/blog/danh-muc/kinh-nghiem/hanh-trinh/` |

Hub sizes follow the existing content, not a quota. The three commercial "monthly" hubs
(tháng / đi làm / sinh viên = 22 posts) are small on purpose. They are reinforced by the
link paragraphs: the homepage pillar is now linked from **83 post bodies (it was 6)**, plus every
hub box outside the monthly hubs.
Regroup a post by editing its `seo_hub` value; templates update automatically.

## 4. Link flows (template-driven, "edit once, sync everywhere")
| Component | File | Links |
|---|---|---|
| Hub box (every post) | `_includes/blog/hub-box.html` | pillar + silo + monthly pillar (rotating anchor) + 4 sibling posts rotating backwards through the hub |
| Related posts (every post) | `_includes/blog/related-posts.html` | 5 posts rotating forwards through the category |
| Monthly CTA (every post) | `_includes/blog/cta.html` | call · Zalo · bảng giá · thuê theo tháng |
| Breadcrumb (every post) | `_layouts/post.html` | Trang chủ › Blog › parent › child |
| Body link paragraph (165+ posts) | content batches | 1 contextual link to `/` or hub pillar, ≤8 body links, 1 per paragraph |
| Static "Cẩm nang" box | `_includes/page-guides.html` | ≤3 supporting posts per static page (9 pages) |
| Contact local block | `_includes/local-service-area.html` | NAP + delivery areas (no links) |

Result: no orphan posts. All 301 posts get an inbound link from a sibling post's hub box, and
the 170 posts that previously had no inbound link from another post's content now do.

## 5. Cannibalization decisions
| Pages | Overlap | Decision |
|---|---|---|
| `/` vs `/blog/thue-xe-may-ha-noi-theo-thang/` | "thuê xe máy (Hà Nội) theo tháng" | The post stays as a supporting comparison guide ("cách so sánh gói dài hạn"). It links to `/` with a non-exact anchor. The homepage links back via its guide box with a different anchor ("Checklist chi phí…", "điểm hòa vốn"). |
| `/` vs `/blog/thue-xe-may-ha-noi-1-thang/` | "thuê xe máy 1 tháng" (GSC: homepage pos. 5.5) | The post is a cost/terms checklist and links to `/`. No URL or title changes. |
| `/` vs `/blog/thue-xe-may-dai-han-ha-noi/` | "thuê xe máy dài hạn" | The post is an "extra costs" angle and links to `/`. |
| `/banggia.html` vs price posts | "giá thuê xe máy …" | Price posts answer specific questions ("đã gồm gì", "cách đọc", "tiền cọc") and link to banggia/home. |
No duplicate `primary_keyword` exists among the 301 posts (CI enforces this on the article matrix).

## 6. Rules
At most 8 body links per post and 1 per paragraph; at most 3 contextual links added per static page.
Anchors must be natural and varied, with no exact-match stuffing. Never put links inside price notices,
terms or legal warnings. See `AGENTS.md`.
