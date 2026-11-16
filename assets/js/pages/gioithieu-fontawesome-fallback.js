(function() {
  // Font Awesome safety net for non-home pages.
  // Adds ONE fallback copy only when the page's own Font Awesome stylesheet (#fa-css, normally
  // the self-hosted subset) failed to load or did not apply. The old check,
  // document.fonts.check('1em "Font Awesome 6 Free"'), returned false whenever a weight-400 face
  // was registered but not yet downloaded and then pulled a third full copy (~315 KB) from a CDN.
  function addFallback() {
    if (document.getElementById('fa-css-fallback')) return;
    var l = document.createElement('link');
    l.id = 'fa-css-fallback';
    l.rel = 'stylesheet';
    l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
    document.head.appendChild(l);
  }
  var main = document.getElementById('fa-css');
  if (main) main.addEventListener('error', addFallback, { once: true });

  window.addEventListener('load', function() {
    try {
      var probe = document.createElement('i');
      probe.className = 'fa-solid fa-phone';
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:absolute;left:-9999px;top:0';
      document.body.appendChild(probe);
      var family = getComputedStyle(probe).fontFamily || '';
      probe.parentNode.removeChild(probe);
      if (!/Font Awesome/i.test(family)) addFallback();
    } catch (e) {
      addFallback();
    }
  });
})();
