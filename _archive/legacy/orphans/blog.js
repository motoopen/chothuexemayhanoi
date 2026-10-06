/* blog.js — Unified UX helpers
   - FontAwesome fallback
   - Safe dark/light toggle
   - UX polish (reveal, fade-in 2-way)
   - Smooth anchor scroll + small utilities
   Drop into /assets/js/blog.js and add <script src="/assets/js/blog.js" defer></script>
*/
(function(){
  'use strict';
  try {
    // ---------- 1) Font Awesome fallback ----------
    function addFAFallback(){
      if(document.getElementById('fa-css-fallback')) return;
      var l = document.createElement('link');
      l.id = 'fa-css-fallback';
      l.rel = 'stylesheet';
      l.href = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css';
      document.head.appendChild(l);
      console.log('FA fallback inserted');
    }
    (function ensureFA(){
      try {
        // if main CDN link has id 'fa-css', listen for error
        var main = document.getElementById('fa-css');
        if(main) {
          main.addEventListener('error', addFAFallback, {once:true});
        }
        window.addEventListener('load', function(){
          setTimeout(function(){
            try {
              if(!(document.fonts && document.fonts.check && document.fonts.check('1em "Font Awesome 6 Free"'))) addFAFallback();
            } catch(e){ addFAFallback(); }
          }, 300);
        }, {passive:true});
      } catch(e){ /* silent */ }
    })();


    // ---------- 2) Safe Dark/Light Toggle ----------
    var DARK_KEY = 'darkModeEnabled';
    function applyDark(on){
      try {
        document.body.classList.toggle('dark', !!on);
        localStorage.setItem(DARK_KEY, on ? 'true' : 'false');
      } catch(e){}
      // Update known toggles icons (if exist)
      var ico = on ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
      var ids = ['toggle-dark-desktop','toggle-dark-mobile'];
      ids.forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.innerHTML = ico;
      });
      // Drawer button (if present)
      var dDrawer = document.getElementById('drawerToggleDark');
      if(dDrawer){
        try {
          var first = dDrawer.querySelector('i');
          if(first) first.className = on ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
          dDrawer.classList.toggle('active', !!on);
        } catch(e){}
      }
    }
    (function initDark(){
      var pref = null;
      try { pref = localStorage.getItem(DARK_KEY); } catch(e){}
      if(pref === null) {
        try { pref = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'true' : 'false'; } catch(e){}
      }
      applyDark(pref === 'true');
      ['toggle-dark-desktop','toggle-dark-mobile','drawerToggleDark'].forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.addEventListener('click', function(){ applyDark(!document.body.classList.contains('dark')); }, {passive:true});
      });
    })();


    // ---------- 3) UX Polishing: IntersectionObserver reveal (2-way) ----------
    function setupReveal(selector){
      try {
        var els = Array.from(document.querySelectorAll(selector));
        if(!els.length) return;
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if(entry.isIntersecting){
              entry.target.classList.add('show');
            } else {
              // if you want items to stay visible after shown, comment next line
              entry.target.classList.remove('show');
            }
          });
        }, { threshold: 0.10, rootMargin: '0px 0px -6% 0px' });
        els.forEach(function(el){ io.observe(el); });
      } catch(e){ console.warn('reveal setup failed', e); }
    }
    // apply to common selectors
    document.addEventListener('DOMContentLoaded', function(){
      setupReveal('.reveal');
      setupReveal('.blog-item');
    }, {passive:true});


    // ---------- 4) Smooth anchor scrolling (for TOC / internal links) ----------
    (function smoothAnchors(){
      // native CSS scroll-behavior: smooth present; this adds precise offset handling
      function handleClick(e){
        var a = e.currentTarget;
        var href = a.getAttribute('href') || '';
        if(!href.startsWith('#')) return;
        var id = href.slice(1);
        var el = document.getElementById(id);
        if(!el) return;
        e.preventDefault();
        // compute offset for fixed header (if any)
        var top = el.getBoundingClientRect().top + window.pageYOffset;
        var header = document.querySelector('.topbar');
        var offset = 0;
        if(header) offset = header.getBoundingClientRect().height + 12;
        window.scrollTo({ top: Math.max(0, top - offset), behavior: 'smooth' });
        // close toc if open
        var toc = document.getElementById('tocDrawer');
        if(toc) toc.classList.remove('open');
      }
      document.addEventListener('click', function(e){
        var a = e.target.closest('a[href^="#"]');
        if(a) {
          // only handle same-page anchors
          if(location.pathname.replace(/\/+$/,'') === (a.pathname||location.pathname).replace(/\/+$/,'')) {
            handleClick({ currentTarget: a, preventDefault: function(){} });
            // stop propagation handled via native call above
          }
        }
      }, {passive:true});
      // also attach to existing TOC links
      Array.from(document.querySelectorAll('a[href^="#"]')).forEach(function(a){
        a.addEventListener('click', function(e){
          // only internal
          if(!a.getAttribute('href').startsWith('#')) return;
          e.preventDefault();
          var id = a.getAttribute('href').slice(1);
          var el = document.getElementById(id);
          if(!el) return;
          var header = document.querySelector('.topbar');
          var offset = header ? header.getBoundingClientRect().height + 12 : 0;
          var top = el.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: Math.max(0, top - offset), behavior: 'smooth' });
          // if toc drawer exists, close
          var toc = document.getElementById('tocDrawer');
          if(toc) toc.classList.remove('open');
        }, {passive:true});
      });
    })();


    // ---------- 5) Small utilities (mini sheet toggle / drawer close on link) ----------
    document.addEventListener('DOMContentLoaded', function(){
      // drawer overlay handling (if present)
      try {
        var hamburger = document.getElementById('hamburger');
        var drawer = document.getElementById('drawer');
        var overlay = document.getElementById('drawerOverlay');
        if(hamburger && drawer){
          hamburger.addEventListener('click', function(){ drawer.classList.toggle('open'); if(overlay) overlay.classList.toggle('active'); hamburger.setAttribute('aria-expanded', String(drawer.classList.contains('open'))); }, {passive:true});
        }
        if(overlay){
          overlay.addEventListener('click', function(){ drawer && drawer.classList.remove('open'); overlay.classList.remove('active'); }, {passive:true});
        }
        // close drawer when clicking links inside (nice-to-have)
        if(drawer){
          drawer.querySelectorAll('a').forEach(function(a){
            a.addEventListener('click', function(){ drawer.classList.remove('open'); overlay && overlay.classList.remove('active'); }, {passive:true});
          });
        }
      } catch(e){}
      // miniApp sheet
      try{
        var miniToggle = document.getElementById('miniAppToggle');
        var miniSheet = document.getElementById('miniAppSheet');
        if(miniToggle && miniSheet){
          miniToggle.addEventListener('click', function(ev){ ev.stopPropagation(); miniSheet.style.display = (miniSheet.style.display === 'block') ? 'none' : 'block'; }, {passive:true});
          document.addEventListener('click', function(ev){ if(!miniSheet.contains(ev.target) && ev.target !== miniToggle) miniSheet.style.display = 'none'; }, {passive:true});
          miniSheet.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ miniSheet.style.display = 'none'; }, {passive:true}); });
        }
      }catch(e){}
    }, {passive:true});


    // ---------- 6) LOG for debug (safe) ----------
    try{ console.log('blog.js loaded — reveal, FA-fallback, dark toggle enabled'); }catch(e){}
  } catch(err){
    console.error('blog.js init error', err);
  }
})();
