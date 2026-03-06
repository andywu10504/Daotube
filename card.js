(function (global) {
  'use strict';

  var modalId = 'mediaPlayerModal';
  var modalTitleId = 'mediaPlayerModalTitle';
  var modalBodyId = 'mediaPlayerModalBody';
  var currentBootstrapModal = null;

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeUrl(url) {
    if (!url) return '';
    return String(url).trim();
  }

  function resolveUrl(url) {
    var raw = normalizeUrl(url);
    if (!raw) return '';

    try {
      return new URL(raw, document.baseURI).href;
    } catch (e) {
      return raw;
    }
  }

  function buildOpenLinkButton(url, iconClass, label, btnClass) {
    var resolvedUrl = resolveUrl(url);
    if (!resolvedUrl) return '';

    return (
      '<a class="btn ' + btnClass + ' btn-lg w-100" ' +
        'href="' + escapeHtml(resolvedUrl) + '" target="_blank" rel="noopener noreferrer">' +
        '<i class="' + escapeHtml(iconClass) + ' me-1"></i>' + escapeHtml(label) +
      '</a>'
    );
  }

  function buildMediaButton(url, iconClass, label, btnClass, mediaType) {
    var resolvedUrl = resolveUrl(url);
    if (!resolvedUrl) return '';

    return (
      '<button type="button" class="btn ' + btnClass + ' btn-lg w-100 js-open-media" ' +
        'data-media-type="' + escapeHtml(mediaType) + '" ' +
        'data-media-url="' + escapeHtml(resolvedUrl) + '" ' +
        'data-media-title="' + escapeHtml(label) + '">' +
        '<i class="' + escapeHtml(iconClass) + ' me-1"></i>' + escapeHtml(label) +
      '</button>'
    );
  }

  function renderBadges(badges) {
    if (!Array.isArray(badges) || badges.length === 0) return '';

    var html = '<div class="d-flex flex-wrap gap-1 justify-content-end">';
    badges.forEach(function (b) {
      var text = b && b.text ? b.text : '';
      if (!text) return;

      var cls = (b && b.className) ? b.className : 'text-bg-warning';
      var iconClass = (b && b.iconClass) ? b.iconClass : 'fa-solid fa-star';

      html +=
        '<span class="badge ' + escapeHtml(cls) + '">' +
          '<i class="' + escapeHtml(iconClass) + ' me-1"></i>' +
          escapeHtml(text) +
        '</span>';
    });
    html += '</div>';
    return html;
  }

  function ensureModalExists() {
    if (document.getElementById(modalId)) return;

    var modalHtml =
      '<div class="modal fade" id="' + modalId + '" tabindex="-1" aria-hidden="true">' +
        '<div class="modal-dialog modal-dialog-centered modal-lg">' +
          '<div class="modal-content">' +
            '<div class="modal-header">' +
              '<h5 class="modal-title" id="' + modalTitleId + '">媒體播放</h5>' +
              '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
            '</div>' +
            '<div class="modal-body" id="' + modalBodyId + '"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    var modalEl = document.getElementById(modalId);
    modalEl.addEventListener('hidden.bs.modal', function () {
      stopAndClearMedia();
    });
  }

  function stopAndClearMedia() {
    var body = document.getElementById(modalBodyId);
    if (!body) return;

    var mediaNodes = body.querySelectorAll('video, audio');
    Array.prototype.forEach.call(mediaNodes, function (node) {
      try {
        node.pause();
      } catch (e) { /* ignore */ }

      node.removeAttribute('src');

      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }

      try {
        node.load();
      } catch (e2) { /* ignore */ }
    });

    body.innerHTML = '';
  }

  function buildVideoHtml(url) {
    var resolvedUrl = resolveUrl(url);

    return (
      '<video class="w-100 rounded" controls autoplay playsinline preload="metadata" src="' + escapeHtml(resolvedUrl) + '">' +
        '你的瀏覽器不支援影片播放。' +
      '</video>'
    );
  }

  function buildAudioHtml(url) {
    var resolvedUrl = resolveUrl(url);

    return (
      '<audio class="w-100" controls autoplay preload="metadata" src="' + escapeHtml(resolvedUrl) + '">' +
        '你的瀏覽器不支援音訊播放。' +
      '</audio>'
    );
  }

  function openMediaModal(mediaType, mediaUrl, mediaTitle) {
    var resolvedUrl = resolveUrl(mediaUrl);
    if (!resolvedUrl) return;

    ensureModalExists();

    var titleEl = document.getElementById(modalTitleId);
    var bodyEl = document.getElementById(modalBodyId);
    var modalEl = document.getElementById(modalId);

    if (!titleEl || !bodyEl || !modalEl) return;
    if (!global.bootstrap || !global.bootstrap.Modal) return;

    stopAndClearMedia();

    titleEl.textContent = mediaTitle || (mediaType === 'audio' ? '錄音播放' : '影片播放');

    if (mediaType === 'audio') {
      bodyEl.innerHTML = buildAudioHtml(resolvedUrl);
    } else {
      bodyEl.innerHTML = buildVideoHtml(resolvedUrl);
    }

    currentBootstrapModal = global.bootstrap.Modal.getOrCreateInstance(modalEl);
    currentBootstrapModal.show();
  }

  function bindMediaEvents() {
    if (document.documentElement.getAttribute('data-card-media-bound') === '1') return;
    document.documentElement.setAttribute('data-card-media-bound', '1');

    document.addEventListener('click', function (event) {
      var button = event.target.closest('.js-open-media');
      if (!button) return;

      event.preventDefault();

      var mediaType = button.getAttribute('data-media-type') || 'video';
      var mediaUrl = button.getAttribute('data-media-url') || '';
      var mediaTitle = button.getAttribute('data-media-title') || '';

      openMediaModal(mediaType, mediaUrl, mediaTitle);
    });
  }

  function initMediaPlayer() {
    ensureModalExists();
    bindMediaEvents();
  }

  function renderCourseCard(course) {
    course = course || {};

    var imageUrl = resolveUrl(normalizeUrl(course.imageUrl) || './assets/placeholder-16x9.png');
    var courseTitle = course.courseTitle || '（未命名課程）';
    var className = course.className || '（未填班期）';
    var courseDate = course.courseDate || '';
    var timeRange = (course.startTime && course.endTime) ? (course.startTime + ' - ' + course.endTime) : '';
    var courseLocation = course.courseLocation || '';

    var instructorName = (course.instructorName || '').trim();
    var instructorTitle = (course.instructorTitle || '').trim();
    var instructorDisplay = (instructorName + instructorTitle).trim();

    var badgesHtml = renderBadges(course.badges);

    var videoBtn = buildMediaButton(course.videoUrl, 'fa-solid fa-video', '影片', 'btn-primary', 'video');
    var audioBtn = buildMediaButton(course.audioUrl, 'fa-solid fa-headphones', '錄音', 'btn-outline-primary', 'audio');
    var materialBtn = buildOpenLinkButton(course.materialUrl, 'fa-solid fa-file-lines', '檔案', 'btn-outline-secondary');

    var actionButtons = [videoBtn, audioBtn, materialBtn].filter(function (x) { return !!x; }).join('');
    var actionsHtml = actionButtons
      ? ('<div class="d-grid gap-2">' + actionButtons + '</div>')
      : '';

    return (
      '<div class="card h-100 shadow-sm">' +
        '<div class="ratio ratio-16x9 bg-body-tertiary">' +
          '<img src="' + escapeHtml(imageUrl) + '" class="card-img-top object-fit-cover" alt="course image" ' +
          'onerror="this.onerror=null;this.src=\'./assets/placeholder-16x9.png\';" />' +
        '</div>' +

        '<div class="card-body d-flex flex-column">' +
          '<div class="d-flex align-items-start justify-content-between gap-2 mb-2">' +
            '<div class="me-auto">' +
              '<h5 class="card-title fw-bold mb-1">' + escapeHtml(courseTitle) + '</h5>' +
              (courseDate ? '<div class="small text-secondary"><i class="fa-regular fa-calendar me-1"></i>' + escapeHtml(courseDate) + '</div>' : '') +
            '</div>' +
            badgesHtml +
          '</div>' +

          '<ul class="list-group list-group-flush small mb-3">' +
            '<li class="list-group-item px-0">' +
              '<i class="fa-solid fa-graduation-cap me-2 text-secondary"></i>' +
              '<span class="text-secondary">班期名稱:</span> ' + escapeHtml(className) +
            '</li>' +

            '<li class="list-group-item px-0">' +
              '<i class="fa-regular fa-clock me-2 text-secondary"></i>' +
              '<span class="text-secondary">課程時間:</span> ' + escapeHtml(timeRange) +
            '</li>' +

            '<li class="list-group-item px-0">' +
              '<i class="fa-solid fa-location-dot me-2 text-secondary"></i>' +
              '<span class="text-secondary">課程地點:</span> ' + escapeHtml(courseLocation) +
            '</li>' +

            '<li class="list-group-item px-0">' +
              '<i class="fa-solid fa-user-tie me-2 text-secondary"></i>' +
              '<span class="text-secondary">主講者:</span> ' + escapeHtml(instructorDisplay) +
            '</li>' +
          '</ul>' +

          (actionsHtml ? ('<div class="mt-auto">' + actionsHtml + '</div>') : '') +
        '</div>' +
      '</div>'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMediaPlayer);
  } else {
    initMediaPlayer();
  }

  global.CardRenderer = {
    renderCourseCard: renderCourseCard,
    openMediaModal: openMediaModal
  };
})(window);
