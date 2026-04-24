(function (global) {
  'use strict';

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function buildSynologyEndpoint(baseUrl, sid) {
    return normalizeText(baseUrl).replace(/\/+$/, '') + '/webapi/entry.cgi?_sid=' + encodeURIComponent(normalizeText(sid));
  }

  function uploadToSynology(file, options) {
    options = options || {};
    var baseUrl = normalizeText(options.baseUrl);
    var sid = normalizeText(options.sid);
    var uploadPath = normalizeText(options.uploadPath) || '/home';
    var fileName = normalizeText(options.fileName) || file.name;

    if (!file) return Promise.reject(new Error('missing-file'));
    if (!baseUrl || !sid) return Promise.reject(new Error('missing-synology-config'));

    var formData = new FormData();
    formData.append('api', 'SYNO.FileStation.Upload');
    formData.append('version', '2');
    formData.append('method', 'upload');
    formData.append('path', uploadPath);
    formData.append('create_parents', 'true');
    formData.append('overwrite', 'true');
    formData.append('filename', fileName);
    formData.append('file', file, fileName);

    return fetch(buildSynologyEndpoint(baseUrl, sid), { method: 'POST', body: formData })
      .then(function (resp) { return resp.json(); })
      .then(function (json) {
        if (!json || json.success !== true) throw new Error('upload-failed');

        var filePath = (json.data && json.data.file) ? json.data.file : '';
        var storedName = filePath ? filePath.substring(filePath.lastIndexOf('/') + 1) : fileName;
        return {
          fileName: storedName,
          fullPath: filePath || fileName,
          raw: json
        };
      });
  }

  function uploadCourseFormToPhp(endpoint, payload) {
    var url = normalizeText(endpoint);
    if (!url) return Promise.resolve({ skipped: true });

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    })
      .then(function (resp) { return resp.json(); })
      .then(function (json) {
        if (!json || json.success !== true) throw new Error('php-save-failed');
        return json;
      });
  }

  global.UploadService = {
    uploadToSynology: uploadToSynology,
    uploadCourseFormToPhp: uploadCourseFormToPhp
  };
})(window);
