    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/chothuexemayhanoi/service-worker.js')
        .then(() => console.log('✅ Motoopen PWA ready'))
        .catch(err => console.error('❌ SW failed:', err));
    }
