// sw.js
'use strict';

var CACHE_VERSION = 'v1.0.0';
var STATIC_CACHE = 'static-' + CACHE_VERSION;
var RUNTIME_CACHE = 'runtime-' + CACHE_VERSION;
var DATA_CACHE = 'data-' + CACHE_VERSION;

var APP_SHELL = [
  './',
  './index.html',
  './create.html',
  './manifest.webmanifest',
  './pwa.js',
  './badge.js',
  './card.js',
  './index.js',
  './create.js',
  './courses.json',
  './icons/icon.svg',
  './icons/maskable-icon.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          var isOldCache =
            key !== STATIC_CACHE &&
            key !== RUNTIME_CACHE &&
            key !== DATA_CACHE;

          if (isOldCache) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(function (cache) {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(function () {
          return caches.match(request).then(function (cachedPage) {
            if (cachedPage) return cachedPage;
            return caches.match('./index.html');
          });
        })
    );
    return;
  }

  if (url.pathname.endsWith('/courses.json') || url.pathname === '/courses.json') {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var responseClone = response.clone();
          caches.open(DATA_CACHE).then(function (cache) {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(function () {
          return caches.match(request);
        })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(function (cachedResponse) {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then(function (response) {
          if (!response || response.status !== 200) return response;

          var responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(function (cache) {
            cache.put(request, responseClone);
          });

          return response;
        });
      })
    );
  }
});
