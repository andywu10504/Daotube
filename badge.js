// badge.js
// 共用徽章處理：置頂、最新(距今日 30 天內)
(function (global) {
  'use strict';

  function toYmdNumber(ymd) {
    if (!ymd) return null;
    var m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return parseInt(m[1] + m[2] + m[3], 10);
  }

  function daysDiffFromToday(courseDateYmd, today) {
    var ymd = String(courseDateYmd || '').trim();
    if (!ymd) return null;

    // 只取日期，不處理時區偏移，避免在 +08:00 近午夜出現誤差
    var n = toYmdNumber(ymd);
    if (n === null) return null;

    var yyyy = Math.floor(n / 10000);
    var mm = Math.floor((n % 10000) / 100) - 1;
    var dd = n % 100;

    var d = new Date(yyyy, mm, dd);
    var t = today || new Date();

    var todayDateOnly = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    var diffMs = todayDateOnly.getTime() - d.getTime();

    return Math.floor(diffMs / (24 * 60 * 60 * 1000));
  }

  function applyBadges(courses, options) {
    options = options || {};
    var today = options.today || new Date();
    var latestDays = typeof options.latestDays === 'number' ? options.latestDays : 30;

    return (courses || []).map(function (c) {
      var clone = Object.assign({}, c);
      clone.badges = Array.isArray(clone.badges) ? clone.badges.slice() : [];

      // 置頂徽章
      if (clone.isPinned === true) {
        if (!clone.badges.some(function (b) { return b && b.text === '置頂'; })) {
          clone.badges.push({
            text: '置頂',
            className: 'text-bg-primary',
            iconClass: 'fa-solid fa-thumbtack'
          });
        }
      }

      // 最新徽章：距今天 0~latestDays 天
      var diffDays = daysDiffFromToday(clone.courseDate, today);
      if (diffDays !== null && diffDays >= 0 && diffDays <= latestDays) {
        if (!clone.badges.some(function (b) { return b && b.text === '最新'; })) {
          clone.badges.push({
            text: '最新',
            className: 'text-bg-warning',
            iconClass: 'fa-solid fa-bolt'
          });
        }
      }

      return clone;
    });
  }

  global.BadgeService = {
    applyBadges: applyBadges
  };
})(window);
