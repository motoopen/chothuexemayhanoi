# Motoopen — GitHub Pages / Jekyll

Repository này chạy website:

https://motoopen.github.io/chothuexemayhanoi/

## Cấu trúc hiện tại

- `index.html` — homepage production.
- Các trang public giữ URL `.html` cũ để tránh làm gãy liên kết.
- `_layouts/` — layout Jekyll dùng chung.
- `_includes/` — header và footer dùng chung.
- `_posts/` — bài blog dạng Markdown.
- `blog/index.html` — trang danh sách bài viết.
- `assets/css/` — CSS đã tách khỏi HTML.
- `assets/js/` — JavaScript giao diện đã tách khỏi HTML.
- `du-lieu/` — dữ liệu văn bản hiện có của site/MotoAI.
- `motoai_v39_modelfirst_nomarkdown_nolink.js` — bản MotoAI production hiện tại.
- `service-worker.js` + `manifest.json` — PWA.
- `_archive/` — file test, demo và mã legacy đã cất khỏi site production.
- `.github/workflows/jekyll-branch-check.yml` — build/verify Jekyll cho PR và main.

## URL blog

Bài viết đặt trong:

```
_posts/YYYY-MM-DD-ten-bai.md
```

Mỗi bài dùng layout `post` và được xuất theo dạng:

```
/blog/:title/
```

Trang public cũ vẫn giữ dạng:

```
/banggia.html
/faq.html
/gioithieu.html
...
```

## Quy tắc sửa repo

1. Không đổi URL public cũ nếu chưa có kế hoạch redirect.
2. Không nhét lại CSS/JS lớn vào từng file HTML.
3. Header/footer dùng `_includes/`.
4. Bài blog mới chỉ cần thêm Markdown vào `_posts/`.
5. Không đưa file trong `_archive/` trở lại production nếu chưa xác minh dependency.
6. Mọi thay đổi phải qua `Jekyll Build Check` trước khi merge.

## Sitemap

`sitemap.xml` được Jekyll render và tự thêm toàn bộ bài trong `site.posts`.

## Legacy

Các bản MotoAI cũ, trang test/demo, prompt và file thử nghiệm không bị xóa. Chúng được giữ trong `_archive/legacy/` để có thể tra cứu hoặc phục hồi khi cần.
