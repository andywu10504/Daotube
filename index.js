// index.js
(function () {
  'use strict';

  function log(step, data) {
    if (!window.AppConfig || !window.AppConfig.isDebugMode) return;

    if (data !== undefined) {
      console.log('[index.js] ' + step, data);
    } else {
      console.log('[index.js] ' + step);
    }
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

  function normalizeVisibilityValue(course) {
    if (!course || typeof course !== 'object') return true;

    if (typeof course.isVisible === 'boolean') return course.isVisible;
    if (typeof course.isPublished === 'boolean') return course.isPublished;

    return true;
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

  function escapeAttr(text) {
    return escapeHtml(text).replace(/`/g, '&#096;');
  }

  function normalizeCourse(raw) {
    var course = raw && typeof raw === 'object' ? raw : {};

    var normalized = {
      id: course.id || '',
      imageUrl: course.imageUrl || '',
      courseTitle: course.courseTitle || '',
      className: course.className || '',
      subClassName: course.subClassName || '',
      areaName: course.areaName || '',
      courseDate: course.courseDate || '',
      startTime: course.startTime || '',
      endTime: course.endTime || '',
      courseLocation: course.courseLocation || '',
      instructorName: course.instructorName || '',
      instructorTitle: course.instructorTitle || '',
      videoUrl: window.AppConfig.getDisplayOnlyFileName(course.videoUrl || ''),
      audioUrl: window.AppConfig.getDisplayOnlyFileName(course.audioUrl || ''),
      materialUrl: window.AppConfig.getDisplayOnlyFileName(course.materialUrl || ''),
      isPinned: course.isPinned === true,
      isVisible: normalizeVisibilityValue(course)
    };

    normalized.imageUrl = normalized.imageUrl
      ? window.AppConfig.resolveImageUrl(normalized.imageUrl)
      : '';

    normalized.videoUrl = normalized.videoUrl
      ? window.AppConfig.resolveCourseAssetUrl('video', normalized.videoUrl, normalized)
      : '';

    normalized.audioUrl = normalized.audioUrl
      ? window.AppConfig.resolveCourseAssetUrl('audio', normalized.audioUrl, normalized)
      : '';

    normalized.materialUrl = normalized.materialUrl
      ? window.AppConfig.resolveCourseAssetUrl('material', normalized.materialUrl, normalized)
      : '';

    return normalized;
  }

  function normalizeCourses(list) {
    if (!Array.isArray(list)) return [];
    log('開始整理課程資料');

    var result = list.map(normalizeCourse);

    log('課程資料整理完成，筆數：' + result.length);
    return result;
  }

  function sortByPinnedDateTimeDesc(courses) {
    log('開始排序課程（置頂 → 日期 → 時間）');

    var sorted = courses.slice().sort(function (a, b) {
      var ap = a && a.isPinned === true ? 1 : 0;
      var bp = b && b.isPinned === true ? 1 : 0;
      if (bp !== ap) return bp - ap;

      var ad = toYmdNumber(a.courseDate) || -1;
      var bd = toYmdNumber(b.courseDate) || -1;
      if (bd !== ad) return bd - ad;

      var ast = toHmNumber(a.startTime) || -1;
      var bst = toHmNumber(b.startTime) || -1;
      if (bst !== ast) return bst - ast;

      var aet = toHmNumber(a.endTime) || -1;
      var bet = toHmNumber(b.endTime) || -1;
      if (bet !== aet) return bet - aet;

      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    log('課程排序完成');
    return sorted;
  }

  function buildClassOptions(courses) {
    log('建立班期篩選選單');

    var classSet = {};
    courses.forEach(function (c) {
      var key = (c.className || '').trim();
      if (key) classSet[key] = true;
    });

    var classList = Object.keys(classSet).sort();

    var $select = $('#classFilter');
    $select.empty().append('<option value="">全部班期</option>');

    classList.forEach(function (name) {
      $select.append('<option value="' + escapeAttr(name) + '">' + escapeHtml(name) + '</option>');
    });

    log('班期選單建立完成，共 ' + classList.length + ' 個班期');
  }

  function matchesSearch(course, searchText) {
    if (!searchText) return true;

    var t = searchText.toLowerCase();

    var instructorDisplay = ((course.instructorName || '') + (course.instructorTitle || '')).trim();
    var classDisplay = ((course.areaName || '') + (course.className || '')).trim();
    var sub = (course.subClassName || '').trim();
    var fullClass = classDisplay + (sub ? (' ' + sub) : '');

    var fields = [
      course.courseTitle,
      course.className,
      course.areaName,
      course.subClassName,
      fullClass,
      course.courseLocation,
      course.instructorName,
      course.instructorTitle,
      instructorDisplay,
      course.courseDate,
      course.startTime,
      course.endTime
    ];

    return fields.some(function (v) {
      return (v || '').toLowerCase().indexOf(t) >= 0;
    });
  }

  function matchesClass(course, className) {
    if (!className) return true;
    return (course.className || '') === className;
  }

  function matchesDateRange(course, fromYmd, toYmd) {
    if (!fromYmd && !toYmd) return true;

    var cYmd = toYmdNumber(course.courseDate);
    if (!cYmd) return false;

    if (fromYmd && cYmd < fromYmd) return false;
    if (toYmd && cYmd > toYmd) return false;

    return true;
  }

  function renderCards(courses) {
    log('開始渲染課程卡片，筆數：' + courses.length);

    var $row = $('#cardsRow');
    $row.empty();

    courses.forEach(function (course) {
      var cardHtml = window.CardRenderer.renderCourseCard(course);

      var colHtml =
        '<div class="col-12 col-sm-6 col-lg-3">' +
          cardHtml +
        '</div>';

      $row.append(colHtml);
    });

    log('課程卡片渲染完成');
  }

  function applyFilters(allCourses) {
    log('開始套用篩選條件');

    var searchText = ($('#searchText').val() || '').trim();
    var className = $('#classFilter').val() || '';

    var fromYmd = toYmdNumber($('#dateFrom').val());
    var toYmd = toYmdNumber($('#dateTo').val());

    var filtered = allCourses.filter(function (c) {
      return matchesSearch(c, searchText) &&
        matchesClass(c, className) &&
        matchesDateRange(c, fromYmd, toYmd);
    });

    log('篩選完成，結果筆數：' + filtered.length);

    $('#resultInfo').text('顯示 ' + filtered.length + ' / ' + allCourses.length + ' 筆');
    $('#emptyState').toggleClass('d-none', filtered.length !== 0);

    renderCards(filtered);
  }

  function bindEvents(getAllCourses) {
    log('綁定搜尋與篩選事件');

    $('#searchText').on('input', function () {
      log('搜尋文字變更');
      applyFilters(getAllCourses());
    });

    $('#classFilter, #dateFrom, #dateTo').on('change', function () {
      log('篩選條件變更');
      applyFilters(getAllCourses());
    });

    $('#buttonClear').on('click', function () {
      log('清除篩選條件');

      $('#searchText').val('');
      $('#classFilter').val('');
      $('#dateFrom').val('');
      $('#dateTo').val('');

      applyFilters(getAllCourses());
    });
  }

  function loadCoursesFromJson(onSuccess, onError) {
    log('開始載入 courses.json');

    $.getJSON(window.AppConfig.dataUrl)
      .done(function (data) {
        log('courses.json 讀取成功');

        if (!Array.isArray(data)) {
          onError('courses.json 格式不是陣列');
          return;
        }

        onSuccess(normalizeCourses(data));
      })
      .fail(function () {
        log('courses.json 讀取失敗');
        onError('無法讀取 courses.json（請確認用 HTTP 伺服器開啟，且路徑正確）');
      });
  }

  $(function () {
    log('頁面初始化開始');
    log('目前共用設定', {
      dataUrl: window.AppConfig.dataUrl,
      dataBase: window.AppConfig.paths.dataBase,
      imageBase: window.AppConfig.paths.imageBase
    });

    loadCoursesFromJson(function (rawCourses) {
      log('原始課程筆數：' + rawCourses.length);

      var visibleCourses = rawCourses.filter(function (c) {
        return c.isVisible !== false;
      });

      log('可顯示課程筆數：' + visibleCourses.length);

      var sorted = sortByPinnedDateTimeDesc(visibleCourses);

      var withBadges = window.BadgeService
        ? window.BadgeService.applyBadges(sorted, { latestDays: 30 })
        : sorted;

      log('Badge 處理完成');

      function getAllCourses() {
        return withBadges;
      }

      buildClassOptions(withBadges);
      bindEvents(getAllCourses);
      applyFilters(withBadges);

      log('頁面初始化完成');
    }, function (message) {
      log('初始化失敗：' + message);

      $('#resultInfo').text(message);
      $('#emptyState').removeClass('d-none');
    });
  });
})();
