#!/usr/bin/env python3
"""Section B of the owner proposals: <title> / <meta> changes, one entry per URL.

Run from the repository root AFTER the owner approves:
    python3 B-apply_title_meta.py --check            # dry run: every old string must be found once
    python3 B-apply_title_meta.py --apply            # apply all approved entries
    python3 B-apply_title_meta.py --apply --only B1,B2,B7

Every edit is an exact-string replacement that must match exactly once, so the
script refuses to run on a file that has drifted. It never touches anything but
the listed <title>/<meta> lines and front-matter `description:` lines.
Entries marked P2 are optional (lower priority); they run only with --only.
"""
import argparse, sys
from pathlib import Path

E = {}  # id -> dict(url, files=[(path, [(old, new), ...])], p2=bool)

def entry(i, url, edits, p2=False):
    E[i] = {"url": url, "edits": edits, "p2": p2}

def meta(name, content):     return f'<meta name="{name}" content="{content}">'
def prop(name, content):     return f'<meta property="{name}" content="{content}">'

# B1 – homepage: price in snippet contradicts the price table (IDX-08, GEO-05); title unchanged.
entry("B1", "/", [("index.html", [
    (meta("description", "Thuê xe máy tháng Hà Nội giao tận nơi: xe ga, xe số, 50cc/điện. Giá thuê tháng từ 1–2 triệu, thuê ngày từ 150k. Cọc nhẹ, hợp đồng rõ ràng."),
     meta("description", "Thuê xe máy tháng Hà Nội giao tận nơi: xe ga, xe số, 50cc/điện. Giá tháng 900k–2 triệu, ngày từ 150k, cọc 2–5 triệu tùy xe. Hợp đồng rõ ràng.")),
    (prop("og:description", "Thuê xe máy theo tháng Hà Nội: xe ga • xe số • 50cc/điện — giao tận nơi, cọc nhẹ. Giá tháng từ 1–2 triệu, ngày từ 150k."),
     prop("og:description", "Thuê xe máy theo tháng Hà Nội: xe ga • xe số • 50cc/điện — giao tận nơi. Giá tháng 900k–2 triệu, ngày từ 150k, cọc 2–5 triệu.")),
    (meta("twitter:description", "Thuê xe máy dài hạn Hà Nội: cọc nhẹ, giao nhận tận nơi. Thuê ngày/tuần/tháng."),
     meta("twitter:description", "Thuê xe máy dài hạn Hà Nội: giá tháng 900k–2 triệu, cọc 2–5 triệu tùy xe, giao nhận tận nơi. Thuê ngày/tuần/tháng.")),
])])

# B2 – privacy page still carries the About page's title/meta (T16a, IDX-08, 7b-11, E5 merged; critic-07: no ID-practice claim).
PT = "Chính Sách Bảo Mật Thông Tin Khách Hàng | Motoopen"
PD = "Chính sách bảo mật của Motoopen: thông tin nhận khi bạn liên hệ và thuê xe máy, mục đích sử dụng, dữ liệu trên website và cách yêu cầu xem, sửa, xóa."
entry("B2", "/chinhsachbaomat.html", [("chinhsachbaomat.html", [
    ("<title>Giới Thiệu Motoopen: Dịch Vụ Thuê Xe Máy Hà Nội Uy Tín, Cọc Nhẹ</title>", f"<title>{PT}</title>"),
    (meta("description", "Tìm hiểu về Motoopen, dịch vụ cho thuê xe máy Hà Nội uy tín. Chúng tôi cam kết giao xe tận nơi, thủ tục cọc nhẹ và bảo dưỡng xe định kỳ. Gọi ngay!"), meta("description", PD)),
    ("  " + meta("keywords", "giới thiệu thuê xe máy hà nội, về motoopen, thuê xe máy hà nội uy tín, dịch vụ thuê xe máy hà nội, thuê xe máy cọc nhẹ hà nội, thuê xe máy giao tận nơi") + "\n", ""),
    (prop("og:title", "Giới Thiệu Motoopen: Dịch Vụ Thuê Xe Máy Hà Nội Uy Tín"), prop("og:title", PT)),
    (prop("og:description", "Tìm hiểu về dịch vụ thuê xe máy Hà Nội uy tín của Motoopen. Cam kết giao tận nơi, cọc nhẹ, xe bảo dưỡng định kỳ."), prop("og:description", PD)),
    (meta("twitter:title", "Giới Thiệu Motoopen: Dịch Vụ Thuê Xe Máy Hà Nội Uy Tín"), meta("twitter:title", PT)),
    (meta("twitter:description", "Tìm hiểu về dịch vụ thuê xe máy Hà Nội uy tín của Motoopen."), meta("twitter:description", PD)),
])])

# B3 – loaixe competes with the homepage for the monthly head term; lists "xe côn" not in the price table (IDX-08, 7b-11).
LT = "Các Loại Xe Cho Thuê Hà Nội: Xe Số, Xe Ga, 50cc | Motoopen"
LD = "Các mẫu xe Motoopen cho thuê tại Hà Nội: Honda Wave, Vision, Air Blade, Click/Yamaha Mio, tay ga 50cc và xe điện. So sánh nhanh để chọn xe hợp nhu cầu."
OLD_L = "Motoopen chuyên cho thuê xe máy các loại theo tháng tại Hà Nội. Đa dạng xe số, xe ga, xe côn. Thủ tục nhanh, giá tốt, cọc linh hoạt."
entry("B3", "/loaixe.html", [("loaixe.html", [
    ("<title>Cho thuê xe máy các loại theo Tháng Hà Nội - Motoopen</title>", f"<title>{LT}</title>"),
    (meta("description", OLD_L + " Liên hệ ngay!"), meta("description", LD)),
    (prop("og:title", "Cho thuê xe máy các loại theo Tháng Hà Nội - Motoopen"), prop("og:title", LT)),
    (prop("og:description", OLD_L), prop("og:description", LD)),
    (meta("twitter:title", "Cho thuê xe máy các loại theo Tháng Hà Nội - Motoopen"), meta("twitter:title", LT)),
    (meta("twitter:description", OLD_L), meta("twitter:description", LD)),
])])

# B4 – mangxahoi title targets the monthly head term instead of the page's purpose (IDX-08, 7b-11).
MT = "Mạng Xã Hội Của Motoopen: Facebook, Instagram, Zalo"
MD = "Theo dõi và nhắn tin cho Motoopen qua Facebook, Instagram và Zalo 0857 255 868 – cửa hàng thuê xe máy tại 114 Nguyễn Văn Cừ, Long Biên, Hà Nội."
OLD_MT = "Kết Nối Mạng Xã Hội Motoopen | Cho thuê xe máy các loại theo Tháng Hà Nội"
OLD_MD = "Kết nối với Motoopen qua các kênh mạng xã hội: Facebook, Instagram, Pinterest. Cập nhật thông tin mới nhất về dịch vụ &quot;Cho thuê xe máy các loại theo Tháng Hà Nội&quot;."
entry("B4", "/mangxahoi.html", [("mangxahoi.html", [
    (f"<title>{OLD_MT}</title>", f"<title>{MT}</title>"),
    (meta("description", OLD_MD), meta("description", MD)),
    (prop("og:title", OLD_MT), prop("og:title", MT)),
    (prop("og:description", OLD_MD), prop("og:description", MD)),
    (meta("twitter:title", OLD_MT), meta("twitter:title", MT)),
    (meta("twitter:description", OLD_MD), meta("twitter:description", MD)),
])])

# B5 – huongdan: lead with the process intent, not the commercial head term (IDX-08). Description unchanged.
HT = "Quy Trình 5 Bước Thuê Xe Máy Theo Tháng Ở Hà Nội | Motoopen"
OLD_HT = "Hướng Dẫn Thuê Xe Máy Tháng Hà Nội | Quy Trình 5 Bước | Motoopen"
entry("B5", "/huongdan.html", [("huongdan.html", [
    (f"<title>{OLD_HT}</title>", f"<title>{HT}</title>"),
    (prop("og:title", OLD_HT), prop("og:title", HT)),
    (meta("twitter:title", OLD_HT), meta("twitter:title", HT)),
])])

# B6 – lienhe: meta keywords/description advertise a contact form that no longer exists (E12); keywords removed.
LHD = "Liên hệ Motoopen thuê xe máy Hà Nội: gọi/Zalo 0857 255 868, email motoopen12@gmail.com, cửa hàng 114 Nguyễn Văn Cừ, Long Biên, mở 09:00–21:00 hằng ngày."
LHO = "Địa chỉ, bản đồ, điện thoại, Zalo và email của Motoopen."
entry("B6", "/lienhe.html", [("lienhe.html", [
    (meta("description", "Liên hệ Motoopen để thuê xe máy tại Hà Nội. Thông tin liên hệ, địa chỉ, bản đồ, và form gửi yêu cầu. Gọi ngay 0857255868 để được hỗ trợ nhanh nhất."), meta("description", LHD)),
    ("  " + meta("keywords", "thông tin liên hệ thuê xe máy, motoopen, liên hệ motoopen, địa chỉ thuê xe máy hà nội, form liên hệ thuê xe máy, số điện thoại motoopen") + "\n", ""),
    (prop("og:description", "Địa chỉ, bản đồ, SĐT, Zalo và form liên hệ nhanh của Motoopen."), prop("og:description", LHO)),
    (meta("twitter:description", "Địa chỉ, bản đồ, SĐT, Zalo và form liên hệ nhanh."), meta("twitter:description", LHO)),
])])

# B7 – 404 page: noindex (T15/T16b). Inserted right after the layout's meta description line.
DESC_LINE_PREFIX = '  <meta name="description" content="{% if page.description %}'
NOINDEX = "  {% if page.url == '/404.html' %}<meta name=\"robots\" content=\"noindex, follow\">{% endif %}\n"
entry("B7", "/404.html (mọi URL không tồn tại)", [("_layouts/default.html", [("@@insert-after-line@@" + DESC_LINE_PREFIX, NOINDEX)])])

# B8 – only post without description: excerpt joins words across a line break ("xe điệncho") (S9 option b).
entry("B8", "/blog/gioi-thieu-motoopen/", [("_posts/2025-10-28-gioi-thieu-motoopen.md", [
    ('title: "Giới thiệu về Motoopen"\n',
     'title: "Giới thiệu về Motoopen"\n'
     'description: "Motoopen cho thuê xe máy tại 114 Nguyễn Văn Cừ, Long Biên, Hà Nội: xe số, xe ga, 50cc và xe điện theo ngày, tuần, tháng; giá ngày từ 150k, cọc 2–5 triệu."\n'),
])])

# B9 – E14: description implies the IDP question depends on "dưới 50cc" (misleading). Neutral wording.
entry("B9", "/blog/bang-lai-quoc-te-thue-xe-may-viet-nam/", [("_posts/2026-10-07-bang-lai-quoc-te-thue-xe-may-viet-nam.md", [
    ('description: "Bằng lái quốc tế khi thuê xe máy ở Việt Nam cần kiểm tra hiệu lực kỹ, vì không phải loại nào cũng cho phép điều khiển xe máy dưới 50cc hay trên 50cc."',
     'description: "Bằng lái quốc tế khi thuê xe máy ở Việt Nam: điều kiện để được công nhận, giấy tờ phải mang kèm và cách kiểm tra hạng xe trước khi thuê."'),
])])

# B10 – E14: description calls a true statement a "nhầm lẫn" (Luật 36/2024 Điều 34 k1 g, Điều 56 k4, Điều 59 k1 a).
entry("B10", "/blog/thue-xe-50cc-khong-can-bang-lai/", [("_posts/2026-10-07-thue-xe-50cc-khong-can-bang-lai.md", [
    ('description: "Thuê xe 50cc không cần bằng lái là nhầm lẫn về quy định, điều kiện người lái tách riêng với dung tích xe, bài này chỉ cách kiểm tra đúng trước khi thuê."',
     'description: "Xe 50cc đúng chuẩn xe gắn máy không cần bằng lái nhưng người lái phải đủ 16 tuổi; cách kiểm tra dung tích, công suất và tốc độ thiết kế trước khi thuê."'),
])])

# P2 (optional) – banggia: price queries land on the homepage; put the canonical numbers in the snippet (IDX-07/IDX-09).
entry("B11", "/banggia.html", [("banggia.html", [
    (meta("description", "Xem bảng giá thuê xe máy Hà Nội theo ngày, tuần, tháng. Giá rẻ cho xe số, xe ga, 50cc. Cập nhật mới nhất, thủ tục cọc nhẹ."),
     meta("description", "Bảng giá thuê xe máy Hà Nội tại Motoopen: Wave, Click/Mio 150k/ngày; Vision, Air Blade 200k/ngày; tuần 700k–1 triệu; tháng 900k–2 triệu; cọc 2–5 triệu.")),
])], p2=True)

# P2 (optional) – faq: "bảo hành" is not a service the site describes anywhere.
entry("B12", "/faq.html", [("faq.html", [
    (meta("description", "Giải đáp các câu hỏi thường gặp (FAQ) về dịch vụ thuê xe máy Hà Nội tại Motoopen. Thông tin về giá, thủ tục, đặt cọc, và bảo hành."),
     meta("description", "Giải đáp câu hỏi thường gặp khi thuê xe máy Hà Nội tại Motoopen: giá, thủ tục, đặt cọc, bằng lái, giao nhận và trả xe.")),
])], p2=True)


def run(root, ids, apply):
    ok = True
    for i in ids:
        e = E[i]
        for path, edits in e["edits"]:
            p = root / path
            if not p.exists():
                print(f"[{i}] MISSING FILE {path}"); ok = False; continue
            s = p.read_text("utf-8"); file_ok = True
            for old, new in edits:
                if old.startswith("@@insert-after-line@@"):
                    prefix = old[len("@@insert-after-line@@"):]
                    lines = s.splitlines(keepends=True)
                    hits = [k for k, l in enumerate(lines) if l.startswith(prefix)]
                    if new in s:
                        print(f"[{i}] {path}: already applied"); continue
                    if len(hits) != 1:
                        print(f"[{i}] {path}: anchor found {len(hits)}x"); ok = file_ok = False; continue
                    lines.insert(hits[0] + 1, new); s = "".join(lines)
                    print(f"[{i}] {path}: insert OK")
                    continue
                n = s.count(old)
                if n == 0 and new and s.count(new) >= 1:
                    print(f"[{i}] {path}: already applied: {new[:60]!r}"); continue
                if n != 1:
                    print(f"[{i}] {path}: expected 1, found {n}: {old[:80]!r}"); ok = file_ok = False; continue
                s = s.replace(old, new); print(f"[{i}] {path}: OK {old[:50]!r}")
            if apply and file_ok:
                p.write_text(s, "utf-8")
    return ok


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--check", action="store_true")
    g.add_argument("--apply", action="store_true")
    ap.add_argument("--only", help="comma-separated ids, e.g. B1,B2 (P2 entries run only when listed)")
    ap.add_argument("--root", default=".")
    a = ap.parse_args()
    ids = a.only.split(",") if a.only else [k for k, v in E.items() if not v["p2"]]
    bad = [i for i in ids if i not in E]
    if bad: sys.exit(f"unknown ids: {bad}")
    ok = run(Path(a.root), ids, apply=a.apply)
    print("RESULT:", "OK" if ok else "FAILED (files with errors were not written)")
    sys.exit(0 if ok else 1)
