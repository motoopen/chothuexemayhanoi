// assets/js/site.js
(function(){
  // Reveal animation: thêm class .show cho .reveal khi DOM sẵn sàng / khi vào viewport
  document.addEventListener('DOMContentLoaded', function(){
    // Thêm .show cho những reveal hiện tại
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('show'));

    // Simple IO để thêm khi scroll vào view
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target); }
        });
      }, { rootMargin:'0px 0px -10% 0px', threshold: 0.06 });
      document.querySelectorAll('.reveal:not(.show)').forEach(el => io.observe(el));
    }

    // Drawer / hamburger
    const ham = document.getElementById('hamburger');
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    function openDrawer(flag){
      if(!drawer || !overlay) return;
      if(flag){ drawer.classList.add('open'); overlay.classList.add('active'); drawer.setAttribute('aria-hidden','false'); }
      else{ drawer.classList.remove('open'); overlay.classList.remove('active'); drawer.setAttribute('aria-hidden','true'); }
      if(ham) ham.setAttribute('aria-expanded', String(!!flag));
    }
    ham?.addEventListener('click', ()=> openDrawer(!drawer.classList.contains('open')));
    overlay?.addEventListener('click', ()=> openDrawer(false));
    drawer?.querySelectorAll('a')?.forEach(a => a.addEventListener('click', ()=> openDrawer(false)));

    // Dark mode toggle: các nút có id theo site (toggle-dark-desktop, toggle-dark-mobile, drawerToggleDark)
    const KEY='darkModeEnabled';
    function applyDark(on){
      document.body.classList.toggle('dark', !!on);
      try{ localStorage.setItem(KEY, on?'true':'false'); }catch(e){}
    }
    let pref = null;
    try{ pref = localStorage.getItem(KEY); }catch(e){}
    if(pref === null) pref = (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches) ? 'true' : 'false';
    applyDark(pref === 'true');
    ['toggle-dark-desktop','toggle-dark-mobile','drawerToggleDark'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.addEventListener('click', ()=> applyDark(!document.body.classList.contains('dark')));
    });

    // passive listeners to avoid iOS issues
    window.addEventListener('touchstart', ()=>{}, {passive:true});
  });

})();
