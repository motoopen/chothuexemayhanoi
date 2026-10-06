  /* Đánh dấu tab đang active cho Bottom App Bar + tránh đè nút Back-to-top */
  (function(){
    try{
      // đánh dấu Home nếu đang ở trang chủ
      const path = (location.pathname || '').replace(/\/+$/,'');
      if(path.endsWith('/chothuexemayhanoi') || path.endsWith('/chothuexemayhanoi/index.html')){
        document.getElementById('bab-home')?.classList.add('active');
      }

      // Cập nhật: Đánh dấu "Dịch vụ" nếu đang ở trang dịch vụ (nếu có nút)
      if(path.endsWith('/thutuc.html')){
         // (Không có nút Thủ tục trong bottom app bar, nên bỏ qua)
      }


      // đẩy nút .back-top (nếu có) lên trên app bar
      const appbar = document.querySelector('.bottom-appbar');
      const backTop = document.querySelector('.back-top');
      function bumpBackTop(){
        if(!appbar || !backTop) return;
        const h = appbar.getBoundingClientRect().height || 72;
        backTop.style.bottom = (h + 20) + 'px';
      }
      bumpBackTop();
      // === (D) THÊM passive:true CHO RESIZE ===
      window.addEventListener('resize', bumpBackTop, {passive:true});

    }catch(e){ /* no-op */ }
  })();
