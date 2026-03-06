// index.js
(function () {
  'use strict';

  var dataUrl = './courses.json';

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

  function normalizeCourse(raw) {
    var course = raw && typeof raw === 'object' ? raw : {};

    return {
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
      videoUrl: course.videoUrl || '',
      audioUrl: course.audioUrl || '',
      materialUrl: course.materialUrl || '',
      isPinned: course.isPinned === true,
      isVisible: normalizeVisibilityValue(course)
    };
  }

  function normalizeCourses(list) {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeCourse);
  }

  function sortByPinnedDateTimeDesc(courses) {
    return courses.slice().sort(function (a, b) {
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

  function buildClassOptions(courses) {
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
  }

  function applyFilters(allCourses) {
    var searchText = ($('#searchText').val() || '').trim();
    var className = $('#classFilter').val() || '';

    var fromYmd = toYmdNumber($('#dateFrom').val());
    var toYmd = toYmdNumber($('#dateTo').val());

    var filtered = allCourses.filter(function (c) {
      return matchesSearch(c, searchText) &&
        matchesClass(c, className) &&
        matchesDateRange(c, fromYmd, toYmd);
    });

    $('#resultInfo').text('顯示 ' + filtered.length + ' / ' + allCourses.length + ' 筆');
    $('#emptyState').toggleClass('d-none', filtered.length !== 0);

    renderCards(filtered);
  }

  function bindEvents(getAllCourses) {
    $('#searchText').on('input', function () {
      applyFilters(getAllCourses());
    });

    $('#classFilter, #dateFrom, #dateTo').on('change', function () {
      applyFilters(getAllCourses());
    });

    $('#buttonClear').on('click', function () {
      $('#searchText').val('');
      $('#classFilter').val('');
      $('#dateFrom').val('');
      $('#dateTo').val('');
      applyFilters(getAllCourses());
    });
  }

  function loadCoursesFromJson(onSuccess, onError) {
    $.getJSON(dataUrl)
      .done(function (data) {
        if (!Array.isArray(data)) {
          onError('courses.json 格式不是陣列');
          return;
        }
        onSuccess(normalizeCourses(data));
      })
      .fail(function () {
        onError('無法讀取 courses.json（請確認用 HTTP 伺服器開啟，且路徑正確）');
      });
  }

  $(function () {
    loadCoursesFromJson(function (rawCourses) {
      var visibleCourses = rawCourses.filter(function (c) {
        return c.isVisible !== false;
      });

      var sorted = sortByPinnedDateTimeDesc(visibleCourses);

      var withBadges = window.BadgeService
        ? window.BadgeService.applyBadges(sorted, { latestDays: 30 })
        : sorted;

      function getAllCourses() {
        return withBadges;
      }

      buildClassOptions(withBadges);
      bindEvents(getAllCourses);
      applyFilters(withBadges);
    }, function (message) {
      $('#resultInfo').text(message);
      $('#emptyState').removeClass('d-none');
    });
  });
})();
