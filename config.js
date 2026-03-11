// config.js
(function (global) {
  'use strict';

  var AppConfig = {
    isDebugMode: true,

    dataUrl: './courses.json',

    paths: {
      dataBase: './assets/data/',
      imageBase: './assets/image/',
      placeholderImage: './assets/placeholder-16x9.png'
    },

    assetExtensions: {
      video: '.mp4',
      audio: '.mp3',
      material: '.pdf'
    },

    defaultImageUrl: 'https://picsum.photos/300/200'
  };

  function log(step, data) {
    if (!AppConfig.isDebugMode) return;

    if (data !== undefined) {
      console.log('[config.js] ' + step, data);
    } else {
      console.log('[config.js] ' + step);
    }
  }

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function isAbsoluteOrSpecialUrl(url) {
    var value = normalizeText(url);
    return /^(https?:)?\/\//i.test(value) ||
      value.indexOf('./') === 0 ||
      value.indexOf('../') === 0 ||
      value.indexOf('/') === 0 ||
      value.indexOf('data:') === 0 ||
      value.indexOf('blob:') === 0;
  }

  function joinPath() {
    var parts = Array.prototype.slice.call(arguments);
    var cleaned = [];

    parts.forEach(function (part, index) {
      var value = String(part || '').trim();
      if (!value) return;

      if (index === 0) {
        value = value.replace(/\/+$/, '');
      } else {
        value = value.replace(/^\/+/, '').replace(/\/+$/, '');
      }

      cleaned.push(value);
    });

    return cleaned.join('/');
  }

  function sanitizePathPart(text) {
    return normalizeText(text)
      .replace(/[\\:*?"<>|]/g, '')
      .replace(/\//g, '')
      .replace(/\s+/g, '');
  }

  function getAreaClassName(course) {
    var areaName = sanitizePathPart(course && course.areaName);
    var className = sanitizePathPart(course && course.className);
    return areaName + className;
  }

  function getClassFolderName(course) {
    var areaClassName = getAreaClassName(course);
    var subClassName = sanitizePathPart(course && course.subClassName);
    return areaClassName + subClassName;
  }

  function getCourseFolderPath(course) {
    var classFolderName = getClassFolderName(course);
    var courseDate = sanitizePathPart(course && course.courseDate);
    var courseTitle = sanitizePathPart(course && course.courseTitle);

    if (!classFolderName || !courseDate || !courseTitle) {
      return '';
    }

    return joinPath(AppConfig.paths.dataBase, classFolderName, courseDate, courseTitle) + '/';
  }

  function buildBaseFileName(course) {
    var courseDate = sanitizePathPart(course && course.courseDate);
    var areaClassName = getAreaClassName(course);
    var subClassName = sanitizePathPart(course && course.subClassName);
    var courseTitle = sanitizePathPart(course && course.courseTitle);
    var instructorName = sanitizePathPart(course && course.instructorName);
    var instructorTitle = sanitizePathPart(course && course.instructorTitle);
    var instructorDisplay = instructorName + instructorTitle;

    var parts = [];

    if (courseDate) parts.push(courseDate);
    if (areaClassName) parts.push(areaClassName);
    if (subClassName) parts.push(subClassName);
    if (courseTitle) parts.push(courseTitle);
    if (instructorDisplay) parts.push(instructorDisplay);

    return parts.join('-');
  }

  function getDisplayOnlyFileName(value) {
    var text = normalizeText(value);
    if (!text) return '';

    if (isAbsoluteOrSpecialUrl(text)) {
      var lastSlash = text.lastIndexOf('/');
      return lastSlash >= 0 ? text.substring(lastSlash + 1) : text;
    }

    return text;
  }

  function getFileExtension(value) {
    var fileName = getDisplayOnlyFileName(value);
    if (!fileName) return '';

    var lastDot = fileName.lastIndexOf('.');
    if (lastDot <= 0 || lastDot === fileName.length - 1) return '';

    return fileName.substring(lastDot).toLowerCase();
  }

  function removeFileExtension(value) {
    var fileName = getDisplayOnlyFileName(value);
    if (!fileName) return '';

    var lastDot = fileName.lastIndexOf('.');
    if (lastDot <= 0) return fileName;

    return fileName.substring(0, lastDot);
  }

  function getPreferredExtension(assetType, currentValue) {
    var currentExtension = getFileExtension(currentValue);
    if (currentExtension) return currentExtension;

    return AppConfig.assetExtensions[assetType] || '';
  }

  function buildAssetFileName(course, assetType, currentValue) {
    var extension = getPreferredExtension(assetType, currentValue);
    var baseFileName = buildBaseFileName(course);

    if (!baseFileName) return '';
    return baseFileName + extension;
  }

  function resolveCourseAssetUrl(assetType, value, course) {
    var raw = normalizeText(value);
    if (!raw) return '';

    if (isAbsoluteOrSpecialUrl(raw)) {
      return raw;
    }

    var fileName = getDisplayOnlyFileName(raw);
    var folderPath = getCourseFolderPath(course);

    if (!folderPath) {
      return fileName;
    }

    return joinPath(folderPath, fileName);
  }

  function resolveImageUrl(value) {
    var raw = normalizeText(value);
    if (!raw) return '';

    if (isAbsoluteOrSpecialUrl(raw)) {
      return raw;
    }

    return joinPath(AppConfig.paths.imageBase, raw);
  }

  AppConfig.log = log;
  AppConfig.normalizeText = normalizeText;
  AppConfig.isAbsoluteOrSpecialUrl = isAbsoluteOrSpecialUrl;
  AppConfig.joinPath = joinPath;
  AppConfig.sanitizePathPart = sanitizePathPart;
  AppConfig.getAreaClassName = getAreaClassName;
  AppConfig.getClassFolderName = getClassFolderName;
  AppConfig.getCourseFolderPath = getCourseFolderPath;
  AppConfig.buildBaseFileName = buildBaseFileName;
  AppConfig.getDisplayOnlyFileName = getDisplayOnlyFileName;
  AppConfig.getFileExtension = getFileExtension;
  AppConfig.removeFileExtension = removeFileExtension;
  AppConfig.getPreferredExtension = getPreferredExtension;
  AppConfig.buildAssetFileName = buildAssetFileName;
  AppConfig.resolveCourseAssetUrl = resolveCourseAssetUrl;
  AppConfig.resolveImageUrl = resolveImageUrl;

  global.AppConfig = AppConfig;
})(window);
