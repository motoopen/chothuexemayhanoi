    (function() {
      function addFallback() {
        if (document.getElementById('fa-css-fallback')) return;
        var l = document.createElement('link');
        l.id = 'fa-css-fallback';
        l.rel = 'stylesheet';
        l.href = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css';
        document.head.appendChild(l);
      }
      // Nếu link chính lỗi
      var main = document.getElementById('fa-css');
      if (main) main.addEventListener('error', addFallback, {
        once: true
      });

      // Kiểm tra sau khi trang tải xong
      window.addEventListener('load', function() {
        setTimeout(function() {
          try {
            if (!(document.fonts && document.fonts.check('1em "Font Awesome 6 Free"'))) addFallback();
          } catch (e) {
            addFallback();
          }
        }, 300);
      });
    })();
