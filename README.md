## 🚀 Giới thiệu

**MotoAI** hoạt động hoàn toàn **trên trình duyệt** (client-side).  
Người dùng chỉ cần **nhúng 1 dòng script**, và trợ lý AI sẽ tự khởi động, đọc nội dung trang web (corpus learning), ghi nhớ và phản hồi bằng tiếng Việt tự nhiên.  

Không cần backend. Không cần tài khoản. Không tốn phí API.  
→ **AI chạy 100% độc lập, tốc độ cao, bảo mật tuyệt đối.**

---

## 🏍 Ứng dụng thực tế

MotoAI đã được triển khai và thử nghiệm tại nhiều **trang web thuê xe máy tại Hà Nội**, bao gồm:

- 🌐 [https://thuexemaynguyentu.com](https://thuexemaynguyentu.com)  
- 🌐 [https://rentbikehanoi.com](https://rentbikehanoi.com)  
- 🌐 [https://motoopen.github.io/chothuexemayhanoi/](https://motoopen.github.io/chothuexemayhanoi/)

AI có thể:
- Trả lời các câu hỏi tự nhiên:  
  > “Xe ga giá bao nhiêu?” – “Thủ tục thuê xe cần gì?” – “Có giao xe tận nơi không?”
- Nhận biết và chào lại khách hàng cũ.  
- Tự học nội dung website sau mỗi 72 giờ.  
- Tự điều chỉnh giao diện (Dark/Light mode).  
- Hoạt động ổn định trên điện thoại, iPhone, Android, và cả offline.

---

## 🧩 Tính năng nổi bật

| Loại tính năng | Mô tả |
|-----------------|-------|
| 💬 **Chat tiếng Việt tự nhiên** | Xử lý ngôn ngữ tiếng Việt có dấu & không dấu, nhận biết chủ đề như “xe số”, “xe ga”, “thủ tục”, “liên hệ”… |
| 🧠 **SmartEngine v13** | Bộ não mới của MotoAI — nhận dạng ngữ cảnh, trả lời theo quy tắc và nội dung học được từ web. |
| 🔤 **SpellFix Engine** | Tự động sửa lỗi chính tả (ví dụ: “thue xe may” → “thuê xe máy”). |
| 📚 **Corpus Learning** | Tự học từ nội dung các trang HTML, tiêu đề và đoạn văn. |
| 🪶 **Apple-style UI** | Giao diện trong suốt, bo tròn tinh tế, tương thích Dark/Light Mode. |
| 🔒 **100% Client-side** | Không gửi dữ liệu ra ngoài, không cần API key, bảo mật người dùng. |

---

## ⚙️ Cách tích hợp nhanh

Thêm đoạn mã dưới vào cuối trang web (trước `</body>`):

```html
<script src="https://motoopen.github.io/chothuexemayhanoi/motoai_v10_hybrid_pro.js"></script>

Sau khi tải xong, biểu tượng 🤖 MotoAI Assistant sẽ xuất hiện ở góc trái màn hình.
Người dùng có thể bấm vào để chat, hỏi giá thuê xe, hoặc nhận tư vấn.

⸻

🧱 Các phiên bản đã phát hành

Phiên bản	Mô tả chính	Ghi chú
v1 – v5	Bản cơ bản, chat tĩnh, chưa có tự học.	Legacy
v6 – v9	Bắt đầu tích hợp học nội dung trang web (DOM-based learning).	Classic
v10 Hybrid Pro	Bản ổn định, giao diện Apple-style, logic song song v10 + v13.	⭐ Khuyến nghị
v13 Combo Standalone	Bản thông minh nhất: SmartEngine + AutoLearn + SpellFix.	🧠 Premium


⸻

🧩 Cấu trúc repo

📦 /chothuexemayhanoi
 ┣ 📜 motoai_v1.js
 ┣ 📜 motoai_v5_classic.js
 ┣ 📜 motoai_v10_hybrid_pro.js
 ┣ 📜 motoai_v13_combo_standalone.js
 ┣ 📜 moto_sitemap.json
 ┣ 📄 README.md

Toàn bộ file .js là các phiên bản MotoAI từ v1 đến v13,
được lưu lại để phục vụ nghiên cứu và demo công khai trên GitHub Pages.

⸻

💡 Lợi ích cho SEO & Website Việt

MotoAI không chỉ là AI chatbot mà còn là công cụ SEO tự nhiên.
Khi nhúng vào trang web, mỗi phiên bản AI sẽ tự đọc nội dung,
ghi nhớ từ khóa và phản hồi theo chính nội dung đó —
→ giúp Google hiểu rõ chủ đề của trang hơn.

Ngoài ra, việc lưu trữ mã nguồn công khai tại
👉 https://motoopen.github.io/chothuexemayhanoi/
giúp tăng tín hiệu liên kết về các trang chính như:
	•	thuexemaynguyentu.com
	•	rentbikehanoi.com

⸻

🧑‍💻 Tác giả & phát triển

MotoOpen Developer Team

Dự án mã nguồn mở phát triển AI tiếng Việt không cần máy chủ,
phục vụ cho các website nhỏ, startup và doanh nghiệp địa phương.

	•	🌐 Website: https://motoopen.github.io/chothuexemayhanoi/
	•	📞 Hotline / Zalo: 085.725.5868
	•	📧 Email: motoopen.vn@gmail.com

⸻

🧾 Giấy phép

MIT License — được phép sử dụng miễn phí cho cá nhân, doanh nghiệp, học tập và thương mại.
Vui lòng giữ credit “MotoAI by MotoOpen” khi chia sẻ lại hoặc tái phân phối.

⸻

🗓️ Changelog

Ngày cập nhật	Phiên bản	Nội dung
2024-07	v10 Hybrid Pro	Ra mắt giao diện Apple-style, hỗ trợ iPhone & iPad.
2024-08	v11 Auto Adaptive	Thêm chế độ Dark/Light tự động.
2024-09	v12 Stable	Sửa lỗi Safari, tăng tốc load.
2024-10	v13 Combo Standalone	Gộp v10 + v13 thành bản hoàn thiện nhất.
2025-01	v10 Ultra Smart	Tối ưu lại core, học nhanh hơn 300%.


⸻

🌟 Tầm nhìn

MotoAI hướng tới việc giúp mọi website Việt Nam có trợ lý AI riêng,
hỗ trợ khách hàng 24/7 mà không cần thuê server hay lập trình viên.

Từ thuê xe máy, bán hàng, du lịch, đến dịch vụ nhỏ lẻ,
bất cứ ai cũng có thể thêm AI thông minh vào website chỉ với 1 dòng mã.

⸻

© 2025 MotoOpen — MotoAI Ultra Smart Framework for Vietnamese Services.

---

## 📦 Hướng dẫn thêm nhanh:
1. Vào repo của bạn: [motoopen/chothuexemayhanoi](https://github.com/motoopen/chothuexemayhanoi)  
2. Nhấn **Add file → Create new file**  
3. Đặt tên **`README.md`**  
4. Dán **toàn bộ nội dung ở trên** vào.  
5. Nhấn **Commit changes** ✅  

---

# 🧠 MotoAI v14 — GPT-3.5 Combo (Smart Engine + UI Apple-Style)

**MotoAI** là hệ thống trí tuệ nhân tạo học tại chỗ (on-page learning AI) dành riêng cho website **cho thuê xe máy**.  
Bản **v14 Combo** là bản hợp thể giữa:

- 🔹 **MotoAI v13 Smart Engine** — máy học + auto corpus + adaptive rules  
- 🔹 **MotoAI v9.8 Apple-style UI** — giao diện bong bóng đẹp, nhẹ, tương thích iOS  
- 🔹 ⚙️ **GPT-3.5 Hybrid Logic** — cải thiện hiểu ngôn ngữ, fix theme sáng/tối, auto sitemap reload  

---

## 🚀 Cách nhúng nhanh (HTML)

Thêm vào cuối file `index.html` (trước `</body>`):

```html
<!-- 🤖 MotoAI v14 — GPT-3.5 Combo -->
<script src="https://motoopen.github.io/chothuexemayhanoi/motoai_v14_gpt35_combo.js"></script>

<!-- 🧠 Auto theme + sitemap checker -->
<script>
document.addEventListener("DOMContentLoaded", () => {
  const s=document.createElement("style");
  s.textContent="@media(prefers-color-scheme:light){.m-msg.bot{background:#fff!important;color:#0b1220!important;}}@media(prefers-color-scheme:dark){.m-msg.bot{background:#1c1c20!important;color:#eee!important;}}";
  document.head.appendChild(s);

  setTimeout(()=>{ 
    if(window.MotoAI){
      console.log('✅ MotoAI v14 GPT-3.5 Combo ready:',window.MotoAI);
    } else {
      const r=document.createElement('script');
      r.src='https://motoopen.github.io/chothuexemayhanoi/motoai_v14_gpt35_combo.js?'+Date.now();
      document.body.appendChild(r);
    }
  },1500);
});
</script>

<!-- 🧠 Kiểm tra sitemap & ép học lại khi thay đổi -->
<script>
fetch("https://motoopen.github.io/chothuexemayhanoi/moto_sitemap.json")
  .then(r=>r.text())
  .then(t=>{
    const hash=btoa(t);
    const old=localStorage.getItem("MotoAI_lastSitemapVersion");
    if(old!==hash){
      console.log("🆕 Sitemap thay đổi — AI sẽ học lại!");
      localStorage.removeItem("MotoAI_lastLearn");
      localStorage.setItem("MotoAI_lastSitemapVersion",hash);
      setTimeout(()=>location.reload(),800);
    }
  })
  .catch(e=>console.warn("⚠️ Không kiểm tra được sitemap:",e));
</script>


⸻

📂 Cấu trúc thư mục

/chothuexemayhanoi/
│
├── index.html
├── motoai_v14_gpt35_combo.js       # AI chính (UI + engine + learn logic)
├── motoai_v13_98_combo.js          # Bản nền hợp thể (Smart + UI)
├── moto_sitemap.json               # Danh sách nguồn dữ liệu học
│
├── /du-lieu/
│   ├── xeso.txt
│   ├── xega.txt
│   ├── xe50cc.txt
│   ├── thutuc.txt
│   ├── hoidap.txt
│   └── (thêm nếu cần)
│
└── /assets/, /css/, /img/...

🗺️ File moto_sitemap.json

AI sẽ đọc nội dung từ danh sách này để tự học và cập nhật corpus.

{
  "pages": [
    "https://motoopen.github.io/chothuexemayhanoi/index.html",
    "https://motoopen.github.io/chothuexemayhanoi/gioithieu.html",
    "https://motoopen.github.io/chothuexemayhanoi/banggia.html",
    "https://motoopen.github.io/chothuexemayhanoi/du-lieu/xega.txt",
    "https://motoopen.github.io/chothuexemayhanoi/du-lieu/xeso.txt",
    "https://motoopen.github.io/chothuexemayhanoi/du-lieu/xe50cc.txt",
    "https://motoopen.github.io/chothuexemayhanoi/du-lieu/thutuc.txt",
    "https://motoopen.github.io/chothuexemayhanoi/du-lieu/hoidap.txt"
  ]
}

🧩 Khi moto_sitemap.json thay đổi, AI sẽ tự so sánh bản hash và tự học lại trong vòng 1–2 giây.


⸻

⚙️ Tính năng nổi bật


⸻

🧱 Hướng dẫn triển khai WordPress (footer)

Dán đoạn sau vào plugin Insert Headers and Footers → mục Scripts in Footer:

<!-- 🤖 MotoAI v14 GPT-3.5 Combo -->
<script src="https://motoopen.github.io/chothuexemayhanoi/motoai_v14_gpt35_combo.js?ver=14.1"></script>

⚠️ Nếu dùng WP Rocket / Autoptimize: thêm motoai_v14_gpt35_combo.js vào danh sách Exclude from JS combine/minify.

🌍 Đa ngôn ngữ

Muốn dùng trên site tiếng Anh:
	•	Sao chép file motoai_v14_gpt35_combo.js
	•	Tạo moto_sitemap_en.json
	•	Thay sitemapPath trong JS thành file tiếng Anh.

⸻

👨‍💻 Nhà phát triển

Tác giả: Tuấn Tú Nguyễn
Dự án: MotoOpen / chothuexemayhanoi
Phiên bản hiện tại: v14 GPT-3.5 Combo
Cập nhật gần nhất: 2025-10-26

⸻

✨ MotoAI — hướng tới trợ lý AI học tại chỗ cho mọi website địa phương, không cần API, không cần server, hoạt động hoàn toàn offline sau khi load xong dữ liệu.




