/**
 * MenuOS — Service Worker Registration
 * Auto-registers SW and handles updates
 */

(function() {
  'use strict';

  // 1. Check browser support
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️  Service Workers not supported in this browser');
    return;
  }

  // 2. Register Service Worker on page load
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(registration => {
        console.log('✅ Service Worker registered successfully:', registration);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Every 60 seconds
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('🔄 New Service Worker activated');
              // Optional: show update notification
              if (window.confirm('MenuOS a été mis à jour. Recharger la page?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(err => {
        console.error('❌ Service Worker registration failed:', err);
      });
  });

  // 3. Handle SW messages for version checks
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' });
    navigator.serviceWorker.onmessage = (event) => {
      if (event.data.version) {
        console.log('📦 SW Version:', event.data.version);
      }
    };
  }

  // 4. Handle offline/online status
  window.addEventListener('online', () => {
    console.log('✅ Back online');
    document.body.classList.remove('offline');
  });

  window.addEventListener('offline', () => {
    console.log('⚠️  You are offline - using cached content');
    document.body.classList.add('offline');
  });

  // 5. PWA Install Prompt (optional)
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install button only if PWA is installable
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'block';
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`Installation ${outcome}`);
          deferredPrompt = null;
          installBtn.style.display = 'none';
        }
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('📱 PWA installed successfully');
    deferredPrompt = null;
  });

})();
