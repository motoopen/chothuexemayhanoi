/* Compatibility for the shared header used by legacy standalone pages. */
(function () {
  function bindDrawerToggles() {
    document.querySelectorAll('[data-drawer-toggle]').forEach(function (button) {
      if (button.dataset.sharedToggleBound === 'true') return;
      button.dataset.sharedToggleBound = 'true';
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-drawer-toggle');
        var menu = id ? document.getElementById(id) : null;
        if (!menu) return;
        var open = menu.classList.toggle('open');
        button.classList.toggle('open', open);
        button.setAttribute('aria-expanded', String(open));
      });
    });
  }

  function bindStandaloneTaxonomyDropdown() {
    document.querySelectorAll('.taxonomy-dropdown').forEach(function (dropdown) {
      if (dropdown.dataset.sharedDropdownBound === 'true') return;
      dropdown.dataset.sharedDropdownBound = 'true';
      var toggle = dropdown.querySelector('.dropdown-toggle');
      if (!toggle) return;
      toggle.addEventListener('click', function (event) {
        event.preventDefault();
        var open = !dropdown.classList.contains('open');
        dropdown.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
    });
    document.addEventListener('click', function (event) {
      document.querySelectorAll('.taxonomy-dropdown[data-shared-dropdown-bound="true"]').forEach(function (dropdown) {
        if (!dropdown.contains(event.target)) {
          dropdown.classList.remove('open');
          var toggle = dropdown.querySelector('.dropdown-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* Drawer accessibility, applied centrally whatever page script opens it (they all toggle
     .open on #drawer and .active on #drawerOverlay): closed drawer is inert (no hidden tab
     stops), Escape closes it, focus moves in on open and back to the hamburger on close,
     and the page behind does not scroll while it is open. */
  function enhanceDrawer() {
    var drawer = document.getElementById('drawer');
    var overlay = document.getElementById('drawerOverlay');
    var hamburger = document.getElementById('hamburger');
    if (!drawer || drawer.dataset.a11yEnhanced === 'true') return;
    drawer.dataset.a11yEnhanced = 'true';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Menu');
    if (hamburger) hamburger.setAttribute('aria-controls', 'drawer');
    var wasOpen = null;
    function sync() {
      var open = drawer.classList.contains('open');
      if (open === wasOpen) return;
      drawer.inert = !open;
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) {
        var first = drawer.querySelector('a[href], button:not([disabled])');
        if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) {} }, 60);
      } else if (wasOpen && hamburger && drawer.contains(document.activeElement)) {
        try { hamburger.focus({ preventScroll: true }); } catch (e) {}
      } else if (wasOpen && hamburger && document.activeElement === document.body) {
        try { hamburger.focus({ preventScroll: true }); } catch (e) {}
      }
      wasOpen = open;
    }
    sync();
    new MutationObserver(sync).observe(drawer, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !drawer.classList.contains('open')) return;
      if (overlay) overlay.click();
      if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        drawer.setAttribute('aria-hidden', 'true');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  bindDrawerToggles();
  bindStandaloneTaxonomyDropdown();
  enhanceDrawer();
})();
