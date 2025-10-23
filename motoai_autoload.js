// MotoAI Autoloader v3 😎
// Tự động tải AI mới nhất cho toàn bộ site (an toàn cho Safari & iOS)
(function() {
  // Ngăn load trùng
  if (window.MotoAI_LOADED) return;
  window.MotoAI_LOADED = true;

  // Tạo script tag
  const script = document.createElement('script');
  script.src = "https://cdn.jsdelivr.net/gh/motoopen/chothuexemayhanoi@main/motoai_v3.js?v=" + Date.now();
  script.defer = true;
  script.crossOrigin = "anonymous";

  // Gắn vào <head> (đảm bảo load sớm, không ảnh hưởng web)
  document.head.appendChild(script);

  // Ghi log kiểm tra
  script.onload = () => console.log("✅ MotoAI v3 loaded successfully.");
  script.onerror = () => console.warn("⚠️ Không thể tải MotoAI v3. Kiểm tra đường dẫn JS.");
})();
