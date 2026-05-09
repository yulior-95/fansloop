/**
 * 预约直播（原型）：每位创作者同时仅保留 1 条预约；
 * 超过预约时间 30 分钟后由本地逻辑自动清除。
 */
(function (global) {
  var LS_KEY = 'fl_live_reservation';
  var LEGACY_LIST_KEY = 'fl_live_reservations';
  var GRACE_MS = 30 * 60 * 1000;
  var URGENT_BEFORE_MS = 20 * 60 * 1000;

  function migrateLegacy() {
    try {
      var existing = localStorage.getItem(LS_KEY);
      if (existing) return;
      var raw = localStorage.getItem(LEGACY_LIST_KEY);
      if (!raw) return;
      var arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length && arr[0]) {
        localStorage.setItem(LS_KEY, JSON.stringify(arr[0]));
      }
      localStorage.removeItem(LEGACY_LIST_KEY);
    } catch (e) {}
  }

  function parseScheduledAt(item) {
    if (!item || typeof item.scheduledAt !== 'number' || isNaN(item.scheduledAt)) return null;
    return item.scheduledAt;
  }

  global.flLiveReservationGet = function () {
    migrateLegacy();
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      var item = JSON.parse(raw);
      var t = parseScheduledAt(item);
      if (t == null) {
        localStorage.removeItem(LS_KEY);
        return null;
      }
      var now = Date.now();
      if (now > t + GRACE_MS) {
        localStorage.removeItem(LS_KEY);
        try {
          sessionStorage.setItem('fl_live_auto_closed_notice', '1');
        } catch (e) {}
        return null;
      }
      return item;
    } catch (e) {
      return null;
    }
  };

  global.flLiveReservationSet = function (payload) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
      localStorage.removeItem(LEGACY_LIST_KEY);
    } catch (e) {}
  };

  global.flLiveReservationClear = function () {
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LEGACY_LIST_KEY);
    } catch (e) {}
  };

  global.flLiveReservationHasActive = function () {
    return !!global.flLiveReservationGet();
  };

  /** 开播前 20 分钟内（未到预约时刻） */
  global.flLiveReservationIsUrgentBeforeStart = function (item) {
    if (!item) return false;
    var t = parseScheduledAt(item);
    if (t == null) return false;
    var now = Date.now();
    return now >= t - URGENT_BEFORE_MS && now < t;
  };

  global.flLiveReservationFormatTime = function (ms) {
    if (ms == null || isNaN(ms)) return '';
    var d = new Date(ms);
    function p(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  };

  global.flLiveReservationConsumeAutoClosedNotice = function () {
    try {
      if (sessionStorage.getItem('fl_live_auto_closed_notice') === '1') {
        sessionStorage.removeItem('fl_live_auto_closed_notice');
        return true;
      }
    } catch (e) {}
    return false;
  };
})(typeof window !== 'undefined' ? window : this);
