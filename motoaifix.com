<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MotoAI v13Pro Test</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      background: #f9f9f9;
      color: #222;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    main { flex: 1; padding: 24px; }
    footer { text-align: center; padding: 12px; opacity: .6; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <h1>Kiểm thử MotoAI v13Pro</h1>
    <p>Ấn vào biểu tượng 🤖 ở góc trái dưới để kiểm tra AI hoạt động (Dark/Light mode).</p>
  </main>

  <footer>© 2025 MotoOpen Demo</footer>

  <!-- Nhúng mã AI -->
  <!-- MotoAI v13Pro Adaptive -->
  <script>
  (function(){
    const s = document.createElement('script');
    s.src = "https://motoopen.github.io/chothuexemayhanoi/ai13pro.js";
    s.onload = ()=>console.log("✅ MotoAI v13Pro loaded!");
    s.onerror = ()=>console.error("❌ Không tải được ai13pro.js!");
    document.body.appendChild(s);
  })();
  </script>
  <!-- /MotoAI -->
</body>
</html>
