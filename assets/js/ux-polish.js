    (function() {
      try {
        if (window.__UXP_POLISH_V2__ || new URLSearchParams(location.search).has('no-ux2')) return;
        window.__UXP_POLISH_V2__ = true;
        document.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.altKey && (e.key === 'u' || e.key === 'U')) {
            document.body.toggleAttribute('data-ux2-disabled');
            console.log('UX2 toggle:', document.body.hasAttribute('data-ux2-disabled') ? 'OFF' : 'ON');
          }
        }, {
          passive: true
        });
        document.documentElement.classList.add('uxp-root');
        const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
          for (const it of entries) {
            if (it.isIntersecting) {
              it.target.classList.add('in');
              io.unobserve(it.target);
            }
          }
        }, {
          rootMargin: '0px 0px -10% 0px',
          threshold: 0.08
        }) : null;
        if (io) {
          document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
        }
        const s = document.createElement('style');
        s.setAttribute('data-ux2', '');
        s.textContent = `
        :root{--uxp-ease:cubic-bezier(.22,1,.36,1)}
        html.uxp-root body:not([data-ux2-disabled]) :where(a,button,.hmini-tile,.sx-card,.mapp-btn,.hmini-btn,.menu-item,.menu-grid-item){
          transition:transform .22s var(--uxp-ease),box-shadow .22s var(--uxp-ease),background-color .22s var(--uxp-ease),opacity .22s var(--uxp-ease);
          will-change:transform;
        }
        html.uxp-root body:not([data-ux2-disabled]) :where(.hmini-tile,.sx-card){transform:translateZ(0)}
        html.uxp-root body:not([data-ux2-disabled]) :where(.hmini-tile:hover,.sx-card:hover){transform:translateY(-2px);box-shadow:0 14px 28px rgba(0,0,0,.12);}
        html.uxp-root body:not([data-ux2-disabled]) :where(a,button,.mapp-btn,.hmini-btn){touch-action:manipulation;}
        html.uxp-root body:not([data-ux2-disabled]) :where(a,button,.mapp-btn,.hmini-btn):active{transform:scale(0.985);}
        html.uxp-root body:not([data-ux2-disabled]) .hmini-badge{transition:transform .22s var(--uxp-ease),box-shadow .22s var(--uxp-ease);}
        html.uxp-root body:not([data-ux2-disabled]) .hmini-badge:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(10,132,255,.12);}
        @media(prefers-reduced-motion:reduce){html.uxp-root body:not([data-ux2-disabled]) :where(*){transition:none!important;animation:none!important;}}
      `;
        document.head.appendChild(s);
        const s2 = document.createElement('style');
        s2.setAttribute('data-ux2', '');
        s2.textContent = `
        html.uxp-root body.dark:not([data-ux2-disabled]) :where(.hmini-btn.primary,.mapp-btn.primary){filter:saturate(1.05) brightness(1.02);}
        html.uxp-root body:not(.dark):not([data-ux2-disabled]) :where(.hmini-btn.primary,.mapp-btn.primary){filter:saturate(1.08);}
      `;
        document.head.appendChild(s2);
        window.addEventListener('touchstart', () => {}, {
          passive: true
        });
        window.addEventListener('scroll', () => {}, {
          passive: true
        });
        console.log('UX Polishing v2 — Safe mode enabled');
      } catch (err) {
        console.warn('UX Polishing v2 — skipped:', err);
      }
    })();
