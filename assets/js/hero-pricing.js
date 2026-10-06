    (function() {
      const card = document.querySelector('.hero-mini .card');
      if (!card) return;
      if (!('IntersectionObserver' in window)) {
        card.classList.add('in');
      } else {
        const io = new IntersectionObserver((es) => {
          es.forEach(e => {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              io.unobserve(e.target);
            }
          });
        }, {
          threshold: .15
        });
        io.observe(card);
      }

      const map = {
        day: {
          price: '150–200k/ngày',
          cta: 'theo ngày',
          deposit: 'Cọc 1–5 triệu tuỳ xe'
        },
        week: {
          price: '600–1.000k/tuần',
          cta: 'theo tuần',
          deposit: 'Cọc 1–5 triệu tuỳ xe'
        },
        month: {
          price: '1–2 triệu/tháng',
          cta: 'theo tháng',
          deposit: 'Cọc 1–5 triệu tuỳ xe'
        }
      };
      const priceEl = document.getElementById('hminiPrice');
      const ctaEl = document.getElementById('hminiCtaLabel');
      const depositEl = document.getElementById('hminiDeposit');
      const buttons = document.querySelectorAll('.hmini-toggle button');

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          const plan = btn.getAttribute('data-plan');
          if (priceEl) priceEl.textContent = map[plan].price;
          if (ctaEl) ctaEl.textContent = map[plan].cta;
          if (depositEl) depositEl.textContent = map[plan].deposit;
        });
      });
    })();
