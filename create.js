// create.js
(function () {
  'use strict';

  var dataUrl = './courses.json';
  var videoBasePath = './video/';
  var videoExtension = '.mp4';

  var courses = [];
  var lastAutoVideoUrl = '';

  // ✅ 這次固定使用這個 picsum
  var defaultPicsumUrl = 'https://picsum.photos/300/200';

  function cryptoRandomId() {
    try {
      if (window.crypto && crypto.getRandomValues) {
        var bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.prototype.map.call(bytes, function (b) {
          return ('00' + b.toString(16)).slice(-2);
        }).join('');
      }
    } catch (e) { /* ignore */ }

    return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
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
    return String(val) === '1';
  }

  function setRadioBool(name, value) {
    var v = value === true ? '1' : '0';
    $('input[name="' + name + '"][value="' + v + '"]').prop('checked', true);
  }

  function getClassNameValue() {
    var selected = ($('#classNameSelect').val() || '').trim();
    if (selected === '其他') return ($('#classNameOther').val() || '').trim();
    return selected;
  }

  function setClassNameValue(value) {
    value = (value || '').trim();
    var options = $('#classNameSelect option').map(function () { return $(this).val(); }).get();

    if (options.indexOf(value) >= 0 && value !== '其他') {
      $('#classNameSelect').val(value);
      $('#classNameOtherWrap').addClass('d-none');
      $('#classNameOther').val('');
    } else if (value) {
      $('#classNameSelect').val('其他');
      $('#classNameOtherWrap').removeClass('d-none');
      $('#classNameOther').val(value);
    } else {
      $('#classNameSelect').val('');
      $('#classNameOtherWrap').addClass('d-none');
      $('#classNameOther').val('');
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
  }

  function buildFileName(course) {
    var date = (course.courseDate || '').trim();
    var area = (course.areaName || '').trim();
    var className = (course.className || '').trim();
    var subClassName = (course.subClassName || '').trim();
    var title = (course.courseTitle || '').trim();
    var instructor = ((course.instructorName || '') + (course.instructorTitle || '')).trim();

    var areaClass = (area + className).trim();
    var parts = [];

    if (date) parts.push(date);
    if (areaClass) parts.push(areaClass);
    if (subClassName) parts.push(subClassName);
    if (title) parts.push(title);
    if (instructor) parts.push(instructor);

    return parts.join('-');
  }

  function syncVideoUrlByFileName(force) {
    var course = readFormCourse(false); // 這裡不要因圖片自動生成而影響判斷
    var fileName = buildFileName(course);
    if (!fileName) return;

    var nextAuto = videoBasePath + fileName + videoExtension;
    var current = ($('#videoUrl').val() || '').trim();

    if (force || !current || current === lastAutoVideoUrl) {
      $('#videoUrl').val(nextAuto);
      lastAutoVideoUrl = nextAuto;
    }
  }

  function applyUrlMode(modeSelectId, inputId) {
    var mode = ($(modeSelectId).val() || '').trim();
    if (mode === 'url') $(inputId).removeClass('d-none');
    else $(inputId).addClass('d-none').val('');
    renderPreview();
  }

  // ✅ 圖片 URL 規則：
  // - 自動生成：picsum 300/200
  // - 圖片1：./assets/山1.jpg
  // - 自訂 URL：有值用自訂；無值也用 picsum 300/200
  function getResolvedImageUrl() {
    var sel = ($('#imageSelect').val() || '').trim();

    if (sel === 'custom') {
      var custom = ($('#imageUrl').val() || '').trim();
      return custom ? custom : defaultPicsumUrl;
    }

    if (sel === 'auto' || !sel) return defaultPicsumUrl;
    return sel; // 例如 ./assets/山1.jpg
  }

  // allowAutoImage=true：把圖片依規則補滿（用於儲存/預覽）
  // allowAutoImage=false：不強制補滿（用於影片檔名判斷時避免隨時間變動）
  function readFormCourse(allowAutoImage) {
    var imageUrl = '';
    if (allowAutoImage !== false) imageUrl = getResolvedImageUrl();

    return {
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

      videoUrl: ($('#videoUrl').val() || '').trim(),
      audioUrl: ($('#audioUrl').val() || '').trim(),
      materialUrl: ($('#materialUrl').val() || '').trim(),

      isPinned: getRadioBool('isPinned'),
      isVisible: getRadioBool('isVisible')
    };
  }

  function writeFormCourse(course) {
    $('#courseId').val(course.id || '');

    var imageUrl = (course.imageUrl || '').trim();
    var $imageSelect = $('#imageSelect');
    var options = $imageSelect.find('option').map(function () { return $(this).val(); }).get();

    if (!imageUrl || imageUrl === defaultPicsumUrl) {
      $imageSelect.val('auto');
      $('#imageUrl').addClass('d-none').val('');
    } else if (options.indexOf(imageUrl) >= 0) {
      $imageSelect.val(imageUrl);
      $('#imageUrl').addClass('d-none').val('');
    } else {
      $imageSelect.val('custom');
      $('#imageUrl').removeClass('d-none').val(imageUrl);
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

    if ((course.audioUrl || '').trim()) {
      $('#audioMode').val('url');
      $('#audioUrl').removeClass('d-none').val(course.audioUrl || '');
    } else {
      $('#audioMode').val('none');
      $('#audioUrl').addClass('d-none').val('');
    }

    if ((course.materialUrl || '').trim()) {
      $('#materialMode').val('url');
      $('#materialUrl').removeClass('d-none').val(course.materialUrl || '');
    } else {
      $('#materialMode').val('none');
      $('#materialUrl').addClass('d-none').val('');
    }

    $('#videoUrl').val(course.videoUrl || '');
    lastAutoVideoUrl = (course.videoUrl || '').trim();

    setRadioBool('isPinned', course.isPinned === true);
    setRadioBool('isVisible', course.isVisible !== false);
  }

  function resetForm() {
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

    lastAutoVideoUrl = '';
    renderPreview();
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

    var previewCourse = course;
    if (window.BadgeService) {
      previewCourse = window.BadgeService.applyBadges([course], { latestDays: 30 })[0];
    }

    var cardHtml = window.CardRenderer.renderCourseCard(previewCourse);
    $('#previewCard').html(cardHtml);
  }

  function destroyDataTableIfNeeded() {
    if ($.fn.DataTable && $.fn.DataTable.isDataTable('#courseTable')) {
      $('#courseTable').DataTable().destroy();
    }
  }

  function initDataTable() {
    if (!$.fn.DataTable) return;

    $('#courseTable').DataTable({
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      responsive: true,
      order: [[0, 'desc'], [1, 'desc']], // ✅ 日期 desc，再時間 desc
      columnDefs: [
        { targets: 0, responsivePriority: 2 }, // 日期
        { targets: 1, responsivePriority: 3 }, // 時間
        { targets: 2, responsivePriority: 5 }, // 班期名稱
        { targets: 3, responsivePriority: 4 }, // 課程名稱
        { targets: 4, responsivePriority: 6 }, // 主講人
        { targets: 5, responsivePriority: 7 }, // 課程地點（顯示）
        { targets: 6, responsivePriority: 1 }, // 操作（顯示）
        { targets: 7, responsivePriority: 8 },  // 置頂
        { targets: 8, responsivePriority: 9 },  // 生成卡片
        { targets: 9, responsivePriority: 10 },  // 影片URL
        { targets: 10, responsivePriority: 11 }, // 錄音URL
        { targets: 11, responsivePriority: 12 }, // 檔案URL
        { targets: 12, responsivePriority: 13 }  // 圖片URL
      ]
    });
  }

  function sortCoursesForTable(list) {
    return list.slice().sort(function (a, b) {
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

      // ✅ 對應 DataTables 兩欄：日期、時間
      var dateText = ymd || '';
      var timeText = (st && et) ? (st + '-' + et) : (st || '');

      // ✅ 讓 DataTables 排序更準：日期欄用 YYYYMMDD，時間欄用 HHMM
      var dateOrder = toYmdNumber(ymd);
      var timeOrder = toHmNumber(st);

      var classDisplay = ((c.areaName || '') + (c.className || '')).trim();
      var sub = (c.subClassName || '').trim();
      var classText = classDisplay + (sub ? (' / ' + sub) : '');

      var instructorDisplay = ((c.instructorName || '') + (c.instructorTitle || '')).trim();

      // ✅ 這裡一定要輸出 13 個 <td>，跟 <thead> 完全對齊
      var rowHtml =
        '<tr>' +
          // 0 日期
          '<td data-order="' + escapeHtml(dateOrder == null ? '' : String(dateOrder)) + '">' + escapeHtml(dateText) + '</td>' +
          // 1 時間
          '<td data-order="' + escapeHtml(timeOrder == null ? '' : String(timeOrder)) + '">' + escapeHtml(timeText) + '</td>' +
          // 2 班期名稱
          '<td>' + escapeHtml(classText) + '</td>' +
          // 3 課程名稱
          '<td>' + escapeHtml(c.courseTitle || '') + '</td>' +
          // 4 主講人
          '<td>' + escapeHtml(instructorDisplay) + '</td>' +
          // 5 課程地點
          '<td>' + escapeHtml(c.courseLocation || '') + '</td>' +
          // 6 操作
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
          // 7 置頂
          '<td>' + (c.isPinned === true ? '是' : '否') + '</td>' +
          // 8 生成卡片
          '<td>' + (c.isVisible === false ? '否' : '是') + '</td>' +
          // 9 影片URL
          '<td>' + escapeHtml(c.videoUrl || '') + '</td>' +
          // 10 錄音URL
          '<td>' + escapeHtml(c.audioUrl || '') + '</td>' +
          // 11 檔案URL
          '<td>' + escapeHtml(c.materialUrl || '') + '</td>' +
          // 12 圖片URL
          '<td>' + escapeHtml(c.imageUrl || '') + '</td>' +
        '</tr>';

      $tbody.append(rowHtml);
    });

    destroyDataTableIfNeeded();
    if (courses.length > 0) initDataTable();
  }

  function upsertCourse(course) {
    if (!course.id) {
      course.id = cryptoRandomId();
      courses.unshift(course);
      return;
    }

    var idx = courses.findIndex(function (x) { return x.id === course.id; });
    if (idx >= 0) courses[idx] = course;
    else courses.unshift(course);
  }

  function deleteCourse(id) {
    courses = courses.filter(function (c) { return c.id !== id; });
  }

  function loadCoursesFromJson(done) {
    $.getJSON(dataUrl)
      .done(function (data) {
        courses = Array.isArray(data) ? data.slice() : [];
        buildClassOptionsFromCourses();
        renderList();
        done();
      })
      .fail(function () {
        courses = [];
        buildClassOptionsFromCourses();
        renderList();
        done();
      });
  }

  function bindEvents() {
    $('#imageSelect').on('change', function () {
      var v = ($('#imageSelect').val() || '').trim();
      if (v === 'custom') $('#imageUrl').removeClass('d-none');
      else $('#imageUrl').addClass('d-none').val('');
      renderPreview();
    });
    $('#imageUrl').on('input', renderPreview);

    $('#classNameSelect').on('change', function () {
      var val = ($('#classNameSelect').val() || '').trim();
      if (val === '其他') $('#classNameOtherWrap').removeClass('d-none');
      else $('#classNameOtherWrap').addClass('d-none');

      syncVideoUrlByFileName(false);
      renderPreview();
    });

    $('#classNameOther').on('input', function () {
      syncVideoUrlByFileName(false);
      renderPreview();
    });

    $('input[name="isPinned"], input[name="isVisible"]').on('change', renderPreview);

    $('#courseDate, #areaName, #subClassName, #courseTitle, #instructorName, #instructorTitle')
      .on('input change', function () {
        syncVideoUrlByFileName(false);
        renderPreview();
      });

    $('#startTime, #endTime, #courseLocation, #videoUrl').on('input change', renderPreview);

    $('#audioMode').on('change', function () { applyUrlMode('#audioMode', '#audioUrl'); });
    $('#materialMode').on('change', function () { applyUrlMode('#materialMode', '#materialUrl'); });

    $('#audioUrl, #materialUrl').on('input', renderPreview);

    $('#buttonReset').on('click', resetForm);

    $('#courseForm').on('submit', function (e) {
      e.preventDefault();

      syncVideoUrlByFileName(false);

      var course = readFormCourse(true);
      course.videoUrl = ($('#videoUrl').val() || '').trim();

      var error = validateCourse(course);
      if (error) {
        alert(error);
        return;
      }

      upsertCourse(course);

      buildClassOptionsFromCourses();
      renderList();
      resetForm();

      alert('已儲存');
    });

    $('#courseTable').on('click', '.js-edit', function () {
      var id = $(this).data('id');
      var found = courses.find(function (c) { return c.id === id; });
      if (!found) return;

      writeFormCourse(found);
      syncVideoUrlByFileName(false);
      renderPreview();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('#courseTable').on('click', '.js-delete', function () {
      var id = $(this).data('id');
      if (!confirm('確定要刪除這筆資料？')) return;

      deleteCourse(id);
      buildClassOptionsFromCourses();
      renderList();

      if (($('#courseId').val() || '').trim() === id) resetForm();
    });
  }

  $(function () {
    bindEvents();
    loadCoursesFromJson(function () {
      resetForm();
    });
  });
})();
