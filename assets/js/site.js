// Shared Motoopen navigation behavior for Jekyll/blog pages.
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { io.observe(el); });
    }

    const topbar = document.getElementById('topbar');
    const hamburger = document.getElementById('hamburger');
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');

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

    hamburger?.addEventListener('click', function () { openDrawer(!drawer?.classList.contains('open')); });
    overlay?.addEventListener('click', function () { openDrawer(false); });
    drawer?.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { openDrawer(false); });
    });

    drawer?.querySelectorAll('[data-drawer-toggle]').forEach(function (button) {
      if (button.dataset.sharedToggleBound === 'true') return;
      button.addEventListener('click', function () {
        const menu = document.getElementById(button.getAttribute('data-drawer-toggle'));
        const open = menu?.classList.toggle('open');
        button.classList.toggle('open', !!open);
        button.setAttribute('aria-expanded', String(!!open));
      });
    });

    const dropdowns = Array.from(document.querySelectorAll('.nav-dropdown'));
    dropdowns.forEach(function (dropdown) {
      if (dropdown.dataset.sharedDropdownBound === 'true') return;
      const toggle = dropdown.querySelector('.dropdown-toggle');
      toggle?.addEventListener('click', function (event) {
        event.preventDefault();
        const nextOpen = !dropdown.classList.contains('open');
        dropdowns.forEach(function (item) {
          item.classList.remove('open');
          item.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
        });
        dropdown.classList.toggle('open', nextOpen);
        toggle.setAttribute('aria-expanded', String(nextOpen));
      });
    });
    document.addEventListener('click', function (event) {
      dropdowns.forEach(function (dropdown) {
        if (!dropdown.contains(event.target)) {
          dropdown.classList.remove('open');
          dropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
        }
      });
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
      darkButtons.slice(0, 2).forEach(function (button) { if (button) button.innerHTML = icon; });
      const drawerButton = darkButtons[2];
      if (drawerButton) {
        const firstIcon = drawerButton.querySelector('i');
        if (firstIcon) firstIcon.className = on ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        drawerButton.classList.toggle('active', !!on);
      }
    }

    let pref = null;
    try { pref = localStorage.getItem(DARK_KEY); } catch (e) {}
    if (pref === null) pref = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'true' : 'false';
    applyDark(pref === 'true');

    darkButtons.forEach(function (button) {
      button?.addEventListener('click', function () { applyDark(!document.body.classList.contains('dark')); });
    });
    window.addEventListener('touchstart', function () {}, { passive: true });
  });
})();
