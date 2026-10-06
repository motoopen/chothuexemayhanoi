  (function(){
    // Appear animation
    const card = document.querySelector('.hero-mini .card');
    if(!card) return;
    if(!('IntersectionObserver' in window)){
      card.classList.add('in'); 
    }else{
      const io = new IntersectionObserver((es)=>{
        es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
      },{threshold:.15});
      // (YÊU CẦU 6) Bỏ dòng card.classList.add('reveal') vì đã có sẵn trong HTML
      io.observe(card);
    }

    // Segmented control logic
    const map = {
      day:   {price:'150–200k/ngày',   cta:'theo ngày'},
      week:  {price:'600–900k/tuần',   cta:'theo tuần'},
      month: {price:'1D–2 triệu/tháng', cta:'theo tháng'}
    };
    const priceEl = document.getElementById('hminiPrice');
    const ctaEl   = document.getElementById('hminiCtaLabel');
    const buttons = document.querySelectorAll('.hmini-toggle button');

    buttons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        buttons.forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
        btn.classList.add('active'); btn.setAttribute('aria-selected','true');
        const plan = btn.getAttribute('data-plan');
        if (priceEl) priceEl.textContent = map[plan].price;
        if (ctaEl) ctaEl.textContent   = map[plan].cta;
      });
    });
  })();
