// create.js
(function () {
  'use strict';

  var courses = [];
  var lastAutoVideoFileName = '';
  var lastAutoAudioFileName = '';
  var lastAutoMaterialFileName = '';

  function logInfo(step, data) {
    if (!window.AppConfig || !window.AppConfig.isDebugMode) return;
    if (data !== undefined) console.log('[create.js] ' + step, data);
    else console.log('[create.js] ' + step);
  }

  function logWarn(step, data) {
    if (!window.AppConfig || !window.AppConfig.isDebugMode) return;
    if (data !== undefined) console.warn('[create.js] ' + step, data);
    else console.warn('[create.js] ' + step);
  }

  function logError(step, data) {
    if (!window.AppConfig || !window.AppConfig.isDebugMode) return;
    if (data !== undefined) console.error('[create.js] ' + step, data);
    else console.error('[create.js] ' + step);
  }

  function cryptoRandomId() {
    try {
      if (window.crypto && crypto.getRandomValues) {
        var bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        var id = Array.prototype.map.call(bytes, function (b) {
          return ('00' + b.toString(16)).slice(-2);
        }).join('');
        logInfo('已產生隨機課程編號', id);
        return id;
      }
    } catch (e) {
      logWarn('使用 crypto 產生編號失敗，改用備援方式', e);
    }

    var fallbackId = 'id_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    logInfo('已使用備援方式產生課程編號', fallbackId);
    return fallbackId;
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toYmdNumber(ymd) {
    if (!ymd) return null;
    var m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return parseInt(m[1] + m[2] + m[3], 10);
  }

  function toHmNumber(hm) {
    if (!hm) return null;
    var m = String(hm).match(/^(\d{2}):(\d{2})$/);
    if (!m) return null;
    return parseInt(m[1] + m[2], 10);
  }

  function getRadioBool(name) {
    var val = $('input[name="' + name + '"]:checked').val();
    var result = String(val) === '1';
    logInfo('已讀取單選欄位：' + name, { rawValue: val, result: result });
    return result;
  }

  function setRadioBool(name, value) {
    var v = value === true ? '1' : '0';
    $('input[name="' + name + '"][value="' + v + '"]').prop('checked', true);
    logInfo('已設定單選欄位：' + name, { value: value, appliedValue: v });
  }

  function getClassNameValue() {
    var selected = ($('#classNameSelect').val() || '').trim();
    var value = selected === '其他' ? ($('#classNameOther').val() || '').trim() : selected;
    logInfo('已讀取班期名稱', { selected: selected, value: value });
    return value;
  }

  function setClassNameValue(value) {
    value = (value || '').trim();
    var options = $('#classNameSelect option').map(function () { return $(this).val(); }).get();

    if (options.indexOf(value) >= 0 && value !== '其他') {
      $('#classNameSelect').val(value);
      $('#classNameOtherWrap').addClass('d-none');
      $('#classNameOther').val('');
      logInfo('班期名稱已套用既有選項', value);
    } else if (value) {
      $('#classNameSelect').val('其他');
      $('#classNameOtherWrap').removeClass('d-none');
      $('#classNameOther').val(value);
      logInfo('班期名稱已套用自訂內容', value);
    } else {
      $('#classNameSelect').val('');
      $('#classNameOtherWrap').addClass('d-none');
      $('#classNameOther').val('');
      logInfo('班期名稱已清空');
    }
  }

  function buildClassOptionsFromCourses() {
    var set = {};
    courses.forEach(function (c) {
      var name = (c.className || '').trim();
      if (name) set[name] = true;
    });

    var list = Object.keys(set).sort();

    var $select = $('#classNameSelect');
    $select.empty();
    $select.append('<option value="">請選擇</option>');
    list.forEach(function (name) {
      $select.append('<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>');
    });
    $select.append('<option value="其他">其他（新增）</option>');

    logInfo('班期名稱下拉選單已重建', { count: list.length, list: list });
  }

  function getModeValue(selector) {
    return ($(selector).val() || '').trim();
  }

  function isUrlMode(selector) {
    return getModeValue(selector) === 'url';
  }

  function clearAudioField() {
    $('#audioUrl').val('');
    lastAutoAudioFileName = '';
    logInfo('錄音欄位已清空');
  }

  function clearMaterialField() {
    $('#materialUrl').val('');
    lastAutoMaterialFileName = '';
    logInfo('教材欄位已清空');
  }

  function buildAssetFileName(course, assetType, currentValue) {
    return window.AppConfig.buildAssetFileName(course, assetType, currentValue);
  }

  function syncMediaFileNamesByCourse(force) {
    var course = readFormCourse(false);

    var currentVideo = ($('#videoUrl').val() || '').trim();
    var currentAudio = ($('#audioUrl').val() || '').trim();
    var currentMaterial = ($('#materialUrl').val() || '').trim();

    var videoFileName = buildAssetFileName(course, 'video', currentVideo);
    var audioFileName = buildAssetFileName(course, 'audio', currentAudio);
    var materialFileName = buildAssetFileName(course, 'material', currentMaterial);

    if (videoFileName && (force || !currentVideo || currentVideo === lastAutoVideoFileName)) {
      $('#videoUrl').val(videoFileName);
      lastAutoVideoFileName = videoFileName;
      logInfo('課程影片檔名已自動帶入', {
        fileName: videoFileName,
        keptExtension: window.AppConfig.getPreferredExtension('video', currentVideo)
      });
    }

    if (isUrlMode('#audioMode')) {
      if (audioFileName && (force || !currentAudio || currentAudio === lastAutoAudioFileName)) {
        $('#audioUrl').val(audioFileName);
        lastAutoAudioFileName = audioFileName;
        logInfo('課程錄音檔名已自動帶入', {
          fileName: audioFileName,
          keptExtension: window.AppConfig.getPreferredExtension('audio', currentAudio)
        });
      }
    } else {
      clearAudioField();
    }

    if (isUrlMode('#materialMode')) {
      if (materialFileName && (force || !currentMaterial || currentMaterial === lastAutoMaterialFileName)) {
        $('#materialUrl').val(materialFileName);
        lastAutoMaterialFileName = materialFileName;
        logInfo('課程資料檔名已自動帶入', {
          fileName: materialFileName,
          keptExtension: window.AppConfig.getPreferredExtension('material', currentMaterial)
        });
      }
    } else {
      clearMaterialField();
    }
  }

  function applyUrlMode(modeSelectId, inputId) {
    var mode = getModeValue(modeSelectId);

    if (mode === 'url') {
      $(inputId).removeClass('d-none');
      logInfo('已切換為顯示檔名欄位', { modeSelectId: modeSelectId, inputId: inputId });
      syncMediaFileNamesByCourse(true);
    } else {
      $(inputId).addClass('d-none').val('');
      logInfo('已切換為不使用此資源，並清空欄位', { modeSelectId: modeSelectId, inputId: inputId });

      if (inputId === '#audioUrl') clearAudioField();
      if (inputId === '#materialUrl') clearMaterialField();
    }

    renderPreview();
  }

  function getResolvedImageUrl() {
    var sel = ($('#imageSelect').val() || '').trim();

    if (sel === 'custom') {
      var custom = ($('#imageUrl').val() || '').trim();
      var resolvedCustom = custom ? custom : window.AppConfig.defaultImageUrl;
      logInfo('圖片來源為自訂網址', { input: custom, resolved: resolvedCustom });
      return resolvedCustom;
    }

    if (sel === 'auto' || !sel) {
      logInfo('圖片來源為自動預設圖', window.AppConfig.defaultImageUrl);
      return window.AppConfig.defaultImageUrl;
    }

    if (window.AppConfig.isAbsoluteOrSpecialUrl(sel)) {
      logInfo('圖片來源為絕對或特殊路徑', sel);
      return sel;
    }

    var resolved = window.AppConfig.resolveImageUrl(sel);
    logInfo('圖片來源為 assets/image 路徑', { fileName: sel, resolved: resolved });
    return resolved;
  }

  function readFormCourse(allowAutoImage) {
    var imageUrl = '';
    if (allowAutoImage !== false) imageUrl = getResolvedImageUrl();

    var videoUrl = window.AppConfig.getDisplayOnlyFileName($('#videoUrl').val());
    var audioUrl = isUrlMode('#audioMode') ? window.AppConfig.getDisplayOnlyFileName($('#audioUrl').val()) : '';
    var materialUrl = isUrlMode('#materialMode') ? window.AppConfig.getDisplayOnlyFileName($('#materialUrl').val()) : '';

    var course = {
      id: ($('#courseId').val() || '').trim(),
      imageUrl: imageUrl,
      courseTitle: ($('#courseTitle').val() || '').trim(),
      areaName: ($('#areaName').val() || '').trim(),
      className: getClassNameValue(),
      subClassName: ($('#subClassName').val() || '').trim(),
      courseDate: ($('#courseDate').val() || '').trim(),
      startTime: ($('#startTime').val() || '').trim(),
      endTime: ($('#endTime').val() || '').trim(),
      courseLocation: ($('#courseLocation').val() || '').trim(),
      instructorName: ($('#instructorName').val() || '').trim(),
      instructorTitle: ($('#instructorTitle').val() || '').trim(),
      videoUrl: videoUrl,
      audioUrl: audioUrl,
      materialUrl: materialUrl,
      isPinned: getRadioBool('isPinned'),
      isVisible: getRadioBool('isVisible')
    };

    logInfo('已讀取表單資料', { allowAutoImage: allowAutoImage, course: course });
    return course;
  }

  function writeFormCourse(course) {
    logInfo('開始回填表單資料', course);

    $('#courseId').val(course.id || '');

    var imageUrl = (course.imageUrl || '').trim();
    var imageFileName = window.AppConfig.getDisplayOnlyFileName(imageUrl);
    var $imageSelect = $('#imageSelect');
    var options = $imageSelect.find('option').map(function () { return $(this).val(); }).get();

    if (!imageUrl || imageUrl === window.AppConfig.defaultImageUrl) {
      $imageSelect.val('auto');
      $('#imageUrl').addClass('d-none').val('');
      logInfo('圖片欄位已套用自動預設圖');
    } else if (options.indexOf(imageFileName) >= 0) {
      $imageSelect.val(imageFileName);
      $('#imageUrl').addClass('d-none').val('');
      logInfo('圖片欄位已套用固定選項', imageFileName);
    } else {
      $imageSelect.val('custom');
      $('#imageUrl').removeClass('d-none').val(imageUrl);
      logInfo('圖片欄位已套用自訂網址', imageUrl);
    }

    $('#courseTitle').val(course.courseTitle || '');
    $('#areaName').val(course.areaName || '');
    setClassNameValue(course.className || '');
    $('#subClassName').val(course.subClassName || '');
    $('#courseDate').val(course.courseDate || '');
    $('#startTime').val(course.startTime || '');
    $('#endTime').val(course.endTime || '');
    $('#courseLocation').val(course.courseLocation || '');
    $('#instructorName').val(course.instructorName || '');
    $('#instructorTitle').val(course.instructorTitle || '');

    $('#videoUrl').val(window.AppConfig.getDisplayOnlyFileName(course.videoUrl || ''));
    lastAutoVideoFileName = window.AppConfig.getDisplayOnlyFileName(course.videoUrl || '');

    if ((course.audioUrl || '').trim()) {
      $('#audioMode').val('url');
      $('#audioUrl').removeClass('d-none').val(window.AppConfig.getDisplayOnlyFileName(course.audioUrl));
      lastAutoAudioFileName = window.AppConfig.getDisplayOnlyFileName(course.audioUrl || '');
      logInfo('錄音欄位已帶入檔名', {
        fileName: course.audioUrl,
        extension: window.AppConfig.getFileExtension(course.audioUrl)
      });
    } else {
      $('#audioMode').val('none');
      $('#audioUrl').addClass('d-none').val('');
      lastAutoAudioFileName = '';
      logInfo('錄音欄位已清空');
    }

    if ((course.materialUrl || '').trim()) {
      $('#materialMode').val('url');
      $('#materialUrl').removeClass('d-none').val(window.AppConfig.getDisplayOnlyFileName(course.materialUrl));
      lastAutoMaterialFileName = window.AppConfig.getDisplayOnlyFileName(course.materialUrl || '');
      logInfo('教材欄位已帶入檔名', {
        fileName: course.materialUrl,
        extension: window.AppConfig.getFileExtension(course.materialUrl)
      });
    } else {
      $('#materialMode').val('none');
      $('#materialUrl').addClass('d-none').val('');
      lastAutoMaterialFileName = '';
      logInfo('教材欄位已清空');
    }

    setRadioBool('isPinned', course.isPinned === true);
    setRadioBool('isVisible', course.isVisible !== false);

    logInfo('表單回填完成');
  }

  function toPreviewCourse(course) {
    var previewCourse = $.extend({}, course);

    previewCourse.videoUrl = course.videoUrl
      ? window.AppConfig.resolveCourseAssetUrl('video', course.videoUrl, course)
      : '';

    previewCourse.audioUrl = course.audioUrl
      ? window.AppConfig.resolveCourseAssetUrl('audio', course.audioUrl, course)
      : '';

    previewCourse.materialUrl = course.materialUrl
      ? window.AppConfig.resolveCourseAssetUrl('material', course.materialUrl, course)
      : '';

    return previewCourse;
  }

  function resetForm() {
    logInfo('開始重設表單');

    writeFormCourse({
      id: '',
      imageUrl: '',
      courseTitle: '',
      areaName: '',
      className: '',
      subClassName: '',
      courseDate: '',
      startTime: '',
      endTime: '',
      courseLocation: '',
      instructorName: '',
      instructorTitle: '',
      videoUrl: '',
      audioUrl: '',
      materialUrl: '',
      isPinned: false,
      isVisible: true
    });

    lastAutoVideoFileName = '';
    lastAutoAudioFileName = '';
    lastAutoMaterialFileName = '';

    renderPreview();
    logInfo('表單已重設完成');
  }

  function validateCourse(course) {
    if (!course.courseTitle) return '請填寫課程名稱';
    if (!course.areaName) return '請選擇地區';
    if (!course.className) return '請選擇/填寫班期名稱';
    if (!course.courseDate) return '請選擇課程日期';
    if (!course.startTime || !course.endTime) return '請填寫開始/結束時間';
    if (!course.courseLocation) return '請選擇課程地點';
    if (!course.instructorName) return '請填寫主講者';
    if (!course.instructorTitle) return '請選擇天職';
    return '';
  }

  function renderPreview() {
    var course = readFormCourse(true);
    if (!course.id) course.id = 'preview';

    var previewCourse = toPreviewCourse(course);

    if (window.BadgeService) {
      previewCourse = window.BadgeService.applyBadges([previewCourse], { latestDays: 30 })[0];
      logInfo('預覽卡片已套用徽章規則', previewCourse);
    } else {
      logInfo('找不到 BadgeService，預覽卡片略過徽章處理');
    }

    var cardHtml = window.CardRenderer.renderCourseCard(previewCourse);
    $('#previewCard').html(cardHtml);

    logInfo('預覽卡片已重新渲染', previewCourse);
  }

  function destroyDataTableIfNeeded() {
    if ($.fn.DataTable && $.fn.DataTable.isDataTable('#courseTable')) {
      $('#courseTable').DataTable().destroy();
      logInfo('已銷毀舊的 DataTable');
    }
  }

  function initDataTable() {
    if (!$.fn.DataTable) {
      logWarn('找不到 DataTable，略過表格初始化');
      return;
    }

    $('#courseTable').DataTable({
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      responsive: true,
      order: [[0, 'desc'], [1, 'desc']],
      columnDefs: [
        { targets: 0, responsivePriority: 2 },
        { targets: 1, responsivePriority: 3 },
        { targets: 2, responsivePriority: 5 },
        { targets: 3, responsivePriority: 4 },
        { targets: 4, responsivePriority: 6 },
        { targets: 5, responsivePriority: 7 },
        { targets: 6, responsivePriority: 1 },
        { targets: 7, responsivePriority: 8 },
        { targets: 8, responsivePriority: 9 },
        { targets: 9, responsivePriority: 10 },
        { targets: 10, responsivePriority: 11 },
        { targets: 11, responsivePriority: 12 },
        { targets: 12, responsivePriority: 13 }
      ]
    });

    logInfo('DataTable 初始化完成');
  }

  function sortCoursesForTable(list) {
    var sorted = list.slice().sort(function (a, b) {
      var ap = a && a.isPinned === true ? 1 : 0;
      var bp = b && b.isPinned === true ? 1 : 0;
      if (bp !== ap) return bp - ap;

      var ad = toYmdNumber(a.courseDate) || -1;
      var bd = toYmdNumber(b.courseDate) || -1;
      if (bd !== ad) return bd - ad;

      var ast = toHmNumber(a.startTime) || -1;
      var bst = toHmNumber(b.startTime) || -1;
      if (bst !== ast) return bst - ast;

      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    logInfo('課程資料已完成排序', { count: sorted.length });
    return sorted;
  }

  function renderList() {
    $('#listInfo').text('共 ' + courses.length + ' 筆');
    $('#emptyList').toggleClass('d-none', courses.length !== 0);

    var $tbody = $('#courseTable tbody');
    $tbody.empty();

    var sorted = sortCoursesForTable(courses);

    sorted.forEach(function (c) {
      var ymd = (c.courseDate || '').trim();
      var st = (c.startTime || '').trim();
      var et = (c.endTime || '').trim();

      var dateText = ymd || '';
      var timeText = (st && et) ? (st + '-' + et) : (st || '');

      var dateOrder = toYmdNumber(ymd);
      var timeOrder = toHmNumber(st);

      var classDisplay = ((c.areaName || '') + (c.className || '')).trim();
      var sub = (c.subClassName || '').trim();
      var classText = classDisplay + (sub ? (' / ' + sub) : '');

      var instructorDisplay = ((c.instructorName || '') + (c.instructorTitle || '')).trim();

      var rowHtml =
        '<tr>' +
          '<td data-order="' + escapeHtml(dateOrder == null ? '' : String(dateOrder)) + '">' + escapeHtml(dateText) + '</td>' +
          '<td data-order="' + escapeHtml(timeOrder == null ? '' : String(timeOrder)) + '">' + escapeHtml(timeText) + '</td>' +
          '<td>' + escapeHtml(classText) + '</td>' +
          '<td>' + escapeHtml(c.courseTitle || '') + '</td>' +
          '<td>' + escapeHtml(instructorDisplay) + '</td>' +
          '<td>' + escapeHtml(c.courseLocation || '') + '</td>' +
          '<td>' +
            '<div class="d-flex gap-2">' +
              '<button class="btn btn-secondary btn-sm js-edit" data-id="' + escapeHtml(c.id) + '" type="button">' +
                '<i class="fa-solid fa-pen-to-square me-1"></i>編輯' +
              '</button>' +
              '<button class="btn btn-danger btn-sm js-delete" data-id="' + escapeHtml(c.id) + '" type="button">' +
                '<i class="fa-solid fa-trash-can me-1"></i>刪除' +
              '</button>' +
            '</div>' +
          '</td>' +
          '<td>' + (c.isPinned === true ? '是' : '否') + '</td>' +
          '<td>' + (c.isVisible === false ? '否' : '是') + '</td>' +
          '<td>' + escapeHtml(c.videoUrl || '') + '</td>' +
          '<td>' + escapeHtml(c.audioUrl || '') + '</td>' +
          '<td>' + escapeHtml(c.materialUrl || '') + '</td>' +
          '<td>' + escapeHtml(c.imageUrl || '') + '</td>' +
        '</tr>';

      $tbody.append(rowHtml);
    });

    destroyDataTableIfNeeded();
    if (courses.length > 0) initDataTable();

    logInfo('課程清單已重新渲染', { count: courses.length, sorted: sorted });
  }

  function normalizeCourseAfterLoad(course) {
    var item = $.extend({}, course);

    item.videoUrl = window.AppConfig.getDisplayOnlyFileName(item.videoUrl || '');
    item.audioUrl = window.AppConfig.getDisplayOnlyFileName(item.audioUrl || '');
    item.materialUrl = window.AppConfig.getDisplayOnlyFileName(item.materialUrl || '');

    return item;
  }

  function upsertCourse(course) {
    if (!course.id) {
      course.id = cryptoRandomId();
      courses.unshift(course);
      logInfo('已新增課程資料', course);
      return;
    }

    var idx = courses.findIndex(function (x) { return x.id === course.id; });
    if (idx >= 0) {
      courses[idx] = course;
      logInfo('已更新課程資料', { index: idx, course: course });
    } else {
      courses.unshift(course);
      logInfo('找不到原資料，已改為新增課程', course);
    }
  }

  function deleteCourse(id) {
    var before = courses.length;
    courses = courses.filter(function (c) { return c.id !== id; });
    var after = courses.length;

    if (before === after) logWarn('刪除課程時找不到指定編號', id);
    else logInfo('已刪除課程資料', { id: id, before: before, after: after });
  }

  function loadCoursesFromJson(done) {
    logInfo('開始載入課程 JSON', window.AppConfig.dataUrl);

    $.getJSON(window.AppConfig.dataUrl)
      .done(function (data) {
        courses = Array.isArray(data) ? data.map(normalizeCourseAfterLoad) : [];
        logInfo('課程 JSON 載入成功', { count: courses.length, data: courses });

        buildClassOptionsFromCourses();
        renderList();
        done();
      })
      .fail(function (xhr, textStatus, errorThrown) {
        courses = [];
        logError('課程 JSON 載入失敗，改用空清單', {
          textStatus: textStatus,
          errorThrown: errorThrown,
          xhr: xhr
        });

        buildClassOptionsFromCourses();
        renderList();
        done();
      });
  }

  function bindEvents() {
    logInfo('開始綁定畫面事件');

    $('#imageSelect').on('change', function () {
      var v = ($('#imageSelect').val() || '').trim();
      logInfo('圖片選項已變更', v);

      if (v === 'custom') {
        $('#imageUrl').removeClass('d-none');
      } else {
        $('#imageUrl').addClass('d-none').val('');
      }

      renderPreview();
    });

    $('#imageUrl').on('input', function () {
      logInfo('圖片網址已輸入', ($('#imageUrl').val() || '').trim());
      renderPreview();
    });

    $('#classNameSelect').on('change', function () {
      var val = ($('#classNameSelect').val() || '').trim();
      logInfo('班期下拉選單已變更', val);

      if (val === '其他') $('#classNameOtherWrap').removeClass('d-none');
      else $('#classNameOtherWrap').addClass('d-none');

      syncMediaFileNamesByCourse(false);
      renderPreview();
    });

    $('#classNameOther').on('input', function () {
      logInfo('自訂班期名稱已輸入', ($('#classNameOther').val() || '').trim());
      syncMediaFileNamesByCourse(false);
      renderPreview();
    });

    $('input[name="isPinned"], input[name="isVisible"]').on('change', function () {
      logInfo('顯示設定已變更', {
        isPinned: $('input[name="isPinned"]:checked').val(),
        isVisible: $('input[name="isVisible"]:checked').val()
      });
      renderPreview();
    });

    $('#courseDate, #areaName, #subClassName, #courseTitle, #instructorName, #instructorTitle')
      .on('input change', function () {
        logInfo('課程基本欄位已變更', {
          id: this.id,
          value: $(this).val()
        });
        syncMediaFileNamesByCourse(false);
        renderPreview();
      });

    $('#startTime, #endTime, #courseLocation').on('input change', function () {
      logInfo('課程時間或地點欄位已變更', {
        id: this.id,
        value: $(this).val()
      });
      renderPreview();
    });

    $('#videoUrl').on('input change', function () {
      logInfo('課程影片檔名已變更', ($(this).val() || '').trim());
      renderPreview();
    });

    $('#audioMode').on('change', function () {
      logInfo('錄音模式已切換', getModeValue('#audioMode'));
      applyUrlMode('#audioMode', '#audioUrl');
    });

    $('#materialMode').on('change', function () {
      logInfo('教材模式已切換', getModeValue('#materialMode'));
      applyUrlMode('#materialMode', '#materialUrl');
    });

    $('#audioUrl').on('input change', function () {
      logInfo('錄音檔名欄位已輸入', {
        id: this.id,
        value: $(this).val()
      });
      renderPreview();
    });

    $('#materialUrl').on('input change', function () {
      logInfo('教材檔名欄位已輸入', {
        id: this.id,
        value: $(this).val()
      });
      renderPreview();
    });

    $('#buttonReset').on('click', function () {
      logInfo('使用者點了重設按鈕');
      resetForm();
    });

    $('#courseForm').on('submit', function (e) {
      e.preventDefault();
      logInfo('使用者送出表單');

      syncMediaFileNamesByCourse(false);

      var course = readFormCourse(true);
      var error = validateCourse(course);

      if (error) {
        logWarn('表單驗證未通過', { error: error, course: course });
        alert(error);
        return;
      }

      upsertCourse(course);
      buildClassOptionsFromCourses();
      renderList();
      resetForm();

      logInfo('課程資料已儲存完成', course);
      alert('已儲存');
    });

    $('#courseTable').on('click', '.js-edit', function () {
      var id = $(this).data('id');
      logInfo('使用者點了編輯', id);

      var found = courses.find(function (c) { return c.id === id; });
      if (!found) {
        logWarn('編輯失敗：找不到課程資料', id);
        return;
      }

      writeFormCourse(found);
      syncMediaFileNamesByCourse(false);
      renderPreview();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      logInfo('已載入課程資料到表單', found);
    });

    $('#courseTable').on('click', '.js-delete', function () {
      var id = $(this).data('id');
      logInfo('使用者點了刪除', id);

      if (!confirm('確定要刪除這筆資料？')) {
        logInfo('使用者取消刪除');
        return;
      }

      deleteCourse(id);
      buildClassOptionsFromCourses();
      renderList();

      if (($('#courseId').val() || '').trim() === id) {
        logInfo('目前表單正好是被刪除的資料，準備重設表單');
        resetForm();
      }
    });

    logInfo('畫面事件綁定完成');
  }

  $(function () {
    logInfo('頁面初始化開始', {
      dataUrl: window.AppConfig.dataUrl,
      dataBase: window.AppConfig.paths.dataBase,
      imageBase: window.AppConfig.paths.imageBase
    });

    bindEvents();
    loadCoursesFromJson(function () {
      logInfo('課程資料載入流程完成，準備重設表單');
      resetForm();
      logInfo('頁面初始化完成');
    });
  });
})();
