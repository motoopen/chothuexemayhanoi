// Shared Motoopen navigation behavior for Jekyll/blog pages.
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('show');
    });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
      document.querySelectorAll('.reveal:not(.show)').forEach(function (el) {
        io.observe(el);
      });
    }

    const topbar = document.getElementById('topbar');
    const hamburger = document.getElementById('hamburger');
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    const serviceToggle = document.getElementById('drawerServiceToggle');
    const serviceMenu = document.getElementById('drawerServiceMenu');

    function setTopOffset() {
      const height = topbar && topbar.getBoundingClientRect ? topbar.getBoundingClientRect().height : 76;
      document.documentElement.style.setProperty('--top-offset', (height + 8) + 'px');
    }

    function openDrawer(open) {
      if (!drawer || !overlay) return;
      drawer.classList.toggle('open', !!open);
      overlay.classList.toggle('active', !!open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (hamburger) hamburger.setAttribute('aria-expanded', String(!!open));
    }

    hamburger?.addEventListener('click', function () {
      openDrawer(!drawer?.classList.contains('open'));
    });
    overlay?.addEventListener('click', function () { openDrawer(false); });
    drawer?.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { openDrawer(false); });
    });

    serviceToggle?.addEventListener('click', function () {
      const open = serviceMenu?.classList.toggle('open');
      serviceToggle.classList.toggle('open', !!open);
      serviceToggle.setAttribute('aria-expanded', String(!!open));
    });

    const dropdownToggle = document.querySelector('.nav-dropdown .dropdown-toggle');
    const dropdown = dropdownToggle?.closest('.nav-dropdown');
    dropdownToggle?.addEventListener('click', function (event) {
      event.preventDefault();
      dropdown?.classList.toggle('open');
    });
    document.addEventListener('click', function (event) {
      if (dropdown && !dropdown.contains(event.target)) dropdown.classList.remove('open');
    });

    setTopOffset();
    window.addEventListener('resize', setTopOffset, { passive: true });
    window.addEventListener('scroll', function () {
      topbar?.classList.toggle('scrolled', window.scrollY > 8);
    }, { passive: true });

    const DARK_KEY = 'darkModeEnabled';
    const darkButtons = [
      document.getElementById('toggle-dark-desktop'),
      document.getElementById('toggle-dark-mobile'),
      document.getElementById('drawerToggleDark')
    ];

    function applyDark(on) {
      document.body.classList.toggle('dark', !!on);
      try { localStorage.setItem(DARK_KEY, on ? 'true' : 'false'); } catch (e) {}

      const icon = on ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
      darkButtons.slice(0, 2).forEach(function (button) {
        if (button) button.innerHTML = icon;
      });

      const drawerButton = darkButtons[2];
      if (drawerButton) {
        const firstIcon = drawerButton.querySelector('i');
        if (firstIcon) firstIcon.className = on ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        drawerButton.classList.toggle('active', !!on);
      }
    }

    let pref = null;
    try { pref = localStorage.getItem(DARK_KEY); } catch (e) {}
    if (pref === null) {
      pref = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'true' : 'false';
    }
    applyDark(pref === 'true');

    darkButtons.forEach(function (button) {
      button?.addEventListener('click', function () {
        applyDark(!document.body.classList.contains('dark'));
      });
    });

    window.addEventListener('touchstart', function () {}, { passive: true });
  });
})();
