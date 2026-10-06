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

  bindDrawerToggles();
  bindStandaloneTaxonomyDropdown();
})();
