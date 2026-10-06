    (function() {
      try {
        const path = (location.pathname || '').replace(/\/+$/, '');
        if (path.endsWith('/chothuexemayhanoi') || path.endsWith('/chothuexemayhanoi/index.html')) {
          document.getElementById('bab-home')?.classList.add('active');
        }

        const appbar = document.querySelector('.bottom-appbar');
        const backTop = document.querySelector('.back-top');

        function bumpBackTop() {
          if (!appbar || !backTop) return;
          const h = appbar.getBoundingClientRect().height || 72;
          backTop.style.bottom = (h + 20) + 'px';
        }
        bumpBackTop();
        window.addEventListener('resize', bumpBackTop, {
          passive: true
        });

      } catch (e) {}
    })();
