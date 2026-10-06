if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/chothuexemayhanoi/service-worker.js', {
      updateViaCache: 'none'
    }).then(function (registration) {
      registration.update().catch(function () {});
      console.log('✅ Motoopen PWA ready');
    }).catch(function (err) {
      console.error('❌ SW failed:', err);
    });
  });
}
