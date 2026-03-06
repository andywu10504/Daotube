// pwa.js
(function () {
  'use strict';

  var deferredPrompt = null;
  var installBar = null;
  var buttonInstall = null;
  var buttonInstallClose = null;

  function showInstallBar() {
    if (installBar) installBar.classList.remove('d-none');
  }

  function hideInstallBar() {
    if (installBar) installBar.classList.add('d-none');
  }

  function bindInstallUi() {
    installBar = document.getElementById('installBar');
    buttonInstall = document.getElementById('buttonInstall');
    buttonInstallClose = document.getElementById('buttonInstallClose');

    if (buttonInstall) {
      buttonInstall.addEventListener('click', function () {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        deferredPrompt.userChoice
          .catch(function () {
            return null;
          })
          .finally(function () {
            deferredPrompt = null;
            hideInstallBar();
          });
      });
    }

    if (buttonInstallClose) {
      buttonInstallClose.addEventListener('click', function () {
        hideInstallBar();
      });
    }

    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      deferredPrompt = event;
      showInstallBar();
    });

    window.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      hideInstallBar();
      console.log('PWA 安裝完成');
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js')
        .then(function (registration) {
          console.log('Service Worker 註冊成功：', registration.scope);
        })
        .catch(function (error) {
          console.error('Service Worker 註冊失敗：', error);
        });
    });
  }

  function init() {
    bindInstallUi();
    registerServiceWorker();
  }

  init();
})();
