    (function() {
      const topbar = document.getElementById('topbar');
      
      (function() {
        const topbar = document.getElementById('topbar');
        const padStyle = document.createElement('style');
        padStyle.textContent = 'main{padding-top:var(--top-offset,84px) !important}';
        document.head.appendChild(padStyle);

        function setBodyTop() {
          const h = topbar?.getBoundingClientRect?.().height || 76;
          document.documentElement.style.setProperty('--top-offset', (h + 8) + 'px');
        }
        setBodyTop();
        window.addEventListener('resize', setBodyTop, {
          passive: true
        });
      })();

      const hamburger = document.getElementById('hamburger');
      const drawer = document.getElementById('drawer');
      const overlay = document.getElementById('drawerOverlay');
      const svcToggle = document.getElementById('drawerServiceToggle');
      const svcMenu = document.getElementById('drawerServiceMenu');

      function openDrawer(state) {
        if (state) {
          drawer.classList.add('open');
          overlay.classList.add('active');
          drawer.setAttribute('aria-hidden', 'false'); 
        } else {
          drawer.classList.remove('open');
          overlay.classList.remove('active');
          drawer.setAttribute('aria-hidden', 'true'); 
        }
        document.getElementById('hamburger')?.setAttribute('aria-expanded', String(!!state));
      }
      hamburger?.addEventListener('click', () => openDrawer(!drawer.classList.contains('open')));
      overlay?.addEventListener('click', () => openDrawer(false));
      drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => openDrawer(false)));

      svcToggle?.addEventListener('click', () => {
        const open = svcMenu.classList.toggle('open');
        svcToggle.classList.toggle('open', open);
        svcToggle.setAttribute('aria-expanded', String(open));
      });

      const ddToggle = document.querySelector('.nav-dropdown .dropdown-toggle');
      const ddWrap = ddToggle?.closest('.nav-dropdown');
      if (ddToggle && ddWrap) {
        ddToggle.addEventListener('click', (e) => {
          e.preventDefault();
          ddWrap.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
          if (!ddWrap.contains(e.target)) ddWrap.classList.remove('open');
        });
      }

      addEventListener('scroll', () => {
        (scrollY > 8) ? topbar.classList.add('scrolled'): topbar.classList.remove('scrolled');
      }, {
        passive: true
      });

      const DARK_KEY = 'darkModeEnabled';
      const dDesktop = document.getElementById('toggle-dark-desktop');
      const dMobile = document.getElementById('toggle-dark-mobile');
      const dDrawer = document.getElementById('drawerToggleDark');

      function applyDark(on) {
        document.body.classList.toggle('dark', !!on);
        localStorage.setItem(DARK_KEY, on ? 'true' : 'false');

        const ico = on ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';

        if (dDesktop) dDesktop.innerHTML = ico;
        if (dMobile) dMobile.innerHTML = ico;

        if (dDrawer) {
          const firstIcon = dDrawer.querySelector('i');
          if (firstIcon) {
            firstIcon.className = on ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
          }
          dDrawer.classList.toggle('active', !!on);
        }
      }

      let pref = localStorage.getItem(DARK_KEY);
      if (pref === null) pref = window.matchMedia('(prefers-color-scheme:dark)').matches ? 'true' : 'false';
      applyDark(pref === 'true');

      [dDesktop, dMobile, dDrawer].forEach(b => b && b.addEventListener('click', () => applyDark(!document.body.classList.contains('dark'))));


      /* ===== TOC (H2 only) ===== */
      const tocFab = document.getElementById('tocFab');
      const tocDrawer = document.getElementById('tocDrawer');
      const tocList = document.getElementById('tocList');

      function buildTOC() {
        const h2s = Array.from(document.querySelectorAll('main h2, .mapp-card .sx-head, .mapp-card .sx-rev h2'));
        tocList.innerHTML = h2s.map((h, i) => {
          if (!h.id) {
            h.id = 'h2-toc-' + (i + 1);
          } 
          return `<a href="#${h.id}">${h.textContent.trim()}</a>`;
        }).join('');
        tocList.querySelectorAll?.('a')?.forEach?.(a => {
          a.addEventListener('click', () => tocDrawer.classList.remove('open'));
        });
      }
      buildTOC();
      tocFab.addEventListener('click', (e) => {
        e.stopPropagation();
        tocDrawer.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!tocDrawer.contains(e.target) && e.target !== tocFab) tocDrawer.classList.remove('open');
      });

      /* ===== FAQ polish ===== */
      const faqs = document.querySelectorAll('.faq, .mapp-card'); 
      faqs.forEach(faqContainer => {
        if (faqContainer) {
          faqContainer.addEventListener('toggle', (e) => {
            if (e.target.tagName === 'DETAILS' && e.target.open) {
              faqContainer.querySelectorAll('details').forEach(d => {
                if (d !== e.target) d.removeAttribute('open');
              });
            }
          }, true);
        }
      });

      const miniToggle = document.getElementById('miniAppToggle');
      const miniSheet = document.getElementById('miniAppSheet');
      if (miniToggle && miniSheet) {
        miniToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          miniSheet.style.display = (miniSheet.style.display === 'block' ? 'none' : 'block');
        });
        document.addEventListener('click', (e) => {
          if (!miniSheet.contains(e.target) && e.target !== miniToggle) miniSheet.style.display = 'none';
        });
        miniSheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => miniSheet.style.display = 'none'));
      }

      const style = document.createElement('style');
      style.textContent = '#motoai-overlay{isolation:isolate}';
      document.head.appendChild(style);
    })();
