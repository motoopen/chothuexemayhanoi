  (function(){
    /* SCRIPT ĐỂ LOAD FADE-IN (BỊ THAY THẾ BỞI SCRIPT TRONG HEAD) */
    // document.addEventListener('DOMContentLoaded', ()=> document.documentElement.classList.add('is-ready'));

    const topbar   = document.getElementById('topbar');
    // const hamburger= document.getElementById('hamburger'); // Đã định nghĩa ở dưới
    // const drawer   = document.getElementById('drawer'); // Đã định nghĩa ở dưới
    // const overlay  = document.getElementById('drawerOverlay'); // Đã định nghĩa ở dưới

    // === (B) top padding avoid cover (an toàn + không double) ===
    (function(){
      const topbar = document.getElementById('topbar');
      const padStyle = document.createElement('style');
      padStyle.textContent = 'main{padding-top:var(--top-offset,84px) !important}';
      document.head.appendChild(padStyle);
      function setBodyTop(){
        const h = topbar?.getBoundingClientRect?.().height || 76;
        document.documentElement.style.setProperty('--top-offset', (h + 8) + 'px');
      }
      setBodyTop();
      window.addEventListener('resize', setBodyTop, {passive:true});
    })();

    
    // ===== JAVASCRIPT NÂNG CẤP MENU (CODE ĐÃ SỬA) =====
    // Drawer logic mượt cho cả 3 thiết bị
    const hamburger = document.getElementById('hamburger');
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    const svcToggle = document.getElementById('drawerServiceToggle');
    const svcMenu = document.getElementById('drawerServiceMenu');

    function openDrawer(state){
      if(state){
        drawer.classList.add('open'); overlay.classList.add('active');
        drawer.setAttribute('aria-hidden','false'); // (YÊU CẦU 2)
      }else{
        drawer.classList.remove('open'); overlay.classList.remove('active');
        drawer.setAttribute('aria-hidden','true'); // (YÊU CẦU 2)
      }
      // cập nhật cho hamburger (YÊU CẦU 2)
      document.getElementById('hamburger')?.setAttribute('aria-expanded', String(!!state));
    }
    hamburger?.addEventListener('click', ()=>openDrawer(!drawer.classList.contains('open')));
    overlay?.addEventListener('click', ()=>openDrawer(false));
    // Đóng drawer khi click vào link <a>
    drawer?.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>openDrawer(false)));

    // Xử lý accordion cho menu Dịch vụ
    svcToggle?.addEventListener('click', ()=>{
      const open = svcMenu.classList.toggle('open');
      svcToggle.classList.toggle('open', open);
      svcToggle.setAttribute('aria-expanded', String(open)); // (YÊU CẦU 2)
    });
    // ===== KẾT THÚC JAVASCRIPT MENU ĐÃ SỬA =====

    // (YÊU CẦU 1) Mở/đóng dropdown desktop bằng click (hữu ích cho iPad/laptop)
    const ddToggle = document.querySelector('.nav-dropdown .dropdown-toggle');
    const ddWrap   = ddToggle?.closest('.nav-dropdown');
    if (ddToggle && ddWrap){
      ddToggle.addEventListener('click', (e)=>{
        e.preventDefault();
        ddWrap.classList.toggle('open');
      });
      // Đóng khi click ra ngoài
      document.addEventListener('click', (e)=>{
        if(!ddWrap.contains(e.target)) ddWrap.classList.remove('open');
      });
    }


    // topbar scrolled style
    addEventListener('scroll', ()=>{
      (scrollY>8)? topbar.classList.add('scrolled') : topbar.classList.remove('scrolled');
    }, {passive:true});

    // dark mode
    const DARK_KEY='darkModeEnabled';
    const dDesktop=document.getElementById('toggle-dark-desktop');
    const dMobile =document.getElementById('toggle-dark-mobile');
    const dDrawer =document.getElementById('drawerToggleDark'); // Nút dark mode mới trong drawer

    function applyDark(on){ 
      document.body.classList.toggle('dark', !!on); 
      localStorage.setItem(DARK_KEY, on?'true':'false');
      
      const ico = on? '<i class="fa-solid fa-sun"></i>':'<i class="fa-solid fa-moon"></i>';
      
      // Cập nhật icon cho 2 nút cũ
      if(dDesktop) dDesktop.innerHTML=ico; 
      if(dMobile) dMobile.innerHTML=ico;

      // === (C) Cập nhật nút mới trong drawer (icon + class 'active' cho nút gạt) ===
      if(dDrawer){
        const firstIcon = dDrawer.querySelector('i');
        if(firstIcon){
          firstIcon.className = on ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
        dDrawer.classList.toggle('active', !!on);
      }
    }
    
    let pref=localStorage.getItem(DARK_KEY); 
    if(pref===null) pref = window.matchMedia('(prefers-color-scheme:dark)').matches?'true':'false';
    applyDark(pref==='true');
    
    // Gắn event listener cho cả 3 nút
    [dDesktop,dMobile,dDrawer].forEach(b=>b&&b.addEventListener('click',()=>applyDark(!document.body.classList.contains('dark'))));


    // ===== TOC (H2 only) =====
    const tocFab = document.getElementById('tocFab');
    const tocDrawer = document.getElementById('tocDrawer');
    const tocList = document.getElementById('tocList');
    function buildTOC(){
      /* CHỈNH SỬA: Lấy H2 từ cả main và .mapp-card .sx-head / .sx-rev h2 */
      /* CẬP NHẬT CHO TRANG DICHVU: CHỈ LẤY H2 TỪ .mapp-card */
      // (SEO) CẬP NHẬT: Code này sẽ tự động lấy H2 từ .mapp-card, đúng với cấu trúc trang mới
      const h2s = Array.from(document.querySelectorAll('.mapp-card .mapp-h2'));
      tocList.innerHTML = h2s.map((h,i)=>{
        if(!h.id){ h.id='h2-toc-'+(i+1); } // Đảm bảo ID là duy nhất
        return `<a href="#${h.id}">${h.textContent.trim()}</a>`;
      }).join('');
      // Đóng TOC khi click vào link
      tocList.querySelectorAll?.('a')?.forEach?.(a => {
        a.addEventListener('click', () => tocDrawer.classList.remove('open'));
      });
    }
    buildTOC();
    tocFab.addEventListener('click', (e)=>{ e.stopPropagation(); tocDrawer.classList.toggle('open'); });
    document.addEventListener('click', (e)=>{ if(!tocDrawer.contains(e.target) && e.target!==tocFab) tocDrawer.classList.remove('open'); });

    // ===== FAQ polish (optional: auto-close others) =====
    /* CHỈNH SỬA: Lấy FAQ từ cả .faq và .mapp-qa */
    const faqs = document.querySelectorAll('.faq, .mapp-card'); // Lấy các container
    faqs.forEach(faqContainer => {
      if(faqContainer){
        faqContainer.addEventListener('toggle', (e)=>{
          if(e.target.tagName==='DETAILS' && e.target.open){
            faqContainer.querySelectorAll('details').forEach(d=>{ if(d!==e.target) d.removeAttribute('open'); });
          }
        }, true);
      }
    });


    // ===== Mini-app bottom sheet =====
    const miniToggle = document.getElementById('miniAppToggle');
    const miniSheet  = document.getElementById('miniAppSheet');
    if(miniToggle && miniSheet){
      miniToggle.addEventListener('click', (e)=>{ e.stopPropagation(); miniSheet.style.display = (miniSheet.style.display==='block'?'none':'block'); });
      document.addEventListener('click', (e)=>{ if(!miniSheet.contains(e.target) && e.target!==miniToggle) miniSheet.style.display='none'; });
      // Tự đóng khi click link
      miniSheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => miniSheet.style.display='none'));
    }

    // ===== iOS/Safari blur leak fix for MotoAI overlay =====
    const style = document.createElement('style');
    style.textContent = '#motoai-overlay{isolation:isolate}';
    document.head.appendChild(style);
  })();
