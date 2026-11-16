# Báo cáo đề xuất cần duyệt – Motoopen (motoopen.github.io/chothuexemayhanoi)

Kính gửi: **Tổng Thống** · Ngày lập: 16/11/2026
Phạm vi báo cáo gồm hai loại việc. Loại thứ nhất là những việc quy tắc hiện hành **không cho phép tự áp dụng**: trang chủ, `<title>`, `<meta>`, gộp hoặc xóa bài. Loại thứ hai là những việc **cần quyết định hoặc tài khoản của chủ doanh nghiệp**: chính sách, Search Console, Google Business Profile, off-page.

Nguyên tắc:
- Không cam kết thứ hạng, lưu lượng hay thời gian index. Số liệu là số đo của các auditor hoặc số kiểm chứng lại ngày 16/11/2026. Mục nào chưa kiểm chứng được ghi **[chưa xác minh]**.
- Chưa áp dụng gì vào repo; trang chủ hiện tại không bị đụng tới.
- Giá luôn theo bảng chuẩn:
  - Wave: 150k/ngày, 700k/tuần, 900k–1,2tr/tháng, cọc 2–3tr.
  - Vision: 200k/ngày, 1tr/tuần, 1,8–2tr/tháng, cọc 4–5tr.
  - Air Blade: 200k/ngày, 1tr/tuần, 1,5tr/tháng, cọc 3tr.
  - Click/Mio: 150k/ngày, 700k/tuần, 900k–1,2tr/tháng, cọc 2tr.
  - Tay ga 50cc: 200k/ngày, tuần/tháng báo giá, cọc 4tr.
  - Xe điện: liên hệ.
- Chính sách chưa chốt được viết trung tính.

## Tóm tắt điều hành
1. **Trang chủ (A)**: một patch tổng hợp, chia 5 phần độc lập. Các phần làm những việc sau:
   - sửa chatbot đang hiện tên và số của doanh nghiệp khác ("Nguyen Tu", 0942467674);
   - bỏ 5 Review và điểm 4.8/37 tự gắn trong JSON-LD;
   - đồng bộ giá và cọc với bảng chuẩn;
   - bỏ hiệu ứng ẩn hero và lỗi nhảy bố cục (đo được CLS 0);
   - thay Font Awesome 315 KB bằng bộ 68 icon tự host;
   - viết lại 11 tệp du-lieu.
2. Đã build thử: các script CI đều **PASS**. Chỉ `index.html`, `home.css`, `hero-pricing.js`, `du-lieu/*`, `moto_sitemap.json` thay đổi.
3. **Title/meta (B)**: 10 đề xuất chính và 2 đề xuất tùy chọn, mỗi URL một đề xuất. Kèm script áp dụng có tự kiểm tra.
4. **Quyết định (C)**: 14 câu hỏi. Quan trọng nhất là vai trò của `chothuexemayhanoi.ceovanta.com` (cùng NAP, là website trên Google Maps, khoảng 78 URL trùng chủ đề) và quan hệ với "Nguyễn Tú".
5. **Bên ngoài (D)**: chưa công cụ nào đang kết nối tới property Search Console/Bing của site này. robots.txt ở gốc host vẫn 404 (kiểm lại 16/11).
6. **Gộp nội dung (F)**: 17 nhóm, 57 URL. **Chưa gộp** cho tới khi có dữ liệu GSC 28 ngày và quyết định vai trò hai domain.

## Cách dùng gói đề xuất
Thư mục: `docs/seo-proposals-2026-11/` (không được build lên website)

| Tệp | Nội dung | Áp dụng |
|---|---|---|
| `A-homepage.patch` | A1–A5, 30 tệp | `git apply` trên HEAD (--check đạt trên HEAD và cây làm việc 16/11) |
| `A-homepage-parts/01…05` | Từng phần, áp dụng độc lập | như trên |
| `A6-header-footer-homepage.patch` | Bỏ `is_home` trong header/footer | sau khi commit của các nhóm triển khai đã vào |
| `A7-footer-description-optional.patch` | Câu mô tả footer (tùy C10) | như A6 |
| `B-apply_title_meta.py` | B1–B12 | `--check`, rồi `--apply [--only B1,…]` |
| `D-external/…` | robots.txt gốc, CSV 38 URL cho GSC, script IndexNow | tài khoản của chủ |
| `E-offpage/prospects-verified.csv` | 29 nguồn, có kiểm tra lại 16/11 | bảng theo dõi |
| `F-merge/merge-map.json` | Bản đồ gộp (đề xuất) | chỉ khi có dữ liệu GSC |

## A. Cần duyệt – Trang chủ

**A.0 Điều kiện.** Chỉ áp dụng A sau khi các tệp sau của các nhóm triển khai đã được commit:
- `_includes/motoai.html`
- `_data/prices.yml`
- các khóa mới trong `_data/site.yml`: `brand.logo_square`, `brand.logo_square_size`, `contact.phone_e164`, `contact.street_address`, `contact.address_locality`, `contact.latitude/longitude`, `contact.opens/closes`, `schema.*`
- `assets/vendor/fontawesome/fa-subset.css` và 3 tệp woff2
- `assets/images/brand/{favicon-48.png, apple-touch-icon-180.png, motoopen-logo-192.webp, icon-512.png}`

**A.1 Chatbot trang chủ** (S2, E1b, GEO-02, PERF-11, critic-02)
- Hiện tại chatbot hiện "Nguyen Tu", `tel:0942467674` và báo giá sai: Vision 1,4tr/tháng; Wave 600k/tuần; "50cc 1 tuần" bị hiểu thành 50 ngày, khoảng 10tr.
- Đề xuất: thay thẻ `<script defer src=".../motoai_v39...js">` bằng `{% include motoai.html %}`, đúng cấu hình 12 trang con đang dùng. Không sửa tệp JS dùng chung.
- Kiểm thử Playwright trên bản build:
  - Tên hiển thị "Motoopen — Đang hoạt động"; nút gọi, Zalo và bản đồ trỏ đúng 0857255868.
  - "giá vision 1 tháng" → 1.800.000đ; "giá air blade 1 tháng" → 1.500.000đ; "giá thuê wave 1 tuần" → 700.000đ.
  - "thuê 50cc 1 tuần" và "giá sh 1 ngày" → "cần kiểm tra… Zalo".
  - Câu hỏi về cọc và giao xe nhận câu trả lời trung tính.
  - 0 yêu cầu tải du-lieu; khóa lưu trữ là `Motoopen_chothuexemayhanoi_*`; DOM không còn NAP lạ.
- Ảnh hưởng: lịch sử chat cũ (khóa `MotoAI_v38_*`) không mang sang. Chatbot chỉ tải khi trang rảnh hoặc khi khách tương tác lần đầu.

**A.2 Hiệu năng** (PERF-10, PERF-01/critic-05, PERF-06/07/12)
- Favicon và apple-touch dùng tệp tự host, thay ảnh chụp bảng giá cũ.
- Font Awesome 6.5.2 từ CDN đổi sang `fa-subset.css` tự host.
- Bỏ `page-fade.js` và `fontawesome-fallback.js`.
- Bỏ `.reveal` ở hero.
- Thêm (không thay) rule `main#main{padding-top:var(--top-offset,68px)}` vào `home.css`. Trong các trang tải `home.css`, chỉ trang chủ có `<main id="main">`, nên blog không đổi.
- Logo khối giới thiệu: dùng webp 5,5 KB thay JPEG 85 KB, tải lazy.
- Số lab của auditor PERF trên bản mẫu: request 48→24; dung lượng 757→226 KB; thời gian tải 3,68→2,0 s; LCP bằng FCP. Đây là số lab, không bảo đảm số liệu người dùng thật.
- Kiểm thử của tôi: CLS 0; hero `opacity 1` cả khi tắt JS; padding 68px ngay từ lần vẽ đầu; `check_fa_subset` PASS.
- Không đưa vào: PERF-10(g) WebP cho ảnh xe, vì tệp .webp chỉ có trong `audit-perf/deliverables`.

**A.3 Nội dung trang chủ** (GEO-05, E14, E7, E4, GEO-13, S6/E6). 12 tệp `_includes/home/*` và `hero-pricing.js`:
- **Giá và cọc**: tháng "1–2 triệu" → "900k–2 triệu". Wave/Click: tuần 700k, tháng 900k–1.200k. Vision tuần 1.000k. Air Blade: tuần 1.000k, tháng 1.500k. Cọc "1–5" → "2–5 triệu", gồm cả nút Ngày/Tuần/Tháng ở hero.
- **50cc và xe điện**: 50cc 200k/ngày, tuần/tháng báo giá, cọc 4tr. Xe điện "Liên hệ".
- **Mẫu ngoài bảng giá**: "tay côn 350k" → "Mẫu khác (xe côn tay…) – liên hệ để kiểm tra xe và giá". Giữ ảnh IMG_5431 vì CI bắt buộc.
- **Câu trung tính**: phí 20–50k và danh sách quận → "khu vực giao và phí giao (nếu có) được báo trước khi chốt". "Nhận CMND…" → "Thanh toán tiền thuê, đặt cọc và cung cấp giấy tờ theo thỏa thuận; hoàn cọc theo điều kiện hợp đồng khi trả xe". CMND → CCCD.
- **Luật 36/2024**: "học sinh" → "người từ đủ 16 tuổi"; xe gắn máy (≤50 cm3, tốc độ thiết kế ≤50 km/h) không cần GPLX, người lái đủ 16 tuổi; xe côn tay cần GPLX A1 (≤125 cm3) hoặc A.
- **Ảnh**: "ảnh thật" → "ảnh mẫu của hãng"; alt đúng; width/height 600.
- **Đánh giá**: 6 trích dẫn kèm 5 sao không có nguồn (một câu còn ghi "tháng từ 1 triệu") → liên kết tới đánh giá trên Google Maps.

**A.4 JSON-LD và FAQ** (S6, S7, critic-09)
- `schema.html` lấy dữ liệu từ `site.yml`. Các nút Organization, AutoRental, WebSite **giống hệt** đồ thị trang con (đã so trên bản build).
- Đã bỏ: `aggregateRating` 4.8/37 cùng 5 Review; 16 trang Facebook theo quận; TripAdvisor "Công Tân". Không có postalCode. `sameAs` chỉ còn Facebook motoopenvn và Instagram motoopen.
- FAQ: `_data/home_faq.yml` là nguồn duy nhất cho 17 câu hiển thị và cho FAQPage. Khớp 17/17; trước đây 0/16 khớp và thiếu 1 câu.
- Service lấy mô tả từ `prices.yml`; không dùng AggregateOffer trộn giá ngày với giá tháng.
- Theo thông báo của Google (08/2023), FAQ rich result chỉ hiện cho site chính phủ và y tế. Giá trị ở đây là dữ liệu nhất quán cho máy tìm kiếm và AI.
- Pinterest có thể thêm cho cả hai đồ thị qua `site.yml`.

**A.5 du-lieu và moto_sitemap.json** (T12, GEO-01, S1, critic-05)
- Viết lại 11 tệp với NAP Motoopen, giá và cọc chuẩn (script đã kiểm mọi số tiền), chính sách trung tính và quy định bằng lái có nguồn.
- Đã bỏ: "24/7", "15–30 phút", "phí 20–100k", giá của SH/Vespa/PCX, các đoạn chat ChatGPT còn sót. Mỗi tệp dưới 2.000 ký tự.
- Xóa `huongdanthue.txt` (văn bản của "Nguyễn Tú", 0942 467 674; kiểm lại 16/11 vẫn trả 200).
- `moto_sitemap.json`: "/" thay cho index.html, bỏ dòng huongdanthue, cập nhật lastUpdate.
- Nếu duyệt A.1 thì chatbot không còn đọc du-lieu, nhưng A.5 vẫn cần vì các tệp công khai. Phương án thay thế: loại du-lieu khỏi build qua `_config.yml`.

**A.6 Header/footer trang chủ** (T11/OFF-03, PERF-08)
- "@ Motoopen" đang trỏ tới `motoopen.github.io/appthuexemay/` (tiêu đề "…– Nguyễn Tú") → đổi sang trỏ về trang chủ.
- Logo trang chủ: JPEG 85 KB trên postimg → webp 5,5 KB.
- Sau đó khóa `social.app` không còn dùng. Xóa khóa này cần Tổng Thống duyệt.

**A.7 (Tùy chọn)** Footer mọi trang ghi "…xe máy đã qua sử dụng chất lượng để **bán** và cho thuê…". Nếu Motoopen không bán xe (C10), đổi thành "Motoopen cho thuê xe máy theo ngày, tuần, tháng tại Hà Nội."

**A.8 Đã kiểm chứng**
- `--check` đạt.
- Các tổ hợp 3-2, 2-3, 1-3, 3-1-2, 5-4-3-2-1 đều đạt. Áp dụng tuần tự cho kết quả giống hệt patch tổng.
- Build không lỗi.
- `index.html` sau A còn 0 lần các chuỗi: "Nguyen Tu", "0942467674", "1–5 triệu", "1.400k", "Giá như Vision", "350k", "20k", "CMND", "appthuexemay", "cdnjs", "page-fade". Còn lại "1–2 triệu" ×2 và "postimg" ×2, đều nằm trong `<meta>` (thuộc mục B và og:image).
- CI: check_site_links (332 trang, 42.668 liên kết), check_blog_quality (301 bài), check_seo_rules, check_fa_subset đều PASS. 6 ảnh xe vẫn được tham chiếu.

**A.9 Chưa đưa vào**
- Các ước tính chưa có nguồn: "10–20 triệu mua xe cũ", "10–30+ triệu", "lựa chọn của rất nhiều người", "xe đời mới". Cần chủ xác nhận hoặc cho bỏ con số.
- H1 trang chủ giữ nguyên.
- og:image chờ logo thật.

## B. Title & meta – một đề xuất cho mỗi URL
Script đã chạy `--check` đạt trên HEAD và trên cây làm việc. Đã áp dụng thử trên bản sao và build lại: CI PASS. Ngoài các thẻ đã nêu, nội dung trang không đổi. og:/twitter: đi cùng title/desc tương ứng.

- **B1 `/`** (IDX-08, GEO-05)
  - Title giữ nguyên.
  - Desc hiện tại: "…Giá thuê tháng từ 1–2 triệu… Cọc nhẹ…"
  - Desc đề xuất: "Thuê xe máy tháng Hà Nội giao tận nơi: xe ga, xe số, 50cc/điện. Giá tháng 900k–2 triệu, ngày từ 150k, cọc 2–5 triệu tùy xe. Hợp đồng rõ ràng." og/twitter dùng cùng số liệu.
  - Lý do: snippet đang hiển thị giá sai.
- **B2 `/chinhsachbaomat.html`** (gộp T16a, IDX-08, 7b-11, E5; critic-07)
  - Title hiện tại: "Giới Thiệu Motoopen: Dịch Vụ Thuê Xe Máy Hà Nội Uy Tín, Cọc Nhẹ".
  - Title đề xuất: "Chính Sách Bảo Mật Thông Tin Khách Hàng | Motoopen".
  - Desc: "Chính sách bảo mật của Motoopen: thông tin nhận khi bạn liên hệ và thuê xe máy, mục đích sử dụng, dữ liệu trên website và cách yêu cầu xem, sửa, xóa."
  - Xóa meta keywords.
  - Không nêu cách xử lý CCCD vì chưa chốt.
- **B3 `/loaixe.html`** (IDX-08, 7b-11)
  - Title hiện tại: "Cho thuê xe máy các loại theo Tháng Hà Nội - Motoopen".
  - Title đề xuất: "Các Loại Xe Cho Thuê Hà Nội: Xe Số, Xe Ga, 50cc | Motoopen".
  - Desc liệt kê Wave, Vision, Air Blade, Click/Mio, tay ga 50cc, xe điện; bỏ "xe côn".
  - Lý do: đang cạnh tranh từ khóa "tháng" với trang chủ.
- **B4 `/mangxahoi.html`** (IDX-08, 7b-11)
  - Title đề xuất: "Mạng Xã Hội Của Motoopen: Facebook, Instagram, Zalo".
  - Desc: "Theo dõi và nhắn tin cho Motoopen qua Facebook, Instagram và Zalo 0857 255 868 – cửa hàng thuê xe máy tại 114 Nguyễn Văn Cừ, Long Biên, Hà Nội."
- **B5 `/huongdan.html`** (IDX-08)
  - Title đề xuất: "Quy Trình 5 Bước Thuê Xe Máy Theo Tháng Ở Hà Nội | Motoopen".
  - Desc giữ nguyên.
- **B6 `/lienhe.html`** (E12)
  - Desc hiện tại nhắc "form gửi yêu cầu", nhưng form đã bị gỡ.
  - Desc đề xuất: "Liên hệ Motoopen thuê xe máy Hà Nội: gọi/Zalo 0857 255 868, email motoopen12@gmail.com, cửa hàng 114 Nguyễn Văn Cừ, Long Biên, mở 09:00–21:00 hằng ngày."
  - og/twitter: "Địa chỉ, bản đồ, điện thoại, Zalo và email của Motoopen."
  - Xóa meta keywords. Title giữ nguyên.
- **B7 `/404.html`** (T15/T16b): trong `_layouts/default.html` thêm `{% if page.url == '/404.html' %}<meta name="robots" content="noindex, follow">{% endif %}`.
- **B8 `/blog/gioi-thieu-motoopen/`** (S9b): thêm description 153 ký tự, chỉ dùng dữ kiện chuẩn. Lý do: đoạn trích hiện tại dính chữ "xe điệncho".
- **B9 `/blog/bang-lai-quoc-te-thue-xe-may-viet-nam/`** (E14): "Bằng lái quốc tế khi thuê xe máy ở Việt Nam: điều kiện để được công nhận, giấy tờ phải mang kèm và cách kiểm tra hạng xe trước khi thuê." Câu viết trung tính, không thêm khẳng định pháp lý.
- **B10 `/blog/thue-xe-50cc-khong-can-bang-lai/`** (E14; Luật 36/2024 Đ34 k1 g, Đ56 k4, Đ59 k1 a)
  - Câu cũ gọi điều đúng là "nhầm lẫn".
  - Đề xuất: "Xe 50cc đúng chuẩn xe gắn máy không cần bằng lái nhưng người lái phải đủ 16 tuổi; cách kiểm tra dung tích, công suất và tốc độ thiết kế trước khi thuê."
- **B11 (tùy chọn) `/banggia.html`**: desc có giá chuẩn. Lý do: truy vấn giá đang vào trang chủ (IDX-09).
- **B12 (tùy chọn) `/faq.html`**: bỏ chữ "bảo hành", vì site không có dịch vụ này.

Các title khác giữ nguyên. Google tự chọn snippet; không bảo đảm Google dùng đúng câu đề xuất.

## C. Quyết định chính sách cần chốt
Trong lúc chờ, mọi trang dùng câu: "thanh toán tiền thuê, đặt cọc và cung cấp giấy tờ theo thỏa thuận; hoàn cọc theo điều kiện hợp đồng khi trả xe". Câu trả lời có thể lưu thành khóa mới trong `site.yml`.

1. **Hình thức đặt cọc** (GEO-13, E4; site đang có 5 phiên bản).
   - (a) tiền mặt hoặc chuyển khoản 2–5tr;
   - (b) tiền cọc và xuất trình giấy tờ để đối chiếu;
   - (c) có trường hợp nhận giấy tờ thay tiền cọc, kèm điều kiện.
   - Khuyến nghị: (a) hoặc (b).
2. **Giấy tờ tùy thân.** Luật Căn cước 2023 Điều 7: khoản 2 cấm giữ thẻ căn cước trái quy định; khoản 7 cấm cầm cố thẻ căn cước.
   - (a) chỉ đối chiếu và ghi thông tin vào hợp đồng;
   - (b) đối chiếu và chụp ảnh (phải nêu trong chính sách bảo mật);
   - (c) giữ bản gốc: không khuyến nghị, nên hỏi luật sư.
   - Quy định về giữ hộ chiếu [chưa xác minh].
3. **Bảo hiểm**: faq ghi "không cung cấp", điều khoản ghi "có cho thuê tháng". (a) không kèm; (b) có kèm – loại nào, ai trả.
4. **Giao xe**: khu vực nào; phí bao nhiêu (site đang có 3 mức: 20–50k, 30–50k, 20–100k); thuê ngắn ngày có giao không; thời gian giao.
5. **Ưu đãi** cho sinh viên, bộ đội, người cao tuổi: bỏ, hoặc công bố điều kiện.
6. **Hỗ trợ ngoài giờ hoặc cứu hộ 24/7**: có hay không. Nếu không, giữ 09:00–21:00.
7. **Danh mục xe thực có** (SH, Lead, Vespa, Future, Sirius, Cub, Exciter, Winner, xe côn tay 350k?, VinFast): thêm vào bảng giá, hoặc giữ câu "mẫu khác: liên hệ".
8. **Tuổi tối thiểu người thuê** (chính sách của tiệm; dữ liệu cũ ghi 18).
9. **Địa chỉ**: "114 Nguyễn Văn Cừ, Long Biên, Hà Nội", "…phường Bồ Đề, Hà Nội" (như Google Maps và ceovanta) hoặc "phường Bồ Đề (Long Biên)". Chọn **một** chuỗi và dùng ở mọi nơi. Đổi giá trị trong `site.yml` cần duyệt.
10. **Motoopen có bán xe đã qua sử dụng không?** (A7)
11. **6 testimonial trên trang chủ** có thật và truy được nguồn không? Nếu có, đưa lại kèm nguồn; không bao giờ gắn sao vào JSON-LD.
12. **Quan hệ với "Nguyễn Tú"** (tiệm tại 112 Nguyễn Văn Cừ, 0942 467 674, thuexemaynguyentu.com).
    - (a) tách biệt hoàn toàn, không dùng tên hay số của Nguyễn Tú trên tài sản Motoopen;
    - (b) công khai cùng người điều hành: viết trên trang Giới thiệu với tên thật (có đồng ý công bố), sau đó mới thêm `founder` vào schema.
13. **`chothuexemayhanoi.ceovanta.com`** (critic-01: 200, "…| Motoopen", số 0857 255 868 xuất hiện 26 lần, là website trên GBP, khoảng 78 URL trùng chủ đề, không chép nội dung).
    - (A) ceovanta là site chính: ngừng bài mới ở github.io; bài trùng đặt `canonical_url` sang ceovanta và `sitemap: false`.
    - (B) github.io là site chính: đổi website trên GBP; canonical Yoast trỏ sang github.io.
    - (C) giữ cả hai với vai trò khác nhau; mỗi trang chủ liên kết sang site kia một lần, không đặt ở footer; đổi ý định 78 bài trùng.
    - **Phải chốt trước mọi việc gộp hoặc viết lại lớn.**
14. **TripAdvisor d17515297 "Công Tân" và hàng "Công Tân – 31A Dương Quảng Hàm – 0857 255 868" trên VinWonders** (OFF-02, critic-09).
    - (a) là Motoopen: nhận quyền quản lý, sửa tên và địa chỉ, nhờ VinWonders sửa, rồi mới đưa vào `sameAs`;
    - (b) không phải: ngừng dùng số 0857 255 868 cho "Công Tân", nhờ sửa số.
    - Áp dụng tương tự cho 15 trang Facebook theo quận.

Câu hỏi phụ:
- Các dự án `/thuexemayohoankiem/` ("Nguyễn Hào", 0942 467 674) và `/appthuexemay/` ("Nguyễn Tú") đang cùng host: chuyển đi, đổi sang thương hiệu Motoopen, hay gỡ?
- `motoopen.com` đã hết hạn (16/11: "Your domain is expired"): có gia hạn và đặt 301 không (OFF-01)?

## D. Việc bên ngoài

**D.1 Search Console** (T02, IDX-01/02/09, 7b-12, critic-01)
1. Đăng nhập bằng tài khoản đã tạo thẻ xác minh. Nếu chưa có property: thêm URL-prefix `https://motoopen.github.io/chothuexemayhanoi/`, xác minh bằng **tệp HTML** đặt ở gốc repo (không phải sửa meta).
2. Thêm user có quyền Full cho tài khoản dùng với công cụ SEO.
3. Gửi `sitemap.xml` (331 URL, kiểm lại 16/11); xóa các sitemap cũ đang 404.
4. Kiểm tra URL theo `gsc-url-inspection.csv` (38 URL). Chỉ "Request indexing" cho 9 trang chính và 2 hub, sau khi bản sửa đã lên.
5. Xuất các báo cáo Pages (Discovered/Crawled not indexed, Duplicate, 404) vào `_seo/reports/`.
6. Xác minh thêm property ceovanta để so sánh truy vấn.

Lưu ý: kết luận "0/301 bài được index" mới dựa trên dò `site:` của bên thứ ba, **chưa được GSC xác nhận**.

**D.2 Bing và IndexNow**
- Bing: nhập từ GSC. Nếu không nhập được thư mục con thì xác minh bằng tệp XML.
- IndexNow:
  - Tạo khóa bằng `openssl rand -hex 16`.
  - Đặt tệp `<khóa>.txt` ở gốc repo.
  - Sau mỗi lần đổi nội dung chạy `indexnow_submit.sh <khóa> <URL…>`.
  - Mã 200/202 nghĩa là đã nhận, không phải đã index. Google không dùng IndexNow.

**D.3 robots.txt gốc** (T02, IDX-11, GEO-10)
- Trên GitHub `motoopen`, tạo repo đúng tên `motoopen.github.io`; bật Pages từ main /(root). Không thêm CNAME.
- Thêm `D-external/motoopen.github.io/robots.txt`: Allow tất cả và Sitemap của Motoopen. Sitemap của các dự án khác và chặn Ahrefs/Semrush để ở dạng chú thích.
- Bot AI vẫn được phép (được phép không bảo đảm được trích dẫn).
- Kiểm tra: `curl` trả 200; GSC → robots.txt report.

**D.4 Google Business Profile** (OFF-04, S8, E13)
- Tên đúng như biển hiệu, bỏ tiền tố "Cho thuê xe máy Hà Nội -".
- Danh mục: Motorcycle rental agency, kèm Scooter rental service.
- Website theo C13; địa chỉ theo C9; số +84 857 255 868; giờ 09–21 cả tuần, khớp từng ký tự với `site.yml`.
- Dịch vụ chép đúng bảng giá; đăng ảnh thật.
- Xin đánh giá từ mọi khách thật, không tặng quà, không lọc khách; trả lời mọi đánh giá.
- Báo trùng hoặc xin gộp với ghim cũ (place `0x3135a9686036b131:0x60f95e3a89369325`). Lấy mã nhúng bản đồ cho trang Liên hệ.
- Sau đó làm Bing Places và Apple Business Connect với cùng NAP.

**D.5 Ảnh thật** (E7, critic-10, S10)
- 6 ảnh hiện tại là ảnh studio của hãng. GPS trong ảnh trỏ gần hồ Hoàn Kiếm (nhóm triển khai đã xóa EXIF).
- Ảnh "thực tế do cửa hàng cung cấp" trên ceovanta [chưa xác minh là xe Motoopen]. Tổng Thống xác nhận trước, rồi:
  1. lấy bản gốc;
  2. chạy `exiftool -all=`;
  3. lưu `assets/images/vehicles/motoopen-<mẫu>-thuc-te.webp`;
  4. dùng trên banggia/loaixe với alt "ảnh thực tế tại Motoopen";
  5. giữ các tệp `IMG_54xx.jpeg` vì CI cần.
- Nếu không có, chụp 6–10 ảnh tại 114 Nguyễn Văn Cừ và tải cùng bộ lên GBP.
- Logo vuông có chữ "Motoopen", tối thiểu 512 px, để thay ảnh "ZALO 0857.255.868" ở og/schema. Việc này cần duyệt riêng.

## E. Off-page

**E.1 Chính sách mạng lưới cùng chủ** (OFF-05)
- Không dùng hreflang giữa các domain.
- Chỉ liên kết chéo khi người đọc thật sự cần: tối đa 1 liên kết/bài và 3 bài cho mỗi cặp domain; chỉ trong thân bài.
- Anchor dùng tên thương hiệu; mặc định `nofollow` (`sponsored` nếu có tiền/hoa hồng); ghi "(cùng chủ sở hữu)".
- Không liên kết qua lại, không tạo vòng.
- Không làm trang vệ tinh. Không dùng chung số điện thoại giữa thương hiệu; mỗi site chỉ hiện NAP của chính nó.
- Lập sổ theo dõi liên kết chéo, xem hằng quý. Không canonical chéo domain, trừ khi chọn C13.

**E.2 GitBook** (OFF-01)
- `moto-open.gitbook.io/openmoto` vẫn trả 200 (16/11). Theo auditor: 168 liên kết tới `motoopen.com` (đã hết hạn), NAP lẫn lộn (0942467674 ×57), giá sai.
- Việc cần làm: gỡ trang hoặc tắt index. **Không** đổi các liên kết sang github.io. Không cần disavow.

**E.3 Nguồn** (OFF-06/07; chi tiết trong CSV; mở được 200 ngày 16/11 trừ khi ghi khác)
- Điều kiện chung: chỉ liên hệ báo chí sau khi xong C14 và D.4. Không trả tiền đổi link dofollow; mọi vị trí trả phí dùng `sponsored`.
- Trích dẫn địa phương: GBP, Bing Places, Apple Business Connect, Trang Vàng (403), Yellow Pages VN (403; tạo listing Motoopen riêng).
- Danh bạ dựng từ Maps: vietnamtourism.com. Chỉ cải thiện GBP, không trả tiền.
- Sàn và rao vặt (chỉ để có khách, không phải SEO): bikesbooking, muaban, Riderly (403).
- Báo tiếng Việt: vinwonders (chỉ khi C14=a), mytour, toplist, mia, vinpearl (403).
- Báo tiếng Anh: localvietnam, travelchinaguide, gobackpacking, madmonkeyhostels (403). theculturetrip và madornomad [chưa xác minh lại: lỗi kết nối / 520].
- Cộng đồng (nofollow): r/Hanoi, expat.com, rideasia. Luôn ghi rõ "mình làm ở Motoopen".
- Sửa thông tin sai, không xin link: motorbike-thu-ha.gitbook.io (112 → 114, bỏ chữ "chuỗi").
- **Tránh**: Wikivoyage, danh bạ cào dữ liệu, guest post dofollow trả phí, gửi danh bạ hàng loạt, trang Web 2.0.
- Hiện trạng backlink (OFF-08): khoảng 2 domain (Ubersuggest, tính cả host). Theo dõi qua GSC Links và Bing Backlinks hằng tháng.

## F. Kế hoạch gộp (critic-08) – CHƯA làm
- `merge-map.json` = 14 nhóm của 7b-06 + 3 nhóm chỉ IDX-03 có (tuần, không cọc, sinh viên). Tổng 17 nhóm, 57 URL, cộng 12 bài khu vực cần "viết lại bằng dữ kiện thật hoặc gộp".
- Mọi slug đã được kiểm là có tồn tại. 11 nhóm có hai winner khác nhau, đã ghi cả hai.
- **Điều kiện trước**: dữ liệu GSC ≥28 ngày và kết quả gsc_monitor; đã chốt C13; đã chốt C4 trước khi gộp 25 bài giao-nhan.
- **Quy tắc chọn**:
  - Bài bị gộp có ≥10 click/28 ngày: chuyển phần riêng sang winner, rồi redirect.
  - 0 hiển thị: gộp ngay.
  - Bài bị gộp có nhiều click hơn winner: đổi nó thành winner.
  - Hai winner hòa: giữ lựa chọn 7b-06.
- **Thứ tự**:
  1. Chuyển dữ kiện đã kiểm chứng sang winner, xóa tệp bị gộp, thêm `redirect_from` vào winner.
  2. Thêm `plugins: [jekyll-redirect-from]` vào `_config.yml`. Plugin có sẵn trong `actions/jekyll-build-pages`; build cục bộ cần `gem install jekyll-redirect-from`.
  3. Thay các liên kết nội bộ cũ (tối đa 1 liên kết/đoạn).
  4. Chỉ sau đó mới viết lại winner.
  - Trong lúc chờ, chỉ sửa lỗi dữ kiện.
  - Phương án mềm: `canonical_url` kèm `sitemap: false`.
- **CI đổi cùng commit**: trong matrix đặt `"status":"merged","merged_into":"<slug>"`, rồi dùng
  `test "$(jq '[.items[] | select(.status == "published" or .status == "merged")] | length' _seo/article-matrix-300.json)" -eq 300`
  và kiểm tra `_site/blog/<merged_into>/index.html` tồn tại. Ba URL CI đang kiểm cứng không nằm trong bản đồ gộp.
- **Kiểm chứng**: URL cũ trả trang chuyển hướng (meta refresh + canonical); sitemap không còn URL cũ; check_site_links PASS. Sau 4–8 tuần, hiển thị của nhóm không thấp hơn tổng trước gộp (không bảo đảm tăng).

## G. Theo dõi & bảo trì
- **Hằng tuần**: GSC Pages và Sitemaps; gửi IndexNow cho URL vừa đổi; hỏi thử chatbot 3 câu.
- **Hằng tháng**:
  1. Xuất Performance 3 tháng (so với kỳ trước) và một tệp truy vấn×trang, rồi chạy
     `python3 scripts/gsc_monitor.py --export <zip> --query-page <csv> --sitemap https://motoopen.github.io/chothuexemayhanoi/sitemap.xml --matrix _seo/article-matrix-300.json --out _seo/reports/gsc-YYYY-MM.md`
     Script chỉ đọc tệp xuất, không cần khóa API. Với dữ liệu ít, coi kết quả là tín hiệu để xem xét, không phải kết luận.
  2. GSC/Bing Links.
  3. Chạy lại 4 script CI.
  4. Cập nhật `external-seo-data.json` chỉ bằng số xuất thật.
- **Hằng quý**: rà NAP trên các trích dẫn; sổ liên kết chéo; bản đồ gộp; CWV.
- **KPI** (không cam kết):
  - số URL Indexed / 331;
  - số truy vấn có hiển thị; % truy vấn vào đúng URL; số truy vấn striking distance;
  - click và hiển thị cho các head term;
  - GBP: cuộc gọi, lượt bấm website, chỉ đường, đánh giá mới;
  - số domain trỏ về; CWV.
- **Danh sách làm mới 7b-13** (ghi `last_modified_at` khi sửa thật):
  - Mục 1–13 đang được các nhóm triển khai sửa.
  - Mục 14 `thue-xe-may-dai-han-ha-noi`: lúc lập báo cáo **chưa thấy** đoạn giá tháng.
  - Mục 15 `giao-xe-tan-noi-hay-tu-den-nhan-xe`: **chưa có** mục "Nhận xe theo khu vực" (chỉ đưa vào các khu vực chốt ở C4).
  - Không thêm bài mới khi bài cũ chưa được index.

## Phụ lục – ghi chú cho các nhóm triển khai
1. Chatbot (cấu hình chung): "số điện thoại" không được nhận là ý định liên hệ; "wave 1 tuần" (thiếu chữ "giá") nhận câu fallback. Thấy trên banggia hiện tại và trên trang chủ sau A.1. Nếu sửa, nên đưa vào khóa cấu hình mới để giữ nguyên hành vi trang chủ hiện tại.
2. URL `vanban.chinhphu.vn/?pageid=27160&docid=211194…` bị timeout từ môi trường này ngày 16/11 (auditor trước đó ghi 200). Nên mở thử bằng trình duyệt.
3. Thông tư 108/2026/TT-BCA: chỉ trích dẫn khi có URL văn bản chính thức đã kiểm tra.
